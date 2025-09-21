import { addMonths, addYears, addWeeks } from 'date-fns'
import type { Expense } from '../types/expense'

/**
 * Returns how many installments remain for an expense.
 */
export function installmentsRemaining(expense: Expense): number {
  const inst = expense.installment
  if (!inst || !inst.total) return 0
  const paid = inst.paid ?? 0
  return Math.max(0, inst.total - paid)
}

export function installmentProgress(expense: Expense) {
  const inst = expense.installment
  if (!inst) return { paid: 0, total: 0, remaining: 0 }
  const paid = inst.paid ?? 0
  const total = inst.total
  return { paid, total, remaining: Math.max(0, total - paid) }
}

/**
 * Determine whether an expense is fully paid.
 * Considers explicit paymentStatus or installments info.
 */
export function isExpensePaid(expense: Expense): boolean {
  if (expense.paymentStatus === 'paid') return true
  if (expense.installment) {
    const inst = expense.installment
    if (typeof inst.paid === 'number' && typeof inst.total === 'number') {
      return inst.paid >= inst.total
    }
  }
  return false
}

/**
 * Estimate the next due date for the next unpaid installment or next recurrence.
 * Rules (simple heuristic):
 * - If there is an installment and not all paid, assume installments recur monthly from the original date
 * - Otherwise, if recurrence exists, add interval units to the base date
 */
export function nextDueDate(expense: Expense): Date | null {
  const base = expense.date ? new Date(expense.date) : null
  if (!base) return null

  // If installment exists and not fully paid, assume monthly installments and compute next by paid count
  if (expense.installment && typeof expense.installment.total === 'number') {
    const paid = expense.installment.paid ?? 0
    if (paid < expense.installment.total) {
      // next due is base + paid months
      return addMonths(base, paid)
    }
  }

  if (expense.recurrence) {
    const freq = expense.recurrence.frequency
    const interval = expense.recurrence.interval || 1
    switch (freq) {
      case 'monthly':
        return addMonths(base, interval)
      case 'weekly':
        return addWeeks(base, interval)
      case 'yearly':
        return addYears(base, interval)
      default:
        return null
    }
  }

  return null
}

export default {
  installmentsRemaining,
  installmentProgress,
  isExpensePaid,
  nextDueDate
}
