export const expenseRoutes = {
  root: 'expenses',
  list: (householdId?: string) => `${householdId ?? ':id'}/expenses`,
  add: (householdId?: string) => `${householdId ?? ':id'}/expenses/add`,
  edit: (householdId?: string, expenseId?: string) => `${householdId ?? ':id'}/expenses/${expenseId ?? ':expenseId'}/edit`,
  view: (householdId?: string, expenseId?: string) => `${householdId ?? ':id'}/expenses/${expenseId ?? ':expenseId'}`,
}