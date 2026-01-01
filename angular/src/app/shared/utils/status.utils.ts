/**
 * Status Utility Functions
 *
 * Centralized utilities for handling status-related operations across the application.
 * Provides consistent severity mapping for PrimeNG components (Tag, Badge, etc.).
 *
 * @example
 * ```typescript
 * import { getStatusSeverity, statusSeverityMap } from '@shared/utils/status.utils';
 *
 * // In template:
 * // <p-tag [value]="status" [severity]="getStatusSeverity(status)"></p-tag>
 *
 * // In component:
 * readonly getStatusSeverity = getStatusSeverity;
 * ```
 */

/**
 * Status to PrimeNG severity mapping
 * Maps common status values to PrimeNG severity types
 */
export const statusSeverityMap: Record<string, string> = {
  // Training/Session statuses
  scheduled: "info",
  in_progress: "warning",
  active: "success",
  completed: "success",
  cancelled: "danger",
  missed: "danger",

  // General statuses
  pending: "info",
  approved: "success",
  rejected: "danger",
  draft: "secondary",

  // User/Team statuses
  invited: "info",
  accepted: "success",
  declined: "danger",
  inactive: "secondary",

  // Health/Risk statuses
  optimal: "success",
  elevated: "warning",
  danger: "danger",
  low: "secondary",
  moderate: "info",
  high: "warning",
  critical: "danger",

  // Recovery statuses
  recovering: "info",
  recovered: "success",

  // ACWR Risk Zones
  detraining: "warning",
  sweet_spot: "success",
  insufficient_data: "secondary",
};

/**
 * Get PrimeNG severity for a given status
 * @param status - The status string
 * @returns PrimeNG severity type
 */
export function getStatusSeverity(
  status: string,
): "success" | "info" | "warn" | "warning" | "danger" | "secondary" {
  const severity = statusSeverityMap[status?.toLowerCase()];
  return (severity as any) || "info";
}

/**
 * Get human-readable label for a status
 * Converts snake_case or camelCase to Title Case
 *
 * @example
 * ```typescript
 * getStatusLabel('in_progress') // Returns: "In Progress"
 * getStatusLabel('scheduledSession') // Returns: "Scheduled Session"
 * ```
 */
export function getStatusLabel(status: string): string {
  if (!status) return "";

  // Convert snake_case or camelCase to Title Case
  return status
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .trim()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Get icon for a given status
 * Returns PrimeNG icon class
 */
export const statusIconMap: Record<string, string> = {
  scheduled: "pi-calendar",
  in_progress: "pi-spin pi-spinner",
  completed: "pi-check-circle",
  cancelled: "pi-times-circle",
  pending: "pi-clock",
  approved: "pi-check",
  rejected: "pi-times",
  active: "pi-circle-fill",
  inactive: "pi-circle",
};

/**
 * Get icon class for a given status
 * @param status - The status string
 * @returns PrimeNG icon class
 */
export function getStatusIcon(status: string): string {
  return statusIconMap[status?.toLowerCase()] || "pi-info-circle";
}

/**
 * Check if status is a "positive" state
 * @param status - The status string
 * @returns True if status is positive (completed, approved, success, etc.)
 */
export function isPositiveStatus(status: string): boolean {
  const positiveStatuses = [
    "completed",
    "approved",
    "success",
    "accepted",
    "active",
    "optimal",
    "recovered",
    "high",
  ];
  return positiveStatuses.includes(status?.toLowerCase());
}

/**
 * Check if status is a "negative" state
 * @param status - The status string
 * @returns True if status is negative (cancelled, rejected, danger, etc.)
 */
export function isNegativeStatus(status: string): boolean {
  const negativeStatuses = [
    "cancelled",
    "rejected",
    "danger",
    "declined",
    "missed",
    "critical",
    "failed",
  ];
  return negativeStatuses.includes(status?.toLowerCase());
}

/**
 * Check if status is a "warning" state
 * @param status - The status string
 * @returns True if status is warning (in_progress, elevated, etc.)
 */
export function isWarningStatus(status: string): boolean {
  const warningStatuses = [
    "in_progress",
    "elevated",
    "warning",
    "detraining",
    "moderate",
  ];
  return warningStatuses.includes(status?.toLowerCase());
}
