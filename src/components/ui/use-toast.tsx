import { create } from 'zustand'

type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info'

interface ToastAction {
  label: string
  onClick: () => void | Promise<void>
}

interface ToastState {
  message: string | null
  type?: ToastType
  action?: ToastAction
  showToast: (message: string, options?: { type?: ToastType; action?: ToastAction }) => void
  hideToast: () => void
}

const useToastStore = create<ToastState>((set) => ({
  message: null,
  type: 'default',
  action: undefined,
  showToast: (message, options = {}) => {
    set({ message, ...options })
    // Auto-hide after 5 seconds unless there's an action
    if (!options.action) {
      setTimeout(() => {
        set({ message: null })
      }, 5000)
    }
  },
  hideToast: () => set({ message: null }),
}))

// Convenience function for showing toasts
export const toast = (message: string, options?: { type?: ToastType; action?: ToastAction }) => {
  useToastStore.getState().showToast(message, options)
}

// Hook for accessing toast state and controls in components
export const useToast = () => {
  const { message, type, action, hideToast } = useToastStore()
  return { message, type, action, hideToast }
}