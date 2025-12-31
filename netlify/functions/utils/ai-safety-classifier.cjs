/**
 * AI Safety Classifier
 *
 * Implements a 3-tier safety system for AI responses:
 * - Tier 1 (Low Risk): General training info - full guidance allowed
 * - Tier 2 (Medium Risk): Injury prevention/recovery - requires disclaimers
 * - Tier 3 (High Risk): Supplements/medical - requires strong disclaimers, no dosing
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
// =====================================================

const INTENT_TYPES = {
  DOSAGE: "dosage",
  TIMING: "timing",
  SAFETY: "safety",
  HOW_TO: "how_to",
  WHAT_IS: "what_is",
  WHY: "why",
  PROTOCOL: "protocol",
  COMPARISON: "comparison",
  GENERAL: "general",
};

/**
 * Intent patterns for classification
 */
const INTENT_PATTERNS = {
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
      !kw.includes("medication")
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
    lowerQuery.includes(kw)
  );
  const hasDosageIntent = intent === INTENT_TYPES.DOSAGE;
  const hasSupplements = entities.supplements.length > 0;

  // Check for medium-risk indicators
  const hasMediumRiskKeyword = MEDIUM_RISK_KEYWORDS.some((kw) =>
    lowerQuery.includes(kw)
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
  if (!disclaimer) {return null;}

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
      title: c.title || c.source_title,
      url: c.url || c.source_url,
      evidenceGrade: c.evidenceGrade || c.evidence_grade,
      date: c.date || c.publication_date,
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
    "common ranges are typically discussed with healthcare providers"
  );

  // Replace "you should take X" patterns
  filtered = filtered.replace(
    /you should take\s+[\d.-]+\s*(mg|g|ml|iu)/gi,
    "dosing should be determined by a healthcare professional"
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

  // Classification functions
  classifyIntent,
  classifyRiskLevel,
  extractEntities,

  // Response generation
  getDisclaimer,
  generateSafeResponse,
  filterContent,

  // Evidence filtering
  getMinimumEvidenceGrade,
  compareEvidenceGrade,
  filterSourcesByEvidence,
};

