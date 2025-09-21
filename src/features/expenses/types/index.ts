import { Expense } from './expense'

export type { Expense }

// Expense category (simple shape used in reports and categories table)
export interface ExpenseCategory {
  id: string
  name: string
  householdId: string
  icon?: string
  color?: string
}

// (ExpenseCategory is exported by its declaration above)

// Status de pagamento
export type PaymentStatus = 'paid' | 'pending' | 'overdue'

// Método de pagamento
export type PaymentMethod = 
  | 'credit_card' 
  | 'debit_card'
  | 'bank_transfer'
  | 'money'
  | 'pix'
  | 'other'

// Recorrência
export interface ExpenseRecurrence {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  interval: number // A cada quantas unidades de frequência
  endDate?: Date // Data fim opcional
}

// Parcela
export interface ExpenseInstallment {
  total: number // Total de parcelas
  current: number // Parcela atual
  originalExpenseId?: string // ID da primeira despesa da série
}

// Anexo
export interface ExpenseAttachment {
  id: string
  fileName: string
  mimeType: string
  size: number
  blobRef: string
}

// Dados do formulário
export interface ExpenseFormData {
  title: string
  amount: number
  categoryId: string
  paymentMethod: PaymentMethod
  date: Date
  notes?: string
  attachments?: File[]
  recurrence?: ExpenseRecurrence
  installment?: ExpenseInstallment
  isShared?: boolean // Se é compartilhada entre membros
  paidById?: string // ID do membro que pagou
  accountId?: string // Conta / carteira origem do pagamento
}

// Filtros
export interface ExpenseFilter {
  startDate?: Date
  endDate?: Date
  categoryIds?: string[]
  paymentMethods?: PaymentMethod[]
  minAmount?: number
  maxAmount?: number
  searchText?: string
  hasRecurrence?: boolean
  hasInstallments?: boolean
  // Filter by who paid the expense (member id)
  paidById?: string
  // Filter by participants (member ids involved in shares)
  participantIds?: string[]
  // Payment status filter
  paymentStatus?: PaymentStatus | PaymentStatus[]
  // Free-text tags assigned to expenses
  tags?: string[]
}

// Opções de listagem
export interface ExpenseListOptions {
  filter?: ExpenseFilter
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}