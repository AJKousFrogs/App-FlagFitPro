/**
 * Protocol API Response Mapper
 *
 * Maps API responses (camelCase) from daily-protocol endpoints to
 * DailyProtocol and ProtocolBlock formats used by the frontend.
 *
 * Extracted from TodayComponent to improve maintainability and testability.
 */

import type {
  BlockType,
  DailyProtocol,
  ExerciseCategory,
  PrescribedExercise,
  ProtocolBlock,
} from "../../training/daily-protocol/daily-protocol.models";

/** API exercise structure from backend (camelCase) */
export interface ApiExercise {
  id?: string;
  exerciseId?: string;
  exercise?: {
    id?: string;
    name?: string;
    slug?: string;
    category?: ExerciseCategory;
    videoUrl?: string;
    videoId?: string;
    howText?: string;
    defaultSets?: number;
    difficultyLevel?: "beginner" | "intermediate" | "advanced";
    loadContributionAu?: number;
    isHighIntensity?: boolean;
  };
  name?: string;
  slug?: string;
  category?: ExerciseCategory;
  videoUrl?: string;
  videoId?: string;
  howText?: string;
  aiNote?: string;
  prescribedSets?: number;
  prescribedReps?: number;
  prescribedHoldSeconds?: number;
  prescribedDurationSeconds?: number;
  sequenceOrder?: number;
  status?: string;
  loadContributionAu?: number;
  isHighIntensity?: boolean;
}

/** API block structure from backend */
export interface ApiProtocolBlock {
  type?: string;
  title?: string;
  icon?: string;
  status?: string;
  exercises?: ApiExercise[];
  completedCount?: number;
  totalCount?: number;
  estimatedDurationMinutes?: number;
  [key: string]: unknown;
}

/** Full API response shape for daily protocol (camelCase keys) */
export interface ProtocolApiResponse {
  id?: string;
  date?: string;
  readinessScore?: number | null;
  acwrValue?: number | null;
  trainingFocus?: string;
  confidenceMetadata?: unknown;
  morningMobility?: ApiProtocolBlock;
  foamRoll?: ApiProtocolBlock;
  warmUp?: ApiProtocolBlock;
  isometrics?: ApiProtocolBlock;
  plyometrics?: ApiProtocolBlock;
  strength?: ApiProtocolBlock;
  conditioning?: ApiProtocolBlock;
  skillDrills?: ApiProtocolBlock;
  mainSession?: ApiProtocolBlock;
  coolDown?: ApiProtocolBlock;
  eveningRecovery?: ApiProtocolBlock;
  [key: string]: unknown;
}

function createEmptyBlock(
  type: string,
  title: string,
  icon: string,
): ProtocolBlock {
  return {
    type: type as BlockType,
    title,
    icon,
    status: "pending",
    exercises: [],
    completedCount: 0,
    totalCount: 0,
    progressPercent: 0,
  };
}

function mapExerciseToPrescribed(
  ex: ApiExercise,
  blockType: string,
  index: number,
): PrescribedExercise {
  const fallbackId = `${blockType}-${index}`;
  const baseId = ex.id || fallbackId;
  const baseName = ex.name || "Exercise";
  const baseSlug = ex.slug || baseName.toLowerCase().replace(/\s+/g, "-");
  const nestedExercise = ex.exercise;

  const exercise = nestedExercise
    ? {
        ...nestedExercise,
        id: nestedExercise.id || baseId,
        name: nestedExercise.name || baseName,
        slug: nestedExercise.slug || baseSlug,
        category: (nestedExercise.category || blockType) as ExerciseCategory,
        howText: nestedExercise.howText || ex.howText || ex.aiNote || "",
        defaultSets: nestedExercise.defaultSets || ex.prescribedSets || 1,
        difficultyLevel: nestedExercise.difficultyLevel || "intermediate",
        loadContributionAu:
          nestedExercise.loadContributionAu || ex.loadContributionAu || 0,
        isHighIntensity:
          nestedExercise.isHighIntensity ?? ex.isHighIntensity ?? false,
      }
    : {
        id: baseId,
        name: baseName,
        slug: baseSlug,
        category: (ex.category || blockType) as ExerciseCategory,
        videoUrl: ex.videoUrl,
        videoId: ex.videoId,
        howText: ex.howText || ex.aiNote || "",
        defaultSets: ex.prescribedSets || 1,
        difficultyLevel: "intermediate" as const,
        loadContributionAu: ex.loadContributionAu || 0,
        isHighIntensity: ex.isHighIntensity || false,
      };

  return {
    id: baseId,
    exerciseId: ex.exerciseId || baseId,
    exercise,
    blockType: blockType as BlockType,
    sequenceOrder: ex.sequenceOrder ?? index + 1,
    prescribedSets: ex.prescribedSets || 1,
    prescribedReps: ex.prescribedReps,
    prescribedHoldSeconds: ex.prescribedHoldSeconds,
    prescribedDurationSeconds: ex.prescribedDurationSeconds,
    aiNote: ex.aiNote,
    status: ex.status === "complete" ? "complete" : "pending",
    loadContributionAu: ex.loadContributionAu || 0,
  };
}

