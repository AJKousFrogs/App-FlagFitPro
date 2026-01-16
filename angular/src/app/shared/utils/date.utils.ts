/**
 * Date utility functions
 * Uses date-fns for consistency
 */

import {
  format as dateFnsFormat,
  parseISO,
  isToday as dateFnsIsToday,
  isYesterday as dateFnsIsYesterday,
  isTomorrow as dateFnsIsTomorrow,
  isThisWeek,
  isThisMonth,
  isThisYear,
  subDays,
  subWeeks,
  subMonths,
  addDays,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  formatDistanceToNow,
  eachDayOfInterval,
} from "date-fns";

/**
 * Format date with optional format string
 * @example
 * formatDate(new Date(), 'PPP') // "December 24, 2025"
 * formatDate('2025-12-24', 'yyyy-MM-dd') // "2025-12-24"
 */
export function formatDate(
  date: Date | string,
  formatStr: string = "PPP",
): string {
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return dateFnsFormat(dateObj, formatStr);
  } catch {
    return "Invalid date";
  }
}

/**
 * Check if date is today
 */
export function isToday(date: Date | string): boolean {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return dateFnsIsToday(dateObj);
}

/**
 * Check if date is yesterday
 */
export function isYesterday(date: Date | string): boolean {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return dateFnsIsYesterday(dateObj);
}

/**
 * Check if date is tomorrow
 */
export function isTomorrow(date: Date | string): boolean {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return dateFnsIsTomorrow(dateObj);
}

/**
 * Get date N days ago
 * @example
 * daysAgo(7) // Date 7 days ago
 */
export function daysAgo(days: number): Date {
  return subDays(new Date(), days);
}

/**
 * Get date N weeks ago
 */
export function weeksAgo(weeks: number): Date {
  return subWeeks(new Date(), weeks);
}

/**
 * Get date N months ago
 */
export function monthsAgo(months: number): Date {
  return subMonths(new Date(), months);
}

/**
 * Get date N days in future
 */
export function daysFromNow(days: number): Date {
  return addDays(new Date(), days);
}

/**
 * Format as relative time (e.g., "2 hours ago")
 * @example
 * timeAgo(new Date('2025-12-24')) // "2 hours ago"
 */
export function timeAgo(date: Date | string): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

/**
 * Get array of dates between start and end
 * @example
 * dateRange(startDate, endDate) // [date1, date2, date3...]
 */
export function dateRange(start: Date | string, end: Date | string): Date[] {
  const startDate = typeof start === "string" ? parseISO(start) : start;
  const endDate = typeof end === "string" ? parseISO(end) : end;
  return eachDayOfInterval({ start: startDate, end: endDate });
}

/**
 * Get start of day
 */
export function getStartOfDay(date: Date | string = new Date()): Date {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return startOfDay(dateObj);
}

/**
 * Get end of day
 */
export function getEndOfDay(date: Date | string = new Date()): Date {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return endOfDay(dateObj);
}

/**
 * Get start of week (Monday)
 */
export function getStartOfWeek(date: Date | string = new Date()): Date {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return startOfWeek(dateObj, { weekStartsOn: 1 });
}

/**
 * Get end of week (Sunday)
 */
export function getEndOfWeek(date: Date | string = new Date()): Date {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return endOfWeek(dateObj, { weekStartsOn: 1 });
}

/**
 * Get start of month
 */
export function getStartOfMonth(date: Date | string = new Date()): Date {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return startOfMonth(dateObj);
}

/**
 * Get end of month
 */
export function getEndOfMonth(date: Date | string = new Date()): Date {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return endOfMonth(dateObj);
}

/**
 * Get difference in days between two dates
 */
export function daysBetween(
  date1: Date | string,
  date2: Date | string,
): number {
  const d1 = typeof date1 === "string" ? parseISO(date1) : date1;
  const d2 = typeof date2 === "string" ? parseISO(date2) : date2;
  return Math.abs(differenceInDays(d1, d2));
}

