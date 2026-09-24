'use client'

import React, { useState, useRef, useEffect } from 'react'

export function CasioCalculator() {
  const [displayValue, setDisplayValue] = useState('')
  const [result, setResult] = useState<string | null>(null)

  const handleInput = (val: string) => {
    if (result !== null) {
      if (['+', '-', '×', '÷'].includes(val)) {
        setDisplayValue(result + val)
      } else {
        setDisplayValue(val)
      }
      setResult(null)
      return
    }
    setDisplayValue((prev) => prev + val)
  }

  const handleClear = () => {
    setDisplayValue('')
    setResult(null)
  }

  const handleDelete = () => {
    if (result !== null) {
      setResult(null)
      return
    }
    setDisplayValue((prev) => prev.slice(0, -1))
  }

  const calculateResult = () => {
    if (!displayValue) return
    try {
      let expression = displayValue
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/\^/g, '**')
        .replace(/π/g, 'Math.PI')
        .replace(/e/g, 'Math.E')
        .replace(/sin\(/g, 'Math.sin((Math.PI/180)*') // assume degrees for simplicity
        .replace(/cos\(/g, 'Math.cos((Math.PI/180)*')
        .replace(/tan\(/g, 'Math.tan((Math.PI/180)*')
        .replace(/log\(/g, 'Math.log10(')
        .replace(/ln\(/g, 'Math.log(')
        .replace(/√\(/g, 'Math.sqrt(')

      // A simple check to automatically close opened parentheses
      const openParens = (expression.match(/\(/g) || []).length
      const closeParens = (expression.match(/\)/g) || []).length
      if (openParens > closeParens) {
        expression += ')'.repeat(openParens - closeParens)
      }

      // eslint-disable-next-line no-new-func
      const evalFunc = new Function('return (' + expression + ')')
      const res = evalFunc()
      
      // format result to avoid long decimals
      const finalRes = Number.isInteger(res) ? res.toString() : parseFloat(res.toFixed(8)).toString()
      setResult(finalRes)
    } catch (e) {
      setResult('Syntax ERROR')
    }
  }

  return (
    <div className="flex justify-center items-center py-4">
      {/* Outer Shell */}
      <div 
        className="w-[320px] sm:w-[380px] p-4 sm:p-6 rounded-3xl shadow-2xl relative"
        style={{
          background: 'linear-gradient(135deg, #2b2b2b 0%, #1a1a1a 100%)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255,255,255,0.1)'
        }}
      >
        {/* Branding */}
        <div className="flex justify-between items-center mb-4 px-2">
          <div className="text-white font-serif italic text-lg font-bold tracking-wider">CASIO</div>
          <div className="text-[#a0a0a0] text-xs font-medium italic">fx-580VN X</div>
        </div>

        {/* Display Screen */}
        <div 
          className="h-28 rounded-lg mb-6 p-3 flex flex-col justify-between shadow-inner relative"
          style={{
            backgroundColor: '#9ea794', // Classic LCD greenish color
            boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.4)',
            fontFamily: '"Courier New", Courier, monospace'
          }}
        >
          {/* Status indicators */}
          <div className="flex text-[10px] text-black/60 font-bold gap-2">
            <span>S</span><span>A</span><span>M</span><span>STO</span>
            <span className="ml-auto">D</span>
          </div>

          <div className="flex flex-col items-end flex-1 justify-end">
            <div className="text-xl sm:text-2xl font-bold text-black/80 tracking-widest break-all line-clamp-2 min-h-[32px]">
              {displayValue}
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-black mt-1 h-10 flex items-center">
              {result !== null ? result : ''}
            </div>
          </div>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-5 gap-y-3 gap-x-2 sm:gap-x-3 text-sm font-medium">
          
          {/* Row 1: Function keys */}
          <button onClick={() => handleInput('SHIFT')} className="h-6 rounded-full bg-[#3a3a3a] text-yellow-500 text-[10px] hover:bg-[#4a4a4a] transition">SHIFT</button>
          <button onClick={() => handleInput('ALPHA')} className="h-6 rounded-full bg-[#3a3a3a] text-red-500 text-[10px] hover:bg-[#4a4a4a] transition">ALPHA</button>
          <button className="h-6 rounded-full bg-[#3a3a3a] text-white/70 text-[10px] hover:bg-[#4a4a4a] transition">MENU</button>
          <button className="h-6 rounded-full bg-[#3a3a3a] text-white/70 text-[10px] hover:bg-[#4a4a4a] transition">SETUP</button>
          <button onClick={handleClear} className="h-6 rounded-full bg-[#3a3a3a] text-white/70 text-[10px] hover:bg-[#4a4a4a] transition">ON</button>

          {/* Row 2: Math functions */}
          <button onClick={() => handleInput('^(-1)')} className="h-8 rounded-md bg-[#252525] text-white shadow-sm border-b-2 border-[#151515] hover:bg-[#303030] active:border-b-0 active:translate-y-[2px]">x⁻¹</button>
          <button onClick={() => handleInput('√(')} className="h-8 rounded-md bg-[#252525] text-white shadow-sm border-b-2 border-[#151515] hover:bg-[#303030] active:border-b-0 active:translate-y-[2px]">√■</button>
          <button onClick={() => handleInput('^2')} className="h-8 rounded-md bg-[#252525] text-white shadow-sm border-b-2 border-[#151515] hover:bg-[#303030] active:border-b-0 active:translate-y-[2px]">x²</button>
          <button onClick={() => handleInput('^')} className="h-8 rounded-md bg-[#252525] text-white shadow-sm border-b-2 border-[#151515] hover:bg-[#303030] active:border-b-0 active:translate-y-[2px]">x■</button>
          <button onClick={() => handleInput('log(')} className="h-8 rounded-md bg-[#252525] text-white shadow-sm border-b-2 border-[#151515] hover:bg-[#303030] active:border-b-0 active:translate-y-[2px]">log</button>

          {/* Row 3: Math functions */}
          <button onClick={() => handleInput('(-)')} className="h-8 rounded-md bg-[#252525] text-white shadow-sm border-b-2 border-[#151515] hover:bg-[#303030] active:border-b-0 active:translate-y-[2px]">(-)</button>
          <button onClick={() => handleInput('°\'"')} className="h-8 rounded-md bg-[#252525] text-white shadow-sm border-b-2 border-[#151515] hover:bg-[#303030] active:border-b-0 active:translate-y-[2px]">°\'"</button>
          <button onClick={() => handleInput('sin(')} className="h-8 rounded-md bg-[#252525] text-white shadow-sm border-b-2 border-[#151515] hover:bg-[#303030] active:border-b-0 active:translate-y-[2px]">sin</button>
          <button onClick={() => handleInput('cos(')} className="h-8 rounded-md bg-[#252525] text-white shadow-sm border-b-2 border-[#151515] hover:bg-[#303030] active:border-b-0 active:translate-y-[2px]">cos</button>
          <button onClick={() => handleInput('tan(')} className="h-8 rounded-md bg-[#252525] text-white shadow-sm border-b-2 border-[#151515] hover:bg-[#303030] active:border-b-0 active:translate-y-[2px]">tan</button>

          {/* Spacer */}
          <div className="col-span-5 h-2"></div>

          {/* Number Pad - Row 1 */}
          <button onClick={() => handleInput('7')} className="h-10 rounded-md bg-[#e0e0e0] text-black text-lg shadow-sm border-b-2 border-[#b0b0b0] hover:bg-[#f0f0f0] active:border-b-0 active:translate-y-[2px]">7</button>
          <button onClick={() => handleInput('8')} className="h-10 rounded-md bg-[#e0e0e0] text-black text-lg shadow-sm border-b-2 border-[#b0b0b0] hover:bg-[#f0f0f0] active:border-b-0 active:translate-y-[2px]">8</button>
          <button onClick={() => handleInput('9')} className="h-10 rounded-md bg-[#e0e0e0] text-black text-lg shadow-sm border-b-2 border-[#b0b0b0] hover:bg-[#f0f0f0] active:border-b-0 active:translate-y-[2px]">9</button>
          <button onClick={handleDelete} className="h-10 rounded-md bg-[#d87c53] text-white shadow-sm border-b-2 border-[#a35c3c] hover:bg-[#e8885c] active:border-b-0 active:translate-y-[2px]">DEL</button>
          <button onClick={handleClear} className="h-10 rounded-md bg-[#d87c53] text-white shadow-sm border-b-2 border-[#a35c3c] hover:bg-[#e8885c] active:border-b-0 active:translate-y-[2px]">AC</button>

          {/* Number Pad - Row 2 */}
          <button onClick={() => handleInput('4')} className="h-10 rounded-md bg-[#e0e0e0] text-black text-lg shadow-sm border-b-2 border-[#b0b0b0] hover:bg-[#f0f0f0] active:border-b-0 active:translate-y-[2px]">4</button>
          <button onClick={() => handleInput('5')} className="h-10 rounded-md bg-[#e0e0e0] text-black text-lg shadow-sm border-b-2 border-[#b0b0b0] hover:bg-[#f0f0f0] active:border-b-0 active:translate-y-[2px]">5</button>
          <button onClick={() => handleInput('6')} className="h-10 rounded-md bg-[#e0e0e0] text-black text-lg shadow-sm border-b-2 border-[#b0b0b0] hover:bg-[#f0f0f0] active:border-b-0 active:translate-y-[2px]">6</button>
          <button onClick={() => handleInput('×')} className="h-10 rounded-md bg-[#252525] text-white text-lg shadow-sm border-b-2 border-[#151515] hover:bg-[#303030] active:border-b-0 active:translate-y-[2px]">×</button>
          <button onClick={() => handleInput('÷')} className="h-10 rounded-md bg-[#252525] text-white text-lg shadow-sm border-b-2 border-[#151515] hover:bg-[#303030] active:border-b-0 active:translate-y-[2px]">÷</button>

          {/* Number Pad - Row 3 */}
          <button onClick={() => handleInput('1')} className="h-10 rounded-md bg-[#e0e0e0] text-black text-lg shadow-sm border-b-2 border-[#b0b0b0] hover:bg-[#f0f0f0] active:border-b-0 active:translate-y-[2px]">1</button>
          <button onClick={() => handleInput('2')} className="h-10 rounded-md bg-[#e0e0e0] text-black text-lg shadow-sm border-b-2 border-[#b0b0b0] hover:bg-[#f0f0f0] active:border-b-0 active:translate-y-[2px]">2</button>
          <button onClick={() => handleInput('3')} className="h-10 rounded-md bg-[#e0e0e0] text-black text-lg shadow-sm border-b-2 border-[#b0b0b0] hover:bg-[#f0f0f0] active:border-b-0 active:translate-y-[2px]">3</button>
          <button onClick={() => handleInput('+')} className="h-10 rounded-md bg-[#252525] text-white text-lg shadow-sm border-b-2 border-[#151515] hover:bg-[#303030] active:border-b-0 active:translate-y-[2px]">+</button>
          <button onClick={() => handleInput('-')} className="h-10 rounded-md bg-[#252525] text-white text-lg shadow-sm border-b-2 border-[#151515] hover:bg-[#303030] active:border-b-0 active:translate-y-[2px]">-</button>

          {/* Number Pad - Row 4 */}
          <button onClick={() => handleInput('0')} className="h-10 rounded-md bg-[#e0e0e0] text-black text-lg shadow-sm border-b-2 border-[#b0b0b0] hover:bg-[#f0f0f0] active:border-b-0 active:translate-y-[2px]">0</button>
          <button onClick={() => handleInput('.')} className="h-10 rounded-md bg-[#e0e0e0] text-black text-lg shadow-sm border-b-2 border-[#b0b0b0] hover:bg-[#f0f0f0] active:border-b-0 active:translate-y-[2px]">.</button>
          <button onClick={() => handleInput('×10^')} className="h-10 rounded-md bg-[#e0e0e0] text-black text-[12px] font-bold shadow-sm border-b-2 border-[#b0b0b0] hover:bg-[#f0f0f0] active:border-b-0 active:translate-y-[2px]">x10ˣ</button>
          <button onClick={() => handleInput('Ans')} className="h-10 rounded-md bg-[#e0e0e0] text-black text-sm shadow-sm border-b-2 border-[#b0b0b0] hover:bg-[#f0f0f0] active:border-b-0 active:translate-y-[2px]">Ans</button>
          <button onClick={calculateResult} className="h-10 rounded-md bg-[#4287f5] text-white text-xl shadow-sm border-b-2 border-[#2b60b8] hover:bg-[#5a97fa] active:border-b-0 active:translate-y-[2px]">=</button>

        </div>
      </div>
    </div>
  )
}
