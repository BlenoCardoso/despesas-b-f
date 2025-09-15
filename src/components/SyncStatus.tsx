import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { enableNetwork, disableNetwork } from 'firebase/firestore';

interface SyncStatusProps {
  className?: string;
}

export default function SyncStatus({ className = '' }: SyncStatusProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Monitorar status de autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });

    return unsubscribe;
  }, []);

  // Monitorar status de conexão
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Reabilitar rede do Firestore quando voltar online
      enableNetwork(db).catch(console.error);
    };

    const handleOffline = () => {
      setIsOnline(false);
      // Desabilitar rede do Firestore quando ficar offline
      disableNetwork(db).catch(console.error);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Simular status de sincronização (em uma implementação real, isso viria dos serviços)
  useEffect(() => {
    if (isOnline && isAuthenticated) {
      setIsSyncing(true);
      
      const syncTimer = setTimeout(() => {
        setIsSyncing(false);
        setLastSync(new Date());
      }, 2000);

      return () => clearTimeout(syncTimer);
    }
  }, [isOnline, isAuthenticated]);

  const getSyncStatusText = () => {
    if (!isAuthenticated) return 'Não conectado';
    if (!isOnline) return 'Offline';
    if (isSyncing) return 'Sincronizando...';
    if (lastSync) return `Sincronizado às ${lastSync.toLocaleTimeString()}`;
    return 'Aguardando sincronização';
  };

  const getSyncStatusColor = () => {
    if (!isAuthenticated || !isOnline) return 'text-red-500';
    if (isSyncing) return 'text-yellow-500';
    if (lastSync) return 'text-green-500';
    return 'text-gray-500';
  };

  const getSyncStatusIcon = () => {
    if (!isAuthenticated || !isOnline) return '🔴';
    if (isSyncing) return '🟡';
    if (lastSync) return '🟢';
    return '⚪';
  };

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <span className="text-lg">{getSyncStatusIcon()}</span>
      <span className={getSyncStatusColor()}>
        {getSyncStatusText()}
      </span>
      
      {/* Indicador de carregamento quando sincronizando */}
      {isSyncing && (
        <div className="animate-spin h-3 w-3 border border-yellow-500 border-t-transparent rounded-full"></div>
      )}

      {/* Botão para forçar sincronização */}
      {isAuthenticated && isOnline && !isSyncing && (
        <button
          onClick={() => window.location.reload()}
          className="ml-2 text-xs text-blue-500 hover:text-blue-700 underline"
          title="Atualizar dados"
        >
          ↻
        </button>
      )}
    </div>
  );
}