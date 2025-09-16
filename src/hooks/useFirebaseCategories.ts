import { useState, useEffect, useCallback } from 'react';
import { firebaseCategoryService } from '../services/firebaseCategoryService';
import { useAuth } from './useAuth';
import type { Category } from '../types/firebase-schema';

export interface UseFirebaseCategoriesReturn {
  categories: Category[];
  loading: boolean;
  error: string | null;
  createCategory: (category: Omit<Category, 'id' | 'createdAt' | 'syncVersion'>) => Promise<string>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  refreshCategories: () => Promise<void>;
}

export function useFirebaseCategories(householdId?: string): UseFirebaseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Função para buscar categorias
  const refreshCategories = useCallback(async () => {
    if (!householdId || !user) {
      setCategories([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const categoriesList = await firebaseCategoryService.getCategories(householdId);
      setCategories(categoriesList);
    } catch (err) {
      console.error('Erro ao buscar categorias:', err);
      setError('Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  }, [householdId, user]);

  // Setup de sincronização em tempo real
  useEffect(() => {
    if (!householdId || !user) {
      setCategories([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Escutar mudanças em tempo real
    const unsubscribe = firebaseCategoryService.subscribeToCategories(
      householdId, 
      async (updatedCategories) => {
        console.log('🎯 Hook recebeu categorias:', updatedCategories);
        
        // Se não há categorias, criar as padrão
        if (updatedCategories.length === 0) {
          console.log('⚠️ Nenhuma categoria encontrada, criando categorias padrão...');
          try {
            await firebaseCategoryService.createDefaultCategories(householdId, user.id);
            console.log('✅ Categorias padrão criadas, aguardando subscription...');
          } catch (error) {
            console.error('❌ Erro ao criar categorias padrão:', error);
            setError('Erro ao criar categorias padrão');
          }
        } else {
          setCategories(updatedCategories);
          setLoading(false);
        }
      }
    );

    // Cleanup subscription
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [householdId, user]);

  // Função para criar categoria
  const createCategory = useCallback(async (categoryData: Omit<Category, 'id' | 'createdAt' | 'syncVersion'>) => {
    if (!user) throw new Error('Usuário não autenticado');
    
    try {
      const categoryId = await firebaseCategoryService.createCategory(categoryData);
      return categoryId;
    } catch (err) {
      console.error('Erro ao criar categoria:', err);
      throw err;
    }
  }, [user]);

  // Função para atualizar categoria
  const updateCategory = useCallback(async (id: string, updates: Partial<Category>) => {
    try {
      await firebaseCategoryService.updateCategory(id, updates);
    } catch (err) {
      console.error('Erro ao atualizar categoria:', err);
      throw err;
    }
  }, []);

  return {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    refreshCategories
  };
}