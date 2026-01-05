// Netlify Function: Staff Psychology API
// Handles mental performance data, wellness reports, and psychological assessments

const { baseHandler } = require("./utils/base-handler.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("./utils/error-handler.cjs");
const { supabaseAdmin } = require("./supabase-client.cjs");

/**
 * Verify user is a staff member with psychology access
 * Or athlete viewing their own data
 */
async function verifyPsychologyAccess(userId, targetUserId = null) {
  // If viewing own data, allow
  if (targetUserId && userId === targetUserId) {
    return { access: "self", teamId: null };
  }

  const { data: member, error } = await supabaseAdmin
    .from("team_members")
    .select("role, team_id")
    .eq("user_id", userId)
    .in("role", ["sports_psychologist", "coach", "admin", "staff"])
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return member ? { access: "staff", teamId: member.team_id } : null;
}

/**
 * Get mental performance logs for athlete
 */
async function getMentalPerformanceLogs(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabaseAdmin
    .from("mental_performance_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("log_date", startDate.toISOString().split("T")[0])
    .order("log_date", { ascending: true });

  if (error) {throw error;}
  return data || [];
}

/**
 * Get psychological assessments
 */
async function getPsychologicalAssessments(userId) {
  const { data, error } = await supabaseAdmin
    .from("psychological_assessments")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {throw error;}
  return data || [];
}

/**
 * Get wellness trends for mental analysis
 */
async function getWellnessTrends(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabaseAdmin
    .from("wellness_entries")
    .select("date, mood, stress_level, sleep_quality, motivation_level, energy_level")
    .or(`user_id.eq.${userId},athlete_id.eq.${userId}`)
    .gte("date", startDate.toISOString().split("T")[0])
    .order("date", { ascending: true });

  if (error) {throw error;}
  return data || [];
}

/**
 * Generate mental wellness report
 */
async function generateMentalWellnessReport(userId, options = {}) {
  const { days = 30, includePrivate: _includePrivate = false } = options;

  // Get mental performance data
  const mentalLogs = await getMentalPerformanceLogs(userId, days);
  const wellness = await getWellnessTrends(userId, days);
  const assessments = await getPsychologicalAssessments(userId);

  // Calculate averages
  const avgMetrics = {
    confidence: calculateAverage(mentalLogs, "confidence_level"),
    focus: calculateAverage(mentalLogs, "focus_level"),
    motivation: calculateAverage(mentalLogs, "motivation_level") || calculateAverage(wellness, "motivation_level"),
    anxiety: calculateAverage(mentalLogs, "anxiety_level"),
    mood: calculateAverage(wellness, "mood"),
    stress: calculateAverage(wellness, "stress_level"),
    sleepQuality: calculateAverage(wellness, "sleep_quality"),
    energy: calculateAverage(wellness, "energy_level"),
  };

  // Identify patterns
  const patterns = identifyPatterns(mentalLogs, wellness);

  // Generate recommendations
  const recommendations = generateMentalRecommendations(avgMetrics, patterns);

  const report = {
    generatedAt: new Date().toISOString(),
    period: { days, startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString() },
    averageMetrics: avgMetrics,
    trends: {
      mentalPerformance: mentalLogs.map((l) => ({
        date: l.log_date,
        confidence: l.confidence_level,
        focus: l.focus_level,
        anxiety: l.anxiety_level,
      })),
      wellness: wellness.map((w) => ({
        date: w.date,
        mood: w.mood,
        stress: w.stress_level,
        sleep: w.sleep_quality,
      })),
    },
    patterns,
    recommendations,
    recentAssessments: assessments.slice(0, 3).map((a) => ({
      type: a.assessment_type,
      score: a.score,
      date: a.completed_at || a.created_at,
      requiresReview: a.requires_professional_review,
    })),
  };

  // Save report to database
  await supabaseAdmin.from("mental_wellness_reports").insert({
    user_id: userId,
    report_type: "wellness",
    report_data: report,
    generated_at: new Date().toISOString(),
  }).select();

  return report;
}

/**
 * Generate pre-competition mental assessment
 */
async function generatePreCompetitionReport(userId, gameDate) {
  // Get recent mental data
  const mentalLogs = await getMentalPerformanceLogs(userId, 7);
  const wellness = await getWellnessTrends(userId, 7);

  // Latest entry
  const latestMental = mentalLogs[mentalLogs.length - 1] || {};
  const latestWellness = wellness[wellness.length - 1] || {};

  // Calculate readiness score
  const readinessFactors = {
    confidence: latestMental.confidence_level || 5,
    focus: latestMental.focus_level || 5,
    motivation: latestMental.motivation_level || latestWellness.motivation_level || 5,
    preGameNerves: latestMental.pre_game_nerves || 5,
    sleepQuality: latestWellness.sleep_quality || 5,
    energy: latestWellness.energy_level || 5,
    stress: 10 - (latestWellness.stress_level || 5), // Invert stress
  };

  const readinessScore = Math.round(
    Object.values(readinessFactors).reduce((sum, v) => sum + v, 0) / Object.keys(readinessFactors).length
  );

  const report = {
    gameDate,
    generatedAt: new Date().toISOString(),
    readinessScore,
    readinessLevel: readinessScore >= 7 ? "optimal" : readinessScore >= 5 ? "moderate" : "concern",
    factors: readinessFactors,
    focusAreas: [],
    mentalPrep: [],
  };

  // Add focus areas based on weaknesses
  if (readinessFactors.confidence < 5) {
    report.focusAreas.push("Build confidence through visualization of past successes");
  }
  if (readinessFactors.preGameNerves > 6) {
    report.focusAreas.push("Practice breathing exercises to manage pre-game anxiety");
  }
  if (readinessFactors.focus < 5) {
    report.focusAreas.push("Use focus cues and establish pre-game routine");
  }
  if (readinessFactors.sleepQuality < 5) {
    report.focusAreas.push("Prioritize sleep quality in days leading up to competition");
  }

  // Mental prep suggestions
  report.mentalPrep = [
    "Complete visualization session (10-15 min)",
    "Review game plan and key assignments",
    "Practice breathing exercises",
    "Positive self-talk and affirmations",
  ];

  return report;
}

/**
 * Create psychological assessment
 */
async function createAssessment(userId, assessmentData) {
  const { data, error } = await supabaseAdmin
    .from("psychological_assessments")
    .insert({
      user_id: userId,
      coach_id: assessmentData.coachId,
      assessment_type: assessmentData.type,
      questions: assessmentData.questions,
      responses: assessmentData.responses,
      score: assessmentData.score,
      interpretation: assessmentData.interpretation,
      recommendations: assessmentData.recommendations,
      requires_professional_review: assessmentData.requiresReview || false,
      completed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {throw error;}
  return data;
}

/**
 * Log mental performance entry
 */
async function logMentalPerformance(userId, logData) {
  const { data, error } = await supabaseAdmin
    .from("mental_performance_logs")
    .insert({
      user_id: userId,
      log_date: logData.date || new Date().toISOString().split("T")[0],
      confidence_level: logData.confidence,
      focus_level: logData.focus,
      motivation_level: logData.motivation,
      anxiety_level: logData.anxiety,
      pre_game_nerves: logData.preGameNerves,
      visualization_completed: logData.visualizationCompleted,
      mental_rehearsal_minutes: logData.mentalRehearsalMinutes,
      decision_making_clarity: logData.decisionMaking,
      reaction_time_feeling: logData.reactionTime,
      life_stress_level: logData.lifeStress,
      mental_readiness_score: logData.readinessScore,
      context: logData.context,
      notes: logData.notes,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {throw error;}
  return data;
}

/**
 * Get athlete mental overview (for staff)
 */
async function getTeamMentalOverview(teamId) {
  const { data: members } = await supabaseAdmin
    .from("team_members")
    .select("user_id, users:user_id(full_name, position)")
    .eq("team_id", teamId)
    .eq("role", "player");

  const overview = [];

  for (const member of members || []) {
    const userId = member.user_id;

    // Get latest mental log
    const { data: mentalLog } = await supabaseAdmin
      .from("mental_performance_logs")
      .select("*")
      .eq("user_id", userId)
      .order("log_date", { ascending: false })
      .limit(1)
      .single();

    // Get latest wellness
    const { data: wellness } = await supabaseAdmin
      .from("wellness_entries")
      .select("mood, stress_level, motivation_level")
      .or(`user_id.eq.${userId},athlete_id.eq.${userId}`)
      .order("date", { ascending: false })
      .limit(1)
      .single();

    // Calculate overall mental wellness score
    const scores = [
      mentalLog?.confidence_level,
      mentalLog?.focus_level,
      mentalLog?.motivation_level || wellness?.motivation_level,
      wellness?.mood,
      10 - (wellness?.stress_level || 5),
    ].filter(Boolean);

    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;

    overview.push({
      athleteId: userId,
      athleteName: member.users?.full_name || "Unknown",
      position: member.users?.position,
      mentalWellnessScore: avgScore,
      confidence: mentalLog?.confidence_level,
      focus: mentalLog?.focus_level,
      stress: wellness?.stress_level,
      mood: wellness?.mood,
      lastLogDate: mentalLog?.log_date || wellness?.date,
      needsAttention: avgScore !== null && avgScore < 5,
    });
  }

  return overview;
}

// Helper functions
function calculateAverage(data, field) {
  const values = data.map((d) => d[field]).filter((v) => v !== null && v !== undefined);
  if (values.length === 0) {return null;}
  return Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 10) / 10;
}

function identifyPatterns(mentalLogs, wellness) {
  const patterns = [];

  // Check for stress-sleep correlation
  const highStressDays = wellness.filter((w) => w.stress_level >= 7);
  const lowSleepAfterStress = wellness.filter((w, i) => {
    if (i === 0) {return false;}
    const prevDay = wellness[i - 1];
    return prevDay?.stress_level >= 7 && w.sleep_quality <= 4;
  });

  if (highStressDays.length > 3 && lowSleepAfterStress.length > 2) {
    patterns.push({
      type: "stress_sleep",
      description: "High stress days tend to impact sleep quality",
      frequency: "frequent",
    });
  }

  // Check for mood-performance correlation
  const avgMood = calculateAverage(wellness, "mood");
  const avgConfidence = calculateAverage(mentalLogs, "confidence_level");
  if (avgMood && avgConfidence && Math.abs(avgMood - avgConfidence) <= 1) {
    patterns.push({
      type: "mood_confidence",
      description: "Mood and confidence levels are closely correlated",
      frequency: "consistent",
    });
  }

  // Check for low motivation patterns
  const lowMotivationDays = mentalLogs.filter((l) => l.motivation_level <= 4);
  if (lowMotivationDays.length >= mentalLogs.length * 0.3 && mentalLogs.length >= 5) {
    patterns.push({
      type: "low_motivation",
      description: "Experiencing periods of low motivation",
      frequency: "moderate",
    });
  }

  return patterns;
}

function generateMentalRecommendations(metrics, patterns) {
  const recommendations = [];

  if (metrics.anxiety && metrics.anxiety > 6) {
    recommendations.push({
      priority: "high",
      category: "anxiety",
      message: "Consider anxiety management techniques: breathing exercises, progressive muscle relaxation",
    });
  }

  if (metrics.sleepQuality && metrics.sleepQuality < 5) {
    recommendations.push({
      priority: "high",
      category: "sleep",
      message: "Focus on sleep hygiene: consistent schedule, limit screens before bed",
    });
  }

  if (metrics.confidence && metrics.confidence < 5) {
    recommendations.push({
      priority: "medium",
      category: "confidence",
      message: "Build confidence through visualization and reviewing past successes",
    });
  }

  if (patterns.some((p) => p.type === "low_motivation")) {
    recommendations.push({
      priority: "medium",
      category: "motivation",
      message: "Set small achievable goals and celebrate progress to boost motivation",
    });
  }

  if (metrics.stress && metrics.stress > 6) {
    recommendations.push({
      priority: "medium",
      category: "stress",
      message: "Implement stress management: mindfulness, time management, social support",
    });
  }

  return recommendations;
}

// Main handler
async function handler(event) {
  return baseHandler(event, async (event, userId) => {
    const path = event.path.replace("/.netlify/functions/staff-psychology", "");
    const method = event.httpMethod;
    const params = event.queryStringParameters || {};

    // For self-access routes
    const targetUserId = params.athleteId || userId;

    // Verify access
    const access = await verifyPsychologyAccess(userId, targetUserId);
    if (!access) {
      return createErrorResponse(403, "Access denied");
    }

    // GET /my-data - Get own mental data (athlete self-service)
    if (method === "GET" && path === "/my-data") {
      const days = parseInt(params.days || "30");
      const [mentalLogs, wellness, assessments] = await Promise.all([
        getMentalPerformanceLogs(userId, days),
        getWellnessTrends(userId, days),
        getPsychologicalAssessments(userId),
      ]);
      return createSuccessResponse({ mentalLogs, wellness, assessments });
    }

    // POST /my-data/log - Log mental performance (athlete self-service)
    if (method === "POST" && path === "/my-data/log") {
      const body = JSON.parse(event.body || "{}");
      const log = await logMentalPerformance(userId, body);
      return createSuccessResponse({ log });
    }

    // POST /reports/wellness - Generate wellness report
    if (method === "POST" && path === "/reports/wellness") {
      const body = JSON.parse(event.body || "{}");
      const reportUserId = body.athleteId || userId;

      // Verify access to target user's data
      const canAccess = await verifyPsychologyAccess(userId, reportUserId);
      if (!canAccess) {
        return createErrorResponse(403, "Access denied to athlete data");
      }

      const report = await generateMentalWellnessReport(reportUserId, body);
      return createSuccessResponse({ report });
    }

    // POST /reports/pre-competition - Generate pre-competition report
    if (method === "POST" && path === "/reports/pre-competition") {
      const body = JSON.parse(event.body || "{}");
      const reportUserId = body.athleteId || userId;
      const gameDate = body.gameDate || new Date().toISOString().split("T")[0];

      const report = await generatePreCompetitionReport(reportUserId, gameDate);
      return createSuccessResponse({ report });
    }

    // Staff-only routes
    if (access.access === "staff") {
      // GET /team - Get team mental overview
      if (method === "GET" && path === "/team") {
        const overview = await getTeamMentalOverview(access.teamId);
        return createSuccessResponse({ athletes: overview });
      }

      // GET /athletes/:id - Get athlete mental data
      if (method === "GET" && path.match(/^\/athletes\/[\w-]+$/)) {
        const athleteId = path.split("/")[2];
        const days = parseInt(params.days || "30");
        const [mentalLogs, wellness, assessments] = await Promise.all([
          getMentalPerformanceLogs(athleteId, days),
          getWellnessTrends(athleteId, days),
          getPsychologicalAssessments(athleteId),
        ]);
        return createSuccessResponse({ mentalLogs, wellness, assessments });
      }

      // POST /assessments - Create assessment
      if (method === "POST" && path === "/assessments") {
        const body = JSON.parse(event.body || "{}");
        body.coachId = userId;
        const assessment = await createAssessment(body.athleteId, body);
        return createSuccessResponse({ assessment });
      }
    }

    return createErrorResponse(404, "Endpoint not found");
  });
}

module.exports = { handler };
