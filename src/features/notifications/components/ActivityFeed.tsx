import React, { useEffect, useState } from 'react'
import { notificationService } from '../services/notificationService'
import type { Notification } from '../types'
import { format } from 'date-fns'

interface ActivityItem {
  id: string
  text: string
  time: string
}

export function ActivityFeed({ householdId }: { householdId: string }) {
  const [items, setItems] = useState<ActivityItem[]>([])

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        const notifications = await notificationService.getNotifications(householdId, { filter: { types: ['system_update'], entityTypes: ['expense'] }, sortBy: 'createdAt', sortOrder: 'desc', limit: 20 })

        if (!mounted) return

        const mapped = notifications.map((n: Notification) => {
          const time = n.createdAt ? format(new Date(n.createdAt), 'HH:mm') : ''
          let verb = 'atualizou'
          if (/criad/i.test(n.title) || /criou/i.test(n.message || '')) verb = 'criou'
          if (/exclu/i.test(n.title) || /exclu/i.test(n.message || '')) verb = 'excluiu'
          const entity = n.entityId ? `despesa ${n.entityId}` : 'uma despesa'
          const text = `${n.userId || 'Alguém'} ${verb} ${entity}`
          return { id: n.id, text, time }
        })

        setItems(mapped)
      } catch (e) {
        console.warn('Failed to load activity feed', e)
      }
    }

    load()

    // no live updates for now
    return () => { mounted = false }
  }, [householdId])

  return (
    <div className="space-y-2">
      {items.length === 0 && <div className="text-sm text-muted-foreground">Nenhuma atividade recente</div>}
      {items.map(item => (
        <div key={item.id} className="flex justify-between items-center p-2 border rounded">
          <div className="text-sm">{item.text}</div>
          <div className="text-xs text-muted-foreground">{item.time}</div>
        </div>
      ))}
    </div>
  )
}

export default ActivityFeed
