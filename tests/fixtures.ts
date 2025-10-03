import { test as base, expect } from '@playwright/test'
import { 
  connectAuthEmulator,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth'
import { 
  connectFirestoreEmulator,
  collection,
  doc,
  addDoc,
  deleteDoc,
  setDoc,
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

    // Criar usuário diretamente no Auth Emulator via REST API porque
    // createUserWithEmailAndPassword tem falhado no runner Node em alguns ambientes.
    // A API do emulator aceita qualquer 'key' e retorna localId (uid).
    const signUpRes = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=any', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    })
    const userJson = await signUpRes.json()
    const userCredential = { user: { uid: userJson.localId } }

    // Passar credenciais para o teste
    await use({
      email,
      password,
      uid: userCredential.user.uid
    })

    // Cleanup: don't attempt privileged deletions here to avoid rules/permission issues.
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
    // create member document under households/{householdId}/members/{uid}
    const memberRef = doc(firestore, 'households', householdRef.id, 'members', auth.uid)
    await setDoc(memberRef, {
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
    // Cleanup: remove member subcollection doc and household
    await deleteDoc(doc(firestore, 'households', householdRef.id, 'members', auth.uid))
    await deleteDoc(householdRef)
  },

  // Setup básico da página
  pageWithAuth: async ({ page, auth }, use) => {
    // Autenticar
    // Install a guaranteed init-time signIn helper so tests don't race with app bootstrap.
    await page.addInitScript(() => {
      // @ts-ignore
      if ((window as any).signIn) return
      // @ts-ignore
      window.signIn = (email: string, password: string) => {
        return new Promise((resolve, reject) => {
          const start = Date.now()
          const timeout = 45000
          async function attempt() {
            try {
              // @ts-ignore
              if ((window as any).__testAuth) {
                // dynamic import inside page context
                const m = await (window as any).import('firebase/auth')
                return m.signInWithEmailAndPassword((window as any).__testAuth, email, password).then(resolve).catch(reject)
              }
              if (Date.now() - start > timeout) return reject(new Error('test helper timed out'))
              setTimeout(attempt, 200)
            } catch (err) {
              return reject(err)
            }
          }
          attempt()
        })
      }
    })

    // Surface browser console and errors into the Playwright test output for debugging
    page.on('console', msg => console.log(`PAGE LOG: ${msg.type()} ${msg.text()}`))
    page.on('pageerror', err => console.log(`PAGE ERROR: ${err.message}`))

    await page.goto('/')
    await page.waitForLoadState('load')
  // Wait for the app to mark that main.tsx ran so we don't miss early initialization
  await page.waitForFunction(() => (window as any).__app_bootstrapped === true, null, { timeout: 15000 })
  // give it more time in CI/slow machines and allow a brief initial delay for Vite HMR and module loading.
  await page.waitForTimeout(500)
  await page.waitForFunction(() => (window as any).signIn !== undefined, null, { timeout: 45000 })
    await page.evaluate(
      ([email, password]) => {
        // @ts-ignore
        return window.signIn(email, password)
      },
      [auth.email, auth.password]
    )
    // Wait for the app auth state to reflect the signed-in user instead of relying
    // on a specific route. This is more stable across app versions.
    await page.waitForFunction(() => {
      // @ts-ignore
      return !!(window as any).__appAuth?.currentUser || !!(window as any).__testAuth?.currentUser
    }, null, { timeout: 60000 })
    
    await use(page)
  }
})

export { test, expect }