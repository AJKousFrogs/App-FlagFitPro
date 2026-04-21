/**
 * Sprint Training Knowledge Service
 *
 * Service layer for evidence-based sprint training protocols.
 * Static data (protocols, research references, technique checkpoints,
 * phase guidelines) lives in sprint-training-knowledge.data.ts.
 */
import { Injectable, inject, signal } from "@angular/core";
import { LoggerService } from "./logger.service";
import {
  ANKLE_STIFFNESS_PROTOCOL,
  PHASE_GUIDELINES,
  POSITION_SPRINT_PROTOCOLS,
  REACTIVE_READINESS_PROTOCOL,
  SPRINT_BIOMECHANICS,
  SPRINT_PROTOCOLS,
  SPRINT_RESEARCH,
  TECHNIQUE_CHECKPOINTS,
  type AnkleStiffnessProtocol,
  type PositionSprintProtocol,
  type ReactiveReadinessProtocol,
  type SprintBiomechanicsProfile,
  type SprintPhaseGuidelines,
  type SprintProgressionModel,
  type SprintProtocol,
  type SprintQuality,
  type SprintResearchReference,
  type SprintSet,
  type SprintTechniqueCheckpoint,
  type SprintWorkout,
  type WarmupProtocol,
} from "./sprint-training-knowledge.data";

export * from "./sprint-training-knowledge.data";

// ============================================================================
// SERVICE
// ============================================================================
@Injectable({
  providedIn: "root",
})
export class SprintTrainingKnowledgeService {
  private logger = inject(LoggerService);

  // State
  private readonly _selectedProtocol = signal<SprintProtocol | null>(null);
  private readonly _currentPhaseGuidelines =
    signal<SprintPhaseGuidelines | null>(null);

  // Public signals
  readonly selectedProtocol = this._selectedProtocol.asReadonly();
  readonly currentPhaseGuidelines = this._currentPhaseGuidelines.asReadonly();

  /**
   * Get all sprint protocols
   */
  getAllProtocols(): SprintProtocol[] {
    return Object.values(SPRINT_PROTOCOLS);
  }

  /**
   * Get protocol by name
   */
  getProtocol(name: string): SprintProtocol | undefined {
    return SPRINT_PROTOCOLS[name];
  }

  /**
   * Get protocols by target quality
   */
  getProtocolsByQuality(quality: SprintQuality): SprintProtocol[] {
    return Object.values(SPRINT_PROTOCOLS).filter(
      (p) => p.targetQuality === quality,
    );
  }

  /**
   * Get phase guidelines
   */
  getPhaseGuidelines(phase: string): SprintPhaseGuidelines | undefined {
    return PHASE_GUIDELINES[phase];
  }

  /**
   * Get all phase guidelines
   */
  getAllPhaseGuidelines(): SprintPhaseGuidelines[] {
    return Object.values(PHASE_GUIDELINES);
  }

  /**
   * Get technique checkpoints
   */
  getTechniqueCheckpoints(): SprintTechniqueCheckpoint[] {
    return TECHNIQUE_CHECKPOINTS;
  }

  /**
   * Get technique checkpoint by phase
   */
  getTechniqueCheckpointByPhase(
    phase: SprintTechniqueCheckpoint["phase"],
  ): SprintTechniqueCheckpoint | undefined {
    return TECHNIQUE_CHECKPOINTS.find((c) => c.phase === phase);
  }

  /**
   * Get all research references
   */
  getAllResearchReferences(): SprintResearchReference[] {
    return Object.values(SPRINT_RESEARCH);
  }

