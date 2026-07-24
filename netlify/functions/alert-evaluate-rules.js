import { getSupabaseClient } from "./utils/auth-helper.js";
import {
  createSuccessResponse,
  createErrorResponse,
} from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";
import {
  buildRequestLogContext,
  createLogger,
} from "./utils/structured-logger.js";

const logger = createLogger({ service: "netlify.alert-evaluate-rules" });

/**
 * Alert Rule Evaluation Engine
 * POST /api/alert-evaluate-rules (internal/service-role)
 *
 * Evaluates alert rules that have no DB-trigger equivalent and generates
 * alerts for matching conditions. Runs periodically (cron) or on-demand.
 *
 * ACWR Red/Yellow Flag, Safety Alert, Phase Advancement Ready, and
 * Psychological Readiness Failed are NOT re-implemented here -- they already
 * fire atomically via DB triggers on the source table's insert/update
 * (acwr_snapshot_alert_trigger, rtp_phase_alert_trigger,
 * psych_assessment_alert_trigger; see
 * supabase/migrations/20260721130000_phase_3_alerts_and_automation.sql).
 * Re-implementing the same rule twice (trigger + polling job) is exactly the
 * class of drift CLAUDE.md's single-source-of-truth rule exists to prevent --
 * a periodic evaluator only makes sense here for conditions no single-row
 * trigger can express (a multi-day lookback).
 */

async function evaluateAllRules(supabase, requestLogger) {
  try {
    const { data: rules, error: rulesError } = await supabase
      .from("alert_rules")
      .select("id, name, alert_type, trigger_condition")
      .eq("enabled", true);

    if (rulesError) {
      requestLogger.error("DB error fetching alert rules", {
        code: rulesError.code,
      });
      return createErrorResponse("Failed to fetch alert rules", 500);
    }

    if (!rules || rules.length === 0) {
      return createSuccessResponse({
        success: true,
        evaluatedRules: 0,
        generatedAlerts: 0,
      });
    }

    let totalAlertsFired = 0;

    for (const rule of rules) {
      let alertsFired = 0;

      switch (rule.name) {
        case "ACWR Red Flag":
          alertsFired = await evaluateAcwrRedFlag(supabase, rule, requestLogger);
          break;
        case "ACWR Yellow Flag":
          alertsFired = await evaluateAcwrYellowFlag(supabase, rule, requestLogger);
          break;
        case "Safety Alert":
          alertsFired = await evaluateSafetyAlert(supabase, rule, requestLogger);
          break;
        case "Phase Advancement Ready":
          alertsFired = await evaluatePhaseAdvancement(supabase, rule, requestLogger);
          break;
        case "Readiness Gate Failed":
          alertsFired = await evaluateReadinessGateFailed(supabase, rule, requestLogger);
          break;
        case "Psychological Readiness Failed":
          alertsFired = await evaluatePsychReadinessFailed(supabase, rule, requestLogger);
          break;
        case "CMJ Depression Trend":
          alertsFired = await evaluateCmjDepressionTrend(supabase, rule, requestLogger);
          break;
        case "Underload Alert":
          alertsFired = await evaluateUnderloadAlert(supabase, rule, requestLogger);
          break;
      }

      totalAlertsFired += alertsFired;
    }

    requestLogger.info("Alert rule evaluation completed", {
      evaluatedRules: rules.length,
      totalAlertsFired,
    });

    return createSuccessResponse({
      success: true,
      evaluatedRules: rules.length,
      generatedAlerts: totalAlertsFired,
    });
  } catch (err) {
    requestLogger.error("Unexpected error in evaluateAllRules", {
      error: err.message,
    });
    return createErrorResponse("Internal server error", 500);
  }
}

// Individual rule evaluation functions
//
// ACWR Red Flag, ACWR Yellow Flag, Safety Alert, Phase Advancement Ready, and
// Psychological Readiness Failed are intentionally no-ops here -- they already
// fire atomically via DB triggers on acwr_snapshots / rtp_phase_progress /
// rtp_psychological_assessments insert-or-update (see the file header comment).
// Readiness Gate Failed and CMJ Depression Trend have no queryable signal in
// the current schema (no column marks "which specific criterion blocked
// advancement"; no CMJ time-series table exists) -- both are documented
// placeholders, same as the original code already had for CMJ.

