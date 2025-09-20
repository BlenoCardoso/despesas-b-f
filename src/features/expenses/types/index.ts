import { Expense } from './expense'

export type { Expense }

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
}

// Opções de listagem
export interface ExpenseListOptions {
  filter?: ExpenseFilter
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}