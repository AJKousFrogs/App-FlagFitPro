import type { TeamRole } from "../../core/services/team-membership.service";

/**
 * Privacy & Safety UX Copy Module
 *
 * Centralized, reusable message templates for privacy/safety states.
 * All components should import from this single source.
 *
 * Structure for each message:
 * - title: Short headline
 * - reason: Why this state exists
 * - action: What the user can do
 * - helpLink: URL for more information
 *
 * @see docs/UX_PRIVACY_SAFETY_COPY.md
 *
 * Športno društvo Žabe - Athletes helping athletes since 2020
 */

// ============================================================================
// TYPES
// ============================================================================

export interface PrivacyMessage {
  title: string;
  reason: string;
  action: string;
  actionLabel?: string;
  helpLink?: string;
  icon?: string;
  severity?: "info" | "warning" | "error" | "success";
}

export interface DataStateMessage extends PrivacyMessage {
  dataState: DataStateType;
}

export type DataStateType =
  | "NO_DATA"
  | "INSUFFICIENT_DATA"
  | "DEMO_DATA"
  | "REAL_DATA";

export type UserRole = TeamRole | "guardian";

const COACH_VIEWER_ROLES: readonly UserRole[] = [
  "owner",
  "admin",
  "head_coach",
  "coach",
  "offense_coordinator",
  "defense_coordinator",
  "assistant_coach",
  "physiotherapist",
  "nutritionist",
  "strength_conditioning_coach",
  "psychologist",
  "manager",
];

// ============================================================================
// CONSENT BLOCKED MESSAGES
// ============================================================================

export const CONSENT_BLOCKED_MESSAGES = {
  /**
   * Coach viewing a player who hasn't enabled sharing
   */
  coachViewingPlayer: {
    title: "Data Not Shared",
    reason:
      "This player has not enabled performance data sharing with your team.",
    action: "The player can enable sharing in their Privacy Settings.",
    actionLabel: "Learn More",
    helpLink: "/help/privacy-sharing",
    icon: "pi-lock",
    severity: "info" as const,
  },

  /**
   * Coach viewing team dashboard with some blocked players
   */
  coachTeamPartialBlock: {
    title: "Some Players Have Not Shared Data",
    reason: "Not all team members have enabled performance data sharing.",
    action: "Players can choose to share their data in Privacy Settings.",
    actionLabel: "View Privacy Guide",
    helpLink: "/help/team-privacy",
    icon: "pi-users",
    severity: "info" as const,
  },

  /**
   * Player seeing why their data isn't visible to coach
   */
  playerDataNotShared: {
    title: "Your Data is Private",
    reason:
      "Your performance data is not currently shared with your team coaches.",
    action:
      "Enable sharing in Privacy Settings to let coaches see your progress.",
    actionLabel: "Open Privacy Settings",
    helpLink: "/settings/privacy",
    icon: "pi-shield",
    severity: "info" as const,
  },

  /**
   * Health data specifically blocked
   */
  healthDataBlocked: {
    title: "Health Data Not Shared",
    reason:
      "Health-related metrics require separate consent from performance data.",
    action:
      "Enable health data sharing in your Privacy Settings if you want coaches to see injury risk indicators.",
    actionLabel: "Manage Health Sharing",
    helpLink: "/settings/privacy#health",
    icon: "pi-heart",
    severity: "info" as const,
  },
} as const;

// ============================================================================
// AI PROCESSING MESSAGES
// ============================================================================

