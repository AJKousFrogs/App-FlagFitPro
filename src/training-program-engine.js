// Training Program Engine
// Handles workout progression, phase transitions, and exercise variations

import { WEEKLY_SCHEDULES } from "./training-program-data.js";

export class TrainingProgramEngine {
  constructor() {
    this.currentWeek = 1;
    this.currentPhase = "foundation";
    this.programStartDate = new Date("2025-11-17");
    this.userProgress = this.loadUserProgress();
    this.exerciseVariations = this.initializeExerciseVariations();
  }

  // Get current program status
  getProgramStatus() {
    const currentDate = new Date();
    const daysSinceStart = Math.floor(
      (currentDate - this.programStartDate) / (1000 * 60 * 60 * 24),
    );
    const calculatedWeek = Math.floor(daysSinceStart / 7) + 1;

    return {
      currentWeek: Math.min(calculatedWeek, 14),
      currentPhase: this.getPhaseForWeek(calculatedWeek),
      daysIntoProgram: daysSinceStart,
      percentComplete: Math.min((calculatedWeek / 14) * 100, 100),
      isComplete: calculatedWeek > 14,
    };
  }

  // Get phase for given week
  getPhaseForWeek(week) {
    if (week <= 4) return "foundation";
    if (week <= 8) return "strength";
    if (week <= 12) return "power";
    return "competition";
  }

  // Get week data with progressive modifications
  getWeekData(weekNumber) {
    const phase = this.getPhaseForWeek(weekNumber);
    const baseWeek = this.getBaseWeekForPhase(phase);
    const weekData = this.cloneWeekData(WEEKLY_SCHEDULES[phase][baseWeek]);

    // Apply progressive modifications based on week in phase
    return this.applyProgressiveModifications(weekData, weekNumber, phase);
  }

  getBaseWeekForPhase(_phase) {
    // For now, use week1 as base for all phases
    // In full implementation, each phase would have multiple week templates
    return "week1";
  }

  cloneWeekData(weekData) {
    return JSON.parse(JSON.stringify(weekData));
  }

  // Apply progressive modifications to workout based on week
  applyProgressiveModifications(weekData, weekNumber, phase) {
    const weekInPhase = this.getWeekInPhase(weekNumber, phase);

    // Modify each day's workout
    Object.keys(weekData.days).forEach((day) => {
      const dayData = weekData.days[day];
      if (dayData.blocks) {
        dayData.blocks.forEach((block) => {
          if (block.exercises) {
            block.exercises.forEach((exercise) => {
              this.modifyExercise(exercise, weekInPhase, phase, weekNumber);
            });
          }
        });
      }
    });

    // Update week metadata
    weekData.weekNumber = weekNumber;
    weekData.phase = phase;
    weekData.weekInPhase = weekInPhase;
    weekData.dateRange = this.calculateWeekDateRange(weekNumber);

    return weekData;
  }

  getWeekInPhase(weekNumber, phase) {
    const phaseStartWeeks = {
      foundation: 1,
      strength: 5,
      power: 9,
      competition: 13,
    };
    return weekNumber - phaseStartWeeks[phase] + 1;
  }

  // Modify individual exercise based on progression
  modifyExercise(exercise, weekInPhase, phase, _totalWeek) {
    const progressionRules = this.getProgressionRules(phase);

    // Apply volume progression
    if (exercise.sets && progressionRules.volumeIncrease) {
      const baseSet = parseInt(exercise.sets);
      exercise.sets = Math.min(
        baseSet +
          Math.floor((weekInPhase - 1) * progressionRules.volumeIncrease),
        baseSet + 2,
      );
    }

    // Apply intensity progression
    if (exercise.load && progressionRules.intensityIncrease) {
      exercise.load = this.progressLoad(
        exercise.load,
        weekInPhase,
        progressionRules.intensityIncrease,
      );
    }

    // Apply sprint volume progression
    if (this.isSprintExercise(exercise)) {
      exercise = this.progressSprintWork(exercise, phase, weekInPhase);
    }

    // Apply plyometric progression
    if (this.isPlyometricExercise(exercise)) {
      exercise = this.progressPlyometrics(exercise, phase, weekInPhase);
    }

    return exercise;
  }

