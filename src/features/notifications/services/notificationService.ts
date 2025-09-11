import { db } from '@/core/db/database'
import type { 
  Notification, 
  NotificationFormData, 
  NotificationPreferences, 
  NotificationPreferencesFormData,
  NotificationTemplate,
  NotificationType,
  NotificationPriority,
  NotificationFilter,
  NotificationListOptions,
  NotificationStats
} from '../types'
import { generateId } from '@/core/utils/id'
import { format } from 'date-fns'

export class NotificationService {
  private templates: Record<NotificationType, NotificationTemplate> = {
    expense_budget_exceeded: {
      type: 'expense_budget_exceeded',
      title: 'Orçamento Excedido',
      message: 'O orçamento da categoria {categoryName} foi excedido em R$ {amount}',
      priority: 'high',
      actions: [
        { label: 'Ver Despesas', type: 'primary', action: 'view_expenses' },
        { label: 'Ajustar Orçamento', type: 'secondary', action: 'adjust_budget' }
      ]
    },
    expense_budget_warning: {
      type: 'expense_budget_warning',
      title: 'Orçamento Próximo do Limite',
      message: 'Você já gastou {percentage}% do orçamento da categoria {categoryName}',
      priority: 'medium',
      actions: [
        { label: 'Ver Despesas', type: 'primary', action: 'view_expenses' }
      ]
    },
    task_due_soon: {
      type: 'task_due_soon',
      title: 'Tarefa Vence em Breve',
      message: 'A tarefa "{taskTitle}" vence em {timeRemaining}',
      priority: 'medium',
      defaultAdvanceMinutes: 60,
      actions: [
        { label: 'Ver Tarefa', type: 'primary', action: 'view_task' },
        { label: 'Marcar como Concluída', type: 'secondary', action: 'complete_task' }
      ]
    },
    task_overdue: {
      type: 'task_overdue',
      title: 'Tarefa Atrasada',
      message: 'A tarefa "{taskTitle}" está atrasada há {timeOverdue}',
      priority: 'high',
      actions: [
        { label: 'Ver Tarefa', type: 'primary', action: 'view_task' },
        { label: 'Marcar como Concluída', type: 'secondary', action: 'complete_task' }
      ]
    },
    document_expiring: {
      type: 'document_expiring',
      title: 'Documento Vencendo',
      message: 'O documento "{documentTitle}" vence em {timeRemaining}',
      priority: 'medium',
      defaultAdvanceMinutes: 10080, // 7 days
      actions: [
        { label: 'Ver Documento', type: 'primary', action: 'view_document' },
        { label: 'Renovar', type: 'secondary', action: 'renew_document' }
      ]
    },
    document_expired: {
      type: 'document_expired',
      title: 'Documento Vencido',
      message: 'O documento "{documentTitle}" venceu há {timeOverdue}',
      priority: 'high',
      actions: [
        { label: 'Ver Documento', type: 'primary', action: 'view_document' },
        { label: 'Renovar', type: 'danger', action: 'renew_document' }
      ]
    },
    medication_due: {
      type: 'medication_due',
      title: 'Hora do Remédio',
      message: 'É hora de tomar {medicationName} - {dosage}',
      priority: 'high',
      defaultAdvanceMinutes: 0,
      actions: [
        { label: 'Tomar Agora', type: 'primary', action: 'take_medication' },
        { label: 'Pular', type: 'secondary', action: 'skip_medication' },
        { label: 'Adiar 15min', type: 'secondary', action: 'snooze_medication' }
      ]
    },
    medication_overdue: {
      type: 'medication_overdue',
      title: 'Remédio Atrasado',
      message: 'Você perdeu a tomada de {medicationName} há {timeOverdue}',
      priority: 'urgent',
      actions: [
        { label: 'Tomar Agora', type: 'primary', action: 'take_medication' },
        { label: 'Pular', type: 'secondary', action: 'skip_medication' }
      ]
    },
    medication_low_stock: {
      type: 'medication_low_stock',
      title: 'Estoque Baixo',
      message: 'O estoque de {medicationName} está baixo ({quantity} restantes)',
      priority: 'medium',
      actions: [
        { label: 'Comprar Mais', type: 'primary', action: 'buy_medication' },
        { label: 'Atualizar Estoque', type: 'secondary', action: 'update_stock' }
      ]
    },
    medication_expired: {
      type: 'medication_expired',
      title: 'Remédio Vencido',
      message: 'O remédio {medicationName} venceu em {expiryDate}',
      priority: 'high',
      actions: [
        { label: 'Ver Remédio', type: 'primary', action: 'view_medication' },
        { label: 'Descartar', type: 'danger', action: 'discard_medication' }
      ]
    },
    calendar_event_reminder: {
      type: 'calendar_event_reminder',
      title: 'Lembrete de Evento',
      message: 'O evento "{eventTitle}" começa em {timeRemaining}',
      priority: 'medium',
      defaultAdvanceMinutes: 15,
      actions: [
        { label: 'Ver Evento', type: 'primary', action: 'view_event' }
      ]
    },
    system_update: {
      type: 'system_update',
      title: 'Atualização do Sistema',
      message: 'Uma nova versão do aplicativo está disponível',
      priority: 'low',
      actions: [
        { label: 'Atualizar', type: 'primary', action: 'update_app' },
        { label: 'Mais Tarde', type: 'secondary', action: 'dismiss' }
      ]
    },
    sync_error: {
      type: 'sync_error',
      title: 'Erro de Sincronização',
      message: 'Não foi possível sincronizar seus dados. Verifique sua conexão.',
      priority: 'medium',
      actions: [
        { label: 'Tentar Novamente', type: 'primary', action: 'retry_sync' },
        { label: 'Ver Detalhes', type: 'secondary', action: 'view_sync_details' }
      ]
    }
  }

