import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock do IndexedDB para testes
const mockIndexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
  cmp: vi.fn(),
}

Object.defineProperty(window, 'indexedDB', {
  value: mockIndexedDB,
  writable: true,
})

// Mock do Notification API
Object.defineProperty(window, 'Notification', {
  value: class MockNotification {
    static permission = 'default'
    static requestPermission = vi.fn(() => Promise.resolve('granted'))
    constructor(_title: string, _options?: NotificationOptions) {
      // Mock implementation
    }
  },
  writable: true,
})

// Mock do Service Worker
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: vi.fn(() => Promise.resolve()),
    ready: Promise.resolve({
      showNotification: vi.fn(),
    }),
  },
  writable: true,
})

// Mock do localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// Mock do matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Minimal ResizeObserver polyfill for tests
class MockResizeObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

Object.defineProperty(window, 'ResizeObserver', {
  value: MockResizeObserver,
  writable: true,
})

// jsdom doesn't implement pointer capture APIs used by some UI libs (Radix).
// Provide lightweight no-op shims so tests don't throw when those methods are invoked.
if (!(Element.prototype as any).hasPointerCapture) {
  ;(Element.prototype as any).hasPointerCapture = function () {
    return false
  }
}
if (!(Element.prototype as any).setPointerCapture) {
  ;(Element.prototype as any).setPointerCapture = function () {
    /* no-op for tests */
  }
}
if (!(Element.prototype as any).releasePointerCapture) {
  ;(Element.prototype as any).releasePointerCapture = function () {
    /* no-op for tests */
  }
}

// Lightweight mock for the app store selectors used across tests
// Export selectors with the same shape as src/core/store/index.ts
const mockHousehold = {
  id: 'household-test',
  members: [
    { id: 'user-1', name: 'Fulano' },
    { id: 'user-2', name: 'Sicrana' },
  ],
}

const mockUser = { id: 'user-1', name: 'Fulano' }

const mockSettings = {
  theme: 'dark',
  accentColor: '#3b82f6',
  notifications: {
    expenses: true,
    tasks: true,
    medications: true,
    documents: true,
  },
  language: 'pt-BR',
  currency: 'BRL',
}

const mockFeatureFlags = {
  enableSync: false,
  enableNotifications: true,
  enablePushExperimental: false,
}

vi.mock('@/core/store', async (importOriginal) => {
  // Preserve original exports so per-test partial mocks work with importOriginal
  const actual: any = await importOriginal()
  return Object.assign({}, actual, {
    useCurrentHousehold: () => mockHousehold,
    useCurrentUser: () => mockUser,
    useSettings: () => mockSettings,
    useFeatureFlags: () => mockFeatureFlags,
    useNotifications: () => ({ permission: 'default', unread: 0 }),
    usePWAStatus: () => ({ isInstallable: false, isInstalled: false }),
    useSyncStatus: () => ({ lastSyncAt: null, isSyncing: false, syncError: null }),
    useUIState: () => ({ isLoading: false, error: null }),
    // Also provide the primary store selector for tests that mock useAppStore
    useAppStore: () => ({
      currentHousehold: mockHousehold,
      currentUser: mockUser,
      settings: mockSettings,
      featureFlags: mockFeatureFlags,
      isLoading: false,
      error: null,
    }),
  })
})

// More complete in-memory db mock with a Dexie-like chainable API used by tests
const createChain = (getItems: () => any[], initialFilters: Array<(item: any) => boolean> = []) => {
  const filters = [...initialFilters]

  const applyFilters = () => {
    let items = getItems()
    for (const f of filters) items = items.filter(f)
    return items
  }

  const chain = {
    and: (fn: (item: any) => boolean) => createChain(getItems, [...filters, fn]),
    toArray: vi.fn(async () => applyFilters()),
    first: vi.fn(async () => applyFilters()[0]),
    count: vi.fn(async () => applyFilters().length),
  delete: vi.fn(async (_predicate?: any) => {
      // support delete() to remove all matched
      const items = applyFilters()
      const before = getItems().length
      for (const it of items) {
        const idx = getItems().findIndex(x => x && x.id === it.id)
        if (idx >= 0) getItems().splice(idx, 1)
      }
      return before - getItems().length
    }),
    // sortBy returns a Promise resolving to the sorted array (mimic Dexie's behavior when awaited)
    sortBy: vi.fn(async (_key: string) => {
      return applyFilters().slice().sort((a, b) => (a && b && a[_key] > b[_key] ? 1 : -1))
    }),
    // reverse returns a chain-like object that supports sortBy and toArray as async functions
    reverse: () => ({
      sortBy: vi.fn(async (_key: string) => {
        return applyFilters().slice().sort((a, b) => (a && b && a[_key] > b[_key] ? 1 : -1)).reverse()
      }),
  toArray: vi.fn(async () => applyFilters().slice().reverse()),
      and: (fn: (item: any) => boolean) => createChain(getItems, [...filters, fn]).reverse(),
    }),
  }

  return chain
}

