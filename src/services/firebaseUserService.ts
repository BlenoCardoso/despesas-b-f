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
  setDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { User } from '../types/firebase-schema';

export class FirebaseUserService {
  private static instance: FirebaseUserService;

  private constructor() {}

  static getInstance(): FirebaseUserService {
    if (!FirebaseUserService.instance) {
      FirebaseUserService.instance = new FirebaseUserService();
    }
    return FirebaseUserService.instance;
  }

  // Criar ou atualizar usuário
  async createOrUpdateUser(
    authUser: any,
    householdId?: string
  ): Promise<User> {
    try {
      const userData: Omit<User, 'id'> = {
        name: authUser.displayName || 'Usuário',
        email: authUser.email,
        avatarUrl: authUser.photoURL || undefined,
        households: householdId ? [householdId] : [],
        preferences: {
          currency: 'BRL',
          language: 'pt-BR',
          theme: 'system',
          notifications: {
            expenses: true,
            reminders: true,
            reports: true
          }
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSeen: new Date(),
        syncVersion: 1,
        lastSyncAt: new Date()
      };

      // Usar o UID do Firebase Auth como ID do documento
      const userRef = doc(db, 'users', authUser.uid);
      
      // Verificar se usuário já existe
      const existingUser = await getDoc(userRef);
      
      if (existingUser.exists()) {
        // Atualizar usuário existente
        await updateDoc(userRef, {
          name: userData.name,
          avatarUrl: userData.avatarUrl,
          lastSeen: serverTimestamp(),
          updatedAt: serverTimestamp(),
          syncVersion: (existingUser.data().syncVersion || 0) + 1
        });

        return {
          id: authUser.uid,
          ...existingUser.data(),
          ...userData,
          createdAt: existingUser.data().createdAt?.toDate() || new Date(),
          updatedAt: new Date(),
          lastSeen: new Date()
        } as User;
      } else {
        // Criar novo usuário
        await setDoc(userRef, {
          ...userData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastSeen: serverTimestamp(),
          lastSyncAt: serverTimestamp()
        });

        return {
          id: authUser.uid,
          ...userData
        };
      }
    } catch (error) {
      console.error('Erro ao criar/atualizar usuário:', error);
      throw error;
    }
  }

  // Buscar usuário por ID
  async getUserById(userId: string): Promise<User | null> {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        return {
          id: userSnap.id,
          ...userSnap.data(),
          createdAt: userSnap.data().createdAt?.toDate() || new Date(),
          updatedAt: userSnap.data().updatedAt?.toDate() || new Date(),
          lastSeen: userSnap.data().lastSeen?.toDate(),
          lastSyncAt: userSnap.data().lastSyncAt?.toDate()
        } as User;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      throw error;
    }
  }

  // Buscar usuário por email
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const q = query(
        collection(db, 'users'),
        where('email', '==', email)
      );

      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        return {
          id: userDoc.id,
          ...userDoc.data(),
          createdAt: userDoc.data().createdAt?.toDate() || new Date(),
          updatedAt: userDoc.data().updatedAt?.toDate() || new Date(),
          lastSeen: userDoc.data().lastSeen?.toDate(),
          lastSyncAt: userDoc.data().lastSyncAt?.toDate()
        } as User;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar usuário por email:', error);
      throw error;
    }
  }

  // Buscar membros de um household
  async getHouseholdMembers(householdId: string): Promise<User[]> {
    try {
      const q = query(
        collection(db, 'users'),
        where('households', 'array-contains', householdId)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        lastSeen: doc.data().lastSeen?.toDate(),
        lastSyncAt: doc.data().lastSyncAt?.toDate()
      })) as User[];
    } catch (error) {
      console.error('Erro ao buscar membros do household:', error);
      throw error;
    }
  }

  // Escutar mudanças nos membros do household
  subscribeToHouseholdMembers(householdId: string, callback: (users: User[]) => void): () => void {
    try {
      const q = query(
        collection(db, 'users'),
        where('households', 'array-contains', householdId)
      );

      return onSnapshot(q, (querySnapshot) => {
        const users = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          lastSeen: doc.data().lastSeen?.toDate(),
          lastSyncAt: doc.data().lastSyncAt?.toDate()
        })) as User[];
        
        callback(users);
      });
    } catch (error) {
      console.error('Erro ao escutar membros do household:', error);
      throw error;
    }
  }

  // Adicionar household ao usuário
  async addHousehold(userId: string, householdId: string): Promise<void> {
    try {
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      if (user.households.includes(householdId)) {
        return; // Já é membro
      }

      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        households: [...user.households, householdId],
        updatedAt: serverTimestamp(),
        syncVersion: user.syncVersion + 1
      });
    } catch (error) {
      console.error('Erro ao adicionar household ao usuário:', error);
      throw error;
    }
  }

  // Remover household do usuário
  async removeHousehold(userId: string, householdId: string): Promise<void> {
    try {
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        households: user.households.filter(id => id !== householdId),
        updatedAt: serverTimestamp(),
        syncVersion: user.syncVersion + 1
      });
    } catch (error) {
      console.error('Erro ao remover household do usuário:', error);
      throw error;
    }
  }

  // Atualizar preferências do usuário
  async updatePreferences(
    userId: string, 
    preferences: Partial<User['preferences']>
  ): Promise<void> {
    try {
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        preferences: {
          ...user.preferences,
          ...preferences
        },
        updatedAt: serverTimestamp(),
        syncVersion: user.syncVersion + 1
      });
    } catch (error) {
      console.error('Erro ao atualizar preferências:', error);
      throw error;
    }
  }

  // Atualizar perfil do usuário
  async updateProfile(
    userId: string, 
    profile: { name?: string; avatarUrl?: string }
  ): Promise<void> {
    try {
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...profile,
        updatedAt: serverTimestamp(),
        syncVersion: user.syncVersion + 1
      });
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  }

  // Registrar última atividade
  async updateLastSeen(userId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        lastSeen: serverTimestamp(),
        lastSyncAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Erro ao atualizar última atividade:', error);
      // Não fazer throw aqui para não interromper outras operações
    }
  }

  // Buscar usuários ativos (visto nos últimos 30 dias)
  async getActiveUsers(householdId: string): Promise<User[]> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const members = await this.getHouseholdMembers(householdId);
      return members.filter(user => 
        user.lastSeen && user.lastSeen >= thirtyDaysAgo
      );
    } catch (error) {
      console.error('Erro ao buscar usuários ativos:', error);
      throw error;
    }
  }
}

export const firebaseUserService = FirebaseUserService.getInstance();