  /**
   * Create a new notification
   */
  async createNotification(data: NotificationFormData, householdId: string): Promise<Notification> {
    const template = this.templates[data.type]
    
    const notification: Notification = {
      id: generateId(),
      type: data.type,
      title: data.title || template.title,
      message: data.message || template.message,
      priority: data.priority || template.priority,
      status: 'pending',
      entityId: data.entityId,
      entityType: data.entityType as any,
      scheduledFor: data.scheduledFor,
      householdId,
      userId: data.userId,
      data: data.data,
      actions: data.actions?.map(action => ({ ...action, id: generateId() })) || 
               template.actions?.map(action => ({ ...action, id: generateId() })),
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: data.expiresAt,
    }

    await db.notifications.add(notification)
    return notification
  }

  /**
   * Get notifications for a household
   */
  async getNotifications(householdId: string, options?: NotificationListOptions): Promise<Notification[]> {
    let query = db.notifications.where({ householdId })

    // Apply filters
    if (options?.filter) {
      query = this.applyFilters(query, options.filter)
    }

    let notifications = await query.toArray()

    // Apply sorting
    if (options?.sortBy) {
      notifications = this.sortNotifications(notifications, options.sortBy, options.sortOrder || 'desc')
    }

    // Apply pagination
    if (options?.offset || options?.limit) {
      const start = options.offset || 0
      const end = options.limit ? start + options.limit : undefined
      notifications = notifications.slice(start, end)
    }

    return notifications
  }

