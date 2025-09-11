import { db } from '@/core/db/database'
import { CalendarEvent, CalendarEventFormData, CalendarEventFilter, CalendarEventListOptions } from '../types'
import { generateId } from '@/core/utils/id'
import { startOfDay, endOfDay, startOfMonth, endOfMonth, addDays, parseISO } from 'date-fns'

export class CalendarService {
  /**
   * Create a new calendar event
   */
  async createEvent(data: CalendarEventFormData, householdId: string, userId: string): Promise<CalendarEvent> {
    const event: CalendarEvent = {
      id: generateId(),
      householdId,
      userId,
      title: data.title,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      isAllDay: data.isAllDay || false,
      location: data.location,
      category: data.category,
      color: data.color || '#3b82f6',
      attendees: data.attendees || [],
      reminders: data.reminders || [],
      recurrence: data.recurrence,
      isImportant: data.isImportant || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await db.calendarEvents.add(event)
    return event
  }

  /**
   * Update an existing calendar event
   */
  async updateEvent(id: string, data: Partial<CalendarEventFormData>): Promise<void> {
    const updates: Partial<CalendarEvent> = {
      ...data,
      updatedAt: new Date(),
      syncVersion: Date.now(),
    }

    await db.calendarEvents.update(id, updates)
  }

  /**
   * Delete a calendar event (soft delete)
   */
  async deleteEvent(id: string): Promise<void> {
    await db.softDeleteCalendarEvent(id)
  }

  /**
   * Get calendar event by ID
   */
  async getEventById(id: string): Promise<CalendarEvent | undefined> {
    return await db.calendarEvents.get(id)
  }

  /**
   * Get all calendar events for a household
   */
  async getEvents(householdId: string, options?: CalendarEventListOptions): Promise<CalendarEvent[]> {
    let query = db.calendarEvents.where({ householdId }).and(event => !event.deletedAt)

    // Apply filters
    if (options?.filter) {
      query = this.applyFilters(query, options.filter)
    }

    let events = await query.toArray()

    // Apply sorting
    if (options?.sortBy) {
      events = this.sortEvents(events, options.sortBy, options.sortOrder || 'asc')
    }

    return events
  }

  /**
   * Get events for a specific date
   */
  async getEventsForDate(householdId: string, date: Date): Promise<CalendarEvent[]> {
    const startOfDate = startOfDay(date)
    const endOfDate = endOfDay(date)

    return await db.calendarEvents
      .where({ householdId })
      .and(event => {
        if (event.deletedAt) return false
        
        const startDate = typeof event.startDate === 'string' ? parseISO(event.startDate) : event.startDate
        const endDate = typeof event.endDate === 'string' ? parseISO(event.endDate) : event.endDate
        
        // Event overlaps with the date
        return startDate <= endOfDate && endDate >= startOfDate
      })
      .sortBy('startDate')
  }

  /**
   * Get events for a date range
   */
  async getEventsForDateRange(householdId: string, startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    return await db.calendarEvents
      .where({ householdId })
      .and(event => {
        if (event.deletedAt) return false
        
        const eventStartDate = typeof event.startDate === 'string' ? parseISO(event.startDate) : event.startDate
        const eventEndDate = typeof event.endDate === 'string' ? parseISO(event.endDate) : event.endDate
        
        // Event overlaps with the date range
        return eventStartDate <= endDate && eventEndDate >= startDate
      })
      .sortBy('startDate')
  }

  /**
   * Get events for a specific month
   */
  async getEventsForMonth(householdId: string, month: Date): Promise<CalendarEvent[]> {
    const startOfMonthDate = startOfMonth(month)
    const endOfMonthDate = endOfMonth(month)
    
    return await this.getEventsForDateRange(householdId, startOfMonthDate, endOfMonthDate)
  }

  /**
   * Get upcoming events
   */
  async getUpcomingEvents(householdId: string, days: number = 7): Promise<CalendarEvent[]> {
    const now = new Date()
    const futureDate = addDays(now, days)
    
    return await this.getEventsForDateRange(householdId, now, futureDate)
  }

  /**
   * Get events by category
   */
  async getEventsByCategory(householdId: string, category: string): Promise<CalendarEvent[]> {
    return await db.calendarEvents
      .where({ householdId, category })
      .and(event => !event.deletedAt)
      .sortBy('startDate')
  }

  /**
   * Get important events
   */
  async getImportantEvents(householdId: string): Promise<CalendarEvent[]> {
    return await db.calendarEvents
      .where({ householdId })
      .and(event => !event.deletedAt && event.isImportant)
      .sortBy('startDate')
  }

  /**
   * Get events with reminders due
   */
  async getEventsWithRemindersDue(householdId: string): Promise<Array<{
    event: CalendarEvent
    reminder: CalendarEvent['reminders'][0]
  }>> {
    const now = new Date()
    const events = await this.getEvents(householdId)
    const eventsWithDueReminders: Array<{
      event: CalendarEvent
      reminder: CalendarEvent['reminders'][0]
    }> = []

    events.forEach(event => {
      if (event.reminders && event.reminders.length > 0) {
        event.reminders.forEach(reminder => {
          const eventStartDate = typeof event.startDate === 'string' ? parseISO(event.startDate) : event.startDate
          const reminderTime = new Date(eventStartDate.getTime() - reminder.minutesBefore * 60 * 1000)
          
          if (reminderTime <= now && reminderTime > new Date(now.getTime() - 5 * 60 * 1000)) {
            eventsWithDueReminders.push({ event, reminder })
          }
        })
      }
    })

    return eventsWithDueReminders
  }

  /**
   * Search events by text
   */
  async searchEvents(householdId: string, searchText: string): Promise<CalendarEvent[]> {
    const lowerSearchText = searchText.toLowerCase()
    
    return await db.calendarEvents
      .where({ householdId })
      .and(event => {
        if (event.deletedAt) return false
        return (
          event.title.toLowerCase().includes(lowerSearchText) ||
          event.description?.toLowerCase().includes(lowerSearchText) ||
          event.location?.toLowerCase().includes(lowerSearchText) ||
          false
        )
      })
      .sortBy('startDate')
  }

  /**
   * Get calendar statistics
   */
  async getCalendarStats(householdId: string): Promise<{
    totalEvents: number
    upcomingEvents: number
    importantEvents: number
    eventsThisMonth: number
    eventsByCategory: Record<string, number>
    eventsWithReminders: number
  }> {
    const allEvents = await this.getEvents(householdId)
    const upcomingEvents = await this.getUpcomingEvents(householdId)
    const importantEvents = await this.getImportantEvents(householdId)
    const eventsThisMonth = await this.getEventsForMonth(householdId, new Date())

    const eventsByCategory: Record<string, number> = {}
    let eventsWithReminders = 0

    allEvents.forEach(event => {
      // Count by category
      eventsByCategory[event.category] = (eventsByCategory[event.category] || 0) + 1
      
      // Count events with reminders
      if (event.reminders && event.reminders.length > 0) {
        eventsWithReminders++
      }
    })

    return {
      totalEvents: allEvents.length,
      upcomingEvents: upcomingEvents.length,
      importantEvents: importantEvents.length,
      eventsThisMonth: eventsThisMonth.length,
      eventsByCategory,
      eventsWithReminders,
    }
  }

  /**
   * Duplicate an event
   */
  async duplicateEvent(id: string): Promise<CalendarEvent> {
    const originalEvent = await db.calendarEvents.get(id)
    if (!originalEvent) {
      throw new Error('Event not found')
    }

    const duplicatedEvent: CalendarEvent = {
      ...originalEvent,
      id: generateId(),
      title: `${originalEvent.title} (Cópia)`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await db.calendarEvents.add(duplicatedEvent)
    return duplicatedEvent
  }

  /**
   * Get default event categories
   */
  getDefaultCategories(): Array<{ name: string; color: string }> {
    return [
      { name: 'Pessoal', color: '#3b82f6' },
      { name: 'Trabalho', color: '#ef4444' },
      { name: 'Família', color: '#10b981' },
      { name: 'Saúde', color: '#f59e0b' },
      { name: 'Educação', color: '#8b5cf6' },
      { name: 'Lazer', color: '#ec4899' },
      { name: 'Viagem', color: '#06b6d4' },
      { name: 'Compromissos', color: '#84cc16' },
      { name: 'Aniversários', color: '#f97316' },
      { name: 'Outros', color: '#6b7280' },
    ]
  }

  /**
   * Check for event conflicts
   */
  async checkEventConflicts(
    householdId: string, 
    startDate: Date, 
    endDate: Date, 
    excludeEventId?: string
  ): Promise<CalendarEvent[]> {
    const events = await this.getEventsForDateRange(householdId, startDate, endDate)
    
    return events.filter(event => {
      if (excludeEventId && event.id === excludeEventId) return false
      
      const eventStartDate = typeof event.startDate === 'string' ? parseISO(event.startDate) : event.startDate
      const eventEndDate = typeof event.endDate === 'string' ? parseISO(event.endDate) : event.endDate
      
      // Check for overlap
      return eventStartDate < endDate && eventEndDate > startDate
    })
  }

  private applyFilters(query: any, filter: CalendarEventFilter): any {
    return query.and((event: CalendarEvent) => {
      // Date range filter
      if (filter.startDate || filter.endDate) {
        const eventStartDate = typeof event.startDate === 'string' ? parseISO(event.startDate) : event.startDate
        const eventEndDate = typeof event.endDate === 'string' ? parseISO(event.endDate) : event.endDate
        
        if (filter.startDate && eventEndDate < filter.startDate) return false
        if (filter.endDate && eventStartDate > filter.endDate) return false
      }

      // Category filter
      if (filter.categories && filter.categories.length > 0) {
        if (!filter.categories.includes(event.category)) return false
      }

      // Important filter
      if (filter.isImportant !== undefined) {
        if (filter.isImportant !== event.isImportant) return false
      }

      // All day filter
      if (filter.isAllDay !== undefined) {
        if (filter.isAllDay !== event.isAllDay) return false
      }

      // Attendees filter
      if (filter.attendees && filter.attendees.length > 0) {
        const hasMatchingAttendee = filter.attendees.some(attendee => 
          event.attendees.includes(attendee)
        )
        if (!hasMatchingAttendee) return false
      }

      // Text search filter
      if (filter.searchText) {
        const searchText = filter.searchText.toLowerCase()
        const matchesTitle = event.title.toLowerCase().includes(searchText)
        const matchesDescription = event.description?.toLowerCase().includes(searchText) || false
        const matchesLocation = event.location?.toLowerCase().includes(searchText) || false
        if (!matchesTitle && !matchesDescription && !matchesLocation) return false
      }

      return true
    })
  }

  private sortEvents(events: CalendarEvent[], sortBy: string, sortOrder: 'asc' | 'desc'): CalendarEvent[] {
    return events.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'startDate':
          const startDateA = typeof a.startDate === 'string' ? parseISO(a.startDate) : a.startDate
          const startDateB = typeof b.startDate === 'string' ? parseISO(b.startDate) : b.startDate
          comparison = startDateA.getTime() - startDateB.getTime()
          break
        case 'endDate':
          const endDateA = typeof a.endDate === 'string' ? parseISO(a.endDate) : a.endDate
          const endDateB = typeof b.endDate === 'string' ? parseISO(b.endDate) : b.endDate
          comparison = endDateA.getTime() - endDateB.getTime()
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
export const calendarService = new CalendarService()

