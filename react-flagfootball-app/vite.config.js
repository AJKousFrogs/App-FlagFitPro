import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    target: 'esnext',
    minify: 'terser',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React
          vendor: ['react', 'react-dom'],
          
          // Routing
          router: ['react-router-dom'],
          
          // UI Libraries  
          ui: ['antd'],
          radix: ['@radix-ui/react-icons', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          
          // Database & API
          database: ['drizzle-orm', '@neondatabase/serverless'],
          pocketbase: ['pocketbase'],
          
          // Charts & Analytics
          charts: ['recharts'],
          
          // State Management
          state: ['zustand', '@tanstack/react-query']
        },
        // Optimize chunk names and hashing
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Performance optimizations
    chunkSizeWarningLimit: 500,
    assetsInlineLimit: 4096,
    
    // Terser options for better compression
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  
  // Development server optimizations
  server: {
    host: true,
    port: 5173
  },
  
  // Preview server optimizations  
  preview: {
    host: true,
    port: 4173
  },
  
  define: {
    // Provide fallbacks for environment variables
    'import.meta.env.VITE_POCKETBASE_URL': JSON.stringify(
      process.env.VITE_POCKETBASE_URL || process.env.NETLIFY_DATABASE_URL || 'http://127.0.0.1:8090'
    ),
    'import.meta.env.VITE_APP_NAME': JSON.stringify(
      process.env.VITE_APP_NAME || 'FlagFit Pro'
    ),
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(
      process.env.VITE_APP_VERSION || '1.0.6'
    ),
    'import.meta.env.VITE_NEON_DATABASE_URL': JSON.stringify(
      process.env.VITE_NEON_DATABASE_URL || process.env.NETLIFY_DATABASE_URL || ''
    )
  }
})