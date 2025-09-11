import { 
  addDays, 
  addWeeks, 
  addMonths, 
  addYears, 
  startOfMonth, 
  endOfMonth, 
  getDaysInMonth,
  differenceInDays,
  isAfter,
  isBefore,
  parseISO
} from 'date-fns'
import { Expense } from '@/features/expenses/types'
import { Recurrence, Installment } from '@/types/global'

/**
 * Calculate daily average spending
 */
export function calculateDailyAverage(expenses: Expense[], month: Date): number {
  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  
  const monthlyExpenses = expenses.filter(expense => {
    const expenseDate = typeof expense.date === 'string' ? parseISO(expense.date) : expense.date
    return expenseDate >= monthStart && expenseDate <= monthEnd
  })
  
  const totalAmount = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const daysInMonth = getDaysInMonth(month)
  
  return totalAmount / daysInMonth
}

/**
 * Calculate monthly projection based on current spending
 */
export function calculateMonthlyProjection(expenses: Expense[], month: Date): number {
  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  const today = new Date()
  
  // Only calculate projection for current month
  if (month.getMonth() !== today.getMonth() || month.getFullYear() !== today.getFullYear()) {
    return 0
  }
  
  const monthlyExpenses = expenses.filter(expense => {
    const expenseDate = typeof expense.date === 'string' ? parseISO(expense.date) : expense.date
    return expenseDate >= monthStart && expenseDate <= monthEnd
  })
  
  const totalSpent = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const daysElapsed = differenceInDays(today, monthStart) + 1
  const daysInMonth = getDaysInMonth(month)
  
  if (daysElapsed === 0) return 0
  
  const dailyAverage = totalSpent / daysElapsed
  return dailyAverage * daysInMonth
}

/**
 * Calculate remaining budget
 */
export function calculateRemainingBudget(budget: number, spent: number): number {
  return Math.max(0, budget - spent)
}

/**
 * Calculate budget usage percentage
 */
export function calculateBudgetUsage(budget: number, spent: number): number {
  if (budget === 0) return 0
  return Math.min(100, (spent / budget) * 100)
}

/**
 * Calculate variation from previous month
 */
export function calculateMonthlyVariation(currentAmount: number, previousAmount: number): number {
  if (previousAmount === 0) return 0
  return ((currentAmount - previousAmount) / previousAmount) * 100
}

/**
 * Calculate next recurrence date
 */
export function calculateNextRecurrenceDate(lastDate: Date, recurrence: Recurrence): Date {
  const { type, interval } = recurrence
  
  switch (type) {
    case 'diario':
      return addDays(lastDate, interval)
    case 'semanal':
      return addWeeks(lastDate, interval)
    case 'mensal':
      return addMonths(lastDate, interval)
    case 'anual':
      return addYears(lastDate, interval)
    default:
      return addDays(lastDate, 1)
  }
}

/**
 * Calculate all future recurrence dates until end date
 */
export function calculateRecurrenceDates(
  startDate: Date, 
  recurrence: Recurrence, 
  maxDates: number = 12
): Date[] {
  const dates: Date[] = []
  let currentDate = startDate
  
  for (let i = 0; i < maxDates; i++) {
    if (recurrence.endDate && isAfter(currentDate, recurrence.endDate)) {
      break
    }
    
    dates.push(new Date(currentDate))
    currentDate = calculateNextRecurrenceDate(currentDate, recurrence)
  }
  
  return dates
}

/**
 * Calculate installment dates
 */
export function calculateInstallmentDates(
  startDate: Date, 
  installment: Installment,
  intervalMonths: number = 1
): Date[] {
  const dates: Date[] = []
  let currentDate = startDate
  
  for (let i = 0; i < installment.total; i++) {
    dates.push(new Date(currentDate))
    currentDate = addMonths(currentDate, intervalMonths)
  }
  
  return dates
}

/**
 * Calculate installment amount
 */
export function calculateInstallmentAmount(totalAmount: number, installments: number): number {
  return totalAmount / installments
}

/**
 * Calculate remaining installments
 */
export function calculateRemainingInstallments(installment: Installment): number {
  return installment.total - installment.count
}

/**
 * Calculate total remaining amount for installments
 */
export function calculateRemainingInstallmentAmount(
  totalAmount: number, 
  installment: Installment
): number {
  const installmentAmount = calculateInstallmentAmount(totalAmount, installment.total)
  const remaining = calculateRemainingInstallments(installment)
  return installmentAmount * remaining
}

