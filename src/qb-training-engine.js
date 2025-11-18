// QB Training Program Engine
// Handles dual-track QB training system with lower body foundation + QB-specific upper body

import {
  QB_TRAINING_PROGRAM,
  QB_ASSESSMENTS,
} from "./qb-training-program-data.js";
import { TrainingProgramEngine } from "./training-program-engine.js";
import { logger } from "./logger.js";

export class QBTrainingEngine extends TrainingProgramEngine {
  constructor() {
    super();
    this.trainingMode = "quarterback"; // Override base mode
    this.dualTrackEnabled = true;
    this.throwingVolume = this.loadThrowingProgress();
    this.velocityTracking = this.loadVelocityProgress();
    this.armCareSchedule = this.initializeArmCareSchedule();
  }

  // QB-specific program status with dual tracks
  getQBProgramStatus() {
    const baseStatus = this.getProgramStatus();
    const throwingProgress = this.getThrowingVolumeProgress();
    const velocityProgress = this.getVelocityProgress();

    return {
      ...baseStatus,
      dualTrackProgress: {
        lowerBody: baseStatus.percentComplete,
        upperBody: this.getQBSpecificProgress(),
        throwing: throwingProgress.percentToTarget,
      },
      throwingMetrics: {
        weeklyVolume: throwingProgress.currentWeekVolume,
        targetVolume: throwingProgress.targetVolume,
        velocityGain: velocityProgress.totalGain,
        tournamentReadiness: this.assessTournamentReadiness(),
      },
    };
  }

  // Get QB-specific workout data combining both tracks
  getQBWeekData(weekNumber) {
    const phase = this.getPhaseForWeek(weekNumber);
    const lowerBodyData = this.getWeekData(weekNumber); // From parent class
    const qbUpperBodyData = this.getQBUpperBodyWorkouts(weekNumber, phase);

    return this.mergeDualTrackWorkouts(
      lowerBodyData,
      qbUpperBodyData,
      weekNumber,
      phase,
    );
  }

  // Generate QB-specific upper body workouts based on phase and week
  getQBUpperBodyWorkouts(weekNumber, phase) {
    const weekInPhase = this.getWeekInPhase(weekNumber, phase);
    const baseTemplate = this.getQBWorkoutTemplate(phase);

    return this.applyQBProgressions(
      baseTemplate,
      weekNumber,
      phase,
      weekInPhase,
    );
  }

