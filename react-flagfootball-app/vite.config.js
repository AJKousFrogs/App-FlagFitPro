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
        manualChunks: (id) => {
          // Core React - keep minimal for fast loading
          if (id.includes('react/') || id.includes('react-dom/')) {
            return 'react-core';
          }
          
          // Router - load early for navigation
          if (id.includes('react-router')) {
            return 'router';
          }
          
          // Critical UI components
          if (id.includes('src/components/LoadingSpinner') || 
              id.includes('src/components/ErrorBoundary')) {
            return 'critical-ui';
          }
          
          // Large UI libraries - defer loading
          if (id.includes('antd')) {
            return 'ui-antd';
          }
          
          // Radix UI - split by component type
          if (id.includes('@radix-ui/')) {
            if (id.includes('dialog') || id.includes('dropdown') || id.includes('select')) {
              return 'radix-interactive';
            }
            return 'radix-base';
          }
          
          // Database - only load when needed
          if (id.includes('drizzle-orm') || id.includes('@neondatabase/serverless')) {
            return 'database';
          }
          
          // Legacy PocketBase - separate chunk
          if (id.includes('pocketbase')) {
            return 'pocketbase';
          }
          
          // Charts - defer until dashboard
          if (id.includes('recharts')) {
            return 'charts';
          }
          
          // State management
          if (id.includes('zustand') || id.includes('@tanstack/react-query')) {
            return 'state';
          }
          
          // View components - lazy load
          if (id.includes('src/views/')) {
            const viewName = id.split('/').pop()?.replace('.jsx', '');
            if (viewName === 'LoginView' || viewName === 'RegisterView') {
              return 'auth-views';
            }
            return 'app-views';
          }
          
          // Utilities and helpers
          if (id.includes('src/utils/') || id.includes('src/hooks/')) {
            return 'utils';
          }
          
          // Node modules - vendor chunks
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        // Optimize chunk names and hashing
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Performance optimizations
    chunkSizeWarningLimit: 300, // Smaller chunks for better loading
    assetsInlineLimit: 2048, // Inline smaller assets
    
    // Enable code splitting and tree shaking
    sourcemap: false, // Disable sourcemaps in production for smaller bundles
    
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
      process.env.VITE_APP_VERSION || '1.0.7'
    ),
    'import.meta.env.VITE_NEON_DATABASE_URL': JSON.stringify(
      process.env.VITE_NEON_DATABASE_URL || process.env.NETLIFY_DATABASE_URL || ''
    )
  }
})