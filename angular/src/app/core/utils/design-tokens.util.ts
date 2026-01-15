/**
 * Design Tokens Utility
 *
 * Provides runtime access to CSS custom properties defined in design-system-tokens.scss
 * This is the single source of truth for accessing design tokens in TypeScript.
 *
 * Usage:
 * - For Chart.js/Canvas: Use CHART_COLORS constant (requires hex values)
 * - For DOM elements: Use getCssVariable() to read CSS vars at runtime
 * - For component configs: Use semantic color objects (BLOCK_COLORS, STATUS_COLORS, etc.)
 */

/**
 * Get a CSS custom property value from the document root
 * @param propertyName - CSS variable name without 'var()' wrapper (e.g., '--ds-primary-green')
 * @returns The computed value of the CSS variable
 */
export function getCssVariable(propertyName: string): string {
  if (typeof document === "undefined") {
    // SSR fallback - return empty string
    return "";
  }
  return getComputedStyle(document.documentElement)
    .getPropertyValue(propertyName)
    .trim();
}

/**
 * Get multiple CSS variables as an object
 * @param propertyNames - Array of CSS variable names
 * @returns Object with variable names as keys and computed values as values
 */
export function getCssVariables(
  propertyNames: string[],
): Record<string, string> {
  return propertyNames.reduce(
    (acc, name) => {
      acc[name] = getCssVariable(name);
      return acc;
    },
    {} as Record<string, string>,
  );
}

/**
 * Convert CSS variable reference to its computed value
 * Handles both 'var(--name)' and '--name' formats
 */
export function resolveCssVariable(value: string): string {
  if (value.startsWith("var(")) {
    const varName = value.slice(4, -1).split(",")[0].trim();
    return getCssVariable(varName) || value;
  }
  if (value.startsWith("--")) {
    return getCssVariable(value) || value;
  }
  return value;
}

// ============================================================================
// DESIGN TOKEN CONSTANTS
// These map directly to CSS variables in design-system-tokens.scss
// Use CSS variable references when possible; hex values only for Chart.js/Canvas
// ============================================================================

/**
 * Primary brand colors
 * Use CSS variable references for DOM elements
 */
export const BRAND_COLORS = {
  primary: "var(--ds-primary-green)",
  primaryHover: "var(--ds-primary-green-hover)",
  primaryLight: "var(--ds-primary-green-light)",
  primarySubtle: "var(--ds-primary-green-subtle)",
  secondary: "var(--color-brand-secondary)",
} as const;

/**
 * Status/semantic colors for badges, alerts, and status indicators
 * Use CSS variable references for DOM elements
 */
export const STATUS_COLORS = {
  success: "var(--color-status-success)",
  successLight: "var(--color-success-bg)",
  warning: "var(--color-status-warning)",
  warningLight: "var(--color-warning-bg)",
  error: "var(--color-status-error)",
  errorLight: "var(--color-danger-bg)",
  info: "var(--color-status-info)",
  infoLight: "var(--color-info-bg)",
  help: "var(--color-status-help)",
  helpLight: "var(--color-status-help-light)",
} as const;

/**
 * Protocol block colors
 * Maps to daily-protocol block types for visual distinction
 * CSS variable references ensure theme consistency
 */
export const BLOCK_COLORS = {
  morning_mobility: "var(--primitive-warning-500)", // amber #f59e0b
  foam_roll: "var(--primitive-error-500)", // red #ef4444
  warm_up: "var(--color-workout-cardio)", // orange #f59e0b
  isometrics: "var(--ds-primary-green)", // green - strength work
  plyometrics: "var(--color-workout-cardio)", // orange - explosive work
  strength: "var(--ds-primary-green)", // green - strength work (incl. Nordic curls)
  conditioning: "var(--primitive-error-500)", // red - cardio/conditioning
  skill_drills: "var(--color-chart-tertiary)", // blue - skill/twitching
  main_session: "var(--ds-primary-green)", // brand green #089949
  cool_down: "var(--color-chart-tertiary)", // blue #3b82f6
  evening_recovery: "var(--color-status-help)", // purple #8b5cf6
} as const;

