import { formatCurrency, parseCurrency } from '@/core/utils/formatters'

describe('formatters', () => {
  test('formatCurrency and parseCurrency roundtrip', () => {
    const numbers = [0, 0.5, 1, 12.34, 1234.56, 1000000.99]
    for (const n of numbers) {
      const fmt = formatCurrency(n)
      const parsed = parseCurrency(fmt)
      // allow minor floating point diffs
      expect(parsed).toBeCloseTo(n, 2)
    }
  })

  test('parseCurrency handles various inputs', () => {
    expect(parseCurrency('R$ 1.234,56')).toBeCloseTo(1234.56, 2)
    expect(parseCurrency('1234.56')).toBeCloseTo(1234.56, 2)
    expect(parseCurrency('1.234,56')).toBeCloseTo(1234.56, 2)
    expect(parseCurrency('')).toBe(0)
    expect(parseCurrency('R$ 0,50')).toBeCloseTo(0.5, 2)
  })
})
