interface ImportMetaEnv {
  readonly MODE: string
  readonly DEV: boolean
  readonly PROD: boolean
  // Add other env keys here as needed for the app
  readonly VITE_USE_FIREBASE_EMULATOR?: string
  readonly VITE_FIRESTORE_EMULATOR_HOST?: string
  readonly VITE_FIRESTORE_EMULATOR_PORT?: string
  readonly VITE_AUTH_EMULATOR_HOST?: string
  readonly VITE_STORAGE_EMULATOR_HOST?: string
  readonly VITE_STORAGE_EMULATOR_PORT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
