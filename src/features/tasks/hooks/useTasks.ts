import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { taskService } from '../services/taskService'
import { useCurrentHousehold, useCurrentUser } from '@/core/store'
import { Task, TaskFormData, TaskFilter, TaskListOptions } from '../types'

// Query keys
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (householdId: string, options?: TaskListOptions) => 
    [...taskKeys.lists(), householdId, options] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
  byStatus: (householdId: string, status: Task['status']) => 
    [...taskKeys.all, 'byStatus', householdId, status] as const,
  byAssignee: (householdId: string, userId: string) => 
    [...taskKeys.all, 'byAssignee', householdId, userId] as const,
  overdue: (householdId: string) => 
    [...taskKeys.all, 'overdue', householdId] as const,
  dueToday: (householdId: string) => 
    [...taskKeys.all, 'dueToday', householdId] as const,
  dueThisWeek: (householdId: string) => 
    [...taskKeys.all, 'dueThisWeek', householdId] as const,
  stats: (householdId: string) => 
    [...taskKeys.all, 'stats', householdId] as const,
  search: (householdId: string, searchText: string) => 
    [...taskKeys.all, 'search', householdId, searchText] as const,
}

// Tasks hooks
export function useTasks(options?: TaskListOptions) {
  const currentHousehold = useCurrentHousehold()
  
  return useQuery({
    queryKey: taskKeys.list(currentHousehold?.id || '', options),
    queryFn: () => taskService.getTasks(currentHousehold?.id || '', options),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useTask(id: string) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => taskService.getTaskById(id),
    enabled: !!id,
  })
}

export function useTasksByStatus(status: Task['status']) {
  const currentHousehold = useCurrentHousehold()
  
  return useQuery({
    queryKey: taskKeys.byStatus(currentHousehold?.id || '', status),
    queryFn: () => taskService.getTasksByStatus(currentHousehold?.id || '', status),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

export function useTasksAssignedTo(userId?: string) {
  const currentHousehold = useCurrentHousehold()
  const currentUser = useCurrentUser()
  const assigneeId = userId || currentUser?.id || ''
  
  return useQuery({
    queryKey: taskKeys.byAssignee(currentHousehold?.id || '', assigneeId),
    queryFn: () => taskService.getTasksAssignedTo(currentHousehold?.id || '', assigneeId),
    enabled: !!currentHousehold?.id && !!assigneeId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

export function useOverdueTasks() {
  const currentHousehold = useCurrentHousehold()
  
  return useQuery({
    queryKey: taskKeys.overdue(currentHousehold?.id || ''),
    queryFn: () => taskService.getOverdueTasks(currentHousehold?.id || ''),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 1, // 1 minute
  })
}

export function useTasksDueToday() {
  const currentHousehold = useCurrentHousehold()
  
  return useQuery({
    queryKey: taskKeys.dueToday(currentHousehold?.id || ''),
    queryFn: () => taskService.getTasksDueToday(currentHousehold?.id || ''),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 1, // 1 minute
  })
}

export function useTasksDueThisWeek() {
  const currentHousehold = useCurrentHousehold()
  
  return useQuery({
    queryKey: taskKeys.dueThisWeek(currentHousehold?.id || ''),
    queryFn: () => taskService.getTasksDueThisWeek(currentHousehold?.id || ''),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useTaskStats() {
  const currentHousehold = useCurrentHousehold()
  
  return useQuery({
    queryKey: taskKeys.stats(currentHousehold?.id || ''),
    queryFn: () => taskService.getTaskStats(currentHousehold?.id || ''),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useSearchTasks(searchText: string) {
  const currentHousehold = useCurrentHousehold()
  
  return useQuery({
    queryKey: taskKeys.search(currentHousehold?.id || '', searchText),
    queryFn: () => taskService.searchTasks(currentHousehold?.id || '', searchText),
    enabled: !!currentHousehold?.id && searchText.length >= 2,
    staleTime: 1000 * 30, // 30 seconds
  })
}

// Task mutations
export function useCreateTask() {
  const queryClient = useQueryClient()
  const currentHousehold = useCurrentHousehold()
  const currentUser = useCurrentUser()
  
  return useMutation({
    mutationFn: (data: TaskFormData) => 
      taskService.createTask(data, currentHousehold?.id || '', currentUser?.id || ''),
    onSuccess: () => {
      // Invalidate and refetch all task queries including stats
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TaskFormData> }) =>
      taskService.updateTask(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate specific task and lists
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
      // Invalidate stats to update counters
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => taskService.deleteTask(id),
    onSuccess: () => {
      // Invalidate all task queries including stats
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

export function useCompleteTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => taskService.completeTask(id),
    onSuccess: (_, id) => {
      // Invalidate specific task and lists
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
      // Invalidate stats to update counters
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

export function useStartTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => taskService.startTask(id),
    onSuccess: (_, id) => {
      // Invalidate specific task and lists
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
      // Invalidate stats to update counters
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

export function useDuplicateTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => taskService.duplicateTask(id),
    onSuccess: () => {
      // Invalidate task lists
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
    },
  })
}

// Utility hooks
export function useAttachmentBlob(blobRef: string) {
  return useQuery({
    queryKey: ['task-attachment', blobRef],
    queryFn: () => taskService.getAttachmentBlob(blobRef),
    enabled: !!blobRef,
    staleTime: Infinity, // Blobs don't change
  })
}

export function useDeleteTaskAttachment() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ taskId, attachmentId }: { taskId: string; attachmentId: string }) =>
      taskService.deleteAttachment(taskId, attachmentId),
    onSuccess: (_, { taskId }) => {
      // Invalidate specific task
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) })
    },
  })
}

