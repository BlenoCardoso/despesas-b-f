import { db } from '@/core/db/database'
import { Medication, MedicationIntake, MedicationFormData, MedicationFilter, MedicationListOptions } from '../types'
import { generateId } from '@/core/utils/id'
import { addDays, addHours, addMinutes, startOfDay, endOfDay, parseISO, format } from 'date-fns'

export class MedicationService {
  /**
   * Create a new medication
   */
  async createMedication(data: MedicationFormData, householdId: string, userId: string): Promise<Medication> {
    const medication: Medication = {
      id: generateId(),
      householdId,
      userId,
      name: data.name,
      description: data.description,
      dosage: data.dosage,
      unit: data.unit,
      form: data.form,
      frequency: data.frequency,
      times: data.times || [],
      startDate: data.startDate,
      endDate: data.endDate,
      instructions: data.instructions,
      sideEffects: data.sideEffects,
      prescribedBy: data.prescribedBy,
      pharmacy: data.pharmacy,
      cost: data.cost,
      stockQuantity: data.stockQuantity || 0,
      lowStockThreshold: data.lowStockThreshold || 5,
      isActive: true,
      reminders: data.reminders || [],
      tags: data.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await db.medications.add(medication)
    
    // Generate intake schedule
    await this.generateIntakeSchedule(medication)
    
    return medication
  }

  /**
   * Update an existing medication
   */
  async updateMedication(id: string, data: Partial<MedicationFormData>): Promise<void> {
    const updates: Partial<Medication> = {
      ...data,
      updatedAt: new Date(),
      syncVersion: Date.now(),
    }

    await db.medications.update(id, updates)
    
    // Regenerate intake schedule if frequency or times changed
    if (data.frequency || data.times || data.startDate || data.endDate) {
      const medication = await db.medications.get(id)
      if (medication) {
        await this.regenerateIntakeSchedule(medication)
      }
    }
  }

  /**
   * Delete a medication (soft delete)
   */
  async deleteMedication(id: string): Promise<void> {
    await db.softDeleteMedication(id)
    
    // Mark all future intakes as cancelled
    const futureIntakes = await db.medicationIntakes
      .where('medicationId')
      .equals(id)
      .and(intake => intake.dateTimePlanned > new Date())
      .toArray()
    
    for (const intake of futureIntakes) {
      await db.medicationIntakes.update(intake.id!, { status: 'cancelled' })
    }
  }

  /**
   * Get medication by ID
   */
  async getMedicationById(id: string): Promise<Medication | undefined> {
    return await db.medications.get(id)
  }

  /**
   * Get all medications for a household
   */
  async getMedications(householdId: string, options?: MedicationListOptions): Promise<Medication[]> {
    let query = db.medications.where({ householdId }).and(med => !med.deletedAt)

    // Apply filters
    if (options?.filter) {
      query = this.applyFilters(query, options.filter)
    }

    let medications = await query.toArray()

    // Apply sorting
    if (options?.sortBy) {
      medications = this.sortMedications(medications, options.sortBy, options.sortOrder || 'asc')
    }

    return medications
  }

  /**
   * Get active medications
   */
  async getActiveMedications(householdId: string): Promise<Medication[]> {
    return await db.medications
      .where({ householdId })
      .and(med => !med.deletedAt && med.isActive)
      .sortBy('name')
  }

  /**
   * Get medications with low stock
   */
  async getLowStockMedications(householdId: string): Promise<Medication[]> {
    return await db.medications
      .where({ householdId })
      .and(med => !med.deletedAt && med.isActive && med.stockQuantity <= med.lowStockThreshold)
      .sortBy('stockQuantity')
  }

  /**
   * Get medications expiring soon
   */
  async getMedicationsExpiringSoon(householdId: string, days: number = 30): Promise<Medication[]> {
    const now = new Date()
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
    
    return await db.medications
      .where({ householdId })
      .and(med => {
        if (med.deletedAt || !med.isActive || !med.endDate) return false
        
        const endDate = typeof med.endDate === 'string' ? parseISO(med.endDate) : med.endDate
        return endDate >= now && endDate <= futureDate
      })
      .sortBy('endDate')
  }

  /**
   * Search medications by text
   */
  async searchMedications(householdId: string, searchText: string): Promise<Medication[]> {
    const lowerSearchText = searchText.toLowerCase()
    
    return await db.medications
      .where({ householdId })
      .and(med => {
        if (med.deletedAt) return false
        return (
          med.name.toLowerCase().includes(lowerSearchText) ||
          med.description?.toLowerCase().includes(lowerSearchText) ||
          med.prescribedBy?.toLowerCase().includes(lowerSearchText) ||
          med.tags.some(tag => tag.toLowerCase().includes(lowerSearchText)) ||
          false
        )
      })
      .sortBy('name')
  }

  /**
   * Get medication statistics
   */
  async getMedicationStats(householdId: string): Promise<{
    total: number
    active: number
    inactive: number
    lowStock: number
    expiringSoon: number
    totalCost: number
    byForm: Record<string, number>
  }> {
    const allMedications = await this.getMedications(householdId)
    const lowStockMeds = await this.getLowStockMedications(householdId)
    const expiringSoonMeds = await getMedicationsExpiringSoon(householdId)

    const totalCost = allMedications.reduce((sum, med) => sum + (med.cost || 0), 0)
    
    const byForm: Record<string, number> = {}
    allMedications.forEach(med => {
      byForm[med.form] = (byForm[med.form] || 0) + 1
    })

    return {
      total: allMedications.length,
      active: allMedications.filter(med => med.isActive).length,
      inactive: allMedications.filter(med => !med.isActive).length,
      lowStock: lowStockMeds.length,
      expiringSoon: expiringSoonMeds.length,
      totalCost,
      byForm,
    }
  }

  /**
   * Generate intake schedule for a medication
   */
  async generateIntakeSchedule(medication: Medication): Promise<void> {
    if (!medication.isActive || !medication.startDate) return

    const startDate = typeof medication.startDate === 'string' ? parseISO(medication.startDate) : medication.startDate
    const endDate = medication.endDate ? 
      (typeof medication.endDate === 'string' ? parseISO(medication.endDate) : medication.endDate) :
      addDays(startDate, 365) // Default to 1 year if no end date

    // Clear existing future intakes
    await db.medicationIntakes
      .where('medicationId')
      .equals(medication.id)
      .and(intake => intake.dateTimePlanned > new Date())
      .delete()

    const intakes: Omit<MedicationIntake, 'id'>[] = []
    let currentDate = startDate

    while (currentDate <= endDate) {
      // Generate intakes for this day based on frequency and times
      for (const time of medication.times) {
        const [hours, minutes] = time.split(':').map(Number)
        const intakeDateTime = new Date(currentDate)
        intakeDateTime.setHours(hours, minutes, 0, 0)

        if (intakeDateTime > new Date()) { // Only future intakes
          intakes.push({
            medicationId: medication.id,
            dateTimePlanned: intakeDateTime,
            status: 'pending',
            dosageTaken: medication.dosage,
          })
        }
      }

      // Move to next day based on frequency
      switch (medication.frequency) {
        case 'daily':
          currentDate = addDays(currentDate, 1)
          break
        case 'weekly':
          currentDate = addDays(currentDate, 7)
          break
        case 'monthly':
          currentDate = addDays(currentDate, 30)
          break
        case 'as_needed':
          // Don't generate automatic schedule for as-needed medications
          return
        default:
          currentDate = addDays(currentDate, 1)
      }
    }

    // Batch insert intakes
    if (intakes.length > 0) {
      await db.medicationIntakes.bulkAdd(intakes)
    }
  }

  /**
   * Regenerate intake schedule for a medication
   */
  async regenerateIntakeSchedule(medication: Medication): Promise<void> {
    // Delete all future intakes
    await db.medicationIntakes
      .where('medicationId')
      .equals(medication.id)
      .and(intake => intake.dateTimePlanned > new Date() && intake.status === 'pending')
      .delete()

    // Generate new schedule
    await this.generateIntakeSchedule(medication)
  }

  /**
   * Record medication intake
   */
  async recordIntake(intakeId: number, actualDateTime?: Date, dosageTaken?: number, notes?: string): Promise<void> {
    await db.medicationIntakes.update(intakeId, {
      status: 'taken',
      dateTimeTaken: actualDateTime || new Date(),
      dosageTaken: dosageTaken,
      notes,
    })

    // Update stock quantity
    const intake = await db.medicationIntakes.get(intakeId)
    if (intake) {
      const medication = await db.medications.get(intake.medicationId)
      if (medication && medication.stockQuantity > 0) {
        await db.medications.update(medication.id, {
          stockQuantity: Math.max(0, medication.stockQuantity - (dosageTaken || medication.dosage)),
          updatedAt: new Date(),
        })
      }
    }
  }

  /**
   * Skip medication intake
   */
  async skipIntake(intakeId: number, reason?: string): Promise<void> {
    await db.medicationIntakes.update(intakeId, {
      status: 'skipped',
      notes: reason,
    })
  }

  /**
   * Get intakes for a date range
   */
  async getIntakesForDateRange(medicationId: string, startDate: Date, endDate: Date): Promise<MedicationIntake[]> {
    return await db.medicationIntakes
      .where('medicationId')
      .equals(medicationId)
      .and(intake => intake.dateTimePlanned >= startDate && intake.dateTimePlanned <= endDate)
      .sortBy('dateTimePlanned')
  }

  /**
   * Get today's intakes
   */
  async getTodaysIntakes(householdId: string): Promise<Array<MedicationIntake & { medication: Medication }>> {
    const today = new Date()
    const startOfToday = startOfDay(today)
    const endOfToday = endOfDay(today)

    const intakes = await db.medicationIntakes
      .where('dateTimePlanned')
      .between(startOfToday, endOfToday)
      .toArray()

    const result: Array<MedicationIntake & { medication: Medication }> = []

    for (const intake of intakes) {
      const medication = await db.medications.get(intake.medicationId)
      if (medication && medication.householdId === householdId && !medication.deletedAt) {
        result.push({ ...intake, medication })
      }
    }

    return result.sort((a, b) => a.dateTimePlanned.getTime() - b.dateTimePlanned.getTime())
  }

  /**
   * Get overdue intakes
   */
  async getOverdueIntakes(householdId: string): Promise<Array<MedicationIntake & { medication: Medication }>> {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    const intakes = await db.medicationIntakes
      .where('dateTimePlanned')
      .below(oneHourAgo)
      .and(intake => intake.status === 'pending')
      .toArray()

    const result: Array<MedicationIntake & { medication: Medication }> = []

    for (const intake of intakes) {
      const medication = await db.medications.get(intake.medicationId)
      if (medication && medication.householdId === householdId && !medication.deletedAt) {
        result.push({ ...intake, medication })
      }
    }

    return result.sort((a, b) => a.dateTimePlanned.getTime() - b.dateTimePlanned.getTime())
  }

  /**
   * Update stock quantity
   */
  async updateStock(medicationId: string, quantity: number): Promise<void> {
    await db.medications.update(medicationId, {
      stockQuantity: Math.max(0, quantity),
      updatedAt: new Date(),
      syncVersion: Date.now(),
    })
  }

  /**
   * Add stock
   */
  async addStock(medicationId: string, quantity: number): Promise<void> {
    const medication = await db.medications.get(medicationId)
    if (medication) {
      await this.updateStock(medicationId, medication.stockQuantity + quantity)
    }
  }

  /**
   * Get default medication forms
   */
  getDefaultForms(): string[] {
    return [
      'Comprimido',
      'Cápsula',
      'Líquido',
      'Injeção',
      'Pomada',
      'Creme',
      'Gel',
      'Spray',
      'Gotas',
      'Adesivo',
      'Supositório',
      'Inalador',
      'Outros',
    ]
  }

  /**
   * Get default units
   */
  getDefaultUnits(): string[] {
    return [
      'mg',
      'g',
      'ml',
      'UI',
      'mcg',
      'comprimido(s)',
      'cápsula(s)',
      'gota(s)',
      'borrifada(s)',
      'aplicação(ões)',
    ]
  }

  private applyFilters(query: any, filter: MedicationFilter): any {
    return query.and((med: Medication) => {
      // Active filter
      if (filter.isActive !== undefined) {
        if (filter.isActive !== med.isActive) return false
      }

      // Form filter
      if (filter.forms && filter.forms.length > 0) {
        if (!filter.forms.includes(med.form)) return false
      }

      // Low stock filter
      if (filter.isLowStock !== undefined) {
        const isLowStock = med.stockQuantity <= med.lowStockThreshold
        if (filter.isLowStock !== isLowStock) return false
      }

      // Prescribed by filter
      if (filter.prescribedBy && filter.prescribedBy.length > 0) {
        if (!med.prescribedBy || !filter.prescribedBy.includes(med.prescribedBy)) return false
      }

      // Tags filter
      if (filter.tags && filter.tags.length > 0) {
        const hasMatchingTag = filter.tags.some(tag => med.tags.includes(tag))
        if (!hasMatchingTag) return false
      }

      // Text search filter
      if (filter.searchText) {
        const searchText = filter.searchText.toLowerCase()
        const matchesName = med.name.toLowerCase().includes(searchText)
        const matchesDescription = med.description?.toLowerCase().includes(searchText) || false
        const matchesPrescriber = med.prescribedBy?.toLowerCase().includes(searchText) || false
        const matchesTags = med.tags.some(tag => tag.toLowerCase().includes(searchText))
        if (!matchesName && !matchesDescription && !matchesPrescriber && !matchesTags) return false
      }

      return true
    })
  }

  private sortMedications(medications: Medication[], sortBy: string, sortOrder: 'asc' | 'desc'): Medication[] {
    return medications.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'form':
          comparison = a.form.localeCompare(b.form)
          break
        case 'stockQuantity':
          comparison = a.stockQuantity - b.stockQuantity
          break
        case 'cost':
          comparison = (a.cost || 0) - (b.cost || 0)
          break
        case 'endDate':
          const endDateA = a.endDate ? (typeof a.endDate === 'string' ? parseISO(a.endDate) : a.endDate) : new Date(0)
          const endDateB = b.endDate ? (typeof b.endDate === 'string' ? parseISO(b.endDate) : b.endDate) : new Date(0)
          comparison = endDateA.getTime() - endDateB.getTime()
          break
        default:
          comparison = a.createdAt.getTime() - b.createdAt.getTime()
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })
  }
}

// Singleton instance
export const medicationService = new MedicationService()

