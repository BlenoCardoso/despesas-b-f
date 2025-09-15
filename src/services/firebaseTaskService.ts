import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Task } from '../types/firebase-schema';

export class FirebaseTaskService {
  private static instance: FirebaseTaskService;

  private constructor() {}

  static getInstance(): FirebaseTaskService {
    if (!FirebaseTaskService.instance) {
      FirebaseTaskService.instance = new FirebaseTaskService();
    }
    return FirebaseTaskService.instance;
  }

  // Criar tarefa
  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'syncVersion'>): Promise<string> {
    try {
      const taskData = {
        ...task,
        dueDate: task.dueDate ? Timestamp.fromDate(task.dueDate) : null,
        completedAt: task.completedAt ? Timestamp.fromDate(task.completedAt) : null,
        createdAt: serverTimestamp(),
        syncVersion: 1
      };

      const docRef = await addDoc(collection(db, 'tasks'), taskData);
      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      throw error;
    }
  }

  // Buscar tarefas por household
  async getTasks(householdId: string): Promise<Task[]> {
    try {
      const q = query(
        collection(db, 'tasks'),
        where('householdId', '==', householdId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        dueDate: doc.data().dueDate?.toDate() || null,
        completedAt: doc.data().completedAt?.toDate() || null
      })) as Task[];
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error);
      throw error;
    }
  }

  // Escutar mudanças em tempo real
  subscribeToTasks(householdId: string, callback: (tasks: Task[]) => void): () => void {
    try {
      const q = query(
        collection(db, 'tasks'),
        where('householdId', '==', householdId),
        orderBy('createdAt', 'desc')
      );

      return onSnapshot(q, (querySnapshot) => {
        const tasks = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          dueDate: doc.data().dueDate?.toDate() || null,
          completedAt: doc.data().completedAt?.toDate() || null
        })) as Task[];
        
        callback(tasks);
      });
    } catch (error) {
      console.error('Erro ao escutar tarefas:', error);
      throw error;
    }
  }

  // Atualizar tarefa
  async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      const updateData: any = {
        ...updates,
        syncVersion: (updates.syncVersion || 0) + 1
      };

      // Converter dates para Timestamps
      if (updates.dueDate !== undefined) {
        updateData.dueDate = updates.dueDate ? Timestamp.fromDate(updates.dueDate) : null;
      }
      
      if (updates.completedAt !== undefined) {
        updateData.completedAt = updates.completedAt ? Timestamp.fromDate(updates.completedAt) : null;
      }

      // Remove undefined fields
      Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

      await updateDoc(taskRef, updateData);
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      throw error;
    }
  }

  // Deletar tarefa
  async deleteTask(taskId: string): Promise<void> {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await deleteDoc(taskRef);
    } catch (error) {
      console.error('Erro ao deletar tarefa:', error);
      throw error;
    }
  }

  // Marcar tarefa como completa
  async completeTask(taskId: string, completedBy: string): Promise<void> {
    try {
      await this.updateTask(taskId, {
        isCompleted: true,
        completedAt: new Date(),
        completedBy
      });
    } catch (error) {
      console.error('Erro ao completar tarefa:', error);
      throw error;
    }
  }

  // Buscar tarefas por usuário atribuído
  async getTasksByAssignedUser(householdId: string, userId: string): Promise<Task[]> {
    try {
      const q = query(
        collection(db, 'tasks'),
        where('householdId', '==', householdId),
        where('assignedTo', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        dueDate: doc.data().dueDate?.toDate() || null,
        completedAt: doc.data().completedAt?.toDate() || null
      })) as Task[];
    } catch (error) {
      console.error('Erro ao buscar tarefas por usuário:', error);
      throw error;
    }
  }

  // Buscar tarefas pendentes (não completadas)
  async getPendingTasks(householdId: string): Promise<Task[]> {
    try {
      const q = query(
        collection(db, 'tasks'),
        where('householdId', '==', householdId),
        where('isCompleted', '==', false),
        orderBy('dueDate', 'asc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        dueDate: doc.data().dueDate?.toDate() || null,
        completedAt: doc.data().completedAt?.toDate() || null
      })) as Task[];
    } catch (error) {
      console.error('Erro ao buscar tarefas pendentes:', error);
      throw error;
    }
  }
}

export const firebaseTaskService = FirebaseTaskService.getInstance();