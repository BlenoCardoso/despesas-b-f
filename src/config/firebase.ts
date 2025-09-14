import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';

// Configuração correta do projeto Firebase (extraída do console e google-services.json)
const requiredConfig = {
  apiKey: "AIzaSyDJNkcwzqBM9Ef7G_PlKMD35naPKarTczM", // Da segunda imagem
  authDomain: "despesas-compartilhadas.firebaseapp.com", 
  projectId: "despesas-compartilhadas", // Confirmado
  storageBucket: "despesas-compartilhadas.firebasestorage.app", // Confirmado
  messagingSenderId: "958999401996", // Project number do google-services.json
  appId: "1:958999401996:android:8a36397482a2568f700029", // Do google-services.json (temporário)
  measurementId: "G-LLM8G3T2VF" // Mantendo
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

// Configurar Google Auth para mobile
if (Capacitor.isNativePlatform()) {
  GoogleAuth.initialize({
    clientId: '958999401996-e6erq73qrbdqkf41hh5paes022jcbd7r.apps.googleusercontent.com', // Do google-services.json
    scopes: ['profile', 'email'],
    grantOfflineAccess: true
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