import { toast as sonnerToast, Toaster } from 'sonner'

// Re-export sonner's Toaster component
export { Toaster }

// Custom toast types
type ToastType = 'default' | 'success' | 'error' | 'loading'

interface ToastOptions {
  type?: ToastType
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// Default toast options
const DEFAULT_DURATION = 5000

/**
 * Show a toast notification
 * @param message Main toast message
 * @param options Toast options including type, description, duration and action
 */
export function toast(message: string, options: ToastOptions = {}) {
  const { type = 'default', description, duration = DEFAULT_DURATION, action } = options

  const toastOptions = {
    duration,
    ...(description && { description }),
    ...(action && {
      action: {
        label: action.label,
        onClick: (toast: any) => {
          action.onClick()
          toast.dismiss()
        }
      }
    })
  }

  switch (type) {
    case 'success':
      sonnerToast.success(message, toastOptions)
      break
    case 'error':
      sonnerToast.error(message, toastOptions)
      break
    case 'loading':
      sonnerToast.loading(message, toastOptions)
      break
    default:
      sonnerToast(message, toastOptions)
  }
}

// Promise toast for async actions
export function promiseToast<T>(
  promise: Promise<T>,
  messages: {
    loading: string
    success: string
    error: string
  },
  options: Omit<ToastOptions, 'type'> = {}
) {
  return sonnerToast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: messages.error,
    duration: options.duration || DEFAULT_DURATION,
    ...(options.description && { description: options.description })
  })
}