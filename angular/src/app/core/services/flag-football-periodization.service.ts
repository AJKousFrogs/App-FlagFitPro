/**
 * Flag Football Periodization Service
 *
 * Service layer for evidence-based annual periodization.
 * Static data (phase configurations, evidence base) lives in
 * flag-football-periodization.data.ts.
 */
import { Injectable, inject, signal, computed } from "@angular/core";
import { SupabaseService } from "./supabase.service";
import { LoggerService } from "./logger.service";
import {
  ANNUAL_PHASES,
  EVIDENCE_BASE,
  type DailyTrainingTemplate,
  type EvidenceReference,
  type ExerciseCategory,
  type ExerciseTemplate,
  type PhaseConfig,
  type SeasonalRecommendation,
  type TrainingFocus,
  type TrainingPhaseType,
  type WeeklyTotals,
  type WeeklyTrainingTemplate,
} from "./flag-football-periodization.data";

export * from "./flag-football-periodization.data";

// ============================================================================
// SERVICE
// ============================================================================
@Injectable({
  providedIn: "root",
})
export class FlagFootballPeriodizationService {
  private supabaseService = inject(SupabaseService);
  private logger = inject(LoggerService);

  // Current phase
  private readonly _currentPhase = signal<PhaseConfig | null>(null);
  private readonly _currentWeek = signal<number>(1);
  private readonly _weeklyTemplate = signal<WeeklyTrainingTemplate | null>(
    null,
  );

  // Public signals
  readonly currentPhase = this._currentPhase.asReadonly();
  readonly currentWeek = this._currentWeek.asReadonly();
  readonly weeklyTemplate = this._weeklyTemplate.asReadonly();

  // Computed
  readonly phaseName = computed(() => this._currentPhase()?.name || "Unknown");
  readonly phaseType = computed(
    () => this._currentPhase()?.type || "foundation",
  );

  /**
   * Get phase configuration for a given date
   */
  getPhaseForDate(date: Date = new Date()): PhaseConfig {
    const month = date.getMonth() + 1; // 1-12

    switch (month) {
      case 11: // November
        return ANNUAL_PHASES["november_recovery"];
      case 12: // December
        return ANNUAL_PHASES["december_foundation"];
      case 1: // January
        return ANNUAL_PHASES["january_strength"];
      case 2: // February
        return ANNUAL_PHASES["february_power"];
      case 3: // March
        return ANNUAL_PHASES["march_explosive"];
      case 4: // April
      case 5: // May
      case 6: // June
        return ANNUAL_PHASES["competition_maintenance"];
      case 7: // July - MID-SEASON RELOAD
        return ANNUAL_PHASES["july_reload"];
      case 8: // August
        return ANNUAL_PHASES["august_peak"];
      case 9: // September
      case 10: // October
        return ANNUAL_PHASES["late_season"];
      default:
        return ANNUAL_PHASES["december_foundation"];
    }
  }

  /**
   * Get current week number within the phase
   */
  getWeekInPhase(date: Date = new Date()): number {
    const dayOfMonth = date.getDate();
    return Math.ceil(dayOfMonth / 7);
  }

  /**
   * Get seasonal recommendation for an athlete
   */
  getSeasonalRecommendation(date: Date = new Date()): SeasonalRecommendation {
    const phase = this.getPhaseForDate(date);
    const weekNum = this.getWeekInPhase(date);

    this._currentPhase.set(phase);
    this._currentWeek.set(weekNum);

    // Get next phase preview
    const nextMonth = new Date(date);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextPhase = this.getPhaseForDate(nextMonth);

    // Generate weekly template
    const weeklyTemplate = this.generateWeeklyTemplate(phase, weekNum);
    this._weeklyTemplate.set(weeklyTemplate);

    return {
      currentPhase: phase,
      currentWeek: weekNum,
      weeklyTemplate,
      nextPhasePreview: nextPhase.type !== phase.type ? nextPhase : null,
      personalizedAdjustments: this.getPersonalizedAdjustments(phase),
      injuryPreventionProtocol: phase.injuryPreventionFocus,
      nutritionGuidelines: this.getNutritionGuidelines(phase),
    };
  }

