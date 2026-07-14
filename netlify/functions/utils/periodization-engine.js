// GENERATED — do not edit by hand. Source of truth: angular/src/app/core/services/periodization-engine.ts. Regenerate: npm run build:periodization-engine. Parity guarded by tests/unit/periodization-port-parity.test.js.

// angular/src/app/core/config/position-volume.config.ts
var POSITION_VOLUME = {
  qb: {
    position: "qb",
    label: "Quarterback",
    perSession: { throws: { min: 40, max: 60 }, sprints: 8 },
    perGameWorstCase: { throws: 53, snaps: 55, sprints: 12 },
    perWeek: { throws: { min: 200, max: 280 } },
    worstCase: "~40\u201360 throws/session; ~320 throws across a 6\u20138 game tournament (\u224840\u201353/game). The cumulative tournament throw count is the real worst case \u2014 not any single game.",
    periodization: "Off-season rebuild from ~80\u2013120 throws/wk (no max-velocity); pre-season overload ~10%/wk toward 55\u201360/session and rehearse back-to-back high-throw days for tournament arm load; in-season maintain 40\u201350/session, deload throws 48\u201372h pre-game; taper ~30\u201340% the week before a tournament so the arm banks ~320 throws fresh.",
    primaryInjuryRisk: "Cumulative throwing load to the shoulder (cuff, posterior capsule, labrum) and medial elbow (UCL). Budget by TOURNAMENT total + acute:chronic throw tracking, not single-game limits."
  },
  wr: {
    position: "wr",
    label: "Wide Receiver",
    perSession: { catches: { min: 120, max: 180 }, sprints: 25 },
    perGameWorstCase: { sprints: 35, catches: 14, decels: 40 },
    perWeek: { catches: 1e3, sprints: { min: 150, max: 200 } },
    worstCase: "~1000 catches/week and 30\u201335 sprints/game \xD7 up to 8 games/day. The binding game load is high-speed sprint + deceleration, not catch count.",
    periodization: "Off-season build max sprint speed + eccentric hamstring (Nordics) from low volume; pre-season ramp catches toward ~1000/wk and accumulate high-speed running so game sprints sit inside trained range; in-season hold catches but cap max-velocity reps near game day (keep 1\u20132 top-speed exposures/wk); taper running but retain a short max-velocity exposure ~3\u20134 days out.",
    primaryInjuryRisk: "Hamstring strain from max-velocity sprinting + decelerations; ankle/knee on cuts. Periodise sprint volume SEPARATELY from catches \u2014 different tissues."
  },
  db: {
    position: "db",
    label: "Defensive Back",
    perSession: { backpedals: { min: 200, max: 320 }, sprints: 25 },
    perGameWorstCase: { sprints: 35, backpedals: 70, decels: 40 },
    perWeek: {
      backpedals: { min: 800, max: 1200 },
      sprints: { min: 150, max: 200 }
    },
    worstCase: "Up to ~320 backpedals/session (5\u201310 yd) plus WR-like 30\u201335 sprints/game. The backpedal-to-sprint hip-flip transition is the highest-strain action \u2014 count transitions, not just backpedals.",
    periodization: "Off-season develop hip mobility, posterior-chain/COD strength, eccentric hamstring + adductor capacity; pre-season load backpedal volume toward ~320/session and chain backpedal\u2192plant\u2192turn-and-run; in-season distribute the ceiling across 3\u20134 sessions (progressive, not spiky), cap near game day.",
    primaryInjuryRisk: "Hamstring + adductor on the hip-flip transition and max-velocity sprint; ankle/knee on plant-and-drive."
  },
  center: {
    position: "center",
    label: "Center (snapper)",
    perSession: {
      catches: { min: 120, max: 180 },
      snaps: { min: 50, max: 80 },
      sprints: 22
    },
    perGameWorstCase: { snaps: 55, sprints: 35, catches: 12 },
    perWeek: { catches: 1e3, snaps: { min: 300, max: 450 } },
    worstCase: "~1000 catches/week, snaps on essentially every play (~55/game, 50\u201380/session), AND WR-level 30\u201335 sprints/game. A dual one-arm-snap + sprint/route load.",
    periodization: "Off-season condition the one-arm snapping chain (wrist flexors, forearm, posterior shoulder/scapular) + anti-rotation/lumbar from a low base, plus WR catch & base speed; pre-season progressively overload snap volume like a throwing pattern; in-season maintain, protect the arm, keep snap reps progressive.",
    primaryInjuryRisk: "Repetitive one-arm snapping: wrist/forearm, posterior shoulder, medial elbow, and repeated lumbar flexion. Load the snap like a throw \u2014 count reps, build tolerance."
  },
  blitzer: {
    position: "blitzer",
    label: "Blitzer / Rusher",
    perSession: {
      explosiveSprints: { min: 25, max: 35 },
      changeOfDirection: 50
    },
    perGameWorstCase: { explosiveSprints: 42, decels: 45, maxAccels: 42 },
    perWeek: { explosiveSprints: { min: 120, max: 180 } },
    worstCase: "Highest count of true max-effort accelerations of any position (~42/game) \u2014 nearly every defensive snap triggers a rush or pursuit. A high-CNS channel that fatigues faster than it feels.",
    periodization: "Off-season max strength/power (squat/hinge/jumps, accel mechanics), eccentric hamstring base, reactive plyometrics, low-volume accelerations; pre-season load explosive-start volume + repeated-sprint ability with FULL recovery between max efforts; in-season cap weekly max-effort accelerations as the primary monitored metric.",
    primaryInjuryRisk: "Hamstring + calf on repeated max-effort starts; knee/ankle on hard braking. Acceleration/deceleration COUNT is the limiting load \u2014 quality over count."
  },
  wr_db: {
    position: "wr_db",
    label: "Receiver / Defensive back (both ways)",
    perSession: {
      catches: { min: 120, max: 180 },
      backpedals: { min: 200, max: 320 },
      sprints: 25
    },
    perGameWorstCase: { sprints: 35, catches: 14, backpedals: 70, decels: 40 },
    perWeek: {
      catches: 1e3,
      backpedals: { min: 800, max: 1200 },
      sprints: { min: 150, max: 200 }
    },
    worstCase: "Plays BOTH ways: ~1000 catches/week, up to ~320 backpedals/session, and 30\u201335 sprints/game \xD7 up to 8 games/day. The most running- and cutting-loaded role.",
    periodization: "Combine the WR and DB plans: build eccentric hamstring + adductor + COD capacity off-season; ramp catch and backpedal volume pre-season; in-season cap max-velocity near game day. Sprint volume is the shared limiter.",
    primaryInjuryRisk: "Hamstring/adductor from sprinting, decelerating and the backpedal-to-sprint transition; ankle/knee on cuts."
  }
};

