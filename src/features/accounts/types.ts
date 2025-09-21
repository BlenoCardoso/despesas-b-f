export interface Account {
  id: string
  householdId: string
  name: string
  balance?: number
  currency?: string
  description?: string
  createdAt?: string
  updatedAt?: string
}

export interface TransferPayload {
  householdId: string
  fromAccountId: string
  toAccountId: string
  amount: number
  notes?: string
  createdBy?: string
}
