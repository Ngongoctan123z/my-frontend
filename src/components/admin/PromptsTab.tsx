import React, { useEffect, useState } from 'react'
import { TOEIC_PICTURE_SETS, parseToeicPictures, type ToeicPictureSet } from '@/src/data/toeicWriting'
import { Loader2, Plus, Trash2, Sparkles, Image, Check, FileText } from 'lucide-react'

export function PromptsTab() {
  const [prompts, setPrompts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [type, setType] = useState('IELTS_TASK_2')
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [adding, setAdding] = useState(false)
  const [pictures, setPictures] = useState<ToeicPictureSet>({title:'',questions:Array.from({length:5},(_,i)=>({id:i+1,imageUrl:'',keywords:['',''],description:''}))})

  // HSK 5 dedicated form state
  const [hsk5Mode, setHsk5Mode] = useState<'structured' | 'raw'>('structured')
  const [hsk5Title, setHsk5Title] = useState('')
  const [hsk5Part1, setHsk5Part1] = useState<string[]>([
    '', '', '', '', '', '', '', ''
  ])
  const [hsk5Part2Keywords, setHsk5Part2Keywords] = useState('')
  const [hsk5Part3Desc, setHsk5Part3Desc] = useState('')

  const fillHsk5Sample = (sampleNum: number) => {
    if (sampleNum === 1) {
      setHsk5Title('Đề thi HSK 5 - Đề mẫu chính thức 1 (Chinesetest)')
      setHsk5Part1([
        '去 / 打算 / 留学 / 明年 / 他 / 中国',
        '汉语水平 / 提高 / 他的 / 显著 / 得到了',
        '责任 / 对 / 每一个 / 我们 / 要 / 工作 / 负起',
        '被 / 经理 / 方案 / 这个 / 采纳了',
        '环境 / 这里的 / 适合 / 居住 / 非常',
        '他 / 充分 / 把 / 表达了 / 自己的 / 观点',
        '不仅 / 他 / 聪明 / 勤奋 / 而且 / 非常',
        '大家 / 给 / 深刻的 / 留下了 / 印象 / 这次旅行'
      ])
      setHsk5Part2Keywords('明确, 凭, 严肃, 规矩, 遵守')
      setImageUrl('https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80')
      setHsk5Part3Desc('一位年轻人在书桌前专心看书学习，桌上有电脑和笔记本。')
    } else {
      setHsk5Title('Đề thi HSK 5 - Đề mẫu chính thức 2 (Chinesetest)')
      setHsk5Part1([
        '产生 / 这部电影 / 巨大的 / 对观众 / 影响 / 了',
        '这道难题 / 独立 / 他 / 能够 / 解决',
        '保持 / 乐观的 / 应该 / 面对困难时 / 心态 / 我们',
        '被 / 彻底 / 误会 / 这个 / 消除了',
        '建议 / 大家 / 积极 / 提出了 / 很多',
        '把 / 整理 / 房间 / 一遍 / 重新 / 他',
        '越来越 / 交通 / 现代城市 / 发达 / 的',
        '引起 / 这一发现 / 广泛的 / 科学界 / 关注 / 在'
      ])
      setHsk5Part2Keywords('挑战, 勇气, 克服, 信心, 成功')
      setImageUrl('https://images.unsplash.com/photo-1577896851231-70ef18881754?w=600&auto=format&fit=crop&q=80')
      setHsk5Part3Desc('老师正在教室黑板前给学生讲课，学生们认真听讲。')
    }
  }

  const loadPrompts = () => {
    fetch('/api/admin?type=prompts')
      .then(res => res.json())
      .then(data => {
        setPrompts(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    loadPrompts()
  }, [])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const src = event.target?.result as string
      if (!src) return

      const img = new window.Image()
      img.onload = () => {
        const maxWidth = 600
        let { width, height } = img
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          // 0.6 quality jpeg produces ~15KB - 25KB, well below D1 100KB statement limit
          setImageUrl(canvas.toDataURL('image/jpeg', 0.6))
        } else {
          setImageUrl(src)
        }
      }
      img.onerror = () => setImageUrl(src)
      img.src = src
    }
    reader.readAsDataURL(file)
  }

  const handleAdd = async () => {
    let finalContent = content
    let finalImageUrl = imageUrl

    if (type === 'TOEIC_PICTURE') {
      finalContent = JSON.stringify(pictures)
      try { parseToeicPictures(finalContent) } catch(error: any) { alert(error.message); return }
      finalImageUrl = ''
    }

    if (type === 'HSK_5' && hsk5Mode === 'structured') {
      const part1Items = hsk5Part1.map((w, i) => ({ id: 91 + i, words: w.trim() })).filter(item => item.words)
      if (part1Items.length === 0) {
        alert('Vui lòng nhập ít nhất 1 câu cho phần 1 (Câu 91–98).')
        return
      }
      const keywords = hsk5Part2Keywords.split(/[,，\s]+/).map(k => k.trim()).filter(Boolean)
      if (keywords.length === 0) {
        alert('Vui lòng nhập từ khóa cho câu 99.')
        return
      }

      const payloadObj = {
        title: hsk5Title.trim() || 'Đề thi HSK 5',
        part1: part1Items,
        part2: {
          id: 99,
          keywords,
          requirement: '请结合这5个词语写一篇80字左右的短文。'
        },
        part3: {
          id: 100,
          imageUrl: finalImageUrl || '',
          description: hsk5Part3Desc.trim(),
          requirement: '请结合这张图片写一篇80字左右的短文。'
        }
      }
      finalContent = JSON.stringify(payloadObj)
    }

    if (!finalContent.trim()) {
      alert('Vui lòng điền nội dung đề thi.')
      return
    }

    setAdding(true)
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_prompt',
          payload: { type, content: finalContent, imageUrl: finalImageUrl }
        })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi lưu đề.')
      }
      alert('Đã lưu đề thi thành công vào hệ thống!')
      setContent('')
      setImageUrl('')
      setHsk5Title('')
      setHsk5Part1(['', '', '', '', '', '', '', ''])
      setHsk5Part2Keywords('')
      setHsk5Part3Desc('')
      loadPrompts()
    } catch (e: any) {
      alert(e.message || 'Lỗi khi lưu đề.')
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xoá đề này?')) return
    await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'delete_prompt',
        payload: { id }
      })
    })
    loadPrompts()
  }

  const handleCleanText = () => {
    setContent(prev => {
      return prev.replace(/([^\n])\n([^\n])/g, (match, p1, p2) => {
        if (/[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/.test(p1) && /[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/.test(p2)) {
          return p1 + p2;
        }
        return p1 + ' ' + p2;
      });
    });
  }

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Quản Lý Đề Writing (Thực Tế)</h2>
          <p className="text-sm text-slate-500">Quản lý kho đề thi IELTS, TOEIC, TOPIK và HSK (đầy đủ 3 phần 10 câu cho HSK 5).</p>
        </div>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-sm">
        <h3 className="font-bold text-base mb-4 text-slate-800 flex items-center gap-2">
          <Plus className="w-5 h-5 text-blue-600" /> Thêm đề mới
        </h3>
        
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-700">Loại đề</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full md:w-72 p-2.5 border border-gray-300 rounded-lg outline-none focus:border-blue-500 bg-white text-sm font-medium"
            >
              <option value="IELTS_TASK_1">IELTS Task 1</option>
              <option value="IELTS_TASK_2">IELTS Task 2</option>
              <option value="TOEIC_PICTURE">TOEIC Writing Câu 1–5 (theo ảnh)</option>
              <option value="TOEIC_RESPOND">TOEIC Writing Q6-7</option>
              <option value="TOEIC_ESSAY">TOEIC Writing Q8</option>
              <option value="TOPIK_51">TOPIK Câu 51 (Hoàn thành câu - 10đ)</option>
              <option value="TOPIK_52">TOPIK Câu 52 (Hoàn thành câu - 10đ)</option>
              <option value="TOPIK_53">TOPIK Câu 53 (Viết biểu đồ - 30đ)</option>
              <option value="TOPIK_54">TOPIK Câu 54 (Nghị luận xã hội - 50đ)</option>
              <option value="TOPIK_51_52">TOPIK Câu 51-52 (Cũ)</option>
              <option value="HSK_5">HSK 5 Writing (3 phần - 10 câu)</option>
              <option value="HSK_6">HSK 6 Writing (Tóm tắt 400 chữ)</option>
            </select>
          </div>

          {/* DÀNH RIÊNG CHO HSK 5 */}
          {type === 'TOEIC_PICTURE' ? <div className="space-y-4 rounded-xl border border-blue-100 bg-blue-50/30 p-4"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold">Bộ 5 câu viết theo ảnh</h3><button type="button" onClick={()=>setPictures(TOEIC_PICTURE_SETS[0])} className="shrink-0 rounded-lg border bg-white px-3 py-2 text-xs text-blue-600">Nạp mẫu</button></div><label className="block text-sm">Tên bộ đề<input value={pictures.title} onChange={e=>setPictures(previous=>({...previous,title:e.target.value}))} className="mt-1 w-full rounded-lg border p-2 text-sm"/></label>{pictures.questions.map((q,index)=><div key={q.id} className="space-y-3 rounded-lg border bg-white p-4"><p className="text-sm font-semibold">Câu {q.id}</p><label className="block text-xs">URL ảnh (HTTPS hoặc đường dẫn trong website)<input value={q.imageUrl} onChange={e=>setPictures(previous=>({...previous,questions:previous.questions.map((row,i)=>i===index?{...row,imageUrl:e.target.value}:row)}))} className="mt-1 w-full rounded-lg border p-2 text-sm"/></label><div className="grid grid-cols-2 gap-3">{q.keywords.map((word,keywordIndex)=><label key={keywordIndex} className="block text-xs">Từ / cụm từ {keywordIndex+1}<input value={word} onChange={e=>setPictures(previous=>({...previous,questions:previous.questions.map((row,i)=>i===index?{...row,keywords:row.keywords.map((w,k)=>k===keywordIndex?e.target.value:w) as [string,string]}:row)}))} className="mt-1 w-full rounded-lg border p-2 text-sm"/></label>)}</div><label className="block text-xs">Mô tả ảnh tham chiếu (tiếng Anh, dùng khi chấm)<textarea rows={3} value={q.description} onChange={e=>setPictures(previous=>({...previous,questions:previous.questions.map((row,i)=>i===index?{...row,description:e.target.value}:row)}))} className="mt-1 w-full rounded-lg border p-2 text-sm"/></label></div>)}<p className="text-xs leading-relaxed text-slate-500">Mô tả phải khớp ảnh thật. Học viên chỉ nhìn thấy ảnh và hai từ gợi ý; AI dùng mô tả tham chiếu để đối chiếu nội dung.</p></div> : type === 'HSK_5' ? (
            <div className="space-y-5 bg-red-50/40 p-5 rounded-xl border border-red-100">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-red-600 text-white font-bold text-xs rounded">HSK 5 书写</span>
                  <span className="text-xs font-semibold text-slate-600">Chuẩn 10 câu (Câu 91–100, 40 phút, 3 phần)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fillHsk5Sample(1)}
                    className="text-xs bg-white text-red-600 hover:bg-red-50 border border-red-200 px-2.5 py-1 rounded font-semibold transition-colors flex items-center gap-1 shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Nạp Mẫu 1 (Chinesetest)
                  </button>
                  <button
                    type="button"
                    onClick={() => fillHsk5Sample(2)}
                    className="text-xs bg-white text-red-600 hover:bg-red-50 border border-red-200 px-2.5 py-1 rounded font-semibold transition-colors flex items-center gap-1 shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Nạp Mẫu 2 (Chinesetest)
                  </button>
                  <button
                    type="button"
                    onClick={() => setHsk5Mode(hsk5Mode === 'structured' ? 'raw' : 'structured')}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded font-semibold transition-colors"
                  >
                    {hsk5Mode === 'structured' ? 'Chế độ JSON/Text' : 'Chế độ Form 3 phần'}
                  </button>
                </div>
              </div>

              {hsk5Mode === 'structured' ? (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Tên / Tiêu đề đề thi</label>
                    <input
                      type="text"
                      value={hsk5Title}
                      onChange={e => setHsk5Title(e.target.value)}
                      placeholder="Ví dụ: Đề thi HSK 5 - Đề số 1 (Năm 2024)"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm outline-none focus:border-red-500"
                    />
                  </div>

                  {/* PHẦN 1: CÂU 91 - 98 */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-800">
                        Phần 1: Sắp xếp từ thành câu (Câu 91–98, 8 câu)
                      </h4>
                      <span className="text-xs text-slate-400">Các từ/cụm từ xáo trộn phân cách bằng dấu /</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {hsk5Part1.map((val, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-xs font-bold text-red-700 w-16 shrink-0 bg-red-50 py-1.5 px-2 rounded border border-red-100 text-center">
                            Câu {91 + idx}
                          </span>
                          <input
                            type="text"
                            value={val}
                            onChange={e => {
                              const next = [...hsk5Part1]
                              next[idx] = e.target.value
                              setHsk5Part1(next)
                            }}
                            placeholder="Ví dụ: 去 / 打算 / 留学 / 明年 / 他 / 中国"
                            className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded text-sm outline-none focus:border-red-500 focus:bg-white"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PHẦN 2: CÂU 99 */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                    <h4 className="text-sm font-bold text-slate-800">
                      Phần 2: Viết đoạn theo 5 từ khóa (Câu 99, ~80 chữ)
                    </h4>
                    <p className="text-xs text-slate-500">Nhập 5 từ vựng, ngăn cách bằng dấu phẩy hoặc khoảng trắng:</p>
                    <input
                      type="text"
                      value={hsk5Part2Keywords}
                      onChange={e => setHsk5Part2Keywords(e.target.value)}
                      placeholder="Ví dụ: 明确, 凭, 严肃, 规矩, 遵守"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-sm outline-none focus:border-red-500 focus:bg-white"
                    />
                  </div>

                  {/* PHẦN 3: CÂU 100 */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="text-sm font-bold text-slate-800">
                      Phần 3: Viết đoạn theo tranh (Câu 100, ~80 chữ)
                    </h4>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Mô tả tranh (Gợi ý ngữ cảnh cho AI chấm):</label>
                      <input
                        type="text"
                        value={hsk5Part3Desc}
                        onChange={e => setHsk5Part3Desc(e.target.value)}
                        placeholder="Ví dụ: 一位年轻人坐在书桌前专心看书学习，桌上有电脑和笔记本。"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-sm outline-none focus:border-red-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Ảnh đề bài (URL hoặc tải file lên):</label>
                      <div className="flex flex-col gap-2">
                        <input
                          type="text"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          placeholder="https://... hoặc chọn file bên dưới"
                          className="w-full p-2 border border-gray-300 rounded outline-none focus:border-red-500 text-sm bg-white"
                        />
                        <div className="flex items-center gap-2 bg-gray-100 p-2 rounded border border-gray-200 w-fit">
                          <span className="text-xs text-gray-700 font-medium">Tải ảnh (dưới 800KB):</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleImageUpload}
                            className="text-xs file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 cursor-pointer"
                          />
                        </div>
                        {imageUrl && (
                          <div className="mt-2">
                            <img src={imageUrl} alt="Preview Câu 100" className="h-32 object-contain border border-gray-300 rounded bg-white shadow-sm" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-slate-700">JSON hoặc Nội dung đề thô</label>
                    <button 
                      onClick={handleCleanText}
                      className="text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded font-semibold transition-colors"
                    >
                      Làm gọn Text
                    </button>
                  </div>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Dán JSON cấu trúc đề HSK 5 vào đây..."
                    className="w-full h-40 p-3 border border-gray-300 rounded-lg outline-none focus:border-red-500 text-sm font-mono"
                  />
                </div>
              )}
            </div>
          ) : (
            <>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-700">Nội dung đề (Tiếng Anh / Hàn / Trung)</label>
                  <button 
                    onClick={handleCleanText}
                    className="text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded font-semibold transition-colors"
                    title="Sửa lỗi xuống dòng tự động khi copy từ file PDF"
                  >
                    Làm gọn Text (Dành cho copy PDF)
                  </button>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Nhập nội dung đề thi..."
                  className="w-full h-28 p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500 text-sm resize-none"
                />
              </div>

              {['IELTS_TASK_1', 'TOEIC_RESPOND', 'TOPIK_53', 'HSK_6'].includes(type) && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">Ảnh đính kèm (URL hoặc File - Tùy chọn)</label>
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/chart.png hoặc chọn file bên dưới..."
                      className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500 text-sm"
                    />
                    <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-lg border border-gray-200 w-fit">
                      <span className="text-sm text-gray-700 font-medium">Tải ảnh từ máy tính (Tối đa 800KB):</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload}
                        className="text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                      />
                    </div>
                    {imageUrl && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Ảnh xem trước:</p>
                        <img src={imageUrl} alt="Preview" className="h-40 object-contain border border-gray-300 rounded-lg bg-white shadow-sm" />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          <button
            onClick={handleAdd}
            disabled={adding}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 shadow-sm"
          >
            {adding ? <Loader2 className="animate-spin w-4 h-4" /> : <Plus className="w-4 h-4" />}
            Thêm đề vào hệ thống
          </button>
        </div>
      </div>

      <div>
        <h3 className="font-bold text-base mb-4 text-slate-800">Danh sách đề đã lưu ({prompts.length})</h3>
        <div className="space-y-4">
          {prompts.map(p => {
            let hsk5Parsed: any = null
            if (p.type === 'HSK_5') {
              try {
                hsk5Parsed = JSON.parse(p.content)
              } catch (e) {}
            }

            return (
              <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col md:flex-row justify-between gap-4 shadow-sm hover:border-slate-300 transition-colors">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded ${
                      p.type === 'HSK_5' ? 'bg-red-100 text-red-700' :
                      p.type.startsWith('TOPIK') ? 'bg-emerald-100 text-emerald-800' :
                      p.type === 'IELTS_TASK_1' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {p.type === 'HSK_5' ? 'HSK 5 (3 phần - 10 câu)' :
                       p.type === 'TOPIK_51' ? 'TOPIK Câu 51 (10đ)' :
                       p.type === 'TOPIK_52' ? 'TOPIK Câu 52 (10đ)' :
                       p.type === 'TOPIK_53' ? 'TOPIK Câu 53 (30đ)' :
                       p.type === 'TOPIK_54' ? 'TOPIK Câu 54 (50đ)' :
                       p.type.replace('_', ' ')}
                    </span>
                    {hsk5Parsed?.title && (
                      <span className="font-bold text-sm text-slate-800">{hsk5Parsed.title}</span>
                    )}
                  </div>

                  {hsk5Parsed ? (
                    <div className="space-y-2 text-sm text-slate-700 bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                      <div>
                        <span className="font-bold text-slate-800">Phần 1 (Câu 91–98): </span>
                        <span>{hsk5Parsed.part1?.length || 0} câu sắp xếp từ</span>
                      </div>
                      {hsk5Parsed.part2 && (
                        <div>
                          <span className="font-bold text-slate-800">Phần 2 (Câu 99): </span>
                          <span className="text-purple-700 font-semibold">
                            {Array.isArray(hsk5Parsed.part2.keywords) ? hsk5Parsed.part2.keywords.join(', ') : hsk5Parsed.part2.keywords}
                          </span>
                        </div>
                      )}
                      {hsk5Parsed.part3 && (
                        <div>
                          <span className="font-bold text-slate-800">Phần 3 (Câu 100): </span>
                          <span>{hsk5Parsed.part3.description || 'Viết đoạn theo tranh'}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-slate-800 whitespace-pre-wrap">{p.type === 'TOEIC_PICTURE' ? (()=>{try{return parseToeicPictures(p.content).title + ' · 5 ảnh, mỗi ảnh 2 từ gợi ý'}catch{return 'Bộ ảnh cần kiểm tra lại cấu trúc'}})() : p.content}</p>
                  )}

                  {(p.imageUrl || hsk5Parsed?.part3?.imageUrl) && (
                    <a href={p.imageUrl || hsk5Parsed?.part3?.imageUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold">
                      <Image className="w-3.5 h-3.5" /> Xem ảnh đính kèm
                    </a>
                  )}
                </div>

                <div className="flex md:flex-col justify-end items-end gap-2 shrink-0">
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors flex items-center gap-1 text-sm font-semibold"
                    title="Xoá đề"
                  >
                    <Trash2 className="w-4 h-4" /> Xóa
                  </button>
                </div>
              </div>
            )
          })}
          {prompts.length === 0 && <p className="text-gray-500 text-center py-8">Chưa có đề nào trong kho dữ liệu.</p>}
        </div>
      </div>
    </div>
  )
}
