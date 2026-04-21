import { supabaseAdmin } from "../utils/supabase-client.js";
import { DataState, wrapWithDataState as _wrapWithDataState, MINIMUM_DATA_REQUIREMENTS } from "./data-state.js";

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

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Tables that require consent-aware access in coach contexts
 * Direct access to these tables is FORBIDDEN for coach-facing endpoints
 */
const CONSENT_PROTECTED_TABLES = [
  "workout_logs",
  "load_monitoring",
  "training_load_metrics",
  "metric_entries",
  "training_sessions",
  "wellness_entries",
  "wellness_logs",
];

/**
 * Consent views that MUST be used instead of raw tables
 */
const CONSENT_VIEWS = {
  load_monitoring: "v_load_monitoring_consent",
  workout_logs: "v_workout_logs_consent",
  // Add more as views are created
};

/**
 * Access context types
 */
const AccessContext = {
  PLAYER_OWN_DATA: "player_own_data", // Player accessing their own data
  COACH_TEAM_DATA: "coach_team_data", // Coach accessing team member data
  ADMIN_SYSTEM: "admin_system", // Admin/system operations
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
  async readLoadMonitoring({
    requesterId,
    playerId,
    teamId,
    context,
    filters = {},
  }) {
    this._validateContext(context);

    if (context === AccessContext.COACH_TEAM_DATA) {
      return this._readLoadMonitoringWithConsentCheck({
        requesterId,
        playerId,
        teamId,
        filters,
      });
    }

    const ownAccess = this._resolveOwnDataAccess({
      requesterId,
      playerId,
      resourceType: "load_monitoring",
    });

    if (ownAccess.errorResponse) {
      return ownAccess.errorResponse;
    }

    const { targetPlayerId } = ownAccess;
    let query = this.supabase
      .from("load_monitoring")
      .select("*")
      .eq("player_id", targetPlayerId);

    if (filters.startDate) {
      query = query.gte("date", filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte("date", filters.endDate);
    }

    query = query.order("date", { ascending: false });

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      return this._createErrorResponse(error, "load_monitoring");
    }

    const processedData = this._processConsentResults(data, context);

    return this._wrapResponse(processedData, "acwr");
  }

  /**
   * Read workout logs with consent enforcement
   */
  async readWorkoutLogs({
    requesterId,
    playerId,
    teamId,
    context,
    filters = {},
  }) {
    this._validateContext(context);

    if (context === AccessContext.COACH_TEAM_DATA) {
      return this._readWorkoutLogsWithConsentCheck({
        requesterId,
        playerId,
        teamId,
        filters,
      });
    }

    const ownAccess = this._resolveOwnDataAccess({
      requesterId,
      playerId,
      resourceType: "workout_logs",
    });

    if (ownAccess.errorResponse) {
      return ownAccess.errorResponse;
    }

    const { targetPlayerId } = ownAccess;
    let query = this.supabase
      .from("workout_logs")
      .select("*")
      .eq("player_id", targetPlayerId);

    if (filters.startDate) {
      query = query.gte("completed_at", filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte("completed_at", filters.endDate);
    }

    query = query.order("completed_at", { ascending: false });

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      return this._createErrorResponse(error, "workout_logs");
    }

    const processedData = this._processConsentResults(data, context);

    return this._wrapResponse(processedData, "acwr");
  }

  /**
   * Read load monitoring for a coach after resolving team consent.
   *
   * Backend functions normally use the service-role Supabase client. Service
   * role has no requester JWT, so auth.uid() inside consent views is not a
   * reliable coach identity. Resolve consent explicitly, then query only the
   * consented player IDs from the raw table.
   *
   * @private
   */
  async _readLoadMonitoringWithConsentCheck({
    requesterId,
    playerId,
    teamId,
    filters,
  }) {
    const access = await this._resolveTeamConsentAccess({
      requesterId,
      playerId,
      teamId,
      consentType: "performance",
      resourceType: "load_monitoring",
    });

    if (access.errorResponse) {
      return access.errorResponse;
    }

    if (access.targetUserIds.length === 0) {
      return this._wrapResponse(
        {
          data: [],
          consentBlocked: access.blockedUserIds,
          accessibleCount: 0,
          message: access.message,
        },
        "acwr",
      );
    }

    let query = this.supabase
      .from("load_monitoring")
      .select("*")
      .in("player_id", access.targetUserIds);

    if (filters.startDate) {
      query = query.gte("date", filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte("date", filters.endDate);
    }

    query = query.order("date", { ascending: false });

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      return this._createErrorResponse(error, "load_monitoring");
    }

    await this._logCoachAccessIfEnabled({
      requesterId,
      targetUserIds: access.targetUserIds,
      resourceType: "load_monitoring",
      teamId,
    });

    return this._wrapResponse(
      {
        data: data || [],
        consentBlocked: access.blockedUserIds,
        accessibleCount: data?.length || 0,
        message: access.message,
      },
      "acwr",
    );
  }

  /**
   * Read workout logs for a coach after resolving team consent.
   *
   * @private
   */
  async _readWorkoutLogsWithConsentCheck({
    requesterId,
    playerId,
    teamId,
    filters,
  }) {
    const access = await this._resolveTeamConsentAccess({
      requesterId,
      playerId,
      teamId,
      consentType: "performance",
      resourceType: "workout_logs",
    });

    if (access.errorResponse) {
      return access.errorResponse;
    }

    if (access.targetUserIds.length === 0) {
      return this._wrapResponse(
        {
          data: [],
          consentBlocked: access.blockedUserIds,
          accessibleCount: 0,
          message: access.message,
        },
        "acwr",
      );
    }

    let query = this.supabase
      .from("workout_logs")
      .select("*")
      .in("player_id", access.targetUserIds);

    if (filters.startDate) {
      query = query.gte("completed_at", filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte("completed_at", filters.endDate);
    }

    query = query.order("completed_at", { ascending: false });

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      return this._createErrorResponse(error, "workout_logs");
    }

    await this._logCoachAccessIfEnabled({
      requesterId,
      targetUserIds: access.targetUserIds,
      resourceType: "workout_logs",
      teamId,
    });

    return this._wrapResponse(
      {
        data: data || [],
        consentBlocked: access.blockedUserIds,
        accessibleCount: data?.length || 0,
        message: access.message,
      },
      "acwr",
    );
  }

  /**
   * Read training sessions with consent enforcement
   *
   * NOTE: training_sessions doesn't have a consent view yet.
   * For coach contexts, this uses RLS + manual consent checking.
   */
  async readTrainingSessions({
    requesterId,
    playerId,
    teamId,
    context,
    filters = {},
  }) {
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

    const ownAccess = this._resolveOwnDataAccess({
      requesterId,
      playerId,
      resourceType: "training_sessions",
    });

    if (ownAccess.errorResponse) {
      return ownAccess.errorResponse;
    }

    // For player's own data
    let query = this.supabase
      .from("training_sessions")
      .select("*")
      .or(
        `user_id.eq.${ownAccess.targetPlayerId},athlete_id.eq.${ownAccess.targetPlayerId}`,
      );

    if (filters.startDate) {
      query = query.gte("session_date", filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte("session_date", filters.endDate);
    }

    query = query.order("session_date", { ascending: false });

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      return this._createErrorResponse(error, "training_sessions");
    }

    return this._wrapResponse(
      { data, consentBlocked: [], accessibleCount: data?.length || 0 },
      "acwr",
    );
  }

  /**
   * Read training sessions for coach with consent checking
   * @private
   */
  async _readTrainingSessionsWithConsentCheck({
    requesterId,
    playerId,
    teamId,
    filters,
  }) {
    const access = await this._resolveTeamConsentAccess({
      requesterId,
      playerId,
      teamId,
      consentType: "performance",
      resourceType: "training_sessions",
    });

    if (access.errorResponse) {
      return access.errorResponse;
    }

    if (access.targetUserIds.length === 0) {
      return this._wrapResponse(
        {
          data: [],
          consentBlocked: access.blockedUserIds,
          accessibleCount: 0,
          message: access.message,
        },
        "acwr",
      );
    }

    // Query training sessions for consented users
    let query = this.supabase.from("training_sessions").select("*");

    if (access.targetUserIds.length === 1) {
      query = query.or(
        `user_id.eq.${access.targetUserIds[0]},athlete_id.eq.${access.targetUserIds[0]}`,
      );
    } else {
      query = query.or(
        `user_id.in.(${access.targetUserIds.join(",")}),athlete_id.in.(${access.targetUserIds.join(",")})`,
      );
    }

    if (filters.startDate) {
      query = query.gte("session_date", filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte("session_date", filters.endDate);
    }

    query = query.order("session_date", { ascending: false });

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      return this._createErrorResponse(error, "training_sessions");
    }

    // Log access
    await this._logCoachAccessIfEnabled({
      requesterId,
      targetUserIds: access.targetUserIds,
      resourceType: "training_sessions",
      teamId,
    });

    return this._wrapResponse(
      {
        data,
        consentBlocked: access.blockedUserIds,
        accessibleCount: data?.length || 0,
        message: access.message,
      },
      "acwr",
    );
  }

  /**
   * Read wellness entries with consent enforcement
   *
   * NOTE: wellness_entries doesn't have a consent view yet.
   * For coach contexts, this uses RLS + manual consent checking (health_sharing_enabled).
   */
  async readWellnessEntries({
    requesterId,
    playerId,
    teamId,
    context,
    filters = {},
  }) {
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

    const ownAccess = this._resolveOwnDataAccess({
      requesterId,
      playerId,
      resourceType: "wellness_entries",
    });

    if (ownAccess.errorResponse) {
      return ownAccess.errorResponse;
    }

    // For player's own data
    let query = this.supabase
      .from("wellness_entries")
      .select("*")
      .or(
        `user_id.eq.${ownAccess.targetPlayerId},athlete_id.eq.${ownAccess.targetPlayerId}`,
      );

    if (filters.startDate) {
      query = query.gte("date", filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte("date", filters.endDate);
    }

    query = query.order("date", { ascending: false });

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      return this._createErrorResponse(error, "wellness_entries");
    }

    return this._wrapResponse(
      { data, consentBlocked: [], accessibleCount: data?.length || 0 },
      "acwr",
    );
  }

  /**
   * Read wellness entries for coach with consent checking
   * @private
   */
  async _readWellnessEntriesWithConsentCheck({
    requesterId,
    playerId,
    teamId,
    filters,
  }) {
    const access = await this._resolveTeamConsentAccess({
      requesterId,
      playerId,
      teamId,
      consentType: "health",
      resourceType: "wellness_entries",
    });

    if (access.errorResponse) {
      return access.errorResponse;
    }

    if (access.targetUserIds.length === 0) {
      return this._wrapResponse(
        {
          data: [],
          consentBlocked: access.blockedUserIds,
          accessibleCount: 0,
          message: access.message,
        },
        "acwr",
      );
    }

    // Query wellness entries for consented users
    // wellness_entries may use user_id or athlete_id
    let query = this.supabase.from("wellness_entries").select("*");

    // Build OR condition for all consented user IDs
    if (access.targetUserIds.length === 1) {
      query = query.or(
        `user_id.eq.${access.targetUserIds[0]},athlete_id.eq.${access.targetUserIds[0]}`,
      );
    } else {
      // For multiple users, use IN clause on both columns
      query = query.or(
        `user_id.in.(${access.targetUserIds.join(",")}),athlete_id.in.(${access.targetUserIds.join(",")})`,
      );
    }

    if (filters.startDate) {
      query = query.gte("date", filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte("date", filters.endDate);
    }

    query = query.order("date", { ascending: false });

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      return this._createErrorResponse(error, "wellness_entries");
    }

    // Log access
    await this._logCoachAccessIfEnabled({
      requesterId,
      targetUserIds: access.targetUserIds,
      resourceType: "wellness_entries",
      teamId,
    });

    return this._wrapResponse(
      {
        data,
        consentBlocked: access.blockedUserIds,
        accessibleCount: data?.length || 0,
        message: access.message,
      },
      "acwr",
    );
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  _resolveOwnDataAccess({ requesterId, playerId, resourceType }) {
    const targetPlayerId = playerId || requesterId;

    if (!requesterId || !targetPlayerId || targetPlayerId !== requesterId) {
      return {
        errorResponse: this._createErrorResponse(
          new Error("Player own-data access can only read the requester data"),
          resourceType,
        ),
      };
    }

    return { targetPlayerId };
  }

  async _resolveTeamConsentAccess({
    requesterId,
    playerId,
    teamId,
    consentType,
    resourceType,
  }) {
    if (!teamId) {
      return {
        errorResponse: this._createErrorResponse(
          new Error("teamId is required for coach team data access"),
          resourceType,
        ),
      };
    }

    const consentConfig = this._getConsentConfig(consentType);

    const { data: teamMembers, error: teamError } = await this.supabase
      .from("team_members")
      .select("user_id, team_id, role, status")
      .eq("team_id", teamId);

    if (teamError) {
      return {
        errorResponse: this._createErrorResponse(teamError, resourceType),
      };
    }

    const activeMemberIds = [
      ...new Set(
        (teamMembers || [])
          .filter((member) => member.status !== "inactive")
          .map((member) => member.user_id)
          .filter(Boolean),
      ),
    ];

    if (playerId && !activeMemberIds.includes(playerId)) {
      return {
        targetUserIds: [],
        blockedUserIds: [playerId],
        message: "Player is not an active member of this team.",
      };
    }

    const requestedUserIds = playerId
      ? [playerId]
      : activeMemberIds.filter((memberId) => memberId !== requesterId);

    if (requestedUserIds.length === 0) {
      return {
        targetUserIds: [],
        blockedUserIds: [],
        message: "No team members are available for this request.",
      };
    }

    const { data: teamSettings, error: settingsError } = await this.supabase
      .from("team_sharing_settings")
      .select(`user_id, ${consentConfig.settingColumn}`)
      .eq("team_id", teamId)
      .in("user_id", requestedUserIds);

    if (settingsError) {
      return {
        errorResponse: this._createErrorResponse(settingsError, resourceType),
      };
    }

    const { data: privacySettings, error: privacyError } = await this.supabase
      .from("privacy_settings")
      .select(`user_id, ${consentConfig.defaultColumn}`)
      .in("user_id", requestedUserIds);

    if (privacyError) {
      return {
        errorResponse: this._createErrorResponse(privacyError, resourceType),
      };
    }

    const explicitConsentByUser = new Map(
      (teamSettings || []).map((setting) => [
        setting.user_id,
        setting[consentConfig.settingColumn],
      ]),
    );
    const defaultConsentByUser = new Map(
      (privacySettings || []).map((setting) => [
        setting.user_id,
        setting[consentConfig.defaultColumn],
      ]),
    );

    const targetUserIds = [];
    const blockedUserIds = [];

    for (const userId of requestedUserIds) {
      const explicitConsent = explicitConsentByUser.get(userId);
      const defaultConsent = defaultConsentByUser.get(userId);
      const consentEnabled =
        typeof explicitConsent === "boolean"
          ? explicitConsent
          : Boolean(defaultConsent);

      if (consentEnabled) {
        targetUserIds.push(userId);
      } else {
        blockedUserIds.push(userId);
      }
    }

    let message;
    if (playerId && blockedUserIds.includes(playerId)) {
      message = `Player has not enabled ${consentConfig.label} sharing for this team.`;
    } else if (targetUserIds.length === 0 && blockedUserIds.length > 0) {
      message = `No team members have enabled ${consentConfig.label} sharing.`;
    }

    return {
      targetUserIds,
      blockedUserIds,
      message,
    };
  }

  _getConsentConfig(consentType) {
    if (consentType === "health") {
      return {
        settingColumn: "health_sharing_enabled",
        defaultColumn: "health_sharing_default",
        label: "health data",
      };
    }

    return {
      settingColumn: "performance_sharing_enabled",
      defaultColumn: "performance_sharing_default",
      label: "performance",
    };
  }

  async _logCoachAccessIfEnabled({
    requesterId,
    targetUserIds,
    resourceType,
    teamId,
  }) {
    if (!this.options.enableAuditLogging) {
      return;
    }

    await this._logAccess({
      accessorUserId: requesterId,
      targetUserIds,
      resourceType,
      teamId,
      context: AccessContext.COACH_TEAM_DATA,
    });
  }

  _validateContext(context) {
    const validContexts = Object.values(AccessContext);
    if (!validContexts.includes(context)) {
      throw new Error(
        `Invalid access context: ${context}. Must be one of: ${validContexts.join(", ")}`,
      );
    }
  }

  _processConsentResults(data, _context) {
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
      accessibleCount: accessible.filter((r) => !r._consentBlocked).length,
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

    const requirement = MINIMUM_DATA_REQUIREMENTS[metricType] || {
      minimumDays: 7,
    };

    return {
      success: true,
      data,
      dataState,
      dataStateInfo: {
        currentDataPoints: accessibleCount,
        minimumRequiredDataPoints: requirement.minimumDays,
        isReliable:
          dataState === DataState.REAL_DATA &&
          accessibleCount >= requirement.minimumDays,
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
      warnings.push("No data available for the requested parameters.");
    }

    if (consentBlocked.length > 0) {
      warnings.push(
        `${consentBlocked.length} player(s) have not enabled data sharing. ` +
          "Their metrics are hidden to protect their privacy.",
      );
    }

    return warnings;
  }

  _createErrorResponse(_error, resourceType) {
    const safeMessage = `Failed to fetch ${resourceType}`;
    return {
      success: false,
      data: [],
      dataState: DataState.NO_DATA,
      dataStateInfo: {
        currentDataPoints: 0,
        minimumRequiredDataPoints: 0,
        isReliable: false,
        warnings: [safeMessage],
      },
      consentInfo: {
        blockedPlayerIds: [],
        blockedCount: 0,
        accessibleCount: 0,
      },
      error: safeMessage,
    };
  }

  async _logAccess({
    accessorUserId,
    targetUserIds,
    resourceType,
    teamId,
    context,
  }) {
    try {
      const logEntries = targetUserIds.map((targetUserId) => ({
        accessor_user_id: accessorUserId,
        target_user_id: targetUserId,
        resource_type: resourceType,
        access_granted: true,
        consent_type: "performance",
        team_id: teamId,
        access_reason: context,
      }));

      // Batch insert audit logs
      if (logEntries.length > 0) {
        await this.supabase.from("consent_access_log").insert(logEntries);
      }
    } catch (err) {
      // Don't fail the request on audit log failure
      console.warn("[ConsentDataReader] Audit log failed:", err.message);
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
function findConsentViolations(codeString, context = "coach") {
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
        suggestion: consentView || "ConsentDataReader",
      });
    }
  }

  return violations;
}

// ============================================================================
// EXPORTS
// ============================================================================

export { ConsentDataReader,
  AccessContext,
  CONSENT_PROTECTED_TABLES,
  CONSENT_VIEWS,
  isConsentProtectedTable,
  getConsentView,
  findConsentViolations, };
