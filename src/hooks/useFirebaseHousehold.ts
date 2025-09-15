import { useState, useEffect, useCallback } from 'react';
import { firebaseHouseholdService } from '../services/firebaseHouseholdServiceComplete';
import { firebaseUserService } from '../services/firebaseUserService';
import { useAuth } from './useAuth';
import type { Household, User } from '../types/firebase-schema';

export interface UseFirebaseHouseholdReturn {
  households: Household[];
  currentHousehold: Household | null;
  members: User[];
  loading: boolean;
  error: string | null;
  createHousehold: (name: string, settings?: any) => Promise<string>;
  switchHousehold: (householdId: string) => void;
  addMember: (userId: string) => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  updateSettings: (settings: Partial<Household['settings']>) => Promise<void>;
  generateInviteCode: () => Promise<string>;
  joinByInviteCode: (inviteCode: string) => Promise<void>;
  refreshHouseholds: () => Promise<void>;
}

export function useFirebaseHousehold(): UseFirebaseHouseholdReturn {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [currentHouseholdId, setCurrentHouseholdId] = useState<string | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Household atual
  const currentHousehold = households.find(h => h.id === currentHouseholdId) || null;

  // Função para buscar households
  const refreshHouseholds = useCallback(async () => {
    if (!user?.id) {
      setHouseholds([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const householdsList = await firebaseHouseholdService.getUserHouseholds(user.id);
      setHouseholds(householdsList);

      // Se não há household atual selecionado, usar o primeiro
      if (!currentHouseholdId && householdsList.length > 0) {
        setCurrentHouseholdId(householdsList[0].id);
      }
    } catch (err) {
      console.error('Erro ao buscar households:', err);
      setError('Erro ao carregar households');
    } finally {
      setLoading(false);
    }
  }, [user?.id, currentHouseholdId]);

  // Setup de sincronização em tempo real para households
  useEffect(() => {
    if (!user?.id) {
      setHouseholds([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Escutar mudanças nos households do usuário
    const unsubscribe = firebaseHouseholdService.subscribeToUserHouseholds(
      user.id,
      (updatedHouseholds) => {
        setHouseholds(updatedHouseholds);
        
        // Se não há household atual ou ele foi removido, selecionar o primeiro
        if (!currentHouseholdId || !updatedHouseholds.find(h => h.id === currentHouseholdId)) {
          const firstHousehold = updatedHouseholds[0];
          setCurrentHouseholdId(firstHousehold?.id || null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user?.id]);

  // Setup de sincronização para membros do household atual
  useEffect(() => {
    if (!currentHouseholdId) {
      setMembers([]);
      return;
    }

    // Escutar mudanças nos membros
    const unsubscribe = firebaseUserService.subscribeToHouseholdMembers(
      currentHouseholdId,
      (updatedMembers) => {
        setMembers(updatedMembers);
      }
    );

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentHouseholdId]);

  // Função para criar household
  const createHousehold = useCallback(async (name: string, settings?: any) => {
    if (!user?.id) throw new Error('Usuário não autenticado');

    try {
      const householdId = await firebaseHouseholdService.createHousehold(name, user.id, settings);
      
      // Adicionar household ao usuário
      await firebaseUserService.addHousehold(user.id, householdId);
      
      // Selecionar o novo household
      setCurrentHouseholdId(householdId);
      
      return householdId;
    } catch (err) {
      console.error('Erro ao criar household:', err);
      throw err;
    }
  }, [user?.id]);

  // Função para alternar household
  const switchHousehold = useCallback((householdId: string) => {
    setCurrentHouseholdId(householdId);
    localStorage.setItem('currentHouseholdId', householdId);
  }, []);

  // Função para adicionar membro
  const addMember = useCallback(async (userId: string) => {
    if (!currentHouseholdId) throw new Error('Nenhum household selecionado');

    try {
      await firebaseHouseholdService.addMember(currentHouseholdId, userId);
      await firebaseUserService.addHousehold(userId, currentHouseholdId);
    } catch (err) {
      console.error('Erro ao adicionar membro:', err);
      throw err;
    }
  }, [currentHouseholdId]);

  // Função para remover membro
  const removeMember = useCallback(async (userId: string) => {
    if (!currentHouseholdId || !user?.id) throw new Error('Dados insuficientes');

    try {
      await firebaseHouseholdService.removeMember(currentHouseholdId, userId, user.id);
      await firebaseUserService.removeHousehold(userId, currentHouseholdId);
    } catch (err) {
      console.error('Erro ao remover membro:', err);
      throw err;
    }
  }, [currentHouseholdId, user?.id]);

  // Função para atualizar configurações
  const updateSettings = useCallback(async (settings: Partial<Household['settings']>) => {
    if (!currentHouseholdId || !user?.id) throw new Error('Dados insuficientes');

    try {
      await firebaseHouseholdService.updateSettings(currentHouseholdId, settings, user.id);
    } catch (err) {
      console.error('Erro ao atualizar configurações:', err);
      throw err;
    }
  }, [currentHouseholdId, user?.id]);

  // Função para gerar código de convite
  const generateInviteCode = useCallback(async () => {
    if (!currentHouseholdId || !user?.id) throw new Error('Dados insuficientes');
    
    try {
      const code = await firebaseHouseholdService.generateInviteCode(currentHouseholdId, user.id);
      return code;
    } catch (err) {
      console.error('Erro ao gerar código de convite:', err);
      throw err;
    }
  }, [currentHouseholdId, user?.id]);

  // Função para entrar usando código de convite
  const joinByInviteCode = useCallback(async (inviteCode: string) => {
    if (!user?.id) throw new Error('Usuário não autenticado');

    try {
      const householdId = await firebaseHouseholdService.joinByInviteCode(inviteCode, user.id);
      await firebaseUserService.addHousehold(user.id, householdId);
      
      // Alternar para o novo household
      setCurrentHouseholdId(householdId);
    } catch (err) {
      console.error('Erro ao entrar no household:', err);
      throw err;
    }
  }, [user?.id]);

  // Carregar household salvo no localStorage na inicialização
  useEffect(() => {
    const savedHouseholdId = localStorage.getItem('currentHouseholdId');
    if (savedHouseholdId) {
      setCurrentHouseholdId(savedHouseholdId);
    }
  }, []);

  return {
    households,
    currentHousehold,
    members,
    loading,
    error,
    createHousehold,
    switchHousehold,
    addMember,
    removeMember,
    updateSettings,
    generateInviteCode,
    joinByInviteCode,
    refreshHouseholds
  };
}