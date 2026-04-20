import { Injectable } from "@angular/core";
import {
  FLAG_FOOTBALL_PERFORMANCE_SYSTEM,
  type GameWeekType,
  type InjuryProtocol,
  type InjuryRegion,
  type LaPrimaFitProduct,
  type MentalRoutine,
  type NutritionProtocol,
  type PerformanceBaseline,
  type RecoveryProtocol,
  type SupplementStrategy,
} from "./flag-football-performance-system.data";

export interface TournamentContext {
  name?: string;
  startDate: Date;
  endDate?: Date;
  gamesExpected?: number;
  isInternational?: boolean;
  isPeakEvent?: boolean;
  hasBackToBackGames?: boolean;
}

export interface PerformanceSystemInput {
  currentAcwr: number;
  readinessLevel: "low" | "moderate" | "high";
  gameDays?: Date[];
  gameWeekType?: GameWeekType;
  teamPracticesPerWeek?: number;
  tournaments?: TournamentContext[];
  competitionDate?: Date;
  bodyMassKg?: number;
  caffeineSensitive?: boolean;
  currentDate?: Date;
}

export interface NutritionTimingStep {
  timing: string;
  target: string;
  examples: string[];
  productNames: string[];
}

export interface PerformanceSystemRecommendation {
  weekType: GameWeekType;
  densityLabel: string;
  teamPracticeCount: number;
  individualSessionCap: number;
  highIntensityCap: number;
  volumeMultiplier: number;
  fixedTeamPracticeLoadAu: number;
  competitionLoadAu: number;
  maxAdditionalIndividualLoadAu: number;
  targetAcwrCeiling: number;
  neuralExposure: string;
  strengthDose: string;
  recoveryDose: string;
  sessionPriorities: string[];
  injuryPreventionMicrodose: string[];
  competitionWeekTaper: string[];
  recoveryProtocol: RecoveryProtocol;
  performanceBaselines: PerformanceBaseline[];
  nutritionTimeline: NutritionTimingStep[];
  nutritionProducts: LaPrimaFitProduct[];
  supplementPlan: SupplementStrategy[];
  mentalRoutine: MentalRoutine;
  injuryProtocols: InjuryProtocol[];
  warnings: string[];
  evidenceIds: string[];
}

@Injectable({
  providedIn: "root",
})
export class FlagFootballPerformanceSystemService {
  readonly system = FLAG_FOOTBALL_PERFORMANCE_SYSTEM;

