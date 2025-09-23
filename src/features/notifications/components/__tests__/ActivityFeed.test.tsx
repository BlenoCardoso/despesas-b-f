import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ActivityFeed } from '../ActivityFeed'
import { vi, describe, it, expect } from 'vitest'

// Mocks
vi.mock('@/features/notifications/services/notificationService', () => {
  return {
    notificationService: {
      getNotifications: vi.fn().mockImplementation(async (_householdId: string, _options: any) => {
        return [
          {
            id: 'n1',
            type: 'system_update',
            title: 'Despesa criada',
            message: 'Despesa criada',
            createdAt: new Date('2025-09-21T10:00:00Z'),
            userId: 'u1',
            data: { expense: { id: 'e1', title: 'Supermercado', amount: 34.0, paidById: 'u1', participantIds: ['u1','u2'] } }
          },
          {
            id: 'n2',
            type: 'system_update',
            title: 'Despesa atualizada',
            message: 'Despesa atualizada',
            createdAt: new Date('2025-09-21T11:00:00Z'),
            userId: 'u2',
            data: { expense: { id: 'e2', title: 'Internet', amount: 100.0, paidById: 'u2', participantIds: ['u2'] }, changes: { amount: { old: 90, new: 100 } } }
          }
        ]
      })
    }
  }
})

vi.mock('@/core/db/database', () => {
  return {
    db: {
      users: {
        get: vi.fn().mockImplementation(async (id: string) => {
          if (id === 'u1') return { id: 'u1', name: 'Breno', preferences: {}, createdAt: new Date(), updatedAt: new Date(), isActive: true }
          if (id === 'u2') return { id: 'u2', name: 'Ana', preferences: {}, createdAt: new Date(), updatedAt: new Date(), isActive: true }
          return null
        })
      }
    }
  }
})

describe('ActivityFeed', () => {
  it('renders notifications with actor name and amount', async () => {
    render(<ActivityFeed householdId="house1" />)

    await waitFor(() => {
      expect(screen.getByText(/Breno criou uma despesa/i)).toBeInTheDocument()
      expect(screen.getByText(/34\.?00|34,00|R\$ ?34,00/)).toBeInTheDocument()
      expect(screen.getByText(/Ana atualizou uma despesa/i)).toBeInTheDocument()
      expect(screen.getByText(/90 → 100/)).toBeInTheDocument()
    })
  })
})