/**
 * Cycle tracking phase colors
 * Maps menstrual cycle phases to appropriate colors
 */
export const CYCLE_PHASE_COLORS = {
  menstrual: "var(--primitive-error-500)", // red #ef4444
  follicular: "var(--color-status-success)", // green (use success, not raw green for better a11y)
  ovulation: "var(--primitive-warning-500)", // amber #f59e0b
  luteal: "var(--color-status-help)", // purple #8b5cf6
  late_luteal: "var(--color-staff-coaching)", // indigo #6366f1
} as const;

/**
 * Workout type colors for calendars and schedules
 * Maps directly to CSS variables
 */
export const WORKOUT_COLORS = {
  strength: "var(--color-workout-strength)",
  cardio: "var(--color-workout-cardio)",
  mobility: "var(--color-workout-mobility)",
  practice: "var(--color-workout-practice)",
  game: "var(--color-workout-game)",
  rest: "var(--color-workout-rest)",
} as const;

/**
 * Training periodization phase colors
 */
export const PHASE_COLORS = {
  recovery: "var(--color-phase-recovery)",
  foundation: "var(--color-phase-foundation)",
  strength: "var(--color-phase-strength)",
  power: "var(--color-phase-power)",
  speed: "var(--color-phase-speed)",
  competition: "var(--color-phase-competition)",
  reload: "var(--color-phase-reload)",
  peak: "var(--color-phase-peak)",
  lateSeason: "var(--color-phase-late-season)",
} as const;

// ============================================================================
// CHART.JS / CANVAS COLORS (HEX VALUES REQUIRED)
// Chart.js cannot read CSS variables - must use computed hex values
// These are extracted from design-system-tokens.scss
// ============================================================================

/**
 * Chart colors for Chart.js/Canvas rendering
 * These MUST be hex values because Chart.js canvas context cannot read CSS vars
 *
 * Maps to CSS variables:
 * - --color-chart-1: #089949 (primary green)
 * - --color-chart-2: #10c96b (secondary green)
 * - --color-chart-3: #f1c40f (gold/success)
 * - --color-chart-4: #e74c3c (red/error)
 * - --color-chart-5: #3498db (blue/info)
 * - --color-chart-6: #9b59b6 (purple)
 */
export const CHART_COLORS = {
  primary: "#089949",
  secondary: "#10c96b",
  tertiary: "#3b82f6",
  quaternary: "#f59e0b",
  quinary: "#ef4444",
  senary: "#8b5cf6",
  septenary: "#ec4899",
} as const;

/**
 * Chart color palette array for datasets
 * Use this for multi-series charts
 */
export const CHART_PALETTE: readonly string[] = [
  "#089949", // primary green
  "#10c96b", // secondary green
  "#f1c40f", // gold
  "#e74c3c", // red
  "#3498db", // blue
  "#9b59b6", // purple
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
  "#6366f1", // indigo
] as const;

/**
 * Status colors for charts (hex values)
 */
export const CHART_STATUS_COLORS = {
  success: "#089949",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
  neutral: "#6b7280",
} as const;

/**
 * Generates Chart.js-compatible color with alpha
 * @param hex - Hex color code
 * @param alpha - Opacity (0-1)
 */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Creates a gradient-ready color pair for charts
 * @param baseColor - Base hex color
 * @param startAlpha - Starting opacity
 * @param endAlpha - Ending opacity
 */
export function createChartGradientColors(
  baseColor: string,
  startAlpha = 0.4,
  endAlpha = 0.1,
): { start: string; end: string } {
  return {
    start: hexToRgba(baseColor, startAlpha),
    end: hexToRgba(baseColor, endAlpha),
  };
}

