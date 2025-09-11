import { db } from '@/core/db/database'
import { Expense, ExpenseCategory } from '@/features/expenses/types'
import { Task } from '@/features/tasks/types'
import { Medication, MedicationIntake } from '@/features/medications/types'
import { CalendarEvent } from '@/features/calendar/types'
import { formatCurrency } from '@/core/utils/formatters'
import { startOfMonth, endOfMonth, startOfYear, endOfYear, format, subMonths, subYears } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export interface ExpenseReport {
  period: string
  totalExpenses: number
  totalIncome: number
  balance: number
  expensesByCategory: Array<{
    category: string
    amount: number
    percentage: number
    count: number
  }>
  expensesByUser: Array<{
    userId: string
    userName: string
    amount: number
    percentage: number
    count: number
  }>
  monthlyTrend: Array<{
    month: string
    expenses: number
    income: number
    balance: number
  }>
  topExpenses: Expense[]
  budgetAnalysis: Array<{
    categoryId: string
    categoryName: string
    budgetAmount: number
    spentAmount: number
    percentage: number
    status: 'under' | 'over' | 'near'
  }>
}

export interface TaskReport {
  period: string
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  overdueTasks: number
  completionRate: number
  tasksByPriority: Array<{
    priority: string
    count: number
    completed: number
    percentage: number
  }>
  tasksByUser: Array<{
    userId: string
    userName: string
    total: number
    completed: number
    completionRate: number
  }>
  productivityTrend: Array<{
    period: string
    created: number
    completed: number
    completionRate: number
  }>
}

export interface MedicationReport {
  period: string
  totalMedications: number
  activeMedications: number
  totalIntakes: number
  missedIntakes: number
  adherenceRate: number
  medicationsByType: Array<{
    type: string
    count: number
    adherenceRate: number
  }>
  adherenceTrend: Array<{
    date: string
    scheduled: number
    taken: number
    missed: number
    adherenceRate: number
  }>
  upcomingRefills: Array<{
    medicationId: string
    medicationName: string
    daysRemaining: number
    currentStock: number
  }>
}

export interface OverallReport {
  period: string
  expenses: ExpenseReport
  tasks: TaskReport
  medications: MedicationReport
  summary: {
    totalExpenses: number
    totalTasks: number
    totalMedications: number
    completionRates: {
      tasks: number
      medications: number
    }
    alerts: Array<{
      type: 'budget' | 'task' | 'medication' | 'document'
      message: string
      severity: 'low' | 'medium' | 'high'
      count: number
    }>
  }
}

export type ReportPeriod = 'week' | 'month' | 'quarter' | 'year' | 'custom'

export interface ReportFilters {
  period: ReportPeriod
  startDate?: Date
  endDate?: Date
  categories?: string[]
  users?: string[]
  includeIncome?: boolean
}

