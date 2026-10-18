'use client'

import React, { useId, useRef } from 'react'
import { Trash2 } from 'lucide-react'

type AnswerProps = {
  value: string
  onValueChange: (value: string) => void
  isEn: boolean
  answerLabel: string
}

type TextareaProps = AnswerProps & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'>
type InputProps = AnswerProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>

function ClearAnswer({ disabled, isEn, answerLabel, onClear }: {
  disabled: boolean; isEn: boolean; answerLabel: string; onClear: () => void
}) {
  const label = `${isEn ? 'Clear answer' : 'Xóa nội dung'}: ${answerLabel}`
  return (
    <button type="button" aria-label={label} title={label} disabled={disabled} onClick={onClear}
      className="absolute right-1 top-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-blue-500 disabled:opacity-30 disabled:cursor-not-allowed">
      <Trash2 className="h-4 w-4" aria-hidden="true" />
    </button>
  )
}

export function AnswerTextarea({ value, onValueChange, isEn, answerLabel, className = '', ...props }: TextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null)
  return (
    <div className="relative flex min-w-0 w-full flex-1 flex-col">
      <textarea {...props} ref={ref} value={value} aria-label={props['aria-label'] || answerLabel}
        onChange={event => onValueChange(event.target.value)} className={`${className} pr-12`} />
      <ClearAnswer disabled={!!props.disabled || !value} isEn={isEn} answerLabel={answerLabel}
        onClear={() => { onValueChange(''); ref.current?.focus() }} />
    </div>
  )
}

export function AnswerInput({ value, onValueChange, isEn, answerLabel, className = '', ...props }: InputProps) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div className="relative min-w-0 w-full flex-1">
      <input {...props} ref={ref} value={value} aria-label={props['aria-label'] || answerLabel}
        onChange={event => onValueChange(event.target.value)} className={`${className} w-full min-w-0 pr-12`} />
      <ClearAnswer disabled={!!props.disabled || !value} isEn={isEn} answerLabel={answerLabel}
        onClear={() => { onValueChange(''); ref.current?.focus() }} />
    </div>
  )
}

export function GraderActions({ value, onChange, languages, isEn, disabled, children }: {
  value: string; onChange: (value: string) => void; languages: readonly string[]
  isEn: boolean; disabled: boolean; children: React.ReactNode
}) {
  const id = useId()
  return (
    <div data-grader-actions className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] items-end gap-3">
      <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
        <label htmlFor={id} className="block text-[11px] font-semibold leading-4 text-slate-600">
          {isEn ? 'Feedback language' : 'Ngôn ngữ nhận xét'}
        </label>
        <select id={id} value={value} disabled={disabled} onChange={event => onChange(event.target.value)}
          className="block w-full min-w-0 cursor-pointer bg-transparent py-1 text-xs font-medium text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50">
          {languages.map(language => <option key={language} value={language}>{language}</option>)}
        </select>
      </div>
      <div className="min-w-0 [&_button]:min-w-0 [&_button]:min-h-11 [&_button]:w-full [&_button]:justify-center [&_button]:px-2 [&_button]:text-xs [&_button]:leading-5 [&_svg]:shrink-0">
        {children}
      </div>
    </div>
  )
}
