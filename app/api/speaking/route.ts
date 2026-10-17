import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { auth } from '@/auth'
import { getDb } from '@/src/db'
import { checkRateLimit } from '@/src/lib/rateLimit'
import { systemConfigs, speakingSessions, speakingPrompts, speakingChats, apiUsages, users } from '@/src/db/schema'
import { eq, sql, and, desc } from 'drizzle-orm'
import { getPromptsForPart, SpeakingPart, SpeakingPrompt } from '@/src/data/speakingPrompts'

// ─── Groq Config ─────────────────────────────────────────────────────────────

async function getGroqKeys(): Promise<string[]> {
  let keys = process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.split(',').map(k => k.trim()).filter(Boolean) : []
  try {
    const db = await getDb()
    const configs = await db.select().from(systemConfigs)
    const map = configs.reduce((acc, c) => ({ ...acc, [c.key]: c.value }), {} as Record<string, string>)
    if (map['GROQ_API_KEY']) {
      keys = map['GROQ_API_KEY'].split(',').map(k => k.trim()).filter(Boolean)
    }
  } catch {}
  return keys
}

function pickKey(keys: string[]): string {
  return keys[Math.floor(Math.random() * keys.length)]
}

// ─── Rate limit helper ───────────────────────────────────────────────────────

async function checkDailyLimit(userId: string): Promise<{ allowed: boolean; limit: number }> {
  const db = await getDb()
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })

  let limit = 5 // free: 5 speaking sessions per day
  const userRows = await db.select().from(users).where(eq(users.email, userId))
  if (userRows.length > 0) {
    const plan = userRows[0].plan
    if (plan === 'pro') limit = 100
    else if (plan === 'plus') limit = 30
  }

  const usages = await db.select().from(apiUsages)
    .where(sql`userId = ${userId + ':speaking'} AND date = ${today}`)
  const usage = usages[0]

  if (!usage) {
    await db.insert(apiUsages).values({ userId: userId + ':speaking', date: today, count: 1 })
    return { allowed: true, limit }
  }
  if (usage.count >= limit) return { allowed: false, limit }
  await db.update(apiUsages).set({ count: usage.count + 1 })
    .where(sql`userId = ${userId + ':speaking'} AND date = ${today}`)
  return { allowed: true, limit }
}

// ─── System Prompt for Speaking Analysis ─────────────────────────────────────

