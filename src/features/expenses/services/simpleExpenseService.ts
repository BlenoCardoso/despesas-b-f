import { db } from '@/core/db/database'
import { generateId } from '@/core/utils/id'
import { ExpenseFormData } from '../types'

export class SimpleExpenseService {
  /**
   * Create a new expense - simplified version
   */
  async createExpense(data: ExpenseFormData, householdId: string, userId: string): Promise<any> {
    console.log('🔧 SimpleExpenseService - createExpense called with:', { data, householdId, userId })
    
    const expense = {
      id: generateId(),
      householdId,
      userId,
      title: data.title,
      amount: data.amount,
      categoryId: data.categoryId,
      date: data.date.toISOString().split('T')[0], // Convert to date string (YYYY-MM-DD)
      notes: data.notes || '',
      deletedAt: null as null, // Força tipo nulo real
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    console.log('💾 Saving expense to database:', expense)
    
    try {
      await db.expenses.add(expense as any)
      console.log('✅ Expense saved successfully with ID:', expense.id)
      return expense
    } catch (error) {
      console.error('❌ Error saving expense:', error)
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