import { addHours, addDays, startOfDay, format } from 'date-fns'
import { Medication } from '../types'

export interface TreatmentSchedule {
  medicationId: string
  doses: ScheduledDose[]
  totalDoses: number
  durationDays: number
  intervalType: 'fixed_times' | 'interval_hours' | 'daily' | 'weekly' | 'monthly'
  intervalValue?: number
}

export interface ScheduledDose {
  id: string
  medicationId: string
  datetime: Date
  dosage: number
  sequence: number
  isPlanned: boolean
}

export class TreatmentScheduleService {
  /**
   * Generate complete treatment schedule for a medication
   */
  static generateTreatmentSchedule(medication: Medication): TreatmentSchedule {
    const startDate = new Date(medication.startDate)
    const endDate = medication.endDate ? new Date(medication.endDate) : addDays(startDate, 30)
    
    let schedule: TreatmentSchedule
    
    switch (medication.frequency) {
      case 'daily':
        schedule = this.generateDailySchedule(medication, startDate, endDate)
        break
      case 'weekly':
        schedule = this.generateWeeklySchedule(medication, startDate, endDate)
        break
      case 'monthly':
        schedule = this.generateMonthlySchedule(medication, startDate, endDate)
        break
      case 'as_needed':
        schedule = this.generateAsNeededSchedule(medication, startDate, endDate)
        break
      default:
        schedule = this.generateDailySchedule(medication, startDate, endDate)
    }
    
    return schedule
  }

  /**
   * Generate daily schedule with support for intervals (e.g., every 8 hours)
   */
  private static generateDailySchedule(medication: Medication, startDate: Date, endDate: Date): TreatmentSchedule {
    const doses: ScheduledDose[] = []
    let sequence = 1
    
    // If specific times are provided, use them
    if (medication.times && medication.times.length > 0) {
      // Fixed times per day (e.g., 08:00, 16:00, 00:00 for 3x daily)
      let currentDate = new Date(startDate)
      
      while (currentDate <= endDate) {
        const dayStart = startOfDay(currentDate)
        
        for (const time of medication.times) {
          const [hours, minutes] = time.split(':').map(Number)
          const doseTime = new Date(dayStart)
          doseTime.setHours(hours, minutes, 0, 0)
          
          if (doseTime >= startDate && doseTime <= endDate) {
            doses.push({
              id: `dose-${medication.id}-${sequence}`,
              medicationId: medication.id,
              datetime: new Date(doseTime),
              dosage: medication.dosage,
              sequence: sequence++,
              isPlanned: true
            })
          }
        }
        
        currentDate = addDays(currentDate, 1)
      }
      
      return {
        medicationId: medication.id,
        doses: doses.sort((a, b) => a.datetime.getTime() - b.datetime.getTime()),
        totalDoses: doses.length,
        durationDays: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
        intervalType: 'fixed_times'
      }
    } else {
      // Interval-based dosing (e.g., every 8 hours)
      const intervalHours = medication.times.length > 1 ? 24 / medication.times.length : 24
      let currentDateTime = new Date(startDate)
      
      // Set to first dose time if specified
      if (medication.times.length > 0) {
        const [hours, minutes] = medication.times[0].split(':').map(Number)
        currentDateTime.setHours(hours, minutes, 0, 0)
      }
      
      while (currentDateTime <= endDate) {
        doses.push({
          id: `dose-${medication.id}-${sequence}`,
          medicationId: medication.id,
          datetime: new Date(currentDateTime),
          dosage: medication.dosage,
          sequence: sequence++,
          isPlanned: true
        })
        
        currentDateTime = addHours(currentDateTime, intervalHours)
      }
      
      return {
        medicationId: medication.id,
        doses: doses.sort((a, b) => a.datetime.getTime() - b.datetime.getTime()),
        totalDoses: doses.length,
        durationDays: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
        intervalType: 'interval_hours',
        intervalValue: intervalHours
      }
    }
  }

  /**
   * Generate weekly schedule
   */
  private static generateWeeklySchedule(medication: Medication, startDate: Date, endDate: Date): TreatmentSchedule {
    const doses: ScheduledDose[] = []
    let sequence = 1
    let currentDate = new Date(startDate)
    
    // Use first time if available, otherwise use start time
    const timeToUse = medication.times.length > 0 ? medication.times[0] : format(startDate, 'HH:mm')
    const [hours, minutes] = timeToUse.split(':').map(Number)
    
    while (currentDate <= endDate) {
      const doseTime = new Date(currentDate)
      doseTime.setHours(hours, minutes, 0, 0)
      
      if (doseTime >= startDate && doseTime <= endDate) {
        doses.push({
          id: `dose-${medication.id}-${sequence}`,
          medicationId: medication.id,
          datetime: new Date(doseTime),
          dosage: medication.dosage,
          sequence: sequence++,
          isPlanned: true
        })
      }
      
      currentDate = addDays(currentDate, 7)
    }
    
    return {
      medicationId: medication.id,
      doses,
      totalDoses: doses.length,
      durationDays: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
      intervalType: 'weekly'
    }
  }

