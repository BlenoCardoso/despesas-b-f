import type { BaseModel } from './base'

export interface Expense extends BaseModel {
  householdId: string
  categoryId: string
  paidById: string
  date: string
  month: string
  description: string
  amount: number
  attachments?: string[]
  tags?: string[]
}