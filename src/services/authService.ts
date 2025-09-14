import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  signInWithCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';
import { auth, db } from '../config/firebase';
import type { User } from '../types/firebase-schema';

export class AuthService {
  private static instance: AuthService;
  private currentUser: User | null = null;

  private constructor() {
    this.initializeAuthStateListener();
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private initializeAuthStateListener() {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Usuário logado - buscar dados completos do Firestore
        await this.syncUserData(firebaseUser);
      } else {
        // Usuário deslogado
        this.currentUser = null;
      }
    });
  }

  private async syncUserData(firebaseUser: FirebaseUser): Promise<void> {
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (userDoc.exists()) {
        // Atualizar dados existentes
        this.currentUser = {
          id: firebaseUser.uid,
          ...userDoc.data()
        } as User;
      } else {
        // Criar novo usuário no Firestore
        const newUser: Omit<User, 'id'> = {
          name: firebaseUser.displayName || 'Usuário',
          email: firebaseUser.email || '',
          avatarUrl: firebaseUser.photoURL || '',
          households: [],
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
          createdAt: serverTimestamp() as any,
          updatedAt: serverTimestamp() as any
        };

        await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
        
        this.currentUser = {
          id: firebaseUser.uid,
          ...newUser
        } as User;
      }
    } catch (error) {
      console.error('Erro ao sincronizar dados do usuário:', error);
      throw error;
    }
  }

  async signInWithGoogle(): Promise<User> {
    try {
      console.log('Iniciando login com Google...');
      console.log('Platform:', Capacitor.isNativePlatform() ? 'Mobile' : 'Web');
      
      if (Capacitor.isNativePlatform()) {
        // Mobile: usar Capacitor Google Auth
        console.log('Usando Capacitor Google Auth');
        const googleUser = await GoogleAuth.signIn();
        console.log('Google User:', googleUser);
        
        if (!googleUser.authentication?.idToken) {
          throw new Error('Token de autenticação não encontrado');
        }

        const credential = GoogleAuthProvider.credential(
          googleUser.authentication.idToken
        );
        
        const result = await signInWithCredential(auth, credential);
        console.log('Firebase sign-in result:', result.user?.email);
        await this.syncUserData(result.user);
        
        if (!this.currentUser) {
          throw new Error('Falha ao criar usuário');
        }
        
        return this.currentUser;
      } else {
        // Web: usar popup
        console.log('Usando Firebase popup para web');
        const provider = new GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        
        console.log('Abrindo popup de login...');
        const result = await signInWithPopup(auth, provider);
        console.log('Login popup concluído:', result.user?.email);
        
        await this.syncUserData(result.user);
        
        if (!this.currentUser) {
          throw new Error('Falha ao criar usuário');
        }
        
        console.log('Login bem-sucedido!', this.currentUser.email);
        return this.currentUser;
      }
    } catch (error: any) {
      console.error('Erro detalhado no login:', error);
      
      // Mensagens de erro mais específicas
      if (error?.code === 'auth/popup-closed-by-user') {
        throw new Error('Login cancelado pelo usuário');
      } else if (error?.code === 'auth/popup-blocked') {
        throw new Error('Popup bloqueado pelo navegador. Permita popups para este site.');
      } else if (error?.code === 'auth/network-request-failed') {
        throw new Error('Erro de conexão. Verifique sua internet.');
      } else if (error?.message?.includes('Token')) {
        throw new Error('Erro na autenticação Google');
      } else {
        throw new Error(`Erro no login: ${error?.message || 'Erro desconhecido'}`);
      }
    }
  }

  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
      if (Capacitor.isNativePlatform()) {
        await GoogleAuth.signOut();
      }
      this.currentUser = null;
    } catch (error) {
      console.error('Erro no logout:', error);
      throw error;
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getFirebaseUser(): FirebaseUser | null {
    return auth.currentUser;
  }

  async updateUserProfile(updates: Partial<User>): Promise<void> {
    if (!this.currentUser || !auth.currentUser) {
      throw new Error('Usuário não autenticado');
    }

    try {
      const updatedData = {
        ...updates,
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'users', this.currentUser.id), updatedData, { merge: true });
      
      this.currentUser = {
        ...this.currentUser,
        ...updates
      };
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  }
}

export const authService = AuthService.getInstance();