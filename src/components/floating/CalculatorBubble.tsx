'use client'

import { FloatingToolPanel } from './FloatingToolPanel'
import React, { useState, useEffect } from 'react'
import { X, History, Trash2, RotateCcw, Copy, Check } from 'lucide-react'
import * as math from 'mathjs'

interface CalculationItem {
  id: string
  expr: string
  result: string
  timestamp: number
}

const STORAGE_KEY = 'vndocs_calc_history'

export function CalculatorBubble({ onClose }: { onClose: () => void }) {
  const [expression, setExpression] = useState('')
  const [displayExpr, setDisplayExpr] = useState('')
  const [result, setResult] = useState('')
  const [isShift, setIsShift] = useState(false)
  const [isAlpha, setIsAlpha] = useState(false)
  const [angleMode, setAngleMode] = useState<'DEG' | 'RAD'>('DEG')
  const [isFractionView, setIsFractionView] = useState(false)
  const [lastAns, setLastAns] = useState('0')
  
  const [history, setHistory] = useState<CalculationItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setHistory(JSON.parse(saved))
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  // Save history
  const saveToHistory = (expr: string, res: string) => {
    if (!expr || !res || res === 'Math ERROR' || res === 'Syntax ERROR') return
    const newItem: CalculationItem = {
      id: Date.now().toString(),
      expr,
      result: res,
      timestamp: Date.now()
    }
    const updated = [newItem, ...history.slice(0, 49)]
    setHistory(updated)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch (e) {
      console.error(e)
    }
  }

  const clearHistory = () => {
    if (confirm('Bạn có chắc muốn xóa toàn bộ lịch sử tính toán?')) {
      setHistory([])
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  // Calculate with mathjs supporting DEG/RAD and authentic Casio operators
  const handleCalculate = (expr: string) => {
    try {
      if (!expr.trim()) return ''
      
      let parsed = expr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/π/g, 'pi')
        .replace(/Ans/g, lastAns || '0')
        .replace(/²/g, '^2')
        .replace(/³/g, '^3')
        .replace(/√\(/g, 'sqrt(')
        .replace(/(\d+)%/g, '($1/100)')

      // Handle trig with DEG mode (sinh học sinh thường tính góc độ sin(30) = 0.5)
      if (angleMode === 'DEG') {
        parsed = parsed
          .replace(/sin\(([^)]+)\)/g, 'sin(($1) deg)')
          .replace(/cos\(([^)]+)\)/g, 'cos(($1) deg)')
          .replace(/tan\(([^)]+)\)/g, 'tan(($1) deg)')
      }

      const evaluated = math.evaluate(parsed)
      if (typeof evaluated === 'undefined' || evaluated === null) return ''
      
      // Format number nicely
      const formatted = math.format(evaluated, { precision: 10 })
      return String(formatted)
    } catch (e) {
      return 'Math ERROR'
    }
  }

  const onBtnClick = (val: string, disp: string) => {
    if (val === 'AC') {
      setExpression('')
      setDisplayExpr('')
      setResult('')
      setIsShift(false)
      setIsAlpha(false)
      setIsFractionView(false)
      return
    }

    if (val === 'DEL') {
      setExpression(prev => prev.slice(0, -1))
      setDisplayExpr(prev => prev.slice(0, -1))
      setIsFractionView(false)
      return
    }

    if (val === '=') {
      if (!expression) return
      const res = handleCalculate(expression)
      setResult(res)
      if (res && res !== 'Math ERROR') {
        setLastAns(res)
        saveToHistory(displayExpr || expression, res)
      }
      return
    }

    if (val === 'SHIFT') {
      setIsShift(prev => !prev)
      return
    }

    if (val === 'ALPHA') {
      setIsAlpha(prev => !prev)
      return
    }

    if (val === 'SD') {
      // Chuyển đổi giữa số thập phân và phân số S<=>D
      if (!result || result === 'Math ERROR') return
      try {
        if (!isFractionView) {
          const num = parseFloat(result)
          if (!isNaN(num)) {
            const frac = math.fraction(num) as any
            if (frac.d !== 1) {
              setResult(`${frac.s < 0 ? '-' : ''}${frac.n}/${frac.d}`)
              setIsFractionView(true)
              return
            }
          }
        } else {
          const evaluated = math.evaluate(result)
          setResult(String(evaluated))
          setIsFractionView(false)
          return
        }
      } catch (e) {
        // ignore
      }
      return
    }

    // Append to expression
    setExpression(prev => prev + val)
    setDisplayExpr(prev => prev + disp)
    setIsShift(false)
    setIsAlpha(false)
    setIsFractionView(false)
  }

  const copyResult = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const applyHistoryItem = (item: CalculationItem) => {
    setExpression(item.result)
    setDisplayExpr(item.result)
    setResult('')
    setShowHistory(false)
  }

  return (
    <FloatingToolPanel title="Máy tính khoa học" onClose={onClose}>
      
      {/* Header Casio */}
      <div className="px-4 py-3.5 bg-white border-b border-slate-100 flex justify-between items-center">
        <div className="min-w-0"><h3 className="text-sm font-semibold text-slate-800">Máy tính khoa học</h3><p className="mt-0.5 text-[10px] text-slate-400">Tính nhanh · Lưu kết quả</p></div>

        <div className="flex items-center gap-1.5">
          {/* Nút chuyển chế độ Độ (DEG) / Radian (RAD) */}
          <button
            type="button"
            onClick={() => setAngleMode(prev => prev === 'DEG' ? 'RAD' : 'DEG')}
            className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 transition-colors"
            title="Đổi chế độ góc: DEG (Độ) / RAD (Radian)"
          >
            {angleMode}
          </button>

          {/* Nút Lịch sử */}
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold ${
              showHistory ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
            title="Lịch sử tính toán"
          >
            <History size={15} />
            {history.length > 0 && (
              <span className="text-[9px] bg-indigo-500 px-1 py-0.1 rounded-full font-bold">
                {history.length}
              </span>
            )}
          </button>

          {/* Đóng */}
          <button
            type="button"
            onClick={onClose} aria-label="Đóng máy tính khoa học"
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={17} />
          </button>
        </div>
      </div>

      {/* Main Body */}
      {showHistory ? (
        <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden text-slate-700">
          <div className="p-3 bg-white border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <History size={14} className="text-blue-500" />
              Lịch sử tính toán ({history.length})
            </span>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-[11px] text-rose-400 hover:text-rose-600 font-semibold flex items-center gap-1 px-2 py-0.5 rounded hover:bg-rose-950/40 transition-colors"
              >
                <Trash2 size={12} />
                Xóa tất cả
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
            {history.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-6">
                <RotateCcw size={32} className="opacity-30 mb-2" />
                <p className="text-xs font-medium">Chưa có phép tính nào.</p>
                <p className="text-[11px] text-slate-500 mt-1">Bấm '=' để lưu kết quả vào lịch sử.</p>
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-3 rounded-xl border border-slate-200 hover:border-blue-200 transition-all shadow-xs"
                >
                  <div className="flex justify-between items-start text-xs text-slate-400 mb-1">
                    <span className="font-mono truncate max-w-[210px]">{item.expr}</span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(item.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold font-mono text-base text-blue-600">{item.result}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => copyResult(item.result, item.id)}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                        title="Sao chép kết quả"
                      >
                        {copiedId === item.id ? <Check size={14} className="text-blue-600" /> : <Copy size={14} />}
                      </button>
                      <button
                        onClick={() => applyHistoryItem(item)}
                        className="text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-2 py-0.5 rounded transition-colors"
                      >
                        Chèn
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto flex flex-col p-4 gap-3 bg-white">
          
          {/* Authentic Casio LCD Screen */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col justify-between h-24 font-mono text-slate-900">
            {/* Status indicators */}
            <div className="flex justify-between text-[10px] h-4 font-bold text-slate-700 select-none">
              <div className="flex gap-2">
                <span className={isShift ? 'text-amber-800 font-black' : 'opacity-20'}>S</span>
                <span className={isAlpha ? 'text-rose-800 font-black' : 'opacity-20'}>A</span>
                <span>{angleMode === 'DEG' ? 'D' : 'R'}</span>
                <span>Math</span>
              </div>
              <span className="text-[9px] opacity-60">VNDocs</span>
            </div>

            {/* Expression Row */}
            <div className="text-sm font-semibold text-right overflow-x-auto whitespace-nowrap no-scrollbar h-6 tracking-wide">
              {displayExpr || '0'}
            </div>

            {/* Result Row */}
            <div className="text-2xl font-black text-right overflow-x-auto whitespace-nowrap no-scrollbar h-8 tracking-wider">
              {result !== '' ? result : ''}
            </div>
          </div>

          {/* D-Pad & Control Row */}
          <div className="flex items-center justify-between px-1">
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => onBtnClick('SHIFT', '')}
                className={`w-11 h-7 rounded-lg text-[10px] font-bold shadow-md transition-all active:scale-95 ${
                  isShift ? 'bg-amber-400 text-slate-900' : 'bg-slate-100 text-amber-400 hover:bg-slate-200'
                }`}
              >
                SHIFT
              </button>
              <button 
                type="button"
                onClick={() => onBtnClick('ALPHA', '')}
                className={`w-11 h-7 rounded-lg text-[10px] font-bold shadow-md transition-all active:scale-95 ${
                  isAlpha ? 'bg-rose-400 text-white' : 'bg-slate-100 text-rose-400 hover:bg-slate-200'
                }`}
              >
                ALPHA
              </button>
            </div>

            {/* D-pad Oval Control */}
            <div className="w-18 h-8 rounded-full bg-slate-100 border border-slate-700 flex items-center justify-around shadow-inner px-2">
              <span className="text-[10px] text-slate-400 font-bold">◀</span>
              <span className="text-[10px] text-slate-400 font-bold">▲</span>
              <span className="text-[10px] text-slate-400 font-bold">▼</span>
              <span className="text-[10px] text-slate-400 font-bold">▶</span>
            </div>

            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => onBtnClick('OPTN', '')}
                className="w-11 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold shadow-md active:scale-95"
              >
                OPTN
              </button>
              <button 
                type="button"
                onClick={() => onBtnClick('AC', '')}
                className="w-11 h-7 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black shadow-md active:scale-95"
              >
                ON
              </button>
            </div>
          </div>

          {/* Scientific Keys Row 1: Phân số, căn, x2, x^, log, ln */}
          <div className="grid grid-cols-6 gap-1.5">
            <button onClick={() => onBtnClick('/', 'a/b')} className="casio-key">a/b</button>
            <button onClick={() => onBtnClick('√(', '√(')} className="casio-key">√</button>
            <button onClick={() => onBtnClick('²', '²')} className="casio-key">x²</button>
            <button onClick={() => onBtnClick('^', '^')} className="casio-key">x^■</button>
            <button onClick={() => onBtnClick('log10(', 'log(')} className="casio-key">log</button>
            <button onClick={() => onBtnClick('log(', 'ln(')} className="casio-key">ln</button>
          </div>

          {/* Scientific Keys Row 2: (-), x-1, sin, cos, tan, S<=>D */}
          <div className="grid grid-cols-6 gap-1.5">
            <button onClick={() => onBtnClick('(-', '(-')} className="casio-key">(-)</button>
            <button onClick={() => onBtnClick('^-1', '⁻¹')} className="casio-key">x⁻¹</button>
            <button onClick={() => onBtnClick('sin(', 'sin(')} className="casio-key">sin</button>
            <button onClick={() => onBtnClick('cos(', 'cos(')} className="casio-key">cos</button>
            <button onClick={() => onBtnClick('tan(', 'tan(')} className="casio-key">tan</button>
            <button onClick={() => onBtnClick('SD', '')} className="casio-key font-bold text-amber-700">S⇔D</button>
          </div>

          {/* Scientific Keys Row 3: (, ), STO, %, pi, e */}
          <div className="grid grid-cols-6 gap-1.5">
            <button onClick={() => onBtnClick('(', '(')} className="casio-key">(</button>
            <button onClick={() => onBtnClick(')', ')')} className="casio-key">)</button>
            <button onClick={() => onBtnClick('π', 'π')} className="casio-key">π</button>
            <button onClick={() => onBtnClick('e', 'e')} className="casio-key">e</button>
            <button onClick={() => onBtnClick('%', '%')} className="casio-key">%</button>
            <button onClick={() => onBtnClick('!', '!')} className="casio-key">x!</button>
          </div>

          {/* Main Casio Numpad (5 columns) */}
          <div className="grid grid-cols-5 gap-1.5 pt-1">
            {/* Row 1 */}
            <button onClick={() => onBtnClick('7', '7')} className="casio-num">7</button>
            <button onClick={() => onBtnClick('8', '8')} className="casio-num">8</button>
            <button onClick={() => onBtnClick('9', '9')} className="casio-num">9</button>
            <button onClick={() => onBtnClick('DEL', '')} className="casio-del">DEL</button>
            <button onClick={() => onBtnClick('AC', '')} className="casio-ac">AC</button>

            {/* Row 2 */}
            <button onClick={() => onBtnClick('4', '4')} className="casio-num">4</button>
            <button onClick={() => onBtnClick('5', '5')} className="casio-num">5</button>
            <button onClick={() => onBtnClick('6', '6')} className="casio-num">6</button>
            <button onClick={() => onBtnClick('×', '×')} className="casio-op">×</button>
            <button onClick={() => onBtnClick('÷', '÷')} className="casio-op">÷</button>

            {/* Row 3 */}
            <button onClick={() => onBtnClick('1', '1')} className="casio-num">1</button>
            <button onClick={() => onBtnClick('2', '2')} className="casio-num">2</button>
            <button onClick={() => onBtnClick('3', '3')} className="casio-num">3</button>
            <button onClick={() => onBtnClick('+', '+')} className="casio-op">+</button>
            <button onClick={() => onBtnClick('-', '-')} className="casio-op">-</button>

            {/* Row 4 */}
            <button onClick={() => onBtnClick('0', '0')} className="casio-num">0</button>
            <button onClick={() => onBtnClick('.', '.')} className="casio-num">.</button>
            <button onClick={() => onBtnClick('*10^', '×10^')} className="casio-num text-xs">×10ˣ</button>
            <button onClick={() => onBtnClick('Ans', 'Ans')} className="casio-op text-xs">Ans</button>
            <button onClick={() => onBtnClick('=', '')} className="casio-eq">=</button>
          </div>

        </div>
      )}

      {/* Tailwind helper style buttons inline */}
      <style jsx>{`
        .casio-key {
          height: 34px;
          border-radius: 6px;
          background-color: #dbeafe;
          color: #475569;
          font-size: 11px;
          font-weight: 600;
          border: 1px solid #e2e8f0;
          transition: all 0.1s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .casio-key:hover { background-color: #eff6ff; }
        .casio-key:active { transform: scale(0.95); }

        .casio-num {
          height: 44px;
          border-radius: 8px;
          background-color: #f8fafc;
          color: #0f172a;
          font-size: 16px;
          font-weight: 600;
          border: 1px solid #e2e8f0;
          transition: all 0.1s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .casio-num:hover { background-color: #e2e8f0; }
        .casio-num:active { transform: scale(0.95); }

        .casio-del {
          height: 44px;
          border-radius: 8px;
          background-color: #ea580c;
          color: white;
          font-size: 12px;
          font-weight: 600;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .casio-del:hover { background-color: #f97316; }
        .casio-del:active { transform: scale(0.95); }

        .casio-ac {
          height: 44px;
          border-radius: 8px;
          background-color: #dc2626;
          color: white;
          font-size: 12px;
          font-weight: 600;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .casio-ac:hover { background-color: #ef4444; }
        .casio-ac:active { transform: scale(0.95); }

        .casio-op {
          height: 44px;
          border-radius: 8px;
          background-color: #eff6ff;
          color: #2563eb;
          font-size: 15px;
          font-weight: 600;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .casio-op:hover { background-color: #dbeafe; }
        .casio-op:active { transform: scale(0.95); }

        .casio-eq {
          height: 44px;
          border-radius: 8px;
          background-color: #2563eb;
          color: white;
          font-size: 18px;
          font-weight: 600;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .casio-eq:hover { background-color: #1d4ed8; }
        .casio-eq:active { transform: scale(0.95); }
      `}</style>
    </FloatingToolPanel>
  )
}

