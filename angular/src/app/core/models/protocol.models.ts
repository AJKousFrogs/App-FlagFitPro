/**
 * Daily exercise protocol — the EXERCISE-REALIZATION layer (daily-protocol.js),
 * rendered under the periodization intent. Types are intentionally loose/defensive:
 * the server owns the shape, the client only reads a subset to render a list.
 */

export interface ProtocolExercise {
  exercise?: {
    name?: string;
    slug?: string;
    category?: string;
    videoId?: string | null;
    howText?: string | null;
    feelText?: string | null;
    thumbnailUrl?: string | null;
  } | null;
  prescribedSets?: number | null;
  prescribedReps?: number | null;
  prescribedHoldSeconds?: number | null;
  prescribedDurationSeconds?: number | null;
}

export interface ProtocolBlock {
  type: string;
  title: string;
  exercises?: ProtocolExercise[];
  estimatedDurationMinutes?: number | null;
  status?: string;
  completedCount?: number;
  totalCount?: number;
  progressPercent?: number;
}

/** The /api/daily-protocol response `data`. Only the fields the client renders. */
export interface DailyProtocol {
  trainingFocus?: string;
  /** True for return-to-play protocols (training_focus = return_to_play_phase_N). */
  is_return_to_play?: boolean;
  morningMobility?: ProtocolBlock;
  foamRoll?: ProtocolBlock;
  warmUp?: ProtocolBlock;
  rehabProgression?: ProtocolBlock;
  isometrics?: ProtocolBlock;
  plyometrics?: ProtocolBlock;
  strength?: ProtocolBlock;
  conditioning?: ProtocolBlock;
  skillDrills?: ProtocolBlock;
  mainSession?: ProtocolBlock;
  coolDown?: ProtocolBlock;
  eveningRecovery?: ProtocolBlock;
  eveningMobility?: ProtocolBlock;
}

/** Render order of the blocks (only those with exercises are shown). */
export const PROTOCOL_BLOCK_ORDER: (keyof DailyProtocol)[] = [
  "morningMobility",
  "foamRoll",
  "warmUp",
  "rehabProgression",
  "isometrics",
  "plyometrics",
  "strength",
  "conditioning",
  "skillDrills",
  "mainSession",
  "coolDown",
  "eveningRecovery",
  "eveningMobility",
];
