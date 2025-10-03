import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query, 
  where, 
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import { authService } from './authService'

export interface Expense {
  id: string
  householdId: string
  title: string
  amount: number
  category: string
  date: Date
  createdBy: string
  createdAt: Date
  updatedAt: Date
  notes?: string
  participants: string[] // IDs dos participantes
  paymentMethod: 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix' | 'transferencia'
  paid: boolean
  paidBy?: string
  paidAt?: Date
  sharedPercentages: Record<string, number> // userId -> percentage (0-100)
}

export interface ExpenseFormData {
  title: string
  amount: number
  category: string
  date: Date
  notes?: string
  paymentMethod: 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix' | 'transferencia'
  participants?: string[]
  sharedPercentages?: Record<string, number>
}

class ExpenseService {
  private static instance: ExpenseService
  
  static getInstance(): ExpenseService {
    if (!ExpenseService.instance) {
      ExpenseService.instance = new ExpenseService()
    }
    return ExpenseService.instance
  }

  // Criar despesa
  async createExpense(data: ExpenseFormData, householdId: string): Promise<Expense> {
    const user = authService.getCurrentUser()
    if (!user) throw new Error('Usuário não autenticado')

    // Se não especificou participantes, incluir apenas o criador
    const participants = data.participants || [user.id]
    
    // Se não especificou percentuais, dividir igualmente
    let sharedPercentages = data.sharedPercentages || {}
    if (Object.keys(sharedPercentages).length === 0) {
      const equalShare = 100 / participants.length
      participants.forEach(userId => {
        sharedPercentages[userId] = equalShare
      })
    }

    const expenseData = {
      householdId,
      title: data.title,
      amount: data.amount,
      category: data.category,
      date: Timestamp.fromDate(data.date),
      createdBy: user.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      notes: data.notes || '',
      participants,
      paymentMethod: data.paymentMethod,
      paid: false,
      sharedPercentages
    }

    const docRef = await addDoc(collection(db, 'expenses'), expenseData)
    
    return {
      id: docRef.id,
      ...expenseData,
      date: data.date,
      createdAt: new Date(),
      updatedAt: new Date()
    } as Expense
  }

  // Atualizar despesa
  async updateExpense(id: string, data: Partial<ExpenseFormData>): Promise<void> {
    const user = authService.getCurrentUser()
    if (!user) throw new Error('Usuário não autenticado')

    const updateData: any = {
      updatedAt: serverTimestamp()
    }

    if (data.title !== undefined) updateData.title = data.title
    if (data.amount !== undefined) updateData.amount = data.amount
    if (data.category !== undefined) updateData.category = data.category
    if (data.date !== undefined) updateData.date = Timestamp.fromDate(data.date)
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod
    if (data.participants !== undefined) updateData.participants = data.participants
    if (data.sharedPercentages !== undefined) updateData.sharedPercentages = data.sharedPercentages

    const docRef = doc(db, 'expenses', id)
    await updateDoc(docRef, updateData)
  }

  // Deletar despesa
  async deleteExpense(id: string): Promise<void> {
    const user = authService.getCurrentUser()
    if (!user) throw new Error('Usuário não autenticado')

    // Verificar se o usuário pode deletar (criador ou membro da household)
    const expense = await this.getExpense(id)
    if (!expense) throw new Error('Despesa não encontrada')

    const docRef = doc(db, 'expenses', id)
    await deleteDoc(docRef)
  }

