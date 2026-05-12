/**
 * Centralized Status Label Mappings
 *
 * Consolidates all status-to-label mappings used throughout the application.
 * This eliminates duplicate label definitions and provides a single source of truth.
 */

/**
 * Training Session Status Labels
 */
export const TRAINING_SESSION_STATUS_LABELS: Record<string, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  missed: "Missed",
  in_progress: "In Progress",
  replaced: "Replaced",
  planned: "Planned",
  cancelled: "Cancelled",
  in_progress: "In Progress",
};

/**
 * Ownership Transition Status Labels
 */
export const OWNERSHIP_TRANSITION_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  overdue: "Overdue",
};

/**
 * Injury Management Status Labels
 */
export const INJURY_STATUS_LABELS: Record<string, string> = {
  new: "New",
  in_treatment: "In Treatment",
  healing: "Healing",
  cleared: "Cleared",
  re_injured: "Re-injured",
};

/**
 * Program Status Labels
 */
export const PROGRAM_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  active: "Active",
  completed: "Completed",
  archived: "Archived",
  "minor-injury": "Minor Injury",
  rtp: "RTP",
  inactive: "Inactive",
};

/**
 * Player Development Goal Status Labels
 */
export const GOAL_STATUS_LABELS: Record<string, string> = {
  "on-track": "On Track",
  ahead: "Ahead of Schedule",
  behind: "Needs Focus",
  completed: "Completed",
};

/**
 * Payment Status Labels
 */
export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  paid: "Paid",
  pending: "Pending",
  due: "Due",
  overdue: "Overdue",
  failed: "Failed",
  cancelled: "Cancelled",
};

/**
 * Official/Game Status Labels
 */
export const GAME_OFFICIAL_STATUS_LABELS: Record<string, string> = {
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  declined: "Declined",
  cancelled: "Cancelled",
  completed: "Completed",
  no_show: "No Show",
};

/**
 * Data Import Status Labels
 */
export const DATA_IMPORT_STATUS_LABELS: Record<string, string> = {
  auto: "Auto-matched",
  manual: "Manually set",
  unmapped: "Needs mapping",
};

/**
 * Coach Override Notification Type Labels
 */
export const COACH_OVERRIDE_TYPE_LABELS: Record<string, string> = {
  training_load: "Training Load",
  session_modification: "Session Modification",
  acwr_override: "ACWR Override",
  recovery_protocol: "Recovery Protocol",
  other: "Other",
};

/**
 * Safety Warning Metric Labels
 */
export const SAFETY_WARNING_METRIC_LABELS: Record<string, string> = {
  sessions_per_week: "Sessions this week",
  high_intensity_sessions: "High-intensity sessions",
  consecutive_days: "Consecutive training days",
  sprints_per_session: "Sprints planned",
  sprints_per_week: "Weekly sprints",
  cuts_per_session: "Cuts planned",
  cuts_per_week: "Weekly cuts",
  sleep_debt_hours: "Sleep debt",
};

/**
 * Practice/Drill Status Labels
 */
export const PRACTICE_STATUS_LABELS: Record<string, string> = {
  scheduled: "Scheduled",
  "in-progress": "In Progress",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  draft: "Draft",
  template: "Template",
};

/**
 * LA 28 Roadmap Status Labels
 */
export const LA28_ROADMAP_STATUS_LABELS: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
  deferred: "Deferred",
};

/**
 * Tournament Status Labels
 */
export const TOURNAMENT_STATUS_LABELS: Record<string, string> = {
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

/**
 * Utility function to get label for a given status
 */
export function getStatusLabel(
  status: string,
  labelMap: Record<string, string> = TRAINING_SESSION_STATUS_LABELS,
): string {
  return labelMap[status] || status;
}

/**
 * Utility function to get all labels for a specific domain
 */
export function getStatusLabelMap(domain: string): Record<string, string> {
  const maps: Record<string, Record<string, string>> = {
    training: TRAINING_SESSION_STATUS_LABELS,
    ownership: OWNERSHIP_TRANSITION_STATUS_LABELS,
    injury: INJURY_STATUS_LABELS,
    program: PROGRAM_STATUS_LABELS,
    goal: GOAL_STATUS_LABELS,
    payment: PAYMENT_STATUS_LABELS,
    official: GAME_OFFICIAL_STATUS_LABELS,
    import: DATA_IMPORT_STATUS_LABELS,
    override: COACH_OVERRIDE_TYPE_LABELS,
    warning: SAFETY_WARNING_METRIC_LABELS,
    practice: PRACTICE_STATUS_LABELS,
    la28: LA28_ROADMAP_STATUS_LABELS,
    tournament: TOURNAMENT_STATUS_LABELS,
  };
  return maps[domain] || {};
}
