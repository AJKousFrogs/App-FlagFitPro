/**
 * Design Tokens Utility
 *
 * Provides runtime access to CSS custom properties defined in scss/tokens/_tokens.scss
 * This is the single source of truth for accessing design tokens in TypeScript.
 *
 * Usage:
 * - DOM / styles: Prefer `var(--token)` via BRAND_COLORS, STATUS_COLORS, etc.
 * - Do not duplicate brand hex in feature code; use tokens above.
 */

/**
 * Get a CSS custom property value from the document root
 * @param propertyName - CSS variable name without 'var()' wrapper (e.g., '--accent')
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
  appContentMaxWidth: "1280px",
  pageMaxWidthWide: "1280px",
  shellContentMaxWidth: "480px",
  onboardingMaxWidth: "560px",
} as const;

// ============================================================================
// DESIGN TOKEN CONSTANTS
// These map directly to CSS variables in scss/tokens/_tokens.scss
// Use CSS variable references when possible; hex values only for Chart.js/Canvas
// ============================================================================

/**
 * Primary brand colors
 * Use CSS variable references for DOM elements
 */
export const BRAND_COLORS = {
  primary: "var(--accent)",
  primaryHover: "var(--accent-press)",
  primaryLight: "var(--accent)",
  primarySubtle: "var(--accent-soft)",
  secondary: "var(--accent-2)",
} as const;

/**
 * Status/semantic colors for badges, alerts, and status indicators
 * Use CSS variable references for DOM elements
 */
export const STATUS_COLORS = {
  success: "var(--good)",
  successLight: "var(--good-soft)",
  warning: "var(--warn)",
  warningLight: "var(--warn-soft)",
  error: "var(--danger)",
  errorLight: "var(--danger-soft)",
  info: "var(--info)",
  infoLight: "var(--info-soft)",
  help: "var(--accent-2)",
  helpLight: "var(--c-violet-200)",
} as const;

/**
 * Protocol block colors
 * Maps to daily-protocol block types for visual distinction
 * CSS variable references ensure theme consistency
 */
export const BLOCK_COLORS = {
  morning_mobility: "var(--warn)", // amber
  foam_roll: "var(--danger)", // red
  warm_up: "var(--caution)", // orange
  isometrics: "var(--accent)", // green - strength work
  plyometrics: "var(--caution)", // orange - explosive work
  strength: "var(--accent)", // green - strength work (incl. Nordic curls)
  conditioning: "var(--danger)", // red - cardio/conditioning
  skill_drills: "var(--info)", // blue - skill/twitching
  main_session: "var(--accent)", // brand mint
  cool_down: "var(--info)", // blue
  evening_recovery: "var(--accent-2)", // purple
} as const;

/**
 * Workout type colors for calendars and schedules
 * Maps directly to CSS variables
 */
export const WORKOUT_COLORS = {
  strength: "var(--accent)",
  cardio: "var(--caution)",
  mobility: "var(--info)",
  practice: "var(--accent-2)",
  game: "var(--danger)",
  rest: "var(--text-faint)",
} as const;

/**
 * Training periodization phase colors
 */
export const PHASE_COLORS = {
  recovery: "var(--info)",
  foundation: "var(--accent)",
  strength: "var(--accent-press)",
  power: "var(--caution)",
  speed: "var(--warn)",
  competition: "var(--danger)",
  reload: "var(--accent-2)",
  peak: "var(--good)",
  lateSeason: "var(--c-blue-500)",
} as const;

/**
 * Default coach team branding when API has no custom colors (matches primitives).
 * Exempt from “no hex in features” — persisted user/team data.
 */
export const DEFAULT_TEAM_BRAND_HEX = {
  primary: "#00E07A",
  secondary: "#8B7CFF",
} as const;

/**
 * Semantic chart color keys (CSS var references for DOM / configs that accept var()).
 */
export const CHART_COLORS = {
  primary: "var(--accent)",
  secondary: "var(--accent-2)",
  tertiary: "var(--info)",
  quaternary: "var(--warn)",
  quinary: "var(--danger)",
  senary: "var(--accent-2)",
  septenary: "var(--caution)",
} as const;

/**
 * Extended palette as CSS var references (multi-series charts, non-canvas).
 */
export const CHART_PALETTE: readonly string[] = [
  "var(--accent)",
  "var(--accent-2)",
  "var(--info)",
  "var(--warn)",
  "var(--danger)",
  "var(--c-violet-400)",
  "var(--caution)",
  "var(--c-blue-500)",
  "var(--c-orange-500)",
  "var(--good)",
] as const;

/**
 * Status colors for charts (hex values)
 */
export const CHART_STATUS_COLORS = {
  success: "var(--good)",
  warning: "var(--warn)",
  error: "var(--danger)",
  info: "var(--info)",
  neutral: "var(--text-faint)",
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
    return STATUS_COLORS.success; // var(--good)
  } else if (value >= fairThreshold) {
    return STATUS_COLORS.warning; // var(--warn)
  }
  return STATUS_COLORS.error; // var(--danger)
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
  success: "var(--good)",
  successLight: "var(--good-soft)",
  warning: "var(--warn)",
  warningLight: "var(--warn-soft)",
  error: "var(--danger)",
  errorLight: "var(--danger-soft)",
  info: "var(--info)",
  infoLight: "var(--info-soft)",
  neutral: "var(--text-faint)",
} as const;

// ============================================================================
// SPACING & SIZING TOKENS
// ============================================================================

/**
 * Breakpoint bridge constants for TS-only APIs (e.g. responsive style/media maps).
 * These mirror the canonical CSS token values in design-system-tokens.scss.
 */
export const BREAKPOINTS = {
  xs: "374px",
  sm: "640px",
  md: "768px",
  /** Just below `md` — matches `--breakpoint-md-max` (767px) for max-width media queries */
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
 * Spacing scale. Phase E grid (`--s-1`…`--s-8`) where the step exists; off-grid
 * steps fall back to their literal px value.
 */
export const SPACING = {
  0: "0",
  1: cssToken("--s-1"), // 4
  2: cssToken("--s-2"), // 8
  3: cssToken("--s-3"), // 12
  4: cssToken("--s-4"), // 16
  5: "20px",
  6: cssToken("--s-5"), // 24
  7: "28px",
  8: cssToken("--s-6"), // 32
  9: "36px",
  10: "40px",
  11: "44px",
  12: cssToken("--s-7"), // 48
  16: cssToken("--s-8"), // 64
} as const;

/**
 * Icon sizes (Phase E has no --icon-* tokens; literal px)
 */
export const ICON_SIZES = {
  xs: "12px",
  sm: "16px",
  md: "20px",
  lg: "24px",
  xl: "28px",
  "2xl": "32px",
  "3xl": "40px",
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
    sm: "32px",
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