  /**
   * Generate monthly schedule
   */
  private static generateMonthlySchedule(medication: Medication, startDate: Date, endDate: Date): TreatmentSchedule {
    const doses: ScheduledDose[] = []
    let sequence = 1
    let currentDate = new Date(startDate)
    
    // Use first time if available, otherwise use start time
    const timeToUse = medication.times.length > 0 ? medication.times[0] : format(startDate, 'HH:mm')
    const [hours, minutes] = timeToUse.split(':').map(Number)
    
    while (currentDate <= endDate) {
      const doseTime = new Date(currentDate)
      doseTime.setHours(hours, minutes, 0, 0)
      
      if (doseTime >= startDate && doseTime <= endDate) {
        doses.push({
          id: `dose-${medication.id}-${sequence}`,
          medicationId: medication.id,
          datetime: new Date(doseTime),
          dosage: medication.dosage,
          sequence: sequence++,
          isPlanned: true
        })
      }
      
      // Add approximately 30 days
      currentDate = addDays(currentDate, 30)
    }
    
    return {
      medicationId: medication.id,
      doses,
      totalDoses: doses.length,
      durationDays: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
      intervalType: 'monthly'
    }
  }

  /**
   * Generate as-needed schedule (empty schedule)
   */
  private static generateAsNeededSchedule(medication: Medication, startDate: Date, endDate: Date): TreatmentSchedule {
    return {
      medicationId: medication.id,
      doses: [],
      totalDoses: 0,
      durationDays: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
      intervalType: 'daily'
    }
  }

  /**
   * Calculate next dose time based on last intake and medication schedule
   */
  static calculateNextDoseTime(medication: Medication, lastIntakeTime?: Date): Date | null {
    const now = new Date()
    const startDate = new Date(medication.startDate)
    const endDate = medication.endDate ? new Date(medication.endDate) : addDays(startDate, 30)
    
    if (now > endDate) {
      return null // Treatment period ended
    }
    
    if (medication.frequency === 'as_needed') {
      return null // No scheduled doses for as-needed medications
    }
    
    // If no previous intake, use the schedule
    if (!lastIntakeTime) {
      const schedule = this.generateTreatmentSchedule(medication)
      const nextScheduledDose = schedule.doses.find(dose => dose.datetime > now)
      return nextScheduledDose?.datetime || null
    }
    
    // Calculate based on last intake and frequency
    let nextDoseTime: Date
    
    switch (medication.frequency) {
      case 'daily':
        if (medication.times.length > 1) {
          // Interval-based (e.g., every 8 hours)
          const intervalHours = 24 / medication.times.length
          nextDoseTime = addHours(lastIntakeTime, intervalHours)
        } else {
          // Once daily, same time next day
          nextDoseTime = addDays(lastIntakeTime, 1)
        }
        break
      case 'weekly':
        nextDoseTime = addDays(lastIntakeTime, 7)
        break
      case 'monthly':
        nextDoseTime = addDays(lastIntakeTime, 30)
        break
      default:
        nextDoseTime = addDays(lastIntakeTime, 1)
    }
    
    // Ensure next dose is within treatment period
    if (nextDoseTime > endDate) {
      return null
    }
    
    return nextDoseTime
  }

  /**
   * Get treatment progress statistics
   */
  static calculateTreatmentProgress(
    schedule: TreatmentSchedule, 
    actualIntakes: Array<{ dateTimeTaken: Date; status: 'taken' | 'skipped' }>
  ) {
    const now = new Date()
    const takenIntakes = actualIntakes.filter(intake => intake.status === 'taken')
    
    // Doses that should have been taken by now
    const dueDoses = schedule.doses.filter(dose => dose.datetime <= now)
    const overdueDoses = schedule.doses.filter(dose => 
      dose.datetime < now && 
      !takenIntakes.some(intake => 
        Math.abs(intake.dateTimeTaken.getTime() - dose.datetime.getTime()) < 30 * 60 * 1000
      )
    )
    
    const totalScheduled = schedule.totalDoses
    const totalTaken = takenIntakes.length
    const totalDue = dueDoses.length
    const totalOverdue = overdueDoses.length
    const totalRemaining = Math.max(0, totalScheduled - totalTaken)
    
    const adherenceRate = totalDue > 0 ? Math.round((totalTaken / totalDue) * 100) : 100
    const completionRate = totalScheduled > 0 ? Math.round((totalTaken / totalScheduled) * 100) : 0
    
    return {
      totalScheduled,
      totalTaken,
      totalDue,
      totalOverdue,
      totalRemaining,
      adherenceRate,
      completionRate,
      isCompleted: totalTaken >= totalScheduled,
      nextDose: schedule.doses.find(dose => dose.datetime > now && 
        !takenIntakes.some(intake => 
          Math.abs(intake.dateTimeTaken.getTime() - dose.datetime.getTime()) < 30 * 60 * 1000
        )
      )
    }
  }
}