import { describe, it, expect } from 'vitest'
import { BalanceCalculator, MonthlyBalanceReport } from '../types/balance'

// Mock types
const makeMember = (id: string) => ({ id, name: id })

describe('BalanceCalculator rounding', () => {
  it('distributes cents so total matches original', () => {
    const expenses: any[] = [ { id: 'e1', amount: 10.00, paidById: 'a' } ]
    const members = [ makeMember('a'), makeMember('b'), makeMember('c') ]

    const report: MonthlyBalanceReport = BalanceCalculator.calculateMonthlyBalance(expenses as any, members as any)

    const total = report.memberBalances.reduce((s, m) => s + m.share, 0)
    // Two decimals precision
    expect(Math.round(total * 100)).toBe(Math.round(report.totalExpenses * 100))
  // rounding adjustments should be integers and within reasonable bounds
  const sumAdjust = (report.roundingAdjustments || []).reduce((s, r) => s + r.cents, 0)
  expect(Number.isInteger(sumAdjust)).toBe(true)
  // the total cents redistributed should be no larger than number of members
  expect(Math.abs(sumAdjust)).toBeLessThanOrEqual(3)
  })

  it('handles 10.00 split among 3 -> sums correctly and indicates who got extra cent', () => {
    const expenses: any[] = [ { id: 'e1', amount: 10.00, paidById: 'a' } ]
    const members = [ makeMember('a'), makeMember('b'), makeMember('c') ]

    const report = BalanceCalculator.calculateMonthlyBalance(expenses as any, members as any)

    // Expect each share to be rounded to cents and total to match
    const shares = report.memberBalances.map(m => Math.round(m.share * 100))
    expect(shares.reduce((s, x) => s + x, 0)).toBe(Math.round(report.totalExpenses * 100))

    // Exactly one or more members may get +1 cent depending on residues
    const positive = (report.roundingAdjustments || []).filter(r => r.cents > 0)
    expect(positive.length).toBeGreaterThanOrEqual(1)
  })
})
