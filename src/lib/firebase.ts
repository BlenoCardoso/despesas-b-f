import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Use Vite environment variables and a feature flag to enable Firebase only when desired
const _meta: any = import.meta
const enabled = String(_meta.env?.VITE_FIREBASE_ENABLED || 'false') === 'true'

// Real instances (populated only when enabled)
let _auth: any = null
let _firestore: any = null

if (enabled) {
  const firebaseConfig = {
    apiKey: _meta.env?.VITE_FIREBASE_API_KEY,
    authDomain: _meta.env?.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: _meta.env?.VITE_FIREBASE_PROJECT_ID,
    storageBucket: _meta.env?.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: _meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: _meta.env?.VITE_FIREBASE_APP_ID,
    measurementId: _meta.env?.VITE_FIREBASE_MEASUREMENT_ID,
  }

  try {
    const app = initializeApp(firebaseConfig)
    _auth = getAuth(app)
    _firestore = getFirestore(app)
  } catch (e) {
    // If initialization fails, log and continue with stubs so app doesn't crash
    // eslint-disable-next-line no-console
    console.warn('Firebase initialization failed:', e)
  }
}

// Safe stubs when Firebase is disabled or initialization failed
// (no-op helper intentionally omitted)

const authStub = {
  currentUser: null,
  // onAuthStateChanged should accept a callback and return an unsubscribe
  onAuthStateChanged: (cb: (user: any) => void) => {
    // call with null (not authenticated) on next tick
    setTimeout(() => cb(null), 0)
    return () => {}
  },
  signInWithPopup: async () => {
    throw new Error('Firebase sign-in is disabled in this environment')
  },
  signOut: async () => {
    return Promise.resolve()
  },
}

// Minimal Firestore stub that won't throw when code imports firestore functions
const firestoreStub = {
  collection: () => ({
    doc: () => ({
      get: async () => ({ exists: false, data: () => null }),
      set: async () => ({}),
      update: async () => ({}),
      delete: async () => ({}),
    }),
    add: async () => ({ id: 'stub' }),
    where: () => ({ get: async () => ({ docs: [] }) }),
  }),
}

// Export either real instances or safe stubs preserving the common API surface
export const auth = _auth || authStub
export const firestore = _firestore || firestoreStub