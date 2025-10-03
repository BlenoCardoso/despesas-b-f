export default function BasicInvitePage() {
  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '500px', 
      margin: '0 auto',
      border: '1px solid #ccc',
      borderRadius: '8px',
      marginTop: '50px'
    }}>
      <h1>🎯 Página de Convite Básica</h1>
      <p>Esta é uma página de teste básica sem imports complexos.</p>
      <p>Se você está vendo esta mensagem, o roteamento está funcionando!</p>
      
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#f0f0f0',
        borderRadius: '4px'
      }}>
        <strong>Debug Info:</strong>
        <br />
        URL atual: {window.location.href}
        <br />
        Timestamp: {new Date().toLocaleString()}
      </div>
    </div>
  )
}