// angular/src/app/core/config/evidence-presets.ts
var RESEARCH_CITATIONS = {
  gabbett2016: {
    authors: "Gabbett, T. J.",
    year: 2016,
    title: "The training\u2014injury prevention paradox: should athletes be training smarter and harder?",
    journal: "British Journal of Sports Medicine",
    doi: "10.1136/bjsports-2015-095788",
    notes: "Established ACWR thresholds: 0.8-1.3 sweet spot, >1.5 danger zone, 10% weekly increase cap"
  },
  halson2014: {
    authors: "Halson, S. L.",
    year: 2014,
    title: "Sleep in elite athletes and nutritional interventions to enhance sleep",
    journal: "Sports Medicine",
    doi: "10.1007/s40279-014-0260-0",
    notes: "Strong links between sleep duration/quality and readiness"
  },
  fullagar2015: {
    authors: "Fullagar, H. H., et al.",
    year: 2015,
    title: "Sleep and athletic performance: the effects of sleep loss on exercise performance, and physiological and cognitive responses to exercise",
    journal: "Sports Medicine",
    doi: "10.1007/s40279-015-0368-z",
    notes: "Sleep quality strongly associated with readiness"
  },
  saw2016: {
    authors: "Saw, A. E., et al.",
    year: 2016,
    title: "Monitoring athlete training loads: consensus statement",
    journal: "International Journal of Sports Physiology and Performance",
    doi: "10.1123/ijspp.2016-0408",
    notes: "Wellness scores predict perceived performance; sleep can proxy broader wellness"
  },
  mclellan2011: {
    authors: "McLellan, C. P., et al.",
    year: 2011,
    title: "The role of rate of perceived exertion scales in monitoring exercise prescription",
    journal: "Journal of Strength and Conditioning Research",
    notes: "Team-sport contexts show stronger associations with self-reported wellness"
  },
  bosquet2007: {
    authors: "Bosquet, L., et al.",
    year: 2007,
    title: "Effects of tapering on performance: a meta-analysis",
    journal: "Medicine & Science in Sports & Exercise",
    doi: "10.1249/mss.0b013e31802f5a73",
    notes: "Consensus: 7-14 day taper, 40-60% volume reduction"
  },
  mujika2003: {
    authors: "Mujika, I., & Padilla, S.",
    year: 2003,
    title: "Scientific bases for precompetition tapering strategies",
    journal: "Medicine & Science in Sports & Exercise",
    doi: "10.1249/01.MSS.0000074448.73931.11",
    notes: "Intensity maintenance during taper (80-90% of normal)"
  }
};
var ADULT_FLAG_COMPETITIVE_V1 = {
  id: "adult_flag_competitive_v1",
  name: "Adult Flag Football Competitive v1",
  version: "1.0",
  description: "Evidence-based configuration for competitive adult flag football players (18-35 years, 3-6 sessions/week)",
  population: {
    ageRange: "18-35 years",
    sportType: "5v5 flag football",
    competitionLevel: "competitive",
    trainingFrequency: "3-6 sessions/week",
    gender: "mixed",
    notes: "Standard competitive adult population"
  },
  acwr: {
    version: "1.0",
    population: {
      ageRange: "18-35 years",
      sportType: "5v5 flag football",
      competitionLevel: "competitive",
      trainingFrequency: "3-6 sessions/week"
    },
    citations: RESEARCH_CITATIONS["gabbett2016"] ? [RESEARCH_CITATIONS["gabbett2016"]] : [],
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
      maxWeeklyIncreasePercentConservative: 7
    },
    minChronicLoad: 50,
    minDaysForChronic: 21,
    minSessionsForChronic: 12,
    dataQuality: {
      lowConfidenceThreshold: 8,
      enableQualityFlags: true
    },
    scienceNotes: {
      thresholds: "ACWR thresholds (0.8-1.3 sweet spot, >1.5 danger zone) come from large-scale team-sport research on injury risk (Gabbett 2016). These are population-level findings from multiple studies.",
      coachOverride: "Coaches can override thresholds if they have their own philosophy or team-specific data showing different optimal ranges. Individual athletes may have different tolerance levels."
    }
  },
  readiness: {
    version: "1.0",
    population: {
      ageRange: "18-35 years",
      sportType: "5v5 flag football",
      competitionLevel: "competitive",
      trainingFrequency: "3-6 sessions/week"
    },
    citations: [
      RESEARCH_CITATIONS.halson2014,
      RESEARCH_CITATIONS.fullagar2015,
      RESEARCH_CITATIONS.saw2016,
      RESEARCH_CITATIONS.mclellan2011
    ],
    weightings: {
      // Re-weighted 2026-07-14 (mirrors calc-readiness.js): the only cluster-RCT
      // of ACWR-guided load management found no effect (Dalen-Lorentsen 2021,
      // BJSM) — workload is one input among several, and subjective wellness +
      // sleep carry the stronger monitoring evidence (Saw 2016; Halson 2014).
      workload: 0.25,
      wellness: 0.35,
      sleep: 0.25,
      proximity: 0.15
    },
    cutPoints: {
      lowMax: 55,
      moderateMax: 75
    },
    reducedDataMode: {
      enabled: true,
      wellnessCompletenessThreshold: 60,
      sleepWeightMultiplier: 1.5
    },
    wellnessIndex: {
      use1to5Scale: true,
      requiredFields: ["fatigue", "sleepQuality", "soreness"],
      optionalFields: ["mood", "stress", "energy"]
    },
    scienceNotes: {
      weightings: "Weightings optimized for team-sport contexts based on research showing stronger associations with self-reported wellness (McLellan 2011, Saw 2016). Sleep weightings based on strong evidence linking sleep to readiness (Halson 2014, Fullagar 2015).",
      cutPoints: "Cut-points (Low: <55, Moderate: 55-75, High: >75) are starting points based on common athlete monitoring scales. These require team-specific calibration using injury and performance history.",
      coachOverride: "Coaches should calibrate cut-points using their own team's data. Weightings can be adjusted based on team philosophy or individual athlete needs."
    }
  },
  tapering: {
    version: "1.0",
    population: {
      ageRange: "18-35 years",
      sportType: "5v5 flag football",
      competitionLevel: "competitive",
      trainingFrequency: "3-6 sessions/week"
    },
    citations: [
      RESEARCH_CITATIONS["bosquet2007"],
      RESEARCH_CITATIONS["mujika2003"]
    ].filter((c) => c !== void 0),
    taperDuration: {
      major: { min: 10, max: 14 },
      high: { min: 7, max: 10 },
      medium: { min: 5, max: 7 },
      minor: { min: 3, max: 5 }
    },
    targetVolumeReduction: {
      major: { min: 0.5, max: 0.7 },
      high: { min: 0.4, max: 0.6 },
      medium: { min: 0.3, max: 0.5 },
      minor: { min: 0.2, max: 0.4 }
    },
    minIntensityFloor: 0.8,
    maxIntensityFloor: 0.9,
    postOverloadTaper: {
      volumeReduction: { min: 0.6, max: 0.9 },
      duration: { min: 10, max: 14 }
    },
    overloadPeriod: {
      duration: { min: 14, max: 28 },
      volumeMultiplier: 1.1,
      intensityMultiplier: 0.95
    },
    scienceNotes: {
      taperDuration: "Taper duration ranges (7-14 days for major events, 3-5 days for minor) come from meta-analysis of tapering research (Bosquet 2007). Shorter tapers acceptable for minor competitions.",
      volumeReduction: "Volume reduction ranges (40-60% consensus, up to 60-90% after overload) based on systematic reviews. These are population-level findings.",
      intensityFloor: "Intensity floor (80-90% of normal) maintains moderate-high intensity during taper, preventing detraining (Mujika 2003).",
      coachOverride: "Coaches can adjust taper duration and volume reductions based on athlete response, team philosophy, or individual needs. Intensity floor can be modified but research suggests maintaining intensity prevents detraining."
    }
  },
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  changelog: [
    "v1.0 (2026-01-01): Initial release with evidence-based ACWR, readiness, and tapering configurations"
  ]
};
var YOUTH_FLAG_V1 = {
  id: "youth_flag_v1",
  name: "Youth Flag Football v1",
  version: "1.0",
  description: "More conservative configuration for youth/adolescent flag football players (13-17 years)",
  population: {
    ageRange: "13-17 years",
    sportType: "5v5 flag football",
    competitionLevel: "competitive",
    trainingFrequency: "3-5 sessions/week",
    gender: "mixed",
    notes: "Youth population - more conservative thresholds due to growth and development considerations"
  },
  acwr: {
    version: "1.0",
    population: {
      ageRange: "13-17 years",
      sportType: "5v5 flag football",
      competitionLevel: "competitive",
      trainingFrequency: "3-5 sessions/week"
    },
    citations: RESEARCH_CITATIONS["gabbett2016"] ? [RESEARCH_CITATIONS["gabbett2016"]] : [],
    // Mirrors server utils/acwr.js: uncoupled 21d chronic window, λ = 2/(N+1)
    acuteWindowDays: 7,
    chronicWindowDays: 21,
    acuteLambda: 0.25,
    chronicLambda: 0.0909,
    thresholds: {
      sweetSpotLow: 0.8,
      sweetSpotHigh: 1.2,
      // More conservative (1.2 vs 1.3)
      dangerHigh: 1.4,
      // More conservative (1.4 vs 1.5)
      maxWeeklyIncreasePercent: 7,
      // More conservative (7% vs 10%)
      maxWeeklyIncreasePercentConservative: 5
    },
    minChronicLoad: 40,
    // Lower minimum for youth
    minDaysForChronic: 21,
    minSessionsForChronic: 10,
    dataQuality: {
      lowConfidenceThreshold: 8,
      enableQualityFlags: true
    },
    scienceNotes: {
      thresholds: "More conservative thresholds for youth due to growth and development considerations. Based on adult research (Gabbett 2016) with conservative adjustments.",
      coachOverride: "Youth coaches should be especially cautious and may want even more conservative thresholds. Individual growth patterns should be considered."
    }
  },
  readiness: {
    version: "1.0",
    population: {
      ageRange: "13-17 years",
      sportType: "5v5 flag football",
      competitionLevel: "competitive",
      trainingFrequency: "3-5 sessions/week"
    },
    citations: [
      RESEARCH_CITATIONS["halson2014"],
      RESEARCH_CITATIONS["saw2016"]
    ].filter((c) => c !== void 0),
    weightings: {
      workload: 0.3,
      // Lower workload weight
      wellness: 0.35,
      // Higher wellness weight (youth may be more sensitive)
      sleep: 0.25,
      // Higher sleep weight (critical for youth)
      proximity: 0.1
    },
    cutPoints: {
      lowMax: 50,
      // More conservative (50 vs 55)
      moderateMax: 70
      // More conservative (70 vs 75)
    },
    reducedDataMode: {
      enabled: true,
      wellnessCompletenessThreshold: 60,
      sleepWeightMultiplier: 1.5
    },
    wellnessIndex: {
      use1to5Scale: true,
      requiredFields: ["fatigue", "sleepQuality", "soreness"],
      optionalFields: ["mood", "stress", "energy"]
    },
    scienceNotes: {
      weightings: "Adjusted weightings for youth population - higher emphasis on sleep and wellness due to growth considerations.",
      cutPoints: "More conservative cut-points for youth. Coaches should monitor closely and adjust based on individual responses.",
      coachOverride: "Youth coaches should be especially cautious with thresholds. Consider individual growth patterns and school/academic stress."
    }
  },
  tapering: {
    version: "1.0",
    population: {
      ageRange: "13-17 years",
      sportType: "5v5 flag football",
      competitionLevel: "competitive",
      trainingFrequency: "3-5 sessions/week"
    },
    citations: [
      RESEARCH_CITATIONS["bosquet2007"],
      RESEARCH_CITATIONS["mujika2003"]
    ].filter((c) => c !== void 0),
    taperDuration: {
      major: { min: 10, max: 14 },
      high: { min: 7, max: 10 },
      medium: { min: 5, max: 7 },
      minor: { min: 3, max: 5 }
    },
    targetVolumeReduction: {
      major: { min: 0.45, max: 0.65 },
      // Slightly more conservative
      high: { min: 0.35, max: 0.55 },
      medium: { min: 0.25, max: 0.45 },
      minor: { min: 0.15, max: 0.35 }
    },
    minIntensityFloor: 0.8,
    maxIntensityFloor: 0.9,
    postOverloadTaper: {
      volumeReduction: { min: 0.55, max: 0.85 },
      duration: { min: 10, max: 14 }
    },
    overloadPeriod: {
      duration: { min: 14, max: 28 },
      volumeMultiplier: 1.05,
      // Less aggressive overload (5% vs 10%)
      intensityMultiplier: 0.95
    },
    scienceNotes: {
      taperDuration: "Taper duration similar to adults but volume reductions slightly more conservative for youth.",
      volumeReduction: "Slightly more conservative volume reductions for youth due to growth considerations.",
      intensityFloor: "Intensity floor maintained (80-90%) as per research (Mujika 2003).",
      coachOverride: "Youth coaches should monitor athlete response closely and adjust taper protocols based on individual needs."
    }
  },
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  changelog: [
    "v1.0 (2026-01-01): Initial release with conservative thresholds for youth population"
  ]
};
var RETURN_TO_PLAY_V1 = {
  id: "return_to_play_v1",
  name: "Return to Play v1",
  version: "1.0",
  description: "Conservative configuration for athletes returning from injury or extended time off",
  population: {
    ageRange: "18-35 years",
    sportType: "5v5 flag football",
    competitionLevel: "competitive",
    trainingFrequency: "2-4 sessions/week",
    gender: "mixed",
    notes: "Return-to-play population - very conservative thresholds to prevent re-injury"
  },
  acwr: {
    version: "1.0",
    population: {
      ageRange: "18-35 years",
      sportType: "5v5 flag football",
      competitionLevel: "competitive",
      trainingFrequency: "2-4 sessions/week"
    },
    citations: RESEARCH_CITATIONS["gabbett2016"] ? [RESEARCH_CITATIONS["gabbett2016"]] : [],
    // Mirrors server utils/acwr.js: uncoupled 21d chronic window, λ = 2/(N+1)
    acuteWindowDays: 7,
    chronicWindowDays: 21,
    acuteLambda: 0.25,
    chronicLambda: 0.0909,
    thresholds: {
      sweetSpotLow: 0.7,
      // More conservative (0.7 vs 0.8)
      sweetSpotHigh: 1.1,
      // More conservative (1.1 vs 1.3)
      dangerHigh: 1.3,
      // Much more conservative (1.3 vs 1.5)
      maxWeeklyIncreasePercent: 5,
      // Very conservative (5% vs 10%)
      maxWeeklyIncreasePercentConservative: 3
    },
    minChronicLoad: 30,
    // Lower minimum for RTP
    minDaysForChronic: 21,
    minSessionsForChronic: 8,
    dataQuality: {
      lowConfidenceThreshold: 6,
      enableQualityFlags: true
    },
    scienceNotes: {
      thresholds: "Very conservative thresholds for return-to-play to prevent re-injury. Based on Gabbett (2016) with conservative adjustments.",
      coachOverride: "RTP protocols should be individualized based on injury type, time off, and medical clearance. These are starting points."
    }
  },
  readiness: {
    version: "1.0",
    population: {
      ageRange: "18-35 years",
      sportType: "5v5 flag football",
      competitionLevel: "competitive",
      trainingFrequency: "2-4 sessions/week"
    },
    citations: [
      RESEARCH_CITATIONS["halson2014"],
      RESEARCH_CITATIONS["saw2016"]
    ].filter((c) => c !== void 0),
    weightings: {
      workload: 0.3,
      wellness: 0.35,
      // Higher wellness weight for RTP
      sleep: 0.25,
      // Higher sleep weight
      proximity: 0.1
    },
    cutPoints: {
      lowMax: 50,
      // More conservative
      moderateMax: 70
    },
    reducedDataMode: {
      enabled: true,
      wellnessCompletenessThreshold: 60,
      sleepWeightMultiplier: 1.5
    },
    wellnessIndex: {
      use1to5Scale: true,
      requiredFields: ["fatigue", "sleepQuality", "soreness"],
      optionalFields: ["mood", "stress", "energy"]
    },
    scienceNotes: {
      weightings: "Higher emphasis on wellness and sleep for RTP athletes. Workload weight reduced to prevent overloading.",
      cutPoints: "More conservative cut-points for RTP. Athletes should progress gradually.",
      coachOverride: "RTP protocols must be individualized and coordinated with medical professionals. These are conservative starting points."
    }
  },
  tapering: {
    version: "1.0",
    population: {
      ageRange: "18-35 years",
      sportType: "5v5 flag football",
      competitionLevel: "competitive",
      trainingFrequency: "2-4 sessions/week"
    },
    citations: [
      RESEARCH_CITATIONS["bosquet2007"],
      RESEARCH_CITATIONS["mujika2003"]
    ].filter((c) => c !== void 0),
    taperDuration: {
      major: { min: 10, max: 14 },
      high: { min: 7, max: 10 },
      medium: { min: 5, max: 7 },
      minor: { min: 3, max: 5 }
    },
    targetVolumeReduction: {
      major: { min: 0.4, max: 0.6 },
      // More conservative
      high: { min: 0.3, max: 0.5 },
      medium: { min: 0.2, max: 0.4 },
      minor: { min: 0.15, max: 0.3 }
    },
    minIntensityFloor: 0.75,
    // Slightly lower (75% vs 80%)
    maxIntensityFloor: 0.85,
    postOverloadTaper: {
      volumeReduction: { min: 0.5, max: 0.8 },
      duration: { min: 10, max: 14 }
    },
    overloadPeriod: {
      duration: { min: 14, max: 28 },
      volumeMultiplier: 1,
      // No overload for RTP
      intensityMultiplier: 1
    },
    scienceNotes: {
      taperDuration: "Taper duration similar but volume reductions more conservative for RTP athletes.",
      volumeReduction: "More conservative volume reductions to prevent re-injury. No overload period recommended.",
      intensityFloor: "Slightly lower intensity floor (75-85%) for RTP athletes.",
      coachOverride: "RTP taper protocols must be individualized and coordinated with medical professionals. No overload period recommended."
    }
  },
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  changelog: [
    "v1.0 (2026-01-01): Initial release with very conservative thresholds for return-to-play"
  ]
};
var MASTERS_FLAG_V1 = {
  ...ADULT_FLAG_COMPETITIVE_V1,
  id: "masters_flag_v1",
  name: "Masters Flag Football v1 (35+)",
  version: "1.0",
  description: "Conservative configuration for masters flag football players (35+ years): tighter ACWR bands on top of the engine's age-scaled CNS recovery windows. Heuristic extrapolation \u2014 tightening only.",
  population: {
    ...ADULT_FLAG_COMPETITIVE_V1.population,
    ageRange: "35+ years",
    notes: "Masters population \u2014 slower connective-tissue recovery; conservative load-change tolerance. No masters-specific flag dataset yet (heuristic tier)."
  },
  acwr: {
    ...ADULT_FLAG_COMPETITIVE_V1.acwr,
    population: {
      ...ADULT_FLAG_COMPETITIVE_V1.acwr.population,
      ageRange: "35+ years"
    },
    thresholds: {
      ...ADULT_FLAG_COMPETITIVE_V1.acwr.thresholds,
      sweetSpotLow: 0.8,
      sweetSpotHigh: 1.2,
      // tighter than adult 1.3
      dangerHigh: 1.4
      // tighter than adult 1.5
    }
  }
};

