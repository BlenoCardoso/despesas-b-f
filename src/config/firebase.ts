import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';

// Configuração correta do projeto Firebase (extraída do console e google-services.json)
const requiredConfig = {
  apiKey: "AIzaSyDJNkcwzqBM9Ef7G_PlKMD35naPKarTczM",
  authDomain: "despesas-compartilhadas.firebaseapp.com", 
  projectId: "despesas-compartilhadas",
  storageBucket: "despesas-compartilhadas.firebasestorage.app",
  messagingSenderId: "958999401996",
  appId: "1:958999401996:android:8a36397482a2568f700029",
  measurementId: "G-LLM8G3T2VF"
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

// Inicializar serviços
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

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