import { db } from '@/core/db/database'
import { Task, TaskFormData, TaskFilter, TaskListOptions } from '../types'
import { generateId } from '@/core/utils/id'
import { addDays, startOfDay, endOfDay, parseISO } from 'date-fns'

export class TaskService {
  /**
   * Create a new task
   */
  async createTask(data: TaskFormData, householdId: string, userId: string): Promise<Task> {
    const task: Task = {
      id: generateId(),
      householdId,
      userId,
      title: data.title,
      description: data.description,
      status: 'pendente',
      priority: data.priority || 'medium',
      dueDate: data.dueDate,
      assignedTo: data.assignedTo,
      category: data.category,
      tags: data.tags || [],
      attachments: [],
      recurrence: data.recurrence,
      done: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Handle file attachments
    if (data.attachments && data.attachments.length > 0) {
      for (const file of data.attachments) {
        const attachmentId = generateId()
        await db.storeBlob(attachmentId, file, file.type)
        
        task.attachments.push({
          id: attachmentId,
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
          blobRef: attachmentId,
        })
      }
    }

    await db.tasks.add(task)
    return task
  }

  /**
   * Update an existing task
   */
  async updateTask(id: string, data: Partial<TaskFormData>): Promise<void> {
    const updates: Partial<Task> = {
      ...data,
      updatedAt: new Date(),
      syncVersion: Date.now(),
    }

    // Handle new attachments
    if (data.attachments && data.attachments.length > 0) {
      const currentTask = await db.tasks.get(id)
      if (currentTask) {
        const newAttachments = [...currentTask.attachments]
        
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

    await db.tasks.update(id, updates)
  }

  /**
   * Delete a task (soft delete)
   */
  async deleteTask(id: string): Promise<void> {
    await db.softDeleteTask(id)
  }

  /**
   * Get task by ID
   */
  async getTaskById(id: string): Promise<Task | undefined> {
    return await db.tasks.get(id)
  }

  /**
   * Get all tasks for a household
   */
  async getTasks(householdId: string, options?: TaskListOptions): Promise<Task[]> {
    let query = db.tasks.where({ householdId }).and(task => !task.deletedAt)

    // Apply filters
    if (options?.filter) {
      query = this.applyFilters(query, options.filter)
    }

    let tasks = await query.toArray()

    // Apply sorting
    if (options?.sortBy) {
      tasks = this.sortTasks(tasks, options.sortBy, options.sortOrder || 'desc')
    }

    // Apply pagination
    if (options?.page && options?.pageSize) {
      const start = (options.page - 1) * options.pageSize
      const end = start + options.pageSize
      tasks = tasks.slice(start, end)
    }

    return tasks
  }

  /**
   * Get tasks by status
   */
  async getTasksByStatus(householdId: string, status: Task['status']): Promise<Task[]> {
    return await db.tasks
      .where({ householdId, status })
      .and(task => !task.deletedAt)
      .reverse()
      .sortBy('dueDate')
  }

  /**
   * Get tasks assigned to a user
   */
  async getTasksAssignedTo(householdId: string, userId: string): Promise<Task[]> {
    return await db.tasks
      .where({ householdId })
      .and(task => !task.deletedAt && task.assignedTo === userId)
      .reverse()
      .sortBy('dueDate')
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(householdId: string): Promise<Task[]> {
    const now = new Date()
    
    return await db.tasks
      .where({ householdId })
      .and(task => {
        if (task.deletedAt || task.status === 'concluida') return false
        if (!task.dueDate) return false
        
        const dueDate = typeof task.dueDate === 'string' ? parseISO(task.dueDate) : task.dueDate
        return dueDate < now
      })
      .reverse()
      .sortBy('dueDate')
  }

  /**
   * Get tasks due today
   */
  async getTasksDueToday(householdId: string): Promise<Task[]> {
    const today = new Date()
    const startOfToday = startOfDay(today)
    const endOfToday = endOfDay(today)
    
    return await db.tasks
      .where({ householdId })
      .and(task => {
        if (task.deletedAt || task.status === 'concluida') return false
        if (!task.dueDate) return false
        
        const dueDate = typeof task.dueDate === 'string' ? parseISO(task.dueDate) : task.dueDate
        return dueDate >= startOfToday && dueDate <= endOfToday
      })
      .reverse()
      .sortBy('dueDate')
  }

  /**
   * Get tasks due this week
   */
  async getTasksDueThisWeek(householdId: string): Promise<Task[]> {
    const today = new Date()
    const endOfWeek = addDays(today, 7)
    
    return await db.tasks
      .where({ householdId })
      .and(task => {
        if (task.deletedAt || task.status === 'concluida') return false
        if (!task.dueDate) return false
        
        const dueDate = typeof task.dueDate === 'string' ? parseISO(task.dueDate) : task.dueDate
        return dueDate >= today && dueDate <= endOfWeek
      })
      .reverse()
      .sortBy('dueDate')
  }

  /**
   * Mark task as completed
   */
  async completeTask(id: string): Promise<void> {
    await db.tasks.update(id, {
      status: 'concluida',
      completedAt: new Date(),
      updatedAt: new Date(),
      syncVersion: Date.now(),
    })
  }

  /**
   * Mark task as in progress
   */
  async startTask(id: string): Promise<void> {
    await db.tasks.update(id, {
      status: 'em_progresso',
      updatedAt: new Date(),
      syncVersion: Date.now(),
    })
  }

  /**
   * Search tasks by text
   */
  async searchTasks(householdId: string, searchText: string): Promise<Task[]> {
    const lowerSearchText = searchText.toLowerCase()
    
    return await db.tasks
      .where({ householdId })
      .and(task => {
        if (task.deletedAt) return false
        return (
          task.title.toLowerCase().includes(lowerSearchText) ||
          task.description?.toLowerCase().includes(lowerSearchText) ||
          task.tags.some(tag => tag.toLowerCase().includes(lowerSearchText)) ||
          false
        )
      })
      .reverse()
      .sortBy('dueDate')
  }

  /**
   * Get tasks by category
   */
  async getTasksByCategory(householdId: string, category: string): Promise<Task[]> {
    return await db.tasks
      .where({ householdId, category })
      .and(task => !task.deletedAt)
      .reverse()
      .sortBy('dueDate')
  }

  /**
   * Get tasks by priority
   */
  async getTasksByPriority(householdId: string, priority: Task['priority']): Promise<Task[]> {
    return await db.tasks
      .where({ householdId, priority })
      .and(task => !task.deletedAt)
      .reverse()
      .sortBy('dueDate')
  }

  /**
   * Get task statistics
   */
  async getTaskStats(householdId: string): Promise<{
    total: number
    pending: number
    inProgress: number
    completed: number
    overdue: number
    dueToday: number
    dueThisWeek: number
  }> {
    const allTasks = await this.getTasks(householdId)
    const overdueTasks = await this.getOverdueTasks(householdId)
    const dueTodayTasks = await this.getTasksDueToday(householdId)
    const dueThisWeekTasks = await this.getTasksDueThisWeek(householdId)

    return {
      total: allTasks.length,
      pending: allTasks.filter(task => task.status === 'pendente').length,
      inProgress: allTasks.filter(task => task.status === 'em_progresso').length,
      completed: allTasks.filter(task => task.status === 'concluida').length,
      overdue: overdueTasks.length,
      dueToday: dueTodayTasks.length,
      dueThisWeek: dueThisWeekTasks.length,
    }
  }

  /**
   * Duplicate a task
   */
  async duplicateTask(id: string): Promise<Task> {
    const originalTask = await db.tasks.get(id)
    if (!originalTask) {
      throw new Error('Task not found')
    }

    const duplicatedTask: Task = {
      ...originalTask,
      id: generateId(),
      status: 'pendente',
      completedAt: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await db.tasks.add(duplicatedTask)
    return duplicatedTask
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
  async deleteAttachment(taskId: string, attachmentId: string): Promise<void> {
    const task = await db.tasks.get(taskId)
    if (!task) return

    const attachmentIndex = task.attachments.findIndex(att => att.id === attachmentId)
    if (attachmentIndex === -1) return

    const attachment = task.attachments[attachmentIndex]
    
    // Remove from blob storage
    await db.deleteBlob(attachment.blobRef)
    
    // Remove from task
    task.attachments.splice(attachmentIndex, 1)
    await db.tasks.update(taskId, {
      attachments: task.attachments,
      updatedAt: new Date(),
      syncVersion: Date.now(),
    })
  }

  private applyFilters(query: any, filter: TaskFilter): any {
    return query.and((task: Task) => {
      // Status filter
      if (filter.status && filter.status.length > 0) {
        if (!filter.status.includes(task.status)) return false
      }

      // Priority filter
      if (filter.priority && filter.priority.length > 0) {
        if (!filter.priority.includes(task.priority)) return false
      }

      // Category filter
      if (filter.category && filter.category.length > 0) {
        if (!filter.category.includes(task.category)) return false
      }

      // Assigned to filter
      if (filter.assignedTo && filter.assignedTo.length > 0) {
        if (!task.assignedTo || !filter.assignedTo.includes(task.assignedTo)) return false
      }

      // Due date filter
      if (filter.dueDateStart || filter.dueDateEnd) {
        if (!task.dueDate) return false
        
        const dueDate = typeof task.dueDate === 'string' ? parseISO(task.dueDate) : task.dueDate
        if (filter.dueDateStart && dueDate < filter.dueDateStart) return false
        if (filter.dueDateEnd && dueDate > filter.dueDateEnd) return false
      }

      // Tags filter
      if (filter.tags && filter.tags.length > 0) {
        const hasMatchingTag = filter.tags.some(tag => task.tags.includes(tag))
        if (!hasMatchingTag) return false
      }

      // Text search filter
      if (filter.searchText) {
        const searchText = filter.searchText.toLowerCase()
        const matchesTitle = task.title.toLowerCase().includes(searchText)
        const matchesDescription = task.description?.toLowerCase().includes(searchText) || false
        const matchesTags = task.tags.some(tag => tag.toLowerCase().includes(searchText))
        if (!matchesTitle && !matchesDescription && !matchesTags) return false
      }

      // Overdue filter
      if (filter.isOverdue !== undefined) {
        const now = new Date()
        const isOverdue = task.dueDate && task.status !== 'concluida' && 
          (typeof task.dueDate === 'string' ? parseISO(task.dueDate) : task.dueDate) < now
        if (filter.isOverdue !== !!isOverdue) return false
      }

      return true
    })
  }

  private sortTasks(tasks: Task[], sortBy: string, sortOrder: 'asc' | 'desc'): Task[] {
    return tasks.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'dueDate':
          const dueDateA = a.dueDate ? (typeof a.dueDate === 'string' ? parseISO(a.dueDate) : a.dueDate) : new Date(0)
          const dueDateB = b.dueDate ? (typeof b.dueDate === 'string' ? parseISO(b.dueDate) : b.dueDate) : new Date(0)
          comparison = dueDateA.getTime() - dueDateB.getTime()
          break
        case 'priority':
          const priorityOrder = { 'alta': 3, 'media': 2, 'baixa': 1 }
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority]
          break
        case 'status':
          const statusOrder = { 'pendente': 1, 'em_progresso': 2, 'concluida': 3 }
          comparison = statusOrder[a.status] - statusOrder[b.status]
          break
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'category':
          comparison = a.category.localeCompare(b.category)
          break
        default:
          comparison = a.createdAt.getTime() - b.createdAt.getTime()
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })
  }
}

// Singleton instance
export const taskService = new TaskService()

