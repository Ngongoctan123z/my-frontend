import { parseToeicPictures } from '@/src/data/toeicWriting'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getDb } from '@/src/db'
import { users, prompts, systemConfigs, speakingPrompts } from '@/src/db/schema'
import { desc, eq } from 'drizzle-orm'
import { ensureQuestionBank, mutateQuestionBank } from '../speaking/question-bank'
import { SpeakingRequestError } from '../speaking/validation'
import type { SpeakingD1 } from '../speaking/store'

async function checkAdmin() {
  const session = await auth()
  if (!session?.user?.email) {
    throw new Error('Unauthorized')
  }
  
  const rootAdmins = [
    'ngongoctan282005@gmail.com',
    'ngotan1911@gmail.com',
    'ngongoctan432005@gmail.com',
    'admin@vndocs.net'
  ]
  if (rootAdmins.includes(session.user.email)) {
    return true
  }

  const db = await getDb()
  const userList = await db.select().from(users).where(eq(users.email, session.user.email))
  if (userList.length > 0 && userList[0].role === 'admin') {
    return true
  }

  throw new Error('Forbidden')
}

async function sha256Hex(text: string) {
  const msgBuffer = new TextEncoder().encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function GET(req: NextRequest) {
  try {
    await checkAdmin()
    const db = await getDb()
    const type = req.nextUrl.searchParams.get('type')

    if (type === 'users') {
      const allUsers = await db.select().from(users).orderBy(users.name)
      return NextResponse.json(allUsers)
    }

    if (type === 'prompts') {
      const allPrompts = await db.select().from(prompts).orderBy(desc(prompts.createdAt))
      return NextResponse.json(allPrompts)
    }

    if (type === 'speaking_prompts') {
      await ensureQuestionBank(db.$client as SpeakingD1)
      const rows = await (db.$client as SpeakingD1).prepare('SELECT * FROM speaking_prompt ORDER BY createdAt DESC').all()
      return NextResponse.json(rows.results.map(row => ({ ...row, isPublished: !!row.isPublished })))
    }

    if (type === 'configs') {
      const allConfigs = await db.select().from(systemConfigs)
      const configMap = allConfigs.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {} as any)
      
      if (!configMap.TOTAL_API_REQUESTS) {
        configMap.TOTAL_API_REQUESTS = '0'
      }
      
      if (!configMap.GROQ_API_KEY && process.env.GROQ_API_KEY) {
        configMap.GROQ_API_KEY = process.env.GROQ_API_KEY
      }

      // Tổng hợp lượt gọi API cho từng key (hỗ trợ gom dữ liệu từ cả raw key, hash sha256 và prefix)
      if (configMap.GROQ_API_KEY) {
        const rawKeys = configMap.GROQ_API_KEY.split(',').map((k: string) => k.trim()).filter(Boolean)
        for (const k of rawKeys) {
          const hash = (await sha256Hex(k)).slice(0, 16)
          const prefix8 = k.slice(0, 8)
          const prefix12 = k.slice(0, 12)
          let totalUsage = 0

          if (configMap[`KEY_USAGE_${k}`]) totalUsage += parseInt(configMap[`KEY_USAGE_${k}`]) || 0
          if (configMap[`KEY_USAGE_${hash}`]) totalUsage += parseInt(configMap[`KEY_USAGE_${hash}`]) || 0
          if (configMap[`groq_usage_${hash}`]) totalUsage += parseInt(configMap[`groq_usage_${hash}`]) || 0
          if (configMap[`groq_usage_${prefix8}`]) totalUsage += parseInt(configMap[`groq_usage_${prefix8}`]) || 0
          if (configMap[`groq_usage_${prefix12}`]) totalUsage += parseInt(configMap[`groq_usage_${prefix12}`]) || 0

          configMap[`KEY_USAGE_${k}`] = totalUsage.toString()
        }
      }

      return NextResponse.json(configMap)
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error: any) {
    if (error instanceof SpeakingRequestError) return NextResponse.json({ error: error.message }, { status: error.status })
    if (error.message === 'Unauthorized') return NextResponse.json({ error: error.message }, { status: 401 })
    if (error.message === 'Forbidden') return NextResponse.json({ error: error.message }, { status: 403 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await checkAdmin()
    const db = await getDb()
    const body = await req.json()
    const { action, payload } = body

    if (action === 'save_configs') {
      for (const [k, v] of Object.entries(payload)) {
        if (v !== undefined && typeof v === 'string') {
          // Bảo vệ: Nếu GROQ_API_KEY bị gửi lên dưới dạng đã mask (chứa ***), không ghi đè vào DB
          if (k === 'GROQ_API_KEY' && v.includes('***')) {
            continue
          }
          if (v === '') {
            await db.delete(systemConfigs).where(eq(systemConfigs.key, k))
          } else {
            await db.insert(systemConfigs).values({
              key: k,
              value: v
            }).onConflictDoUpdate({
              target: systemConfigs.key,
              set: { value: v }
            })
          }
        }
      }
      return NextResponse.json({ success: true })
    }

    if (action === 'add_prompt') {
      const { type, content, imageUrl } = payload
      if (type === 'TOEIC_PICTURE') {
        try { parseToeicPictures(content) } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 422 }) }
      }
      const newPrompt = await db.insert(prompts).values({
        id: crypto.randomUUID(),
        type,
        content,
        imageUrl: imageUrl || null,
        createdAt: new Date()
      }).returning()
      return NextResponse.json(newPrompt[0])
    }

    if (action === 'delete_prompt') {
      await db.delete(prompts).where(eq(prompts.id, payload.id))
      return NextResponse.json({ success: true })
    }

    if (['add_speaking_prompt','update_speaking_prompt','delete_speaking_prompt','toggle_speaking_prompt_publish'].includes(action)) {
      return NextResponse.json(await mutateQuestionBank(db.$client as SpeakingD1, action, payload))
    }

    if (action === 'test_groq_models') {
      try {
        const config = await db.select().from(systemConfigs).where(eq(systemConfigs.key, 'GROQ_API_KEY'))
        const apiKey = (config.length > 0 && config[0].value) ? config[0].value.split(',')[0] : process.env.GROQ_API_KEY?.split(',')[0]
        
        if (!apiKey) {
          return NextResponse.json({ error: 'Chưa có API Key nào được cấu hình.' }, { status: 400 })
        }

        const response = await fetch('https://api.groq.com/openai/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        })
        
        if (!response.ok) {
          throw new Error('Không thể kết nối với Groq API. Kiểm tra lại API Key.')
        }

        const data = await response.json()
        const activeModels = data.data.map((m: any) => m.id).filter((id: string) => !id.includes('whisper') && !id.includes('vision') && !id.includes('tool-use'))
        return NextResponse.json({ models: activeModels.sort() })
      } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
      }
    }

    if (action === 'test_single_model') {
      try {
        const config = await db.select().from(systemConfigs).where(eq(systemConfigs.key, 'GROQ_API_KEY'))
        const apiKey = (config.length > 0 && config[0].value) ? config[0].value.split(',')[0] : process.env.GROQ_API_KEY?.split(',')[0]
        
        if (!apiKey) throw new Error('Missing API Key')

        const { model } = payload
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: 'Hi' }],
            max_tokens: 1
          })
        })

        if (!response.ok) {
          const err = await response.json()
          throw new Error(err.error?.message || 'Lỗi không xác định')
        }

        return NextResponse.json({ success: true })
      } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 })
      }
    }

    if (action === 'test_api_keys') {
      try {
        const configRow = await db.select().from(systemConfigs).where(eq(systemConfigs.key, 'GROQ_API_KEY'))
        const dbKeys = (configRow.length > 0 && configRow[0].value) 
          ? configRow[0].value.split(',').map((k: string) => k.trim()).filter(Boolean)
          : (process.env.GROQ_API_KEY || '').split(',').map((k: string) => k.trim()).filter(Boolean)

        let keysToTest: string[] = []
        const { apiKeysString } = payload || {}

        if (apiKeysString && typeof apiKeysString === 'string') {
          const rawKeys = apiKeysString.split(',').map((k: string) => k.trim()).filter(Boolean)
          // Nếu người dùng gửi key có dấu *** (từ màn hình admin mask), dùng key thật từ DB
          if (rawKeys.some((k: string) => k.includes('***'))) {
            keysToTest = dbKeys
          } else {
            keysToTest = rawKeys
          }
        } else {
          keysToTest = dbKeys
        }

        if (keysToTest.length === 0) {
          return NextResponse.json({ results: [] })
        }

        const results = await Promise.all(keysToTest.map(async (key: string) => {
          const displayKey = key.length > 12 ? `${key.substring(0, 8)}***${key.slice(-4)}` : key
          try {
            const response = await fetch('https://api.groq.com/openai/v1/models', {
              headers: { 'Authorization': `Bearer ${key}` }
            })
            if (!response.ok) {
              const err = await response.json().catch(() => ({}))
              return { key: displayKey, success: false, msg: err.error?.message || 'Lỗi không xác định' }
            }
            return { key: displayKey, success: true, msg: 'Hoạt động tốt' }
          } catch (e: any) {
            return { key: displayKey, success: false, msg: e.message }
          }
        }))

        return NextResponse.json({ results })
      } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 })
      }
    }

    if (action === 'update_user_status') {
      await db.update(users).set({ status: payload.status }).where(eq(users.id, payload.id))
      return NextResponse.json({ success: true })
    }

    if (action === 'update_user_plan') {
      const { id, plan } = payload
      const validPlans = ['free', 'plus', 'pro']
      if (!validPlans.includes(plan)) {
        return NextResponse.json({ error: 'Invalid plan value' }, { status: 400 })
      }
      let planExpiresAt: Date | null = null
      
      // If upgraded to plus or pro, set expiration to 30 days from now
      if (plan === 'plus' || plan === 'pro') {
        planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }

      await db.update(users).set({ 
        plan, 
        planExpiresAt 
      }).where(eq(users.id, id))
      return NextResponse.json({ success: true })
    }

    if (action === 'delete_user') {
      await db.delete(users).where(eq(users.id, payload.id))
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    if (error instanceof SpeakingRequestError) return NextResponse.json({ error: error.message }, { status: error.status })
    if (error.message === 'Unauthorized') return NextResponse.json({ error: error.message }, { status: 401 })
    if (error.message === 'Forbidden') return NextResponse.json({ error: error.message }, { status: 403 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
