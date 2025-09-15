import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { dataMigrationService } from '../services/dataMigrationService';
import { useFirebaseHousehold } from '../hooks/useFirebaseHousehold';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';

interface DataMigrationProps {
  className?: string;
}

export default function DataMigration({ className = '' }: DataMigrationProps) {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<string>('');
  const { currentHousehold } = useFirebaseHousehold();
  const { user } = useAuth();

  const handleMigration = async () => {
    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    if (!currentHousehold?.id) {
      toast.error('Nenhum household selecionado');
      return;
    }

    setIsMigrating(true);
    setMigrationStatus('Iniciando migração...');

    try {
      await dataMigrationService.migrateAllUserData();
      
      toast.success('Migração concluída com sucesso!');
      setMigrationStatus('Migração concluída! Seus dados locais foram sincronizados com o Firebase.');
    } catch (error) {
      console.error('Erro na migração:', error);
      toast.error('Erro durante a migração. Tente novamente.');
      setMigrationStatus('Erro na migração. Verifique o console para detalhes.');
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔄 Migração de Dados
        </CardTitle>
        <CardDescription>
          Migre seus dados locais para o Firebase e ative a sincronização
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600">
          <p>Esta ferramenta irá:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Transferir categorias locais para o Firebase</li>
            <li>Migrar despesas para sincronização</li>
            <li>Copiar tarefas e medicamentos</li>
            <li>Sincronizar documentos (arquivos precisarão ser re-adicionados)</li>
          </ul>
        </div>

        {migrationStatus && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">{migrationStatus}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button 
            onClick={handleMigration} 
            disabled={isMigrating || !user || !currentHousehold}
            className="flex-1"
          >
            {isMigrating ? (
              <>
                <div className="animate-spin h-4 w-4 border border-white border-t-transparent rounded-full mr-2"></div>
                Migrando...
              </>
            ) : (
              '🚀 Iniciar Migração'
            )}
          </Button>
          
          {!currentHousehold && (
            <div className="text-sm text-red-600">
              Selecione um household primeiro
            </div>
          )}
        </div>

        <div className="text-xs text-gray-500 border-t pt-3">
          <p><strong>Importante:</strong> Esta migração é segura e não remove seus dados locais. 
          Após a migração, os dados serão sincronizados automaticamente entre dispositivos.</p>
        </div>
      </CardContent>
    </Card>
  );
}