/**
 * FlagFit Pro Design Tokens
 * Type-safe design system tokens for Angular components
 *
 * Usage:
 * import { DesignTokens } from '@shared/models/design-tokens';
 *
 * const primaryColor = DesignTokens.colors.brand.primary[700];
 */

export const DesignTokens = {
  colors: {
    brand: {
      primary: {
        50: '#f0f9f7',
        100: '#d0f0eb',
        200: '#a0e4d7',
        300: '#70d8c3',
        400: '#40ccaf',
        500: '#10c96b',
        600: '#0ab85a',
        700: '#089949', // Primary: Main brand color, used most frequently
        800: '#067a3c',
        900: '#036d35', // Hover/dark
      },
      secondary: {
        500: '#10c96b', // Secondary/Accent: Provides accents for important elements, applied sparingly
        600: '#0ab85a',
        700: '#089949',
      },
      accent: {
        500: '#10c96b', // Alias for secondary
      },
      white: {
        pure: '#ffffff',
        soft: '#f8faf9',
      },
    },
    status: {
      success: {
        50: '#f0fdf4',
        100: '#dcfce7',
        500: '#63ad0e', // Green - Success: positive outcomes, confirmations
        600: '#4d8a0b',
        700: '#3d6e09',
      },
      warning: {
        50: '#fffbeb',
        100: '#fef3c7',
        500: '#ffc000', // Yellow/Orange - Warning: potential problems or non-critical alerts
        600: '#cc9900',
        700: '#997300',
      },
      error: {
        50: '#fff1f2',
        100: '#ffe4e6',
        500: '#FF003C', // Red - Error: critical issues, deletions, or blocking actions
        600: '#cc002f',
        700: '#990023',
      },
      info: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        500: '#0ea5e9', // Blue - Info: informational messages, tips, or default states
        600: '#0284c7',
        700: '#0369a1',
      },
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#4a4a4a',
      muted: '#6b7280',
      onGreen: '#ffffff',
      onWhite: '#089949',
    },
    border: {
      primary: '#e5e7eb',
      secondary: '#e5e7eb',
      subtle: 'rgba(0, 0, 0, 0.05)',
      focus: '#089949',
    },
    surface: {
      primary: '#ffffff',
      secondary: '#f8f9fa',
      tertiary: '#e9ecef',
      dark: '#1a1a1a',
    },
    neutral: {
      // Neutrals: Whites, blacks, and grays for backgrounds, text, and fine details
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    },
  },
  spacing: {
    xs: '4px',    // 0.25rem
    sm: '8px',    // 0.5rem
    md: '16px',   // 1rem
    lg: '24px',   // 1.5rem
    xl: '32px',   // 2rem
    '2xl': '48px', // 3rem
    '3xl': '64px', // 4rem
  },
  typography: {
    fontFamily: {
      primary: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
      display: "'Poppins', sans-serif",
      mono: "'SF Mono', 'Monaco', 'Inconsolata', monospace",
    },
    fontSize: {
      xs: '12px',   // 0.75rem
      sm: '14px',   // 0.875rem
      base: '16px', // 1rem
      lg: '18px',   // 1.125rem
      xl: '20px',   // 1.25rem
      '2xl': '24px', // 1.5rem
      '3xl': '30px', // 1.875rem
      '4xl': '36px', // 2.25rem
      '5xl': '48px', // 3rem
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.625,
    },
    letterSpacing: {
      tight: '-0.02em',
      normal: '0',
      wide: '0.05em',
    },
  },
  borderRadius: {
    none: '0',
    sm: '2px',    // 0.125rem
    md: '6px',    // 0.375rem
    lg: '8px',    // 0.5rem
    xl: '12px',   // 0.75rem
    '2xl': '16px', // 1rem
    '3xl': '24px', // 1.5rem
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.1)',
    md: '0 4px 12px rgba(0, 0, 0, 0.15)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.12)',
  },
  motion: {
    duration: {
      fast: '0.15s',
      normal: '0.2s',
      slow: '0.3s',
    },
    easing: {
      productive: 'ease',
      expressive: 'ease-in-out',
    },
  },
  zIndex: {
    base: 1,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
    skiplink: 10000,
    loading: 10001,
    loadingOverlay: 10002,
  },
} as const;

