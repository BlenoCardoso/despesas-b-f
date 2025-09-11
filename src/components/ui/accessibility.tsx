import React from 'react'
import { cn } from '@/lib/utils'

// Skip to main content link
export function SkipToMain() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:shadow-lg"
    >
      Pular para o conteúdo principal
    </a>
  )
}

// Screen reader only text
interface ScreenReaderOnlyProps {
  children: React.ReactNode
  className?: string
}

export function ScreenReaderOnly({ children, className }: ScreenReaderOnlyProps) {
  return (
    <span className={cn("sr-only", className)}>
      {children}
    </span>
  )
}

// Focus trap for modals and dialogs
interface FocusTrapProps {
  children: React.ReactNode
  enabled?: boolean
}

export function FocusTrap({ children, enabled = true }: FocusTrapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!enabled || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus()
          e.preventDefault()
        }
      }
    }

    container.addEventListener('keydown', handleTabKey)
    firstElement?.focus()

    return () => {
      container.removeEventListener('keydown', handleTabKey)
    }
  }, [enabled])

  return (
    <div ref={containerRef}>
      {children}
    </div>
  )
}

// Announcement for screen readers
interface AnnouncementProps {
  message: string
  priority?: 'polite' | 'assertive'
}

export function Announcement({ message, priority = 'polite' }: AnnouncementProps) {
  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  )
}

// Loading indicator with proper accessibility
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  label?: string
  className?: string
}

export function LoadingSpinner({ 
  size = 'md', 
  label = 'Carregando...', 
  className 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-gray-300 border-t-blue-600",
          sizeClasses[size]
        )}
        role="status"
        aria-label={label}
      >
        <ScreenReaderOnly>{label}</ScreenReaderOnly>
      </div>
    </div>
  )
}

// Error message with proper accessibility
interface ErrorMessageProps {
  message: string
  id?: string
  className?: string
}

export function ErrorMessage({ message, id, className }: ErrorMessageProps) {
  return (
    <div
      id={id}
      role="alert"
      aria-live="assertive"
      className={cn(
        "text-sm text-red-600 dark:text-red-400 mt-1",
        className
      )}
    >
      {message}
    </div>
  )
}

// Success message with proper accessibility
interface SuccessMessageProps {
  message: string
  id?: string
  className?: string
}

export function SuccessMessage({ message, id, className }: SuccessMessageProps) {
  return (
    <div
      id={id}
      role="status"
      aria-live="polite"
      className={cn(
        "text-sm text-green-600 dark:text-green-400 mt-1",
        className
      )}
    >
      {message}
    </div>
  )
}

// Progress indicator
interface ProgressProps {
  value: number
  max?: number
  label?: string
  className?: string
}

export function Progress({ value, max = 100, label, className }: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="flex justify-between text-sm mb-1">
          <span>{label}</span>
          <span>{percentage.toFixed(0)}%</span>
        </div>
      )}
      <div
        className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

// Keyboard navigation helper
export function useKeyboardNavigation(
  items: string[],
  onSelect: (item: string) => void,
  enabled = true
) {
  const [activeIndex, setActiveIndex] = React.useState(-1)

  const handleKeyDown = React.useCallback((e: KeyboardEvent) => {
    if (!enabled || items.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex(prev => (prev + 1) % items.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex(prev => prev <= 0 ? items.length - 1 : prev - 1)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (activeIndex >= 0 && activeIndex < items.length) {
          onSelect(items[activeIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setActiveIndex(-1)
        break
    }
  }, [enabled, items, activeIndex, onSelect])

  React.useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, handleKeyDown])

  return { activeIndex, setActiveIndex }
}

// High contrast mode detector
export function useHighContrastMode() {
  const [isHighContrast, setIsHighContrast] = React.useState(false)

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)')
    setIsHighContrast(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return isHighContrast
}

// Reduced motion detector
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false)

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}

// Focus management hook
export function useFocusManagement() {
  const focusRef = React.useRef<HTMLElement | null>(null)

  const saveFocus = React.useCallback(() => {
    focusRef.current = document.activeElement as HTMLElement
  }, [])

  const restoreFocus = React.useCallback(() => {
    if (focusRef.current && typeof focusRef.current.focus === 'function') {
      focusRef.current.focus()
    }
  }, [])

  const focusFirst = React.useCallback((container: HTMLElement) => {
    const focusableElement = container.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement
    
    if (focusableElement) {
      focusableElement.focus()
    }
  }, [])

  return { saveFocus, restoreFocus, focusFirst }
}

