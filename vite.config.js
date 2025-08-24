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
    host: '127.0.0.1',
    port: 3000,
    strictPort: false,
    open: false
  },
  
  // Preview server optimizations  
  preview: {
    host: true,
    port: 4173
  },
  
  // Resolve configuration to ensure proper module resolution
  resolve: {
    alias: {
      'react': 'react',
      'react-dom': 'react-dom'
    }
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@radix-ui/react-slot',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-label',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-select',
      '@radix-ui/react-avatar',
      '@radix-ui/react-menubar',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-aspect-ratio',
      '@radix-ui/react-icons',
      '@radix-ui/react-use-layout-effect'
    ]
  },
  
  define: {
    // Provide production-ready environment variables with proper fallbacks
    'import.meta.env.VITE_POCKETBASE_URL': JSON.stringify('http://127.0.0.1:8090'),
    'import.meta.env.VITE_APP_NAME': JSON.stringify('FlagFit Pro'),
    'import.meta.env.VITE_APP_VERSION': JSON.stringify('1.0.7'),
    'import.meta.env.VITE_NEON_DATABASE_URL': JSON.stringify(''),
    'import.meta.env.VITE_APP_ENVIRONMENT': JSON.stringify('development')
  }
})