function buildSpeakingSystemPrompt(
  examType: string,
  part: string,
  promptEn: string,
  transcript: string,
  fluencyData: Record<string, number | string>
): string {
  const isIelts = examType === 'IELTS_SPEAKING'
  const partLabel = isIelts
    ? { PART_1: 'Part 1 (Interview)', PART_2: 'Part 2 (Long Turn)', PART_3: 'Part 3 (Discussion)' }[part] ?? part
    : { Q1_2: 'Q1-2 (Read aloud)', Q3: 'Q3 (Describe picture)', Q4_6: 'Q4-6 (Respond)', Q7_9: 'Q7-9 (Information)', Q10_11: 'Q10-11 (Opinion)' }[part] ?? part

  return `You are a certified ${isIelts ? 'IELTS' : 'TOEIC'} Speaking examiner. You will evaluate a recorded spoken response.

## Exam Context
- Exam: ${examType}
- Section: ${partLabel}
- Prompt given to the candidate: "${promptEn}"

## Candidate's Transcript (from speech-to-text, may contain errors)
"""
${transcript}
"""

## Fluency Metrics (measured during recording)
- Speech duration: ${fluencyData.speechDurationMs}ms
- Total duration: ${fluencyData.totalDurationMs}ms
- Pause count: ${fluencyData.pauseCount}
- Long pause count (>1.5s): ${fluencyData.longPauseCount}
- Total pause time: ${fluencyData.totalPauseSec}s
- Words per minute: ${fluencyData.wpm}
- Filler words (um, uh, like, etc.): ${fluencyData.fillerCount}
- Repeated words/phrases: ${fluencyData.repetitionCount}

## Your Task
Evaluate the response and return a JSON object. CRITICAL rules:
1. Do NOT grade if transcript is empty or fewer than 5 words — return error instead.
2. Do NOT fabricate content. Only evaluate what is in the transcript.
3. Pauses are natural; only penalize excessive or mid-phrase pauses.
4. Note words that seem phonetically plausible but contextually wrong (possible misheard by STT).
5. Feedback must be in Vietnamese (feedback_vi). Max 4 sentences.
6. next_question_en: only for Part 1 / TOEIC Q4-6. One follow-up only. Empty string otherwise.
7. transcript_clean: Candidate's spoken text where you insert "..." at long pause/hesitation points (candidate had ${fluencyData.longPauseCount} long pauses).

## Return this exact JSON structure:
{
  "valid": true,
  "transcript_clean": "transcript with ... inserted at long pause points",
  "fluency": {
    "speech_duration_seconds": 0,
    "total_duration_seconds": 0,
    "pause_count": 0,
    "long_pause_count": 0,
    "total_pause_seconds": 0,
    "words_per_minute": 0,
    "repetition_count": 0,
    "filler_count": 0,
    "level": "low | medium | high"
  },
  "possible_misheard_words": [
    {
      "heard": "word from transcript",
      "suggested": "likely intended word",
      "reason": "brief contextual reason",
      "confirmed": false
    }
  ],
  "feedback_vi": "Nhận xét bằng tiếng Việt, tối đa 4 câu, cụ thể và hành động được.",
  "strengths_vi": "Điểm mạnh trong 1-2 câu ngắn.",
  "next_question_en": "",
  "next_question_vi": ""
}

If the transcript is empty, too short, or unintelligible, return:
{"valid": false, "error": "brief reason in Vietnamese"}
`
}

