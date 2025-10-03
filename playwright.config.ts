import { defineConfig } from '@playwright/test'

export default defineConfig({
  timeout: 120000,
  testDir: 'tests',
  testMatch: ['**/*.spec.ts'],
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'User A',
      use: { browserName: 'chromium', viewport: { width: 1280, height: 720 } }
    },
    {
      name: 'User B',
      use: { browserName: 'chromium', viewport: { width: 1280, height: 720 } }
    }
  ],
  webServer: {
    command: 'pnpm run dev',
    port: 5173,
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
    // Ensure the Vite dev server runs with the same test/emulator flags so
    // the app exposes test helpers (window.signIn) and connects to emulators.
    env: {
      VITE_USE_FIREBASE_EMULATOR: 'true',
      PLAYWRIGHT_TEST: '1'
    }
  }
})