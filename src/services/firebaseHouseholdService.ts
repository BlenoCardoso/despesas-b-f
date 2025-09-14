import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Household } from '../types/firebase-schema';

export class FirebaseHouseholdService {
  private static instance: FirebaseHouseholdService;

  private constructor() {}

  static getInstance(): FirebaseHouseholdService {
    if (!FirebaseHouseholdService.instance) {
      FirebaseHouseholdService.instance = new FirebaseHouseholdService();
    }
    return FirebaseHouseholdService.instance;
  }

  // Criar nova household
  async createHousehold(name: string, ownerId: string): Promise<string> {
    try {
      const householdData = {
        name,
        ownerId,
        members: [ownerId],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        settings: {
          currency: 'BRL',
          timezone: 'America/Sao_Paulo',
          categories: {
            allowCustom: true,
            defaultCategories: [
              'Alimentação',
              'Transporte',
              'Moradia',
              'Saúde',
              'Entretenimento',
              'Compras',
              'Outros'
            ]
          }
        },
        syncVersion: 1
      };

      const docRef = await addDoc(collection(db, 'households'), householdData);
      
      // Adicionar household ao usuário
      await this.addUserToHousehold(ownerId, docRef.id);
      
      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar household:', error);
      throw error;
    }
  }

  // Buscar households do usuário
  async getUserHouseholds(userId: string): Promise<Household[]> {
    try {
      const q = query(
        collection(db, 'households'),
        where('members', 'array-contains', userId)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Household[];
    } catch (error) {
      console.error('Erro ao buscar households do usuário:', error);
      throw error;
    }
  }

  // Buscar household por ID
  async getHouseholdById(householdId: string): Promise<Household | null> {
    try {
      const householdRef = doc(db, 'households', householdId);
      const householdDoc = await getDoc(householdRef);
      
      if (householdDoc.exists()) {
        const data = householdDoc.data();
        return {
          id: householdDoc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Household;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar household por ID:', error);
      throw error;
    }
  }

  // Adicionar membro à household
  async addMemberToHousehold(householdId: string, userId: string): Promise<void> {
    try {
      const householdRef = doc(db, 'households', householdId);
      await updateDoc(householdRef, {
        members: arrayUnion(userId),
        updatedAt: serverTimestamp()
      });

      await this.addUserToHousehold(userId, householdId);
    } catch (error) {
      console.error('Erro ao adicionar membro à household:', error);
      throw error;
    }
  }

  // Remover membro da household
  async removeMemberFromHousehold(householdId: string, userId: string): Promise<void> {
    try {
      const householdRef = doc(db, 'households', householdId);
      await updateDoc(householdRef, {
        members: arrayRemove(userId),
        updatedAt: serverTimestamp()
      });

      await this.removeUserFromHousehold(userId, householdId);
    } catch (error) {
      console.error('Erro ao remover membro da household:', error);
      throw error;
    }
  }

  // Atualizar household
  async updateHousehold(householdId: string, updates: Partial<Household>): Promise<void> {
    try {
      const householdRef = doc(db, 'households', householdId);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
        syncVersion: (updates.syncVersion || 0) + 1
      };

      await updateDoc(householdRef, updateData);
    } catch (error) {
      console.error('Erro ao atualizar household:', error);
      throw error;
    }
  }

  // Gerar código de convite
  async generateInviteCode(householdId: string): Promise<string> {
    try {
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const householdRef = doc(db, 'households', householdId);
      await updateDoc(householdRef, {
        inviteCode,
        updatedAt: serverTimestamp()
      });

      return inviteCode;
    } catch (error) {
      console.error('Erro ao gerar código de convite:', error);
      throw error;
    }
  }

  // Ingressar na household via código
  async joinHouseholdByCode(inviteCode: string, userId: string): Promise<string | null> {
    try {
      const q = query(
        collection(db, 'households'),
        where('inviteCode', '==', inviteCode)
      );

      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const householdDoc = querySnapshot.docs[0];
        const householdId = householdDoc.id;
        
        await this.addMemberToHousehold(householdId, userId);
        return householdId;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao ingressar na household por código:', error);
      throw error;
    }
  }

  // Métodos auxiliares para gerenciar a relação user-household
  private async addUserToHousehold(userId: string, householdId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        households: arrayUnion(householdId),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Erro ao adicionar household ao usuário:', error);
      throw error;
    }
  }

  private async removeUserFromHousehold(userId: string, householdId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        households: arrayRemove(householdId),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Erro ao remover household do usuário:', error);
      throw error;
    }
  }
}

export const firebaseHouseholdService = FirebaseHouseholdService.getInstance();