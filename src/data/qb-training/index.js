/**
 * ⚠️ DEPRECATED: QB Training Data Module
 * 
 * This entire module is deprecated. All QB training data should be
 * fetched from the database via TrainingProgramService or API.
 * 
 * See /src/data/qb-training/DEPRECATED.md for migration guide.
 * This module will be removed in Q2 2026.
 * 
 * @deprecated Use database via TrainingProgramService or API
 */

export { QB_TRAINING_PROGRAM, default } from "./qb-training-program.js";
export { QB_EXERCISE_LIBRARY } from "./qb-exercise-library.js";
export { QB_ASSESSMENTS } from "./qb-assessments.js";
// TOURNAMENT_SIMULATION removed - unused export
// QB_WEEKLY_SCHEDULES removed - unused export
