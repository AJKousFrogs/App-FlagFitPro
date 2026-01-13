/**
 * Session Acknowledgment Utility
 * 
 * Contract: STEP_2_1 §3, STEP_2_6 §4.2
 * Determines if acknowledgment is required before starting a session
 */

export interface SessionAcknowledgmentCheck {
  requiresAcknowledgment: boolean;
  reason: string | null;
  blocking: boolean; // If true, start is blocked until acknowledged
}

export interface SessionForAcknowledgment {
  session_state?: string;
  requires_acknowledgment?: boolean;
  acknowledgment_reason?: string;
  coach_modified?: boolean;
  modified_by_coach_id?: string;
  modified_at?: string;
  intensity_increase_percent?: number;
  acwr_override?: boolean;
  weather_override?: boolean;
  practice_override?: boolean;
  taper_active?: boolean;
  safety_alert?: boolean;
}

/**
 * Check if session requires acknowledgment before starting
 * 
 * Contract: STEP_2_1 §3, STEP_2_6 §4.2
 * 
 * Acknowledgment required for:
 * - Intensity increase >10%
 * - ACWR override
 * - Weather override
 * - Mandatory practice
 * - Taper activation
 * - Safety-related adjustments
 * - Coach modifications that require acknowledgment
 * 
 * @param session - Session data
 * @returns Check result with reason
 */
export function requiresAcknowledgment(
  session: SessionForAcknowledgment | null | undefined,
): SessionAcknowledgmentCheck {
  if (!session) {
    return {
      requiresAcknowledgment: false,
      reason: null,
      blocking: false,
    };
  }

  // If already acknowledged, no need to check again
  if (session.session_state === 'ACKNOWLEDGED') {
    return {
      requiresAcknowledgment: false,
      reason: null,
      blocking: false,
    };
  }

  // If already IN_PROGRESS or later, acknowledgment not applicable
  if (
    session.session_state === 'IN_PROGRESS' ||
    session.session_state === 'COMPLETED' ||
    session.session_state === 'LOCKED'
  ) {
    return {
      requiresAcknowledgment: false,
      reason: null,
      blocking: false,
    };
  }

  const reasons: string[] = [];
  let blocking = false;

  // Intensity increase >10% (blocking)
  if (
    session.intensity_increase_percent !== undefined &&
    session.intensity_increase_percent > 10
  ) {
    reasons.push(
      `Intensity increased by ${session.intensity_increase_percent}%`,
    );
    blocking = true;
  }

  // ACWR override (blocking)
  if (session.acwr_override) {
    reasons.push('Training load adjustment (ACWR override)');
    blocking = true;
  }

  // Weather override (blocking)
  if (session.weather_override) {
    reasons.push('Weather conditions override');
    blocking = true;
  }

  // Practice override (blocking)
  if (session.practice_override) {
    reasons.push('Mandatory practice scheduled');
    blocking = true;
  }

  // Taper activation (blocking)
  if (session.taper_active) {
    reasons.push('Taper period activated');
    blocking = true;
  }

  // Safety alert (blocking)
  if (session.safety_alert) {
    reasons.push('Safety-related adjustment');
    blocking = true;
  }

  // Coach modification requiring acknowledgment
  if (
    session.coach_modified &&
    session.requires_acknowledgment &&
    session.acknowledgment_reason
  ) {
    reasons.push(session.acknowledgment_reason);
    blocking = true;
  }

  // Explicit acknowledgment flag
  if (session.requires_acknowledgment && !reasons.length) {
    reasons.push('Coach requires acknowledgment');
    blocking = true;
  }

  return {
    requiresAcknowledgment: reasons.length > 0,
    reason: reasons.length > 0 ? reasons.join('; ') : null,
    blocking,
  };
}

/**
 * Check if session can be started
 * 
 * Contract: STEP_2_1 §3
 * 
 * @param session - Session data
 * @param acknowledged - Whether session has been acknowledged
 * @returns True if session can be started
 */
export function canStartSession(
  session: SessionForAcknowledgment | null | undefined,
  acknowledged: boolean = false,
): boolean {
  if (!session) {
    return false;
  }

  // Must be in a startable state
  const startableStates = ['VISIBLE', 'ACKNOWLEDGED'];
  if (!session.session_state || !startableStates.includes(session.session_state)) {
    return false;
  }

  // Check acknowledgment requirement
  const ackCheck = requiresAcknowledgment(session);

  if (ackCheck.requiresAcknowledgment && ackCheck.blocking) {
    // Must be acknowledged if blocking acknowledgment required
    return acknowledged || session.session_state === 'ACKNOWLEDGED';
  }

  return true;
}
