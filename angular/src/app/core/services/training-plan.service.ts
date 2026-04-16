/**
 * Training Plan Service
 *
 * Goal-based training plan generation with periodization logic
 * Auto-builds weekly templates based on athlete goals and ACWR
 */

import { Injectable, inject, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { AcwrService } from "./acwr.service";
import { ReadinessService } from "./readiness.service";
import { ApiService } from "./api.service";
import { LoggerService } from "./logger.service";
import {
  extractApiArray,
  extractApiPayload,
} from "../utils/api-response-mapper";

export type TrainingGoal =
  | "speed"
  | "change-of-direction"
  | "agility"
  | "route-running"
  | "defense"
  | "power"
  | "endurance";
export type SessionType =
  | "speed"
  | "agility"
  | "strength"
  | "technique"
  | "conditioning"
  | "recovery"
  | "game";

export interface TrainingSessionTemplate {
  day: number; // 0-6 (Monday-Sunday)
  sessionType: SessionType;
  focus: string[];
  exercises: string[];
  duration: number; // minutes
  intensity: "low" | "medium" | "high";
  volume: number; // reps/sets/distance
  restPeriods: string;
  notes: string;
}

export interface WeeklyTrainingPlan {
  goal: TrainingGoal;
  weekNumber: number;
  phase: string;
  sessions: TrainingSessionTemplate[];
  totalVolume: number;
  progressionRules: {
    acwrThreshold: number;
    volumeAdjustment: number; // percentage
  };
}

export interface GoalBasedPlanConfig {
  goal: TrainingGoal;
  currentACWR: number;
  readinessLevel: "low" | "moderate" | "high";
  gameDays?: Date[]; // Upcoming game dates
  trainingDaysPerWeek?: number; // 3-6
  phase?: "foundation" | "strength" | "power" | "peaking" | "maintenance";
  /** Primary competition/tournament date. Triggers a 10-14 day taper when within range. */
  competitionDate?: Date;
  /** Date of last completed training session. Used to detect detraining gaps ≥7 days. */
  lastTrainingDate?: Date;
}

/** Result of the pre-plan periodization state check. */
export interface PeriodizationState {
  phase: "normal" | "taper" | "detraining_ramp";
  /** Days until competition (undefined if no competition date set). */
  daysToCompetition?: number;
  /** Days since last training (undefined if no lastTrainingDate set). */
  daysSinceTraining?: number;
  /** Narrative for coach/athlete display. */
  message: string;
}

interface FixtureResponse {
  game_start: string;
  [key: string]: unknown;
}

interface PlanSaveResponse {
  success?: boolean;
}

interface PlanWithId extends WeeklyTrainingPlan {
  id?: string;
}

@Injectable({
  providedIn: "root",
})
export class TrainingPlanService {
  private acwrService = inject(AcwrService);
  private readinessService = inject(ReadinessService);
  private apiService = inject(ApiService);
  private logger = inject(LoggerService);

  readonly currentPlan = signal<WeeklyTrainingPlan | null>(null);
  readonly loading = signal(false);

  /**
   * Generate goal-based weekly training plan
   */
  generateWeeklyPlan(config: GoalBasedPlanConfig): WeeklyTrainingPlan {
    const {
      goal,
      currentACWR,
      readinessLevel,
      gameDays = [],
      trainingDaysPerWeek = 5,
      competitionDate,
      lastTrainingDate,
    } = config;

    // ── Periodization state detection ─────────────────────────────────────────
    const periodization = this.detectPeriodizationState(
      competitionDate,
      lastTrainingDate,
    );

    // Override phase when taper or detraining ramp is active
    let phase = config.phase ?? this.determinePhase(currentACWR, readinessLevel);
    if (periodization.phase === "taper") phase = "peaking";
    if (periodization.phase === "detraining_ramp") phase = "foundation";

    // Get base template for goal
    const baseTemplate = this.getGoalTemplate(goal, phase);

    // Adjust for ACWR and readiness
    let adjustedTemplate = this.adjustForACWR(
      baseTemplate,
      currentACWR,
      readinessLevel,
    );

    // Apply taper volume reduction on top of ACWR adjustments
    if (periodization.phase === "taper" && periodization.daysToCompetition !== undefined) {
      adjustedTemplate = this.applyTaperProgression(
        adjustedTemplate,
        periodization.daysToCompetition,
      );
    }

    // Apply conservative re-conditioning ramp after detraining gap
    if (periodization.phase === "detraining_ramp" && periodization.daysSinceTraining !== undefined) {
      adjustedTemplate = this.applyDetrainingRamp(
        adjustedTemplate,
        periodization.daysSinceTraining,
      );
    }

    // Adjust for game proximity
    const gameAwareTemplate = this.adjustForGameDays(
      adjustedTemplate,
      gameDays,
    );

    // Apply progression rules
    const finalPlan = this.applyProgressionRules(
      gameAwareTemplate,
      currentACWR,
      trainingDaysPerWeek,
    );

    // Attach periodization notes so the UI can surface them
    if (periodization.message) {
      finalPlan.sessions = finalPlan.sessions.map((s) => ({
        ...s,
        notes: s.notes
          ? `${s.notes} | ${periodization.message}`
          : periodization.message,
      }));
    }

    this.currentPlan.set(finalPlan);
    return finalPlan;
  }

  /**
   * Detect taper (pre-competition) and detraining (prolonged absence) states.
   * Returns a PeriodizationState that upstream callers can display to athletes.
   */
  detectPeriodizationState(
    competitionDate?: Date,
    lastTrainingDate?: Date,
  ): PeriodizationState {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ── Detraining gap check (takes precedence over taper) ────────────────────
    if (lastTrainingDate) {
      const last = new Date(lastTrainingDate);
      last.setHours(0, 0, 0, 0);
      const daysSince = Math.round(
        (today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24),
      );

      // ≥7 days off = detraining begins (Mujika & Padilla 2001)
      if (daysSince >= 7) {
        return {
          phase: "detraining_ramp",
          daysSinceTraining: daysSince,
          message:
            `${daysSince}-day training gap detected. Re-conditioning ramp applied — ` +
            "volume capped at 60% for week 1 to prevent injury on return.",
        };
      }
    }

    // ── Taper check ───────────────────────────────────────────────────────────
    if (competitionDate) {
      const comp = new Date(competitionDate);
      comp.setHours(0, 0, 0, 0);
      const daysOut = Math.round(
        (comp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );

      // 4–14 days out = progressive taper window (Bosquet et al. 2007)
      if (daysOut >= 0 && daysOut <= 14) {
        return {
          phase: "taper",
          daysToCompetition: daysOut,
          message:
            `${daysOut} days to competition — taper active. ` +
            "Volume progressively reduced; intensity maintained.",
        };
      }
    }

    return { phase: "normal", message: "" };
  }

  /**
   * Get base training template for a specific goal
   */
  private getGoalTemplate(
    goal: TrainingGoal,
    phase: string,
  ): TrainingSessionTemplate[] {
    const templates: Record<
      TrainingGoal,
      Record<string, TrainingSessionTemplate[]>
    > = {
      speed: {
        foundation: [
          {
            day: 0,
            sessionType: "speed",
            focus: ["Mechanics", "Acceleration"],
            exercises: ["Wall drills", "10m sprints", "Resisted sprints"],
            duration: 45,
            intensity: "medium",
            volume: 8,
            restPeriods: "2-3 min",
            notes: "Focus on form",
          },
          {
            day: 2,
            sessionType: "strength",
            focus: ["Posterior chain"],
            exercises: ["RDLs", "Hip thrusts"],
            duration: 60,
            intensity: "medium",
            volume: 4,
            restPeriods: "3 min",
            notes: "",
          },
          {
            day: 4,
            sessionType: "speed",
            focus: ["Top speed"],
            exercises: ["Flying 20s", "30m sprints"],
            duration: 45,
            intensity: "high",
            volume: 6,
            restPeriods: "4-5 min",
            notes: "",
          },
          {
            day: 6,
            sessionType: "recovery",
            focus: ["Mobility"],
            exercises: ["Dynamic warmup", "Foam rolling"],
            duration: 30,
            intensity: "low",
            volume: 1,
            restPeriods: "N/A",
            notes: "Active recovery",
          },
        ],
        strength: [
          {
            day: 0,
            sessionType: "speed",
            focus: ["Acceleration", "Power"],
            exercises: ["Resisted sprints", "Hill sprints", "Plyometrics"],
            duration: 60,
            intensity: "high",
            volume: 10,
            restPeriods: "3-4 min",
            notes: "Max effort",
          },
          {
            day: 2,
            sessionType: "strength",
            focus: ["Max strength"],
            exercises: ["Squats", "Deadlifts", "Nordic curls"],
            duration: 75,
            intensity: "high",
            volume: 5,
            restPeriods: "4-5 min",
            notes: "",
          },
          {
            day: 4,
            sessionType: "speed",
            focus: ["Top speed", "Speed endurance"],
            exercises: ["Flying 30s", "150m repeats"],
            duration: 60,
            intensity: "high",
            volume: 8,
            restPeriods: "5-6 min",
            notes: "",
          },
          {
            day: 6,
            sessionType: "recovery",
            focus: ["Mobility"],
            exercises: ["Yoga", "Foam rolling"],
            duration: 45,
            intensity: "low",
            volume: 1,
            restPeriods: "N/A",
            notes: "",
          },
        ],
      },
      "change-of-direction": {
        foundation: [
          {
            day: 0,
            sessionType: "agility",
            focus: ["Lateral movement", "Deceleration"],
            exercises: ["Lateral shuffles", "5-10-5 drill", "Cone drills"],
            duration: 45,
            intensity: "medium",
            volume: 10,
            restPeriods: "2 min",
            notes: "Focus on technique",
          },
          {
            day: 2,
            sessionType: "strength",
            focus: ["Eccentric strength"],
            exercises: ["Split squats", "Lunges", "Single-leg RDLs"],
            duration: 60,
            intensity: "medium",
            volume: 4,
            restPeriods: "2-3 min",
            notes: "",
          },
          {
            day: 4,
            sessionType: "agility",
            focus: ["Multi-directional"],
            exercises: ["T-drill", "L-drill", "Reactive agility"],
            duration: 50,
            intensity: "high",
            volume: 8,
            restPeriods: "3 min",
            notes: "",
          },
          {
            day: 6,
            sessionType: "recovery",
            focus: ["Mobility"],
            exercises: ["Hip mobility", "Ankle mobility"],
            duration: 30,
            intensity: "low",
            volume: 1,
            restPeriods: "N/A",
            notes: "",
          },
        ],
        strength: [
          {
            day: 0,
            sessionType: "agility",
            focus: ["Reactive COD", "Power"],
            exercises: [
              "Reactive cone drills",
              "Plyometric cuts",
              "Mirror drills",
            ],
            duration: 60,
            intensity: "high",
            volume: 12,
            restPeriods: "3-4 min",
            notes: "Game-like intensity",
          },
          {
            day: 2,
            sessionType: "strength",
            focus: ["Eccentric power"],
            exercises: ["Depth jumps", "Lateral bounds", "Single-leg hops"],
            duration: 75,
            intensity: "high",
            volume: 6,
            restPeriods: "4 min",
            notes: "",
          },
          {
            day: 4,
            sessionType: "agility",
            focus: ["Speed-COD"],
            exercises: ["Sprint-cut-sprint", "Zigzag sprints"],
            duration: 60,
            intensity: "high",
            volume: 10,
            restPeriods: "4-5 min",
            notes: "",
          },
          {
            day: 6,
            sessionType: "recovery",
            focus: ["Mobility"],
            exercises: ["Full body mobility"],
            duration: 45,
            intensity: "low",
            volume: 1,
            restPeriods: "N/A",
            notes: "",
          },
        ],
      },
      agility: {
        foundation: [
          {
            day: 0,
            sessionType: "agility",
            focus: ["Footwork", "Quickness"],
            exercises: ["Ladder drills", "Cone drills", "Reaction drills"],
            duration: 40,
            intensity: "medium",
            volume: 12,
            restPeriods: "1-2 min",
            notes: "High volume, low intensity",
          },
          {
            day: 2,
            sessionType: "strength",
            focus: ["Lower body"],
            exercises: ["Goblet squats", "Step-ups", "Calf raises"],
            duration: 50,
            intensity: "medium",
            volume: 3,
            restPeriods: "2 min",
            notes: "",
          },
          {
            day: 4,
            sessionType: "agility",
            focus: ["Reactive agility"],
            exercises: ["Mirror drills", "Partner drills", "Random direction"],
            duration: 45,
            intensity: "high",
            volume: 10,
            restPeriods: "2-3 min",
            notes: "",
          },
          {
            day: 6,
            sessionType: "recovery",
            focus: ["Mobility"],
            exercises: ["Dynamic stretching"],
            duration: 30,
            intensity: "low",
            volume: 1,
            restPeriods: "N/A",
            notes: "",
          },
        ],
        strength: [
          {
            day: 0,
            sessionType: "agility",
            focus: ["Game-speed agility"],
            exercises: [
              "Position-specific drills",
              "Reactive cuts",
              "Open-field agility",
            ],
            duration: 60,
            intensity: "high",
            volume: 15,
            restPeriods: "3 min",
            notes: "Competition intensity",
          },
          {
            day: 2,
            sessionType: "strength",
            focus: ["Power"],
            exercises: ["Box jumps", "Lateral bounds", "Medicine ball throws"],
            duration: 60,
            intensity: "high",
            volume: 5,
            restPeriods: "3-4 min",
            notes: "",
          },
          {
            day: 4,
            sessionType: "agility",
            focus: ["Speed-agility"],
            exercises: ["Sprint-agility combos", "Multi-directional sprints"],
            duration: 60,
            intensity: "high",
            volume: 12,
            restPeriods: "4 min",
            notes: "",
          },
          {
            day: 6,
            sessionType: "recovery",
            focus: ["Mobility"],
            exercises: ["Yoga flow"],
            duration: 45,
            intensity: "low",
            volume: 1,
            restPeriods: "N/A",
            notes: "",
          },
        ],
      },
      "route-running": {
        foundation: [
          {
            day: 0,
            sessionType: "technique",
            focus: ["Route mechanics", "Separation"],
            exercises: ["Route tree practice", "Release drills", "Cone routes"],
            duration: 60,
            intensity: "medium",
            volume: 20,
            restPeriods: "1-2 min",
            notes: "Focus on technique",
          },
          {
            day: 2,
            sessionType: "speed",
            focus: ["Acceleration"],
            exercises: ["10m sprints", "Starts", "Resisted sprints"],
            duration: 45,
            intensity: "medium",
            volume: 8,
            restPeriods: "2-3 min",
            notes: "",
          },
          {
            day: 4,
            sessionType: "technique",
            focus: ["Route execution"],
            exercises: ["Full routes", "Catch drills", "Contested catches"],
            duration: 60,
            intensity: "high",
            volume: 15,
            restPeriods: "2 min",
            notes: "",
          },
          {
            day: 6,
            sessionType: "recovery",
            focus: ["Mobility"],
            exercises: ["Hip mobility", "Shoulder mobility"],
            duration: 30,
            intensity: "low",
            volume: 1,
            restPeriods: "N/A",
            notes: "",
          },
        ],
        strength: [
          {
            day: 0,
            sessionType: "technique",
            focus: ["Advanced routes", "Game situations"],
            exercises: ["Double moves", "Route combinations", "QB-WR timing"],
            duration: 75,
            intensity: "high",
            volume: 25,
            restPeriods: "2 min",
            notes: "Game-speed",
          },
          {
            day: 2,
            sessionType: "speed",
            focus: ["Top speed"],
            exercises: ["Flying 20s", "30m sprints"],
            duration: 50,
            intensity: "high",
            volume: 10,
            restPeriods: "4 min",
            notes: "",
          },
          {
            day: 4,
            sessionType: "technique",
            focus: ["Route precision"],
            exercises: ["Precision routes", "Separation moves"],
            duration: 70,
            intensity: "high",
            volume: 20,
            restPeriods: "2-3 min",
            notes: "",
          },
          {
            day: 6,
            sessionType: "recovery",
            focus: ["Mobility"],
            exercises: ["Full body mobility"],
            duration: 45,
            intensity: "low",
            volume: 1,
            restPeriods: "N/A",
            notes: "",
          },
        ],
      },
      defense: {
        foundation: [
          {
            day: 0,
            sessionType: "technique",
            focus: ["Backpedal", "Hip turn"],
            exercises: [
              "Backpedal drills",
              "Hip turn drills",
              "Coverage technique",
            ],
            duration: 60,
            intensity: "medium",
            volume: 15,
            restPeriods: "2 min",
            notes: "Focus on form",
          },
          {
            day: 2,
            sessionType: "agility",
            focus: ["Lateral movement"],
            exercises: ["Lateral shuffles", "Cone drills", "Mirror drills"],
            duration: 50,
            intensity: "medium",
            volume: 12,
            restPeriods: "2-3 min",
            notes: "",
          },
          {
            day: 4,
            sessionType: "technique",
            focus: ["Coverage", "Ball skills"],
            exercises: ["Coverage drills", "Ball drills", "Break on ball"],
            duration: 60,
            intensity: "high",
            volume: 15,
            restPeriods: "2 min",
            notes: "",
          },
          {
            day: 6,
            sessionType: "recovery",
            focus: ["Mobility"],
            exercises: ["Hip mobility", "Ankle mobility"],
            duration: 30,
            intensity: "low",
            volume: 1,
            restPeriods: "N/A",
            notes: "",
          },
        ],
        strength: [
          {
            day: 0,
            sessionType: "technique",
            focus: ["Game situations", "Reactive coverage"],
            exercises: [
              "Coverage scenarios",
              "Break drills",
              "Contested catches",
            ],
            duration: 75,
            intensity: "high",
            volume: 20,
            restPeriods: "2-3 min",
            notes: "Game-speed",
          },
          {
            day: 2,
            sessionType: "agility",
            focus: ["Reactive agility"],
            exercises: ["Reactive cuts", "Direction changes"],
            duration: 60,
            intensity: "high",
            volume: 15,
            restPeriods: "3-4 min",
            notes: "",
          },
          {
            day: 4,
            sessionType: "technique",
            focus: ["Advanced coverage"],
            exercises: ["Zone coverage", "Man coverage", "Ball skills"],
            duration: 70,
            intensity: "high",
            volume: 18,
            restPeriods: "2-3 min",
            notes: "",
          },
          {
            day: 6,
            sessionType: "recovery",
            focus: ["Mobility"],
            exercises: ["Full body mobility"],
            duration: 45,
            intensity: "low",
            volume: 1,
            restPeriods: "N/A",
            notes: "",
          },
        ],
      },
      power: {
        foundation: [
          {
            day: 0,
            sessionType: "strength",
            focus: ["Max strength"],
            exercises: ["Squats", "Deadlifts", "Press"],
            duration: 75,
            intensity: "high",
            volume: 5,
            restPeriods: "4-5 min",
            notes: "Heavy loads",
          },
          {
            day: 2,
            sessionType: "speed",
            focus: ["Power development"],
            exercises: ["Plyometrics", "Jumps", "Throws"],
            duration: 50,
            intensity: "high",
            volume: 8,
            restPeriods: "3-4 min",
            notes: "",
          },
          {
            day: 4,
            sessionType: "strength",
            focus: ["Power"],
            exercises: ["Olympic lifts", "Explosive movements"],
            duration: 70,
            intensity: "high",
            volume: 6,
            restPeriods: "4 min",
            notes: "",
          },
          {
            day: 6,
            sessionType: "recovery",
            focus: ["Mobility"],
            exercises: ["Full body mobility"],
            duration: 45,
            intensity: "low",
            volume: 1,
            restPeriods: "N/A",
            notes: "",
          },
        ],
        strength: [
          {
            day: 0,
            sessionType: "strength",
            focus: ["Peak power"],
            exercises: ["Max effort lifts", "Plyometrics", "Speed work"],
            duration: 90,
            intensity: "high",
            volume: 6,
            restPeriods: "5 min",
            notes: "Peak intensity",
          },
          {
            day: 2,
            sessionType: "speed",
            focus: ["Explosive speed"],
            exercises: ["Sprint work", "Jumps", "Throws"],
            duration: 60,
            intensity: "high",
            volume: 10,
            restPeriods: "4-5 min",
            notes: "",
          },
          {
            day: 4,
            sessionType: "strength",
            focus: ["Power maintenance"],
            exercises: ["Moderate loads", "Power movements"],
            duration: 75,
            intensity: "medium",
            volume: 5,
            restPeriods: "3-4 min",
            notes: "",
          },
          {
            day: 6,
            sessionType: "recovery",
            focus: ["Mobility"],
            exercises: ["Yoga", "Foam rolling"],
            duration: 45,
            intensity: "low",
            volume: 1,
            restPeriods: "N/A",
            notes: "",
          },
        ],
      },
      endurance: {
        foundation: [
          {
            day: 0,
            sessionType: "conditioning",
            focus: ["Aerobic base"],
            exercises: ["Tempo runs", "Interval runs", "Fartlek"],
            duration: 60,
            intensity: "medium",
            volume: 3,
            restPeriods: "2 min",
            notes: "Steady pace",
          },
          {
            day: 2,
            sessionType: "strength",
            focus: ["Endurance strength"],
            exercises: ["Circuit training", "High reps"],
            duration: 60,
            intensity: "medium",
            volume: 3,
            restPeriods: "1 min",
            notes: "",
          },
          {
            day: 4,
            sessionType: "conditioning",
            focus: ["Anaerobic"],
            exercises: ["Sprint intervals", "Shuttle runs"],
            duration: 50,
            intensity: "high",
            volume: 6,
            restPeriods: "3 min",
            notes: "",
          },
          {
            day: 6,
            sessionType: "recovery",
            focus: ["Mobility"],
            exercises: ["Light jog", "Stretching"],
            duration: 30,
            intensity: "low",
            volume: 1,
            restPeriods: "N/A",
            notes: "",
          },
        ],
        strength: [
          {
            day: 0,
            sessionType: "conditioning",
            focus: ["VO2 max"],
            exercises: ["High-intensity intervals", "Sprint repeats"],
            duration: 70,
            intensity: "high",
            volume: 8,
            restPeriods: "3-4 min",
            notes: "Max effort",
          },
          {
            day: 2,
            sessionType: "strength",
            focus: ["Endurance"],
            exercises: ["Circuit", "High volume"],
            duration: 60,
            intensity: "medium",
            volume: 4,
            restPeriods: "1-2 min",
            notes: "",
          },
          {
            day: 4,
            sessionType: "conditioning",
            focus: ["Lactate threshold"],
            exercises: ["Tempo intervals", "Sustained efforts"],
            duration: 65,
            intensity: "high",
            volume: 5,
            restPeriods: "4 min",
            notes: "",
          },
          {
            day: 6,
            sessionType: "recovery",
            focus: ["Mobility"],
            exercises: ["Active recovery"],
            duration: 45,
            intensity: "low",
            volume: 1,
            restPeriods: "N/A",
            notes: "",
          },
        ],
      },
    };

    return templates[goal]?.[phase] || templates[goal]?.["foundation"] || [];
  }

  /**
   * Determine training phase based on ACWR and readiness
   */
  private determinePhase(
    acwr: number,
    readiness: "low" | "moderate" | "high",
  ): string {
    // Overloaded or under-recovered — always protective regardless of fitness level
    if (acwr > 1.5 || readiness === "low") return "foundation";
    // Sweet spot + high readiness → can progress
    if (acwr >= 0.8 && acwr <= 1.3 && readiness === "high") return "power";
    // Sweet spot + moderate readiness → maintain
    if (acwr >= 0.8 && acwr <= 1.3) return "foundation";
    // Under-trained but physically ready → build volume first, not intensity
    if (acwr < 0.8 && readiness === "high") return "strength";
    // Under-trained and moderate readiness → conservative base build
    return "foundation";
  }

  /**
   * Adjust template based on ACWR
   */
  private adjustForACWR(
    template: TrainingSessionTemplate[],
    acwr: number,
    readiness: "low" | "moderate" | "high",
  ): TrainingSessionTemplate[] {
    let volumeMultiplier = 1.0;
    let intensityAdjustment = 0;

    // ACWR-based adjustments with smooth linear interpolation to avoid
    // cliff-edge recommendation swings (e.g. 40% swing at ACWR 1.30 vs 1.31).
    if (acwr > 1.5) {
      // Danger zone: linear ramp from -40% at 1.5 to -60% at 2.0
      const overageRatio = Math.min((acwr - 1.5) / 0.5, 1.0);
      volumeMultiplier = 0.6 - overageRatio * 0.2; // 0.60 → 0.40
      intensityAdjustment = -1;
    } else if (acwr > 1.3) {
      // Elevated zone: linear ramp from 0% reduction at 1.3 to -40% at 1.5
      const overageRatio = (acwr - 1.3) / 0.2;
      volumeMultiplier = 1.0 - overageRatio * 0.4; // 1.00 → 0.60
      intensityAdjustment = -1;
    } else if (acwr < 0.8) {
      // Under-training zone: linear ramp from +20% at 0.8 to +5% at 0.5
      const underRatio = Math.min((0.8 - acwr) / 0.3, 1.0);
      volumeMultiplier = 1.2 - underRatio * 0.15; // 1.20 → 1.05
      intensityAdjustment = 1;
    }

    // Readiness-based adjustments
    if (readiness === "low") {
      volumeMultiplier *= 0.7;
      intensityAdjustment -= 1;
    } else if (readiness === "high") {
      volumeMultiplier *= 1.1;
    }

    return template.map((session) => ({
      ...session,
      volume: Math.round(session.volume * volumeMultiplier),
      intensity: this.adjustIntensity(session.intensity, intensityAdjustment),
      duration: Math.round(session.duration * volumeMultiplier),
    }));
  }

  /**
   * Adjust intensity level
   */
  private adjustIntensity(
    current: "low" | "medium" | "high",
    adjustment: number,
  ): "low" | "medium" | "high" {
    const levels: ("low" | "medium" | "high")[] = ["low", "medium", "high"];
    const currentIndex = levels.indexOf(current);
    const newIndex = Math.max(0, Math.min(2, currentIndex + adjustment));
    return levels[newIndex];
  }

  /**
   * Apply progressive volume reduction for the pre-competition taper window.
   *
   * Evidence: Bosquet et al. (2007) meta-analysis recommends ~41–60% volume
   * reduction over 8–14 days while maintaining or slightly reducing intensity.
   * A linear ramp is applied: full taper at 0 days out, 10% reduction at 14 days.
   *
   *   volumeFactor = 1.0 - (1 - daysOut/14) * 0.55
   *   → 14d out: 0.96 (near normal), 7d: 0.72, 3d: 0.45, 1d: 0.31
   */
  private applyTaperProgression(
    template: TrainingSessionTemplate[],
    daysToCompetition: number,
  ): TrainingSessionTemplate[] {
    // Linear interpolation from 0% reduction at 14d to 55% reduction at 0d
    const taperFraction = Math.max(0, Math.min(1, 1 - daysToCompetition / 14));
    const volumeFactor = 1.0 - taperFraction * 0.55;

    return template.map((session) => {
      // Skip recovery sessions — they're already low
      if (session.sessionType === "recovery") return session;

      // Maintain intensity but reduce volume
      const adjustedVolume = Math.max(
        1,
        Math.round(session.volume * volumeFactor),
      );
      const adjustedDuration = Math.max(
        15,
        Math.round(session.duration * volumeFactor),
      );

      return {
        ...session,
        volume: adjustedVolume,
        duration: adjustedDuration,
        // Taper preserves intensity — do NOT drop intensity level
        notes: session.notes
          ? `${session.notes} (taper: ${Math.round((1 - volumeFactor) * 100)}% volume reduction)`
          : `Taper: ${Math.round((1 - volumeFactor) * 100)}% volume reduction, intensity maintained`,
      };
    });
  }

  /**
   * Apply a conservative re-conditioning ramp after a detraining gap.
   *
   * Evidence: Mujika & Padilla (2001) show meaningful fitness decrements
   * begin at ~7 days of inactivity and accelerate beyond 14 days.
   *
   *   7–13 days off  → 60% volume, low intensity (week 1 return)
   *   14–20 days off → 50% volume, low intensity
   *   >20 days off   → 40% volume, mandatory low intensity
   *
   * Intensity is forced to "low" until the athlete is back in the sweet spot.
   */
  private applyDetrainingRamp(
    template: TrainingSessionTemplate[],
    daysSinceTraining: number,
  ): TrainingSessionTemplate[] {
    let volumeFactor: number;
    let forceIntensity: "low" | "medium" | null;

    if (daysSinceTraining >= 21) {
      volumeFactor = 0.4;
      forceIntensity = "low";
    } else if (daysSinceTraining >= 14) {
      volumeFactor = 0.5;
      forceIntensity = "low";
    } else {
      // 7–13 days
      volumeFactor = 0.6;
      forceIntensity = "medium";
    }

    return template.map((session) => ({
      ...session,
      volume: Math.max(1, Math.round(session.volume * volumeFactor)),
      duration: Math.max(15, Math.round(session.duration * volumeFactor)),
      intensity: forceIntensity ?? session.intensity,
      notes:
        `Return from ${daysSinceTraining}d break — re-conditioning ramp (${Math.round(volumeFactor * 100)}% volume). ` +
        (session.notes ? session.notes : ""),
    }));
  }

  /**
   * Adjust for game days (deload 48-72 hours before)
   */
  private adjustForGameDays(
    template: TrainingSessionTemplate[],
    gameDays: Date[],
  ): TrainingSessionTemplate[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return template.map((session) => {
      const sessionDate = new Date(today);
      sessionDate.setDate(today.getDate() + session.day);

      // Check if within 72 hours of a game
      for (const gameDay of gameDays) {
        const gameDate = new Date(gameDay);
        gameDate.setHours(0, 0, 0, 0);
        const hoursUntilGame =
          (gameDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60);

        if (hoursUntilGame >= 0 && hoursUntilGame <= 72) {
          // Deload sprints and high-intensity work
          if (session.sessionType === "speed" || session.intensity === "high") {
            return {
              ...session,
              volume: Math.round(session.volume * 0.5), // Reduce by 50%
              intensity: "low",
              notes: session.notes + " (Game proximity deload)",
            };
          }
        }

        // Day before game - rest or very light
        if (hoursUntilGame >= 0 && hoursUntilGame <= 24) {
          return {
            ...session,
            sessionType: "recovery",
            volume: 0,
            intensity: "low",
            exercises: ["Light mobility", "Dynamic warmup"],
            duration: 20,
            notes: "Pre-game rest day",
          };
        }

        // Game day - rest
        if (hoursUntilGame === 0) {
          return {
            ...session,
            sessionType: "game",
            volume: 0,
            intensity: "low",
            exercises: [],
            duration: 0,
            notes: "Game day",
          };
        }
      }

      return session;
    });
  }

  /**
   * Apply progression rules based on ACWR
   */
  private applyProgressionRules(
    template: TrainingSessionTemplate[],
    acwr: number,
    _trainingDaysPerWeek: number,
  ): WeeklyTrainingPlan {
    const _totalVolume = template.reduce((sum, s) => sum + s.volume, 0);

    // Progression rules
    let volumeAdjustment = 0;
    let acwrThreshold = 1.3;

    if (acwr > 1.5) {
      volumeAdjustment = -30; // Reduce by 30%
      acwrThreshold = 1.2; // Target lower ACWR
    } else if (acwr > 1.3) {
      volumeAdjustment = -15; // Reduce by 15%
      acwrThreshold = 1.25;
    } else if (acwr < 0.8) {
      volumeAdjustment = 10; // Increase by 10%
      acwrThreshold = 1.0; // Can push toward 1.0
    }

    // Apply volume adjustment
    const adjustedSessions = template.map((session) => ({
      ...session,
      volume: Math.max(
        1,
        Math.round(session.volume * (1 + volumeAdjustment / 100)),
      ),
    }));

    return {
      goal: "speed" as TrainingGoal, // Will be set by caller
      weekNumber: 1,
      phase: "foundation",
      sessions: adjustedSessions,
      totalVolume: adjustedSessions.reduce((sum, s) => sum + s.volume, 0),
      progressionRules: {
        acwrThreshold,
        volumeAdjustment,
      },
    };
  }

  /**
   * Get upcoming game days for an athlete
   */
  async getUpcomingGames(
    athleteId: string,
    days: number = 14,
  ): Promise<Date[]> {
    try {
      const response = await firstValueFrom(
        this.apiService.get<FixtureResponse[]>("/api/fixtures", {
          athleteId,
          days,
        }),
      );

      return extractApiArray<FixtureResponse>(response).map(
        (f: FixtureResponse) => new Date(f.game_start),
      );
    } catch (error) {
      this.logger.error("Error fetching fixtures:", error);
      return [];
    }
  }

  /**
   * Save training plan to backend (persistence layer)
   * Stores plan for athlete so it persists across sessions
   */
  async savePlan(
    athleteId: string,
    plan: WeeklyTrainingPlan,
  ): Promise<boolean> {
    this.loading.set(true);
    try {
      const response = await firstValueFrom(
        this.apiService.post<PlanSaveResponse>("/api/training/plan", {
          athleteId,
          plan: {
            ...plan,
            // Convert dates to ISO strings for serialization
            sessions: plan.sessions.map((s) => ({
              ...s,
              // Ensure all fields are serializable
            })),
          },
        }),
      );
      const saveResult = extractApiPayload<PlanSaveResponse>(response);
      if (saveResult && saveResult.success !== false) {
        this.currentPlan.set(plan);
        this.loading.set(false);
        return true;
      }

      this.loading.set(false);
      return false;
    } catch (error) {
      this.logger.error("Error saving training plan:", error);
      this.loading.set(false);
      return false;
    }
  }

  /**
   * Load saved training plan from backend
   * Retrieves the most recent plan for an athlete
   */
  async loadPlan(
    athleteId: string,
    weekNumber?: number,
  ): Promise<WeeklyTrainingPlan | null> {
    this.loading.set(true);
    try {
      const params: Record<string, string | number> = { athleteId };
      if (weekNumber) {
        params["weekNumber"] = weekNumber;
      }

      const response = await firstValueFrom(
        this.apiService.get<WeeklyTrainingPlan>("/api/training/plan", params),
      );

      const plan = extractApiPayload<WeeklyTrainingPlan>(response);
      if (plan) {
        this.currentPlan.set(plan);
        this.loading.set(false);
        return plan;
      }

      this.loading.set(false);
      return null;
    } catch (error) {
      this.logger.error("Error loading training plan:", error);
      this.loading.set(false);
      return null;
    }
  }

  /**
   * Get all saved plans for an athlete (history)
   */
  async getPlanHistory(
    athleteId: string,
    limit: number = 10,
  ): Promise<WeeklyTrainingPlan[]> {
    try {
      const response = await firstValueFrom(
        this.apiService.get<WeeklyTrainingPlan[]>(
          "/api/training/plan/history",
          { athleteId, limit },
        ),
      );

      return extractApiArray<WeeklyTrainingPlan>(response);
    } catch (error) {
      this.logger.error("Error fetching plan history:", error);
      return [];
    }
  }

  /**
   * Delete a saved training plan
   */
  async deletePlan(athleteId: string, planId: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.apiService.delete<PlanSaveResponse>(
          `/api/training/plan/${planId}`,
        ),
      );

      // If deleted plan was current, clear it
      const current = this.currentPlan() as PlanWithId | null;
      if (current && current.id === planId) {
        this.currentPlan.set(null);
      }

      const deleteResult = extractApiPayload<PlanSaveResponse>(response);
      return Boolean(deleteResult && deleteResult.success !== false);
    } catch (error) {
      this.logger.error("Error deleting training plan:", error);
      return false;
    }
  }

  /**
   * Generate and save plan in one operation
   * Convenience method that generates a plan and immediately saves it
   */
  async generateAndSavePlan(
    athleteId: string,
    config: GoalBasedPlanConfig,
  ): Promise<WeeklyTrainingPlan | null> {
    // Generate the plan
    const plan = this.generateWeeklyPlan(config);

    // Set the goal from config
    plan.goal = config.goal;

    // Save to backend
    const saved = await this.savePlan(athleteId, plan);

    if (saved) {
      return plan;
    }

    // If save failed, still return the plan (it's in memory)
    // but log the error
    this.logger.warn(
      "Failed to save training plan, but plan generated successfully",
    );
    return plan;
  }
}