  /**
   * Generate sprint workout for a given phase and quality focus
   */
  generateSprintWorkout(
    phase: string,
    primaryQuality: SprintQuality,
    athleteLevel: "beginner" | "intermediate" | "advanced" = "intermediate",
  ): SprintWorkout {
    const guidelines = this.getPhaseGuidelines(phase);
    const protocols = this.getProtocolsByQuality(primaryQuality);

    // Select appropriate protocol based on phase guidelines
    let selectedProtocol = protocols[0];
    if (guidelines) {
      const recommended = protocols.find((p) =>
        guidelines.recommendedProtocols.includes(
          Object.keys(SPRINT_PROTOCOLS).find(
            (key) => SPRINT_PROTOCOLS[key] === p,
          ) || "",
        ),
      );
      if (recommended) {
        selectedProtocol = recommended;
      }
    }

    // Adjust volume based on athlete level
    const volumeMultiplier =
      athleteLevel === "beginner"
        ? 0.6
        : athleteLevel === "intermediate"
          ? 0.8
          : 1.0;

    const warmup: WarmupProtocol = {
      duration: 15,
      components: [
        "Light jog (5 min)",
        "Dynamic stretching (5 min)",
        "Movement prep (5 min)",
      ],
      activationDrills: [
        "Glute bridges x 10",
        "Single-leg RDL x 8 each",
        "Lateral band walks x 10 each",
      ],
      sprintPrep: [
        "A-skips x 20m x 2",
        "B-skips x 20m x 2",
        "Build-up sprints: 50%, 70%, 85% x 30m each",
      ],
    };

    const mainSet: SprintSet[] = [];

    // Add main sprint work
    selectedProtocol.distances.forEach((distance) => {
      mainSet.push({
        exercise: `${distance}m Sprint`,
        distance: distance,
        reps: Math.round(selectedProtocol.repsPerSet * volumeMultiplier),
        rest: selectedProtocol.restBetweenReps,
        intensity: selectedProtocol.intensity,
        cues: this.getSprintCues(distance),
      });
    });

    // Add deceleration work if appropriate
    if (primaryQuality !== "deceleration" && guidelines?.accelerationWork) {
      mainSet.push({
        exercise: "Sprint to Stop",
        distance: 20,
        reps: 4,
        rest: 60,
        intensity: "near_maximal",
        cues: [
          "Lower center of mass to stop",
          "Short, quick braking steps",
          "Maintain balance",
        ],
      });
    }

    const cooldown = [
      "Light jog (5 min)",
      "Static stretching - hip flexors, hamstrings, quads (5 min)",
      "Foam rolling if available",
    ];

    return {
      name: `${primaryQuality.replace("_", " ").toUpperCase()} Sprint Session - ${phase}`,
      warmup,
      mainSet,
      cooldown,
      totalDuration: 45 + Math.round(mainSet.length * 5),
      targetRPE: selectedProtocol.intensity === "maximal" ? 9 : 8,
      notes: selectedProtocol.flagFootballApplication,
    };
  }

  /**
   * Get sprint cues based on distance
   */
  private getSprintCues(distance: number): string[] {
    if (distance <= 10) {
      return [
        "Explosive first step",
        "Drive arms aggressively",
        "Stay low for first 5m",
        "Push the ground away",
      ];
    } else if (distance <= 30) {
      return [
        "Gradual rise from acceleration",
        "Maintain positive shin angles",
        "Powerful hip extension",
        "Relax shoulders",
      ];
    } else {
      return [
        "Upright posture",
        "High knee lift",
        "Relaxed face and shoulders",
        "Active foot strike",
      ];
    }
  }

  /**
   * Get 4-week sprint progression model
   */
  getSprintProgressionModel(
    phase: string,
    startingVolume = 20,
  ): SprintProgressionModel[] {
    const guidelines = this.getPhaseGuidelines(phase);
    const maxVolume = guidelines?.weeklySprintVolume[1] || 40;

    return [
      {
        weekNumber: 1,
        totalSprints: startingVolume,
        distances: [10, 20],
        intensityLevel: 85,
        notes: "Introduction week - focus on quality",
      },
      {
        weekNumber: 2,
        totalSprints: Math.round(startingVolume * 1.15),
        distances: [10, 20, 30],
        intensityLevel: 90,
        notes: "Progressive overload - add distance",
      },
      {
        weekNumber: 3,
        totalSprints: Math.min(Math.round(startingVolume * 1.25), maxVolume),
        distances: [10, 20, 30],
        intensityLevel: 95,
        notes: "Peak week - highest volume",
      },
      {
        weekNumber: 4,
        totalSprints: Math.round(startingVolume * 0.8),
        distances: [10, 20],
        intensityLevel: 85,
        notes: "Deload week - reduce volume, maintain quality",
      },
    ];
  }

