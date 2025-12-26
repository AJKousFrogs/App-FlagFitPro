/**
 * Training Data Module - Re-exports for backward compatibility
 * 
 * ⚠️ DEPRECATION NOTICE:
 * These static JS exports are DEPRECATED as of December 2025.
 * 
 * The training program data has been migrated to the database and should be
 * fetched via the TrainingProgramService in Angular:
 * 
 *   import { TrainingProgramService } from '@core/services/training-program.service';
 *   
 *   // In your component:
 *   const programService = inject(TrainingProgramService);
 *   await programService.fetchFullProgram('program-id');
 * 
 * Or via the API endpoint:
 *   GET /api/training-programs?id={programId}&full=true
 * 
 * Benefits of database approach:
 * - Single source of truth
 * - Easy updates without code changes
 * - Better data consistency
 * - Supports multiple programs (WR/DB, QB, etc.)
 * 
 * These exports will be removed in a future version.
 */

export { TRAINING_PROGRAM, default } from "./training-program.js";
export { WEEKLY_SCHEDULES } from "./weekly-schedules.js";
export { ANNUAL_TRAINING_PROGRAM } from "./annual-training-program.js";
export { EXERCISE_LIBRARY } from "./exercise-library.js";
export { PERFORMANCE_TESTS } from "./performance-tests.js";
// NUTRITION_GUIDELINES removed - unused export
