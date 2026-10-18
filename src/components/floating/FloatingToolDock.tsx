'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Calculator, Languages, MessageSquare, Trash2, X } from 'lucide-react'

export type FloatingToolId = 'calc' | 'translate' | 'chat'
type Point = { x: number; y: number }
type Gesture = {
  id: FloatingToolId; pointerId: number; element: HTMLButtonElement
  start: Point; origin: Point; point: Point; size: number; moved: boolean; active: boolean
}

const tools = [
  {
    id: 'calc', label: 'Máy tính Casio Online', Icon: Calculator,
    normal: 'bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600 hover:from-violet-400 hover:to-indigo-500 shadow-md shadow-indigo-500/35',
    selected: 'bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 ring-4 ring-indigo-300/80 shadow-lg shadow-indigo-500/50',
  },
  {
    id: 'translate', label: 'Dịch thuật nhanh', Icon: Languages,
    normal: 'bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 hover:from-emerald-300 hover:to-teal-500 shadow-md shadow-teal-500/35',
    selected: 'bg-gradient-to-br from-teal-600 via-emerald-600 to-cyan-700 ring-4 ring-teal-300/80 shadow-lg shadow-emerald-500/50',
  },
  {
    id: 'chat', label: 'Hỗ trợ & Chat với Admin', Icon: MessageSquare,
    normal: 'bg-gradient-to-br from-blue-500 via-indigo-600 to-sky-600 hover:from-blue-400 hover:to-indigo-500 shadow-md shadow-blue-500/35',
    selected: 'bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 ring-4 ring-blue-300/80 shadow-lg shadow-blue-500/50',
  },
] as const

function constrain(point: Point, size: number): Point {
  return {
    x: Math.max(8, Math.min(point.x, window.innerWidth - size - 8)),
    y: Math.max(20, Math.min(point.y, window.innerHeight - size - 8)),
  }
}

function overTrash(point: Point, size: number) {
  return Math.hypot(point.x + size / 2 - window.innerWidth / 2, point.y + size / 2 - window.innerHeight / 2) <= 48
}

