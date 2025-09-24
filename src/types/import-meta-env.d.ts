interface ImportMetaEnv {
  readonly MODE: string
  readonly DEV: boolean
  readonly PROD: boolean
  // Add other env keys here as needed for the app
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
