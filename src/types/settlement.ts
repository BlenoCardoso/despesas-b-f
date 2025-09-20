export interface Settlement {
  id: string
  householdId: string
  month: string // YYYY-MM
  completedAt: Date | null
  amounts: Record<string, {
    paid: number
    owed: number
    balance: number
    transfers: Array<{
      to: string
      amount: number
    }>
  }>
}

export interface Transfer {
  from: string
  to: string
  amount: number
}