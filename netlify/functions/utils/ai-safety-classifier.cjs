/**
 * AI Safety Classifier
 *
 * Implements a 3-tier safety system for AI responses:
 * - Tier 1 (Low Risk): General training info - full guidance allowed
 * - Tier 2 (Medium Risk): Injury prevention/recovery - requires disclaimers
 * - Tier 3 (High Risk): Supplements/medical - requires strong disclaimers, no dosing
 *
 * Phase 3 Enhancements:
 * - Multi-signal classification (keywords + context + patterns)
 * - Confidence scoring for classifications
 * - Conversation pattern analysis
 * - Youth-specific safety rules
 * - Personalization awareness
 *
 * Based on: AI_COACHING_SYSTEM_REVAMP.md
 */

// =====================================================
// RISK LEVEL DEFINITIONS
// =====================================================

const RISK_LEVELS = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
};

// =====================================================
// CLASSIFICATION CONFIDENCE THRESHOLDS
// =====================================================

const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.85, // High confidence in classification
  MEDIUM: 0.65, // Moderate confidence
  LOW: 0.45, // Low confidence - may need escalation
};

// =====================================================
// KEYWORD PATTERNS FOR CLASSIFICATION
// =====================================================

/**
 * High-risk keywords that trigger Tier 3 classification
 * These relate to supplements, medications, and medical dosing
 */
const HIGH_RISK_KEYWORDS = [
  // Supplement names
  "creatine",
  "protein powder",
  "bcaa",
  "beta-alanine",
  "caffeine",
  "pre-workout",
  "post-workout",
  "whey",
  "casein",
  "glutamine",
  "hmb",
  "citrulline",
  "arginine",
  "nitric oxide",
  "testosterone booster",
  "fat burner",
  "thermogenic",
  // Vitamins and minerals
  "vitamin d",
  "vitamin c",
  "vitamin b",
  "vitamin e",
  "vitamin a",
  "vitamin k",
  "iron supplement",
  "zinc",
  "magnesium",
  "calcium supplement",
  "fish oil",
  "omega-3",
  "omega 3",
  "multivitamin",
  "electrolyte",
  // Dosage-related
  "dosage",
  "dose",
  "how much should i take",
  "mg per day",
  "grams per day",
  "milligrams",
  "mcg",
  "iu",
  "serving size",
  "loading phase",
  "maintenance dose",
  // Medical terms
  "medication",
  "prescription",
  "drug interaction",
  "side effect",
  "contraindication",
  "blood test",
  "lab values",
  "deficiency",
];

/**
 * Medium-risk keywords that trigger Tier 2 classification
 * These relate to injuries, pain, and recovery
 */
const MEDIUM_RISK_KEYWORDS = [
  // Injury types
  "injury",
  "injured",
  "strain",
  "sprain",
  "tear",
  "pulled muscle",
  "tendonitis",
  "tendinitis",
  "bursitis",
  "fracture",
  "dislocation",
  "concussion",
  "contusion",
  "bruise",
  // Pain-related
  "pain",
  "painful",
  "sore",
  "soreness",
  "ache",
  "aching",
  "sharp pain",
  "chronic pain",
  "acute pain",
  "inflammation",
  "swelling",
  "swollen",
  // Body parts with issues
  "knee pain",
  "back pain",
  "shoulder pain",
  "ankle pain",
  "hip pain",
  "hamstring",
  "quad",
  "calf",
  "achilles",
  "rotator cuff",
  "acl",
  "mcl",
  "meniscus",
  "plantar fasciitis",
  // Recovery-related
  "recovery",
  "recovering",
  "rehab",
  "rehabilitation",
  "physical therapy",
  "return to play",
  "healing",
  "rest",
  "ice",
  "compression",
  "elevation",
  // Prevention
  "prevent",
  "prevention",
  "avoid injury",
  "injury prevention",
  "prehab",
  "warm up for injury",
];

/**
 * Low-risk keywords (general training) - used for confirmation
 */
const LOW_RISK_KEYWORDS = [
  // Technique
  "technique",
  "form",
  "mechanics",
  "posture",
  "stance",
  "grip",
  "footwork",
  // Training methods
  "warm up",
  "warm-up",
  "cool down",
  "stretch",
  "stretching",
  "drill",
  "exercise",
  "workout",
  "training",
  "practice",
  // Performance
  "speed",
  "acceleration",
  "agility",
  "power",
  "strength",
  "endurance",
  "stamina",
  "flexibility",
  "mobility",
  // Flag football specific
  "throwing",
  "catching",
  "route running",
  "flag pulling",
  "quarterback",
  "receiver",
  "defender",
  "play calling",
  "strategy",
  "formation",
];

// =====================================================
// INTENT TYPES
// Phase 1: Enhanced intent classification for response style
// =====================================================

