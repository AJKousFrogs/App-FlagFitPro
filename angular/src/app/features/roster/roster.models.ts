/**
 * Roster Module Shared Models
 * Extracted from roster.component.ts for reuse across sub-components
 */

export interface TeamStat {
  value: string;
  label: string;
}

export interface StaffMember {
  id?: string;
  user_id?: string;
  name: string;
  position: string;
  role: string;
  roleCategory: StaffCategory;
  country: string;
  experience: string;
  email?: string;
  phone?: string;
  specialization?: string;
  certifications?: string[];
  achievements?: string[];
}

export type StaffCategory = "coaching" | "medical" | "performance";

export interface Player {
  id: string;
  name: string;
  position: string;
  jersey: string;
  country: string;
  age: number;
  height: string; // e.g., "188 cm"
  weight: string; // e.g., "84 kg"
  email?: string;
  phone?: string;
  status: PlayerStatus;
  stats?: Record<string, number | string>;
  created_at?: string;
  user_id?: string;

  // Live Performance Metrics (Phase 1 Enhancement)
  readiness?: number; // 0-100, from wellness check-in
  acwr?: number; // Acute:Chronic Workload Ratio
  performanceScore?: number; // 0-100, based on position benchmarks
  riskLevel?: PlayerRiskLevel; // Calculated from ACWR + readiness + injuries

  // Position-specific metrics
  positionMetrics?: PositionMetrics;
}

export type PlayerStatus =
  | "active"
  | "injured"
  | "inactive"
  | "limited"
  | "returning";

export type PlayerRiskLevel = "low" | "moderate" | "high" | "critical";

/**
 * Position-specific metrics based on FlagFootballAthleteProfileService
 */
export interface PositionMetrics {
  // Common to all positions
  sprint10m?: number; // seconds
  sprint20m?: number; // seconds
  verticalJump?: number; // cm
  proAgility505?: number; // seconds
  relativeSquat?: number; // x bodyweight
  bodyFatPercentage?: number; // %

  // QB-specific
  throwsThisWeek?: number;
  armCareCompliance?: boolean;
  throwingOnRunScore?: number;

  // WR/DB-specific
  routeRunningScore?: number;
  sprintCapacity?: number; // 8x40 yard repeats ability

  // Rusher-specific
  firstStepExplosion?: number;
  closingSpeed?: number;
}

export interface TeamInvitation {
  id: string;
  email: string;
  role: string;
  message?: string;
  status: InvitationStatus;
  invitedBy: string;
  expiresAt: string;
  createdAt: string;
  isExpired: boolean;
}

export type InvitationStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "cancelled"
  | "expired";

export interface TournamentAvailability {
  id: string;
  tournamentId: string;
  tournamentName: string;
  startDate: string;
  endDate: string;
  location: string;
  status: "confirmed" | "declined" | "tentative" | "pending";
  reason?: string;
  paymentStatus: "not_required" | "pending" | "partial" | "paid" | "waived";
  amountDue: number;
  amountPaid: number;
}

// Full staff role hierarchy
export type TeamRole =
  | "player"
  | "head_coach"
  | "offense_coordinator"
  | "defense_coordinator"
  | "assistant_coach"
  | "physiotherapist"
  | "nutritionist"
  | "strength_conditioning_coach"
  | "owner"
  | "admin"
  // Legacy roles for backward compatibility
  | "coach";

export interface PositionGroup {
  position: string;
  players: Player[];
}

export interface StaffByCategory {
  coaching: StaffMember[];
  medical: StaffMember[];
  performance: StaffMember[];
}

// Position options for forms
export const POSITION_OPTIONS = [
  { label: "Quarterback (QB)", value: "QB" },
  { label: "Wide Receiver (WR)", value: "WR" },
  { label: "Running Back (RB)", value: "RB" },
  { label: "Defensive Back (DB)", value: "DB" },
  { label: "Rusher", value: "Rusher" },
  { label: "Center", value: "C" },
  { label: "Linebacker (LB)", value: "LB" },
];

export const POSITION_FILTER_OPTIONS = [
  { label: "Quarterback", value: "QB" },
  { label: "Wide Receiver", value: "WR" },
  { label: "Running Back", value: "RB" },
  { label: "Defensive Back", value: "DB" },
  { label: "Rusher", value: "Rusher" },
  { label: "Center", value: "C" },
  { label: "Linebacker", value: "LB" },
];

export const STATUS_OPTIONS: Array<{ label: string; value: PlayerStatus }> = [
  { label: "Active", value: "active" },
  { label: "Limited", value: "limited" },
  { label: "Returning", value: "returning" },
  { label: "Injured", value: "injured" },
  { label: "Inactive", value: "inactive" },
];

export const ROLE_OPTIONS = [
  { label: "Player", value: "player" },
  // Coaching Staff
  { label: "Head Coach", value: "head_coach" },
  { label: "Offense Coordinator", value: "offense_coordinator" },
  { label: "Defense Coordinator", value: "defense_coordinator" },
  { label: "Assistant Coach", value: "assistant_coach" },
  // Medical & Performance Staff
  { label: "Physiotherapist", value: "physiotherapist" },
  { label: "Nutritionist", value: "nutritionist" },
  {
    label: "Strength & Conditioning Coach",
    value: "strength_conditioning_coach",
  },
];

export const GROUPED_ROLE_OPTIONS = [
  {
    label: "Players",
    items: [{ label: "Player", value: "player" }],
  },
  {
    label: "Coaching Staff",
    items: [
      { label: "Head Coach", value: "head_coach" },
      { label: "Offense Coordinator", value: "offense_coordinator" },
      { label: "Defense Coordinator", value: "defense_coordinator" },
      { label: "Assistant Coach", value: "assistant_coach" },
    ],
  },
  {
    label: "Medical & Performance",
    items: [
      { label: "Physiotherapist", value: "physiotherapist" },
      { label: "Nutritionist", value: "nutritionist" },
      {
        label: "Strength & Conditioning Coach",
        value: "strength_conditioning_coach",
      },
    ],
  },
];
