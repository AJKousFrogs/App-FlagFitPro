/**
 * Radix UI Custom Theme Configuration
 * Based on the color palettes from Radix UI documentation
 */

// Light theme color palette
export const lightTheme = {
  colors: {
    // Accent colors (olive/green from your first image)
    accent: {
      1: '#fdfcfd',
      2: '#f7f6f5', 
      3: '#edeae3',
      4: '#e4ddd1',
      5: '#ddd2bd',
      6: '#d3c6a6',
      7: '#c5b588',
      8: '#b5a05e',
      9: '#777733', // Main accent color
      10: '#6e6d2e',
      11: '#5c5a29',
      12: '#2e2d1c'
    },
    
    // Gray colors 
    gray: {
      1: '#fcfcfc',
      2: '#f9f9f9',
      3: '#f0f0f0',
      4: '#e8e8e8',
      5: '#e0e0e0',
      6: '#d6d6d6',
      7: '#c7c7c7',
      8: '#b5b5b5',
      9: '#111111', // Main gray
      10: '#0e0e0e',
      11: '#0b0b0b',
      12: '#080808'
    },

    // Background colors
    background: {
      base: '#ffffff',
      subtle: '#fefefe',
      ui: '#f9f9f9',
      hover: '#f2f2f2',
      pressed: '#eaeaea'
    },

    // Text colors
    text: {
      primary: '#11181c',
      secondary: '#687076', 
      tertiary: '#889096',
      quaternary: '#a1a7ad'
    }
  }
};

// Dark theme color palette  
export const darkTheme = {
  colors: {
    // Accent colors (olive/green adapted for dark)
    accent: {
      1: '#151514',
      2: '#1a1a17',
      3: '#202017',
      4: '#26251c',
      5: '#2d2b22',
      6: '#363227',
      7: '#433e2d',
      8: '#544d37',
      9: '#777733', // Same main accent
      10: '#8b8540',
      11: '#a09c4c',
      12: '#e4e2b8'
    },

    // Gray colors (dark)
    gray: {
      1: '#111111',
      2: '#191919', 
      3: '#222222',
      4: '#2a2a2a',
      5: '#313131',
      6: '#3a3a3a',
      7: '#484848',
      8: '#606060',
      9: '#6e6e6e',
      10: '#7b7b7b',
      11: '#b4b4b4',
      12: '#eeeeee'
    },

    // Background colors (dark)
    background: {
      base: '#111111',
      subtle: '#151515',
      ui: '#191919',
      hover: '#1f1f1f',
      pressed: '#262626'
    },

    // Text colors (dark)
    text: {
      primary: '#ffffff',
      secondary: '#b4b4b4',
      tertiary: '#8b8b8b', 
      quaternary: '#6e6e6e'
    }
  }
};

// Semantic color mappings
export const semanticColors = {
  light: {
    success: '#30a46c',
    warning: '#f76b15', 
    error: '#e5484d',
    info: '#0090ff',
    
    // Component-specific colors
    border: '#e4e4e7',
    input: '#ffffff',
    ring: '#0ea5e9',
    
    // State colors
    destructive: '#ef4444',
    muted: '#f1f5f9',
    mutedForeground: '#64748b',
    popover: '#ffffff',
    popoverForeground: '#0f172a',
    card: '#ffffff',
    cardForeground: '#0f172a'
  },
  
  dark: {
    success: '#46a758',
    warning: '#f76b15',
    error: '#e5484d', 
    info: '#0090ff',
    
    // Component-specific colors (dark)
    border: '#27272a',
    input: '#1a1a1a',
    ring: '#0ea5e9',
    
    // State colors (dark) 
    destructive: '#ef4444',
    muted: '#1e293b',
    mutedForeground: '#94a3b8',
    popover: '#1a1a1a',
    popoverForeground: '#f8fafc',
    card: '#1a1a1a',
    cardForeground: '#f8fafc'
  }
};

// CSS Custom Properties generator
export const generateCSSVariables = (theme, semantic, isDark = false) => {
  const prefix = isDark ? 'dark' : 'light';
  
  let css = `:root${isDark ? '.dark' : ''} {\n`;
  
  // Add accent colors
  Object.entries(theme.colors.accent).forEach(([key, value]) => {
    css += `  --${prefix}-accent-${key}: ${value};\n`;
  });
  
  // Add gray colors
  Object.entries(theme.colors.gray).forEach(([key, value]) => {
    css += `  --${prefix}-gray-${key}: ${value};\n`;
  });
  
  // Add background colors
  Object.entries(theme.colors.background).forEach(([key, value]) => {
    css += `  --${prefix}-background-${key}: ${value};\n`;
  });
  
  // Add text colors
  Object.entries(theme.colors.text).forEach(([key, value]) => {
    css += `  --${prefix}-text-${key}: ${value};\n`;
  });
  
  // Add semantic colors
  Object.entries(semantic).forEach(([key, value]) => {
    css += `  --${prefix}-${key}: ${value};\n`;
  });
  
  css += '}\n\n';
  return css;
};

// Generate full CSS
export const generateFullCSS = () => {
  let css = '/* Radix UI Custom Theme Variables */\n\n';
  
  css += generateCSSVariables(lightTheme, semanticColors.light, false);
  css += generateCSSVariables(darkTheme, semanticColors.dark, true);
  
  return css;
};

// Tailwind CSS color configuration
export const tailwindColors = {
  accent: {
    1: 'var(--accent-1)',
    2: 'var(--accent-2)',
    3: 'var(--accent-3)',
    4: 'var(--accent-4)', 
    5: 'var(--accent-5)',
    6: 'var(--accent-6)',
    7: 'var(--accent-7)',
    8: 'var(--accent-8)',
    9: 'var(--accent-9)',
    10: 'var(--accent-10)',
    11: 'var(--accent-11)',
    12: 'var(--accent-12)',
    DEFAULT: 'var(--accent-9)',
    foreground: 'var(--accent-12)'
  },
  
  gray: {
    1: 'var(--gray-1)',
    2: 'var(--gray-2)',
    3: 'var(--gray-3)',
    4: 'var(--gray-4)',
    5: 'var(--gray-5)', 
    6: 'var(--gray-6)',
    7: 'var(--gray-7)',
    8: 'var(--gray-8)',
    9: 'var(--gray-9)',
    10: 'var(--gray-10)',
    11: 'var(--gray-11)',
    12: 'var(--gray-12)',
    DEFAULT: 'var(--gray-9)',
    foreground: 'var(--gray-12)'
  },
  
  // Semantic mappings
  background: 'var(--background-base)',
  foreground: 'var(--text-primary)',
  card: 'var(--card)',
  'card-foreground': 'var(--card-foreground)',
  popover: 'var(--popover)',
  'popover-foreground': 'var(--popover-foreground)',
  muted: 'var(--muted)',
  'muted-foreground': 'var(--muted-foreground)',
  border: 'var(--border)',
  input: 'var(--input)',
  ring: 'var(--ring)',
  destructive: 'var(--destructive)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  info: 'var(--info)'
};