  /**
   * Calculate weekly sprint load
   */
  calculateWeeklySprintLoad(
    sprints: { distance: number; intensity: number }[],
  ): number {
    // Sprint load = Σ (distance × intensity factor)
    // Intensity factor: submaximal (0.7), near_maximal (0.85), maximal (1.0)
    return sprints.reduce((total, sprint) => {
      const intensityFactor = sprint.intensity / 100;
      return total + sprint.distance * intensityFactor;
    }, 0);
  }

  /**
   * Check if sprint volume is appropriate for phase
   */
  isVolumeAppropriate(
    phase: string,
    weeklySprintCount: number,
  ): { appropriate: boolean; message: string } {
    const guidelines = this.getPhaseGuidelines(phase);
    if (!guidelines) {
      return {
        appropriate: true,
        message: "No guidelines available for this phase",
      };
    }

    const [min, max] = guidelines.weeklySprintVolume;

    if (weeklySprintCount < min) {
      return {
        appropriate: false,
        message: `Sprint volume (${weeklySprintCount}) is below recommended minimum (${min}) for ${phase}. Consider adding more sprint work.`,
      };
    }

    if (weeklySprintCount > max) {
      return {
        appropriate: false,
        message: `Sprint volume (${weeklySprintCount}) exceeds recommended maximum (${max}) for ${phase}. Risk of overtraining - reduce volume.`,
      };
    }

    return {
      appropriate: true,
      message: `Sprint volume (${weeklySprintCount}) is within optimal range (${min}-${max}) for ${phase}.`,
    };
  }

  /**
   * Get flag football specific sprint recommendations
   */
  getFlagFootballSprintRecommendations(): string[] {
    return [
      "🏃 ACCELERATION IS KING: 60% of flag football plays are won in the first 10 meters (Clark et al. 2019)",
      "🔄 TRAIN REPEATED SPRINTS: Flag football involves 20-40 sprints per game with incomplete recovery",
      "⚡ DECELERATION = INJURY PREVENTION: Every cut requires controlled deceleration. Train it 2-3x/week",
      "🎯 SPORT-SPECIFIC DISTANCES: Focus on 5-30m sprints - these match game demands",
      "💪 STRENGTH TRANSFERS TO SPEED: Every 1% increase in squat strength = 0.7% faster sprints (Seitz et al. 2014)",
      "😴 RECOVERY IS TRAINING: 48-72 hours between maximal sprint sessions for CNS recovery",
      "📊 QUALITY OVER QUANTITY: Elite sprinters do 300-600 maximal sprints per YEAR, not per month",
      "🔥 JULY RELOAD: Mid-season is your chance to build 'extra layer' of speed capacity",
      "🦵 HIP FLEXORS: Strong hip flexors = higher knee lift = faster sprints (Morin & Samozino 2016)",
      "🦶 ANKLE STIFFNESS: Train your Achilles tendon - it's your sprint 'spring' (Kubo et al. 2000)",
      "⚡ REACTIVE READINESS: All players must be 'on toes, locked and ready' - train it daily",
    ];
  }

  // ============================================================================
  // NEW METHODS FOR POSITION-SPECIFIC PROTOCOLS
  // ============================================================================

  /**
   * Get sprint biomechanics profile for all key muscle groups
   */
  getSprintBiomechanics(): SprintBiomechanicsProfile[] {
    return SPRINT_BIOMECHANICS;
  }

  /**
   * Get sprint biomechanics for a specific muscle group
   */
  getSprintBiomechanicsForMuscle(
    muscleGroup: string,
  ): SprintBiomechanicsProfile | undefined {
    return SPRINT_BIOMECHANICS.find((b) =>
      b.muscleGroup.toLowerCase().includes(muscleGroup.toLowerCase()),
    );
  }

