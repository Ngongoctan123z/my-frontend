'use client'

import React, { useRef, useEffect, useState } from 'react'
import { Sparkles, Zap, RotateCw } from 'lucide-react'

interface WheelSpinnerProps {
  topics: string[]
  targetIndex: number
  isSpinning: boolean
  onSpinClick: () => void
  onSpinEnd: () => void
  onQuickPick?: () => void
  disabled?: boolean
  currentPartLabel?: string
  progressLabel?: string
}

const SLICE_COLORS = [
  '#4F46E5', // Indigo
  '#2563EB', // Blue
  '#0D9488', // Teal
  '#059669', // Emerald
  '#D97706', // Amber
  '#DC2626', // Red
  '#7C3AED', // Violet
  '#DB2777', // Pink
  '#0284C7', // Sky
  '#16A34A', // Green
]

export function WheelSpinner({
  topics,
  targetIndex,
  isSpinning,
  onSpinClick,
  onSpinEnd,
  onQuickPick,
  disabled = false,
  currentPartLabel,
  progressLabel,
}: WheelSpinnerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [currentRotation, setCurrentRotation] = useState(0)
  const animRef = useRef<number | null>(null)
  const hasTriggeredEndRef = useRef(false)

  const numSlices = Math.max(1, topics.length)
  const sliceAngle = (2 * Math.PI) / numSlices

  // Draw the wheel onto canvas
  const drawWheel = (rotationAngle: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = canvas.width
    const center = size / 2
    const radius = center - 14

    ctx.clearRect(0, 0, size, size)

    ctx.save()
    ctx.translate(center, center)
    ctx.rotate(rotationAngle)

    // Draw slices
    for (let i = 0; i < numSlices; i++) {
      const angle = i * sliceAngle
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.arc(0, 0, radius, angle, angle + sliceAngle)
      ctx.closePath()

      ctx.fillStyle = SLICE_COLORS[i % SLICE_COLORS.length]
      ctx.fill()
      ctx.lineWidth = 2
      ctx.strokeStyle = '#FFFFFF'
      ctx.stroke()

      // Text inside slice
      ctx.save()
      ctx.rotate(angle + sliceAngle / 2)
      ctx.textAlign = 'right'
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 12px Inter, sans-serif'
      ctx.shadowColor = 'rgba(0,0,0,0.4)'
      ctx.shadowBlur = 3

      const rawText = topics[i] || `Chủ đề ${i + 1}`
      const text = rawText.length > 18 ? rawText.slice(0, 16) + '...' : rawText
      ctx.fillText(text, radius - 18, 4)
      ctx.restore()
    }

    ctx.restore()

    // Outer ring border with lights/dots
    ctx.beginPath()
    ctx.arc(center, center, radius + 2, 0, 2 * Math.PI)
    ctx.lineWidth = 5
    ctx.strokeStyle = '#1E293B'
    ctx.stroke()

    // Center circular badge
    ctx.beginPath()
    ctx.arc(center, center, 32, 0, 2 * Math.PI)
    ctx.fillStyle = '#FFFFFF'
    ctx.shadowColor = 'rgba(0,0,0,0.25)'
    ctx.shadowBlur = 8
    ctx.fill()
    ctx.lineWidth = 3
    ctx.strokeStyle = '#E2E8F0'
    ctx.stroke()
    ctx.shadowBlur = 0

    // Center icon dot
    ctx.beginPath()
    ctx.arc(center, center, 14, 0, 2 * Math.PI)
    ctx.fillStyle = '#4F46E5'
    ctx.fill()
  }

  // Initial draw & redraw when topics change
  useEffect(() => {
    drawWheel(currentRotation)
  }, [topics, currentRotation])

  // Spin animation when isSpinning becomes true
  useEffect(() => {
    if (!isSpinning) return

    hasTriggeredEndRef.current = false
    const startTime = performance.now()
    const spinDuration = 3200 // 3.2 seconds smooth spin

    // Pointer is at the TOP (-Math.PI / 2).
    // Target slice should point at the top when settled:
    // angle of slice center = targetIndex * sliceAngle + sliceAngle / 2
    // total rotation = base spins + offset to align target slice to top
    const targetSliceCenter = targetIndex * sliceAngle + sliceAngle / 2
    const targetFinalAngle = -Math.PI / 2 - targetSliceCenter
    // Normalize to positive
    const normalizedTarget = ((targetFinalAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
    const baseRotations = 5 * 2 * Math.PI // 5 full revolutions
    const totalRotationNeeded = baseRotations + normalizedTarget

    const initialRot = currentRotation % (2 * Math.PI)
    const finalRot = initialRot + totalRotationNeeded

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(1, elapsed / spinDuration)

      // Cubic ease-out
      const easeOut = 1 - Math.pow(1 - progress, 3.5)
      const newAngle = initialRot + (finalRot - initialRot) * easeOut

      setCurrentRotation(newAngle)
      drawWheel(newAngle)

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate)
      } else {
        if (!hasTriggeredEndRef.current) {
          hasTriggeredEndRef.current = true
          onSpinEnd()
        }
      }
    }

    animRef.current = requestAnimationFrame(animate)

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [isSpinning, targetIndex])

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-8">
      {/* Status & Progress */}
      <div className="mb-4 text-center">
        {currentPartLabel && (
          <span className="inline-block px-3 py-1 bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 rounded-full text-xs font-bold uppercase tracking-wider mb-1.5 border border-violet-200 dark:border-violet-800">
            {currentPartLabel}
          </span>
        )}
        {progressLabel && (
          <p className="text-xs text-slate-500 font-semibold">{progressLabel}</p>
        )}
      </div>

      {/* Wheel Wrapper with Pointer */}
      <div className="relative flex items-center justify-center">
        {/* Top Pointer Arrow */}
        <div className="absolute -top-3 z-20 flex flex-col items-center pointer-events-none drop-shadow-md">
          <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[22px] border-t-amber-500" />
        </div>

        {/* Canvas */}
        <div className="rounded-full p-2 bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 shadow-2xl border-4 border-white dark:border-slate-700">
          <canvas
            ref={canvasRef}
            width={340}
            height={340}
            className="w-[280px] h-[280px] sm:w-[340px] sm:h-[340px] rounded-full transition-all"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs">
        <button
          onClick={onSpinClick}
          disabled={disabled || isSpinning}
          className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white font-extrabold text-base rounded-xl shadow-lg shadow-indigo-500/25 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSpinning ? (
            <>
              <RotateCw className="w-5 h-5 animate-spin" />
              Đang quay chủ đề...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-amber-300" />
              BỐC ĐỀ (RANDOM)
            </>
          )}
        </button>

        {onQuickPick && (
          <button
            onClick={onQuickPick}
            disabled={disabled || isSpinning}
            className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 underline flex items-center gap-1 transition-colors py-1"
            title="Bỏ qua hiệu ứng vòng xoay (Dành cho người cần thao tác nhanh hoặc giảm chuyển động)"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Bốc nhanh (không xoay)
          </button>
        )}
      </div>
    </div>
  )
}
