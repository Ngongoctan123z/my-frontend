'use client'

import React, { useState, useEffect } from 'react'
import * as math from 'mathjs'

export function CasioCalculator() {
  const [expression, setExpression] = useState('')
  const [displayExpr, setDisplayExpr] = useState('')
  const [result, setResult] = useState('')
  const [isShift, setIsShift] = useState(false)
  const [isAlpha, setIsAlpha] = useState(false)
  const [model, setModel] = useState<'580' | '570'>('580')

  // Map display chars to mathjs valid format
  const handleCalculate = (expr: string) => {
    try {
      if (!expr) return ''
      const parsedExpr = expr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/π/g, 'pi')
        .replace(/√/g, 'sqrt')
        .replace(/\^2/g, '^2')
      
      const res = math.evaluate(parsedExpr)
      return math.format(res, { precision: 10 })
    } catch (e) {
      return 'Math ERROR'
    }
  }

  const onBtnClick = (val: string, displayVal: string) => {
    if (val === 'AC') {
      setExpression('')
      setDisplayExpr('')
      setResult('')
      setIsShift(false)
      setIsAlpha(false)
      return
    }
    if (val === 'DEL') {
      setExpression(prev => prev.slice(0, -1))
      setDisplayExpr(prev => prev.slice(0, -1))
      return
    }
    if (val === '=') {
      const res = handleCalculate(expression)
      setResult(res)
      return
    }
    
    if (val === 'SHIFT') {
      setIsShift(!isShift)
      return
    }
    if (val === 'ALPHA') {
      setIsAlpha(!isAlpha)
      return
    }

    setExpression(prev => prev + val)
    setDisplayExpr(prev => prev + displayVal)
    setIsShift(false)
    setIsAlpha(false)
  }

  const sciButtonsRow1 = [
    { label: 'CALC', val: '', disp: '' },
    { label: '∫dx', val: '', disp: '' },
    { label: 'x', val: 'x', disp: 'x' },
    { label: 'x⁻¹', val: '^-1', disp: '⁻¹' },
    { label: 'log_a', val: '', disp: '' },
  ]

  const sciButtonsRow2 = [
    { label: 'a/b', val: '/', disp: '/' },
    { label: '√', val: 'sqrt(', disp: '√(' },
    { label: 'x²', val: '^2', disp: '²' },
    { label: 'x^■', val: '^', disp: '^' },
    { label: 'log', val: 'log10(', disp: 'log(' },
    { label: 'ln', val: 'log(', disp: 'ln(' },
  ]

  const sciButtonsRow3 = [
    { label: '(-)', val: '-', disp: '-' },
    { label: '°\'"', val: '', disp: '' },
    { label: 'x⁻¹', val: '', disp: '' },
    { label: 'sin', val: 'sin(', disp: 'sin(' },
    { label: 'cos', val: 'cos(', disp: 'cos(' },
    { label: 'tan', val: 'tan(', disp: 'tan(' },
  ]
  
  const sciButtonsRow4 = [
    { label: 'STO', val: '', disp: '' },
    { label: 'ENG', val: '', disp: '' },
    { label: '(', val: '(', disp: '(' },
    { label: ')', val: ')', disp: ')' },
    { label: 'S⇔D', val: '', disp: '' },
    { label: 'M+', val: '', disp: '' },
  ]

  const numpad = [
    ['7', '8', '9', 'DEL', 'AC'],
    ['4', '5', '6', '×', '÷'],
    ['1', '2', '3', '+', '-'],
    ['0', '.', 'x10^x', 'Ans', '=']
  ]

  return (
    <div className="flex flex-col justify-center items-center py-4 sm:py-10 w-full bg-slate-100 rounded-3xl mt-8 overflow-hidden">
      
      {/* Model Selector */}
      <div className="flex gap-2 mb-8 bg-white p-1.5 rounded-xl shadow-sm border border-gray-200">
        <button 
          onClick={() => setModel('580')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${model === '580' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          fx-580VN X
        </button>
        <button 
          onClick={() => setModel('570')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${model === '570' ? 'bg-gray-400 text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          fx-570VN PLUS
        </button>
      </div>

      {/* Casing */}
      <div className={`w-full max-w-[380px] rounded-[2.5rem] p-3 sm:p-5 shadow-2xl border-4 relative overflow-hidden shrink-0 mx-auto ${model === '580' ? 'bg-gradient-to-b from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-b from-gray-300 to-gray-400 border-gray-400'}`} style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 2px 10px rgba(255,255,255,0.1)' }}>
        
        {/* Brand Name */}
        <div className="flex justify-between items-end mb-4 px-2">
          <div className={`${model === '580' ? 'text-white' : 'text-gray-800'} font-bold tracking-widest text-lg italic`}>CASIO</div>
          <div className={`${model === '580' ? 'text-gray-400' : 'text-gray-600'} text-[10px] font-semibold text-right uppercase`}>
            {model === '580' ? (
              <>fx-580VN X <br/> <span className="text-blue-400">CLASSWIZ</span></>
            ) : (
              <>fx-570VN PLUS <br/> <span className="text-blue-600">NATURAL-V.P.A.M.</span></>
            )}
          </div>
        </div>

        {/* Screen */}
        <div className="bg-[#b5b8a6] h-32 rounded-lg mb-6 border-4 border-gray-600 shadow-inner p-2 flex flex-col font-mono text-gray-900 relative">
          <div className="flex text-[10px] h-4 gap-2 text-gray-700">
            {isShift && <span>S</span>}
            {isAlpha && <span>A</span>}
            <span>D</span>
            <span>Math</span>
          </div>
          <div className="flex-1 text-2xl overflow-hidden whitespace-nowrap text-right mt-1 tracking-widest font-semibold font-sans">
            {displayExpr || '0'}
          </div>
          <div className="h-10 text-3xl font-bold text-right tracking-widest flex items-end justify-end pb-1 font-sans">
            {result}
          </div>
        </div>

        <div className="space-y-4 relative z-10">
          {/* Top special row */}
          <div className="flex justify-between items-center px-1 mb-2">
            <div className="flex gap-2 sm:gap-4">
              <button onClick={() => onBtnClick('SHIFT', '')} className={`w-9 sm:w-10 h-7 rounded-full text-[9px] font-bold shadow-md transition-transform active:scale-95 ${isShift ? 'bg-yellow-400 text-gray-900' : 'bg-gray-700 text-yellow-500'}`}>SHIFT</button>
              <button onClick={() => onBtnClick('ALPHA', '')} className={`w-9 sm:w-10 h-7 rounded-full text-[9px] font-bold shadow-md transition-transform active:scale-95 ${isAlpha ? 'bg-red-400 text-white' : 'bg-gray-700 text-red-400'}`}>ALPHA</button>
            </div>
            
            {/* D-PAD */}
            <div className="w-20 sm:w-24 h-14 sm:h-16 bg-gradient-to-br from-gray-600 to-gray-800 rounded-[2rem] relative shadow-lg flex items-center justify-center border-2 border-gray-700 shrink-0 mx-1 sm:mx-2">
              <div className="w-6 h-6 absolute top-0 text-gray-400 flex justify-center items-start text-xs cursor-pointer active:text-white">▲</div>
              <div className="w-6 h-6 absolute bottom-0 text-gray-400 flex justify-center items-end text-xs cursor-pointer active:text-white">▼</div>
              <div className="w-6 h-6 absolute left-1 text-gray-400 flex justify-start items-center text-xs cursor-pointer active:text-white">◀</div>
              <div className="w-6 h-6 absolute right-1 text-gray-400 flex justify-end items-center text-xs cursor-pointer active:text-white">▶</div>
              <div className="w-7 sm:w-8 h-7 sm:h-8 rounded-full bg-gray-700 shadow-inner"></div>
            </div>

            <div className="flex gap-2 sm:gap-4">
              <button className="w-9 sm:w-10 h-7 rounded-full bg-gray-700 text-white text-[9px] font-bold shadow-md">SETUP</button>
              <button onClick={() => onBtnClick('AC', '')} className="w-9 sm:w-10 h-7 rounded-full bg-blue-600 text-white text-[10px] font-bold shadow-md active:scale-95">ON</button>
            </div>
          </div>

          {/* Scientific buttons */}
          <div className="space-y-2 sm:space-y-3 px-1 mt-6">
            <div className="grid grid-cols-6 gap-1 sm:gap-2">
              {sciButtonsRow1.map(b => (
                <button key={b.label} onClick={() => onBtnClick(b.val, b.disp)} className="w-full h-7 bg-gray-800 hover:bg-gray-700 text-white text-[9px] sm:text-[10px] font-semibold rounded shadow-sm border-b-2 border-gray-900 active:scale-95 active:border-b-0 transition-all flex items-center justify-center">{b.label}</button>
              ))}
            </div>
            <div className="grid grid-cols-6 gap-1 sm:gap-2">
              {sciButtonsRow2.map(b => (
                <button key={b.label} onClick={() => onBtnClick(b.val, b.disp)} className="w-full h-7 bg-gray-800 hover:bg-gray-700 text-white text-[10px] sm:text-[11px] font-semibold rounded shadow-sm border-b-2 border-gray-900 active:scale-95 active:border-b-0 transition-all flex items-center justify-center">{b.label}</button>
              ))}
            </div>
            <div className="grid grid-cols-6 gap-1 sm:gap-2">
              {sciButtonsRow3.map(b => (
                <button key={b.label} onClick={() => onBtnClick(b.val, b.disp)} className="w-full h-7 bg-gray-800 hover:bg-gray-700 text-white text-[10px] sm:text-[11px] font-semibold rounded shadow-sm border-b-2 border-gray-900 active:scale-95 active:border-b-0 transition-all flex items-center justify-center">{b.label}</button>
              ))}
            </div>
            <div className="grid grid-cols-6 gap-1 sm:gap-2">
              {sciButtonsRow4.map(b => (
                <button key={b.label} onClick={() => onBtnClick(b.val, b.disp)} className="w-full h-7 bg-gray-800 hover:bg-gray-700 text-white text-[10px] sm:text-[11px] font-semibold rounded shadow-sm border-b-2 border-gray-900 active:scale-95 active:border-b-0 transition-all flex items-center justify-center">{b.label}</button>
              ))}
            </div>
          </div>

          {/* Numpad */}
          <div className="grid grid-cols-5 gap-y-2.5 sm:gap-y-3 gap-x-1.5 sm:gap-x-2 pt-4 px-1">
            {numpad.map((row, rIdx) => 
              row.map((btn, cIdx) => {
                let bgColor = 'bg-gray-300 text-gray-900'
                if (btn === 'DEL' || btn === 'AC') bgColor = 'bg-red-500 text-white'
                else if (['+', '-', '×', '÷'].includes(btn)) bgColor = 'bg-gray-700 text-white'
                else if (btn === '=') bgColor = 'bg-blue-600 text-white'

                const mathVal = btn === '×' ? '*' : btn === '÷' ? '/' : btn === 'x10^x' ? '*10^' : btn === 'Ans' ? '' : btn

                return (
                  <button 
                    key={`${rIdx}-${cIdx}`}
                    onClick={() => onBtnClick(mathVal, btn === 'x10^x' ? 'x10^' : btn)}
                    className={`w-full h-8 sm:h-9 rounded shadow border-b-4 active:scale-95 active:border-b-0 transition-all flex items-center justify-center font-bold text-xs sm:text-sm ${bgColor} ${btn === 'AC' || btn === 'DEL' ? 'border-red-700 hover:bg-red-400' : btn === '=' ? 'border-blue-800 hover:bg-blue-500' : ['+', '-', '×', '÷'].includes(btn) ? 'border-gray-900' : 'border-gray-400 hover:bg-gray-200'}`}
                  >
                    {btn}
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Textures / Accents */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl pointer-events-none"></div>
      </div>
    </div>
  )
}
