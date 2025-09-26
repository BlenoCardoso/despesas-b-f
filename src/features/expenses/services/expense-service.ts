import type { Expense } from '../types/expense'
import { db } from '@/lib/db'
import { enqueueSync } from '@/lib/syncQueue'

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

  // Mark as deleted in DB (soft delete). Use robust fallbacks so the deletion
  // persists even in environments where update() may not be available or fail.
  const deletedAt = new Date().toISOString()
  try {
    // Try the normal update path first
    if (typeof (db.expenses as any).update === 'function') {
      await db.expenses.update(expenseId, {
        deletedAt,
        version: (expense.version || 0) + 1,
        updatedAt: deletedAt
      })
    } else if (typeof (db.expenses as any).put === 'function') {
      // Merge current + tombstone
      const current = await db.expenses.get(expenseId)
      await db.expenses.put({ ...(current || {}), id: expenseId, deletedAt, version: ((current && (current as any).version) || 0) + 1, updatedAt: deletedAt } as any)
    } else if (typeof (db.expenses as any).delete === 'function') {
      // As a last resort, delete the row and enqueue a remote delete
      await db.expenses.delete(expenseId)
    } else {
      // If none of the DB operations exist, throw so caller handles it
      throw new Error('No supported DB delete/update/put methods available')
    }
  } catch (dbErr) {
    console.error('Failed to persist soft-delete locally, attempting fallback put:', dbErr)
    try {
      const current = await db.expenses.get(expenseId).catch(() => undefined)
      await (db.expenses as any).put({ ...(current || {}), id: expenseId, deletedAt, version: ((current && (current as any).version) || 0) + 1, updatedAt: deletedAt } as any)
    } catch (finalErr) {
      console.error('Final fallback for soft-delete failed:', finalErr)
      // rethrow so callers will show an error
      throw finalErr
    }
  }

  // Remove from undo cache after window expires
  setTimeout(() => {
    deletedExpenses.delete(expenseId)
  }, UNDO_WINDOW)

  // Enqueue a sync action to ensure remote systems also receive the delete
  try {
    await enqueueSync({
      type: 'delete',
      collection: 'expenses',
      entityId: expenseId,
      householdId: (expense as any).householdId,
      performedBy: (expense as any).deletedBy || undefined,
      payload: { id: expenseId }
    })
  } catch (e) {
    // non-fatal
    console.warn('Failed to enqueue sync action for deleted expense', e)
  }

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