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
 * Evaluates all active alert rules against current athlete data.
 * Generates alerts for matching conditions, logs delivery attempts.
 * Runs periodically (cron) or on-demand.
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

async function evaluateAcwrRedFlag(supabase, rule, requestLogger) {
  try {
    const threshold = rule.trigger_condition?.threshold_multiplier || 1.3;

    const { data: snapshots, error } = await supabase
      .from("acwr_snapshots")
      .select(
        "athlete_id, acwr_ratio, upper_bound_ratio, acute_load, chronic_load, cumulative_load_multiplier"
      )
      .gte("acwr_ratio", "upper_bound_ratio * :threshold")
      .order("created_at", { ascending: false });

    if (error) {
      requestLogger.error("DB error fetching ACWR snapshots for red flag", {
        code: error.code,
      });
      return 0;
    }

    let alertsFired = 0;
    for (const snapshot of snapshots || []) {
      if (snapshot.acwr_ratio > snapshot.upper_bound_ratio * threshold) {
        const { data: alert } = await supabase
          .from("generated_alerts")
          .insert({
            user_id: snapshot.athlete_id,
            rule_id: rule.id,
            alert_type: "critical",
            title: `ACWR Red Flag: ${snapshot.acwr_ratio.toFixed(2)} (limit ${snapshot.upper_bound_ratio.toFixed(2)})`,
            description: "Your training load exceeded your personalized safe zone.",
            trigger_data: {
              acwr: snapshot.acwr_ratio,
              upper_bound: snapshot.upper_bound_ratio,
              acute_load: snapshot.acute_load,
              chronic_load: snapshot.chronic_load,
              cumulative_multiplier: snapshot.cumulative_load_multiplier,
            },
            related_entity_type: "acwr_snapshot",
            related_entity_id: snapshot.id,
            status: "active",
          })
          .select("id");

        if (alert && alert.length > 0) {
          alertsFired++;
          // Log delivery: create delivery logs for in-app inbox
          await supabase.from("alert_delivery_logs").insert({
            generated_alert_id: alert[0].id,
            recipient_user_id: snapshot.athlete_id,
            channel: "in_app",
            delivery_status: "sent",
          });
        }
      }
    }

    return alertsFired;
  } catch (err) {
    requestLogger.error("Error evaluating ACWR red flag", {
      error: err.message,
    });
    return 0;
  }
}

async function evaluateAcwrYellowFlag(supabase, rule, requestLogger) {
  try {
    const threshold = rule.trigger_condition?.threshold_multiplier || 1.0;

    const { data: snapshots, error } = await supabase
      .from("acwr_snapshots")
      .select(
        "athlete_id, acwr_ratio, upper_bound_ratio, acute_load, chronic_load, cumulative_load_multiplier"
      )
      .gte("acwr_ratio", "upper_bound_ratio * 1.0")
      .lt("acwr_ratio", "upper_bound_ratio * 1.3")
      .order("created_at", { ascending: false });

    if (error) {
      requestLogger.error("DB error fetching ACWR snapshots for yellow flag", {
        code: error.code,
      });
      return 0;
    }

    let alertsFired = 0;
    for (const snapshot of snapshots || []) {
      const { data: alert } = await supabase
        .from("generated_alerts")
        .insert({
          user_id: snapshot.athlete_id,
          rule_id: rule.id,
          alert_type: "high",
          title: `ACWR Yellow Flag: ${snapshot.acwr_ratio.toFixed(2)} (limit ${snapshot.upper_bound_ratio.toFixed(2)})`,
          description: "Your training load is approaching your personalized limit.",
          trigger_data: {
            acwr: snapshot.acwr_ratio,
            upper_bound: snapshot.upper_bound_ratio,
            acute_load: snapshot.acute_load,
            chronic_load: snapshot.chronic_load,
            cumulative_multiplier: snapshot.cumulative_load_multiplier,
          },
          related_entity_type: "acwr_snapshot",
          related_entity_id: snapshot.id,
          status: "active",
        })
        .select("id");

      if (alert && alert.length > 0) {
        alertsFired++;
        await supabase.from("alert_delivery_logs").insert({
          generated_alert_id: alert[0].id,
          recipient_user_id: snapshot.athlete_id,
          channel: "in_app",
          delivery_status: "sent",
        });
      }
    }

    return alertsFired;
  } catch (err) {
    requestLogger.error("Error evaluating ACWR yellow flag", {
      error: err.message,
    });
    return 0;
  }
}