// In-memory stores used by the mock
const expensesData: any[] = []
const notificationsData: any[] = []
const budgetsData: any[] = []

// Categories used by UI components (seed minimal Brazilian categories)
const categoriesData: any[] = [
  { id: 'category-1', name: 'Alimentação', color: '#f97316' },
  { id: 'category-2', name: 'Transporte', color: '#3b82f6' },
  { id: 'category-3', name: 'Saúde', color: '#ef4444' },
]

const findIndexById = (arr: any[], id: string) => arr.findIndex(x => x && x.id === id)

const expensesApi = {
  where: (criteria: Record<string, any> | string) => {
    if (typeof criteria === 'object') {
      const fn = (item: any) => Object.keys(criteria).every(k => item && item[k] === criteria[k])
      return createChain(() => expensesData, [fn])
    }

    // fallback: where('field').equals ? support minimal usage if needed
      // Provide minimal chain-compatible object so callers can call equals(...).and(...).toArray() etc.
      return {
        equals: (val: any) => createChain(() => expensesData, [(item: any) => item && item[criteria as string] === val]),
        above: (val: any) => createChain(() => expensesData, [(item: any) => item && item[criteria as string] > val]),
        below: (val: any) => createChain(() => expensesData, [(item: any) => item && item[criteria as string] < val]),
        toArray: vi.fn(async () => expensesData.slice()),
        // also expose sortBy/reverse to be safe
      sortBy: vi.fn(async (_key: string) => expensesData.slice().sort((a, b) => (a && b && a[_key] > b[_key] ? 1 : -1))),
        reverse: () => ({
          sortBy: vi.fn(async (key: string) => expensesData.slice().sort((a, b) => (a && b && a[key] > b[key] ? 1 : -1)).reverse()),
          toArray: vi.fn(async () => expensesData.slice().reverse()),
        }),
        and: (fn: (item: any) => boolean) => createChain(() => expensesData, [(item: any) => fn(item) && item && item[criteria as string] !== undefined]),
      }
  },
  toArray: vi.fn(async () => expensesData.slice()),
  get: vi.fn(async (id: string) => expensesData.find(x => x.id === id)),
  add: vi.fn(async (item: any) => {
    const copy = { ...item }
    if (!copy.id) copy.id = `mock-${Math.random().toString(16).slice(2, 10)}`
    expensesData.push(copy)
    return copy.id
  }),
  put: vi.fn(async (item: any) => {
    const idx = findIndexById(expensesData, item.id)
    if (idx >= 0) {
      expensesData[idx] = { ...expensesData[idx], ...item }
      return item.id
    }
    expensesData.push(item)
    return item.id
  }),
  update: vi.fn(async (id: string, patch: any) => {
    const idx = findIndexById(expensesData, id)
    if (idx >= 0) {
      expensesData[idx] = { ...expensesData[idx], ...patch }
      return 1
    }
    return 0
  }),
  delete: vi.fn(async (id: string) => {
    const idx = findIndexById(expensesData, id)
    if (idx >= 0) {
      expensesData.splice(idx, 1)
      return 1
    }
    return 0
  }),
}

const notificationsApi = {
  add: vi.fn(async (n: any) => {
    const copy = { ...n }
    if (!copy.id) copy.id = `notif-${Math.random().toString(16).slice(2, 10)}`
    notificationsData.push(copy)
    return copy.id
  }),
  where: (criteria: Record<string, any>) => {
    const fn = (item: any) => Object.keys(criteria).every(k => item && item[k] === criteria[k])
    return createChain(() => notificationsData, [fn])
  },
  toArray: vi.fn(async () => notificationsData.slice()),
}