export const AI_PROCESSING_MESSAGES = {
  /**
   * AI processing is disabled by user
   */
  disabled: {
    title: "AI Features Disabled",
    reason: "You have opted out of AI-powered analysis and recommendations.",
    action:
      "Enable AI processing in Privacy Settings to receive personalized insights.",
    actionLabel: "Enable AI Features",
    helpLink: "/settings/privacy#ai",
    icon: "pi-microchip-ai",
    severity: "info" as const,
  },

  /**
   * AI processing available but not yet consented
   */
  notConsented: {
    title: "AI Features Available",
    reason:
      "AI-powered training recommendations are available but require your consent.",
    action:
      "Review and enable AI processing to get personalized training insights.",
    actionLabel: "Review AI Settings",
    helpLink: "/settings/privacy#ai",
    icon: "pi-microchip-ai",
    severity: "info" as const,
  },

  /**
   * AI feature attempted but consent missing
   */
  consentRequired: {
    title: "AI Consent Required",
    reason:
      "This feature uses AI analysis which requires your explicit consent.",
    action:
      "Enable AI processing in your Privacy Settings to use this feature.",
    actionLabel: "Go to Privacy Settings",
    helpLink: "/settings/privacy#ai",
    icon: "pi-exclamation-triangle",
    severity: "warning" as const,
  },

  /**
   * AI processing enabled confirmation
   */
  enabled: {
    title: "AI Features Active",
    reason:
      "You have enabled AI-powered analysis for personalized training insights.",
    action: "You can disable AI processing anytime in Privacy Settings.",
    actionLabel: "Manage AI Settings",
    helpLink: "/settings/privacy#ai",
    icon: "pi-check-circle",
    severity: "success" as const,
  },
} as const;

// ============================================================================
// DELETION STATUS MESSAGES
// ============================================================================

export const DELETION_MESSAGES = {
  /**
   * Deletion has been requested
   */
  requested: {
    title: "Account Deletion Requested",
    reason:
      "Your account deletion request has been received and is being processed.",
    action:
      "Your data will be permanently deleted after the 30-day grace period. You can cancel this request anytime before then.",
    actionLabel: "Cancel Deletion",
    helpLink: "/settings/account#deletion",
    icon: "pi-clock",
    severity: "warning" as const,
  },

  /**
   * Deletion is pending (in grace period)
   */
  pending: {
    title: "Deletion Pending",
    reason:
      "Your account is scheduled for deletion. You have time to change your mind.",
    action:
      "Cancel the deletion request to keep your account and all your data.",
    actionLabel: "Cancel Deletion",
    helpLink: "/settings/account#deletion",
    icon: "pi-hourglass",
    severity: "warning" as const,
  },

  /**
   * Deletion has been canceled
   */
  canceled: {
    title: "Deletion Canceled",
    reason: "Your account deletion request has been canceled.",
    action: "Your account and data are safe. No further action needed.",
    actionLabel: "View Account",
    helpLink: "/settings/account",
    icon: "pi-check-circle",
    severity: "success" as const,
  },

  /**
   * Deletion completed
   */
  completed: {
    title: "Account Deleted",
    reason: "Your account and personal data have been permanently deleted.",
    action:
      "Thank you for using FlagFit Pro. You can create a new account anytime.",
    actionLabel: "Create New Account",
    helpLink: "/signup",
    icon: "pi-check",
    severity: "info" as const,
  },

  /**
   * Grace period information
   */
  gracePeriodInfo: {
    title: "30-Day Grace Period",
    reason:
      "We keep your data for 30 days after deletion request in case you change your mind.",
    action:
      "After 30 days, your data will be permanently and irreversibly deleted.",
    actionLabel: "Learn About Data Deletion",
    helpLink: "/help/data-deletion",
    icon: "pi-info-circle",
    severity: "info" as const,
  },
} as const;

// ============================================================================
// DATA STATE MESSAGES
// ============================================================================

