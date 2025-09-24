// Permissive shim to avoid mismatch between core types and global types during Batch 1
declare module '@/core/types/user' {
  export interface User {
    id: string
    name: string
    email: string
    avatarUrl?: string
    households?: string[]
    preferences?: any
    householdId: string
    createdAt: Date
    updatedAt: Date
    lastSeen?: Date
    [k: string]: any
  }
  export function getUserDisplayName(user: User): string
}
