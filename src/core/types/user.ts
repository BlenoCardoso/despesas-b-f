export interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string
  phoneNumber?: string
  preferences?: UserPreferences
  createdAt: Date
  updatedAt: Date
  lastActiveAt?: Date
  isActive: boolean
  metadata?: Record<string, any>
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  currency: string
  notifications: {
    email: boolean
    push: boolean
    expenses: boolean
    reminders: boolean
  }
  displayName?: string
}

// Guards e Helpers
export function isUserActive(user: User): boolean {
  if (!user.isActive) return false
  if (!user.lastActiveAt) return false
  
  // Considera inativo se não acessou nos últimos 30 dias
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  return user.lastActiveAt > thirtyDaysAgo
}

export function getUserDisplayName(user: User): string {
  return user.preferences?.displayName || user.name
}

export function getUserInitials(user: User): string {
  const name = getUserDisplayName(user)
  return name
    .split(' ')
    .map(part => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}