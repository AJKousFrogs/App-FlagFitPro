/**
 * Deterministic Session Resolver
 * 
 * This is Blocker A: Ensures every athlete always has a "real" session 
 * resolved from their 52-week program + sport-layer overrides.
 * 
 * No generic fallbacks. If a session cannot be resolved, returns explicit
 * "cannot resolve" state rather than random exercises.
 * 
 * Resolution chain:
 * 1. user → active player_programs
 * 2. program start date → current week/day
 * 3. session template from training_session_templates
 * 4. apply sport-layer overrides (flag practice, rehab protocol, sprint saturday, etc.)
 * 5. return session OR explicit failure state
 */

const { createClient } = require("@supabase/supabase-js");

/**
 * @typedef {Object} SessionResolutionResult
 * @property {boolean} success - Whether a session was resolved
 * @property {'resolved'|'no_program'|'no_week'|'no_template'|'future_date'|'active_injury'} status
 * @property {Object|null} session - The resolved session template
 * @property {Object|null} override - Any sport-layer override applied
 * @property {string|null} reason - Human-readable reason if resolution failed
 * @property {Object} metadata - Resolution metadata for debugging
 */

/**
 * Resolve today's session for a user
 * 
 * @param {Object} supabase - Supabase client
 * @param {string} userId - User ID
 * @param {string} date - ISO date string (YYYY-MM-DD)
 * @returns {Promise<SessionResolutionResult>}
 */
async function resolveTodaySession(supabase, userId, date) {
  const targetDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const metadata = {
    userId,
    date,
    dayOfWeek: targetDate.getDay(),
    resolvedAt: new Date().toISOString(),
  };

  // Rule 0: Don't resolve future dates (can't have a "today" that hasn't happened)
  if (targetDate > today) {
    return {
      success: false,
      status: 'future_date',
      session: null,
      override: null,
      reason: 'Cannot resolve session for future dates. Only current or past dates allowed.',
      metadata,
    };
  }

  // Step 1: Get active player program
  const { data: playerProgram, error: programError } = await supabase
    .from('player_programs')
    .select(`
      id,
      player_id,
      program_id,
      status,
      start_date,
      end_date,
      current_week,
      training_programs!inner (
        id,
        name,
        program_type,
        program_structure
      )
    `)
    .eq('player_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (programError) {
    console.error('[session-resolver] Error fetching player program:', programError);
    throw programError;
  }

  if (!playerProgram) {
    return {
      success: false,
      status: 'no_program',
      session: null,
      override: null,
      reason: 'No active training program assigned. Complete onboarding or contact your coach.',
      metadata: {
        ...metadata,
        programCheckCompleted: true,
      },
    };
  }

  metadata.programId = playerProgram.program_id;
  metadata.programName = playerProgram.training_programs.name;
  metadata.programStartDate = playerProgram.start_date;

  // Step 2: Get the current phase for this date
  const { data: currentPhase, error: phaseError } = await supabase
    .from('training_phases')
    .select('*')
    .eq('program_id', playerProgram.program_id)
    .lte('start_date', date)
    .gte('end_date', date)
    .maybeSingle();

  if (phaseError) {
    console.error('[session-resolver] Error fetching phase:', phaseError);
    throw phaseError;
  }

  if (!currentPhase) {
    return {
      success: false,
      status: 'no_week',
      session: null,
      override: null,
      reason: `No training phase found for ${date}. Program may not be configured for this date.`,
      metadata: {
        ...metadata,
        phaseCheckCompleted: true,
      },
    };
  }

  metadata.phaseId = currentPhase.id;
  metadata.phaseName = currentPhase.name;

  // Step 3: Get the current week for this date
  const { data: currentWeek, error: weekError } = await supabase
    .from('training_weeks')
    .select('*')
    .eq('phase_id', currentPhase.id)
    .lte('start_date', date)
    .gte('end_date', date)
    .maybeSingle();

  if (weekError) {
    console.error('[session-resolver] Error fetching week:', weekError);
    throw weekError;
  }

  if (!currentWeek) {
    return {
      success: false,
      status: 'no_week',
      session: null,
      override: null,
      reason: `No training week found for ${date} in phase "${currentPhase.name}".`,
      metadata: {
        ...metadata,
        weekCheckCompleted: true,
      },
    };
  }

  metadata.weekId = currentWeek.id;
  metadata.weekName = currentWeek.name;

  // Step 4: Get session template for this day of week
  const dayOfWeek = targetDate.getDay();
  const { data: sessionTemplate, error: templateError } = await supabase
    .from('training_session_templates')
    .select('*')
    .eq('week_id', currentWeek.id)
    .eq('day_of_week', dayOfWeek)
    .maybeSingle();

  if (templateError) {
    console.error('[session-resolver] Error fetching session template:', templateError);
    throw templateError;
  }

  if (!sessionTemplate) {
    return {
      success: false,
      status: 'no_template',
      session: null,
      override: null,
      reason: `No session template found for day ${dayOfWeek} in week "${currentWeek.name}". This may be a rest day or missing configuration.`,
      metadata: {
        ...metadata,
        templateCheckCompleted: true,
        dayOfWeek,
      },
    };
  }

  metadata.sessionTemplateId = sessionTemplate.id;
  metadata.sessionName = sessionTemplate.session_name;
  metadata.sessionType = sessionTemplate.session_type;

  // Step 5: Check for sport-layer overrides
  const override = await checkSportLayerOverrides(supabase, userId, date, dayOfWeek);
  
  if (override) {
    metadata.overrideApplied = true;
    metadata.overrideType = override.type;
    metadata.overrideReason = override.reason;
  }

  // Step 6: Return resolved session
  return {
    success: true,
    status: 'resolved',
    session: sessionTemplate,
    override,
    reason: null,
    metadata,
  };
}

