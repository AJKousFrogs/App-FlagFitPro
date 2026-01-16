/**
 * Precision Utilities for Numeric Calculations
 *
 * Provides consistent rounding and precision handling across Netlify functions.
 * Critical for ACWR calculations and other numeric operations.
 *
 * @version 1.0.0
 */

/**
 * Standard precision for ACWR calculations
 */
const ACWR_PRECISION = 2;

/**
 * Round a number to specified decimal places using proper mathematical rounding.
 * Avoids floating-point precision issues.
 *
 * @param {number} value - The number to round
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {number} Rounded number, or 0 for invalid inputs
 *
 * @example
 * roundToPrecision(1.2345, 2) // 1.23
 * roundToPrecision(1.235, 2)  // 1.24 (rounds up)
 * roundToPrecision(NaN, 2)    // 0
 */
function roundToPrecision(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
    return 0;
  }

  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Safely divide two numbers with precision handling.
 * Returns 0 if divisor is 0 or if inputs are invalid.
 *
 * @param {number} numerator - The dividend
 * @param {number} denominator - The divisor
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {number} Result of division rounded to specified precision, or 0 for invalid inputs
 *
 * @example
 * safeDivide(10, 3, 2)  // 3.33
 * safeDivide(5, 0, 2)   // 0 (prevents division by zero)
 * safeDivide(NaN, 5, 2) // 0
 */
function safeDivide(numerator, denominator, decimals = 2) {
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
 * @param {number} part - The part value
 * @param {number} whole - The whole value
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {number} Percentage rounded to specified precision, or 0 for invalid inputs
 *
 * @example
 * calculatePercentage(25, 100, 1) // 25.0
 * calculatePercentage(1, 3, 2)    // 33.33
 */
function calculatePercentage(part, whole, decimals = 1) {
  if (whole === 0) return 0;
  return roundToPrecision((part / whole) * 100, decimals);
}

/**
 * Calculate percentage change between two values.
 *
 * @param {number} oldValue - The original value
 * @param {number} newValue - The new value
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {number} Percentage change, or 0 if old value is 0
 *
 * @example
 * percentageChange(100, 125, 1) // 25.0 (increase)
 * percentageChange(100, 75, 1)  // -25.0 (decrease)
 */
function percentageChange(oldValue, newValue, decimals = 1) {
  if (oldValue === 0) return 0;
  return roundToPrecision(((newValue - oldValue) / oldValue) * 100, decimals);
}

/**
 * Clamp a number to a specified range.
 *
 * @param {number} value - The value to clamp
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {number} Value clamped to range
 *
 * @example
 * clamp(5, 0, 10)   // 5
 * clamp(-5, 0, 10)  // 0
 * clamp(15, 0, 10)  // 10
 */
function clamp(value, min, max) {
  if (isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculate average of an array of numbers.
 *
 * @param {number[]} values - Array of numbers
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {number} Average rounded to specified precision, or 0 for empty array
 *
 * @example
 * average([1, 2, 3, 4, 5], 2) // 3.00
 */
function average(values, decimals = 2) {
  if (!values || values.length === 0) return 0;

  const validValues = values.filter((v) => !isNaN(v) && isFinite(v));
  if (validValues.length === 0) return 0;

  const sum = validValues.reduce((acc, val) => acc + val, 0);
  return roundToPrecision(sum / validValues.length, decimals);
}

/**
 * Calculate standard deviation of an array of numbers.
 *
 * @param {number[]} values - Array of numbers
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {number} Standard deviation rounded to specified precision
 *
 * @example
 * standardDeviation([1, 2, 3, 4, 5], 2) // 1.41
 */
function standardDeviation(values, decimals = 2) {
  if (!values || values.length < 2) return 0;

  const validValues = values.filter((v) => !isNaN(v) && isFinite(v));
  if (validValues.length < 2) return 0;

  const avg = average(validValues, 10); // Use high precision for intermediate calculation
  const squaredDiffs = validValues.map((v) => Math.pow(v - avg, 2));
  const avgSquaredDiff = average(squaredDiffs, 10);

  return roundToPrecision(Math.sqrt(avgSquaredDiff), decimals);
}

/**
 * Calculate ACWR ratio with standard precision.
 *
 * @param {number} acuteLoad - Acute load (7-day)
 * @param {number} chronicLoad - Chronic load (28-day)
 * @returns {number} ACWR ratio with standard precision
 *
 * @example
 * calculateACWRRatio(500, 400) // 1.25
 * calculateACWRRatio(500, 0)   // 0 (safe division)
 */
function calculateACWRRatio(acuteLoad, chronicLoad) {
  return safeDivide(acuteLoad, chronicLoad, ACWR_PRECISION);
}

/**
 * Format number for display with specified decimal places.
 *
 * @param {number|null|undefined} value - The number to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @param {string} fallback - Fallback string for invalid values (default: '—')
 * @returns {string} Formatted string
 *
 * @example
 * formatNumber(1.5, 2)       // "1.50"
 * formatNumber(NaN, 2, '-')  // "-"
 */
function formatNumber(value, decimals = 2, fallback = "—") {
  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
    return fallback;
  }
  return value.toFixed(decimals);
}

module.exports = {
  ACWR_PRECISION,
  roundToPrecision,
  safeDivide,
  calculatePercentage,
  percentageChange,
  clamp,
  average,
  standardDeviation,
  calculateACWRRatio,
  formatNumber,
};
