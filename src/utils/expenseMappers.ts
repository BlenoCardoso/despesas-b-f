// Componente temporário para transpor entre Firebase Schema e tipos locais
import type { Expense as FirebaseExpense } from '../types/firebase-schema';
import type { Expense as LocalExpense } from '../features/expenses/types';

export function mapFirebaseToLocalExpense(firebaseExpense: FirebaseExpense): LocalExpense {
  return {
    id: firebaseExpense.id,
    householdId: firebaseExpense.householdId,
    userId: firebaseExpense.createdBy,
    title: firebaseExpense.description,
    amount: firebaseExpense.amount,
    currency: 'BRL', // Valor padrão
    categoryId: firebaseExpense.category,
    paymentMethod: firebaseExpense.paymentMethod as any,
    date: firebaseExpense.createdAt,
    notes: firebaseExpense.tags?.join(', '),
    attachments: firebaseExpense.attachments || [],
    createdAt: firebaseExpense.createdAt,
    updatedAt: firebaseExpense.updatedAt || firebaseExpense.createdAt,
    deletedAt: firebaseExpense.deletedAt,
    syncVersion: firebaseExpense.syncVersion
  } as LocalExpense;
}

export function mapLocalToFirebaseExpense(localExpense: Partial<LocalExpense>, householdId: string, userId: string): Omit<FirebaseExpense, 'id' | 'createdAt' | 'syncVersion'> {
  return {
    householdId,
    amount: localExpense.amount || 0,
    description: localExpense.title || '',
    category: localExpense.categoryId || '',
    paymentMethod: localExpense.paymentMethod || 'money',
    createdBy: userId,
    updatedAt: new Date(),
    tags: localExpense.notes ? [localExpense.notes] : [],
    attachments: localExpense.attachments || []
  };
}