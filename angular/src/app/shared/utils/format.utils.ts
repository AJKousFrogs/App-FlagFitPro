/**
 * Data Formatting Utilities
 *
 * Centralized formatting functions following PLAYER_DATA_DISPLAY_LOGIC.md guidelines
 * Ensures consistent number, percentage, date, and stat formatting across the app
 */

/**
 * Format a number with specified decimal places
 * Uses banker's rounding for consistency
 *
 * @param value - Number to format
 * @param decimals - Number of decimal places (default: 0)
 * @param showZero - Whether to show "0" or "N/A" for zero values (default: true)
 * @returns Formatted number string with thousand separators
 *
 * @example
 * formatNumber(1234.567, 2) // "1,234.57"
 * formatNumber(0, 0, false) // "N/A"
 */
export function formatNumber(
  value: number | null | undefined,
  decimals: number = 0,
  showZero: boolean = true,
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return showZero ? "0" : "N/A";
  }

  if (value === 0 && !showZero) {
    return "N/A";
  }

  // Use banker's rounding for consistency
  const rounded = roundToDecimals(value, decimals);

  return rounded.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format a percentage value
 * Always shows 1 decimal place by default (per PLAYER_DATA_DISPLAY_LOGIC.md)
 *
 * @param value - Percentage as decimal (0-1) or already as percentage (0-100)
 * @param decimals - Number of decimal places (default: 1)
 * @param asDecimal - Whether value is already a decimal (0-1) or percentage (0-100) (default: true)
 * @param showZero - Whether to show "0.0%" or "N/A" for zero values (default: true)
 * @returns Formatted percentage string
 *
 * @example
 * formatPercentage(0.75) // "75.0%"
 * formatPercentage(75, 1, false) // "75.0%"
 * formatPercentage(0, 1, true, false) // "N/A"
 */
export function formatPercentage(
  value: number | null | undefined,
  decimals: number = 1,
  asDecimal: boolean = true,
  showZero: boolean = true,
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return showZero ? "0.0%" : "N/A";
  }

  if (value === 0 && !showZero) {
    return "N/A";
  }

  const percentage = asDecimal ? value * 100 : value;
  const rounded = roundToDecimals(percentage, decimals);

  return `${rounded.toFixed(decimals)}%`;
}

/**
 * Format an average value (yards per attempt, yards per carry, etc.)
 * Always shows 2 decimal places (per PLAYER_DATA_DISPLAY_LOGIC.md)
 *
 * @param value - Average value to format
 * @param decimals - Number of decimal places (default: 2)
 * @param showZero - Whether to show "0.00" or "N/A" for zero values (default: true)
 * @returns Formatted average string
 *
 * @example
 * formatAverage(12.5) // "12.50"
 * formatAverage(8.456) // "8.46"
 * formatAverage(0, 2, false) // "N/A"
 */
export function formatAverage(
  value: number | null | undefined,
  decimals: number = 2,
  showZero: boolean = true,
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return showZero ? `0.${"0".repeat(decimals)}` : "N/A";
  }

  if (value === 0 && !showZero) {
    return "N/A";
  }

  const rounded = roundToDecimals(value, decimals);
  return rounded.toFixed(decimals);
}

/**
 * Format a stat value based on its type
 * Automatically applies correct formatting based on stat type
 *
 * @param value - Stat value to format
 * @param statType - Type of stat ('percentage' | 'average' | 'whole')
 * @param options - Formatting options
 * @returns Formatted stat string
 *
 * @example
 * formatStat(75.5, 'percentage') // "75.5%"
 * formatStat(12.5, 'average') // "12.50"
 * formatStat(1234, 'whole') // "1,234"
 */
