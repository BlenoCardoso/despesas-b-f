import { useState, useEffect } from 'react'
import { Gauge, Zap, Database, Wifi } from 'lucide-react'

interface PerformanceMetrics {
  memoryUsage: number
  loadTime: number
  dbSize: number
  networkStatus: 'online' | 'offline' | 'slow'
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    memoryUsage: 0,
    loadTime: 0,
    dbSize: 0,
    networkStatus: 'online'
  })

  useEffect(() => {
    const updateMetrics = () => {
      // Memory usage (estimativa)
      const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0

      // Load time
      const loadTime = performance.now()

      // Network status
      const connection = (navigator as any).connection
      let networkStatus: 'online' | 'offline' | 'slow' = 'online'
      
      if (!navigator.onLine) {
        networkStatus = 'offline'
      } else if (connection && connection.effectiveType === '2g') {
        networkStatus = 'slow'
      }

      setMetrics({
        memoryUsage: Math.round(memoryUsage / 1024 / 1024), // MB
        loadTime: Math.round(loadTime),
        dbSize: 0, // Seria calculado do IndexedDB
        networkStatus
      })
    }

    updateMetrics()
    const interval = setInterval(updateMetrics, 10000) // A cada 10 segundos

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (value: number, thresholds: { good: number; fair: number }) => {
    if (value <= thresholds.good) return 'text-green-500'
    if (value <= thresholds.fair) return 'text-orange-500'
    return 'text-red-500'
  }

  const getNetworkIcon = () => {
    switch (metrics.networkStatus) {
      case 'offline':
        return <Wifi className="w-4 h-4 text-red-500" />
      case 'slow':
        return <Wifi className="w-4 h-4 text-orange-500" />
      default:
        return <Wifi className="w-4 h-4 text-green-500" />
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
      <div className="flex items-center space-x-2 mb-4">
        <Gauge className="w-5 h-5 text-blue-500" />
        <h3 className="font-semibold">Performance</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-3">
          <Zap className="w-4 h-4 text-purple-500" />
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Memória</p>
            <p className={`text-lg font-bold ${getStatusColor(metrics.memoryUsage, { good: 50, fair: 100 })}`}>
              {metrics.memoryUsage} MB
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Database className="w-4 h-4 text-blue-500" />
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Banco</p>
            <p className="text-lg font-bold text-gray-700 dark:text-gray-300">
              {metrics.dbSize} MB
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {getNetworkIcon()}
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Rede</p>
            <p className="text-lg font-bold text-gray-700 dark:text-gray-300 capitalize">
              {metrics.networkStatus === 'online' ? 'Online' : 
               metrics.networkStatus === 'offline' ? 'Offline' : 'Lenta'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Gauge className="w-4 h-4 text-green-500" />
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Carregamento</p>
            <p className={`text-lg font-bold ${getStatusColor(metrics.loadTime, { good: 1000, fair: 3000 })}`}>
              {metrics.loadTime}ms
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook para monitoramento de performance
export function usePerformance() {
  const [isSlowDevice, setIsSlowDevice] = useState(false)
  const [shouldReduceAnimations, setShouldReduceAnimations] = useState(false)

  useEffect(() => {
    // Detectar dispositivo lento
    const connection = (navigator as any).connection
    const memoryInfo = (performance as any).memory
    
    const slowConnection = connection && connection.effectiveType === '2g'
    const lowMemory = memoryInfo && memoryInfo.totalJSHeapSize < 100 * 1024 * 1024 // < 100MB
    
    if (slowConnection || lowMemory) {
      setIsSlowDevice(true)
      setShouldReduceAnimations(true)
    }

    // Preferência do usuário para animações reduzidas
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      setShouldReduceAnimations(true)
    }
  }, [])

  return {
    isSlowDevice,
    shouldReduceAnimations
  }
}