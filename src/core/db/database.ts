import Dexie, { Table } from 'dexie'
import { Expense } from '@/features/expenses/types/expense'
import { HouseholdSplitSettings, SettleUpRecord } from '@/features/expenses/types/balance'
import { Task } from '@/features/tasks/types'
import { Document } from '@/features/docs/types'
import { Medication, MedicationIntake } from '@/features/medications/types'
import { CalendarEvent } from '@/features/calendar/types'
import type { Notification, NotificationPreferences } from '@/features/notifications/types'
import { 
  Category, 
  Budget, 
  AppSettings
} from '@/types/global'
import { Household, HouseholdMember, HouseholdInvite } from '@/features/households/types'
import { User } from '@/core/types/user'

export interface DatabaseSchema {
  // Core entities
  households: Table<Household>
  householdMembers: Table<HouseholdMember>
  householdInvites: Table<HouseholdInvite>
  users: Table<User>
  categories: Table<Category>
  budgets: Table<Budget>
  
  // Features
  expenses: Table<Expense>
  tasks: Table<Task>
  documents: Table<Document>
  medications: Table<Medication>
  medicationIntakes: Table<MedicationIntake>
  calendarEvents: Table<CalendarEvent>
  
  // Notifications
  notifications: Table<Notification>
  notificationPreferences: Table<NotificationPreferences>
  
  // System
  settings: Table<AppSettings>
  
  // Blobs for file storage
  blobs: Table<{ id: string; data: Blob; mimeType: string; size: number }>

  // Expense sharing
  householdSplitSettings: Table<HouseholdSplitSettings>
  settleUpRecords: Table<SettleUpRecord>
}

export class AppDatabase extends Dexie {
  // Core entities
  households!: Table<Household>
  householdMembers!: Table<HouseholdMember>
  householdInvites!: Table<HouseholdInvite>
  users!: Table<User>
  categories!: Table<Category>
  budgets!: Table<Budget>
  
  // Features
  expenses!: Table<Expense>
  tasks!: Table<Task>
  documents!: Table<Document>
  medications!: Table<Medication>
  calendarEvents!: Table<CalendarEvent>
  medicationIntakes!: Table<MedicationIntake>

  // Expense sharing
  householdSplitSettings!: Table<HouseholdSplitSettings>
  settleUpRecords!: Table<SettleUpRecord>
  
  // Notifications
  notifications!: Table<Notification>
  notificationPreferences!: Table<NotificationPreferences>
  
  // System
  settings!: Table<AppSettings>
  
  // Blobs
  blobs!: Table<{ id: string; data: Blob; mimeType: string; size: number }>

