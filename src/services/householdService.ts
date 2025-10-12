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

    console.log('🏠 [householdService] Criando household:', name)

    const householdData = {
      name,
      ownerId: user.id,
      members: [user.id],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      currency: 'BRL'
    }

    try {
      const docRef = await addDoc(collection(db, 'households'), householdData)
      console.log('✅ [householdService] Household criada com ID:', docRef.id)
      return docRef.id
    } catch (error: any) {
      console.error('❌ [householdService] Erro ao criar household:', error)
      throw new Error(`Erro ao criar household: ${error?.message || 'Erro desconhecido'}`)
    }
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
    console.log('🔄 [householdService] Configurando listener para households do usuário:', userId)
    
    const q = query(
      collection(db, 'households'),
      where('members', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log('📸 [householdService] Snapshot recebido:', snapshot.size, 'households')
        
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
        
        console.log('✅ [householdService] Households processadas:', households.length)
        callback(households)
      },
      (error: any) => {
        console.error('❌ [householdService] Erro no listener:', error)
        
        // Fallback sem ordenação se índice não existir
        if (error?.code === 'failed-precondition') {
          console.warn('⚠️ [householdService] Índice faltando, usando fallback')
          
          const fallbackQuery = query(
            collection(db, 'households'),
            where('members', 'array-contains', userId)
          )
          
          return onSnapshot(fallbackQuery, (snapshot) => {
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
            
            // Ordenar manualmente
            households.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
            
            console.log('✅ [householdService] Households processadas (fallback):', households.length)
            callback(households)
          })
        }
      }
    )

    return () => {
      console.log('🔄 [householdService] Desconectando listener de households')
      unsubscribe()
    }
  }

  // Gerar código de convite
  async generateInviteCode(householdId: string): Promise<string> {
    const user = authService.getCurrentUser()
    if (!user) throw new Error('Usuário não autenticado')

    console.log('🎟️ [householdService] Gerando código de convite para:', householdId)

    // Verificar se o usuário é owner ou membro
    const household = await this.getHousehold(householdId)
    if (!household || !household.members.includes(user.id)) {
      throw new Error('Usuário não tem permissão para gerar convites')
    }

    // Gerar código único de exatamente 6 caracteres (letras maiúsculas e números)
    // Usar caracteres específicos para garantir legibilidade (sem 0, O, I, 1)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    
    // Criar convite no Firestore
    const inviteData = {
      householdId,
      code,
      createdBy: user.id,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 dias
      used: false
    }

    try {
      await addDoc(collection(db, 'invites'), inviteData)
      console.log('✅ [householdService] Código de convite criado:', code)
      return code
    } catch (error: any) {
      console.error('❌ [householdService] Erro ao criar convite:', error)
      throw new Error(`Erro ao gerar convite: ${error?.message || 'Erro desconhecido'}`)
    }
  }

  // Aceitar convite usando código
  async acceptInvite(code: string): Promise<string> {
    const user = authService.getCurrentUser()
    if (!user) throw new Error('Usuário não autenticado')

    console.log('✅ [householdService] Aceitando convite com código:', code)

    try {
      // Buscar convite ativo
      const q = query(
        collection(db, 'invites'),
        where('code', '==', code),
        where('used', '==', false)
      )
      
      const querySnapshot = await getDocs(q)
      if (querySnapshot.empty) {
        throw new Error('Código de convite inválido ou já utilizado')
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
        console.log('⚠️ [householdService] Usuário já é membro desta household')
        return invite.householdId // Retorna o ID mesmo assim
      }

      console.log('➕ [householdService] Adicionando usuário à household:', invite.householdId)

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

      console.log('✅ [householdService] Convite aceito com sucesso!')
      return invite.householdId
    } catch (error: any) {
      console.error('❌ [householdService] Erro ao aceitar convite:', error)
      throw new Error(`Erro ao aceitar convite: ${error?.message || 'Erro desconhecido'}`)
    }
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