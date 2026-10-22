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
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) setHistory(parsed.filter(item=>item && typeof item.expr==='string' && typeof item.result==='string').slice(0,50))
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
    if (expression.length + val.length > 256) return
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

  const scientific = [
    ['a/b','/','/'], ['√','√(','√('], ['x²','²','²'], ['xʸ','^','^'], ['log','log10(','log('], ['ln','log(','ln('],
    ['(−)','(-','(-'], ['x⁻¹','^-1','⁻¹'], ['sin','sin(','sin('], ['cos','cos(','cos('], ['tan','tan(','tan('], ['S⇔D','SD',''],
    ['(','(','('], [')',')',')'], ['π','π','π'], ['e','e','e'], ['%','%','%'], ['x!','!','!'],
  ]
  const keypad = ['7','8','9','DEL','AC','4','5','6','×','÷','1','2','3','+','−','0','.','×10ˣ','Ans','=']
  const keyClass = 'min-w-0 rounded-xl border text-base font-semibold transition-colors active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300'
  return (
    <FloatingToolPanel title="Máy tính khoa học" onClose={onClose} className="calculator-panel">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-700 bg-slate-900 px-4 py-3">
        <div><h3 className="text-base font-semibold text-slate-50">Máy tính khoa học</h3><p className="mt-1 text-xs text-slate-300">Tính nhanh · Lưu kết quả</p></div>
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" onClick={()=>setAngleMode(mode=>mode==='DEG'?'RAD':'DEG')} title="Đổi chế độ góc: DEG (Độ) / RAD (Radian)" className="rounded-lg border border-cyan-700 bg-cyan-950 px-2 py-2 text-xs font-bold text-cyan-100">{angleMode}</button>
          <button type="button" onClick={()=>setShowHistory(!showHistory)} title="Lịch sử tính toán" aria-pressed={showHistory} className="rounded-lg p-2 text-slate-200 hover:bg-slate-700"><History size={19}/></button>
          <button type="button" onClick={onClose} aria-label="Đóng máy tính khoa học" className="rounded-lg p-2 text-slate-200 hover:bg-slate-700"><X size={20}/></button>
        </div>
      </header>
      {showHistory ? <div className="min-h-0 flex-1 overflow-y-auto bg-slate-950 p-4">
        <div className="mb-4 flex items-center justify-between gap-2"><h4 className="text-sm font-semibold text-slate-100">Lịch sử tính toán ({history.length})</h4>{history.length>0&&<button onClick={clearHistory} className="flex items-center gap-1 text-xs text-rose-300"><Trash2 size={14}/>Xóa tất cả</button>}</div>
        {history.length===0?<div className="py-12 text-center text-sm text-slate-300"><RotateCcw className="mx-auto mb-3" size={28}/><p>Chưa có phép tính nào.</p><p className="mt-2">Bấm = để lưu kết quả.</p></div>:history.map(item=><article key={item.id} className="mb-3 rounded-xl border border-slate-700 bg-slate-900 p-3"><p className="break-all font-mono text-sm text-slate-300">{item.expr}</p><p className="my-2 break-all font-mono text-xl font-semibold text-cyan-200">{item.result}</p><div className="flex justify-end gap-4"><button onClick={()=>copyResult(item.result,item.id)} title="Sao chép kết quả" className="p-1 text-slate-200">{copiedId===item.id?<Check size={18}/>:<Copy size={18}/>}</button><button onClick={()=>applyHistoryItem(item)} className="text-sm font-medium text-cyan-200">Chèn</button></div></article>)}
      </div>:<div className="calculator-body min-h-0 flex-1 overflow-y-auto bg-slate-950 p-3">
        <div className="calculator-display mb-3 rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 font-mono">
          <div className="mb-2 flex justify-between text-xs font-medium text-cyan-200"><span>{angleMode} · Math</span><span>VNDocs</span></div>
          <div aria-label="Biểu thức" className="overflow-x-auto whitespace-nowrap text-right text-lg leading-7 text-slate-100">{displayExpr||'0'}</div>
          <div aria-label="Kết quả tính" aria-live="polite" className="min-h-9 overflow-x-auto whitespace-nowrap text-right text-3xl font-semibold leading-9 text-cyan-200">{result||' '}</div>
        </div>
        <div className="calculator-scientific grid grid-cols-6 gap-1.5">{scientific.map(([label,value,display])=><button key={label} type="button" onClick={()=>onBtnClick(value,display)} className={keyClass+' border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700'}>{label}</button>)}</div>
        <div className="calculator-numpad mt-3 grid grid-cols-5 gap-1.5">{keypad.map(label=>{
          const value=label==='−'?'-':label==='×10ˣ'?'*10^':label
          const display=label==='×10ˣ'?'×10^':label==='='||label==='DEL'||label==='AC'?'':value
          const color=label==='='?'border-cyan-300 bg-cyan-300 text-slate-950 hover:bg-cyan-200':label==='AC'?'border-rose-800 bg-rose-950 text-rose-100 hover:bg-rose-900':label==='DEL'?'border-amber-700 bg-amber-950 text-amber-100 hover:bg-amber-900':['×','÷','+','−','Ans'].includes(label)?'border-slate-500 bg-slate-700 text-cyan-100 hover:bg-slate-600':'border-slate-600 bg-slate-800 text-slate-50 hover:bg-slate-700'
          return <button type="button" key={label} onClick={()=>onBtnClick(value,display)} className={keyClass+' '+color}>{label}</button>
        })}</div>
      </div>}
      <style jsx>{`
        .calculator-scientific button { min-height: 36px; font-size: 13px; }
        .calculator-numpad button { min-height: 46px; }
        @media (max-height: 640px) {
          .calculator-body { padding: 10px; }
          .calculator-display { padding: 8px 12px; margin-bottom: 8px; }
          .calculator-scientific button { min-height: 32px; }
          .calculator-numpad { margin-top: 8px; }
          .calculator-numpad button { min-height: 38px; }
        }
      `}</style>
    </FloatingToolPanel>
  )
}