  constructor() {
    super('DespesasCompartilhadasDB')
    
    this.version(1).stores({
      // Core entities
      households: '++id, ownerId, name, createdAt, updatedAt',
      householdMembers: '++id, [householdId+userId], householdId, userId, role, joinedAt',
      householdInvites: '++id, householdId, code, createdBy, createdAt, expiresAt, maxUses, usedCount, isRevoked',
      users: '++id, name, email, createdAt',
      categories: '++id, name, householdId, createdAt',
      budgets: '++id, householdId, categoryId, month, amount, createdAt',
      
      // Features
      expenses: '++id, householdId, userId, title, amount, categoryId, paymentMethod, date, createdAt, updatedAt, deletedAt',
      tasks: '++id, householdId, userId, title, done, dueDate, priority, createdAt, updatedAt, deletedAt',
      documents: '++id, householdId, userId, title, fileName, mimeType, category, expiryDate, createdAt, updatedAt, deletedAt',
      medications: '++id, householdId, userId, name, form, createdAt, updatedAt, deletedAt',
      medicationIntakes: '++id, medicationId, dateTimePlanned, dateTimeTaken, status',
      
      // Notifications
      notifications: '++id, householdId, userId, type, status, scheduledFor, createdAt',
      notificationPreferences: '++id, userId, householdId, createdAt',
      
      // System
      settings: '++id, userId',
      
      // Blobs
      blobs: '++id, mimeType, size'
    })

    // Version 2: Add indexes for better performance
    this.version(2).stores({
      expenses: '++id, householdId, userId, title, amount, categoryId, paymentMethod, date, createdAt, updatedAt, deletedAt, [householdId+date], [categoryId+date]',
      tasks: '++id, householdId, userId, title, done, dueDate, priority, createdAt, updatedAt, deletedAt, [householdId+done], [householdId+dueDate]',
      documents: '++id, householdId, userId, title, fileName, mimeType, category, expiryDate, createdAt, updatedAt, deletedAt, [householdId+category], [householdId+expiryDate]',
      medications: '++id, householdId, userId, name, form, createdAt, updatedAt, deletedAt, [householdId+name]',
      medicationIntakes: '++id, medicationId, dateTimePlanned, dateTimeTaken, status, [medicationId+dateTimePlanned], [medicationId+status]',
      notifications: '++id, householdId, userId, type, status, scheduledFor, createdAt, [householdId+status], [type+scheduledFor], [status+scheduledFor]',
      notificationPreferences: '++id, userId, householdId, createdAt, [userId+householdId]'
    }).upgrade(() => {
      // Migration logic if needed
      console.log('Upgrading database to version 2...')
    })

    // Version 3: Add support for soft deletes and sync metadata
    this.version(3).stores({
      expenses: '++id, householdId, userId, title, amount, categoryId, paymentMethod, date, createdAt, updatedAt, deletedAt, syncVersion, [householdId+date], [categoryId+date], [deletedAt+updatedAt]',
      tasks: '++id, householdId, userId, title, done, dueDate, priority, createdAt, updatedAt, deletedAt, syncVersion, [householdId+done], [householdId+dueDate], [deletedAt+updatedAt]',
      documents: '++id, householdId, userId, title, fileName, mimeType, category, expiryDate, createdAt, updatedAt, deletedAt, syncVersion, [householdId+category], [householdId+expiryDate], [deletedAt+updatedAt]',
      medications: '++id, householdId, userId, name, form, createdAt, updatedAt, deletedAt, syncVersion, [householdId+name], [deletedAt+updatedAt]',
    }).upgrade(tx => {
      console.log('Upgrading database to version 3...')
      // Add syncVersion field to existing records
      return Promise.all([
        tx.table('expenses').toCollection().modify(item => { item.syncVersion = 1 }),
        tx.table('tasks').toCollection().modify(item => { item.syncVersion = 1 }),
        tx.table('documents').toCollection().modify(item => { item.syncVersion = 1 }),
        tx.table('medications').toCollection().modify(item => { item.syncVersion = 1 })
      ])
    })

    // Version 4: Add notification system
    this.version(4).stores({
      notifications: '++id, householdId, userId, type, status, priority, scheduledFor, sentAt, readAt, createdAt, expiresAt, [householdId+status], [type+scheduledFor], [status+scheduledFor], [priority+status]',
      notificationPreferences: '++id, userId, householdId, enableInApp, enablePush, createdAt, updatedAt, [userId+householdId]'
    }).upgrade(() => {
      console.log('Upgrading database to version 4 - Adding notification system...')
    })

    // Version 5: Add calendar events
    this.version(5).stores({
      calendarEvents: '++id, householdId, userId, title, startDate, endDate, category, isImportant, isAllDay, createdAt, updatedAt, deletedAt, syncVersion, [householdId+startDate], [householdId+endDate], [category+startDate], [isImportant+startDate], [deletedAt+updatedAt]'
    }).upgrade(() => {
      console.log('Upgrading database to version 5 - Adding calendar events...')
    })

    // Version 6: Add expense sharing
    this.version(6).stores({
      // Nova tabela para configurações de divisão de despesas
      householdSplitSettings: '++id, householdId, unifyExpenses, updatedAt',
      // Nova tabela para registrar acertos de contas
      settleUpRecords: '++id, householdId, fromMemberId, toMemberId, amount, month, year, settledAt, [householdId+month+year]',
      // Atualiza expenses para suportar compartilhamento
      expenses: '++id, householdId, paidById, title, amount, categoryId, date, isShared, settledRecordId, settledAt, createdAt, updatedAt, deletedAt, syncVersion, [householdId+date], [categoryId+date], [deletedAt+updatedAt], [settledRecordId+settledAt]'
    }).upgrade(() => {
      console.log('Upgrading database to version 6 - Adding expense sharing...')
    })
  }

  // Helper methods for common operations
  // Métodos relacionados a households
  async getHouseholdWithMembers(id: string) {
    const household = await this.households.get(id)
    if (!household) return null

    const members = await this.householdMembers
      .where('householdId')
      .equals(id)
      .toArray()

    const memberDetails = await Promise.all(
      members.map(async member => {
        const user = await this.users.get(member.userId)
        return { ...member, user }
      })
    )

    return {
      ...household,
      members: memberDetails
    }
  }

  async getCurrentHousehold(): Promise<Household | undefined> {
    return await this.households.orderBy('createdAt').last()
  }

  // Verificar se um usuário é membro de uma household
  async isHouseholdMember(householdId: string, userId: string): Promise<boolean> {
    const member = await this.householdMembers
      .where(['householdId', 'userId'])
      .equals([householdId, userId])
      .first()
    
    return !!member
  }

  // Verificar role do membro
  async getMemberRole(householdId: string, userId: string): Promise<string | null> {
    const member = await this.householdMembers
      .where(['householdId', 'userId'])
      .equals([householdId, userId])
      .first()
    
    return member?.role || null
  }

