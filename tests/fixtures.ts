import { test as base, expect } from '@playwright/test'
import { 
  connectAuthEmulator,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth'
import { 
  connectFirestoreEmulator,
  collection,
  addDoc,
  deleteDoc,
  getDocs,
  query,
  where
} from 'firebase/firestore'
import { auth, firestore } from '@/lib/firebase'

// Conectar aos emuladores
connectAuthEmulator(auth, 'http://localhost:9099')
connectFirestoreEmulator(firestore, 'localhost', 8080)

// Teste com autenticação e helpers
const test = base.extend({
  // Helper para autenticar usuário
  auth: async ({ page }, use) => {
    const email = `user${Date.now()}@test.com`
    const password = 'test123'

    // Criar usuário
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    )

    // Passar credenciais para o teste
    await use({
      email,
      password,
      uid: userCredential.user.uid
    })

    // Cleanup
    await deleteDoc(doc(firestore, 'users', userCredential.user.uid))
  },

  // Helper para criar household
  household: async ({ auth }, use) => {
    // Criar household
    const householdRef = await addDoc(collection(firestore, 'households'), {
      name: 'Test Household',
      ownerId: auth.uid,
      createdAt: new Date().toISOString(),
      createdBy: auth.uid,
      version: 1
    })

    // Criar membro
    await addDoc(collection(firestore, 'members'), {
      householdId: householdRef.id,
      userId: auth.uid,
      role: 'owner',
      createdAt: new Date().toISOString(),
      createdBy: auth.uid,
      version: 1
    })

    // Passar dados para o teste
    await use({
      id: householdRef.id,
      name: 'Test Household',
      ownerId: auth.uid
    })

    // Cleanup
    const memberQuery = query(
      collection(firestore, 'members'),
      where('householdId', '==', householdRef.id)
    )
    const memberDocs = await getDocs(memberQuery)
    await Promise.all(memberDocs.docs.map(doc => deleteDoc(doc.ref)))
    await deleteDoc(householdRef)
  },

  // Setup básico da página
  pageWithAuth: async ({ page, auth }, use) => {
    // Autenticar
    await page.goto('/')
    await page.evaluate(
      ([email, password]) => {
        return window.signIn(email, password)
      },
      [auth.email, auth.password]
    )
    await page.waitForURL('/app')
    
    await use(page)
  }
})

export { test, expect }