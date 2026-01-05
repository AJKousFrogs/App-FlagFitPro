/**
 * Return-to-Play Protocol Service
 *
 * EVIDENCE-BASED GRADUATED RETURN-TO-PLAY PROTOCOLS
 *
 * After injury or extended absence, athletes need structured return protocols
 * to safely rebuild fitness while minimizing re-injury risk.
 *
 * Research Base:
 * - Creighton et al. (2010) - Return-to-play in sport: a decision-based model
 * - Ardern et al. (2016) - Consensus statement on return to sport
 * - Blanch & Gabbett (2016) - Has the athlete trained enough to return to play safely?
 * - Taberner & Cohen (2018) - Physical preparation and return to performance
 *
 * Key Principles:
 * - Graduated progression (step-by-step increase in intensity/volume)
 * - Minimum time at each stage before progression
 * - Objective criteria for progression (not just time-based)
 * - Monitoring for symptom recurrence
 * - Building chronic load before high acute loads
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import { Injectable, inject, signal, computed } from "@angular/core";
import { LoggerService } from "./logger.service";

// ============================================================================
// INTERFACES
// ============================================================================

export type InjuryType =
  | "muscle_strain"
  | "ligament_sprain"
  | "tendinopathy"
  | "bone_stress"
  | "concussion"
  | "illness"
  | "general_absence";

export type ReturnStage =
  | "rest"
  | "light_activity"
  | "sport_specific_low"
  | "sport_specific_moderate"
  | "sport_specific_high"
  | "full_training"
  | "full_competition";

export interface InjuryRecord {
  id: string;
  type: InjuryType;
  location?: string;
  dateOccurred: Date;
  severity: "mild" | "moderate" | "severe";
  estimatedRecoveryWeeks: number;
  notes?: string;
  currentStage: ReturnStage;
  stageHistory: StageTransition[];
}

export interface StageTransition {
  fromStage: ReturnStage;
  toStage: ReturnStage;
  date: Date;
  clearedBy?: string;
  notes?: string;
}

export interface ReturnProtocol {
  injuryType: InjuryType;
  stages: ProtocolStage[];
  totalMinimumDays: number;
  evidenceBase: string;
  warnings: string[];
}

export interface ProtocolStage {
  stage: ReturnStage;
  name: string;
  minimumDays: number;
  activities: string[];
  restrictions: string[];
  progressionCriteria: string[];
  loadPercentage: number; // Percentage of normal training load
  intensityLimit: number; // 0-100%
  monitoringRequired: string[];
}

export interface ReturnProgress {
  injury: InjuryRecord;
  protocol: ReturnProtocol;
  currentStage: ProtocolStage;
  daysInCurrentStage: number;
  canProgress: boolean;
  progressionBlockers: string[];
  nextStage: ProtocolStage | null;
  estimatedDaysToFullReturn: number;
  overallProgress: number; // 0-100%
}

export interface DailyCheckIn {
  date: Date;
  injuryId: string;
  painLevel: number; // 0-10
  swelling: "none" | "mild" | "moderate" | "severe";
  functionLevel: number; // 0-10 (ability to perform activities)
  confidence: number; // 0-10 (psychological readiness)
  completedActivities: string[];
  symptoms: string[];
  notes?: string;
}

export interface ProgressionDecision {
  canProgress: boolean;
  reasoning: string;
  recommendations: string[];
  riskLevel: "low" | "moderate" | "high";
  requiredClearance: "self" | "coach" | "medical";
}

// ============================================================================
// RETURN-TO-PLAY PROTOCOLS BY INJURY TYPE
// ============================================================================

const RETURN_PROTOCOLS: Record<InjuryType, ReturnProtocol> = {
  muscle_strain: {
    injuryType: "muscle_strain",
    stages: [
      {
        stage: "rest",
        name: "Rest & Protection",
        minimumDays: 3,
        activities: [
          "RICE protocol (Rest, Ice, Compression, Elevation)",
          "Gentle range of motion if pain-free",
          "Upper body training if lower body injury (and vice versa)",
        ],
        restrictions: [
          "No stretching of injured muscle",
          "No resistance training of injured area",
          "No running or jumping",
        ],
        progressionCriteria: [
          "Pain-free at rest",
          "Swelling resolved or minimal",
          "Pain-free range of motion",
        ],
        loadPercentage: 0,
        intensityLimit: 0,
        monitoringRequired: ["Pain level", "Swelling", "Range of motion"],
      },
      {
        stage: "light_activity",
        name: "Light Activity",
        minimumDays: 4,
        activities: [
          "Walking",
          "Stationary cycling (low resistance)",
          "Pool exercises",
          "Light stretching (pain-free)",
          "Isometric exercises (pain-free)",
        ],
        restrictions: [
          "No sprinting",
          "No cutting or jumping",
          "No sport-specific movements",
        ],
        progressionCriteria: [
          "Pain-free during light activity",
          "No increase in symptoms after activity",
          "Full range of motion",
        ],
        loadPercentage: 20,
        intensityLimit: 40,
        monitoringRequired: ["Pain during activity", "Post-activity symptoms"],
      },
      {
        stage: "sport_specific_low",
        name: "Sport-Specific (Low Intensity)",
        minimumDays: 5,
        activities: [
          "Jogging (50% speed)",
          "Light change of direction",
          "Throwing (if applicable) at 50%",
          "Position-specific drills (50% intensity)",
        ],
        restrictions: [
          "No maximal efforts",
          "No contact or competition",
          "Stop if any pain",
        ],
        progressionCriteria: [
          "Pain-free jogging",
          "Confident in basic movements",
          "No symptoms 24h after activity",
        ],
        loadPercentage: 40,
        intensityLimit: 60,
        monitoringRequired: ["Movement quality", "Confidence", "24h response"],
      },
      {
        stage: "sport_specific_moderate",
        name: "Sport-Specific (Moderate Intensity)",
        minimumDays: 5,
        activities: [
          "Running at 75% speed",
          "Moderate cutting and agility",
          "Sport-specific drills (75%)",
          "Controlled scrimmage situations",
        ],
        restrictions: ["No full-speed sprinting", "No full competition"],
        progressionCriteria: [
          "Pain-free at 75% intensity",
          "No compensation patterns",
          "Strength within 90% of uninjured side",
        ],
        loadPercentage: 60,
        intensityLimit: 75,
        monitoringRequired: [
          "Movement symmetry",
          "Strength comparison",
          "Fatigue response",
        ],
      },
      {
        stage: "sport_specific_high",
        name: "Sport-Specific (High Intensity)",
        minimumDays: 4,
        activities: [
          "Full-speed running",
          "Full-speed cutting and agility",
          "Full practice participation",
          "Simulated game situations",
        ],
        restrictions: [
          "Monitor volume carefully",
          "Avoid back-to-back high-intensity days initially",
        ],
        progressionCriteria: [
          "Pain-free at full intensity",
          "Full confidence in movement",
          "Completed full practice without issues",
        ],
        loadPercentage: 80,
        intensityLimit: 95,
        monitoringRequired: [
          "Full practice tolerance",
          "Psychological readiness",
        ],
      },
      {
        stage: "full_training",
        name: "Full Training",
        minimumDays: 3,
        activities: [
          "All training activities without restriction",
          "Full practice participation",
          "Scrimmages",
        ],
        restrictions: ["Monitor for any symptom recurrence"],
        progressionCriteria: [
          "3+ full practices without symptoms",
          "Coach/medical clearance for competition",
        ],
        loadPercentage: 100,
        intensityLimit: 100,
        monitoringRequired: ["Symptom recurrence", "Performance metrics"],
      },
      {
        stage: "full_competition",
        name: "Full Competition",
        minimumDays: 0,
        activities: ["Unrestricted competition"],
        restrictions: [],
        progressionCriteria: ["Cleared for competition"],
        loadPercentage: 100,
        intensityLimit: 100,
        monitoringRequired: ["Post-game symptoms", "Re-injury monitoring"],
      },
    ],
    totalMinimumDays: 24,
    evidenceBase:
      "Blanch & Gabbett (2016) - Graduated return with chronic load building",
    warnings: [
      "Hamstring strains have high re-injury rate - be conservative",
      "Don't progress if any pain during activity",
      "Strength should be within 10% of uninjured side before full return",
    ],
  },

  ligament_sprain: {
    injuryType: "ligament_sprain",
    stages: [
      {
        stage: "rest",
        name: "Rest & Protection",
        minimumDays: 5,
        activities: [
          "RICE protocol",
          "Bracing/taping as needed",
          "Non-weight bearing or partial weight bearing",
          "Upper body training",
        ],
        restrictions: [
          "No weight bearing on injured joint (if severe)",
          "No lateral movements",
          "Protect joint from further stress",
        ],
        progressionCriteria: [
          "Swelling controlled",
          "Pain-free weight bearing",
          "Joint stability improving",
        ],
        loadPercentage: 0,
        intensityLimit: 0,
        monitoringRequired: [
          "Swelling",
          "Joint stability",
          "Pain with weight bearing",
        ],
      },
      {
        stage: "light_activity",
        name: "Mobility & Strengthening",
        minimumDays: 7,
        activities: [
          "Range of motion exercises",
          "Isometric strengthening",
          "Balance and proprioception work",
          "Pool exercises",
          "Stationary cycling",
        ],
        restrictions: [
          "No running",
          "No cutting or pivoting",
          "Continue bracing if needed",
        ],
        progressionCriteria: [
          "Full range of motion",
          "Single-leg balance >30 seconds",
          "Pain-free isometric exercises",
        ],
        loadPercentage: 20,
        intensityLimit: 40,
        monitoringRequired: ["Balance", "Strength", "Joint confidence"],
      },
      {
        stage: "sport_specific_low",
        name: "Sport-Specific (Low Intensity)",
        minimumDays: 7,
        activities: [
          "Straight-line jogging",
          "Gradual introduction of lateral movements",
          "Controlled agility drills",
          "Light sport-specific work",
        ],
        restrictions: [
          "No reactive/unplanned movements",
          "No competition",
          "Progress lateral work gradually",
        ],
        progressionCriteria: [
          "Pain-free jogging",
          "Confident in controlled lateral movements",
          "Hop test >90% of uninjured side",
        ],
        loadPercentage: 40,
        intensityLimit: 60,
        monitoringRequired: [
          "Hop test symmetry",
          "Lateral movement confidence",
        ],
      },
      {
        stage: "sport_specific_moderate",
        name: "Sport-Specific (Moderate)",
        minimumDays: 7,
        activities: [
          "Running at 75% speed",
          "Agility drills (75% intensity)",
          "Sport-specific movements",
          "Reactive drills (controlled)",
        ],
        restrictions: [
          "Monitor closely for any instability",
          "No full competition",
        ],
        progressionCriteria: [
          "Pain-free at 75% intensity",
          "No feelings of instability",
          "Confidence in reactive movements",
        ],
        loadPercentage: 60,
        intensityLimit: 75,
        monitoringRequired: ["Stability", "Confidence", "Movement quality"],
      },
      {
        stage: "sport_specific_high",
        name: "Sport-Specific (High)",
        minimumDays: 5,
        activities: [
          "Full-speed training",
          "Full agility work",
          "Practice participation",
          "Simulated game situations",
        ],
        restrictions: ["May continue taping/bracing for confidence"],
        progressionCriteria: [
          "Full practice without symptoms",
          "Full confidence",
          "Medical/coach clearance",
        ],
        loadPercentage: 80,
        intensityLimit: 95,
        monitoringRequired: ["Practice tolerance", "Psychological readiness"],
      },
      {
        stage: "full_training",
        name: "Full Training",
        minimumDays: 5,
        activities: ["All activities without restriction"],
        restrictions: ["Monitor for instability"],
        progressionCriteria: ["5+ days full training without issues"],
        loadPercentage: 100,
        intensityLimit: 100,
        monitoringRequired: ["Symptom monitoring"],
      },
      {
        stage: "full_competition",
        name: "Full Competition",
        minimumDays: 0,
        activities: ["Unrestricted"],
        restrictions: [],
        progressionCriteria: ["Cleared for competition"],
        loadPercentage: 100,
        intensityLimit: 100,
        monitoringRequired: ["Re-injury monitoring"],
      },
    ],
    totalMinimumDays: 36,
    evidenceBase:
      "Ardern et al. (2016) - Consensus on return to sport after ACL",
    warnings: [
      "Ankle sprains have high recurrence rate - complete full protocol",
      "Continue proprioception training even after return",
      "Consider taping/bracing for first few weeks of competition",
    ],
  },

  tendinopathy: {
    injuryType: "tendinopathy",
    stages: [
      {
        stage: "rest",
        name: "Load Modification",
        minimumDays: 7,
        activities: [
          "Reduce aggravating activities",
          "Isometric exercises (pain-free)",
          "Maintain fitness with non-aggravating activities",
        ],
        restrictions: [
          "Avoid activities that cause pain >3/10",
          "No stretching (can aggravate)",
          "Reduce training volume significantly",
        ],
        progressionCriteria: [
          "Morning stiffness reduced",
          "Pain <3/10 during daily activities",
          "Isometrics pain-free",
        ],
        loadPercentage: 20,
        intensityLimit: 30,
        monitoringRequired: [
          "Morning stiffness",
          "Pain levels",
          "24h response",
        ],
      },
      {
        stage: "light_activity",
        name: "Gradual Loading",
        minimumDays: 14,
        activities: [
          "Progressive isometric loading",
          "Introduction of slow eccentric exercises",
          "Light sport-specific activities",
          "Gradual increase in training volume",
        ],
        restrictions: [
          "Pain should not exceed 5/10 during exercise",
          "No explosive movements",
          "24h rule: symptoms should settle within 24h",
        ],
        progressionCriteria: [
          "Tolerating eccentric exercises",
          "Pain not increasing week to week",
          "Function improving",
        ],
        loadPercentage: 40,
        intensityLimit: 50,
        monitoringRequired: [
          "Pain during exercise",
          "24h pain response",
          "Function",
        ],
      },
      {
        stage: "sport_specific_low",
        name: "Energy Storage Loading",
        minimumDays: 14,
        activities: [
          "Plyometric progression (low level)",
          "Sport-specific movements (controlled)",
          "Running progression",
        ],
        restrictions: [
          "Gradual plyometric progression",
          "Monitor 24h response carefully",
        ],
        progressionCriteria: [
          "Tolerating plyometrics",
          "Running without pain increase",
          "No morning stiffness increase",
        ],
        loadPercentage: 60,
        intensityLimit: 70,
        monitoringRequired: [
          "Plyometric tolerance",
          "Running response",
          "Morning stiffness",
        ],
      },
      {
        stage: "sport_specific_moderate",
        name: "Return to Sport Loading",
        minimumDays: 14,
        activities: [
          "Full plyometric training",
          "Sport-specific drills",
          "Gradual return to full practice",
        ],
        restrictions: [
          "Continue monitoring 24h response",
          "Maintain eccentric strengthening",
        ],
        progressionCriteria: [
          "Full practice participation",
          "Minimal or no symptoms",
        ],
        loadPercentage: 80,
        intensityLimit: 85,
        monitoringRequired: ["Practice tolerance", "Symptom levels"],
      },
      {
        stage: "full_training",
        name: "Full Training",
        minimumDays: 7,
        activities: ["Full training without restriction"],
        restrictions: ["Continue maintenance exercises"],
        progressionCriteria: ["7+ days full training without flare-up"],
        loadPercentage: 100,
        intensityLimit: 100,
        monitoringRequired: ["Symptom monitoring"],
      },
      {
        stage: "full_competition",
        name: "Full Competition",
        minimumDays: 0,
        activities: ["Unrestricted"],
        restrictions: ["Continue maintenance program"],
        progressionCriteria: ["Cleared for competition"],
        loadPercentage: 100,
        intensityLimit: 100,
        monitoringRequired: ["Long-term symptom management"],
      },
    ],
    totalMinimumDays: 56,
    evidenceBase: "Cook & Purdam (2009) - Tendinopathy load management",
    warnings: [
      "Tendinopathy requires patience - rushing increases recurrence",
      "Continue maintenance exercises indefinitely",
      "Some discomfort during exercise is acceptable if settles within 24h",
      "Avoid complete rest - controlled loading is better",
    ],
  },

  concussion: {
    injuryType: "concussion",
    stages: [
      {
        stage: "rest",
        name: "Symptom-Limited Activity",
        minimumDays: 2,
        activities: [
          "Cognitive and physical rest",
          "Gradual return to daily activities",
          "Light walking if tolerated",
        ],
        restrictions: [
          "No screens if they worsen symptoms",
          "No physical exertion",
          "Avoid activities that worsen symptoms",
        ],
        progressionCriteria: [
          "Symptom-free at rest",
          "Normal daily activities without symptoms",
        ],
        loadPercentage: 0,
        intensityLimit: 0,
        monitoringRequired: ["All concussion symptoms", "Cognitive function"],
      },
      {
        stage: "light_activity",
        name: "Light Aerobic Exercise",
        minimumDays: 1,
        activities: [
          "Walking",
          "Light stationary cycling",
          "No resistance training",
        ],
        restrictions: [
          "Heart rate <70% max",
          "No head movements that provoke symptoms",
        ],
        progressionCriteria: [
          "No symptom exacerbation during exercise",
          "Symptoms remain at baseline after exercise",
        ],
        loadPercentage: 20,
        intensityLimit: 40,
        monitoringRequired: ["Symptom exacerbation", "Heart rate response"],
      },
      {
        stage: "sport_specific_low",
        name: "Sport-Specific Exercise",
        minimumDays: 1,
        activities: [
          "Running drills",
          "Sport-specific movement",
          "No head impact activities",
        ],
        restrictions: [
          "No contact",
          "No heading (if applicable)",
          "Moderate intensity only",
        ],
        progressionCriteria: ["No symptoms during sport-specific exercise"],
        loadPercentage: 40,
        intensityLimit: 60,
        monitoringRequired: ["Symptoms during activity"],
      },
      {
        stage: "sport_specific_moderate",
        name: "Non-Contact Training",
        minimumDays: 1,
        activities: [
          "Full training drills",
          "Resistance training",
          "Coordination exercises",
        ],
        restrictions: ["No contact"],
        progressionCriteria: [
          "Tolerating full training intensity",
          "Normal cognitive function",
        ],
        loadPercentage: 80,
        intensityLimit: 90,
        monitoringRequired: ["Training tolerance", "Cognitive function"],
      },
      {
        stage: "full_training",
        name: "Full Contact Practice",
        minimumDays: 1,
        activities: [
          "Full practice with contact (if applicable)",
          "Requires medical clearance",
        ],
        restrictions: [],
        progressionCriteria: [
          "Medical clearance obtained",
          "Full practice without symptoms",
        ],
        loadPercentage: 100,
        intensityLimit: 100,
        monitoringRequired: ["Post-contact symptoms"],
      },
      {
        stage: "full_competition",
        name: "Return to Competition",
        minimumDays: 0,
        activities: ["Full competition"],
        restrictions: [],
        progressionCriteria: ["Medical clearance for competition"],
        loadPercentage: 100,
        intensityLimit: 100,
        monitoringRequired: ["Post-game symptoms", "Cognitive monitoring"],
      },
    ],
    totalMinimumDays: 6,
    evidenceBase:
      "McCrory et al. (2017) - Consensus statement on concussion in sport",
    warnings: [
      "MUST have medical clearance before return to contact/competition",
      "Any symptom return = go back one stage",
      "Minimum 24 hours at each stage",
      "Do not rush - second impact syndrome is serious",
    ],
  },

  illness: {
    injuryType: "illness",
    stages: [
      {
        stage: "rest",
        name: "Complete Rest",
        minimumDays: 3,
        activities: ["Rest", "Hydration", "Sleep"],
        restrictions: ["No training"],
        progressionCriteria: ["Fever-free for 24h", "Major symptoms resolved"],
        loadPercentage: 0,
        intensityLimit: 0,
        monitoringRequired: ["Temperature", "Symptoms"],
      },
      {
        stage: "light_activity",
        name: "Light Activity",
        minimumDays: 2,
        activities: ["Walking", "Light stretching"],
        restrictions: ["No intense exercise"],
        progressionCriteria: ["No symptom return", "Energy improving"],
        loadPercentage: 20,
        intensityLimit: 40,
        monitoringRequired: ["Energy levels", "Symptom return"],
      },
      {
        stage: "sport_specific_low",
        name: "Gradual Return",
        minimumDays: 2,
        activities: ["Light training", "50% intensity"],
        restrictions: ["Limit duration"],
        progressionCriteria: ["Tolerating light training"],
        loadPercentage: 50,
        intensityLimit: 60,
        monitoringRequired: ["Training tolerance"],
      },
      {
        stage: "full_training",
        name: "Full Training",
        minimumDays: 2,
        activities: ["Normal training"],
        restrictions: ["Monitor fatigue"],
        progressionCriteria: ["Full training without issues"],
        loadPercentage: 100,
        intensityLimit: 100,
        monitoringRequired: ["Fatigue", "Performance"],
      },
      {
        stage: "full_competition",
        name: "Full Competition",
        minimumDays: 0,
        activities: ["Unrestricted"],
        restrictions: [],
        progressionCriteria: ["Feeling fully recovered"],
        loadPercentage: 100,
        intensityLimit: 100,
        monitoringRequired: [],
      },
    ],
    totalMinimumDays: 9,
    evidenceBase: "General return-to-play guidelines after illness",
    warnings: [
      "Don't train with fever",
      "Consider longer rest for systemic illness",
      "Monitor heart rate - elevated resting HR indicates incomplete recovery",
    ],
  },

  general_absence: {
    injuryType: "general_absence",
    stages: [
      {
        stage: "light_activity",
        name: "Fitness Rebuild",
        minimumDays: 7,
        activities: [
          "Light cardio",
          "Basic strength work",
          "Movement quality focus",
        ],
        restrictions: ["No high intensity", "Limit volume"],
        progressionCriteria: [
          "Tolerating light training",
          "No excessive soreness",
        ],
        loadPercentage: 40,
        intensityLimit: 60,
        monitoringRequired: ["Soreness", "Fatigue"],
      },
      {
        stage: "sport_specific_low",
        name: "Sport-Specific Rebuild",
        minimumDays: 7,
        activities: ["Sport-specific drills", "Moderate intensity training"],
        restrictions: ["Gradual volume increase"],
        progressionCriteria: ["Tolerating sport-specific work"],
        loadPercentage: 60,
        intensityLimit: 75,
        monitoringRequired: ["Training tolerance"],
      },
      {
        stage: "sport_specific_moderate",
        name: "Building Load",
        minimumDays: 7,
        activities: [
          "Higher intensity training",
          "Building toward full practice",
        ],
        restrictions: [],
        progressionCriteria: ["Ready for full training"],
        loadPercentage: 80,
        intensityLimit: 85,
        monitoringRequired: ["Load tolerance"],
      },
      {
        stage: "full_training",
        name: "Full Training",
        minimumDays: 7,
        activities: ["Full training"],
        restrictions: [],
        progressionCriteria: ["Full training without issues"],
        loadPercentage: 100,
        intensityLimit: 100,
        monitoringRequired: ["Performance"],
      },
      {
        stage: "full_competition",
        name: "Full Competition",
        minimumDays: 0,
        activities: ["Unrestricted"],
        restrictions: [],
        progressionCriteria: ["Ready for competition"],
        loadPercentage: 100,
        intensityLimit: 100,
        monitoringRequired: [],
      },
    ],
    totalMinimumDays: 28,
    evidenceBase:
      "Blanch & Gabbett (2016) - Building chronic load before competition",
    warnings: [
      "Time away = loss of chronic load",
      "Build load gradually - don't jump back to previous levels",
      "Monitor ACWR carefully during return",
    ],
  },

  bone_stress: {
    injuryType: "bone_stress",
    stages: [
      {
        stage: "rest",
        name: "Complete Rest",
        minimumDays: 14,
        activities: [
          "Non-weight bearing activities",
          "Pool running",
          "Upper body training",
        ],
        restrictions: ["No impact activities", "May require boot/crutches"],
        progressionCriteria: [
          "Pain-free with daily activities",
          "Medical imaging clearance",
        ],
        loadPercentage: 0,
        intensityLimit: 0,
        monitoringRequired: ["Pain levels", "Medical imaging"],
      },
      {
        stage: "light_activity",
        name: "Gradual Loading",
        minimumDays: 14,
        activities: [
          "Walking progression",
          "Stationary cycling",
          "Gradual weight bearing",
        ],
        restrictions: ["No running", "No jumping"],
        progressionCriteria: [
          "Pain-free walking",
          "No symptoms with daily activities",
        ],
        loadPercentage: 20,
        intensityLimit: 40,
        monitoringRequired: ["Weight bearing tolerance"],
      },
      {
        stage: "sport_specific_low",
        name: "Return to Running",
        minimumDays: 14,
        activities: ["Walk-jog progression", "Gradual running build-up"],
        restrictions: ["Follow specific running progression", "No sprinting"],
        progressionCriteria: [
          "Pain-free jogging",
          "Completing running progression",
        ],
        loadPercentage: 40,
        intensityLimit: 60,
        monitoringRequired: ["Pain during/after running"],
      },
      {
        stage: "sport_specific_moderate",
        name: "Sport-Specific",
        minimumDays: 14,
        activities: [
          "Sport-specific drills",
          "Gradual introduction of higher intensity",
        ],
        restrictions: ["Continue gradual progression"],
        progressionCriteria: ["Tolerating sport-specific work"],
        loadPercentage: 70,
        intensityLimit: 80,
        monitoringRequired: ["Bone stress symptoms"],
      },
      {
        stage: "full_training",
        name: "Full Training",
        minimumDays: 7,
        activities: ["Full training"],
        restrictions: ["Monitor for symptom return"],
        progressionCriteria: ["Full training without symptoms"],
        loadPercentage: 100,
        intensityLimit: 100,
        monitoringRequired: ["Symptom monitoring"],
      },
      {
        stage: "full_competition",
        name: "Full Competition",
        minimumDays: 0,
        activities: ["Unrestricted"],
        restrictions: [],
        progressionCriteria: ["Medical clearance"],
        loadPercentage: 100,
        intensityLimit: 100,
        monitoringRequired: ["Long-term bone health"],
      },
    ],
    totalMinimumDays: 63,
    evidenceBase: "Warden et al. (2014) - Management of bone stress injuries",
    warnings: [
      "Bone stress injuries require medical management",
      "Imaging may be required before progression",
      "High recurrence risk if returned too early",
      "Address underlying causes (nutrition, training errors)",
    ],
  },
};

// ============================================================================
// SERVICE
// ============================================================================

@Injectable({
  providedIn: "root",
})
export class ReturnToPlayService {
  private logger = inject(LoggerService);

  // State
  private readonly _activeInjuries = signal<InjuryRecord[]>([]);
  private readonly _checkInHistory = signal<DailyCheckIn[]>([]);

  // Public signals
  readonly activeInjuries = this._activeInjuries.asReadonly();
  readonly checkInHistory = this._checkInHistory.asReadonly();

  // Computed
  readonly hasActiveInjury = computed(() => this._activeInjuries().length > 0);
  readonly injuriesInReturn = computed(() =>
    this._activeInjuries().filter((i) => i.currentStage !== "full_competition"),
  );

  /**
   * Get protocol for injury type
   */
  getProtocol(injuryType: InjuryType): ReturnProtocol {
    return RETURN_PROTOCOLS[injuryType];
  }

  /**
   * Get all protocols
   */
  getAllProtocols(): ReturnProtocol[] {
    return Object.values(RETURN_PROTOCOLS);
  }

  /**
   * Create new injury record
   */
  createInjuryRecord(
    type: InjuryType,
    severity: InjuryRecord["severity"],
    location?: string,
    notes?: string,
  ): InjuryRecord {
    const protocol = this.getProtocol(type);

    const injury: InjuryRecord = {
      id: `injury_${Date.now()}`,
      type,
      location,
      dateOccurred: new Date(),
      severity,
      estimatedRecoveryWeeks: Math.ceil(protocol.totalMinimumDays / 7),
      notes,
      currentStage: "rest",
      stageHistory: [],
    };

    this._activeInjuries.update((injuries) => [...injuries, injury]);
    return injury;
  }

  /**
   * Get current progress for an injury
   */
  getProgress(injuryId: string): ReturnProgress | null {
    const injury = this._activeInjuries().find((i) => i.id === injuryId);
    if (!injury) return null;

    const protocol = this.getProtocol(injury.type);
    const currentStageIndex = protocol.stages.findIndex(
      (s) => s.stage === injury.currentStage,
    );
    const currentStage = protocol.stages[currentStageIndex];

    // Calculate days in current stage
    const lastTransition = injury.stageHistory[injury.stageHistory.length - 1];
    const stageStartDate = lastTransition?.date || injury.dateOccurred;
    const daysInCurrentStage = Math.floor(
      (Date.now() - stageStartDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Check if can progress
    const canProgress = daysInCurrentStage >= currentStage.minimumDays;
    const progressionBlockers: string[] = [];

    if (!canProgress) {
      progressionBlockers.push(
        `Minimum ${currentStage.minimumDays} days required (${daysInCurrentStage} completed)`,
      );
    }

    // Get next stage
    const nextStage =
      currentStageIndex < protocol.stages.length - 1
        ? protocol.stages[currentStageIndex + 1]
        : null;

    // Calculate estimated days to full return
    let estimatedDaysRemaining = 0;
    for (let i = currentStageIndex; i < protocol.stages.length; i++) {
      if (i === currentStageIndex) {
        estimatedDaysRemaining += Math.max(
          0,
          protocol.stages[i].minimumDays - daysInCurrentStage,
        );
      } else {
        estimatedDaysRemaining += protocol.stages[i].minimumDays;
      }
    }

    // Calculate overall progress
    let completedDays = 0;
    for (let i = 0; i < currentStageIndex; i++) {
      completedDays += protocol.stages[i].minimumDays;
    }
    completedDays += Math.min(daysInCurrentStage, currentStage.minimumDays);
    const overallProgress = Math.round(
      (completedDays / protocol.totalMinimumDays) * 100,
    );

    return {
      injury,
      protocol,
      currentStage,
      daysInCurrentStage,
      canProgress,
      progressionBlockers,
      nextStage,
      estimatedDaysToFullReturn: estimatedDaysRemaining,
      overallProgress: Math.min(100, overallProgress),
    };
  }

  /**
   * Record daily check-in
   */
  recordCheckIn(checkIn: DailyCheckIn): void {
    this._checkInHistory.update((history) => [...history, checkIn]);
  }

  /**
   * Evaluate if athlete can progress to next stage
   */
  evaluateProgression(injuryId: string): ProgressionDecision {
    const progress = this.getProgress(injuryId);
    if (!progress) {
      return {
        canProgress: false,
        reasoning: "Injury record not found",
        recommendations: [],
        riskLevel: "high",
        requiredClearance: "medical",
      };
    }

    const { injury, currentStage, daysInCurrentStage, nextStage } = progress;

    // Get recent check-ins
    const recentCheckIns = this._checkInHistory()
      .filter((c) => c.injuryId === injuryId)
      .slice(-3);

    const recommendations: string[] = [];
    let canProgress = daysInCurrentStage >= currentStage.minimumDays;
    let reasoning = "";
    let riskLevel: ProgressionDecision["riskLevel"] = "low";

    // Check minimum days
    if (!canProgress) {
      reasoning = `Need ${currentStage.minimumDays - daysInCurrentStage} more days at this stage`;
      riskLevel = "moderate";
    }

    // Check pain levels from check-ins
    if (recentCheckIns.length > 0) {
      const avgPain =
        recentCheckIns.reduce((sum, c) => sum + c.painLevel, 0) /
        recentCheckIns.length;

      if (avgPain > 3) {
        canProgress = false;
        reasoning += " Pain levels too high for progression.";
        riskLevel = "high";
        recommendations.push("Focus on pain management before progressing");
      }

      const avgConfidence =
        recentCheckIns.reduce((sum, c) => sum + c.confidence, 0) /
        recentCheckIns.length;

      if (avgConfidence < 7) {
        recommendations.push(
          "Psychological readiness is important - build confidence gradually",
        );
        if (avgConfidence < 5) {
          riskLevel = "moderate";
        }
      }
    } else {
      recommendations.push("Complete daily check-ins to track progress");
    }

    // Determine required clearance
    let requiredClearance: ProgressionDecision["requiredClearance"] = "self";
    if (
      injury.type === "concussion" ||
      (nextStage && nextStage.stage === "full_competition")
    ) {
      requiredClearance = "medical";
    } else if (nextStage && nextStage.loadPercentage >= 80) {
      requiredClearance = "coach";
    }

    if (canProgress && !reasoning) {
      reasoning = "All progression criteria met";
    }

    // Add stage-specific recommendations
    if (nextStage) {
      recommendations.push(`Next stage: ${nextStage.name}`);
      recommendations.push(
        `Activities: ${nextStage.activities.slice(0, 2).join(", ")}`,
      );
    }

    return {
      canProgress,
      reasoning,
      recommendations,
      riskLevel,
      requiredClearance,
    };
  }

  /**
   * Progress injury to next stage
   */
  progressToNextStage(
    injuryId: string,
    clearedBy?: string,
    notes?: string,
  ): boolean {
    const progress = this.getProgress(injuryId);
    if (!progress || !progress.nextStage) return false;

    const decision = this.evaluateProgression(injuryId);
    if (!decision.canProgress) return false;

    const nextStage = progress.nextStage;

    this._activeInjuries.update((injuries) =>
      injuries.map((injury) => {
        if (injury.id === injuryId) {
          return {
            ...injury,
            currentStage: nextStage.stage,
            stageHistory: [
              ...injury.stageHistory,
              {
                fromStage: progress.currentStage.stage,
                toStage: nextStage.stage,
                date: new Date(),
                clearedBy,
                notes,
              },
            ],
          };
        }
        return injury;
      }),
    );

    return true;
  }

  /**
   * Regress to previous stage (if symptoms return)
   */
  regressToPreviousStage(injuryId: string, reason: string): boolean {
    const progress = this.getProgress(injuryId);
    if (!progress) return false;

    const currentStageIndex = progress.protocol.stages.findIndex(
      (s) => s.stage === progress.currentStage.stage,
    );

    if (currentStageIndex <= 0) return false;

    const previousStage = progress.protocol.stages[currentStageIndex - 1];

    this._activeInjuries.update((injuries) =>
      injuries.map((injury) => {
        if (injury.id === injuryId) {
          return {
            ...injury,
            currentStage: previousStage.stage,
            stageHistory: [
              ...injury.stageHistory,
              {
                fromStage: progress.currentStage.stage,
                toStage: previousStage.stage,
                date: new Date(),
                notes: `Regression due to: ${reason}`,
              },
            ],
          };
        }
        return injury;
      }),
    );

    return true;
  }

  /**
   * Get training restrictions for current stage
   */
  getTrainingRestrictions(injuryId: string): {
    maxLoadPercentage: number;
    maxIntensity: number;
    allowedActivities: string[];
    restrictions: string[];
  } | null {
    const progress = this.getProgress(injuryId);
    if (!progress) return null;

    return {
      maxLoadPercentage: progress.currentStage.loadPercentage,
      maxIntensity: progress.currentStage.intensityLimit,
      allowedActivities: progress.currentStage.activities,
      restrictions: progress.currentStage.restrictions,
    };
  }

  /**
   * Mark injury as fully recovered
   */
  markRecovered(injuryId: string): void {
    this._activeInjuries.update((injuries) =>
      injuries.filter((i) => i.id !== injuryId),
    );
  }

  /**
   * Get injury history (recovered injuries)
   */
  getInjuryHistory(): InjuryRecord[] {
    return this._activeInjuries().filter(
      (i) => i.currentStage === "full_competition",
    );
  }
}
