import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { calendarService } from '../services/calendarService'
import { useCurrentHousehold, useCurrentUser } from '@/core/store'
import { CalendarEvent, CalendarEventFormData, CalendarEventFilter, CalendarEventListOptions } from '../types'

// Query keys
export const calendarKeys = {
  all: ['calendar'] as const,
  events: () => [...calendarKeys.all, 'events'] as const,
  list: (householdId: string, options?: CalendarEventListOptions) => 
    [...calendarKeys.events(), householdId, options] as const,
  details: () => [...calendarKeys.all, 'detail'] as const,
  detail: (id: string) => [...calendarKeys.details(), id] as const,
  forDate: (householdId: string, date: Date) => 
    [...calendarKeys.all, 'forDate', householdId, date.toISOString()] as const,
  forDateRange: (householdId: string, startDate: Date, endDate: Date) => 
    [...calendarKeys.all, 'forDateRange', householdId, startDate.toISOString(), endDate.toISOString()] as const,
  forMonth: (householdId: string, month: Date) => 
    [...calendarKeys.all, 'forMonth', householdId, month.toISOString()] as const,
  upcoming: (householdId: string, days: number) => 
    [...calendarKeys.all, 'upcoming', householdId, days] as const,
  byCategory: (householdId: string, category: string) => 
    [...calendarKeys.all, 'byCategory', householdId, category] as const,
  important: (householdId: string) => 
    [...calendarKeys.all, 'important', householdId] as const,
  reminders: (householdId: string) => 
    [...calendarKeys.all, 'reminders', householdId] as const,
  stats: (householdId: string) => 
    [...calendarKeys.all, 'stats', householdId] as const,
  search: (householdId: string, searchText: string) => 
    [...calendarKeys.all, 'search', householdId, searchText] as const,
  conflicts: (householdId: string, startDate: Date, endDate: Date, excludeId?: string) => 
    [...calendarKeys.all, 'conflicts', householdId, startDate.toISOString(), endDate.toISOString(), excludeId] as const,
}

// Calendar events hooks
export function useCalendarEvents(options?: CalendarEventListOptions) {
  const currentHousehold = useCurrentHousehold()
  
  return useQuery({
    queryKey: calendarKeys.list(currentHousehold?.id || '', options),
    queryFn: () => calendarService.getEvents(currentHousehold?.id || '', options),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useCalendarEvent(id: string) {
  return useQuery({
    queryKey: calendarKeys.detail(id),
    queryFn: () => calendarService.getEventById(id),
    enabled: !!id,
  })
}

export function useEventsForDate(date: Date) {
  const currentHousehold = useCurrentHousehold()
  
  return useQuery({
    queryKey: calendarKeys.forDate(currentHousehold?.id || '', date),
    queryFn: () => calendarService.getEventsForDate(currentHousehold?.id || '', date),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

export function useEventsForDateRange(startDate: Date, endDate: Date) {
  const currentHousehold = useCurrentHousehold()
  
  return useQuery({
    queryKey: calendarKeys.forDateRange(currentHousehold?.id || '', startDate, endDate),
    queryFn: () => calendarService.getEventsForDateRange(currentHousehold?.id || '', startDate, endDate),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

export function useEventsForMonth(month: Date) {
  const currentHousehold = useCurrentHousehold()
  
  return useQuery({
    queryKey: calendarKeys.forMonth(currentHousehold?.id || '', month),
    queryFn: () => calendarService.getEventsForMonth(currentHousehold?.id || '', month),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useUpcomingEvents(days: number = 7) {
  const currentHousehold = useCurrentHousehold()
  
  return useQuery({
    queryKey: calendarKeys.upcoming(currentHousehold?.id || '', days),
    queryFn: () => calendarService.getUpcomingEvents(currentHousehold?.id || '', days),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

export function useEventsByCategory(category: string) {
  const currentHousehold = useCurrentHousehold()
  
  return useQuery({
    queryKey: calendarKeys.byCategory(currentHousehold?.id || '', category),
    queryFn: () => calendarService.getEventsByCategory(currentHousehold?.id || '', category),
    enabled: !!currentHousehold?.id && !!category,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useImportantEvents() {
  const currentHousehold = useCurrentHousehold()
  
  return useQuery({
    queryKey: calendarKeys.important(currentHousehold?.id || ''),
    queryFn: () => calendarService.getImportantEvents(currentHousehold?.id || ''),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useEventsWithRemindersDue() {
  const currentHousehold = useCurrentHousehold()
  
  return useQuery({
    queryKey: calendarKeys.reminders(currentHousehold?.id || ''),
    queryFn: () => calendarService.getEventsWithRemindersDue(currentHousehold?.id || ''),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 1, // 1 minute
  })
}

export function useCalendarStats() {
  const currentHousehold = useCurrentHousehold()
  
  return useQuery({
    queryKey: calendarKeys.stats(currentHousehold?.id || ''),
    queryFn: () => calendarService.getCalendarStats(currentHousehold?.id || ''),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useSearchEvents(searchText: string) {
  const currentHousehold = useCurrentHousehold()
  
  return useQuery({
    queryKey: calendarKeys.search(currentHousehold?.id || '', searchText),
    queryFn: () => calendarService.searchEvents(currentHousehold?.id || '', searchText),
    enabled: !!currentHousehold?.id && searchText.length >= 2,
    staleTime: 1000 * 30, // 30 seconds
  })
}

export function useEventConflicts(startDate: Date, endDate: Date, excludeEventId?: string) {
  const currentHousehold = useCurrentHousehold()
  
  return useQuery({
    queryKey: calendarKeys.conflicts(currentHousehold?.id || '', startDate, endDate, excludeEventId),
    queryFn: () => calendarService.checkEventConflicts(currentHousehold?.id || '', startDate, endDate, excludeEventId),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 30, // 30 seconds
  })
}

// Calendar event mutations
export function useCreateEvent() {
  const queryClient = useQueryClient()
  const currentHousehold = useCurrentHousehold()
  const currentUser = useCurrentUser()
  
  return useMutation({
    mutationFn: (data: CalendarEventFormData) => 
      calendarService.createEvent(data, currentHousehold?.id || '', currentUser?.id || ''),
    onSuccess: () => {
      // Invalidate and refetch calendar queries
      queryClient.invalidateQueries({ queryKey: calendarKeys.all })
    },
  })
}

export function useUpdateEvent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CalendarEventFormData> }) =>
      calendarService.updateEvent(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate specific event and lists
      queryClient.invalidateQueries({ queryKey: calendarKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: calendarKeys.events() })
    },
  })
}

export function useDeleteEvent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => calendarService.deleteEvent(id),
    onSuccess: () => {
      // Invalidate all calendar queries
      queryClient.invalidateQueries({ queryKey: calendarKeys.all })
    },
  })
}

export function useDuplicateEvent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => calendarService.duplicateEvent(id),
    onSuccess: () => {
      // Invalidate calendar event lists
      queryClient.invalidateQueries({ queryKey: calendarKeys.events() })
    },
  })
}

// Utility hooks
export function useEventCategories() {
  return {
    data: calendarService.getDefaultCategories(),
    isLoading: false,
    error: null,
  }
}

