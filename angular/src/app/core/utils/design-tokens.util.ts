/**
 * Design Tokens Utility
 *
 * Provides runtime access to CSS custom properties defined in design-system-tokens.scss
 * This is the single source of truth for accessing design tokens in TypeScript.
 *
 * Usage:
 * - DOM / styles: Prefer `var(--token)` via BRAND_COLORS, STATUS_COLORS, etc.
 * - Chart.js / canvas: Pass resolved colors from ThemeService.getChartColors() or
 *   getCssVariable("--color-chart-N"). For SSR or missing document, use
 *   CANVAS_CHART_FALLBACK_HEX (must stay in sync with :root --color-chart-* in SCSS).
 * - Do not duplicate brand hex in feature code; use tokens above.
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

/**
 * Create a CSS custom property reference.
 * Use this instead of duplicating literal token values in TypeScript.
 */
export function cssToken(tokenName: `--${string}`): string {
  return `var(${tokenName})`;
}

/**
 * Main app layout widths — CSS var references only.
 * Single numeric source: `--layout-app-content-max-width` in design-system-tokens.scss
 */
export const LAYOUT_CSS_VARS = {
  appContentMaxWidth: cssToken("--layout-app-content-max-width"),
  pageMaxWidthWide: cssToken("--layout-page-max-width-wide"),
  shellContentMaxWidth: cssToken("--app-shell-content-max-width"),
  onboardingMaxWidth: cssToken("--layout-onboarding-max-width"),
} as const;

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
  morning_mobility: "var(--primitive-warning-500)", // amber var(--color-chart-quaternary)
  foam_roll: "var(--primitive-error-500)", // red var(--color-chart-quinary)
  warm_up: "var(--color-workout-cardio)", // orange var(--color-chart-quaternary)
  isometrics: "var(--ds-primary-green)", // green - strength work
  plyometrics: "var(--color-workout-cardio)", // orange - explosive work
  strength: "var(--ds-primary-green)", // green - strength work (incl. Nordic curls)
  conditioning: "var(--primitive-error-500)", // red - cardio/conditioning
  skill_drills: "var(--color-chart-tertiary)", // blue - skill/twitching
  main_session: "var(--ds-primary-green)", // brand green var(--p-highlight-text-color)
  cool_down: "var(--color-chart-tertiary)", // blue var(--color-chart-tertiary)
  evening_recovery: "var(--color-status-help)", // purple var(--color-chart-senary)
} as const;

/**
 * Cycle tracking phase colors
 * Maps menstrual cycle phases to appropriate colors
 */
