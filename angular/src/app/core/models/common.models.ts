/**
 * Common Shared Models
 *
 * Reusable type definitions used across the application.
 * Reduces type duplication and improves consistency.
 *
 * @module core/models/common
 */

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: Date;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

// ============================================================================
// USER TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  role: UserRole;
  profile: UserProfile;
  preferences?: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = "athlete" | "coach" | "admin" | "guardian";

export interface UserProfile {
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  /** Aligned with DB constraint: male, female, other, undisclosed */
  gender?: "male" | "female" | "other" | "undisclosed";
  avatar?: string;
  bio?: string;
  position?: string;
  teamId?: string;
}

export interface UserPreferences {
  theme: "light" | "dark" | "auto";
  language: string;
  timezone: string;
  notifications: NotificationPreferences;
  units: UnitPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  frequency: "realtime" | "daily" | "weekly";
}

export interface UnitPreferences {
  distance: "metric" | "imperial";
  weight: "metric" | "imperial";
  temperature: "celsius" | "fahrenheit";
}

// ============================================================================
// TIME RANGE TYPES
// ============================================================================

export type TimeFrame = "7d" | "30d" | "3m" | "6m" | "1y" | "all" | "custom";

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface TimeframeMeta {
  label: string;
  days: number;
  startDate: Date;
  endDate: Date;
}

// ============================================================================
// CHART/GRAPH TYPES
// ============================================================================

export interface ChartDataPoint {
  date: Date | string;
  value: number;
  label?: string;
  metadata?: Record<string, any>;
}

export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  color?: string;
  type?: "line" | "bar" | "area";
}

export interface ChartConfig {
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  responsive?: boolean;
}

// ============================================================================
// STATUS/STATE TYPES
// ============================================================================

export type LoadingState = "idle" | "loading" | "success" | "error";

export type DataState =
  | "no_data"
  | "insufficient_data"
  | "demo_data"
  | "real_data";

export type TrendDirection = "up" | "down" | "stable";

export interface StatusIndicator {
  status: "success" | "warning" | "error" | "info";
  message: string;
  icon?: string;
  severity?: "low" | "medium" | "high";
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface FormError {
  field: string;
  message: string;
  code?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: FormError[];
}

export interface FormState<T> {
  data: T;
  loading: boolean;
  errors: FormError[];
  touched: Set<keyof T>;
  dirty: boolean;
}

// ============================================================================
// SEARCH/FILTER TYPES
// ============================================================================

export interface SearchParams {
  query: string;
  filters?: Record<string, any>;
  sort?: SortOption;
  pagination?: Pagination;
}

export interface SortOption {
  field: string;
  direction: "asc" | "desc";
}

export interface FilterOption {
  label: string;
  value: string | number;
  count?: number;
}

// ============================================================================
// FILE TYPES
// ============================================================================

export interface FileUpload {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  url?: string;
  error?: string;
}

export interface AttachmentMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: Date;
  uploadedBy: string;
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  action?: NotificationAction;
  read: boolean;
  createdAt: Date;
}

export interface NotificationAction {
  label: string;
  url?: string;
  callback?: () => void;
}

// ============================================================================
// METADATA TYPES
// ============================================================================

export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface AuditLog extends Timestamps {
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  changes?: Record<string, any>;
  ip?: string;
  userAgent?: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export type ReadOnly<T> = {
  readonly [P in keyof T]: T[P];
};
