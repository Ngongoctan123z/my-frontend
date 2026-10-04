import React, { useState, useEffect } from 'react'
import { X, ArrowUp, ArrowDown, RotateCcw } from 'lucide-react'

export type Place = 'big' | 'front' | 'back' | 'hidden'
export type CardConfig = {
  big: number | null
  small: number | null
  front: number[]
  back: number[]
}

interface Props {
  modelId: string
  names: string[]
  sampleRow: string[]
  rows: string[][]
  qfmt: string
  sortf?: number
  onSave: (cfg: CardConfig) => void
  onClose: () => void
}

const strip = (s = '') =>
  s.replace(/\[sound:[^\]]+\]/gi, '').replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').trim()

const isNumbering = (vals: string[]) => {
  const t = vals.map(strip).filter(Boolean)
  if (!t.length) return false
  const numeric = t.filter(x => /^[#№\s\d\/.\-:]+$/.test(x)).length / t.length
  return numeric > 0.8
}

const isMedia = (rows: string[][], i: number) =>
  rows.some(r => /\[sound:|<img/i.test(r[i] ?? '')) &&
  rows.filter(r => strip(r[i] ?? '')).length / (rows.length || 1) < 0.3

const fieldsInTemplate = (tpl: string, names: string[]) => {
  const found: number[] = []
  const regex = /\{\{[#^/]?\s*(?:[\w\s-]+:)*([^}:]+?)\s*\}\}/g
  let match
  while ((match = regex.exec(tpl)) !== null) {
    const i = names.indexOf(match[1].trim())
    if (i >= 0 && !found.includes(i)) found.push(i)
  }
  return found
}

export function defaultConfig(
  names: string[],
  rows: string[][],
  qfmt: string,
  sortf: number = 0
): CardConfig {
  const sample = rows.slice(0, 300)
  const skip = names.map((_, i) => isNumbering(sample.map(r => r[i] ?? '')))
  const hasLetters = (i: number) => sample.some(r => /\p{L}/u.test(strip(r[i] ?? '')))
  const textual = (i: number) => hasLetters(i) && !skip[i] && !isMedia(sample, i)

  let front = fieldsInTemplate(qfmt, names).filter(i => !skip[i])

  const big =
    [sortf, ...front].find(i => i != null && i >= 0 && i < names.length && textual(i)) ??
    names.findIndex((_, i) => textual(i))

  front = front.filter(i => i !== big)
  const back = names
    .map((_, i) => i)
    .filter(i => i !== big && !front.includes(i) && !skip[i])

  return { big: big >= 0 ? big : null, small: null, front, back }
}

const preview = (v = '') =>
  strip(v) || (/\[sound:/.test(v) ? '🔊 audio' : /<img/.test(v) ? '🖼 ảnh' : '')

export function FieldMappingModal({
  modelId, names, sampleRow, rows, qfmt, sortf = 0, onSave, onClose,
}: Props) {
  const [cfg, setCfg] = useState<CardConfig | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`anki-cfg:${modelId}`)
      if (saved) {
        const parsed = JSON.parse(saved) as CardConfig
        const all = [...(parsed.big != null ? [parsed.big] : []), ...parsed.front, ...parsed.back]
        if (all.every(i => i >= 0 && i < names.length)) {
          setCfg(parsed)
          return
        }
      }
    } catch { }
    setCfg(defaultConfig(names, rows, qfmt, sortf))
  }, [modelId, names, rows, qfmt, sortf])

  if (!cfg) return null

  const placeOf = (i: number): Place => {
    if (cfg.big === i) return 'big'
    if (cfg.front.includes(i)) return 'front'
    if (cfg.back.includes(i)) return 'back'
    return 'hidden'
  }

  const applyPlace = (i: number, place: Place) => {
    const next: CardConfig = {
      ...cfg,
      big: cfg.big === i ? null : cfg.big,
      front: cfg.front.filter(x => x !== i),
      back: cfg.back.filter(x => x !== i),
    }
    if (place === 'big') {
      if (next.big !== null) next.front.unshift(next.big)
      next.big = i
    } else if (place === 'front') next.front.push(i)
    else if (place === 'back') next.back.push(i)
    setCfg(next)
  }

  const moveBackItem = (i: number, dir: -1 | 1) => {
    const idx = cfg.back.indexOf(i)
    const to = idx + dir
    if (idx < 0 || to < 0 || to >= cfg.back.length) return
    const nb = [...cfg.back]
      ;[nb[idx], nb[to]] = [nb[to], nb[idx]]
    setCfg({ ...cfg, back: nb })
  }

  const reset = () => {
    try { localStorage.removeItem(`anki-cfg:${modelId}`) } catch { }
    setCfg(defaultConfig(names, rows, qfmt, sortf))
  }

  const save = () => {
    try { localStorage.setItem(`anki-cfg:${modelId}`, JSON.stringify(cfg)) } catch { }
    onSave(cfg)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">Tuỳ chỉnh giao diện thẻ</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-4">
            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">
              Gán vị trí cho từng field
            </h3>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
              {names.map((name, i) => (
                <div key={i} className="flex gap-3 items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                  <b className="w-28 shrink-0 text-sm text-slate-700 truncate" title={name}>{name}</b>
                  <span className="flex-1 min-w-0 truncate text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded">
                    {preview(sampleRow[i]) || 'rỗng'}
                  </span>

                  {placeOf(i) === 'back' && (
                    <div className="flex flex-col gap-1">
                      <button onClick={() => moveBackItem(i, -1)} className="p-1 bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-600 rounded">
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button onClick={() => moveBackItem(i, 1)} className="p-1 bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-600 rounded">
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <select
                    value={placeOf(i)}
                    onChange={e => applyPlace(i, e.target.value as Place)}
                    className="text-sm border border-slate-200 rounded-lg bg-slate-50 font-medium w-36 p-1.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="big">Mặt trước (To)</option>
                    <option value="front">Mặt trước</option>
                    <option value="back">Mặt sau</option>
                    <option value="hidden">Ẩn</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full lg:w-80 shrink-0">
            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider mb-4">Xem trước</h3>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center shadow-inner">
              <div className="text-4xl font-bold mb-6 text-slate-800 break-words">
                {cfg.big !== null ? preview(sampleRow[cfg.big]) || '---' : '---'}
              </div>

              {cfg.front.length > 0 && (
                <div className="mb-6 space-y-2">
                  {cfg.front.map(i => (
                    <div key={i} className="text-sm text-slate-600">{preview(sampleRow[i])}</div>
                  ))}
                </div>
              )}

              <hr className="my-6 border-dashed border-slate-300" />

              {cfg.back.length > 0 && (
                <div className="space-y-3 text-left">
                  {cfg.back.map(i => (
                    <div key={i} className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">{names[i]}</div>
                      <div className="text-sm text-slate-700 break-words">{preview(sampleRow[i])}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between gap-3">
          <button onClick={reset} className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-200 transition-colors flex items-center gap-2">
            <RotateCcw className="w-4 h-4" /> Về mặc định
          </button>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-6 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-200 transition-colors">
              Hủy
            </button>
            <button onClick={save} className="px-6 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
              Lưu & Áp dụng
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
