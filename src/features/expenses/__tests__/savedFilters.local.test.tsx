import { describe, it, expect, beforeEach } from 'vitest'

const key = 'saved-expense-filters:test-household'

beforeEach(() => {
  localStorage.clear()
})

describe('saved-filters localStorage', () => {
  it('saves and loads filter entries', () => {
    const entry = { id: '1', name: 'Test', filters: { activeFilters: ['today'] }, search: 'market' }
    localStorage.setItem(key, JSON.stringify([entry]))

    const raw = localStorage.getItem(key)
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!)
    expect(parsed[0].id).toBe('1')
    expect(parsed[0].filters.activeFilters[0]).toBe('today')
  })
})