/**
 * Check for sport-layer overrides that might modify or replace the base session
 * 
 * Priority order:
 * 1. Active injury/rehab protocol (highest priority - safety first)
 * 2. Sprint Saturday (sport-specific development)
 * 3. Taper period before tournament (performance optimization)
 * 
 * NOTE: Flag practice/film room overrides are handled upstream via teamActivity.
 * This resolver is pure for program resolution only. Team activity overrides
 * are applied in daily-protocol.cjs after team_activities resolution.
 * 
 * @param {Object} supabase - Supabase client
 * @param {string} userId - User ID
 * @param {string} date - ISO date string
 * @param {number} dayOfWeek - 0-6 (Sunday-Saturday)
 * @returns {Promise<Object|null>} Override object or null
 */
async function checkSportLayerOverrides(supabase, userId, date, dayOfWeek) {
  // Override 1: Active injury/rehab protocol (blocks all other training)
  const { data: wellnessCheckin } = await supabase
    .from('daily_wellness_checkin')
    .select('*')
    .eq('user_id', userId)
    .lte('checkin_date', date)
    .order('checkin_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  const hasActiveInjuries = wellnessCheckin?.soreness_areas && 
                            wellnessCheckin.soreness_areas.length > 0;
  
  if (hasActiveInjuries) {
    return {
      type: 'rehab_protocol',
      reason: `Active injury protocol: ${wellnessCheckin.soreness_areas.join(', ')}`,
      replaceSession: true,
      sessionModification: {
        type: 'return_to_play',
        painLevel: wellnessCheckin.pain_level || 2,
        injuries: wellnessCheckin.soreness_areas,
        overallSoreness: wellnessCheckin.overall_soreness,
      },
    };
  }

  // DEPRECATED: availability is informational only; team_activities is authority.

  // Override 2: Sprint Saturday (position-specific enhancement)
  if (dayOfWeek === 6) { // Saturday
    return {
      type: 'sprint_saturday',
      reason: 'Saturday speed development focus',
      replaceSession: false,
      sessionModification: {
        type: 'speed_emphasis',
        notes: 'Prioritize sprint mechanics and acceleration work',
      },
    };
  }

  // Override 4: Taper period (load reduction)
  const { data: upcomingTournaments } = await supabase
    .from('tournament_calendar')
    .select('*')
    .gte('start_date', date)
    .order('start_date', { ascending: true })
    .limit(3);

  if (upcomingTournaments && upcomingTournaments.length > 0) {
    for (const tournament of upcomingTournaments) {
      const tournamentDate = new Date(tournament.start_date);
      const currentDate = new Date(date);
      const daysUntil = Math.ceil((tournamentDate - currentDate) / (1000 * 60 * 60 * 24));
      const taperWeeks = tournament.taper_weeks_before || 1;
      const taperDays = taperWeeks * 7;

      if (daysUntil <= taperDays && daysUntil > 0) {
        const taperProgress = 1 - (daysUntil / taperDays);
        const minLoadPercent = tournament.is_peak_event ? 0.4 : 0.6;
        const loadMultiplier = 1 - (taperProgress * (1 - minLoadPercent));

        return {
          type: 'taper_period',
          reason: `Tapering for ${tournament.name} (${daysUntil} days away)`,
          replaceSession: false,
          sessionModification: {
            type: 'taper',
            tournamentName: tournament.name,
            daysUntil,
            loadMultiplier: Math.round(loadMultiplier * 100) / 100,
            isPeakEvent: tournament.is_peak_event,
            notes: daysUntil <= 2 
              ? 'Tournament imminent - mobility and activation only'
              : `Reduce volume to ${Math.round(loadMultiplier * 100)}% of normal`,
          },
        };
      }
    }
  }

  // No overrides
  return null;
}

/**
 * Batch resolve sessions for multiple dates
 * Useful for weekly/monthly views
 * 
 * @param {Object} supabase - Supabase client
 * @param {string} userId - User ID
 * @param {string[]} dates - Array of ISO date strings
 * @returns {Promise<Map<string, SessionResolutionResult>>} Map of date -> resolution result
 */
async function batchResolveSessions(supabase, userId, dates) {
  const results = new Map();
  
  // Resolve in parallel for efficiency
  await Promise.all(
    dates.map(async (date) => {
      const result = await resolveTodaySession(supabase, userId, date);
      results.set(date, result);
    })
  );
  
  return results;
}

module.exports = {
  resolveTodaySession,
  checkSportLayerOverrides,
  batchResolveSessions,
};

