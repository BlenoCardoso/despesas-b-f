import { User } from '@/core/types/user'

export type MemberRole = 'owner' | 'admin' | 'member'

export interface HouseholdMember {
  id: string
  userId: string
  householdId: string
  role: MemberRole
  joinedAt: Date
  user?: User // Referência opcional para dados do usuário
}

export interface Household {
  id: string
  name: string
  ownerId: string
  description?: string
  createdAt: Date
  updatedAt: Date
  settings?: HouseholdSettings
  metadata?: Record<string, any>
}

export interface HouseholdSettings {
  defaultCurrency: string
  expenseCategories: string[]
  notificationsEnabled: boolean
  autoSplitEnabled: boolean
  theme?: {
    primaryColor?: string
    logo?: string
  }
}

export interface HouseholdInvite {
  id: string
  householdId: string
  code: string
  createdBy: string
  createdAt: Date
  expiresAt: Date
  maxUses?: number
  usedCount: number
  isRevoked: boolean
}

export interface HouseholdSummary {
  id: string
  name: string
  memberCount: number
  totalExpenses: number
  monthlyExpenses: number
  isOwner: boolean
  role: MemberRole
  joinedAt: Date
}

// Guards
export function isMemberAdmin(member: HouseholdMember): boolean {
  return member.role === 'owner' || member.role === 'admin'
}

export function canEditSettings(member: HouseholdMember): boolean {
  return isMemberAdmin(member)
}

export function canInviteMembers(member: HouseholdMember): boolean {
  return isMemberAdmin(member)
}

export function canManageExpenses(member: HouseholdMember): boolean {
  return member.role !== 'guest' // Assumindo que no futuro possamos ter role 'guest'
}