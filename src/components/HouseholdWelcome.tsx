import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Home, Plus, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirebaseHousehold } from '@/hooks/useFirebaseHousehold';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface HouseholdWelcomeProps {
  className?: string;
}

export function HouseholdWelcome({ className = '' }: HouseholdWelcomeProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [householdName, setHouseholdName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const { createHousehold, joinByInviteCode } = useFirebaseHousehold();
  const { user } = useAuth();

  const handleCreateHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!householdName.trim()) return;

    setIsCreating(true);
    try {
      await createHousehold(householdName.trim());
      toast.success('Casa criada com sucesso!');
      setHouseholdName('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Erro ao criar household:', error);
      toast.error('Erro ao criar casa. Tente novamente.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setIsJoining(true);
    try {
      await joinByInviteCode(inviteCode.trim().toUpperCase());
      toast.success('Entrou na casa com sucesso!');
      setInviteCode('');
      setShowJoinForm(false);
    } catch (error) {
      console.error('Erro ao entrar na casa:', error);
      toast.error('Código inválido ou erro ao entrar na casa.');
    } finally {
      setIsJoining(false);
    }
  };

  const generateDefaultHouseholdName = () => {
    const userName = user?.name || user?.email?.split('@')[0] || 'Usuário';
    return `Casa de ${userName}`;
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-4 bg-blue-100 rounded-full">
              <Home className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bem-vindo ao Controle de Despesas!
          </h1>
          <p className="text-gray-600">
            Para começar, você precisa criar uma casa ou entrar em uma existente.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          {/* Create Household */}
          {!showCreateForm && !showJoinForm && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Criar Nova Casa
                </CardTitle>
                <CardDescription>
                  Crie uma nova casa para gerenciar suas despesas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => {
                    setHouseholdName(generateDefaultHouseholdName());
                    setShowCreateForm(true);
                  }}
                  className="w-full"
                >
                  Criar Minha Casa
                </Button>
              </CardContent>
            </Card>
          )}

          {showCreateForm && (
            <Card>
              <CardHeader>
                <CardTitle>Criar Nova Casa</CardTitle>
                <CardDescription>
                  Escolha um nome para sua casa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateHousehold} className="space-y-4">
                  <Input
                    type="text"
                    value={householdName}
                    onChange={(e) => setHouseholdName(e.target.value)}
                    placeholder="Nome da casa (ex: Casa dos Silva)"
                    className="w-full"
                    autoFocus
                    disabled={isCreating}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={!householdName.trim() || isCreating}
                      className="flex-1"
                    >
                      {isCreating ? 'Criando...' : 'Criar'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCreateForm(false);
                        setHouseholdName('');
                      }}
                      disabled={isCreating}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Join Household */}
          {!showCreateForm && !showJoinForm && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Entrar em Casa Existente
                </CardTitle>
                <CardDescription>
                  Use um código de convite para entrar em uma casa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setShowJoinForm(true)}
                  variant="outline"
                  className="w-full"
                >
                  Tenho um Código de Convite
                </Button>
              </CardContent>
            </Card>
          )}

          {showJoinForm && (
            <Card>
              <CardHeader>
                <CardTitle>Entrar em Casa</CardTitle>
                <CardDescription>
                  Digite o código de convite que você recebeu
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleJoinHousehold} className="space-y-4">
                  <Input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="Código de convite (ex: ABC123)"
                    className="w-full"
                    maxLength={6}
                    autoFocus
                    disabled={isJoining}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={!inviteCode.trim() || isJoining}
                      className="flex-1"
                    >
                      {isJoining ? 'Entrando...' : 'Entrar'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowJoinForm(false);
                        setInviteCode('');
                      }}
                      disabled={isJoining}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </motion.div>
    </div>
  );
}