export function formatStat(
  value: number | null | undefined,
  statType: "percentage" | "average" | "whole",
  options?: {
    decimals?: number;
    showZero?: boolean;
  },
): string {
  const { decimals, showZero = true } = options || {};

  switch (statType) {
    case "percentage":
      return formatPercentage(value, decimals, true, showZero);
    case "average":
      return formatAverage(value, decimals, showZero);
    case "whole":
      return formatNumber(value, 0, showZero);
    default:
      return formatNumber(value, 0, showZero);
  }
}

/**
 * Format a date for display
 *
 * @param date - Date to format (Date object, string, or timestamp)
 * @param format - Format style ('short' | 'medium' | 'long' | 'full' | 'time')
 * @returns Formatted date string
 *
 * @example
 * formatDate(new Date(), 'short') // "12/14/25"
 * formatDate(new Date(), 'medium') // "Dec 14, 2025"
 * formatDate(new Date(), 'time') // "3:45 PM"
 */
export function formatDate(
  date: Date | string | number | null | undefined,
  format: "short" | "medium" | "long" | "full" | "time" = "medium",
): string {
  if (!date) {
    return "N/A";
  }

  const dateObj =
    typeof date === "string" || typeof date === "number"
      ? new Date(date)
      : date;

  if (isNaN(dateObj.getTime())) {
    return "Invalid Date";
  }

  const formatOptions: Record<string, Intl.DateTimeFormatOptions> = {
    short: { month: "numeric", day: "numeric", year: "2-digit" },
    medium: { month: "short", day: "numeric", year: "numeric" },
    long: { month: "long", day: "numeric", year: "numeric" },
    full: { weekday: "long", month: "long", day: "numeric", year: "numeric" },
    time: { hour: "numeric", minute: "2-digit", hour12: true },
  };
  const options: Intl.DateTimeFormatOptions = formatOptions[format];

  return dateObj.toLocaleDateString("en-US", options);
}

/**
 * Format a date range for display
 *
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Formatted date range string
 *
 * @example
 * formatDateRange(new Date('2025-12-01'), new Date('2025-12-14'))
 * // "Dec 1 - Dec 14, 2025"
 */
export function formatDateRange(
  startDate: Date | string | number | null | undefined,
  endDate: Date | string | number | null | undefined,
): string {
  if (!startDate || !endDate) {
    return "N/A";
  }

  const start =
    typeof startDate === "string" || typeof startDate === "number"
      ? new Date(startDate)
      : startDate;
  const end =
    typeof endDate === "string" || typeof endDate === "number"
      ? new Date(endDate)
      : endDate;

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return "Invalid Date Range";
  }

  const startFormatted = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const endFormatted = end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (start.getFullYear() === end.getFullYear()) {
    return `${startFormatted} - ${endFormatted}`;
  }

  return `${start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })} - ${endFormatted}`;
}

/**
 * Round a number to specified decimal places using banker's rounding
 * This ensures consistent rounding across the application
 *
 * @param value - Number to round
 * @param decimals - Number of decimal places
 * @returns Rounded number
 *
 * @example
 * roundToDecimals(1.25, 1) // 1.2 (banker's rounding)
 * roundToDecimals(1.35, 1) // 1.4 (banker's rounding)
 */
export function roundToDecimals(value: number, decimals: number): number {
  if (decimals === 0) {
    return Math.round(value);
  }

  const factor = Math.pow(10, decimals);
  const multiplied = value * factor;

  // Banker's rounding: round to nearest even
  const rounded = Math.round(multiplied);

  return rounded / factor;
}

/**
 * Format a duration (time span) for display
 *
 * @param minutes - Duration in minutes
 * @returns Formatted duration string
 *
 * @example
 * formatDuration(90) // "1h 30m"
 * formatDuration(45) // "45m"
 * formatDuration(0) // "0m"
 */
