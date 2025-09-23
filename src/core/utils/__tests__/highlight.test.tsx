import { render } from '@testing-library/react'
import { highlightText } from '../highlight'
import React from 'react'

describe('highlightText', () => {
  it('returns original text when query empty', () => {
    const node = highlightText('Hello world', '')
    const { container } = render(React.createElement(() => node as any))
    expect(container.textContent).toBe('Hello world')
  })

  it('highlights matching term case-insensitive and escapes regex', () => {
    const node = highlightText('Price (USD) $5', '(usd)')
    const { container } = render(React.createElement(() => node as any))
    expect(container.querySelectorAll('mark').length).toBe(1)
    expect(container.textContent).toContain('Price (USD) $5')
  })
})