  buildRecommendation(
    input: PerformanceSystemInput,
  ): PerformanceSystemRecommendation {
    const weekType =
      input.gameWeekType ??
      this.inferGameWeekType(
        input.gameDays ?? [],
        input.tournaments ?? [],
        input.currentDate ?? new Date(),
      );
    const gameRule = this.system.gameWeekRules[weekType];
    const teamPracticeCount = this.normalizePracticeCount(
      input.teamPracticesPerWeek,
    );
    const practiceRule = this.system.teamPracticeAdjustments[teamPracticeCount];

    let volumeMultiplier =
      gameRule.volumeMultiplier * practiceRule.volumeMultiplier;
    let individualSessionCap = Math.min(
      gameRule.individualSessionCap,
      practiceRule.individualSessionCap,
    );
    let highIntensityCap = Math.min(
      gameRule.highIntensityCap,
      practiceRule.highIntensityCap,
    );
    const warnings = [...gameRule.notes, ...practiceRule.notes];
    let targetAcwrCeiling = this.getTargetAcwrCeiling(weekType);

    if (input.currentAcwr > 1.5) {
      volumeMultiplier *= 0.5;
      individualSessionCap = Math.min(individualSessionCap, 1);
      highIntensityCap = 0;
      targetAcwrCeiling = Math.min(targetAcwrCeiling, 1.2);
      warnings.push(
        "ACWR is in the danger zone; prioritize recovery, tissue capacity, and coach review.",
      );
    } else if (input.currentAcwr > 1.3) {
      volumeMultiplier *= 0.75;
      individualSessionCap = Math.min(individualSessionCap, 1);
      highIntensityCap = Math.min(highIntensityCap, 1);
      targetAcwrCeiling = Math.min(targetAcwrCeiling, 1.25);
      warnings.push(
        "ACWR is elevated; reduce extra individual volume and keep speed exposure short.",
      );
    } else if (input.currentAcwr < 0.8 && weekType === "training-week") {
      volumeMultiplier *= 1.05;
      targetAcwrCeiling = 1.0;
      warnings.push(
        "ACWR is low; build chronic load gradually without adding junk conditioning.",
      );
    }

    if (input.readinessLevel === "low") {
      volumeMultiplier *= 0.7;
      individualSessionCap = Math.min(individualSessionCap, 1);
      highIntensityCap = 0;
      warnings.push(
        "Readiness is low; convert nonessential work to recovery or technical walk-through.",
      );
    } else if (input.readinessLevel === "high" && weekType === "training-week") {
      volumeMultiplier *= 1.05;
    }

    const fixedTeamPracticeLoadAu = practiceRule.estimatedPracticeLoadAu;
    const competitionLoadAu = gameRule.competitionLoadAu;
    const maxAdditionalIndividualLoadAu = Math.round(
      950 * volumeMultiplier * Math.max(individualSessionCap, 1) / 3,
    );

    return {
      weekType,
      densityLabel: gameRule.label,
      teamPracticeCount,
      individualSessionCap,
      highIntensityCap,
      volumeMultiplier: this.round(volumeMultiplier),
      fixedTeamPracticeLoadAu,
      competitionLoadAu,
      maxAdditionalIndividualLoadAu,
      targetAcwrCeiling,
      neuralExposure: gameRule.neuralExposure,
      strengthDose: gameRule.strengthDose,
      recoveryDose: gameRule.recoveryDose,
      sessionPriorities: this.getSessionPriorities(weekType, teamPracticeCount),
      injuryPreventionMicrodose: this.getInjuryPreventionMicrodose(weekType),
      competitionWeekTaper: this.getCompetitionTaper(weekType, gameRule.taperDays),
      recoveryProtocol: this.getRecoveryProtocol(weekType),
      performanceBaselines: this.getPerformanceBaselines(weekType),
      nutritionTimeline: this.buildNutritionTimeline(input, weekType),
      nutritionProducts: this.getRecommendedProducts(weekType, input),
      supplementPlan: this.getSupplementPlan(weekType, input),
      mentalRoutine: this.system.mental,
      injuryProtocols: [
        this.system.injuryProtocols.hamstring,
        this.system.injuryProtocols.soleus,
        this.system.injuryProtocols.quadriceps,
        this.system.injuryProtocols.achilles,
      ],
      warnings,
      evidenceIds: this.collectEvidenceIds(weekType),
    };
  }

  getNutritionProtocol(): NutritionProtocol {
    return this.system.nutrition;
  }

  getInjuryProtocol(region: InjuryRegion): InjuryProtocol {
    return this.system.injuryProtocols[region];
  }

  private inferGameWeekType(
    gameDays: Date[],
    tournaments: TournamentContext[],
    currentDate: Date,
  ): GameWeekType {
    const upcomingTournament = tournaments.find((tournament) =>
      this.isWithinDays(currentDate, tournament.startDate, 14),
    );

    if (upcomingTournament?.isInternational || upcomingTournament?.isPeakEvent) {
      return "international-tournament";
    }

    if (
      upcomingTournament &&
      ((upcomingTournament.gamesExpected ?? 0) >= 3 ||
        upcomingTournament.hasBackToBackGames)
    ) {
      return "tournament";
    }

    const gamesThisWeek = gameDays.filter((gameDay) =>
      this.isWithinDays(currentDate, gameDay, 7),
    );

    if (gamesThisWeek.length >= 3) {
      return "tournament";
    }

    if (
      gamesThisWeek.length >= 2 ||
      this.hasSameDayGames(gamesThisWeek) ||
      this.hasBackToBackGames(gamesThisWeek)
    ) {
      return "doubleheader";
    }

    if (gamesThisWeek.length === 1) {
      return "single-game";
    }

    return "training-week";
  }

