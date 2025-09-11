import { useState, useEffect, useCallback, useMemo, useRef } from 'react'

// Virtual scrolling hook for large lists
export function useVirtualScrolling<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan = 5
) {
  const [scrollTop, setScrollTop] = useState(0)

  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight)
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight),
      items.length
    )

    return {
      start: Math.max(0, start - overscan),
      end: Math.min(items.length, end + overscan)
    }
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan])

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      item,
      index: visibleRange.start + index
    }))
  }, [items, visibleRange])

  const totalHeight = items.length * itemHeight

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  return {
    visibleItems,
    totalHeight,
    visibleRange,
    handleScroll,
    offsetY: visibleRange.start * itemHeight
  }
}

// Debounced value hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Throttled callback hook
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now())

  return useCallback(
    ((...args) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args)
        lastRun.current = Date.now()
      }
    }) as T,
    [callback, delay]
  )
}

// Intersection observer hook for lazy loading
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null)
  const elementRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
        setEntry(entry)
      },
      options
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [options])

  return { elementRef, isIntersecting, entry }
}

// Image lazy loading hook
export function useLazyImage(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = useState(placeholder || '')
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)
  const { elementRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px'
  })

  useEffect(() => {
    if (isIntersecting && src && !isLoaded && !isError) {
      const img = new Image()
      
      img.onload = () => {
        setImageSrc(src)
        setIsLoaded(true)
      }
      
      img.onerror = () => {
        setIsError(true)
      }
      
      img.src = src
    }
  }, [isIntersecting, src, isLoaded, isError])

  return { elementRef, imageSrc, isLoaded, isError }
}

// Memory usage monitor
export function useMemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = useState<{
    usedJSHeapSize: number
    totalJSHeapSize: number
    jsHeapSizeLimit: number
  } | null>(null)

  useEffect(() => {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        setMemoryInfo({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        })
      }
    }

    updateMemoryInfo()
    const interval = setInterval(updateMemoryInfo, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  return memoryInfo
}

// Performance metrics hook
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<{
    renderTime: number
    componentCount: number
    reRenderCount: number
  }>({
    renderTime: 0,
    componentCount: 0,
    reRenderCount: 0
  })

  const renderStartTime = useRef<number>(0)
  const reRenderCount = useRef<number>(0)

  useEffect(() => {
    renderStartTime.current = performance.now()
    reRenderCount.current += 1

    return () => {
      const renderTime = performance.now() - renderStartTime.current
      setMetrics(prev => ({
        ...prev,
        renderTime,
        reRenderCount: reRenderCount.current
      }))
    }
  })

  const measureComponent = useCallback((name: string) => {
    performance.mark(`${name}-start`)
    
    return () => {
      performance.mark(`${name}-end`)
      performance.measure(name, `${name}-start`, `${name}-end`)
    }
  }, [])

  return { metrics, measureComponent }
}

// Bundle size analyzer
export function useBundleAnalyzer() {
  const [bundleInfo, setBundleInfo] = useState<{
    totalSize: number
    gzippedSize: number
    modules: Array<{ name: string; size: number }>
  } | null>(null)

  useEffect(() => {
    // This would integrate with webpack-bundle-analyzer or similar
    // For now, we'll simulate the data
    const simulatedBundleInfo = {
      totalSize: 2.5 * 1024 * 1024, // 2.5MB
      gzippedSize: 800 * 1024, // 800KB
      modules: [
        { name: 'react', size: 42 * 1024 },
        { name: 'react-dom', size: 130 * 1024 },
        { name: 'recharts', size: 180 * 1024 },
        { name: 'dexie', size: 85 * 1024 },
        { name: 'app-code', size: 350 * 1024 }
      ]
    }

    setBundleInfo(simulatedBundleInfo)
  }, [])

  return bundleInfo
}

// Code splitting helper
export function useDynamicImport<T>(
  importFunc: () => Promise<{ default: T }>,
  deps: any[] = []
) {
  const [component, setComponent] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setIsLoading(true)
    setError(null)

    importFunc()
      .then(module => {
        setComponent(module.default)
        setIsLoading(false)
      })
      .catch(err => {
        setError(err)
        setIsLoading(false)
      })
  }, deps)

  return { component, isLoading, error }
}

// Resource preloader
export function useResourcePreloader() {
  const preloadedResources = useRef<Set<string>>(new Set())

  const preloadImage = useCallback((src: string) => {
    if (preloadedResources.current.has(src)) return

    const img = new Image()
    img.src = src
    preloadedResources.current.add(src)
  }, [])

  const preloadScript = useCallback((src: string) => {
    if (preloadedResources.current.has(src)) return

    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'script'
    link.href = src
    document.head.appendChild(link)
    preloadedResources.current.add(src)
  }, [])

  const preloadStylesheet = useCallback((href: string) => {
    if (preloadedResources.current.has(href)) return

    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'style'
    link.href = href
    document.head.appendChild(link)
    preloadedResources.current.add(href)
  }, [])

  return { preloadImage, preloadScript, preloadStylesheet }
}

// Memoization helper with size limit
export function useMemoWithLimit<T>(
  factory: () => T,
  deps: React.DependencyList,
  limit = 100
): T {
  const cache = useRef<Map<string, T>>(new Map())

  return useMemo(() => {
    const key = JSON.stringify(deps)
    
    if (cache.current.has(key)) {
      return cache.current.get(key)!
    }

    const value = factory()
    
    // Implement LRU cache
    if (cache.current.size >= limit) {
      const firstKey = cache.current.keys().next().value
      cache.current.delete(firstKey)
    }
    
    cache.current.set(key, value)
    return value
  }, deps)
}

// Performance budget monitor
export function usePerformanceBudget() {
  const [budgetStatus, setBudgetStatus] = useState<{
    loadTime: number
    bundleSize: number
    memoryUsage: number
    isWithinBudget: boolean
  }>({
    loadTime: 0,
    bundleSize: 0,
    memoryUsage: 0,
    isWithinBudget: true
  })

  useEffect(() => {
    const checkBudget = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const loadTime = navigation.loadEventEnd - navigation.loadEventStart

      const memory = (performance as any).memory
      const memoryUsage = memory ? memory.usedJSHeapSize : 0

      // Simulated bundle size (would come from build tools)
      const bundleSize = 2.5 * 1024 * 1024 // 2.5MB

      // Budget thresholds
      const budgets = {
        loadTime: 3000, // 3 seconds
        bundleSize: 3 * 1024 * 1024, // 3MB
        memoryUsage: 50 * 1024 * 1024 // 50MB
      }

      const isWithinBudget = 
        loadTime <= budgets.loadTime &&
        bundleSize <= budgets.bundleSize &&
        memoryUsage <= budgets.memoryUsage

      setBudgetStatus({
        loadTime,
        bundleSize,
        memoryUsage,
        isWithinBudget
      })
    }

    // Check budget after page load
    if (document.readyState === 'complete') {
      checkBudget()
    } else {
      window.addEventListener('load', checkBudget)
      return () => window.removeEventListener('load', checkBudget)
    }
  }, [])

  return budgetStatus
}

