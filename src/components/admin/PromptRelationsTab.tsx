'use client'

import React, { useEffect, useState, useMemo } from 'react'
import {
  Link2,
  Unlink,
  AlertTriangle,
  CheckCircle2,
  ArrowRightLeft,
  Plus,
  Search,
  Eye,
  RefreshCw,
  FileText,
  Image as ImageIcon,
  Layers,
  X,
  Loader2,
  HelpCircle,
  ExternalLink,
  Info
} from 'lucide-react'

interface PromptItem {
  id: string
  type: string
  content: string
  imageUrl?: string | null
  createdAt?: number | string | Date
}

type ExamCategory = 'IELTS' | 'TOEIC' | 'TOPIK' | 'HSK'

export function PromptRelationsTab({ onNavigateToPrompts }: { onNavigateToPrompts?: (type: string) => void }) {
  const [prompts, setPrompts] = useState<PromptItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedExam, setSelectedExam] = useState<ExamCategory>('IELTS')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterMode, setFilterMode] = useState<'all' | 'exact' | 'deficit'>('all')

  // Preview modal state
  const [previewSet, setPreviewSet] = useState<{
    id: number
    title: string
    isExact: boolean
    deficitSide: 'left' | 'right' | null
    part1: PromptItem
    part2: PromptItem
  } | null>(null)
  const [previewSinglePrompt, setPreviewSinglePrompt] = useState<PromptItem | null>(null)

  // Quick Add Prompt Modal State
  const [showAddModal, setShowAddModal] = useState(false)
  const [addPromptType, setAddPromptType] = useState('IELTS_TASK_1')
  const [addContent, setAddContent] = useState('')
  const [addImageUrl, setAddImageUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadPrompts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin?type=prompts')
      const data = await res.json()
      if (Array.isArray(data)) {
        setPrompts(data)
      }
    } catch (e) {
      console.error('Error fetching prompts for relations:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPrompts()
  }, [])

  const hsk5Prompts = useMemo(() => {
    return prompts
      .filter(p => p.type === 'HSK_5')
      .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime())
  }, [prompts])

  const hsk6Prompts = useMemo(() => {
    return prompts
      .filter(p => p.type === 'HSK_6')
      .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime())
  }, [prompts])

  // Quick Add submit
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addContent.trim()) {
      alert('Vui lòng nhập nội dung đề thi.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_prompt',
          type: addPromptType,
          content: addContent.trim(),
          imageUrl: addImageUrl.trim() || null
        })
      })
      const result = await res.json()
      if (res.ok) {
        alert('Đã thêm đề mới thành công!')
        setAddContent('')
        setAddImageUrl('')
        setShowAddModal(false)
        await loadPrompts()
      } else {
        alert(result.error || 'Có lỗi xảy ra khi thêm đề.')
      }
    } catch (err: any) {
      alert('Lỗi: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Phân tích dữ liệu theo loại bài thi
  const relationsData = useMemo(() => {
    if (selectedExam === 'IELTS') {
      const list1 = prompts
        .filter(p => p.type === 'IELTS_TASK_1')
        .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime())
      const list2 = prompts
        .filter(p => p.type === 'IELTS_TASK_2')
        .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime())

      const maxLen = Math.max(list1.length, list2.length)
      const pairs = []

      for (let i = 0; i < maxLen; i++) {
        const isLeftMissing = i >= list1.length
        const isRightMissing = i >= list2.length
        const isExact = !isLeftMissing && !isRightMissing

        const p1 = !isLeftMissing ? list1[i] : list1[i % (list1.length || 1)] || { id: 'missing', content: '(Chưa có đề Task 1)', type: 'IELTS_TASK_1' }
        const p2 = !isRightMissing ? list2[i] : list2[i % (list2.length || 1)] || { id: 'missing', content: '(Chưa có đề Task 2)', type: 'IELTS_TASK_2' }

        pairs.push({
          id: i + 1,
          title: `Bộ đề IELTS #${i + 1}`,
          isExact,
          deficitSide: isLeftMissing ? ('left' as const) : isRightMissing ? ('right' as const) : null,
          part1: p1,
          part2: p2,
          part1Index: i < list1.length ? i + 1 : (i % (list1.length || 1)) + 1,
          part2Index: i < list2.length ? i + 1 : (i % (list2.length || 1)) + 1
        })
      }

      return {
        leftTitle: 'Task 1 (Report/Chart)',
        leftType: 'IELTS_TASK_1',
        leftCount: list1.length,
        rightTitle: 'Task 2 (Essay)',
        rightType: 'IELTS_TASK_2',
        rightCount: list2.length,
        pairs,
        deficit: Math.abs(list1.length - list2.length),
        deficitSide: list1.length < list2.length ? 'left' : list1.length > list2.length ? 'right' : 'none',
        exactCount: Math.min(list1.length, list2.length),
        totalSets: maxLen
      }
    }

    if (selectedExam === 'TOEIC') {
      const list1 = prompts
        .filter(p => p.type === 'TOEIC_RESPOND')
        .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime())
      const list2 = prompts
        .filter(p => p.type === 'TOEIC_ESSAY')
        .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime())

      const maxLen = Math.max(list1.length, list2.length)
      const pairs = []

      for (let i = 0; i < maxLen; i++) {
        const isLeftMissing = i >= list1.length
        const isRightMissing = i >= list2.length
        const isExact = !isLeftMissing && !isRightMissing

        const p1 = !isLeftMissing ? list1[i] : list1[i % (list1.length || 1)] || { id: 'missing', content: '(Chưa có đề Phần 1)', type: 'TOEIC_RESPOND' }
        const p2 = !isRightMissing ? list2[i] : list2[i % (list2.length || 1)] || { id: 'missing', content: '(Chưa có đề Phần 2)', type: 'TOEIC_ESSAY' }

        pairs.push({
          id: i + 1,
          title: `Bộ đề TOEIC #${i + 1}`,
          isExact,
          deficitSide: isLeftMissing ? ('left' as const) : isRightMissing ? ('right' as const) : null,
          part1: p1,
          part2: p2,
          part1Index: i < list1.length ? i + 1 : (i % (list1.length || 1)) + 1,
          part2Index: i < list2.length ? i + 1 : (i % (list2.length || 1)) + 1
        })
      }

      return {
        leftTitle: 'Part 1: Email (Q6-7)',
        leftType: 'TOEIC_RESPOND',
        leftCount: list1.length,
        rightTitle: 'Part 2: Essay (Q8)',
        rightType: 'TOEIC_ESSAY',
        rightCount: list2.length,
        pairs,
        deficit: Math.abs(list1.length - list2.length),
        deficitSide: list1.length < list2.length ? 'left' : list1.length > list2.length ? 'right' : 'none',
        exactCount: Math.min(list1.length, list2.length),
        totalSets: maxLen
      }
    }

    if (selectedExam === 'HSK') {
      const list1 = prompts
        .filter(p => p.type === 'HSK_5')
        .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime())
      const list2 = prompts
        .filter(p => p.type === 'HSK_6')
        .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime())

      // HSK 5 và HSK 6 là 2 cấp độ độc lập, hoàn toàn riêng biệt không ghép cặp
      return {
        isIndependent: true,
        leftTitle: 'HSK 5 (Writing Q91-100)',
        leftType: 'HSK_5',
        leftCount: list1.length,
        rightTitle: 'HSK 6 (Tóm tắt 1000 chữ)',
        rightType: 'HSK_6',
        rightCount: list2.length,
        pairs: [],
        deficit: 0,
        deficitSide: 'none' as const,
        exactCount: 0,
        totalSets: 0
      }
    }

    // TOPIK: Câu 51, 52, 53, 54
    const list51 = prompts.filter(p => p.type === 'TOPIK_51')
    const list52 = prompts.filter(p => p.type === 'TOPIK_52')
    const list53 = prompts.filter(p => p.type === 'TOPIK_53')
    const list54 = prompts.filter(p => p.type === 'TOPIK_54')

    const maxLen = Math.max(list51.length, list52.length, list53.length, list54.length, 1)
    const pairs = []

    for (let i = 0; i < maxLen; i++) {
      const p53 = list53[i] || list53[i % (list53.length || 1)] || { id: 'missing', content: '(Chưa có Câu 53)', type: 'TOPIK_53' }
      const p54 = list54[i] || list54[i % (list54.length || 1)] || { id: 'missing', content: '(Chưa có Câu 54)', type: 'TOPIK_54' }
      const isExact = i < list53.length && i < list54.length

      pairs.push({
        id: i + 1,
        title: `Bộ đề TOPIK II #${i + 1}`,
        isExact,
        deficitSide: i >= list53.length ? ('left' as const) : i >= list54.length ? ('right' as const) : null,
        part1: p53,
        part2: p54,
        part1Index: i < list53.length ? i + 1 : (i % (list53.length || 1)) + 1,
        part2Index: i < list54.length ? i + 1 : (i % (list54.length || 1)) + 1
      })
    }

    return {
      leftTitle: `Câu 53 Biểu đồ (${list53.length} đề)`,
      leftType: 'TOPIK_53',
      leftCount: list53.length,
      rightTitle: `Câu 54 Nghị luận (${list54.length} đề)`,
      rightType: 'TOPIK_54',
      rightCount: list54.length,
      pairs,
      deficit: Math.abs(list53.length - list54.length),
      deficitSide: list53.length < list54.length ? 'left' : list53.length > list54.length ? 'right' : 'none',
      exactCount: Math.min(list53.length, list54.length),
      totalSets: maxLen,
      extraInfo: `(Kho Câu 51: ${list51.length} đề | Câu 52: ${list52.length} đề)`
    }
  }, [prompts, selectedExam])

  // Filtered pairs
  const filteredPairs = useMemo(() => {
    return relationsData.pairs.filter(pair => {
      // Search
      const matchesSearch =
        !searchTerm.trim() ||
        pair.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pair.part1.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pair.part2.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pair.part1.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pair.part2.id.toLowerCase().includes(searchTerm.toLowerCase())

      if (!matchesSearch) return false

      if (filterMode === 'exact') return pair.isExact
      if (filterMode === 'deficit') return !pair.isExact
      return true
    })
  }, [relationsData, searchTerm, filterMode])

  // Open quick add for deficient side
  const openAddForDeficit = () => {
    if (relationsData.deficitSide === 'left') {
      setAddPromptType(relationsData.leftType)
    } else if (relationsData.deficitSide === 'right') {
      setAddPromptType(relationsData.rightType)
    } else {
      setAddPromptType(relationsData.leftType)
    }
    setShowAddModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Link2 size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">
                Quan Hệ Bộ Đề Ghép Cặp (Full Test 1+2)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Kiểm soát đề nào đang nối với đề nào khi người dùng thi trọn bộ và phát hiện bên kho đề đang bị thiếu.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadPrompts}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Làm mới
          </button>

          <button
            onClick={() => {
              setAddPromptType(relationsData.leftType)
              setShowAddModal(true)
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
          >
            <Plus size={14} />
            Thêm Đề Mới
          </button>
        </div>
      </div>

      {/* Exam Category Switcher */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {(['IELTS', 'TOEIC', 'TOPIK', 'HSK'] as ExamCategory[]).map(cat => {
          const isSelected = selectedExam === cat

          // Quick deficit calc for badge
          let count1 = 0
          let count2 = 0
          if (cat === 'IELTS') {
            count1 = prompts.filter(p => p.type === 'IELTS_TASK_1').length
            count2 = prompts.filter(p => p.type === 'IELTS_TASK_2').length
          } else if (cat === 'TOEIC') {
            count1 = prompts.filter(p => p.type === 'TOEIC_RESPOND').length
            count2 = prompts.filter(p => p.type === 'TOEIC_ESSAY').length
          } else if (cat === 'HSK') {
            count1 = prompts.filter(p => p.type === 'HSK_5').length
            count2 = prompts.filter(p => p.type === 'HSK_6').length
          } else {
            count1 = prompts.filter(p => p.type === 'TOPIK_53').length
            count2 = prompts.filter(p => p.type === 'TOPIK_54').length
          }
          const hasDeficit = count1 !== count2

          return (
            <button
              key={cat}
              onClick={() => setSelectedExam(cat)}
              className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-extrabold text-sm">{cat} Writing</span>
                {cat === 'HSK' ? (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    isSelected ? 'bg-sky-400 text-sky-950' : 'bg-sky-100 text-sky-800'
                  }`}>
                    Độc lập (Không ghép)
                  </span>
                ) : hasDeficit ? (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    isSelected ? 'bg-amber-400 text-amber-950' : 'bg-amber-100 text-amber-800'
                  }`}>
                    Lệch {Math.abs(count1 - count2)} đề
                  </span>
                ) : (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    isSelected ? 'bg-emerald-400 text-emerald-950' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    Đủ cặp
                  </span>
                )}
              </div>
              <div className={`text-xs ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                {cat === 'IELTS' && `Task 1 (${count1}) ↔ Task 2 (${count2})`}
                {cat === 'TOEIC' && `Part 1 (${count1}) ↔ Part 2 (${count2})`}
                {cat === 'HSK' && `HSK 5 (${count1}) | HSK 6 (${count2}) - Độc lập`}
                {cat === 'TOPIK' && `Câu 53 (${count1}) ↔ Câu 54 (${count2})`}
              </div>
            </button>
          )
        })}
      </div>

      {selectedExam === 'HSK' ? (
        <div className="space-y-6">
          {/* Explanatory Banner for HSK Independence */}
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg shrink-0 mt-0.5">
              <Info size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-blue-900">
                Quy Chế Độc Lập: HSK 5 và HSK 6 là 2 cấp độ độc lập (Không ghép cặp)
              </h4>
              <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                • <strong>HSK 5 (Writing Q91–100)</strong>: Là một kỳ thi độc lập hoàn chỉnh gồm 3 phần (8 câu sắp xếp từ 91-98, viết 5 từ khóa câu 99, viết theo tranh câu 100). Đề thi tự chứa trọn bộ cả 3 phần.<br />
                • <strong>HSK 6 (Tóm tắt 1000 chữ)</strong>: Là kỳ thi cấp độ cao nhất độc lập, yêu cầu đọc bài 1.000 chữ Hán và viết bản tóm tắt 400 chữ.<br />
                Hai cấp độ này hoàn toàn độc lập, thí sinh thi riêng từng cấp độ và hệ thống <strong>tuyệt đối không ghép cặp chéo</strong>.
              </p>
            </div>
          </div>

          {/* Quick Analytics Cards for HSK */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wide">
                  HSK 5 (Writing Q91-100)
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md">
                  Mã: HSK_5
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-blue-900">{hsk5Prompts.length}</span>
                <span className="text-xs font-semibold text-blue-700">đề thi hoàn chỉnh</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">Gồm trọn bộ 3 phần (10 câu)</p>
            </div>

            <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-indigo-800 uppercase tracking-wide block mb-1">
                  Trạng Thái Vận Hành
                </span>
                <span className="text-base font-extrabold text-indigo-900 flex items-center gap-1.5 mt-1">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  Độc Lập Từng Cấp Độ
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  Không ghép cặp, không phát sinh lệch đề
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-purple-800 uppercase tracking-wide">
                  HSK 6 (Tóm tắt 1000 chữ)
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 bg-purple-100 text-purple-700 rounded-md">
                  Mã: HSK_6
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-purple-900">{hsk6Prompts.length}</span>
                <span className="text-xs font-semibold text-purple-700">đề thi trong kho</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">Bài đọc tóm tắt ~1.000 chữ Hán</p>
            </div>
          </div>

          {/* Two Independent Columns for HSK 5 and HSK 6 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* HSK 5 Column */}
            <div className="border border-slate-200 rounded-xl bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  <h3 className="font-extrabold text-sm text-slate-800">Kho Đề Thi HSK 5</h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-100">
                    {hsk5Prompts.length} đề
                  </span>
                </div>
                <button
                  onClick={() => {
                    setAddPromptType('HSK_5')
                    setShowAddModal(true)
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
                >
                  <Plus size={14} /> Thêm HSK 5
                </button>
              </div>

              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                {hsk5Prompts.length === 0 ? (
                  <p className="text-xs text-slate-400 py-12 text-center">Chưa có đề HSK 5 nào trong kho.</p>
                ) : (
                  hsk5Prompts.map((p, idx) => {
                    let title = `Đề HSK 5 #${idx + 1}`
                    try {
                      const parsed = JSON.parse(p.content)
                      if (parsed.title) title = parsed.title
                    } catch {}
                    return (
                      <div key={p.id} className="p-3 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors bg-slate-50/60 flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-blue-800">#{idx + 1} {title}</span>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {p.id.slice(0, 8)}...</span>
                            {p.imageUrl && (
                              <span className="text-[10px] text-blue-600 font-bold bg-blue-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <ImageIcon size={10} /> Có ảnh
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {p.content}
                          </p>
                        </div>
                        <button
                          onClick={() => setPreviewSinglePrompt(p)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shrink-0"
                          title="Xem chi tiết đề"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* HSK 6 Column */}
            <div className="border border-slate-200 rounded-xl bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                  <h3 className="font-extrabold text-sm text-slate-800">Kho Đề Thi HSK 6</h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-100">
                    {hsk6Prompts.length} đề
                  </span>
                </div>
                <button
                  onClick={() => {
                    setAddPromptType('HSK_6')
                    setShowAddModal(true)
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition-colors"
                >
                  <Plus size={14} /> Thêm HSK 6
                </button>
              </div>

              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                {hsk6Prompts.length === 0 ? (
                  <p className="text-xs text-slate-400 py-12 text-center">Chưa có đề HSK 6 nào trong kho.</p>
                ) : (
                  hsk6Prompts.map((p, idx) => (
                    <div key={p.id} className="p-3 rounded-xl border border-slate-200 hover:border-purple-300 transition-colors bg-slate-50/60 flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-purple-800">Đề HSK 6 #{idx + 1}</span>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {p.id.slice(0, 8)}...</span>
                          <span className="text-[10px] text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded font-bold">
                            {(p.content.match(/[\u4e00-\u9fff]/g) || []).length} chữ Hán
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {p.content}
                        </p>
                      </div>
                      <button
                        onClick={() => setPreviewSinglePrompt(p)}
                        className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors shrink-0"
                        title="Xem chi tiết đề"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Deficit Alert Banner & Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card Left Side */}
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wide">
                  {relationsData.leftTitle}
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md">
                  Mã: {relationsData.leftType}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-blue-900">{relationsData.leftCount}</span>
                <span className="text-xs font-semibold text-blue-700">đề thi trong kho</span>
              </div>
              {relationsData.deficitSide === 'left' && (
                <p className="text-xs text-rose-600 font-bold mt-2 flex items-center gap-1">
                  <AlertTriangle size={13} />
                  Đang THIẾU {relationsData.deficit} đề để ghép chuẩn 1-1
                </p>
              )}
            </div>

            {/* Pairing Status Card */}
            <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-indigo-800 uppercase tracking-wide">
                    Trạng Thái Ghép Cặp
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md">
                    Tổng: {relationsData.totalSets} Bộ
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-2xl font-black text-emerald-600">{relationsData.exactCount}</span>
                    <span className="text-xs font-bold text-emerald-800 block">Ghép chuẩn 1-1</span>
                  </div>
                  <div className="h-8 w-px bg-indigo-200" />
                  <div>
                    <span className="text-2xl font-black text-amber-600">{relationsData.deficit}</span>
                    <span className="text-xs font-bold text-amber-800 block">Ghép lặp do thiếu</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full"
                  style={{
                    width: `${relationsData.totalSets > 0 ? (relationsData.exactCount / relationsData.totalSets) * 100 : 0}%`
                  }}
                  title="Tỉ lệ ghép chuẩn 1-1"
                />
                <div
                  className="bg-amber-400 h-full"
                  style={{
                    width: `${relationsData.totalSets > 0 ? (relationsData.deficit / relationsData.totalSets) * 100 : 0}%`
                  }}
                  title="Tỉ lệ ghép bù lặp lại"
                />
              </div>
            </div>

            {/* Card Right Side */}
            <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-purple-800 uppercase tracking-wide">
                  {relationsData.rightTitle}
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 bg-purple-100 text-purple-700 rounded-md">
                  Mã: {relationsData.rightType}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-purple-900">{relationsData.rightCount}</span>
                <span className="text-xs font-semibold text-purple-700">đề thi trong kho</span>
              </div>
              {relationsData.deficitSide === 'right' && (
                <p className="text-xs text-rose-600 font-bold mt-2 flex items-center gap-1">
                  <AlertTriangle size={13} />
                  Đang THIẾU {relationsData.deficit} đề để ghép chuẩn 1-1
                </p>
              )}
            </div>
          </div>

          {/* Prominent Action Banner for Deficit */}
          {relationsData.deficitSide !== 'none' && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0 mt-0.5 sm:mt-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-900">
                    Kho đề chưa cân bằng: Bên {relationsData.deficitSide === 'left' ? relationsData.leftTitle : relationsData.rightTitle} đang thiếu {relationsData.deficit} đề!
                  </h4>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Khi học viên làm bài thi trọn bộ, từ bộ đề #{relationsData.exactCount + 1} đến #{relationsData.totalSets}, hệ thống sẽ phải lấy lặp ngẫu nhiên đề bên thiếu để ghép cặp.
                  </p>
                </div>
              </div>

              <button
                onClick={openAddForDeficit}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 whitespace-nowrap"
              >
                <Plus size={14} />
                Bổ sung thêm {relationsData.deficitSide === 'left' ? relationsData.leftTitle : relationsData.rightTitle}
              </button>
            </div>
          )}

          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterMode === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả ({relationsData.pairs.length})
              </button>
              <button
                onClick={() => setFilterMode('exact')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterMode === 'exact' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ghép chuẩn 1-1 ({relationsData.exactCount})
              </button>
              <button
                onClick={() => setFilterMode('deficit')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterMode === 'deficit' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ghép bù do thiếu ({relationsData.deficit})
              </button>
            </div>

            <div className="relative w-full sm:w-72">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo nội dung đề hoặc ID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
              />
            </div>
          </div>

          {/* Pairing Table / Matrix */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4 w-20">Bộ Đề</th>
                    <th className="py-3 px-4 w-[42%]">{relationsData.leftTitle}</th>
                    <th className="py-3 px-2 text-center w-16">Nối</th>
                    <th className="py-3 px-4 w-[42%]">{relationsData.rightTitle}</th>
                    <th className="py-3 px-4 text-center w-20">Xem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500">
                        <Loader2 size={24} className="animate-spin text-indigo-600 mx-auto mb-2" />
                        Đang tải dữ liệu quan hệ bộ đề...
                      </td>
                    </tr>
                  ) : filteredPairs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500">
                        Không tìm thấy bộ đề nào phù hợp với bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredPairs.map(p => (
                      <tr
                        key={p.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          !p.isExact ? 'bg-amber-50/30' : ''
                        }`}
                      >
                        {/* Set Number */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700 whitespace-nowrap">
                          <span className="px-2 py-1 bg-slate-100 rounded text-slate-800 text-[11px]">
                            #{p.id}
                          </span>
                        </td>

                        {/* Left Prompt */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                ID: {p.part1.id.slice(0, 8)}...
                              </span>
                              {p.part1.imageUrl && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                  <ImageIcon size={10} /> Có ảnh
                                </span>
                              )}
                              {p.deficitSide === 'left' ? (
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                                  Lặp lại đề #{p.part1Index} (do thiếu đề)
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                  Đề độc lập #{p.part1Index}
                                </span>
                              )}
                            </div>
                            <p className="text-slate-800 line-clamp-2 leading-relaxed">
                              {p.part1.content}
                            </p>
                          </div>
                        </td>

                        {/* Pairing Link Icon */}
                        <td className="py-3.5 px-2 text-center align-middle">
                          {p.isExact ? (
                            <div
                              className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto"
                              title="Ghép chuẩn 1-1 độc lập"
                            >
                              <Link2 size={16} />
                            </div>
                          ) : (
                            <div
                              className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto"
                              title={`Ghép bù do thiếu bên ${p.deficitSide === 'left' ? 'trái' : 'phải'}`}
                            >
                              <ArrowRightLeft size={14} />
                            </div>
                          )}
                        </td>

                        {/* Right Prompt */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                ID: {p.part2.id.slice(0, 8)}...
                              </span>
                              {p.part2.imageUrl && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                  <ImageIcon size={10} /> Có ảnh
                                </span>
                              )}
                              {p.deficitSide === 'right' ? (
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                                  Lặp lại đề #{p.part2Index} (do thiếu đề)
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                  Đề độc lập #{p.part2Index}
                                </span>
                              )}
                            </div>
                            <p className="text-slate-800 line-clamp-2 leading-relaxed">
                              {p.part2.content}
                            </p>
                          </div>
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 text-center align-middle">
                          <button
                            onClick={() => setPreviewSet(p)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Xem chi tiết bộ đề này"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Preview Modal for Paired Set */}
      {previewSet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-indigo-600 text-white font-black text-xs rounded-lg">
                  Bộ #{previewSet.id}
                </span>
                <h3 className="font-extrabold text-slate-800 text-base">
                  Chi Tiết Bộ Đề Ghép Cặp {selectedExam}
                </h3>
                {previewSet.isExact ? (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 size={12} /> Ghép 1-1 Chuẩn
                  </span>
                ) : (
                  <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertTriangle size={12} /> Ghép Bù Do Thiếu Đề Bên {previewSet.deficitSide === 'left' ? 'Trái' : 'Phải'}
                  </span>
                )}
              </div>
              <button
                onClick={() => setPreviewSet(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content - Side by Side Comparison */}
            <div className="p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-5 flex-1">
              {/* Part 1 Box */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
                  <span className="font-bold text-xs text-blue-700">
                    Phần 1: {relationsData.leftTitle}
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">
                    ID: {previewSet.part1.id}
                  </span>
                </div>
                {previewSet.part1.imageUrl && (
                  <div className="mb-3 rounded-lg overflow-hidden border border-slate-200 max-h-48 flex items-center justify-center bg-white">
                    <img
                      src={previewSet.part1.imageUrl}
                      alt="Prompt visual"
                      className="max-h-48 object-contain"
                    />
                  </div>
                )}
                <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap flex-1 bg-white p-3 rounded-lg border border-slate-100">
                  {previewSet.part1.content}
                </div>
              </div>

              {/* Part 2 Box */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
                  <span className="font-bold text-xs text-purple-700">
                    Phần 2: {relationsData.rightTitle}
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">
                    ID: {previewSet.part2.id}
                  </span>
                </div>
                {previewSet.part2.imageUrl && (
                  <div className="mb-3 rounded-lg overflow-hidden border border-slate-200 max-h-48 flex items-center justify-center bg-white">
                    <img
                      src={previewSet.part2.imageUrl}
                      alt="Prompt visual"
                      className="max-h-48 object-contain"
                    />
                  </div>
                )}
                <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap flex-1 bg-white p-3 rounded-lg border border-slate-100">
                  {previewSet.part2.content}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setPreviewSet(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal for Single Prompt (HSK) */}
      {previewSinglePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-blue-600 text-white font-bold text-xs rounded-lg">
                  {previewSinglePrompt.type}
                </span>
                <h3 className="font-extrabold text-slate-800 text-sm">
                  Chi Tiết Đề Thi (Độc Lập)
                </h3>
              </div>
              <button
                onClick={() => setPreviewSinglePrompt(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-3">
              <div className="text-xs text-slate-500 font-mono">
                ID: {previewSinglePrompt.id}
              </div>
              {previewSinglePrompt.imageUrl && (
                <div className="rounded-lg overflow-hidden border border-slate-200 p-2 bg-slate-50 flex justify-center">
                  <img src={previewSinglePrompt.imageUrl} alt="Prompt Visual" className="max-h-64 object-contain" />
                </div>
              )}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
                {previewSinglePrompt.content}
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setPreviewSinglePrompt(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Prompt Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Plus size={16} className="text-indigo-600" />
                Thêm Đề Mới Vào Kho Để Ghép Cặp
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleQuickAdd} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Loại đề thi
                </label>
                <select
                  value={addPromptType}
                  onChange={e => setAddPromptType(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-semibold bg-white"
                >
                  <optgroup label="IELTS Writing">
                    <option value="IELTS_TASK_1">IELTS Task 1 (Report/Biểu đồ)</option>
                    <option value="IELTS_TASK_2">IELTS Task 2 (Essay)</option>
                  </optgroup>
                  <optgroup label="TOEIC Writing">
                    <option value="TOEIC_RESPOND">TOEIC Part 1: Email (Q6-7)</option>
                    <option value="TOEIC_ESSAY">TOEIC Part 2: Essay (Q8)</option>
                  </optgroup>
                  <optgroup label="TOPIK Writing">
                    <option value="TOPIK_51">TOPIK Câu 51</option>
                    <option value="TOPIK_52">TOPIK Câu 52</option>
                    <option value="TOPIK_53">TOPIK Câu 53 (Biểu đồ)</option>
                    <option value="TOPIK_54">TOPIK Câu 54 (Nghị luận)</option>
                  </optgroup>
                  <optgroup label="HSK Writing">
                    <option value="HSK_5">HSK 5 (Writing)</option>
                    <option value="HSK_6">HSK 6 (Tóm tắt)</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nội dung đề thi
                </label>
                <textarea
                  rows={6}
                  value={addContent}
                  onChange={e => setAddContent(e.target.value)}
                  placeholder="Nhập nội dung đề bài tại đây..."
                  required
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  URL ảnh minh họa (Tùy chọn, dùng cho Task 1 / Câu 53)
                </label>
                <input
                  type="text"
                  value={addImageUrl}
                  onChange={e => setAddImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Lưu Đề Mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
