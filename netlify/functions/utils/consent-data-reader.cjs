/**
 * Consent-Aware Data Reader
 * 
 * POLICY: "All coach-facing performance access must go through consent views"
 * 
 * This module provides the ONLY approved way to read player performance data
 * in coach contexts. It enforces:
 * 
 * 1. Consent view usage (v_*_consent views)
 * 2. DataState contract in all responses
 * 3. Consent-blocked flagging for UI
 * 4. Audit logging for compliance
 * 
 * FORBIDDEN: Direct queries to workout_logs, load_monitoring, training_load_metrics,
 *            metric_entries, training_sessions (in coach contexts)
 * 
 * @see docs/SAFETY_ACCESS_LAYER.md
 * 
 * Športno društvo Žabe - Athletes helping athletes since 2020
 */

const { supabaseAdmin } = require('../supabase-client.cjs');
const { DataState, wrapWithDataState, MINIMUM_DATA_REQUIREMENTS } = require('./data-state.cjs');

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Tables that require consent-aware access in coach contexts
 * Direct access to these tables is FORBIDDEN for coach-facing endpoints
 */
const CONSENT_PROTECTED_TABLES = [
  'workout_logs',
  'load_monitoring',
  'training_load_metrics',
  'metric_entries',
  'training_sessions',
  'wellness_entries',
  'wellness_logs'
];

/**
 * Consent views that MUST be used instead of raw tables
 */
const CONSENT_VIEWS = {
  load_monitoring: 'v_load_monitoring_consent',
  workout_logs: 'v_workout_logs_consent',
  // Add more as views are created
};

/**
 * Access context types
 */
const AccessContext = {
  PLAYER_OWN_DATA: 'player_own_data',      // Player accessing their own data
  COACH_TEAM_DATA: 'coach_team_data',       // Coach accessing team member data
  ADMIN_SYSTEM: 'admin_system',             // Admin/system operations
};

// ============================================================================
// MAIN READER CLASS
// ============================================================================

class ConsentDataReader {
  constructor(supabase = supabaseAdmin, options = {}) {
    this.supabase = supabase;
    this.options = {
      enableAuditLogging: options.enableAuditLogging ?? true,
      strictMode: options.strictMode ?? true, // Fail on consent violations
    };
  }

  /**
   * Read load monitoring data with consent enforcement
   * 
   * @param {Object} params
   * @param {string} params.requesterId - User making the request
   * @param {string} [params.playerId] - Specific player to query (optional)
   * @param {string} [params.teamId] - Filter by team (optional)
   * @param {string} params.context - Access context (player_own_data, coach_team_data)
   * @param {Object} [params.filters] - Additional query filters
   * @returns {Promise<Object>} Data with dataState metadata
   */
  async readLoadMonitoring({ requesterId, playerId, teamId, context, filters = {} }) {
    this._validateContext(context);

    // For player's own data, can query directly (still use view for consistency)
    // For coach context, MUST use consent view
    const viewName = context === AccessContext.PLAYER_OWN_DATA && playerId === requesterId
      ? 'load_monitoring' // Can use raw table for own data
      : 'v_load_monitoring_consent';

    let query = this.supabase.from(viewName).select('*');

    // Apply filters
    if (playerId) {
      query = query.eq('player_id', playerId);
    }
    
    if (filters.startDate) {
      query = query.gte('calculated_at', filters.startDate);
    }
    
    if (filters.endDate) {
      query = query.lte('calculated_at', filters.endDate);
    }

    query = query.order('calculated_at', { ascending: false });

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      return this._createErrorResponse(error, 'load_monitoring');
    }

    // Process results with consent awareness
    const processedData = this._processConsentResults(data, context);
    
    // Log access for audit
    if (this.options.enableAuditLogging && context === AccessContext.COACH_TEAM_DATA) {
      await this._logAccess({
        accessorUserId: requesterId,
        targetUserIds: [...new Set((data || []).map(d => d.player_id))],
        resourceType: 'load_monitoring',
        teamId,
        context,
      });
    }

