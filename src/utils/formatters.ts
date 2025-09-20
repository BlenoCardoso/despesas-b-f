export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

// Formata porcentagem (ex: 50 -> "50%")
export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`
}

// Formata data curta (ex: "12 de jan")
export function formatShortDate(date: Date): string {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'short'
  })
  return formatter.format(date)
}

// Formata número inteiro com separador de milhares
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value)
}