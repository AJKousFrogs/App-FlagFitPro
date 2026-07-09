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
export const ACWR_PRECISION = 2;

/**
 * Round a number to specified decimal places using proper mathematical rounding.
 * Avoids floating-point precision issues.
 *
 * @param {number} value - The number to round
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {number} Rounded number, or 0 for invalid inputs
 */
export function roundToPrecision(value, decimals = 2) {
  if (
    value === null ||
    value === undefined ||
    isNaN(value) ||
    !isFinite(value)
  ) {
    return 0;
  }

  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Safely divide two numbers with precision handling.
 */
export function safeDivide(numerator, denominator, decimals = 2) {
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
 * Calculate average of an array of numbers.
 */
export function average(values, decimals = 2) {
  if (!values || values.length === 0) {
    return 0;
  }

  const validValues = values.filter((v) => !isNaN(v) && isFinite(v));
  if (validValues.length === 0) {
    return 0;
  }

  const sum = validValues.reduce((acc, val) => acc + val, 0);
  return roundToPrecision(sum / validValues.length, decimals);
}

/**
 * Calculate standard deviation of an array of numbers.
 */
export function standardDeviation(values, decimals = 2) {
  if (!values || values.length < 2) {
    return 0;
  }

  const validValues = values.filter((v) => !isNaN(v) && isFinite(v));
  if (validValues.length < 2) {
    return 0;
  }

  const avg = average(validValues, 10);
  const squaredDiffs = validValues.map((v) => (v - avg) ** 2);
  const avgSquaredDiff = average(squaredDiffs, 10);

  return roundToPrecision(Math.sqrt(avgSquaredDiff), decimals);
}
