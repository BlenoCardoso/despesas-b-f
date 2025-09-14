import { useEffect, useState } from 'react';
import { auth } from '../config/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import type { User } from 'firebase/auth';

export default function FirebaseTest() {
  const [status, setStatus] = useState('Testando Firebase...');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Testar conexão com Firebase
    const testFirebase = async () => {
      try {
        console.log('🔥 Firebase Auth:', auth);
        console.log('🌐 Auth domain:', auth.app.options.authDomain);
        console.log('🔑 API Key (primeiros 10 chars):', auth.app.options.apiKey?.substring(0, 10));
        console.log('📱 Project ID:', auth.app.options.projectId);
        
        // Verificar se a API key é válida
        if (!auth.app.options.apiKey || auth.app.options.apiKey.length < 30) {
          throw new Error('API Key inválida ou muito curta');
        }
        
        setStatus('✅ Firebase inicializado com sucesso!');
      } catch (error: any) {
        console.error('❌ Erro no Firebase:', error);
        setStatus(`❌ Erro no Firebase: ${error?.message || 'Erro desconhecido'}`);
      }
    };

    testFirebase();

    // Listener para mudanças no auth
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log('Auth state changed:', user?.email || 'Not logged in');
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  const testGoogleLogin = async () => {
    try {
      setStatus('Tentando login...');
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      
      console.log('Configuração do provider:', provider);
      
      const result = await signInWithPopup(auth, provider);
      console.log('Login resultado:', result);
      setStatus('✅ Login realizado com sucesso!');
    } catch (error: any) {
      console.error('Erro no login direto:', error);
      setStatus(`❌ Erro no login: ${error.code} - ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Firebase Debug</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-4">
          <h2 className="text-lg font-semibold mb-2">Status da Conexão</h2>
          <p className="text-gray-700">{status}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-4">
          <h2 className="text-lg font-semibold mb-2">Informações do Usuário</h2>
          {user ? (
            <div>
              <p>✅ Usuário logado: {user.email}</p>
              <p>Nome: {user.displayName}</p>
              <p>ID: {user.uid}</p>
            </div>
          ) : (
            <p>❌ Nenhum usuário logado</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Teste de Login</h2>
          <button 
            onClick={testGoogleLogin}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            disabled={!!user}
          >
            {user ? 'Já está logado' : 'Testar Login Google'}
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mt-4">
          <h2 className="text-lg font-semibold mb-2">Configuração Firebase</h2>
          <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
            {JSON.stringify({
              projectId: auth.app.options.projectId,
              authDomain: auth.app.options.authDomain,
              apiKey: auth.app.options.apiKey?.substring(0, 10) + '...',
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}