const budgetsApi = {
  where: (criteria: Record<string, any>) => {
    const fn = (item: any) => Object.keys(criteria).every(k => item && item[k] === criteria[k])
    return createChain(() => budgetsData, [fn])
  },
  toArray: vi.fn(async () => budgetsData.slice()),
}

const categoriesApi = {
  toArray: vi.fn(async () => categoriesData.slice()),
  where: (criteria: Record<string, any>) => {
    const fn = (item: any) => Object.keys(criteria).every(k => item && item[k] === criteria[k])
    return createChain(() => categoriesData, [fn])
  },
  get: vi.fn(async (id: string) => categoriesData.find(x => x.id === id)),
}

const notificationPreferencesData: any[] = []

const notificationPreferencesApi = {
  where: (criteria: Record<string, any>) => {
    const fn = (item: any) => Object.keys(criteria).every(k => item && item[k] === criteria[k])
    return createChain(() => notificationPreferencesData, [fn])
  },
  first: vi.fn(async () => notificationPreferencesData[0]),
  add: vi.fn(async (item: any) => {
    const copy = { ...item }
    if (!copy.id) copy.id = `np-${Math.random().toString(16).slice(2, 10)}`
    notificationPreferencesData.push(copy)
    return copy.id
  }),
  update: vi.fn(async (id: string, patch: any) => {
    const idx = findIndexById(notificationPreferencesData, id)
    if (idx >= 0) {
      notificationPreferencesData[idx] = { ...notificationPreferencesData[idx], ...patch }
      return 1
    }
    return 0
  }),
}

// Simple blob store for attachments
const blobs: Record<string, { data: any; mime?: string }> = {}

const dbMockExtras = {
  getBlob: vi.fn(async (id: string) => blobs[id]?.data),
  storeBlob: vi.fn(async (id: string, data: any, mime?: string) => {
    blobs[id] = { data, mime }
    return id
  }),
  deleteBlob: vi.fn(async (id: string) => { delete blobs[id]; return true }),
  // soft delete an expense by marking deletedAt
  softDeleteExpense: vi.fn(async (id: string) => {
    const idx = findIndexById(expensesData, id)
    if (idx >= 0) {
      expensesData[idx] = { ...expensesData[idx], deletedAt: new Date().toISOString() }
      return 1
    }
    return 0
  }),
  // basic user helpers used by services
  isHouseholdMember: vi.fn(async (householdId: string, userId: string) => {
    // check in mockHousehold
    return mockHousehold && mockHousehold.id === householdId && mockHousehold.members.some(m => m.id === userId)
  }),
  getCurrentUser: vi.fn(async () => mockUser),
}

const dbMock = {
  expenses: expensesApi,
  notifications: notificationsApi,
  budgets: budgetsApi,
  // expose the in-memory arrays for tests to seed/inspect if needed
  __internal: {
    expensesData,
    notificationsData,
    budgetsData,
  },
  notificationPreferences: notificationPreferencesApi,
  getBlob: dbMockExtras.getBlob,
  storeBlob: dbMockExtras.storeBlob,
  deleteBlob: dbMockExtras.deleteBlob,
  softDeleteExpense: dbMockExtras.softDeleteExpense,
  isHouseholdMember: dbMockExtras.isHouseholdMember,
  getCurrentUser: dbMockExtras.getCurrentUser,
  categories: categoriesApi,
}

Object.defineProperty(globalThis, 'db', {
  value: dbMock,
  writable: true,
})

// Provide a module mock for imports of '@/core/db/database' so tests that import { db } get this
vi.mock('@/core/db/database', () => ({
  db: dbMock,
}))

// Playwright-style test fixtures shim: some integration tests import a fixtures file
// that uses Playwright's `test.describe`. In the Vitest environment we provide a
// small compatibility layer to avoid runtime errors when those files are executed.
try {
  // @ts-ignore
  if (typeof (globalThis as any).test === 'object' && typeof (globalThis as any).test.describe !== 'function') {
    // @ts-ignore
    (globalThis as any).test.describe = (name: string, fn: Function) => { fn() }
  }
} catch (e) {
  // ignore
}

