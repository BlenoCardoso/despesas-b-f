import { generateId } from '../utils/id'

export interface DataVersion {
  id: string
  entityType: string
  entityId: string
  version: number
  data: any
  checksum: string
  createdAt: Date
  createdBy: string
  operation: 'create' | 'update' | 'delete'
  changes?: Record<string, { from: any; to: any }>
  metadata?: Record<string, any>
}

export interface VersionDiff {
  field: string
  oldValue: any
  newValue: any
  type: 'added' | 'modified' | 'removed'
}

export class VersionManager {
  private versions: Map<string, DataVersion[]> = new Map()
  private currentVersions: Map<string, number> = new Map()

  constructor() {}

  private generateChecksum(data: any): string {
    // Simple checksum generation - in production, use a proper hash function
    const str = JSON.stringify(data, Object.keys(data).sort())
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(36)
  }

  private getEntityKey(entityType: string, entityId: string): string {
    return `${entityType}:${entityId}`
  }

  createVersion(
    entityType: string,
    entityId: string,
    data: any,
    operation: 'create' | 'update' | 'delete',
    userId: string,
    previousData?: any
  ): DataVersion {
    const entityKey = this.getEntityKey(entityType, entityId)
    const currentVersion = this.currentVersions.get(entityKey) || 0
    const newVersion = currentVersion + 1

    // Calculate changes if this is an update
    let changes: Record<string, { from: any; to: any }> | undefined
    if (operation === 'update' && previousData) {
      changes = this.calculateChanges(previousData, data)
    }

    const version: DataVersion = {
      id: generateId(),
      entityType,
      entityId,
      version: newVersion,
      data: JSON.parse(JSON.stringify(data)), // Deep clone
      checksum: this.generateChecksum(data),
      createdAt: new Date(),
      createdBy: userId,
      operation,
      changes,
      metadata: {
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    }

    // Store version
    const entityVersions = this.versions.get(entityKey) || []
    entityVersions.push(version)
    this.versions.set(entityKey, entityVersions)
    this.currentVersions.set(entityKey, newVersion)

    return version
  }

  private calculateChanges(oldData: any, newData: any): Record<string, { from: any; to: any }> {
    const changes: Record<string, { from: any; to: any }> = {}

    // Get all unique keys from both objects
    const allKeys = new Set([
      ...Object.keys(oldData || {}),
      ...Object.keys(newData || {})
    ])

    allKeys.forEach(key => {
      const oldValue = oldData?.[key]
      const newValue = newData?.[key]

      if (oldValue !== newValue) {
        changes[key] = { from: oldValue, to: newValue }
      }
    })

    return changes
  }

  getVersion(entityType: string, entityId: string, version: number): DataVersion | null {
    const entityKey = this.getEntityKey(entityType, entityId)
    const versions = this.versions.get(entityKey) || []
    return versions.find(v => v.version === version) || null
  }

  getCurrentVersion(entityType: string, entityId: string): DataVersion | null {
    const entityKey = this.getEntityKey(entityType, entityId)
    const currentVersionNumber = this.currentVersions.get(entityKey)
    if (!currentVersionNumber) return null
    
    return this.getVersion(entityType, entityId, currentVersionNumber)
  }

  getVersionHistory(entityType: string, entityId: string): DataVersion[] {
    const entityKey = this.getEntityKey(entityType, entityId)
    return this.versions.get(entityKey) || []
  }

  getVersionsSince(entityType: string, entityId: string, sinceVersion: number): DataVersion[] {
    const history = this.getVersionHistory(entityType, entityId)
    return history.filter(v => v.version > sinceVersion)
  }

  getVersionsInRange(
    entityType: string, 
    entityId: string, 
    fromVersion: number, 
    toVersion: number
  ): DataVersion[] {
    const history = this.getVersionHistory(entityType, entityId)
    return history.filter(v => v.version >= fromVersion && v.version <= toVersion)
  }

  getDiff(entityType: string, entityId: string, fromVersion: number, toVersion: number): VersionDiff[] {
    const fromVersionData = this.getVersion(entityType, entityId, fromVersion)
    const toVersionData = this.getVersion(entityType, entityId, toVersion)

    if (!fromVersionData || !toVersionData) {
      throw new Error('Version not found')
    }

    return this.calculateDiff(fromVersionData.data, toVersionData.data)
  }

  private calculateDiff(oldData: any, newData: any): VersionDiff[] {
    const diffs: VersionDiff[] = []

    // Get all unique keys
    const allKeys = new Set([
      ...Object.keys(oldData || {}),
      ...Object.keys(newData || {})
    ])

    allKeys.forEach(key => {
      const oldValue = oldData?.[key]
      const newValue = newData?.[key]

      if (oldValue === undefined && newValue !== undefined) {
        diffs.push({
          field: key,
          oldValue: undefined,
          newValue,
          type: 'added'
        })
      } else if (oldValue !== undefined && newValue === undefined) {
        diffs.push({
          field: key,
          oldValue,
          newValue: undefined,
          type: 'removed'
        })
      } else if (oldValue !== newValue) {
        diffs.push({
          field: key,
          oldValue,
          newValue,
          type: 'modified'
        })
      }
    })

    return diffs
  }

  revertToVersion(entityType: string, entityId: string, version: number, userId: string): DataVersion | null {
    const targetVersion = this.getVersion(entityType, entityId, version)
    if (!targetVersion) {
      throw new Error(`Version ${version} not found`)
    }

    // Create a new version with the reverted data
    const currentVersion = this.getCurrentVersion(entityType, entityId)
    const revertedVersion = this.createVersion(
      entityType,
      entityId,
      targetVersion.data,
      'update',
      userId,
      currentVersion?.data
    )

    // Add metadata to indicate this is a revert
    revertedVersion.metadata = {
      ...revertedVersion.metadata,
      isRevert: true,
      revertedFromVersion: version,
      revertedToVersion: targetVersion.version
    }

    return revertedVersion
  }

  squashVersions(entityType: string, entityId: string, fromVersion: number, toVersion: number): DataVersion {
    const versions = this.getVersionsInRange(entityType, entityId, fromVersion, toVersion)
    if (versions.length === 0) {
      throw new Error('No versions found in range')
    }

    const latestVersion = versions[versions.length - 1]
    const entityKey = this.getEntityKey(entityType, entityId)

    // Remove the squashed versions
    const allVersions = this.versions.get(entityKey) || []
    const remainingVersions = allVersions.filter(v => v.version < fromVersion || v.version > toVersion)
    
    // Add the squashed version
    const squashedVersion: DataVersion = {
      ...latestVersion,
      id: generateId(),
      version: fromVersion,
      metadata: {
        ...latestVersion.metadata,
        isSquashed: true,
        squashedVersions: versions.map(v => v.version),
        originalVersionCount: versions.length
      }
    }

    remainingVersions.push(squashedVersion)
    remainingVersions.sort((a, b) => a.version - b.version)

    this.versions.set(entityKey, remainingVersions)

    return squashedVersion
  }

  getVersionStats(entityType?: string): {
    totalVersions: number
    entitiesWithVersions: number
    averageVersionsPerEntity: number
    oldestVersion: Date | null
    newestVersion: Date | null
    versionsByType: Record<string, number>
  } {
    let totalVersions = 0
    let entitiesWithVersions = 0
    let oldestVersion: Date | null = null
    let newestVersion: Date | null = null
    const versionsByType: Record<string, number> = {}

    this.versions.forEach((versions, entityKey) => {
      if (entityType && !entityKey.startsWith(`${entityType}:`)) {
        return
      }

      entitiesWithVersions++
      totalVersions += versions.length

      versions.forEach(version => {
        versionsByType[version.entityType] = (versionsByType[version.entityType] || 0) + 1

        if (!oldestVersion || version.createdAt < oldestVersion) {
          oldestVersion = version.createdAt
        }
        if (!newestVersion || version.createdAt > newestVersion) {
          newestVersion = version.createdAt
        }
      })
    })

    return {
      totalVersions,
      entitiesWithVersions,
      averageVersionsPerEntity: entitiesWithVersions > 0 ? totalVersions / entitiesWithVersions : 0,
      oldestVersion,
      newestVersion,
      versionsByType
    }
  }

  cleanupOldVersions(maxVersionsPerEntity: number = 50, maxAge: number = 30 * 24 * 60 * 60 * 1000) {
    const cutoffDate = new Date(Date.now() - maxAge)
    let cleanedCount = 0

    this.versions.forEach((versions, entityKey) => {
      // Sort by version number (newest first)
      versions.sort((a, b) => b.version - a.version)

      // Keep the most recent versions and those newer than cutoff
      const toKeep = versions.filter((version, index) => {
        return index < maxVersionsPerEntity || version.createdAt > cutoffDate
      })

      if (toKeep.length < versions.length) {
        cleanedCount += versions.length - toKeep.length
        this.versions.set(entityKey, toKeep)
      }
    })

    return cleanedCount
  }

  exportVersionHistory(entityType?: string): DataVersion[] {
    const allVersions: DataVersion[] = []

    this.versions.forEach((versions, entityKey) => {
      if (entityType && !entityKey.startsWith(`${entityType}:`)) {
        return
      }
      allVersions.push(...versions)
    })

    return allVersions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  }

  importVersionHistory(versions: DataVersion[]) {
    versions.forEach(version => {
      const entityKey = this.getEntityKey(version.entityType, version.entityId)
      const entityVersions = this.versions.get(entityKey) || []
      
      // Check if version already exists
      if (!entityVersions.find(v => v.version === version.version)) {
        entityVersions.push(version)
        entityVersions.sort((a, b) => a.version - b.version)
        this.versions.set(entityKey, entityVersions)

        // Update current version if this is newer
        const currentVersion = this.currentVersions.get(entityKey) || 0
        if (version.version > currentVersion) {
          this.currentVersions.set(entityKey, version.version)
        }
      }
    })
  }
}

// Singleton instance
export const versionManager = new VersionManager()

