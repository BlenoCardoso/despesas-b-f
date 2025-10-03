import { useEffect } from 'react'

export default function DirectDOMPage() {
  useEffect(() => {
    // Injetar conteúdo diretamente no DOM
    const content = document.createElement('div')
    content.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: white;
        z-index: 9999;
        padding: 20px;
        font-family: Arial, sans-serif;
        overflow-y: auto;
      ">
        <h1 style="color: green;">🎉 PÁGINA FUNCIONANDO!</h1>
        <p><strong>Se você vê isso, o React está funcionando!</strong></p>
        <hr>
        <h2>Debug Info:</h2>
        <p><strong>URL:</strong> ${window.location.href}</p>
        <p><strong>Hora:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>User Agent:</strong> ${navigator.userAgent}</p>
        <hr>
        <h2>Próximos passos:</h2>
        <p>✅ React: Funcionando</p>
        <p>✅ Firebase: Sem erros críticos</p>
        <p>✅ Roteamento: URL correta</p>
        <p>⚠️ Problema: CSS ou renderização</p>
        <hr>
        <button onclick="alert('JavaScript funcionando!')" style="
          background: blue;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          margin: 10px 5px;
        ">Testar JS</button>
        <button onclick="window.location.href='/'" style="
          background: green;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          margin: 10px 5px;
        ">Ir para Home</button>
      </div>
    `
    
    document.body.appendChild(content)
    
    console.log('✅ DirectDOMPage: Conteúdo injetado no DOM')
    
    return () => {
      if (content.parentNode) {
        content.parentNode.removeChild(content)
      }
    }
  }, [])

  // Retornar JSX também (case o DOM injection falhe)
  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'yellow',
      padding: '20px',
      border: '2px solid red',
      borderRadius: '10px',
      zIndex: 1000
    }}>
      <h1>⚠️ JSX FALLBACK</h1>
      <p>Se você vê esta caixa amarela, o JSX está funcionando mas o DOM injection falhou.</p>
    </div>
  )
}