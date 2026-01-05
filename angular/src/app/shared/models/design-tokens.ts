/**
 * FlagFit Pro Design Tokens
 * Type-safe design system tokens for Angular components
 *
 * ALIGNED TO: angular/src/assets/styles/design-system-tokens.scss (SOURCE OF TRUTH)
 * VERSION: 2.0.0
 * LAST UPDATED: 2026-01-05
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
        50: "#f0f9f7",
        100: "#d0f0eb",
        200: "#a0e4d7",
        300: "#70d8c3",
        400: "#40ccaf",
        500: "#10c96b",
        600: "#0ab85a",
        700: "#089949", // PRIMARY BRAND COLOR - main CTAs
        800: "#067a3c",
        900: "#036d35", // Hover/pressed states
      },
      secondary: {
        500: "#10c96b",
        600: "#0ab85a",
        700: "#089949",
      },
      accent: {
        500: "#10c96b",
      },
      white: {
        pure: "#ffffff",
        soft: "#f8faf9",
      },
    },
    primitive: {
      // Success - Yellow Scale (from SCSS)
      success: {
        50: "#fefce8",
        100: "#fef3c7",
        200: "#fde68a",
        300: "#fcd34d",
        400: "#fbbf24",
        500: "#f1c40f", // PRIMARY SUCCESS COLOR
        600: "#d4a617",
        700: "#b7941f",
        800: "#92400e",
        900: "#78350f",
      },
      // Warning - Orange/Amber Scale (from SCSS)
      warning: {
        50: "#fffbeb",
        100: "#fef3c7",
        200: "#fde68a",
        300: "#fcd34d",
        400: "#fbbf24",
        500: "#f59e0b", // PRIMARY WARNING COLOR
        600: "#d97706",
        700: "#b45309",
        800: "#92400e", // Dark warning text
        900: "#78350f",
      },
      // Error - Red Scale (from SCSS)
      error: {
        50: "#fef2f2",
        100: "#fee2e2",
        200: "#fecaca",
        300: "#fca5a5",
        400: "#f87171",
        500: "#ef4444", // PRIMARY ERROR COLOR
        600: "#dc2626",
        700: "#b91c1c",
        800: "#991b1b",
        900: "#7f1d1d",
      },
      // Neutral Gray Palette (from SCSS)
      neutral: {
        50: "#fafafa",
        100: "#f5f5f5",
        200: "#f0f0f0",
        300: "#e5e5e5",
        400: "#d4d4d4",
        500: "#a3a3a3",
        600: "#737373",
        700: "#404040",
        800: "#262626",
        900: "#171717",
        950: "#0a0a0a",
      },
    },
    // Semantic Status Colors (from SCSS)
    status: {
      success: {
        main: "#63ad0e",
        light: "rgba(99, 173, 14, 0.1)",
        subtle: "rgba(99, 173, 14, 0.05)",
      },
      warning: {
        main: "#ffc000",
        light: "rgba(255, 192, 0, 0.1)",
        subtle: "rgba(255, 192, 0, 0.05)",
        text: "#92400e", // Dark warning text for light backgrounds
      },
      error: {
        main: "#ff003c",
        light: "rgba(255, 0, 60, 0.1)",
        subtle: "rgba(255, 0, 60, 0.05)",
      },
      info: {
        main: "#0ea5e9",
        light: "rgba(14, 165, 233, 0.1)",
        subtle: "rgba(14, 165, 233, 0.05)",
      },
      help: {
        main: "#8b5cf6",
        light: "rgba(139, 92, 246, 0.1)",
        subtle: "rgba(139, 92, 246, 0.05)",
        hover: "#7c3aed",
      },
    },
    text: {
      primary: "#1a1a1a", // Black - for white backgrounds ONLY
      secondary: "#4a4a4a", // Dark gray - secondary text on white
      muted: "#525252", // Medium gray - muted text on white (FIXED from #6b7280)
      tertiary: "#6b7280", // Lighter gray - for large text only
      disabled: "#9ca3af", // Light gray - disabled text
      onPrimary: "#ffffff", // White - for green backgrounds ONLY
      onWhite: "#089949", // Green - for white backgrounds
    },
    border: {
      primary: "#e5e7eb",
      secondary: "#e5e7eb",
      subtle: "rgba(0, 0, 0, 0.05)",
      focus: "#089949",
      default: "#e5e5e5",
      muted: "#f0f0f0",
      strong: "#d4d4d4",
    },
    surface: {
      primary: "#ffffff",
      secondary: "#f8faf9",
      tertiary: "#e9ecef",
      elevated: "#ffffff",
      overlay: "rgba(0, 0, 0, 0.5)",
      dark: "#171717",
    },
    neutral: {
      50: "#fafafa",
      100: "#f5f5f5",
      200: "#e5e5e5",
      300: "#d4d4d4",
      400: "#a3a3a3",
      500: "#737373",
      600: "#525252",
      700: "#404040",
      800: "#262626",
      900: "#171717",
    },
  },
  spacing: {
    // Numeric scale (8-point grid)
    0: "0",
    1: "0.25rem", // 4px
    2: "0.5rem", // 8px
    3: "0.75rem", // 12px
    4: "1rem", // 16px
    5: "1.25rem", // 20px
    6: "1.5rem", // 24px
    8: "2rem", // 32px
    10: "2.5rem", // 40px
    12: "3rem", // 48px
    16: "4rem", // 64px
    20: "5rem", // 80px
    24: "6rem", // 96px
    // Semantic aliases
    xs: "0.25rem", // 4px
    sm: "0.5rem", // 8px
    md: "1rem", // 16px
    lg: "1.5rem", // 24px
    xl: "2rem", // 32px
    "2xl": "3rem", // 48px
    "3xl": "4rem", // 64px
  },
  typography: {
    fontFamily: {
      sans: '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
      display: '"Poppins", sans-serif',
      mono: '"JetBrains Mono", "SF Mono", "Monaco", "Inconsolata", monospace',
    },
    // Unified Typography System (LOCKED)
    unified: {
      h1: {
        size: "2rem", // 32px
        lineHeight: 1.2,
        weight: 700, // bold
      },
      h2: {
        size: "1.5rem", // 24px
        lineHeight: 1.25,
        weight: 600, // semibold
      },
      h3: {
        size: "1.25rem", // 20px
        lineHeight: 1.3,
        weight: 400, // regular
      },
      h4: {
        size: "1rem", // 16px
        lineHeight: 1.35,
        weight: 300, // light
      },
      body: {
        size: "1rem", // 16px
        lineHeight: 1.5,
        weight: 400, // regular
      },
      bodySm: {
        size: "0.875rem", // 14px
        lineHeight: 1.45,
        weight: 400, // regular
      },
      label: {
        size: "0.875rem", // 14px
        lineHeight: 1.2,
        weight: 600, // semibold
      },
      caption: {
        size: "0.75rem", // 12px
        lineHeight: 1.3,
        weight: 400, // regular
      },
    },
    fontSize: {
      // Display sizes
      "display-2xl": "4.5rem", // 72px
      "display-xl": "3.75rem", // 60px
      "display-lg": "3rem", // 48px
      "display-md": "2.5rem", // 40px
      "display-sm": "2rem", // 32px
      // Heading sizes
      "heading-2xl": "2.5rem", // 40px
      "heading-xl": "1.875rem", // 30px
      "heading-lg": "1.5rem", // 24px
      "heading-md": "1.25rem", // 20px
      "heading-sm": "1.125rem", // 18px
      "heading-xs": "1rem", // 16px
      // Body sizes
      "body-lg": "1.125rem", // 18px
      "body-md": "1rem", // 16px
      "body-sm": "0.875rem", // 14px
      "body-xs": "0.75rem", // 12px
      "body-2xs": "0.625rem", // 10px
      "body-3xs": "0.5rem", // 8px
      // Legacy aliases
      xs: "0.75rem", // 12px
      sm: "0.875rem", // 14px
      base: "1rem", // 16px
      lg: "1.125rem", // 18px
      xl: "1.25rem", // 20px
      "2xl": "1.5rem", // 24px
      "3xl": "1.875rem", // 30px
      "4xl": "2.25rem", // 36px
      "5xl": "3rem", // 48px
    },
    fontWeight: {
      light: 300,
      normal: 400,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.2,
      snug: 1.25,
      base: 1.5,
      normal: 1.5,
      relaxed: 1.625,
    },
    letterSpacing: {
      tight: "-0.02em",
      normal: "0",
      caption: "0.04em",
      wide: "0.05em",
    },
  },
  borderRadius: {
    // Approved scale: 2px / 6px / 8px / 12px / 16px / full
    // FORBIDDEN: 10px, 14px
    none: "0",
    sm: "0.125rem", // 2px
    md: "0.375rem", // 6px
    lg: "0.5rem", // 8px - DEFAULT for buttons, cards, inputs
    xl: "0.75rem", // 12px - dialogs
    "2xl": "1rem", // 16px
    "3xl": "1.5rem", // 24px
    full: "9999px", // DEPRECATED for buttons/tags/badges - only for avatars
    button: "8px", // SINGLE SOURCE OF TRUTH for button radius
  },
  shadows: {
    sm: "0 1px 3px rgba(0, 0, 0, 0.1)",
    md: "0 4px 12px rgba(0, 0, 0, 0.15)",
    lg: "0 8px 24px rgba(0, 0, 0, 0.12)",
    xl: "0 12px 48px rgba(0, 0, 0, 0.15)",
    // Numbered scale (Decision 14)
    0: "none",
    1: "0 1px 3px rgba(0, 0, 0, 0.08)",
    2: "0 4px 12px rgba(0, 0, 0, 0.12)",
    3: "0 8px 24px rgba(0, 0, 0, 0.16)",
    // Focus shadow
    focus: "0 0 0 0.2rem rgba(8, 153, 73, 0.2)",
    // Hover shadows (green-tinted)
    hover: {
      sm: "0 2px 8px rgba(8, 153, 73, 0.12)",
      md: "0 4px 16px rgba(8, 153, 73, 0.15)",
      lg: "0 8px 24px rgba(8, 153, 73, 0.18)",
      xl: "0 12px 32px rgba(8, 153, 73, 0.22)",
    },
  },
  motion: {
    duration: {
      fast: "0.15s",
      normal: "0.2s",
      slow: "0.3s",
      slower: "0.5s",
      // Motion tokens (Decision 19)
      motionFast: "120ms",
      motionBase: "200ms",
      motionSlow: "320ms",
    },
    easing: {
      productive: "ease",
      expressive: "cubic-bezier(0.4, 0, 0.2, 1)",
      standard: "cubic-bezier(0.4, 0, 0.2, 1)",
      decelerate: "cubic-bezier(0, 0, 0.2, 1)",
      accelerate: "cubic-bezier(0.4, 0, 1, 1)",
    },
    hover: {
      fast: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
      normal: "200ms cubic-bezier(0.4, 0, 0.2, 1)",
      slow: "300ms cubic-bezier(0.4, 0, 0.2, 1)",
      bounce: "200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
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
    notification: 1080,
    skiplink: 10000,
    loading: 10001,
    loadingOverlay: 10002,
  },
  components: {
    button: {
      radius: "0.5rem", // 8px - RAISED style, NOT pill
      heightSm: "36px",
      heightMd: "44px",
      heightLg: "52px",
    },
    input: {
      radius: "0.5rem", // 8px
      heightSm: "36px",
      heightMd: "44px",
      heightLg: "52px",
    },
    card: {
      radius: "0.5rem", // 8px
    },
    dialog: {
      radius: "0.75rem", // 12px
    },
    touchTarget: {
      min: "44px",
      sm: "36px",
      md: "44px",
      lg: "52px",
    },
    avatar: {
      xs: "1.5rem", // 24px
      sm: "2rem", // 32px
      md: "2.5rem", // 40px
      lg: "3rem", // 48px
      xl: "4rem", // 64px
      "2xl": "5rem", // 80px
    },
    badge: {
      sm: "1.25rem", // 20px
      md: "1.5rem", // 24px
      lg: "1.75rem", // 28px
    },
    progress: {
      xs: "0.125rem", // 2px
      sm: "0.25rem", // 4px
      md: "0.5rem", // 8px
      lg: "0.75rem", // 12px
    },
    iconContainer: {
      sm: "2.25rem", // 36px
      md: "2.5rem", // 40px
      lg: "3rem", // 48px
      xl: "3.5rem", // 56px
    },
  },
  icons: {
    library: "PrimeIcons",
    size: {
      xs: "0.75rem", // 12px
      sm: "0.875rem", // 14px
      md: "1rem", // 16px
      lg: "1.25rem", // 20px
      xl: "1.5rem", // 24px
      "2xl": "2rem", // 32px
      "3xl": "3rem", // 48px
    },
  },
  breakpoints: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },
  containers: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    max: "1440px",
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
  const hex = color.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Predefined component style configurations
 * Ready to use in Angular component styles
 * ALIGNED TO SCSS TOKENS
 */
