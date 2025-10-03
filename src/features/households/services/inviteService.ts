import { query, where, getDocs, collection } from 'firebase/firestore'
import { db as firestore } from '@/config/firebase'
import { DatabaseMiddleware } from '@/lib/databaseMiddleware'
import type { BaseModel } from '@/types'

// Gerar código único de 8 caracteres (sem ambiguidade) usando crypto
function generateCode(): string {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
  const arr = new Uint8Array(8)
  if (typeof crypto !== 'undefined' && (crypto as any).getRandomValues) {
    ;(crypto as any).getRandomValues(arr)
  } else {
    // fallback
    for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256)
  }
  return Array.from(arr).map(n => alphabet[n % alphabet.length]).join('')
}

// Interface de convite
export interface Invite extends BaseModel {
  householdId: string
  code: string
  invitedBy: string
  expiresAt: string
  maxUses: number
  uses: number
}

// Opções de convite
interface CreateInviteOptions {
  householdId: string
  invitedBy: string
  expiresIn?: number // em horas
  maxUses?: number
}

export class InviteService {
  // Criar novo convite
  static async create(options: CreateInviteOptions): Promise<Invite> {
    const code = await this.generateUniqueCode()
    const now = new Date()

    // Data de expiração (default 7 dias)
    const expiresAt = new Date(now)
    expiresAt.setHours(now.getHours() + (options.expiresIn || 168))

    // Criar convite e retornar o registro criado
  const id = await DatabaseMiddleware.create<any>({
      collection: 'invites',
      data: {
        householdId: options.householdId,
        code,
        invitedBy: options.invitedBy,
        expiresAt: expiresAt.toISOString(),
        maxUses: options.maxUses || 1,
        uses: 0
      }
    })

    // Buscar o documento criado para retornar o objeto completo
    const { db } = await import('@/core/db/database')
    const created = await db.table('invites').get(String(id))
    return created as Invite
  }

  // Gerar código único (verifica se já existe)
  private static async generateUniqueCode(): Promise<string> {
    let code = generateCode()
    let attempts = 0
    const maxAttempts = 5

  while (attempts < maxAttempts) {
      // Verificar se código existe
      const inviteQuery = query(
        collection(firestore, 'invites'),
        where('code', '==', code)
      )
      const snapshot = await getDocs(inviteQuery)

      if (snapshot.empty) {
        return code
      }

      // Tentar outro código
      code = generateCode()
      attempts++
    }

    throw new Error('Não foi possível gerar código único')
  }