  /**
   * Generate weekly training template
   */
  private generateWeeklyTemplate(
    phase: PhaseConfig,
    weekNum: number,
  ): WeeklyTrainingTemplate {
    const days: DailyTrainingTemplate[] = [];

    // Monday - Primary Training Day
    days.push({
      dayOfWeek: 1,
      dayName: "Monday",
      sessionType: "training",
      primaryFocus: phase.primaryFocus[0],
      secondaryFocus: phase.secondaryFocus[0],
      exercises: this.generateExercisesForFocus(phase, phase.primaryFocus[0]),
      estimatedDuration: 75,
      targetRPE: 7,
      notes: `Week ${weekNum} - ${phase.name}`,
    });

    // Tuesday - Speed/Agility
    days.push({
      dayOfWeek: 2,
      dayName: "Tuesday",
      sessionType: "training",
      primaryFocus: "speed",
      secondaryFocus: "agility",
      exercises: this.generateSpeedSession(phase),
      estimatedDuration: 60,
      targetRPE: 8,
      notes: "Speed and agility focus",
    });

    // Wednesday - Recovery or Light
    days.push({
      dayOfWeek: 3,
      dayName: "Wednesday",
      sessionType: phase.recoveryPriority === "high" ? "recovery" : "training",
      primaryFocus: "recovery",
      secondaryFocus: "mobility",
      exercises: this.generateRecoverySession(),
      estimatedDuration: 30,
      targetRPE: 4,
      notes: "Active recovery and mobility",
    });

    // Thursday - Strength/Power
    days.push({
      dayOfWeek: 4,
      dayName: "Thursday",
      sessionType: "training",
      primaryFocus: phase.primaryFocus.includes("power")
        ? "power"
        : "maximal_strength",
      exercises: this.generateStrengthSession(phase),
      estimatedDuration: 60,
      targetRPE: 7,
      notes: "Strength/power maintenance",
    });

    // Friday - Sport Specific
    days.push({
      dayOfWeek: 5,
      dayName: "Friday",
      sessionType: "training",
      primaryFocus: "agility",
      secondaryFocus: "plyometrics",
      exercises: this.generateSportSpecificSession(phase),
      estimatedDuration: 45,
      targetRPE: 6,
      notes: "Sport-specific preparation",
    });

    // Saturday - Game Day or Training
    days.push({
      dayOfWeek: 6,
      dayName: "Saturday",
      sessionType: phase.type === "in_season_maintenance" ? "game" : "training",
      primaryFocus: "speed",
      exercises: [],
      estimatedDuration: phase.type === "in_season_maintenance" ? 90 : 45,
      targetRPE: phase.type === "in_season_maintenance" ? 9 : 6,
      notes:
        phase.type === "in_season_maintenance"
          ? "Game Day"
          : "Optional session",
    });

    // Sunday - Rest
    days.push({
      dayOfWeek: 0,
      dayName: "Sunday",
      sessionType: "rest",
      primaryFocus: "recovery",
      exercises: [],
      estimatedDuration: 0,
      targetRPE: 1,
      notes: "Complete rest",
    });

    // Calculate weekly totals
    const weeklyTotals: WeeklyTotals = {
      totalSprints: phase.sprintVolume.maxSprintsPerWeek,
      totalCuts: phase.agilityConfig.maxCutsPerWeek,
      totalPlyoContacts: phase.plyometricConfig.maxContactsPerWeek,
      totalStrengthSets: phase.strengthConfig.setsPerExercise[1] * 6, // Approximate
      estimatedLoad: Math.round(
        phase.volumeMultiplier * phase.intensityMultiplier * 1000,
      ),
      trainingDays: days.filter((d) => d.sessionType === "training").length,
      restDays: days.filter(
        (d) => d.sessionType === "rest" || d.sessionType === "recovery",
      ).length,
    };

    return {
      weekNumber: weekNum,
      phase: phase.type,
      days,
      weeklyTotals,
      recommendations: this.getWeeklyRecommendations(phase, weekNum),
      warnings: this.getWeeklyWarnings(phase),
    };
  }

