import React from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useCurrentHousehold, useCurrentUser } from '@/core/store'
import { useHouseholdMembers, useUpdateMemberRole } from '../hooks/useHouseholdMembers'

export function MembersManager({ householdId }: { householdId: string }) {
  const household = useCurrentHousehold()
  const currentUser = useCurrentUser()
  const { members } = useHouseholdMembers(householdId)
  const updateRoleMutation = useUpdateMemberRole(householdId)

  const isAdminOrOwner = (() => {
    if (!household || !currentUser) return false
    const member = (household as any).members?.find((m: any) => m.userId === currentUser.id)
    return (household as any).ownerId === currentUser.id || (household as any).memberRoles?.[currentUser.id] === 'admin' || member?.role === 'admin'
  })()

  const getRole = (uid: string) => {
    return (household as any)?.memberRoles?.[uid] || 'member'
  }

  const toggleAdmin = async (targetUid: string) => {
    try {
      const currentRole = getRole(targetUid)
      if (currentRole === 'admin') {
        // remove admin
        await updateRoleMutation.mutateAsync({ memberId: targetUid, newRole: null, updatedBy: currentUser?.id })
        toast.success('Admin removido')
      } else {
        // promote to admin
        await updateRoleMutation.mutateAsync({ memberId: targetUid, newRole: 'admin', updatedBy: currentUser?.id })
        toast.success('Promovido a admin')
      }
    } catch (err: any) {
      const msg = err?.message || String(err)
      toast.error(`Erro ao atualizar role: ${msg}`)
    }
  }

  if (!householdId) return null

  return (
    <div className="mt-4 bg-white rounded-2xl p-4 border border-gray-100">
      <h4 className="font-semibold mb-3">Membros</h4>
      <div className="space-y-3">
        {members.map(m => (
          <div key={m.userId} className="flex items-center justify-between">
            <div>
              <div className="font-medium">{m.user.displayName || m.user.name || m.user.id}</div>
              <div className="text-xs text-gray-500">{m.user.id}</div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="text-sm text-gray-600 mr-2">{getRole(m.userId)}</div>
              {isAdminOrOwner && (
                <Button size="sm" onClick={() => toggleAdmin(m.userId)}>
                  {getRole(m.userId) === 'admin' ? 'Remover admin' : 'Tornar admin'}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MembersManager
