import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, writeBatch, arrayUnion } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import { authService } from '../../../services/authService'

function generateCode(len = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let out = ''
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

export async function createInvitation(householdId: string, inviteeEmail: string) {
  const user = authService.getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  const code = generateCode(8)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const invitation = {
    householdId,
    inviterUid: user.id,
    inviteeEmail: inviteeEmail.toLowerCase(),
    code,
    status: 'pending',
    createdAt: serverTimestamp(),
    expiresAt: expiresAt
  }

  const ref = await addDoc(collection(db, 'invitations'), invitation)
  const inviteLink = `${window.location.origin}/?invite=${ref.id}&code=${code}`
  return { id: ref.id, link: inviteLink, code }
}

export async function acceptInvitation(inviteId: string, providedCode: string) {
  const user = authService.getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  const inviteRef = doc(db, 'invitations', inviteId)
  const snap = await getDoc(inviteRef)
  if (!snap.exists()) throw new Error('Invite not found')
  const invite = snap.data() as any

  if (invite.status !== 'pending') throw new Error('Invite not pending')
  if ((invite.inviteeEmail || '').toLowerCase() !== (user.email || '').toLowerCase()) throw new Error('Invite is not for your email')
  if (invite.code !== providedCode) throw new Error('Invite code mismatch')

  // Use batch to atomically update invitation and household and user
  const batch = writeBatch(db)
  batch.update(inviteRef, {
    status: 'accepted',
    providedCode: providedCode,
    acceptedAt: serverTimestamp(),
    acceptedByUid: user.id
  })

  const householdRef = doc(db, 'households', invite.householdId)
  // add user to household members using arrayUnion
  batch.update(householdRef, {
    members: arrayUnion(user.id),
    updatedAt: serverTimestamp()
  })

  const userRef = doc(db, 'users', user.id)
  batch.set(userRef, { households: arrayUnion(invite.householdId) }, { merge: true })

  await batch.commit()
  return { ok: true }
}