  // Buscar despesa por ID
  async getExpense(id: string): Promise<Expense | null> {
    try {
      const docRef = doc(db, 'expenses', id)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data()
        return {
          id: docSnap.id,
          householdId: data.householdId,
          title: data.title,
          amount: data.amount,
          category: data.category,
          date: data.date.toDate(),
          createdBy: data.createdBy,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          notes: data.notes || '',
          participants: data.participants || [],
          paymentMethod: data.paymentMethod,
          paid: data.paid || false,
          paidBy: data.paidBy,
          paidAt: data.paidAt?.toDate(),
          sharedPercentages: data.sharedPercentages || {}
        }
      }
      return null
    } catch (error) {
      console.error('Erro ao buscar despesa:', error)
      return null
    }
  }

  // Listar despesas da household em tempo real
  subscribeToExpenses(
    householdId: string, 
    callback: (expenses: Expense[]) => void,
    limitCount = 50
  ): () => void {
    const q = query(
      collection(db, 'expenses'),
      where('householdId', '==', householdId),
      orderBy('date', 'desc'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    )

    return onSnapshot(q, (snapshot) => {
      const expenses = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          householdId: data.householdId,
          title: data.title,
          amount: data.amount,
          category: data.category,
          date: data.date.toDate(),
          createdBy: data.createdBy,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          notes: data.notes || '',
          participants: data.participants || [],
          paymentMethod: data.paymentMethod,
          paid: data.paid || false,
          paidBy: data.paidBy,
          paidAt: data.paidAt?.toDate(),
          sharedPercentages: data.sharedPercentages || {}
        }
      })
      callback(expenses)
    })
  }

  // Listar despesas com paginação
  async getExpenses(
    householdId: string, 
    limitCount = 20,
    lastDoc?: any
  ): Promise<{ expenses: Expense[], hasMore: boolean, lastDoc: any }> {
    try {
      let q = query(
        collection(db, 'expenses'),
        where('householdId', '==', householdId),
        orderBy('date', 'desc'),
        orderBy('createdAt', 'desc'),
        limit(limitCount + 1) // +1 para verificar se tem mais
      )

      if (lastDoc) {
        q = query(q, startAfter(lastDoc))
      }

      const querySnapshot = await getDocs(q)
      const docs = querySnapshot.docs
      const hasMore = docs.length > limitCount
      
      // Remover o documento extra usado para verificar hasMore
      if (hasMore) {
        docs.pop()
      }

      const expenses = docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          householdId: data.householdId,
          title: data.title,
          amount: data.amount,
          category: data.category,
          date: data.date.toDate(),
          createdBy: data.createdBy,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          notes: data.notes || '',
          participants: data.participants || [],
          paymentMethod: data.paymentMethod,
          paid: data.paid || false,
          paidBy: data.paidBy,
          paidAt: data.paidAt?.toDate(),
          sharedPercentages: data.sharedPercentages || {}
        }
      })

      return {
        expenses,
        hasMore,
        lastDoc: docs.length > 0 ? docs[docs.length - 1] : null
      }
    } catch (error) {
      console.error('Erro ao listar despesas:', error)
      return { expenses: [], hasMore: false, lastDoc: null }
    }
  }

  // Marcar despesa como paga
  async markAsPaid(id: string): Promise<void> {
    const user = authService.getCurrentUser()
    if (!user) throw new Error('Usuário não autenticado')

    const docRef = doc(db, 'expenses', id)
    await updateDoc(docRef, {
      paid: true,
      paidBy: user.id,
      paidAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  }

  // Marcar despesa como não paga
  async markAsUnpaid(id: string): Promise<void> {
    const user = authService.getCurrentUser()
    if (!user) throw new Error('Usuário não autenticado')

    const docRef = doc(db, 'expenses', id)
    await updateDoc(docRef, {
      paid: false,
      paidBy: null,
      paidAt: null,
      updatedAt: serverTimestamp()
    })
  }

  // Obter estatísticas da household
  async getHouseholdStats(householdId: string, startDate?: Date, endDate?: Date) {
    try {
      let q = query(
        collection(db, 'expenses'),
        where('householdId', '==', householdId)
      )

      if (startDate) {
        q = query(q, where('date', '>=', Timestamp.fromDate(startDate)))
      }
      if (endDate) {
        q = query(q, where('date', '<=', Timestamp.fromDate(endDate)))
      }

      const querySnapshot = await getDocs(q)
      const expenses = querySnapshot.docs.map(doc => doc.data())

      const total = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)
      const paid = expenses.filter(expense => expense.paid).reduce((sum, expense) => sum + (expense.amount || 0), 0)
      const pending = total - paid
      const count = expenses.length

      const byCategory = expenses.reduce((acc, expense) => {
        const category = expense.category || 'Outros'
        acc[category] = (acc[category] || 0) + expense.amount
        return acc
      }, {} as Record<string, number>)

      return {
        total,
        paid,
        pending,
        count,
        byCategory
      }
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error)
      return {
        total: 0,
        paid: 0,
        pending: 0,
        count: 0,
        byCategory: {}
      }
    }
  }
}

export const expenseService = ExpenseService.getInstance()