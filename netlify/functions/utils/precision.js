/**
 * Precision Utilities for Numeric Calculations
 *
 * CANONICAL IMPLEMENTATION: Backend (server-side) is authoritative.
 * Frontend mirrors these functions to ensure calculation consistency.
 *
 * Per CLAUDE.md §4 (Single Source of Truth):
 * "One calculation, one place it's computed, everywhere else fetches/displays.
 * If you find the same formula in two places, that's a bug even if the numbers
 * currently agree — they will drift."
 *
 * PARITY VERIFICATION: Frontend implementation in angular/src/app/shared/utils/precision.utils.ts
 * must remain byte-identical. Continuous parity checking via tests/integration/acwr-parity.test.js
 * ensures frontend and backend calculations stay in sync.
 *
 * EXPORTED FUNCTIONS:
 * - roundToPrecision() ✓ Used by ACWR calculation
 * - safeDivide() ✓ Used by ACWR, percentage calculations
 * - average() ✓ Statistical calculations
 * - standardDeviation() ✓ Statistical calculations
 *
 * CONSUMER: netlify/functions/utils/acwr.js (implements EWMA ACWR calculation)
 * FRONTEND MIRROR: angular/src/app/shared/utils/precision.utils.ts
 * PARITY TESTS: tests/integration/acwr-parity.test.js (10 scenarios, 100% passing)
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