export const DATA_STATE_MESSAGES = {
  /**
   * No data available at all
   */
  NO_DATA: {
    dataState: "NO_DATA" as DataStateType,
    title: "No Data Yet",
    reason: "We don't have any training data for you yet.",
    action: "Start logging your training sessions to see metrics and insights.",
    actionLabel: "Log Training",
    helpLink: "/training/log",
    icon: "pi-database",
    severity: "info" as const,
  },

  /**
   * Some data but not enough for reliable metrics
   */
  INSUFFICIENT_DATA: {
    dataState: "INSUFFICIENT_DATA" as DataStateType,
    title: "Building Your Profile",
    reason: "We need more training data to provide reliable metrics.",
    action: "Continue logging sessions. Most metrics need 2-4 weeks of data.",
    actionLabel: "Learn About Data Requirements",
    helpLink: "/help/data-requirements",
    icon: "pi-chart-line",
    severity: "info" as const,
  },

  /**
   * Showing demo/sample data
   */
  DEMO_DATA: {
    dataState: "DEMO_DATA" as DataStateType,
    title: "Demo Data",
    reason: "This is sample data to show you what the app can do.",
    action: "Start logging your own training to see your real metrics.",
    actionLabel: "Start Training",
    helpLink: "/training/new",
    icon: "pi-eye",
    severity: "warning" as const,
  },

  /**
   * Real data available
   */
  REAL_DATA: {
    dataState: "REAL_DATA" as DataStateType,
    title: "Your Data",
    reason: "These metrics are calculated from your actual training data.",
    action: "Keep logging to maintain accurate and up-to-date insights.",
    actionLabel: "View Training History",
    helpLink: "/training/history",
    icon: "pi-check-circle",
    severity: "success" as const,
  },
} as const;

// ============================================================================
// METRIC-SPECIFIC INSUFFICIENT DATA MESSAGES
// ============================================================================

export const METRIC_INSUFFICIENT_DATA = {
  acwr: {
    title: "ACWR Not Available",
    reason:
      "ACWR (Acute:Chronic Workload Ratio) requires 28 days of training data.",
    action:
      "Keep logging your training. You need {{daysNeeded}} more days of data.",
    actionLabel: "Learn About ACWR",
    helpLink: "/help/acwr",
    icon: "pi-chart-bar",
    severity: "info" as const,
  },

  acuteLoad: {
    title: "Acute Load Calculating",
    reason: "Acute load requires 7 days of training data.",
    action: "Continue logging. You need {{daysNeeded}} more days.",
    actionLabel: "What is Acute Load?",
    helpLink: "/help/acute-load",
    icon: "pi-bolt",
    severity: "info" as const,
  },

  chronicLoad: {
    title: "Chronic Load Building",
    reason:
      "Chronic load requires 28 days of training data to establish baseline.",
    action: "Keep training consistently. You need {{daysNeeded}} more days.",
    actionLabel: "What is Chronic Load?",
    helpLink: "/help/chronic-load",
    icon: "pi-chart-line",
    severity: "info" as const,
  },

  monotony: {
    title: "Monotony Not Calculated",
    reason: "Training monotony requires at least 7 days of data in a week.",
    action: "Log more sessions this week to see monotony metrics.",
    actionLabel: "What is Monotony?",
    helpLink: "/help/monotony",
    icon: "pi-sync",
    severity: "info" as const,
  },

  tsb: {
    title: "TSB Not Available",
    reason: "Training Stress Balance requires 42 days of training history.",
    action:
      "Continue your training journey. You need {{daysNeeded}} more days.",
    actionLabel: "What is TSB?",
    helpLink: "/help/tsb",
    icon: "pi-sliders-h",
    severity: "info" as const,
  },

  injuryRisk: {
    title: "Injury Risk Assessment Pending",
    reason: "Accurate injury risk prediction requires 28+ days of load data.",
    action: "Keep logging to enable injury risk monitoring.",
    actionLabel: "About Injury Prevention",
    helpLink: "/help/injury-risk",
    icon: "pi-exclamation-triangle",
    severity: "info" as const,
  },
} as const;

// ============================================================================
// PARENTAL CONSENT MESSAGES
// ============================================================================

