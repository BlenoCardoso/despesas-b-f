export interface CalendarEvent {
  id: string
  householdId: string
  userId: string
  title: string
  description?: string
  startDate: Date | string
  endDate: Date | string
  isAllDay: boolean
  location?: string
  category: string
  color: string
  attendees: string[]
  reminders: EventReminder[]
  recurrence?: EventRecurrence
  isImportant: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
  syncVersion?: number
}

export interface EventReminder {
  id: string
  type: 'notification' | 'email' | 'sms'
  minutesBefore: number
  message?: string
}

export interface EventRecurrence {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly'
  interval: number
  endDate?: Date | string
  daysOfWeek?: number[] // 0 = Sunday, 1 = Monday, etc.
  dayOfMonth?: number
  monthOfYear?: number
}

export interface CalendarEventFormData {
  title: string
  description?: string
  startDate: Date
  endDate: Date
  isAllDay?: boolean
  location?: string
  category: string
  color?: string
  attendees?: string[]
  reminders?: EventReminder[]
  recurrence?: EventRecurrence
  isImportant?: boolean
}

export interface CalendarEventFilter {
  startDate?: Date
  endDate?: Date
  categories?: string[]
  isImportant?: boolean
  isAllDay?: boolean
  attendees?: string[]
  searchText?: string
}

export interface CalendarEventListOptions {
  filter?: CalendarEventFilter
  sortBy?: 'startDate' | 'endDate' | 'title' | 'category' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export interface CalendarView {
  type: 'month' | 'week' | 'day' | 'agenda'
  date: Date
}

export interface CalendarDay {
  date: Date
  events: CalendarEvent[]
  isToday: boolean
  isCurrentMonth: boolean
  hasEvents: boolean
}

export interface CalendarWeek {
  days: CalendarDay[]
  weekNumber: number
}

export interface CalendarMonth {
  weeks: CalendarWeek[]
  month: number
  year: number
  name: string
}

