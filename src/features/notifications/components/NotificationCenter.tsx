import React, { useState } from 'react'
import { 
  Bell, 
  BellOff, 
  Check, 
  CheckCheck, 
  X, 
  Filter, 
  Settings,
  AlertTriangle,
  Clock,
  Info,
  Zap
} from 'lucide-react'
import { 
  useUnreadNotifications,
  useNotificationStats,
  useMarkAsRead,
  useMarkAllAsRead,
  useDismissNotification,
  useExecuteNotificationAction,
  useNotificationPermission
} from '../hooks/useNotifications'
import type { Notification, NotificationPriority } from '../types'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('unread')
  
  // Queries
  const { data: unreadNotifications = [] } = useUnreadNotifications()
  const { data: stats } = useNotificationStats()
  const { hasPermission, requestPermission } = useNotificationPermission()
  
  // Mutations
  const markAsReadMutation = useMarkAsRead()
  const markAllAsReadMutation = useMarkAllAsRead()
  const dismissMutation = useDismissNotification()
  const executeActionMutation = useExecuteNotificationAction()

  const filteredNotifications = unreadNotifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return notification.status !== 'read' && notification.status !== 'dismissed'
      case 'high':
        return (notification.priority === 'high' || notification.priority === 'urgent') &&
               notification.status !== 'read' && notification.status !== 'dismissed'
      default:
        return true
    }
  })

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsReadMutation.mutateAsync(id)
    } catch (error) {
      console.error('Erro ao marcar como lida:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync()
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error)
    }
  }

  const handleDismiss = async (id: string) => {
    try {
      await dismissMutation.mutateAsync(id)
    } catch (error) {
      console.error('Erro ao dispensar notificação:', error)
    }
  }

  const handleExecuteAction = async (notificationId: string, actionId: string) => {
    try {
      await executeActionMutation.mutateAsync({ notificationId, actionId })
    } catch (error) {
      console.error('Erro ao executar ação:', error)
    }
  }

  const handleRequestPermission = async () => {
    await requestPermission()
  }

  const getPriorityIcon = (priority: NotificationPriority) => {
    switch (priority) {
      case 'urgent': return <Zap className="h-4 w-4 text-red-600" />
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-600" />
      case 'medium': return <Info className="h-4 w-4 text-blue-600" />
      case 'low': return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getPriorityColor = (priority: NotificationPriority) => {
    switch (priority) {
      case 'urgent': return 'border-l-red-500 bg-red-50'
      case 'high': return 'border-l-orange-500 bg-orange-50'
      case 'medium': return 'border-l-blue-500 bg-blue-50'
      case 'low': return 'border-l-gray-500 bg-gray-50'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Notificações</h2>
                {stats && stats.unread > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                    {stats.unread}
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setFilter(filter === 'all' ? 'unread' : 'all')}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Filtrar"
                >
                  <Filter className="h-4 w-4" />
                </button>
                
                <button
                  onClick={onClose}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-1 mt-3">
              {[
                { key: 'unread', label: 'Não lidas', count: stats?.unread || 0 },
                { key: 'high', label: 'Importantes', count: (stats?.byPriority?.high || 0) + (stats?.byPriority?.urgent || 0) },
                { key: 'all', label: 'Todas', count: stats?.total || 0 },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as any)}
                  className={`
                    flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors
                    ${filter === tab.key
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }
                  `}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="ml-1 text-xs">({tab.count})</span>
                  )}
                </button>
              ))}
            </div>

            {/* Actions */}
            {filteredNotifications.length > 0 && (
              <div className="flex items-center justify-between mt-3">
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={markAllAsReadMutation.isPending}
                  className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
                >
                  <CheckCheck className="h-4 w-4" />
                  <span>Marcar todas como lidas</span>
                </button>

                {!hasPermission && (
                  <button
                    onClick={handleRequestPermission}
                    className="flex items-center space-x-1 text-sm text-green-600 hover:text-green-700"
                  >
                    <Bell className="h-4 w-4" />
                    <span>Ativar notificações</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <BellOff className="h-12 w-12 mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma notificação</h3>
                <p className="text-sm text-center">
                  {filter === 'unread' 
                    ? 'Você está em dia! Não há notificações não lidas.'
                    : 'Não há notificações para mostrar.'
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onDismiss={handleDismiss}
                    onExecuteAction={handleExecuteAction}
                    isLoading={
                      markAsReadMutation.isPending || 
                      dismissMutation.isPending || 
                      executeActionMutation.isPending
                    }
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4">
            <button
              className="w-full flex items-center justify-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
              onClick={() => {
                // Navigate to notification settings
                onClose()
                window.location.href = '/settings?tab=notifications'
              }}
            >
              <Settings className="h-4 w-4" />
              <span>Configurações de Notificação</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onDismiss: (id: string) => void
  onExecuteAction: (notificationId: string, actionId: string) => void
  isLoading: boolean
}

function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onDismiss, 
  onExecuteAction, 
  isLoading 
}: NotificationItemProps) {
  const isUnread = notification.status !== 'read' && notification.status !== 'dismissed'
  
  return (
    <div className={`
      p-4 border-l-4 transition-colors
      ${getPriorityColor(notification.priority)}
      ${isUnread ? 'bg-opacity-100' : 'bg-opacity-50'}
    `}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {getPriorityIcon(notification.priority)}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h4 className={`
                text-sm font-medium truncate
                ${isUnread ? 'text-gray-900' : 'text-gray-600'}
              `}>
                {notification.title}
              </h4>
              {isUnread && (
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
              )}
            </div>
            
            <p className={`
              text-sm mt-1
              ${isUnread ? 'text-gray-700' : 'text-gray-500'}
            `}>
              {notification.message}
            </p>
            
            <div className="flex items-center space-x-4 mt-2">
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(notification.scheduledFor, { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
              </span>
              
              {notification.entityType && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  {notification.entityType}
                </span>
              )}
            </div>

            {/* Actions */}
            {notification.actions && notification.actions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {notification.actions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => onExecuteAction(notification.id, action.id)}
                    disabled={isLoading}
                    className={`
                      px-3 py-1 text-xs font-medium rounded transition-colors disabled:opacity-50
                      ${action.type === 'primary' 
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : action.type === 'danger'
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }
                    `}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-1 ml-2">
          {isUnread && (
            <button
              onClick={() => onMarkAsRead(notification.id)}
              disabled={isLoading}
              className="p-1 text-gray-400 hover:text-green-600 transition-colors disabled:opacity-50"
              title="Marcar como lida"
            >
              <Check className="h-4 w-4" />
            </button>
          )}
          
          <button
            onClick={() => onDismiss(notification.id)}
            disabled={isLoading}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
            title="Dispensar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function getPriorityIcon(priority: NotificationPriority) {
  switch (priority) {
    case 'urgent': return <Zap className="h-4 w-4 text-red-600" />
    case 'high': return <AlertTriangle className="h-4 w-4 text-orange-600" />
    case 'medium': return <Info className="h-4 w-4 text-blue-600" />
    case 'low': return <Clock className="h-4 w-4 text-gray-600" />
  }
}

function getPriorityColor(priority: NotificationPriority) {
  switch (priority) {
    case 'urgent': return 'border-l-red-500 bg-red-50'
    case 'high': return 'border-l-orange-500 bg-orange-50'
    case 'medium': return 'border-l-blue-500 bg-blue-50'
    case 'low': return 'border-l-gray-500 bg-gray-50'
  }
}

