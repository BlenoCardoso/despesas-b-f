export type NotificationType = 
  | 'expense_budget_exceeded'
  | 'expense_budget_warning'
  | 'task_due_soon'
  | 'task_overdue'
  | 'document_expiring'
  | 'document_expired'
  | 'medication_due'
  | 'medication_overdue'
  | 'medication_low_stock'
  | 'medication_expired'
  | 'calendar_event_reminder'
  | 'system_update'
  | 'sync_error'

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent'

export type NotificationStatus = 'pending' | 'sent' | 'read' | 'dismissed' | 'failed'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  priority: NotificationPriority
  status: NotificationStatus
  
  // Related entity information
  entityId?: string
  entityType?: 'expense' | 'task' | 'document' | 'medication' | 'calendar_event'
  
  // Scheduling
  scheduledFor: Date
  sentAt?: Date
  readAt?: Date
  dismissedAt?: Date
  
  // Metadata
  householdId: string
  userId?: string // If null, notification is for all household members
  data?: Record<string, any> // Additional data for the notification
  
  // Actions
  actions?: NotificationAction[]
  
  // System
  createdAt: Date
  updatedAt: Date
  expiresAt?: Date // When the notification should be automatically dismissed
}

export interface NotificationAction {
  id: string
  label: string
  type: 'primary' | 'secondary' | 'danger'
  action: string // Action identifier
  data?: Record<string, any>
}

export interface NotificationRule {
  id: string
  type: NotificationType
  isEnabled: boolean
  
  // Timing
  advanceMinutes?: number // How many minutes before the event to notify
  repeatInterval?: number // Minutes between repeat notifications
  maxRepeats?: number // Maximum number of repeats
  
  // Conditions
  conditions?: Record<string, any>
  
  // Delivery methods
  inApp: boolean
  push: boolean
  email?: boolean
  
  // User preferences
  householdId: string
  userId?: string // If null, rule applies to all household members
  
  createdAt: Date
  updatedAt: Date
}

export interface NotificationPreferences {
  id: string
  userId: string
  householdId: string
  
  // Global settings
  enableInApp: boolean
  enablePush: boolean
  enableEmail: boolean
  
  // Quiet hours
  quietHoursEnabled: boolean
  quietHoursStart: string // HH:mm format
  quietHoursEnd: string // HH:mm format
  
  // Type-specific settings
  typeSettings: Record<NotificationType, {
    enabled: boolean
    priority: NotificationPriority
    inApp: boolean
    push: boolean
    email: boolean
    advanceMinutes?: number
  }>
  
  createdAt: Date
  updatedAt: Date
}

export interface NotificationTemplate {
  type: NotificationType
  title: string
  message: string
  priority: NotificationPriority
  actions?: Omit<NotificationAction, 'id'>[]
  defaultAdvanceMinutes?: number
}

export interface NotificationStats {
  total: number
  unread: number
  byType: Record<NotificationType, number>
  byPriority: Record<NotificationPriority, number>
  byStatus: Record<NotificationStatus, number>
}

export interface NotificationFilter {
  types?: NotificationType[]
  priorities?: NotificationPriority[]
  statuses?: NotificationStatus[]
  entityTypes?: string[]
  dateRange?: {
    start: Date
    end: Date
  }
  userId?: string
  searchText?: string
}

export interface NotificationListOptions {
  filter?: NotificationFilter
  sortBy?: 'createdAt' | 'scheduledFor' | 'priority' | 'status'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

// Form types
export interface NotificationFormData {
  type: NotificationType
  title: string
  message: string
  priority: NotificationPriority
  scheduledFor: Date
  entityId?: string
  entityType?: string
  userId?: string
  data?: Record<string, any>
  actions?: Omit<NotificationAction, 'id'>[]
  expiresAt?: Date
}

export interface NotificationRuleFormData {
  type: NotificationType
  isEnabled: boolean
  advanceMinutes?: number
  repeatInterval?: number
  maxRepeats?: number
  conditions?: Record<string, any>
  inApp: boolean
  push: boolean
  email?: boolean
  userId?: string
}

export interface NotificationPreferencesFormData {
  enableInApp: boolean
  enablePush: boolean
  enableEmail: boolean
  quietHoursEnabled: boolean
  quietHoursStart: string
  quietHoursEnd: string
  typeSettings: Record<NotificationType, {
    enabled: boolean
    priority: NotificationPriority
    inApp: boolean
    push: boolean
    email: boolean
    advanceMinutes?: number
  }>
}

// Context types
export interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  
  // Actions
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  dismiss: (id: string) => Promise<void>
  executeAction: (notificationId: string, actionId: string) => Promise<void>
  
  // Preferences
  preferences: NotificationPreferences | null
  updatePreferences: (data: Partial<NotificationPreferencesFormData>) => Promise<void>
  
  // Permission
  hasPermission: boolean
  requestPermission: () => Promise<boolean>
}

