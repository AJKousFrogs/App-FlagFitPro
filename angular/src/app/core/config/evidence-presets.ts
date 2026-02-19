/**
 * Evidence-Based Presets
 *
 * Versioned presets for different populations and risk profiles.
 * Each preset includes complete evidence-based configurations with citations.
 *
 * Presets:
 * - adult_flag_competitive_v1: Standard competitive adult flag football
 * - youth_flag_v1: Youth/adolescent flag football (different risk profile)
 * - return_to_play_v1: Return-to-play protocols (more conservative)
 */

import { EvidencePreset, ResearchCitation } from "./evidence-config";

/**
 * Research Citations Database
 * Centralized citations referenced across all presets
 */
export const RESEARCH_CITATIONS: Record<string, ResearchCitation> = {
  gabbett2016: {
    authors: "Gabbett, T. J.",
    year: 2016,
    title:
      "The training—injury prevention paradox: should athletes be training smarter and harder?",
    journal: "British Journal of Sports Medicine",
    doi: "10.1136/bjsports-2015-095788",
    notes:
      "Established ACWR thresholds: 0.8-1.3 sweet spot, >1.5 danger zone, 10% weekly increase cap",
  },
  halson2014: {
    authors: "Halson, S. L.",
    year: 2014,
    title:
      "Sleep in elite athletes and nutritional interventions to enhance sleep",
    journal: "Sports Medicine",
    doi: "10.1007/s40279-014-0260-0",
    notes: "Strong links between sleep duration/quality and readiness",
  },
  fullagar2015: {
    authors: "Fullagar, H. H., et al.",
    year: 2015,
    title:
      "Sleep and athletic performance: the effects of sleep loss on exercise performance, and physiological and cognitive responses to exercise",
    journal: "Sports Medicine",
    doi: "10.1007/s40279-015-0368-z",
    notes: "Sleep quality strongly associated with readiness",
  },
  saw2016: {
    authors: "Saw, A. E., et al.",
    year: 2016,
    title: "Monitoring athlete training loads: consensus statement",
    journal: "International Journal of Sports Physiology and Performance",
    doi: "10.1123/ijspp.2016-0408",
    notes:
      "Wellness scores predict perceived performance; sleep can proxy broader wellness",
  },
  mclellan2011: {
    authors: "McLellan, C. P., et al.",
    year: 2011,
    title:
      "The role of rate of perceived exertion scales in monitoring exercise prescription",
    journal: "Journal of Strength and Conditioning Research",
    notes:
      "Team-sport contexts show stronger associations with self-reported wellness",
  },
  bosquet2007: {
    authors: "Bosquet, L., et al.",
    year: 2007,
    title: "Effects of tapering on performance: a meta-analysis",
    journal: "Medicine & Science in Sports & Exercise",
    doi: "10.1249/mss.0b013e31802f5a73",
    notes: "Consensus: 7-14 day taper, 40-60% volume reduction",
  },
  mujika2003: {
    authors: "Mujika, I., & Padilla, S.",
    year: 2003,
    title: "Scientific bases for precompetition tapering strategies",
    journal: "Medicine & Science in Sports & Exercise",
    doi: "10.1249/01.MSS.0000074448.73931.11",
    notes: "Intensity maintenance during taper (80-90% of normal)",
  },
};

/**
 * Adult Flag Football Competitive v1
 * Standard preset for competitive adult flag football players
 */