  getQBWorkoutTemplate(phase) {
    const templates = {
      foundation: {
        armStrength: {
          frequency: 3, // Mon, Wed, Fri
          exercises: [
            {
              name: "Band External Rotation",
              sets: 3,
              reps: 15,
              load: "Light band",
            },
            {
              name: "Band Internal Rotation",
              sets: 3,
              reps: 12,
              load: "Light band",
            },
            { name: "Empty Can Raises", sets: 2, reps: 10, load: "Bodyweight" },
            { name: "Prone Y-T-W", sets: 2, reps: 8, load: "Bodyweight" },
          ],
        },
        mobility: {
          frequency: 6, // Daily
          exercises: [
            { name: "Sleeper Stretch", sets: 2, duration: "60s", side: "each" },
            { name: "Couch Stretch", sets: 2, duration: "90s", side: "each" },
            {
              name: "Thoracic Extension",
              sets: 2,
              reps: 10,
              load: "Bodyweight",
            },
            {
              name: "Cross-body Stretch",
              sets: 2,
              duration: "45s",
              side: "each",
            },
          ],
        },
        throwing: {
          frequency: 3,
          volume: "100-150 throws",
          focus: ["Mechanics", "Progressive distance", "Accuracy"],
        },
      },
      strength: {
        armStrength: {
          frequency: 3,
          exercises: [
            {
              name: "Band External Rotation",
              sets: 4,
              reps: 12,
              load: "Medium band",
            },
            {
              name: "Band Internal Rotation",
              sets: 3,
              reps: 15,
              load: "Medium band",
            },
            {
              name: "Weighted External Rotation",
              sets: 3,
              reps: 8,
              load: "3-5 lbs",
            },
            { name: "Lat Pulldowns", sets: 3, reps: 10, load: "75% BW" },
            {
              name: "Face Pulls",
              sets: 3,
              reps: 12,
              load: "Medium resistance",
            },
          ],
        },
        mobility: {
          frequency: 6,
          exercises: [
            { name: "Sleeper Stretch", sets: 3, duration: "75s", side: "each" },
            { name: "Couch Stretch", sets: 3, duration: "120s", side: "each" },
            {
              name: "Thoracic Extension",
              sets: 3,
              reps: 12,
              load: "Light weight",
            },
            {
              name: "Posterior Capsule Stretch",
              sets: 2,
              duration: "60s",
              side: "each",
            },
          ],
        },
        throwing: {
          frequency: 4,
          volume: "250-350 throws",
          focus: [
            "Velocity development",
            "Endurance building",
            "Weighted balls",
          ],
        },
      },
      power: {
        armStrength: {
          frequency: 4,
          exercises: [
            {
              name: "Medicine Ball Rotational Throws",
              sets: 4,
              reps: 8,
              load: "8-10 lbs",
            },
            {
              name: "Weighted Ball Throws",
              sets: 3,
              reps: 6,
              load: "16 oz ball",
            },
            {
              name: "Explosive External Rotation",
              sets: 3,
              reps: 6,
              load: "Heavy band",
            },
            { name: "Single Arm Lat Pulls", sets: 3, reps: 8, load: "85% BW" },
            { name: "Tricep Throws", sets: 3, reps: 5, load: "Medicine ball" },
          ],
        },
        mobility: {
          frequency: 6,
          exercises: [
            {
              name: "Dynamic Sleeper Stretch",
              sets: 3,
              reps: 15,
              side: "each",
            },
            { name: "Dynamic Couch Stretch", sets: 3, reps: 12, side: "each" },
            { name: "Thoracic Rotation", sets: 3, reps: 15, direction: "each" },
            { name: "Shoulder Dislocations", sets: 2, reps: 20, load: "Band" },
          ],
        },
        throwing: {
          frequency: 5,
          volume: "400-500 throws",
          focus: [
            "Peak velocity",
            "Tournament simulation",
            "Endurance testing",
          ],
        },
      },
      competition: {
        armStrength: {
          frequency: 2,
          exercises: [
            {
              name: "Band External Rotation",
              sets: 2,
              reps: 12,
              load: "Light band",
            },
            { name: "Medicine Ball Throws", sets: 2, reps: 5, load: "6 lbs" },
            { name: "Maintenance Lat Work", sets: 2, reps: 8, load: "Light" },
          ],
        },
        mobility: {
          frequency: 6,
          exercises: [
            { name: "Sleeper Stretch", sets: 2, duration: "60s", side: "each" },
            { name: "Couch Stretch", sets: 2, duration: "90s", side: "each" },
            {
              name: "Gentle Thoracic Mobility",
              sets: 2,
              reps: 10,
              load: "Bodyweight",
            },
          ],
        },
        throwing: {
          frequency: 3,
          volume: "200-320 throws",
          focus: [
            "Velocity maintenance",
            "Competition simulation",
            "Mental preparation",
          ],
        },
      },
    };

    return templates[phase];
  }

  // Merge lower body and QB upper body workouts into dual-track system
  mergeDualTrackWorkouts(lowerBodyData, qbUpperBodyData, weekNumber, phase) {
    const mergedData = JSON.parse(JSON.stringify(lowerBodyData));
    const armCareSchedule = this.getWeeklyArmCareSchedule(weekNumber, phase);

    // Add QB-specific components to each day
    Object.keys(mergedData.days).forEach((day) => {
      const dayData = mergedData.days[day];

      // Add QB warm-up to every training day
      if (dayData.type !== "rest") {
        dayData.qbWarmup = this.getQBWarmupForDay(day, phase);
      }

      // Add QB-specific work based on day
      const dayIndex = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ].indexOf(day);
      dayData.qbWork = this.getQBWorkForDay(
        day,
        dayIndex,
        qbUpperBodyData,
        weekNumber,
        phase,
      );

      // Add daily arm care
      dayData.armCare = armCareSchedule[day];

      // Add throwing session if scheduled
      if (this.isThrowingDay(day, phase)) {
        dayData.throwing = this.getThrowingSession(day, weekNumber, phase);
      }
    });

    // Add QB-specific metadata
    mergedData.qbSpecific = {
      weeklyThrowingVolume: this.getThrowingVolumeForWeek(weekNumber, phase),
      velocityTargets: this.getVelocityTargetsForWeek(weekNumber, phase),
      assessmentWeek: QB_ASSESSMENTS.throwingVelocity.frequency.includes(
        `Week ${weekNumber}`,
      ),
      tournamentSim: phase === "power" && weekNumber >= 11,
    };

