import type { Expense } from '../types/expense'
import { db } from '@/lib/db'

// Cache of recently deleted expenses for undo
interface DeletedExpense {
  expense: Expense
  timestamp: number
}

const UNDO_WINDOW = 10000 // 10 seconds
const deletedExpenses = new Map<string, DeletedExpense>()

// Clean up old deleted expenses periodically
setInterval(() => {
  const now = Date.now()
  for (const [id, { timestamp }] of deletedExpenses) {
    if (now - timestamp > UNDO_WINDOW) {
      deletedExpenses.delete(id)
    }
  }
}, UNDO_WINDOW)

/**
 * Delete an expense with undo support
 * @param expenseId ID of expense to delete
 * @param undoCallback Optional callback when undo is clicked
 */
export async function deleteExpense(expenseId: string, undoCallback?: () => void) {
  // Get current expense
  const expense = await db.expenses.get(expenseId)
  if (!expense) throw new Error('Expense not found')

  // Store in undo cache
  deletedExpenses.set(expenseId, {
    expense,
    timestamp: Date.now()
  })

  // Mark as deleted in DB
  await db.expenses.update(expenseId, {
    deletedAt: new Date().toISOString(),
    version: expense.version + 1
  })

  // Remove from undo cache after window expires
  setTimeout(() => {
    deletedExpenses.delete(expenseId)
  }, UNDO_WINDOW)

  return undoCallback
}

/**
 * Restore a recently deleted expense
 * @param expenseId ID of expense to restore
 */
export async function undoExpenseDelete(expenseId: string) {
  const deleted = deletedExpenses.get(expenseId)
  if (!deleted) throw new Error('Expense not found in undo cache')

  // Remove deleted flag
  await db.expenses.update(expenseId, {
    deletedAt: undefined,
    version: deleted.expense.version + 1
  })

  // Remove from undo cache
  deletedExpenses.delete(expenseId)

  return deleted.expense
}