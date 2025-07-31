/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'poppins': ['Poppins', 'sans-serif'],
      },
      colors: {
        // Radix Colors Palette - Light Theme
        'radix': {
          // Accent colors (blue)
          'accent-1': '#f8fafc',
          'accent-2': '#f1f5f9',
          'accent-3': '#e2e8f0',
          'accent-4': '#cbd5e1',
          'accent-5': '#94a3b8',
          'accent-6': '#64748b',
          'accent-7': '#475569',
          'accent-8': '#334155',
          'accent-9': '#1e293b',
          'accent-10': '#0f172a',
          'accent-11': '#5271FF', // Main accent
          'accent-12': '#0c4a6e',
          
          // Gray colors
          'gray-1': '#fafafa',
          'gray-2': '#f5f5f5',
          'gray-3': '#e5e5e5',
          'gray-4': '#d4d4d4',
          'gray-5': '#a3a3a3',
          'gray-6': '#8a8a8a',
          'gray-7': '#4b4b4b',
          'gray-8': '#333333',
          'gray-9': '#111111', // Main gray
          'gray-10': '#000000',
          'gray-11': '#111111',
          'gray-12': '#000000',
          
          // Background colors
          'background-1': '#ffffff',
          'background-2': '#fafafa',
          'background-3': '#f5f5f5',
          'background-4': '#f0f0f0',
          'background-5': '#e5e5e5',
          'background-6': '#d4d4d4',
          'background-7': '#a3a3a3',
          'background-8': '#8a8a8a',
          'background-9': '#4b4b4b',
          'background-10': '#333333',
          'background-11': '#111111',
          'background-12': '#000000',
        },
        
        // Dark theme overrides
        'dark': {
          'accent-1': '#0f172a',
          'accent-2': '#1e293b',
          'accent-3': '#334155',
          'accent-4': '#475569',
          'accent-5': '#64748b',
          'accent-6': '#94a3b8',
          'accent-7': '#cbd5e1',
          'accent-8': '#e2e8f0',
          'accent-9': '#f1f5f9',
          'accent-10': '#f8fafc',
          'accent-11': '#ffffff', // Main accent in dark mode
          'accent-12': '#f0f9ff',
          
          'gray-1': '#000000',
          'gray-2': '#111111',
          'gray-3': '#333333',
          'gray-4': '#4b4b4b',
          'gray-5': '#8a8a8a',
          'gray-6': '#a3a3a3',
          'gray-7': '#d4d4d4',
          'gray-8': '#e5e5e5',
          'gray-9': '#5271FF', // Main gray in dark mode
          'gray-10': '#f5f5f5',
          'gray-11': '#fafafa',
          'gray-12': '#ffffff',
          
          'background-1': '#000000',
          'background-2': '#111111',
          'background-3': '#333333',
          'background-4': '#4b4b4b',
          'background-5': '#8a8a8a',
          'background-6': '#a3a3a3',
          'background-7': '#d4d4d4',
          'background-8': '#e5e5e5',
          'background-9': '#f5f5f5',
          'background-10': '#fafafa',
          'background-11': '#ffffff',
          'background-12': '#ffffff',
        }
      },
    },
  },
  plugins: [],
} 