    return mergedData;
  }

  // Get QB-specific warm-up based on day and phase
  getQBWarmupForDay(day, phase) {
    const baseWarmup = QB_TRAINING_PROGRAM.qbSpecificWarmup;
    const intensity = {
      foundation: 0.7,
      strength: 0.8,
      power: 0.9,
      competition: 0.6,
    }[phase];

    return {
      ...baseWarmup,
      intensity: intensity,
      focus: this.getWarmupFocusForDay(day),
    };
  }

  getWarmupFocusForDay(day) {
    const focuses = {
      monday: ["Shoulder activation", "Hip flexor prep"],
      tuesday: ["Dynamic mobility", "Sprint prep"],
      wednesday: ["Recovery mobility", "Light activation"],
      thursday: ["Power prep", "Throwing chain"],
      friday: ["Game prep", "Velocity prep"],
      saturday: ["Competition prep", "Mental focus"],
      sunday: ["Recovery", "Gentle mobility"],
    };

    return focuses[day] || ["General activation"];
  }

  // Determine QB work for specific day
  getQBWorkForDay(day, dayIndex, qbUpperBodyData, weekNumber, phase) {
    const qbSchedule = QB_TRAINING_PROGRAM.dualTrackApproach.weeklySchedule;
    const dayWork = qbSchedule[day];

    if (!dayWork || day === "sunday") {
      return { type: "recovery", work: this.getRecoveryWork() };
    }

    // Parse the day's QB work description
    if (dayWork.includes("arm strength")) {
      return {
        type: "strength",
        work: qbUpperBodyData.armStrength.exercises,
        duration: 25,
        notes: ["Focus on velocity development", "Control eccentric phase"],
      };
    }

    if (dayWork.includes("mobility")) {
      return {
        type: "mobility",
        work: qbUpperBodyData.mobility.exercises,
        duration: 15,
        notes: ["Hold stretches full duration", "Critical for throwing health"],
      };
    }

    if (dayWork.includes("throwing")) {
      return {
        type: "throwing",
        work: this.getThrowingSession(day, weekNumber, phase),
        duration: 45,
        notes: ["Progressive warm-up", "Focus on mechanics"],
      };
    }

    return { type: "integration", work: this.getIntegrationWork(day, phase) };
  }

  // Get throwing session details
  getThrowingSession(day, weekNumber, phase) {
    const volumeData = QB_TRAINING_PROGRAM.throwingVolumeProgression;
    const phaseVolume = volumeData.byPhase[phase];
    const weeklyTarget = this.parseVolumeRange(phaseVolume);

    const sessionTypes = {
      monday: "mechanics",
      tuesday: "progression",
      thursday: "velocity",
      friday: "endurance",
      saturday: "simulation",
    };

    const sessionType = sessionTypes[day] || "progression";

    return {
      type: sessionType,
      volume: this.getSessionVolume(sessionType, weeklyTarget, weekNumber),
      progression: this.getThrowingProgression(sessionType, weekNumber, phase),
      warmup: this.getThrowingWarmup(),
      cooldown: this.getThrowingCooldown(),
    };
  }

  parseVolumeRange(rangeString) {
    const numbers = rangeString.match(/\d+/g);
    if (numbers.length === 1) return parseInt(numbers[0]);
    return Math.round((parseInt(numbers[0]) + parseInt(numbers[1])) / 2);
  }

  getSessionVolume(sessionType, weeklyTarget, _weekNumber) {
    const sessionMultipliers = {
      mechanics: 0.15, // 15% of weekly volume
      progression: 0.25, // 25% of weekly volume
      velocity: 0.2, // 20% of weekly volume
      endurance: 0.3, // 30% of weekly volume
      simulation: 0.35, // 35% of weekly volume (tournament prep)
    };

    return Math.round(weeklyTarget * sessionMultipliers[sessionType]);
  }

  // Initialize throwing volume tracking
  loadThrowingProgress() {
    try {
      const saved = localStorage.getItem("flagfit_throwing_progress");
      return saved ? JSON.parse(saved) : this.getDefaultThrowingProgress();
    } catch (error) {
      logger.error("Error loading throwing progress:", error);
      return this.getDefaultThrowingProgress();
    }
  }

  getDefaultThrowingProgress() {
    return {
      weeklyVolumes: {},
      sessionLogs: {},
      velocityReadings: {},
      accuracyStats: {},
      enduranceTests: {},
      lastSessionDate: null,
      totalThrows: 0,
    };
  }

  // Track throwing session completion
  logThrowingSession(weekNumber, day, sessionData) {
    const sessionKey = `week${weekNumber}_${day}`;

    this.throwingVolume.sessionLogs[sessionKey] = {
      date: new Date().toISOString(),
      volume: sessionData.volume,
      type: sessionData.type,
      velocityReadings: sessionData.velocityReadings || [],
      accuracyPercentage: sessionData.accuracy || null,
      notes: sessionData.notes || "",
      mechanicsRating: sessionData.mechanicsRating || null,
    };

    // Update weekly totals
    if (!this.throwingVolume.weeklyVolumes[`week${weekNumber}`]) {
      this.throwingVolume.weeklyVolumes[`week${weekNumber}`] = 0;
    }
    this.throwingVolume.weeklyVolumes[`week${weekNumber}`] +=
      sessionData.volume;
    this.throwingVolume.totalThrows += sessionData.volume;
    this.throwingVolume.lastSessionDate = new Date().toISOString();

    this.saveThrowingProgress();
    return this.throwingVolume.sessionLogs[sessionKey];
  }

  saveThrowingProgress() {
    try {
      localStorage.setItem(
        "flagfit_throwing_progress",
        JSON.stringify(this.throwingVolume),
      );
    } catch (error) {
      logger.error("Error saving throwing progress:", error);
    }
  }

  // Get throwing volume progress
  getThrowingVolumeProgress() {
    const status = this.getProgramStatus();
    const phase = this.getPhaseForWeek(status.currentWeek);
    const targetVolume = this.parseVolumeRange(
      QB_TRAINING_PROGRAM.throwingVolumeProgression.byPhase[phase],
    );
    const currentWeekVolume =
      this.throwingVolume.weeklyVolumes[`week${status.currentWeek}`] || 0;

    return {
      currentWeekVolume,
      targetVolume,
      percentToTarget: Math.round((currentWeekVolume / targetVolume) * 100),
      weeklyHistory: this.getWeeklyVolumeHistory(),
      totalProgression: this.getTotalThrowingProgression(),
    };
  }

  // Assessment tournament readiness
  assessTournamentReadiness() {
    const throwingProgress = this.getThrowingVolumeProgress();
    const velocityProgress = this.getVelocityProgress();
    const enduranceLevel = this.getEnduranceLevel();

    const readinessScore =
      throwingProgress.percentToTarget * 0.3 +
      velocityProgress.percentGain * 0.35 +
      enduranceLevel * 0.35;

    return {
      score: Math.round(readinessScore),
      level: this.getReadinessLevel(readinessScore),
      recommendations: this.getReadinessRecommendations(readinessScore),
      tournamentProjection: this.projectTournamentPerformance(readinessScore),
    };
  }

  getReadinessLevel(score) {
    if (score >= 90) return "Elite - Tournament Ready";
    if (score >= 80) return "Advanced - Competition Ready";
    if (score >= 70) return "Intermediate - Needs Preparation";
    if (score >= 60) return "Developing - Extended Training Needed";
    return "Beginner - Foundation Building Required";
  }

  // Initialize weekly arm care schedule
  initializeArmCareSchedule() {
    return {
      daily: {
        morning: ["Band external rotation", "Sleeper stretch", "Couch stretch"],
        evening: [
          "Posterior capsule stretch",
          "Cross-body stretch",
          "Gentle rotation",
        ],
      },
      postThrowing: [
        "Progressive cool-down throws",
        "Ice if needed",
        "Gentle stretching",
      ],
      offDays: [
        "Extended mobility work",
        "Soft tissue work",
        "Recovery protocols",
      ],
    };
  }

  // Get QB-specific progress percentage
  getQBSpecificProgress() {
    const throwingProgress = this.getThrowingVolumeProgress().percentToTarget;
    const velocityProgress = this.getVelocityProgress().percentGain;
    const mobilityProgress = this.getMobilityProgress();

    return Math.round(
      (throwingProgress + velocityProgress + mobilityProgress) / 3,
    );
  }

  // Load velocity tracking data
  loadVelocityProgress() {
    try {
      const saved = localStorage.getItem("flagfit_velocity_progress");
      return saved ? JSON.parse(saved) : this.getDefaultVelocityProgress();
    } catch (error) {
      logger.error("Error loading velocity progress:", error);
      return this.getDefaultVelocityProgress();
    }
  }

  getDefaultVelocityProgress() {
    return {
      baseline: null,
      readings: {},
      maxVelocity: 0,
      averageVelocity: 0,
      totalGain: 0,
      assessmentDates: [],
    };
  }

  // Additional helper methods would continue here for velocity tracking,
  // mobility progress, endurance testing, etc.

  getVelocityProgress() {
    // Simplified implementation
    return {
      totalGain: 0,
      percentGain: 0,
    };
  }

  getMobilityProgress() {
    // Simplified implementation
    return 75;
  }

  getEnduranceLevel() {
    // Simplified implementation
    return 80;
  }
}

// Create QB-specific training engine instance
export const qbTrainingEngine = new QBTrainingEngine();

export default qbTrainingEngine;
