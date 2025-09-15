import { useState } from 'react';
import { useFirebaseHousehold } from '../hooks/useFirebaseHousehold';

interface HouseholdManagerProps {
  className?: string;
}

export default function HouseholdManager({ className = '' }: HouseholdManagerProps) {
  const {
    households,
    currentHousehold,
    members,
    loading,
    error,
    createHousehold,
    switchHousehold,
    generateInviteCode,
    joinByInviteCode
  } = useFirebaseHousehold();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [newHouseholdName, setNewHouseholdName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');

  const handleCreateHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHouseholdName.trim()) return;

    try {
      await createHousehold(newHouseholdName.trim());
      setNewHouseholdName('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Erro ao criar household:', error);
    }
  };

  const handleJoinHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    try {
      await joinByInviteCode(inviteCode.trim().toUpperCase());
      setInviteCode('');
      setShowJoinForm(false);
    } catch (error) {
      console.error('Erro ao entrar no household:', error);
    }
  };

  const handleGenerateInviteCode = async () => {
    try {
      const code = await generateInviteCode();
      setGeneratedCode(code);
    } catch (error) {
      console.error('Erro ao gerar código:', error);
    }
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(generatedCode);
    // Poderia mostrar uma notificação aqui
  };

  if (loading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 text-red-600 ${className}`}>
        Erro: {error}
      </div>
    );
  }

  return (
    <div className={`p-4 space-y-4 ${className}`}>
      {/* Seletor de Household Atual */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Household Atual
        </label>
        <select
          value={currentHousehold?.id || ''}
          onChange={(e) => switchHousehold(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {households.map((household) => (
            <option key={household.id} value={household.id}>
              {household.name}
            </option>
          ))}
        </select>
      </div>

      {/* Informações do Household Atual */}
      {currentHousehold && (
        <div className="bg-gray-50 p-3 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">{currentHousehold.name}</h3>
          <p className="text-sm text-gray-600 mb-2">
            Membros: {members.length}
          </p>
          <div className="text-xs text-gray-500 space-y-1">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-2">
                <span>{member.name}</span>
                {member.id === currentHousehold.ownerId && (
                  <span className="bg-blue-100 text-blue-800 px-1 rounded text-xs">Owner</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ações */}
      <div className="space-y-2">
        {/* Criar Novo Household */}
        {!showCreateForm ? (
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full p-2 text-left text-blue-600 hover:bg-blue-50 rounded-md border border-blue-200"
          >
            + Criar Nova Casa
          </button>
        ) : (
          <form onSubmit={handleCreateHousehold} className="space-y-2">
            <input
              type="text"
              value={newHouseholdName}
              onChange={(e) => setNewHouseholdName(e.target.value)}
              placeholder="Nome da casa (ex: Casa dos Silva)"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Criar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewHouseholdName('');
                }}
                className="flex-1 p-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Entrar em Household Existente */}
        {!showJoinForm ? (
          <button
            onClick={() => setShowJoinForm(true)}
            className="w-full p-2 text-left text-green-600 hover:bg-green-50 rounded-md border border-green-200"
          >
            + Entrar em Casa Existente
          </button>
        ) : (
          <form onSubmit={handleJoinHousehold} className="space-y-2">
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Código de convite (ex: ABC123XY)"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 p-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowJoinForm(false);
                  setInviteCode('');
                }}
                className="flex-1 p-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Gerar Código de Convite */}
        {currentHousehold && (
          <div className="border-t pt-3">
            {!generatedCode ? (
              <button
                onClick={handleGenerateInviteCode}
                className="w-full p-2 text-left text-purple-600 hover:bg-purple-50 rounded-md border border-purple-200"
              >
                🔗 Convidar Pessoas
              </button>
            ) : (
              <div className="bg-purple-50 p-3 rounded-lg">
                <p className="text-sm text-purple-800 mb-2">
                  Código de convite gerado:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white p-2 rounded border font-mono text-lg">
                    {generatedCode}
                  </code>
                  <button
                    onClick={copyInviteCode}
                    className="p-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                    title="Copiar código"
                  >
                    📋
                  </button>
                </div>
                <p className="text-xs text-purple-600 mt-2">
                  Compartilhe este código para convidar pessoas para sua casa.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}