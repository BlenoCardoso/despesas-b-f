import { useState, useEffect, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

interface PWAState {
  isInstallable: boolean
  isInstalled: boolean
  isOnline: boolean
  isUpdateAvailable: boolean
  isLoading: boolean
  error: string | null
}

interface PWAActions {
  install: () => Promise<boolean>
  update: () => Promise<void>
  registerForPush: () => Promise<boolean>
  unregisterPush: () => Promise<boolean>
  syncData: (tag: string) => Promise<void>
  clearCache: () => Promise<void>
}

export function usePWA(): PWAState & PWAActions {
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOnline: navigator.onLine,
    isUpdateAvailable: false,
    isLoading: true,
    error: null,
  })

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  // Check if app is installed
  const checkInstallStatus = useCallback(() => {
    const isInstalled = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')

    setState(prev => ({ ...prev, isInstalled }))
  }, [])

  // Register Service Worker (only in production). In dev, ensure no SW interferes with Vite HMR.
  const registerServiceWorker = useCallback(async () => {
    // In development, actively unregister any existing SWs and clear caches once to avoid HMR issues
    const isDev = ((import.meta as any)?.env?.DEV === true) ||
      (typeof location !== 'undefined' && (location.hostname === 'localhost' || location.hostname === '127.0.0.1'))
    if (isDev) {
      try {
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations()
          for (const reg of regs) {
            try {
              await reg.unregister()
            } catch (_) {
              // ignore
            }
          }
        }
        // Best-effort cache clear in dev to avoid stale assets
        if ('caches' in window) {
          const names = await caches.keys()
          await Promise.all(names.map((n) => caches.delete(n)))
        }
        console.log('[PWA] Dev mode: Service Workers unregistered and caches cleared')
      } catch (e) {
        console.warn('[PWA] Dev cleanup failed', e)
      } finally {
        setState(prev => ({ ...prev, isLoading: false }))
      }
      return
    }

    // Production registration path
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none'
        })

        setRegistration(reg)

        // Check for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setState(prev => ({ ...prev, isUpdateAvailable: true }))
              }
            })
          }
        })

        // Listen for controller change (new SW activated)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload()
        })

        console.log('Service Worker registered successfully')
        setState(prev => ({ ...prev, isLoading: false }))
      } catch (error) {
        console.error('Service Worker registration failed:', error)
        setState(prev => ({ 
          ...prev, 
          error: 'Falha ao registrar Service Worker',
          isLoading: false 
        }))
      }
    } else {
      setState(prev => ({ 
        ...prev, 
        error: 'Service Worker não suportado',
        isLoading: false 
      }))
    }
  }, [])

  // Install app
  const install = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false
    }

    try {
      await deferredPrompt.prompt()
      const choiceResult = await deferredPrompt.userChoice

      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt')
        setDeferredPrompt(null)
        setState(prev => ({ ...prev, isInstallable: false, isInstalled: true }))
        return true
      } else {
        console.log('User dismissed the install prompt')
        return false
      }
    } catch (error) {
      console.error('Error during app installation:', error)
      setState(prev => ({ ...prev, error: 'Erro durante a instalação' }))
      return false
    }
  }, [deferredPrompt])

  // Update app
  const update = useCallback(async (): Promise<void> => {
    if (!registration || !registration.waiting) {
      return
    }

    try {
      // Tell the waiting SW to skip waiting and become active
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      setState(prev => ({ ...prev, isUpdateAvailable: false }))
    } catch (error) {
      console.error('Error updating app:', error)
      setState(prev => ({ ...prev, error: 'Erro ao atualizar aplicativo' }))
    }
  }, [registration])

  // Register for push notifications
  const registerForPush = useCallback(async (): Promise<boolean> => {
    if (!registration) {
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        return false
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: new Uint8Array(urlBase64ToUint8Array(
          // Replace with your VAPID public key
          'BEl62iUYgUivxIkv69yViEuiBIa40HI80NM9LdNnC_NNPJ6QKJJ5QKJJ5QKJJ5QKJJ5QKJJ5QKJJ5QKJJ5QKJJ5'
        ) as unknown as ArrayLike<number>)
      })

      console.log('Push subscription:', subscription)
      
      // Send subscription to your server
      // await sendSubscriptionToServer(subscription)
      
      return true
    } catch (error) {
      console.error('Error registering for push:', error)
      setState(prev => ({ ...prev, error: 'Erro ao registrar notificações push' }))
      return false
    }
  }, [registration])

  // Unregister push notifications
  const unregisterPush = useCallback(async (): Promise<boolean> => {
    if (!registration) {
      return false
    }

    try {
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await subscription.unsubscribe()
        console.log('Push subscription unregistered')
        return true
      }
      return false
    } catch (error) {
      console.error('Error unregistering push:', error)
      setState(prev => ({ ...prev, error: 'Erro ao cancelar notificações push' }))
      return false
    }
  }, [registration])

  // Sync data in background
  const syncData = useCallback(async (tag: string): Promise<void> => {
    const swr: any = registration as any
    if (!registration || !(swr?.sync && 'register' in swr.sync)) {
      console.warn('Background Sync not supported')
      return
    }

    try {
      await (swr.sync.register(tag))
      console.log(`Background sync registered for tag: ${tag}`)
    } catch (error) {
      console.error('Error registering background sync:', error)
      setState(prev => ({ ...prev, error: 'Erro ao registrar sincronização' }))
    }
  }, [registration])

  // Clear cache
  const clearCache = useCallback(async (): Promise<void> => {
    try {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      )
      console.log('All caches cleared')
      
      // Reload the page to get fresh content
      window.location.reload()
    } catch (error) {
      console.error('Error clearing cache:', error)
      setState(prev => ({ ...prev, error: 'Erro ao limpar cache' }))
    }
  }, [])

  // Setup event listeners
  useEffect(() => {
    // Install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const event = e as BeforeInstallPromptEvent
      setDeferredPrompt(event)
      setState(prev => ({ ...prev, isInstallable: true }))
    }

    // App installed event
    const handleAppInstalled = () => {
      console.log('App was installed')
      setState(prev => ({ ...prev, isInstalled: true, isInstallable: false }))
      setDeferredPrompt(null)
    }

    // Online/offline events
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }))
    }

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }))
    }

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check install status and register SW
    checkInstallStatus()
    registerServiceWorker()

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [checkInstallStatus, registerServiceWorker])

  return {
    ...state,
    install,
    update,
    registerForPush,
    unregisterPush,
    syncData,
    clearCache,
  }
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// Hook for offline storage
export function useOfflineStorage() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [pendingActions, setPendingActions] = useState<any[]>([])

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const addPendingAction = useCallback((action: any) => {
    setPendingActions(prev => [...prev, { ...action, timestamp: Date.now() }])
  }, [])

  const clearPendingActions = useCallback(() => {
    setPendingActions([])
  }, [])

  const processPendingActions = useCallback(async () => {
    if (pendingActions.length === 0) return

    try {
      // Process each pending action
      for (const action of pendingActions) {
        // Implementation depends on your action structure
        console.log('Processing pending action:', action)
      }
      
      clearPendingActions()
    } catch (error) {
      console.error('Error processing pending actions:', error)
    }
  }, [pendingActions, clearPendingActions])

  // Process pending actions when coming back online
  useEffect(() => {
    if (!isOffline && pendingActions.length > 0) {
      processPendingActions()
    }
  }, [isOffline, pendingActions.length, processPendingActions])

  return {
    isOffline,
    pendingActions,
    addPendingAction,
    clearPendingActions,
    processPendingActions,
  }
}