const INTENT_TYPES = {
  // Original intents
  DOSAGE: "dosage",
  TIMING: "timing",
  SAFETY: "safety",
  HOW_TO: "how_to",
  WHAT_IS: "what_is",
  WHY: "why",
  PROTOCOL: "protocol",
  COMPARISON: "comparison",
  GENERAL: "general",

  // Phase 1: New coaching-specific intents
  PLAN_REQUEST: "plan_request", // "build me a weekly program"
  TECHNIQUE_CORRECTION: "technique_correction", // "why am I rounding my routes?"
  PAIN_INJURY: "pain_injury", // "knee pain after cutting"
  RECOVERY_READINESS: "recovery_readiness", // "can I train today?"
  SUPPLEMENT_MEDICAL: "supplement_medical", // "creatine dose?"
};

/**
 * Intent patterns for classification
 * Phase 1: Expanded with coaching-specific patterns
 */
const INTENT_PATTERNS = {
  // Phase 1: Coaching-specific intents (check these first for priority)
  [INTENT_TYPES.PLAN_REQUEST]: [
    /build me|create (a|me)|make me/i,
    /weekly (program|plan|schedule)/i,
    /training (plan|program|schedule)/i,
    /workout (plan|program|schedule)/i,
    /design a|develop a/i,
    /put together a/i,
    /give me a (plan|program|routine)/i,
    /need a (plan|program|routine)/i,
  ],
  [INTENT_TYPES.TECHNIQUE_CORRECTION]: [
    /why am i|why do i/i,
    /form check/i,
    /doing wrong|doing it wrong/i,
    /correct my|fix my/i,
    /what('s| is) wrong with my/i,
    /improve my (form|technique|mechanics)/i,
    /bad habit/i,
    /rounding my|dropping my/i,
    /keep (messing up|failing|missing)/i,
  ],
  [INTENT_TYPES.PAIN_INJURY]: [
    /pain (in|after|when|during)/i,
    /hurts (when|after|during)/i,
    /injured my|hurt my/i,
    /sore (after|from)/i,
    /ache(s)? (in|when)/i,
    /swelling|swollen/i,
    /pulled (my|a)/i,
    /tweaked (my|a)/i,
    /strain(ed)?|sprain(ed)?/i,
  ],
  [INTENT_TYPES.RECOVERY_READINESS]: [
    /can i (train|play|practice|workout)/i,
    /should i (train|play|practice|workout|rest)/i,
    /ready to (train|play|practice)/i,
    /am i (ready|recovered|healed)/i,
    /ok to (train|play|practice)/i,
    /safe to (train|play|practice)/i,
    /return to (play|training|practice)/i,
    /cleared to/i,
    /take (a|the) day off/i,
  ],
  [INTENT_TYPES.SUPPLEMENT_MEDICAL]: [
    /supplement/i,
    /vitamin|mineral/i,
    /creatine|protein powder|bcaa/i,
    /pre.?workout|post.?workout/i,
    /should i take/i,
    /medication|medicine/i,
  ],

  // Original intents
  [INTENT_TYPES.DOSAGE]: [
    /how much (should|do) (i|we) take/i,
    /what('s| is) the (dose|dosage)/i,
    /(\d+)\s*(mg|g|ml|iu|mcg)/i,
    /per (day|kg|pound|lb)/i,
    /loading (phase|dose)/i,
    /maintenance dose/i,
  ],
  [INTENT_TYPES.TIMING]: [
    /when (should|do) (i|we)/i,
    /best time to/i,
    /before or after/i,
    /how (often|frequently)/i,
    /timing/i,
  ],
  [INTENT_TYPES.SAFETY]: [
    /is it safe/i,
    /side effect/i,
    /risk/i,
    /danger/i,
    /harmful/i,
    /contraindication/i,
    /interaction/i,
  ],
  [INTENT_TYPES.HOW_TO]: [
    /how (do|can|should) (i|we)/i,
    /how to/i,
    /what('s| is) the best way/i,
    /tips for/i,
    /improve my/i,
  ],
  [INTENT_TYPES.WHAT_IS]: [
    /what (is|are)/i,
    /what('s| does)/i,
    /define/i,
    /explain/i,
    /meaning of/i,
  ],
  [INTENT_TYPES.WHY]: [/why (do|does|should|is)/i, /reason for/i, /cause of/i],
  [INTENT_TYPES.PROTOCOL]: [
    /protocol/i,
    /routine/i,
    /program/i,
    /plan/i,
    /schedule/i,
    /regimen/i,
  ],
};

// =====================================================
// CLASSIFICATION FUNCTIONS
// =====================================================

/**
 * Classify the intent of a query
 * @param {string} query - The user's query
 * @returns {string} - The classified intent type
 */
function classifyIntent(query) {
  const lowerQuery = query.toLowerCase();

  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(lowerQuery)) {
        return intent;
      }
    }
  }

  return INTENT_TYPES.GENERAL;
}

/**
 * Extract entities from a query
 * @param {string} query - The user's query
 * @returns {Object} - Extracted entities
 */
function extractEntities(query) {
  const lowerQuery = query.toLowerCase();
  const entities = {
    supplements: [],
    injuries: [],
    bodyParts: [],
    medicalConditions: [],
  };

  // Extract supplement mentions
  const supplementKeywords = HIGH_RISK_KEYWORDS.filter(
    (kw) =>
      !kw.includes("dosage") &&
      !kw.includes("mg") &&
      !kw.includes("medication"),
  );
  for (const kw of supplementKeywords) {
    if (lowerQuery.includes(kw)) {
      entities.supplements.push(kw);
    }
  }

  // Extract injury mentions
  const injuryKeywords = [
    "strain",
    "sprain",
    "tear",
    "tendonitis",
    "bursitis",
    "fracture",
    "concussion",
  ];
  for (const kw of injuryKeywords) {
    if (lowerQuery.includes(kw)) {
      entities.injuries.push(kw);
    }
  }

  // Extract body parts
  const bodyParts = [
    "knee",
    "back",
    "shoulder",
    "ankle",
    "hip",
    "hamstring",
    "quad",
    "calf",
    "achilles",
    "wrist",
    "elbow",
    "neck",
  ];
  for (const part of bodyParts) {
    if (lowerQuery.includes(part)) {
      entities.bodyParts.push(part);
    }
  }

  return entities;
}

/**
 * Determine the risk level of a query
 * @param {string} query - The user's query
 * @returns {Object} - Risk classification result
 */
function classifyRiskLevel(query) {
  const lowerQuery = query.toLowerCase();
  const intent = classifyIntent(query);
  const entities = extractEntities(query);

  // Check for high-risk indicators
  const hasHighRiskKeyword = HIGH_RISK_KEYWORDS.some((kw) =>
    lowerQuery.includes(kw),
  );
  const hasDosageIntent = intent === INTENT_TYPES.DOSAGE;
  const hasSupplements = entities.supplements.length > 0;

  // Check for medium-risk indicators
  const hasMediumRiskKeyword = MEDIUM_RISK_KEYWORDS.some((kw) =>
    lowerQuery.includes(kw),
  );
  const hasSafetyIntent = intent === INTENT_TYPES.SAFETY;
  const hasInjuries = entities.injuries.length > 0;

  // Determine risk level
  let riskLevel = RISK_LEVELS.LOW;
  let requiresLabs = false;
  let requiresProfessional = false;

  if (hasDosageIntent || (hasHighRiskKeyword && hasSupplements)) {
    riskLevel = RISK_LEVELS.HIGH;
    requiresLabs = hasDosageIntent;
    requiresProfessional = true;
  } else if (hasMediumRiskKeyword || hasSafetyIntent || hasInjuries) {
    riskLevel = RISK_LEVELS.MEDIUM;
    requiresProfessional = hasInjuries;
  }

  return {
    query,
    intent,
    riskLevel,
    entities,
    requiresLabs,
    requiresProfessional,
    flags: {
      hasHighRiskKeyword,
      hasMediumRiskKeyword,
      hasDosageIntent,
      hasSupplements,
      hasInjuries,
    },
  };
}

// =====================================================
// PHASE 3: MULTI-SIGNAL CLASSIFICATION
// =====================================================

/**
 * Youth-specific topic restrictions
 * Topics that require parental notification or are blocked for youth
 */
const YOUTH_RESTRICTED_TOPICS = {
  blocked: [
    "testosterone",
    "steroids",
    "anabolic",
    "hgh",
    "hormone",
    "fat burner",
    "thermogenic",
    "stimulant",
    "extreme diet",
    "fasting",
    "cutting weight",
  ],
  requiresParentApproval: [
    "creatine",
    "protein powder",
    "bcaa",
    "pre-workout",
    "supplement",
    "vitamin",
    "mineral",
    "high intensity",
    "max effort",
    "weight training",
  ],
  notifyParent: [
    "injury",
    "pain",
    "hurt",
    "sore",
    "concussion",
    "head",
    "dizzy",
    "not feeling well",
    "tired",
    "exhausted",
  ],
};

/**
 * Age group definitions for youth classification
 */
const AGE_GROUPS = {
  YOUTH_UNDER_12: "youth_under_12",
  YOUTH_12_15: "youth_12_15",
  YOUTH_16_17: "youth_16_17",
  ADULT: "adult",
};

/**
 * Calculate keyword signal score
 * Returns confidence score based on keyword matches
 *
 * @param {string} query - User query
 * @returns {Object} - Keyword signals with confidence
 */
function analyzeKeywordSignals(query) {
  const lowerQuery = query.toLowerCase();
  const signals = {
    highRiskMatches: [],
    mediumRiskMatches: [],
    lowRiskMatches: [],
    categories: new Set(),
    rawScore: 0,
    confidence: 0,
  };

  // Check high-risk keywords
  for (const kw of HIGH_RISK_KEYWORDS) {
    if (lowerQuery.includes(kw)) {
      signals.highRiskMatches.push(kw);
      signals.rawScore += 3; // High-risk keywords weigh more
      if (kw.includes("dosage") || kw.includes("mg") || kw.includes("dose")) {
        signals.categories.add("dosage");
      } else if (kw.includes("supplement") || kw.includes("vitamin")) {
        signals.categories.add("supplement");
      } else if (kw.includes("medication") || kw.includes("drug")) {
        signals.categories.add("medical");
      }
    }
  }

  // Check medium-risk keywords
  for (const kw of MEDIUM_RISK_KEYWORDS) {
    if (lowerQuery.includes(kw)) {
      signals.mediumRiskMatches.push(kw);
      signals.rawScore += 2;
      if (kw.includes("pain") || kw.includes("ache") || kw.includes("sore")) {
        signals.categories.add("pain");
      } else if (
        kw.includes("injury") ||
        kw.includes("strain") ||
        kw.includes("sprain")
      ) {
        signals.categories.add("injury");
      } else if (kw.includes("recovery") || kw.includes("rehab")) {
        signals.categories.add("recovery");
      }
    }
  }

  // Check low-risk keywords
  for (const kw of LOW_RISK_KEYWORDS) {
    if (lowerQuery.includes(kw)) {
      signals.lowRiskMatches.push(kw);
      signals.rawScore += 1;
      signals.categories.add("training");
    }
  }

  // Calculate confidence based on match density
  const totalMatches =
    signals.highRiskMatches.length +
    signals.mediumRiskMatches.length +
    signals.lowRiskMatches.length;

  if (totalMatches > 0) {
    // More matches = higher confidence
    signals.confidence = Math.min(0.95, 0.5 + totalMatches * 0.1);

    // Boost confidence if matches are consistent (same category)
    if (signals.categories.size === 1) {
      signals.confidence = Math.min(0.98, signals.confidence + 0.1);
    }
  } else {
    signals.confidence = 0.3; // Low confidence when no keywords match
  }

  signals.categories = Array.from(signals.categories);
  return signals;
}

/**
 * Analyze context signals from user state and history
 *
 * @param {Object} userContext - User context including state gates
 * @returns {Object} - Context signals with adjustments
 */
function analyzeContextSignals(userContext = {}) {
  const signals = {
    riskModifier: 0,
    reasons: [],
    youthFlags: [],
    confidence: 0.5,
  };

  // Check ACWR risk
  if (userContext.acwr) {
    if (
      userContext.acwr.riskZone === "danger" ||
      userContext.acwr.riskZone === "critical"
    ) {
      signals.riskModifier += 1;
      signals.reasons.push("High ACWR detected");
    } else if (userContext.acwr.riskZone === "warning") {
      signals.riskModifier += 0.5;
      signals.reasons.push("Elevated ACWR");
    }
    signals.confidence += 0.1;
  }

  // Check injuries
  if (userContext.injuries && userContext.injuries.length > 0) {
    const severeInjury = userContext.injuries.find((i) => i.severity >= 7);
    if (severeInjury) {
      signals.riskModifier += 1;
      signals.reasons.push("Active severe injury");
    } else {
      signals.riskModifier += 0.5;
      signals.reasons.push("Active injury being monitored");
    }
    signals.confidence += 0.1;
  }

  // Check daily state
  if (userContext.dailyState) {
    if (userContext.dailyState.pain_level >= 7) {
      signals.riskModifier += 1;
      signals.reasons.push("High pain reported today");
    }
    if (userContext.dailyState.fatigue_level >= 8) {
      signals.riskModifier += 0.5;
      signals.reasons.push("High fatigue reported");
    }
    signals.confidence += 0.1;
  }

  // Check age group - youth gets automatic escalation
  if (userContext.ageGroup && userContext.ageGroup !== "adult") {
    signals.riskModifier += 0.5;
    signals.reasons.push("Youth athlete");
    signals.youthFlags.push("youth_athlete");

    if (userContext.ageGroup === AGE_GROUPS.YOUTH_UNDER_12) {
      signals.riskModifier += 0.5;
      signals.youthFlags.push("under_12");
    }
    signals.confidence += 0.15;
  }

  // Check upcoming game
  if (userContext.upcomingGame) {
    signals.reasons.push("Game within 48 hours");
    signals.confidence += 0.05;
  }

  signals.confidence = Math.min(0.9, signals.confidence);
  return signals;
}

/**
 * Analyze conversation patterns for escalation detection
 *
 * @param {Array} conversationHistory - Previous messages in session
 * @param {string} currentQuery - Current query
 * @returns {Object} - Pattern signals
 */
function analyzePatternSignals(conversationHistory = [], currentQuery) {
  const signals = {
    escalationDetected: false,
    repeatedTopics: [],
    persistentPain: false,
    seekingWorkaround: false,
    confidence: 0.4,
  };

  if (!conversationHistory || conversationHistory.length === 0) {
    return signals;
  }

  const lowerQuery = currentQuery.toLowerCase();
  const recentTopics = new Map();

  // Analyze recent conversation
  for (const msg of conversationHistory.slice(-10)) {
    if (msg.role === "user") {
      const msgLower = (msg.content || "").toLowerCase();

      // Track topic frequency
      for (const kw of [...HIGH_RISK_KEYWORDS, ...MEDIUM_RISK_KEYWORDS]) {
        if (msgLower.includes(kw)) {
          recentTopics.set(kw, (recentTopics.get(kw) || 0) + 1);
        }
      }
    }
  }

  // Check for repeated high-risk topics
  for (const [topic, count] of recentTopics) {
    if (count >= 2) {
      signals.repeatedTopics.push(topic);
      if (HIGH_RISK_KEYWORDS.includes(topic)) {
        signals.escalationDetected = true;
        signals.confidence += 0.15;
      }
    }
  }

  // Check for persistent pain mentions
  const painKeywords = ["pain", "hurt", "ache", "sore"];
  const painMentions = conversationHistory.filter(
    (msg) =>
      msg.role === "user" &&
      painKeywords.some((pk) => (msg.content || "").toLowerCase().includes(pk)),
  ).length;

  if (painMentions >= 2 && painKeywords.some((pk) => lowerQuery.includes(pk))) {
    signals.persistentPain = true;
    signals.escalationDetected = true;
    signals.confidence += 0.2;
  }

  // Check for workaround-seeking patterns
  const workaroundPatterns = [
    /but (can|what if|how about)/i,
    /just this once/i,
    /won't hurt/i,
    /small amount/i,
    /just a little/i,
    /anyway/i,
    /ignore (the|that)/i,
  ];

  if (workaroundPatterns.some((p) => p.test(currentQuery))) {
    signals.seekingWorkaround = true;
    signals.escalationDetected = true;
    signals.confidence += 0.1;
  }

  signals.confidence = Math.min(0.85, signals.confidence);
  return signals;
}

/**
 * Apply youth-specific restrictions and determine required actions
 *
 * @param {string} query - User query
 * @param {Object} classification - Base classification
 * @param {Object} youthSettings - Youth-specific settings
 * @returns {Object} - Youth restriction results
 */
function applyYouthRestrictions(query, classification, youthSettings = {}) {
  const lowerQuery = query.toLowerCase();
  const results = {
    isBlocked: false,
    blockedReason: null,
    requiresParentApproval: false,
    notifyParent: false,
    notificationReason: null,
    restrictionsApplied: [],
    modifiedRiskLevel: classification.riskLevel,
  };

  // Check blocked topics
  for (const topic of YOUTH_RESTRICTED_TOPICS.blocked) {
    if (lowerQuery.includes(topic)) {
      results.isBlocked = true;
      results.blockedReason = `Topic "${topic}" is not appropriate for youth athletes`;
      results.restrictionsApplied.push(`blocked_topic:${topic}`);
      results.modifiedRiskLevel = RISK_LEVELS.HIGH;
      return results;
    }
  }

  // Check parent approval topics
  for (const topic of YOUTH_RESTRICTED_TOPICS.requiresParentApproval) {
    if (lowerQuery.includes(topic)) {
      results.requiresParentApproval = true;
      results.restrictionsApplied.push(`requires_approval:${topic}`);

      // Escalate risk level for approval-required topics
      if (results.modifiedRiskLevel === RISK_LEVELS.LOW) {
        results.modifiedRiskLevel = RISK_LEVELS.MEDIUM;
      }
    }
  }

  // Check notification topics
  for (const topic of YOUTH_RESTRICTED_TOPICS.notifyParent) {
    if (lowerQuery.includes(topic)) {
      results.notifyParent = true;
      results.notificationReason = `Youth athlete mentioned ${topic}`;
      results.restrictionsApplied.push(`notify_parent:${topic}`);
    }
  }

  // Apply youth-specific threshold overrides if settings provided
  if (
    youthSettings.restrict_supplement_topics &&
    classification.entities?.supplements?.length > 0
  ) {
    results.requiresParentApproval = true;
    results.restrictionsApplied.push("setting:restrict_supplements");
    results.modifiedRiskLevel = RISK_LEVELS.HIGH;
  }

  if (
    youthSettings.restrict_high_intensity &&
    (lowerQuery.includes("max") ||
      lowerQuery.includes("intense") ||
      lowerQuery.includes("heavy") ||
      lowerQuery.includes("explosive"))
  ) {
    results.requiresParentApproval = true;
    results.restrictionsApplied.push("setting:restrict_intensity");
  }

  return results;
}

/**
 * Enhanced multi-signal classification
 * Combines keyword, context, and pattern signals with confidence scoring
 *
 * @param {string} query - User query
 * @param {Object} userContext - User context (from buildAthleteStateGates)
 * @param {Array} conversationHistory - Previous messages
 * @param {Object} youthSettings - Youth-specific settings if applicable
 * @returns {Object} - Comprehensive classification with confidence
 */
function classifyWithConfidence(
  query,
  userContext = {},
  conversationHistory = [],
  youthSettings = null,
) {
  const startTime = Date.now();

  // Get base classification
  const baseClassification = classifyRiskLevel(query);

  // Multi-signal analysis
  const keywordSignals = analyzeKeywordSignals(query);
  const contextSignals = analyzeContextSignals(userContext);
  const patternSignals = analyzePatternSignals(conversationHistory, query);

  // Calculate combined confidence
  const avgConfidence =
    keywordSignals.confidence * 0.4 +
    contextSignals.confidence * 0.35 +
    patternSignals.confidence * 0.25;

  // Calculate final risk level considering all signals
  let finalRiskLevel = baseClassification.riskLevel;
  const escalationReasons = [];

  // Escalate based on context
  if (contextSignals.riskModifier >= 2) {
    if (finalRiskLevel === RISK_LEVELS.LOW) {
      finalRiskLevel = RISK_LEVELS.MEDIUM;
      escalationReasons.push(...contextSignals.reasons);
    } else if (
      finalRiskLevel === RISK_LEVELS.MEDIUM &&
      contextSignals.riskModifier >= 2.5
    ) {
      finalRiskLevel = RISK_LEVELS.HIGH;
      escalationReasons.push(...contextSignals.reasons);
    }
  }

  // Escalate based on patterns
  if (patternSignals.escalationDetected) {
    if (finalRiskLevel === RISK_LEVELS.LOW) {
      finalRiskLevel = RISK_LEVELS.MEDIUM;
    }
    if (patternSignals.persistentPain) {
      escalationReasons.push(
        "Persistent pain reported across multiple messages",
      );
    }
    if (patternSignals.seekingWorkaround) {
      escalationReasons.push(
        "Pattern suggests seeking to bypass safety guidance",
      );
    }
    if (patternSignals.repeatedTopics.length > 0) {
      escalationReasons.push(
        `Repeated focus on: ${patternSignals.repeatedTopics.join(", ")}`,
      );
    }
  }

  // Apply youth restrictions if applicable
  let youthRestrictions = null;
  const isYouth = userContext.ageGroup && userContext.ageGroup !== "adult";

  if (isYouth) {
    youthRestrictions = applyYouthRestrictions(
      query,
      baseClassification,
      youthSettings || {},
    );

    if (youthRestrictions.isBlocked) {
      finalRiskLevel = RISK_LEVELS.HIGH;
      escalationReasons.push(youthRestrictions.blockedReason);
    } else if (
      youthRestrictions.modifiedRiskLevel !== baseClassification.riskLevel
    ) {
      finalRiskLevel = youthRestrictions.modifiedRiskLevel;
      escalationReasons.push("Youth safety restrictions applied");
    }
  }

  // Determine confidence level category
  let confidenceLevel = "low";
  if (avgConfidence >= CONFIDENCE_THRESHOLDS.HIGH) {
    confidenceLevel = "high";
  } else if (avgConfidence >= CONFIDENCE_THRESHOLDS.MEDIUM) {
    confidenceLevel = "medium";
  }

  // If low confidence and any risk indicators, escalate for safety
  if (
    confidenceLevel === "low" &&
    (keywordSignals.highRiskMatches.length > 0 ||
      keywordSignals.mediumRiskMatches.length > 0)
  ) {
    if (finalRiskLevel === RISK_LEVELS.LOW) {
      finalRiskLevel = RISK_LEVELS.MEDIUM;
      escalationReasons.push(
        "Low classification confidence - escalated for safety",
      );
    }
  }

  const processingTime = Date.now() - startTime;

  return {
    // Core classification
    query,
    intent: baseClassification.intent,
    riskLevel: finalRiskLevel,
    baseRiskLevel: baseClassification.riskLevel,
    entities: baseClassification.entities,

    // Confidence scoring
    confidence: Math.round(avgConfidence * 1000) / 1000,
    confidenceLevel,

    // Multi-signal details
    signals: {
      keyword: {
        confidence: keywordSignals.confidence,
        highRiskMatches: keywordSignals.highRiskMatches,
        mediumRiskMatches: keywordSignals.mediumRiskMatches,
        categories: keywordSignals.categories,
      },
      context: {
        confidence: contextSignals.confidence,
        riskModifier: contextSignals.riskModifier,
        reasons: contextSignals.reasons,
        youthFlags: contextSignals.youthFlags,
      },
      pattern: {
        confidence: patternSignals.confidence,
        escalationDetected: patternSignals.escalationDetected,
        repeatedTopics: patternSignals.repeatedTopics,
        persistentPain: patternSignals.persistentPain,
        seekingWorkaround: patternSignals.seekingWorkaround,
      },
    },

    // Escalation
    escalated: finalRiskLevel !== baseClassification.riskLevel,
    escalationReasons,

    // Youth-specific
    isYouthUser: isYouth,
    youthRestrictions: youthRestrictions
      ? {
          isBlocked: youthRestrictions.isBlocked,
          blockedReason: youthRestrictions.blockedReason,
          requiresParentApproval: youthRestrictions.requiresParentApproval,
          notifyParent: youthRestrictions.notifyParent,
          notificationReason: youthRestrictions.notificationReason,
          restrictionsApplied: youthRestrictions.restrictionsApplied,
        }
      : null,

    // Original flags
    flags: baseClassification.flags,
    requiresLabs: baseClassification.requiresLabs,
    requiresProfessional:
      baseClassification.requiresProfessional ||
      (youthRestrictions?.requiresParentApproval ?? false),

    // Metadata
    processingTimeMs: processingTime,
    modelVersion: "v3.0",
  };
}

/**
 * Generate response for blocked youth topic
 *
 * @param {string} blockedReason - Reason for blocking
 * @param {Object} entities - Extracted entities
 * @returns {Object} - Safe blocked response
 */
function generateBlockedYouthResponse(blockedReason, _entities) {
  return {
    answer: `## Topic Not Available

I can't provide guidance on this topic for youth athletes. ${blockedReason}

### What I can help with instead:
- Age-appropriate training techniques
- Flag football drills and skills
- Recovery and rest guidance
- General nutrition from whole foods

### Talk to an adult:
- Your coach can provide training guidance
- A parent/guardian can discuss any health topics
- A healthcare provider for medical questions

Is there something else I can help you with today?`,
    citations: [],
    suggestedActions: [
      {
        type: "ask_coach",
        label: "Ask Your Coach",
        reason: "Your coach can provide appropriate guidance",
        isMicroSession: false,
      },
    ],
    isBlocked: true,
    riskLevel: RISK_LEVELS.HIGH,
  };
}

// =====================================================
// DISCLAIMER TEMPLATES
// =====================================================

const DISCLAIMERS = {
  [RISK_LEVELS.LOW]: null, // No disclaimer needed

  [RISK_LEVELS.MEDIUM]: {
    short:
      "⚠️ This is general guidance. Consult a healthcare professional for persistent issues.",
    full: `
⚠️ **Important**: If you experience severe pain, swelling, or symptoms that worsen, 
stop immediately and consult a healthcare professional. 
This guidance is general and may not apply to your specific situation.
    `.trim(),
    symptoms: [
      "severe pain",
      "significant swelling",
      "numbness or tingling",
      "inability to bear weight",
      "visible deformity",
    ],
  },

  [RISK_LEVELS.HIGH]: {
    short:
      "⚠️ Medical Disclaimer: Consult a healthcare provider before taking supplements.",
    full: `
⚠️ **Medical Disclaimer**: Supplement dosing should be individualized 
based on lab values, medical history, and professional evaluation.
The ranges mentioned are general guidelines only.

**Before taking supplements:**
1. Consult with a healthcare provider
2. Get relevant lab tests (if applicable)
3. Consider your medical history and current medications
4. Start with conservative doses

This information is not medical advice and does not replace 
professional medical consultation.
    `.trim(),
    requiresBeforeTaking: [
      "Consult with a healthcare provider",
      "Get relevant lab tests (if applicable)",
      "Consider your medical history and current medications",
      "Start with conservative doses",
    ],
  },
};

/**
 * Get the appropriate disclaimer for a risk level
 * @param {string} riskLevel - The risk level
 * @param {boolean} fullVersion - Whether to return the full disclaimer
 * @returns {Object|null} - The disclaimer object or null
 */
function getDisclaimer(riskLevel, fullVersion = true) {
  const disclaimer = DISCLAIMERS[riskLevel];
  if (!disclaimer) {
    return null;
  }

  return {
    text: fullVersion ? disclaimer.full : disclaimer.short,
    ...disclaimer,
  };
}

// =====================================================
// RESPONSE TEMPLATES
// =====================================================

/**
 * Generate a safe response structure based on risk level
 * @param {string} riskLevel - The risk level
 * @param {string} answer - The main answer content
 * @param {Array} citations - Source citations
 * @param {Object} options - Additional options
 * @returns {Object} - Structured response
 */
function generateSafeResponse(riskLevel, answer, citations = [], options = {}) {
  const disclaimer = getDisclaimer(riskLevel, true);

  const response = {
    riskLevel,
    answer,
    citations: citations.map((c) => ({
      id: c.id || `citation-${Math.random().toString(36).substr(2, 9)}`,
      title: c.title || c.source_title,
      source_type: c.source_type || "curated",
      evidence_grade: c.evidenceGrade || c.evidence_grade || "C",
      // Include URL for clickable links
      url: c.url || c.source_url || null,
      source_url: c.source_url || c.url || null,
    })),
    disclaimer: disclaimer?.text || null,
    metadata: {
      requiresProfessional: options.requiresProfessional || false,
      requiresLabs: options.requiresLabs || false,
      evidenceLevel: options.evidenceLevel || "moderate",
    },
  };

  // Add suggested actions based on risk level
  if (riskLevel === RISK_LEVELS.HIGH) {
    response.suggestedActions = [
      {
        type: "ask_coach",
        reason: "High-risk topic - recommend professional consultation",
        label: "Consult a Professional",
      },
    ];
  } else if (riskLevel === RISK_LEVELS.MEDIUM && options.hasInjury) {
    response.suggestedActions = [
      {
        type: "add_exercise",
        reason: "Injury detected - recommend prevention exercises",
        label: "Add Recovery Exercises",
      },
    ];
  }

  return response;
}

// =====================================================
// CONTENT FILTERING
// =====================================================

/**
 * Filter response content based on risk level
 * Removes specific dosing information for high-risk topics
 * @param {string} content - The response content
 * @param {string} riskLevel - The risk level
 * @returns {string} - Filtered content
 */
function filterContent(content, riskLevel) {
  if (riskLevel !== RISK_LEVELS.HIGH) {
    return content;
  }

  // Remove specific dosing recommendations
  let filtered = content;

  // Replace specific mg/g dosing with ranges
  filtered = filtered.replace(
    /take\s+(\d+)\s*(mg|g|ml)/gi,
    "common ranges are typically discussed with healthcare providers",
  );

  // Replace "you should take X" patterns
  filtered = filtered.replace(
    /you should take\s+[\d.-]+\s*(mg|g|ml|iu)/gi,
    "dosing should be determined by a healthcare professional",
  );

  // Add note about personalization
  if (
    filtered.includes("mg") ||
    filtered.includes("gram") ||
    filtered.includes("dose")
  ) {
    filtered +=
      "\n\n*Note: Specific dosing should be personalized based on individual factors and professional guidance.*";
  }

  return filtered;
}

// =====================================================
// EVIDENCE GRADE FILTERING
// =====================================================

/**
 * Get minimum evidence grade required for a risk level
 * @param {string} riskLevel - The risk level
 * @returns {string} - Minimum evidence grade
 */
function getMinimumEvidenceGrade(riskLevel) {
  switch (riskLevel) {
    case RISK_LEVELS.HIGH:
      return "A"; // Only meta-analyses, systematic reviews
    case RISK_LEVELS.MEDIUM:
      return "B"; // RCTs, well-designed studies
    case RISK_LEVELS.LOW:
    default:
      return "C"; // All evidence levels acceptable
  }
}

/**
 * Compare evidence grades
 * @param {string} grade1 - First grade
 * @param {string} grade2 - Second grade
 * @returns {number} - Comparison result (-1, 0, 1)
 */
function compareEvidenceGrade(grade1, grade2) {
  const gradeOrder = { A: 3, strong: 3, B: 2, moderate: 2, C: 1, limited: 1 };
  const g1 = gradeOrder[grade1] || 0;
  const g2 = gradeOrder[grade2] || 0;
  return g1 - g2;
}

/**
 * Filter sources by evidence grade for risk level
 * @param {Array} sources - Knowledge sources
 * @param {string} riskLevel - The risk level
 * @returns {Array} - Filtered sources
 */
function filterSourcesByEvidence(sources, riskLevel) {
  const minGrade = getMinimumEvidenceGrade(riskLevel);

  return sources.filter((source) => {
    const sourceGrade = source.evidence_grade || source.evidenceGrade || "C";
    return compareEvidenceGrade(sourceGrade, minGrade) >= 0;
  });
}

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  // Constants
  RISK_LEVELS,
  INTENT_TYPES,
  HIGH_RISK_KEYWORDS,
  MEDIUM_RISK_KEYWORDS,
  LOW_RISK_KEYWORDS,
  DISCLAIMERS,

  // Phase 3: Additional constants
  CONFIDENCE_THRESHOLDS,
  YOUTH_RESTRICTED_TOPICS,
  AGE_GROUPS,

  // Classification functions
  classifyIntent,
  classifyRiskLevel,
  extractEntities,

  // Phase 3: Enhanced classification
  classifyWithConfidence,
  analyzeKeywordSignals,
  analyzeContextSignals,
  analyzePatternSignals,
  applyYouthRestrictions,

  // Response generation
  getDisclaimer,
  generateSafeResponse,
  filterContent,

  // Phase 3: Youth response
  generateBlockedYouthResponse,

  // Evidence filtering
  getMinimumEvidenceGrade,
  compareEvidenceGrade,
  filterSourcesByEvidence,
};