export const ADULT_FLAG_COMPETITIVE_V1: EvidencePreset = {
  id: "adult_flag_competitive_v1",
  name: "Adult Flag Football Competitive v1",
  version: "1.0",
  description:
    "Evidence-based configuration for competitive adult flag football players (18-35 years, 3-6 sessions/week)",
  population: {
    ageRange: "18-35 years",
    sportType: "5v5 flag football",
    competitionLevel: "competitive",
    trainingFrequency: "3-6 sessions/week",
    gender: "mixed",
    notes: "Standard competitive adult population",
  },

  acwr: {
    version: "1.0",
    population: {
      ageRange: "18-35 years",
      sportType: "5v5 flag football",
      competitionLevel: "competitive",
      trainingFrequency: "3-6 sessions/week",
    },
    citations: RESEARCH_CITATIONS["gabbett2016"]
      ? [RESEARCH_CITATIONS["gabbett2016"]]
      : [],
    acuteWindowDays: 7,
    chronicWindowDays: 28,
    acuteLambda: 0.2,
    chronicLambda: 0.05,
    thresholds: {
      sweetSpotLow: 0.8,
      sweetSpotHigh: 1.3,
      dangerHigh: 1.5,
      maxWeeklyIncreasePercent: 10,
      maxWeeklyIncreasePercentConservative: 7,
    },
    minChronicLoad: 50,
    minDaysForChronic: 21,
    minSessionsForChronic: 12,
    dataQuality: {
      lowConfidenceThreshold: 8,
      enableQualityFlags: true,
    },
    scienceNotes: {
      thresholds:
        "ACWR thresholds (0.8-1.3 sweet spot, >1.5 danger zone) come from large-scale team-sport research on injury risk (Gabbett 2016). These are population-level findings from multiple studies.",
      coachOverride:
        "Coaches can override thresholds if they have their own philosophy or team-specific data showing different optimal ranges. Individual athletes may have different tolerance levels.",
    },
  },

  readiness: {
    version: "1.0",
    population: {
      ageRange: "18-35 years",
      sportType: "5v5 flag football",
      competitionLevel: "competitive",
      trainingFrequency: "3-6 sessions/week",
    },
    citations: [
      RESEARCH_CITATIONS.halson2014,
      RESEARCH_CITATIONS.fullagar2015,
      RESEARCH_CITATIONS.saw2016,
      RESEARCH_CITATIONS.mclellan2011,
    ],
    weightings: {
      workload: 0.35,
      wellness: 0.3,
      sleep: 0.2,
      proximity: 0.15,
    },
    cutPoints: {
      lowMax: 55,
      moderateMax: 75,
    },
    reducedDataMode: {
      enabled: true,
      wellnessCompletenessThreshold: 60,
      sleepWeightMultiplier: 1.5,
    },
    wellnessIndex: {
      use1to5Scale: true,
      requiredFields: ["fatigue", "sleepQuality", "soreness"],
      optionalFields: ["mood", "stress", "energy"],
    },
    scienceNotes: {
      weightings:
        "Weightings optimized for team-sport contexts based on research showing stronger associations with self-reported wellness (McLellan 2011, Saw 2016). Sleep weightings based on strong evidence linking sleep to readiness (Halson 2014, Fullagar 2015).",
      cutPoints:
        "Cut-points (Low: <55, Moderate: 55-75, High: >75) are starting points based on common athlete monitoring scales. These require team-specific calibration using injury and performance history.",
      coachOverride:
        "Coaches should calibrate cut-points using their own team's data. Weightings can be adjusted based on team philosophy or individual athlete needs.",
    },
  },

  tapering: {
    version: "1.0",
    population: {
      ageRange: "18-35 years",
      sportType: "5v5 flag football",
      competitionLevel: "competitive",
      trainingFrequency: "3-6 sessions/week",
    },
    citations: [
      RESEARCH_CITATIONS["bosquet2007"],
      RESEARCH_CITATIONS["mujika2003"],
    ].filter((c): c is ResearchCitation => c !== undefined),
    taperDuration: {
      major: { min: 10, max: 14 },
      high: { min: 7, max: 10 },
      medium: { min: 5, max: 7 },
      minor: { min: 3, max: 5 },
    },
    targetVolumeReduction: {
      major: { min: 0.5, max: 0.7 },
      high: { min: 0.4, max: 0.6 },
      medium: { min: 0.3, max: 0.5 },
      minor: { min: 0.2, max: 0.4 },
    },
    minIntensityFloor: 0.8,
    maxIntensityFloor: 0.9,
    postOverloadTaper: {
      volumeReduction: { min: 0.6, max: 0.9 },
      duration: { min: 10, max: 14 },
    },
    overloadPeriod: {
      duration: { min: 14, max: 28 },
      volumeMultiplier: 1.1,
      intensityMultiplier: 0.95,
    },
    scienceNotes: {
      taperDuration:
        "Taper duration ranges (7-14 days for major events, 3-5 days for minor) come from meta-analysis of tapering research (Bosquet 2007). Shorter tapers acceptable for minor competitions.",
      volumeReduction:
        "Volume reduction ranges (40-60% consensus, up to 60-90% after overload) based on systematic reviews. These are population-level findings.",
      intensityFloor:
        "Intensity floor (80-90% of normal) maintains moderate-high intensity during taper, preventing detraining (Mujika 2003).",
      coachOverride:
        "Coaches can adjust taper duration and volume reductions based on athlete response, team philosophy, or individual needs. Intensity floor can be modified but research suggests maintaining intensity prevents detraining.",
    },
  },

  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  changelog: [
    "v1.0 (2026-01-01): Initial release with evidence-based ACWR, readiness, and tapering configurations",
  ],
};

