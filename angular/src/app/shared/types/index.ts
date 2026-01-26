/**
 * Shared Type Definitions for FlagFit Pro
 * Central location for commonly used types across the application
 */

// ============================================
// API Response Types
// ============================================

/**
 * Generic API response wrapper
 * @deprecated Use ApiResponse from core/models/common.models instead
 */
export type ApiResponse<T> =
  import("../../core/models/common.models").ApiResponse<T>;

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ResponseMeta {
  timestamp: string;
  requestId?: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// ============================================
// Player & User Types
// ============================================

export interface Player {
  id: string;
  userId: string;
  teamId: string;
  name: string;
  email: string;
  position: PlayerPosition;
  jerseyNumber?: number;
  dateOfBirth?: string;
  height?: number; // in cm
  weight?: number; // in kg
  dominantHand: "left" | "right";
  status: PlayerStatus;
  createdAt: string;
  updatedAt: string;
}

export type PlayerPosition =
  | "QB"
  | "WR"
  | "RB"
  | "DB"
  | "LB"
  | "RUSH"
  | "CENTER"
  | "OTHER";

export type PlayerStatus = "active" | "injured" | "inactive" | "suspended";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = "player" | "coach" | "admin";

// ============================================
// Game & Performance Types
// ============================================

export interface GameStats {
  gameId: string;
  playerId: string;
  gameDate: string;
  opponent: string;
  present: boolean;

  // Passing stats
  passAttempts: number;
  completions: number;
  passingYards: number;
  touchdowns: number;
  interceptions: number;
  snapAccuracy?: number;
  throwAccuracy?: number;

  // Receiving stats
  targets: number;
  receptions: number;
  receivingYards: number;
  drops: number;

  // Rushing stats
  rushingAttempts: number;
  rushingYards: number;

  // Defensive stats
  flagPullAttempts: number;
  flagPulls: number;
  interceptionsDef: number;
  passDeflections: number;
}

export interface AggregatedStats {
  playerId: string;
  period: StatPeriod;
  gamesPlayed: number;

  // Totals
  totalPassAttempts: number;
  totalCompletions: number;
  totalPassingYards: number;
  totalTouchdowns: number;
  totalInterceptions: number;
  totalReceptions: number;
  totalReceivingYards: number;
  totalRushingYards: number;
  totalFlagPulls: number;

  // Averages
  avgCompletionRate: number;
  avgPassingYardsPerGame: number;
  avgTouchdownsPerGame: number;
  avgReceptionsPerGame: number;
  avgReceivingYardsPerGame: number;
}

export interface StatPeriod {
  type: "game" | "week" | "month" | "season" | "career";
  startDate: string;
  endDate: string;
  label: string;
}

// ============================================
// Training & Workout Types
// ============================================

export interface TrainingSession {
  id: string;
  playerId: string;
  sessionDate: string;
  sessionType: TrainingType;
  duration: number; // in minutes
  intensity: IntensityLevel;
  status: SessionStatus;
  exercises: Exercise[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type TrainingType =
  | "strength"
  | "conditioning"
  | "skills"
  | "recovery"
  | "team_practice"
  | "individual";

export type IntensityLevel = "light" | "moderate" | "high" | "max";
export type SessionStatus = "planned" | "in_progress" | "completed" | "skipped";

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  sets?: number;
  reps?: number;
  duration?: number; // in seconds
  distance?: number; // in meters
  weight?: number; // in kg
  rpe?: number; // Rate of Perceived Exertion (1-10)
  notes?: string;
}

export type ExerciseCategory =
  | "warmup"
  | "strength"
  | "power"
  | "speed"
  | "agility"
  | "endurance"
  | "flexibility"
  | "cooldown"
  | "skills";

// ============================================
// Load Management & Recovery Types
// ============================================

export interface LoadData {
  playerId: string;
  date: string;
  sessionLoad: number; // RPE * Duration
  acuteLoad: number; // 7-day rolling average
  chronicLoad: number; // 28-day rolling average
  acwr: number; // Acute:Chronic Workload Ratio
  riskLevel: RiskLevel;
}

export type RiskLevel = "low" | "moderate" | "high" | "critical";

export interface ReadinessScore {
  playerId: string;
  date: string;
  score: number; // 0-100
  factors: ReadinessFactor[];
  recommendation: string;
}

export interface ReadinessFactor {
  name: string;
  value: number;
  weight: number;
  status: "good" | "fair" | "poor";
}

export interface WellnessData {
  playerId: string;
  date: string;
  sleepHours: number;
  sleepQuality: number; // 1-10
  fatigueLevel: number; // 1-10
  stressLevel: number; // 1-10
  muscularSoreness: number; // 1-10
  mood: number; // 1-10
  notes?: string;
}

// ============================================
// Nutrition Types
// ============================================

export interface NutritionLog {
  id: string;
  playerId: string;
  date: string;
  mealType: MealType;
  foods: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  notes?: string;
}

export type MealType =
  | "breakfast"
  | "lunch"
  | "dinner"
  | "snack"
  | "pre_workout"
  | "post_workout";

export interface FoodItem {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface NutritionGoals {
  playerId: string;
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
  hydrationGoal: number; // in ml
}

// ============================================
// Team & Tournament Types
// ============================================

export interface Team {
  id: string;
  name: string;
  location: string;
  league?: string;
  season: string;
  coachId: string;
  players: Player[];
  createdAt: string;
  updatedAt: string;
}

export interface Tournament {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  teams: string[]; // team IDs
  games: Game[];
  status: TournamentStatus;
}

export type TournamentStatus =
  | "upcoming"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface Game {
  id: string;
  tournamentId?: string;
  homeTeamId: string;
  awayTeamId: string;
  gameDate: string;
  location: string;
  homeScore?: number;
  awayScore?: number;
  status: GameStatus;
  stats?: GameStats[];
}

export type GameStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "postponed";

// ============================================
// Analytics & Chart Types
// ============================================

export interface ChartDataPoint {
  x: string | number | Date;
  y: number;
  label?: string;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  metadata?: Record<string, unknown>;
}

export interface ComparisonData {
  label: string;
  current: number;
  previous: number;
  change: number;
  changePercent: number;
}

export interface TrendData {
  period: string;
  values: number[];
  trend: "up" | "down" | "stable";
  trendPercentage: number;
}

// ============================================
// Form & Validation Types
// ============================================

export interface FormField<T = unknown> {
  name: string;
  value: T;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  disabled: boolean;
  error?: string;
  validators?: Validator[];
}

export type FormFieldType =
  | "text"
  | "email"
  | "password"
  | "number"
  | "date"
  | "select"
  | "checkbox"
  | "radio"
  | "textarea";

export interface Validator {
  type: "required" | "email" | "min" | "max" | "pattern" | "custom";
  value?: unknown;
  message: string;
}

export interface FormState {
  isValid: boolean;
  isDirty: boolean;
  isTouched: boolean;
  isSubmitting: boolean;
  errors: Record<string, string>;
}

// ============================================
// UI Component Types
// ============================================

export interface TableColumn<T = unknown> {
  key: keyof T;
  label: string;
  sortable: boolean;
  filterable: boolean;
  width?: string;
  align?: "left" | "center" | "right";
  formatter?: (value: unknown) => string;
}

export interface TableState {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder: "asc" | "desc";
  filters: Record<string, unknown>;
  searchQuery?: string;
}

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  group?: string;
}

export interface NotificationConfig {
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  duration?: number;
  dismissible?: boolean;
  action?: NotificationAction;
}

export interface NotificationAction {
  label: string;
  callback: () => void;
}

// ============================================
// Date & Time Utilities
// ============================================

export interface DateRange {
  start: Date | string;
  end: Date | string;
}

export interface TimeFrame {
  value: number;
  unit: "day" | "week" | "month" | "year";
  label: string;
}

// ============================================
// File & Upload Types
// ============================================

export interface FileUpload {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
  url?: string;
}

// ============================================
// Permission & Auth Types
// ============================================

export interface Permission {
  resource: string;
  action: "create" | "read" | "update" | "delete";
  granted: boolean;
}

export interface Session {
  userId: string;
  token: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

// ============================================
// Error Types
// ============================================

export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
  path?: string;
  statusCode?: number;
}

export type ErrorCode =
  | "AUTH_FAILED"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "PERMISSION_DENIED"
  | "SERVER_ERROR"
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "UNKNOWN";

// ============================================
// Utility Types
// ============================================

/**
 * Make all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Make specific properties required
 */
export type RequireProps<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>;

/**
 * Make specific properties optional
 */
export type OptionalProps<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;

/**
 * Extract keys of type
 */
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

/**
 * Nullable type
 */
export type Nullable<T> = T | null;

/**
 * Maybe type
 */
export type Maybe<T> = T | null | undefined;
