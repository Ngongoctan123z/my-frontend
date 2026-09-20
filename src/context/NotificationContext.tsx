import { CheckCircle, Info, X, XCircle } from 'lucide-react'
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

type ToastTone = 'success' | 'info' | 'danger'

type Toast = {
  id: number
  message: string
  tone: ToastTone
}

type NotificationContextValue = {
  notify: (message: string, tone?: ToastTone) => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

const toneConfig: Record<ToastTone, { icon: typeof CheckCircle; bg: string }> = {
  success: { icon: CheckCircle, bg: 'bg-[#059669]' },
  danger:  { icon: XCircle,     bg: 'bg-[#DC2626]' },
  info:    { icon: Info,        bg: 'bg-[#2563EB]' },
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id))
  }, [])

  const notify = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((current) => [...current, { id, message, tone }])
    window.setTimeout(() => dismiss(id), 3200)
  }, [dismiss])

  const value = useMemo(() => ({ notify }), [notify])

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div
        className="fixed right-4 bottom-4 z-50 flex w-[min(100%-2rem,360px)] flex-col gap-2"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((toast) => {
          const cfg = toneConfig[toast.tone]
          const Icon = cfg.icon
          return (
            <div
              key={toast.id}
              role="alert"
              className={`toast-enter flex items-start gap-3 rounded-xl px-4 py-3.5 text-sm font-medium text-white shadow-xl ${cfg.bg}`}
            >
              <Icon size={18} className="mt-0.5 shrink-0 opacity-90" />
              <span className="flex-1 leading-snug">{toast.message}</span>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="shrink-0 opacity-70 transition-opacity hover:opacity-100"
                aria-label="Đóng thông báo"
              >
                <X size={15} />
              </button>
            </div>
          )
        })}
      </div>
    </NotificationContext.Provider>
  )
}

export function useNotify() {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('useNotify must be used within NotificationProvider')
  return context
}
