import { useState, useEffect, useCallback } from 'react';
import { firebaseExpenseService } from '../services/firebaseExpenseService';
import { useAuth } from './useAuth';
import type { Expense } from '../types/firebase-schema';

export interface UseFirebaseExpensesReturn {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  createExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'syncVersion'>) => Promise<string>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  refreshExpenses: () => Promise<void>;
}

export function useFirebaseExpenses(householdId?: string): UseFirebaseExpensesReturn {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Função para buscar expenses manualmente (se necessário)
  const refreshExpenses = useCallback(async () => {
    console.log('💰 refreshExpenses chamado com householdId:', householdId, 'user:', user?.id);
    
    if (!householdId || !user) {
      console.log('❌ Sem householdId ou user, limpando despesas');
      setExpenses([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 Buscando despesas para household:', householdId);
      setError(null);
      const expensesList = await firebaseExpenseService.getExpenses(householdId);
      console.log('✅ Despesas encontradas:', expensesList.length, expensesList);
      setExpenses(expensesList);
    } catch (err) {
      console.error('Erro ao buscar expenses:', err);
      setError('Erro ao carregar despesas');
    } finally {
      setLoading(false);
    }
  }, [householdId, user]);

  // Setup de sincronização em tempo real - ÚNICO useEffect para evitar conflitos
  useEffect(() => {
    console.log('🔄 useFirebaseExpenses useEffect - householdId:', householdId, 'user:', user?.id);
    
    if (!householdId || !user) {
      console.log('❌ Sem householdId ou user, limpando despesas');
      setExpenses([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    console.log('🎧 Configurando listener para householdId:', householdId);

    // Escutar mudanças em tempo real
    const unsubscribe = firebaseExpenseService.subscribeToExpenses(
      householdId, 
      (updatedExpenses) => {
        console.log('🔄 Callback do listener executado, despesas:', updatedExpenses.length);
        setExpenses(updatedExpenses);
        setLoading(false);
      }
    );

    // Cleanup subscription
    return () => {
      console.log('🔄 Limpando listener para householdId:', householdId);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [householdId, user]);

  // Função para criar expense
  const createExpense = useCallback(async (expenseData: Omit<Expense, 'id' | 'createdAt' | 'syncVersion'>) => {
    if (!user) throw new Error('Usuário não autenticado');
    
    try {
      const expenseId = await firebaseExpenseService.createExpense(expenseData);
      return expenseId;
    } catch (err) {
      console.error('Erro ao criar expense:', err);
      throw err;
    }
  }, [user]);

  // Função para atualizar expense
  const updateExpense = useCallback(async (id: string, updates: Partial<Expense>) => {
    try {
      await firebaseExpenseService.updateExpense(id, updates);
    } catch (err) {
      console.error('Erro ao atualizar expense:', err);
      throw err;
    }
  }, []);

  // Função para deletar expense
  const deleteExpense = useCallback(async (id: string) => {
    if (!user?.id) throw new Error('Usuário não autenticado');
    
    try {
      await firebaseExpenseService.deleteExpense(id, user.id);
    } catch (err) {
      console.error('Erro ao deletar expense:', err);
      throw err;
    }
  }, [user]);

  return {
    expenses,
    loading,
    error,
    createExpense,
    updateExpense,
    deleteExpense,
    refreshExpenses
  };
}

// Hook simplificado para expenses do mês atual
export function useCurrentMonthExpenses(householdId?: string) {
  const { expenses, loading, error, createExpense, updateExpense, deleteExpense } = useFirebaseExpenses(householdId);

  // Filtrar expenses do mês atual
  const currentMonthExpenses = expenses.filter(expense => {
    const expenseMonth = new Date(expense.createdAt).getMonth();
    const currentMonth = new Date().getMonth();
    const expenseYear = new Date(expense.createdAt).getFullYear();
    const currentYear = new Date().getFullYear();
    
    return expenseMonth === currentMonth && expenseYear === currentYear;
  });

  // Calcular total do mês
  const monthlyTotal = currentMonthExpenses.reduce((total, expense) => total + expense.amount, 0);

  return {
    expenses: currentMonthExpenses,
    monthlyTotal,
    loading,
    error,
    createExpense,
    updateExpense,
    deleteExpense
  };
}