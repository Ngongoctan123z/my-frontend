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
    normal: 'border-slate-200/80 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200',
    selected: 'border-blue-200 bg-blue-50 text-blue-600 ring-2 ring-blue-100 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-900',
  },
  {
    id: 'translate', label: 'Dịch thuật nhanh', Icon: Languages,
    normal: 'border-slate-200/80 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200',
    selected: 'border-blue-200 bg-blue-50 text-blue-600 ring-2 ring-blue-100 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-900',
  },
  {
    id: 'chat', label: 'Hỗ trợ & Chat với Admin', Icon: MessageSquare,
    normal: 'border-blue-600 bg-blue-600 text-white hover:border-blue-700 hover:bg-blue-700',
    selected: 'border-blue-700 bg-blue-700 text-white ring-2 ring-blue-100 dark:ring-blue-900',
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
    if (current.moved) {
      if (overTrash(current.point, current.size)) dismiss(current.id)
      else setPositions(previous => ({ ...previous, [current.id]: current.point }))
    } else if (!current.active) onToggle(current.id)
    if (current.element.hasPointerCapture(event.pointerId)) current.element.releasePointerCapture(event.pointerId)
  }

  const docked = tools.filter(tool => !hidden.includes(tool.id) && !positions[tool.id])

  return (
    <aside aria-label="Công cụ tiện ích nổi" className={`pointer-events-none fixed inset-0 ${interaction ? 'z-[100]' : 'z-40'} [--bubble-size:2.75rem] [--dock-padding:0.5rem] [--dock-bottom:1.25rem] [--dock-right:0.75rem] sm:[--bubble-size:3rem] sm:[--dock-padding:0.625rem] sm:[--dock-bottom:1.5rem] sm:[--dock-right:1.25rem]`}>
      {docked.length > 0 && (
        <div aria-hidden="true" className="fixed rounded-full border border-slate-200/80 bg-white/95 shadow-[0_6px_24px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900/95"
          style={{ right: 'var(--dock-right)', bottom: 'var(--dock-bottom)', width: 'calc(var(--bubble-size) + 2 * var(--dock-padding))', height: `calc(${docked.length} * var(--bubble-size) + ${docked.length - 1} * 0.625rem + 2 * var(--dock-padding))` }} />
      )}
      {tools.filter(tool => !hidden.includes(tool.id)).map(tool => {
        const dragging = interaction?.id === tool.id
        const point = dragging ? interaction.point : positions[tool.id]
        const index = docked.findIndex(item => item.id === tool.id)
        return (
          <div key={tool.id} data-floating-tool={tool.id}
            className={`group pointer-events-auto fixed h-11 w-11 sm:h-12 sm:w-12 ${dragging ? 'z-[110]' : ''}`}
            style={point ? { left: point.x, top: point.y } : { right: 'calc(var(--dock-right) + var(--dock-padding))', bottom: `calc(var(--dock-bottom) + var(--dock-padding) + ${docked.length - 1 - index} * (var(--bubble-size) + 0.625rem))` }}>
            {(point || index === 0) && <span className="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-slate-200/70 bg-white/95 px-1.5 py-0.5 text-[8px] leading-[10px] text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">giữ để xoá</span>}
            <button type="button" aria-label={tool.label} aria-pressed={activeTool === tool.id}
              title={`${tool.label} · Kéo để di chuyển, giữ để xoá`}
              className={`relative flex h-full w-full touch-none select-none [-webkit-touch-callout:none] items-center justify-center rounded-full border outline-none shadow-[0_2px_6px_rgba(15,23,42,0.05)] transition-[background-color,border-color,box-shadow,transform] duration-150 focus-visible:ring-2 focus-visible:ring-blue-300 motion-reduce:transition-none ${dragging ? 'cursor-grabbing shadow-lg' : 'cursor-grab active:scale-95'} ${activeTool === tool.id ? tool.selected : tool.normal}`}
              onPointerDown={event => start(event, tool.id)} onPointerMove={move} onPointerUp={finish}
              onPointerCancel={event => { if (gesture.current?.pointerId === event.pointerId) cancelGesture() }} onLostPointerCapture={event => { if (gesture.current?.pointerId === event.pointerId) cancelGesture() }}
              onContextMenu={event => event.preventDefault()}
              onKeyDown={event => { if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); cancelGesture(); dismiss(tool.id) } }}
              onClick={event => {
                // Pointer taps are handled on release. Only keyboard/assistive clicks
                // toggle here, so a delayed compatibility click can never reopen a dragged tool.
                if (event.detail === 0) onToggle(tool.id)
              }}>
              {activeTool === tool.id ? <X size={21} strokeWidth={1.8} /> : <tool.Icon size={21} strokeWidth={1.8} />}
            </button>
            {!interaction && <span aria-hidden="true" className={`pointer-events-none absolute top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 sm:block dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 ${point && point.x < 200 ? 'left-full ml-3' : 'right-full mr-3'}`}>{tool.label}</span>}
          </div>
        )
      })}
      {interaction && (
        <div role="status" aria-label="Thùng rác xoá bong bóng" className="pointer-events-none fixed left-1/2 top-1/2 z-[100] -translate-x-1/2 -translate-y-1/2">
          <div className={`flex h-24 w-24 items-center justify-center rounded-full border shadow-lg transition-colors ${interaction.over ? 'border-red-600 bg-red-600 text-white ring-4 ring-red-100' : 'border-red-200 bg-red-50/95 text-red-500'}`}>
            <Trash2 size={32} strokeWidth={1.8} aria-hidden="true" />
          </div>
          <span className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-red-600 shadow-sm">{interaction.over ? 'Thả để xoá' : 'Kéo vào đây để xoá'}</span>
        </div>
      )}
    </aside>
  )
}
