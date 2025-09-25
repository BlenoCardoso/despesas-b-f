import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import ExpenseForm from '@/features/expenses/components/ExpenseForm'

describe('ExpenseForm', () => {
  test('typing value formats and submit yields numeric amount', async () => {
    const onSubmit = vi.fn()
  render(<ExpenseForm categories={[{ id: 'c1', name: 'Cat' }]} onSubmit={onSubmit} initialData={{ title: 'Test', date: new Date().toISOString().slice(0,10) }} />)

  const input = screen.getByLabelText(/Valor/i) as HTMLInputElement
    // type '123456' which should be interpreted as 1.234,56 (BRL)
    fireEvent.change(input, { target: { value: '123456' } })

    // after change the input should show a formatted value
    expect(input.value).toMatch(/\d/) // has digits; format may include currency symbol

    // submit the form
    const btn = screen.getByRole('button', { name: /Salvar/i })
    fireEvent.click(btn)

    // onSubmit should be called with an object containing amount as number
    expect(onSubmit).toHaveBeenCalled()
    const arg = onSubmit.mock.calls[0][0]
    expect(typeof arg.amount).toBe('number')
    expect(arg.amount).toBeGreaterThan(0)
  })
})
