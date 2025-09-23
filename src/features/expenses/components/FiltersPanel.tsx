import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

interface FiltersPanelProps {
  householdId: string
  searchText: string
  accountId?: string
  participantIds?: string[]
  onApply: (filters: { searchText?: string; accountId?: string; participantIds?: string[] }) => void
  onClear: () => void
}

export default function FiltersPanel({ householdId, searchText, accountId, participantIds, onApply, onClear }: FiltersPanelProps) {
  const [localSearch, setLocalSearch] = useState(searchText || '')
  const [localAccount, setLocalAccount] = useState(accountId || '')
  const [localParticipants, setLocalParticipants] = useState<string[]>(participantIds || [])
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    setLocalSearch(searchText || '')
    setLocalAccount(accountId || '')
    setLocalParticipants(participantIds || [])
  }, [searchText, accountId, participantIds])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { db } = await import('@/core/db/database')
        const list = (await db.accounts.toArray?.()) || []
        if (!mounted) return
        setAccounts(list.map((a: any) => ({ id: a.id, name: a.name })))
      } catch (e) {
        // ignore
      }
    })()
    return () => { mounted = false }
  }, [householdId])

  return (
    <div className="p-3 bg-white border rounded-lg shadow-sm">
      <div className="space-y-3">
        <Input placeholder="Buscar despesas..." value={localSearch} onChange={e => setLocalSearch(e.target.value)} />

        <div>
          <label className="text-sm text-muted-foreground block mb-1">Conta</label>
          <Select onValueChange={v => setLocalAccount(v)} defaultValue={localAccount}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas</SelectItem>
              {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* simple participants multi-select (fallback) */}
        <div>
          <label className="text-sm text-muted-foreground block mb-1">Participantes (selecione)</label>
          <div className="flex gap-2 flex-wrap">
            {/* Render small checkboxes by reading users from db */}
            <ParticipantsInlineSelector householdId={householdId} selected={localParticipants} onChange={setLocalParticipants} />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => onApply({ searchText: localSearch || undefined, accountId: localAccount || undefined, participantIds: localParticipants && localParticipants.length > 0 ? localParticipants : undefined })}>Aplicar</Button>
          <Button variant="ghost" onClick={() => { setLocalSearch(''); setLocalAccount(''); setLocalParticipants([]); onClear() }}>Limpar</Button>
        </div>
      </div>
    </div>
  )
}

function ParticipantsInlineSelector({ householdId, selected, onChange }: { householdId: string; selected: string[]; onChange: (s: string[]) => void }) {
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { db } = await import('@/core/db/database')
        const usersRaw = (await db.users.toArray?.()) || []
        if (!mounted) return
        setUsers(usersRaw.map((u: any) => ({ id: u.id, name: u.name || u.displayName || 'Usuário' })))
      } catch (e) {
        // ignore
      }
    })()
    return () => { mounted = false }
  }, [householdId])

  return (
    <>
      {users.map(u => (
        <label key={u.id} className="inline-flex items-center gap-2 px-2 py-1 rounded border text-sm cursor-pointer">
          <input type="checkbox" checked={selected.includes(u.id)} onChange={e => {
            const next = e.target.checked ? [...selected, u.id] : selected.filter(s => s !== u.id)
            onChange(next)
          }} />
          <span>{u.name}</span>
        </label>
      ))}
    </>
  )
}