    return this._wrapResponse(processedData, 'acwr');
  }

  /**
   * Read workout logs with consent enforcement
   */
  async readWorkoutLogs({ requesterId, playerId, teamId, context, filters = {} }) {
    this._validateContext(context);

    const viewName = context === AccessContext.PLAYER_OWN_DATA && playerId === requesterId
      ? 'workout_logs'
      : 'v_workout_logs_consent';

    let query = this.supabase.from(viewName).select('*');

    if (playerId) {
      query = query.eq('player_id', playerId);
    }

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    query = query.order('created_at', { ascending: false });

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      return this._createErrorResponse(error, 'workout_logs');
    }

    const processedData = this._processConsentResults(data, context);

    if (this.options.enableAuditLogging && context === AccessContext.COACH_TEAM_DATA) {
      await this._logAccess({
        accessorUserId: requesterId,
        targetUserIds: [...new Set((data || []).map(d => d.player_id))],
        resourceType: 'workout_logs',
        teamId,
        context,
      });
    }

    return this._wrapResponse(processedData, 'acwr');
  }

  /**
   * Read training sessions with consent enforcement
   * 
   * NOTE: training_sessions doesn't have a consent view yet.
   * For coach contexts, this uses RLS + manual consent checking.
   */
  async readTrainingSessions({ requesterId, playerId, teamId, context, filters = {} }) {
    this._validateContext(context);

    // For coach context, we need to check consent manually until view exists
    if (context === AccessContext.COACH_TEAM_DATA) {
      return this._readTrainingSessionsWithConsentCheck({
        requesterId,
        playerId,
        teamId,
        filters,
      });
    }

    // For player's own data
    let query = this.supabase
      .from('training_sessions')
      .select('*')
      .or(`user_id.eq.${playerId},athlete_id.eq.${playerId}`);

    if (filters.startDate) {
      query = query.gte('session_date', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('session_date', filters.endDate);
    }

    query = query.order('session_date', { ascending: false });

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      return this._createErrorResponse(error, 'training_sessions');
    }

    return this._wrapResponse(
      { data, consentBlocked: [], accessibleCount: data?.length || 0 },
      'acwr'
    );
  }

  /**
   * Read training sessions for coach with consent checking
   * @private
   */
  async _readTrainingSessionsWithConsentCheck({ requesterId, playerId, teamId, filters }) {
    // Get team members with their consent status
    const { data: teamMembers, error: teamError } = await this.supabase
      .from('team_members')
      .select(`
        user_id,
        team_id,
        team_sharing_settings!inner(
          performance_sharing_enabled
        )
      `)
      .eq('team_id', teamId)
      .eq('team_sharing_settings.performance_sharing_enabled', true);

    if (teamError) {
      return this._createErrorResponse(teamError, 'training_sessions');
    }

    const consentedUserIds = teamMembers?.map(m => m.user_id) || [];
    
    if (consentedUserIds.length === 0) {
      return this._wrapResponse({
        data: [],
        consentBlocked: playerId ? [playerId] : [],
        accessibleCount: 0,
        message: 'No team members have enabled performance sharing',
      }, 'acwr');
    }

    // Filter by specific player if requested
    const targetUserIds = playerId 
      ? consentedUserIds.filter(id => id === playerId)
      : consentedUserIds;

    if (targetUserIds.length === 0 && playerId) {
      return this._wrapResponse({
        data: [],
        consentBlocked: [playerId],
        accessibleCount: 0,
        message: 'Player has not enabled performance sharing for this team',
      }, 'acwr');
    }

    // Query training sessions for consented users
    let query = this.supabase
      .from('training_sessions')
      .select('*')
      .in('user_id', targetUserIds);

    if (filters.startDate) {
      query = query.gte('session_date', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('session_date', filters.endDate);
    }

    query = query.order('session_date', { ascending: false });

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      return this._createErrorResponse(error, 'training_sessions');
    }

    // Log access
    if (this.options.enableAuditLogging) {
      await this._logAccess({
        accessorUserId: requesterId,
        targetUserIds,
        resourceType: 'training_sessions',
        teamId,
        context: AccessContext.COACH_TEAM_DATA,
      });
    }

    return this._wrapResponse({
      data,
      consentBlocked: playerId && !targetUserIds.includes(playerId) ? [playerId] : [],
      accessibleCount: data?.length || 0,
    }, 'acwr');
  }

  /**
   * Read wellness entries with consent enforcement
   * 
   * NOTE: wellness_entries doesn't have a consent view yet.
   * For coach contexts, this uses RLS + manual consent checking (health_sharing_enabled).
   */
  async readWellnessEntries({ requesterId, playerId, teamId, context, filters = {} }) {
    this._validateContext(context);

    // For coach context, we need to check consent manually until view exists
    if (context === AccessContext.COACH_TEAM_DATA) {
      return this._readWellnessEntriesWithConsentCheck({
        requesterId,
        playerId,
        teamId,
        filters,
      });
    }

    // For player's own data
    let query = this.supabase
      .from('wellness_entries')
      .select('*')
      .or(`user_id.eq.${playerId},athlete_id.eq.${playerId}`);

    if (filters.startDate) {
      query = query.gte('date', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('date', filters.endDate);
    }

    query = query.order('date', { ascending: false });

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      return this._createErrorResponse(error, 'wellness_entries');
    }

    return this._wrapResponse(
      { data, consentBlocked: [], accessibleCount: data?.length || 0 },
      'acwr'
    );
  }

  /**
   * Read wellness entries for coach with consent checking
   * @private
   */
  async _readWellnessEntriesWithConsentCheck({ requesterId, playerId, teamId, filters }) {
    // Get team members with their health sharing consent status
    const { data: teamMembers, error: teamError } = await this.supabase
      .from('team_members')
      .select(`
        user_id,
        team_id,
        team_sharing_settings!inner(
          health_sharing_enabled
        )
      `)
      .eq('team_id', teamId)
      .eq('team_sharing_settings.health_sharing_enabled', true);

    if (teamError) {
      return this._createErrorResponse(teamError, 'wellness_entries');
    }

    const consentedUserIds = teamMembers?.map(m => m.user_id) || [];
    
    if (consentedUserIds.length === 0) {
      return this._wrapResponse({
        data: [],
        consentBlocked: playerId ? [playerId] : [],
        accessibleCount: 0,
        message: 'No team members have enabled health data sharing',
      }, 'acwr');
    }

    // Filter by specific player if requested
    const targetUserIds = playerId 
      ? consentedUserIds.filter(id => id === playerId)
      : consentedUserIds;

    if (targetUserIds.length === 0 && playerId) {
      return this._wrapResponse({
        data: [],
        consentBlocked: [playerId],
        accessibleCount: 0,
        message: 'Player has not enabled health data sharing for this team',
      }, 'acwr');
    }

    // Query wellness entries for consented users
    // wellness_entries may use user_id or athlete_id
    let query = this.supabase
      .from('wellness_entries')
      .select('*');

    // Build OR condition for all consented user IDs
    if (targetUserIds.length === 1) {
      query = query.or(`user_id.eq.${targetUserIds[0]},athlete_id.eq.${targetUserIds[0]}`);
    } else {
      // For multiple users, use IN clause on both columns
      query = query.or(
        `user_id.in.(${targetUserIds.join(',')}),athlete_id.in.(${targetUserIds.join(',')})`
      );
    }

    if (filters.startDate) {
      query = query.gte('date', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('date', filters.endDate);
    }

    query = query.order('date', { ascending: false });

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      return this._createErrorResponse(error, 'wellness_entries');
    }

    // Log access
    if (this.options.enableAuditLogging) {
      await this._logAccess({
        accessorUserId: requesterId,
        targetUserIds,
        resourceType: 'wellness_entries',
        teamId,
        context: AccessContext.COACH_TEAM_DATA,
      });
    }

    return this._wrapResponse({
      data,
      consentBlocked: playerId && !targetUserIds.includes(playerId) ? [playerId] : [],
      accessibleCount: data?.length || 0,
    }, 'acwr');
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  _validateContext(context) {
    const validContexts = Object.values(AccessContext);
    if (!validContexts.includes(context)) {
      throw new Error(`Invalid access context: ${context}. Must be one of: ${validContexts.join(', ')}`);
    }
  }

  _processConsentResults(data, context) {
    if (!data || data.length === 0) {
      return {
        data: [],
        consentBlocked: [],
        accessibleCount: 0,
      };
    }

    // For consent views, separate blocked from accessible
    const accessible = [];
    const blocked = [];

    for (const row of data) {
      if (row.consent_blocked === true) {
        blocked.push(row.player_id);
        // Include row but with nulled sensitive fields (already done by view)
        accessible.push({
          ...row,
          _consentBlocked: true,
        });
      } else {
        accessible.push({
          ...row,
          _consentBlocked: false,
        });
      }
    }

    return {
      data: accessible,
      consentBlocked: [...new Set(blocked)],
      accessibleCount: accessible.filter(r => !r._consentBlocked).length,
    };
  }

  _wrapResponse(processedData, metricType) {
    const { data, consentBlocked, accessibleCount, message } = processedData;
    
    // Determine data state
    let dataState = DataState.REAL_DATA;
    if (!data || data.length === 0) {
      dataState = DataState.NO_DATA;
    } else if (accessibleCount === 0 && consentBlocked.length > 0) {
      dataState = DataState.NO_DATA; // All data is consent-blocked
    }

    const requirement = MINIMUM_DATA_REQUIREMENTS[metricType] || { minimumDays: 7 };

    return {
      success: true,
      data,
      dataState,
      dataStateInfo: {
        currentDataPoints: accessibleCount,
        minimumRequiredDataPoints: requirement.minimumDays,
        isReliable: dataState === DataState.REAL_DATA && accessibleCount >= requirement.minimumDays,
        warnings: this._generateWarnings(dataState, consentBlocked, message),
      },
      consentInfo: {
        blockedPlayerIds: consentBlocked,
        blockedCount: consentBlocked.length,
        accessibleCount,
      },
    };
  }

  _generateWarnings(dataState, consentBlocked, message) {
    const warnings = [];

    if (message) {
      warnings.push(message);
    }

    if (dataState === DataState.NO_DATA) {
      warnings.push('No data available for the requested parameters.');
    }

    if (consentBlocked.length > 0) {
      warnings.push(
        `${consentBlocked.length} player(s) have not enabled data sharing. ` +
        'Their metrics are hidden to protect their privacy.'
      );
    }

    return warnings;
  }

  _createErrorResponse(error, resourceType) {
    return {
      success: false,
      data: [],
      dataState: DataState.NO_DATA,
      dataStateInfo: {
        currentDataPoints: 0,
        minimumRequiredDataPoints: 0,
        isReliable: false,
        warnings: [`Error fetching ${resourceType}: ${error.message}`],
      },
      consentInfo: {
        blockedPlayerIds: [],
        blockedCount: 0,
        accessibleCount: 0,
      },
      error: error.message,
    };
  }

  async _logAccess({ accessorUserId, targetUserIds, resourceType, teamId, context }) {
    try {
      const logEntries = targetUserIds.map(targetUserId => ({
        accessor_user_id: accessorUserId,
        target_user_id: targetUserId,
        resource_type: resourceType,
        access_granted: true,
        consent_type: 'performance',
        team_id: teamId,
        access_reason: context,
      }));

      // Batch insert audit logs
      if (logEntries.length > 0) {
        await this.supabase
          .from('consent_access_log')
          .insert(logEntries);
      }
    } catch (err) {
      // Don't fail the request on audit log failure
      console.warn('[ConsentDataReader] Audit log failed:', err.message);
    }
  }
}