/**
 * Youth Flag Football v1
 * More conservative preset for youth/adolescent players
 */
export const YOUTH_FLAG_V1: EvidencePreset = {
  id: "youth_flag_v1",
  name: "Youth Flag Football v1",
  version: "1.0",
  description:
    "More conservative configuration for youth/adolescent flag football players (13-17 years)",
  population: {
    ageRange: "13-17 years",
    sportType: "5v5 flag football",
    competitionLevel: "competitive",
    trainingFrequency: "3-5 sessions/week",
    gender: "mixed",
    notes:
      "Youth population - more conservative thresholds due to growth and development considerations",
  },

  acwr: {
    version: "1.0",
    population: {
      ageRange: "13-17 years",
      sportType: "5v5 flag football",
      competitionLevel: "competitive",
      trainingFrequency: "3-5 sessions/week",
    },
    citations: RESEARCH_CITATIONS["gabbett2016"]
      ? [RESEARCH_CITATIONS["gabbett2016"]]
      : [],
    acuteWindowDays: 7,
    chronicWindowDays: 28,
    acuteLambda: 0.2,
    chronicLambda: 0.05,
    thresholds: {
      sweetSpotLow: 0.8,
      sweetSpotHigh: 1.2, // More conservative (1.2 vs 1.3)
      dangerHigh: 1.4, // More conservative (1.4 vs 1.5)
      maxWeeklyIncreasePercent: 7, // More conservative (7% vs 10%)
      maxWeeklyIncreasePercentConservative: 5,
    },
    minChronicLoad: 40, // Lower minimum for youth
    minDaysForChronic: 21,
    minSessionsForChronic: 10,
    dataQuality: {
      lowConfidenceThreshold: 8,
      enableQualityFlags: true,
    },
    scienceNotes: {
      thresholds:
        "More conservative thresholds for youth due to growth and development considerations. Based on adult research (Gabbett 2016) with conservative adjustments.",
      coachOverride:
        "Youth coaches should be especially cautious and may want even more conservative thresholds. Individual growth patterns should be considered.",
    },
  },

  readiness: {
    version: "1.0",
    population: {
      ageRange: "13-17 years",
      sportType: "5v5 flag football",
      competitionLevel: "competitive",
      trainingFrequency: "3-5 sessions/week",
    },
    citations: [
      RESEARCH_CITATIONS["halson2014"],
      RESEARCH_CITATIONS["saw2016"],
    ].filter((c): c is ResearchCitation => c !== undefined),
    weightings: {
      workload: 0.3, // Lower workload weight
      wellness: 0.35, // Higher wellness weight (youth may be more sensitive)
      sleep: 0.25, // Higher sleep weight (critical for youth)
      proximity: 0.1,
    },
    cutPoints: {
      lowMax: 50, // More conservative (50 vs 55)
      moderateMax: 70, // More conservative (70 vs 75)
    },
    reducedDataMode: {
      enabled: true,
      wellnessCompletenessThreshold: 60,
      sleepWeightMultiplier: 1.5,
    },
    wellnessIndex: {
      use1to5Scale: true,
      requiredFields: ["fatigue", "sleepQuality", "soreness"],
      optionalFields: ["mood", "stress", "energy"],
    },
    scienceNotes: {
      weightings:
        "Adjusted weightings for youth population - higher emphasis on sleep and wellness due to growth considerations.",
      cutPoints:
        "More conservative cut-points for youth. Coaches should monitor closely and adjust based on individual responses.",
      coachOverride:
        "Youth coaches should be especially cautious with thresholds. Consider individual growth patterns and school/academic stress.",
    },
  },

  tapering: {
    version: "1.0",
    population: {
      ageRange: "13-17 years",
      sportType: "5v5 flag football",
      competitionLevel: "competitive",
      trainingFrequency: "3-5 sessions/week",
    },
    citations: [
      RESEARCH_CITATIONS["bosquet2007"],
      RESEARCH_CITATIONS["mujika2003"],
    ].filter((c): c is ResearchCitation => c !== undefined),
    taperDuration: {
      major: { min: 10, max: 14 },
      high: { min: 7, max: 10 },
      medium: { min: 5, max: 7 },
      minor: { min: 3, max: 5 },
    },
    targetVolumeReduction: {
      major: { min: 0.45, max: 0.65 }, // Slightly more conservative
      high: { min: 0.35, max: 0.55 },
      medium: { min: 0.25, max: 0.45 },
      minor: { min: 0.15, max: 0.35 },
    },
    minIntensityFloor: 0.8,
    maxIntensityFloor: 0.9,
    postOverloadTaper: {
      volumeReduction: { min: 0.55, max: 0.85 },
      duration: { min: 10, max: 14 },
    },
    overloadPeriod: {
      duration: { min: 14, max: 28 },
      volumeMultiplier: 1.05, // Less aggressive overload (5% vs 10%)
      intensityMultiplier: 0.95,
    },
    scienceNotes: {
      taperDuration:
        "Taper duration similar to adults but volume reductions slightly more conservative for youth.",
      volumeReduction:
        "Slightly more conservative volume reductions for youth due to growth considerations.",
      intensityFloor:
        "Intensity floor maintained (80-90%) as per research (Mujika 2003).",
      coachOverride:
        "Youth coaches should monitor athlete response closely and adjust taper protocols based on individual needs.",
    },
  },

  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  changelog: [
    "v1.0 (2026-01-01): Initial release with conservative thresholds for youth population",
  ],
};

