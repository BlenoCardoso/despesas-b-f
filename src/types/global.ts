// Tipos globais da aplicação

export interface BaseEntity {
  id: string
  householdId: string
  userId: string
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

export interface Household {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export interface User {
  id: string
  name: string
  email: string
  householdId: string
  createdAt: Date
  updatedAt: Date
}

export type Currency = 'BRL' | 'USD' | 'EUR'

export type PaymentMethod = 
  | 'dinheiro'
  | 'cartao_credito'
  | 'cartao_debito'
  | 'pix'
  | 'transferencia'
  | 'boleto'

export interface Category {
  id: string
  name: string
  icon: string
  color: string
  householdId: string
}

export interface Budget {
  id: string
  householdId: string
  categoryId?: string // undefined = orçamento geral
  amount: number
  month: string // YYYY-MM
  createdAt: Date
  updatedAt: Date
}

export interface Attachment {
  id: string
  fileName: string
  mimeType: string
  size: number
  blobRef: string // referência para IndexedDB
}

export interface Recurrence {
  type: 'diario' | 'semanal' | 'mensal' | 'anual'
  interval: number // a cada X dias/semanas/meses/anos
  endDate?: Date
}

export interface Installment {
  count: number // parcela atual
  total: number // total de parcelas
}

// Configurações da aplicação
export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  accentColor: string
  notifications: {
    expenses: boolean
    tasks: boolean
    medications: boolean
    documents: boolean
  }
  language: string
  currency: Currency
}

// Feature flags
export interface FeatureFlags {
  enableSync: boolean
  enableNotifications: boolean
  enablePushExperimental: boolean
}

// Tipos para sincronização
export interface SyncMetadata {
  lastSyncAt?: Date
  version: number
  conflictResolution: 'last-write-wins' | 'manual'
}

export interface ChangeSet {
  entityType: string
  entityId: string
  operation: 'create' | 'update' | 'delete'
  data: any
  timestamp: Date
  userId: string
}

// Tipos para notificações
export interface NotificationSchedule {
  id: string
  type: 'expense' | 'task' | 'medication' | 'document'
  entityId: string
  title: string
  body: string
  scheduledFor: Date
  delivered: boolean
  actions?: NotificationAction[]
}

export interface NotificationAction {
  action: string
  title: string
  icon?: string
}

// Tipos para relatórios
export interface ReportFilter {
  startDate?: Date
  endDate?: Date
  categoryIds?: string[]
  paymentMethods?: PaymentMethod[]
  minAmount?: number
  maxAmount?: number
  searchText?: string
}

export interface ExpenseSummary {
  totalAmount: number
  totalCount: number
  averageAmount: number
  byCategory: Record<string, number>
  byPaymentMethod: Record<PaymentMethod, number>
  byMonth: Record<string, number>
}

// Tipos para PWA
export interface PWAInstallPrompt {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
  interface Window {
    deferredPrompt?: PWAInstallPrompt
  }
}