export type DesignTokensType = typeof DesignTokens;

/**
 * Helper function to get CSS variable value
 * @param token CSS custom property name
 */
export function getCSSToken(token: string): string {
  return `var(${token})`;
}

/**
 * Helper function to create rgba color from token
 * @param color Hex color value
 * @param alpha Alpha value (0-1)
 */
export function rgba(color: string, alpha: number): string {
  // Remove # if present
  const hex = color.replace('#', '');

  // Parse hex to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Predefined component style configurations
 * Ready to use in Angular component styles
 */
export const ComponentStyles = {
  button: {
    primary: {
      background: DesignTokens.colors.brand.primary[700],
      backgroundHover: DesignTokens.colors.brand.primary[900],
      text: DesignTokens.colors.text.onGreen,
      borderRadius: DesignTokens.borderRadius.md,
      padding: `${DesignTokens.spacing.sm} ${DesignTokens.spacing.md}`,
    },
    secondary: {
      background: DesignTokens.colors.surface.secondary,
      backgroundHover: DesignTokens.colors.surface.tertiary,
      text: DesignTokens.colors.text.primary,
      borderRadius: DesignTokens.borderRadius.md,
      padding: `${DesignTokens.spacing.sm} ${DesignTokens.spacing.md}`,
    },
  },
  card: {
    background: DesignTokens.colors.surface.primary,
    borderRadius: DesignTokens.borderRadius.lg,
    shadow: DesignTokens.shadows.md,
    padding: DesignTokens.spacing.lg,
  },
  input: {
    borderRadius: DesignTokens.borderRadius.md,
    borderColor: DesignTokens.colors.border.primary,
    borderColorFocus: DesignTokens.colors.border.focus,
    padding: `${DesignTokens.spacing.sm} ${DesignTokens.spacing.md}`,
  },
};

/**
 * Chart color configurations for data visualization
 * Compatible with Chart.js and PrimeNG Charts
 */
export const ChartColors = {
  primary: DesignTokens.colors.brand.primary[700],
  primaryLight: rgba(DesignTokens.colors.brand.primary[700], 0.5),
  primaryDark: DesignTokens.colors.brand.primary[900],
  success: DesignTokens.colors.status.success[500],
  successLight: rgba(DesignTokens.colors.status.success[500], 0.5),
  warning: DesignTokens.colors.status.warning[500],
  warningLight: rgba(DesignTokens.colors.status.warning[500], 0.5),
  error: DesignTokens.colors.status.error[500],
  errorLight: rgba(DesignTokens.colors.status.error[500], 0.5),
  info: DesignTokens.colors.status.info[500],
  infoLight: rgba(DesignTokens.colors.status.info[500], 0.5),

  // Gradient colors for multi-series charts
  series: [
    DesignTokens.colors.brand.primary[700],
    DesignTokens.colors.brand.primary[500],
    DesignTokens.colors.status.success[500],
    DesignTokens.colors.status.warning[500],
    DesignTokens.colors.status.info[600],
    DesignTokens.colors.brand.primary[300],
  ],
};

/**
 * Wellness status color mappings
 * For wellness scoring and health indicators
 */
export const WellnessColors = {
  excellent: DesignTokens.colors.brand.primary[700],  // Green
  good: DesignTokens.colors.brand.primary[500],        // Light green
  fair: DesignTokens.colors.status.warning[500],       // Yellow/Orange
  poor: DesignTokens.colors.status.error[500],         // Red
};

/**
 * Performance test result color mappings
 */
export const PerformanceColors = {
  improving: DesignTokens.colors.brand.primary[700],   // Green
  stable: DesignTokens.colors.status.warning[500],     // Yellow/Orange
  declining: DesignTokens.colors.status.error[500],    // Red
};
