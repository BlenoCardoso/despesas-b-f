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
      console.log('💾 Criando despesa no Firestore:', expense);
      
      const expenseData = {
        ...expense,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        syncVersion: 1,
        // Garantir que deletedAt seja null explicitamente
        deletedAt: null,
        deletedBy: null
      };

      console.log('💾 Dados da despesa a serem salvos:', expenseData);
      
      const docRef = await addDoc(collection(db, 'expenses'), expenseData);
      console.log('✅ Despesa criada com ID:', docRef.id);
      
      return docRef.id;
    } catch (error) {
      console.error('❌ Erro ao criar despesa:', error);
      throw error;
    }
  }

  // Buscar despesas de uma household
  async getExpenses(householdId: string): Promise<Expense[]> {
    try {
      console.log('🔍 Buscando despesas para householdId:', householdId);
      
      // TESTE: Primeiro vamos tentar buscar TODAS as despesas sem filtro
      console.log('🧪 TESTE: Buscando TODAS as despesas da coleção para debug...');
      const allDocsQuery = query(collection(db, 'expenses'));
      const allSnapshot = await getDocs(allDocsQuery);
      console.log('📊 TODAS as despesas na coleção:', allSnapshot.size);
      
      allSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log('📄 Despesa encontrada:', {
          id: doc.id,
          householdId: data.householdId,
          description: data.description,
          amount: data.amount,
          deletedAt: data.deletedAt
        });
      });
      
      // Agora vamos tentar com filtro por household
      console.log('🔍 Agora filtrando por householdId:', householdId);
      const q = query(
        collection(db, 'expenses'),
        where('householdId', '==', householdId)
      );

      const querySnapshot = await getDocs(q);
      console.log('📊 Query com filtro executada, documentos encontrados:', querySnapshot.size);
      
      const expenses = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('📄 Documento filtrado:', doc.id, data);
        
        // Conversão segura de timestamps
        let createdAt: Date;
        let updatedAt: Date;
        
        try {
          if (data.createdAt && typeof data.createdAt.toDate === 'function') {
            createdAt = data.createdAt.toDate();
          } else if (data.createdAt && data.createdAt.seconds) {
            createdAt = new Date(data.createdAt.seconds * 1000);
          } else {
            createdAt = new Date();
          }
        } catch (error) {
          console.warn('⚠️ Erro ao converter createdAt:', error);
          createdAt = new Date();
        }
        
        try {
          if (data.updatedAt && typeof data.updatedAt.toDate === 'function') {
            updatedAt = data.updatedAt.toDate();
          } else if (data.updatedAt && data.updatedAt.seconds) {
            updatedAt = new Date(data.updatedAt.seconds * 1000);
          } else {
            updatedAt = new Date();
          }
        } catch (error) {
          console.warn('⚠️ Erro ao converter updatedAt:', error);
          updatedAt = new Date();
        }
        
        return {
          id: doc.id,
          ...data,
          createdAt,
          updatedAt
        };
      }) as Expense[];

      // Filtrar despesas não deletadas no lado do cliente por enquanto
      const activeExpenses = expenses.filter(expense => !expense.deletedAt);
      console.log('✅ Despesas ativas encontradas:', activeExpenses.length);
      
      return activeExpenses;
    } catch (error) {
      console.error('❌ Erro ao buscar despesas:', error);
      throw error;
    }
  }

  // Escutar mudanças em tempo real
  subscribeToExpenses(householdId: string, callback: (expenses: Expense[]) => void): () => void {
    console.log('🔄 Configurando listener filtrado para householdId:', householdId);
    try {
      // Função auxiliar para mapear snapshot => expenses
      const mapSnapshot = (snapshot: any): Expense[] => {
        const list = snapshot.docs.map((docSnap: any) => {
          const data = docSnap.data();
          let createdAt: Date;
            let updatedAt: Date;
            try {
              if (data.createdAt && typeof data.createdAt.toDate === 'function') createdAt = data.createdAt.toDate();
              else if (data.createdAt?.seconds) createdAt = new Date(data.createdAt.seconds * 1000);
              else createdAt = new Date();
            } catch { createdAt = new Date(); }
            try {
              if (data.updatedAt && typeof data.updatedAt.toDate === 'function') updatedAt = data.updatedAt.toDate();
              else if (data.updatedAt?.seconds) updatedAt = new Date(data.updatedAt.seconds * 1000);
              else updatedAt = new Date();
            } catch { updatedAt = new Date(); }
            return {
              id: docSnap.id,
              ...data,
              createdAt,
              updatedAt
            } as Expense;
        }).filter((e: Expense) => !e.deletedAt);
        // Garantir ordenação por createdAt desc mesmo no fallback
        return list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      };

      const baseQuery = query(
        collection(db, 'expenses'),
        where('householdId', '==', householdId),
        orderBy('createdAt', 'desc')
      );

      let activeUnsub: () => void = () => {};

      const startPrimaryListener = () => {
        activeUnsub = onSnapshot(baseQuery, (snapshot) => {
          console.log('📸 Snapshot despesas (filtrado) tamanho:', snapshot.size);
          callback(mapSnapshot(snapshot));
        }, (error) => {
          // Índice ausente => fallback sem orderBy
          if ((error as any).code === 'failed-precondition') {
            console.warn('⚠️ Índice faltando para (householdId + createdAt). Usando fallback sem orderBy. Crie o índice para melhor performance.');
            const fallbackQ = query(
              collection(db, 'expenses'),
              where('householdId', '==', householdId)
            );
            activeUnsub = onSnapshot(fallbackQ, (snap2) => {
              console.log('📸 Snapshot (fallback) tamanho:', snap2.size);
              callback(mapSnapshot(snap2));
            }, (err2) => {
              console.error('❌ Erro listener fallback despesas:', err2);
            });
          } else {
            console.error('❌ Erro listener despesas filtrado:', error);
          }
        });
      };

      startPrimaryListener();
      console.log('✅ Listener de despesas configurado (primário ou fallback)');
      return () => {
        try { activeUnsub && activeUnsub(); } catch {}
      };
    } catch (e) {
      console.error('❌ Erro ao configurar listener filtrado:', e);
      throw e;
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