  getProgressionRules(phase) {
    const rules = {
      foundation: {
        volumeIncrease: 0.5, // Sets increase by 0.5 per week
        intensityIncrease: 0.05, // Load increase by 5% per week
        sprintVolumeMultiplier: 1.2,
        plyoVolumeMultiplier: 1.15,
      },
      strength: {
        volumeIncrease: 0.25,
        intensityIncrease: 0.08,
        sprintVolumeMultiplier: 1.3,
        plyoVolumeMultiplier: 1.25,
      },
      power: {
        volumeIncrease: 0,
        intensityIncrease: 0.03,
        sprintVolumeMultiplier: 1.4,
        plyoVolumeMultiplier: 1.35,
      },
      competition: {
        volumeIncrease: -0.5, // Taper - reduce volume
        intensityIncrease: 0,
        sprintVolumeMultiplier: 0.8,
        plyoVolumeMultiplier: 0.7,
      },
    };

    return rules[phase];
  }

  progressLoad(loadString, weekInPhase, intensityIncrease) {
    // Parse load string and apply progression
    if (loadString.includes("%")) {
      const percentage = parseInt(loadString.match(/\d+/)[0]);
      const newPercentage = Math.round(
        percentage * (1 + intensityIncrease * (weekInPhase - 1)),
      );
      return loadString.replace(/\d+/, newPercentage);
    }

    if (loadString.includes("BW")) {
      const percentage = parseInt(loadString.match(/\d+/)[0]);
      const newPercentage = Math.min(percentage + 5 * (weekInPhase - 1), 40); // Cap at 40% BW
      return loadString.replace(/\d+/, newPercentage);
    }

    return loadString;
  }

  isSprintExercise(exercise) {
    const sprintKeywords = [
      "sprint",
      "acceleration",
      "flying",
      "dash",
      "tempo",
    ];
    return sprintKeywords.some((keyword) =>
      exercise.name.toLowerCase().includes(keyword),
    );
  }

  isPlyometricExercise(exercise) {
    const plyoKeywords = ["jump", "bound", "hop", "pogo", "depth"];
    return plyoKeywords.some((keyword) =>
      exercise.name.toLowerCase().includes(keyword),
    );
  }

  progressSprintWork(exercise, phase, weekInPhase) {
    const rules = this.getProgressionRules(phase);

    if (exercise.sets) {
      const baseSets = parseInt(exercise.sets);
      exercise.sets = Math.round(
        baseSets * Math.pow(rules.sprintVolumeMultiplier, weekInPhase - 1),
      );
    }

    // Increase intensity percentage
    if (exercise.intensity) {
      const baseIntensity = parseInt(exercise.intensity.replace("%", ""));
      const newIntensity = Math.min(baseIntensity + 5 * (weekInPhase - 1), 100);
      exercise.intensity = newIntensity + "%";
    }

    return exercise;
  }

  progressPlyometrics(exercise, phase, weekInPhase) {
    const rules = this.getProgressionRules(phase);

    if (exercise.sets) {
      const baseSets = parseInt(exercise.sets);
      exercise.sets = Math.round(
        baseSets * Math.pow(rules.plyoVolumeMultiplier, weekInPhase - 1),
      );
    }

    // Progress box height for box jumps
    if (
      exercise.name.toLowerCase().includes("box jump") &&
      exercise.boxHeight
    ) {
      const baseHeight = parseInt(exercise.boxHeight.replace(/\D/g, ""));
      const newHeight = baseHeight + 2 * (weekInPhase - 1); // Add 2 inches per week
      exercise.boxHeight = newHeight + " inches";
    }

    return exercise;
  }