function getBlock(
  data: ProtocolApiResponse,
  blockKey: string,
  blockType: string,
  title: string,
  icon: string,
): ProtocolBlock {
  const apiBlock = data[blockKey] as ApiProtocolBlock | undefined;

  if (!apiBlock || !apiBlock.exercises || apiBlock.exercises.length === 0) {
    return createEmptyBlock(blockType, title, icon);
  }

  const exercises: PrescribedExercise[] = apiBlock.exercises.map(
    (ex, index) => mapExerciseToPrescribed(ex, blockType, index),
  );

  const completedCount = exercises.filter((e) => e.status === "complete").length;
  const totalCount = exercises.length;

  return {
    type: blockType as BlockType,
    title: typeof apiBlock.title === "string" ? apiBlock.title : title,
    icon: typeof apiBlock.icon === "string" ? apiBlock.icon : icon,
    status:
      completedCount === totalCount && totalCount > 0
        ? "complete"
        : completedCount > 0
          ? "in_progress"
          : "pending",
    exercises,
    completedCount,
    totalCount,
    progressPercent:
      totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
    estimatedDurationMinutes:
      typeof apiBlock.estimatedDurationMinutes === "number"
        ? apiBlock.estimatedDurationMinutes
        : undefined,
  };
}

/** Block key to config mapping */
const BLOCK_CONFIGS: Array<{
  key: string;
  type: string;
  title: string;
  icon: string;
}> = [
  { key: "morningMobility", type: "morning_mobility", title: "Morning Mobility", icon: "pi-sun" },
  { key: "foamRoll", type: "foam_roll", title: "Foam Rolling", icon: "pi-circle" },
  { key: "warmUp", type: "warm_up", title: "Warm-Up (25 min)", icon: "pi-bolt" },
  { key: "isometrics", type: "isometrics", title: "Isometrics (15 min)", icon: "pi-pause-circle" },
  { key: "plyometrics", type: "plyometrics", title: "Plyometrics (15 min)", icon: "pi-arrow-up" },
  { key: "strength", type: "strength", title: "Strength (15 min)", icon: "pi-heart" },
  { key: "conditioning", type: "conditioning", title: "Conditioning (15 min)", icon: "pi-directions-run" },
  { key: "skillDrills", type: "skill_drills", title: "Skill Drills (15 min)", icon: "pi-bolt" },
  { key: "mainSession", type: "main_session", title: "Main Session", icon: "pi-play" },
  { key: "coolDown", type: "cool_down", title: "Cool-Down (15 min)", icon: "pi-stop" },
  { key: "eveningRecovery", type: "evening_recovery", title: "Evening Recovery", icon: "pi-moon" },
];

/**
 * Map API response to DailyProtocol structure with full block data
 */
export function mapToDailyProtocol(
  data: ProtocolApiResponse,
): Partial<DailyProtocol> {
  const blocks = BLOCK_CONFIGS.map((c) =>
    getBlock(data, c.key, c.type, c.title, c.icon),
  );

  const allBlocks = {
    morningMobility: blocks[0],
    foamRoll: blocks[1],
    warmUp: blocks[2],
    isometrics: blocks[3],
    plyometrics: blocks[4],
    strength: blocks[5],
    conditioning: blocks[6],
    skillDrills: blocks[7],
    mainSession: blocks[8],
    coolDown: blocks[9],
    eveningRecovery: blocks[10],
  };

  const totalExercises = blocks.reduce((sum, b) => sum + b.totalCount, 0);
  const completedExercises = blocks.reduce((sum, b) => sum + b.completedCount, 0);

  return {
    id: data.id,
    protocolDate: data.date,
    readinessScore: data.readinessScore ?? undefined,
    acwrValue: data.acwrValue ?? undefined,
    trainingFocus:
      typeof data.trainingFocus === "string" ? data.trainingFocus : undefined,
    ...allBlocks,
    overallProgress:
      totalExercises > 0
        ? Math.round((completedExercises / totalExercises) * 100)
        : 0,
    completedExercises,
    totalExercises,
  };
}
