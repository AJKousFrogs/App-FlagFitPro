export interface TrainingVideo {
  id: string;
  title: string;
  description: string;
  url: string;
  platform: "youtube" | "vimeo" | "custom";
  thumbnailUrl?: string;
  duration: number;
  positions: FlagPosition[];
  trainingFocus: TrainingFocus[];
  skillLevel: SkillLevel;
  phase: TrainingPhase[];
  equipment: Equipment[];
  muscleGroups: string[];
  drillTypes: DrillType[];
  tags: string[];
  rating: number;
  views?: number;
  addedDate: string;
  source: VideoSource;
  isPlaylist: boolean;
  playlistVideos?: number;
  visibilityType?: VideoVisibilityType;
  targetPlayerId?: string | null;
  assignedBy?: string | null;
  assignmentNotes?: string | null;
  assignmentDate?: string | null;
  affectsPeriodization?: boolean;
  estimatedLoad?: number;
  dueDate?: string | null;
  completionStatus?: VideoCompletionStatus;
  completedAt?: string | null;
  createdBy?: string | null;
}

export type VideoVisibilityType = "public" | "private" | "assigned";

export type VideoCompletionStatus = "pending" | "completed" | "skipped";

export type FlagPosition =
  | "QB"
  | "WR"
  | "Center"
  | "DB"
  | "Rusher"
  | "LB"
  | "Hybrid"
  | "All";

export type TrainingFocus =
  | "speed"
  | "agility"
  | "strength"
  | "power"
  | "skills"
  | "throwing"
  | "catching"
  | "route_running"
  | "coverage"
  | "rushing"
  | "recovery"
  | "mobility"
  | "injury_prevention"
  | "conditioning"
  | "mental"
  | "plyometrics"
  | "isometrics"
  | "reactive_eccentrics"
  | "deceleration"
  | "acceleration"
  | "twitches"
  | "explosive_power";

export type SkillLevel = "beginner" | "intermediate" | "advanced" | "all";

export type TrainingPhase =
  | "off_season"
  | "pre_season"
  | "in_season"
  | "tournament_prep"
  | "recovery"
  | "all";

export type Equipment =
  | "none"
  | "cones"
  | "ladder"
  | "bands"
  | "weights"
  | "sled"
  | "football"
  | "partner"
  | "field";

export type DrillType =
  | "warm_up"
  | "sprint"
  | "agility"
  | "plyometric"
  | "strength"
  | "skill"
  | "conditioning"
  | "cool_down"
  | "mobility"
  | "prehab";

export interface VideoSource {
  channel: string;
  channelUrl?: string;
  credibility: "professional" | "coach" | "athlete" | "trainer" | "community";
}

export interface TrainingSession {
  id: string;
  name: string;
  description: string;
  totalDuration: number;
  position: FlagPosition;
  focus: TrainingFocus[];
  phase: TrainingPhase;
  skillLevel: SkillLevel;
  videos: SessionVideo[];
  restBetweenVideos: number;
  weeklyFrequency: string;
  notes: string[];
}

export interface SessionVideo {
  videoId: string;
  order: number;
  sets?: number;
  reps?: string;
  duration?: number;
  notes?: string;
}

export interface WeeklyPlan {
  id: string;
  name: string;
  description: string;
  position: FlagPosition;
  teamPracticesPerWeek: number;
  additionalSessionsRecommended: number;
  sessions: WeeklySession[];
  totalWeeklyMinutes: number;
  goals: string[];
}

export interface WeeklySession {
  day: string;
  type: "team_practice" | "individual" | "recovery" | "rest";
  sessionId?: string;
  duration: number;
  focus: string;
}

export type WorkScheduleType =
  | "early_bird"
  | "standard"
  | "late_starter"
  | "shift_worker"
  | "student"
  | "remote_worker";

export interface AthleteScheduleProfile {
  scheduleType: WorkScheduleType;
  workStartTime: string;
  workEndTime: string;
  practiceDay: string;
  practiceTime: "morning" | "evening";
  preferredMobilityTime: "morning" | "evening" | "split";
  availableMinutesPerDay: number;
}

export interface DailyRoutineRecommendation {
  scheduleType: WorkScheduleType;
  morning: {
    routine: string;
    videoId: string;
    duration: number;
    bestTime: string;
    description: string;
  } | null;
  evening: {
    routine: string;
    videoId: string;
    duration: number;
    bestTime: string;
    description: string;
  } | null;
  afterPractice: {
    routine: string;
    videoId: string;
    duration: number;
    description: string;
  } | null;
  totalDailyMinutes: number;
  notes: string[];
}