// angular/src/app/core/services/periodization-engine.ts
var FALLBACK_READINESS = 70;
var ACWR_UNDER = ADULT_FLAG_COMPETITIVE_V1.acwr.thresholds.sweetSpotLow;
var ACWR_ELEVATED = ADULT_FLAG_COMPETITIVE_V1.acwr.thresholds.sweetSpotHigh;
var ACWR_DANGER = ADULT_FLAG_COMPETITIVE_V1.acwr.thresholds.dangerHigh;
var READINESS_LOW = 55;
var DENSITY_HEAVY_GAMES_14D = 10;
var DENSITY_CONGESTED_DAY_GAMES = 3;
var INTENT_LABELS = {
  rest: "Rest + daily mobility",
  recovery: "Active recovery",
  mobility: "Mobility & technique",
  technical: "Skills focus",
  sprint: "Sprint focus",
  strength: "Strength session",
  mixed: "Mixed session",
  "taper-prime": "Pre-game prime",
  competition: "Game day",
  travel: "Travel day"
};
var HIGH_CNS_INTENTS = /* @__PURE__ */ new Set(["sprint", "mixed"]);
var CNS_RECOVERY_HOURS = 48;
function cnsRecoveryHoursForAge(ageYears) {
  if (typeof ageYears !== "number" || !Number.isFinite(ageYears) || ageYears < 16) {
    return CNS_RECOVERY_HOURS;
  }
  if (ageYears >= 40) return 72;
  if (ageYears >= 35) return 60;
  return CNS_RECOVERY_HOURS;
}
var FLAG_DRILL_HIGH_CNS_PATTERN = /\b(?:route|routes|post|fade|hook|evade|evasion|flag.?pull)\b/i;
function isHighCnsSessionType(type, rpe) {
  const t = type || "";
  if (/sprint|plyo|speed|max.?velocity|accel|agility|bound|competition/i.test(t))
    return true;
  if (FLAG_DRILL_HIGH_CNS_PATTERN.test(t)) {
    return rpe == null || rpe >= 6;
  }
  return false;
}
function applySprintRecoveryGuard(p, recentSessions, date, ageYears) {
  if (!HIGH_CNS_INTENTS.has(p.intent)) return p;
  if (!recentSessions || recentSessions.length === 0) return p;
  const windowHours = cnsRecoveryHoursForAge(ageYears);
  const now = date.getTime();
  const windowMs = windowHours * 36e5;
  let mostRecent = null;
  for (const s of recentSessions) {
    if (!isHighCnsSessionType(s.type, s.rpe ?? null)) continue;
    const t = new Date(s.at).getTime();
    if (!Number.isFinite(t) || t >= now) continue;
    if (now - t > windowMs) continue;
    if (mostRecent === null || t > mostRecent) mostRecent = t;
  }
  if (mostRecent === null) return p;
  const hoursSince = Math.round((now - mostRecent) / 36e5);
  return {
    ...p,
    intent: "technical",
    intentLabel: "Mobility & technique",
    sprintReps: 0,
    targetRpe: p.targetRpe != null ? Math.min(p.targetRpe, 5) : p.targetRpe,
    reasoning: `Sprinted ${hoursSince}h ago \u2014 ${windowHours}h CNS recovery; today is mobility + technique.`,
    cnsRecoveryAdjustment: {
      hoursSinceLastHighCns: hoursSince,
      windowHours,
      originalIntent: p.intent
    }
  };
}
function prescribeFor(inputs) {
  const base = decideBasePrescription(inputs);
  const spaced = applySprintRecoveryGuard(
    base,
    inputs.recentSessions ?? null,
    inputs.date,
    inputs.ageYears ?? null
  );
  const guarded = applyWeatherGuard(
    spaced,
    inputs.weather ?? null,
    inputs.coachOverride ?? false,
    inputs.acclimatizationDay ?? null
  );
  const arrivalGuarded = applyArrivalDayGuard(
    guarded,
    inputs.arrivalDayTravelHours ?? null
  );
  const physioGuarded = applyInjuryGuard(
    arrivalGuarded,
    inputs.activeRestrictions ?? null
  );
  const result = withPositionEmphasis(
    physioGuarded,
    inputs.position ?? null,
    inputs.activeRestrictions?.restrictsThrowing ?? false
  );
  const plannedOutdoor = HEAT_GUARDED.has(spaced.intent);
  const injuryForced = inputs.activeRestrictions?.restrictsSprint ?? false;
  if (plannedOutdoor && !injuryForced && result.intent !== "rest") {
    const shift = findCoolerHour(
      inputs.weather?.hourly ?? null,
      inputs.preferredTrainingHour ?? inputs.date.getHours(),
      approxWBGT(
        inputs.weather?.tempC ?? null,
        inputs.weather?.humidityPct ?? null
      )
    );
    if (shift) return { ...result, timeShift: shift };
  }
  return result;
}
function positionBucket(position) {
  const p = (position ?? "").toLowerCase();
  if (!p) return null;
  if (/\bqb\b|quarterback/.test(p)) return "qb";
  if (/center|long.?snap|snapper/.test(p)) return "center";
  if (/blitz|rush/.test(p)) return "blitzer";
  if (/wr.?db|wr\/db|both.?way|hybrid|two.?way/.test(p)) return "wr_db";
  if (/\bwr\b|receiver|wide.?out|wideout/.test(p)) return "wr";
  if (/\bdb\b|corner|safety|defensive.?back|cornerback/.test(p)) return "db";
  return null;
}
function fmtDemand(v) {
  if (v == null) return null;
  return typeof v === "number" ? `${v}` : `${v.min}\u2013${v.max}`;
}
function volumeFor(bucket) {
  const v = POSITION_VOLUME[bucket];
  const targets = [];
  const wkCatches = fmtDemand(v.perWeek["catches"]);
  if (wkCatches) targets.push(`~${wkCatches} catches/week`);
  const throws = fmtDemand(v.perSession["throws"]);
  if (throws) targets.push(`${throws} throws/session`);
  const snaps = fmtDemand(v.perSession["snaps"]);
  if (snaps) targets.push(`${snaps} snaps/session`);
  const backped = fmtDemand(v.perSession["backpedals"]);
  if (backped) targets.push(`up to ${backped} backpedals/session`);
  const sprints = fmtDemand(v.perGameWorstCase["sprints"]);
  if (sprints) targets.push(`up to ${sprints} sprints/game`);
  const accels = fmtDemand(v.perGameWorstCase["explosiveSprints"]);
  if (accels) targets.push(`~${accels} max sprints/game`);
  if (bucket === "qb") targets.push("~320 throws/tournament");
  return { worstCase: v.worstCase, targets };
}
function withPositionEmphasis(p, position, restrictsThrowing = false) {
  const bucket = positionBucket(position);
  if (!bucket || p.intent === "rest") {
    return { ...p, positionEmphasis: null };
  }
  const volume = volumeFor(bucket);
  const pv = POSITION_VOLUME[bucket];
  if (restrictsThrowing && (bucket === "qb" || bucket === "center")) {
    const verb = bucket === "qb" ? "throwing" : "snapping";
    return {
      ...p,
      positionEmphasis: {
        position: bucket,
        label: pv.label,
        focus: [
          "Protect the arm/shoulder",
          "Gentle pain-free ROM only",
          `No ${verb} reps today`
        ],
        note: `Your ${verb} arm/shoulder is flagged \u2014 skip ${verb} work today and protect it. Lower-body and trunk work is fine if pain-free.`,
        restricted: true,
        volume
      }
    };
  }
  const focusByPosition = {
    qb: [
      "Rotator-cuff & scapular control",
      "Thoracic rotation mobility",
      "Rotational core power"
    ],
    wr: [
      "Eccentric hamstring (Nordic)",
      "Deceleration & landing mechanics",
      "Ankle & calf resilience"
    ],
    db: [
      "Eccentric hamstring & adductor",
      "Backpedal-to-sprint hip-flip control",
      "Deceleration mechanics"
    ],
    center: [
      "Wrist & forearm care",
      "Shoulder & scapular control",
      "Anti-rotation core brace"
    ],
    blitzer: [
      "Max-effort accel mechanics",
      "Eccentric hamstring & calf",
      "Hard-braking deceleration"
    ],
    wr_db: [
      "Eccentric hamstring & adductor",
      "Deceleration & cut mechanics",
      "Ankle & calf resilience"
    ]
  };
  return {
    ...p,
    positionEmphasis: {
      position: bucket,
      label: pv.label,
      focus: focusByPosition[bucket],
      note: pv.primaryInjuryRisk,
      volume
    }
  };
}
var ARRIVAL_DAY_LOAD_CAP_HOURS = 3;
var ARRIVAL_DAY_EXEMPT_INTENTS = /* @__PURE__ */ new Set([
  "rest",
  "recovery",
  "mobility",
  "taper-prime",
  "competition"
]);
function applyArrivalDayGuard(rx, arrivalDayTravelHours) {
  if (arrivalDayTravelHours === null || arrivalDayTravelHours < ARRIVAL_DAY_LOAD_CAP_HOURS) {
    return rx;
  }
  if (ARRIVAL_DAY_EXEMPT_INTENTS.has(rx.intent)) {
    return rx;
  }
  return {
    ...rx,
    intent: "mobility",
    intentLabel: "Arrival-day activation",
    targetRpe: rx.targetRpe === null ? null : Math.min(rx.targetRpe, 4),
    targetMinutes: Math.min(rx.targetMinutes, 30),
    sprintReps: 0,
    strengthSets: 0,
    reasoning: `${Math.round(arrivalDayTravelHours)}h of travel today \u2014 activation only, no new fatigue on top of the trip. ${rx.reasoning}`
  };
}
var INJURY_RESPONSE = {
  severe: { rpe: 3, minutes: 30, sets: 0 },
  moderate: { rpe: 3, maxMinutes: 40, maxSets: 3 },
  minor: { maxRpe: 6 }
};
function applyInjuryGuard(p, restr) {
  if (!restr || !restr.restrictsSprint) return p;
  if (p.intent === "competition" || p.intent === "travel") return p;
  const severe = restr.severity === "severe";
  const moderate = restr.severity === "moderate";
  const hasSprintWork = p.sprintReps > 0 || p.intent === "sprint";
  if (!hasSprintWork && !severe && !moderate) return p;
  const regionLabel = restr.regions.length ? restr.regions.join(", ") : "soft tissue";
  let intent = p.intent;
  let intentLabel = p.intentLabel;
  let targetRpe = p.targetRpe;
  let targetMinutes = p.targetMinutes;
  let strengthSets = p.strengthSets;
  let reasoning = p.reasoning;
  if (severe) {
    intent = "recovery";
    intentLabel = "Active recovery";
    targetRpe = INJURY_RESPONSE.severe.rpe;
    targetMinutes = INJURY_RESPONSE.severe.minutes;
    strengthSets = INJURY_RESPONSE.severe.sets;
    reasoning = `Reported ${regionLabel} issue \u2014 recovery only today. Injury precedence over training.`;
  } else if (moderate) {
    intent = "recovery";
    intentLabel = "Active recovery";
    targetRpe = INJURY_RESPONSE.moderate.rpe;
    targetMinutes = Math.min(
      p.targetMinutes,
      INJURY_RESPONSE.moderate.maxMinutes
    );
    strengthSets = Math.min(p.strengthSets, INJURY_RESPONSE.moderate.maxSets);
    reasoning = `Reported ${regionLabel} tightness \u2014 sprints pulled, easy session only. Injury precedence over training.`;
  } else {
    intent = p.intent === "sprint" ? "mobility" : p.intent;
    intentLabel = p.intent === "sprint" ? "Mobility & technique" : `${p.intentLabel} (modified)`;
    targetRpe = p.targetRpe != null ? Math.min(p.targetRpe, INJURY_RESPONSE.minor.maxRpe) : p.targetRpe;
    reasoning = `${regionLabel} tightness \u2014 sprint/high-intensity work pulled for that region; keep it controlled.`;
  }
  return {
    ...p,
    intent,
    intentLabel,
    targetRpe,
    targetMinutes,
    sprintReps: 0,
    strengthSets,
    reasoning,
    injuryAdjustment: {
      regions: restr.regions,
      severity: restr.severity ?? "minor",
      summary: `${p.intentLabel} \u2192 ${intentLabel}; sprints ${p.sprintReps}\u21920`
    }
  };
}
var PRACTICE_PHASE_MODIFIERS = {
  accumulation: {
    intent: "mixed",
    rpe: 7,
    minutes: 90,
    recoveryEmphasis: "low",
    nutritionIntent: "mixed",
    framing: "own"
  },
  transition: {
    intent: "mixed",
    rpe: 7,
    minutes: 90,
    recoveryEmphasis: "low",
    nutritionIntent: "mixed",
    framing: "own"
  },
  // Sharp practice a few days out: still a real session → fuel as 'mixed', NOT a
  // glycogen top-up (top-up is only the final day, handled by the taper branch).
  // Taper = cut VOLUME, hold INTENSITY (Bosquet 2007): RPE stays at the
  // accumulation baseline (7); only the duration drops (90 → 60 min).
  taper: {
    intent: "mixed",
    rpe: 7,
    minutes: 60,
    recoveryEmphasis: "medium",
    nutritionIntent: "mixed",
    framing: "sharp"
  },
  // Final 48h of a taper → shorter, still-sharp walkthrough/activation + begin
  // glycogen top-up. Intensity held at baseline (RPE 7); volume halved (90 → 45).
  taper_final: {
    intent: "mixed",
    rpe: 7,
    minutes: 45,
    recoveryEmphasis: "medium",
    nutritionIntent: "taper-prime",
    framing: "sharp"
  },
  // Post-tournament recovery day that is ALSO a declared practice day: honour the
  // practice (the athlete is going) but at recovery intensity — the calendar fact
  // is modified by the recovery context, not discarded (audit finding 1.1). Same
  // RPE3/30min as the recovery default, so intensity is unchanged; only the label
  // and framing now acknowledge the practice.
  recovery: {
    intent: "recovery",
    rpe: 3,
    minutes: 30,
    recoveryEmphasis: "high",
    nutritionIntent: "recovery",
    framing: "recovery"
  }
};
var TAPER_CONFIG = {
  /** ≤ this many hours to the game → taper-prime (very short, sharp). */
  taperPrimeHours: 24,
  /** ≤ this many days out = the lighter "final third" of a taper. */
  finalThirdDaysOut: 2,
  /** Default day-of-taper when hours-to-event is unknown. */
  defaultDayOfTaper: 7,
  /**
   * The final 48h keeps the SAME intensity as the front of the taper but a
   * lower VOLUME — a few extra-crisp sprints. Applied on top of the level's
   * volumeFloorPct (see resolveTaperTargets). ~0.66 → e.g. 30min/5reps front →
   * 20min/3reps final at the international tier (Bosquet exponential taper).
   */
  finalThirdVolumeFactor: 0.66
};
var EMBEDDED_TAPER_RULES = {
  version: "v1-2026-07-13",
  source: "embedded",
  byLevel: {
    // A taper reduces VOLUME (volumeFloorPct) while HOLDING INTENSITY
    // (intensityRetention ≥ 0.90, so RPE never crashes — rubric B6). Bigger
    // events get a deeper volume cut; a local game gets a short, light taper.
    local: { volumeFloorPct: 0.7, intensityRetention: 0.9, taperDays: 3 },
    regional: { volumeFloorPct: 0.6, intensityRetention: 0.95, taperDays: 5 },
    national: { volumeFloorPct: 0.55, intensityRetention: 0.95, taperDays: 7 },
    international: {
      volumeFloorPct: 0.5,
      intensityRetention: 1,
      taperDays: 10
    },
    world: { volumeFloorPct: 0.5, intensityRetention: 1, taperDays: 12 }
  }
};
function taperLevelFor(level) {
  switch (level) {
    case "club":
      return "local";
    case "regional":
      return "regional";
    case "national":
      return "national";
    case "international":
    case "continental":
      return "international";
    case "world":
    case "olympic":
      return "world";
    default:
      return "national";
  }
}
function resolveTaperTargets(ruleset, level, isFinalThird) {
  const base = baseTargets("sprint");
  const rule = ruleset.byLevel[taperLevelFor(level)] ?? EMBEDDED_TAPER_RULES.byLevel.national;
  const volFactor = isFinalThird ? rule.volumeFloorPct * TAPER_CONFIG.finalThirdVolumeFactor : rule.volumeFloorPct;
  return {
    intent: "sprint",
    rpe: Math.round((base.targetRpe ?? 8) * rule.intensityRetention),
    minutes: Math.round(base.targetMinutes * volFactor),
    sprintReps: Math.max(2, Math.round(base.sprintReps * volFactor))
  };
}
function practiceModifierFor(phase, daysOut) {
  const key = phase === "taper" && daysOut !== null && daysOut <= TAPER_CONFIG.finalThirdDaysOut ? "taper_final" : phase;
  return PRACTICE_PHASE_MODIFIERS[key] ?? null;
}
var TOURNAMENT_RECOVERY_GAMES = 4;
var TOURNAMENT_RECOVERY_WINDOW_DAYS = 2;
function detectTournamentRecoveryDay(lastEvent, date) {
  if (!lastEvent) return null;
  if ((lastEvent.expectedGameCount ?? 0) < TOURNAMENT_RECOVERY_GAMES)
    return null;
  const eventEnd = new Date(lastEvent.endsAt ?? lastEvent.startsAt);
  const msAfterEnd = date.getTime() - eventEnd.getTime();
  if (msAfterEnd <= 0) return null;
  const dayAfterEnd = Math.ceil(msAfterEnd / 864e5);
  return dayAfterEnd <= TOURNAMENT_RECOVERY_WINDOW_DAYS ? dayAfterEnd : null;
}
function applyPostTournamentRecovery(inputs, dayAfterTournament) {
  const { date, bodyweightKg, acwr, seasonPhase, upcoming, lastEvent } = inputs;
  const bodyweight = bodyweightKg ?? null;
  const gameCount = lastEvent.expectedGameCount ?? 0;
  const eventName = lastEvent.competitionShortName ?? lastEvent.competitionName ?? "your tournament";
  const hoursUntilNext = nextEventHours(date, upcoming);
  const intent = dayAfterTournament === 1 ? "recovery" : "mobility";
  return finalize({
    date,
    phase: inputs.phase,
    intent,
    targetRpe: dayAfterTournament === 1 ? 3 : 4,
    targetMinutes: dayAfterTournament === 1 ? 30 : 45,
    sprintReps: 0,
    strengthSets: 0,
    reasoning: dayAfterTournament === 1 ? `Day 1 after ${eventName} (${gameCount} games) \u2014 recovery only. Acute neuromuscular damage is still being repaired; no sprint or strength today.` : `Day 2 after ${eventName} (${gameCount} games) \u2014 light mobility only; neuromuscular recovery is still active.`,
    recoveryEmphasis: dayAfterTournament === 1 ? "critical" : "high",
    nutrition: nutritionFor("recovery", bodyweight, false, false),
    driverEvent: lastEvent,
    hoursUntilNextEvent: hoursUntilNext,
    acwrAtIssue: acwr,
    seasonPhase: seasonPhase ?? null,
    tournamentRecoveryAdjustment: {
      dayAfterTournament,
      gamesPlayed: gameCount,
      tournamentName: eventName
    }
  });
}
function modulateIntentForLoad(intent, acwr, heavyDensity, weeklyProgressionUnsafe) {
  let i = intent;
  if (acwr !== null && acwr > ACWR_ELEVATED) {
    if (i === "sprint" || i === "strength") i = "mobility";
    else if (i === "mixed") i = "technical";
  }
  if (heavyDensity && i !== "rest") {
    if (i === "strength") i = "technical";
    if (i === "mixed") i = "mobility";
  }
  if (weeklyProgressionUnsafe && (i === "sprint" || i === "strength" || i === "mixed")) {
    i = "technical";
  }
  return i;
}
function decideBasePrescription(inputs) {
  const {
    date,
    phase,
    upcoming,
    lastEvent,
    acwr,
    readiness,
    bodyweightKg,
    density14d,
    seasonPhase = null
  } = inputs;
  const driverEvent = pickDriverEvent(date, upcoming, lastEvent);
  const hoursUntilNext = nextEventHours(date, upcoming);
  const bodyweight = bodyweightKg ?? null;
  const effectiveReadiness = readiness ?? FALLBACK_READINESS;
  const heavyDensity = !!density14d && (density14d.totalGames >= DENSITY_HEAVY_GAMES_14D || (density14d.peakDayGameCount ?? 0) >= DENSITY_CONGESTED_DAY_GAMES);
  const apparentTemp = inputs.weather?.apparentC ?? inputs.weather?.tempC ?? null;
  const hotDay = typeof apparentTemp === "number" && apparentTemp >= HEAT_CAUTION_C;
  if (phase === "competition") {
    return finalize({
      date,
      phase,
      intent: "competition",
      targetRpe: null,
      targetMinutes: 60,
      sprintReps: 0,
      strengthSets: 0,
      reasoning: "Game day. Activate, play, refuel between games, sleep tonight.",
      recoveryEmphasis: "critical",
      nutrition: nutritionFor("competition", bodyweight, heavyDensity, hotDay),
      driverEvent,
      hoursUntilNextEvent: hoursUntilNext,
      acwrAtIssue: acwr
    });
  }
  if (hoursUntilNext !== null && hoursUntilNext <= TAPER_CONFIG.taperPrimeHours) {
    return finalize({
      date,
      phase,
      intent: "taper-prime",
      targetRpe: 4,
      targetMinutes: 25,
      sprintReps: 4,
      strengthSets: 0,
      reasoning: "Game inside 24 hours. Stay loose and primed \u2014 no new fatigue.",
      recoveryEmphasis: "high",
      nutrition: nutritionFor("taper-prime", bodyweight, heavyDensity, hotDay),
      driverEvent,
      hoursUntilNextEvent: hoursUntilNext,
      acwrAtIssue: acwr
    });
  }
  if (acwr !== null && acwr > ACWR_DANGER) {
    return finalize({
      date,
      phase,
      intent: "rest",
      targetRpe: 2,
      targetMinutes: 15,
      sprintReps: 0,
      strengthSets: 0,
      reasoning: `ACWR ${acwr.toFixed(2)} is in the danger zone \u2014 full rest today. Gentle 15-min mobility and stretching only; no cardio or loading.`,
      recoveryEmphasis: "critical",
      nutrition: nutritionFor("rest", bodyweight, heavyDensity, hotDay),
      driverEvent,
      hoursUntilNextEvent: hoursUntilNext,
      acwrAtIssue: acwr
    });
  }
  if (effectiveReadiness < READINESS_LOW) {
    return finalize({
      date,
      phase,
      intent: "recovery",
      targetRpe: 3,
      targetMinutes: 30,
      sprintReps: 0,
      strengthSets: 0,
      reasoning: `Readiness ${Math.round(effectiveReadiness)}/100 is low. Active recovery only.`,
      recoveryEmphasis: "high",
      nutrition: nutritionFor("recovery", bodyweight, heavyDensity, hotDay),
      driverEvent,
      hoursUntilNextEvent: hoursUntilNext,
      acwrAtIssue: acwr
    });
  }
  const tournamentRecoveryDay = detectTournamentRecoveryDay(lastEvent, date);
  if (phase === "travel") {
    return finalize({
      date,
      phase,
      intent: "travel",
      targetRpe: null,
      targetMinutes: 0,
      sprintReps: 0,
      strengthSets: 0,
      reasoning: "Travel day. Rest, stay hydrated, keep legs moving between transit. Arrive fresh.",
      recoveryEmphasis: "high",
      nutrition: nutritionFor("travel", bodyweight, false, hotDay),
      driverEvent,
      hoursUntilNextEvent: hoursUntilNext,
      acwrAtIssue: acwr
    });
  }
  const practiceDaysOut = hoursUntilNext !== null ? Math.max(1, Math.ceil(hoursUntilNext / 24)) : null;
  const practiceMod = inputs.isTeamPractice ? tournamentRecoveryDay !== null ? PRACTICE_PHASE_MODIFIERS["recovery"] : practiceModifierFor(phase, practiceDaysOut) : null;
  if (practiceMod) {
    const eventName = driverEvent ? driverEvent.competitionShortName ?? driverEvent.competitionName : null;
    const practiceReasoning = tournamentRecoveryDay !== null ? `Practice today, but you're in post-tournament recovery (day ${tournamentRecoveryDay} after ${eventName ?? "your tournament"}) \u2014 active recovery and mobility only; no hard reps.` : practiceMod.framing === "recovery" ? "Practice today, but you're in post-game recovery \u2014 keep it very light: active recovery and mobility only, no hard reps." : practiceMod.framing === "sharp" ? `Practice today is your session${practiceDaysOut !== null ? ` \u2014 ${practiceDaysOut} day${practiceDaysOut === 1 ? "" : "s"} to ${eventName ?? "your next game"}` : ""}. Keep it sharp, not heavy: crisp reps, full recovery, no grinding.` : "Team practice today \u2014 that's your main session. Keep any extra individual work light (mobility / activation).";
    return finalize({
      date,
      phase,
      intent: practiceMod.intent,
      intentLabel: "Flag football practice",
      targetRpe: practiceMod.rpe,
      targetMinutes: practiceMod.minutes,
      sprintReps: 0,
      strengthSets: 0,
      reasoning: practiceReasoning,
      recoveryEmphasis: practiceMod.recoveryEmphasis,
      nutrition: nutritionFor(
        practiceMod.nutritionIntent,
        bodyweight,
        heavyDensity,
        hotDay
      ),
      driverEvent,
      hoursUntilNextEvent: hoursUntilNext,
      acwrAtIssue: acwr,
      seasonPhase: seasonPhase ?? null,
      tournamentRecoveryAdjustment: tournamentRecoveryDay !== null ? {
        dayAfterTournament: tournamentRecoveryDay,
        gamesPlayed: lastEvent?.expectedGameCount ?? 0,
        tournamentName: eventName
      } : null
    });
  }
  if (tournamentRecoveryDay !== null && !inputs.isTeamPractice) {
    return applyPostTournamentRecovery(inputs, tournamentRecoveryDay);
  }
  switch (phase) {
    case "recovery":
      return finalize({
        date,
        phase,
        intent: "recovery",
        targetRpe: 3,
        targetMinutes: 30,
        sprintReps: 0,
        strengthSets: 0,
        reasoning: postEventReasoning(lastEvent),
        recoveryEmphasis: "high",
        nutrition: nutritionFor("recovery", bodyweight, heavyDensity, hotDay),
        driverEvent,
        hoursUntilNextEvent: hoursUntilNext,
        acwrAtIssue: acwr
      });
    case "taper": {
      const dayOfTaper = hoursUntilNext !== null ? Math.max(1, Math.ceil(hoursUntilNext / 24)) : TAPER_CONFIG.defaultDayOfTaper;
      const ruleset = inputs.taperRuleset ?? EMBEDDED_TAPER_RULES;
      const t = resolveTaperTargets(
        ruleset,
        driverEvent?.competitionLevel ?? null,
        dayOfTaper <= TAPER_CONFIG.finalThirdDaysOut
      );
      return finalize({
        date,
        phase,
        intent: t.intent,
        targetRpe: t.rpe,
        targetMinutes: t.minutes,
        sprintReps: t.sprintReps,
        strengthSets: 0,
        reasoning: taperReasoning(driverEvent, dayOfTaper),
        recoveryEmphasis: "medium",
        nutrition: nutritionFor("taper", bodyweight, heavyDensity, hotDay),
        driverEvent,
        hoursUntilNextEvent: hoursUntilNext,
        acwrAtIssue: acwr
      });
    }
    // transition (off-season / no games) shares the realization path with
    // accumulation: a schedule-aware hint from planWeekIntents drives a proper
    // phase-shaped session (this is how an off-season week becomes a real
    // anchor-placed GPP plan — strength / mixed sprint-conditioning / skill —
    // instead of a flat "mixed" every day). The only transition-specific behaviour
    // is the no-week-context fallback, guarded at the top of the shared block.
    case "transition":
    case "accumulation":
    default: {
      if (phase === "transition" && inputs.weeklyIntentHint == null) {
        return finalize({
          date,
          phase,
          intent: heavyDensity ? "mobility" : "mixed",
          targetRpe: 5,
          targetMinutes: 45,
          sprintReps: 0,
          strengthSets: 3,
          reasoning: "Off-season window. Maintain GPP base \u2014 easy aerobic + lift.",
          recoveryEmphasis: "low",
          nutrition: nutritionFor(
            "transition",
            bodyweight,
            heavyDensity,
            hotDay
          ),
          driverEvent,
          hoursUntilNextEvent: hoursUntilNext,
          acwrAtIssue: acwr
        });
      }
      const weekHint = inputs.weeklyIntentHint ?? null;
      const weeklyUnsafe = inputs.weeklyProgressionUnsafe ?? false;
      if (seasonPhase && seasonPhase !== "preseason") {
        let intent2 = weekHint !== null ? modulateIntentForLoad(weekHint, acwr, heavyDensity, weeklyUnsafe) : seasonShapedIntent(date, seasonPhase, acwr, heavyDensity);
        if (weekHint === null && weeklyUnsafe && (intent2 === "sprint" || intent2 === "strength" || intent2 === "mixed")) {
          intent2 = "technical";
        }
        const t2 = seasonPhase === "offseason" ? buildTargets(intent2) : baseTargets(intent2);
        return finalize({
          date,
          phase,
          intent: intent2,
          targetRpe: t2.targetRpe,
          targetMinutes: t2.targetMinutes,
          sprintReps: t2.sprintReps,
          strengthSets: t2.strengthSets,
          reasoning: seasonReasoning(seasonPhase, intent2),
          recoveryEmphasis: heavyDensity ? "medium" : "low",
          nutrition: nutritionFor(intent2, bodyweight, heavyDensity, hotDay),
          driverEvent,
          hoursUntilNextEvent: hoursUntilNext,
          acwrAtIssue: acwr,
          seasonPhase
        });
      }
      let intent = weekHint !== null ? modulateIntentForLoad(weekHint, acwr, heavyDensity, weeklyUnsafe) : pickAccumulationIntent(date, acwr, heavyDensity);
      if (weekHint === null && weeklyUnsafe && (intent === "sprint" || intent === "strength" || intent === "mixed")) {
        intent = "technical";
      }
      const t = buildTargets(intent);
      return finalize({
        date,
        phase,
        intent,
        targetRpe: t.targetRpe,
        targetMinutes: t.targetMinutes,
        sprintReps: t.sprintReps,
        strengthSets: t.strengthSets,
        reasoning: accumulationReasoning(intent, acwr, heavyDensity),
        recoveryEmphasis: heavyDensity ? "medium" : "low",
        nutrition: nutritionFor(intent, bodyweight, heavyDensity, hotDay),
        driverEvent,
        hoursUntilNextEvent: hoursUntilNext,
        acwrAtIssue: acwr,
        seasonPhase: seasonPhase ?? null
      });
    }
  }
}
function macroPhaseFor(date, windows) {
  if (!windows || windows.length === 0) {
    return null;
  }
  const iso = toIsoDate(date);
  const md = iso.slice(5);
  for (const w of windows) {
    if (w && w.from && w.to && inSeasonWindow(iso, md, w.from, w.to)) {
      return w.phase;
    }
  }
  return null;
}
function inSeasonWindow(iso, md, from, to) {
  const recurring = from.length === 5 && to.length === 5;
  if (recurring) {
    return from <= to ? md >= from && md <= to : md >= from || md <= to;
  }
  const f = from.slice(0, 10);
  const t = to.slice(0, 10);
  return f <= t ? iso >= f && iso <= t : iso >= f || iso <= t;
}
function phaseSessionModel(season) {
  switch (season) {
    case "preseason":
      return {
        afterPractice: "strength",
        beforePractice: "technical",
        quality: ["strength", "sprint"],
        secondCapPerWeek: 2,
        sandwiched: "technical"
      };
    case "inseason":
      return {
        afterPractice: "strength",
        beforePractice: "technical",
        quality: ["strength", "technical"],
        secondCapPerWeek: 3,
        sandwiched: "technical"
      };
    case "peak":
      return {
        afterPractice: "technical",
        beforePractice: "technical",
        quality: ["sprint", "technical"],
        secondCapPerWeek: 3,
        sandwiched: "recovery"
      };
    case "transition":
    case "postseason":
      return {
        afterPractice: "recovery",
        beforePractice: "mobility",
        quality: ["recovery", "mobility"],
        secondCapPerWeek: 4,
        sandwiched: "mobility"
      };
    case "offseason":
    default:
      return {
        afterPractice: "strength",
        beforePractice: "technical",
        quality: ["strength", "mixed"],
        secondCapPerWeek: 2,
        sandwiched: "technical",
        // Order matters in the canonical 2-2-1 week (Mon+Tue / Thu+Fri / Sun):
        // technical follows the first strength day so its PM sprint double
        // ("morning strength, evening sprint") isn't blocked by a high-CNS
        // tomorrow, and the two dedicated high-CNS days (sprint, mixed) land
        // ~72h apart — clears even the masters (40+) CNS window.
        rotation: ["strength", "technical", "sprint", "strength", "mixed"]
      };
  }
}
function planWeekIntents(teamPracticeFlags, phases, seasonPhases = []) {
  const intents = new Array(7).fill(null);
  const isGameDay = phases.map(
    (p) => p === "competition" || p === "taper" || p === "recovery"
  );
  const isLocked = Array.from(
    { length: 7 },
    (_, i) => teamPracticeFlags[i] || isGameDay[i]
  );
  const freeDays = Array.from({ length: 7 }, (_, i) => i).filter(
    (i) => !isLocked[i] && (phases[i] === "accumulation" || phases[i] === "transition")
  );
  if (!freeDays.length) return intents;
  const nearestBefore = (idx, flags) => {
    for (let d = 1; d <= idx; d++) if (flags[idx - d]) return d;
    return 99;
  };
  const nearestAfter = (idx, flags) => {
    for (let d = 1; d < 7 - idx; d++) if (flags[idx + d]) return d;
    return 99;
  };
  const slots = freeDays.map((idx) => {
    const gameB = nearestBefore(idx, isGameDay);
    const gameA = nearestAfter(idx, isGameDay);
    const pracB = nearestBefore(idx, teamPracticeFlags);
    const pracA = nearestAfter(idx, teamPracticeFlags);
    const minGame = Math.min(gameB, gameA);
    const minPrac = Math.min(pracB, pracA);
    const maxPrac = Math.max(pracB, pracA);
    const quality = minGame * 1e3 + minPrac * 10 + maxPrac;
    return { idx, gameB, gameA, pracB, pracA, quality };
  });
  const mandatoryCount = isLocked.filter(Boolean).length;
  const budget = Math.max(0, 5 - mandatoryCount);
  const MAX_ADJACENT_TRAINING_PAIRS = 2;
  const sorted = [...slots].sort((a, b) => b.quality - a.quality);
  const trainingIdxs = /* @__PURE__ */ new Set();
  let adjacentPairs = 0;
  for (const { idx } of sorted) {
    if (trainingIdxs.size >= budget) break;
    const nLeft = trainingIdxs.has(idx - 1);
    const nRight = trainingIdxs.has(idx + 1);
    const newPairs = (nLeft ? 1 : 0) + (nRight ? 1 : 0);
    const createsTripleRun = newPairs === 2 || nLeft && trainingIdxs.has(idx - 2) || nRight && trainingIdxs.has(idx + 2);
    if (createsTripleRun) continue;
    if (adjacentPairs + newPairs > MAX_ADJACENT_TRAINING_PAIRS) continue;
    trainingIdxs.add(idx);
    adjacentPairs += newPairs;
  }
  for (const { idx } of slots) {
    if (!trainingIdxs.has(idx)) intents[idx] = "rest";
  }
  let firstQualityAssigned = 0;
  let secondQualityAssigned = 0;
  let rotationCursor = 0;
  for (const idx of [...trainingIdxs].sort((a, b) => a - b)) {
    const s = slots.find((sl) => sl.idx === idx);
    const minGameDist = Math.min(s.gameB, s.gameA);
    const model = phaseSessionModel(seasonPhases[idx] ?? null);
    if (minGameDist <= 1) {
      intents[idx] = "rest";
      continue;
    }
    if (s.pracA === 1) {
      intents[idx] = model.beforePractice;
      continue;
    }
    if (s.pracB === 1) {
      intents[idx] = model.afterPractice;
      firstQualityAssigned++;
      continue;
    }
    if (Math.min(s.pracB, s.pracA) >= 2) {
      if (model.rotation && model.rotation.length > 0) {
        let candidate = model.rotation[Math.min(rotationCursor, model.rotation.length - 1)];
        const prev = intents[idx - 1];
        const prevHighCns = prev != null && HIGH_CNS_INTENTS.has(prev);
        if (prevHighCns && HIGH_CNS_INTENTS.has(candidate)) {
          candidate = "technical";
        } else {
          rotationCursor++;
        }
        intents[idx] = candidate;
        continue;
      }
      if (secondQualityAssigned < firstQualityAssigned && secondQualityAssigned < model.secondCapPerWeek) {
        intents[idx] = model.quality[1];
        secondQualityAssigned++;
      } else {
        intents[idx] = model.quality[0];
        firstQualityAssigned++;
      }
      continue;
    }
    intents[idx] = model.sandwiched;
  }
  return intents;
}
var DEMOTION_PRIORITY = [
  "taper-prime",
  "mobility",
  "technical",
  "mixed",
  "sprint",
  "strength"
];
function enforceWeeklyRestMinimum(prescriptions, teamPracticeFlags) {
  const MIN_REST = 2;
  const restCount = prescriptions.filter((p) => p.intent === "rest").length;
  if (restCount >= MIN_REST) return prescriptions;
  const needed = MIN_REST - restCount;
  const demotable = prescriptions.map((p, i) => ({ i, p, priority: DEMOTION_PRIORITY.indexOf(p.intent) })).filter(
    ({ p, i, priority }) => !teamPracticeFlags[i] && p.intent !== "rest" && p.intent !== "recovery" && p.intent !== "competition" && priority !== -1
    // taper-prime is no longer excluded — in a loaded week the pre-game slot
    // is the most natural rest day. DEMOTION_PRIORITY already ranks it first,
    // so it's only chosen when there's truly no better candidate.
  ).sort((a, b) => a.priority - b.priority);
  const toRest = new Set(demotable.slice(0, needed).map((d) => d.i));
  return prescriptions.map(
    (p, i) => toRest.has(i) ? {
      ...p,
      intent: "rest",
      intentLabel: INTENT_LABELS["rest"],
      targetRpe: 2,
      targetMinutes: 15,
      sprintReps: 0,
      strengthSets: 0,
      reasoning: "Rest day \u2014 2 full rest days per week are non-negotiable for adaptation. Complete your 15-min daily mobility and stretching routine.",
      recoveryEmphasis: "low",
      secondSession: null
    } : p
  );
}
function addSecondSessions(prescriptions, teamPracticeFlags, competitionPhases, todayReadiness, todayAcwr) {
  const isHighLoad = competitionPhases.map(
    (p) => p === "competition" || p === "taper" || p === "recovery"
  );
  const SECOND_SESSIONS_PER_WEEK_CAP = 2;
  let secondSessionsAdded = 0;
  return prescriptions.map((p, i) => {
    const phase = p.seasonPhase;
    if (phase !== "preseason" && phase !== "offseason") return p;
    if (teamPracticeFlags[i]) return p;
    if (p.intent !== "strength") return p;
    if (p.targetRpe === null) return p;
    if (secondSessionsAdded >= SECOND_SESSIONS_PER_WEEK_CAP) return p;
    const nearestHighLoad = Array.from(
      { length: 7 },
      (_, j) => isHighLoad[j] ? Math.abs(i - j) : 99
    ).reduce((min, d) => Math.min(min, d), 99);
    if (nearestHighLoad < 2) return p;
    if (i === 0) {
      if ((todayReadiness ?? 70) < 75) return p;
      if (todayAcwr !== null && todayAcwr > 1.2) return p;
    }
    const practiceFollowsTomorrow = i + 1 < 7 && teamPracticeFlags[i + 1];
    const highCnsTomorrow = i + 1 < 7 && HIGH_CNS_INTENTS.has(prescriptions[i + 1].intent);
    const highCnsYesterday = i - 1 >= 0 && HIGH_CNS_INTENTS.has(prescriptions[i - 1].intent);
    const secondIntent = practiceFollowsTomorrow || highCnsTomorrow || highCnsYesterday ? "technical" : "sprint";
    secondSessionsAdded++;
    return {
      ...p,
      secondSession: {
        intent: secondIntent,
        intentLabel: INTENT_LABELS[secondIntent],
        targetRpe: Math.max(5, (p.targetRpe ?? 7) - 1),
        targetMinutes: secondIntent === "sprint" ? 40 : 45,
        reasoning: secondIntent === "sprint" ? "PM speed session \u2014 6 h after morning strength. Short, high-quality sprints while CNS is primed and pre-fatigue is low." : "PM technical session \u2014 skills and route running at low metabolic cost; capitalises on strength stimulus without CNS overlap."
      }
    };
  });
}
function seasonShapedIntent(date, season, acwr, heavyDensity) {
  const dow = date.getDay();
  let week;
  switch (season) {
    case "offseason":
      week = [
        "rest",
        "strength",
        "mixed",
        "rest",
        "strength",
        "technical",
        "mixed"
      ];
      break;
    case "inseason":
      week = [
        "rest",
        "strength",
        "technical",
        "rest",
        "technical",
        "strength",
        "mixed"
      ];
      break;
    case "peak":
      week = [
        "rest",
        "sprint",
        "technical",
        "rest",
        "technical",
        "sprint",
        "recovery"
      ];
      break;
    case "postseason":
    // active regeneration; easy movement only
    case "transition":
      week = [
        "rest",
        "recovery",
        "mobility",
        "rest",
        "mobility",
        "recovery",
        "mobility"
      ];
      break;
    case "preseason":
    default:
      return pickAccumulationIntent(date, acwr, heavyDensity);
  }
  let intent = week[dow];
  if (acwr !== null && acwr > ACWR_ELEVATED) {
    if (intent === "sprint" || intent === "strength") intent = "mobility";
    else if (intent === "mixed") intent = "technical";
  }
  if (heavyDensity && intent !== "rest") {
    if (intent === "strength") intent = "technical";
    if (intent === "mixed") intent = "mobility";
  }
  return intent;
}
function seasonReasoning(season, intent) {
  switch (season) {
    case "offseason":
      return `Off-season \xB7 strength & conditioning block. Today is a ${intent} day.`;
    case "inseason":
      return `In-season \xB7 maintain strength and sharpen skills. Today is a ${intent} day.`;
    case "peak":
      return `Peak season \xB7 stay sharp and fresh \u2014 quality over quantity. Today is a ${intent} day.`;
    case "postseason":
      return `Post-season \xB7 active regeneration and aerobic base. Today is a ${intent} day.`;
    case "transition":
      return `Transition \xB7 active rest and aerobic base. Today is a ${intent} day.`;
    case "preseason":
    default:
      return `Pre-season build \u2014 progressing load toward the season. Today is a ${intent} day.`;
  }
}
var HEAT_CAUTION_C = 28;
var HEAT_REDUCE_C = 32;
var HEAT_AVOID_C = 35;
var HEAT_STOP_C = 38;
var COLD_CAUTION_C = 4;
var COLD_AVOID_C = -5;
var WIND_UNRELIABLE_KMH = 40;
var RAIN_PRECIP_MM = 0.5;
var RAIN_WEATHER_CODE = 61;
var STORM_CODE_MIN = 95;
var STORM_CODE_MAX = 99;
var HEAT_LOAD_FACTOR_REDUCE = 1.1;
var HEAT_LOAD_FACTOR_AVOID = 1.2;
var HEAT_VOLUME_CUT = 0.8;
function approxWBGT(tempC, humidityPct) {
  if (typeof tempC !== "number" || typeof humidityPct !== "number" || humidityPct < 0 || humidityPct > 100) {
    return null;
  }
  const e = humidityPct / 100 * 6.105 * Math.exp(17.27 * tempC / (237.7 + tempC));
  return 0.567 * tempC + 0.393 * e + 3.94;
}
var WBGT_CAUTION_C = 25.7;
var WBGT_REDUCE_C = 27.8;
var WBGT_RELOCATE_C = 30;
var WBGT_STOP_C = 32.2;
var HEAT_INTENSITY_WEIGHT = {
  sprint: 1,
  mixed: 0.9,
  "taper-prime": 0.6,
  technical: 0.6
};
var HEAT_DURATION_REF_MIN = 45;
var HEAT_MAX_VOLUME_CUT = 0.5;
var ACCLIMATIZATION_WINDOW_DAYS = 14;
var ACCLIMATIZATION_MAX_SHIFT_C = 4;
function acclimatizationShiftC(acclimatizationDay) {
  if (acclimatizationDay === null || acclimatizationDay < 0 || acclimatizationDay >= ACCLIMATIZATION_WINDOW_DAYS) {
    return 0;
  }
  return ACCLIMATIZATION_MAX_SHIFT_C * (1 - acclimatizationDay / ACCLIMATIZATION_WINDOW_DAYS);
}
var OUTDOOR_INTENSE = /* @__PURE__ */ new Set(["sprint", "mixed", "taper-prime"]);
var HEAT_GUARDED = /* @__PURE__ */ new Set(["sprint", "mixed", "taper-prime", "technical"]);
function wbgtVolumeKeep(wbgt, reduceThreshold, relocateThreshold, intent, targetMinutes) {
  const bandSpan = Math.max(0.1, relocateThreshold - reduceThreshold);
  const bandFrac = Math.min(
    1,
    Math.max(0, (wbgt - reduceThreshold) / bandSpan)
  );
  const intensity = HEAT_INTENSITY_WEIGHT[intent] ?? 0.6;
  const durationFactor = Math.min(
    2,
    Math.max(0.5, targetMinutes / HEAT_DURATION_REF_MIN)
  );
  const strain = bandFrac * intensity * durationFactor;
  const cut = Math.min(
    HEAT_MAX_VOLUME_CUT,
    Math.max(0.2, strain * HEAT_MAX_VOLUME_CUT / 0.5)
  );
  return 1 - cut;
}
var TIMESHIFT_MAX_WAIT_HOURS = 6;
var TIMESHIFT_LATEST_HOUR = 21;
var TIMESHIFT_MIN_COOLER_WBGT = 1.5;
function hourOfIso(iso) {
  const m = /T(\d{2}):/.exec(iso);
  if (!m) return null;
  const h = Number(m[1]);
  return Number.isInteger(h) && h >= 0 && h <= 23 ? h : null;
}
function findCoolerHour(hourly, fromHour, currentWbgt) {
  if (!hourly || hourly.length === 0) return null;
  const day = hourly[0].time.slice(0, 10);
  const today = hourly.filter((p) => p.time.slice(0, 10) === day);
  const fromPoint = today.find((p) => hourOfIso(p.time) === fromHour);
  const fromWbgt = fromPoint ? approxWBGT(fromPoint.tempC, fromPoint.humidityPct) ?? currentWbgt : currentWbgt;
  if (fromWbgt === null || fromWbgt < WBGT_REDUCE_C) return null;
  for (const p of today) {
    const h = hourOfIso(p.time);
    if (h === null || h <= fromHour) continue;
    if (h - fromHour > TIMESHIFT_MAX_WAIT_HOURS || h > TIMESHIFT_LATEST_HOUR) {
      continue;
    }
    const w = approxWBGT(p.tempC, p.humidityPct);
    if (w === null || w >= WBGT_REDUCE_C) continue;
    if (fromWbgt - w < TIMESHIFT_MIN_COOLER_WBGT) continue;
    const hh = (n) => `${String(n).padStart(2, "0")}:00`;
    return {
      fromHour,
      toHour: h,
      fromWbgt: Math.round(fromWbgt),
      toWbgt: Math.round(w),
      message: `${Math.round(fromWbgt)}\xB0C WBGT at ${hh(fromHour)} \u2014 train at ${hh(h)} instead, when it drops to ~${Math.round(w)}\xB0C.`
    };
  }
  return null;
}
function substituteForWet(intent) {
  return intent === "taper-prime" ? "mobility" : "strength";
}
var SPRINT_EXPOSURE_FLOOR_DAYS = 7;
var SPRINT_FLOOR_MAINTENANCE_REPS = 5;
var MESOCYCLE_VOLUME_FACTORS = {
  1: 1,
  2: 1.05,
  3: 1.1,
  4: 0.65
};
var MESOCYCLE_WAVED_INTENTS = /* @__PURE__ */ new Set(["sprint", "strength", "mixed", "technical"]);
function mesocycleWeekFor(windows, date) {
  if (!windows || windows.length === 0) return null;
  const iso = toIsoDate(date);
  const md = iso.slice(5);
  for (const w of windows) {
    if (!w || !w.from || !w.to) continue;
    if (w.phase !== "offseason" && w.phase !== "preseason") continue;
    if (!inSeasonWindow(iso, md, w.from, w.to)) continue;
    let start;
    if (w.from.length === 10) {
      start = /* @__PURE__ */ new Date(`${w.from}T00:00:00`);
    } else {
      const wraps = w.from > w.to;
      const beforeFrom = md < w.from;
      const year = date.getFullYear() - (wraps && beforeFrom ? 1 : 0);
      start = /* @__PURE__ */ new Date(`${year}-${w.from}T00:00:00`);
    }
    const days = Math.floor((date.getTime() - start.getTime()) / 864e5);
    if (days < 0) continue;
    return Math.floor(days / 7) % 4 + 1;
  }
  return null;
}
function applyMesocycleWave(days, dayInputs, teamPracticeFlags) {
  return days.map((d, i) => {
    const week = dayInputs[i]?.mesocycleWeek ?? null;
    if (week === null || !(week in MESOCYCLE_VOLUME_FACTORS)) return d;
    if (teamPracticeFlags[i]) return d;
    if (d.phase !== "accumulation" && d.phase !== "transition") return d;
    if (!MESOCYCLE_WAVED_INTENTS.has(d.intent)) return d;
    const factor = MESOCYCLE_VOLUME_FACTORS[week];
    if (factor === 1) return d;
    return {
      ...d,
      targetMinutes: Math.max(15, Math.round(d.targetMinutes * factor)),
      sprintReps: d.sprintReps > 0 ? Math.max(2, Math.round(d.sprintReps * factor)) : 0,
      strengthSets: d.strengthSets > 0 ? Math.max(4, Math.round(d.strengthSets * factor)) : 0,
      reasoning: week === 4 ? `${d.reasoning} Deload week (4 of 4): volume \u221235%, intensity held \u2014 the adaptation week.` : `${d.reasoning} Build week ${week} of 3: volume +${Math.round((factor - 1) * 100)}%.`,
      secondSession: week === 4 ? null : d.secondSession
    };
  });
}
function planWeek(dayInputs, teamPracticeFlags, phases7, todayReadiness, todayAcwr) {
  const seasonPhases = dayInputs.map((d) => d.seasonPhase ?? null);
  const intentHints = planWeekIntents(teamPracticeFlags, phases7, seasonPhases);
  const daysSinceHighSpeed = dayInputs[0]?.daysSinceHighSpeed ?? null;
  let floorIdx = null;
  const weekHasExposure = teamPracticeFlags.some(Boolean) || intentHints.some((x) => x === "sprint" || x === "mixed");
  if (daysSinceHighSpeed !== null && daysSinceHighSpeed >= SPRINT_EXPOSURE_FLOOR_DAYS && !weekHasExposure) {
    for (const candidate of ["technical", "mobility"]) {
      const idx = intentHints.findIndex((x) => x === candidate);
      if (idx !== -1) {
        intentHints[idx] = "sprint";
        floorIdx = idx;
        break;
      }
    }
  }
  const out = dayInputs.map(
    (input, i) => prescribeFor({ ...input, weeklyIntentHint: intentHints[i] })
  );
  if (floorIdx !== null) {
    const day = out[floorIdx];
    if (day.intent === "sprint") {
      out[floorIdx] = {
        ...day,
        targetMinutes: Math.min(day.targetMinutes, 60),
        sprintReps: Math.min(day.sprintReps, SPRINT_FLOOR_MAINTENANCE_REPS),
        reasoning: `Speed maintenance \u2014 first high-speed exposure in ${Math.round(
          daysSinceHighSpeed
        )} days. Short and crisp: ${SPRINT_FLOOR_MAINTENANCE_REPS}\xD7 relaxed 20-30 m builds at ~90%, full recovery. Regular near-max running protects hamstrings.`
      };
    } else {
      out[floorIdx] = {
        ...day,
        reasoning: `${day.reasoning} High-speed exposure is overdue (${Math.round(
          daysSinceHighSpeed
        )} days) but a safety guard postponed it \u2014 when you feel fresh, add 4-6 relaxed 20-30 m strides.`
      };
    }
  }
  const capped = enforceWeeklyRestMinimum(out, teamPracticeFlags);
  const withSeconds = addSecondSessions(
    capped,
    teamPracticeFlags,
    phases7,
    todayReadiness,
    todayAcwr
  );
  return applyMesocycleWave(withSeconds, dayInputs, teamPracticeFlags);
}
function applyWeatherGuard(rx, weather, coachOverride, acclimatizationDay = null) {
  if (!weather || !HEAT_GUARDED.has(rx.intent)) {
    return rx;
  }
  const nonHeatEligible = OUTDOOR_INTENSE.has(rx.intent);
  const apparent = typeof weather.apparentC === "number" ? weather.apparentC : typeof weather.tempC === "number" ? weather.tempC : null;
  const code = weather.weatherCode;
  const storm = code !== null && code >= STORM_CODE_MIN && code <= STORM_CODE_MAX;
  const wet = code !== null && code >= RAIN_WEATHER_CODE && code < STORM_CODE_MIN || weather.precipMm !== null && weather.precipMm > RAIN_PRECIP_MM;
  const wind = weather.windKmh;
  const shift = acclimatizationShiftC(acclimatizationDay);
  const acclimatizing = shift > 0;
  const acclimNote = acclimatizing ? ` Still acclimatizing (day ${acclimatizationDay} at this climate) \u2014 extra caution applied.` : "";
  const wbgt = approxWBGT(weather.tempC, weather.humidityPct);
  const usingWbgt = wbgt !== null;
  const heatMetric = usingWbgt ? wbgt : apparent;
  const heatStopEff = (usingWbgt ? WBGT_STOP_C : HEAT_STOP_C) - shift;
  const heatAvoidEff = (usingWbgt ? WBGT_RELOCATE_C : HEAT_AVOID_C) - shift;
  const heatReduceEff = (usingWbgt ? WBGT_REDUCE_C : HEAT_REDUCE_C) - shift;
  const heatCautionEff = (usingWbgt ? WBGT_CAUTION_C : HEAT_CAUTION_C) - shift;
  const coldAvoidEff = COLD_AVOID_C + shift;
  const coldCautionEff = COLD_CAUTION_C + shift;
  const t = (n) => Math.round(n);
  const cite = heatMetric === null ? "" : usingWbgt ? `${t(heatMetric)}\xB0C WBGT` : `${t(heatMetric)}\xB0C feels-like`;
  const citeBare = heatMetric === null ? "" : `${t(heatMetric)}\xB0C`;
  const original = rx.intent;
  const heatLoadFactor = heatMetric === null ? 1 : heatMetric >= heatAvoidEff ? HEAT_LOAD_FACTOR_AVOID : heatMetric >= heatReduceEff ? HEAT_LOAD_FACTOR_REDUCE : 1;
  let action = "none";
  let adjusted = original;
  let reason = "";
  let heatKeep = 1;
  if (storm) {
    action = "stop";
    adjusted = "recovery";
    reason = "Thunderstorm \u2014 lightning risk. Outdoor training stopped; move indoors or rest.";
  } else if (heatMetric !== null && heatMetric >= heatStopEff) {
    action = "stop";
    adjusted = "recovery";
    reason = `${cite} \u2014 too hot to train outdoors. Indoor recovery or rest today.${acclimNote}`;
  } else if (heatMetric !== null && heatMetric >= heatAvoidEff) {
    action = "relocate";
    adjusted = "mobility";
    reason = `${cite} \u2014 no intense outdoor work. Moved to indoor mobility & skills; hydrate hard.${acclimNote}`;
  } else if (wet && nonHeatEligible) {
    action = "substitute";
    adjusted = substituteForWet(original);
    reason = "Wet grass \u2014 slip/ACL risk on sprints & cuts. Moved indoors to a tempo + strength session.";
  } else if (nonHeatEligible && apparent !== null && apparent <= coldAvoidEff) {
    action = "substitute";
    adjusted = "mobility";
    reason = `${t(apparent)}\xB0C feels-like \u2014 no outdoor max-effort in the cold. Indoor low-intensity mobility instead.${acclimNote}`;
  } else if (heatMetric !== null && heatMetric >= heatReduceEff) {
    action = "scale";
    heatKeep = usingWbgt ? wbgtVolumeKeep(
      heatMetric,
      heatReduceEff,
      heatAvoidEff,
      original,
      rx.targetMinutes
    ) : HEAT_VOLUME_CUT;
    const cutPct = t((1 - heatKeep) * 100);
    reason = `${cite} \u2014 cut intense volume ~${cutPct}%, train in the cooler hour, hydrate. Expect RPE to feel ~1 higher; log what you actually felt.${acclimNote}`;
  } else if (heatMetric !== null && heatMetric >= heatCautionEff) {
    reason = `${citeBare} \u2014 warm. Add hydration and breaks; session unchanged.${acclimNote}`;
  } else if (nonHeatEligible && apparent !== null && apparent <= coldCautionEff) {
    reason = `${t(apparent)}\xB0C \u2014 cold muscles. Extend your warm-up; ease into max-velocity work.${acclimNote}`;
  } else if (wind !== null && wind >= WIND_UNRELIABLE_KMH) {
    reason = `${t(wind)} km/h wind \u2014 throwing accuracy and sprint timing are unreliable; deprioritise testing.`;
  } else {
    return rx;
  }
  if (coachOverride) {
    const note = storm ? "Coach override: training as planned \u2014 but lightning is present, take shelter if it nears." : `Coach override: training as planned despite conditions \u2014 ${reason}`;
    return {
      ...rx,
      weatherAdjustment: {
        applied: false,
        action: "none",
        originalIntent: original,
        adjustedIntent: original,
        heatLoadFactor,
        reason: note
      }
    };
  }
  if (action === "none") {
    return {
      ...rx,
      weatherAdjustment: {
        applied: false,
        action: "none",
        originalIntent: original,
        adjustedIntent: original,
        heatLoadFactor,
        reason
      }
    };
  }
  if (action === "scale") {
    return {
      ...rx,
      targetMinutes: t(rx.targetMinutes * heatKeep),
      sprintReps: t(rx.sprintReps * heatKeep),
      reasoning: `${reason} ${rx.reasoning}`,
      weatherAdjustment: {
        applied: true,
        action,
        originalIntent: original,
        adjustedIntent: original,
        heatLoadFactor,
        reason
      }
    };
  }
  const nt = baseTargets(adjusted);
  return {
    ...rx,
    intent: adjusted,
    intentLabel: INTENT_LABELS[adjusted],
    targetRpe: nt.targetRpe,
    targetMinutes: nt.targetMinutes,
    sprintReps: nt.sprintReps,
    strengthSets: nt.strengthSets,
    reasoning: `${reason} ${rx.reasoning}`,
    weatherAdjustment: {
      applied: true,
      action,
      originalIntent: original,
      adjustedIntent: adjusted,
      heatLoadFactor,
      reason
    }
  };
}
function baseTargets(intent) {
  switch (intent) {
    case "rest":
      return {
        targetRpe: 2,
        targetMinutes: 15,
        sprintReps: 0,
        strengthSets: 0
      };
    case "recovery":
      return {
        targetRpe: 3,
        targetMinutes: 30,
        sprintReps: 0,
        strengthSets: 0
      };
    case "mobility":
      return {
        targetRpe: 4,
        targetMinutes: 45,
        sprintReps: 0,
        strengthSets: 0
      };
    case "technical":
      return {
        targetRpe: 5,
        targetMinutes: 60,
        sprintReps: 0,
        strengthSets: 0
      };
    // Quality sessions target 90 minutes TOTAL — the full realized session
    // including the ~25-min warm-up and the injury-prevention (DOP) block,
    // not just the main work (coach directive 2026-07-14). The realization
    // layer's honest block estimates (warm-up + DOP + main + cool-down) sum
    // to approximately this number.
    case "sprint":
      return {
        targetRpe: 8,
        targetMinutes: 90,
        sprintReps: 10,
        strengthSets: 0
      };
    case "strength":
      return {
        targetRpe: 7,
        targetMinutes: 90,
        sprintReps: 0,
        strengthSets: 18
      };
    case "mixed":
      return {
        targetRpe: 6,
        targetMinutes: 90,
        sprintReps: 6,
        strengthSets: 8
      };
    case "taper-prime":
      return {
        targetRpe: 4,
        targetMinutes: 25,
        sprintReps: 4,
        strengthSets: 0
      };
    case "competition":
      return {
        targetRpe: null,
        targetMinutes: 60,
        sprintReps: 0,
        strengthSets: 0
      };
    case "travel":
      return {
        targetRpe: null,
        targetMinutes: 0,
        sprintReps: 0,
        strengthSets: 0
      };
  }
}
var BUILD_TARGET_OVERRIDES = {
  // rest is rest in any phase: no structured training, just daily mobility.
  // Previous value (RPE 6) was a stale pre-refactor literal and is corrected here.
  rest: { targetRpe: 2, targetMinutes: 15, sprintReps: 0, strengthSets: 0 },
  mobility: { targetRpe: 6, targetMinutes: 75, sprintReps: 0, strengthSets: 0 },
  // A build-block technical day is a REAL training day (90-min total incl.
  // warm-up + DOP), unlike the shorter in-season practice-complement technical.
  technical: {
    targetRpe: 6,
    targetMinutes: 90,
    sprintReps: 0,
    strengthSets: 0
  }
};
function buildTargets(intent) {
  return BUILD_TARGET_OVERRIDES[intent] ?? baseTargets(intent);
}
function finalize(partial) {
  return {
    ...partial,
    date: toIsoDate(partial.date),
    intentLabel: partial.intentLabel ?? INTENT_LABELS[partial.intent]
  };
}
function toIsoDate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function pickDriverEvent(date, upcoming, lastEvent) {
  const next = upcoming.find(
    (e) => new Date(e.endsAt ?? e.startsAt).getTime() >= date.getTime()
  );
  if (next) {
    return next;
  }
  return lastEvent;
}
function nextEventHours(date, upcoming) {
  const next = upcoming.find(
    (e) => new Date(e.endsAt ?? e.startsAt).getTime() >= date.getTime()
  );
  if (!next) {
    return null;
  }
  const diffMs = new Date(next.startsAt).getTime() - date.getTime();
  if (diffMs <= 0) {
    return 0;
  }
  return Math.round(diffMs / 36e5);
}
function postEventReasoning(lastEvent) {
  if (!lastEvent) {
    return "Recovery focus today \u2014 light blood flow only.";
  }
  const games = lastEvent.expectedGameCount ?? 1;
  const eventName = lastEvent.competitionShortName ?? lastEvent.competitionName;
  return `Just played ${games} game${games === 1 ? "" : "s"} at ${eventName}. Body is repairing \u2014 easy day.`;
}
function taperReasoning(event, daysOut) {
  if (!event) {
    return "Taper week. Keep nervous system sharp at low volume.";
  }
  const games = event.expectedGameCount ?? 1;
  const eventName = event.competitionShortName ?? event.competitionName;
  return `${daysOut} day${daysOut === 1 ? "" : "s"} to ${eventName} (${games} games). Sharp, not heavy.`;
}
function accumulationReasoning(intent, acwr, heavyDensity) {
  if (heavyDensity) {
    return "Dense competition window ahead \u2014 modulating load now to arrive fresh.";
  }
  if (acwr !== null && acwr > ACWR_ELEVATED) {
    return `ACWR ${acwr.toFixed(2)} is elevated \u2014 reduced volume on a ${intent} focus.`;
  }
  if (acwr !== null && acwr < ACWR_UNDER) {
    return `Under-trained (ACWR ${acwr.toFixed(2)}) \u2014 building load with a ${intent} session.`;
  }
  if (intent === "rest") {
    return "Build phase rest day \u2014 no structured training. Complete your 15-min daily mobility and stretching routine.";
  }
  return `Build phase. Today is a ${intent} day.`;
}
function pickAccumulationIntent(date, acwr, heavyDensity) {
  const dow = date.getDay();
  const standard = [
    "rest",
    // Sun — post-week full rest
    "strength",
    // Mon — neuromuscular block
    "sprint",
    // Tue — speed / agility quality
    "rest",
    // Wed — mid-week full rest
    "strength",
    // Thu — second neuromuscular block
    "technical",
    // Fri — skills / routes (low CNS demand)
    "mixed"
    // Sat — integrated flag-football session
  ];
  let intent = standard[dow];
  if (acwr !== null && acwr > ACWR_ELEVATED) {
    if (intent === "sprint" || intent === "strength") {
      intent = "mobility";
    } else if (intent === "mixed") {
      intent = "technical";
    }
  }
  if (heavyDensity && intent !== "rest") {
    if (intent === "strength") intent = "technical";
    if (intent === "mixed") intent = "mobility";
  }
  return intent;
}
var CARB_PER_KG = {
  rest: 3,
  recovery: 3.5,
  mobility: 3.5,
  technical: 4,
  sprint: 4.5,
  // short, high-intensity, low-volume → light–moderate band
  strength: 4.5,
  mixed: 5,
  // skill + conditioning, more total work
  "taper-prime": 6,
  // deliberate glycogen top-up, ≤24h to competition
  competition: 7,
  // game/tournament day: multiple games + refuel between
  travel: 3.5
  // travel day: light carbs, hydration focus
};
var PROTEIN_PER_KG = 1.8;
var FLUID_BASE_ML_PER_KG = 35;
var FLUID_COMPETITION_BONUS_L = 1.5;
function nutritionFor(intent, bodyweightKg, heavyDensity, hotDay = false) {
  if (bodyweightKg == null || !(bodyweightKg > 0)) {
    return null;
  }
  const key = intent === "taper" ? "sprint" : intent === "transition" ? "mixed" : intent;
  const carbsG = Math.round(CARB_PER_KG[key] * bodyweightKg);
  const proteinG = Math.round(PROTEIN_PER_KG * bodyweightKg);
  let hydrationL = FLUID_BASE_ML_PER_KG * bodyweightKg / 1e3;
  if (key === "competition") {
    hydrationL += FLUID_COMPETITION_BONUS_L;
  }
  if (heavyDensity && key !== "rest") {
    hydrationL += 0.5;
  }
  if (hotDay && key !== "rest") {
    hydrationL += 0.5;
  }
  return {
    carbsG,
    proteinG,
    hydrationL: Math.round(hydrationL * 10) / 10,
    rationale: key === "competition" ? "Game-day fueling: carbs every game, hydrate aggressively, protein after final game." : key === "rest" ? "Lower carb day. Protein steady to support repair." : key === "taper-prime" ? "Top up glycogen tonight. Hydrate well \u2014 game window opens soon." : `Daily targets at ${CARB_PER_KG[key]}g/kg carbs, ${PROTEIN_PER_KG}g/kg protein.`
  };
}
var __periodization__ = {
  prescribeFor,
  nutritionFor,
  pickAccumulationIntent,
  macroPhaseFor,
  applyWeatherGuard,
  seasonShapedIntent,
  baseTargets,
  CARB_PER_KG,
  cnsRecoveryHoursForAge,
  isHighCnsSessionType,
  planWeekIntents,
  planWeek,
  mesocycleWeekFor,
  applyMesocycleWave,
  detectTournamentRecoveryDay,
  modulateIntentForLoad,
  resolveTaperTargets,
  taperLevelFor,
  EMBEDDED_TAPER_RULES,
  approxWBGT,
  findCoolerHour
};
export {
  EMBEDDED_TAPER_RULES,
  READINESS_LOW,
  __periodization__,
  addSecondSessions,
  applyWeatherGuard,
  approxWBGT,
  enforceWeeklyRestMinimum,
  findCoolerHour,
  isHighCnsSessionType,
  macroPhaseFor,
  mesocycleWeekFor,
  planWeek,
  planWeekIntents,
  prescribeFor,
  resolveTaperTargets,
  taperLevelFor
};
