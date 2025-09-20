// Tipos de notificação suportados
export type NotificationType = 
  | 'NEW_EXPENSE' 
  | 'EXPENSE_UPDATED'
  | 'EXPENSE_DELETED'
  | 'SETTLED_UP'
  | 'MEMBER_JOINED'
  | 'MEMBER_LEFT'

// Status da notificação
export type NotificationStatus = 
  | 'unread' 
  | 'read' 
  | 'dismissed'

export interface Notification {
  id: string
  householdId: string
  // Quem deve ver esta notificação (se null, todos da household)
  recipientId?: string
  // Tipo da notificação
  type: NotificationType
  // Título para exibição
  title: string
  // Descrição opcional
  description?: string
  // Dados específicos do tipo
  payload?: Record<string, any>
  // Status de leitura
  status: NotificationStatus
  // Controle de tempo
  createdAt: Date
  readAt?: Date
  dismissedAt?: Date
  // Expiração opcional (em dias)
  expiresIn?: number
}

// Preferências de notificação por usuário/household
export interface NotificationPreferences {
  id: string
  userId: string
  householdId: string
  // Tipos habilitados/desabilitados
  enabledTypes: NotificationType[]
  // Se notificações in-app estão habilitadas
  enabled: boolean
  updatedAt: Date
}