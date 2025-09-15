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
      console.log('=== INICIANDO LOGIN COM GOOGLE ===');
      console.log('Platform:', Capacitor.isNativePlatform() ? 'Mobile' : 'Web');
      console.log('Auth state:', auth.currentUser?.email || 'Not logged');
      
      if (Capacitor.isNativePlatform()) {
        // Mobile: usar Capacitor Google Auth
        console.log('Usando Capacitor Google Auth');
        console.log('Verificando inicialização do GoogleAuth...');
        
        try {
          // Usar a mesma configuração que funcionou no teste
          await GoogleAuth.initialize({
            clientId: '958999401996-e6erq73qrbdqkf41hh5paes022jcbd7r.apps.googleusercontent.com',
            scopes: ['profile', 'email'],
            grantOfflineAccess: true
          });
          
          const googleUser = await GoogleAuth.signIn();
          console.log('Google User recebido:', {
            id: googleUser.id,
            email: googleUser.email,
            name: googleUser.name,
            hasIdToken: !!googleUser.authentication?.idToken,
            hasAccessToken: !!googleUser.authentication?.accessToken
          });
          
          if (!googleUser.authentication?.idToken) {
            console.error('ID Token não encontrado na resposta do Google');
            throw new Error('Token de autenticação não encontrado - verifique configuração do Firebase');
          }

          console.log('Criando credencial Firebase...');
          const credential = GoogleAuthProvider.credential(
            googleUser.authentication.idToken
          );
          
          console.log('Fazendo sign-in no Firebase...');
          const result = await signInWithCredential(auth, credential);
          console.log('Firebase sign-in SUCCESS:', result.user?.email);
          
          await this.syncUserData(result.user);
          
          if (!this.currentUser) {
            throw new Error('Falha ao sincronizar dados do usuário');
          }
          
          console.log('Login completo com sucesso!');
          return this.currentUser;
        } catch (googleAuthError: any) {
          console.error('Erro específico do GoogleAuth:', {
            code: googleAuthError.code,
            message: googleAuthError.message,
            details: googleAuthError
          });
          throw googleAuthError;
        }
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
      console.error('=== ERRO DETALHADO NO LOGIN ===');
      console.error('Error object:', error);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      
      // Mensagens de erro mais específicas baseadas no tipo de erro
      if (Capacitor.isNativePlatform()) {
        // Erros específicos do mobile
        if (error?.message?.includes('DEVELOPER_ERROR') || error?.message?.includes('10:')) {
          throw new Error('Erro de configuração: Verifique se a chave SHA-1 está registrada no Firebase Console. SHA-1 necessária: 97:1F:DB:3F:E1:4F:D6:FF:6A:50:F6:7E:4F:25:A1:7C:83:5F:5A:E1');
        } else if (error?.message?.includes('SIGN_IN_CANCELLED')) {
          throw new Error('Login cancelado pelo usuário');
        } else if (error?.message?.includes('NETWORK_ERROR')) {
          throw new Error('Erro de rede. Verifique sua conexão com a internet.');
        } else if (error?.message?.includes('INTERNAL_ERROR')) {
          throw new Error('Erro interno do Google Auth. Tente novamente em alguns instantes.');
        } else if (error?.code === 'auth/invalid-credential') {
          throw new Error('Credenciais inválidas. Verifique a configuração do Firebase.');
        }
      } else {
        // Erros específicos do web
        if (error?.code === 'auth/popup-closed-by-user') {
          throw new Error('Login cancelado pelo usuário');
        } else if (error?.code === 'auth/popup-blocked') {
          throw new Error('Popup bloqueado pelo navegador. Permita popups para este site.');
        } else if (error?.code === 'auth/network-request-failed') {
          throw new Error('Erro de conexão. Verifique sua internet.');
        }
      }
      
      // Erro genérico com mais informações
      throw new Error(`Erro no login Google: ${error?.message || 'Erro desconhecido'}. Código: ${error?.code || 'N/A'}`);
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