export const PARENTAL_CONSENT_MESSAGES = {
  required: {
    title: "Parental Consent Required",
    reason: "As you are under 18, some features require parental consent.",
    action: "Ask your parent or guardian to verify consent via email.",
    actionLabel: "Request Consent",
    helpLink: "/help/parental-consent",
    icon: "pi-users",
    severity: "warning" as const,
  },

  pending: {
    title: "Awaiting Parental Consent",
    reason: "We've sent a verification email to your parent/guardian.",
    action: "Ask them to check their email and approve the consent request.",
    actionLabel: "Resend Email",
    helpLink: "/help/parental-consent",
    icon: "pi-envelope",
    severity: "info" as const,
  },

  verified: {
    title: "Parental Consent Verified",
    reason: "Your parent/guardian has approved your account.",
    action: "You now have access to all age-appropriate features.",
    actionLabel: "View Permissions",
    helpLink: "/settings/privacy",
    icon: "pi-check-circle",
    severity: "success" as const,
  },

  expired: {
    title: "Consent Renewal Needed",
    reason: "Your parental consent has expired and needs to be renewed.",
    action: "Request a new consent verification from your parent/guardian.",
    actionLabel: "Request Renewal",
    helpLink: "/help/parental-consent",
    icon: "pi-clock",
    severity: "warning" as const,
  },
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the appropriate consent blocked message based on context
 */
export function getConsentBlockedMessage(
  role: UserRole,
  context: "single_player" | "team_partial" | "health_data" = "single_player",
): PrivacyMessage {
  if (COACH_VIEWER_ROLES.includes(role)) {
    switch (context) {
      case "team_partial":
        return CONSENT_BLOCKED_MESSAGES.coachTeamPartialBlock;
      case "health_data":
        return CONSENT_BLOCKED_MESSAGES.healthDataBlocked;
      default:
        return CONSENT_BLOCKED_MESSAGES.coachViewingPlayer;
    }
  }
  return CONSENT_BLOCKED_MESSAGES.playerDataNotShared;
}

/**
 * Get data state message with dynamic values
 */
export function getDataStateMessage(
  dataState: DataStateType,
  options?: {
    currentDataPoints?: number;
    requiredDataPoints?: number;
    metricType?: keyof typeof METRIC_INSUFFICIENT_DATA;
  },
): DataStateMessage {
  const baseMessage = DATA_STATE_MESSAGES[dataState];

  // For insufficient data, provide metric-specific message if available
  if (dataState === "INSUFFICIENT_DATA" && options?.metricType) {
    const metricMessage = METRIC_INSUFFICIENT_DATA[options.metricType];
    if (metricMessage) {
      const daysNeeded =
        options.requiredDataPoints && options.currentDataPoints
          ? options.requiredDataPoints - options.currentDataPoints
          : "?";

      return {
        ...metricMessage,
        dataState: "INSUFFICIENT_DATA",
        action: metricMessage.action.replace(
          "{{daysNeeded}}",
          String(daysNeeded),
        ),
      };
    }
  }

  return baseMessage;
}

/**
 * Get AI processing message based on status
 */
export function getAiProcessingMessage(
  status: "enabled" | "disabled" | "not_consented" | "consent_required",
): PrivacyMessage {
  switch (status) {
    case "enabled":
      return AI_PROCESSING_MESSAGES.enabled;
    case "disabled":
      return AI_PROCESSING_MESSAGES.disabled;
    case "not_consented":
      return AI_PROCESSING_MESSAGES.notConsented;
    case "consent_required":
      return AI_PROCESSING_MESSAGES.consentRequired;
  }
}

/**
 * Get deletion status message
 */
export function getDeletionMessage(
  status: "requested" | "pending" | "canceled" | "completed",
  daysRemaining?: number,
): PrivacyMessage {
  const message = DELETION_MESSAGES[status];

  if (status === "pending" && daysRemaining !== undefined) {
    return {
      ...message,
      reason: `Your account is scheduled for deletion in ${daysRemaining} days.`,
    };
  }

  return message;
}

/**
 * Format a privacy message for display
 */
export function formatPrivacyMessage(
  message: PrivacyMessage,
  overrides?: Partial<PrivacyMessage>,
): PrivacyMessage {
  return {
    ...message,
    ...overrides,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const PrivacyUxCopy = {
  consentBlocked: CONSENT_BLOCKED_MESSAGES,
  aiProcessing: AI_PROCESSING_MESSAGES,
  deletion: DELETION_MESSAGES,
  dataState: DATA_STATE_MESSAGES,
  metricInsufficient: METRIC_INSUFFICIENT_DATA,
  parentalConsent: PARENTAL_CONSENT_MESSAGES,
  getConsentBlockedMessage,
  getDataStateMessage,
  getAiProcessingMessage,
  getDeletionMessage,
  formatPrivacyMessage,
};

export default PrivacyUxCopy;
