import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query, 
  where, 
  orderBy,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  Timestamp 
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import { authService } from './authService'

export interface Household {
  id: string
  name: string
  ownerId: string
  members: string[]
  createdAt: Date
  updatedAt: Date
  inviteCode?: string
  currency: string
}

export interface Invite {
  id: string
  householdId: string
  code: string
  createdBy: string
  createdAt: Date
  expiresAt: Date
  used: boolean
  usedBy?: string
  usedAt?: Date
}

class HouseholdService {
  private static instance: HouseholdService
  
  static getInstance(): HouseholdService {
    if (!HouseholdService.instance) {
      HouseholdService.instance = new HouseholdService()
    }
    return HouseholdService.instance
  }

  // Criar nova household
  async createHousehold(name: string): Promise<string> {
    const user = authService.getCurrentUser()
    if (!user) throw new Error('Usuário não autenticado')

    const householdData = {
      name,
      ownerId: user.id,
      members: [user.id],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      currency: 'BRL'
    }

    const docRef = await addDoc(collection(db, 'households'), householdData)
    return docRef.id
  }

  // Buscar household por ID
  async getHousehold(id: string): Promise<Household | null> {
    try {
      const docRef = doc(db, 'households', id)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data()
        return {
          id: docSnap.id,
          name: data.name,
          ownerId: data.ownerId,
          members: data.members || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          inviteCode: data.inviteCode,
          currency: data.currency || 'BRL'
        }
      }
      return null
    } catch (error) {
      console.error('Erro ao buscar household:', error)
      return null
    }
  }

  // Listar households do usuário
  async getUserHouseholds(userId: string): Promise<Household[]> {
    try {
      const q = query(
        collection(db, 'households'),
        where('members', 'array-contains', userId),
        orderBy('updatedAt', 'desc')
      )
      
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          name: data.name,
          ownerId: data.ownerId,
          members: data.members || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          inviteCode: data.inviteCode,
          currency: data.currency || 'BRL'
        }
      })
    } catch (error) {
      console.error('Erro ao listar households:', error)
      return []
    }
  }

  // Escutar mudanças em tempo real
  subscribeToUserHouseholds(userId: string, callback: (households: Household[]) => void): () => void {
    const q = query(
      collection(db, 'households'),
      where('members', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    )

    return onSnapshot(q, (snapshot) => {
      const households = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          name: data.name,
          ownerId: data.ownerId,
          members: data.members || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          inviteCode: data.inviteCode,
          currency: data.currency || 'BRL'
        }
      })
      callback(households)
    })
  }

  // Gerar código de convite
  async generateInviteCode(householdId: string): Promise<string> {
    const user = authService.getCurrentUser()
    if (!user) throw new Error('Usuário não autenticado')

    // Verificar se o usuário é owner ou membro
    const household = await this.getHousehold(householdId)
    if (!household || !household.members.includes(user.id)) {
      throw new Error('Usuário não tem permissão para gerar convites')
    }

    // Gerar código único de 8 caracteres
    const code = Math.random().toString(36).substring(2, 10).toUpperCase()
    
    // Criar convite no Firestore
    const inviteData = {
      householdId,
      code,
      createdBy: user.id,
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
      used: false
    }

    await addDoc(collection(db, 'invites'), inviteData)
    return code
  }

  // Aceitar convite usando código
  async acceptInvite(code: string): Promise<string> {
    const user = authService.getCurrentUser()
    if (!user) throw new Error('Usuário não autenticado')

    // Buscar convite ativo
    const q = query(
      collection(db, 'invites'),
      where('code', '==', code),
      where('used', '==', false)
    )
    
    const querySnapshot = await getDocs(q)
    if (querySnapshot.empty) {
      throw new Error('Código de convite inválido ou expirado')
    }

    const inviteDoc = querySnapshot.docs[0]
    const invite = inviteDoc.data()

    // Verificar se não expirou
    const expiresAt = invite.expiresAt.toDate()
    if (expiresAt < new Date()) {
      throw new Error('Código de convite expirado')
    }

    // Verificar se o usuário já não é membro
    const household = await this.getHousehold(invite.householdId)
    if (!household) {
      throw new Error('Household não encontrada')
    }

    if (household.members.includes(user.id)) {
      throw new Error('Você já é membro desta household')
    }

    // Adicionar usuário como membro
    const householdRef = doc(db, 'households', invite.householdId)
    await updateDoc(householdRef, {
      members: arrayUnion(user.id),
      updatedAt: serverTimestamp()
    })

    // Marcar convite como usado
    const inviteRef = doc(db, 'invites', inviteDoc.id)
    await updateDoc(inviteRef, {
      used: true,
      usedBy: user.id,
      usedAt: serverTimestamp()
    })

    return invite.householdId
  }

  // Sair da household
  async leaveHousehold(householdId: string): Promise<void> {
    const user = authService.getCurrentUser()
    if (!user) throw new Error('Usuário não autenticado')

    const household = await this.getHousehold(householdId)
    if (!household) throw new Error('Household não encontrada')

    // Verificar se é o owner
    if (household.ownerId === user.id) {
      throw new Error('O proprietário não pode sair. Transfira a propriedade primeiro.')
    }

    // Remover usuário dos membros
    const householdRef = doc(db, 'households', householdId)
    await updateDoc(householdRef, {
      members: arrayRemove(user.id),
      updatedAt: serverTimestamp()
    })
  }

  // Remover membro (apenas owner)
  async removeMember(householdId: string, userId: string): Promise<void> {
    const user = authService.getCurrentUser()
    if (!user) throw new Error('Usuário não autenticado')

    const household = await this.getHousehold(householdId)
    if (!household) throw new Error('Household não encontrada')

    // Verificar se é o owner
    if (household.ownerId !== user.id) {
      throw new Error('Apenas o proprietário pode remover membros')
    }

    // Não pode remover a si mesmo
    if (userId === user.id) {
      throw new Error('Não é possível remover a si mesmo')
    }

    // Remover usuário dos membros
    const householdRef = doc(db, 'households', householdId)
    await updateDoc(householdRef, {
      members: arrayRemove(userId),
      updatedAt: serverTimestamp()
    })
  }

  // Atualizar nome da household
  async updateName(householdId: string, name: string): Promise<void> {
    const user = authService.getCurrentUser()
    if (!user) throw new Error('Usuário não autenticado')

    const household = await this.getHousehold(householdId)
    if (!household) throw new Error('Household não encontrada')

    // Verificar se é membro
    if (!household.members.includes(user.id)) {
      throw new Error('Usuário não tem permissão para editar')
    }

    const householdRef = doc(db, 'households', householdId)
    await updateDoc(householdRef, {
      name,
      updatedAt: serverTimestamp()
    })
  }

  // Deletar household (apenas owner)
  async deleteHousehold(householdId: string): Promise<void> {
    const user = authService.getCurrentUser()
    if (!user) throw new Error('Usuário não autenticado')

    const household = await this.getHousehold(householdId)
    if (!household) throw new Error('Household não encontrada')

    // Verificar se é o owner
    if (household.ownerId !== user.id) {
      throw new Error('Apenas o proprietário pode deletar a household')
    }

    // Deletar convites relacionados
    const invitesQuery = query(
      collection(db, 'invites'),
      where('householdId', '==', householdId)
    )
    const invitesSnapshot = await getDocs(invitesQuery)
    
    const batch = []
    for (const inviteDoc of invitesSnapshot.docs) {
      batch.push(deleteDoc(doc(db, 'invites', inviteDoc.id)))
    }
    await Promise.all(batch)

    // Deletar household
    await deleteDoc(doc(db, 'households', householdId))
  }

  // Listar membros da household com informações do usuário
  async getHouseholdMembers(householdId: string) {
    const household = await this.getHousehold(householdId)
    if (!household) return []

    // Por enquanto retornamos apenas os IDs, mas poderia buscar dados dos usuários
    return household.members.map(userId => ({
      id: userId,
      isOwner: userId === household.ownerId
    }))
  }
}

export const householdService = HouseholdService.getInstance()