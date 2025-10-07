import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';

// Configuração do Firebase — atualizada com as credenciais de web que você informou
const requiredConfig = {
  apiKey: "AIzaSyBs0Xurf3zvOLyJDlttCWhgSdiaZ4D7PIo",
  authDomain: "despesas-compartilhadas.firebaseapp.com",
  projectId: "despesas-compartilhadas",
  storageBucket: "despesas-compartilhadas.firebasestorage.app",
  messagingSenderId: "958999401996",
  appId: "1:958999401996:web:2da3790e89cb2b93700029",
  measurementId: "G-97V1985F5B"
};

// Validar configuração
Object.entries(requiredConfig).forEach(([key, value]) => {
  if (!value) {
    throw new Error(`Firebase config missing: ${key}`);
  }
});

const firebaseConfig = requiredConfig;

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Analytics apenas em ambiente web e se measurementId estiver presente
try {
  if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
    // dynamic import to avoid including analytics on native builds where it may not exist
    import('firebase/analytics').then(({ getAnalytics }) => {
      try {
        getAnalytics(app)
        // eslint-disable-next-line no-console
        console.info('Firebase analytics initialized')
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Failed to init analytics', e)
      }
    }).catch(() => {
      // analytics not available in current environment
    })
  }
} catch (e) {
  // ignore
}

// Inicializar serviços
export const db = getFirestore(app);
export const auth = getAuth(app);
// Garantir que a autenticação (incluindo anônima) persista entre reloads
setPersistence(auth, browserLocalPersistence).catch(err => {
  // eslint-disable-next-line no-console
  console.warn('Falha ao definir persistência de auth (fallback para padrão):', err);
});
export const storage = getStorage(app);

// Environment flag to connect to local emulators during development
// Set VITE_USE_FIREBASE_EMULATOR=true when you want to run and test against local emulators.
const useEmulator = String(import.meta.env?.VITE_USE_FIREBASE_EMULATOR || 'false') === 'true';

// Only connect to emulators when explicitly requested via VITE_USE_FIREBASE_EMULATOR.
// Previously the code connected on import.meta.env.DEV which caused the app to attempt
// to contact localhost:9099 even when the emulator wasn't running (resulting in connection refused).
if (useEmulator) {
  try {
    // Default emulator ports: Firestore 8080, Auth 9099, Storage 9199
    // These can be overridden by env vars if you wish
    const firestoreHost = String(import.meta.env?.VITE_FIRESTORE_EMULATOR_HOST || 'localhost');
    const firestorePort = Number(import.meta.env?.VITE_FIRESTORE_EMULATOR_PORT || 8080);
    const authHost = String(import.meta.env?.VITE_AUTH_EMULATOR_HOST || 'http://localhost:9099');
    const storageHost = String(import.meta.env?.VITE_STORAGE_EMULATOR_HOST || 'localhost');
    const storagePort = Number(import.meta.env?.VITE_STORAGE_EMULATOR_PORT || 9199);

    // Connect emulators
    connectFirestoreEmulator(db, firestoreHost, firestorePort);
    // auth emulator expects a full host with protocol
    connectAuthEmulator(auth, authHost, { disableWarnings: true });
    connectStorageEmulator(storage, storageHost, storagePort);

    // eslint-disable-next-line no-console
    console.info('Connected to Firebase emulators:', { firestoreHost, firestorePort, authHost, storageHost, storagePort });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Failed to connect to Firebase emulators', e);
  }
} else {
  // eslint-disable-next-line no-console
  console.info('Firebase emulator NOT enabled. To use emulators set VITE_USE_FIREBASE_EMULATOR=true');
}
// Configurar Google Auth para mobile
if (Capacitor.isNativePlatform()) {
  console.log('Initializing Google Auth for native platform');
  GoogleAuth.initialize({
    clientId: '958999401996-e6erq73qrbdqkf41hh5paes022jcbd7r.apps.googleusercontent.com',
    scopes: ['profile', 'email'],
    grantOfflineAccess: false // Otimizado para melhor UX
  }).then(() => {
    console.log('Google Auth initialized successfully');
  }).catch((error) => {
    console.error('Error initializing Google Auth:', error);
  });
} else {
  // Para web, inicializar quando necessário
  console.log('Web platform detected - Google Auth will be configured on demand');
}

// Emuladores para desenvolvimento (descomente se necessário)
// import { connectFirestoreEmulator } from 'firebase/firestore';
// import { connectAuthEmulator } from 'firebase/auth';
// if (import.meta.env.DEV) {
//   connectFirestoreEmulator(db, 'localhost', 8080);
//   connectAuthEmulator(auth, 'http://localhost:9099');
// }

export default app;