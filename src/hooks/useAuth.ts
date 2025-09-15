import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import type { User } from '../types/firebase-schema';

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar se já existe um usuário logado
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    
    // Se já tem usuário, não precisa carregar
    if (currentUser) {
      setIsLoading(false);
    } else {
      // Se não tem usuário, verificar se Firebase tem estado de auth
      setTimeout(() => {
        const fbUser = authService.getFirebaseUser();
        if (fbUser || authService.getCurrentUser()) {
          setUser(authService.getCurrentUser());
        }
        setIsLoading(false);
      }, 500); // Pequeno delay para Firebase inicializar
    }

    // Como o AuthService já gerencia o estado interno via Firebase onAuthStateChanged,
    // vamos verificar periodicamente por mudanças
    const interval = setInterval(() => {
      const updatedUser = authService.getCurrentUser();
      if (updatedUser !== user) {
        setUser(updatedUser);
      }
    }, 2000); // Reduzido de 1000ms para menos checagens

    return () => {
      clearInterval(interval);
    };
  }, [user]);

  const signIn = async () => {
    try {
      setIsLoading(true);
      const loggedUser = await authService.signInWithGoogle();
      setUser(loggedUser);
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await authService.signOut();
      setUser(null);
    } catch (error) {
      console.error('Erro no logout:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      await authService.updateUserProfile(updates);
      const updatedUser = authService.getCurrentUser();
      setUser(updatedUser);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signOut,
    updateProfile
  };
};