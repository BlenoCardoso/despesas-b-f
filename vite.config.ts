import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ['immer'],
  },
  server: {
    host: '0.0.0.0', // Permite acesso de qualquer dispositivo na rede
    port: 5173,
    strictPort: true,
    hmr: {
      // Configuração otimizada para HMR via LAN
      protocol: 'ws',
      port: 5173,
      // Permite conexões de qualquer origem para desenvolvimento
      clientPort: 5173,
    },
    // Permite CORS para desenvolvimento
    cors: true,
    // Não abre automaticamente o navegador
    open: false,
  },
  build: {
    target: 'es2022',
    // Ensure Capacitor picks up the latest web assets by building into 'www'
    // Capacitor sync is currently copying from 'www' -> android assets
    outDir: 'www',
  },
  define: {
    global: 'globalThis',
  },
})
