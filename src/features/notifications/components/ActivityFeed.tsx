import { useEffect, useState } from 'react'
import { notificationService } from '../services/notificationService'
import { format } from 'date-fns'
import { db } from '@/core/db/database'
import { getUserDisplayName } from '@/core/types/user'
import { formatCurrency } from '@/core/utils/formatters'

interface ActivityItem {
  id: string
  title: string
  subtitle?: string
  time: string
}

async function resolveUserName(userId?: string) {
  if (!userId) return 'Alguém'
  try {
    const u = await db.users.get(userId)
    if (u) return getUserDisplayName(u)
  } catch (e) {
    // ignore
  }
  return userId
}

function formatParticipants(participantIds?: string[]) {
  if (!participantIds || participantIds.length === 0) return ''
  return participantIds.join(', ')
}

export function ActivityFeed({ householdId }: { householdId: string }) {
  const [items, setItems] = useState<ActivityItem[]>([])

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        const notifications = await notificationService.getNotifications(householdId, { filter: { types: ['system_update'], entityTypes: ['expense'] }, sortBy: 'createdAt', sortOrder: 'desc', limit: 50 })

        if (!mounted) return

        const mapped: ActivityItem[] = []
        for (const n of notifications) {
          const time = n.createdAt ? format(new Date(n.createdAt), 'HH:mm dd/MM') : ''
          const actor = await resolveUserName(n.userId)

          // Try to read structured data if available
          const data = (n as any).data || {}
          const amount = data.amount || (data.expense && data.expense.amount) || undefined
          const paidById = data.paidById || (data.expense && data.expense.paidById)
          const participantIds: string[] | undefined = data.participantIds || (data.expense && data.expense.participantIds) || undefined
          const changes = data.changes || undefined

          let title = ''
          let subtitle: string | undefined = undefined

          // Heuristics based on notification title/message
          if (/criad|criou/i.test(n.title || n.message || '')) {
            title = `${actor} criou uma despesa`
          } else if (/atualiz|atualizad|atualizou|atualiza/i.test(n.title || n.message || '')) {
            title = `${actor} atualizou uma despesa`
          } else if (/exclu/i.test(n.title || n.message || '')) {
            title = `${actor} excluiu uma despesa`
          } else {
            title = `${actor} atualizou o sistema`
          }

          if (amount !== undefined) {
            try {
              subtitle = `${formatCurrency(Number(amount))}`
            } catch (e) {
              subtitle = `${amount}`
            }
          }

          if (paidById) {
            const payer = await resolveUserName(paidById)
            subtitle = subtitle ? `${subtitle} • Pago por ${payer}` : `Pago por ${payer}`
          }

          if (participantIds && participantIds.length > 0) {
            const participants = formatParticipants(participantIds)
            subtitle = subtitle ? `${subtitle} • Participantes: ${participants}` : `Participantes: ${participants}`
          }

          if (changes && typeof changes === 'object') {
            const changedKeys = Object.keys(changes).slice(0, 3)
            if (changedKeys.length > 0) {
              const diffs = changedKeys.map(k => `${k}: ${changes[k].old ?? '—'} → ${changes[k].new ?? '—'}`)
              subtitle = subtitle ? `${subtitle} • ${diffs.join('; ')}` : diffs.join('; ')
            }
          }

          mapped.push({ id: n.id, title, subtitle, time })
        }

        if (!mounted) return
        setItems(mapped)
      } catch (e) {
        console.warn('Failed to load activity feed', e)
      }
    }

    load()

    // Subscribe to DB notification changes to provide live updates
    try {
  const onCreate = (_primKey: any, _obj: any, _trans: any) => { if (mounted) load() }
  const onUpdate = (_modifications: any, _primKey: any, _obj: any, _trans: any) => { if (mounted) load() }
  const onDelete = (_primKey: any, _obj: any, _trans: any) => { if (mounted) load() }

      // Attach hooks if supported
      if (db && db.notifications && (db.notifications as any).hook) {
        ;(db.notifications as any).hook('creating', onCreate)
        ;(db.notifications as any).hook('updating', onUpdate)
        ;(db.notifications as any).hook('deleting', onDelete)
      }

      return () => {
        mounted = false
        try {
          if (db && db.notifications && (db.notifications as any).hook) {
            ;(db.notifications as any).hook('creating').unsubscribe?.()
            ;(db.notifications as any).hook('updating').unsubscribe?.()
            ;(db.notifications as any).hook('deleting').unsubscribe?.()
          }
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      return () => { mounted = false }
    }
  }, [householdId])

  return (
    <div className="space-y-2">
      {items.length === 0 && <div className="text-sm text-muted-foreground">Nenhuma atividade recente</div>}
      {items.map(item => (
        <div key={item.id} className="p-3 border rounded">
          <div className="flex justify-between">
            <div className="text-sm font-medium">{item.title}</div>
            <div className="text-xs text-muted-foreground">{item.time}</div>
          </div>
          {item.subtitle && <div className="text-xs text-muted-foreground mt-1">{item.subtitle}</div>}
        </div>
      ))}
    </div>
  )
}

export default ActivityFeed
