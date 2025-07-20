import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@services': path.resolve(__dirname, './src/services'),
      '@config': path.resolve(__dirname, './src/config'),
      '@components': path.resolve(__dirname, './src/components'),
      '@contexts': path.resolve(__dirname, './src/contexts')
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  },
  build: {
    outDir: 'dist',
    target: 'es2015',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          pocketbase: ['pocketbase']
        }
      },
      external: [],
      makeAbsoluteExternalsRelative: false
    }
  },
  define: {
    // Provide fallbacks for environment variables
    'import.meta.env.VITE_POCKETBASE_URL': JSON.stringify(
      process.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090'
    ),
    'import.meta.env.VITE_APP_NAME': JSON.stringify(
      process.env.VITE_APP_NAME || 'FlagFit Pro'
    ),
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(
      process.env.VITE_APP_VERSION || '1.0.1'
    )
  }
})