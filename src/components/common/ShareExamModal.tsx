import React, { useState } from 'react'
import { X, Copy, CheckCircle2, Loader2, Share2 } from 'lucide-react'
import { usePathname } from 'next/navigation'

interface ShareExamModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (requirePhone: boolean, requireEmail: boolean) => Promise<string | void>
}

export function ShareExamModal({ isOpen, onClose, onConfirm }: ShareExamModalProps) {
  const pathname = usePathname()
  const isEn = pathname.startsWith('/en')
  
  const [requirePhone, setRequirePhone] = useState(false)
  const [requireEmail, setRequireEmail] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [link, setLink] = useState('')
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleCreate = async () => {
    setIsCreating(true)
    try {
      const generatedLink = await onConfirm(requirePhone, requireEmail)
      if (generatedLink) {
        setLink(generatedLink)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsCreating(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-600" /> {isEn ? 'Share Exam' : 'Chia sẻ đề thi'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {!link ? (
            <>
              <div>
                <p className="text-sm font-medium text-slate-700 mb-3">{isEn ? 'Request information from test taker:' : 'Yêu cầu thông tin từ người làm:'}</p>
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={requirePhone}
                      onChange={(e) => setRequirePhone(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">{isEn ? 'Require Phone Number' : 'Yêu cầu nhập Số điện thoại'}</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={requireEmail}
                      onChange={(e) => setRequireEmail(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">{isEn ? 'Require Email' : 'Yêu cầu nhập Email'}</span>
                  </label>
                </div>
              </div>

              <button
                onClick={handleCreate}
                disabled={isCreating}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex justify-center items-center gap-2 transition-colors disabled:opacity-50"
              >
                {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : (isEn ? 'Create New Link (24h validity)' : 'Tạo Link Mới (Có hạn 24h)')}
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm text-center font-medium">
                {isEn ? 'Link created successfully! Valid for 24 hours.' : 'Tạo link thành công! Link có hiệu lực trong vòng 24 giờ.'}
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={link} 
                  className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 outline-none"
                />
                <button 
                  onClick={copyToClipboard}
                  className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shrink-0"
                >
                  {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
