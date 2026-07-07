import { supabaseAdmin } from "../../supabase-client.js";
import { createLogger } from "../structured-logger.js";

const logger = createLogger({ service: "netlify.ai-chat" });

// =====================================================
// PHASE 3: USER PREFERENCE LEARNING
// =====================================================

/**
 * Get or create user AI preferences
 *
 * @param {string} userId - User ID
 * @returns {Object} User preferences with normalized fields
 */
export async function getUserAIPreferences(userId) {
  try {
    const { data, error } = await supabaseAdmin
      .from("user_ai_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      logger.error("ai_chat_user_preferences_fetch_failed", error, {
        user_id: userId,
      });
    }

    if (data) {
      // Normalize DB schema to expected format
      return {
        ...data,
        preferred_detail_level: data.verbosity || "balanced",
        preferred_tone: data.tone || "friendly",
        favorite_topics: data.focus_areas || [],
        // These fields are stored in metadata or defaults
        include_citations: true,
        include_warnings: true,
        total_interactions: 0,
        helpful_responses: 0,
        dismissed_responses: 0,
        completed_sessions: 0,
      };
    }

    // Create default preferences if none exist
    const defaultDBPreferences = {
      user_id: userId,
      tone: "friendly",
      verbosity: "balanced",
      proactive_suggestions: true,
      reminder_frequency: "moderate",
      focus_areas: [],
      avoided_topics: [],
      language_preference: "en",
    };

    const { data: newPrefs, error: insertError } = await supabaseAdmin
      .from("user_ai_preferences")
      .insert(defaultDBPreferences)
      .select()
      .single();

    if (insertError) {
      logger.error("ai_chat_user_preferences_create_failed", insertError, {
        user_id: userId,
      });
      // Return normalized defaults even if insert fails
      return {
        ...defaultDBPreferences,
        preferred_detail_level: "balanced",
        preferred_tone: "friendly",
        favorite_topics: [],
        include_citations: true,
        include_warnings: true,
        total_interactions: 0,
        helpful_responses: 0,
        dismissed_responses: 0,
        completed_sessions: 0,
      };
    }

    return {
      ...newPrefs,
      preferred_detail_level: newPrefs?.verbosity || "balanced",
      preferred_tone: newPrefs?.tone || "friendly",
      favorite_topics: newPrefs?.focus_areas || [],
      include_citations: true,
      include_warnings: true,
      total_interactions: 0,
      helpful_responses: 0,
      dismissed_responses: 0,
      completed_sessions: 0,
    };
  } catch (error) {
    logger.error("ai_chat_user_preferences_handler_failed", error, {
      user_id: userId,
    });
    return null;
  }
}

/**
 * Update user preferences based on interaction
 * Learns from user behavior to improve future responses
 * Note: Some tracking fields are stored in metadata since DB schema is limited
 *
 * @param {string} userId - User ID
 * @param {Object} interaction - Interaction data
 */
export async function updateUserPreferences(userId, interaction) {
  try {
    const { topic, wasDismissed } = interaction;

    // Get current preferences
    const prefs = await getUserAIPreferences(userId);
    if (!prefs) {
      return;
    }

    const updates = {
      updated_at: new Date().toISOString(),
    };

    // Update focus_areas (favorite topics) - maps to DB column
    if (topic && !wasDismissed) {
      const currentFocusAreas = prefs.focus_areas || [];
      if (!currentFocusAreas.includes(topic) && currentFocusAreas.length < 10) {
        updates.focus_areas = [...currentFocusAreas, topic];
      }
    }

    // Track avoided topics (dismissed multiple times) - maps to DB column
    if (topic && wasDismissed) {
      const currentAvoided = prefs.avoided_topics || [];
      if (!currentAvoided.includes(topic) && currentAvoided.length < 10) {
        updates.avoided_topics = [...currentAvoided, topic];
      }
    }

    // Only update if there are changes beyond timestamp
    if (Object.keys(updates).length > 1) {
      await supabaseAdmin
        .from("user_ai_preferences")
        .update(updates)
        .eq("user_id", userId);
    }
  } catch (error) {
    logger.error("ai_chat_user_preferences_update_failed", error, {
      user_id: userId,
    });
  }
}

/**
 * Get position-specific focus areas for personalized recommendations
 *
 * @param {string} position - User's position
 * @returns {Object} Position-specific focus areas
 */
