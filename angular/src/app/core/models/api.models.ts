/**
 * API Response Type Definitions
 *
 * TypeScript interfaces for API responses, ML predictions, and data structures.
 * These types ensure type safety when working with backend data.
 *
 * @module core/models/api
 */

import type { SupplementEntry } from "./supplement.models";

// ============================================================================
// ML PREDICTION TYPES
// ============================================================================

/**
 * Sprint prediction input data
 */
export interface SprintPredictionInput {
  playerId: string;
  sprintTimes?: {
    average: number;
    best?: number;
    recent?: number[];
  };
  weeklyLoad?: number;
  recoveryMetrics?: {
    overall: number;
    sleep?: number;
    hrv?: number;
  };
  movementQuality?: number;
  conditions?: {
    temperature?: number;
    humidity?: number;
    surface?: string;
  };
  position?: string;
  age?: number;
  accelerationScore?: number;
  topSpeedScore?: number;
  agilityScore?: number;
}

/**
 * Route skill prediction input data
 */
export interface RouteSkillInput {
  reps?: number;
  successRate?: number;
  complexity?: number;
  fatigueLevel?: number;
  currentFatigue?: number;
  routeTypes?: Record<string, number>;
}

/**
 * Decision making prediction input data
 */
export interface DecisionPredictionInput {
  reactionTime?: number;
  visionScore?: number;
  pressureScore?: number;
  yearsExperience?: number;
  gameSituation?: number;
  position: string;
}

/**
 * ML training data entry for model improvement
 */
export interface MLTrainingDataEntry {
  playerId: string;
  predictionType: string;
  timestamp: number;
  input: SprintPredictionInput | RouteSkillInput | DecisionPredictionInput;
  predicted: unknown;
  actual: unknown | null;
  accuracy: number | null;
}

// ============================================================================
// FEATURE EXTRACTION TYPES
// ============================================================================

/**
 * Sprint features for ML model
 */
export interface SprintFeatures {
  current_speed: number;
  training_load: number;
  recovery_score: number;
  biomechanics: number;
  weather: number;
  position_factor: number;
  age_factor: number;
}

/**
 * Route features for ML model
 */
export interface RouteFeatures {
  practice_reps: number;
  success_rate: number;
  complexity_level: number;
  cognitive_load: number;
  fatigue: number;
  route_type?: string;
}

/**
 * Decision features for ML model
 */
export interface DecisionFeatures {
  reaction_time: number;
  field_vision: number;
  pressure_handling: number;
  experience: number;
  game_situation: number;
  scenario_type?: string;
}

/**
 * Flag football optimization result
 */
export interface FlagFootballOptimization {
  time: number;
  improvement: number;
  acceleration: number;
  topSpeed: number;
  agility: number;
}

/**
 * Skill classification result
 */
export interface SkillClassificationResult {
  current: number;
  projected: number;
  rate: number;
  practiceHours: number;
}

/**
 * Neural network decision result
 */
export interface NeuralNetworkDecisionResult {
  probability: number;
  timing: number;
  potential: number;
  recommendations: string[];
}

// ============================================================================
// DAILY PROTOCOL TYPES
// ============================================================================

/**
 * Daily protocol response from API
 */
export interface DailyProtocolResponse {
  id: string;
  date: string;
  userId: string;
  blocks: ProtocolBlock[];
  aiRationale?: string;
  status: "generated" | "in_progress" | "completed";
  createdAt: string;
  updatedAt: string;
}

/**
 * Protocol block (warmup, main, cooldown, etc.)
 */
export interface ProtocolBlock {
  id: string;
  type: "warmup" | "main" | "cooldown" | "recovery" | "skills";
  title: string;
  duration: number;
  exercises: ProtocolExercise[];
  notes?: string;
}

/**
 * Exercise within a protocol block
 */
export interface ProtocolExercise {
  id: string;
  name: string;
  description?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  sets?: number;
  reps?: number | string;
  duration?: number;
  rest?: number;
  intensity?: "low" | "medium" | "high";
  notes?: string;
  completed?: boolean;
}

// ============================================================================
// SMART RECOMMENDATIONS TYPES
// ============================================================================

/**
 * Smart training recommendations response
 */
export interface SmartRecommendationsResponse {
  athleteId: string;
  date: string;
  overallStatus: "optimal" | "caution" | "injured" | "taper" | "deload";
  recommendations: TrainingRecommendation[];
  warnings: string[];
  suggestions: string[];
  metrics: {
    acwr: number;
    readiness: number;
    fatigue: number;
    injuryRisk: number;
  };
}

/**
 * Individual training recommendation
 */
export interface TrainingRecommendation {
  type: "intensity" | "volume" | "focus" | "recovery" | "technique";
  priority: "high" | "medium" | "low";
  message: string;
  action?: string;
  reasoning?: string;
}

// ============================================================================
// WELLNESS TYPES
// ============================================================================

/**
 * Wellness checkin data
 */
