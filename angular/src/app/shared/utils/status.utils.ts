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
 * // <app-status-tag [value]="status" [severity]="getStatusSeverity(status)"></app-status-tag>
 *
 * // In component:
 * readonly getStatusSeverity = getStatusSeverity;
 * ```
 */

/**
 * Status to PrimeNG severity mapping
 * Maps common status values to PrimeNG severity types
 */
export type StatusVariant = "success" | "warning" | "danger" | "info" | "neutral";
export type StatusSeverity =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "secondary"
  | "contrast";
export type StatusSeverityBase = Exclude<StatusSeverity, "contrast">;

/**
 * Status to semantic variant mapping
 * Single source of truth for status -> semantic variant
 */
export const statusVariantMap: Record<string, StatusVariant> = {
  // Training/Session statuses
  scheduled: "info",
  in_progress: "warning",
  "in-progress": "warning",
  started: "info",
  active: "success",
  inactive: "neutral",
  completed: "success",
  cancelled: "danger",
  missed: "danger",
  failed: "danger",

  // General statuses
  pending: "info",
  approved: "success",
  rejected: "danger",
  draft: "neutral",
  at_risk: "warning",

  // User/Team statuses
  invited: "info",
  accepted: "success",
  declined: "danger",
  injured: "danger",
  limited: "warning",
  returning: "info",

  // Health/Risk statuses
  optimal: "success",
  elevated: "warning",
  danger: "danger",
  low: "success",
  moderate: "warning",
  high: "warning",
  critical: "danger",

  // Recovery statuses
  recovering: "info",
  recovered: "success",

  // ACWR Risk Zones
  detraining: "warning",
  sweet_spot: "success",
  insufficient_data: "neutral",
  "under-training": "info",
  "sweet-spot": "success",
  "elevated-risk": "warning",
  "danger-zone": "danger",
  "no-data": "neutral",
};

/**
 * Get PrimeNG severity for a given status
 * @param status - The status string
 * @returns PrimeNG severity type
 */
export function getStatusSeverity(
  status: string,
  fallback: StatusSeverityBase = "info",
): StatusSeverityBase {
  const normalizedFallback = fallback === "secondary" ? "neutral" : fallback;
  const variant = getStatusVariant(status, normalizedFallback);
  return variant === "neutral" ? "secondary" : variant;
}

/**
 * Get semantic status variant for a given status
 * @param status - The status string
 * @returns Semantic status variant
 */
export function getStatusVariant(
  status: string,
  fallback: StatusVariant = "info",
): StatusVariant {
  return statusVariantMap[status?.toLowerCase()] || fallback;
}

/**
 * Map a status to severity using a custom map.
 * Keeps mappings centralized while preserving domain-specific defaults.
 */
export function getMappedStatusSeverity<
  TMap extends Readonly<Record<string, StatusSeverity>>,
  TFallback extends StatusSeverity,
>(
  status: string,
  map: TMap,
  fallback: TFallback,
): TMap[keyof TMap] | TFallback {
  const key = status?.toLowerCase() as keyof TMap;
  const mapped = map[key];
  return mapped ?? fallback;
}

/**
 * Domain-specific status maps (single source of truth).
 */
export const rosterStatusSeverityMap = {
  active: "success",
  injured: "danger",
  limited: "warning",
  returning: "info",
} as const satisfies Record<string, StatusSeverity>;

export const accountStatusSeverityMap = {
  active: "success",
  pending: "warning",
  suspended: "danger",
} as const satisfies Record<string, StatusSeverity>;

export const decisionStatusSeverityMap = {
  active: "info",
  reviewed: "success",
  superseded: "warning",
  expired: "warning",
  cancelled: "danger",
} as const satisfies Record<string, StatusSeverity>;

export const playerStatusSeverityMap = {
  active: "success",
  injured: "danger",
  inactive: "info",
  at_risk: "warning",
} as const satisfies Record<string, StatusSeverity>;

export const programStatusSeverityMap = {
  draft: "secondary",
  active: "success",
  completed: "info",
  archived: "warning",
} as const satisfies Record<string, StatusSeverity>;

export const injuryStatusSeverityMap = {
  new: "danger",
  evaluating: "warning",
  rtp: "warning",
  cleared: "success",
} as const satisfies Record<string, StatusSeverity>;

export const goalStatusSeverityMap = {
  "on-track": "success",
  ahead: "success",
  behind: "warning",
  completed: "info",
} as const satisfies Record<string, StatusSeverity>;

export const paymentStatusSeverityMap = {
  paid: "success",
  due: "warning",
  overdue: "danger",
} as const satisfies Record<string, StatusSeverity>;

export const aiCoachStatusSeverityMap = {
  pending: "warning",
  accepted: "success",
  rejected: "danger",
  completed: "success",
  expired: "secondary",
} as const satisfies Record<string, StatusSeverity>;

export const teamMemberStatusSeverityMap = {
  active: "success",
  injured: "warning",
  inactive: "danger",
} as const satisfies Record<string, StatusSeverity>;

export const officialAssignmentStatusSeverityMap = {
  confirmed: "success",
  scheduled: "info",
  declined: "warning",
  no_show: "danger",
} as const satisfies Record<string, StatusSeverity>;

export const roadmapStatusSeverityMap = {
  not_started: "secondary",
  in_progress: "info",
  completed: "success",
} as const satisfies Record<string, StatusSeverity>;

export const reviewStatusSeverityMap = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
} as const satisfies Record<string, StatusSeverity>;

/**
 * Get CSS token set for a status variant
 * @param variant - Semantic status variant
 * @returns CSS variable names for background/text/border
 */
export function getStatusTokens(variant: StatusVariant): {
  solid: string;
  bg: string;
  text: string;
  border: string;
} {
  const base = variant === "neutral" ? "neutral" : variant;
  return {
    solid: `var(--ds-status-${base}-solid)`,
    bg: `var(--ds-status-${base}-bg)`,
    text: `var(--ds-status-${base}-text)`,
    border: `var(--ds-status-${base}-border)`,
  };
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
