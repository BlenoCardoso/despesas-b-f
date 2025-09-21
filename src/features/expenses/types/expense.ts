import type { BaseModel } from '@/types'
import type { Attachment, Currency, PaymentMethod as GlobalPaymentMethod } from '@/types/global'

// Local payment method fallback (legacy)
export type LegacyPaymentMethod = 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix' | 'transferencia' | 'boleto'

// Modelo base de despesa (matches database schema)
export interface Expense extends BaseModel {
  householdId: string
  date: string // ISO date string
  title: string
  amount: number
  categoryId?: string
  // canonical payer id (newer code uses paidById, some older code references paidBy)
  paidById?: string
  paidBy?: string
  // Account / wallet where the payment originated
  accountId?: string
  // compatibility: some modules expect a userId / owner field
  userId?: string
  notes?: string
  // attachments historically were stored as string[] (ids) or rich Attachment[]
  attachments?: string[] | Attachment[]
  syncVersion?: number

  // Compatibility fields used in reports/migrations
  // 'type' distinguishes expense vs income in some modules
  type?: 'expense' | 'income'
  // currency and paymentMethod may be required by other parts of the app
  currency?: Currency | string
  paymentMethod?: GlobalPaymentMethod | LegacyPaymentMethod | string
  // Recurrence (for recurring expenses)
  recurrence?: {
    frequency: 'weekly' | 'monthly' | 'yearly'
    interval?: number // every N units (default 1)
    endDate?: string // ISO date string
  }

  // Installment/parcelamento information
  installment?: {
    total: number // total number of parcels
    paid?: number // how many parcels have been paid
    current?: number // current parcel index (1-based)
  }

  // Payment status useful for bills/cards
  paymentStatus?: 'paid' | 'unpaid' | 'partial'
  // Free-text labels to help grouping/searching (e.g. "viagem", "escola")
  tags?: string[]
  // Shares for shared expenses (member id + percentage/amount)
  shares?: { memberId: string; percentage?: number; amount?: number }[]
}

// Tipo flexível de despesa (usado na UI)
export type FlexibleExpense = Omit<Expense, 'title'> & {
  // Optional title/description
  title?: string 
  description?: string

  // UI specific fields
  category?: string
  paymentMethod?: GlobalPaymentMethod | LegacyPaymentMethod | string
  isShared?: boolean
  shares?: { memberId: string; percentage: number }[]
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
    interval: number
    endDate?: string
  }
  installment?: {
    count: number
    total: number
  }
  tags?: string[]
  accountId?: string
}

// Grupo de despesas por data
export interface ExpenseGroup {
  date: string
  label: string
  expenses: FlexibleExpense[]
  total: number
}

// Tipo para criação de nova despesa
export type CreateExpenseData = Omit<
  Expense,
  'id' | 'version' | keyof BaseModel
>