/**
 * ESTRUTURA DE DADOS FIREBASE - DOCUMENTAÇÃO
 * 
 * Este arquivo define a estrutura de dados que será criada automaticamente
 * quando os usuários se cadastrarem no app.
 */

export interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string
  households: string[]
  preferences: {
    currency: string
    language: string
    theme: 'light' | 'dark' | 'system'
    notifications: {
      expenses: boolean
      reminders: boolean
      reports: boolean
    }
  }
  createdAt: Date
  updatedAt: Date
  lastSeen?: Date
  // Para sincronização offline
  syncVersion?: number
  lastSyncAt?: Date
}

export interface Household {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
  members: string[] // Array de User IDs
  ownerId: string   // User ID do proprietário
  inviteCode?: string // Código para convidar outros membros
  settings: {
    currency: string
    timezone: string
    categories: {
      allowCustom: boolean
      defaultCategories: string[]
    }
  }
  // Para sincronização
  syncVersion: number
}

export interface Expense {
  id: string
  householdId: string
  amount: number
  description: string
  category: string
  paymentMethod: 'money' | 'card' | 'pix' | 'transfer'
  createdBy: string // User ID
  createdAt: Date
  updatedAt: Date
  attachments?: {
    id: string
    name: string
    url: string
    type: string
    size: number
  }[]
  tags?: string[]
  location?: {
    latitude: number
    longitude: number
    address?: string
  }
  // Para sincronização
  syncVersion: number
  // Para soft delete
  deletedAt?: Date
  deletedBy?: string
}

export interface Category {
  id: string
  householdId: string
  name: string
  color: string
  icon: string
  isDefault: boolean
  createdBy: string
  createdAt: Date
  // Para sincronização
  syncVersion: number
}

export interface Task {
  id: string
  householdId: string
  title: string
  description?: string
  isCompleted: boolean
  assignedTo?: string
  completedBy?: string
  completedAt?: Date | null
  dueDate?: Date | null
  priority: 'low' | 'medium' | 'high'
  category?: string
  tags?: string[]
  createdBy: string
  createdAt: Date
  syncVersion: number
}

export interface Document {
  id: string
  householdId: string
  name: string
  type: string
  size: number
  url: string
  path: string
  tags?: string[]
  description?: string
  createdBy: string
  createdAt: Date
  syncVersion: number
}

export interface Medication {
  id: string
  householdId: string
  name: string
  dosage: string
  frequency: string
  instructions?: string
  startDate: Date
  endDate?: Date | null
  isActive: boolean
  assignedTo: string
  prescribedBy?: string
  notes?: string
  reminders?: {
    enabled: boolean
    times: string[]
  }
  createdBy: string
  createdAt: Date
  syncVersion: number
}

export interface Invitation {
  id: string
  householdId: string
  inviterUserId: string
  inviteeEmail: string
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  createdAt: Date
  expiresAt: Date
  acceptedAt?: Date
}

/**
 * ESTRUTURA DE SEGURANÇA FIRESTORE
 * 
 * Regras que serão implementadas:
 * 1. Usuários só podem acessar suas próprias households
 * 2. Membros da household podem ver/editar despesas compartilhadas
 * 3. Apenas o owner pode remover membros ou deletar a household
 * 4. Convites só podem ser aceitos pelo email de destino
 */

// Exemplo de como a estrutura será criada automaticamente no primeiro login:
// export const createUserStructure = async (userAuth: any) => {
//   // 1. Criar documento do usuário
//   // 2. Criar household padrão
//   // 3. Criar categorias padrão
//   // 4. Configurar sincronização
// }