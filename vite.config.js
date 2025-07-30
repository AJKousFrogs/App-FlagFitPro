import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Check if we're in development mode
const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production'

// Detect environments that need polling for file watching
const needsPolling = () => {
  try {
    // Force polling via environment variable
    if (process.env.VITE_USE_POLLING === 'true') return true
    
    // Check for common environments that need polling
    const isWSL = process.platform === 'linux' && process.env.WSL_DISTRO_NAME
    const isDocker = process.env.IS_DOCKER || process.env.DOCKER_CONTAINER
    const isCodespaces = process.env.CODESPACES
    const isGitpod = process.env.GITPOD_WORKSPACE_ID
    
    return !!(isWSL || isDocker || isCodespaces || isGitpod)
  } catch (error) {
    // Fallback to false if detection fails
    return false
  }
}

export default defineConfig({
  plugins: [
    react({
      // Enable Fast Refresh for better HMR experience
      fastRefresh: true,
      // Include dev tools in development
      babel: isDev ? {
        plugins: ['@babel/plugin-transform-react-jsx-development']
      } : undefined
    })
  ],
  
  // Development-specific settings
  ...(isDev && {
    // Enable detailed logging in development
    logLevel: 'info',
    // Clear screen on rebuild
    clearScreen: true,
    // Enable CSS source maps in development
    css: {
      devSourcemap: true
    }
  }),
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
    sourcemap: isDev, // Enable sourcemaps in development for debugging
    
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
    host: 'localhost',
    port: process.env.VITE_DEV_PORT || 4000,
    strictPort: false, // Allow port fallback
    open: false, // Don't auto-open browser
    cors: true, // Enable CORS for API calls
    hmr: {
      port: process.env.VITE_HMR_PORT || (process.env.VITE_DEV_PORT || 4000),
      overlay: true, // Show error overlay in development
      clientPort: process.env.VITE_HMR_PORT || (process.env.VITE_DEV_PORT || 4000)
    },
    watch: {
      // Intelligent polling detection for better cross-platform compatibility
      usePolling: needsPolling(),
      // Optimized intervals based on environment
      interval: needsPolling() ? 1000 : 100, // Slower polling for remote filesystems
      binaryInterval: needsPolling() ? 2000 : 1000, // Binary file polling
      ignored: [
        '**/node_modules/**', 
        '**/dist/**',
        '**/.git/**',
        '**/coverage/**',
        '**/.nyc_output/**'
      ],
      // Additional options for problematic environments
      ...(needsPolling() && {
        // Use polling for all files in problematic environments
        usePolling: true,
        // More aggressive polling options
        atomic: false, // Disable atomic writes detection
        alwaysStat: true, // Always use fs.stat for file changes
      })
    },
    // Warm up frequently used files for faster HMR
    warmup: {
      clientFiles: [
        './src/main.jsx',
        './src/App.jsx',
        './src/components/**/*.jsx',
        './src/pages/**/*.jsx',
        './src/services/**/*.js'
      ]
    }
  },
  
  // Preview server optimizations  
  preview: {
    host: true,
    port: process.env.VITE_PREVIEW_PORT || 4173,
    strictPort: false // Allow port fallback
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
    'import.meta.env.VITE_APP_ENVIRONMENT': JSON.stringify('development'),
    // File watching configuration info
    'import.meta.env.VITE_WATCH_POLLING': JSON.stringify(needsPolling().toString()),
    'import.meta.env.VITE_WATCH_INTERVAL': JSON.stringify(needsPolling() ? '1000' : '100')
  }

  // Environment-specific overrides for file watching issues
  // Set VITE_USE_POLLING=true to force polling mode
  // Set VITE_WATCH_INTERVAL=2000 for slower polling if needed
})