  async getCurrentUser(): Promise<User | undefined> {
    return await this.users.orderBy('createdAt').last()
  }

  // Métodos para cálculos com expenses
  async sumHouseholdExpenses(options: {
    householdId: string 
    startDate?: Date
    endDate?: Date
    categoryId?: string
  }): Promise<number> {
    let query = this.expenses
      .where('householdId')
      .equals(options.householdId)

    if (options.startDate) {
      query = query.and(expense => expense.date >= options.startDate!)
    }

    if (options.endDate) {
      query = query.and(expense => expense.date <= options.endDate!)
    }

    if (options.categoryId) {
      query = query.and(expense => expense.categoryId === options.categoryId)
    }

    const expenses = await query.toArray()
    return expenses.reduce((sum, expense) => sum + expense.amount, 0)
  }

  async getActiveExpenses(householdId: string): Promise<Expense[]> {
    return await this.expenses
      .where({ householdId })
      .and(expense => !expense.deletedAt)
      .reverse()
      .sortBy('date')
  }

  async getActiveTasks(householdId: string): Promise<Task[]> {
    return await this.tasks
      .where({ householdId })
      .and(task => !task.deletedAt)
      .reverse()
      .sortBy('dueDate')
  }

  async getActiveDocuments(householdId: string): Promise<Document[]> {
    return await this.documents
      .where({ householdId })
      .and(doc => !doc.deletedAt)
      .reverse()
      .sortBy('createdAt')
  }

  async getActiveMedications(householdId: string): Promise<Medication[]> {
    return await this.medications
      .where({ householdId })
      .and(med => !med.deletedAt)
      .reverse()
      .sortBy('name')
  }

  // Soft delete methods
  async softDeleteExpense(id: string): Promise<void> {
    await this.expenses.update(id, { 
      deletedAt: new Date(), 
      updatedAt: new Date()
    })
  }

  async softDeleteTask(id: string): Promise<void> {
    await this.tasks.update(id, { 
      deletedAt: new Date(), 
      updatedAt: new Date()
    })
  }

  async softDeleteDocument(id: string): Promise<void> {
    await this.documents.update(id, { 
      deletedAt: new Date(), 
      updatedAt: new Date()
    })
  }

  async softDeleteMedication(id: string): Promise<void> {
    await this.medications.update(id, { 
      deletedAt: new Date(), 
      updatedAt: new Date()
    })
  }

  async getActiveCalendarEvents(householdId: string): Promise<CalendarEvent[]> {
    return await this.calendarEvents
      .where({ householdId })
      .and(event => !event.deletedAt)
      .reverse()
      .sortBy('startDate')
  }

  async softDeleteCalendarEvent(id: string): Promise<void> {
    await this.calendarEvents.update(id, { 
      deletedAt: new Date(), 
      updatedAt: new Date()
    })
  }

  // Notification methods
  async getUnreadNotifications(householdId: string, userId?: string): Promise<Notification[]> {
    return await this.notifications
      .where({ householdId })
      .and(notification => {
        if (notification.status === 'read' || notification.status === 'dismissed') return false
        if (userId && notification.userId && notification.userId !== userId) return false
        return true
      })
      .reverse()
      .sortBy('scheduledFor')
  }

  async getPendingNotifications(): Promise<Notification[]> {
    const now = new Date()
    return await this.notifications
      .where('status')
      .equals('pending')
      .and(notification => notification.scheduledFor <= now)
      .toArray()
  }

  // Blob storage methods
  async storeBlob(id: string, blob: Blob, mimeType: string): Promise<void> {
    await this.blobs.put({
      id,
      data: blob,
      mimeType,
      size: blob.size
    })
  }

  async getBlob(id: string): Promise<Blob | undefined> {
    const record = await this.blobs.get(id)
    return record?.data
  }

  async deleteBlob(id: string): Promise<void> {
    await this.blobs.delete(id)
  }

  // Cleanup methods
  async cleanupDeletedRecords(olderThanDays: number = 30): Promise<void> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    await Promise.all([
      this.expenses.where('deletedAt').below(cutoffDate).delete(),
      this.tasks.where('deletedAt').below(cutoffDate).delete(),
      this.documents.where('deletedAt').below(cutoffDate).delete(),
      this.medications.where('deletedAt').below(cutoffDate).delete()
    ])
  }

  async cleanupExpiredNotifications(): Promise<void> {
    const now = new Date()
    await this.notifications
      .where('expiresAt')
      .below(now)
      .delete()
  }

  async getDatabaseSize(): Promise<{ tables: Record<string, number>; total: number }> {
    const tables: Record<string, number> = {}
    let total = 0

    for (const tableName of this.tables.map(t => t.name)) {
      const count = await this.table(tableName).count()
      tables[tableName] = count
      total += count
    }

    return { tables, total }
  }
}

// Singleton instance
export const db = new AppDatabase()