async function evaluateSafetyAlert(supabase, rule, requestLogger) {
  try {
    const { data: snapshots, error } = await supabase
      .from("acwr_snapshots")
      .select("athlete_id")
      .eq("safety_alert", true);

    if (error) {
      requestLogger.error("DB error fetching safety alerts", {
        code: error.code,
      });
      return 0;
    }

    let alertsFired = 0;
    for (const snapshot of snapshots || []) {
      const { data: alert } = await supabase
        .from("generated_alerts")
        .insert({
          user_id: snapshot.athlete_id,
          rule_id: rule.id,
          alert_type: "critical",
          title: "ACWR Safety Alert",
          description: "Your training load triggered a safety flag.",
          trigger_data: { safety_alert_triggered: true },
          related_entity_type: "acwr_snapshot",
          related_entity_id: snapshot.id,
          status: "active",
        })
        .select("id");

      if (alert && alert.length > 0) {
        alertsFired++;
        await supabase.from("alert_delivery_logs").insert({
          generated_alert_id: alert[0].id,
          recipient_user_id: snapshot.athlete_id,
          channel: "in_app",
          delivery_status: "sent",
        });
      }
    }

    return alertsFired;
  } catch (err) {
    requestLogger.error("Error evaluating safety alert", {
      error: err.message,
    });
    return 0;
  }
}

async function evaluatePhaseAdvancement(supabase, rule, requestLogger) {
  try {
    const { data: progressions, error } = await supabase
      .from("rtp_phase_progress")
      .select("athlete_id, injury_id, current_phase, next_phase")
      .eq("phase_advancement_ready", true);

    if (error) {
      requestLogger.error("DB error fetching phase progressions", {
        code: error.code,
      });
      return 0;
    }

    let alertsFired = 0;
    for (const prog of progressions || []) {
      const { data: injury } = await supabase
        .from("athlete_injuries")
        .select("injury_type")
        .eq("id", prog.injury_id)
        .single();

      const { data: alert } = await supabase
        .from("generated_alerts")
        .insert({
          user_id: prog.athlete_id,
          rule_id: rule.id,
          alert_type: "high",
          title: `Phase Advancement Ready: ${injury?.injury_type || "Injury"} (${prog.current_phase}→${prog.next_phase})`,
          description: "All functional criteria met. Review psychological readiness before advancing.",
          trigger_data: {
            injury_type: injury?.injury_type,
            current_phase: prog.current_phase,
            next_phase: prog.next_phase,
          },
          related_injury_id: prog.injury_id,
          related_entity_type: "rtp_phase_progress",
          related_entity_id: prog.id,
          status: "active",
        })
        .select("id");

      if (alert && alert.length > 0) {
        alertsFired++;
        await supabase.from("alert_delivery_logs").insert({
          generated_alert_id: alert[0].id,
          recipient_user_id: prog.athlete_id,
          channel: "in_app",
          delivery_status: "sent",
        });
      }
    }

    return alertsFired;
  } catch (err) {
    requestLogger.error("Error evaluating phase advancement", {
      error: err.message,
    });
    return 0;
  }
}