/**
 * Return to Play v1
 * Conservative preset for athletes returning from injury
 */
export const RETURN_TO_PLAY_V1: EvidencePreset = {
  id: "return_to_play_v1",
  name: "Return to Play v1",
  version: "1.0",
  description:
    "Conservative configuration for athletes returning from injury or extended time off",
  population: {
    ageRange: "18-35 years",
    sportType: "5v5 flag football",
    competitionLevel: "competitive",
    trainingFrequency: "2-4 sessions/week",
    gender: "mixed",
    notes:
      "Return-to-play population - very conservative thresholds to prevent re-injury",
  },

  acwr: {
    version: "1.0",
    population: {
      ageRange: "18-35 years",
      sportType: "5v5 flag football",
      competitionLevel: "competitive",
      trainingFrequency: "2-4 sessions/week",
    },
    citations: RESEARCH_CITATIONS["gabbett2016"]
      ? [RESEARCH_CITATIONS["gabbett2016"]]
      : [],
    acuteWindowDays: 7,
    chronicWindowDays: 28,
    acuteLambda: 0.2,
    chronicLambda: 0.05,
    thresholds: {
      sweetSpotLow: 0.7, // More conservative (0.7 vs 0.8)
      sweetSpotHigh: 1.1, // More conservative (1.1 vs 1.3)
      dangerHigh: 1.3, // Much more conservative (1.3 vs 1.5)
      maxWeeklyIncreasePercent: 5, // Very conservative (5% vs 10%)
      maxWeeklyIncreasePercentConservative: 3,
    },
    minChronicLoad: 30, // Lower minimum for RTP
    minDaysForChronic: 21,
    minSessionsForChronic: 8,
    dataQuality: {
      lowConfidenceThreshold: 6,
      enableQualityFlags: true,
    },
    scienceNotes: {
      thresholds:
        "Very conservative thresholds for return-to-play to prevent re-injury. Based on Gabbett (2016) with conservative adjustments.",
      coachOverride:
        "RTP protocols should be individualized based on injury type, time off, and medical clearance. These are starting points.",
    },
  },

  readiness: {
    version: "1.0",
    population: {
      ageRange: "18-35 years",
      sportType: "5v5 flag football",
      competitionLevel: "competitive",
      trainingFrequency: "2-4 sessions/week",
    },
    citations: [
      RESEARCH_CITATIONS["halson2014"],
      RESEARCH_CITATIONS["saw2016"],
    ].filter((c): c is ResearchCitation => c !== undefined),
    weightings: {
      workload: 0.3,
      wellness: 0.35, // Higher wellness weight for RTP
      sleep: 0.25, // Higher sleep weight
      proximity: 0.1,
    },
    cutPoints: {
      lowMax: 50, // More conservative
      moderateMax: 70,
    },
    reducedDataMode: {
      enabled: true,
      wellnessCompletenessThreshold: 60,
      sleepWeightMultiplier: 1.5,
    },
    wellnessIndex: {
      use1to5Scale: true,
      requiredFields: ["fatigue", "sleepQuality", "soreness"],
      optionalFields: ["mood", "stress", "energy"],
    },
    scienceNotes: {
      weightings:
        "Higher emphasis on wellness and sleep for RTP athletes. Workload weight reduced to prevent overloading.",
      cutPoints:
        "More conservative cut-points for RTP. Athletes should progress gradually.",
      coachOverride:
        "RTP protocols must be individualized and coordinated with medical professionals. These are conservative starting points.",
    },
  },

  tapering: {
    version: "1.0",
    population: {
      ageRange: "18-35 years",
      sportType: "5v5 flag football",
      competitionLevel: "competitive",
      trainingFrequency: "2-4 sessions/week",
    },
    citations: [
      RESEARCH_CITATIONS["bosquet2007"],
      RESEARCH_CITATIONS["mujika2003"],
    ].filter((c): c is ResearchCitation => c !== undefined),
    taperDuration: {
      major: { min: 10, max: 14 },
      high: { min: 7, max: 10 },
      medium: { min: 5, max: 7 },
      minor: { min: 3, max: 5 },
    },
    targetVolumeReduction: {
      major: { min: 0.4, max: 0.6 }, // More conservative
      high: { min: 0.3, max: 0.5 },
      medium: { min: 0.2, max: 0.4 },
      minor: { min: 0.15, max: 0.3 },
    },
    minIntensityFloor: 0.75, // Slightly lower (75% vs 80%)
    maxIntensityFloor: 0.85,
    postOverloadTaper: {
      volumeReduction: { min: 0.5, max: 0.8 },
      duration: { min: 10, max: 14 },
    },
    overloadPeriod: {
      duration: { min: 14, max: 28 },
      volumeMultiplier: 1.0, // No overload for RTP
      intensityMultiplier: 1.0,
    },
    scienceNotes: {
      taperDuration:
        "Taper duration similar but volume reductions more conservative for RTP athletes.",
      volumeReduction:
        "More conservative volume reductions to prevent re-injury. No overload period recommended.",
      intensityFloor:
        "Slightly lower intensity floor (75-85%) for RTP athletes.",
      coachOverride:
        "RTP taper protocols must be individualized and coordinated with medical professionals. No overload period recommended.",
    },
  },

  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  changelog: [
    "v1.0 (2026-01-01): Initial release with very conservative thresholds for return-to-play",
  ],
};

/**
 * All available presets
 */
export const EVIDENCE_PRESETS: Record<string, EvidencePreset> = {
  adult_flag_competitive_v1: ADULT_FLAG_COMPETITIVE_V1,
  youth_flag_v1: YOUTH_FLAG_V1,
  return_to_play_v1: RETURN_TO_PLAY_V1,
};

/**
 * Get preset by ID
 */
export function getPresetById(presetId: string): EvidencePreset | null {
  return EVIDENCE_PRESETS[presetId] || null;
}

/**
 * Get default preset
 */
export function getDefaultPreset(): EvidencePreset {
  return ADULT_FLAG_COMPETITIVE_V1;
}

/**
 * List all available presets
 */
export function getAllPresets(): EvidencePreset[] {
  return Object.values(EVIDENCE_PRESETS);
}
