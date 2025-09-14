// Componente de teste baseado na documentação oficial
import { auth } from '../config/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const provider = new GoogleAuthProvider();

export default function SimpleFirebaseTest() {
  const handleTestLogin = async () => {
    try {
      console.log('🚀 Iniciando teste de login...');
      console.log('🔐 Auth domain:', auth.app.options.authDomain);
      console.log('🔑 API Key (primeiros chars):', auth.app.options.apiKey?.substring(0, 10));
      
      const result = await signInWithPopup(auth, provider);
      console.log('✅ Usuário logado com sucesso:', result.user);
      alert(`Login realizado com sucesso!\nEmail: ${result.user.email}\nNome: ${result.user.displayName}`);
    } catch (error: any) {
      console.error('❌ Erro no login:', error);
      
      // Mensagens específicas conforme documentação
      if (error.code === 'auth/popup-closed-by-user') {
        alert('❌ Login cancelado pelo usuário');
      } else if (error.code === 'auth/popup-blocked') {
        alert('❌ Popup bloqueado pelo navegador. Permita popups para este site.');
      } else if (error.code === 'auth/unauthorized-domain') {
        alert('❌ Domínio não autorizado. Verifique as configurações do Firebase Console.');
      } else {
        alert(`❌ Erro: ${error.message}`);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      console.log('✅ Logout realizado');
      alert('Logout realizado com sucesso!');
    } catch (error) {
      console.error('❌ Erro no logout:', error);
    }
  };

  return (
    <div style={{ padding: 16, fontFamily: 'Arial, sans-serif' }}>
      <h1>🧪 Teste Firebase - Seguindo Documentação</h1>
      
      <div style={{ marginBottom: 20, padding: 16, backgroundColor: '#f0f0f0', borderRadius: 8 }}>
        <h3>📋 Status da Configuração</h3>
        <p><strong>Project ID:</strong> {auth.app.options.projectId}</p>
        <p><strong>Auth Domain:</strong> {auth.app.options.authDomain}</p>
        <p><strong>API Key:</strong> {auth.app.options.apiKey?.substring(0, 15)}...</p>
      </div>

      <div style={{ marginBottom: 20 }}>
        <h3>🔍 Usuário Atual</h3>
        <p>
          {auth.currentUser 
            ? `✅ Logado: ${auth.currentUser.email}` 
            : '❌ Não logado'
          }
        </p>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button 
          onClick={handleTestLogin}
          style={{
            padding: '12px 24px',
            backgroundColor: '#4285F4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔐 Testar Login Google
        </button>

        <button 
          onClick={handleLogout}
          style={{
            padding: '12px 24px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🚪 Logout
        </button>
      </div>

      <div style={{ marginTop: 20, fontSize: '12px', color: '#666' }}>
        <p>💡 <strong>Dica:</strong> Abra o console (F12) para ver logs detalhados</p>
        <p>🌐 <strong>Certifique-se de que:</strong> localhost e 127.0.0.1 estão nos domínios autorizados do Firebase</p>
      </div>
    </div>
  );
}