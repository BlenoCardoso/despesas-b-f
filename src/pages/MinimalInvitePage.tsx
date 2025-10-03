import React from 'react'

export default function MinimalInvitePage() {
  return React.createElement('div', {
    style: {
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }
  }, [
    React.createElement('h1', { key: 'title' }, '🎯 Página Mínima'),
    React.createElement('p', { key: 'text' }, 'Se você vê isto, o React está funcionando!'),
    React.createElement('p', { key: 'url' }, `URL: ${window.location.href}`),
    React.createElement('p', { key: 'time' }, `Hora: ${new Date().toLocaleString()}`)
  ])
}

// Fallback sem React.createElement
const MinimalInvitePageFallback = () => {
  const divElement = document.createElement('div')
  divElement.style.padding = '20px'
  divElement.style.fontFamily = 'Arial, sans-serif'
  divElement.innerHTML = `
    <h1>🎯 Página Mínima (Fallback)</h1>
    <p>Esta página foi criada diretamente com DOM API</p>
    <p>URL: ${window.location.href}</p>
    <p>Hora: ${new Date().toLocaleString()}</p>
  `
  return divElement
}