export function formatDuration(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || isNaN(minutes)) {
    return "N/A";
  }

  if (minutes === 0) {
    return "0m";
  }

  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);

  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${mins}m`;
  }
}

/**
 * Format a stat value with appropriate unit
 *
 * @param value - Stat value
 * @param unit - Unit to append ('yards' | 'attempts' | 'games' | 'sessions' | etc.)
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted stat with unit
 *
 * @example
 * formatStatWithUnit(250, 'yards') // "250 yards"
 * formatStatWithUnit(12.5, 'yards', 2) // "12.50 yards"
 */
export function formatStatWithUnit(
  value: number | null | undefined,
  unit: string,
  decimals: number = 0,
): string {
  const formatted = formatNumber(value, decimals, true);
  return formatted === "N/A" ? "N/A" : `${formatted} ${unit}`;
}

/**
 * Format a completion percentage (specialized for player stats)
 * Always uses 1 decimal place per PLAYER_DATA_DISPLAY_LOGIC.md
 *
 * @param completions - Number of completions
 * @param attempts - Number of attempts
 * @returns Formatted completion percentage
 *
 * @example
 * formatCompletionPercentage(15, 20) // "75.0%"
 * formatCompletionPercentage(0, 0) // "0.0%"
 */
export function formatCompletionPercentage(
  completions: number,
  attempts: number,
): string {
  if (attempts === 0) {
    return "0.0%";
  }

  const percentage = (completions / attempts) * 100;
  return formatPercentage(percentage / 100, 1, false, true);
}

/**
 * Format a drop rate (specialized for player stats)
 * Always uses 1 decimal place per PLAYER_DATA_DISPLAY_LOGIC.md
 *
 * @param drops - Number of drops
 * @param targets - Number of targets
 * @returns Formatted drop rate percentage
 *
 * @example
 * formatDropRate(2, 15) // "13.3%"
 * formatDropRate(0, 0) // "0.0%"
 */
export function formatDropRate(drops: number, targets: number): string {
  if (targets === 0) {
    return "0.0%";
  }

  const rate = (drops / targets) * 100;
  return formatPercentage(rate / 100, 1, false, true);
}

/**
 * Format yards per attempt (specialized for player stats)
 * Always uses 2 decimal places per PLAYER_DATA_DISPLAY_LOGIC.md
 *
 * @param yards - Total yards
 * @param attempts - Number of attempts
 * @returns Formatted yards per attempt
 *
 * @example
 * formatYardsPerAttempt(250, 20) // "12.50"
 * formatYardsPerAttempt(0, 0) // "0.00"
 */
export function formatYardsPerAttempt(yards: number, attempts: number): string {
  if (attempts === 0) {
    return "0.00";
  }

  const avg = yards / attempts;
  return formatAverage(avg, 2, true);
}

/**
 * Format yards per carry (specialized for player stats)
 * Always uses 2 decimal places per PLAYER_DATA_DISPLAY_LOGIC.md
 *
 * @param yards - Total rushing yards
 * @param carries - Number of carries
 * @returns Formatted yards per carry
 *
 * @example
 * formatYardsPerCarry(85, 10) // "8.50"
 * formatYardsPerCarry(0, 0) // "0.00"
 */
export function formatYardsPerCarry(yards: number, carries: number): string {
  if (carries === 0) {
    return "0.00";
  }

  const avg = yards / carries;
  return formatAverage(avg, 2, true);
}

/**
 * Format flag pull success rate (specialized for player stats)
 * Always uses 1 decimal place per PLAYER_DATA_DISPLAY_LOGIC.md
 *
 * @param pulls - Number of successful flag pulls
 * @param attempts - Number of flag pull attempts
 * @returns Formatted success rate percentage
 *
 * @example
 * formatFlagPullSuccessRate(8, 12) // "66.7%"
 * formatFlagPullSuccessRate(0, 0) // "0.0%"
 */
export function formatFlagPullSuccessRate(
  pulls: number,
  attempts: number,
): string {
  if (attempts === 0) {
    return "0.0%";
  }

  const rate = (pulls / attempts) * 100;
  return formatPercentage(rate / 100, 1, false, true);
}
