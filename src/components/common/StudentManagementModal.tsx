import React from 'react'
import { X, ChevronDown, ChevronUp } from 'lucide-react'

interface StudentManagementModalProps {
  isOpen: boolean
  onClose: () => void
  loading: boolean
  studentsData: any[]
  expandedStudentId: string | null
  setExpandedStudentId: (id: string | null) => void
  examTypePrefix: string
}

export function StudentManagementModal({ 
  isOpen, 
  onClose, 
  loading, 
  studentsData, 
  expandedStudentId, 
  setExpandedStudentId,
  examTypePrefix
}: StudentManagementModalProps) {
  if (!isOpen) return null
  
  const filteredData = studentsData.filter(s => s.exam.examType.startsWith(examTypePrefix))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] shadow-xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg text-slate-800">Lịch sử bài làm học viên</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Đang tải dữ liệu...</div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Chưa có bài làm nào từ học viên cho phần thi này.</div>
          ) : (
            <div className="space-y-4">
              {filteredData.map((submission) => {
                const isExpanded = expandedStudentId === submission.id
                let resultObj = null
                try {
                  resultObj = JSON.parse(submission.gradingResult)
                } catch(e) {}
                
                return (
                  <div key={submission.id} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div 
                      className="bg-gray-50 p-4 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => setExpandedStudentId(isExpanded ? null : submission.id)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-bold text-slate-800">{submission.studentName}</h4>
                          <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold">
                            Band: {resultObj?.overallBand ?? resultObj?.overall_band ?? resultObj?.total_score ?? '?'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-4">
                          {submission.studentPhone && <span>SĐT: {submission.studentPhone}</span>}
                          {submission.studentEmail && <span>Email: {submission.studentEmail}</span>}
                          <span>TG nộp: {new Date(submission.createdAt).toLocaleString('vi-VN')}</span>
                        </div>
                      </div>
                      <div>
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="p-4 border-t border-gray-200 bg-white space-y-4">
                        <div>
                          <p className="text-sm font-bold text-slate-700 mb-2">Đề bài:</p>
                          <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
                            {submission.exam.content}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700 mb-2">Bài làm:</p>
                          <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
                            {submission.studentEssay}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700 mb-2">Nhận xét chi tiết:</p>
                          <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-900 whitespace-pre-wrap">
                            {resultObj?.detailedFeedback || resultObj?.feedback || JSON.stringify(resultObj, null, 2)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
