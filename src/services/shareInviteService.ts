import { doc, setDoc, getDoc, serverTimestamp, Timestamp, addDoc, collection, query, where, getDocs, writeBatch, increment, arrayUnion } from 'firebase/firestore'
import { db } from '@/config/firebase'

export interface ShareInviteDoc {
  code: string
  householdId: string
  inviterUid: string
  status: 'pending' | 'used' | 'revoked' | 'expired'
  expiresAt: Timestamp
  maxUses: number
  currentUses: number
  createdAt: any
}

export const shareInviteService = {
  async createShareInvite(householdId: string, inviterUid: string, opts?: { expiresInHours?: number; maxUses?: number }) {
    const expiresInHours = opts?.expiresInHours ?? 48
    const maxUses = opts?.maxUses ?? 1
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const expiresAtDate = new Date(Date.now() + expiresInHours * 60 * 60 * 1000)

    const invite: ShareInviteDoc = {
      code,
      householdId,
      inviterUid,
      status: 'pending',
      expiresAt: Timestamp.fromDate(expiresAtDate),
      maxUses,
      currentUses: 0,
      createdAt: serverTimestamp()
    }

    // Doc ID = code (requisito das regras)
    await setDoc(doc(db, 'shareInvites', code), invite)
    return code
  },

  async getShareInvite(code: string) {
    const ref = doc(db, 'shareInvites', code.toUpperCase())
    const snap = await getDoc(ref)
    if (!snap.exists()) return null
    return snap.data() as ShareInviteDoc
  },

  async createInviteRequest(invite: ShareInviteDoc, requesterUid: string) {
    // inviteRequests coleção com auto ID
    await addDoc(collection(db, 'inviteRequests'), {
      inviteId: invite.code,
      householdId: invite.householdId,
      requesterUid,
      status: 'pending',
      createdAt: serverTimestamp()
    })
  },

  async listPendingRequests(householdId: string) {
    const q = query(collection(db, 'inviteRequests'), where('householdId', '==', householdId), where('status', '==', 'pending'))
    const snaps = await getDocs(q)
    return snaps.docs.map(d => ({ id: d.id, ...(d.data() as any) }))
  },

  async approveRequest(opts: { requestId: string; inviteId: string; householdId: string; requesterUid: string }) {
    const { requestId, inviteId, householdId, requesterUid } = opts
    // Ler convite para saber limites
    const inviteRef = doc(db, 'shareInvites', inviteId)
    const inviteSnap = await getDoc(inviteRef)
    if (!inviteSnap.exists()) throw new Error('Convite não encontrado')
    const invite = inviteSnap.data() as any
    if (invite.status !== 'pending') throw new Error('Convite não está mais ativo')
    if (invite.currentUses >= invite.maxUses) throw new Error('Limite de usos atingido')

    const batch = writeBatch(db)
    // Atualiza request
    batch.update(doc(db, 'inviteRequests', requestId), { status: 'approved', approvedAt: serverTimestamp() })
    // Atualiza household (adiciona membro)
    batch.update(doc(db, 'households', householdId), { members: arrayUnion(requesterUid), updatedAt: serverTimestamp() })
    // Atualiza convite
    const newUses = (invite.currentUses || 0) + 1
    batch.update(inviteRef, { currentUses: increment(1), status: newUses >= invite.maxUses ? 'used' : 'pending', updatedAt: serverTimestamp() })
    await batch.commit()
  },

  async rejectRequest(requestId: string) {
    await setDoc(doc(db, 'inviteRequests', requestId), { status: 'rejected', rejectedAt: serverTimestamp() }, { merge: true })
  }
}
