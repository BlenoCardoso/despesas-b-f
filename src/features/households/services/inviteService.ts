import { query, where, getDocs, collection } from 'firebase/firestore'
import { firestore } from '@/lib/firebase'
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
    // Buscar convite
    const inviteQuery = query(
      collection(firestore, 'invites'),
      where('code', '==', code.toUpperCase())
    )
    const snapshot = await getDocs(inviteQuery)

    // Convite não encontrado
    if (snapshot.empty) {
      return { 
        valid: false,
        error: 'Código inválido'
      }
    }

  const invite = snapshot.docs[0].data() as Invite

    // Verificar expiração
    if (new Date(invite.expiresAt) < new Date()) {
      return {
        valid: false,
        error: 'Convite expirado'
      }
    }

    // Verificar usos
    if (invite.uses >= invite.maxUses) {
      return {
        valid: false,
        error: 'Convite já utilizado'
      }
    }

    return {
      valid: true,
      householdId: invite.householdId
    }
  }

  // Usar convite
  static async use(code: string): Promise<void> {
    // Buscar convite
    const inviteQuery = query(
      collection(firestore, 'invites'),
      where('code', '==', code.toUpperCase())
    )
    const snapshot = await getDocs(inviteQuery)

    if (!snapshot.empty) {
      const invite = snapshot.docs[0].data() as Invite
      
      // Atualizar contador de usos
  await DatabaseMiddleware.update<any>({
        collection: 'invites',
        id: snapshot.docs[0].id,
        data: {
          ...invite,
          uses: invite.uses + 1
        }
      })
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