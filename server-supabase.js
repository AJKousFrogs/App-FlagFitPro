/**
 * Supabase Client for Development Server
 * Provides real data access for local development
 */

import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    "[Server] Warning: Supabase credentials not found. Some features will return mock data.",
  );
}

export const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export const isSupabaseConfigured = () => !!supabase;

/**
 * Get user from authorization header (JWT token)
 */
export async function getUserFromToken(authHeader) {
  if (!supabase || !authHeader) {
    return null;
  }

  try {
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

/**
 * Search knowledge base for AI Chat
 */
export async function searchKnowledgeBase(query, limit = 5) {
  if (!supabase) {
    return [];
  }

  try {
    const searchTerms = query
      .toLowerCase()
      .split(/\s+/)
      .filter((term) => term.length > 3);
    const searchQuery = searchTerms.slice(0, 5).join(" ");

    // Method 1: Full-text search
    const { data: results } = await supabase
      .from("knowledge_base_entries")
      .select(
        "id, title, content, category, subcategory, source_type, evidence_grade, source_quality_score",
      )
      .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
      .eq("is_active", true)
      .order("source_quality_score", { ascending: false, nullsFirst: false })
      .limit(limit);

    if (results && results.length > 0) {
      return results;
    }

    // Method 2: Category matching
    const categoryKeywords = {
      sleep: "recovery",
      rest: "recovery",
      tired: "recovery",
      recovery: "recovery",
      hydration: "nutrition",
      water: "nutrition",
      drink: "nutrition",
      eat: "nutrition",
      food: "nutrition",
      nutrition: "nutrition",
      rpe: "training_load",
      acwr: "training_load",
      load: "training_load",
      training: "training",
      workout: "training",
      exercise: "training",
      agility: "training",
      speed: "training",
      injury: "injury_prevention",
      prevent: "injury_prevention",
      acl: "injury_prevention",
      ankle: "injury_prevention",
      warmup: "game_preparation",
      "warm up": "game_preparation",
      stretch: "game_preparation",
      quarterback: "position_training",
      qb: "position_training",
      receiver: "position_training",
      wr: "position_training",
      visualization: "mental_performance",
      anxiety: "mental_performance",
      mental: "mental_performance",
    };

    let matchedCategory = null;
    for (const [keyword, category] of Object.entries(categoryKeywords)) {
      if (query.toLowerCase().includes(keyword)) {
        matchedCategory = category;
        break;
      }
    }

    if (matchedCategory) {
      const { data: categoryResults } = await supabase
        .from("knowledge_base_entries")
        .select(
          "id, title, content, category, subcategory, source_type, evidence_grade, source_quality_score",
        )
        .eq("category", matchedCategory)
        .eq("is_active", true)
        .order("source_quality_score", { ascending: false, nullsFirst: false })
        .limit(limit);

      if (categoryResults && categoryResults.length > 0) {
        return categoryResults;
      }
    }

    // Method 3: Fallback to FAQ
    const { data: faqResults } = await supabase
      .from("knowledge_base_entries")
      .select(
        "id, title, content, category, subcategory, source_type, evidence_grade, source_quality_score",
      )
      .eq("category", "faq")
      .eq("is_active", true)
      .limit(3);

    return faqResults || [];
  } catch (error) {
    console.error("[Server] Knowledge base search error:", error);
    return [];
  }
}

/**
 * Get training sessions for user
 */
export async function getTrainingSessions(userId, limit = 20) {
  if (!supabase) {
    return [];
  }

  try {
    const { data } = await supabase
      .from("training_sessions")
      .select("*")
      .or(`user_id.eq.${userId},athlete_id.eq.${userId}`)
      .order("session_date", { ascending: false })
      .limit(limit);

    return data || [];
  } catch (error) {
    console.error("[Server] Error fetching training sessions:", error);
    return [];
  }
}

/**
 * Get exercises from library
 */
export async function getExercises(category = null, limit = 50) {
  if (!supabase) {
    return [];
  }

  try {
    let query = supabase.from("exercises").select("*").eq("is_active", true);

    if (category) {
      query = query.eq("category", category);
    }

    const { data } = await query.order("name").limit(limit);
    return data || [];
  } catch (error) {
    console.error("[Server] Error fetching exercises:", error);
    return [];
  }
}

/**
 * Get user profile
 */
export async function getUserProfile(userId) {
  if (!supabase) {
    return null;
  }

  try {
    const { data } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    return data;
  } catch {
    return null;
  }
}

/**
 * Calculate ACWR for user
 */
export async function calculateACWR(userId) {
  if (!supabase) {
    return { acwr: null, riskZone: "unknown" };
  }

  try {
    const today = new Date();
    const acuteStartDate = new Date(today);
    acuteStartDate.setDate(acuteStartDate.getDate() - 7);
    const chronicStartDate = new Date(today);
    chronicStartDate.setDate(chronicStartDate.getDate() - 28);

    const { data: sessions } = await supabase
      .from("training_sessions")
      .select("session_date, duration_minutes, rpe, intensity_level")
      .or(`user_id.eq.${userId},athlete_id.eq.${userId}`)
      .gte("session_date", chronicStartDate.toISOString().split("T")[0])
      .lte("session_date", today.toISOString().split("T")[0])
      .in("status", ["completed", "in_progress"]);

    if (!sessions || sessions.length === 0) {
      return {
        acwr: null,
        riskZone: "insufficient_data",
        message: "No training data available",
      };
    }

    const sessionsWithLoad = sessions.map((s) => ({
      ...s,
      load: (s.duration_minutes || 60) * (s.rpe || s.intensity_level || 5),
      date: new Date(s.session_date),
    }));

    const acuteSessions = sessionsWithLoad.filter(
      (s) => s.date >= acuteStartDate && s.date <= today,
    );
    const acuteLoad = acuteSessions.reduce((sum, s) => sum + s.load, 0);
    const chronicLoad = sessionsWithLoad.reduce((sum, s) => sum + s.load, 0);
    const chronicAverage = chronicLoad / 4;

    if (chronicAverage === 0) {
      return {
        acwr: acuteLoad > 0 ? 99 : 0,
        riskZone: acuteLoad > 0 ? "danger" : "insufficient_data",
      };
    }

    const acwr = acuteLoad / chronicAverage;

    let riskZone;
    if (acwr < 0.8) {
      riskZone = "detraining";
    } else if (acwr <= 1.3) {
      riskZone = "optimal";
    } else if (acwr <= 1.5) {
      riskZone = "caution";
    } else {
      riskZone = "danger";
    }

    return {
      acwr: parseFloat(acwr.toFixed(2)),
      riskZone,
      acuteLoad,
      chronicLoad: parseFloat(chronicAverage.toFixed(2)),
      sessionCount: sessions.length,
    };
  } catch (error) {
    console.error("[Server] Error calculating ACWR:", error);
    return { acwr: null, riskZone: "error" };
  }
}

/**
 * Get team data
 */
export async function getTeamData(teamId) {
  if (!supabase || !teamId) {
    return null;
  }

  try {
    const { data: team } = await supabase
      .from("teams")
      .select("*")
      .eq("id", teamId)
      .single();

    if (!team) {
      return null;
    }

    const { data: members } = await supabase
      .from("team_members")
      .select(
        `
        id,
        role,
        jersey_number,
        position,
        user_id,
        users:user_id (
          id,
          email,
          full_name
        )
      `,
      )
      .eq("team_id", teamId)
      .eq("status", "active");

    return { ...team, members: members || [] };
  } catch (error) {
    console.error("[Server] Error fetching team data:", error);
    return null;
  }
}

/**
 * Get wellness data for user
 */
export async function getWellnessData(userId, days = 7) {
  if (!supabase) {
    return [];
  }

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data } = await supabase
      .from("wellness_checkins")
      .select("*")
      .eq("user_id", userId)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false });

    return data || [];
  } catch (error) {
    console.error("[Server] Error fetching wellness data:", error);
    return [];
  }
}

export default {
  supabase,
  isSupabaseConfigured,
  getUserFromToken,
  searchKnowledgeBase,
  getTrainingSessions,
  getExercises,
  getUserProfile,
  calculateACWR,
  getTeamData,
  getWellnessData,
};
