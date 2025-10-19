// Service Worker for Despesas Compartilhadas PWA - Versão Otimizada
const CACHE_NAME = 'despesas-compartilhadas-v2'
const STATIC_CACHE_NAME = 'despesas-static-v2'
const DYNAMIC_CACHE_NAME = 'despesas-dynamic-v2'

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json'
  // Removido ícones que podem não existir para evitar erros
]

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker instalando...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('📦 Cacheando arquivos estáticos')
        // Cache apenas arquivos que sabemos que existem
        return cache.add('/index.html')
      })
      .then(() => {
        console.log('✅ Arquivos estáticos cacheados')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.warn('⚠️ Erro ao cachear arquivos estáticos:', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker ativando...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('🗑️ Deletando cache antigo:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('✅ Service Worker ativado')
        return self.clients.claim()
      })
  )
})

// Fetch event - estratégia mais inteligente
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // IGNORAR requisições de desenvolvimento
  if (url.pathname.startsWith('/@vite') || 
      url.pathname.includes('vite') || 
      url.pathname.includes('node_modules') ||
      url.protocol === 'ws:' || 
      url.protocol === 'wss:' ||
      url.hostname === 'localhost' && url.port === '5173') {
    return // Deixa o Vite lidar com essas requisições
  }

  // IGNORAR requisições não-GET
  if (request.method !== 'GET') {
    return
  }

  // IGNORAR protocolos não-http
  if (!url.protocol.startsWith('http')) {
    return
  }

  // ESTRATÉGIA: Network First para desenvolvimento
  if (url.hostname === 'localhost' || url.hostname.includes('192.168')) {
    event.respondWith(networkFirstDev(request))
  } else {
    // Para produção, usar estratégias mais robustas
    if (isNavigationRequest(request)) {
      event.respondWith(navigationHandler(request))
    } else if (isStaticFile(request)) {
      event.respondWith(cacheFirst(request))
    } else {
      event.respondWith(networkFirst(request))
    }
  }
})

// Network First para desenvolvimento - evita cache agressivo
async function networkFirstDev(request) {
  try {
    console.log('🌐 Tentando rede para:', request.url)
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache apenas se for um arquivo importante
      if (request.url.includes('index.html') || isStaticFile(request)) {
        const cache = await caches.open(DYNAMIC_CACHE_NAME)
        cache.put(request, networkResponse.clone())
      }
    }
    
    return networkResponse
  } catch (error) {
    console.log('📡 Rede falhou, tentando cache:', error.message)
    
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      console.log('✅ Servindo do cache:', request.url)
      return cachedResponse
    }
    
    // Se for navegação e não tem cache, tenta index.html
    if (isNavigationRequest(request)) {
      const indexCache = await caches.match('/index.html')
      if (indexCache) {
        console.log('🏠 Servindo index.html para navegação')
        return indexCache
      }
    }
    
    // Último recurso: resposta offline amigável
    console.log('💔 Sem cache disponível para:', request.url)
    return new Response(
      '<!DOCTYPE html><html><body><h1>Você está offline</h1><p>Verifique sua conexão de internet.</p></body></html>',
      { 
        status: 503,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      }
    )
  }
}

// Cache First strategy - good for static assets
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.warn('Cache First falhou:', error)
    return new Response('Recurso não disponível offline', { status: 503 })
  }
}

// Network First strategy - good for API requests
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.log('Network falhou, tentando cache:', error.message)
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline response for API requests
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'Você está offline. Alguns dados podem estar desatualizados.' 
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Navigation handler - for SPA routing
async function navigationHandler(request) {
  try {
    const networkResponse = await fetch(request)
    return networkResponse
  } catch (error) {
    console.log('Navegação falhou, servindo index.html cached')
    const cachedResponse = await caches.match('/index.html')
    if (cachedResponse) {
      return cachedResponse
    }
    
    return new Response(
      '<!DOCTYPE html><html><body><h1>App offline</h1><p>Reconecte-se à internet para usar o app.</p></body></html>',
      { 
        status: 503,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      }
    )
  }
}

// Helper functions
function isStaticFile(request) {
  const url = new URL(request.url)
  return url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && request.headers.get('accept') && request.headers.get('accept').includes('text/html'))
}

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker recebeu mensagem:', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  } else if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME })
  }
})

// Error handler
self.addEventListener('error', (event) => {
  console.error('Service Worker erro:', event.error)
})

// Unhandled rejection handler
self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker rejeição não tratada:', event.reason)
  event.preventDefault()
})