  /**
   * Generate exercises for a specific focus
   */
  private generateExercisesForFocus(
    phase: PhaseConfig,
    focus: TrainingFocus,
  ): ExerciseTemplate[] {
    const exercises: ExerciseTemplate[] = [];

    switch (focus) {
      case "maximal_strength":
        exercises.push(
          {
            name: "Trap Bar Deadlift",
            category: "strength",
            sets: phase.strengthConfig.setsPerExercise[1],
            reps: phase.strengthConfig.repsPerSet[0],
            intensity: phase.strengthConfig.intensityRange[1],
            rest: phase.strengthConfig.restPeriodSeconds[1],
            notes: "Focus on explosive concentric",
            evidenceBase: "Suchomel et al. 2016",
          },
          {
            name: "Back Squat",
            category: "strength",
            sets: phase.strengthConfig.setsPerExercise[0],
            reps: phase.strengthConfig.repsPerSet[0],
            intensity: phase.strengthConfig.intensityRange[0],
            rest: phase.strengthConfig.restPeriodSeconds[0],
            notes: "Full depth, controlled descent",
          },
          {
            name: "Nordic Hamstring Curl",
            category: "strength",
            sets: 3,
            reps: 6,
            rest: 90,
            notes: "Eccentric focus - injury prevention",
            evidenceBase: "Comfort et al. 2014",
          },
        );
        break;

      case "power":
        exercises.push(
          {
            name: "Hang Power Clean",
            category: "power",
            sets: 4,
            reps: 3,
            intensity: 75,
            rest: 180,
            notes: "Explosive triple extension",
            evidenceBase: "Suchomel et al. 2016",
          },
          {
            name: "Jump Squat",
            category: "power",
            sets: 3,
            reps: 5,
            intensity: 30,
            rest: 120,
            notes: "Maximum height, soft landing",
          },
          {
            name: "Medicine Ball Rotational Throw",
            category: "power",
            sets: 3,
            reps: 8,
            rest: 60,
            notes: "Sport-specific power transfer",
          },
        );
        break;

      case "speed":
        exercises.push(
          {
            name: "10m Acceleration Sprint",
            category: "sprint",
            sets: 4,
            reps: 3,
            rest: 90,
            notes: "Full recovery between reps",
            evidenceBase: "Haugen et al. 2019",
          },
          {
            name: "20m Sprint",
            category: "sprint",
            sets: 3,
            reps: 3,
            rest: 120,
            notes: "Focus on acceleration mechanics",
          },
          {
            name: "Flying 20m Sprint",
            category: "sprint",
            sets: 2,
            reps: 3,
            rest: 180,
            notes: "Maximum velocity work",
            evidenceBase: "Haugen et al. 2019",
          },
        );
        break;

      case "agility":
        exercises.push(
          {
            name: "Pro Agility (5-10-5)",
            category: "change_of_direction",
            sets: 4,
            reps: 3,
            rest: 60,
            notes: "Sharp cuts, low center of gravity",
            evidenceBase: "Brughelli et al. 2008",
          },
          {
            name: "L-Drill",
            category: "change_of_direction",
            sets: 3,
            reps: 4,
            rest: 45,
            notes: "Focus on deceleration before cuts",
          },
          {
            name: "Reactive Cone Drill",
            category: "change_of_direction",
            sets: 3,
            reps: 4,
            rest: 45,
            notes: "Coach calls direction",
            evidenceBase: "Asadi et al. 2017",
          },
        );
        break;

      default:
        // Generic exercises
        exercises.push({
          name: "Dynamic Warmup",
          category: "mobility",
          sets: 1,
          reps: "10 min",
          rest: 0,
          notes: "Full body activation",
        });
    }

    return exercises;
  }

