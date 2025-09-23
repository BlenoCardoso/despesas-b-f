import { describe, it, expect } from 'vitest'
import { ExpenseForm } from '../src/features/expenses/components/ExpenseForm'

describe('debug', () => {
  it('ExpenseForm is defined', () => {
    expect(typeof ExpenseForm).toBe('function')
  })
})
