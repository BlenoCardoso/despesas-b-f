import Dexie, { Table } from 'dexie'
import type { 
  User, 
  Household,
  Member,
  Expense,
  Category
} from '@/types'

export class AppDB extends Dexie {
  users!: Table<User>
  households!: Table<Household>
  members!: Table<Member>
  expenses!: Table<Expense>
  categories!: Table<Category>

  constructor() {
    super('householdDB')

    this.version(1).stores({
      users: 'id, email',
      households: 'id, ownerId',
      members: '[householdId+userId], householdId, userId',
      expenses: 'id, householdId, date, categoryId, paidById',
      categories: 'id, householdId'
    })
  }
}

export const db = new AppDB()