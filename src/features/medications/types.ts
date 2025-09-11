import { BaseEntity } from '@/types/global'

export interface Dosage {
  value: number
  unit: string // mg, ml, comprimidos, etc.
}

export interface MedicationSchedule {
  startDate: Date
  endDate?: Date
  times: string[] // HH:mm format
  weekdays?: number[] // 0=Dom, 1=Seg, ..., 6=Sab
  frequency?: 'diario' | 'semanal' | 'mensal' | 'intervalo'
  intervalHours?: number
}

export interface MedicationStock {
  current: number
  unit: string
  lowThreshold: number
}

export interface MedicationIntake {
  id: string
  medicationId: string
  dateTimePlanned: Date
  dateTimeTaken?: Date
  status: 'tomado' | 'atrasado' | 'pulado'
  note?: string
}

export interface Medication extends BaseEntity {
  name: string
  dosage: Dosage
  form: 'comprimido' | 'capsula' | 'xarope' | 'spray' | 'injecao' | string
  instructions?: string
  schedule: MedicationSchedule
  asNeeded?: boolean
  stock?: MedicationStock
  history: MedicationIntake[]
}

export interface MedicationFormData {
  name: string
  dosage: Dosage
  form: string
  instructions?: string
  schedule: MedicationSchedule
  asNeeded?: boolean
  stock?: MedicationStock
}

export interface MedicationReminder {
  id: string
  medicationId: string
  medicationName: string
  dosage: Dosage
  scheduledTime: Date
  status: 'pending' | 'taken' | 'snoozed' | 'skipped'
  snoozeUntil?: Date
  actions: Array<{
    action: 'take_now' | 'snooze_5' | 'snooze_10' | 'snooze_30' | 'skip'
    title: string
  }>
}

export interface MedicationScheduleEntry {
  id: string
  medicationId: string
  medicationName: string
  dosage: Dosage
  scheduledTime: Date
  isOverdue: boolean
  minutesUntil: number
  status: 'pending' | 'taken' | 'snoozed' | 'skipped'
}

export interface DailyMedicationSchedule {
  date: string
  entries: MedicationScheduleEntry[]
  completedCount: number
  totalCount: number
  adherencePercentage: number
}

export interface MedicationAdherence {
  medicationId: string
  medicationName: string
  period: 'week' | 'month' | 'year'
  startDate: Date
  endDate: Date
  totalScheduled: number
  totalTaken: number
  totalSkipped: number
  adherencePercentage: number
  dailyAdherence: Array<{
    date: string
    scheduled: number
    taken: number
    percentage: number
  }>
}

export interface MedicationStockAlert {
  id: string
  medicationId: string
  medicationName: string
  currentStock: number
  lowThreshold: number
  daysRemaining: number
  severity: 'low' | 'critical' | 'out'
}

export interface MedicationExportData extends Medication {
  householdName: string
  userName: string
  totalIntakes: number
  adherencePercentage: number
}

export interface MedicationImportData {
  name: string
  dosage: string
  form: string
  instructions?: string
  times: string[]
  startDate: string
  endDate?: string
  asNeeded?: boolean
  stockCurrent?: number
  stockUnit?: string
  stockThreshold?: number
}

export interface MedicationNotification {
  id: string
  medicationId: string
  type: 'reminder' | 'stock_low' | 'stock_critical' | 'missed_dose'
  title: string
  message: string
  scheduledFor: Date
  delivered: boolean
  actions: Array<{
    action: 'take_now' | 'snooze' | 'skip' | 'view' | 'restock'
    title: string
  }>
}

export interface MedicationFilter {
  searchText?: string
  forms?: string[]
  asNeeded?: boolean
  hasStock?: boolean
  lowStock?: boolean
  activeOnly?: boolean
}

export type MedicationSortBy = 
  | 'name'
  | 'nextDose'
  | 'adherence'
  | 'stockLevel'
  | 'createdAt'

export type MedicationSortOrder = 'asc' | 'desc'

export interface MedicationListOptions {
  sortBy: MedicationSortBy
  sortOrder: MedicationSortOrder
  filter: MedicationFilter
  page: number
  pageSize: number
}

export interface MedicationCalendarEvent {
  id: string
  medicationId: string
  medicationName: string
  dosage: Dosage
  time: string
  date: Date
  status: 'pending' | 'taken' | 'skipped'
  isOverdue: boolean
}