export function FloatingToolDock({ activeTool, onToggle, onDismiss }: {
  activeTool: FloatingToolId | null
  onToggle: (id: FloatingToolId) => void
  onDismiss: (id: FloatingToolId) => void
}) {
  const [positions, setPositions] = useState<Partial<Record<FloatingToolId, Point>>>({})
  const [hidden, setHidden] = useState<FloatingToolId[]>([])
  const [interaction, setInteraction] = useState<{ id: FloatingToolId; point: Point; over: boolean } | null>(null)
  const gesture = useRef<Gesture | null>(null)
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const animationFrame = useRef<number | null>(null)
  const suppressedClick = useRef({ id: '' as string, until: 0 })

  const clearScheduled = () => {
    if (holdTimer.current !== null) clearTimeout(holdTimer.current)
    if (animationFrame.current !== null) cancelAnimationFrame(animationFrame.current)
    holdTimer.current = null
    animationFrame.current = null
  }

  const cancelGesture = () => {
    const current = gesture.current
    clearScheduled()
    gesture.current = null
    setInteraction(null)
    if (current) {
      suppressedClick.current = { id: current.id, until: Date.now() + 500 }
      if (current.element.hasPointerCapture(current.pointerId)) current.element.releasePointerCapture(current.pointerId)
    }
  }

  useEffect(() => {
    const resize = () => {
      cancelGesture()
      const size = window.innerWidth >= 640 ? 48 : 44
      setPositions(previous => Object.fromEntries(Object.entries(previous).map(([id, point]) => [id, constrain(point, size)])))
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && gesture.current) cancelGesture()
    }
    window.addEventListener('resize', resize)
    window.addEventListener('blur', cancelGesture)
    window.addEventListener('keydown', escape)
    return () => {
      clearScheduled()
      gesture.current = null
      window.removeEventListener('resize', resize)
      window.removeEventListener('blur', cancelGesture)
      window.removeEventListener('keydown', escape)
    }
  }, [])

  const showGesture = (current: Gesture) => {
    setInteraction({ id: current.id, point: current.point, over: overTrash(current.point, current.size) })
  }

  const start = (event: React.PointerEvent<HTMLButtonElement>, id: FloatingToolId) => {
    if (!event.isPrimary || event.button !== 0 || gesture.current) return
    suppressedClick.current = { id: '', until: 0 }
    const rect = event.currentTarget.parentElement!.getBoundingClientRect()
    const current: Gesture = {
      id, pointerId: event.pointerId, element: event.currentTarget,
      start: { x: event.clientX, y: event.clientY }, origin: { x: rect.left, y: rect.top },
      point: { x: rect.left, y: rect.top }, size: rect.width, moved: false, active: false,
    }
    gesture.current = current
    event.currentTarget.setPointerCapture(event.pointerId)
    holdTimer.current = setTimeout(() => {
      holdTimer.current = null
      if (gesture.current !== current) return
      current.active = true
      showGesture(current)
    }, 450)
  }

  const move = (event: React.PointerEvent<HTMLButtonElement>) => {
    const current = gesture.current
    if (!current || current.pointerId !== event.pointerId) return
    const dx = event.clientX - current.start.x
    const dy = event.clientY - current.start.y
    if (!current.moved && Math.hypot(dx, dy) < 6) return
    current.moved = true
    current.active = true
    if (holdTimer.current !== null) clearTimeout(holdTimer.current)
    holdTimer.current = null
    current.point = constrain({ x: current.origin.x + dx, y: current.origin.y + dy }, current.size)
    if (animationFrame.current === null) {
      animationFrame.current = requestAnimationFrame(() => {
        animationFrame.current = null
        if (gesture.current === current) showGesture(current)
      })
    }
  }

  const dismiss = (id: FloatingToolId) => {
    setHidden(previous => previous.includes(id) ? previous : [...previous, id])
    onDismiss(id)
  }

  const finish = (event: React.PointerEvent<HTMLButtonElement>) => {
    const current = gesture.current
    if (!current || current.pointerId !== event.pointerId) return
    clearScheduled()
    gesture.current = null
    setInteraction(null)
    if (current.active) suppressedClick.current = { id: current.id, until: Date.now() + 500 }
    if (current.moved) {
      if (overTrash(current.point, current.size)) dismiss(current.id)
      else setPositions(previous => ({ ...previous, [current.id]: current.point }))
    }
    if (current.element.hasPointerCapture(event.pointerId)) current.element.releasePointerCapture(event.pointerId)
  }

  const docked = tools.filter(tool => !hidden.includes(tool.id) && !positions[tool.id])

  return (
    <aside aria-label="Công cụ tiện ích nổi" className={`pointer-events-none fixed inset-0 ${interaction ? 'z-[100]' : 'z-40'} [--bubble-size:2.75rem] [--dock-padding:0.5rem] [--dock-bottom:1.25rem] [--dock-right:0.75rem] sm:[--bubble-size:3rem] sm:[--dock-padding:0.625rem] sm:[--dock-bottom:1.5rem] sm:[--dock-right:1.25rem]`}>
      {docked.length > 0 && (
        <div aria-hidden="true" className="fixed rounded-full bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-[0_12px_40px_-4px_rgba(0,0,0,0.18),0_2px_8px_-2px_rgba(0,0,0,0.06)] ring-1 ring-black/5 dark:ring-white/5"
          style={{ right: 'var(--dock-right)', bottom: 'var(--dock-bottom)', width: 'calc(var(--bubble-size) + 2 * var(--dock-padding))', height: `calc(${docked.length} * var(--bubble-size) + ${docked.length - 1} * 0.625rem + 2 * var(--dock-padding))` }} />
      )}
      {tools.filter(tool => !hidden.includes(tool.id)).map(tool => {
        const dragging = interaction?.id === tool.id
        const point = dragging ? interaction.point : positions[tool.id]
        const index = docked.findIndex(item => item.id === tool.id)
        return (
          <div key={tool.id} data-floating-tool={tool.id}
            className={`pointer-events-auto fixed h-11 w-11 sm:h-12 sm:w-12 ${dragging ? 'z-[110]' : ''}`}
            style={point ? { left: point.x, top: point.y } : { right: 'calc(var(--dock-right) + var(--dock-padding))', bottom: `calc(var(--dock-bottom) + var(--dock-padding) + ${docked.length - 1 - index} * (var(--bubble-size) + 0.625rem))` }}>
            <span className="pointer-events-none absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-white/90 px-1 text-[8px] leading-[10px] text-slate-500 dark:bg-slate-900/90 dark:text-slate-300">giữ để xoá</span>
            <button type="button" aria-label={tool.label} aria-pressed={activeTool === tool.id}
              title={`${tool.label} · Kéo để di chuyển, giữ để xoá`}
              className={`relative flex h-full w-full touch-none select-none [-webkit-touch-callout:none] items-center justify-center overflow-hidden rounded-full text-white outline-none transition-[box-shadow,background-color] focus-visible:ring-4 focus-visible:ring-blue-300 ${dragging ? 'cursor-grabbing' : 'cursor-grab'} ${activeTool === tool.id ? tool.selected : tool.normal}`}
              onPointerDown={event => start(event, tool.id)} onPointerMove={move} onPointerUp={finish}
              onPointerCancel={event => { if (gesture.current?.pointerId === event.pointerId) cancelGesture() }} onLostPointerCapture={() => { if (gesture.current?.id === tool.id) cancelGesture() }}
              onContextMenu={event => event.preventDefault()}
              onKeyDown={event => { if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); cancelGesture(); dismiss(tool.id) } }}
              onClick={event => {
                if (event.detail > 0 && suppressedClick.current.id === tool.id && Date.now() < suppressedClick.current.until) {
                  suppressedClick.current.until = 0
                  return
                }
                onToggle(tool.id)
              }}>
              <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/35 via-white/5 to-transparent" />
              {activeTool === tool.id ? <X size={20} /> : <tool.Icon size={20} className="drop-shadow-xs" />}
              {tool.id === 'chat' && activeTool !== 'chat' && <span aria-hidden="true" className="pointer-events-none absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border border-white bg-emerald-400 shadow-xs" />}
            </button>
          </div>
        )
      })}
      {interaction && (
        <div role="status" aria-label="Thùng rác xoá bong bóng" className="pointer-events-none fixed left-1/2 top-1/2 z-[100] -translate-x-1/2 -translate-y-1/2">
          <div className={`flex h-24 w-24 items-center justify-center rounded-full border-2 shadow-xl transition-colors ${interaction.over ? 'border-red-600 bg-red-600 text-white ring-8 ring-red-200/60' : 'border-red-300 bg-white/95 text-red-500'}`}>
            <Trash2 size={36} aria-hidden="true" />
          </div>
          <span className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-red-600 shadow-sm">{interaction.over ? 'Thả để xoá' : 'Kéo vào đây để xoá'}</span>
        </div>
      )}
    </aside>
  )
}
