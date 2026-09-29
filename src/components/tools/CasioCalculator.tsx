'use client'

import React, { useState } from 'react'
import { Calculator, LineChart } from 'lucide-react'

export function CasioCalculator() {
  const [mode, setMode] = useState<'scientific' | 'graphing'>('scientific')

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <div className="flex justify-center gap-4">
        <button
          onClick={() => setMode('scientific')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-sm ${
            mode === 'scientific'
              ? 'bg-blue-600 text-white shadow-blue-500/30 ring-2 ring-blue-600 ring-offset-2'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Calculator className="w-5 h-5" />
          Máy tính Khoa Học (Đầy đủ)
        </button>
        <button
          onClick={() => setMode('graphing')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-sm ${
            mode === 'graphing'
              ? 'bg-emerald-600 text-white shadow-emerald-500/30 ring-2 ring-emerald-600 ring-offset-2'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <LineChart className="w-5 h-5" />
          Máy tính Đồ Thị (Nâng cao)
        </button>
      </div>

      <div className="bg-white p-2 sm:p-4 rounded-2xl shadow-xl border border-slate-200">
        <div className="w-full h-[600px] rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
          <iframe
            src={mode === 'scientific' ? 'https://www.desmos.com/scientific' : 'https://www.desmos.com/calculator'}
            width="100%"
            height="100%"
            style={{ border: 'none' }}
            title={mode === 'scientific' ? 'Máy tính khoa học Desmos' : 'Máy tính đồ thị Desmos'}
            allow="clipboard-write"
          ></iframe>
        </div>
        <p className="text-center text-xs text-slate-400 mt-4">
          Cung cấp sức mạnh bởi Desmos Studio. Hỗ trợ giải phương trình, tích phân, lượng giác và đồ thị phức tạp.
        </p>
      </div>
    </div>
  )
}
