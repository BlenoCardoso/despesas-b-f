// Campos de auditoria
export interface AuditFields {
  createdAt: string
  createdBy: string
  updatedAt?: string
  updatedBy?: string
  deletedAt?: string
  deletedBy?: string
}

// Tipos comuns
export interface BaseModel extends AuditFields {
  id: string
  version: number
}

// Tipos de usuário
export interface User extends BaseModel {
  name: string
  email: string
  photoURL?: string
}

// Tipos de domicílio
export interface Household extends BaseModel {
  name: string
  ownerId: string
  currency: string
  photo?: string
}

export interface Member extends BaseModel {
  householdId: string
  userId: string
  role: 'owner' | 'admin' | 'member'
}

// Tipos de despesas
export interface Expense extends BaseModel {
  householdId: string
  date: string
  title: string
  amount: number
  categoryId?: string
  paidById?: string
  notes?: string
  attachments?: string[]
}

export interface Category extends BaseModel {
  householdId: string
  name: string
  color: string
  icon?: string
  budget?: number
  description?: string
  usageCount?: number
}

// Tipo para sumário de dados
export interface GroupSummary {
  count: number
  total: number
}

// Opções de exportação 
export interface ExportOptions {
  householdId: string
  startDate: Date
  endDate: Date
  format: 'csv' | 'pdf' | 'image'
  includeCategories: boolean
  includePayers: boolean
  includeNotes: boolean
}