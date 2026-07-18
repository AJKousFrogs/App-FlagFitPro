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
  // Injury-prevention / sprint-hamstring evidence (added 2026-07-18 after a
  // PubMed audit — these are the modern hamstring-injury-prevention mechanism
  // the engine's Nordic + sprint-exposure work already implements but the
  // formal evidence layer did not surface). Verified via PubMed.
  vanDyk2019: {
    authors: "van Dyk, N., Behan, F. P., & Whiteley, R.",
    year: 2019,
    title:
      "Including the Nordic hamstring exercise in injury prevention programmes halves the rate of hamstring injuries: a systematic review and meta-analysis of 8459 athletes",
    journal: "British Journal of Sports Medicine",
    doi: "10.1136/bjsports-2018-100045",
    notes:
      "Nordic hamstring exercise ~halves hamstring-injury rate (risk ratio 0.49, 'up to 51%'). The evidence basis for the engine's mandatory-Nordic prescription.",
  },
  bourne2018: {
    authors: "Bourne, M. N., Timmins, R. G., Opar, D. A., et al.",
    year: 2018,
    title:
      "An Evidence-Based Framework for Strengthening Exercises to Prevent Hamstring Injury",
    journal: "Sports Medicine",
    doi: "10.1007/s40279-017-0796-x",
    notes:
      "The MECHANISM: eccentric knee-flexor benefit is mediated by increased biceps femoris long-head fascicle length + eccentric strength — the modifiable in-season hamstring risk factor (cf. Sim/Timmins 2023, fascicle length AUC 0.86).",
  },
  colby2018: {
    authors: "Colby, M. J., Dawson, B., Peeling, P., et al.",
    year: 2018,
    title:
      "Improvement of Prediction of Noncontact Injury in Elite Australian Footballers With Repeated Exposure to Established High-Risk Workload Scenarios",
    journal: "International Journal of Sports Physiology and Performance",
    doi: "10.1123/ijspp.2017-0696",
    notes:
      "Minimal exposure to high-velocity efforts carried the GREATEST injury risk ('being underloaded may be a mediator for noncontact injury'). The evidence basis for the engine's sprint-exposure floor — regular max-velocity running is protective.",
  },
  // ── Game-day environment (2026-07-18) ──────────────────────────────────────
  gould2022: {
    authors:
      "Gould, H. P., Lostetter, S. J., Samuelson, E. R., & Guyton, G. P.",
    year: 2022,
    title:
      "Lower Extremity Injury Rates on Artificial Turf Versus Natural Grass Playing Surfaces: A Systematic Review",
    journal: "The American Journal of Sports Medicine",
    doi: "10.1177/03635465211069562",
    notes:
      "53 studies. On new-generation turf most articles (13/18) found SIMILAR overall injury rates, but the largest share reported a HIGHER foot-and-ankle rate on turf. Knee/hip similar for soccer — but football players at high levels were more likely to sustain a knee injury on turf. The evidence basis for the condition-aware surface advisory (and for including the knee/patellar tendon in its sensitive region set).",
  },
  venishetty2024: {
    authors:
      "Venishetty, N., Xiao, A. X., Ghanta, R., Reddy, R., Pandya, N. K., & Feeley, B. T.",
    year: 2024,
    title:
      "Lower Extremity Injury Rates on Artificial Turf Versus Natural Grass Surfaces in the National Football League During the 2021 and 2022 Seasons",
    journal: "Orthopaedic Journal of Sports Medicine",
    doi: "10.1177/23259671241265378",
    notes:
      "Counterpoint to Gould's 'similar overall' conclusion: NFL 2021-22 showed a higher overall lower-extremity injury rate on turf (1.42 vs 1.22 injuries/game) and higher odds of season-ending surgery (OR 1.60). Kept alongside gould2022 so the advisory's wording stays inside a genuinely unsettled picture.",
  },
  schwellnus2008: {
    authors: "Schwellnus, M. P.",
    year: 2008,
    title:
      "Cause of exercise associated muscle cramps (EAMC) — altered neuromuscular control, dehydration or electrolyte depletion?",
    journal: "British Journal of Sports Medicine",
    doi: "10.1136/bjsm.2008.050401",
    notes:
      "Support for the 'electrolyte depletion' and 'dehydration' hypotheses comes mainly from anecdote, case series (18 cases) and one n=10 case-control; four prospective cohort studies do NOT support them. Altered neuromuscular control is the better-supported mechanism. The evidence basis for the app's fatigue-first cramp framing.",
  },
  nelson2016: {
    authors: "Nelson, N. L., & Churilla, J. R.",
    year: 2016,
    title:
      "A narrative review of exercise-associated muscle cramps: Factors that contribute to neuromuscular fatigue and management implications",
    journal: "Muscle & Nerve",
    doi: "10.1002/mus.25176",
    notes:
      "EAMC stems from an imbalance between excitatory muscle-spindle drive and inhibitory Golgi-tendon-organ drive to the alpha motor neurons, 'rather than dehydration or electrolyte deficits'. The most successful acute treatment is STRETCHING; prevention works by delaying exercise-induced fatigue. Directly underwrites the app's stretch-and-hold advice and its conditioning-over-salt ordering.",
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
    // Mirrors server utils/acwr.js: uncoupled 21d chronic window, λ = 2/(N+1)
    acuteWindowDays: 7,
    chronicWindowDays: 21,
    acuteLambda: 0.25,
    chronicLambda: 0.0909,
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
      // Re-weighted 2026-07-14 (mirrors calc-readiness.js): the only cluster-RCT
      // of ACWR-guided load management found no effect (Dalen-Lorentsen 2021,
      // BJSM) — workload is one input among several, and subjective wellness +
      // sleep carry the stronger monitoring evidence (Saw 2016; Halson 2014).
      workload: 0.25,
      wellness: 0.35,
      sleep: 0.25,
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

  // Evidence-only (2026-07-18): surfaces the citations + modifiable-risk-factor
  // framing behind the engine's prevention work. NO numeric protocol values here
  // (Nordic sets/reps, sprint-floor days, Add:Abd ratio) — those stay
  // single-sourced in the engine + daily-protocol-periodization-config.js (§4).
  injuryPrevention: {
    version: "1.0",
    population: {
      ageRange: "18-35 years",
      sportType: "5v5 flag football",
      competitionLevel: "competitive",
      trainingFrequency: "3-6 sessions/week",
    },
    citations: [
      RESEARCH_CITATIONS["vanDyk2019"],
      RESEARCH_CITATIONS["bourne2018"],
      RESEARCH_CITATIONS["colby2018"],
    ].filter((c): c is ResearchCitation => c !== undefined),
    modifiableRiskFactors: [
      {
        factor:
          "Biceps femoris fascicle length + eccentric knee-flexor strength",
        intervention:
          "Mandatory Nordic hamstring loading (progressive; the engine owns the dose)",
        evidence:
          "Nordic programmes ~halve the hamstring-injury rate (van Dyk 2019, 8459 athletes); the effect is mediated by increased fascicle length + eccentric strength, the strongest modifiable in-season risk factor (Bourne 2018).",
        citationIds: ["vanDyk2019", "bourne2018"],
      },
      {
        factor: "Regular near-max-velocity (high-speed running) exposure",
        intervention:
          "Sprint-exposure floor — plan a speed session when the athlete has gone too long without one (the engine owns the threshold)",
        evidence:
          "Underloading — minimal exposure to high-velocity efforts — carried the GREATEST non-contact injury risk (Colby 2018). Regular max-velocity running is protective ('speed vaccine'); a hard high-speed-running SPIKE ceiling is deliberately NOT imposed because GPS spike metrics are inconclusive for predicting injury (Kupperman 2020).",
        citationIds: ["colby2018"],
      },
    ],
    scienceNotes: {
      hamstring:
        "Hamstring strain is the dominant sprint-type injury in cutting/repeated-sprint sports. The protective mechanism is eccentric strength + biceps femoris fascicle-length adaptation (Bourne 2018) — the Nordic prescription targets exactly this. The app does not screen fascicle length (needs ultrasound); the progressive Nordic dose is the practical proxy.",
      loadExposure:
        "Both ends of the high-velocity exposure curve carry risk, but the evidence is asymmetric: underloading is the stronger signal (Colby 2018), so the engine enforces an exposure FLOOR (not a spike ceiling). This is consistent with the app's honest-ACWR stance — GPS spike metrics are method-dependent and inconclusive (Kupperman 2020).",
      coachOverride:
        "These are population-level prevention principles. A coach or physio managing a specific athlete's return-to-play or known architecture may individualise volume and progression.",
    },
  },

  gameDayEnvironment: {
    version: "1.0",
    population: {
      ageRange: "18-35 years",
      sportType: "5v5 flag football",
      competitionLevel: "competitive",
      trainingFrequency: "3-6 sessions/week",
      notes:
        "Applies to competition days, including multi-game tournament days (the app's peak-exposure window).",
    },
    citations: [
      RESEARCH_CITATIONS["gould2022"],
      RESEARCH_CITATIONS["venishetty2024"],
      RESEARCH_CITATIONS["schwellnus2008"],
      RESEARCH_CITATIONS["nelson2016"],
    ].filter((c): c is ResearchCitation => c !== undefined),
    contextFactors: [
      {
        factor: "Artificial turf underfoot",
        effect:
          "Shifts the injury DISTRIBUTION rather than clearly raising the total: across 53 studies most new-generation-turf articles (13/18) found similar overall rates, while the largest share reported a higher foot-and-ankle rate on turf. Football players at high levels were also more likely to sustain a knee injury on turf (Gould 2022). Not unanimous — NFL 2021-22 data found a higher overall lower-extremity rate and higher season-ending-surgery odds on turf (Venishetty 2024).",
        appBehavior:
          "Advisory only, and deliberately narrow: a note fires ONLY when a known-turf event meets a multi-game day AND the athlete already carries a foot/ankle/lower-leg/knee-tendon restriction. Healthy athletes on turf are told nothing, and unknown surface stays silent rather than guessing. No training dose changes.",
        citationIds: ["gould2022", "venishetty2024"],
      },
      {
        factor: "Cramping on hot multi-game days",
        effect:
          "Exercise-associated muscle cramping is best explained by altered neuromuscular control in fatigued muscle — excitatory muscle-spindle drive rising while inhibitory Golgi-tendon-organ drive falls — 'rather than dehydration or electrolyte deficits'. Prospective cohort evidence does not support the electrolyte/dehydration hypotheses (Schwellnus 2008; Nelson 2016). Stretching is the most successful acute treatment; prevention works by delaying fatigue.",
        appBehavior:
          "The hot-multi-game cramp note leads with fatigue and prescribes stretch-and-hold plus pacing, and ranks sodium explicitly as a SECOND lever scoped to repeat crampers with heavy salty sweat. It states no fluid or sodium figures — those stay single-sourced in nutrition-protocols.js / REFUEL.",
        citationIds: ["schwellnus2008", "nelson2016"],
      },
    ],
    scienceNotes: {
      surface:
        "The honest reading is 'different risk shape, not simply more risk', and the picture is genuinely unsettled — Gould's systematic review and the newer NFL cohort disagree on overall rate. That uncertainty is why the app's surface advisory never tells an athlete not to play, never changes dose, and only speaks to someone whose already-flagged tissue matches the region the evidence actually implicates. Gould also notes the few studies finding MORE injuries on grass were all turf-industry funded.",
      cramping:
        "The popular 'you cramped because your electrolytes ran out' model is the one the evidence least supports, and repeating it sends a cramping athlete to reach for salt instead of addressing fatigue. The app inverts that ordering on purpose. Sodium is not dismissed — it is ranked second and scoped to the subgroup where it is defensible.",
      coachOverride:
        "A coach or physio with venue knowledge (boot choice, shoe-surface interface, a specific athlete's cramp history) may add guidance beyond these population-level notes. Neither factor is an athlete-modifiable training variable, so neither is an input to the engine.",
    },
  },

  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-07-18T00:00:00Z",
  changelog: [
    "v1.0 (2026-01-01): Initial release with evidence-based ACWR, readiness, and tapering configurations",
    "v1.0 (2026-07-18): Added injuryPrevention evidence section (Nordic/fascicle-length + sprint-exposure evidence — van Dyk 2019, Bourne 2018, Colby 2018) after a PubMed evidence audit. Evidence-only; no calculation change.",
    "v1.0 (2026-07-18): Added gameDayEnvironment evidence section (playing surface — Gould 2022, Venishetty 2024; cramping — Schwellnus 2008, Nelson 2016) behind the condition-aware surface advisory and the fatigue-first cramp guidance. Evidence-only; no calculation change.",
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
    // Mirrors server utils/acwr.js: uncoupled 21d chronic window, λ = 2/(N+1)
    acuteWindowDays: 7,
    chronicWindowDays: 21,
    acuteLambda: 0.25,
    chronicLambda: 0.0909,
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
    // Mirrors server utils/acwr.js: uncoupled 21d chronic window, λ = 2/(N+1)
    acuteWindowDays: 7,
    chronicWindowDays: 21,
    acuteLambda: 0.25,
    chronicLambda: 0.0909,
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
/**
 * Masters preset (2026-07-14, audit §4.1): athletes 35+. The engine already
 * lengthens the CNS window with age (60h at 35-39, 72h at 40+); this preset
 * additionally tightens the ACWR bands (sweet spot top 1.2, danger 1.4 —
 * matching the youth conservatism, for slower tissue recovery rather than
 * growth). Evidence tier: heuristic-conservative extrapolation from the adult
 * bands — masters-specific flag data does not exist yet; tightening is the
 * safe direction (LOGIC §10), never loosening.
 */
export const MASTERS_FLAG_V1: EvidencePreset = {
  ...ADULT_FLAG_COMPETITIVE_V1,
  id: "masters_flag_v1",
  name: "Masters Flag Football v1 (35+)",
  version: "1.0",
  description:
    "Conservative configuration for masters flag football players (35+ years): tighter ACWR bands on top of the engine's age-scaled CNS recovery windows. Heuristic extrapolation — tightening only.",
  population: {
    ...ADULT_FLAG_COMPETITIVE_V1.population,
    ageRange: "35+ years",
    notes:
      "Masters population — slower connective-tissue recovery; conservative load-change tolerance. No masters-specific flag dataset yet (heuristic tier).",
  },
  acwr: {
    ...ADULT_FLAG_COMPETITIVE_V1.acwr,
    population: {
      ...ADULT_FLAG_COMPETITIVE_V1.acwr.population,
      ageRange: "35+ years",
    },
    thresholds: {
      ...ADULT_FLAG_COMPETITIVE_V1.acwr.thresholds,
      sweetSpotLow: 0.8,
      sweetSpotHigh: 1.2, // tighter than adult 1.3
      dangerHigh: 1.4, // tighter than adult 1.5
    },
  },
};

export const EVIDENCE_PRESETS: Record<string, EvidencePreset> = {
  adult_flag_competitive_v1: ADULT_FLAG_COMPETITIVE_V1,
  youth_flag_v1: YOUTH_FLAG_V1,
  masters_flag_v1: MASTERS_FLAG_V1,
  return_to_play_v1: RETURN_TO_PLAY_V1,
};

/**
 * Derived cohort assignment (2026-07-14, audit §4.1 — presets are DERIVED,
 * not selected; this pure function is the single rule, unit-tested):
 * active return-to-play protocol beats everything; then age. Unknown age →
 * adult (the server's baseline — never a fabricated cohort). Competitive
 * tier never changes safety thresholds (safe-direction rule).
 */
export function derivePresetId(
  ageYears: number | null,
  hasActiveRtp: boolean,
): string {
  if (hasActiveRtp) return "return_to_play_v1";
  if (ageYears !== null && ageYears < 18) return "youth_flag_v1";
  if (ageYears !== null && ageYears >= 35) return "masters_flag_v1";
  return "adult_flag_competitive_v1";
}

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
