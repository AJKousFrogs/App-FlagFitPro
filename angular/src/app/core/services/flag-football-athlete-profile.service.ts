/**
 * Flag Football Athlete Profile Service
 *
 * EVIDENCE-BASED ATHLETIC PROFILE FOR ELITE FLAG FOOTBALL PLAYERS
 *
 * The Flag Football Athlete - A Unique Hybrid:
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ DURABILITY    → Like soccer players (60+ games/year)               │
 * │ STRENGTH      → Like basketball players (explosive power)          │
 * │ LEAN & JUMPY  → Like volleyball players (vertical leap)            │
 * │ SPEED         → Like sprinters (acceleration & top speed)          │
 * │ AGILITY       → Elite change of direction & sudden stops           │
 * │ BODY TYPE     → Lean muscles, NOT bulked                           │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * Research Base:
 * - Faude et al. (2012) - Injury epidemiology in soccer
 * - Ziv & Lidor (2009) - Physical attributes of basketball players
 * - Sheppard et al. (2008) - Volleyball jump performance
 * - Haugen et al. (2019) - Sprint performance in team sports
 * - Brughelli et al. (2008) - Change of direction ability
 * - Suchomel et al. (2016) - Relative strength importance
 *
 * Static data (types, position requirements, benchmarks) lives in:
 * flag-football-athlete-profile.data.ts
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import { Injectable, inject, signal } from "@angular/core";
import { SupabaseService } from "./supabase.service";
import { LoggerService } from "./logger.service";
import {
  POSITION_REQUIREMENTS,
  ELITE_COMPARISONS,
} from "./flag-football-athlete-profile.data";

// Re-export everything from data file so existing imports keep working
export * from "./flag-football-athlete-profile.data";

// Re-import types needed by the service class (after the re-export above)
import type {
  FlagFootballPosition,
  AthletePhysicalProfile,
  AthletePerformanceBenchmarks,
  AthleteAssessment,
  PositionRequirements,
  BenchmarkRange,
  TrainingRecommendation,
  SeasonalReadiness,
} from "./flag-football-athlete-profile.data";

@Injectable({
  providedIn: "root",
})
export class FlagFootballAthleteProfileService {
  private supabaseService = inject(SupabaseService);
  private logger = inject(LoggerService);

  // State
  private readonly _athleteProfile = signal<AthletePhysicalProfile | null>(
    null,
  );
  private readonly _benchmarks = signal<AthletePerformanceBenchmarks | null>(
    null,
  );
  private readonly _assessment = signal<AthleteAssessment | null>(null);

  // Public signals
  readonly athleteProfile = this._athleteProfile.asReadonly();
  readonly benchmarks = this._benchmarks.asReadonly();
  readonly assessment = this._assessment.asReadonly();

  /**
   * Get position requirements
   */
  getPositionRequirements(
    position: FlagFootballPosition,
  ): PositionRequirements {
    return POSITION_REQUIREMENTS[position];
  }

  /**
   * Get all position requirements
   */
  getAllPositionRequirements(): PositionRequirements[] {
    return Object.values(POSITION_REQUIREMENTS);
  }

  /**
   * Assess athlete against position benchmarks
   */
  assessAthlete(
    position: FlagFootballPosition,
    profile: AthletePhysicalProfile,
    benchmarks: AthletePerformanceBenchmarks,
  ): AthleteAssessment {
    const requirements = this.getPositionRequirements(position);
    const scores: Record<string, number> = {};
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const priorities: string[] = [];
    const injuryRisks: string[] = [];
    const recommendations: string[] = [];

    // Score each benchmark
    if (benchmarks.sprint10m) {
      scores["speed10m"] = this.scoreBenchmark(
        benchmarks.sprint10m,
        requirements.benchmarks.sprint10m,
      );
      if (scores["speed10m"] >= 80) strengths.push("Elite acceleration (10m)");
      if (scores["speed10m"] < 50) {
        weaknesses.push("10m sprint needs improvement");
        priorities.push("Acceleration training");
      }
    }

    if (benchmarks.sprint20m) {
      scores["speed20m"] = this.scoreBenchmark(
        benchmarks.sprint20m,
        requirements.benchmarks.sprint20m,
      );
      if (scores["speed20m"] >= 80) strengths.push("Excellent 20m speed");
      if (scores["speed20m"] < 50) weaknesses.push("20m sprint needs work");
    }

    if (benchmarks.verticalJump) {
      scores["power"] = this.scoreBenchmark(
        benchmarks.verticalJump,
        requirements.benchmarks.verticalJump,
      );
      if (scores["power"] >= 80) strengths.push("Elite vertical power");
      if (scores["power"] < 50) {
        weaknesses.push("Vertical jump below average");
        priorities.push("Plyometric training");
      }
    }

    if (benchmarks.proAgility505) {
      scores["agility"] = this.scoreBenchmark(
        benchmarks.proAgility505,
        requirements.benchmarks.proAgility505,
      );
      if (scores["agility"] >= 80) strengths.push("Elite change of direction");
      if (scores["agility"] < 50) {
        weaknesses.push("Agility needs improvement");
        priorities.push("COD and deceleration training");
      }
    }

    if (benchmarks.relativeSquat || profile.relativeStrength) {
      const relSquat =
        benchmarks.relativeSquat || profile.relativeStrength || 0;
      scores["strength"] = this.scoreBenchmark(
        relSquat,
        requirements.benchmarks.relativeSquat,
      );
      if (scores["strength"] >= 80) strengths.push("Elite relative strength");
      if (scores["strength"] < 50) {
        weaknesses.push("Relative strength below average");
        priorities.push("Strength training (focus on relative, not bulk)");
      }
    }

    if (profile.bodyFatPercentage) {
      scores["bodyComp"] = this.scoreBenchmark(
        profile.bodyFatPercentage,
        requirements.benchmarks.bodyFatPercentage,
      );
      if (scores["bodyComp"] >= 80) strengths.push("Optimal body composition");
      if (scores["bodyComp"] < 50) {
        weaknesses.push("Body composition needs attention");
        recommendations.push(
          "Focus on lean mass maintenance, reduce excess body fat",
        );
      }
    }

    // Calculate overall scores
    const speedScore =
      ((scores["speed10m"] || 50) + (scores["speed20m"] || 50)) / 2;
    const agilityScore = scores["agility"] || 50;
    const powerScore = scores["power"] || 50;
    const strengthScore = scores["strength"] || 50;
    const bodyCompositionScore = scores["bodyComp"] || 50;

    // Endurance estimation (if repeated sprint data available)
    let enduranceScore = 50;
    if (benchmarks.repeatedSprintDecrement !== undefined) {
      // Lower decrement is better
      if (benchmarks.repeatedSprintDecrement < 5) enduranceScore = 90;
      else if (benchmarks.repeatedSprintDecrement < 10) enduranceScore = 70;
      else if (benchmarks.repeatedSprintDecrement < 15) enduranceScore = 50;
      else enduranceScore = 30;
    }

    // Overall score (weighted)
    const overallScore = Math.round(
      speedScore * 0.25 +
        agilityScore * 0.25 +
        powerScore * 0.2 +
        strengthScore * 0.15 +
        enduranceScore * 0.1 +
        bodyCompositionScore * 0.05,
    );

    // Injury risk assessment
    if (scores["strength"] && scores["strength"] < 50) {
      injuryRisks.push(
        "Low relative strength increases injury risk (Suchomel et al. 2016)",
      );
    }
    if (benchmarks.relativeSquat && benchmarks.relativeSquat < 1.5) {
      injuryRisks.push(
        "Relative squat <1.5x BW associated with higher injury rates",
      );
    }
    if (profile.bodyFatPercentage && profile.bodyFatPercentage > 18) {
      injuryRisks.push(
        "Higher body fat may increase joint stress during cutting",
      );
    }

    // Generate recommendations
    if (priorities.length === 0) {
      recommendations.push(
        "Maintain current training - all benchmarks are solid",
      );
    } else {
      recommendations.push(`Priority focus areas: ${priorities.join(", ")}`);
    }

    requirements.preventionFocus.forEach((focus) => {
      recommendations.push(`Injury prevention: ${focus}`);
    });

    const assessment: AthleteAssessment = {
      overallScore,
      strengthScore: Math.round(strengthScore),
      speedScore: Math.round(speedScore),
      agilityScore: Math.round(agilityScore),
      powerScore: Math.round(powerScore),
      enduranceScore: Math.round(enduranceScore),
      bodyCompositionScore: Math.round(bodyCompositionScore),
      strengths,
      weaknesses,
      priorityTrainingAreas: priorities,
      injuryRiskFactors: injuryRisks,
      recommendations,
    };

    this._assessment.set(assessment);
    return assessment;
  }

  /**
   * Score a benchmark value against position standards
   */
  private scoreBenchmark(value: number, benchmark: BenchmarkRange): number {
    const { elite, good, average, needsWork, higherIsBetter } = benchmark;

    if (higherIsBetter) {
      if (value >= elite) return 100;
      if (value >= good) return 80 + ((value - good) / (elite - good)) * 20;
      if (value >= average)
        return 60 + ((value - average) / (good - average)) * 20;
      if (value >= needsWork)
        return 40 + ((value - needsWork) / (average - needsWork)) * 20;
      return Math.max(0, 40 * (value / needsWork));
    } else {
      // Lower is better (times)
      if (value <= elite) return 100;
      if (value <= good) return 80 + ((good - value) / (good - elite)) * 20;
      if (value <= average)
        return 60 + ((average - value) / (average - good)) * 20;
      if (value <= needsWork)
        return 40 + ((needsWork - value) / (needsWork - average)) * 20;
      return Math.max(0, 40 * (needsWork / value));
    }
  }

  /**
   * Get training recommendations based on assessment
   */
  getTrainingRecommendations(
    assessment: AthleteAssessment,
    position: FlagFootballPosition,
  ): TrainingRecommendation[] {
    const recommendations: TrainingRecommendation[] = [];
    const requirements = this.getPositionRequirements(position);

    // Speed recommendations
    if (assessment.speedScore < 60) {
      recommendations.push({
        area: "Speed Development",
        priority: assessment.speedScore < 40 ? "critical" : "high",
        currentLevel: this.getLevel(assessment.speedScore),
        targetLevel: "Good (70+)",
        exercises: [
          "10m acceleration sprints",
          "Resisted sprints (10-20% BW)",
          "Flying 20m sprints",
          "A-skips and B-skips",
        ],
        frequency: "2-3x per week",
        evidenceBase: "Haugen et al. 2019 - Sprint interval training",
      });
    }

    // Agility recommendations
    if (assessment.agilityScore < 60) {
      recommendations.push({
        area: "Agility & Change of Direction",
        priority: assessment.agilityScore < 40 ? "critical" : "high",
        currentLevel: this.getLevel(assessment.agilityScore),
        targetLevel: "Good (70+)",
        exercises: [
          "Pro agility (5-10-5) drills",
          "L-drill",
          "Reactive agility with visual cues",
          "Deceleration training",
        ],
        frequency: "2-3x per week",
        evidenceBase: "Brughelli et al. 2008 - Change of direction ability",
      });
    }

    // Power recommendations
    if (assessment.powerScore < 60) {
      recommendations.push({
        area: "Explosive Power",
        priority: assessment.powerScore < 40 ? "critical" : "high",
        currentLevel: this.getLevel(assessment.powerScore),
        targetLevel: "Good (70+)",
        exercises: [
          "Box jumps",
          "Depth jumps",
          "Broad jumps",
          "Single-leg bounds",
          "Medicine ball throws",
        ],
        frequency: "2x per week",
        evidenceBase: "Sheppard et al. 2008 - Volleyball jump performance",
      });
    }

    // Strength recommendations
    if (assessment.strengthScore < 60) {
      recommendations.push({
        area: "Relative Strength",
        priority: assessment.strengthScore < 40 ? "critical" : "high",
        currentLevel: this.getLevel(assessment.strengthScore),
        targetLevel: "Good (70+) - Target: 1.7x BW squat",
        exercises: [
          "Back squat (3-5 reps, 80-90% 1RM)",
          "Trap bar deadlift",
          "Bulgarian split squat",
          "Hip thrust",
          "Nordic curls (injury prevention)",
        ],
        frequency: "2-3x per week",
        evidenceBase: "Suchomel et al. 2016 - Importance of muscular strength",
      });
    }

    // Add injury prevention for all athletes
    recommendations.push({
      area: "Injury Prevention",
      priority: "high",
      currentLevel: "Ongoing",
      targetLevel: "Consistent implementation",
      exercises: requirements.preventionFocus,
      frequency: "Every training session",
      evidenceBase: "Position-specific injury prevention protocols",
    });

    return recommendations;
  }

  /**
   * Get level description from score
   */
  private getLevel(score: number): string {
    if (score >= 80) return "Elite";
    if (score >= 60) return "Good";
    if (score >= 40) return "Average";
    return "Needs Work";
  }

  /**
   * Calculate seasonal readiness
   */
  calculateSeasonalReadiness(
    assessment: AthleteAssessment,
    currentACWR: number,
    weeksOfTraining: number,
  ): SeasonalReadiness {
    // Base readiness on assessment scores
    const speedReadiness = assessment.speedScore;
    const strengthReadiness = assessment.strengthScore;

    // Durability based on strength, endurance, and training history
    const durabilityReadiness = Math.round(
      assessment.strengthScore * 0.4 +
        assessment.enduranceScore * 0.4 +
        Math.min(weeksOfTraining * 5, 100) * 0.2,
    );

    // Overall readiness
    const overallReadiness = Math.round(
      speedReadiness * 0.3 +
        strengthReadiness * 0.25 +
        assessment.agilityScore * 0.25 +
        durabilityReadiness * 0.2,
    );

    // Injury risk based on ACWR and strength
    let injuryRisk: "low" | "moderate" | "high" = "moderate";
    if (
      currentACWR >= 0.8 &&
      currentACWR <= 1.3 &&
      assessment.strengthScore >= 60
    ) {
      injuryRisk = "low";
    } else if (currentACWR > 1.5 || assessment.strengthScore < 40) {
      injuryRisk = "high";
    }

    // Games per week capacity
    let gamesPerWeekCapacity = 2;
    if (overallReadiness >= 80 && durabilityReadiness >= 70) {
      gamesPerWeekCapacity = 4;
    } else if (overallReadiness >= 60 && durabilityReadiness >= 50) {
      gamesPerWeekCapacity = 3;
    }

    const recommendations: string[] = [];
    if (overallReadiness < 60) {
      recommendations.push("Build base fitness before increasing game load");
    }
    if (durabilityReadiness < 50) {
      recommendations.push(
        "Focus on durability training - strength and endurance",
      );
    }
    if (injuryRisk === "high") {
      recommendations.push("Reduce training load and focus on recovery");
    }
    if (currentACWR > 1.3) {
      recommendations.push("ACWR elevated - manage weekly load increases");
    }

    return {
      overallReadiness,
      speedReadiness,
      strengthReadiness,
      durabilityReadiness,
      injuryRisk,
      recommendations,
      gamesPerWeekCapacity,
    };
  }

  /**
   * Get elite comparison data
   */
  getEliteComparisons() {
    return ELITE_COMPARISONS;
  }

  /**
   * Get flag football specific athletic profile description
   */
  getFlagFootballAthleteDescription(): string {
    return `
    THE FLAG FOOTBALL ATHLETE - A UNIQUE HYBRID

    Flag football demands a combination of athletic qualities rarely seen in any single sport:

    🏃 DURABILITY (Like Soccer Players)
    - 60+ games per year at elite level
    - 35+ sprints per game
    - Ability to recover and perform repeatedly
    - Reference: Faude et al. 2012 - Soccer injury epidemiology

    💪 STRENGTH (Like Basketball Players)
    - Explosive power for cutting and jumping
    - Relative strength (strength/bodyweight) is key
    - NOT bulk - lean, functional muscle
    - Reference: Ziv & Lidor 2009 - Basketball physical attributes

    🦘 LEAN & JUMPY (Like Volleyball Players)
    - High vertical leap for contested catches
    - Reactive strength for quick direction changes
    - Ability to absorb landing forces repeatedly
    - Reference: Sheppard et al. 2008 - Volleyball jump performance

    ⚡ SPEED (Like Sprinters)
    - Elite acceleration (0-10m) - most critical
    - Good top-end speed for breakaway plays
    - Efficient sprint mechanics
    - Reference: Haugen et al. 2019 - Sprint performance

    🔄 AGILITY (Elite Change of Direction)
    - Rapid deceleration and re-acceleration
    - Multi-directional movement
    - Reactive agility (unplanned movements)
    - Reference: Brughelli et al. 2008 - COD ability

    🛑 SUDDEN STOPS (Critical for Injury Prevention)
    - Eccentric strength for deceleration
    - Landing mechanics
    - Knee and ankle stability
    - Reference: Comfort et al. 2014 - Eccentric strength

    BODY TYPE: Lean muscles, NOT bulked
    GOAL: Prepared to play 60 games per year at the highest level
    `;
  }
}
