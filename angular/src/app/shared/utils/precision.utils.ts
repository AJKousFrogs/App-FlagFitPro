/**
 * Precision Utilities for Numeric Calculations
 *
 * Provides consistent rounding and precision handling across the application.
 * Critical for ACWR calculations and other numeric operations.
 *
 * @version 1.0.0
 */

/**
 * Round a number to specified decimal places using proper mathematical rounding.
 * Avoids floating-point precision issues.
 *
 * @param value - The number to round
 * @param decimals - Number of decimal places (default: 2)
 * @returns Rounded number, or 0 for invalid inputs
 *
 * @example
 * roundToPrecision(1.2345, 2) // 1.23
 * roundToPrecision(1.235, 2)  // 1.24 (rounds up)
 * roundToPrecision(NaN, 2)    // 0
 */
export function roundToPrecision(value: number, decimals = 2): number {
  if (
    value === null ||
    value === undefined ||
    isNaN(value) ||
    !isFinite(value)
  ) {
    return 0;
  }

  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Safely divide two numbers with precision handling.
 * Returns 0 if divisor is 0 or if inputs are invalid.
 *
 * @param numerator - The dividend
 * @param denominator - The divisor
 * @param decimals - Number of decimal places (default: 2)
 * @returns Result of division rounded to specified precision, or 0 for invalid inputs
 *
 * @example
 * safeDivide(10, 3, 2)  // 3.33
 * safeDivide(5, 0, 2)   // 0 (prevents division by zero)
 * safeDivide(NaN, 5, 2) // 0
 */
export function safeDivide(
  numerator: number,
  denominator: number,
  decimals = 2,
): number {
  if (
    numerator === null ||
    numerator === undefined ||
    isNaN(numerator) ||
    !isFinite(numerator)
  ) {
    return 0;
  }

  if (
    denominator === null ||
    denominator === undefined ||
    isNaN(denominator) ||
    !isFinite(denominator) ||
    denominator === 0
  ) {
    return 0;
  }

  return roundToPrecision(numerator / denominator, decimals);
}

/**
 * Calculate percentage with precision handling.
 *
 * @param part - The part value
 * @param whole - The whole value
 * @param decimals - Number of decimal places (default: 1)
 * @returns Percentage rounded to specified precision, or 0 for invalid inputs
 *
 * @example
 * calculatePercentage(25, 100, 1) // 25.0
 * calculatePercentage(1, 3, 2)    // 33.33
 */
export function calculatePercentage(
  part: number,
  whole: number,
  decimals = 1,
): number {
  if (whole === 0) return 0;
  return roundToPrecision((part / whole) * 100, decimals);
}

/**
 * Calculate percentage change between two values.
 *
 * @param oldValue - The original value
 * @param newValue - The new value
 * @param decimals - Number of decimal places (default: 1)
 * @returns Percentage change, or 0 if old value is 0
 *
 * @example
 * percentageChange(100, 125, 1) // 25.0 (increase)
 * percentageChange(100, 75, 1)  // -25.0 (decrease)
 */
export function percentageChange(
  oldValue: number,
  newValue: number,
  decimals = 1,
): number {
  if (oldValue === 0) return 0;
  return roundToPrecision(((newValue - oldValue) / oldValue) * 100, decimals);
}

/**
 * Clamp a number to a specified range.
 *
 * @param value - The value to clamp
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Value clamped to range
 *
 * @example
 * clamp(5, 0, 10)   // 5
 * clamp(-5, 0, 10)  // 0
 * clamp(15, 0, 10)  // 10
 */
export function clamp(value: number, min: number, max: number): number {
  if (isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculate average of an array of numbers.
 *
 * @param values - Array of numbers
 * @param decimals - Number of decimal places (default: 2)
 * @returns Average rounded to specified precision, or 0 for empty array
 *
 * @example
 * average([1, 2, 3, 4, 5], 2) // 3.00
 */
export function average(values: number[], decimals = 2): number {
  if (!values || values.length === 0) return 0;

  const validValues = values.filter((v) => !isNaN(v) && isFinite(v));
  if (validValues.length === 0) return 0;

  const sum = validValues.reduce((acc, val) => acc + val, 0);
  return roundToPrecision(sum / validValues.length, decimals);
}

/**
 * Calculate standard deviation of an array of numbers.
 *
 * @param values - Array of numbers
 * @param decimals - Number of decimal places (default: 2)
 * @returns Standard deviation rounded to specified precision
 *
 * @example
 * standardDeviation([1, 2, 3, 4, 5], 2) // 1.41
 */
export function standardDeviation(
  values: number[],
  decimals = 2,
): number {
  if (!values || values.length < 2) return 0;

  const validValues = values.filter((v) => !isNaN(v) && isFinite(v));
  if (validValues.length < 2) return 0;

  const avg = average(validValues, 10); // Use high precision for intermediate calculation
  const squaredDiffs = validValues.map((v) => Math.pow(v - avg, 2));
  const avgSquaredDiff = average(squaredDiffs, 10);

  return roundToPrecision(Math.sqrt(avgSquaredDiff), decimals);
}

/**
 * ACWR-specific precision constant
 * Standard precision for all ACWR calculations
 */
export const ACWR_PRECISION = 2;

/**
 * Calculate ACWR ratio with standard precision.
 *
 * @param acuteLoad - Acute load (7-day)
 * @param chronicLoad - Chronic load (28-day)
 * @returns ACWR ratio with standard precision
 *
 * @example
 * calculateACWRRatio(500, 400) // 1.25
 * calculateACWRRatio(500, 0)   // 0 (safe division)
 */
export function calculateACWRRatio(
  acuteLoad: number,
  chronicLoad: number,
): number {
  return safeDivide(acuteLoad, chronicLoad, ACWR_PRECISION);
}

/**
 * Format number for display with specified decimal places and null safety.
 * Ensures consistent formatting across the app with proper fallback handling.
 *
 * NOTE: This is different from format.utils.ts formatNumber() which adds thousands separators.
 * Use this version when you need:
 * - Null/undefined safety with fallback
 * - Fixed decimal places without thousands separators
 * - ACWR calculations and precision-critical displays
 *
 * Use format.utils.ts formatNumber() when you need:
 * - Thousands separators (e.g., "1,234.56")
 * - General number formatting
 *
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 2)
 * @param fallback - Fallback string for invalid values (default: '—')
 * @returns Formatted string
 *
 * @example
 * formatNumberSafe(1.5, 2)       // "1.50"
 * formatNumberSafe(NaN, 2, '-')  // "-"
 * formatNumberSafe(null, 2)      // "—"
 */
export function formatNumberSafe(
  value: number | null | undefined,
  decimals = 2,
  fallback = "—",
): string {
  if (
    value === null ||
    value === undefined ||
    isNaN(value) ||
    !isFinite(value)
  ) {
    return fallback;
  }
  return value.toFixed(decimals);
}
