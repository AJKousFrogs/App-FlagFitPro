/**
 * Session State Helper
 * 
 * Provides utilities for managing session state transitions with proper
 * metadata for audit logging.
 * 
 * Contract: STEP_2_6 §1.3 - State Transition History
 */

/**
 * Prepare session update with state transition metadata
 * 
 * @param {Object} params
 * @param {string} params.newState - Target state
 * @param {string} params.actorRole - Role of actor (athlete|coach|physio|system|admin)
 * @param {string} params.actorId - User ID of actor (null for system)
 * @param {string} [params.reason] - Optional reason for transition
 * @param {Object} [params.metadata] - Additional metadata
 * @returns {Object} Update object with metadata for state transition logging
 */
function prepareStateTransition({
  newState,
  actorRole,
  actorId = null,
  reason = null,
  metadata = {},
}) {
  // Validate actor role
  const validRoles = ['athlete', 'coach', 'physio', 'system', 'admin'];
  if (!validRoles.includes(actorRole)) {
    throw new Error(`Invalid actor role: ${actorRole}. Must be one of: ${validRoles.join(', ')}`);
  }

  // Validate state
  const validStates = [
    'UNRESOLVED', 'PLANNED', 'GENERATED', 'VISIBLE', 'ACKNOWLEDGED',
    'IN_PROGRESS', 'COMPLETED', 'LOCKED', 'CANCELLED', 'EXPIRED', 'ABANDONED'
  ];
  if (!validStates.includes(newState)) {
    throw new Error(`Invalid state: ${newState}. Must be one of: ${validStates.join(', ')}`);
  }

  // Build metadata object for trigger
  const transitionMetadata = {
    ...metadata,
    transition_actor_role: actorRole,
    transition_actor_id: actorId,
    transition_reason: reason,
    transitioned_at: new Date().toISOString(),
  };

  return {
    session_state: newState,
    metadata: transitionMetadata,
  };
}

/**
 * Transition session to VISIBLE state (athlete opens TODAY)
 * 
 * @param {string} athleteId - Athlete user ID
 * @param {string} sessionId - Session ID
 * @returns {Object} Update object
 */
function transitionToVisible(athleteId, sessionId) {
  return prepareStateTransition({
    newState: 'VISIBLE',
    actorRole: 'athlete',
    actorId: athleteId,
    reason: 'Athlete opened TODAY screen',
  });
}

/**
 * Transition session to ACKNOWLEDGED state
 * 
 * @param {string} athleteId - Athlete user ID
 * @param {string} reason - Reason for acknowledgment
 * @returns {Object} Update object
 */
function transitionToAcknowledged(athleteId, reason = 'Athlete acknowledged session') {
  return prepareStateTransition({
    newState: 'ACKNOWLEDGED',
    actorRole: 'athlete',
    actorId: athleteId,
    reason,
  });
}

/**
 * Transition session to IN_PROGRESS state
 * 
 * @param {string} athleteId - Athlete user ID
 * @returns {Object} Update object
 */
function transitionToInProgress(athleteId) {
  return prepareStateTransition({
    newState: 'IN_PROGRESS',
    actorRole: 'athlete',
    actorId: athleteId,
    reason: 'Athlete started training',
  });
}

/**
 * Transition session to COMPLETED state
 * 
 * @param {string} athleteId - Athlete user ID
 * @returns {Object} Update object
 */
function transitionToCompleted(athleteId) {
  return prepareStateTransition({
    newState: 'COMPLETED',
    actorRole: 'athlete',
    actorId: athleteId,
    reason: 'Athlete completed training',
  });
}

/**
 * System transition (e.g., GENERATED at midnight)
 * 
 * @param {string} newState - Target state
 * @param {string} reason - Reason for transition
 * @returns {Object} Update object
 */
function systemTransition(newState, reason) {
  return prepareStateTransition({
    newState,
    actorRole: 'system',
    actorId: null,
    reason,
  });
}

module.exports = {
  prepareStateTransition,
  transitionToVisible,
  transitionToAcknowledged,
  transitionToInProgress,
  transitionToCompleted,
  systemTransition,
};