export const CYCLE_PHASE_COLORS = {
  menstrual: "var(--primitive-error-500)", // red var(--color-chart-quinary)
  follicular: "var(--color-status-success)", // green (use success, not raw green for better a11y)
  ovulation: "var(--primitive-warning-500)", // amber var(--color-chart-quaternary)
  luteal: "var(--color-status-help)", // purple var(--color-chart-senary)
  late_luteal: "var(--color-staff-coaching)", // indigo var(--color-phase-reload)
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
// CHART.JS / CANVAS — series tokens (see design-system-tokens.scss CONTRACT)
// ============================================================================

/** Canonical CSS var names for the six primary chart series (single source for ThemeService). */
export const CHART_SERIES_CSS_VARS = [
  "--color-chart-1",
  "--color-chart-2",
  "--color-chart-3",
  "--color-chart-4",
  "--color-chart-5",
  "--color-chart-6",
] as const;

/**
 * Light-theme hex fallbacks when computed styles are unavailable (SSR).
 * MUST match :root --color-chart-1 … --color-chart-6 resolved values in
 * design-system-tokens.scss (brand green + five fixed accents).
 */
export const CANVAS_CHART_FALLBACK_HEX: readonly string[] = [
  "#089949",
  "#10c96b",
  "#f1c40f",
  "#e74c3c",
  "#3498db",
  "#9b59b6",
];

/**
 * Default coach team branding when API has no custom colors (matches primitives).
 * Exempt from “no hex in features” — persisted user/team data.
 */
export const DEFAULT_TEAM_BRAND_HEX = {
  primary: "#16a34a",
  secondary: "#0f172a",
} as const;

/**
 * Semantic chart color keys (CSS var references for DOM / configs that accept var()).
 */
export const CHART_COLORS = {
  primary: "var(--p-highlight-text-color)",
  secondary: "var(--p-highlight-text-color)",
  tertiary: "var(--color-chart-tertiary)",
  quaternary: "var(--color-chart-quaternary)",
  quinary: "var(--color-chart-quinary)",
  senary: "var(--color-chart-senary)",
  septenary: "var(--color-chart-septenary)",
} as const;

/**
 * Extended palette as CSS var references (multi-series charts, non-canvas).
 */
export const CHART_PALETTE: readonly string[] = [
  "var(--p-highlight-text-color)",
  "var(--p-highlight-text-color)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-chart-6)",
  "var(--color-chart-septenary)",
  "var(--color-phase-late-season)",
  "var(--ds-primary-orange)",
  "var(--color-phase-reload)",
] as const;

/**
 * Status colors for charts (hex values)
 */
export const CHART_STATUS_COLORS = {
  success: "var(--p-highlight-text-color)",
  warning: "var(--color-chart-quaternary)",
  error: "var(--color-chart-quinary)",
  info: "var(--color-chart-tertiary)",
  neutral: "var(--color-workout-rest)",
} as const;

/**
 * Chart.js-friendly RGBA from a hex string or a resolved `var(--token)` / `--token`.
 */
export function hexToRgba(color: string, alpha: number): string {
  let hex = color.trim();
  if (hex.startsWith("var(") || hex.startsWith("--")) {
    hex = resolveCssVariable(hex.startsWith("var(") ? hex : `var(${hex})`);
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) {
    return color;
  }
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
 * Status colors as CSS var references (resolve with getCssVariable for canvas)
 */
export const STATUS_HEX_COLORS = {
  success: "var(--p-highlight-text-color)", // --ds-primary-green (brand success)
  successLight: "var(--p-highlight-text-color)", // --color-brand-secondary
  warning: "var(--color-chart-quaternary)", // --primitive-warning-500
  warningLight: "var(--color-icon-notifications)", // --primitive-warning-400
  error: "var(--color-chart-quinary)", // --primitive-error-500
  errorLight: "var(--color-error-text-accessible-dark)", // --primitive-error-400
  info: "var(--color-chart-tertiary)", // --color-chart-tertiary
  infoLight: "var(--color-icon-profile)", // --primitive-info-400
  neutral: "var(--color-workout-rest)", // --color-workout-rest
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
 * Breakpoint bridge constants for TS-only APIs such as PrimeNG dialog breakpoint maps.
 * These mirror the canonical CSS token values in design-system-tokens.scss.
 */
export const BREAKPOINTS = {
  xs: "374px",
  sm: "640px",
  md: "768px",
  /** Just below `md` — matches `--breakpoint-md-max` (767px) for PrimeNG `breakpoint` props */
  mdMax: "767px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
  mobile: "640px",
  tablet: "768px",
  desktop: "1024px",
  wide: "1280px",
} as const;

/**
 * Spacing scale (maps to --space-* CSS variables)
 * Use these for programmatic spacing calculations
 */
export const SPACING = {
  0: "0",
  1: cssToken("--space-1"),
  2: cssToken("--space-2"),
  3: cssToken("--space-3"),
  4: cssToken("--space-4"),
  5: cssToken("--space-5"),
  6: cssToken("--space-6"),
  7: cssToken("--space-7"),
  8: cssToken("--space-8"),
  9: cssToken("--space-9"),
  10: cssToken("--space-10"),
  11: cssToken("--space-11"),
  12: cssToken("--space-12"),
  16: cssToken("--space-16"),
} as const;

/**
 * Icon sizes (maps to --icon-* CSS variables)
 */
export const ICON_SIZES = {
  xs: cssToken("--icon-xs"),
  sm: cssToken("--icon-sm"),
  md: cssToken("--icon-md"),
  lg: cssToken("--icon-lg"),
  xl: cssToken("--icon-xl"),
  "2xl": cssToken("--icon-2xl"),
  "3xl": cssToken("--icon-3xl"),
} as const;

/**
 * Component sizes (e.g., for avatar, icons in UI)
 */
export const COMPONENT_SIZES = {
  avatar: {
    xs: cssToken("--avatar-size-xs"),
    sm: cssToken("--avatar-size-sm"),
    md: cssToken("--avatar-size-md"),
    lg: cssToken("--avatar-size-lg"),
    xl: cssToken("--avatar-size-xl"),
    "2xl": cssToken("--avatar-size-2xl"),
  },
  icon: {
    sm: cssToken("--icon-container-sm"),
    md: cssToken("--icon-container-md"),
    lg: cssToken("--icon-container-lg"),
    xl: cssToken("--icon-container-xl"),
  },
  button: {
    sm: cssToken("--button-height-sm"),
    md: cssToken("--button-height-md"),
    lg: cssToken("--button-height-lg"),
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
  xs: cssToken("--dialog-max-width-xs"),
  sm: cssToken("--dialog-max-width-sm"),
  md: cssToken("--dialog-max-width-md"),
  lg: cssToken("--dialog-max-width-lg"),
  xl: cssToken("--dialog-max-width-xl"),
  "2xl": cssToken("--dialog-max-width-2xl"),
  "3xl": cssToken("--dialog-max-width-3xl"),
  full: "95vw",
} as const;

export const DIALOG_BREAKPOINTS = {
  mobileFull: {
    [BREAKPOINTS.mobile]: DIALOG_WIDTHS.full,
  },
  standard: {
    "960px": "92vw",
    [BREAKPOINTS.mobile]: "96vw",
  },
  wide: {
    "1200px": "92vw",
    [BREAKPOINTS.mobile]: "96vw",
  },
  wideComfortable: {
    "1200px": "94vw",
    "960px": "96vw",
  },
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
  xs: cssToken("--dropdown-width-xs"),
  sm: cssToken("--dropdown-width-sm"),
  md: cssToken("--dropdown-width-md"),
  lg: cssToken("--dropdown-width-lg"),
  xl: cssToken("--dropdown-width-xl"),
  auto: "auto",
} as const;

/**
 * Table column widths
 */
export const TABLE_COLUMN_WIDTHS = {
  /** Checkbox/action column */
  action: cssToken("--table-column-width-action"),
  /** Small badge/status column */
  badge: cssToken("--table-column-width-badge"),
  /** Standard icon column */
  icon: cssToken("--table-column-width-icon"),
  /** Rank/number column */
  rank: cssToken("--table-column-width-rank"),
  /** Points/score column */
  score: cssToken("--table-column-width-score"),
  /** Avatar + name column */
  avatar: cssToken("--table-column-width-avatar"),
} as const;
