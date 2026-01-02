const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: "Missing authorization" }),
      };
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: "Invalid token" }),
      };
    }

    const method = event.httpMethod;

    // GET - Get checkin for a date
    if (method === "GET") {
      const params = event.queryStringParameters || {};
      const date = params.date || new Date().toISOString().split("T")[0];
      return await getCheckin(supabase, user.id, date, headers);
    }

    // POST - Save checkin
    if (method === "POST") {
      const payload = JSON.parse(event.body || "{}");
      return await saveCheckin(supabase, user.id, payload, headers);
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: "Not found" }),
    };
  } catch (error) {
    console.error("Wellness checkin error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

async function getCheckin(supabase, userId, date, headers) {
  const { data, error } = await supabase
    .from("daily_wellness_checkin")
    .select("*")
    .eq("user_id", userId)
    .eq("checkin_date", date)
    .single();

  if (error && error.code !== "PGRST116") {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }

  if (!data) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, data: null }),
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      data: {
        sleepQuality: data.sleep_quality,
        sleepHours: data.sleep_hours,
        energyLevel: data.energy_level,
        muscleSoreness: data.muscle_soreness,
        stressLevel: data.stress_level,
        sorenessAreas: data.soreness_areas || [],
        notes: data.notes,
        readinessScore: data.readiness_score,
      },
    }),
  };
}

async function saveCheckin(supabase, userId, payload, headers) {
  const {
    date,
    sleepQuality,
    sleepHours,
    energyLevel,
    muscleSoreness,
    stressLevel,
    sorenessAreas,
    notes,
    readinessScore,
  } = payload;

  const targetDate = date || new Date().toISOString().split("T")[0];

  // Calculate readiness if not provided
  const calculatedReadiness = readinessScore || calculateReadiness(payload);

  // Upsert the checkin
  const { data, error } = await supabase
    .from("daily_wellness_checkin")
    .upsert(
      {
        user_id: userId,
        checkin_date: targetDate,
        sleep_quality: sleepQuality,
        sleep_hours: sleepHours,
        energy_level: energyLevel,
        muscle_soreness: muscleSoreness,
        stress_level: stressLevel,
        soreness_areas: sorenessAreas || [],
        notes,
        readiness_score: calculatedReadiness,
      },
      {
        onConflict: "user_id,checkin_date",
      }
    )
    .select()
    .single();

  if (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }

  // Update wellness streak
  try {
    await supabase.rpc("update_player_streak", {
      p_user_id: userId,
      p_streak_type: "wellness",
      p_activity_date: targetDate,
    });
  } catch (streakError) {
    console.warn("Could not update wellness streak:", streakError.message);
  }

  // Check for wellness achievements
  try {
    const { data: streak } = await supabase
      .from("player_streaks")
      .select("current_streak")
      .eq("user_id", userId)
      .eq("streak_type", "wellness")
      .single();

    if (streak) {
      if (streak.current_streak >= 7) {
        await supabase.rpc("award_achievement", {
          p_user_id: userId,
          p_achievement_slug: "wellness_streak_7",
          p_context: JSON.stringify({ streak: streak.current_streak }),
        });
      }
      if (streak.current_streak >= 30) {
        await supabase.rpc("award_achievement", {
          p_user_id: userId,
          p_achievement_slug: "wellness_streak_30",
          p_context: JSON.stringify({ streak: streak.current_streak }),
        });
      }
    }

    // High readiness achievement
    if (calculatedReadiness >= 90) {
      await supabase.rpc("award_achievement", {
        p_user_id: userId,
        p_achievement_slug: "high_readiness",
        p_context: JSON.stringify({ score: calculatedReadiness }),
      });
    }
  } catch (achievementError) {
    console.warn("Could not check achievements:", achievementError.message);
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      data: {
        sleepQuality: data.sleep_quality,
        sleepHours: data.sleep_hours,
        energyLevel: data.energy_level,
        muscleSoreness: data.muscle_soreness,
        stressLevel: data.stress_level,
        sorenessAreas: data.soreness_areas || [],
        notes: data.notes,
        readinessScore: data.readiness_score,
      },
    }),
  };
}

function calculateReadiness(data) {
  const { sleepQuality, sleepHours, energyLevel, muscleSoreness, stressLevel } = data;

  // Weighted average formula
  const sleepQualityScore = ((sleepQuality || 3) / 5) * 100;
  const sleepHoursScore = Math.min(100, (((sleepHours || 7) - 4) / 4) * 100);
  const energyScore = ((energyLevel || 3) / 5) * 100;
  const sorenessScore = ((muscleSoreness || 3) / 5) * 100;
  const stressScore = ((stressLevel || 3) / 5) * 100;

  const weighted =
    sleepQualityScore * 0.3 +
    sleepHoursScore * 0.15 +
    energyScore * 0.25 +
    sorenessScore * 0.15 +
    stressScore * 0.15;

  return Math.round(weighted);
}
