// Verificador de configuração Firebase
import { auth } from '../config/firebase';

export default function ConfigChecker() {
  const config = auth.app.options;
  
  const checkConfig = () => {
    console.log('🔍 Verificando configuração Firebase:');
    console.log('🔑 API Key:', config.apiKey);
    console.log('🌐 Auth Domain:', config.authDomain);
    console.log('📱 Project ID:', config.projectId);
    console.log('💾 Storage Bucket:', config.storageBucket);
    console.log('📬 Messaging Sender ID:', config.messagingSenderId);
    console.log('🆔 App ID:', config.appId);
    
    // Validações básicas
    const issues = [];
    
    if (!config.apiKey || config.apiKey.length < 30) {
      issues.push('❌ API Key muito curta ou inválida');
    }
    
    if (!config.authDomain || !config.authDomain.includes('.firebaseapp.com')) {
      issues.push('❌ Auth Domain inválido');
    }
    
    if (!config.projectId) {
      issues.push('❌ Project ID faltando');
    }
    
    if (issues.length > 0) {
      console.error('🚨 Problemas encontrados:', issues);
      alert('❌ Problemas na configuração:\n' + issues.join('\n'));
    } else {
      console.log('✅ Configuração parece correta');
      alert('✅ Configuração Firebase parece estar correta!');
    }
  };

  // Configuração correta esperada (para referência)
  // const correctConfig = {
  //   apiKey: "SUA_API_KEY_AQUI",
  //   authDomain: "despesas-bf.firebaseapp.com",
  //   projectId: "despesas-bf",
  //   storageBucket: "despesas-bf.firebasestorage.app",
  //   messagingSenderId: "881338314775",
  //   appId: "1:881338314775:web:88372a1b2a461f55843b5f"
  // };

  return (
    <div style={{ padding: 20, fontFamily: 'monospace' }}>
      <h2>🔍 Verificador de Configuração Firebase</h2>
      
      <div style={{ background: '#f5f5f5', padding: 15, marginBottom: 20, borderRadius: 5 }}>
        <h3>📋 Configuração Atual:</h3>
        <p><strong>API Key:</strong> {config.apiKey?.substring(0, 15)}...{config.apiKey?.slice(-5)}</p>
        <p><strong>Auth Domain:</strong> {config.authDomain}</p>
        <p><strong>Project ID:</strong> {config.projectId}</p>
        <p><strong>Storage Bucket:</strong> {config.storageBucket}</p>
        <p><strong>Messaging Sender ID:</strong> {config.messagingSenderId}</p>
        <p><strong>App ID:</strong> {config.appId?.substring(0, 25)}...</p>
      </div>

      <div style={{ background: '#fff3cd', padding: 15, marginBottom: 20, borderRadius: 5 }}>
        <h3>⚠️ Configuração Esperada:</h3>
        <p><strong>Auth Domain:</strong> despesas-bf.firebaseapp.com</p>
        <p><strong>Project ID:</strong> despesas-bf</p>
        <p><strong>Storage Bucket:</strong> despesas-bf.firebasestorage.app</p>
        <p><strong>Messaging Sender ID:</strong> 881338314775</p>
      </div>

      <button 
        onClick={checkConfig}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          marginRight: '10px'
        }}
      >
        🔍 Verificar Configuração
      </button>

      <div style={{ marginTop: 20, fontSize: '12px', color: '#666' }}>
        <p>💡 <strong>Para corrigir a API Key:</strong></p>
        <ol>
          <li>Acesse: <a href="https://console.firebase.google.com/project/despesas-bf/settings/general" target="_blank">Firebase Console → Configurações</a></li>
          <li>Vá em "Seus apps" → "Configuração do Firebase SDK"</li>
          <li>Copie a API Key correta</li>
          <li>Substitua no arquivo src/config/firebase.ts</li>
        </ol>
      </div>
    </div>
  );
}