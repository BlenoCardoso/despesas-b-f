import { db } from '@/core/db/database'
import { generateId } from '@/core/utils/id'
import { ExpenseFormData } from '../types'

export class SimpleExpenseService {
  /**
   * Create a new expense - simplified version
   */
  async createExpense(data: ExpenseFormData, householdId: string, userId: string): Promise<any> {
    console.log('🔧 SimpleExpenseService - createExpense called with:', { data, householdId, userId })
    
    // normalize date: accept Date or ISO string
    let dateStr: string | undefined = undefined
    try {
      if (!data.date) dateStr = undefined
      else if (typeof data.date === 'string') {
        // if it's an ISO string, keep the YYYY-MM-DD portion
        dateStr = (new Date(data.date)).toISOString().split('T')[0]
      } else if (data.date instanceof Date) {
        dateStr = data.date.toISOString().split('T')[0]
      } else {
        // fallback
        dateStr = String(data.date)
      }
    } catch (e) {
      dateStr = undefined
    }

    const expense: any = {
      id: generateId(),
      householdId,
      userId,
      title: data.title,
      amount: data.amount,
      categoryId: data.categoryId,
      date: dateStr,
      notes: data.notes || '',
      paymentMethod: data.paymentMethod || undefined,
      tags: data.tags || undefined,
      // Backwards-compatible fields expected by DB and reports
      split: data.split || undefined,
      isShared: data.split ? true : undefined,
      shares: data.split && Array.isArray(data.split.participants) ? data.split.participants.map((p: any) => ({ memberId: p.memberId, percentage: p.percentage, amount: p.amount })) : undefined,
      attachments: data.attachments || undefined,
      deletedAt: null as null, // Força tipo nulo real
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    console.log('💾 Saving expense to database:', expense)
    
    try {
      // log available DB methods to help debug runtime issues with mocks or bundler
      try { console.log('db.expenses methods:', {
        add: typeof (db.expenses as any).add,
        put: typeof (db.expenses as any).put,
        update: typeof (db.expenses as any).update,
      }) } catch (e) { /* ignore logging errors */ }

      await db.expenses.add(expense as any)
      console.log('✅ Expense saved successfully with ID:', expense.id)
      return expense
    } catch (error) {
      // Capture rich error details to help debugging in-browser
      try {
        console.error('❌ Error saving expense:', {
          message: (error as any)?.message,
          stack: (error as any)?.stack,
          name: (error as any)?.name,
          expensePreview: { id: expense.id, householdId: expense.householdId, userId: expense.userId, title: expense.title, amount: expense.amount }
        })
      } catch (e) {
        console.error('❌ Error while logging original error', e)
      }
      throw error
    }
  }

  /**
   * Update an existing expense - simplified version
   */
  async updateExpense(id: string, data: ExpenseFormData): Promise<any> {
    console.log('✏️ SimpleExpenseService - updateExpense called with:', { id, data })
    
    const updateData = {
      title: data.title,
      amount: data.amount,
      categoryId: data.categoryId,
      date: data.date.toISOString().split('T')[0], // Convert to date string
      notes: data.notes || '',
      updatedAt: new Date().toISOString(), // Store as string for database
    }

    console.log('💾 Updating expense in database:', updateData)
    
    try {
      await db.expenses.update(id, updateData)
      console.log('✅ Expense updated successfully with ID:', id)
      return { ...updateData, id }
    } catch (error) {
      console.error('❌ Error updating expense:', error)
      throw error
    }
  }

  /**
   * Get all expenses for a household - simplified version
   */
  async getExpenses(householdId: string): Promise<any[]> {
    console.log('🔍 Getting expenses for household:', householdId)
    
    try {
      const expenses = await db.expenses
        .where('householdId')
        .equals(householdId)
        .and((expense: any) => !expense.deletedAt)
        .toArray()
      
      console.log('📊 Found expenses:', expenses)
      return expenses
    } catch (error) {
      console.error('❌ Error getting expenses:', error)
      return []
    }
  }
}

// Singleton instance
export const simpleExpenseService = new SimpleExpenseService()