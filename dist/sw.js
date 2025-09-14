// Service Worker for Despesas Compartilhadas PWA
const CACHE_NAME = 'despesas-compartilhadas-v1'
const STATIC_CACHE_NAME = 'despesas-static-v1'
const DYNAMIC_CACHE_NAME = 'despesas-dynamic-v1'

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  // Add other static assets as needed
]

// API endpoints that should be cached
const CACHEABLE_APIS = [
  '/api/expenses',
  '/api/tasks',
  '/api/documents',
  '/api/medications',
  '/api/calendar',
  '/api/notifications'
]

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Caching static files')
        return cache.addAll(STATIC_FILES)
      })
      .then(() => {
        console.log('Static files cached successfully')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Error caching static files:', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker activated')
        return self.clients.claim()
      })
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignore Vite dev server and HMR websocket requests
  if (url.pathname.startsWith('/@vite') || url.pathname.includes('vite') || url.protocol === 'ws:' || url.protocol === 'wss:') {
    return
  }

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return
  }

  // Handle different types of requests
  if (isStaticFile(request)) {
    // Cache First strategy for static files
    event.respondWith(cacheFirst(request))
  } else if (isAPIRequest(request)) {
    // Network First strategy for API requests
    event.respondWith(networkFirst(request))
  } else if (isNavigationRequest(request)) {
    // Network First with fallback to cached index.html for navigation
    event.respondWith(navigationHandler(request))
  } else {
    // Stale While Revalidate for other resources
    event.respondWith(staleWhileRevalidate(request))
  }
})

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
    console.error('Cache First failed:', error)
    return new Response('Offline', { status: 503 })
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
    console.log('Network failed, trying cache:', error)
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

// Stale While Revalidate strategy - good for frequently updated content
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME)
  const cachedResponse = await cache.match(request)

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  }).catch(() => cachedResponse)

  return cachedResponse || fetchPromise
}

// Navigation handler - for SPA routing
async function navigationHandler(request) {
  try {
    const networkResponse = await fetch(request)
    return networkResponse
  } catch (error) {
    console.log('Navigation network failed, serving cached index.html')
    const cachedResponse = await caches.match('/index.html')
    return cachedResponse || new Response('Offline', { status: 503 })
  }
}

// Helper functions
function isStaticFile(request) {
  const url = new URL(request.url)
  return url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)
}

function isAPIRequest(request) {
  const url = new URL(request.url)
  return url.pathname.startsWith('/api/') || 
         CACHEABLE_APIS.some(api => url.pathname.startsWith(api))
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && request.headers.get('accept').includes('text/html'))
}

// Background Sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag)
  
  if (event.tag === 'sync-expenses') {
    event.waitUntil(syncExpenses())
  } else if (event.tag === 'sync-tasks') {
    event.waitUntil(syncTasks())
  } else if (event.tag === 'sync-medications') {
    event.waitUntil(syncMedications())
  } else if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications())
  }
})

// Sync functions
async function syncExpenses() {
  try {
    console.log('Syncing expenses...')
    // Implementation would depend on your sync strategy
    // This is where you'd sync offline changes with the server
    
    // For now, just log that sync would happen
    console.log('Expenses sync completed')
  } catch (error) {
    console.error('Expenses sync failed:', error)
    throw error
  }
}

async function syncTasks() {
  try {
    console.log('Syncing tasks...')
    console.log('Tasks sync completed')
  } catch (error) {
    console.error('Tasks sync failed:', error)
    throw error
  }
}

async function syncMedications() {
  try {
    console.log('Syncing medications...')
    console.log('Medications sync completed')
  } catch (error) {
    console.error('Medications sync failed:', error)
    throw error
  }
}

async function syncNotifications() {
  try {
    console.log('Syncing notifications...')
    console.log('Notifications sync completed')
  } catch (error) {
    console.error('Notifications sync failed:', error)
    throw error
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event)
  
  const options = {
    body: 'Você tem novas atualizações no aplicativo',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Abrir App',
        icon: '/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/icon-192x192.png'
      }
    ]
  }

  if (event.data) {
    const data = event.data.json()
    options.body = data.body || options.body
    options.title = data.title || 'Despesas Compartilhadas'
    options.data = { ...options.data, ...data }
  }

  event.waitUntil(
    self.registration.showNotification('Despesas Compartilhadas', options)
  )
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event)
  
  event.notification.close()

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    )
  } else if (event.action === 'close') {
    // Just close the notification
    return
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus()
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/')
        }
      })
    )
  }
})

// Periodic Background Sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('Periodic sync triggered:', event.tag)
  
  if (event.tag === 'sync-data') {
    event.waitUntil(periodicSync())
  }
})

async function periodicSync() {
  try {
    console.log('Performing periodic sync...')
    
    // Sync all data types
    await Promise.all([
      syncExpenses(),
      syncTasks(),
      syncMedications(),
      syncNotifications()
    ])
    
    console.log('Periodic sync completed')
  } catch (error) {
    console.error('Periodic sync failed:', error)
  }
}

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  } else if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME })
  } else if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls)
      })
    )
  }
})

// Error handler
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error)
})

// Unhandled rejection handler
self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled rejection:', event.reason)
  event.preventDefault()
})

