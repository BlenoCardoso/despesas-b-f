import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationService } from '../services/notificationService'
import { useCurrentHousehold, useCurrentUser } from '@/core/store'
import type { 
  Notification, 
  NotificationFormData, 
  NotificationPreferencesFormData,
  NotificationFilter,
  NotificationListOptions 
} from '../types'

// Query keys
export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (householdId: string, options?: NotificationListOptions) => 
    [...notificationKeys.lists(), householdId, options] as const,
  unread: (householdId: string, userId?: string) => 
    [...notificationKeys.all, 'unread', householdId, userId] as const,
  stats: (householdId: string, userId?: string) => 
    [...notificationKeys.all, 'stats', householdId, userId] as const,
  preferences: (userId: string, householdId: string) => 
    [...notificationKeys.all, 'preferences', userId, householdId] as const,
}

// Notification hooks
export function useNotifications(options?: NotificationListOptions) {
  const currentHousehold = useCurrentHousehold()
  
  return useQuery({
    queryKey: notificationKeys.list(currentHousehold?.id || '', options),
    queryFn: () => notificationService.getNotifications(currentHousehold?.id || '', options),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 1, // 1 minute
    refetchInterval: 1000 * 60 * 2, // Refetch every 2 minutes
  })
}

export function useUnreadNotifications() {
  const currentHousehold = useCurrentHousehold()
  const currentUser = useCurrentUser()
  
  return useQuery({
    queryKey: notificationKeys.unread(currentHousehold?.id || '', currentUser?.id),
    queryFn: () => notificationService.getUnreadNotifications(currentHousehold?.id || '', currentUser?.id),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute
  })
}

export function useNotificationStats() {
  const currentHousehold = useCurrentHousehold()
  const currentUser = useCurrentUser()
  
  return useQuery({
    queryKey: notificationKeys.stats(currentHousehold?.id || '', currentUser?.id),
    queryFn: () => notificationService.getNotificationStats(currentHousehold?.id || '', currentUser?.id),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

export function useNotificationPreferences() {
  const currentUser = useCurrentUser()
  const currentHousehold = useCurrentHousehold()
  
  return useQuery({
    queryKey: notificationKeys.preferences(currentUser?.id || '', currentHousehold?.id || ''),
    queryFn: () => notificationService.getPreferences(currentUser?.id || '', currentHousehold?.id || ''),
    enabled: !!currentUser?.id && !!currentHousehold?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Notification mutations
export function useCreateNotification() {
  const queryClient = useQueryClient()
  const currentHousehold = useCurrentHousehold()
  
  return useMutation({
    mutationFn: (data: NotificationFormData) => 
      notificationService.createNotification(data, currentHousehold?.id || ''),
    onSuccess: () => {
      // Invalidate and refetch notification queries
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}

export function useMarkAsRead() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      // Invalidate notification queries
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient()
  const currentHousehold = useCurrentHousehold()
  const currentUser = useCurrentUser()
  
  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(currentHousehold?.id || '', currentUser?.id),
    onSuccess: () => {
      // Invalidate notification queries
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}

export function useDismissNotification() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => notificationService.dismissNotification(id),
    onSuccess: () => {
      // Invalidate notification queries
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}

export function useDeleteNotification() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => notificationService.deleteNotification(id),
    onSuccess: () => {
      // Invalidate notification queries
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}

export function useExecuteNotificationAction() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ notificationId, actionId }: { notificationId: string; actionId: string }) =>
      notificationService.executeAction(notificationId, actionId),
    onSuccess: () => {
      // Invalidate notification queries
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient()
  const currentUser = useCurrentUser()
  const currentHousehold = useCurrentHousehold()
  
  return useMutation({
    mutationFn: (data: Partial<NotificationPreferencesFormData>) =>
      notificationService.updatePreferences(currentUser?.id || '', currentHousehold?.id || '', data),
    onSuccess: () => {
      // Invalidate preferences query
      queryClient.invalidateQueries({ 
        queryKey: notificationKeys.preferences(currentUser?.id || '', currentHousehold?.id || '') 
      })
    },
  })
}

// Permission hook
export function useNotificationPermission() {
  const { data: hasPermission, refetch } = useQuery({
    queryKey: ['notification-permission'],
    queryFn: () => {
      if (!('Notification' in window)) return false
      return Notification.permission === 'granted'
    },
    staleTime: Infinity, // Permission doesn't change often
  })

  const requestPermission = async () => {
    const granted = await notificationService.requestPermission()
    refetch() // Update the permission status
    return granted
  }

  return {
    hasPermission: hasPermission || false,
    requestPermission,
  }
}

// Utility hooks
export function useUnreadCount() {
  const { data: unreadNotifications = [] } = useUnreadNotifications()
  return unreadNotifications.length
}

export function useNotificationsByType(type: string) {
  const currentHousehold = useCurrentHousehold()
  
  return useQuery({
    queryKey: [...notificationKeys.lists(), currentHousehold?.id, { filter: { types: [type] } }],
    queryFn: () => notificationService.getNotifications(currentHousehold?.id || '', {
      filter: { types: [type as any] }
    }),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

export function useRecentNotifications(limit: number = 5) {
  const currentHousehold = useCurrentHousehold()
  
  return useQuery({
    queryKey: [...notificationKeys.lists(), currentHousehold?.id, { limit, sortBy: 'createdAt' }],
    queryFn: () => notificationService.getNotifications(currentHousehold?.id || '', {
      limit,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    }),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 1, // 1 minute
  })
}

// Real-time notification hook
export function useNotificationPolling() {
  const queryClient = useQueryClient()
  const currentHousehold = useCurrentHousehold()
  const { hasPermission } = useNotificationPermission()

  // Poll for pending notifications and show browser notifications
  useQuery({
    queryKey: ['pending-notifications', currentHousehold?.id],
    queryFn: async () => {
      const pendingNotifications = await notificationService.getPendingNotifications()
      // Show browser notifications for pending ones
      if (hasPermission) {
        for (const notification of pendingNotifications) {
          if (notification.householdId === currentHousehold?.id) {
            await notificationService.showBrowserNotification(notification)
            await notificationService.sendNotification(notification.id)
          }
        }
      }
      // Invalidate notification queries to update the UI
      if (pendingNotifications.length > 0) {
        queryClient.invalidateQueries({ queryKey: notificationKeys.all })
      }
      return pendingNotifications
    },
    enabled: !!currentHousehold?.id,
    refetchInterval: 1000 * 30, // Check every 30 seconds
    refetchIntervalInBackground: true,
  })
}