async function evaluateAcwrRedFlag(supabase, rule, requestLogger) {
  return 0; // handled by acwr_snapshot_alert_trigger
}

async function evaluateAcwrYellowFlag(supabase, rule, requestLogger) {
  return 0; // handled by acwr_snapshot_alert_trigger
}

async function evaluateSafetyAlert(supabase, rule, requestLogger) {
  return 0; // handled by acwr_snapshot_alert_trigger
}

async function evaluatePhaseAdvancement(supabase, rule, requestLogger) {
  return 0; // handled by rtp_phase_alert_trigger
}

async function evaluateReadinessGateFailed(supabase, rule, requestLogger) {
  // Placeholder: rtp_phase_progress has no column identifying which specific
  // functional criterion blocked advancement -- would require new schema.
  return 0;
}

async function evaluatePsychReadinessFailed(supabase, rule, requestLogger) {
  return 0; // handled by psych_assessment_alert_trigger
}

async function evaluateCmjDepressionTrend(supabase, rule, requestLogger) {
  // Placeholder: would require CMJ time-series data analysis
  return 0;
}

async function evaluateUnderloadAlert(supabase, rule, requestLogger) {
  try {
    const threshold = rule.trigger_condition?.threshold || 0.8;
    const consecutiveDays = rule.trigger_condition?.consecutive_days || 3;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - (consecutiveDays - 1));
    const cutoffDateStr = cutoffDate.toISOString().split("T")[0];

    // No single-row trigger can express "N consecutive days below threshold" --
    // this is why Underload Alert is the one rule that genuinely needs a
    // periodic batch scan rather than an insert/update trigger.
    const { data: snapshots, error } = await supabase
      .from("acwr_snapshots")
      .select("user_id, snapshot_date, acwr_ratio")
      .gte("snapshot_date", cutoffDateStr)
      .not("acwr_ratio", "is", null)
      .order("snapshot_date", { ascending: true });

    if (error) {
      requestLogger.error("DB error checking underload condition", {
        code: error.code,
      });
      return 0;
    }

    const byUser = new Map();
    for (const snap of snapshots || []) {
      if (!byUser.has(snap.user_id)) {
        byUser.set(snap.user_id, []);
      }
      byUser.get(snap.user_id).push(snap);
    }

    let alertsFired = 0;
    for (const [userId, userSnapshots] of byUser) {
      const distinctDays = new Set(userSnapshots.map((s) => s.snapshot_date));
      const allUnderloaded = userSnapshots.every(
        (s) => s.acwr_ratio < threshold
      );

      if (distinctDays.size < consecutiveDays || !allUnderloaded) {
        continue;
      }

      const latest = userSnapshots[userSnapshots.length - 1];
      const { data: alert } = await supabase
        .from("generated_alerts")
        .insert({
          user_id: userId,
          rule_id: rule.id,
          alert_type: "low",
          title: "Underload Alert",
          description: `ACWR < ${threshold} for ${consecutiveDays}+ days. Athlete may be undertrained.`,
          trigger_data: {
            threshold,
            consecutive_days: consecutiveDays,
            current_acwr: latest.acwr_ratio,
          },
          related_entity_type: "acwr_snapshot",
          status: "active",
        })
        .select("id");

      if (alert && alert.length > 0) {
        alertsFired++;
        await supabase.from("alert_delivery_logs").insert({
          generated_alert_id: alert[0].id,
          recipient_user_id: userId,
          channel: "in_app",
          delivery_status: "sent",
        });
      }
    }

    return alertsFired;
  } catch (err) {
    requestLogger.error("Error evaluating underload alert", {
      error: err.message,
    });
    return 0;
  }
}

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "alert-evaluate-rules",
    allowedMethods: ["POST"],
    rateLimitType: "CREATE",
    requireAuth: true,
    handler: async (event, _context, { userId }) => {
      const requestLogger = logger.child(buildRequestLogContext(event));

      // Only service-role can trigger evaluation
      if (event.headers["x-service-role"] !== "true") {
        return createErrorResponse(
          "Only service-role can evaluate alert rules",
          403
        );
      }

      const supabase = getSupabaseClient();
      return evaluateAllRules(supabase, requestLogger);
    },
  });

export { handler };
