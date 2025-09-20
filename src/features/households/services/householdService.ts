import { db } from '@/core/db/database'
import { 
  Household,
  HouseholdMember,
  HouseholdInvite,
  HouseholdSummary,
  MemberRole
} from '../types'
import { generateId } from '@/core/utils/id'
import { User } from '@/core/types/user'

export class HouseholdService {
  // Criar uma nova casa
  async createHousehold(data: {
    name: string
    ownerId: string
    description?: string
  }): Promise<Household> {
    const household: Household = {
      id: generateId(),
      name: data.name,
      ownerId: data.ownerId,
      description: data.description,
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: {
        defaultCurrency: 'BRL',
        expenseCategories: [
          'Moradia',
          'Alimentação',
          'Transporte',
          'Saúde',
          'Educação',
          'Lazer',
          'Outros'
        ],
        notificationsEnabled: true,
        autoSplitEnabled: true
      }
    }

    // Criar a household
    await db.households.add(household)

    // Adicionar o proprietário como membro
    const member: HouseholdMember = {
      id: generateId(),
      userId: data.ownerId,
      householdId: household.id,
      role: 'owner',
      joinedAt: new Date()
    }
    await db.householdMembers.add(member)

    return household
  }

  // Buscar household por ID
  async getHousehold(id: string): Promise<Household | null> {
    return await db.getHouseholdWithMembers(id)
  }

  // Listar households que o usuário é membro
  async listUserHouseholds(userId: string): Promise<HouseholdSummary[]> {
    const memberships = await db.householdMembers
      .where('userId')
      .equals(userId)
      .toArray()

    const households = await Promise.all(
      memberships.map(async (membership) => {
        const household = await db.households.get(membership.householdId)
        if (!household) return null

        const memberCount = await db.householdMembers
          .where('householdId')
          .equals(household.id)
          .count()

        const monthStart = new Date()
        monthStart.setDate(1)
        monthStart.setHours(0, 0, 0, 0)

        const [totalExpenses, monthlyExpenses] = await Promise.all([
          db.sumHouseholdExpenses({ householdId: household.id }),
          db.sumHouseholdExpenses({ 
            householdId: household.id,
            startDate: monthStart 
          })
        ])

        return {
          id: household.id,
          name: household.name,
          memberCount,
          totalExpenses,
          monthlyExpenses,
          isOwner: household.ownerId === userId,
          role: membership.role,
          joinedAt: membership.joinedAt
        }
      })
    )

    return households.filter((h): h is HouseholdSummary => h !== null)
  }

  // Listar membros de uma household
  async listHouseholdMembers(householdId: string): Promise<(HouseholdMember & { user: User })[]> {
    const members = await db.householdMembers
      .where('householdId')
      .equals(householdId)
      .toArray()

    const membersWithUsers = await Promise.all(
      members.map(async (member) => {
        const user = await db.users.get(member.userId)
        if (!user) throw new Error(`User not found: ${member.userId}`)
        return { ...member, user }
      })
    )

    return membersWithUsers
  }

  // Gerar convite
  async createInvite(data: {
    householdId: string
    createdBy: string
    expiresInHours?: number
    maxUses?: number
  }): Promise<HouseholdInvite> {
    // Verificar se quem está criando tem permissão
    const member = await db.householdMembers
      .where(['householdId', 'userId'])
      .equals([data.householdId, data.createdBy])
      .first()

    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      throw new Error('Sem permissão para criar convites')
    }

    const invite: HouseholdInvite = {
      id: generateId(),
      householdId: data.householdId,
      code: generateInviteCode(),
      createdBy: data.createdBy,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + (data.expiresInHours || 24) * 3600000),
      maxUses: data.maxUses,
      usedCount: 0,
      isRevoked: false
    }

    await db.householdInvites.add(invite)
    return invite
  }

  // Aceitar convite
  async acceptInvite(code: string, userId: string): Promise<Household> {
    // Buscar e validar convite
    const invite = await db.householdInvites
      .where('code')
      .equals(code)
      .first()

    if (!invite) throw new Error('Convite não encontrado')
    if (invite.isRevoked) throw new Error('Convite foi revogado')
    if (invite.expiresAt < new Date()) throw new Error('Convite expirado')
    if (invite.maxUses && invite.usedCount >= invite.maxUses) {
      throw new Error('Convite atingiu número máximo de usos')
    }

    // Verificar se usuário já é membro
    const existingMember = await db.householdMembers
      .where(['householdId', 'userId'])
      .equals([invite.householdId, userId])
      .first()

    if (existingMember) {
      throw new Error('Você já é membro desta casa')
    }

    // Buscar household
    const household = await this.getHousehold(invite.householdId)
    if (!household) throw new Error('Household não encontrada')

    // Adicionar membro
    const member: HouseholdMember = {
      id: generateId(),
      userId,
      householdId: household.id,
      role: 'member',
      joinedAt: new Date()
    }
    await db.householdMembers.add(member)

    // Atualizar contador do convite
    await db.householdInvites.update(invite.id, {
      usedCount: invite.usedCount + 1
    })

    return household
  }

  // Atualizar household
  async updateHousehold(id: string, data: Partial<Household>): Promise<void> {
    const household = await this.getHousehold(id)
    if (!household) throw new Error('Household não encontrada')

    await db.households.update(id, {
      ...data,
      updatedAt: new Date()
    })
  }

  // Remover membro
  async removeMember(householdId: string, userId: string, removedBy: string): Promise<void> {
    // Verificar permissões do executor
    const removerRole = await db.getMemberRole(householdId, removedBy)
    if (!removerRole || (removerRole !== 'owner' && removerRole !== 'admin')) {
      throw new Error('Sem permissão para remover membros')
    }

    // Não permitir remover o proprietário
    const household = await db.households.get(householdId)
    if (!household) throw new Error('Household não encontrada')
    if (household.ownerId === userId) {
      throw new Error('Não é possível remover o proprietário')
    }

    // Remover membro
    await db.householdMembers
      .where(['householdId', 'userId'])
      .equals([householdId, userId])
      .delete()
  }

  // Alterar role do membro
  async updateMemberRole(
    householdId: string, 
    userId: string, 
    newRole: MemberRole, 
    updatedBy: string
  ): Promise<void> {
    // Verificar permissões
    const updaterRole = await db.getMemberRole(householdId, updatedBy)
    if (!updaterRole || updaterRole !== 'owner') {
      throw new Error('Apenas o proprietário pode alterar roles')
    }

    // Não permitir alterar role do proprietário
    const household = await db.households.get(householdId)
    if (!household) throw new Error('Household não encontrada') 
    if (household.ownerId === userId) {
      throw new Error('Não é possível alterar a role do proprietário')
    }

    // Atualizar role
    await db.householdMembers
      .where(['householdId', 'userId'])
      .equals([householdId, userId])
      .modify({ role: newRole })
  }
}

// Helper para gerar código de convite único
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const length = 8
  let code = ''
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Singleton instance
export const householdService = new HouseholdService()