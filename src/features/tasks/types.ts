import { BaseEntity } from '@/types/global'

export interface Task extends BaseEntity {
  title: string
  dueDate?: Date
  done: boolean
  notes?: string
  tags: string[]
  priority: 'low' | 'medium' | 'high'
  completedAt?: Date
}

export interface TaskFormData {
  title: string
  dueDate?: Date
  notes?: string
  tags: string[]
  priority: 'low' | 'medium' | 'high'
}

export interface TaskFilter {
  status?: 'all' | 'pending' | 'completed' | 'overdue'
  priority?: 'low' | 'medium' | 'high'
  tags?: string[]
  dueDateFrom?: Date
  dueDateTo?: Date
  searchText?: string
}

export interface TaskGroup {
  date: string
  label: string
  tasks: Task[]
  completedCount: number
  totalCount: number
}

export interface TaskStats {
  totalTasks: number
  completedTasks: number
  overdueTasks: number
  todayTasks: number
  completionRate: number
  averageCompletionTime: number
  byPriority: Record<string, number>
  byTag: Record<string, number>
}

export interface TaskNotification {
  id: string
  taskId: string
  type: 'due_today' | 'due_tomorrow' | 'overdue' | 'reminder'
  title: string
  message: string
  scheduledFor: Date
  delivered: boolean
  actions: Array<{
    action: 'mark_done' | 'snooze' | 'edit' | 'view'
    title: string
  }>
}

export type TaskSortBy = 
  | 'dueDate'
  | 'priority'
  | 'title'
  | 'createdAt'
  | 'completedAt'

export type TaskSortOrder = 'asc' | 'desc'

export interface TaskListOptions {
  sortBy: TaskSortBy
  sortOrder: TaskSortOrder
  groupBy: 'date' | 'priority' | 'tag' | 'none'
  filter: TaskFilter
  page: number
  pageSize: number
}

export interface TaskExportData extends Task {
  householdName: string
  userName: string
  daysToComplete?: number
}

export interface TaskImportData {
  title: string
  dueDate?: string
  notes?: string
  tags: string
  priority: string
  done?: boolean
}

