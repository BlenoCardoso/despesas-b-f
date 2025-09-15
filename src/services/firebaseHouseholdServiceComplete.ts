import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc,
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  onSnapshot,
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

  // Criar household
  async createHousehold(
    name: string, 
    ownerId: string,
    settings?: {
      currency?: string;
      timezone?: string;
    }
  ): Promise<string> {
    try {
      const householdData: Omit<Household, 'id'> = {
        name,
        ownerId,
        members: [ownerId],
        createdAt: new Date(),
        updatedAt: new Date(),
        syncVersion: 1,
        settings: {
          currency: settings?.currency || 'BRL',
          timezone: settings?.timezone || 'America/Sao_Paulo',
          categories: {
            allowCustom: true,
            defaultCategories: []
          }
        }
      };

      const docRef = await addDoc(collection(db, 'households'), {
        ...householdData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar household:', error);
      throw error;
    }
  }

  // Buscar household por ID
  async getHouseholdById(householdId: string): Promise<Household | null> {
    try {
      const householdRef = doc(db, 'households', householdId);
      const householdSnap = await getDoc(householdRef);

      if (householdSnap.exists()) {
        return {
          id: householdSnap.id,
          ...householdSnap.data(),
          createdAt: householdSnap.data().createdAt?.toDate() || new Date(),
          updatedAt: householdSnap.data().updatedAt?.toDate() || new Date()
        } as Household;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar household:', error);
      throw error;
    }
  }

  // Buscar households do usuário
  async getUserHouseholds(userId: string): Promise<Household[]> {
    try {
      const q = query(
        collection(db, 'households'),
        where('members', 'array-contains', userId),
        orderBy('updatedAt', 'desc')
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

  // Escutar mudanças em tempo real
  subscribeToUserHouseholds(userId: string, callback: (households: Household[]) => void): () => void {
    try {
      const q = query(
        collection(db, 'households'),
        where('members', 'array-contains', userId),
        orderBy('updatedAt', 'desc')
      );

      return onSnapshot(q, (querySnapshot) => {
        const households = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date()
        })) as Household[];
        
        callback(households);
      });
    } catch (error) {
      console.error('Erro ao escutar households:', error);
      throw error;
    }
  }

  // Adicionar membro ao household
  async addMember(householdId: string, userId: string): Promise<void> {
    try {
      const household = await this.getHouseholdById(householdId);
      if (!household) {
        throw new Error('Household não encontrado');
      }

      const householdRef = doc(db, 'households', householdId);
      await updateDoc(householdRef, {
        members: arrayUnion(userId),
        updatedAt: serverTimestamp(),
        syncVersion: household.syncVersion + 1
      });
    } catch (error) {
      console.error('Erro ao adicionar membro:', error);
      throw error;
    }
  }

  // Remover membro do household
  async removeMember(householdId: string, userId: string, currentUserId: string): Promise<void> {
    try {
      const household = await this.getHouseholdById(householdId);
      
      if (!household) {
        throw new Error('Household não encontrado');
      }

      // Verificar se o usuário atual é o owner ou está removendo a si mesmo
      if (household.ownerId !== currentUserId && userId !== currentUserId) {
        throw new Error('Apenas o owner pode remover outros membros');
      }

      const householdRef = doc(db, 'households', householdId);
      await updateDoc(householdRef, {
        members: arrayRemove(userId),
        updatedAt: serverTimestamp(),
        syncVersion: household.syncVersion + 1
      });
    } catch (error) {
      console.error('Erro ao remover membro:', error);
      throw error;
    }
  }

  // Atualizar configurações do household
  async updateSettings(
    householdId: string, 
    settings: Partial<Household['settings']>,
    userId: string
  ): Promise<void> {
    try {
      const household = await this.getHouseholdById(householdId);
      
      if (!household) {
        throw new Error('Household não encontrado');
      }

      // Verificar se o usuário é membro
      if (!household.members.includes(userId)) {
        throw new Error('Usuário não é membro deste household');
      }

      const householdRef = doc(db, 'households', householdId);
      await updateDoc(householdRef, {
        settings: {
          ...household.settings,
          ...settings
        },
        updatedAt: serverTimestamp(),
        syncVersion: household.syncVersion + 1
      });
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      throw error;
    }
  }

  // Gerar código de convite (simplificado)
  async generateInviteCode(householdId: string, ownerId: string): Promise<string> {
    try {
      const household = await this.getHouseholdById(householdId);
      
      if (!household || household.ownerId !== ownerId) {
        throw new Error('Apenas o owner pode gerar códigos de convite');
      }

      const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      const householdRef = doc(db, 'households', householdId);
      await updateDoc(householdRef, {
        inviteCode,
        updatedAt: serverTimestamp(),
        syncVersion: household.syncVersion + 1
      });

      return inviteCode;
    } catch (error) {
      console.error('Erro ao gerar código de convite:', error);
      throw error;
    }
  }

  // Entrar em household por código de convite
  async joinByInviteCode(inviteCode: string, userId: string): Promise<string> {
    try {
      const q = query(
        collection(db, 'households'),
        where('inviteCode', '==', inviteCode)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('Código de convite inválido');
      }

      const householdDoc = querySnapshot.docs[0];
      const household = {
        id: householdDoc.id,
        ...householdDoc.data()
      } as Household;

      // Verificar se já é membro
      if (household.members.includes(userId)) {
        throw new Error('Usuário já é membro deste household');
      }

      await this.addMember(household.id, userId);
      return household.id;
    } catch (error) {
      console.error('Erro ao entrar no household:', error);
      throw error;
    }
  }

  // Transferir ownership
  async transferOwnership(
    householdId: string, 
    currentOwnerId: string, 
    newOwnerId: string
  ): Promise<void> {
    try {
      const household = await this.getHouseholdById(householdId);
      
      if (!household || household.ownerId !== currentOwnerId) {
        throw new Error('Apenas o owner atual pode transferir a propriedade');
      }

      if (!household.members.includes(newOwnerId)) {
        throw new Error('Novo owner deve ser membro do household');
      }

      const householdRef = doc(db, 'households', householdId);
      await updateDoc(householdRef, {
        ownerId: newOwnerId,
        updatedAt: serverTimestamp(),
        syncVersion: household.syncVersion + 1
      });
    } catch (error) {
      console.error('Erro ao transferir propriedade:', error);
      throw error;
    }
  }
}

export const firebaseHouseholdService = FirebaseHouseholdService.getInstance();