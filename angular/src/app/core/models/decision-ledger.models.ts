/**
 * Decision Ledger Models
 * 
 * TypeScript interfaces and types for the Decision Ledger system
 */

export type DecisionType =
  | 'load_adjustment'
  | 'rtp_clearance'
  | 'rtp_progression'
  | 'nutrition_change'
  | 'hydration_adjustment'
  | 'mental_protocol'
  | 'tactical_modification'
  | 'recovery_intervention'
  | 'medical_constraint'
  | 'supplement_change'
  | 'training_program_assignment'
  | 'session_modification'
  | 'readiness_override'
  | 'acwr_override'
  | 'other';

export type DecisionCategory =
  | 'medical'
  | 'load'
  | 'nutrition'
  | 'psychological'
  | 'tactical'
  | 'recovery';

export type DecisionStatus =
  | 'active'
  | 'reviewed'
  | 'superseded'
  | 'expired'
  | 'cancelled';

export type ReviewPriority = 'critical' | 'high' | 'normal' | 'low';

export type ReviewOutcome =
  | 'maintained'
  | 'modified'
  | 'reversed'
  | 'extended';

export type ReviewTrigger =
  | `in_${number}h`
  | `in_${number}d`
  | `in_${number}w`
  | `after_${number}_sessions`
  | 'after_next_session'
  | 'after_next_game'
  | 'if_symptoms_worsen'
  | `if_acwr_exceeds:${number}`
  | `if_readiness_drops:${number}`
  | `if_compliance_fails:${number}`
  | `if_trend_continues:${string}:${number}d`
  | `if_no_improvement:${number}d`
  | `if_goal_reached:${string}`
  | `before_event:${string}`;

export interface ConfidenceMetadata {
  completeness: number; // 0.0 to 1.0
  recency: number; // 0.0 to 1.0
  quality: number; // 0.0 to 1.0
  context: number; // 0.0 to 1.0
  overall: number; // Weighted average
  missingInputs: string[];
  staleData: string[];
  lowQualityData: string[];
}

export interface DecisionBasis {
  dataPoints: string[]; // ["ACWR: 1.45", "Readiness: 62"]
  constraints: string[]; // ["RTP Phase 2", "No sprinting >80%"]
  rationale: string;
  confidence: number; // 0.0 to 1.0
  dataQuality: {
    completeness: number;
    staleDays: number;
  };
}

export interface OutcomeData {
  athleteStateBefore: Record<string, unknown>;
  athleteStateAfter: Record<string, unknown>;
  goalAchieved: boolean;
  unintendedConsequences: string[];
  lessonsLearned?: string;
}

export interface DecisionMaker {
  id: string;
  name: string;
  role: string;
}

export interface DecisionLedgerEntry {
  id: string;
  athleteId: string;
  athleteName?: string;
  teamId: string;
  decisionType: DecisionType;
  decisionSummary: string;
  decisionCategory: DecisionCategory;
  madeBy: DecisionMaker;
  decisionBasis: DecisionBasis;
  intendedDuration?: string; // ISO 8601 duration
  reviewTrigger: ReviewTrigger;
  reviewDate: Date;
  reviewPriority: ReviewPriority;
  status: DecisionStatus;
  supersededBy?: string;
  supersedes?: string[];
  reviewedAt?: Date;
  reviewedBy?: DecisionMaker;
  reviewOutcome?: ReviewOutcome;
  reviewNotes?: string;
  outcomeData?: OutcomeData;
  createdAt: Date;
  updatedAt: Date;
}

export interface DecisionReviewReminder {
  id: string;
  decisionId: string;
  reminderType: 'review_due' | 'review_overdue' | 'decision_expiring' | 'outcome_check';
  scheduledFor: Date;
  notifiedAt?: Date;
  notificationSent: boolean;
  notifyUserIds?: string[];
  notifyRoles?: string[];
  status: 'pending' | 'sent' | 'acknowledged' | 'dismissed' | 'expired';
  createdAt: Date;
}

export interface CreateDecisionRequest {
  athleteId: string;
  decisionType: DecisionType;
  decisionSummary: string;
  decisionCategory: DecisionCategory;
  decisionBasis: DecisionBasis;
  intendedDuration?: string;
  reviewTrigger: ReviewTrigger;
  nextSessionDate?: Date;
  nextGameDate?: Date;
}

export interface ReviewDecisionRequest {
  decisionId: string;
  reviewOutcome: ReviewOutcome;
  reviewNotes?: string;
  outcomeData?: OutcomeData;
  newReviewDate?: Date; // If extending
  newReviewTrigger?: ReviewTrigger; // If extending
}

export interface DecisionFilters {
  athleteId?: string;
  teamId?: string;
  decisionType?: DecisionType;
  decisionCategory?: DecisionCategory;
  status?: DecisionStatus;
  madeBy?: string;
  reviewPriority?: ReviewPriority;
  dueForReview?: boolean;
  overdue?: boolean;
  lowConfidence?: boolean; // confidence < 0.7
  dateFrom?: Date;
  dateTo?: Date;
}

export interface DecisionStats {
  total: number;
  active: number;
  dueForReview: number;
  overdue: number;
  lowConfidence: number;
  byCategory: Record<DecisionCategory, number>;
  byPriority: Record<ReviewPriority, number>;
}

export interface DecisionConflict {
  decisionId: string;
  conflictingDecisionId: string;
  conflictType: 'contradictory' | 'overlapping' | 'supersession_chain';
  description: string;
  resolutionRequired: boolean;
}