export interface WellnessCheckinData {
  id?: string;
  userId?: string;
  date: string;
  sleepQuality?: number;
  sleepHours?: number;
  energyLevel?: number;
  stressLevel?: number;
  sorenessLevel?: number;
  motivationLevel?: number;
  hydration?: number;
  mood?: number;
  notes?: string;
  symptoms?: string[];
}

/**
 * Wellness trend data point
 */
export interface WellnessTrendPoint {
  date: string;
  sleep: number;
  energy: number;
  stress: number;
  soreness: number;
  motivation: number;
  overall: number;
}

// ============================================================================
// TRAINING SESSION TYPES (API)
// ============================================================================

/**
 * Training session from database
 */
export interface TrainingSessionRecord {
  id: string;
  user_id: string;
  athlete_id?: string;
  date: string;
  session_date?: string;
  session_type: string;
  title?: string;
  description?: string;
  duration: number;
  intensity?: number;
  workload?: number;
  rpe?: number;
  start_time?: string;
  end_time?: string;
  scheduled_time?: string;
  location?: string;
  status: "planned" | "in_progress" | "completed" | "cancelled" | "scheduled";
  completed?: boolean;
  notes?: string;
  exercises?: unknown[];
  created_at: string;
  updated_at?: string;
}

// ============================================================================
// USER METADATA TYPES
// ============================================================================

/**
 * User metadata from Supabase auth
 */
export interface UserMetadata {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  full_name?: string;
  avatar_url?: string;
  avatarUrl?: string;
  position?: string;
  teamId?: string;
  team_id?: string;
  dateOfBirth?: string;
  date_of_birth?: string;
  gender?: "male" | "female" | "other" | "undisclosed";
  country?: string;
  phone?: string;
  experience?: string;
  specialization?: string;
  certifications?: string[];
  achievements?: string[];
  dailyRoutine?: DailyRoutineSlot[];
  preferences?: UserPreferencesMetadata;
}

/**
 * Daily routine slot
 */
export interface DailyRoutineSlot {
  id: string;
  label: string;
  time: string;
  icon?: string;
  enabled?: boolean;
}

/**
 * User preferences in metadata
 */
export interface UserPreferencesMetadata {
  theme?: "light" | "dark" | "auto";
  language?: string;
  timezone?: string;
  units?: "metric" | "imperial";
  notifications?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
  };
}

// ============================================================================
// SCHEDULE ITEM TYPES
// ============================================================================

/**
 * Today's schedule item
 */
export interface TodayScheduleItem {
  id: string;
  time: string;
  title: string;
  type: "training" | "game" | "nutrition" | "wellness" | "recovery" | "work";
  status: "completed" | "in-progress" | "upcoming";
  duration: number;
  description?: string;
  icon?: string;
  supplements?: SupplementEntry[];
}

/**
 * Supplement entry
 * @deprecated Use SupplementEntry from core/models/supplement.models instead
 * Re-exported for backward compatibility
 */
export type { SupplementEntry } from "./supplement.models";

// ============================================================================
// TEAM MEMBER TYPES
// ============================================================================

/**
 * Team member from database
 */
export interface TeamMemberRecord {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  users?: {
    id: string;
    email: string;
    raw_user_meta_data?: UserMetadata;
  };
  teams?: {
    name: string;
  };
}

/**
 * Team player from database
 */
export interface TeamPlayerRecord {
  id: string;
  team_id: string;
  user_id?: string;
  name: string;
  position: string;
  jersey_number?: number | string;
  country?: string;
  age?: number;
  height?: string;
  weight?: string;
  email?: string;
  phone?: string;
  status: "active" | "injured" | "inactive" | "suspended";
  stats?: Record<string, unknown>;
  created_at: string;
  created_by?: string;
}

/**
 * Team invitation from database
 */
export interface TeamInvitationRecord {
  id: string;
  team_id: string;
  email: string;
  role: string;
  message?: string;
  status: "pending" | "accepted" | "declined" | "expired" | "cancelled";
  invited_by: string;
  expires_at: string;
  created_at: string;
  updated_at?: string;
  inviter?: {
    raw_user_meta_data?: UserMetadata;
  };
}

// ============================================================================
// CALIBRATION/LOGGING TYPES
// ============================================================================

/**
 * Calibration log entry
 */
export interface CalibrationLogEntry {
  timestamp: number;
  type: string;
  data: unknown;
  userId?: string;
  sessionId?: string;
}

/**
 * Feedback submission data
 */
export interface FeedbackSubmission {
  type: "bug" | "feature" | "general" | "improvement";
  message: string;
  rating?: number;
  metadata?: Record<string, unknown>;
  screenshot?: string;
  userId?: string;
  userAgent?: string;
  url?: string;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Supabase error structure
 */
export interface SupabaseError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
  status?: number;
}

/**
 * API error response
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
  timestamp?: string;
}

// ============================================================================
// GENERIC RESPONSE WRAPPERS
// ============================================================================

/**
 * Batch operation result
 */
export interface BatchOperationResult {
  success: boolean;
  processed: number;
  failed: number;
  errors?: Array<{ id: string; error: string }>;
}
