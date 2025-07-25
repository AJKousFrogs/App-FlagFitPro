import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    target: 'es2020', // Better compatibility than esnext
    minify: 'terser',
    cssMinify: true,
    commonjsOptions: {
      include: [/node_modules/]
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React ecosystem - keep all together to preserve internal dependencies
          if (id.includes('react/') || id.includes('react-dom/') || id.includes('scheduler/')) {
            return 'react-core';
          }
          
          // Router - load early for navigation
          if (id.includes('react-router')) {
            return 'router';
          }
          
          // Critical UI components
          if (id.includes('src/components/LoadingSpinner') || 
              id.includes('src/components/ErrorBoundary') ||
              id.includes('src/components/CriticalLoader')) {
            return 'critical-ui';
          }
          
          // Large UI libraries - defer loading
          if (id.includes('antd')) {
            return 'ui-antd';
          }
          
          // Radix UI - keep all Radix components together to avoid hook issues
          if (id.includes('@radix-ui/')) {
            return 'radix-ui';
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
          
          // Node modules - vendor chunks (but exclude React ecosystem and Radix)
          if (id.includes('node_modules') && 
              !id.includes('react') && 
              !id.includes('@radix-ui')) {
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
    // Provide production-ready environment variables with proper fallbacks
    'import.meta.env.VITE_POCKETBASE_URL': JSON.stringify(
      process.env.VITE_POCKETBASE_URL || process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL || ''
    ),
    'import.meta.env.VITE_APP_NAME': JSON.stringify(
      process.env.VITE_APP_NAME || 'FlagFit Pro'
    ),
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(
      process.env.VITE_APP_VERSION || '1.0.7'
    ),
    'import.meta.env.VITE_NEON_DATABASE_URL': JSON.stringify(
      process.env.VITE_NEON_DATABASE_URL || process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL || ''
    ),
    'import.meta.env.VITE_APP_ENVIRONMENT': JSON.stringify(
      process.env.VITE_APP_ENVIRONMENT || process.env.NODE_ENV || 'production'
    )
  }
})