  /**
   * Generate speed session
   */
  private generateSpeedSession(phase: PhaseConfig): ExerciseTemplate[] {
    return [
      {
        name: "Dynamic Warmup",
        category: "mobility",
        sets: 1,
        reps: "10 min",
        rest: 0,
      },
      {
        name: "A-Skips",
        category: "sprint",
        sets: 3,
        reps: "20m",
        rest: 30,
      },
      {
        name: "10m Acceleration",
        category: "sprint",
        sets: 4,
        reps: 3,
        rest: 90,
        evidenceBase: "Haugen et al. 2019",
      },
      {
        name: "20m Sprint",
        category: "sprint",
        sets: 3,
        reps: 3,
        rest: 120,
      },
      ...(phase.sprintVolume.maxVelocityWork
        ? [
            {
              name: "Flying 30m",
              category: "sprint" as ExerciseCategory,
              sets: 2,
              reps: 2,
              rest: 180,
              notes: "Maximum velocity",
            },
          ]
        : []),
    ];
  }

  /**
   * Generate strength session
   */
  private generateStrengthSession(phase: PhaseConfig): ExerciseTemplate[] {
    return [
      {
        name: "Trap Bar Deadlift",
        category: "strength",
        sets: phase.strengthConfig.setsPerExercise[0],
        reps: phase.strengthConfig.repsPerSet[0],
        intensity: phase.strengthConfig.intensityRange[0],
        rest: phase.strengthConfig.restPeriodSeconds[0],
      },
      {
        name: "Bulgarian Split Squat",
        category: "strength",
        sets: 3,
        reps: 6,
        rest: 90,
        notes: "Each leg",
      },
      {
        name: "Hip Thrust",
        category: "strength",
        sets: 3,
        reps: 8,
        rest: 90,
      },
      {
        name: "Nordic Curl",
        category: "strength",
        sets: 3,
        reps: 6,
        rest: 90,
        notes: "Eccentric focus",
        evidenceBase: "Comfort et al. 2014",
      },
      {
        name: "Pallof Press",
        category: "core",
        sets: 3,
        reps: 10,
        rest: 60,
        notes: "Anti-rotation",
      },
    ];
  }

  /**
   * Generate sport-specific session
   */
  private generateSportSpecificSession(
    _phase: PhaseConfig,
  ): ExerciseTemplate[] {
    return [
      {
        name: "Reactive Agility Drill",
        category: "change_of_direction",
        sets: 4,
        reps: 4,
        rest: 45,
        notes: "React to visual cue",
        evidenceBase: "Asadi et al. 2017",
      },
      {
        name: "Lateral Bounds",
        category: "plyometric",
        sets: 3,
        reps: 6,
        rest: 60,
        notes: "Stick landing",
      },
      {
        name: "Deceleration Drill",
        category: "change_of_direction",
        sets: 3,
        reps: 5,
        rest: 45,
        notes: "Sprint to stop",
        evidenceBase: "Brughelli et al. 2008",
      },
      {
        name: "Route Running Simulation",
        category: "sport_specific",
        sets: 4,
        reps: 4,
        rest: 30,
        notes: "Position-specific",
      },
    ];
  }

  /**
   * Generate recovery session
   */
  private generateRecoverySession(): ExerciseTemplate[] {
    return [
      {
        name: "Foam Rolling",
        category: "mobility",
        sets: 1,
        reps: "10 min",
        rest: 0,
        notes: "Full body",
      },
      {
        name: "Hip Mobility Circuit",
        category: "mobility",
        sets: 2,
        reps: "5 min",
        rest: 0,
      },
      {
        name: "Light Cycling or Walking",
        category: "conditioning",
        sets: 1,
        reps: "15 min",
        rest: 0,
        notes: "Zone 1 heart rate",
      },
    ];
  }

