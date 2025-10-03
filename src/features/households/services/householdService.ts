import { collection, addDoc, serverTimestamp, doc, updateDoc, arrayUnion, arrayRemove, getDoc, query, where, getDocs, writeBatch, deleteField } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { authService } from '../../../services/authService'
import { firebaseHouseholdService } from '../../../../src/services/firebaseHouseholdService'

/**
 * Compatibility shim for the legacy `householdService` API used across the app.
 * It delegates to the centralized firebaseHouseholdService and implements
 * legacy method names expected by hooks and components.
 */
export const householdService = {
  // Create household (legacy signature: name, ownerId, settings?)
  async createHousehold(name: string, ownerId?: string, settings?: any) {
    // If ownerId not provided, use current auth user
    const user = authService.getCurrentUser()
    const creatorId = ownerId || user?.id
    if (!creatorId) throw new Error('Not authenticated')
    return firebaseHouseholdService.createHousehold(name, creatorId)
  },

  async getUserHouseholds(userId: string) {
    return firebaseHouseholdService.getUserHouseholds(userId)
  },

  async getHousehold(householdId: string) {
    return firebaseHouseholdService.getHouseholdById(householdId)
  },

  // List members as [{ userId, user }]
  async listHouseholdMembers(householdId: string) {
    const household = await firebaseHouseholdService.getHouseholdById(householdId)
    const memberIds: string[] = (household?.members as any) || []
    const results = await Promise.all(memberIds.map(async id => {
      try {
        const snap = await getDoc(doc(db, 'users', id))
        return { userId: id, user: snap.exists() ? { id: snap.id, ...(snap.data() as any) } : { id } }
      } catch (e) {
        return { userId: id, user: { id } }
      }
    }))
    return results
  },

  async addMember(householdId: string, userId: string) {
    return firebaseHouseholdService.addMemberToHousehold(householdId, userId)
  },

  async removeMember(householdId: string, userId: string, removedBy?: string) {
    return firebaseHouseholdService.removeMemberFromHousehold(householdId, userId)
  },

  // Update a member role stored in a map `memberRoles` on household (legacy behavior)
  // Update a member role stored in a map `memberRoles` on household (legacy behavior)
  // If newRole is null or empty string, the role will be removed using deleteField().
  async updateMemberRole(householdId: string, memberId: string, newRole: string | null, updatedBy?: string) {
    const householdRef = doc(db, 'households', householdId)
    const field = `memberRoles.${memberId}`
    if (newRole === null || newRole === '') {
      await updateDoc(householdRef, { [field]: deleteField(), updatedAt: serverTimestamp() })
    } else {
      await updateDoc(householdRef, { [field]: newRole, updatedAt: serverTimestamp() })
    }
  },

  async updateHousehold(householdId: string, updates: any) {
    // Ensure audit fields are present for general updates from client
    const user = authService.getCurrentUser()
    const withAudit = {
      ...updates,
      updatedAt: serverTimestamp(),
      ...(user ? { updatedBy: user.id } : {})
    }
    return firebaseHouseholdService.updateHousehold(householdId, withAudit)
  },

  // Invite generation (legacy createInvite signature used by UI)
  async createInvite(opts: { householdId: string; createdBy?: string; expiresInHours?: number; maxUses?: number }) {
    const { householdId, createdBy, expiresInHours = 168, maxUses = 1 } = opts
    const user = authService.getCurrentUser()
    const creator = createdBy || user?.id
    if (!creator) throw new Error('Not authenticated')

    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
    const docRef = await addDoc(collection(db, 'invitations'), {
      householdId,
      inviterUid: creator,
      code,
      maxUses,
      uses: 0,
      status: 'pending',
      createdAt: serverTimestamp(),
      expiresAt
    })

    const link = `${window.location.origin}/convite/${code}`
    return { id: docRef.id, code, link }
  },

  // Advanced invite creation with role and approval settings
  async createAdvancedInvite(opts: { 
    householdId: string; 
    createdBy?: string; 
    expiresInHours?: number; 
    maxUses?: number;
    requestedRole?: 'member' | 'admin';
    requiresApproval?: boolean;
  }) {
    const { 
      householdId, 
      createdBy, 
      expiresInHours = 168, 
      maxUses = 1,
      requestedRole = 'member',
      requiresApproval = false
    } = opts
    
    const user = authService.getCurrentUser()
    const creator = createdBy || user?.id
    if (!creator) throw new Error('Not authenticated')

    // Validate permissions for admin invites
    if (requestedRole === 'admin') {
      const household = await this.getHousehold(householdId)
      if (!household) throw new Error('Casa não encontrada')
      
      const isOwner = (household as any).ownerId === creator
      const memberRole = (household as any).memberRoles?.[creator]
      
      if (!isOwner && memberRole !== 'admin') {
        throw new Error('Apenas proprietários ou administradores podem convidar outros administradores')
      }
    }

    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
    
    const docRef = await addDoc(collection(db, 'invitations'), {
      householdId,
      inviterUid: creator,
      code,
      maxUses,
      uses: 0,
      status: 'pending',
      requestedRole,
      requiresApproval: requiresApproval || requestedRole === 'admin', // Admin invites always require approval
      createdAt: serverTimestamp(),
      expiresAt
    })

    const link = `${window.location.origin}/convite/${code}`
    return { id: docRef.id, code, link }
  },

  // Accept invite by code
  async acceptInvite(code: string, userId?: string) {
    const user = authService.getCurrentUser()
    const uid = userId || user?.id
    if (!uid) throw new Error('Not authenticated')

    // find invitation by code and pending
    const q = query(collection(db, 'invitations'), where('code', '==', code), where('status', '==', 'pending'))
    const snaps = await getDocs(q)
    if (snaps.empty) throw new Error('Invite not found')
    const inviteDoc = snaps.docs[0]
    const invite = inviteDoc.data() as any

    // Check if invite requires approval
    if (invite.requiresApproval) {
      // Create join request for approval
      const userDoc = await getDoc(doc(db, 'users', uid))
      const userData = userDoc.exists() ? userDoc.data() : {}
      
      await addDoc(collection(db, 'joinRequests'), {
        householdId: invite.householdId,
        userId: uid,
        userName: userData.displayName || userData.name || 'Usuário',
        userEmail: userData.email || '',
        requestedRole: invite.requestedRole || 'member',
        inviteCode: code,
        status: 'pending',
        createdAt: serverTimestamp()
      })

      // Update invite status to indicate it was used for request
      const inviteRef = doc(db, 'invitations', inviteDoc.id)
      await updateDoc(inviteRef, { 
        uses: invite.uses + 1,
        status: invite.uses + 1 >= invite.maxUses ? 'used' : 'pending'
      })

      return { 
        ok: true, 
        requiresApproval: true,
        message: 'Solicitação enviada para aprovação dos administradores'
      }
    }

    // Direct acceptance for non-approval invites
    const batch = writeBatch(db)
    const inviteRef = doc(db, 'invitations', inviteDoc.id)
    batch.update(inviteRef, { 
      status: 'accepted', 
      providedCode: code, 
      acceptorUid: uid, 
      acceptedAt: serverTimestamp(),
      uses: invite.uses + 1
    })

    const householdRef = doc(db, 'households', invite.householdId)
    const userUid = authService.getCurrentUser()?.id || null
    batch.update(householdRef, { 
      members: arrayUnion(uid), 
      updatedAt: serverTimestamp(), 
      updatedBy: userUid 
    })

    // Set role if specified
    if (invite.requestedRole === 'admin') {
      batch.update(householdRef, { 
        [`memberRoles.${uid}`]: 'admin'
      })
    }

    const userRef = doc(db, 'users', uid)
    batch.set(userRef, { households: arrayUnion(invite.householdId) }, { merge: true })

    await batch.commit()
    return { ok: true, requiresApproval: false }
  },

  // Listar convites ativos para uma household
  async listInvites(householdId: string) {
    const q = query(collection(db, 'invitations'), where('householdId', '==', householdId))
    const snaps = await getDocs(q)
    return snaps.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }))
  },

  // Revogar convite (marca status como 'revoked')
  async revokeInvite(inviteId: string) {
    const inviteRef = doc(db, 'invitations', inviteId)
    await updateDoc(inviteRef, { status: 'revoked', updatedAt: serverTimestamp() })
  },

  // Get pending join requests for approval
  async getPendingJoinRequests(householdId: string) {
    const q = query(
      collection(db, 'joinRequests'), 
      where('householdId', '==', householdId),
      where('status', '==', 'pending')
    )
    const snaps = await getDocs(q)
    return snaps.docs.map(doc => ({ 
      id: doc.id, 
      ...(doc.data() as any),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    }))
  },

  // Approve join request
  async approveJoinRequest(householdId: string, requestId: string, userId: string, requestedRole: string) {
    const batch = writeBatch(db)
    
    // Update request status
    const requestRef = doc(db, 'joinRequests', requestId)
    batch.update(requestRef, { 
      status: 'approved', 
      approvedAt: serverTimestamp(),
      approvedBy: authService.getCurrentUser()?.id
    })

    // Add user to household
    const householdRef = doc(db, 'households', householdId)
    batch.update(householdRef, { 
      members: arrayUnion(userId), 
      updatedAt: serverTimestamp() 
    })

    // Set role if admin
    if (requestedRole === 'admin') {
      batch.update(householdRef, { 
        [`memberRoles.${userId}`]: 'admin'
      })
    }

    // Update user's households
    const userRef = doc(db, 'users', userId)
    batch.set(userRef, { households: arrayUnion(householdId) }, { merge: true })

    await batch.commit()
  },

  // Reject join request
  async rejectJoinRequest(requestId: string) {
    const requestRef = doc(db, 'joinRequests', requestId)
    await updateDoc(requestRef, { 
      status: 'rejected', 
      rejectedAt: serverTimestamp(),
      rejectedBy: authService.getCurrentUser()?.id
    })
  },

  // Validate invite code
  async validateInvite(code: string): Promise<{
    valid: boolean;
    householdId?: string;
    error?: string;
  }> {
    try {
      if (!code || code.trim() === '') {
        return { valid: false, error: 'Código não fornecido' }
      }

      const normalizedCode = code.toUpperCase().trim()
      const q = query(collection(db, 'invitations'), where('code', '==', normalizedCode))
      const snapshot = await getDocs(q)

      if (snapshot.empty) {
        return { valid: false, error: 'Código inválido ou não encontrado' }
      }

      const invite = snapshot.docs[0].data() as any

      if (!invite.householdId) {
        return { valid: false, error: 'Convite mal formado' }
      }

      // Verificar expiração
      if (invite.expiresAt) {
        const expirationDate = invite.expiresAt.toDate ? invite.expiresAt.toDate() : new Date(invite.expiresAt)
        if (expirationDate < new Date()) {
          return { valid: false, error: 'Convite expirado' }
        }
      }

      // Verificar status
      if (invite.status && invite.status !== 'pending') {
        return { valid: false, error: 'Convite não está mais disponível' }
      }

      // Verificar usos
      const uses = invite.uses || 0
      const maxUses = invite.maxUses || 1
      if (uses >= maxUses) {
        return { valid: false, error: 'Convite já foi totalmente utilizado' }
      }

      return {
        valid: true,
        householdId: invite.householdId
      }
    } catch (error) {
      console.error('Erro na validação do convite:', error)
      return {
        valid: false,
        error: `Erro interno na validação: ${error}`
      }
    }
  },

  // Get invite information for display
  async getInviteInfo(code: string) {
    const q = query(collection(db, 'invitations'), where('code', '==', code))
    const snaps = await getDocs(q)
    if (snaps.empty) throw new Error('Convite não encontrado')
    
    const inviteDoc = snaps.docs[0]
    const invite = inviteDoc.data() as any
    
    // Get household info
    const householdDoc = await getDoc(doc(db, 'households', invite.householdId))
    if (!householdDoc.exists()) throw new Error('Casa não encontrada')
    const household = householdDoc.data()
    
    // Get inviter info
    const inviterDoc = await getDoc(doc(db, 'users', invite.inviterUid))
    const inviter = inviterDoc.exists() ? inviterDoc.data() : {}
    
    const expiresAt = invite.expiresAt?.toDate?.() || new Date(invite.expiresAt)
    const isExpired = expiresAt < new Date()
    const isUsedUp = invite.uses >= invite.maxUses
    const isValid = invite.status === 'pending' && !isExpired && !isUsedUp
    
    return {
      id: inviteDoc.id,
      code: invite.code,
      householdId: invite.householdId,
      householdName: household.name || 'Casa',
      inviterName: inviter.displayName || inviter.name || 'Usuário',
      requestedRole: invite.requestedRole || 'member',
      requiresApproval: invite.requiresApproval || false,
      maxUses: invite.maxUses,
      uses: invite.uses,
      status: invite.status,
      expiresAt,
      isExpired,
      isValid
    }
  },

  // Create join request (reverse flow - user requests to join)
  async createJoinRequest(opts: {
    householdName: string;
    requestedRole: 'member' | 'admin';
    message?: string;
    requesterUid: string;
    requesterName: string;
    requesterEmail: string;
  }) {
    const { householdName, requestedRole, message, requesterUid, requesterName, requesterEmail } = opts
    
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    
    const docRef = await addDoc(collection(db, 'joinRequests'), {
      type: 'external', // To differentiate from invite-based requests
      code,
      householdName,
      requestedRole,
      message: message || '',
      requesterUid,
      requesterName,
      requesterEmail,
      status: 'pending',
      createdAt: serverTimestamp(),
      expiresAt
    })

    return { id: docRef.id, code }
  },

  // Process join request by code (admin uses this)
  async processJoinRequestByCode(code: string, action: 'approve' | 'reject', householdId?: string) {
    const user = authService.getCurrentUser()
    if (!user) throw new Error('Not authenticated')

    // Find request by code
    const q = query(collection(db, 'joinRequests'), where('code', '==', code), where('status', '==', 'pending'))
    const snaps = await getDocs(q)
    if (snaps.empty) throw new Error('Solicitação não encontrada ou já processada')

    const requestDoc = snaps.docs[0]
    const request = requestDoc.data() as any

    if (action === 'reject') {
      await updateDoc(doc(db, 'joinRequests', requestDoc.id), {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        rejectedBy: user.id
      })
      return { success: true, action: 'rejected' }
    }

    // Approve action
    if (!householdId) {
      throw new Error('ID da casa é obrigatório para aprovação')
    }

    // Validate admin permissions
    const household = await this.getHousehold(householdId)
    if (!household) throw new Error('Casa não encontrada')
    
    const isOwner = (household as any).ownerId === user.id
    const memberRole = (household as any).memberRoles?.[user.id]
    
    if (!isOwner && memberRole !== 'admin') {
      throw new Error('Apenas proprietários ou administradores podem aprovar solicitações')
    }

    // Process approval
    const batch = writeBatch(db)
    
    // Update request
    const requestRef = doc(db, 'joinRequests', requestDoc.id)
    batch.update(requestRef, {
      status: 'approved',
      approvedAt: serverTimestamp(),
      approvedBy: user.id,
      assignedHouseholdId: householdId
    })

    // Add user to household
    const householdRef = doc(db, 'households', householdId)
    batch.update(householdRef, {
      members: arrayUnion(request.requesterUid),
      updatedAt: serverTimestamp()
    })

    // Set role if admin
    if (request.requestedRole === 'admin') {
      batch.update(householdRef, {
        [`memberRoles.${request.requesterUid}`]: 'admin'
      })
    }

    // Update user's households
    const userRef = doc(db, 'users', request.requesterUid)
    batch.set(userRef, { households: arrayUnion(householdId) }, { merge: true })

    await batch.commit()
    return { success: true, action: 'approved' }
  },

  // Get join request info by code (for admins to see what they're approving)
  async getJoinRequestInfo(code: string) {
    const q = query(collection(db, 'joinRequests'), where('code', '==', code))
    const snaps = await getDocs(q)
    if (snaps.empty) throw new Error('Solicitação não encontrada')
    
    const requestDoc = snaps.docs[0]
    const request = requestDoc.data() as any
    
    const expiresAt = request.expiresAt?.toDate?.() || new Date(request.expiresAt)
    const isExpired = expiresAt < new Date()
    const isValid = request.status === 'pending' && !isExpired
    
    return {
      id: requestDoc.id,
      code: request.code,
      householdName: request.householdName,
      requesterName: request.requesterName,
      requesterEmail: request.requesterEmail,
      requestedRole: request.requestedRole,
      message: request.message,
      status: request.status,
      createdAt: request.createdAt?.toDate?.() || new Date(),
      expiresAt,
      isExpired,
      isValid
    }
  },

  // Legacy helper names mapped to existing service
  async generateInviteCode(householdId: string, userId?: string) {
    return firebaseHouseholdService.generateInviteCode(householdId)
  },

  async joinByInviteCode(inviteCode: string, userId: string) {
    return firebaseHouseholdService.joinHouseholdByCode(inviteCode, userId)
  },

  // Expose some lower-level methods too
  async getHouseholdById(householdId: string) {
    return firebaseHouseholdService.getHouseholdById(householdId)
  }
}
