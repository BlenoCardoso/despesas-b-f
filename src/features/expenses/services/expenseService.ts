import { db } from '@/core/db/database'
import { Expense, ExpenseFormData, ExpenseFilter, ExpenseListOptions } from '../types'
import { generateId } from '@/core/utils/id'
import { startOfMonth, endOfMonth, parseISO } from 'date-fns'

export class ExpenseService {
  /**
   * Create a new expense
   */
  async createExpense(data: ExpenseFormData, householdId: string, userId: string): Promise<Expense> {
    const expense: Expense = {
      id: generateId(),
      householdId,
      userId,
      title: data.title,
      amount: data.amount,
      currency: 'BRL',
      categoryId: data.categoryId,
      paymentMethod: data.paymentMethod,
      date: data.date,
      notes: data.notes,
      attachments: [],
      recurrence: data.recurrence,
      installment: data.installment,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Handle file attachments
    if (data.attachments && data.attachments.length > 0) {
      for (const file of data.attachments) {
        const attachmentId = generateId()
        await db.storeBlob(attachmentId, file, file.type)
        
        expense.attachments.push({
          id: attachmentId,
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
          blobRef: attachmentId,
        })
      }
    }

    await db.expenses.add(expense)
    return expense
  }

  /**
   * Update an existing expense
   */
  async updateExpense(id: string, data: Partial<ExpenseFormData>): Promise<void> {
    const updates: Partial<Expense> = {
      ...data,
      updatedAt: new Date(),
      syncVersion: Date.now(),
    }

    // Handle new attachments
    if (data.attachments && data.attachments.length > 0) {
      const currentExpense = await db.expenses.get(id)
      if (currentExpense) {
        const newAttachments = [...currentExpense.attachments]
        
        for (const file of data.attachments) {
          const attachmentId = generateId()
          await db.storeBlob(attachmentId, file, file.type)
          
          newAttachments.push({
            id: attachmentId,
            fileName: file.name,
            mimeType: file.type,
            size: file.size,
            blobRef: attachmentId,
          })
        }
        
        updates.attachments = newAttachments
      }
    }

    await db.expenses.update(id, updates)
  }

  /**
   * Delete an expense (soft delete)
   */
  async deleteExpense(id: string): Promise<void> {
    await db.softDeleteExpense(id)
  }

  /**
   * Get expense by ID
   */
  async getExpenseById(id: string): Promise<Expense | undefined> {
    return await db.expenses.get(id)
  }

  /**
   * Get all expenses for a household
   */
  async getExpenses(householdId: string, options?: ExpenseListOptions): Promise<Expense[]> {
    let query = db.expenses.where({ householdId }).and(expense => !expense.deletedAt)

    // Apply filters
    if (options?.filter) {
      query = this.applyFilters(query, options.filter)
    }

    let expenses = await query.toArray()

    // Apply sorting
    if (options?.sortBy) {
      expenses = this.sortExpenses(expenses, options.sortBy, options.sortOrder || 'desc')
    }

    // Apply pagination
    if (options?.page && options?.pageSize) {
      const start = (options.page - 1) * options.pageSize
      const end = start + options.pageSize
      expenses = expenses.slice(start, end)
    }

    return expenses
  }

  /**
   * Get expenses for a specific month
   */
  async getMonthlyExpenses(householdId: string, month: Date): Promise<Expense[]> {
    const startDate = startOfMonth(month)
    const endDate = endOfMonth(month)

    return await db.expenses
      .where({ householdId })
      .and(expense => {
        if (expense.deletedAt) return false
        const expenseDate = typeof expense.date === 'string' ? parseISO(expense.date) : expense.date
        return expenseDate >= startDate && expenseDate <= endDate
      })
      .reverse()
      .sortBy('date')
  }

  /**
   * Get expenses by category
   */
  async getExpensesByCategory(householdId: string, categoryId: string): Promise<Expense[]> {
    return await db.expenses
      .where({ householdId, categoryId })
      .and(expense => !expense.deletedAt)
      .reverse()
      .sortBy('date')
  }

  /**
   * Search expenses by text
   */
  async searchExpenses(householdId: string, searchText: string): Promise<Expense[]> {
    const lowerSearchText = searchText.toLowerCase()
    
    return await db.expenses
      .where({ householdId })
      .and(expense => {
        if (expense.deletedAt) return false
        return (
          expense.title.toLowerCase().includes(lowerSearchText) ||
          expense.notes?.toLowerCase().includes(lowerSearchText) ||
          false
        )
      })
      .reverse()
      .sortBy('date')
  }

  /**
   * Get recurring expenses
   */
  async getRecurringExpenses(householdId: string): Promise<Expense[]> {
    return await db.expenses
      .where({ householdId })
      .and(expense => !expense.deletedAt && !!expense.recurrence)
      .reverse()
      .sortBy('date')
  }

  /**
   * Get installment expenses
   */
  async getInstallmentExpenses(householdId: string): Promise<Expense[]> {
    return await db.expenses
      .where({ householdId })
      .and(expense => !expense.deletedAt && !!expense.installment)
      .reverse()
      .sortBy('date')
  }

  /**
   * Get total expenses for a period
   */
  async getTotalExpenses(householdId: string, startDate?: Date, endDate?: Date): Promise<number> {
    let query = db.expenses.where({ householdId }).and(expense => !expense.deletedAt)

    if (startDate || endDate) {
      query = query.and(expense => {
        const expenseDate = typeof expense.date === 'string' ? parseISO(expense.date) : expense.date
        if (startDate && expenseDate < startDate) return false
        if (endDate && expenseDate > endDate) return false
        return true
      })
    }

    const expenses = await query.toArray()
    return expenses.reduce((total, expense) => total + expense.amount, 0)
  }

  /**
   * Get expense count for a period
   */
  async getExpenseCount(householdId: string, startDate?: Date, endDate?: Date): Promise<number> {
    let query = db.expenses.where({ householdId }).and(expense => !expense.deletedAt)

    if (startDate || endDate) {
      query = query.and(expense => {
        const expenseDate = typeof expense.date === 'string' ? parseISO(expense.date) : expense.date
        if (startDate && expenseDate < startDate) return false
        if (endDate && expenseDate > endDate) return false
        return true
      })
    }

    return await query.count()
  }

  /**
   * Duplicate an expense
   */
  async duplicateExpense(id: string): Promise<Expense> {
    const originalExpense = await db.expenses.get(id)
    if (!originalExpense) {
      throw new Error('Expense not found')
    }

    const duplicatedExpense: Expense = {
      ...originalExpense,
      id: generateId(),
      date: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      // Remove installment info for duplicated expense
      installment: undefined,
    }

    await db.expenses.add(duplicatedExpense)
    return duplicatedExpense
  }

  /**
   * Get attachment blob
   */
  async getAttachmentBlob(blobRef: string): Promise<Blob | undefined> {
    return await db.getBlob(blobRef)
  }

  /**
   * Delete attachment
   */
  async deleteAttachment(expenseId: string, attachmentId: string): Promise<void> {
    const expense = await db.expenses.get(expenseId)
    if (!expense) return

    const attachmentIndex = expense.attachments.findIndex(att => att.id === attachmentId)
    if (attachmentIndex === -1) return

    const attachment = expense.attachments[attachmentIndex]
    
    // Remove from blob storage
    await db.deleteBlob(attachment.blobRef)
    
    // Remove from expense
    expense.attachments.splice(attachmentIndex, 1)
    await db.expenses.update(expenseId, {
      attachments: expense.attachments,
      updatedAt: new Date(),
      syncVersion: Date.now(),
    })
  }

  private applyFilters(query: any, filter: ExpenseFilter): any {
    return query.and((expense: Expense) => {
      const expenseDate = typeof expense.date === 'string' ? parseISO(expense.date) : expense.date

      // Date range filter
      if (filter.startDate && expenseDate < filter.startDate) return false
      if (filter.endDate && expenseDate > filter.endDate) return false

      // Category filter
      if (filter.categoryIds && filter.categoryIds.length > 0) {
        if (!filter.categoryIds.includes(expense.categoryId)) return false
      }

      // Payment method filter
      if (filter.paymentMethods && filter.paymentMethods.length > 0) {
        if (!filter.paymentMethods.includes(expense.paymentMethod)) return false
      }

      // Amount range filter
      if (filter.minAmount && expense.amount < filter.minAmount) return false
      if (filter.maxAmount && expense.amount > filter.maxAmount) return false

      // Text search filter
      if (filter.searchText) {
        const searchText = filter.searchText.toLowerCase()
        const matchesTitle = expense.title.toLowerCase().includes(searchText)
        const matchesNotes = expense.notes?.toLowerCase().includes(searchText) || false
        if (!matchesTitle && !matchesNotes) return false
      }

      // Recurrence filter
      if (filter.hasRecurrence !== undefined) {
        const hasRecurrence = !!expense.recurrence
        if (filter.hasRecurrence !== hasRecurrence) return false
      }

      // Installments filter
      if (filter.hasInstallments !== undefined) {
        const hasInstallments = !!expense.installment
        if (filter.hasInstallments !== hasInstallments) return false
      }

      return true
    })
  }

  private sortExpenses(expenses: Expense[], sortBy: string, sortOrder: 'asc' | 'desc'): Expense[] {
    return expenses.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'date':
          const dateA = typeof a.date === 'string' ? parseISO(a.date) : a.date
          const dateB = typeof b.date === 'string' ? parseISO(b.date) : b.date
          comparison = dateA.getTime() - dateB.getTime()
          break
        case 'amount':
          comparison = a.amount - b.amount
          break
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'category':
          comparison = a.categoryId.localeCompare(b.categoryId)
          break
        case 'paymentMethod':
          comparison = a.paymentMethod.localeCompare(b.paymentMethod)
          break
        default:
          comparison = a.createdAt.getTime() - b.createdAt.getTime()
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })
  }
}

// Singleton instance
export const expenseService = new ExpenseService()