class ReportService {
  async generateExpenseReport(householdId: string, filters: ReportFilters): Promise<ExpenseReport> {
    const { startDate, endDate } = this.getDateRange(filters)
    
    // Get expenses for the period
    const expenses = await db.expenses
      .where('householdId')
      .equals(householdId)
      .and(expense => {
        const expenseDate = new Date(expense.date)
        return expenseDate >= startDate && expenseDate <= endDate
      })
      .toArray()

    // Get categories
    const categories = await db.expenseCategories
      .where('householdId')
      .equals(householdId)
      .toArray()

    // Get users
    const users = await db.users
      .where('householdId')
      .equals(householdId)
      .toArray()

    // Get budgets
    const budgets = await db.budgets
      .where('householdId')
      .equals(householdId)
      .toArray()

    // Calculate totals
    const totalExpenses = expenses
      .filter(e => e.type === 'expense')
      .reduce((sum, e) => sum + e.amount, 0)

    const totalIncome = expenses
      .filter(e => e.type === 'income')
      .reduce((sum, e) => sum + e.amount, 0)

    const balance = totalIncome - totalExpenses

    // Expenses by category
    const expensesByCategory = categories.map(category => {
      const categoryExpenses = expenses.filter(e => 
        e.categoryId === category.id && e.type === 'expense'
      )
      const amount = categoryExpenses.reduce((sum, e) => sum + e.amount, 0)
      
      return {
        category: category.name,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
        count: categoryExpenses.length
      }
    }).filter(c => c.amount > 0)
    .sort((a, b) => b.amount - a.amount)

    // Expenses by user
    const expensesByUser = users.map(user => {
      const userExpenses = expenses.filter(e => 
        e.paidBy === user.id && e.type === 'expense'
      )
      const amount = userExpenses.reduce((sum, e) => sum + e.amount, 0)
      
      return {
        userId: user.id,
        userName: user.name,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
        count: userExpenses.length
      }
    }).filter(u => u.amount > 0)
    .sort((a, b) => b.amount - a.amount)

    // Monthly trend (last 12 months)
    const monthlyTrend = []
    for (let i = 11; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(new Date(), i))
      const monthEnd = endOfMonth(monthStart)
      
      const monthExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.date)
        return expenseDate >= monthStart && expenseDate <= monthEnd
      })

      const monthExpenseTotal = monthExpenses
        .filter(e => e.type === 'expense')
        .reduce((sum, e) => sum + e.amount, 0)

      const monthIncomeTotal = monthExpenses
        .filter(e => e.type === 'income')
        .reduce((sum, e) => sum + e.amount, 0)

      monthlyTrend.push({
        month: format(monthStart, 'MMM yyyy', { locale: ptBR }),
        expenses: monthExpenseTotal,
        income: monthIncomeTotal,
        balance: monthIncomeTotal - monthExpenseTotal
      })
    }

    // Top expenses
    const topExpenses = expenses
      .filter(e => e.type === 'expense')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)

    // Budget analysis
    const budgetAnalysis = budgets.map(budget => {
      const categoryExpenses = expenses.filter(e => 
        e.categoryId === budget.categoryId && e.type === 'expense'
      )
      const spentAmount = categoryExpenses.reduce((sum, e) => sum + e.amount, 0)
      const percentage = budget.amount > 0 ? (spentAmount / budget.amount) * 100 : 0
      
      let status: 'under' | 'over' | 'near' = 'under'
      if (percentage >= 100) status = 'over'
      else if (percentage >= 80) status = 'near'

      const category = categories.find(c => c.id === budget.categoryId)

      return {
        categoryId: budget.categoryId,
        categoryName: category?.name || 'Categoria Desconhecida',
        budgetAmount: budget.amount,
        spentAmount,
        percentage,
        status
      }
    })

    return {
      period: this.formatPeriod(filters),
      totalExpenses,
      totalIncome,
      balance,
      expensesByCategory,
      expensesByUser,
      monthlyTrend,
      topExpenses,
      budgetAnalysis
    }
  }

  async generateTaskReport(householdId: string, filters: ReportFilters): Promise<TaskReport> {
    const { startDate, endDate } = this.getDateRange(filters)
    
    // Get tasks for the period
    const tasks = await db.tasks
      .where('householdId')
      .equals(householdId)
      .and(task => {
        const taskDate = new Date(task.createdAt)
        return taskDate >= startDate && taskDate <= endDate
      })
      .toArray()

    // Get users
    const users = await db.users
      .where('householdId')
      .equals(householdId)
      .toArray()

    // Calculate totals
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.status === 'completed').length
    const pendingTasks = tasks.filter(t => t.status === 'pending').length
    const overdueTasks = tasks.filter(t => 
      t.status !== 'completed' && 
      t.dueDate && 
      new Date(t.dueDate) < new Date()
    ).length
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    // Tasks by priority
    const priorities = ['high', 'medium', 'low']
    const tasksByPriority = priorities.map(priority => {
      const priorityTasks = tasks.filter(t => t.priority === priority)
      const completed = priorityTasks.filter(t => t.status === 'completed').length
      
      return {
        priority,
        count: priorityTasks.length,
        completed,
        percentage: priorityTasks.length > 0 ? (completed / priorityTasks.length) * 100 : 0
      }
    }).filter(p => p.count > 0)

    // Tasks by user
    const tasksByUser = users.map(user => {
      const userTasks = tasks.filter(t => t.assignedTo === user.id)
      const completed = userTasks.filter(t => t.status === 'completed').length
      
      return {
        userId: user.id,
        userName: user.name,
        total: userTasks.length,
        completed,
        completionRate: userTasks.length > 0 ? (completed / userTasks.length) * 100 : 0
      }
    }).filter(u => u.total > 0)

    // Productivity trend (weekly for last 12 weeks)
    const productivityTrend = []
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - (i * 7))
      weekStart.setHours(0, 0, 0, 0)
      
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)

      const weekTasks = tasks.filter(t => {
        const taskDate = new Date(t.createdAt)
        return taskDate >= weekStart && taskDate <= weekEnd
      })

      const weekCompleted = weekTasks.filter(t => 
        t.status === 'completed' && 
        t.completedAt && 
        new Date(t.completedAt) >= weekStart && 
        new Date(t.completedAt) <= weekEnd
      ).length

      productivityTrend.push({
        period: format(weekStart, 'dd/MM', { locale: ptBR }),
        created: weekTasks.length,
        completed: weekCompleted,
        completionRate: weekTasks.length > 0 ? (weekCompleted / weekTasks.length) * 100 : 0
      })
    }

    return {
      period: this.formatPeriod(filters),
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      completionRate,
      tasksByPriority,
      tasksByUser,
      productivityTrend
    }
  }

  async generateMedicationReport(householdId: string, filters: ReportFilters): Promise<MedicationReport> {
    const { startDate, endDate } = this.getDateRange(filters)
    
    // Get medications
    const medications = await db.medications
      .where('householdId')
      .equals(householdId)
      .toArray()

    // Get intakes for the period
    const intakes = await db.medicationIntakes
      .where('householdId')
      .equals(householdId)
      .and(intake => {
        const intakeDate = new Date(intake.scheduledTime)
        return intakeDate >= startDate && intakeDate <= endDate
      })
      .toArray()

    // Calculate totals
    const totalMedications = medications.length
    const activeMedications = medications.filter(m => 
      !m.endDate || new Date(m.endDate) >= new Date()
    ).length
    const totalIntakes = intakes.length
    const missedIntakes = intakes.filter(i => i.status === 'missed').length
    const takenIntakes = intakes.filter(i => i.status === 'taken').length
    const adherenceRate = totalIntakes > 0 ? (takenIntakes / totalIntakes) * 100 : 0

    // Medications by type
    const medicationTypes = [...new Set(medications.map(m => m.form))]
    const medicationsByType = medicationTypes.map(type => {
      const typeMedications = medications.filter(m => m.form === type)
      const typeIntakes = intakes.filter(i => {
        const medication = medications.find(m => m.id === i.medicationId)
        return medication?.form === type
      })
      const typeTaken = typeIntakes.filter(i => i.status === 'taken').length
      
      return {
        type,
        count: typeMedications.length,
        adherenceRate: typeIntakes.length > 0 ? (typeTaken / typeIntakes.length) * 100 : 0
      }
    })

    // Adherence trend (daily for last 30 days)
    const adherenceTrend = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)

      const dayIntakes = intakes.filter(i => {
        const intakeDate = new Date(i.scheduledTime)
        return intakeDate >= date && intakeDate <= dayEnd
      })

      const dayTaken = dayIntakes.filter(i => i.status === 'taken').length
      const dayMissed = dayIntakes.filter(i => i.status === 'missed').length

      adherenceTrend.push({
        date: format(date, 'dd/MM', { locale: ptBR }),
        scheduled: dayIntakes.length,
        taken: dayTaken,
        missed: dayMissed,
        adherenceRate: dayIntakes.length > 0 ? (dayTaken / dayIntakes.length) * 100 : 0
      })
    }

    // Upcoming refills (medications with low stock)
    const upcomingRefills = medications
      .filter(m => m.currentStock <= m.lowStockThreshold)
      .map(m => {
        const dailyUsage = this.calculateDailyUsage(m)
        const daysRemaining = dailyUsage > 0 ? Math.floor(m.currentStock / dailyUsage) : 999
        
        return {
          medicationId: m.id,
          medicationName: m.name,
          daysRemaining,
          currentStock: m.currentStock
        }
      })
      .sort((a, b) => a.daysRemaining - b.daysRemaining)

    return {
      period: this.formatPeriod(filters),
      totalMedications,
      activeMedications,
      totalIntakes,
      missedIntakes,
      adherenceRate,
      medicationsByType,
      adherenceTrend,
      upcomingRefills
    }
  }

  async generateOverallReport(householdId: string, filters: ReportFilters): Promise<OverallReport> {
    const [expenses, tasks, medications] = await Promise.all([
      this.generateExpenseReport(householdId, filters),
      this.generateTaskReport(householdId, filters),
      this.generateMedicationReport(householdId, filters)
    ])

    // Generate alerts
    const alerts = []

    // Budget alerts
    const overBudgetCategories = expenses.budgetAnalysis.filter(b => b.status === 'over')
    if (overBudgetCategories.length > 0) {
      alerts.push({
        type: 'budget' as const,
        message: `${overBudgetCategories.length} categoria(s) estão acima do orçamento`,
        severity: 'high' as const,
        count: overBudgetCategories.length
      })
    }

    // Task alerts
    if (tasks.overdueTasks > 0) {
      alerts.push({
        type: 'task' as const,
        message: `${tasks.overdueTasks} tarefa(s) em atraso`,
        severity: 'medium' as const,
        count: tasks.overdueTasks
      })
    }

    // Medication alerts
    if (medications.adherenceRate < 80) {
      alerts.push({
        type: 'medication' as const,
        message: `Taxa de aderência aos medicamentos baixa (${medications.adherenceRate.toFixed(1)}%)`,
        severity: 'high' as const,
        count: 1
      })
    }

    if (medications.upcomingRefills.length > 0) {
      alerts.push({
        type: 'medication' as const,
        message: `${medications.upcomingRefills.length} medicamento(s) com estoque baixo`,
        severity: 'medium' as const,
        count: medications.upcomingRefills.length
      })
    }

    return {
      period: this.formatPeriod(filters),
      expenses,
      tasks,
      medications,
      summary: {
        totalExpenses: expenses.totalExpenses,
        totalTasks: tasks.totalTasks,
        totalMedications: medications.totalMedications,
        completionRates: {
          tasks: tasks.completionRate,
          medications: medications.adherenceRate
        },
        alerts
      }
    }
  }

  private getDateRange(filters: ReportFilters): { startDate: Date; endDate: Date } {
    const now = new Date()
    
    if (filters.startDate && filters.endDate) {
      return {
        startDate: filters.startDate,
        endDate: filters.endDate
      }
    }

    switch (filters.period) {
      case 'week':
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - 7)
        return { startDate: weekStart, endDate: now }

      case 'month':
        return {
          startDate: startOfMonth(now),
          endDate: endOfMonth(now)
        }

      case 'quarter':
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
        const quarterEnd = new Date(quarterStart)
        quarterEnd.setMonth(quarterEnd.getMonth() + 3)
        quarterEnd.setDate(0)
        return { startDate: quarterStart, endDate: quarterEnd }

      case 'year':
        return {
          startDate: startOfYear(now),
          endDate: endOfYear(now)
        }

      default:
        return {
          startDate: startOfMonth(now),
          endDate: endOfMonth(now)
        }
    }
  }

  private formatPeriod(filters: ReportFilters): string {
    if (filters.startDate && filters.endDate) {
      return `${format(filters.startDate, 'dd/MM/yyyy', { locale: ptBR })} - ${format(filters.endDate, 'dd/MM/yyyy', { locale: ptBR })}`
    }

    const now = new Date()
    switch (filters.period) {
      case 'week':
        return 'Última semana'
      case 'month':
        return format(now, 'MMMM yyyy', { locale: ptBR })
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3) + 1
        return `${quarter}º trimestre ${now.getFullYear()}`
      case 'year':
        return now.getFullYear().toString()
      default:
        return format(now, 'MMMM yyyy', { locale: ptBR })
    }
  }

  private calculateDailyUsage(medication: Medication): number {
    // Simple calculation based on frequency
    // In a real app, this would be more sophisticated
    switch (medication.frequency) {
      case 'daily':
        return medication.dosage
      case 'twice_daily':
        return medication.dosage * 2
      case 'three_times_daily':
        return medication.dosage * 3
      case 'weekly':
        return medication.dosage / 7
      case 'monthly':
        return medication.dosage / 30
      default:
        return 1
    }
  }

  // Export functions
  async exportToCSV(data: any[], filename: string): Promise<string> {
    if (data.length === 0) return ''

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`
          }
          return value
        }).join(',')
      )
    ].join('\n')

    return csvContent
  }

  async exportToPDF(reportData: any, reportType: string): Promise<Blob> {
    // This would integrate with a PDF generation library
    // For now, return a placeholder
    const content = JSON.stringify(reportData, null, 2)
    return new Blob([content], { type: 'application/json' })
  }
}

export const reportService = new ReportService()