/**
 * Get difference in hours between two dates
 */
export function hoursBetween(
  date1: Date | string,
  date2: Date | string,
): number {
  const d1 = typeof date1 === "string" ? parseISO(date1) : date1;
  const d2 = typeof date2 === "string" ? parseISO(date2) : date2;
  return Math.abs(differenceInHours(d1, d2));
}

/**
 * Get difference in minutes between two dates
 */
export function minutesBetween(
  date1: Date | string,
  date2: Date | string,
): number {
  const d1 = typeof date1 === "string" ? parseISO(date1) : date1;
  const d2 = typeof date2 === "string" ? parseISO(date2) : date2;
  return Math.abs(differenceInMinutes(d1, d2));
}

/**
 * Check if date is in current week
 */
export function isCurrentWeek(date: Date | string): boolean {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return isThisWeek(dateObj, { weekStartsOn: 1 });
}

/**
 * Check if date is in current month
 */
export function isCurrentMonth(date: Date | string): boolean {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return isThisMonth(dateObj);
}

/**
 * Check if date is in current year
 */
export function isCurrentYear(date: Date | string): boolean {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return isThisYear(dateObj);
}

/**
 * Calculate age from birth date
 * @example
 * calculateAge(new Date('1990-05-15')) // 34 (in 2024)
 * calculateAge('1990-05-15') // 34
 */
export function calculateAge(birthDate: Date | string): number {
  const dateObj =
    typeof birthDate === "string" ? parseISO(birthDate) : birthDate;
  const today = new Date();
  let age = today.getFullYear() - dateObj.getFullYear();
  const monthDiff = today.getMonth() - dateObj.getMonth();

  // Adjust if birthday hasn't occurred this year
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < dateObj.getDate())
  ) {
    age--;
  }

  return age;
}

/**
 * Format time ago with friendly labels
 * Similar to timeAgo() but with custom formatting for specific UI needs
 * @example
 * getTimeAgo(new Date()) // "Just now"
 * getTimeAgo(oneHourAgo) // "1 hour ago"
 * getTimeAgo(twoDaysAgo) // "2 days ago"
 */
export function getTimeAgo(date: Date | string | null | undefined): string {
  if (!date) return "";

  const dateObj = typeof date === "string" ? parseISO(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins === 1) return "1 minute ago";
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours === 1) return "1 hour ago";
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

  return formatDistanceToNow(dateObj, { addSuffix: true });
}

/**
 * Format date as ISO date string (YYYY-MM-DD) for API submission
 * @example
 * formatDateISO(new Date('2025-01-11')) // '2025-01-11'
 */
export function formatDateISO(
  date: Date | string | undefined,
): string | undefined {
  if (!date) return undefined;
  if (typeof date === "string") return date;
  return date.toISOString().split("T")[0];
}

// ============================================================================
// Date Validation Utilities
// ============================================================================

/**
 * Safely parse a date from various input types.
 * Returns null for invalid inputs instead of throwing.
 *
 * @param value - Value to parse (Date, string, number, null, undefined)
 * @returns Parsed Date or null if invalid
 *
 * @example
 * safeParseDate('2025-01-15')    // Date object
 * safeParseDate(new Date())      // Date object
 * safeParseDate('invalid')       // null
 * safeParseDate(null)            // null
 */
