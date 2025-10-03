import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { householdService } from '../services/householdService'
import { Copy, Trash2 } from 'lucide-react'

interface InviteRecord {
  id: string
  code: string
  expiresAt?: string
  maxUses?: number
  uses?: number
  status?: string
}

export function InvitesManager({ householdId }: { householdId: string }) {
  const [invites, setInvites] = useState<InviteRecord[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const data = await householdService.listInvites(householdId)
      setInvites(data as InviteRecord[])
    } catch (e) {
      toast.error('Erro ao carregar convites')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (householdId) load() }, [householdId])

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copiado!')
    } catch (e) {
      toast.error('Erro ao copiar')
    }
  }

  const revoke = async (id: string) => {
    try {
      await householdService.revokeInvite(id)
      toast.success('Convite revogado')
      await load()
    } catch (e) {
      toast.error('Erro ao revogar')
    }
  }

  if (!householdId) return null

  return (
    <div className="mt-4 bg-white rounded-2xl p-4 border border-gray-100">
      <h4 className="font-semibold mb-2">Convites Ativos</h4>
      {loading ? (
        <div>Carregando...</div>
      ) : invites.length === 0 ? (
        <div className="text-sm text-gray-500">Nenhum convite ativo</div>
      ) : (
        <div className="space-y-3">
          {invites.map(inv => (
            <div key={inv.id} data-testid={`invite-row-${inv.code}`} className="flex items-center justify-between gap-2">
              <div className="flex-1">
                <div className="font-mono">{inv.code}</div>
                <div className="text-xs text-gray-500">
                  {inv.status ? `${inv.status} • ` : ''}
                  Expira: {inv.expiresAt ? new Date(inv.expiresAt).toLocaleString() : '—'} • Usos: {inv.uses ?? 0}/{inv.maxUses ?? 1}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button data-testid={`copy-invite-${inv.code}`} variant="outline" size="icon" onClick={() => copy(`${window.location.origin}/convite/${inv.code}`)}>
                  <Copy className="w-4 h-4" />
                </Button>
                <ConfirmDialog
                  title="Revogar convite"
                  description={`Tem certeza que deseja revogar o convite ${inv.code}? Usuários que ainda não usaram o código não poderão entrar.`}
                  confirmLabel="Revogar"
                  variant="destructive"
                  onConfirm={() => revoke(inv.id)}
                >
                  <Button data-testid={`revoke-invite-${inv.code}`} variant="destructive" size="icon">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </ConfirmDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default InvitesManager