  // Validar convite
  static async validate(code: string): Promise<{
    valid: boolean
    householdId?: string
    error?: string
  }> {
    try {
      console.log('🔍 InviteService.validate - código:', code)
      
      if (!code || code.trim() === '') {
        console.log('❌ Código vazio')
        return { 
          valid: false,
          error: 'Código não fornecido'
        }
      }
      
      const normalizedCode = code.toUpperCase().trim()
      console.log('🔄 Código normalizado:', normalizedCode)
      
      // Buscar convite na coleção correta 'invitations'
      const inviteQuery = query(
        collection(firestore, 'invitations'),
        where('code', '==', normalizedCode)
      )
      
      console.log('📡 Executando query no Firestore...')
      const snapshot = await getDocs(inviteQuery)
      
      console.log('📊 Resultados encontrados:', snapshot.size)

      // Convite não encontrado
      if (snapshot.empty) {
        console.log('❌ Nenhum convite encontrado para o código:', normalizedCode)
        console.log('🔍 Verificando também na coleção invites (legacy)...')
        
        // Tentar buscar na coleção legacy
        const legacyQuery = query(
          collection(firestore, 'invites'),
          where('code', '==', normalizedCode)
        )
        
        const legacySnapshot = await getDocs(legacyQuery)
        console.log('📊 Resultados legacy encontrados:', legacySnapshot.size)
        
        if (legacySnapshot.empty) {
          return { 
            valid: false,
            error: 'Código inválido ou não encontrado'
          }
        }
        
        // Usar resultado legacy
        const legacyInvite = legacySnapshot.docs[0].data() as any
        console.log('📋 Dados do convite legacy encontrado:', legacyInvite)
        
        if (!legacyInvite.householdId) {
          return {
            valid: false,
            error: 'Convite mal formado'
          }
        }
        
        return {
          valid: true,
          householdId: legacyInvite.householdId
        }
      }

      const invite = snapshot.docs[0].data() as any
      console.log('📋 Dados do convite encontrado:', invite)

      // Verificar se tem os campos necessários
      if (!invite.householdId) {
        console.log('❌ Convite sem householdId')
        return {
          valid: false,
          error: 'Convite mal formado'
        }
      }

      // Verificar expiração (se existir)
      if (invite.expiresAt) {
        const expirationDate = invite.expiresAt.toDate ? invite.expiresAt.toDate() : new Date(invite.expiresAt)
        if (expirationDate < new Date()) {
          console.log('❌ Convite expirado')
          return {
            valid: false,
            error: 'Convite expirado'
          }
        }
      }

      // Verificar usos
      const uses = invite.uses || 0
      const maxUses = invite.maxUses || 1
      if (uses >= maxUses) {
        console.log('❌ Convite já utilizado')
        return {
          valid: false,
          error: 'Convite já utilizado'
        }
      }

      console.log('✅ Convite válido!')
      return {
        valid: true,
        householdId: invite.householdId
      }
    } catch (error) {
      console.error('💥 Erro na validação do convite:', error)
      return {
        valid: false,
        error: `Erro interno na validação: ${error}`
      }
    }
  }

  // Usar convite
  static async use(code: string): Promise<void> {
    try {
      console.log('🔄 InviteService.use - código:', code)
      
      const normalizedCode = code.toUpperCase().trim()
      
      // Buscar convite na coleção correta 'invitations'
      const inviteQuery = query(
        collection(firestore, 'invitations'),
        where('code', '==', normalizedCode)
      )
      const snapshot = await getDocs(inviteQuery)

      if (!snapshot.empty) {
        console.log('📝 Atualizando uso do convite na coleção invitations')
        const invite = snapshot.docs[0].data() as any
        
        // Atualizar contador de usos usando updateDoc em vez de DatabaseMiddleware
        const { updateDoc, doc } = await import('firebase/firestore')
        await updateDoc(doc(firestore, 'invitations', snapshot.docs[0].id), {
          uses: (invite.uses || 0) + 1
        })
        console.log('✅ Convite usado com sucesso!')
        return
      }
      
      // Tentar buscar na coleção legacy
      console.log('🔍 Tentando buscar na coleção legacy invites...')
      const legacyQuery = query(
        collection(firestore, 'invites'),
        where('code', '==', normalizedCode)
      )
      const legacySnapshot = await getDocs(legacyQuery)
      
      if (!legacySnapshot.empty) {
        console.log('📝 Atualizando uso do convite na coleção legacy')
        const legacyInvite = legacySnapshot.docs[0].data() as any
        
        const { updateDoc, doc } = await import('firebase/firestore')
        await updateDoc(doc(firestore, 'invites', legacySnapshot.docs[0].id), {
          uses: (legacyInvite.uses || 0) + 1
        })
        console.log('✅ Convite legacy usado com sucesso!')
        return
      }
      
      console.log('❌ Convite não encontrado para uso')
    } catch (error) {
      console.error('💥 Erro ao usar convite:', error)
      throw error
    }
  }

  // Gerar link de convite
  static generateInviteLink(code: string): string {
    let baseUrl = ''
    try {
      // Guardar acesso a import.meta.env que pode não estar tipado em tsc strict
      baseUrl = (import.meta as any)?.env?.VITE_APP_URL || window.location.origin
    } catch (e) {
      baseUrl = window.location.origin
    }
    return `${baseUrl}/convite/${code}`
  }
}