import type { BaseModel } from '@/types'

// Tipos de pagamento
export type PaymentMethod = 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix' | 'transferencia' | 'boleto'

// Modelo base de despesa (matches database schema)
export interface Expense extends BaseModel {
  householdId: string
  date: string // ISO date string
  title: string 
  amount: number
  categoryId?: string
  paidById?: string
  notes?: string
  attachments?: string[]
  syncVersion?: number
}

// Tipo flexível de despesa (usado na UI)
export type FlexibleExpense = Omit<Expense, 'title'> & {
  // Optional title/description
  title?: string 
  description?: string

  // UI specific fields
  category?: string
  paymentMethod?: PaymentMethod
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