export function safeParseDate(value: unknown): Date | null {
  if (!value) return null;

  try {
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? null : value;
    }

    if (typeof value === "string") {
      // Try ISO format first
      const parsed = parseISO(value);
      return isNaN(parsed.getTime()) ? null : parsed;
    }

    if (typeof value === "number") {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Check if a value is a valid date.
 *
 * @param value - Value to check
 * @returns True if value can be parsed as a valid date
 *
 * @example
 * isValidDate('2025-01-15')  // true
 * isValidDate('invalid')     // false
 * isValidDate(null)          // false
 */
export function isValidDate(value: unknown): boolean {
  return safeParseDate(value) !== null;
}

/**
 * Get today's date as ISO string (YYYY-MM-DD).
 * Useful for API calls and comparisons.
 *
 * @returns Today's date as ISO string
 *
 * @example
 * getTodayISO() // '2025-01-15'
 */
export function getTodayISO(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Get user's timezone identifier.
 *
 * @returns Timezone identifier (e.g., 'America/New_York')
 *
 * @example
 * getUserTimezone() // 'America/New_York'
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Convert a date to ISO string with timezone context for API submission.
 * Preserves timezone information for proper storage.
 *
 * @param date - Date to convert
 * @returns Object with ISO date and timezone
 *
 * @example
 * toDateWithTimezone(new Date())
 * // { date: '2025-01-15', timezone: 'America/New_York' }
 */
export function toDateWithTimezone(date: Date | string): {
  date: string;
  timezone: string;
} {
  const parsed = safeParseDate(date);
  if (!parsed) {
    return { date: getTodayISO(), timezone: getUserTimezone() };
  }

  return {
    date: parsed.toISOString().split("T")[0],
    timezone: getUserTimezone(),
  };
}

/**
 * Parse date for display in user's local timezone.
 *
 * @param dateString - ISO date string
 * @param formatStr - Format string (default: 'PPP')
 * @returns Formatted date string or 'Invalid date'
 *
 * @example
 * formatDateLocal('2025-01-15') // 'January 15, 2025'
 */
export function formatDateLocal(
  dateString: string | Date | null | undefined,
  formatStr: string = "PPP",
): string {
  if (!dateString) return "—";

  const date = safeParseDate(dateString);
  if (!date) return "Invalid date";

  try {
    return dateFnsFormat(date, formatStr);
  } catch {
    return "Invalid date";
  }
}

/**
 * Validate date is within acceptable range (not too far in past/future).
 *
 * @param date - Date to validate
 * @param options - Validation options
 * @returns Validation result
 *
 * @example
 * validateDateRange('2025-01-15', { maxPastDays: 365, maxFutureDays: 365 })
 * // { valid: true }
 */
export function validateDateRange(
  date: Date | string | null | undefined,
  options: {
    maxPastDays?: number;
    maxFutureDays?: number;
    allowPast?: boolean;
    allowFuture?: boolean;
  } = {},
): { valid: boolean; error?: string } {
  const {
    maxPastDays = 3650, // 10 years
    maxFutureDays = 365, // 1 year
    allowPast = true,
    allowFuture = true,
  } = options;

  const parsed = safeParseDate(date);
  if (!parsed) {
    return { valid: false, error: "Invalid date format" };
  }

  const today = startOfDay(new Date());
  const dateStartOfDay = startOfDay(parsed);
  const daysDiff = differenceInDays(dateStartOfDay, today);

  if (!allowPast && daysDiff < 0) {
    return { valid: false, error: "Date cannot be in the past" };
  }

  if (!allowFuture && daysDiff > 0) {
    return { valid: false, error: "Date cannot be in the future" };
  }

  if (daysDiff < -maxPastDays) {
    return { valid: false, error: `Date cannot be more than ${maxPastDays} days in the past` };
  }

  if (daysDiff > maxFutureDays) {
    return { valid: false, error: `Date cannot be more than ${maxFutureDays} days in the future` };
  }

  return { valid: true };
}

/**
 * Get date key for aggregation (YYYY-MM-DD format).
 * Consistent with database storage format.
 *
 * @param date - Date to convert
 * @returns Date key string
 *
 * @example
 * getDateKey(new Date()) // '2025-01-15'
 */
export function getDateKey(date: Date | string): string {
  const parsed = safeParseDate(date);
  if (!parsed) return getTodayISO();
  return dateFnsFormat(parsed, "yyyy-MM-dd");
}

// Re-export parseISO for convenience
export { parseISO } from "date-fns";
