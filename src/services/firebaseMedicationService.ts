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

export interface Medication {
  id: string;
  householdId: string;
  name: string;
  dosage: string;
  frequency: string;
  instructions?: string;
  startDate: Date;
  endDate?: Date | null;
  isActive: boolean;
  assignedTo: string;
  prescribedBy?: string;
  notes?: string;
  reminders?: {
    enabled: boolean;
    times: string[];
  };
  createdBy: string;
  createdAt: Date;
  syncVersion: number;
}

export class FirebaseMedicationService {
  private static instance: FirebaseMedicationService;

  private constructor() {}

  static getInstance(): FirebaseMedicationService {
    if (!FirebaseMedicationService.instance) {
      FirebaseMedicationService.instance = new FirebaseMedicationService();
    }
    return FirebaseMedicationService.instance;
  }

  // Criar medicamento
  async createMedication(medication: Omit<Medication, 'id' | 'createdAt' | 'syncVersion'>): Promise<string> {
    try {
      const medicationData = {
        ...medication,
        startDate: Timestamp.fromDate(medication.startDate),
        endDate: medication.endDate ? Timestamp.fromDate(medication.endDate) : null,
        createdAt: serverTimestamp(),
        syncVersion: 1
      };

      const docRef = await addDoc(collection(db, 'medications'), medicationData);
      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar medicamento:', error);
      throw error;
    }
  }

  // Buscar medicamentos por household
  async getMedications(householdId: string): Promise<Medication[]> {
    try {
      const q = query(
        collection(db, 'medications'),
        where('householdId', '==', householdId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        startDate: doc.data().startDate?.toDate() || new Date(),
        endDate: doc.data().endDate?.toDate() || null
      })) as Medication[];
    } catch (error) {
      console.error('Erro ao buscar medicamentos:', error);
      throw error;
    }
  }

  // Buscar medicamentos ativos
  async getActiveMedications(householdId: string): Promise<Medication[]> {
    try {
      const q = query(
        collection(db, 'medications'),
        where('householdId', '==', householdId),
        where('isActive', '==', true),
        orderBy('startDate', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        startDate: doc.data().startDate?.toDate() || new Date(),
        endDate: doc.data().endDate?.toDate() || null
      })) as Medication[];
    } catch (error) {
      console.error('Erro ao buscar medicamentos ativos:', error);
      throw error;
    }
  }

  // Buscar medicamentos por usuário atribuído
  async getMedicationsByUser(householdId: string, userId: string): Promise<Medication[]> {
    try {
      const q = query(
        collection(db, 'medications'),
        where('householdId', '==', householdId),
        where('assignedTo', '==', userId),
        orderBy('startDate', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        startDate: doc.data().startDate?.toDate() || new Date(),
        endDate: doc.data().endDate?.toDate() || null
      })) as Medication[];
    } catch (error) {
      console.error('Erro ao buscar medicamentos por usuário:', error);
      throw error;
    }
  }

  // Escutar mudanças em tempo real
  subscribeToMedications(householdId: string, callback: (medications: Medication[]) => void): () => void {
    try {
      const q = query(
        collection(db, 'medications'),
        where('householdId', '==', householdId),
        orderBy('createdAt', 'desc')
      );

      return onSnapshot(q, (querySnapshot) => {
        const medications = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          startDate: doc.data().startDate?.toDate() || new Date(),
          endDate: doc.data().endDate?.toDate() || null
        })) as Medication[];
        
        callback(medications);
      });
    } catch (error) {
      console.error('Erro ao escutar medicamentos:', error);
      throw error;
    }
  }

  // Atualizar medicamento
  async updateMedication(medicationId: string, updates: Partial<Medication>): Promise<void> {
    try {
      const medicationRef = doc(db, 'medications', medicationId);
      const updateData: any = {
        ...updates,
        syncVersion: (updates.syncVersion || 0) + 1
      };

      // Converter dates para Timestamps
      if (updates.startDate !== undefined) {
        updateData.startDate = Timestamp.fromDate(updates.startDate);
      }
      
      if (updates.endDate !== undefined) {
        updateData.endDate = updates.endDate ? Timestamp.fromDate(updates.endDate) : null;
      }

      // Remove undefined fields
      Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

      await updateDoc(medicationRef, updateData);
    } catch (error) {
      console.error('Erro ao atualizar medicamento:', error);
      throw error;
    }
  }

  // Deletar medicamento
  async deleteMedication(medicationId: string): Promise<void> {
    try {
      const medicationRef = doc(db, 'medications', medicationId);
      await deleteDoc(medicationRef);
    } catch (error) {
      console.error('Erro ao deletar medicamento:', error);
      throw error;
    }
  }

  // Marcar medicamento como inativo
  async deactivateMedication(medicationId: string): Promise<void> {
    try {
      await this.updateMedication(medicationId, {
        isActive: false,
        endDate: new Date()
      });
    } catch (error) {
      console.error('Erro ao desativar medicamento:', error);
      throw error;
    }
  }

  // Buscar medicamentos que precisam de lembretes hoje
  async getTodayReminders(householdId: string, userId: string): Promise<Medication[]> {
    try {
      const medications = await this.getMedicationsByUser(householdId, userId);
      return medications.filter(medication => 
        medication.isActive && 
        medication.reminders?.enabled &&
        (!medication.endDate || medication.endDate >= new Date())
      );
    } catch (error) {
      console.error('Erro ao buscar lembretes de hoje:', error);
      throw error;
    }
  }
}

export const firebaseMedicationService = FirebaseMedicationService.getInstance();