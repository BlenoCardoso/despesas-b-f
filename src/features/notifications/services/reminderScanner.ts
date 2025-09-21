import { expenseService } from '@/features/expenses/services/expenseService'
import { notificationService } from './notificationService'
import { db } from '@/core/db/database'
import { nextDueDate } from '@/features/expenses/utils/installments'
import { format } from 'date-fns'

export async function runRecurringExpenseScanner() {
  try {
    // Get all households in the DB and scan per-household
    const households = await db.households.toArray()
    const now = new Date()
    const todayStr = format(now, 'yyyy-MM-dd')
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const tomorrowStr = format(tomorrow, 'yyyy-MM-dd')

    for (const hh of households) {
      const recurring = await expenseService.getRecurringExpenses(hh.id)

      for (const exp of recurring) {
        const due = nextDueDate(exp)
        if (!due) continue
        const dueStr = format(due, 'yyyy-MM-dd')

        if (dueStr === todayStr || dueStr === tomorrowStr) {
          // create an in-app notification for this due expense
          await notificationService.createNotification({
            type: 'expense_due',
            title: `Despesa a pagar: ${exp.title}`,
            message: `A despesa "${exp.title}" vence em ${dueStr}`,
            priority: 'medium',
            scheduledFor: due,
            entityId: exp.id,
            entityType: 'expense',
            userId: undefined,
            data: { dueDate: dueStr }
          }, hh.id)
        }
      }
    }
  } catch (e) {
    console.warn('reminderScanner failed', e)
  }
}

export default { runRecurringExpenseScanner }
