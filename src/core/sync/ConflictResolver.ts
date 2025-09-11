import { generateId } from '../utils/id'

export interface SyncConflict<T = any> {
  id: string
  entityType: string
  entityId: string
  localVersion: T
  remoteVersion: T
  localTimestamp: Date
  remoteTimestamp: Date
  conflictType: 'update' | 'delete' | 'create'
  status: 'pending' | 'resolved' | 'ignored'
  createdAt: Date
  resolvedAt?: Date
  resolution?: 'local' | 'remote' | 'merge' | 'manual'
  mergedData?: T
}

export type ConflictResolutionStrategy = 
  | 'last-write-wins'
  | 'first-write-wins'
  | 'manual'
  | 'auto-merge'
  | 'prefer-local'
  | 'prefer-remote'

export interface ConflictResolutionRule {
  entityType: string
  strategy: ConflictResolutionStrategy
  autoResolve: boolean
  mergeFields?: string[]
  priorityFields?: string[]
}

export class ConflictResolver {
  private rules: Map<string, ConflictResolutionRule> = new Map()
  private conflicts: Map<string, SyncConflict> = new Map()

  constructor() {
    this.setupDefaultRules()
  }

  private setupDefaultRules() {
    // Default rules for different entity types
    const defaultRules: ConflictResolutionRule[] = [
      {
        entityType: 'expense',
        strategy: 'last-write-wins',
        autoResolve: true,
        priorityFields: ['amount', 'description', 'date']
      },
      {
        entityType: 'task',
        strategy: 'auto-merge',
        autoResolve: true,
        mergeFields: ['title', 'description', 'dueDate', 'priority', 'status'],
        priorityFields: ['status', 'completedAt']
      },
      {
        entityType: 'medication',
        strategy: 'prefer-remote',
        autoResolve: false,
        priorityFields: ['dosage', 'frequency', 'endDate']
      },
      {
        entityType: 'document',
        strategy: 'manual',
        autoResolve: false
      },
      {
        entityType: 'calendar_event',
        strategy: 'last-write-wins',
        autoResolve: true,
        priorityFields: ['startDate', 'endDate', 'title']
      },
      {
        entityType: 'notification',
        strategy: 'prefer-remote',
        autoResolve: true
      }
    ]

    defaultRules.forEach(rule => {
      this.rules.set(rule.entityType, rule)
    })
  }

  setRule(entityType: string, rule: ConflictResolutionRule) {
    this.rules.set(entityType, rule)
  }

  getRule(entityType: string): ConflictResolutionRule | undefined {
    return this.rules.get(entityType)
  }

  detectConflict<T>(
    entityType: string,
    entityId: string,
    localData: T,
    remoteData: T,
    localTimestamp: Date,
    remoteTimestamp: Date
  ): SyncConflict<T> | null {
    // Check if there's actually a conflict
    if (this.isDataEqual(localData, remoteData)) {
      return null
    }

    // Determine conflict type
    let conflictType: 'update' | 'delete' | 'create' = 'update'
    if (!localData && remoteData) {
      conflictType = 'create'
    } else if (localData && !remoteData) {
      conflictType = 'delete'
    }

    const conflict: SyncConflict<T> = {
      id: generateId(),
      entityType,
      entityId,
      localVersion: localData,
      remoteVersion: remoteData,
      localTimestamp,
      remoteTimestamp,
      conflictType,
      status: 'pending',
      createdAt: new Date()
    }

    this.conflicts.set(conflict.id, conflict)
    return conflict
  }

  async resolveConflict<T>(conflictId: string, resolution?: 'local' | 'remote' | 'merge', mergedData?: T): Promise<T | null> {
    const conflict = this.conflicts.get(conflictId) as SyncConflict<T>
    if (!conflict) {
      throw new Error(`Conflict ${conflictId} not found`)
    }

    const rule = this.getRule(conflict.entityType)
    if (!rule) {
      throw new Error(`No resolution rule found for entity type ${conflict.entityType}`)
    }

    let resolvedData: T | null = null
    let finalResolution = resolution

    if (!finalResolution) {
      // Auto-resolve based on strategy
      finalResolution = await this.autoResolve(conflict, rule)
    }

    switch (finalResolution) {
      case 'local':
        resolvedData = conflict.localVersion
        break
      case 'remote':
        resolvedData = conflict.remoteVersion
        break
      case 'merge':
        resolvedData = mergedData || await this.autoMerge(conflict, rule)
        break
    }

    // Update conflict status
    conflict.status = 'resolved'
    conflict.resolvedAt = new Date()
    conflict.resolution = finalResolution
    conflict.mergedData = resolvedData

    return resolvedData
  }

