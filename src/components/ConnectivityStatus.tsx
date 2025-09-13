import { useState, useEffect } from 'react'
import { WifiOff } from 'lucide-react'
import { toast } from 'sonner'

export function ConnectivityStatus() {
  const [showOfflineBanner, setShowOfflineBanner] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setShowOfflineBanner(false)
      toast.success('📶 Conexão restaurada! Sincronizando dados...', {
        duration: 3000
      })
    }

    const handleOffline = () => {
      setShowOfflineBanner(true)
      toast.warning('📱 Modo offline ativo. Dados serão sincronizados quando voltar online.', {
        duration: 5000
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!showOfflineBanner) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-orange-500 text-white px-4 py-2 text-center text-sm font-medium shadow-lg">
      <div className="flex items-center justify-center space-x-2">
        <WifiOff className="w-4 h-4" />
        <span>Modo offline - Suas alterações serão sincronizadas quando voltar online</span>
        <button
          onClick={() => setShowOfflineBanner(false)}
          className="ml-2 hover:bg-orange-600 rounded px-2 py-1 text-xs"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

// Hook para verificar status de conectividade
export function useConnectivity() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline }
}