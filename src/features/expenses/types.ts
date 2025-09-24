// Re-export the canonical Expense definition from the dedicated expense file (type-only)
import type { Expense } from './types/expense'
export type { Expense }
// Import helper types defined in the typed folder so this barrel has full shapes
export type PaymentMethod = 
  | 'credit_card'
  | 'debit_card'
  | 'bank_transfer'
  | 'money'
  | 'pix'
  | 'other'

export type PaymentStatus = 'paid' | 'pending' | 'overdue'

export interface Recurrence {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  interval: number
  endDate?: Date
}

export interface Installment {
  total: number
  current?: number
  originalExpenseId?: string
}

export interface ExpenseFormData {
  title: string
  amount: number
  categoryId: string
  paymentMethod?: PaymentMethod | string
  date: Date
  notes?: string
  attachments?: File[]
  recurrence?: Recurrence
  installment?: Installment
  // New fields to support flexible split
  split?: {
    mode: 'equal' | 'percentage' | 'exact'
    participants?: Array<{
      memberId: string
      percentage?: number
      amount?: number
    }>
    visibility?: 'personal' | 'shared'
  }
  // Free-text tags entered as an array of strings
  tags?: string[]
}

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
  paidById?: string
  participantIds?: string[]
  paymentStatus?: PaymentStatus | PaymentStatus[]
  tags?: string[]
}

export interface ExpenseGroup {
  date: string
  label: string
  expenses: Expense[]
  total: number
}

// Simple category shape used across reports and UI
export interface ExpenseCategory {
  id: string
  name: string
  householdId?: string
  icon?: string
  color?: string
}

export interface ExpenseSummaryCard {
  totalMonth: number
  budget: number
  remaining: number
  dailyAverage: number
  projection: number
  variationFromLastMonth: number
}

export interface CategoryExpense {
  categoryId: string
  categoryName: string
  amount: number
  count: number
  percentage: number
}

export interface MonthlyExpense {
  month: string
  amount: number
  count: number
}

export interface ExpenseStats {
  totalAmount: number
  totalCount: number
  averageAmount: number
  byCategory: CategoryExpense[]
  byPaymentMethod: Record<PaymentMethod, number>
  byMonth: MonthlyExpense[]
  dailyAverage: number
  projection: number
}

export interface RecurringExpenseTemplate {
  id: string
  title: string
  amount: number
  categoryId: string
  paymentMethod: PaymentMethod
  recurrence: Recurrence
  isActive: boolean
  nextDueDate: Date
  createdAt: Date
}

export interface InstallmentPlan {
  id: string
  originalExpenseId: string
  title: string
  totalAmount: number
  installmentAmount: number
  totalInstallments: number
  paidInstallments: number
  nextDueDate: Date
  categoryId: string
  paymentMethod: PaymentMethod
  isCompleted: boolean
}

export interface ExpenseImportData {
  title: string
  amount: number
  category: string
  paymentMethod: string
  date: string
  notes?: string
}

export interface ExpenseExportData extends Expense {
  categoryName: string
  householdName: string
  userName: string
}

export type ExpenseSortBy = 
  | 'date'
  | 'amount'
  | 'title'
  | 'category'
  | 'paymentMethod'

export type ExpenseSortOrder = 'asc' | 'desc'

export interface ExpenseListOptions {
  sortBy: ExpenseSortBy
  sortOrder: ExpenseSortOrder
  groupBy: 'date' | 'category' | 'paymentMethod' | 'none'
  filter: ExpenseFilter
  page: number
  pageSize: number
}

export interface ExpenseNotification {
  id: string
  expenseId: string
  type: 'due_today' | 'due_tomorrow' | 'overdue' | 'budget_warning' | 'budget_exceeded'
  title: string
  message: string
  scheduledFor: Date
  delivered: boolean
  actions: Array<{
    action: 'mark_paid' | 'snooze' | 'edit' | 'view'
    title: string
  }>
}

