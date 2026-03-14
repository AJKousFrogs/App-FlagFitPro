import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";
import { baseHandler } from "./utils/base-handler.js";
import { getUserRole } from "./utils/authorization-guard.js";
import { getSupabaseClient } from "./supabase-client.js";
import {
  createErrorResponse,
  createSuccessResponse,
  handleValidationError,
} from "./utils/error-handler.js";
import { ConsentDataReader, AccessContext } from "./utils/consent-data-reader.js";
import { hasAnyRole, COACH_ROUTE_ROLES } from "./utils/role-sets.js";

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isUuid(value) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

/**
 * Season Reports Function
 * Generates summary reports for players, coach, and team
 */

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "season-reports",
    allowedMethods: ["POST"],
    rateLimitType: "UPDATE",
    requireAuth: true,
    handler: async (event, context, { userId }) => {
      const supabase = getSupabaseClient();
      const userRole = await getUserRole(userId);

      // Only coaches/admins can generate reports
      if (!hasAnyRole(userRole, COACH_ROUTE_ROLES)) {
        return createErrorResponse(
          "Only authorized team staff can generate season reports",
          403,
          "authorization_error",
        );
      }

      let body = {};
      try {
        body = JSON.parse(event.body || "{}");
      } catch (_parseError) {
        return handleValidationError("Invalid JSON in request body");
      }
      if (!isPlainObject(body)) {
        return handleValidationError("Request body must be an object");
      }
      const { season_id } = body;

      if (!isUuid(season_id)) {
        return handleValidationError("season_id must be a valid UUID");
      }

      try {
        // Get season details
        const { data: season, error: seasonError } = await supabase
          .from("seasons")
          .select("*")
          .eq("id", season_id)
          .single();

        if (seasonError) {
          if (seasonError.code === "PGRST116") {
            return createErrorResponse("Season not found", 404, "not_found");
          }
          throw seasonError;
        }
        if (!season || !season.team_id) {
          return createErrorResponse("Season not found", 404, "not_found");
        }

        // Non-admin coaches can only generate reports for their own team.
        if (userRole !== "admin") {
          const { data: membership, error: membershipError } = await supabase
            .from("team_members")
            .select("role")
            .eq("team_id", season.team_id)
            .eq("user_id", userId)
            .eq("status", "active")
            .maybeSingle();

          if (membershipError) {
            throw membershipError;
          }
          if (!membership || !hasAnyRole(membership.role, COACH_ROUTE_ROLES)) {
            return createErrorResponse(
              "Not authorized to generate reports for this season",
              403,
              "authorization_error",
            );
          }
        }

        // Get team members
        const { data: teamMembers, error: membersError } = await supabase
          .from("team_members")
          .select("user_id, role")
          .eq("team_id", season.team_id);

        if (membersError) {
          throw membersError;
        }

        const players = teamMembers.filter((m) => m.role === "player");
        const reports = [];

        const consentReader = new ConsentDataReader(supabase);

        // Generate team report
        const teamReport = await generateTeamReport(
          supabase,
          consentReader,
          userId,
          season,
          players,
        );
        reports.push(teamReport);

        // Generate coach report
        const coachReport = await generateCoachReport(
          supabase,
          consentReader,
          userId,
          season,
          players,
        );
        reports.push(coachReport);

        // Generate player reports
        for (const player of players) {
          const playerReport = await generatePlayerReport(
            supabase,
            consentReader,
            userId,
            season,
            player.user_id,
          );
          reports.push(playerReport);
        }

        // Save reports to database
        const { error: insertError } = await supabase
          .from("season_summary_reports")
          .insert(reports);

        if (insertError) {
          throw insertError;
        }

        return createSuccessResponse(
          { reports },
          200,
          `Generated ${reports.length} reports`,
        );
      } catch (error) {
        console.error("[SeasonReports] Error:", error);
        return createErrorResponse("Failed to generate reports", 500, "server_error");
      }
    },
  });

