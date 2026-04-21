/**
 * Number Formatting Utilities
 * ============================
 *
 * Helper functions for formatting numbers in stats, dashboards, and metrics.
 * See Week 3 Phase 3A of v3.1 improvements.
 *
 * USAGE:
 *   import { formatLargeNumber, formatPercentage, formatCurrency } from './number-format.utils';
 *
 *   formatLargeNumber(1500);        // "1.5K"
 *   formatLargeNumber(1000000);     // "1M"
 *   formatPercentage(0.8542);       // "85.4%"
 *   formatCurrency(1234.56);        // "$1,234.56"
 */

/**
 * Format large numbers with K/M/B suffixes
 *
 * @param value - Number to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string with suffix
 *
 * @example
 * formatLargeNumber(1500);          // "1.5K"
 * formatLargeNumber(1234567);       // "1.2M"
 * formatLargeNumber(1234567890);    // "1.2B"
 * formatLargeNumber(999);           // "999"
 * formatLargeNumber(1500, 0);       // "2K"
 */
export function formatLargeNumber(
  value: number,
  decimals = 1,
): string {
  const absValue = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (absValue >= 1_000_000_000) {
    // Billions
    return sign + (absValue / 1_000_000_000).toFixed(decimals) + "B";
  } else if (absValue >= 1_000_000) {
    // Millions
    return sign + (absValue / 1_000_000).toFixed(decimals) + "M";
  } else if (absValue >= 1_000) {
    // Thousands
    return sign + (absValue / 1_000).toFixed(decimals) + "K";
  } else {
    // Less than 1000, no suffix
    return value.toString();
  }
}

/**
 * Format decimal as percentage
 *
 * @param value - Decimal value (0-1)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 *
 * @example
 * formatPercentage(0.8542);      // "85.4%"
 * formatPercentage(0.8542, 0);   // "85%"
 * formatPercentage(0.8542, 2);   // "85.42%"
 * formatPercentage(1);           // "100%"
 */
export function formatPercentage(
  value: number,
  decimals = 1,
): string {
  return (value * 100).toFixed(decimals) + "%";
}

/**
 * Format number as currency
 *
 * @param value - Number to format
 * @param currency - Currency symbol (default: "$")
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string
 *
 * @example
 * formatCurrency(1234.56);              // "$1,234.56"
 * formatCurrency(1234.56, "€");         // "€1,234.56"
 * formatCurrency(1234.56, "$", 0);      // "$1,235"
 */
export function formatCurrency(
  value: number,
  currency = "$",
  decimals = 2,
): string {
  const formatted = value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return currency + formatted;
}

/**
 * Format number with thousands separators
 *
 * @param value - Number to format
 * @param separator - Thousands separator (default: ",")
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted number string
 *
 * @example
 * formatWithSeparator(1234567);         // "1,234,567"
 * formatWithSeparator(1234567.89, ",", 2); // "1,234,567.89"
 * formatWithSeparator(1234567, " ");    // "1 234 567"
 */
export function formatWithSeparator(
  value: number,
  separator = ",",
  decimals = 0,
): string {
  const fixed = value.toFixed(decimals);
  const parts = fixed.split(".");
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  return parts[1] ? `${integerPart}.${parts[1]}` : integerPart;
}

/**
 * Format duration in seconds to MM:SS
 *
 * @param seconds - Duration in seconds
 * @returns Formatted time string
 *
 * @example
 * formatDuration(65);      // "01:05"
 * formatDuration(3661);    // "61:01"
 * formatDuration(0);       // "00:00"
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Format number with + sign for positive values
 *
 * @param value - Number to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted string with +/- sign
 *
 * @example
 * formatWithSign(15);       // "+15"
 * formatWithSign(-15);      // "-15"
 * formatWithSign(0);        // "0"
 * formatWithSign(12.5, 1);  // "+12.5"
 */
export function formatWithSign(value: number, decimals = 0): string {
  if (value === 0) return "0";
  const formatted = value.toFixed(decimals);
  return value > 0 ? `+${formatted}` : formatted;
}

/**
 * Get abbreviated large number for compact display
 * Automatically determines best format
 *
 * @param value - Number to format
 * @returns Object with value and suffix
 *
 * @example
 * getCompactNumber(1500);
 * // { value: 1.5, suffix: "K", formatted: "1.5K" }
 *
 * getCompactNumber(1234567);
 * // { value: 1.2, suffix: "M", formatted: "1.2M" }
 */
export function getCompactNumber(value: number): {
  value: number;
  suffix: string;
  formatted: string;
} {
  const absValue = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (absValue >= 1_000_000_000) {
    const compactValue = absValue / 1_000_000_000;
    return {
      value: compactValue,
      suffix: "B",
      formatted: sign + compactValue.toFixed(1) + "B",
    };
  } else if (absValue >= 1_000_000) {
    const compactValue = absValue / 1_000_000;
    return {
      value: compactValue,
      suffix: "M",
      formatted: sign + compactValue.toFixed(1) + "M",
    };
  } else if (absValue >= 1_000) {
    const compactValue = absValue / 1_000;
    return {
      value: compactValue,
      suffix: "K",
      formatted: sign + compactValue.toFixed(1) + "K",
    };
  } else {
    return {
      value: value,
      suffix: "",
      formatted: value.toString(),
    };
  }
}