  private normalizePracticeCount(count: number | undefined): number {
    if (count === undefined || Number.isNaN(count)) {
      return 0;
    }

    return Math.max(0, Math.min(4, Math.round(count)));
  }

  private hasSameDayGames(gameDays: Date[]): boolean {
    const uniqueDays = new Set(
      gameDays.map((gameDay) => gameDay.toISOString().split("T")[0]),
    );
    return uniqueDays.size < gameDays.length;
  }

  private hasBackToBackGames(gameDays: Date[]): boolean {
    const sorted = [...gameDays].sort((a, b) => a.getTime() - b.getTime());

    for (let index = 1; index < sorted.length; index++) {
      const hours =
        (sorted[index].getTime() - sorted[index - 1].getTime()) /
        (1000 * 60 * 60);
      if (hours <= 24) {
        return true;
      }
    }

    return false;
  }

  private isWithinDays(from: Date, target: Date, days: number): boolean {
    const start = new Date(from);
    start.setHours(0, 0, 0, 0);
    const end = new Date(target);
    end.setHours(0, 0, 0, 0);
    const diffDays = Math.round(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
    return diffDays >= 0 && diffDays <= days;
  }

  private getTargetAcwrCeiling(weekType: GameWeekType): number {
    if (weekType === "training-week") return 1.3;
    if (weekType === "single-game") return 1.25;
    return 1.2;
  }

  private getSessionPriorities(
    weekType: GameWeekType,
    teamPractices: number,
  ): string[] {
    if (weekType === "training-week" && teamPractices <= 1) {
      return [
        "speed and acceleration quality",
        "relative strength",
        "COD/deceleration mechanics",
        "safe hands under controlled fatigue",
      ];
    }

    if (weekType === "single-game") {
      return [
        "speed primer",
        "strength maintenance",
        "safe hands and route timing",
        "recovery",
      ];
    }

    return [
      "freshness",
      "tissue capacity microdose",
      "hands and tactical sharpness",
      "between-game recovery",
    ];
  }

  private getInjuryPreventionMicrodose(weekType: GameWeekType): string[] {
    const base = [
      "Nordic hamstring or long-lever bridge: 2 low-volume sets",
      "Seated soleus raise or bent-knee calf isometric: 3 sets",
      "Spanish squat or split-squat eccentric: 2 to 3 sets",
      "Ankle pogos only if Achilles and soleus stiffness are stable",
    ];

    if (weekType === "tournament" || weekType === "international-tournament") {
      return [
        "Bent-knee calf isometric: 3 x 30 seconds",
        "Long-lever hamstring bridge: 2 x 20 seconds",
        "Hip airplanes or controlled single-leg RDL: 2 x 4 each side",
        "No new eccentric soreness stimulus inside 72 hours of first game",
      ];
    }

    return base;
  }

  private getCompetitionTaper(
    weekType: GameWeekType,
    taperDays: number,
  ): string[] {
    if (taperDays === 0) {
      return ["No taper required; build chronic load with high-quality work."];
    }

    const base = [
      `Start taper ${taperDays} days before the key game block.`,
      "Cut volume first; preserve short, fast intent.",
      "Remove fatigue finishers, high-contact plyometrics, and new exercises.",
    ];

    if (weekType === "international-tournament") {
      base.push(
        "Plan travel hydration, sleep timing, and arrival mobility as part of the taper.",
      );
    }

    return base;
  }

  private getRecoveryProtocol(weekType: GameWeekType): RecoveryProtocol {
    if (weekType === "international-tournament") {
      return this.findRecoveryProtocol("international-tournament");
    }
    if (weekType === "tournament") {
      return this.findRecoveryProtocol("tournament");
    }
    if (weekType === "doubleheader") {
      return this.findRecoveryProtocol("back-to-back");
    }
    if (weekType === "single-game") {
      return this.findRecoveryProtocol("post-game");
    }

    return this.findRecoveryProtocol("daily");
  }

  private getPerformanceBaselines(
    weekType: GameWeekType,
  ): PerformanceBaseline[] {
    if (
      weekType === "tournament" ||
      weekType === "international-tournament"
    ) {
      return this.system.baselines;
    }

    return this.system.baselines.filter((baseline) =>
      baseline.cadence === "daily" ||
      baseline.cadence === "weekly" ||
      baseline.cadence === "monthly",
    );
  }

  private findRecoveryProtocol(
    scenario: RecoveryProtocol["scenario"],
  ): RecoveryProtocol {
    return (
      this.system.recoveryProtocols.find(
        (protocol) => protocol.scenario === scenario,
      ) ?? this.system.recoveryProtocols[0]
    );
  }

  private buildNutritionTimeline(
    input: PerformanceSystemInput,
    weekType: GameWeekType,
  ): NutritionTimingStep[] {
    const bodyMassText = input.bodyMassKg
      ? `${Math.round(input.bodyMassKg * 1.4)} to ${Math.round(input.bodyMassKg * 2)} g protein/day`
      : "1.4 to 2.0 g/kg/day protein";
    const caffeineText = input.caffeineSensitive
      ? "Avoid caffeine or use clinician-approved low dose only."
      : "Optional tested caffeine: start low; do not exceed planned daily intake.";

    const steps: NutritionTimingStep[] = [
      {
        timing: "Daily baseline",
        target: `${bodyMassText}; carbohydrate scaled to load.`,
        examples: [
          "4 protein feedings across the day",
          "Carbohydrate around speed, strength, practice, and games",
          "Creatine is daily if already approved and tolerated",
        ],
        productNames: ["226ers Isolate Protein Drink", "226ers Creatine Monohydrate"],
      },
      {
        timing: "Chronic supplement block",
        target:
          "Creatine and beta-alanine are block tools; they do not replace game-day carbohydrate.",
        examples: [
          "Creatine: daily with any meal",
          "Beta-alanine: divided daily doses only if a 4+ week block is planned",
          "Review side effects and benefit monthly",
        ],
        productNames: ["226ers Creatine Monohydrate", "Amacx Beta Alanine"],
      },
      {
        timing: "3 to 4 hours pre-game",
        target: "Carbohydrate-dominant meal plus lean protein.",
        examples: [
          "Rice or pasta with lean protein",
          "Bread, banana, yogurt if tolerated",
          "Low fiber and low fat if nerves affect digestion",
        ],
        productNames: [],
      },
      {
        timing: "15 to 45 minutes pre-game",
        target: "20 to 30 g quick carbohydrate if needed; planned fluids.",
        examples: ["Gel", "drink mix", "banana", "white bread with honey"],
        productNames: ["Precision Fuel & Hydration PF 30 Gel"],
      },
    ];

    if (weekType !== "training-week") {
      steps.push({
        timing: "Between games",
        target:
          weekType === "doubleheader" ||
          weekType === "tournament" ||
          weekType === "international-tournament"
            ? "30 to 60 g carbohydrate per hour of break time when tolerated; sodium in heat or heavy sweaters."
            : "Refuel if next session or practice is within 24 hours.",
        examples: [
          "PF 30 Gel plus water",
          "Carb and electrolyte drink",
          "Banana, pretzels, rice cakes, jam sandwich",
        ],
        productNames: [
          "Precision Fuel & Hydration PF 30 Gel",
          "Precision Fuel & Hydration Carb & Electrolyte Drink Mix",
        ],
      });
      steps.push({
        timing: "Caffeine decision",
        target: caffeineText,
        examples: [
          "Use only after training trial",
          "Prioritize late-game alertness without sacrificing sleep",
        ],
        productNames: input.caffeineSensitive
          ? []
          : ["Precision Fuel & Hydration PF 30 Caffeine Gel"],
      });

      steps.push({
        timing: "Ergogenic decision",
        target:
          weekType === "doubleheader" ||
          weekType === "tournament" ||
          weekType === "international-tournament"
            ? "Nitrate can be trialed 3 to 7 days pre-event; bicarbonate is optional only after GI testing."
            : "Use only supplements already tested in training.",
        examples: [
          "Nitrate/beetroot: 2 to 3 hours pre-game after practice trial",
          "Bicarbonate: high GI-risk simulation-only tool",
          "No new supplement inside competition week",
        ],
        productNames:
          weekType === "single-game"
            ? ["226ers - NITROPRO BEETROOT"]
            : [
                "226ers - NITROPRO BEETROOT",
                "6d Sports Nutrition Sodium Bicarbonate",
              ],
      });
    }

    steps.push({
      timing: "After final game or hard practice",
      target: "20 to 40 g protein plus carbohydrate and fluids.",
      examples: [
        "Protein shake plus fruit",
        "Chocolate milk if tolerated",
        "Full meal within 2 hours",
      ],
      productNames: ["226ers Isolate Protein Drink"],
    });

    return steps;
  }

  private getRecommendedProducts(
    weekType: GameWeekType,
    input: PerformanceSystemInput,
  ): LaPrimaFitProduct[] {
    const products = this.system.nutrition.laPrimaFitProducts.filter(
      (product) => {
        if (product.useCase === "carbohydrate-caffeine") {
          return !input.caffeineSensitive && weekType !== "training-week";
        }
        if (product.useCase === "beta-alanine") {
          return true;
        }
        if (product.useCase === "nitrate") {
          return weekType !== "training-week";
        }
        if (product.useCase === "sodium-bicarbonate") {
          return (
            weekType === "doubleheader" ||
            weekType === "tournament" ||
            weekType === "international-tournament"
          );
        }
        if (
          product.useCase === "carbohydrate" ||
          product.useCase === "electrolyte-carbohydrate"
        ) {
          return weekType !== "training-week";
        }
        return true;
      },
    );

    return products;
  }

  private getSupplementPlan(
    weekType: GameWeekType,
    input: PerformanceSystemInput,
  ): SupplementStrategy[] {
    return this.system.nutrition.supplementStrategies
      .filter((strategy) => {
        if (strategy.key === "caffeine") {
          return !input.caffeineSensitive && weekType !== "training-week";
        }
        if (strategy.key === "nitrate") {
          return weekType !== "training-week";
        }
        if (strategy.key === "sodium-bicarbonate") {
          return (
            weekType === "doubleheader" ||
            weekType === "tournament" ||
            weekType === "international-tournament"
          );
        }
        return true;
      })
      .map((strategy) => this.applyAthleteSpecificSupplementDose(strategy, input));
  }

  private applyAthleteSpecificSupplementDose(
    strategy: SupplementStrategy,
    input: PerformanceSystemInput,
  ): SupplementStrategy {
    if (strategy.key !== "sodium-bicarbonate" || !input.bodyMassKg) {
      return strategy;
    }

    const lowDose = this.round(input.bodyMassKg * 0.2);
    const highDose = this.round(input.bodyMassKg * 0.3);

    return {
      ...strategy,
      protocol: [
        `For ${input.bodyMassKg} kg body mass, 0.2 to 0.3 g/kg equals ${lowDose} to ${highDose} g total sodium bicarbonate.`,
        ...strategy.protocol,
      ],
    };
  }

  private collectEvidenceIds(weekType: GameWeekType): string[] {
    const ids = new Set<string>([
      "gabbett_2016",
      "acwr_review_2020",
      "ioc_load_2016",
      "nordic_2019",
      "hamstring_rts_2017",
      "achilles_hsr_2015",
      ...this.system.nutrition.evidenceIds,
      ...this.system.mental.evidenceIds,
    ]);

    if (weekType === "international-tournament" || weekType === "tournament") {
      ids.add("ais_supplement_2024");
    }

    return [...ids];
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
