// Netlify Function: Recovery Protocol API
// Handles recovery recommendations, protocols, and athlete recovery profiles
//
// Implements evidence-based recovery protocols:
// - Active Recovery (light movement, walking, swimming)
// - Cryotherapy (ice baths, cold showers, localized ice)
// - Heat Therapy (saunas, hot baths, heat packs)
// - Compression (compression garments, pneumatic devices)
// - Manual Therapy (foam rolling, massage, stretching)
// - Sleep Optimization
// - Nutrition Timing for Recovery
//
// =============================================================================

const { baseHandler } = require("./utils/base-handler.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("./utils/error-handler.cjs");
const { supabaseAdmin } = require("./supabase-client.cjs");

// =============================================================================
// RECOVERY PROTOCOL DEFINITIONS
// =============================================================================

const RECOVERY_PROTOCOLS = {
  // Active Recovery
  active_recovery: {
    category: "active_recovery",
    name: "Active Recovery",
    description:
      "Light movement to promote blood flow and reduce muscle stiffness",
    techniques: [
      {
        name: "Light Walking",
        duration: "15-30 minutes",
        intensity: "Very low (50-60% max HR)",
        when: "Day after intense training",
        benefits: ["Promotes blood flow", "Reduces DOMS", "Mental recovery"],
      },
      {
        name: "Swimming/Pool Work",
        duration: "20-30 minutes",
        intensity: "Low",
        when: "1-2 days after intense training",
        benefits: ["Zero impact", "Full body movement", "Cooling effect"],
      },
      {
        name: "Yoga/Light Stretching",
        duration: "20-45 minutes",
        intensity: "Low",
        when: "Any recovery day",
        benefits: ["Flexibility", "Mental relaxation", "Body awareness"],
      },
      {
        name: "Cycling (Easy)",
        duration: "20-30 minutes",
        intensity: "Very low",
        when: "Day after lower body training",
        benefits: ["Low impact", "Leg blood flow", "Active flush"],
      },
    ],
    contraindications: ["Acute injury", "Severe muscle damage", "Illness"],
    evidence_level: "Strong",
  },

  // Cryotherapy Protocols
  cryotherapy: {
    category: "cryotherapy",
    name: "Cold Therapy / Cryotherapy",
    description: "Cold exposure to reduce inflammation and accelerate recovery",
    techniques: [
      {
        name: "Ice Bath (Cold Water Immersion)",
        duration: "10-15 minutes",
        temperature: "10-15°C (50-59°F)",
        when: "Within 30 minutes post-exercise",
        protocol: [
          "Fill tub with cold water and ice",
          "Submerge lower body (or full body)",
          "Stay for 10-15 minutes",
          "Gradually warm up after",
        ],
        benefits: [
          "Reduces inflammation",
          "Decreases muscle soreness",
          "Vasoconstriction",
        ],
        cautions: [
          "Not recommended before strength training",
          "Avoid if you have circulation issues",
        ],
      },
      {
        name: "Cold Shower",
        duration: "3-5 minutes",
        temperature: "Cold (as tolerated)",
        when: "Post-training or morning",
        protocol: [
          "Start with warm water",
          "Gradually decrease temperature",
          "End with 2-5 minutes of cold",
          "Focus on legs and back",
        ],
        benefits: ["Convenient", "Improves alertness", "Mild recovery benefit"],
      },
      {
        name: "Localized Ice Application",
        duration: "15-20 minutes",
        temperature: "Ice pack wrapped in cloth",
        when: "For specific sore areas",
        protocol: [
          "Wrap ice pack in thin towel",
          "Apply to sore muscle/joint",
          "15-20 minutes on, 40 minutes off",
          "Can repeat 2-3 times",
        ],
        benefits: [
          "Targeted relief",
          "Reduces local inflammation",
          "Pain relief",
        ],
      },
      {
        name: "Contrast Therapy",
        duration: "15-20 minutes total",
        temperature: "Alternating hot (38-40°C) and cold (10-15°C)",
        when: "24-48 hours post-exercise",
        protocol: [
          "Start with 3-4 min warm",
          "Switch to 1 min cold",
          "Repeat 3-4 cycles",
          "End on cold",
        ],
        benefits: [
          "Pumping action",
          "Enhanced blood flow",
          "Reduced stiffness",
        ],
      },
    ],
    contraindications: [
      "Raynaud's disease",
      "Cold allergies",
      "Open wounds",
      "Numbness/nerve damage",
    ],
    evidence_level: "Moderate-Strong",
  },

  // Heat Therapy Protocols
  heat_therapy: {
    category: "heat_therapy",
    name: "Heat Therapy",
    description: "Heat application to relax muscles and improve blood flow",
    techniques: [
      {
        name: "Sauna (Traditional/Infrared)",
        duration: "15-20 minutes",
        temperature: "Traditional: 80-100°C, Infrared: 45-60°C",
        when: "2+ hours after training, or rest days",
        protocol: [
          "Hydrate well before",
          "Start with 10-15 minutes",
          "Cool down gradually",
          "Rehydrate after",
        ],
        benefits: [
          "Muscle relaxation",
          "Improved circulation",
          "Heat shock proteins",
          "Mental relaxation",
        ],
        cautions: [
          "Stay hydrated",
          "Avoid alcohol",
          "Not immediately post-exercise",
        ],
      },
      {
        name: "Hot Bath/Epsom Salt Bath",
        duration: "15-20 minutes",
        temperature: "37-40°C (98-104°F)",
        when: "Evening, 2+ hours after training",
        protocol: [
          "Fill tub with warm water",
          "Add 1-2 cups Epsom salts (optional)",
          "Soak for 15-20 minutes",
          "Hydrate during and after",
        ],
        benefits: [
          "Muscle relaxation",
          "Stress relief",
          "Improved sleep",
          "Magnesium absorption (Epsom)",
        ],
      },
      {
        name: "Heat Pack Application",
        duration: "15-20 minutes",
        temperature: "Warm (not hot enough to burn)",
        when: "For chronic tightness, not acute injuries",
        protocol: [
          "Apply heat pack to tight area",
          "Use cloth barrier if needed",
          "15-20 minutes application",
          "Follow with gentle stretching",
        ],
        benefits: [
          "Localized relief",
          "Muscle relaxation",
          "Improved flexibility",
        ],
      },
    ],
    contraindications: [
      "Acute injuries (first 48-72 hours)",
      "Inflammation",
      "Fever",
      "Pregnancy (sauna)",
    ],
    evidence_level: "Moderate",
  },

  // Compression Protocols
  compression: {
    category: "compression",
    name: "Compression Therapy",
    description:
      "External pressure to reduce swelling and improve venous return",
    techniques: [
      {
        name: "Compression Garments",
        duration: "During and post-exercise (2-12 hours)",
        pressure: "15-30 mmHg",
        when: "During exercise and recovery",
        protocol: [
          "Wear properly fitted garments",
          "Can wear during training",
          "Continue 2-12 hours post-exercise",
          "Remove for sleeping (unless prescribed)",
        ],
        benefits: [
          "Reduced muscle oscillation",
          "Improved proprioception",
          "Faster lactate clearance",
        ],
      },
      {
        name: "Pneumatic Compression (NormaTec, etc.)",
        duration: "20-30 minutes",
        pressure: "Sequential compression cycles",
        when: "Post-training recovery sessions",
        protocol: [
          "Apply boots/sleeves",
          "Set to comfortable pressure",
          "20-30 minute session",
          "Can use while resting/stretching",
        ],
        benefits: [
          "Enhanced lymphatic drainage",
          "Reduced swelling",
          "Improved circulation",
        ],
      },
      {
        name: "Elevation + Compression",
        duration: "15-30 minutes",
        when: "Post-training, especially for legs",
        protocol: [
          "Lie down with legs elevated",
          "Wear compression socks/sleeves",
          "15-30 minutes",
          "Combine with breathing exercises",
        ],
        benefits: ["Venous return", "Reduced pooling", "Relaxation"],
      },
    ],
    contraindications: [
      "Peripheral vascular disease",
      "Deep vein thrombosis",
      "Skin infections",
    ],
    evidence_level: "Moderate",
  },

  // Manual Therapy Protocols
  manual_therapy: {
    category: "manual_therapy",
    name: "Manual Therapy & Self-Myofascial Release",
    description: "Hands-on techniques and tools to release muscle tension",
    techniques: [
      {
        name: "Foam Rolling",
        duration: "10-15 minutes",
        when: "Pre-training (brief) or post-training",
        protocol: [
          "Target major muscle groups",
          "30-60 seconds per area",
          "Slow, controlled movements",
          "Pause on tender spots (30 sec)",
          "Breathe through discomfort",
        ],
        areas: [
          "Quads",
          "IT band",
          "Hamstrings",
          "Glutes",
          "Upper back",
          "Lats",
          "Calves",
        ],
        benefits: [
          "Increased ROM",
          "Reduced muscle tension",
          "Improved blood flow",
        ],
      },
      {
        name: "Massage Gun/Percussion Therapy",
        duration: "10-15 minutes total",
        when: "Pre or post-training",
        protocol: [
          "Start on low setting",
          "30-60 seconds per muscle",
          "Move slowly across muscle",
          "Avoid bones and joints",
          "Don't press too hard",
        ],
        benefits: ["Deep tissue stimulation", "Quick application", "Portable"],
      },
      {
        name: "Lacrosse Ball/Trigger Point Release",
        duration: "5-10 minutes",
        when: "For specific tight spots",
        protocol: [
          "Place ball on tight area",
          "Apply body weight pressure",
          "Hold 30-90 seconds",
          "Move slightly to adjacent areas",
          "Breathe and relax into pressure",
        ],
        areas: [
          "Glutes/piriformis",
          "Upper back",
          "Feet",
          "Hip flexors",
          "Pecs",
        ],
        benefits: ["Targeted release", "Inexpensive", "Highly portable"],
      },
      {
        name: "Static Stretching",
        duration: "15-20 minutes",
        when: "Post-training or separate session",
        protocol: [
          "Hold each stretch 30-60 seconds",
          "No bouncing",
          "Breathe deeply",
          "Stretch to mild discomfort, not pain",
          "Focus on tight areas",
        ],
        benefits: ["Improved flexibility", "Reduced tension", "Relaxation"],
      },
      {
        name: "Professional Massage",
        duration: "30-90 minutes",
        frequency: "Weekly or bi-weekly for athletes",
        types: [
          "Sports massage",
          "Deep tissue",
          "Swedish",
          "Myofascial release",
        ],
        benefits: [
          "Expert assessment",
          "Full body treatment",
          "Injury prevention",
        ],
      },
    ],
    contraindications: [
      "Acute injuries",
      "Bruising",
      "Skin conditions",
      "Blood clots",
    ],
    evidence_level: "Moderate-Strong",
  },

  // Sleep Optimization
  sleep: {
    category: "sleep",
    name: "Sleep Optimization",
    description: "Quality sleep is the foundation of recovery",
    recommendations: {
      duration: "7-9 hours for adults, 8-10 for teens",
      timing: "Consistent bed/wake times (±30 min)",
      environment: {
        temperature: "65-68°F (18-20°C)",
        darkness: "Complete darkness or sleep mask",
        noise: "Quiet or white noise",
        bedding: "Comfortable, supportive mattress",
      },
    },
    techniques: [
      {
        name: "Sleep Hygiene Protocol",
        protocol: [
          "Consistent sleep/wake schedule",
          "No screens 1 hour before bed",
          "Cool, dark room",
          "No caffeine after 2 PM",
          "Limit alcohol",
          "Wind-down routine",
        ],
      },
      {
        name: "Pre-Sleep Routine",
        duration: "30-60 minutes before bed",
        protocol: [
          "Dim lights",
          "Light stretching or yoga",
          "Reading (not screens)",
          "Meditation or breathing",
          "Journaling",
        ],
      },
      {
        name: "Napping Strategy",
        duration: "20-30 minutes OR 90 minutes",
        when: "Early afternoon (1-3 PM)",
        caution: "Avoid napping after 3 PM",
        benefits: [
          "Cognitive restoration",
          "Physical recovery",
          "Mood improvement",
        ],
      },
    ],
    evidence_level: "Very Strong",
  },

  // Nutrition for Recovery
  nutrition_recovery: {
    category: "nutrition",
    name: "Recovery Nutrition",
    description: "Proper nutrition timing and composition for optimal recovery",
    windows: [
      {
        name: "Immediate Post-Exercise (0-30 min)",
        priority: "High",
        recommendations: {
          protein: "20-40g fast-digesting (whey, eggs)",
          carbs: "0.5-1g per kg body weight",
          fluids: "500-750ml per 0.5kg lost",
        },
        examples: [
          "Protein shake + banana",
          "Chocolate milk",
          "Greek yogurt + fruit",
        ],
      },
      {
        name: "Short-Term Recovery (1-4 hours)",
        priority: "High",
        recommendations: {
          protein: "Complete protein source",
          carbs: "Complex carbs to replenish glycogen",
          vegetables: "Antioxidants and micronutrients",
        },
        examples: [
          "Chicken + rice + vegetables",
          "Salmon + sweet potato + greens",
        ],
      },
      {
        name: "Extended Recovery (4-24 hours)",
        priority: "Moderate",
        recommendations: {
          protein: "Spread throughout day (20-40g per meal)",
          carbs: "Based on next day's training",
          fats: "Include omega-3s for anti-inflammation",
        },
      },
    ],
    supplements: [
      {
        name: "Tart Cherry Juice",
        dosage: "8-12 oz twice daily",
        timing: "Morning and evening",
        evidence: "Moderate - may reduce DOMS and inflammation",
      },
      {
        name: "Omega-3 Fish Oil",
        dosage: "2-3g EPA+DHA daily",
        timing: "With meals",
        evidence: "Moderate - anti-inflammatory benefits",
      },
      {
        name: "Creatine",
        dosage: "3-5g daily",
        timing: "Any time, consistency matters",
        evidence: "Strong - aids muscle recovery and performance",
      },
      {
        name: "Vitamin D",
        dosage: "1000-4000 IU daily (based on blood levels)",
        timing: "With fat-containing meal",
        evidence: "Moderate - important for muscle function",
      },
    ],
    evidence_level: "Strong",
  },
};

// =============================================================================
// RECOVERY RECOMMENDATION ENGINE
// =============================================================================

/**
 * Generate personalized recovery recommendations based on training data
 */
function generateRecoveryRecommendations(params) {
  const {
    trainingType: _trainingType, // 'strength', 'speed', 'agility', 'game', 'conditioning'
    intensity, // 1-10 scale
    duration: _duration, // minutes
    muscleGroups = [], // ['legs', 'upper_body', 'core', 'full_body']
    timeAvailable, // minutes available for recovery
    equipment = [], // ['foam_roller', 'massage_gun', 'ice_bath', 'sauna', 'compression']
    soreness = 0, // current soreness level 1-10
    sleepQuality, // 'poor', 'fair', 'good', 'excellent'
    daysUntilNextSession = 1,
  } = params;

  const recommendations = {
    immediate: [], // Do right after training
    sameDay: [], // Later same day
    nextDay: [], // Following day
    ongoing: [], // General recommendations
    priority: "normal", // 'low', 'normal', 'high', 'critical'
  };

  // Determine recovery priority based on intensity and time until next session
  if (intensity >= 8 || (intensity >= 6 && daysUntilNextSession <= 1)) {
    recommendations.priority = "high";
  } else if (intensity >= 9 || soreness >= 7) {
    recommendations.priority = "critical";
  } else if (intensity <= 4) {
    recommendations.priority = "low";
  }

  // Immediate recovery (0-30 min post-training)
  recommendations.immediate.push({
    protocol: "nutrition_recovery",
    technique: "Immediate Post-Exercise",
    duration: "15-30 minutes",
    priority: "high",
    reason: "Optimal window for protein synthesis and glycogen replenishment",
  });

  if (equipment.includes("foam_roller") || timeAvailable >= 10) {
    recommendations.immediate.push({
      protocol: "manual_therapy",
      technique: "Foam Rolling",
      duration: "10-15 minutes",
      priority: "medium",
      focus: muscleGroups,
      reason: "Reduce muscle tension and improve blood flow",
    });
  }

  // Cold therapy for high intensity
  if (
    intensity >= 7 &&
    (equipment.includes("ice_bath") || equipment.includes("cold_shower"))
  ) {
    recommendations.immediate.push({
      protocol: "cryotherapy",
      technique: equipment.includes("ice_bath") ? "Ice Bath" : "Cold Shower",
      duration: equipment.includes("ice_bath")
        ? "10-15 minutes"
        : "3-5 minutes",
      priority: "medium",
      reason:
        "Reduce inflammation and accelerate recovery from high-intensity training",
      caution:
        "May blunt strength adaptations if used consistently after strength training",
    });
  }

  // Same day recovery
  if (timeAvailable >= 30) {
    recommendations.sameDay.push({
      protocol: "active_recovery",
      technique: "Light Walking",
      duration: "15-20 minutes",
      priority: "medium",
      reason: "Promote blood flow without adding stress",
    });
  }

  if (equipment.includes("compression")) {
    recommendations.sameDay.push({
      protocol: "compression",
      technique: "Compression Garments",
      duration: "2-4 hours",
      priority: "low",
      reason: "Support venous return and reduce swelling",
    });
  }

  // Evening/night recovery
  if (equipment.includes("sauna") && intensity <= 7) {
    recommendations.sameDay.push({
      protocol: "heat_therapy",
      technique: "Sauna",
      duration: "15-20 minutes",
      priority: "low",
      timing: "Evening, 2+ hours after training",
      reason: "Muscle relaxation and heat shock protein activation",
    });
  }

  recommendations.sameDay.push({
    protocol: "manual_therapy",
    technique: "Static Stretching",
    duration: "15-20 minutes",
    priority: "medium",
    timing: "Evening",
    focus: muscleGroups,
    reason: "Improve flexibility and reduce next-day stiffness",
  });

  // Sleep recommendation based on quality
  if (sleepQuality === "poor" || sleepQuality === "fair") {
    recommendations.sameDay.push({
      protocol: "sleep",
      technique: "Sleep Hygiene Protocol",
      priority: "high",
      reason:
        "Poor sleep significantly impairs recovery. Focus on sleep quality tonight.",
      tips: RECOVERY_PROTOCOLS.sleep.techniques[0].protocol,
    });
  }

  // Next day recovery
  if (soreness >= 5 || intensity >= 7) {
    recommendations.nextDay.push({
      protocol: "active_recovery",
      technique: "Light Activity",
      duration: "20-30 minutes",
      priority: "medium",
      options: ["Walking", "Swimming", "Easy cycling", "Yoga"],
      reason:
        "Active recovery reduces DOMS more effectively than complete rest",
    });
  }

  if (equipment.includes("massage_gun")) {
    recommendations.nextDay.push({
      protocol: "manual_therapy",
      technique: "Massage Gun",
      duration: "10-15 minutes",
      priority: "medium",
      focus: muscleGroups,
      reason: "Address any remaining muscle tension",
    });
  }

  // Ongoing recommendations
  recommendations.ongoing.push({
    protocol: "nutrition_recovery",
    technique: "Extended Recovery Nutrition",
    priority: "high",
    tips: [
      "Protein with every meal (20-40g)",
      "Stay hydrated (aim for clear/light yellow urine)",
      "Include anti-inflammatory foods (fish, berries, leafy greens)",
      "Limit alcohol (impairs recovery)",
    ],
  });

  recommendations.ongoing.push({
    protocol: "sleep",
    technique: "Consistent Sleep Schedule",
    priority: "high",
    target: "7-9 hours per night",
    tips: [
      "Same bedtime/wake time daily",
      "Dark, cool room",
      "No screens before bed",
    ],
  });

  return recommendations;
}

/**
 * Get protocol details by category
 */
function getProtocolDetails(category) {
  return RECOVERY_PROTOCOLS[category] || null;
}

/**
 * Get all protocols summary
 */
function getAllProtocolsSummary() {
  return Object.entries(RECOVERY_PROTOCOLS).map(([key, protocol]) => ({
    id: key,
    category: protocol.category,
    name: protocol.name,
    description: protocol.description,
    techniqueCount:
      protocol.techniques?.length || protocol.recommendations ? 1 : 0,
    evidenceLevel: protocol.evidence_level,
  }));
}

// =============================================================================
// DATABASE OPERATIONS
// =============================================================================

/**
 * Get athlete recovery profile
 */
async function getAthleteRecoveryProfile(userId) {
  const { data, error } = await supabaseAdmin
    .from("athlete_recovery_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return data;
}

/**
 * Save athlete recovery profile
 */
async function saveAthleteRecoveryProfile(userId, profileData) {
  const { data, error } = await supabaseAdmin
    .from("athlete_recovery_profiles")
    .upsert(
      {
        user_id: userId,
        ...profileData,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data;
}

/**
 * Log recovery session
 */
async function logRecoverySession(userId, sessionData) {
  const { data, error } = await supabaseAdmin
    .from("recovery_sessions")
    .insert({
      user_id: userId,
      ...sessionData,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data;
}

/**
 * Get recovery history
 */
async function getRecoveryHistory(userId, limit = 30) {
  const { data, error } = await supabaseAdmin
    .from("recovery_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }
  return data || [];
}

/**
 * Get stored recovery protocols from database
 */
async function getStoredProtocols(filters = {}) {
  let query = supabaseAdmin
    .from("recovery_protocols")
    .select("*")
    .eq("is_active", true);

  if (filters.category) {
    query = query.eq("category", filters.category);
  }

  const { data, error } = await query.order("name");

  if (error) {
    throw error;
  }
  return data || [];
}

// =============================================================================
// REQUEST HANDLER
// =============================================================================

async function handleRequest(event, _context, { userId }) {
  const path =
    event.path
      .replace("/.netlify/functions/recovery", "")
      .replace(/^\/api\/recovery\/?/, "")
      .replace(/^\//, "") || "";

  let body = {};
  if (event.body && ["POST", "PUT"].includes(event.httpMethod)) {
    try {
      body = JSON.parse(event.body);
    } catch {
      return createErrorResponse("Invalid JSON body", 400, "invalid_json");
    }
  }

  try {
    // Get all protocols summary
    if (event.httpMethod === "GET" && path === "protocols") {
      const summary = getAllProtocolsSummary();
      const stored = await getStoredProtocols();
      return createSuccessResponse({
        builtIn: summary,
        custom: stored,
      });
    }

    // Get specific protocol details
    if (event.httpMethod === "GET" && path.startsWith("protocols/")) {
      const category = path.replace("protocols/", "");
      const protocol = getProtocolDetails(category);

      if (!protocol) {
        return createErrorResponse("Protocol not found", 404, "not_found");
      }

      return createSuccessResponse(protocol);
    }

    // Generate recovery recommendations
    if (event.httpMethod === "POST" && path === "recommend") {
      const recommendations = generateRecoveryRecommendations(body);
      return createSuccessResponse(recommendations);
    }

    // Get athlete recovery profile
    if (event.httpMethod === "GET" && path === "profile") {
      const profile = await getAthleteRecoveryProfile(userId);
      if (!profile) {
        return createSuccessResponse({
          exists: false,
          message:
            "No recovery profile found. Create one with POST /recovery/profile",
        });
      }
      return createSuccessResponse(profile);
    }

    // Save athlete recovery profile
    if (event.httpMethod === "POST" && path === "profile") {
      const saved = await saveAthleteRecoveryProfile(userId, body);
      return createSuccessResponse(saved, null, 201);
    }

    // Log a recovery session
    if (event.httpMethod === "POST" && path === "log") {
      const logged = await logRecoverySession(userId, body);
      return createSuccessResponse(logged, null, 201);
    }

    // Get recovery history
    if (event.httpMethod === "GET" && path === "history") {
      const params = event.queryStringParameters || {};
      const history = await getRecoveryHistory(
        userId,
        parseInt(params.limit) || 30,
      );
      return createSuccessResponse(history);
    }

    // Get recovery protocol by category from database
    if (event.httpMethod === "GET" && path === "stored") {
      const params = event.queryStringParameters || {};
      const protocols = await getStoredProtocols({ category: params.category });
      return createSuccessResponse(protocols);
    }

    return createErrorResponse("Endpoint not found", 404, "not_found");
  } catch (error) {
    console.error("Recovery API error:", error);
    throw error;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "recovery",
    allowedMethods: ["GET", "POST", "PUT"],
    rateLimitType: "DEFAULT",
    requireAuth: !event.path.includes("/protocols"),
    handler: handleRequest,
  });
};

// Export for use in other modules
exports.RECOVERY_PROTOCOLS = RECOVERY_PROTOCOLS;
exports.generateRecoveryRecommendations = generateRecoveryRecommendations;
