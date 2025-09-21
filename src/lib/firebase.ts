import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Use Vite environment variables and a feature flag to enable Firebase only when desired
const _meta: any = import.meta
const enabled = String(_meta.env?.VITE_FIREBASE_ENABLED || 'false') === 'true'

let _auth: ReturnType<typeof getAuth> | null = null
let _firestore: ReturnType<typeof getFirestore> | null = null

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
    // If initialization fails, log and leave stubs so app doesn't crash
    // eslint-disable-next-line no-console
    console.warn('Firebase initialization failed:', e)
  }
} else {
  // If disabled, provide no-op placeholders to avoid runtime errors in imports
  // We'll export minimal shapes expected by the app (auth.currentUser etc.)
  // Keep them null/empty so authorization checks behave as "not authenticated" by default
}

// Export safe accessors
export const auth = _auth as any
export const firestore = _firestore as any