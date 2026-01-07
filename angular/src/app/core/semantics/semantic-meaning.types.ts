/**
 * Semantic Meaning System (SMS)
 * 
 * Phase 3 - Meaning-First Architecture
 * 
 * Rule Zero: Meaning is defined once. Components are just renderers.
 * 
 * This file defines the four canonical meanings that exist across the entire product.
 * These meanings are immutable and globally defined.
 * 
 * NO NEW MEANINGS WITHOUT GOVERNANCE.
 */

/**
 * Canonical Meaning: RISK
 * 
 * System Definition: Elevated injury / overload probability
 * User Interpretation: "Something may harm me if ignored"
 * 
 * Visual Grammar:
 * - Color: Red ONLY (never yellow, never orange for risk)
 * - Icon: ⚠️ (warning triangle)
 * - Primary Component: RiskBanner
 * - Placement: Top of context container
 * - Severity: Handled by copy + intensity, NOT color swaps
 * 
 * Never Again:
 * - Yellow risk
 * - Risk buried in cards
 * - Risk expressed only as a tag
 */
export interface RiskMeaning {
  type: "risk";
  severity: "low" | "moderate" | "high" | "critical";
  source: string; // e.g., "acwr", "readiness", "load-progression"
  affectedEntity: string; // e.g., "training-plan", "player", "session"
  message: string; // User-facing explanation
  recommendation?: string; // What to do about it
}

/**
 * Canonical Meaning: INCOMPLETE DATA
 * 
 * System Definition: Reduced model confidence
 * User Interpretation: "System is less reliable right now"
 * 
 * Visual Grammar:
 * - Color: Amber / Orange ONLY
 * - Icon: ⧗ (hourglass or data icon)
 * - Primary Component: DataConfidenceIndicator
 * - Placement: Attached to the metric it affects
 * 
 * Never Again:
 * - Multiple confidence bars
 * - Data warnings floating independently of data
 * - Yellow for incomplete data (amber/orange only)
 */
export interface IncompleteDataMeaning {
  type: "incomplete-data";
  severity: "warning" | "critical";
  dataType: "wellness" | "training" | "rpe" | "sleep" | "general";
  daysMissing?: number;
  affectedMetric: string; // e.g., "acwr", "readiness", "load-calculation"
  confidenceImpact: number; // 0.0 to 1.0 - how much confidence is reduced
  message: string; // User-facing explanation
}

/**
 * Canonical Meaning: ACTION REQUIRED
 * 
 * System Definition: Progress blocked without input
 * User Interpretation: "I must do something"
 * 
 * Visual Grammar:
 * - Color: White surface + strong border (not colored background)
 * - Icon: → (arrow) or ✔︎ (checkmark)
 * - Primary Component: ActionPanel
 * - Placement: Inline, blocking progression
 * 
 * Rule:
 * If action is required, it must:
 * - contain the action
 * - be dismissible only by action
 * - never be passive text
 * 
 * Never Again:
 * - Passive tags saying "action required"
 * - Yellow badges for actions
 * - Actions buried in text
 */
export interface ActionRequiredMeaning {
  type: "action-required";
  urgency: "low" | "medium" | "high" | "critical";
  actionType:
    | "complete-profile"
    | "complete-wellness"
    | "log-training"
    | "modify-session"
    | "review-plan"
    | "contact-coach"
    | "general";
  actionRoute?: string[]; // Route to perform action
  actionLabel: string; // Button text
  blocking: boolean; // Does this block progression?
  message: string; // Why action is required
}

/**
 * Canonical Meaning: COACH OVERRIDE
 * 
 * System Definition: Human decision replaced automation
 * User Interpretation: "Coach intentionally intervened"
 * 
 * Visual Grammar:
 * - Color: Blue (informational, authoritative)
 * - Icon: 👤 (person/user icon)
 * - Primary Component: OverrideNotice
 * - Placement: Directly on modified entity
 * 
 * Mandatory Content:
 * - What AI suggested
 * - What coach changed
 * - (Optional) why
 * 
 * Rule:
 * No silent overrides. Ever.
 */
export interface CoachOverrideMeaning {
  type: "coach-override";
  overrideType:
    | "load-adjustment"
    | "session-modification"
    | "plan-change"
    | "threshold-override"
    | "general";
  affectedEntity: string; // e.g., "training-plan", "session-123"
  aiRecommendation: Record<string, unknown>; // What AI suggested
  coachDecision: Record<string, unknown>; // What coach changed
  coachId: string;
  coachName?: string;
  reason?: string; // Why coach overrode
  timestamp: Date;
}

/**
 * Union type for all canonical meanings
 */
export type SemanticMeaning =
  | RiskMeaning
  | IncompleteDataMeaning
  | ActionRequiredMeaning
  | CoachOverrideMeaning;

/**
 * Meaning metadata for rendering decisions
 */
export interface MeaningMetadata {
  meaning: SemanticMeaning;
  context: {
    container: "dashboard" | "card" | "banner" | "inline" | "modal";
    priority: "low" | "medium" | "high" | "critical";
    dismissible: boolean;
  };
}

/**
 * Visual grammar rules (enforced by renderer)
 */
export const MEANING_VISUAL_GRAMMAR = {
  risk: {
    color: "red", // ONLY red, never yellow
    icon: "pi-exclamation-triangle",
    primaryComponent: "RiskBanner",
    placement: "top",
  },
  "incomplete-data": {
    color: "orange", // ONLY orange/amber, never yellow
    icon: "pi-hourglass",
    primaryComponent: "DataConfidenceIndicator",
    placement: "attached",
  },
  "action-required": {
    color: "white-surface", // White surface + strong border
    icon: "pi-arrow-right",
    primaryComponent: "ActionPanel",
    placement: "inline-blocking",
  },
  "coach-override": {
    color: "blue", // Informational, authoritative
    icon: "pi-user",
    primaryComponent: "OverrideNotice",
    placement: "on-entity",
  },
} as const;

/**
 * Validation: Ensure meaning follows semantic rules
 */
export function validateMeaning(meaning: SemanticMeaning): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (meaning.type === "risk") {
    // Risk MUST be red - never yellow
    if (meaning.severity === "moderate" || meaning.severity === "low") {
      errors.push(
        "Risk meaning: Low/moderate risk should still use red color (severity handled by intensity, not color)"
      );
    }
  }

  if (meaning.type === "incomplete-data") {
    // Incomplete data MUST be orange/amber - never yellow
    if (meaning.severity === "warning") {
      // Warning is acceptable but should use orange, not yellow
    }
  }

  if (meaning.type === "action-required") {
    // Action required MUST be blocking if critical/high
    if (
      (meaning.urgency === "critical" || meaning.urgency === "high") &&
      !meaning.blocking
    ) {
      errors.push(
        "Action required: Critical/high urgency actions must be blocking"
      );
    }
    // Action required MUST have action route or label
    if (!meaning.actionRoute && !meaning.actionLabel) {
      errors.push(
        "Action required: Must have either actionRoute or actionLabel"
      );
    }
  }

  if (meaning.type === "coach-override") {
    // Coach override MUST have AI recommendation and coach decision
    if (
      !meaning.aiRecommendation ||
      Object.keys(meaning.aiRecommendation).length === 0
    ) {
      errors.push("Coach override: Must include AI recommendation");
    }
    if (
      !meaning.coachDecision ||
      Object.keys(meaning.coachDecision).length === 0
    ) {
      errors.push("Coach override: Must include coach decision");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

