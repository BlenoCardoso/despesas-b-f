import { test, expect } from './fixtures'
import { collection, addDoc } from 'firebase/firestore'
import { firestore, auth } from '@/lib/firebase'
import { createUserWithEmailAndPassword } from 'firebase/auth'

test('invite flow: accept and revoke', async ({ pageWithAuth, household }: any) => {
  // Owner is already authenticated by pageWithAuth helper and household created.
  // Create an invite programmatically in the emulator
  const code = `TST${Date.now().toString().slice(-5)}`
  await addDoc(collection(firestore, 'invites'), {
    householdId: household.id,
    code,
    invitedBy: household.ownerId,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    maxUses: 1,
    uses: 0,
    status: 'pending',
    createdAt: new Date().toISOString()
  })

  // Create user B via emulator SDK
  const emailB = `userb${Date.now()}@test.com`
  const password = 'test123'
  // Create user B via Auth emulator REST endpoint
  const createB = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=any', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: emailB, password, returnSecureToken: true })
  })
  const userBJson = await createB.json()

  // Sign in as user B in the browser and navigate to the invite link via test helper
  await pageWithAuth.evaluate(async ([email, password]: any) => {
    // @ts-ignore
    return window.signIn(email, password)
  }, [emailB, password])

  await pageWithAuth.goto(`/convite/${code}`)
  await pageWithAuth.click('[data-testid="accept-invite-button"]')
  await pageWithAuth.waitForURL(/\/app\/h\//)

  // Now sign back as owner and revoke the invite via UI
  // Sign out then sign in as owner (household.ownerId email isn't available here, use pageWithAuth which is owner)
  await pageWithAuth.goto('/app/h/' + household.id + '/settings')
  await pageWithAuth.waitForSelector('text=Convites Ativos')

  // Click revoke for the invite
  await pageWithAuth.click(`[data-testid="revoke-invite-${code}"]`)
  // Confirm dialog: click 'Revogar' button
  await pageWithAuth.click('button:has-text("Revogar")')

  // Create a new user C and try to use the revoked code
  const emailC = `userc${Date.now()}@test.com`
  await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=any', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: emailC, password, returnSecureToken: true })
  })
  await pageWithAuth.evaluate(async ([email, password]: any) => {
    // @ts-ignore
    return window.signIn(email, password)
  }, [emailC, password])

  await pageWithAuth.goto(`/convite/${code}`)
  // Should be redirected to / because invite is invalid
  await pageWithAuth.waitForURL('/')
  expect(pageWithAuth.url()).toMatch(/\/$/)
})