// ─── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // Check content-length
    const contentLength = req.headers.get('content-length')
    if (contentLength && parseInt(contentLength, 10) > 30_000_000) { // 30MB max for audio
      return NextResponse.json({ error: 'File âm thanh quá lớn (tối đa 30MB).' }, { status: 413 })
    }

    const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'anon'
    const contentType = req.headers.get('content-type') || ''

    // ── Route: POST /api/speaking (multipart/form-data with audio)
    if (contentType.includes('multipart/form-data')) {
      // Rate limit: 10 transcribe per 30 seconds per IP
      const rl = checkRateLimit(`speaking:transcribe:${ip}`, 10, 30000)
      if (!rl.allowed) {
        return NextResponse.json(
          { error: `Thao tác quá nhanh. Chờ ${rl.retryAfterSeconds} giây.` },
          { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
        )
      }

      const formData = await req.formData()
      const audioFile = formData.get('audio') as File | null
      const action = (formData.get('action') as string) || 'transcribe'

      if (action === 'transcribe') {
        if (!audioFile || audioFile.size === 0) {
          return NextResponse.json({ error: 'Không có file âm thanh.' }, { status: 400 })
        }
        if (audioFile.size < 1000) { // < 1KB = likely silent/noise
          return NextResponse.json({ error: 'AUDIO_TOO_SHORT', message: 'Audio quá ngắn hoặc chỉ là tiếng ồn.' }, { status: 422 })
        }
        if (audioFile.size > 25_000_000) { // 25MB Groq limit
          return NextResponse.json({ error: 'File âm thanh quá lớn (tối đa 25MB).' }, { status: 413 })
        }

        const keys = await getGroqKeys()
        if (!keys.length) {
          return NextResponse.json({ error: 'GROQ_API_KEY chưa được cấu hình.' }, { status: 500 })
        }

        const groq = new Groq({ apiKey: pickKey(keys), maxRetries: 1, timeout: 60000 })
        const buffer = Buffer.from(await audioFile.arrayBuffer())
        const mime = audioFile.type || 'audio/webm'

        try {
          let transcription: any = null
          for (const model of ['whisper-large-v3', 'whisper-large-v3-turbo']) {
            try {
              const file = await Groq.toFile(buffer, 'recording.webm', { type: mime })
              transcription = await groq.audio.transcriptions.create({
                file,
                model,
                response_format: 'verbose_json',
                language: 'en',
                temperature: 0.0,
              })
              break
            } catch (mErr: any) {
              if (model === 'whisper-large-v3-turbo') throw mErr
            }
          }

          const text = transcription?.text?.trim() ?? ''
          const words = text.split(/\s+/).filter((w: string) => w.length > 0)

          if (!text || words.length < 3) {
            return NextResponse.json({
              error: 'NO_SPEECH_DETECTED',
              message: 'Hệ thống chưa nghe rõ. Hãy nói to và rõ hơn, hoặc kiểm tra microphone.'
            }, { status: 422 })
          }

          return NextResponse.json({
            transcript: text,
            wordCount: words.length,
            language: (transcription as any).language ?? 'en',
          })
        } catch (err: any) {
          const msg = (err.message || '').toLowerCase()
          if (msg.includes('audio file is too short') || msg.includes('no audio')) {
            return NextResponse.json({
              error: 'AUDIO_TOO_SHORT',
              message: 'Audio quá ngắn. Hãy nói ít nhất 3-5 giây.'
            }, { status: 422 })
          }
          console.error('[Speaking] Transcribe error:', err)
          return NextResponse.json({ error: 'Lỗi khi chuyển giọng nói thành văn bản: ' + err.message }, { status: 500 })
        }
      }

      return NextResponse.json({ error: 'Action không hợp lệ.' }, { status: 400 })
    }

    // ── Route: JSON-based actions ──────────────────────────────────────────────
    if (!contentType.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type không hợp lệ.' }, { status: 415 })
    }

    const body = await req.json()
    const { action } = body

    // ── get_prompts ──────────────────────────────────────────────────────────
    if (action === 'get_prompts') {
      const { examType, part } = body
      if (!examType || !part) {
        return NextResponse.json({ error: 'Thiếu examType hoặc part.' }, { status: 400 })
      }

      try {
        const db = await getDb()
        const dbRows = await db.select().from(speakingPrompts).where(
          and(
            eq(speakingPrompts.examType, examType),
            eq(speakingPrompts.part, part),
            eq(speakingPrompts.isPublished, true)
          )
        )

        if (dbRows.length > 0) {
          const mapped: SpeakingPrompt[] = dbRows.map(r => ({
            id: r.id,
            examType: r.examType as any,
            part: r.part as any,
            topic: r.topic || 'General',
            questionEn: r.questionEn,
            questionVi: r.questionVi,
            cueCard: r.cueCard || undefined,
            subQuestions: r.subQuestions ? JSON.parse(r.subQuestions) : undefined,
            suggestedVocabulary: r.suggestedVocabulary ? JSON.parse(r.suggestedVocabulary) : undefined,
            imageUrl: r.imageUrl || undefined,
            prepTimeSec: r.prepTimeSec || 0,
            speakTimeSec: r.speakTimeSec || 45,
            startGraceSec: r.startGraceSec || 15,
            criteria: r.criteria ? JSON.parse(r.criteria) : undefined,
            difficulty: (r.difficulty as any) || 'medium',
            setId: r.setId || undefined,
          }))
          return NextResponse.json({ prompts: mapped, source: 'database' })
        }
      } catch (dbErr) {
        // Fallback to static prompts if table not yet migrated
      }

      const prompts = getPromptsForPart(examType, part as SpeakingPart)
      return NextResponse.json({ prompts, source: 'static' })
    }

    // ── analyze ─────────────────────────────────────────────────────────────
    if (action === 'analyze') {
      // Require auth for AI analysis
      const session = await auth()
      if (!session?.user?.email) {
        return NextResponse.json({ error: 'Bạn cần đăng nhập để phân tích bài nói.' }, { status: 401 })
      }

      // Rate limit: 5 per 20 seconds (heavy AI action)
      const rl = checkRateLimit(`speaking:analyze:${ip}`, 5, 20000)
      if (!rl.allowed) {
        return NextResponse.json(
          { error: `Thao tác quá nhanh. Chờ ${rl.retryAfterSeconds} giây.` },
          { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
        )
      }

      // Daily limit check
      const { allowed, limit } = await checkDailyLimit(session.user.email)
      if (!allowed) {
        return NextResponse.json(
          { error: `Bạn đã đạt giới hạn ${limit} lần luyện Speaking hôm nay. Quay lại vào ngày mai!` },
          { status: 429 }
        )
      }

      const { examType, part, promptEn, promptVi, transcript, fluencyData, sessionId } = body

      // Validate required fields
      if (!examType || !part || !promptEn || !transcript || !fluencyData) {
        return NextResponse.json({ error: 'Thiếu thông tin phân tích.' }, { status: 400 })
      }
      if (typeof transcript !== 'string' || transcript.trim().length < 5) {
        return NextResponse.json({
          error: 'TRANSCRIPT_EMPTY',
          message: 'Transcript rỗng hoặc quá ngắn. Không thể phân tích.'
        }, { status: 422 })
      }
      if (transcript.split(/\s+/).length < 3) {
        return NextResponse.json({
          error: 'TRANSCRIPT_TOO_SHORT',
          message: 'Bài nói quá ngắn (dưới 3 từ). Hãy nói thêm.'
        }, { status: 422 })
      }

      const keys = await getGroqKeys()
      if (!keys.length) {
        return NextResponse.json({ error: 'GROQ_API_KEY chưa được cấu hình.' }, { status: 500 })
      }

      const systemPrompt = buildSpeakingSystemPrompt(examType, part, promptEn, transcript, fluencyData)
      const groq = new Groq({ apiKey: pickKey(keys), maxRetries: 1, timeout: 45000 })

      let aiResult: any = null
      let usedModel = 'llama-3.3-70b-versatile'
      for (const model of ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant']) {
        try {
          const response = await groq.chat.completions.create({
            model,
            messages: [{ role: 'system', content: systemPrompt }],
            temperature: 0.3,
            max_tokens: 1200,
            response_format: { type: 'json_object' },
          })
          const text = response.choices[0]?.message?.content || '{}'
          aiResult = JSON.parse(text)
          usedModel = model
          break
        } catch (err: any) {
          if (model === 'llama-3.1-8b-instant') {
            return NextResponse.json({ error: 'Lỗi phân tích AI: ' + (err.message || 'Unknown') }, { status: 500 })
          }
        }
      }

      if (!aiResult) {
        return NextResponse.json({ error: 'Không thể phân tích bài nói. Thử lại sau.' }, { status: 500 })
      }

      if (aiResult.valid === false) {
        return NextResponse.json({ error: 'INVALID_RESPONSE', message: aiResult.error || 'Bài nói không hợp lệ.' }, { status: 422 })
      }

      // Save to DB
      try {
        const db = await getDb()
        const id = sessionId || crypto.randomUUID()
        await db.insert(speakingSessions).values({
          id,
          email: session.user.email,
          examType,
          part,
          promptEn,
          promptVi: promptVi || '',
          transcript,
          transcriptWithPauses: aiResult.transcript_clean || transcript,
          fluencyData: JSON.stringify(fluencyData),
          aiResult: JSON.stringify(aiResult),
          audioDurationMs: fluencyData.totalDurationMs || 0,
          speechDurationMs: fluencyData.speechDurationMs || 0,
          status: 'analyzed',
        })
        aiResult._sessionId = id
      } catch (dbErr) {
        console.error('[Speaking] DB save error:', dbErr)
        // Continue even if DB fails — still return AI result
      }

      return NextResponse.json({ result: aiResult, model: usedModel })
    }

    // ── followup ─────────────────────────────────────────────────────────────
    if (action === 'followup') {
      const session = await auth()
      if (!session?.user?.email) {
        return NextResponse.json({ error: 'Đăng nhập để dùng tính năng này.' }, { status: 401 })
      }

      const rl = checkRateLimit(`speaking:followup:${ip}`, 5, 20000)
      if (!rl.allowed) {
        return NextResponse.json(
          { error: `Thao tác quá nhanh. Chờ ${rl.retryAfterSeconds} giây.` },
          { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
        )
      }

      const { examType, part, originalQuestion, previousAnswer, followUpQuestion, transcript, fluencyData } = body
      if (!transcript || transcript.trim().length < 5) {
        return NextResponse.json({ error: 'Transcript rỗng. Không thể phân tích follow-up.' }, { status: 422 })
      }

      const keys = await getGroqKeys()
      if (!keys.length) {
        return NextResponse.json({ error: 'GROQ_API_KEY chưa được cấu hình.' }, { status: 500 })
      }

      const systemPrompt = `You are a certified IELTS/TOEIC Speaking examiner conducting a follow-up question.

Original question: "${originalQuestion}"
Candidate's previous answer: "${previousAnswer}"
Follow-up question asked: "${followUpQuestion}"
Candidate's follow-up answer (transcript): "${transcript}"

Fluency metrics: WPM=${fluencyData?.wpm}, pauses=${fluencyData?.pauseCount}, fillers=${fluencyData?.fillerCount}

Provide brief feedback on the follow-up answer. Return JSON:
{
  "valid": true,
  "feedback_vi": "Nhận xét ngắn bằng tiếng Việt (tối đa 3 câu)",
  "possible_misheard_words": [],
  "fluency": {
    "level": "low | medium | high",
    "words_per_minute": 0,
    "filler_count": 0
  }
}
If transcript too short: {"valid": false, "error": "reason in Vietnamese"}`

      const groq = new Groq({ apiKey: pickKey(keys), maxRetries: 1, timeout: 30000 })
      const response = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'system', content: systemPrompt }],
        temperature: 0.3,
        max_tokens: 600,
        response_format: { type: 'json_object' },
      })
      const result = JSON.parse(response.choices[0]?.message?.content || '{}')
      return NextResponse.json({ result })
    }

    // ── confirm_misheard ─────────────────────────────────────────────────────
    if (action === 'confirm_misheard') {
      const session = await auth()
      if (!session?.user?.email) {
        return NextResponse.json({ error: 'Đăng nhập để dùng tính năng này.' }, { status: 401 })
      }

      const { sessionId, confirmedWords } = body
      if (!sessionId || !Array.isArray(confirmedWords)) {
        return NextResponse.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 })
      }

      try {
        const db = await getDb()
        await db.update(speakingSessions)
          .set({ confirmedWords: JSON.stringify(confirmedWords) })
          .where(sql`id = ${sessionId} AND email = ${session.user.email}`)
        return NextResponse.json({ success: true })
      } catch (err) {
        return NextResponse.json({ error: 'Lỗi lưu dữ liệu.' }, { status: 500 })
      }
    }

    // ── report ───────────────────────────────────────────────────────────────
    if (action === 'report') {
      const session = await auth()
      if (!session?.user?.email) {
        return NextResponse.json({ error: 'Đăng nhập để xem báo cáo.' }, { status: 401 })
      }

      const { sessionId } = body
      const db = await getDb()

      if (sessionId) {
        const rows = await db.select().from(speakingSessions)
          .where(sql`id = ${sessionId} AND email = ${session.user.email}`)
        if (!rows.length) {
          return NextResponse.json({ error: 'Không tìm thấy phiên luyện tập.' }, { status: 404 })
        }
        return NextResponse.json({ session: rows[0] })
      }

      // Return recent sessions for user
      const list = await db.select().from(speakingSessions)
        .where(eq(speakingSessions.email, session.user.email))
        .orderBy(sql`${speakingSessions.createdAt} DESC`)
        .limit(20)
      return NextResponse.json({ sessions: list })
    }

    // ── chat (AI Speaking Coach) ─────────────────────────────────────────────
    if (action === 'chat') {
      const rl = checkRateLimit(`speaking:chat:${ip}`, 12, 30000)
      if (!rl.allowed) {
        return NextResponse.json(
          { error: `Thao tác quá nhanh. Chờ ${rl.retryAfterSeconds} giây.` },
          { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
        )
      }

      const { sessionId, message, history, context } = body
      if (!message || typeof message !== 'string') {
        return NextResponse.json({ error: 'Nội dung tin nhắn không hợp lệ.' }, { status: 400 })
      }

      const keys = await getGroqKeys()
      if (!keys.length) {
        return NextResponse.json({ error: 'GROQ_API_KEY chưa được cấu hình.' }, { status: 500 })
      }

      const examType = context?.examType || 'IELTS_SPEAKING'
      const part = context?.part || 'Part'
      const promptEn = context?.promptEn || ''
      const transcript = context?.transcript || ''
      const isScored = context?.isScored ?? true

      const coachSystemPrompt = `You are a warm, encouraging, yet rigorous AI Speaking Coach for VNDocs (${examType} - ${part}).
Current Speaking Prompt:
"${promptEn}"

Candidate's actual spoken transcript:
"""
${transcript || '(Chưa có bài nói hoặc chỉ vừa luyện tập)'}
"""

Scoring status: ${isScored ? 'Câu này được chấm điểm' : 'Câu này thuộc phần chỉ luyện tập, không tính điểm chính thức'}

Your instructions:
1. Always respond in natural, concise, helpful Vietnamese.
2. If asked for a model answer (câu trả lời mẫu), provide an authentic, natural Band 7.5+ (or TOEIC 160-180) spoken response. Highlight 2-3 key collocations with brief Vietnamese definitions.
3. If asked why their answer wasn't good or how to improve, analyze lexical choices, grammatical cohesion, and clarity.
4. If asked to raise/change scores, explain clearly and politely that scores are calculated from actual measurable performance and rubric criteria, so you cannot artificially alter scores.
5. Clearly distinguish between what the user said versus your suggestions. Keep explanations concise, practical, and well-formatted with markdown bullets. Max 250 words.`

      const conversationMessages: any[] = [{ role: 'system', content: coachSystemPrompt }]

      if (Array.isArray(history)) {
        for (const h of history.slice(-6)) {
          if (h.role === 'user' || h.role === 'assistant') {
            conversationMessages.push({ role: h.role, content: String(h.content) })
          }
        }
      }

      conversationMessages.push({ role: 'user', content: message })

      const groq = new Groq({ apiKey: pickKey(keys), maxRetries: 1, timeout: 35000 })
      let reply = ''

      for (const model of ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant']) {
        try {
          const resp = await groq.chat.completions.create({
            model,
            messages: conversationMessages,
            temperature: 0.5,
            max_tokens: 800,
          })
          reply = resp.choices[0]?.message?.content || ''
          if (reply) break
        } catch (err: any) {
          if (model === 'llama-3.1-8b-instant') {
            return NextResponse.json({ error: 'Lỗi kết nối AI Coach: ' + (err.message || 'Unknown') }, { status: 500 })
          }
        }
      }

      // Optionally save to DB if user is authenticated
      try {
        const session = await auth()
        if (session?.user?.email && sessionId) {
          const db = await getDb()
          await db.insert(speakingChats).values([
            {
              id: crypto.randomUUID(),
              sessionId,
              email: session.user.email,
              role: 'user',
              content: message,
            },
            {
              id: crypto.randomUUID(),
              sessionId,
              email: session.user.email,
              role: 'assistant',
              content: reply,
            }
          ])
        }
      } catch (dbErr) {
        // Non-blocking
      }

      return NextResponse.json({ reply })
    }

    return NextResponse.json({ error: 'Action không hợp lệ.' }, { status: 400 })
  } catch (err: any) {
    console.error('[Speaking API] Error:', err)
    return NextResponse.json({ error: 'Lỗi server: ' + (err.message || 'Unknown') }, { status: 500 })
  }
}