export function getPositionFocusAreas(position) {
  const focusAreas = {
    QB: {
      primary: [
        "arm_care",
        "footwork",
        "pocket_presence",
        "throwing_mechanics",
      ],
      secondary: ["decision_making", "leadership", "field_vision"],
      recovery: ["arm_recovery", "hip_mobility", "shoulder_stability"],
    },
    WR: {
      primary: ["route_running", "catching", "acceleration", "separation"],
      secondary: ["blocking", "field_awareness", "contested_catches"],
      recovery: ["hip_flexibility", "ankle_stability", "hamstring_care"],
    },
    RB: {
      primary: ["agility", "vision", "cutting", "ball_security"],
      secondary: ["receiving", "pass_protection", "endurance"],
      recovery: ["knee_stability", "hip_mobility", "core_strength"],
    },
    TE: {
      primary: ["blocking", "receiving", "route_running", "strength"],
      secondary: ["field_awareness", "versatility"],
      recovery: ["shoulder_stability", "hip_mobility", "back_care"],
    },
    OL: {
      primary: ["blocking", "footwork", "hand_placement", "strength"],
      secondary: ["communication", "endurance"],
      recovery: ["hip_mobility", "knee_stability", "shoulder_care"],
    },
    DL: {
      primary: ["pass_rush", "run_stopping", "hand_fighting", "explosiveness"],
      secondary: ["conditioning", "technique_variety"],
      recovery: ["shoulder_stability", "back_care", "hip_mobility"],
    },
    LB: {
      primary: ["tackling", "coverage", "blitzing", "field_reading"],
      secondary: ["leadership", "versatility"],
      recovery: ["knee_stability", "hip_mobility", "shoulder_care"],
    },
    DB: {
      primary: ["coverage", "ball_skills", "tackling", "speed"],
      secondary: ["film_study", "communication", "return_game"],
      recovery: ["hip_flexibility", "hamstring_care", "ankle_stability"],
    },
    K: {
      primary: ["kicking_mechanics", "consistency", "mental_focus"],
      secondary: ["leg_strength", "flexibility"],
      recovery: ["hip_flexibility", "leg_recovery", "back_care"],
    },
    P: {
      primary: ["punting_mechanics", "hang_time", "directional_punting"],
      secondary: ["leg_strength", "consistency"],
      recovery: ["hip_flexibility", "leg_recovery", "core_stability"],
    },
  };

  // Default for general/unknown positions
  const defaultFocus = {
    primary: ["speed", "agility", "conditioning", "technique"],
    secondary: ["strength", "flexibility", "mental_focus"],
    recovery: ["full_body_mobility", "sleep", "nutrition"],
  };

  return focusAreas[position?.toUpperCase()] || defaultFocus;
}

/**
 * Build personalized prompt additions based on user preferences
 *
 * @param {Object} preferences - User AI preferences
 * @param {Object} userContext - User context
 * @returns {string} Personalization prompt addition
 */
export function buildPersonalizationPrompt(preferences, userContext) {
  const additions = [];

  if (!preferences) {
    return "";
  }

  // Adjust detail level
  if (preferences.preferred_detail_level === "brief") {
    additions.push("Keep responses concise and to the point.");
  } else if (preferences.preferred_detail_level === "detailed") {
    additions.push("Provide comprehensive, detailed explanations.");
  }

  // Adjust tone
  if (preferences.preferred_tone === "professional") {
    additions.push("Use a professional, technical tone.");
  } else if (preferences.preferred_tone === "casual") {
    additions.push("Use a friendly, casual tone.");
  }

  // Position-specific focus
  if (userContext.position) {
    const focus = getPositionFocusAreas(userContext.position);
    additions.push(
      `Consider position-specific needs for ${userContext.position}: focus on ${focus.primary.slice(0, 2).join(", ")}.`,
    );
  }

  // Consider favorite topics
  if (preferences.favorite_topics?.length > 0) {
    additions.push(
      `User frequently asks about: ${preferences.favorite_topics.slice(0, 3).join(", ")}.`,
    );
  }

  // Consider avoided topics
  if (preferences.avoided_topics?.length > 0) {
    additions.push(
      `User has shown less interest in: ${preferences.avoided_topics.slice(0, 3).join(", ")}.`,
    );
  }

  return additions.length > 0
    ? `\n\nPersonalization notes:\n${additions.map((a) => `- ${a}`).join("\n")}`
    : "";
}