  /**
   * Get personalized adjustments
   */
  private getPersonalizedAdjustments(phase: PhaseConfig): string[] {
    const adjustments: string[] = [];

    if (phase.type === "mid_season_reload") {
      adjustments.push(
        "🔄 July is your 'reload' month - build extra sprint base for second half of season",
        "💪 Address any minor injuries accumulated during competition",
        "🏃 Increase sprint volume to build durability reserve",
        "😴 Prioritize sleep and recovery while training volume is higher",
      );
    }

    if (phase.type === "peak") {
      adjustments.push(
        "🎯 Reduce volume 40-60% but maintain intensity",
        "⚡ Focus on sharpness and explosiveness",
        "🧠 Mental preparation is key",
        "💤 Sleep 9+ hours per night",
      );
    }

    if (phase.type === "in_season_maintenance") {
      adjustments.push(
        "⚖️ Balance training load with game demands",
        "🔧 Minimum 2x/week strength to maintain adaptations",
        "📊 Monitor ACWR weekly - stay in 0.8-1.3 range",
        "🏥 Address injuries immediately",
      );
    }

    return adjustments;
  }

  /**
   * Get nutrition guidelines for phase
   */
  private getNutritionGuidelines(phase: PhaseConfig): string[] {
    const guidelines: string[] = [];

    if (phase.volumeMultiplier > 0.8) {
      guidelines.push(
        "🍚 Higher carbohydrate intake to fuel training volume",
        "🥩 Protein: 1.6-2.2g/kg body weight for recovery",
        "💧 Hydration: 3-4L water daily minimum",
      );
    } else {
      guidelines.push(
        "🥗 Moderate carbohydrate - match to training demands",
        "🥩 Protein: 1.4-1.8g/kg body weight",
        "💧 Hydration: 2.5-3L water daily",
      );
    }

    if (phase.type === "peak" || phase.type === "taper") {
      guidelines.push(
        "🍝 Carb loading 2-3 days before competition",
        "🚫 Avoid new foods before competition",
        "☕ Caffeine strategy for game day",
      );
    }

    return guidelines;
  }

  /**
   * Get weekly recommendations
   */
  private getWeeklyRecommendations(
    phase: PhaseConfig,
    weekNum: number,
  ): string[] {
    const recs: string[] = [];

    if (weekNum === 4) {
      recs.push("📉 Consider a deload week if fatigue is accumulating");
    }

    if (phase.recoveryPriority === "high") {
      recs.push("😴 Prioritize 8+ hours of sleep this phase");
    }

    phase.evidenceBase.forEach((ref) => {
      recs.push(`📚 ${ref.applicationToFlagFootball}`);
    });

    return recs;
  }

  /**
   * Get weekly warnings
   */
  private getWeeklyWarnings(phase: PhaseConfig): string[] {
    const warnings: string[] = [];

    if (phase.plyometricConfig.intensityLevel === "very_high") {
      warnings.push("⚠️ High plyometric intensity - ensure adequate recovery");
    }

    if (phase.sprintVolume.maxSprintsPerWeek > 30) {
      warnings.push("⚠️ High sprint volume - monitor hamstring fatigue");
    }

    return warnings;
  }

  /**
   * Get all evidence references
   */
  getAllEvidenceReferences(): EvidenceReference[] {
    return Object.values(EVIDENCE_BASE);
  }

  /**
   * Get phase by type
   */
  getPhaseByType(type: TrainingPhaseType): PhaseConfig | undefined {
    return Object.values(ANNUAL_PHASES).find((p) => p.type === type);
  }

  /**
   * Get all phases
   */
  getAllPhases(): PhaseConfig[] {
    return Object.values(ANNUAL_PHASES);
  }
}
