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
import { resolveYouTubeVideoMetadata } from "../../../shared/utils/youtube-video.utils";

/** API exercise structure from backend (camelCase) */
export interface ApiExercise {
  id?: string;
  exerciseId?: string;
  exercise_name?: string;
  exerciseName?: string;
  exercise?: {
    id?: string;
    name?: string;
    exercise_name?: string;
    exerciseName?: string;
    slug?: string;
    category?: ExerciseCategory;
    videoUrl?: string;
    videoId?: string;
    videoDurationSeconds?: number;
    thumbnailUrl?: string;
    video_url?: string;
    video_id?: string;
    video_duration_seconds?: number;
    thumbnail_url?: string;
    howText?: string;
    how_text?: string;
    defaultSets?: number;
    default_sets?: number;
    difficultyLevel?: "beginner" | "intermediate" | "advanced";
    difficulty_level?: "beginner" | "intermediate" | "advanced";
    loadContributionAu?: number;
    load_contribution_au?: number;
    isHighIntensity?: boolean;
    is_high_intensity?: boolean;
  };
  name?: string;
  slug?: string;
  category?: ExerciseCategory;
  videoUrl?: string;
  videoId?: string;
  videoDurationSeconds?: number;
  thumbnailUrl?: string;
  video_url?: string;
  video_id?: string;
  video_duration_seconds?: number;
  thumbnail_url?: string;
  howText?: string;
  how_text?: string;
  aiNote?: string;
  ai_note?: string;
  prescribedSets?: number;
  prescribedReps?: number;
  prescribedHoldSeconds?: number;
  prescribedDurationSeconds?: number;
  prescribed_sets?: number;
  prescribed_reps?: number;
  prescribed_hold_seconds?: number;
  prescribed_duration_seconds?: number;
  sequenceOrder?: number;
  sequence_order?: number;
  status?: string;
  loadContributionAu?: number;
  load_contribution_au?: number;
  isHighIntensity?: boolean;
  is_high_intensity?: boolean;
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
  protocol_date?: string;
  readinessScore?: number | null;
  readiness_score?: number | null;
  acwrValue?: number | null;
  acwr_value?: number | null;
  acwr_presentation?: {
    value?: number | null;
    level?:
      | "sweet-spot"
      | "under-training"
      | "elevated-risk"
      | "danger-zone"
      | "no-data";
    label?: string | null;
    text?: string | null;
  };
  trainingFocus?: string;
  training_focus?: string;
  confidenceMetadata?: unknown;
  confidence_metadata?: unknown;
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
  const nestedExercise = ex.exercise;
  const baseName =
    ex.exercise_name ||
    ex.exerciseName ||
    nestedExercise?.exercise_name ||
    nestedExercise?.exerciseName ||
    nestedExercise?.name ||
    ex.name ||
    "Exercise";
  const baseSlug = ex.slug || baseName.toLowerCase().replace(/\s+/g, "-");
  const video = resolveYouTubeVideoMetadata({
    videoId:
      nestedExercise?.videoId ||
      nestedExercise?.video_id ||
      ex.videoId ||
      ex.video_id,
    videoUrl:
      nestedExercise?.videoUrl ||
      nestedExercise?.video_url ||
      ex.videoUrl ||
      ex.video_url,
    thumbnailUrl:
      nestedExercise?.thumbnailUrl ||
      nestedExercise?.thumbnail_url ||
      ex.thumbnailUrl ||
      ex.thumbnail_url,
    exerciseName: baseName,
  });

  const exercise = nestedExercise
    ? {
        ...nestedExercise,
        id: nestedExercise.id || baseId,
        name:
          nestedExercise.name ||
          nestedExercise.exercise_name ||
          nestedExercise.exerciseName ||
          baseName,
        slug: nestedExercise.slug || baseSlug,
        category: (nestedExercise.category || blockType) as ExerciseCategory,
        videoUrl: video.videoUrl || undefined,
        videoId: video.videoId || undefined,
        thumbnailUrl: video.thumbnailUrl || undefined,
        videoDurationSeconds:
          nestedExercise.videoDurationSeconds ||
          nestedExercise.video_duration_seconds ||
          ex.videoDurationSeconds ||
          ex.video_duration_seconds,
        howText:
          nestedExercise.howText ||
          nestedExercise.how_text ||
          ex.howText ||
          ex.how_text ||
          ex.aiNote ||
          ex.ai_note ||
          "",
        defaultSets:
          nestedExercise.defaultSets ||
          nestedExercise.default_sets ||
          ex.prescribedSets ||
          ex.prescribed_sets ||
          1,
        difficultyLevel:
          nestedExercise.difficultyLevel ||
          nestedExercise.difficulty_level ||
          "intermediate",
        loadContributionAu:
          nestedExercise.loadContributionAu ||
          nestedExercise.load_contribution_au ||
          ex.loadContributionAu ||
          ex.load_contribution_au ||
          0,
        isHighIntensity:
          nestedExercise.isHighIntensity ??
          nestedExercise.is_high_intensity ??
          ex.isHighIntensity ??
          ex.is_high_intensity ??
          false,
      }
    : {
        id: baseId,
        name: baseName,
        slug: baseSlug,
        category: (ex.category || blockType) as ExerciseCategory,
        videoUrl: video.videoUrl || undefined,
        videoId: video.videoId || undefined,
        thumbnailUrl: video.thumbnailUrl || undefined,
        videoDurationSeconds: ex.videoDurationSeconds || ex.video_duration_seconds,
        howText: ex.howText || ex.how_text || ex.aiNote || ex.ai_note || "",
        defaultSets: ex.prescribedSets || ex.prescribed_sets || 1,
        difficultyLevel: "intermediate" as const,
        loadContributionAu: ex.loadContributionAu || ex.load_contribution_au || 0,
        isHighIntensity: ex.isHighIntensity || ex.is_high_intensity || false,
      };

  return {
    id: baseId,
    exerciseId: ex.exerciseId || baseId,
    exercise,
    blockType: blockType as BlockType,
    sequenceOrder: ex.sequenceOrder ?? ex.sequence_order ?? index + 1,
    prescribedSets: ex.prescribedSets || ex.prescribed_sets || 1,
    prescribedReps: ex.prescribedReps || ex.prescribed_reps,
    prescribedHoldSeconds:
      ex.prescribedHoldSeconds || ex.prescribed_hold_seconds,
    prescribedDurationSeconds:
      ex.prescribedDurationSeconds || ex.prescribed_duration_seconds,
    aiNote: ex.aiNote || ex.ai_note,
    status: ex.status === "complete" ? "complete" : "pending",
    loadContributionAu: ex.loadContributionAu || ex.load_contribution_au || 0,
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
const BLOCK_CONFIGS: {
  key: string;
  type: string;
  title: string;
  icon: string;
}[] = [
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
    protocolDate: data.date || data.protocol_date,
    readinessScore: data.readinessScore ?? data.readiness_score ?? undefined,
    acwrValue: data.acwrValue ?? data.acwr_value ?? undefined,
    trainingFocus:
      typeof data.trainingFocus === "string"
        ? data.trainingFocus
        : typeof data.training_focus === "string"
          ? data.training_focus
          : undefined,
    ...allBlocks,
    overallProgress:
      totalExercises > 0
        ? Math.round((completedExercises / totalExercises) * 100)
        : 0,
    completedExercises,
    totalExercises,
  };
}
