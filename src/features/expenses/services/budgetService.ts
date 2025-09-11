import { db } from '@/core/db/database'
import { Budget } from '@/types/global'
import { generateId } from '@/core/utils/id'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { expenseService } from './expenseService'

export interface BudgetFormData {
  categoryId?: string // undefined = orçamento geral
  amount: number
  month: string // YYYY-MM
}

export interface BudgetWithUsage extends Budget {
  spent: number
  remaining: number
  percentage: number
  isOverBudget: boolean
  categoryName?: string
}

export class BudgetService {
  /**
   * Create a new budget
   */
  async createBudget(data: BudgetFormData, householdId: string): Promise<Budget> {
    // Check if budget already exists for this category/month
    const existingBudget = await db.budgets
      .where({ householdId, categoryId: data.categoryId || '', month: data.month })
      .first()

    if (existingBudget) {
      throw new Error('Orçamento já existe para esta categoria e mês')
    }

    const budget: Budget = {
      id: generateId(),
      householdId,
      categoryId: data.categoryId,
      amount: data.amount,
      month: data.month,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await db.budgets.add(budget)
    return budget
  }

  /**
   * Update an existing budget
   */
  async updateBudget(id: string, data: Partial<BudgetFormData>): Promise<void> {
    const updates: Partial<Budget> = {
      ...data,
      updatedAt: new Date(),
    }

    await db.budgets.update(id, updates)
  }

  /**
   * Delete a budget
   */
  async deleteBudget(id: string): Promise<void> {
    await db.budgets.delete(id)
  }

  /**
   * Get budget by ID
   */
  async getBudgetById(id: string): Promise<Budget | undefined> {
    return await db.budgets.get(id)
  }

  /**
   * Get all budgets for a household
   */
  async getBudgets(householdId: string): Promise<Budget[]> {
    return await db.budgets
      .where({ householdId })
      .reverse()
      .sortBy('month')
  }

  /**
   * Get budgets for a specific month
   */
  async getMonthlyBudgets(householdId: string, month: string): Promise<Budget[]> {
    return await db.budgets
      .where({ householdId, month })
      .sortBy('categoryId')
  }

  /**
   * Get budget for a specific category and month
   */
  async getBudgetForCategory(
    householdId: string, 
    categoryId: string | undefined, 
    month: string
  ): Promise<Budget | undefined> {
    return await db.budgets
      .where({ 
        householdId, 
        categoryId: categoryId || '', 
        month 
      })
      .first()
  }

  /**
   * Get general budget for a month (no category)
   */
  async getGeneralBudget(householdId: string, month: string): Promise<Budget | undefined> {
    return await this.getBudgetForCategory(householdId, undefined, month)
  }

  /**
   * Get budgets with usage information
   */
  async getBudgetsWithUsage(householdId: string, month: string): Promise<BudgetWithUsage[]> {
    const budgets = await this.getMonthlyBudgets(householdId, month)
    const categories = await db.categories.where({ householdId }).toArray()
    
    const budgetsWithUsage: BudgetWithUsage[] = []

    for (const budget of budgets) {
      const spent = await this.getSpentAmount(householdId, budget.categoryId, month)
      const remaining = Math.max(0, budget.amount - spent)
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0
      const isOverBudget = spent > budget.amount

      let categoryName: string | undefined
      if (budget.categoryId) {
        const category = categories.find(cat => cat.id === budget.categoryId)
        categoryName = category?.name
      }

      budgetsWithUsage.push({
        ...budget,
        spent,
        remaining,
        percentage,
        isOverBudget,
        categoryName,
      })
    }

    return budgetsWithUsage.sort((a, b) => {
      // Sort by category name, with general budget first
      if (!a.categoryId) return -1
      if (!b.categoryId) return 1
      return (a.categoryName || '').localeCompare(b.categoryName || '')
    })
  }

  /**
   * Get spent amount for a category in a month
   */
  async getSpentAmount(
    householdId: string, 
    categoryId: string | undefined, 
    month: string
  ): Promise<number> {
    const [year, monthNum] = month.split('-').map(Number)
    const monthDate = new Date(year, monthNum - 1, 1)
    const startDate = startOfMonth(monthDate)
    const endDate = endOfMonth(monthDate)

    let query = db.expenses
      .where({ householdId })
      .and(expense => {
        if (expense.deletedAt) return false
        
        const expenseDate = typeof expense.date === 'string' ? new Date(expense.date) : expense.date
        if (expenseDate < startDate || expenseDate > endDate) return false

        // If categoryId is undefined, sum all expenses (general budget)
        // If categoryId is specified, only sum expenses for that category
        if (categoryId && expense.categoryId !== categoryId) return false

        return true
      })

    const expenses = await query.toArray()
    return expenses.reduce((sum, expense) => sum + expense.amount, 0)
  }

  /**
   * Get budget alerts (70% and 90% usage)
   */
  async getBudgetAlerts(householdId: string, month: string): Promise<Array<{
    budget: BudgetWithUsage
    alertType: 'warning' | 'critical' | 'exceeded'
    message: string
  }>> {
    const budgetsWithUsage = await this.getBudgetsWithUsage(householdId, month)
    const alerts: Array<{
      budget: BudgetWithUsage
      alertType: 'warning' | 'critical' | 'exceeded'
      message: string
    }> = []

    for (const budget of budgetsWithUsage) {
      if (budget.percentage >= 100) {
        alerts.push({
          budget,
          alertType: 'exceeded',
          message: `Orçamento ${budget.categoryName || 'geral'} foi ultrapassado`,
        })
      } else if (budget.percentage >= 90) {
        alerts.push({
          budget,
          alertType: 'critical',
          message: `Orçamento ${budget.categoryName || 'geral'} está em 90% do limite`,
        })
      } else if (budget.percentage >= 70) {
        alerts.push({
          budget,
          alertType: 'warning',
          message: `Orçamento ${budget.categoryName || 'geral'} está em 70% do limite`,
        })
      }
    }

    return alerts.sort((a, b) => b.budget.percentage - a.budget.percentage)
  }

  /**
   * Get budget summary for a month
   */
  async getBudgetSummary(householdId: string, month: string): Promise<{
    totalBudget: number
    totalSpent: number
    totalRemaining: number
    overallPercentage: number
    budgetCount: number
    alertCount: number
  }> {
    const budgetsWithUsage = await this.getBudgetsWithUsage(householdId, month)
    const alerts = await this.getBudgetAlerts(householdId, month)

    const totalBudget = budgetsWithUsage.reduce((sum, budget) => sum + budget.amount, 0)
    const totalSpent = budgetsWithUsage.reduce((sum, budget) => sum + budget.spent, 0)
    const totalRemaining = Math.max(0, totalBudget - totalSpent)
    const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

    return {
      totalBudget,
      totalSpent,
      totalRemaining,
      overallPercentage,
      budgetCount: budgetsWithUsage.length,
      alertCount: alerts.length,
    }
  }

  /**
   * Copy budgets from previous month
   */
  async copyBudgetsFromPreviousMonth(householdId: string, targetMonth: string): Promise<Budget[]> {
    const [year, month] = targetMonth.split('-').map(Number)
    const previousMonth = new Date(year, month - 2, 1) // month - 2 because month is 1-based
    const previousMonthStr = format(previousMonth, 'yyyy-MM')

    const previousBudgets = await this.getMonthlyBudgets(householdId, previousMonthStr)
    const newBudgets: Budget[] = []

    for (const previousBudget of previousBudgets) {
      // Check if budget already exists for target month
      const existingBudget = await this.getBudgetForCategory(
        householdId,
        previousBudget.categoryId,
        targetMonth
      )

      if (!existingBudget) {
        const newBudget = await this.createBudget({
          categoryId: previousBudget.categoryId,
          amount: previousBudget.amount,
          month: targetMonth,
        }, householdId)

        newBudgets.push(newBudget)
      }
    }

    return newBudgets
  }

  /**
   * Get budget history for a category
   */
  async getBudgetHistory(
    householdId: string, 
    categoryId: string | undefined, 
    months: number = 12
  ): Promise<Array<{
    month: string
    budget: number
    spent: number
    percentage: number
  }>> {
    const history: Array<{
      month: string
      budget: number
      spent: number
      percentage: number
    }> = []

    const currentDate = new Date()
    
    for (let i = 0; i < months; i++) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const monthStr = format(monthDate, 'yyyy-MM')

      const budget = await this.getBudgetForCategory(householdId, categoryId, monthStr)
      const spent = await this.getSpentAmount(householdId, categoryId, monthStr)

      const budgetAmount = budget?.amount || 0
      const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0

      history.unshift({
        month: monthStr,
        budget: budgetAmount,
        spent,
        percentage,
      })
    }

    return history
  }

  /**
   * Get current month string
   */
  getCurrentMonth(): string {
    return format(new Date(), 'yyyy-MM')
  }

  /**
   * Validate budget data
   */
  validateBudgetData(data: BudgetFormData): string | null {
    if (!data.amount || data.amount <= 0) {
      return 'Valor do orçamento deve ser maior que zero'
    }

    if (data.amount > 999999999) {
      return 'Valor do orçamento é muito alto'
    }

    if (!data.month || !/^\d{4}-\d{2}$/.test(data.month)) {
      return 'Mês deve estar no formato YYYY-MM'
    }

    return null
  }
}

// Singleton instance
export const budgetService = new BudgetService()

