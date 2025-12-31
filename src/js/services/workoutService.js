/**
 * Workout Service
 * Manages workout templates, exercises, and workout creation
 */

// Workout exercise templates
const WORKOUT_EXERCISES = {
  speed: [
    { name: "40-yard dash", sets: 5, reps: 1, rest: "2 min" },
    { name: "Cone sprints", sets: 3, reps: 8, rest: "90 sec" },
    { name: "Ladder drills", sets: 4, reps: 1, rest: "60 sec" },
  ],
  strength: [
    { name: "Squats", sets: 4, reps: 12, rest: "90 sec" },
    { name: "Push-ups", sets: 3, reps: 15, rest: "60 sec" },
    { name: "Burpees", sets: 3, reps: 10, rest: "90 sec" },
  ],
  agility: [
    { name: "5-10-5 shuttle", sets: 4, reps: 3, rest: "2 min" },
    { name: "Cone weaves", sets: 3, reps: 5, rest: "90 sec" },
    { name: "T-drill", sets: 3, reps: 3, rest: "2 min" },
  ],
  endurance: [
    { name: "Jog", sets: 1, reps: "20 min", rest: "none" },
    { name: "High knees", sets: 3, reps: "30 sec", rest: "30 sec" },
    { name: "Mountain climbers", sets: 3, reps: 20, rest: "45 sec" },
  ],
};

// Workout templates metadata
const WORKOUT_TEMPLATES = {
  speed: {
    id: "speed",
    type: "speed",
    title: "Speed Training",
    description: "Sprint intervals and agility drills",
    duration: 45,
    intensity: "high",
    environment: "Track required",
    icon: "🏃",
    color: "var(--speed-training)",
  },
  strength: {
    id: "strength",
    type: "strength",
    title: "Strength Training",
    description: "Core and functional strength",
    duration: 60,
    intensity: "medium",
    environment: "Gym access",
    icon: "💪",
    color: "var(--strength-training)",
  },
  agility: {
    id: "agility",
    type: "agility",
    title: "Agility Training",
    description: "Cone drills and quick movements",
    duration: 30,
    intensity: "medium",
    environment: "Field access",
    icon: "🤸",
    color: "var(--agility-training)",
  },
  endurance: {
    id: "endurance",
    type: "endurance",
    title: "Endurance Training",
    description: "Cardio and stamina building",
    duration: 50,
    intensity: "low",
    environment: "Anywhere",
    icon: "❤️",
    color: "var(--endurance-training)",
  },
};

class WorkoutService {
  /**
   * Get exercises for a workout type
   * @param {string} type - Workout type (speed, strength, agility, endurance)
   * @returns {Array} Array of exercise objects
   */
  getExercisesForType(type) {
    return WORKOUT_EXERCISES[type] || WORKOUT_EXERCISES.speed;
  }

  /**
   * Get workout template metadata
   * @param {string} type - Workout type
   * @returns {Object} Workout template object
   */
  getWorkoutTemplate(type) {
    return WORKOUT_TEMPLATES[type] || WORKOUT_TEMPLATES.speed;
  }

  /**
   * Get all workout templates
   * @returns {Array} Array of all workout templates
   */
  getAllWorkoutTemplates() {
    return Object.values(WORKOUT_TEMPLATES);
  }

  /**
   * Create a new workout session
   * @param {string} type - Workout type
   * @param {Date|string} date - Optional date for the workout (defaults to now)
   * @returns {Object} Workout session object
   */
  createSession(type, date = null) {
    const template = this.getWorkoutTemplate(type);
    const exercises = this.getExercisesForType(type);

    return {
      id: Date.now(),
      type,
      date: date
        ? date instanceof Date
          ? date.toISOString()
          : date
        : new Date().toISOString(),
      startTime: new Date().toISOString(),
      status: "active",
      exercises: exercises.map((ex) => ({ ...ex, completed: false })),
      template,
    };
  }

  /**
   * Get workout metadata string for display
   * @param {string} type - Workout type
   * @returns {string} Formatted metadata string
   */
  getWorkoutMeta(type) {
    const template = this.getWorkoutTemplate(type);
    const intensityEmoji = {
      high: "🔥",
      medium: "🔥",
      low: "💧",
    };
    const intensityText = {
      high: "High intensity",
      medium: "Medium intensity",
      low: "Low intensity",
    };
    return `⏱️ ${template.duration} min • ${intensityEmoji[template.intensity]} ${intensityText[template.intensity]}`;
  }

  /**
   * Validate workout type
   * @param {string} type - Workout type to validate
   * @returns {boolean} True if valid
   */
  isValidWorkoutType(type) {
    return Object.keys(WORKOUT_TEMPLATES).includes(type);
  }
}

// Export singleton instance
export const workoutService = new WorkoutService();
