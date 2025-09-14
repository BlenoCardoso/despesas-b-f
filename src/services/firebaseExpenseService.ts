import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Expense } from '../types/firebase-schema';

export class FirebaseExpenseService {
  private static instance: FirebaseExpenseService;

  private constructor() {}

  static getInstance(): FirebaseExpenseService {
    if (!FirebaseExpenseService.instance) {
      FirebaseExpenseService.instance = new FirebaseExpenseService();
    }
    return FirebaseExpenseService.instance;
  }

  // Criar despesa
  async createExpense(expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'syncVersion'>): Promise<string> {
    try {
      const expenseData = {
        ...expense,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        syncVersion: 1
      };

      const docRef = await addDoc(collection(db, 'expenses'), expenseData);
      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar despesa:', error);
      throw error;
    }
  }

  // Buscar despesas de uma household
  async getExpenses(householdId: string): Promise<Expense[]> {
    try {
      const q = query(
        collection(db, 'expenses'),
        where('householdId', '==', householdId),
        where('deletedAt', '==', null),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Expense[];
    } catch (error) {
      console.error('Erro ao buscar despesas:', error);
      throw error;
    }
  }

  // Escutar mudanças em tempo real
  subscribeToExpenses(householdId: string, callback: (expenses: Expense[]) => void): () => void {
    try {
      const q = query(
        collection(db, 'expenses'),
        where('householdId', '==', householdId),
        where('deletedAt', '==', null),
        orderBy('createdAt', 'desc')
      );

      return onSnapshot(q, (querySnapshot) => {
        const expenses = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date()
        })) as Expense[];
        
        callback(expenses);
      });
    } catch (error) {
      console.error('Erro ao escutar despesas:', error);
      throw error;
    }
  }

  // Atualizar despesa
  async updateExpense(expenseId: string, updates: Partial<Expense>): Promise<void> {
    try {
      const expenseRef = doc(db, 'expenses', expenseId);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
        syncVersion: (updates.syncVersion || 0) + 1
      };

      await updateDoc(expenseRef, updateData);
    } catch (error) {
      console.error('Erro ao atualizar despesa:', error);
      throw error;
    }
  }

  // Deletar despesa (soft delete)
  async deleteExpense(expenseId: string, userId: string): Promise<void> {
    try {
      const expenseRef = doc(db, 'expenses', expenseId);
      await updateDoc(expenseRef, {
        deletedAt: serverTimestamp(),
        deletedBy: userId,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Erro ao deletar despesa:', error);
      throw error;
    }
  }

  // Buscar despesa por ID
  async getExpenseById(expenseId: string): Promise<Expense | null> {
    try {
      const expenseRef = doc(db, 'expenses', expenseId);
      const expenseDoc = await getDoc(expenseRef);
      
      if (expenseDoc.exists()) {
        const data = expenseDoc.data();
        return {
          id: expenseDoc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Expense;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar despesa por ID:', error);
      throw error;
    }
  }

  // Buscar despesas por categoria
  async getExpensesByCategory(householdId: string, category: string): Promise<Expense[]> {
    try {
      const q = query(
        collection(db, 'expenses'),
        where('householdId', '==', householdId),
        where('category', '==', category),
        where('deletedAt', '==', null),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Expense[];
    } catch (error) {
      console.error('Erro ao buscar despesas por categoria:', error);
      throw error;
    }
  }

  // Buscar despesas por período
  async getExpensesByDateRange(
    householdId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<Expense[]> {
    try {
      const q = query(
        collection(db, 'expenses'),
        where('householdId', '==', householdId),
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        where('createdAt', '<=', Timestamp.fromDate(endDate)),
        where('deletedAt', '==', null),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Expense[];
    } catch (error) {
      console.error('Erro ao buscar despesas por período:', error);
      throw error;
    }
  }
}

export const firebaseExpenseService = FirebaseExpenseService.getInstance();