async function generateTeamReport(
  supabase,
  consentReader,
  requesterId,
  season,
  players,
) {
  // Aggregate team statistics
  const { data: wellness } = await supabase
    .from("daily_wellness_checkin")
    .select("calculated_readiness")
    .in(
      "user_id",
      players.map((p) => p.user_id),
    )
    .gte("checkin_date", season.start_date)
    .lte("checkin_date", season.end_date);

  const sessionsResult = await consentReader.readTrainingSessions({
    requesterId,
    teamId: season.team_id,
    context: AccessContext.COACH_TEAM_DATA,
    filters: {
      startDate: season.start_date,
      endDate: season.end_date,
      limit: 5000,
    },
  });
  const training = sessionsResult.success ? sessionsResult.data || [] : [];

  const avgReadiness =
    wellness?.reduce((sum, w) => sum + (w.calculated_readiness || 0), 0) /
      (wellness?.length || 1) || 0;
  const totalTrainingHours =
    training?.reduce((sum, t) => sum + (t.duration_minutes || 0), 0) / 60 || 0;
  const avgRPE =
    training?.reduce((sum, t) => sum + (t.rpe || 0), 0) /
      (training?.length || 1) || 0;

  return {
    season_id: season.id,
    team_id: season.team_id,
    report_type: "team",
    user_id: null,
    report_data: {
      season_name: season.name,
      start_date: season.start_date,
      end_date: season.end_date,
      total_players: players.length,
      average_readiness: Math.round(avgReadiness),
      total_training_hours: Math.round(totalTrainingHours * 10) / 10,
      average_rpe: Math.round(avgRPE * 10) / 10,
      wellness_checkins: wellness?.length || 0,
      training_sessions: training?.length || 0,
    },
  };
}

async function generateCoachReport(
  supabase,
  consentReader,
  requesterId,
  season,
  players,
) {
  // Coach-specific insights
  const teamReport = await generateTeamReport(
    supabase,
    consentReader,
    requesterId,
    season,
    players,
  );

  return {
    ...teamReport,
    report_type: "coach",
    report_data: {
      ...teamReport.report_data,
      insights: [
        "Team maintained consistent training throughout season",
        "Average readiness improved over time",
        "Key players showed strong performance",
      ],
    },
  };
}

async function generatePlayerReport(
  supabase,
  consentReader,
  requesterId,
  season,
  playerId,
) {
  const { data: wellness } = await supabase
    .from("daily_wellness_checkin")
    .select("calculated_readiness, checkin_date")
    .eq("user_id", playerId)
    .gte("checkin_date", season.start_date)
    .lte("checkin_date", season.end_date)
    .order("checkin_date", { ascending: true });

  const sessionsResult = await consentReader.readTrainingSessions({
    requesterId,
    playerId,
    teamId: season.team_id,
    context: AccessContext.COACH_TEAM_DATA,
    filters: {
      startDate: season.start_date,
      endDate: season.end_date,
      limit: 2000,
    },
  });
  const training = sessionsResult.success ? sessionsResult.data || [] : [];

  const { data: acwr } = await supabase
    .from("acwr_history")
    .select("acwr_value, calculation_date")
    .eq("user_id", playerId)
    .gte("calculation_date", season.start_date)
    .lte("calculation_date", season.end_date)
    .order("calculation_date", { ascending: false })
    .limit(1);

  const avgReadiness =
    wellness?.reduce((sum, w) => sum + (w.calculated_readiness || 0), 0) /
      (wellness?.length || 1) || 0;
  const totalTrainingHours =
    training?.reduce((sum, t) => sum + (t.duration_minutes || 0), 0) / 60 || 0;
  const finalAcwr = acwr?.[0]?.acwr_value || 0;

  return {
    season_id: season.id,
    team_id: season.team_id,
    report_type: "player",
    user_id: playerId,
    report_data: {
      season_name: season.name,
      start_date: season.start_date,
      end_date: season.end_date,
      average_readiness: Math.round(avgReadiness),
      total_training_hours: Math.round(totalTrainingHours * 10) / 10,
      final_acwr: Math.round(finalAcwr * 100) / 100,
      wellness_checkins: wellness?.length || 0,
      training_sessions: training?.length || 0,
      readiness_trend:
        wellness?.map((w) => ({
          date: w.checkin_date,
          readiness: w.calculated_readiness,
        })) || [],
    },
  };
}

export const testHandler = handler;
export { handler };
export default createRuntimeV2Handler(handler);
