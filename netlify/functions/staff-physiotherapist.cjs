// Netlify Function: Staff Physiotherapist API
// Handles physiotherapist dashboard: injury tracking, RTP protocols, risk assessment

const { baseHandler } = require("./utils/base-handler.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("./utils/error-handler.cjs");
const { supabaseAdmin } = require("./supabase-client.cjs");

/**
 * Verify user is a staff member with physiotherapist role
 */
async function verifyPhysioAccess(userId) {
  const { data: member, error } = await supabaseAdmin
    .from("team_members")
    .select("role, team_id")
    .eq("user_id", userId)
    .in("role", ["physiotherapist", "athletic_trainer", "coach", "admin", "staff"])
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return member;
}

/**
 * Get all athletes with injury/physio status
 */
async function getAthletePhysioOverview(teamId) {
  const { data: members } = await supabaseAdmin
    .from("team_members")
    .select(`
      user_id,
      users:user_id (
        id,
        full_name,
        position,
        avatar_url
      )
    `)
    .eq("team_id", teamId)
    .eq("role", "player");

  const athletes = [];

  for (const member of members || []) {
    const userId = member.user_id;
    const user = member.users;
    if (!user) {continue;}

    // Get active injuries
    const { data: injuries } = await supabaseAdmin
      .from("athlete_injuries")
      .select("*")
      .eq("user_id", userId)
      .in("recovery_status", ["active", "recovering", "rehab"])
      .order("injury_date", { ascending: false });

    // Get ACWR from load_daily
    const { data: loadData } = await supabaseAdmin
      .from("load_daily")
      .select("acwr, acute_load, chronic_load, date")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(1)
      .single();

    // Determine clearance status
    let clearanceStatus = "cleared";
    let restrictions = [];

    if (injuries && injuries.length > 0) {
      const activeInjury = injuries[0];
      if (activeInjury.recovery_status === "active") {
        clearanceStatus = "not_cleared";
      } else if (activeInjury.recovery_status === "recovering" || activeInjury.recovery_status === "rehab") {
        clearanceStatus = "limited";
      }
      restrictions = activeInjury.activity_restrictions || [];
    }

    athletes.push({
      id: user.id,
      name: user.full_name || "Unknown",
      position: user.position || "N/A",
      avatarUrl: user.avatar_url,
      clearanceStatus,
      activeInjuries: injuries?.length || 0,
      currentInjury: injuries?.[0] ? {
        type: injuries[0].injury_type,
        location: injuries[0].injury_location,
        grade: injuries[0].injury_grade,
        phase: injuries[0].current_phase,
        rtpProgress: injuries[0].rtp_progress || 0,
        expectedReturn: injuries[0].expected_return_date,
      } : null,
      restrictions,
      acwr: loadData?.acwr || null,
      riskLevel: calculateRiskLevel(loadData?.acwr, injuries),
    });
  }

  return athletes;
}

/**
 * Get detailed injury data for an athlete
 */
async function getAthleteInjuryDetails(athleteId) {
  // Get all injuries (active and history)
  const { data: injuries } = await supabaseAdmin
    .from("athlete_injuries")
    .select("*")
    .eq("user_id", athleteId)
    .order("injury_date", { ascending: false });

  // Get injury tracking data
  const { data: tracking } = await supabaseAdmin
    .from("injury_tracking")
    .select("*")
    .or(`user_id.eq.${athleteId},player_id.eq.${athleteId}`)
    .order("injury_date", { ascending: false });

  // Get rehab protocol if active injury
  const activeInjury = injuries?.find((i) => 
    ["active", "recovering", "rehab"].includes(i.recovery_status)
  );

  let rehabProtocol = null;
  if (activeInjury) {
    const { data: protocol } = await supabaseAdmin
      .from("rehab_protocols")
      .select("*")
      .eq("injury_type", activeInjury.injury_type)
      .eq("injury_severity", activeInjury.injury_grade)
      .order("phase_number", { ascending: true });

    rehabProtocol = protocol;
  }

  // Get load history for risk analysis
  const { data: loadHistory } = await supabaseAdmin
    .from("load_daily")
    .select("date, acwr, acute_load, chronic_load")
    .eq("user_id", athleteId)
    .order("date", { ascending: false })
    .limit(28);

  return {
    activeInjuries: injuries?.filter((i) => 
      ["active", "recovering", "rehab"].includes(i.recovery_status)
    ) || [],
    injuryHistory: injuries?.filter((i) => i.recovery_status === "resolved") || [],
    tracking: tracking || [],
    rehabProtocol,
    loadHistory: loadHistory || [],
    riskIndicators: calculateRiskIndicators(loadHistory, injuries),
  };
}

/**
 * Get Return-to-Play athletes
 */
async function getRTPAthletes(teamId) {
  const { data: members } = await supabaseAdmin
    .from("team_members")
    .select("user_id, users:user_id(full_name, position)")
    .eq("team_id", teamId)
    .eq("role", "player");

  const rtpAthletes = [];

  for (const member of members || []) {
    const { data: injuries } = await supabaseAdmin
      .from("athlete_injuries")
      .select("*")
      .eq("user_id", member.user_id)
      .in("recovery_status", ["recovering", "rehab"])
      .order("injury_date", { ascending: false })
      .limit(1);

    if (injuries && injuries.length > 0) {
      const injury = injuries[0];
      rtpAthletes.push({
        athleteId: member.user_id,
        athleteName: member.users?.full_name || "Unknown",
        position: member.users?.position,
        injury: {
          type: injury.injury_type,
          location: injury.injury_location,
          grade: injury.injury_grade,
          injuryDate: injury.injury_date,
        },
        currentPhase: injury.current_phase || "Phase 1",
        rtpProgress: injury.rtp_progress || 0,
        expectedReturn: injury.expected_return_date,
        daysRemaining: injury.expected_return_date
          ? Math.ceil((new Date(injury.expected_return_date) - new Date()) / (1000 * 60 * 60 * 24))
          : null,
      });
    }
  }

  return rtpAthletes;
}

/**
 * Update RTP progress for an athlete
 */
async function updateRTPProgress(injuryId, updates) {
  const { data, error } = await supabaseAdmin
    .from("athlete_injuries")
    .update({
      current_phase: updates.phase,
      rtp_progress: updates.progress,
      medical_notes: updates.notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", injuryId)
    .select()
    .single();

  if (error) {throw error;}
  return data;
}

/**
 * Get team injury summary
 */
async function getTeamInjurySummary(teamId) {
  const athletes = await getAthletePhysioOverview(teamId);

  const cleared = athletes.filter((a) => a.clearanceStatus === "cleared").length;
  const limited = athletes.filter((a) => a.clearanceStatus === "limited").length;
  const notCleared = athletes.filter((a) => a.clearanceStatus === "not_cleared").length;

  // Count injuries by type
  const { data: allInjuries } = await supabaseAdmin
    .from("athlete_injuries")
    .select("injury_type, injury_location, user_id")
    .in("user_id", athletes.map((a) => a.id))
    .in("recovery_status", ["active", "recovering", "rehab"]);

  const injuryTypes = {};
  const injuryLocations = {};

  for (const injury of allInjuries || []) {
    injuryTypes[injury.injury_type] = (injuryTypes[injury.injury_type] || 0) + 1;
    injuryLocations[injury.injury_location] = (injuryLocations[injury.injury_location] || 0) + 1;
  }

  return {
    totalAthletes: athletes.length,
    cleared,
    limited,
    notCleared,
    activeInjuries: allInjuries?.length || 0,
    injuryTypes,
    injuryLocations,
    highRiskAthletes: athletes.filter((a) => a.riskLevel === "high").length,
  };
}

/**
 * Log a new injury
 */
async function logInjury(userId, injuryData) {
  const { data, error } = await supabaseAdmin
    .from("athlete_injuries")
    .insert({
      user_id: userId,
      injury_type: injuryData.type,
      injury_location: injuryData.location,
      injury_grade: injuryData.grade,
      injury_date: injuryData.date || new Date().toISOString().split("T")[0],
      injury_mechanism: injuryData.mechanism,
      activity_at_injury: injuryData.activity,
      diagnosis: injuryData.diagnosis,
      recovery_status: "active",
      current_phase: "Phase 1",
      rtp_progress: 0,
      expected_return_date: injuryData.expectedReturn,
      activity_restrictions: injuryData.restrictions || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {throw error;}
  return data;
}

// Helper functions
function calculateRiskLevel(acwr, injuries) {
  if (!acwr) {return "unknown";}

  // High risk if ACWR > 1.5 or < 0.8
  if (acwr > 1.5 || acwr < 0.8) {return "high";}

  // Medium risk if recovering from injury
  if (injuries?.some((i) => ["recovering", "rehab"].includes(i.recovery_status))) {
    return "medium";
  }

  // Medium risk if ACWR between 1.3-1.5
  if (acwr > 1.3) {return "medium";}

  return "low";
}

function calculateRiskIndicators(loadHistory, injuries) {
  const indicators = {
    acwrRisk: "low",
    loadSpike: false,
    recentInjury: false,
    recurrenceRisk: false,
  };

  if (loadHistory && loadHistory.length > 0) {
    const latestAcwr = loadHistory[0]?.acwr;
    if (latestAcwr > 1.5) {indicators.acwrRisk = "high";}
    else if (latestAcwr > 1.3) {indicators.acwrRisk = "medium";}

    // Check for load spike (>10% increase in last 7 days)
    if (loadHistory.length >= 7) {
      const recentAvg = loadHistory.slice(0, 7).reduce((sum, d) => sum + (d.acute_load || 0), 0) / 7;
      const previousAvg = loadHistory.slice(7, 14).reduce((sum, d) => sum + (d.acute_load || 0), 0) / 
        Math.min(7, loadHistory.length - 7);
      if (previousAvg > 0 && (recentAvg - previousAvg) / previousAvg > 0.1) {
        indicators.loadSpike = true;
      }
    }
  }

  if (injuries) {
    // Recent injury in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    indicators.recentInjury = injuries.some(
      (i) => new Date(i.injury_date) > thirtyDaysAgo
    );

    // Recurrence risk - same injury type occurred before
    const injuryTypes = injuries.map((i) => i.injury_type);
    indicators.recurrenceRisk = injuryTypes.length !== new Set(injuryTypes).size;
  }

  return indicators;
}

// Main handler
async function handler(event) {
  return baseHandler(event, async (event, userId) => {
    const path = event.path.replace("/.netlify/functions/staff-physiotherapist", "");
    const method = event.httpMethod;

    // Verify physiotherapist access
    const access = await verifyPhysioAccess(userId);
    if (!access) {
      return createErrorResponse(403, "Access denied. Physiotherapist role required.");
    }

    const teamId = access.team_id;

    // GET /athletes - Get all athletes with physio status
    if (method === "GET" && (path === "" || path === "/" || path === "/athletes")) {
      const athletes = await getAthletePhysioOverview(teamId);
      return createSuccessResponse({ athletes });
    }

    // GET /athletes/:id - Get detailed injury data for athlete
    if (method === "GET" && path.match(/^\/athletes\/[\w-]+$/)) {
      const athleteId = path.split("/")[2];
      const details = await getAthleteInjuryDetails(athleteId);
      return createSuccessResponse(details);
    }

    // GET /rtp - Get Return-to-Play athletes
    if (method === "GET" && path === "/rtp") {
      const rtpAthletes = await getRTPAthletes(teamId);
      return createSuccessResponse({ athletes: rtpAthletes });
    }

    // PUT /rtp/:injuryId - Update RTP progress
    if (method === "PUT" && path.match(/^\/rtp\/[\w-]+$/)) {
      const injuryId = path.split("/")[2];
      const body = JSON.parse(event.body || "{}");
      const updated = await updateRTPProgress(injuryId, body);
      return createSuccessResponse({ injury: updated });
    }

    // GET /summary - Team injury summary
    if (method === "GET" && path === "/summary") {
      const summary = await getTeamInjurySummary(teamId);
      return createSuccessResponse(summary);
    }

    // POST /injuries - Log new injury
    if (method === "POST" && path === "/injuries") {
      const body = JSON.parse(event.body || "{}");
      if (!body.userId || !body.type || !body.location) {
        return createErrorResponse(400, "Missing required fields: userId, type, location");
      }
      const injury = await logInjury(body.userId, body);
      return createSuccessResponse({ injury });
    }

    return createErrorResponse(404, "Endpoint not found");
  });
}

module.exports = { handler };