// ============================================================================
// STATIC VALIDATION HELPERS
// ============================================================================

/**
 * Check if a table name is consent-protected
 * Use this in code reviews and linting
 */
function isConsentProtectedTable(tableName) {
  return CONSENT_PROTECTED_TABLES.includes(tableName.toLowerCase());
}

/**
 * Get the consent view name for a protected table
 */
function getConsentView(tableName) {
  return CONSENT_VIEWS[tableName.toLowerCase()] || null;
}

/**
 * Validate that code is using consent-aware patterns
 * Returns violations found in the code string
 */
function findConsentViolations(codeString, context = 'coach') {
  const violations = [];
  
  // Pattern: .from('table_name') where table_name is protected
  const fromPattern = /\.from\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  let match;

  while ((match = fromPattern.exec(codeString)) !== null) {
    const tableName = match[1];
    if (isConsentProtectedTable(tableName)) {
      const consentView = getConsentView(tableName);
      violations.push({
        table: tableName,
        position: match.index,
        message: consentView
          ? `Direct access to '${tableName}' in ${context} context. Use '${consentView}' instead.`
          : `Direct access to '${tableName}' in ${context} context. Use ConsentDataReader.`,
        suggestion: consentView || 'ConsentDataReader',
      });
    }
  }

  return violations;
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  ConsentDataReader,
  AccessContext,
  CONSENT_PROTECTED_TABLES,
  CONSENT_VIEWS,
  isConsentProtectedTable,
  getConsentView,
  findConsentViolations,
};