  /**
   * Get unread notifications
   */
  async getUnreadNotifications(householdId: string, userId?: string): Promise<Notification[]> {
    return await db.notifications
      .where({ householdId })
      .and(notification => {
        if (notification.status === 'read' || notification.status === 'dismissed') return false
        if (userId && notification.userId && notification.userId !== userId) return false
        return true
      })
      .reverse()
      .sortBy('scheduledFor')
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(householdId: string, userId?: string): Promise<NotificationStats> {
    const notifications = await db.notifications
      .where({ householdId })
      .and(notification => {
        if (userId && notification.userId && notification.userId !== userId) return false
        return true
      })
      .toArray()

    const stats: NotificationStats = {
      total: notifications.length,
      unread: notifications.filter(n => n.status !== 'read' && n.status !== 'dismissed').length,
      byType: {} as Record<NotificationType, number>,
      byPriority: {} as Record<NotificationPriority, number>,
      byStatus: {} as Record<any, number>,
    }

    notifications.forEach(notification => {
      // By type
      stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1
      
      // By priority
      stats.byPriority[notification.priority] = (stats.byPriority[notification.priority] || 0) + 1
      
      // By status
      stats.byStatus[notification.status] = (stats.byStatus[notification.status] || 0) + 1
    })

    return stats
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string): Promise<void> {
    await db.notifications.update(id, {
      status: 'read',
      readAt: new Date(),
      updatedAt: new Date(),
    })
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(householdId: string, userId?: string): Promise<void> {
    const unreadNotifications = await this.getUnreadNotifications(householdId, userId)
    
    for (const notification of unreadNotifications) {
      await this.markAsRead(notification.id)
    }
  }

  /**
   * Dismiss notification
   */
  async dismissNotification(id: string): Promise<void> {
    await db.notifications.update(id, {
      status: 'dismissed',
      dismissedAt: new Date(),
      updatedAt: new Date(),
    })
  }

  /**
   * Delete notification
   */
  async deleteNotification(id: string): Promise<void> {
    await db.notifications.delete(id)
  }

  /**
   * Get pending notifications that should be sent
   */
  async getPendingNotifications(): Promise<Notification[]> {
    const now = new Date()
    
    return await db.notifications
      .where('status')
      .equals('pending')
      .and(notification => notification.scheduledFor <= now)
      .toArray()
  }

  /**
   * Send notification (mark as sent)
   */
  async sendNotification(id: string): Promise<void> {
    await db.notifications.update(id, {
      status: 'sent',
      sentAt: new Date(),
      updatedAt: new Date(),
    })
  }

  /**
   * Mark notification as failed
   */
  async markAsFailed(id: string): Promise<void> {
    await db.notifications.update(id, {
      status: 'failed',
      updatedAt: new Date(),
    })
  }

  /**
   * Clean up expired notifications
   */
  async cleanupExpiredNotifications(): Promise<void> {
    const now = new Date()
    
    await db.notifications
      .where('expiresAt')
      .below(now)
      .delete()
  }

  /**
   * Get notification preferences for a user
   */
  async getPreferences(userId: string, householdId: string): Promise<NotificationPreferences | undefined> {
    return await db.notificationPreferences.where({ userId, householdId }).first()
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(
    userId: string, 
    householdId: string, 
    data: Partial<NotificationPreferencesFormData>
  ): Promise<void> {
    const existing = await this.getPreferences(userId, householdId)
    
    if (existing) {
      await db.notificationPreferences.update(existing.id, {
        ...data,
        updatedAt: new Date(),
      })
    } else {
      const preferences: NotificationPreferences = {
        id: generateId(),
        userId,
        householdId,
        enableInApp: true,
        enablePush: false,
        enableEmail: false,
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        typeSettings: this.getDefaultTypeSettings(),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      await db.notificationPreferences.add(preferences)
    }
  }

  /**
   * Check if notifications are allowed during quiet hours
   */
  isQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quietHoursEnabled) return false
    
    const now = new Date()
    const currentTime = format(now, 'HH:mm')
    
    const start = preferences.quietHoursStart
    const end = preferences.quietHoursEnd
    
    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (start > end) {
      return currentTime >= start || currentTime <= end
    } else {
      return currentTime >= start && currentTime <= end
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission === 'denied') {
      return false
    }

    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  /**
   * Show browser notification
   */
  async showBrowserNotification(notification: Notification): Promise<void> {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return
    }

    const browserNotification = new Notification(notification.title, {
      body: notification.message,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: notification.id,
      requireInteraction: notification.priority === 'urgent',
      data: {
        notificationId: notification.id,
        entityId: notification.entityId,
        entityType: notification.entityType,
      }
    })

    browserNotification.onclick = () => {
      // Handle notification click
      window.focus()
      browserNotification.close()
      
      // Navigate to relevant page based on entity type
      if (notification.entityType && notification.entityId) {
        const path = this.getEntityPath(notification.entityType, notification.entityId)
        if (path) {
          window.location.href = path
        }
      }
    }

    // Auto-close after 10 seconds for non-urgent notifications
    if (notification.priority !== 'urgent') {
      setTimeout(() => {
        browserNotification.close()
      }, 10000)
    }
  }

  /**
   * Execute notification action
   */
  async executeAction(notificationId: string, actionId: string): Promise<void> {
    const notification = await db.notifications.get(notificationId)
    if (!notification) return

    const action = notification.actions?.find(a => a.id === actionId)
    if (!action) return

    // Handle different action types
    switch (action.action) {
      case 'view_expenses':
        window.location.href = '/expenses'
        break
      case 'view_task':
        if (notification.entityId) {
          window.location.href = `/tasks?id=${notification.entityId}`
        }
        break
      case 'view_document':
        if (notification.entityId) {
          window.location.href = `/documents?id=${notification.entityId}`
        }
        break
      case 'view_medication':
        if (notification.entityId) {
          window.location.href = `/medications?id=${notification.entityId}`
        }
        break
      case 'view_event':
        if (notification.entityId) {
          window.location.href = `/calendar?id=${notification.entityId}`
        }
        break
      case 'take_medication':
        // This would trigger the medication intake recording
        // Implementation depends on the medication service
        break
      case 'dismiss':
        await this.dismissNotification(notificationId)
        break
      default:
        console.warn(`Unknown action: ${action.action}`)
    }

    // Mark notification as read after action
    await this.markAsRead(notificationId)
  }

  private getDefaultTypeSettings() {
    // Garante que todas as chaves de NotificationType estão presentes
    const settings = {} as Record<NotificationType, any>
    (Object.keys(this.templates) as NotificationType[]).forEach(type => {
      const template = this.templates[type]
      settings[type] = {
        enabled: true,
        priority: template.priority,
        inApp: true,
        push: template.priority === 'high' || template.priority === 'urgent',
        email: false,
        advanceMinutes: template.defaultAdvanceMinutes || 0,
      }
    })
    return settings
  }

  private getEntityPath(entityType: string, entityId: string): string | null {
    switch (entityType) {
      case 'expense': return `/expenses?id=${entityId}`
      case 'task': return `/tasks?id=${entityId}`
      case 'document': return `/documents?id=${entityId}`
      case 'medication': return `/medications?id=${entityId}`
      case 'calendar_event': return `/calendar?id=${entityId}`
      default: return null
    }
  }

  private applyFilters(query: any, filter: NotificationFilter): any {
    return query.and((notification: Notification) => {
      // Type filter
      if (filter.types && filter.types.length > 0) {
        if (!filter.types.includes(notification.type)) return false
      }

      // Priority filter
      if (filter.priorities && filter.priorities.length > 0) {
        if (!filter.priorities.includes(notification.priority)) return false
      }

      // Status filter
      if (filter.statuses && filter.statuses.length > 0) {
        if (!filter.statuses.includes(notification.status)) return false
      }

      // Entity type filter
      if (filter.entityTypes && filter.entityTypes.length > 0) {
        if (!notification.entityType || !filter.entityTypes.includes(notification.entityType)) return false
      }

      // Date range filter
      if (filter.dateRange) {
        const notificationDate = notification.scheduledFor
        if (notificationDate < filter.dateRange.start || notificationDate > filter.dateRange.end) {
          return false
        }
      }

      // User filter
      if (filter.userId) {
        if (notification.userId && notification.userId !== filter.userId) return false
      }

      // Search text filter
      if (filter.searchText) {
        const searchText = filter.searchText.toLowerCase()
        const matchesTitle = notification.title.toLowerCase().includes(searchText)
        const matchesMessage = notification.message.toLowerCase().includes(searchText)
        if (!matchesTitle && !matchesMessage) return false
      }

      return true
    })
  }

  private sortNotifications(
    notifications: Notification[], 
    sortBy: string, 
    sortOrder: 'asc' | 'desc'
  ): Notification[] {
    return notifications.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'scheduledFor':
          comparison = a.scheduledFor.getTime() - b.scheduledFor.getTime()
          break
        case 'priority':
          const priorityOrder = { low: 0, medium: 1, high: 2, urgent: 3 }
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority]
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
        default:
          comparison = a.createdAt.getTime() - b.createdAt.getTime()
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })
  }
}

// Singleton instance
export const notificationService = new NotificationService()

