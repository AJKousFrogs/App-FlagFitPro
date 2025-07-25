/**
 * Radix UI Custom Theme Configuration
 * Based on the color palettes from Radix UI documentation
 */

// Light theme color palette
export const lightTheme = {
  colors: {
    // Accent colors (FlagFit Pro green)
    accent: {
      1: '#f0fdf4',
      2: '#dcfce7', 
      3: '#bbf7d0',
      4: '#86efac',
      5: '#4ade80',
      6: '#22c55e',
      7: '#16a34a',
      8: '#15803d',
      9: '#166534', // Main accent color - FlagFit Pro green
      10: '#14532d',
      11: '#052e16',
      12: '#022c22'
    },
    
    // Gray colors (FlagFit Pro black/white theme)
    gray: {
      1: '#ffffff', // Pure white
      2: '#fafafa',
      3: '#f5f5f5',
      4: '#e5e5e5',
      5: '#d4d4d4',
      6: '#a3a3a3',
      7: '#737373',
      8: '#525252',
      9: '#404040',
      10: '#262626',
      11: '#171717',
      12: '#000000' // Pure black
    },

    // Background colors (FlagFit Pro white theme)
    background: {
      base: '#ffffff', // Pure white
      subtle: '#fafafa',
      ui: '#f5f5f5',
      hover: '#e5e5e5',
      pressed: '#d4d4d4'
    },

    // Text colors (FlagFit Pro black theme)
    text: {
      primary: '#000000', // Pure black
      secondary: '#404040', 
      tertiary: '#737373',
      quaternary: '#a3a3a3'
    }
  }
};

// Dark theme color palette  
export const darkTheme = {
  colors: {
    // Accent colors (FlagFit Pro green for dark theme)
    accent: {
      1: '#022c22',
      2: '#052e16',
      3: '#14532d',
      4: '#166534',
      5: '#15803d',
      6: '#16a34a',
      7: '#22c55e',
      8: '#4ade80',
      9: '#86efac', // Main accent color - FlagFit Pro green (lighter for dark)
      10: '#bbf7d0',
      11: '#dcfce7',
      12: '#f0fdf4'
    },

    // Gray colors (FlagFit Pro dark theme - inverted)
    gray: {
      1: '#000000', // Pure black
      2: '#171717',
      3: '#262626',
      4: '#404040',
      5: '#525252',
      6: '#737373',
      7: '#a3a3a3',
      8: '#d4d4d4',
      9: '#e5e5e5',
      10: '#f5f5f5',
      11: '#fafafa',
      12: '#ffffff' // Pure white
    },

    // Background colors (FlagFit Pro dark theme)
    background: {
      base: '#000000', // Pure black
      subtle: '#171717',
      ui: '#262626',
      hover: '#404040',
      pressed: '#525252'
    },

    // Text colors (FlagFit Pro dark theme)
    text: {
      primary: '#ffffff', // Pure white
      secondary: '#f5f5f5',
      tertiary: '#d4d4d4', 
      quaternary: '#a3a3a3'
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