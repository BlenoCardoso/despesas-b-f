// Hook para funcionalidades PWA avançadas
import { useState, useEffect, useCallback } from 'react'

interface PWAState {
  isInstallable: boolean
  isInstalled: boolean
  isStandalone: boolean
  installPrompt: any
  updateAvailable: boolean
  swRegistration: ServiceWorkerRegistration | null
}

interface NotificationPermission {
  granted: boolean
  denied: boolean
  default: boolean
}

export function useAdvancedPWA() {
  const [pwaState, setPwaState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isStandalone: false,
    installPrompt: null,
    updateAvailable: false,
    swRegistration: null
  })

  const [notificationPermissions, setNotificationPermissions] = useState<NotificationPermission>({
    granted: false,
    denied: false,
    default: true
  })

  // Check PWA installation state
  useEffect(() => {
    // Check if running in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true

    // Check if already installed
    const isInstalled = isStandalone || window.location.href.includes('source=pwa')

    setPwaState(prev => ({
      ...prev,
      isStandalone,
      isInstalled
    }))

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setPwaState(prev => ({
        ...prev,
        isInstallable: true,
        installPrompt: e
      }))
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Check notification permissions
    if ('Notification' in window) {
      const permission = Notification.permission
      setNotificationPermissions({
        granted: permission === 'granted',
        denied: permission === 'denied',
        default: permission === 'default'
      })
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  // Register service worker and check for updates
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          setPwaState(prev => ({
            ...prev,
            swRegistration: registration
          }))

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setPwaState(prev => ({
                    ...prev,
                    updateAvailable: true
                  }))
                }
              })
            }
          })
        })
        .catch(console.error)
    }
  }, [])

  // Install PWA
  const installPWA = useCallback(async () => {
    if (pwaState.installPrompt) {
      try {
        const result = await pwaState.installPrompt.prompt()
        console.log('Install result:', result)
        
        setPwaState(prev => ({
          ...prev,
          installPrompt: null,
          isInstallable: false,
          isInstalled: result.outcome === 'accepted'
        }))
      } catch (error) {
        console.error('Install error:', error)
      }
    }
  }, [pwaState.installPrompt])

  // Update PWA
  const updatePWA = useCallback(() => {
    if (pwaState.swRegistration?.waiting) {
      pwaState.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' })
      window.location.reload()
    }
  }, [pwaState.swRegistration])

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('Este browser não suporta notificações')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      
      setNotificationPermissions({
        granted: permission === 'granted',
        denied: permission === 'denied',
        default: permission === 'default'
      })

      return permission === 'granted'
    } catch (error) {
      console.error('Erro ao solicitar permissão de notificação:', error)
      return false
    }
  }, [])

  // Send local notification
  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!notificationPermissions.granted) {
      console.log('Permissão de notificação não concedida')
      return null
    }

    try {
      const notification = new Notification(title, {
        badge: '/favicon.ico',
        icon: '/favicon.ico',
        ...options
      })

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close()
      }, 5000)

      return notification
    } catch (error) {
      console.error('Erro ao enviar notificação:', error)
      return null
    }
  }, [notificationPermissions.granted])

  // Schedule notification for expense reminders
  const scheduleExpenseReminder = useCallback((title: string, message: string, delay: number) => {
    setTimeout(() => {
      sendNotification(title, {
        body: message,
        tag: 'expense-reminder',
        requireInteraction: true
      })
    }, delay)
  }, [sendNotification])

  // Share data using Web Share API
  const shareExpenseData = useCallback(async (data: {
    title: string
    text: string
    url?: string
  }) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: data.title,
          text: data.text,
          url: data.url || window.location.href
        })
        return true
      } catch (error) {
        console.error('Erro ao compartilhar:', error)
        return false
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${data.title}\n${data.text}\n${data.url || ''}`)
        return true
      } catch (error) {
        console.error('Erro ao copiar para clipboard:', error)
        return false
      }
    }
  }, [])

  // Check device capabilities
  const getDeviceCapabilities = useCallback(() => {
    return {
      hasCamera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      hasGeolocation: !!navigator.geolocation,
      hasVibration: !!navigator.vibrate,
      hasShare: !!navigator.share,
      hasClipboard: !!navigator.clipboard,
      hasNotifications: 'Notification' in window,
      hasPushMessaging: 'PushManager' in window,
      hasServiceWorker: 'serviceWorker' in navigator,
      isOnline: navigator.onLine,
      connectionType: (navigator as any).connection?.effectiveType || 'unknown',
      deviceMemory: (navigator as any).deviceMemory || 'unknown',
      hardwareConcurrency: navigator.hardwareConcurrency || 'unknown'
    }
  }, [])

  // Add to home screen prompt for iOS
  const showIOSInstallPrompt = useCallback(() => {
    if (isIOS() && !pwaState.isStandalone) {
      return {
        show: true,
        message: 'Para instalar este app, toque no botão de compartilhar e selecione "Adicionar à Tela de Início"'
      }
    }
    return { show: false, message: '' }
  }, [pwaState.isStandalone])

  // Check if device is iOS
  const isIOS = useCallback(() => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent)
  }, [])

  // Vibrate device (if supported)
  const vibrate = useCallback((pattern: number | number[]) => {
    if (navigator.vibrate) {
      navigator.vibrate(pattern)
    }
  }, [])

  // Get storage usage (if supported)
  const getStorageUsage = useCallback(async () => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate()
        return {
          used: estimate.usage || 0,
          available: estimate.quota || 0,
          percentage: estimate.usage && estimate.quota 
            ? (estimate.usage / estimate.quota) * 100 
            : 0
        }
      } catch (error) {
        console.error('Erro ao obter uso de armazenamento:', error)
      }
    }
    return null
  }, [])

  return {
    // PWA State
    ...pwaState,
    notificationPermissions,
    
    // PWA Actions
    installPWA,
    updatePWA,
    
    // Notifications
    requestNotificationPermission,
    sendNotification,
    scheduleExpenseReminder,
    
    // Device capabilities
    getDeviceCapabilities,
    shareExpenseData,
    vibrate,
    getStorageUsage,
    
    // iOS specific
    showIOSInstallPrompt,
    isIOS: isIOS()
  }
}