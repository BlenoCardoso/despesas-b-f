import React, { useState } from 'react'
import { 
  Download, 
  Smartphone, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Trash2,
  Bell,
  BellOff,
  X,
  Check,
  AlertCircle
} from 'lucide-react'
import { usePWA, useOfflineStorage } from '@/hooks/usePWA'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

interface PWAStatusProps {
  showInHeader?: boolean
  className?: string
}

export function PWAStatus({ showInHeader = false, className = '' }: PWAStatusProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  
  const {
    isInstallable,
    isInstalled,
    isOnline,
    isUpdateAvailable,
    isLoading,
    error,
    install,
    update,
    registerForPush,
    unregisterPush,
    syncData,
    clearCache,
  } = usePWA()

  const {
    isOffline,
    pendingActions,
    processPendingActions,
  } = useOfflineStorage()

  const handleInstall = async () => {
    setIsInstalling(true)
    try {
      const success = await install()
      if (success) {
        toast.success('Aplicativo instalado com sucesso!')
      } else {
        toast.error('Instalação cancelada pelo usuário')
      }
    } catch (error) {
      toast.error('Erro durante a instalação')
    } finally {
      setIsInstalling(false)
    }
  }

  const handleUpdate = async () => {
    setIsUpdating(true)
    try {
      await update()
      toast.success('Aplicativo atualizado! Recarregando...')
    } catch (error) {
      toast.error('Erro ao atualizar aplicativo')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleRegisterPush = async () => {
    try {
      const success = await registerForPush()
      if (success) {
        toast.success('Notificações push ativadas!')
      } else {
        toast.error('Permissão para notificações negada')
      }
    } catch (error) {
      toast.error('Erro ao ativar notificações push')
    }
  }

  const handleUnregisterPush = async () => {
    try {
      const success = await unregisterPush()
      if (success) {
        toast.success('Notificações push desativadas!')
      } else {
        toast.info('Nenhuma inscrição de push encontrada')
      }
    } catch (error) {
      toast.error('Erro ao desativar notificações push')
    }
  }

  const handleSyncData = async () => {
    try {
      await syncData('sync-all-data')
      toast.success('Sincronização iniciada em background')
    } catch (error) {
      toast.error('Erro ao iniciar sincronização')
    }
  }

  const handleClearCache = async () => {
    try {
      await clearCache()
      toast.success('Cache limpo! Recarregando...')
    } catch (error) {
      toast.error('Erro ao limpar cache')
    }
  }

  const handleProcessPending = async () => {
    try {
      await processPendingActions()
      toast.success('Ações pendentes processadas!')
    } catch (error) {
      toast.error('Erro ao processar ações pendentes')
    }
  }

  if (isLoading) {
    return null
  }

  // Header version - compact
  if (showInHeader) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {/* Online/Offline indicator */}
        <div className="flex items-center">
          {isOnline ? (
            <Wifi className="h-4 w-4 text-green-600" title="Online" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-600" title="Offline" />
          )}
        </div>

        {/* Pending actions indicator */}
        {pendingActions.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {pendingActions.length} pendente{pendingActions.length > 1 ? 's' : ''}
          </Badge>
        )}

        {/* Install button */}
        {isInstallable && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleInstall}
            disabled={isInstalling}
            className="text-xs"
          >
            <Download className="h-3 w-3 mr-1" />
            Instalar
          </Button>
        )}

        {/* Update button */}
        {isUpdateAvailable && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleUpdate}
            disabled={isUpdating}
            className="text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Atualizar
          </Button>
        )}
      </div>
    )
  }

  // Full version - detailed
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Error alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Status cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Connection Status */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Conexão
              </p>
              <p className="text-lg font-semibold">
                {isOnline ? 'Online' : 'Offline'}
              </p>
            </div>
            {isOnline ? (
              <Wifi className="h-8 w-8 text-green-600" />
            ) : (
              <WifiOff className="h-8 w-8 text-red-600" />
            )}
          </div>
        </div>

        {/* Installation Status */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Instalação
              </p>
              <p className="text-lg font-semibold">
                {isInstalled ? 'Instalado' : 'Navegador'}
              </p>
            </div>
            <Smartphone className={`h-8 w-8 ${isInstalled ? 'text-green-600' : 'text-gray-400'}`} />
          </div>
        </div>

        {/* Pending Actions */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Ações Pendentes
              </p>
              <p className="text-lg font-semibold">
                {pendingActions.length}
              </p>
            </div>
            <RefreshCw className={`h-8 w-8 ${pendingActions.length > 0 ? 'text-orange-600' : 'text-gray-400'}`} />
          </div>
        </div>

        {/* Update Status */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Atualização
              </p>
              <p className="text-lg font-semibold">
                {isUpdateAvailable ? 'Disponível' : 'Atualizado'}
              </p>
            </div>
            <Download className={`h-8 w-8 ${isUpdateAvailable ? 'text-blue-600' : 'text-gray-400'}`} />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Install App */}
        {isInstallable && (
          <Button
            onClick={handleInstall}
            disabled={isInstalling}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            {isInstalling ? 'Instalando...' : 'Instalar Aplicativo'}
          </Button>
        )}

        {/* Update App */}
        {isUpdateAvailable && (
          <Button
            onClick={handleUpdate}
            disabled={isUpdating}
            variant="outline"
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {isUpdating ? 'Atualizando...' : 'Atualizar Aplicativo'}
          </Button>
        )}

        {/* Push Notifications */}
        <Button
          onClick={handleRegisterPush}
          variant="outline"
          className="w-full"
        >
          <Bell className="h-4 w-4 mr-2" />
          Ativar Notificações Push
        </Button>

        <Button
          onClick={handleUnregisterPush}
          variant="outline"
          className="w-full"
        >
          <BellOff className="h-4 w-4 mr-2" />
          Desativar Notificações Push
        </Button>

        {/* Sync Data */}
        <Button
          onClick={handleSyncData}
          variant="outline"
          className="w-full"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Sincronizar Dados
        </Button>

        {/* Process Pending Actions */}
        {pendingActions.length > 0 && (
          <Button
            onClick={handleProcessPending}
            variant="outline"
            className="w-full"
          >
            <Check className="h-4 w-4 mr-2" />
            Processar Ações Pendentes
          </Button>
        )}

        {/* Clear Cache */}
        <Button
          onClick={handleClearCache}
          variant="destructive"
          className="w-full"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Limpar Cache
        </Button>
      </div>

      {/* Offline notice */}
      {isOffline && (
        <Alert>
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            Você está offline. Algumas funcionalidades podem estar limitadas.
            {pendingActions.length > 0 && (
              <span className="block mt-1">
                {pendingActions.length} ação{pendingActions.length > 1 ? 'ões' : ''} será{pendingActions.length > 1 ? 'ão' : ''} sincronizada{pendingActions.length > 1 ? 's' : ''} quando a conexão for restaurada.
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* PWA Features Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          Funcionalidades PWA Ativas:
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>✓ Funciona offline</li>
          <li>✓ Sincronização em background</li>
          <li>✓ Notificações push</li>
          <li>✓ Instalação como app nativo</li>
          <li>✓ Atualizações automáticas</li>
          <li>✓ Cache inteligente</li>
        </ul>
      </div>
    </div>
  )
}

// Install prompt component
export function InstallPrompt() {
  const { isInstallable, install } = usePWA()
  const [isVisible, setIsVisible] = useState(true)
  const [isInstalling, setIsInstalling] = useState(false)

  if (!isInstallable || !isVisible) {
    return null
  }

  const handleInstall = async () => {
    setIsInstalling(true)
    try {
      const success = await install()
      if (success) {
        setIsVisible(false)
        toast.success('Aplicativo instalado com sucesso!')
      }
    } catch (error) {
      toast.error('Erro durante a instalação')
    } finally {
      setIsInstalling(false)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 dark:text-white mb-1">
            Instalar Aplicativo
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Instale o aplicativo para uma experiência melhor com acesso offline e notificações.
          </p>
          <div className="flex space-x-2">
            <Button
              size="sm"
              onClick={handleInstall}
              disabled={isInstalling}
            >
              <Download className="h-4 w-4 mr-1" />
              {isInstalling ? 'Instalando...' : 'Instalar'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDismiss}
            >
              Mais tarde
            </Button>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDismiss}
          className="ml-2"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