  /**
   * Get position-specific sprint protocol
   */
  getPositionSprintProtocol(
    position: string,
  ): PositionSprintProtocol | undefined {
    return POSITION_SPRINT_PROTOCOLS.find((p) =>
      p.position.toLowerCase().includes(position.toLowerCase()),
    );
  }

  /**
   * Get all position sprint protocols
   */
  getAllPositionSprintProtocols(): PositionSprintProtocol[] {
    return POSITION_SPRINT_PROTOCOLS;
  }

  /**
   * Compare sprint requirements between positions
   */
  comparePositionSprintRequirements(
    position1: string,
    position2: string,
  ): {
    position1: PositionSprintProtocol | undefined;
    position2: PositionSprintProtocol | undefined;
    keyDifferences: string[];
  } {
    const p1 = this.getPositionSprintProtocol(position1);
    const p2 = this.getPositionSprintProtocol(position2);

    const keyDifferences: string[] = [];

    if (p1 && p2) {
      keyDifferences.push(
        `Volume: ${p1.position} (${p1.weeklyVolume}) vs ${p2.position} (${p2.weeklyVolume})`,
      );
      keyDifferences.push(
        `Primary patterns: ${p1.primaryMovementPatterns[0]} vs ${p2.primaryMovementPatterns[0]}`,
      );
      keyDifferences.push(
        `Distance focus: ${p1.sprintDistances.percentage} vs ${p2.sprintDistances.percentage}`,
      );
    }

    return { position1: p1, position2: p2, keyDifferences };
  }

  /**
   * Get reactive readiness protocol
   */
  getReactiveReadinessProtocol(): ReactiveReadinessProtocol {
    return REACTIVE_READINESS_PROTOCOL;
  }

  /**
   * Get ankle stiffness protocol
   */
  getAnkleStiffnessProtocol(): AnkleStiffnessProtocol {
    return ANKLE_STIFFNESS_PROTOCOL;
  }

  /**
   * Get complete sprint training program for a position
   */
  getCompleteSprintProgram(
    position: string,
    phase: string,
  ): {
    positionProtocol: PositionSprintProtocol | undefined;
    phaseGuidelines: SprintPhaseGuidelines | undefined;
    biomechanics: SprintBiomechanicsProfile[];
    reactiveReadiness: ReactiveReadinessProtocol;
    ankleStiffness: AnkleStiffnessProtocol;
    recommendations: string[];
  } {
    const positionProtocol = this.getPositionSprintProtocol(position);
    const phaseGuidelines = this.getPhaseGuidelines(phase);

    const recommendations: string[] = [];

    if (positionProtocol) {
      recommendations.push(`Position: ${positionProtocol.rationale}`);
      recommendations.push(...positionProtocol.uniqueConsiderations);
    }

    if (phaseGuidelines) {
      recommendations.push(...phaseGuidelines.recoveryConsiderations);
    }

    return {
      positionProtocol,
      phaseGuidelines,
      biomechanics: SPRINT_BIOMECHANICS,
      reactiveReadiness: REACTIVE_READINESS_PROTOCOL,
      ankleStiffness: ANKLE_STIFFNESS_PROTOCOL,
      recommendations,
    };
  }

  /**
   * Get YouTube training resources
   * Reference: https://www.youtube.com/watch?v=JQTx5J8O7-o&list=PLImm55S4h6h71f0DH3llC9pMr9J7cprQs
   */
  getTrainingVideoResources(): {
    name: string;
    url: string;
    description: string;
  }[] {
    return [
      {
        name: "Position-Specific Training Playlist",
        url: "https://www.youtube.com/watch?v=JQTx5J8O7-o&list=PLImm55S4h6h71f0DH3llC9pMr9J7cprQs",
        description:
          "Comprehensive playlist covering position-specific training drills for flag football athletes",
      },
    ];
  }
}
