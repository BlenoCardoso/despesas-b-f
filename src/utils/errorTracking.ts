import { generateId } from '@/core/utils/id'

export interface ErrorInfo {
  id: string
  message: string
  stack?: string
  componentStack?: string
  timestamp: Date
  url: string
  userAgent: string
  userId?: string
  householdId?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: 'javascript' | 'network' | 'database' | 'user' | 'performance'
  metadata?: Record<string, any>
  resolved: boolean
}

export interface PerformanceMetric {
  id: string
  name: string
  value: number
  timestamp: Date
  url: string
  metadata?: Record<string, any>
}

class ErrorTracker {
  private errors: ErrorInfo[] = []
  private metrics: PerformanceMetric[] = []
  private maxErrors = 1000
  private maxMetrics = 500

  constructor() {
    this.setupGlobalErrorHandlers()
    this.setupPerformanceMonitoring()
  }

  private setupGlobalErrorHandlers() {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.captureError({
        message: event.message,
        stack: event.error?.stack,
        severity: 'high',
        category: 'javascript',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      })
    })

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        severity: 'high',
        category: 'javascript',
        metadata: {
          reason: event.reason
        }
      })
    })

    // Network errors
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args)
        
        if (!response.ok) {
          this.captureError({
            message: `Network Error: ${response.status} ${response.statusText}`,
            severity: response.status >= 500 ? 'high' : 'medium',
            category: 'network',
            metadata: {
              url: args[0],
              status: response.status,
              statusText: response.statusText
            }
          })
        }
        
        return response
      } catch (error) {
        this.captureError({
          message: `Network Error: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
          severity: 'high',
          category: 'network',
          metadata: {
            url: args[0],
            error: error instanceof Error ? error.message : String(error)
          }
        })
        throw error
      }
    }
  }

  private setupPerformanceMonitoring() {
    // Monitor Core Web Vitals
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.captureMetric({
            name: 'LCP',
            value: entry.startTime,
            metadata: {
              element: (entry as any).element?.tagName,
              url: (entry as any).url
            }
          })
        }
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.captureMetric({
            name: 'FID',
            value: (entry as any).processingStart - entry.startTime,
            metadata: {
              name: entry.name,
              startTime: entry.startTime
            }
          })
        }
      })
      fidObserver.observe({ entryTypes: ['first-input'] })

      // Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value
          }
        }
        
        if (clsValue > 0) {
          this.captureMetric({
            name: 'CLS',
            value: clsValue
          })
        }
      })
      clsObserver.observe({ entryTypes: ['layout-shift'] })

      // Long tasks
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.captureMetric({
            name: 'Long Task',
            value: entry.duration,
            metadata: {
              startTime: entry.startTime,
              name: entry.name
            }
          })
        }
      })
      longTaskObserver.observe({ entryTypes: ['longtask'] })
    }

    // Monitor memory usage
    setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        this.captureMetric({
          name: 'Memory Usage',
          value: memory.usedJSHeapSize,
          metadata: {
            totalJSHeapSize: memory.totalJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit
          }
        })
      }
    }, 30000) // Every 30 seconds
  }

  captureError(errorData: Partial<ErrorInfo>) {
    const error: ErrorInfo = {
      id: generateId(),
      message: errorData.message || 'Unknown error',
      stack: errorData.stack,
      componentStack: errorData.componentStack,
      timestamp: new Date(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: errorData.userId,
      householdId: errorData.householdId,
      severity: errorData.severity || 'medium',
      category: errorData.category || 'javascript',
      metadata: errorData.metadata,
      resolved: false
    }

    this.errors.push(error)

    // Keep only the most recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors)
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error captured:', error)
    }

    // Send to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalService(error)
    }

    return error
  }

  captureMetric(metricData: Partial<PerformanceMetric>) {
    const metric: PerformanceMetric = {
      id: generateId(),
      name: metricData.name || 'Unknown metric',
      value: metricData.value || 0,
      timestamp: new Date(),
      url: window.location.href,
      metadata: metricData.metadata
    }

    this.metrics.push(metric)

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }

    // Log performance issues
    if (this.isPerformanceIssue(metric)) {
      this.captureError({
        message: `Performance issue: ${metric.name} = ${metric.value}ms`,
        severity: 'medium',
        category: 'performance',
        metadata: { metric }
      })
    }

    return metric
  }

  private isPerformanceIssue(metric: PerformanceMetric): boolean {
    const thresholds = {
      'LCP': 2500, // 2.5 seconds
      'FID': 100,  // 100ms
      'CLS': 0.1,  // 0.1
      'Long Task': 50 // 50ms
    }

    return metric.value > (thresholds[metric.name as keyof typeof thresholds] || Infinity)
  }

  private async sendToExternalService(error: ErrorInfo) {
    try {
      // This would send to a service like Sentry, LogRocket, etc.
      // For now, we'll just store it locally
      const existingErrors = JSON.parse(localStorage.getItem('app_errors') || '[]')
      existingErrors.push(error)
      
      // Keep only last 100 errors in localStorage
      if (existingErrors.length > 100) {
        existingErrors.splice(0, existingErrors.length - 100)
      }
      
      localStorage.setItem('app_errors', JSON.stringify(existingErrors))
    } catch (e) {
      console.error('Failed to send error to external service:', e)
    }
  }

  getErrors(filters?: {
    severity?: ErrorInfo['severity']
    category?: ErrorInfo['category']
    resolved?: boolean
    limit?: number
  }): ErrorInfo[] {
    let filteredErrors = [...this.errors]

    if (filters?.severity) {
      filteredErrors = filteredErrors.filter(e => e.severity === filters.severity)
    }

    if (filters?.category) {
      filteredErrors = filteredErrors.filter(e => e.category === filters.category)
    }

    if (filters?.resolved !== undefined) {
      filteredErrors = filteredErrors.filter(e => e.resolved === filters.resolved)
    }

    if (filters?.limit) {
      filteredErrors = filteredErrors.slice(-filters.limit)
    }

    return filteredErrors.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  getMetrics(filters?: {
    name?: string
    limit?: number
  }): PerformanceMetric[] {
    let filteredMetrics = [...this.metrics]

    if (filters?.name) {
      filteredMetrics = filteredMetrics.filter(m => m.name === filters.name)
    }

    if (filters?.limit) {
      filteredMetrics = filteredMetrics.slice(-filters.limit)
    }

    return filteredMetrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  resolveError(errorId: string) {
    const error = this.errors.find(e => e.id === errorId)
    if (error) {
      error.resolved = true
    }
  }

  clearErrors() {
    this.errors = []
  }

  clearMetrics() {
    this.metrics = []
  }

  getErrorStats() {
    const total = this.errors.length
    const resolved = this.errors.filter(e => e.resolved).length
    const unresolved = total - resolved

    const bySeverity = this.errors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byCategory = this.errors.reduce((acc, error) => {
      acc[error.category] = (acc[error.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total,
      resolved,
      unresolved,
      bySeverity,
      byCategory
    }
  }

  getPerformanceStats() {
    const metricsByName = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = []
      }
      acc[metric.name].push(metric.value)
      return acc
    }, {} as Record<string, number[]>)

    const stats = Object.entries(metricsByName).map(([name, values]) => {
      const sorted = values.sort((a, b) => a - b)
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length
      const median = sorted[Math.floor(sorted.length / 2)]
      const p95 = sorted[Math.floor(sorted.length * 0.95)]

      return {
        name,
        count: values.length,
        avg,
        median,
        p95,
        min: sorted[0],
        max: sorted[sorted.length - 1]
      }
    })

    return stats
  }

  exportData() {
    return {
      errors: this.errors,
      metrics: this.metrics,
      errorStats: this.getErrorStats(),
      performanceStats: this.getPerformanceStats(),
      exportedAt: new Date()
    }
  }
}

// React Error Boundary
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    errorTracker.captureError({
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      severity: 'high',
      category: 'javascript'
    })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return <FallbackComponent error={this.state.error!} />
    }

    return this.props.children
  }
}

function DefaultErrorFallback({ error }: { error: Error }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Algo deu errado
            </h3>
          </div>
        </div>
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Ocorreu um erro inesperado. Nossa equipe foi notificada e está trabalhando para resolver o problema.
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => window.location.reload()}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Recarregar página
          </button>
          <button
            onClick={() => window.history.back()}
            className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Voltar
          </button>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4">
            <summary className="text-sm text-gray-500 cursor-pointer">
              Detalhes do erro (desenvolvimento)
            </summary>
            <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}

// Create singleton instance
export const errorTracker = new ErrorTracker()

// Hook for using error tracker in components
export function useErrorTracker() {
  return {
    captureError: errorTracker.captureError.bind(errorTracker),
    captureMetric: errorTracker.captureMetric.bind(errorTracker),
    getErrors: errorTracker.getErrors.bind(errorTracker),
    getMetrics: errorTracker.getMetrics.bind(errorTracker),
    getErrorStats: errorTracker.getErrorStats.bind(errorTracker),
    getPerformanceStats: errorTracker.getPerformanceStats.bind(errorTracker)
  }
}

