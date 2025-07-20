import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          pocketbase: ['pocketbase']
        }
      }
    }
  },
  define: {
    // Provide fallbacks for environment variables
    'import.meta.env.VITE_POCKETBASE_URL': JSON.stringify(
      process.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090'
    ),
    'import.meta.env.VITE_APP_NAME': JSON.stringify(
      process.env.VITE_APP_NAME || 'MERLINS PLAYBOOK'
    ),
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(
      process.env.VITE_APP_VERSION || '1.0.1'
    )
  }
})