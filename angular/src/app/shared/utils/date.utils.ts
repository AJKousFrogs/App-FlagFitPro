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
  addWeeks,
  addMonths,
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