  calculateWeekDateRange(weekNumber) {
    const startDate = new Date(this.programStartDate);
    startDate.setDate(startDate.getDate() + (weekNumber - 1) * 7);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    return {
      start: startDate,
      end: endDate,
      formatted: `${startDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })} - ${endDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
    };
  }

  // Exercise variation system
  initializeExerciseVariations() {
    return {
      "Nordic Curls": {
        beginner: "Band-assisted Nordic Curls",
        intermediate: "Nordic Curls (partial range)",
        advanced: "Nordic Curls (full range)",
        expert: "Weighted Nordic Curls",
      },
      "Box Jumps": {
        beginner: 'Step-ups (6" box)',
        intermediate: 'Box Jumps (12" box)',
        advanced: 'Box Jumps (18" box)',
        expert: 'Box Jumps (24"+ box)',
      },
      "Sprint Work": {
        indoor: "Treadmill intervals",
        outdoor: "Track sprints",
        limited: "Wall sprints + first step drills",
        weather: "Indoor acceleration drills",
      },
    };
  }

  // Get exercise variation based on user level and conditions
  getExerciseVariation(
    exerciseName,
    userLevel = "intermediate",
    conditions = {},
  ) {
    const variations = this.exerciseVariations[exerciseName];
    if (!variations) return exerciseName;

    // Check for condition-specific variations first
    if (conditions.indoor && variations.indoor) return variations.indoor;
    if (conditions.limitedSpace && variations.limited)
      return variations.limited;
    if (conditions.badWeather && variations.weather) return variations.weather;

    // Return level-appropriate variation
    return variations[userLevel] || exerciseName;
  }

  // Track workout completion
  completeWorkout(weekNumber, day, exerciseData = {}) {
    if (!this.userProgress.completedWorkouts) {
      this.userProgress.completedWorkouts = {};
    }

    const workoutKey = `week${weekNumber}_${day}`;
    this.userProgress.completedWorkouts[workoutKey] = {
      completedAt: new Date().toISOString(),
      exercises: exerciseData,
      week: weekNumber,
      day: day,
      phase: this.getPhaseForWeek(weekNumber),
    };

    this.saveUserProgress();
    return this.userProgress.completedWorkouts[workoutKey];
  }

  // Get workout completion status
  getWorkoutStatus(weekNumber, day) {
    const workoutKey = `week${weekNumber}_${day}`;
    return this.userProgress.completedWorkouts?.[workoutKey] || null;
  }

  // Calculate completion percentage for phase/program
  getCompletionStats() {
    const totalWorkouts = 14 * 6; // 14 weeks × 6 training days
    const completedCount = Object.keys(
      this.userProgress.completedWorkouts || {},
    ).length;

    return {
      totalWorkouts,
      completedCount,
      percentComplete: Math.round((completedCount / totalWorkouts) * 100),
      currentStreak: this.calculateCurrentStreak(),
      longestStreak: this.calculateLongestStreak(),
    };
  }

  calculateCurrentStreak() {
    // Implementation for calculating current consecutive workout streak
    return 0; // Simplified for now
  }

  calculateLongestStreak() {
    // Implementation for calculating longest consecutive workout streak
    return 0; // Simplified for now
  }

  // Performance testing integration
  schedulePerformanceTest(weekNumber) {
    const testWeeks = [4, 7, 11, 14]; // End of each phase + final
    return testWeeks.includes(weekNumber);
  }

  getPerformanceTests(weekNumber) {
    if (!this.schedulePerformanceTest(weekNumber)) return [];

    const phase = this.getPhaseForWeek(weekNumber);
    const tests = {
      foundation: [
        "40-Yard Sprint",
        "Vertical Jump",
        "Broad Jump",
        "Nordic Curl Max",
      ],
      strength: [
        "40-Yard Sprint",
        "Vertical Jump",
        "Broad Jump",
        "Pro-Agility",
      ],
      power: [
        "40-Yard Sprint",
        "Vertical Jump",
        "Broad Jump",
        "Pro-Agility",
        "L-Drill",
      ],
      competition: ["Complete Assessment Battery"],
    };

    return tests[phase] || [];
  }

  // Workout customization based on available equipment/space
  customizeWorkout(weekData, constraints = {}) {
    const customized = this.cloneWeekData(weekData);

    Object.keys(customized.days).forEach((day) => {
      const dayData = customized.days[day];
      if (dayData.blocks) {
        dayData.blocks.forEach((block) => {
          if (block.exercises) {
            block.exercises = block.exercises.map((exercise) => {
              return this.adaptExerciseToConstraints(exercise, constraints);
            });
          }
        });
      }
    });

    return customized;
  }

  adaptExerciseToConstraints(exercise, constraints) {
    const adapted = { ...exercise };

    // No equipment modifications
    if (constraints.noEquipment) {
      adapted.name = this.getBodyweightAlternative(exercise.name);
      adapted.load = "Bodyweight";
    }

    // Limited space modifications
    if (constraints.limitedSpace) {
      if (this.isSprintExercise(exercise)) {
        adapted.name = "Wall Sprints";
        adapted.distance = "10s max effort";
      }
    }

    // Indoor only modifications
    if (constraints.indoorOnly) {
      adapted.name = this.getIndoorAlternative(exercise.name);
    }

    return adapted;
  }

  getBodyweightAlternative(exerciseName) {
    const alternatives = {
      "Back Squats": "Bodyweight Squats",
      "Barbell RDLs": "Single-Leg RDLs",
      "Hip Thrusts": "Glute Bridges",
      "Box Jumps": "Jump Squats",
      "Medicine Ball Slams": "Burpees",
    };

    return alternatives[exerciseName] || exerciseName;
  }

  getIndoorAlternative(exerciseName) {
    const alternatives = {
      "Hill Sprints": "Treadmill Incline Runs",
      "Flying Sprints": "Treadmill Intervals",
      "Outdoor Tempo": "Treadmill Tempo",
      "Resisted Sprints": "Wall Sprints",
    };

    return alternatives[exerciseName] || exerciseName;
  }

  // User progress data management
  loadUserProgress() {
    try {
      const saved = localStorage.getItem("flagfit_training_progress");
      return saved ? JSON.parse(saved) : this.getDefaultProgress();
    } catch (error) {
      console.error("Error loading user progress:", error);
      return this.getDefaultProgress();
    }
  }

  saveUserProgress() {
    try {
      localStorage.setItem(
        "flagfit_training_progress",
        JSON.stringify(this.userProgress),
      );
    } catch (error) {
      console.error("Error saving user progress:", error);
    }
  }

  getDefaultProgress() {
    return {
      programStartDate: this.programStartDate.toISOString(),
      currentWeek: 1,
      completedWorkouts: {},
      performanceTests: {},
      personalRecords: {},
      injuryLog: [],
      preferences: {
        equipment: ["full-gym"],
        space: "indoor-and-outdoor",
        experience: "intermediate",
      },
    };
  }

  // Reset progress (for testing or restarting program)
  resetProgress() {
    this.userProgress = this.getDefaultProgress();
    this.saveUserProgress();
    return this.userProgress;
  }

  // Get next workout recommendation
  getNextWorkout() {
    const status = this.getProgramStatus();
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayNames = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const currentDay = dayNames[today];

    const weekData = this.getWeekData(status.currentWeek);
    const todaysWorkout = weekData.days[currentDay];

    return {
      week: status.currentWeek,
      day: currentDay,
      workout: todaysWorkout,
      isCompleted: !!this.getWorkoutStatus(status.currentWeek, currentDay),
      isTestWeek: this.schedulePerformanceTest(status.currentWeek),
      recommendedTests: this.getPerformanceTests(status.currentWeek),
    };
  }
}

// Create singleton instance
export const trainingEngine = new TrainingProgramEngine();

export default trainingEngine;