// ============================================================================
// STATUS COLOR HELPERS
// For services that need to return color values based on thresholds
// ============================================================================

/**
 * Get status color based on a value and thresholds
 * Returns CSS variable reference for DOM elements
 *
 * @param value - The value to evaluate
 * @param goodThreshold - Value >= this is "good" (green)
 * @param fairThreshold - Value >= this is "fair" (warning)
 * @returns CSS variable reference for the appropriate status color
 */
export function getStatusColor(
  value: number,
  goodThreshold: number,
  fairThreshold: number,
): string {
  if (value >= goodThreshold) {
    return STATUS_COLORS.success; // var(--color-status-success)
  } else if (value >= fairThreshold) {
    return STATUS_COLORS.warning; // var(--color-status-warning)
  }
  return STATUS_COLORS.error; // var(--color-status-error)
}

/**
 * Get inverted status color (lower is better, like soreness/stress)
 * @param value - The value to evaluate
 * @param goodThreshold - Value <= this is "good" (green)
 * @param fairThreshold - Value <= this is "fair" (warning)
 */
export function getInvertedStatusColor(
  value: number,
  goodThreshold: number,
  fairThreshold: number,
): string {
  if (value <= goodThreshold) {
    return STATUS_COLORS.success;
  } else if (value <= fairThreshold) {
    return STATUS_COLORS.warning;
  }
  return STATUS_COLORS.error;
}

/**
 * Status colors as hex values for Chart.js/Canvas
 * Use these ONLY when CSS variables cannot be used
 */
export const STATUS_HEX_COLORS = {
  success: "#089949", // --ds-primary-green (brand success)
  successLight: "#10c96b", // --color-brand-secondary
  warning: "#f59e0b", // --primitive-warning-500
  warningLight: "#fbbf24", // --primitive-warning-400
  error: "#ef4444", // --primitive-error-500
  errorLight: "#f87171", // --primitive-error-400
  info: "#3b82f6", // --color-chart-tertiary
  infoLight: "#60a5fa", // --primitive-info-400
  neutral: "#6b7280", // --color-workout-rest
} as const;

/**
 * Get status hex color for Chart.js/Canvas contexts
 */
export function getStatusHexColor(
  value: number,
  goodThreshold: number,
  fairThreshold: number,
): string {
  if (value >= goodThreshold) {
    return STATUS_HEX_COLORS.success;
  } else if (value >= fairThreshold) {
    return STATUS_HEX_COLORS.warning;
  }
  return STATUS_HEX_COLORS.error;
}

/**
 * Get inverted status hex color for Chart.js/Canvas (lower is better)
 */
export function getInvertedStatusHexColor(
  value: number,
  goodThreshold: number,
  fairThreshold: number,
): string {
  if (value <= goodThreshold) {
    return STATUS_HEX_COLORS.success;
  } else if (value <= fairThreshold) {
    return STATUS_HEX_COLORS.warning;
  }
  return STATUS_HEX_COLORS.error;
}

// ============================================================================
// SPACING & SIZING TOKENS
// ============================================================================

/**
 * Spacing scale (maps to --space-* CSS variables)
 * Use these for programmatic spacing calculations
 */
export const SPACING = {
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
} as const;

/**
 * Icon sizes (maps to --icon-* CSS variables)
 */
export const ICON_SIZES = {
  xs: "0.75rem", // 12px
  sm: "0.875rem", // 14px
  md: "1rem", // 16px
  lg: "1.25rem", // 20px
  xl: "1.5rem", // 24px
  "2xl": "2rem", // 32px
  "3xl": "3rem", // 48px
} as const;

/**
 * Component sizes (e.g., for avatar, icons in UI)
 */
export const COMPONENT_SIZES = {
  avatar: {
    xs: "24px",
    sm: "32px",
    md: "40px",
    lg: "48px",
    xl: "64px",
    "2xl": "80px",
  },
  icon: {
    sm: "36px",
    md: "40px",
    lg: "48px",
    xl: "56px",
  },
  button: {
    sm: "36px",
    md: "44px",
    lg: "52px",
  },
} as const;