export const ComponentStyles = {
  button: {
    primary: {
      background: DesignTokens.colors.brand.primary[700],
      backgroundHover: DesignTokens.colors.brand.primary[900],
      text: DesignTokens.colors.text.onPrimary,
      borderRadius: DesignTokens.borderRadius.lg, // 8px
      padding: `${DesignTokens.spacing.sm} ${DesignTokens.spacing.md}`,
    },
    secondary: {
      background: DesignTokens.colors.surface.secondary,
      backgroundHover: DesignTokens.colors.surface.tertiary,
      text: DesignTokens.colors.text.primary,
      borderRadius: DesignTokens.borderRadius.lg, // 8px
      padding: `${DesignTokens.spacing.sm} ${DesignTokens.spacing.md}`,
    },
  },
  card: {
    background: DesignTokens.colors.surface.primary,
    borderRadius: DesignTokens.borderRadius.lg, // 8px
    shadow: DesignTokens.shadows.sm,
    padding: DesignTokens.spacing.lg,
  },
  input: {
    borderRadius: DesignTokens.borderRadius.lg, // 8px
    borderColor: DesignTokens.colors.border.primary,
    borderColorFocus: DesignTokens.colors.border.focus,
    padding: `${DesignTokens.spacing.sm} ${DesignTokens.spacing.md}`,
  },
  dialog: {
    borderRadius: DesignTokens.borderRadius.xl, // 12px
    padding: DesignTokens.spacing.md,
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
  success: DesignTokens.colors.status.success.main,
  successLight: rgba("#63ad0e", 0.5),
  warning: DesignTokens.colors.status.warning.main,
  warningLight: rgba("#ffc000", 0.5),
  error: DesignTokens.colors.status.error.main,
  errorLight: rgba("#ff003c", 0.5),
  info: DesignTokens.colors.status.info.main,
  infoLight: rgba("#0ea5e9", 0.5),

  // Gradient colors for multi-series charts
  series: [
    DesignTokens.colors.brand.primary[700], // #089949
    DesignTokens.colors.brand.primary[500], // #10c96b
    DesignTokens.colors.status.success.main, // #63ad0e
    DesignTokens.colors.status.warning.main, // #ffc000
    DesignTokens.colors.status.info.main, // #0ea5e9
    DesignTokens.colors.brand.primary[300], // #70d8c3
  ],
};

/**
 * Wellness status color mappings
 * For wellness scoring and health indicators
 */
export const WellnessColors = {
  excellent: DesignTokens.colors.brand.primary[700], // Green
  good: DesignTokens.colors.brand.primary[500], // Light green
  fair: DesignTokens.colors.status.warning.main, // Yellow/Orange
  poor: DesignTokens.colors.status.error.main, // Red
};

/**
 * Performance test result color mappings
 */
export const PerformanceColors = {
  improving: DesignTokens.colors.brand.primary[700], // Green
  stable: DesignTokens.colors.status.warning.main, // Yellow/Orange
  declining: DesignTokens.colors.status.error.main, // Red
};

/**
 * Typography presets based on unified system
 * Use these for consistent typography across components
 */
export const TypographyPresets = {
  h1: {
    fontSize: DesignTokens.typography.unified.h1.size,
    lineHeight: DesignTokens.typography.unified.h1.lineHeight,
    fontWeight: DesignTokens.typography.unified.h1.weight,
    fontFamily: DesignTokens.typography.fontFamily.sans,
  },
  h2: {
    fontSize: DesignTokens.typography.unified.h2.size,
    lineHeight: DesignTokens.typography.unified.h2.lineHeight,
    fontWeight: DesignTokens.typography.unified.h2.weight,
    fontFamily: DesignTokens.typography.fontFamily.sans,
  },
  h3: {
    fontSize: DesignTokens.typography.unified.h3.size,
    lineHeight: DesignTokens.typography.unified.h3.lineHeight,
    fontWeight: DesignTokens.typography.unified.h3.weight,
    fontFamily: DesignTokens.typography.fontFamily.sans,
  },
  h4: {
    fontSize: DesignTokens.typography.unified.h4.size,
    lineHeight: DesignTokens.typography.unified.h4.lineHeight,
    fontWeight: DesignTokens.typography.unified.h4.weight,
    fontFamily: DesignTokens.typography.fontFamily.sans,
  },
  body: {
    fontSize: DesignTokens.typography.unified.body.size,
    lineHeight: DesignTokens.typography.unified.body.lineHeight,
    fontWeight: DesignTokens.typography.unified.body.weight,
    fontFamily: DesignTokens.typography.fontFamily.sans,
  },
  bodySm: {
    fontSize: DesignTokens.typography.unified.bodySm.size,
    lineHeight: DesignTokens.typography.unified.bodySm.lineHeight,
    fontWeight: DesignTokens.typography.unified.bodySm.weight,
    fontFamily: DesignTokens.typography.fontFamily.sans,
  },
  label: {
    fontSize: DesignTokens.typography.unified.label.size,
    lineHeight: DesignTokens.typography.unified.label.lineHeight,
    fontWeight: DesignTokens.typography.unified.label.weight,
    fontFamily: DesignTokens.typography.fontFamily.sans,
  },
  caption: {
    fontSize: DesignTokens.typography.unified.caption.size,
    lineHeight: DesignTokens.typography.unified.caption.lineHeight,
    fontWeight: DesignTokens.typography.unified.caption.weight,
    fontFamily: DesignTokens.typography.fontFamily.sans,
  },
};

/**
 * PrimeNG Component Typography Mapping
 * Use these for consistent PrimeNG component styling
 */
export const PrimeNGTypography = {
  dialogTitle: TypographyPresets.h2, // 24px/600/1.25
  cardTitle: TypographyPresets.h3, // 20px/600/1.3 (semibold for cards)
  cardSubtitle: TypographyPresets.bodySm, // 14px/400/1.45
  tabLabel: { ...TypographyPresets.bodySm, fontWeight: 600 }, // 14px/600/1.45
  tableHeader: TypographyPresets.label, // 14px/600/1.2
  tableCell: TypographyPresets.body, // 16px/400/1.5
  formLabel: TypographyPresets.label, // 14px/600/1.2
  helperText: TypographyPresets.bodySm, // 14px/400/1.45
  errorText: TypographyPresets.bodySm, // 14px/400/1.45 + error color
};
