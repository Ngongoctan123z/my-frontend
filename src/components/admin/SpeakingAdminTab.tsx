'use client'

import React, { useState, useEffect } from 'react'
import {
  Mic, Plus, Trash2, Edit2, CheckCircle2, XCircle, Search,
  Filter, BookOpen, Clock, AlertCircle, Loader2, Sparkles
} from 'lucide-react'
import {
  SpeakingPrompt, SpeakingPart, PART_META,
  IELTS_PART1_PROMPTS, IELTS_PART2_PROMPTS, IELTS_PART3_PROMPTS,
  TOEIC_Q1_2_PROMPTS, TOEIC_Q3_PROMPTS, TOEIC_Q4_6_PROMPTS,
  TOEIC_Q7_9_PROMPTS, TOEIC_Q10_11_PROMPTS
} from '@/src/data/speakingPrompts'

export function SpeakingAdminTab() {
  const [activeSubTab, setActiveSubTab] = useState<'bank' | 'sets' | 'rubric'>('bank')
  const [examFilter, setExamFilter] = useState<'ALL' | 'IELTS_SPEAKING' | 'TOEIC_SPEAKING'>('ALL')
  const [partFilter, setPartFilter] = useState<string>('ALL')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  // Local prompts state (combined built-ins + custom from DB)
  const defaultList: SpeakingPrompt[] = [
    ...IELTS_PART1_PROMPTS,
    ...IELTS_PART2_PROMPTS,
    ...IELTS_PART3_PROMPTS,
    ...TOEIC_Q1_2_PROMPTS,
    ...TOEIC_Q3_PROMPTS,
    ...TOEIC_Q4_6_PROMPTS,
    ...TOEIC_Q7_9_PROMPTS,
    ...TOEIC_Q10_11_PROMPTS,
  ]

  const [promptsList, setPromptsList] = useState<SpeakingPrompt[]>(defaultList)
  const [publishedMap, setPublishedMap] = useState<Record<string, boolean>>({})

  // Modal State for adding/editing prompt
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<SpeakingPrompt | null>(null)

  const [formExam, setFormExam] = useState<'IELTS_SPEAKING' | 'TOEIC_SPEAKING'>('IELTS_SPEAKING')
  const [formPart, setFormPart] = useState<SpeakingPart>('PART_1')
  const [formTopic, setFormTopic] = useState('')
  const [formQuestionEn, setFormQuestionEn] = useState('')
  const [formQuestionVi, setFormQuestionVi] = useState('')
  const [formCueCard, setFormCueCard] = useState('')
  const [formVocab, setFormVocab] = useState('')
  const [formImageUrl, setFormImageUrl] = useState('')
  const [formPrepTime, setFormPrepTime] = useState(0)
  const [formSpeakTime, setFormSpeakTime] = useState(45)
  const [formStartGrace, setFormStartGrace] = useState(15)
  const [formDifficulty, setFormDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [formSetId, setFormSetId] = useState('')

  // Load from API
  const loadAdminPrompts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin?type=speaking_prompts')
      if (res.ok) {
        const dbPrompts = await res.json()
        if (Array.isArray(dbPrompts) && dbPrompts.length > 0) {
          // Merge with default list
          const formatted: SpeakingPrompt[] = dbPrompts.map((p: any) => ({
            id: p.id,
            examType: p.examType,
            part: p.part,
            topic: p.topic,
            questionEn: p.questionEn,
            questionVi: p.questionVi,
            cueCard: p.cueCard || undefined,
            subQuestions: p.subQuestions ? JSON.parse(p.subQuestions) : undefined,
            suggestedVocabulary: p.suggestedVocabulary ? JSON.parse(p.suggestedVocabulary) : undefined,
            imageUrl: p.imageUrl || undefined,
            prepTimeSec: p.prepTimeSec ?? 0,
            speakTimeSec: p.speakTimeSec ?? 45,
            startGraceSec: p.startGraceSec ?? 15,
            criteria: p.criteria ? JSON.parse(p.criteria) : [],
            difficulty: p.difficulty || 'medium',
            setId: p.setId || undefined,
          }))

          const pubState: Record<string, boolean> = {}
          dbPrompts.forEach((p: any) => {
            pubState[p.id] = p.isPublished !== false
          })
          setPublishedMap(pubState)
          setPromptsList(formatted)
        }
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    loadAdminPrompts()
  }, [])

  const handleOpenAddModal = () => {
    setEditingPrompt(null)
    setFormExam('IELTS_SPEAKING')
    setFormPart('PART_1')
    setFormTopic('')
    setFormQuestionEn('')
    setFormQuestionVi('')
    setFormCueCard('')
    setFormVocab('')
    setFormImageUrl('')
    setFormPrepTime(0)
    setFormSpeakTime(45)
    setFormStartGrace(15)
    setFormDifficulty('medium')
    setFormSetId('')
    setModalOpen(true)
  }

  const handleOpenEditModal = (p: SpeakingPrompt) => {
    setEditingPrompt(p)
    setFormExam(p.examType)
    setFormPart(p.part as SpeakingPart)
    setFormTopic(p.topic)
    setFormQuestionEn(p.questionEn)
    setFormQuestionVi(p.questionVi)
    setFormCueCard(p.cueCard || '')
    setFormVocab((p.suggestedVocabulary || []).join(', '))
    setFormImageUrl(p.imageUrl || '')
    setFormPrepTime(p.prepTimeSec)
    setFormSpeakTime(p.speakTimeSec)
    setFormStartGrace(p.startGraceSec || 15)
    setFormDifficulty(p.difficulty)
    setFormSetId(p.setId || '')
    setModalOpen(true)
  }

  const handleSavePrompt = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTopic.trim() || !formQuestionEn.trim()) return

    const vocabArray = formVocab.split(',').map((w) => w.trim()).filter(Boolean)

    const payload = {
      id: editingPrompt?.id || crypto.randomUUID(),
      examType: formExam,
      part: formPart,
      topic: formTopic,
      questionEn: formQuestionEn,
      questionVi: formQuestionVi,
      cueCard: formCueCard || null,
      suggestedVocabulary: JSON.stringify(vocabArray),
      imageUrl: formImageUrl || null,
      prepTimeSec: Number(formPrepTime),
      speakTimeSec: Number(formSpeakTime),
      startGraceSec: Number(formStartGrace),
      difficulty: formDifficulty,
      setId: formSetId || null,
      isPublished: true,
    }

    try {
      await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: editingPrompt ? 'update_speaking_prompt' : 'add_speaking_prompt',
          payload,
        }),
      })

      // Update in state
      const updatedItem: SpeakingPrompt = {
        id: payload.id,
        examType: formExam,
        part: formPart,
        topic: formTopic,
        questionEn: formQuestionEn,
        questionVi: formQuestionVi,
        cueCard: formCueCard || undefined,
        suggestedVocabulary: vocabArray,
        imageUrl: formImageUrl || undefined,
        prepTimeSec: Number(formPrepTime),
        speakTimeSec: Number(formSpeakTime),
        startGraceSec: Number(formStartGrace),
        criteria: ['Fluency & Coherence', 'Lexical Resource', 'Grammar', 'Pronunciation'],
        difficulty: formDifficulty,
        setId: formSetId || undefined,
      }

      if (editingPrompt) {
        setPromptsList((prev) => prev.map((item) => (item.id === editingPrompt.id ? updatedItem : item)))
      } else {
        setPromptsList((prev) => [updatedItem, ...prev])
      }

      setModalOpen(false)
    } catch (err) {
      alert('Lỗi lưu đề bài.')
    }
  }

  const handleDeletePrompt = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xoá đề bài này?')) return
    try {
      await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_speaking_prompt', payload: { id } }),
      })
      setPromptsList((prev) => prev.filter((p) => p.id !== id))
    } catch {}
  }

  const togglePublish = async (id: string) => {
    const current = publishedMap[id] !== false
    const nextVal = !current
    setPublishedMap((prev) => ({ ...prev, [id]: nextVal }))
    try {
      await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_speaking_prompt_publish',
          payload: { id, isPublished: nextVal },
        }),
      })
    } catch {}
  }

  // Filtered List
  const filteredPrompts = promptsList.filter((p) => {
    if (examFilter !== 'ALL' && p.examType !== examFilter) return false
    if (partFilter !== 'ALL' && p.part !== partFilter) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return (
        p.topic.toLowerCase().includes(q) ||
        p.questionEn.toLowerCase().includes(q) ||
        p.questionVi.toLowerCase().includes(q)
      )
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Subtabs */}
      <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
        <button
          onClick={() => setActiveSubTab('bank')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg transition-colors ${
            activeSubTab === 'bank'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Ngân hàng đề ({promptsList.length})
        </button>

        <button
          onClick={() => setActiveSubTab('sets')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg transition-colors ${
            activeSubTab === 'sets'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Bộ đề liên kết (IELTS Part 2+3)
        </button>

        <button
          onClick={() => setActiveSubTab('rubric')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg transition-colors ${
            activeSubTab === 'rubric'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          Cấu hình thời gian & Rubric
        </button>
      </div>

      {/* Subtab 1: Ngân hàng đề */}
      {activeSubTab === 'bank' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm chủ đề, câu hỏi..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-hidden"
                />
              </div>

              <select
                value={examFilter}
                onChange={(e) => {
                  setExamFilter(e.target.value as any)
                  setPartFilter('ALL')
                }}
                className="py-2 px-3 text-xs sm:text-sm border border-slate-200 rounded-xl bg-slate-50"
              >
                <option value="ALL">Tất cả kỳ thi</option>
                <option value="IELTS_SPEAKING">IELTS Speaking</option>
                <option value="TOEIC_SPEAKING">TOEIC Speaking</option>
              </select>

              <select
                value={partFilter}
                onChange={(e) => setPartFilter(e.target.value)}
                className="py-2 px-3 text-xs sm:text-sm border border-slate-200 rounded-xl bg-slate-50"
              >
                <option value="ALL">Tất cả các phần</option>
                {examFilter !== 'TOEIC_SPEAKING' && (
                  <>
                    <option value="PART_1">IELTS Part 1</option>
                    <option value="PART_2">IELTS Part 2</option>
                    <option value="PART_3">IELTS Part 3</option>
                  </>
                )}
                {examFilter !== 'IELTS_SPEAKING' && (
                  <>
                    <option value="Q1_2">TOEIC Q1-2</option>
                    <option value="Q3">TOEIC Q3</option>
                    <option value="Q4_6">TOEIC Q4-6</option>
                    <option value="Q7_9">TOEIC Q7-9</option>
                    <option value="Q10_11">TOEIC Q10-11</option>
                  </>
                )}
              </select>
            </div>

            <button
              onClick={handleOpenAddModal}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs shrink-0"
            >
              <Plus className="w-4 h-4" />
              Thêm đề Speaking
            </button>
          </div>

          {/* Prompts Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3">Phần / Kỳ thi</th>
                  <th className="p-3">Chủ đề</th>
                  <th className="p-3">Nội dung câu hỏi (EN)</th>
                  <th className="p-3">Thời gian</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPrompts.map((p) => {
                  const isPub = publishedMap[p.id] !== false
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-semibold whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-violet-100 text-violet-800 rounded font-mono text-xs">
                          {p.part}
                        </span>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {p.examType === 'IELTS_SPEAKING' ? 'IELTS' : 'TOEIC'}
                        </p>
                      </td>
                      <td className="p-3 font-bold text-slate-800 whitespace-nowrap">
                        {p.topic}
                        {p.setId && (
                          <span className="ml-1 text-[10px] text-indigo-600 bg-indigo-50 px-1 rounded border border-indigo-100">
                            {p.setId}
                          </span>
                        )}
                      </td>
                      <td className="p-3 max-w-md">
                        <p className="line-clamp-2 text-slate-700">{p.questionEn}</p>
                        <p className="line-clamp-1 text-slate-400 text-xs italic mt-0.5">{p.questionVi}</p>
                      </td>
                      <td className="p-3 text-xs text-slate-500 whitespace-nowrap">
                        Prep: {p.prepTimeSec}s | Speak: {p.speakTimeSec}s
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <button
                          onClick={() => togglePublish(p.id)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            isPub ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {isPub ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {isPub ? 'Đã xuất bản' : 'Ẩn'}
                        </button>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Sửa đề"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePrompt(p.id)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xoá đề"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 2: Bộ đề liên kết */}
      {activeSubTab === 'sets' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Các bộ đề liên kết chủ đề Part 2 (Long Turn) và Part 3 (Discussion) của IELTS Speaking để đảm bảo thí sinh sau khi nói Part 2 sẽ nhận được các câu hỏi thảo luận liên quan trực tiếp.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['set_role_model', 'set_travel_tourism', 'set_achievement', 'set_education', 'set_culture'].map((setId) => {
              const p2 = promptsList.find((p) => p.part === 'PART_2' && p.setId === setId)
              const p3 = promptsList.find((p) => p.part === 'PART_3' && p.setId === setId)

              return (
                <div key={setId} className="p-5 border border-slate-200 rounded-2xl bg-white shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-mono font-bold text-xs rounded-lg">
                      Mã bộ đề: {setId}
                    </span>
                    <span className="text-xs text-emerald-600 font-bold">2 phần liên kết</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg">
                      <p className="font-bold text-amber-800">Part 2: {p2?.topic || 'Chưa gán'}</p>
                      <p className="text-slate-600 line-clamp-2 mt-0.5">{p2?.questionEn}</p>
                    </div>

                    <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg">
                      <p className="font-bold text-blue-800">Part 3: {p3?.topic || 'Chưa gán'}</p>
                      <p className="text-slate-600 line-clamp-2 mt-0.5">{p3?.questionEn}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Subtab 3: Cấu hình thời gian & Rubric */}
      {activeSubTab === 'rubric' && (
        <div className="space-y-6">
          <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-3">
            <h4 className="font-bold text-slate-800 text-sm">Cấu hình thời gian chuẩn theo từng Part</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {Object.entries(PART_META).map(([key, meta]) => (
                <div key={key} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-800">{meta.labelEn} ({meta.labelVi})</p>
                    <p className="text-slate-400 text-[11px]">{meta.descVi}</p>
                  </div>
                  <div className="text-right text-slate-600 font-mono">
                    <p>Chuẩn bị: {meta.defaultPrep}s</p>
                    <p className="text-indigo-600 font-bold">Nói: {meta.defaultSpeak}s</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-4">
            <h4 className="font-bold text-slate-800 text-sm">Tiêu chí Barem Khảo thí AI (Rubric)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2">
                <p className="font-bold text-indigo-900 text-sm">IELTS Speaking Rubric</p>
                <ul className="space-y-1.5 text-slate-700">
                  <li>• <strong>Fluency & Coherence:</strong> Tốc độ WPM, khoảng nghỉ tự nhiên vs ngập ngừng bất thường, từ đệm.</li>
                  <li>• <strong>Lexical Resource:</strong> Độ đa dạng từ vựng, collocations, tính chính xác ngữ cảnh.</li>
                  <li>• <strong>Grammatical Range & Accuracy:</strong> Cấu trúc câu đơn vs phức, độ chính xác ngữ pháp.</li>
                  <li>• <strong>Pronunciation:</strong> Phát hiện các từ có thể nghe nhầm hoặc phát âm sai theo ngữ cảnh.</li>
                </ul>
              </div>

              <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-2">
                <p className="font-bold text-emerald-900 text-sm">TOEIC Speaking Rubric</p>
                <ul className="space-y-1.5 text-slate-700">
                  <li>• <strong>Pronunciation & Stress:</strong> Độ rõ của âm tiết, trọng âm từ và ngữ điệu câu.</li>
                  <li>• <strong>Vocabulary & Detail:</strong> Khả năng miêu tả chi tiết hình ảnh và xử lý dữ liệu bảng biểu.</li>
                  <li>• <strong>Grammar & Cohesion:</strong> Cấu trúc diễn đạt ý kiến, lập luận nguyên nhân - kết quả.</li>
                  <li>• <strong>Completeness:</strong> Trả lời trọn vẹn và bám sát yêu cầu phỏng vấn.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Add / Edit Prompt ───────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <h3 className="text-lg font-bold text-slate-800">
              {editingPrompt ? 'Chỉnh sửa đề Speaking' : 'Thêm đề Speaking mới'}
            </h3>

            <form onSubmit={handleSavePrompt} className="space-y-3.5 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Kỳ thi</label>
                  <select
                    value={formExam}
                    onChange={(e) => {
                      const ex = e.target.value as any
                      setFormExam(ex)
                      setFormPart(ex === 'IELTS_SPEAKING' ? 'PART_1' : 'Q1_2')
                    }}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50"
                  >
                    <option value="IELTS_SPEAKING">IELTS Speaking</option>
                    <option value="TOEIC_SPEAKING">TOEIC Speaking</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Phần thi (Part)</label>
                  <select
                    value={formPart}
                    onChange={(e) => setFormPart(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50"
                  >
                    {formExam === 'IELTS_SPEAKING' ? (
                      <>
                        <option value="PART_1">Part 1 (Interview)</option>
                        <option value="PART_2">Part 2 (Long Turn)</option>
                        <option value="PART_3">Part 3 (Discussion)</option>
                      </>
                    ) : (
                      <>
                        <option value="Q1_2">Q1-2 (Read Aloud)</option>
                        <option value="Q3">Q3 (Describe Picture)</option>
                        <option value="Q4_6">Q4-6 (Respond)</option>
                        <option value="Q7_9">Q7-9 (Using Info)</option>
                        <option value="Q10_11">Q10-11 (Express Opinion)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Tên chủ đề (Topic - hiển thị trên vòng xoay)</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: An Influential Person, Technology in Life..."
                  value={formTopic}
                  onChange={(e) => setFormTopic(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Nội dung câu hỏi (Tiếng Anh)</label>
                <textarea
                  required
                  rows={3}
                  value={formQuestionEn}
                  onChange={(e) => setFormQuestionEn(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Nghĩa tiếng Việt</label>
                <textarea
                  rows={2}
                  value={formQuestionVi}
                  onChange={(e) => setFormQuestionVi(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50"
                />
              </div>

              {formPart === 'PART_2' && (
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Cue Card (Dành cho Part 2)</label>
                  <textarea
                    rows={4}
                    placeholder="You should say:&#10;• Who this person is&#10;• ..."
                    value={formCueCard}
                    onChange={(e) => setFormCueCard(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-mono text-xs"
                  />
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Chuẩn bị (giây)</label>
                  <input
                    type="number"
                    value={formPrepTime}
                    onChange={(e) => setFormPrepTime(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Nói tối đa (giây)</label>
                  <input
                    type="number"
                    value={formSpeakTime}
                    onChange={(e) => setFormSpeakTime(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Ân hạn (giây)</label>
                  <input
                    type="number"
                    value={formStartGrace}
                    onChange={(e) => setFormStartGrace(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Từ vựng gợi ý (cách nhau bởi dấu phẩy)</label>
                <input
                  type="text"
                  placeholder="mentor, inspirational, perseverance..."
                  value={formVocab}
                  onChange={(e) => setFormVocab(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">URL Hình ảnh (TOEIC Q3 / Q7-9)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Mã bộ đề liên kết (Set ID)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: set_travel, set_education (để nối Part 2 và Part 3)"
                  value={formSetId}
                  onChange={(e) => setFormSetId(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-xs"
                >
                  {editingPrompt ? 'Cập nhật đề' : 'Thêm vào ngân hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