// ============================================================================
// DIALOG / MODAL WIDTH TOKENS
// Standardized widths for PrimeNG dialogs and modals
// ============================================================================

/**
 * Dialog width presets
 * Use these for consistent modal sizing across the application
 *
 * Maps to design system breakpoints:
 * - xs: Small alerts, confirmations (320px)
 * - sm: Simple forms, messages (400px)
 * - md: Standard forms, details (500px)
 * - lg: Complex forms, multi-section (600px)
 * - xl: Wide content, tables (700px)
 * - 2xl: Full-width content (800px)
 * - full: Maximum viewport width with margin
 */
export const DIALOG_WIDTHS = {
  xs: "320px",
  sm: "400px",
  md: "500px",
  lg: "600px",
  xl: "700px",
  "2xl": "800px",
  "3xl": "900px",
  full: "95vw",
} as const;

/**
 * Responsive dialog width with mobile fallback
 * Returns object suitable for PrimeNG [style] binding
 *
 * @param desktopWidth - Width on desktop (from DIALOG_WIDTHS)
 * @param mobileWidth - Optional mobile fallback (defaults to '95vw')
 */
export function getDialogStyle(
  desktopWidth: string,
  options?: { maxWidth?: string; maxHeight?: string },
): Record<string, string> {
  const style: Record<string, string> = {
    width: "95vw",
    maxWidth: options?.maxWidth ?? desktopWidth,
  };
  if (options?.maxHeight) {
    style["maxHeight"] = options.maxHeight;
  }
  return style;
}

/**
 * Pre-built dialog style objects for common use cases
 * These are optimized for mobile-first responsive design
 */
export const DIALOG_STYLES = {
  /** Alert/confirmation dialogs (xs: 320px) */
  alert: { width: "95vw", maxWidth: DIALOG_WIDTHS.xs },

  /** Simple forms, quick actions (sm: 400px) */
  form: { width: "95vw", maxWidth: DIALOG_WIDTHS.sm },

  /** Standard dialogs (md: 500px) */
  standard: { width: "95vw", maxWidth: DIALOG_WIDTHS.md },

  /** Complex forms, multi-step (lg: 600px) */
  complex: { width: "95vw", maxWidth: DIALOG_WIDTHS.lg },

  /** Wide content, data tables (xl: 700px) */
  wide: { width: "95vw", maxWidth: DIALOG_WIDTHS.xl },

  /** Full-width dialogs (2xl: 800px) */
  fullWidth: { width: "95vw", maxWidth: DIALOG_WIDTHS["2xl"] },

  /** Extra wide (3xl: 900px) */
  extraWide: { width: "95vw", maxWidth: DIALOG_WIDTHS["3xl"] },

  /** Scrollable content dialogs */
  scrollable: { width: "95vw", maxWidth: DIALOG_WIDTHS.lg, maxHeight: "80vh" },

  /** Player detail / roster dialogs */
  playerDetail: {
    width: "95vw",
    maxWidth: DIALOG_WIDTHS.xl,
    maxHeight: "90vh",
  },
} as const;

/**
 * Dropdown/Select widths for inline controls
 */
export const DROPDOWN_WIDTHS = {
  xs: "100px",
  sm: "140px",
  md: "160px",
  lg: "200px",
  xl: "250px",
  auto: "auto",
} as const;

/**
 * Table column widths
 */
export const TABLE_COLUMN_WIDTHS = {
  /** Checkbox/action column */
  action: "60px",
  /** Small badge/status column */
  badge: "80px",
  /** Standard icon column */
  icon: "50px",
  /** Rank/number column */
  rank: "60px",
  /** Points/score column */
  score: "100px",
  /** Avatar + name column */
  avatar: "50px",
} as const;