async function evaluateReadinessGateFailed(supabase, rule, requestLogger) {
  try {
    const { data: progressions, error } = await supabase
      .from("rtp_phase_progress")
      .select("athlete_id, injury_id, current_phase")
      .eq("functional_criteria_blocked", true);

    if (error) {
      requestLogger.error("DB error fetching readiness gate failures", {
        code: error.code,
      });
      return 0;
    }

    let alertsFired = 0;
    for (const prog of progressions || []) {
      const { data: alert } = await supabase
        .from("generated_alerts")
        .insert({
          user_id: prog.athlete_id,
          rule_id: rule.id,
          alert_type: "critical",
          title: "Readiness Gate Failed",
          description: "One functional criterion blocks phase advancement.",
          trigger_data: {
            current_phase: prog.current_phase,
            blocked_by_criterion: true,
          },
          related_injury_id: prog.injury_id,
          related_entity_type: "rtp_phase_progress",
          related_entity_id: prog.id,
          status: "active",
        })
        .select("id");

      if (alert && alert.length > 0) {
        alertsFired++;
        await supabase.from("alert_delivery_logs").insert({
          generated_alert_id: alert[0].id,
          recipient_user_id: prog.athlete_id,
          channel: "in_app",
          delivery_status: "sent",
        });
      }
    }

    return alertsFired;
  } catch (err) {
    requestLogger.error("Error evaluating readiness gate failure", {
      error: err.message,
    });
    return 0;
  }
}

async function evaluatePsychReadinessFailed(supabase, rule, requestLogger) {
  try {
    const { data: assessments, error } = await supabase
      .from("psychological_readiness_assessments")
      .select("athlete_id, acl_rsi_score, tsk11_score, injury_id")
      .or("acl_rsi_score.lt.56,tsk11_score.gte.37");

    if (error) {
      requestLogger.error("DB error fetching psychological assessments", {
        code: error.code,
      });
      return 0;
    }

    let alertsFired = 0;
    for (const assess of assessments || []) {
      const failReason =
        assess.acl_rsi_score < 56
          ? `ACL-RSI ${assess.acl_rsi_score} < 56`
          : `TSK-11 ${assess.tsk11_score} >= 37`;

      const { data: alert } = await supabase
        .from("generated_alerts")
        .insert({
          user_id: assess.athlete_id,
          rule_id: rule.id,
          alert_type: "critical",
          title: "Psychological Readiness Failed",
          description: `Failed criterion: ${failReason}`,
          trigger_data: {
            acl_rsi_score: assess.acl_rsi_score,
            tsk11_score: assess.tsk11_score,
            fail_reason: failReason,
          },
          related_injury_id: assess.injury_id,
          related_entity_type: "psychological_readiness_assessments",
          related_entity_id: assess.id,
          status: "active",
        })
        .select("id");

      if (alert && alert.length > 0) {
        alertsFired++;
        await supabase.from("alert_delivery_logs").insert({
          generated_alert_id: alert[0].id,
          recipient_user_id: assess.athlete_id,
          channel: "in_app",
          delivery_status: "sent",
        });
      }
    }

    return alertsFired;
  } catch (err) {
    requestLogger.error("Error evaluating psychological readiness failure", {
      error: err.message,
    });
    return 0;
  }
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
    cutoffDate.setDate(cutoffDate.getDate() - consecutiveDays);

    const { data: underloaded, error } = await supabase
      .rpc("check_underload_condition", {
        p_threshold: threshold,
        p_days: consecutiveDays,
        p_cutoff_date: cutoffDate.toISOString(),
      });

    if (error) {
      requestLogger.error("Error checking underload condition", {
        code: error.code,
      });
      return 0;
    }

    let alertsFired = 0;
    for (const athlete of underloaded || []) {
      const { data: alert } = await supabase
        .from("generated_alerts")
        .insert({
          user_id: athlete.athlete_id,
          rule_id: rule.id,
          alert_type: "low",
          title: "Underload Alert",
          description: `ACWR < ${threshold} for ${consecutiveDays}+ days. Athlete may be undertrained.`,
          trigger_data: {
            threshold,
            consecutive_days: consecutiveDays,
            current_acwr: athlete.acwr_ratio,
          },
          status: "active",
        })
        .select("id");

      if (alert && alert.length > 0) {
        alertsFired++;
        await supabase.from("alert_delivery_logs").insert({
          generated_alert_id: alert[0].id,
          recipient_user_id: athlete.athlete_id,
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
    rateLimitType: "WRITE",
    requireAuth: true,
    handler: async (event, _context, { userId }) => {
      const requestLogger = buildRequestLogContext(logger, event);

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
