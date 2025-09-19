"use client"

import * as React from "react"
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ToastProps {
  title?: string
  description?: string
  type?: "success" | "error" | "info" | "warning"
  onClose?: () => void
  duration?: number
}

export function Toast({ title, description, type = "info", onClose, duration = 5000 }: ToastProps) {
  const [isVisible, setIsVisible] = React.useState(true)

  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => onClose?.(), 300)
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
  }

  const colors = {
    success: "border-green-200 bg-green-50 text-green-800",
    error: "border-red-200 bg-red-50 text-red-800",
    info: "border-blue-200 bg-blue-50 text-blue-800",
    warning: "border-yellow-200 bg-yellow-50 text-yellow-800",
  }

  const iconColors = {
    success: "text-green-500",
    error: "text-red-500",
    info: "text-blue-500",
    warning: "text-yellow-500",
  }

  const Icon = icons[type]

  if (!isVisible) return null

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 w-96 p-4 rounded-lg border-2 shadow-lg transition-all duration-300",
        colors[type],
        isVisible ? "animate-in slide-in-from-right-full" : "animate-out slide-out-to-right-full",
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn("w-5 h-5 mt-0.5 flex-shrink-0", iconColors[type])} />
        <div className="flex-1 min-w-0">
          {title && <div className="font-semibold text-sm">{title}</div>}
          {description && <div className="text-sm mt-1 opacity-90">{description}</div>}
        </div>
        {onClose && (
          <button
            onClick={() => {
              setIsVisible(false)
              setTimeout(() => onClose(), 300)
            }}
            className="flex-shrink-0 p-1 rounded-md hover:bg-black/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

export function useToast() {
  const [toasts, setToasts] = React.useState<Array<ToastProps & { id: string }>>([])

  const toast = React.useCallback((props: ToastProps) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { ...props, id }])
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return {
    toast,
    toasts: toasts.map((toast) => ({
      ...toast,
      onClose: () => removeToast(toast.id),
    })),
  }
}