  private async autoResolve<T>(conflict: SyncConflict<T>, rule: ConflictResolutionRule): Promise<'local' | 'remote' | 'merge'> {
    switch (rule.strategy) {
      case 'last-write-wins':
        return conflict.remoteTimestamp > conflict.localTimestamp ? 'remote' : 'local'
      
      case 'first-write-wins':
        return conflict.localTimestamp < conflict.remoteTimestamp ? 'local' : 'remote'
      
      case 'prefer-local':
        return 'local'
      
      case 'prefer-remote':
        return 'remote'
      
      case 'auto-merge':
        return 'merge'
      
      case 'manual':
        throw new Error('Manual resolution required')
      
      default:
        return 'remote'
    }
  }

  private async autoMerge<T>(conflict: SyncConflict<T>, rule: ConflictResolutionRule): Promise<T> {
    const local = conflict.localVersion as any
    const remote = conflict.remoteVersion as any
    const merged = { ...local }

    if (rule.mergeFields) {
      // Merge specific fields
      rule.mergeFields.forEach(field => {
        if (remote[field] !== undefined) {
          // Use remote value if it's newer or if local is empty
          if (!local[field] || 
              (rule.priorityFields?.includes(field) && conflict.remoteTimestamp > conflict.localTimestamp)) {
            merged[field] = remote[field]
          }
        }
      })
    } else {
      // Merge all fields, preferring remote for conflicts
      Object.keys(remote).forEach(key => {
        if (remote[key] !== local[key]) {
          if (rule.priorityFields?.includes(key)) {
            // Use timestamp to decide for priority fields
            merged[key] = conflict.remoteTimestamp > conflict.localTimestamp ? remote[key] : local[key]
          } else {
            // Default to remote value
            merged[key] = remote[key]
          }
        }
      })
    }

    // Always update timestamps
    merged.updatedAt = new Date()
    merged.syncedAt = new Date()

    return merged as T
  }

  private isDataEqual(data1: any, data2: any): boolean {
    if (data1 === data2) return true
    if (!data1 || !data2) return false

    // Deep comparison for objects
    const keys1 = Object.keys(data1)
    const keys2 = Object.keys(data2)

    if (keys1.length !== keys2.length) return false

    for (const key of keys1) {
      if (key === 'updatedAt' || key === 'syncedAt') continue // Ignore timestamp fields
      
      if (typeof data1[key] === 'object' && typeof data2[key] === 'object') {
        if (!this.isDataEqual(data1[key], data2[key])) return false
      } else if (data1[key] !== data2[key]) {
        return false
      }
    }

    return true
  }

  getPendingConflicts(): SyncConflict[] {
    return Array.from(this.conflicts.values()).filter(c => c.status === 'pending')
  }

  getConflictsByEntity(entityType: string): SyncConflict[] {
    return Array.from(this.conflicts.values()).filter(c => c.entityType === entityType)
  }

  clearResolvedConflicts() {
    const resolved = Array.from(this.conflicts.entries())
      .filter(([_, conflict]) => conflict.status === 'resolved')
      .map(([id]) => id)

    resolved.forEach(id => this.conflicts.delete(id))
  }

  getConflictStats() {
    const conflicts = Array.from(this.conflicts.values())
    return {
      total: conflicts.length,
      pending: conflicts.filter(c => c.status === 'pending').length,
      resolved: conflicts.filter(c => c.status === 'resolved').length,
      ignored: conflicts.filter(c => c.status === 'ignored').length,
      byType: conflicts.reduce((acc, conflict) => {
        acc[conflict.entityType] = (acc[conflict.entityType] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
  }
}

// Singleton instance
export const conflictResolver = new ConflictResolver()

