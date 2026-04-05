import {
  Achievement,
  TrainingDataResult,
  TrainingStatCard,
  WeeklyScheduleDay,
  Workout,
} from "../models/training.models";
import { TrainingSessionRecord } from "../models/api.models";
import { mergeWeeklyScheduleWithLoggedSessions } from "./unified-training-transforms";

interface WellnessTrainingDataLike {
  alert: TrainingDataResult["wellnessData"]["alert"];
  readinessScore: TrainingDataResult["wellnessData"]["readinessScore"];
  readinessStatus: TrainingDataResult["wellnessData"]["readinessStatus"];
}

interface LoadUnifiedTrainingDataParams {
  userId: string;
  loadProgramAssignment: () => void;
  loadTrainingSessions: (userId: string) => Promise<TrainingSessionRecord[]>;
  loadWeeklySchedule: (userId: string) => Promise<WeeklyScheduleDay[]>;
  loadAvailableWorkouts: () => Promise<Workout[]>;
  checkWellnessForTraining: (userId: string) => Promise<WellnessTrainingDataLike>;
  calculateTrainingStats: (
    sessions: TrainingSessionRecord[],
  ) => TrainingStatCard[];
  calculateTrainingStreak: (
    sessions: TrainingSessionRecord[],
  ) => number;
  loadAchievements: (
    userId: string,
    streak: number,
    total: number,
  ) => Achievement[];
  getUserDisplayName: (userId: string) => Promise<string>;
}

export function getUnifiedTrainingFallbackData(): TrainingDataResult {
  return {
    stats: [],
    schedule: [],
    workouts: [],
    achievements: [],
    wellnessData: {
      alert: null,
      readinessScore: null,
      readinessStatus: "unknown",
    },
    userName: "Athlete",
    lastRefresh: new Date(),
  };
}

export async function loadUnifiedTrainingData({
  userId,
  loadProgramAssignment,
  loadTrainingSessions,
  loadWeeklySchedule,
  loadAvailableWorkouts,
  checkWellnessForTraining,
  calculateTrainingStats,
  calculateTrainingStreak,
  loadAchievements,
  getUserDisplayName,
}: LoadUnifiedTrainingDataParams): Promise<TrainingDataResult> {
  loadProgramAssignment();

  const [sessions, schedule, workouts, wellnessData] = await Promise.all([
    loadTrainingSessions(userId),
    loadWeeklySchedule(userId),
    loadAvailableWorkouts(),
    checkWellnessForTraining(userId),
  ]);

  const mergedSchedule = mergeWeeklyScheduleWithLoggedSessions(
    schedule,
    sessions,
  );

  const stats = calculateTrainingStats(sessions);
  const streak = calculateTrainingStreak(sessions);
  const achievements = loadAchievements(userId, streak, sessions.length);
  const userName = await getUserDisplayName(userId);

  return {
    stats,
    schedule: mergedSchedule,
    workouts,
    achievements,
    wellnessData,
    userName,
    lastRefresh: new Date(),
  };
}