/**
 * Calculate expenses by category
 */
export function calculateExpensesByCategory(expenses: Expense[]): Record<string, number> {
  return expenses.reduce((acc, expense) => {
    acc[expense.categoryId] = (acc[expense.categoryId] || 0) + expense.amount
    return acc
  }, {} as Record<string, number>)
}

/**
 * Calculate expenses by payment method
 */
export function calculateExpensesByPaymentMethod(expenses: Expense[]): Record<string, number> {
  return expenses.reduce((acc, expense) => {
    acc[expense.paymentMethod] = (acc[expense.paymentMethod] || 0) + expense.amount
    return acc
  }, {} as Record<string, number>)
}

/**
 * Calculate monthly expenses
 */
export function calculateMonthlyExpenses(expenses: Expense[]): Record<string, number> {
  return expenses.reduce((acc, expense) => {
    const expenseDate = typeof expense.date === 'string' ? parseISO(expense.date) : expense.date
    const monthKey = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`
    acc[monthKey] = (acc[monthKey] || 0) + expense.amount
    return acc
  }, {} as Record<string, number>)
}

/**
 * Calculate days until date
 */
export function calculateDaysUntil(targetDate: Date): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const target = new Date(targetDate)
  target.setHours(0, 0, 0, 0)
  
  return differenceInDays(target, today)
}

/**
 * Calculate medication adherence percentage
 */
export function calculateMedicationAdherence(taken: number, total: number): number {
  if (total === 0) return 0
  return Math.round((taken / total) * 100)
}

/**
 * Calculate medication stock days remaining
 */
export function calculateStockDaysRemaining(
  currentStock: number,
  dailyDosage: number
): number {
  if (dailyDosage === 0) return 0
  return Math.floor(currentStock / dailyDosage)
}

/**
 * Calculate compound interest
 */
export function calculateCompoundInterest(
  principal: number,
  rate: number,
  time: number,
  compoundFrequency: number = 12
): number {
  return principal * Math.pow(1 + rate / compoundFrequency, compoundFrequency * time)
}

/**
 * Calculate simple interest
 */
export function calculateSimpleInterest(
  principal: number,
  rate: number,
  time: number
): number {
  return principal * (1 + rate * time)
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue > 0 ? 100 : 0
  return ((newValue - oldValue) / oldValue) * 100
}

/**
 * Calculate moving average
 */
export function calculateMovingAverage(values: number[], period: number): number[] {
  const result: number[] = []
  
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      result.push(0)
    } else {
      const sum = values.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)
      result.push(sum / period)
    }
  }
  
  return result
}

/**
 * Calculate standard deviation
 */
export function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0
  
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  const squaredDifferences = values.map(value => Math.pow(value - mean, 2))
  const variance = squaredDifferences.reduce((sum, value) => sum + value, 0) / values.length
  
  return Math.sqrt(variance)
}

/**
 * Calculate median
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0
  
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2
  } else {
    return sorted[middle]
  }
}

/**
 * Calculate quartiles
 */
export function calculateQuartiles(values: number[]): { q1: number; q2: number; q3: number } {
  if (values.length === 0) return { q1: 0, q2: 0, q3: 0 }
  
  const sorted = [...values].sort((a, b) => a - b)
  const q2 = calculateMedian(sorted)
  
  const lowerHalf = sorted.slice(0, Math.floor(sorted.length / 2))
  const upperHalf = sorted.slice(Math.ceil(sorted.length / 2))
  
  const q1 = calculateMedian(lowerHalf)
  const q3 = calculateMedian(upperHalf)
  
  return { q1, q2, q3 }
}

/**
 * Round to specific decimal places
 */
export function roundToDecimals(value: number, decimals: number = 2): number {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

/**
 * Calculate tax amount (Brazilian taxes)
 */
export function calculateTax(amount: number, taxRate: number): number {
  return roundToDecimals(amount * (taxRate / 100))
}

/**
 * Calculate discount amount
 */
export function calculateDiscount(amount: number, discountRate: number): number {
  return roundToDecimals(amount * (discountRate / 100))
}

/**
 * Calculate final amount with tax and discount
 */
export function calculateFinalAmount(
  baseAmount: number,
  taxRate: number = 0,
  discountRate: number = 0
): number {
  const tax = calculateTax(baseAmount, taxRate)
  const discount = calculateDiscount(baseAmount, discountRate)
  return roundToDecimals(baseAmount + tax - discount)
}

