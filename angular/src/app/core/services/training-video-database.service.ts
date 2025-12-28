/**
 * Training Video Database Service
 *
 * CURATED VIDEO RESOURCE LIBRARY FOR FLAG FOOTBALL ATHLETES
 *
 * This service provides position-specific training video recommendations
 * from YouTube and other sources, organized by:
 * - Position (QB, WR, DB, Center, Rusher, Hybrid)
 * - Training focus (speed, agility, strength, skills, recovery)
 * - Time available (15min, 30min, 45min, 60min sessions)
 * - Training phase (off-season, pre-season, in-season)
 * - Skill level (beginner, intermediate, advanced)
 *
 * Perfect for athletes with limited team practice (1-2x per week)
 * who need to supplement with individual training.
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 * @lastUpdated December 2024
 */

import { Injectable, signal, computed } from "@angular/core";

// ============================================================================
// INTERFACES
// ============================================================================

export interface TrainingVideo {
  id: string;
  title: string;
  description: string;
  url: string;
  platform: "youtube" | "vimeo" | "custom";
  thumbnailUrl?: string;
  duration: number; // minutes
  positions: FlagPosition[];
  trainingFocus: TrainingFocus[];
  skillLevel: SkillLevel;
  phase: TrainingPhase[];
  equipment: Equipment[];
  muscleGroups: string[];
  drillTypes: DrillType[];
  tags: string[];
  rating: number; // 1-5
  views?: number;
  addedDate: string;
  source: VideoSource;
  isPlaylist: boolean;
  playlistVideos?: number;
  
  // Visibility and assignment fields (from database)
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

// Video visibility types for RLS-based access control
export type VideoVisibilityType = 'public' | 'private' | 'assigned';

// Completion status for assigned videos
export type VideoCompletionStatus = 'pending' | 'completed' | 'skipped';

export type FlagPosition = "QB" | "WR" | "Center" | "DB" | "Rusher" | "LB" | "Hybrid" | "All";
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
export type TrainingPhase = "off_season" | "pre_season" | "in_season" | "tournament_prep" | "recovery" | "all";
export type Equipment = "none" | "cones" | "ladder" | "bands" | "weights" | "sled" | "football" | "partner" | "field";
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
  restBetweenVideos: number; // seconds
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

// ============================================================================
// ATHLETE SCHEDULE TYPES - Different work/life schedules
// ============================================================================

export type WorkScheduleType = 
  | "early_bird"      // Starts work at 6am - prefers evening mobility
  | "standard"        // Starts work at 9am - can do morning mobility
  | "late_starter"    // Starts work late/afternoon - prefers morning mobility
  | "shift_worker"    // Variable shifts - needs flexible options
  | "student"         // Student schedule - flexible
  | "remote_worker";  // Works from home - most flexible

export interface AthleteScheduleProfile {
  scheduleType: WorkScheduleType;
  workStartTime: string; // "06:00", "09:00", etc.
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

// ============================================================================
// SCHEDULE-BASED ROUTINE RECOMMENDATIONS
// ============================================================================

const SCHEDULE_RECOMMENDATIONS: Record<WorkScheduleType, DailyRoutineRecommendation> = {
  early_bird: {
    scheduleType: "early_bird",
    morning: null, // No time for morning routine - starts work at 6am
    evening: {
      routine: "Evening Mobility + Foam Rolling",
      videoId: "mobility_evening",
      duration: 15,
      bestTime: "8:00 PM - 9:00 PM",
      description: "Full mobility routine before bed since no time in morning",
    },
    afterPractice: {
      routine: "Foam Rolling Recovery",
      videoId: "foam_rolling_routine",
      duration: 15,
      description: "Do foam rolling after practice instead of separate evening mobility",
    },
    totalDailyMinutes: 15,
    notes: [
      "Since you start work at 6am, do your mobility in the evening",
      "On practice days: do foam rolling after practice instead of evening mobility",
      "On non-practice days: do evening mobility before bed",
      "Try to get foam rolling done at least 3x per week",
    ],
  },
  standard: {
    scheduleType: "standard",
    morning: {
      routine: "Morning Mobility",
      videoId: "mobility_morning",
      duration: 10,
      bestTime: "6:30 AM - 7:30 AM",
      description: "Wake up routine before work",
    },
    evening: {
      routine: "Foam Rolling",
      videoId: "foam_rolling_routine",
      duration: 15,
      bestTime: "9:00 PM - 10:00 PM",
      description: "Foam rolling before bed for recovery",
    },
    afterPractice: {
      routine: "Foam Rolling Recovery",
      videoId: "foam_rolling_routine",
      duration: 15,
      description: "Replace evening foam rolling with post-practice foam rolling",
    },
    totalDailyMinutes: 25,
    notes: [
      "Morning mobility to wake up the body",
      "Foam rolling before bed for recovery",
      "On practice days: foam rolling after practice replaces evening session",
      "This is the gold standard routine",
    ],
  },
  late_starter: {
    scheduleType: "late_starter",
    morning: {
      routine: "Full Morning Mobility + Foam Rolling",
      videoId: "mobility_morning",
      duration: 25,
      bestTime: "8:00 AM - 10:00 AM",
      description: "Extended morning routine since you have time",
    },
    evening: null, // No evening routine needed - did everything in morning
    afterPractice: {
      routine: "Light Foam Rolling",
      videoId: "foam_rolling_routine",
      duration: 15,
      description: "Quick foam rolling after practice",
    },
    totalDailyMinutes: 25,
    notes: [
      "You have time in the morning - use it!",
      "Do both mobility and foam rolling in the morning",
      "Evening is free for rest and sleep",
      "On practice days: light foam rolling after practice",
    ],
  },
  shift_worker: {
    scheduleType: "shift_worker",
    morning: {
      routine: "Quick Mobility (when available)",
      videoId: "mobility_morning",
      duration: 10,
      bestTime: "Whenever you wake up",
      description: "Do when you have morning free",
    },
    evening: {
      routine: "Evening Mobility or Foam Rolling",
      videoId: "mobility_evening",
      duration: 15,
      bestTime: "Before sleep (any time)",
      description: "Do before bed regardless of when that is",
    },
    afterPractice: {
      routine: "Foam Rolling Recovery",
      videoId: "foam_rolling_routine",
      duration: 15,
      description: "Always do foam rolling after practice",
    },
    totalDailyMinutes: 25,
    notes: [
      "Flexible schedule - adapt to your shifts",
      "Priority 1: Always do something before sleep",
      "Priority 2: Foam rolling after every practice",
      "Priority 3: Morning mobility when possible",
      "Consistency matters more than timing",
    ],
  },
  student: {
    scheduleType: "student",
    morning: {
      routine: "Morning Mobility",
      videoId: "mobility_morning",
      duration: 10,
      bestTime: "Before first class",
      description: "Quick routine to start the day",
    },
    evening: {
      routine: "Foam Rolling + Evening Mobility",
      videoId: "foam_rolling_routine",
      duration: 30,
      bestTime: "After studying, before bed",
      description: "Extended evening routine - you have the time!",
    },
    afterPractice: {
      routine: "Foam Rolling Recovery",
      videoId: "foam_rolling_routine",
      duration: 15,
      description: "Post-practice recovery",
    },
    totalDailyMinutes: 40,
    notes: [
      "Students often have more flexible time",
      "Use this to build great habits now",
      "Extended evening routine helps with sleep after studying",
      "Your body will thank you when you're older",
    ],
  },
  remote_worker: {
    scheduleType: "remote_worker",
    morning: {
      routine: "Morning Mobility",
      videoId: "mobility_morning",
      duration: 10,
      bestTime: "Before starting work",
      description: "Start the day right",
    },
    evening: {
      routine: "Foam Rolling",
      videoId: "foam_rolling_routine",
      duration: 15,
      bestTime: "After work, before dinner or bed",
      description: "Recovery after sitting all day",
    },
    afterPractice: {
      routine: "Foam Rolling Recovery",
      videoId: "foam_rolling_routine",
      duration: 15,
      description: "Post-practice recovery",
    },
    totalDailyMinutes: 25,
    notes: [
      "Working from home = most flexible schedule",
      "No commute time = more time for training",
      "Can even do mid-day mobility breaks",
      "Foam rolling helps counter sitting all day",
    ],
  },
};

// ============================================================================
// VIDEO DATABASE
// ============================================================================

const VIDEO_DATABASE: TrainingVideo[] = [
  // ============================================================================
  // SPEED & ACCELERATION
  // ============================================================================
  {
    id: "speed_001",
    title: "Complete Speed Training for Football Players",
    description: "Comprehensive speed development program covering acceleration mechanics, arm action, and sprint technique. Perfect for all positions.",
    url: "https://www.youtube.com/watch?v=6WXQL_pJc2I",
    platform: "youtube",
    duration: 15,
    positions: ["All"],
    trainingFocus: ["speed"],
    skillLevel: "all",
    phase: ["all"],
    equipment: ["cones", "field"],
    muscleGroups: ["glutes", "hamstrings", "hip flexors", "calves"],
    drillTypes: ["sprint", "warm_up"],
    tags: ["acceleration", "sprint mechanics", "40-yard dash"],
    rating: 4.8,
    addedDate: "2024-01-15",
    source: { channel: "Athletic Performance", credibility: "professional" },
    isPlaylist: false,
  },
  {
    id: "speed_002",
    title: "First Step Explosion - 0-10 Yard Acceleration",
    description: "Master the first 10 yards which account for 60% of 40-yard dash performance. Critical for all flag football positions.",
    url: "https://www.youtube.com/watch?v=kVvGHj_pNas",
    platform: "youtube",
    duration: 12,
    positions: ["WR", "DB", "Rusher", "All"],
    trainingFocus: ["speed"],
    skillLevel: "intermediate",
    phase: ["pre_season", "in_season"],
    equipment: ["cones"],
    muscleGroups: ["glutes", "quads", "hip flexors"],
    drillTypes: ["sprint"],
    tags: ["first step", "acceleration", "explosion"],
    rating: 4.7,
    addedDate: "2024-02-01",
    source: { channel: "Speed Academy", credibility: "coach" },
    isPlaylist: false,
  },
  {
    id: "speed_003",
    title: "Hip Flexor Strength for Faster Sprinting",
    description: "Evidence-based hip flexor exercises to improve stride frequency and sprint speed. Based on Morin & Samozino research.",
    url: "https://www.youtube.com/watch?v=Y2kgQgLrCeM",
    platform: "youtube",
    duration: 18,
    positions: ["All"],
    trainingFocus: ["speed", "strength"],
    skillLevel: "all",
    phase: ["off_season", "pre_season"],
    equipment: ["bands", "weights"],
    muscleGroups: ["hip flexors", "psoas", "core"],
    drillTypes: ["strength", "prehab"],
    tags: ["hip flexors", "sprint speed", "stride frequency"],
    rating: 4.9,
    addedDate: "2024-01-20",
    source: { channel: "Strength Coach", credibility: "professional" },
    isPlaylist: false,
  },
  {
    id: "speed_004",
    title: "Resisted Sprint Training with Sled",
    description: "Proper sled sprint technique with 10-20% bodyweight load for acceleration development. Based on Petrakos et al. research.",
    url: "https://www.youtube.com/watch?v=bHmUqQv2nKU",
    platform: "youtube",
    duration: 10,
    positions: ["WR", "DB", "Rusher"],
    trainingFocus: ["speed", "power"],
    skillLevel: "intermediate",
    phase: ["pre_season"],
    equipment: ["sled"],
    muscleGroups: ["glutes", "hamstrings", "quads"],
    drillTypes: ["sprint"],
    tags: ["sled", "resisted sprints", "acceleration"],
    rating: 4.6,
    addedDate: "2024-03-01",
    source: { channel: "Performance Lab", credibility: "professional" },
    isPlaylist: false,
  },

  // ============================================================================
  // AGILITY & CHANGE OF DIRECTION
  // ============================================================================
  {
    id: "agility_001",
    title: "Pro Agility / 5-10-5 Shuttle Technique",
    description: "Master the pro agility test with proper technique for change of direction. Essential for all flag football positions.",
    url: "https://www.youtube.com/watch?v=1VdcvQvKYjU",
    platform: "youtube",
    duration: 8,
    positions: ["All"],
    trainingFocus: ["agility"],
    skillLevel: "all",
    phase: ["all"],
    equipment: ["cones"],
    muscleGroups: ["glutes", "adductors", "quads"],
    drillTypes: ["agility"],
    tags: ["pro agility", "5-10-5", "COD"],
    rating: 4.7,
    addedDate: "2024-01-25",
    source: { channel: "Football Training", credibility: "coach" },
    isPlaylist: false,
  },
  {
    id: "agility_002",
    title: "Ladder Drills for Quick Feet",
    description: "20+ ladder drill variations to improve foot speed and coordination. Great for warm-ups or dedicated agility sessions.",
    url: "https://www.youtube.com/watch?v=2uqYU_IMCMI",
    platform: "youtube",
    duration: 15,
    positions: ["All"],
    trainingFocus: ["agility"],
    skillLevel: "beginner",
    phase: ["all"],
    equipment: ["ladder"],
    muscleGroups: ["calves", "ankles", "hip flexors"],
    drillTypes: ["agility", "warm_up"],
    tags: ["ladder", "footwork", "coordination"],
    rating: 4.5,
    addedDate: "2024-02-10",
    source: { channel: "Agility Training", credibility: "trainer" },
    isPlaylist: false,
  },
  {
    id: "agility_003",
    title: "Deceleration Training for Injury Prevention",
    description: "Learn proper deceleration mechanics to reduce injury risk and improve cutting ability. Based on Brughelli et al. research.",
    url: "https://www.youtube.com/watch?v=pWVBF_5Xmio",
    platform: "youtube",
    duration: 12,
    positions: ["All"],
    trainingFocus: ["agility", "injury_prevention"],
    skillLevel: "intermediate",
    phase: ["pre_season", "in_season"],
    equipment: ["cones"],
    muscleGroups: ["quads", "glutes", "core"],
    drillTypes: ["agility", "prehab"],
    tags: ["deceleration", "injury prevention", "cutting"],
    rating: 4.8,
    addedDate: "2024-02-15",
    source: { channel: "Sports Science", credibility: "professional" },
    isPlaylist: false,
  },
  {
    id: "agility_004",
    title: "Reactive Agility Drills with Partner",
    description: "Develop game-like reactive agility with partner drills. Better than pre-planned agility for sport transfer.",
    url: "https://www.youtube.com/watch?v=Qp6Qj_0LBAM",
    platform: "youtube",
    duration: 14,
    positions: ["DB", "WR", "Rusher"],
    trainingFocus: ["agility"],
    skillLevel: "intermediate",
    phase: ["in_season"],
    equipment: ["cones", "partner"],
    muscleGroups: ["full body"],
    drillTypes: ["agility"],
    tags: ["reactive", "partner drills", "game-like"],
    rating: 4.6,
    addedDate: "2024-03-05",
    source: { channel: "Athletic Performance", credibility: "coach" },
    isPlaylist: false,
  },

  // ============================================================================
  // POSITION-SPECIFIC: QUARTERBACK
  // ============================================================================
  {
    id: "qb_001",
    title: "QB Throwing Mechanics Fundamentals",
    description: "Complete breakdown of proper throwing mechanics including grip, stance, and release. Foundation for all QBs.",
    url: "https://www.youtube.com/watch?v=L5_FhZZLXFM",
    platform: "youtube",
    duration: 20,
    positions: ["QB"],
    trainingFocus: ["throwing", "skills"],
    skillLevel: "beginner",
    phase: ["off_season", "pre_season"],
    equipment: ["football"],
    muscleGroups: ["shoulder", "core", "hip rotators"],
    drillTypes: ["skill"],
    tags: ["throwing mechanics", "QB fundamentals", "technique"],
    rating: 4.9,
    addedDate: "2024-01-10",
    source: { channel: "QB Academy", credibility: "professional" },
    isPlaylist: false,
  },
  {
    id: "qb_002",
    title: "Throwing on the Run - Rollout Techniques",
    description: "Master throwing while moving left and right. Essential for flag football QBs who scramble frequently.",
    url: "https://www.youtube.com/watch?v=JQTx5J8O7-o",
    platform: "youtube",
    duration: 15,
    positions: ["QB"],
    trainingFocus: ["throwing", "skills"],
    skillLevel: "intermediate",
    phase: ["pre_season", "in_season"],
    equipment: ["football", "cones"],
    muscleGroups: ["shoulder", "core", "legs"],
    drillTypes: ["skill"],
    tags: ["rollout", "scramble", "throwing on the run"],
    rating: 4.8,
    addedDate: "2024-02-01",
    source: { channel: "Flag Football Training", credibility: "coach" },
    isPlaylist: true,
    playlistVideos: 12,
  },
  {
    id: "qb_003",
    title: "QB Arm Care & Shoulder Prehab",
    description: "Daily arm care routine to prevent shoulder injuries. Based on Reinold et al. research for overhead athletes.",
    url: "https://www.youtube.com/watch?v=Fz9VLfKhKKQ",
    platform: "youtube",
    duration: 12,
    positions: ["QB"],
    trainingFocus: ["injury_prevention", "mobility"],
    skillLevel: "all",
    phase: ["all"],
    equipment: ["bands"],
    muscleGroups: ["rotator cuff", "scapula", "shoulder"],
    drillTypes: ["prehab", "mobility"],
    tags: ["arm care", "shoulder health", "prehab"],
    rating: 4.9,
    addedDate: "2024-01-15",
    source: { channel: "Sports Medicine", credibility: "professional" },
    isPlaylist: false,
  },
  {
    id: "qb_004",
    title: "QB Footwork & Pocket Movement",
    description: "Develop quick feet in the pocket and proper drop mechanics. Includes scramble drills.",
    url: "https://www.youtube.com/watch?v=8Hq8xCDZvnE",
    platform: "youtube",
    duration: 18,
    positions: ["QB"],
    trainingFocus: ["agility", "skills"],
    skillLevel: "intermediate",
    phase: ["pre_season", "in_season"],
    equipment: ["cones", "football"],
    muscleGroups: ["hip flexors", "calves", "core"],
    drillTypes: ["skill", "agility"],
    tags: ["footwork", "pocket movement", "scramble"],
    rating: 4.7,
    addedDate: "2024-02-20",
    source: { channel: "QB Training", credibility: "coach" },
    isPlaylist: false,
  },
  {
    id: "qb_005",
    title: "QB Core Training for Throwing Power",
    description: "Rotational core exercises to increase throwing velocity. Based on Kibler et al. research.",
    url: "https://www.youtube.com/watch?v=eGo4IYlbE5g",
    platform: "youtube",
    duration: 15,
    positions: ["QB"],
    trainingFocus: ["strength", "throwing"],
    skillLevel: "intermediate",
    phase: ["off_season", "pre_season"],
    equipment: ["weights", "bands"],
    muscleGroups: ["core", "obliques", "hip rotators"],
    drillTypes: ["strength"],
    tags: ["core", "rotational power", "throwing velocity"],
    rating: 4.8,
    addedDate: "2024-03-01",
    source: { channel: "Strength Coach", credibility: "professional" },
    isPlaylist: false,
  },

  // ============================================================================
  // POSITION-SPECIFIC: WIDE RECEIVER
  // ============================================================================
  {
    id: "wr_001",
    title: "Route Running Fundamentals",
    description: "Master the route tree with proper technique for each route. Includes releases and stem work.",
    url: "https://www.youtube.com/watch?v=Vp5aLlTNgCQ",
    platform: "youtube",
    duration: 25,
    positions: ["WR", "Center"],
    trainingFocus: ["route_running", "skills"],
    skillLevel: "beginner",
    phase: ["all"],
    equipment: ["cones", "football"],
    muscleGroups: ["full body"],
    drillTypes: ["skill"],
    tags: ["routes", "route tree", "technique"],
    rating: 4.8,
    addedDate: "2024-01-20",
    source: { channel: "WR Academy", credibility: "professional" },
    isPlaylist: false,
  },
  {
    id: "wr_002",
    title: "Release Moves to Beat Press Coverage",
    description: "Learn 10+ release techniques to get off the line against physical defenders.",
    url: "https://www.youtube.com/watch?v=Y0kJPvQqGfY",
    platform: "youtube",
    duration: 18,
    positions: ["WR"],
    trainingFocus: ["route_running", "skills"],
    skillLevel: "intermediate",
    phase: ["pre_season", "in_season"],
    equipment: ["cones", "partner"],
    muscleGroups: ["upper body", "core"],
    drillTypes: ["skill"],
    tags: ["release", "press coverage", "technique"],
    rating: 4.7,
    addedDate: "2024-02-05",
    source: { channel: "WR Training", credibility: "coach" },
    isPlaylist: false,
  },
  {
    id: "wr_003",
    title: "Catching Drills - Hands & Concentration",
    description: "Improve catching ability with progressive drills for hand-eye coordination and concentration.",
    url: "https://www.youtube.com/watch?v=rYbN0qJP8gg",
    platform: "youtube",
    duration: 12,
    positions: ["WR", "Center", "QB"],
    trainingFocus: ["catching", "skills"],
    skillLevel: "all",
    phase: ["all"],
    equipment: ["football"],
    muscleGroups: ["hands", "forearms"],
    drillTypes: ["skill"],
    tags: ["catching", "hands", "concentration"],
    rating: 4.6,
    addedDate: "2024-02-15",
    source: { channel: "Football Skills", credibility: "trainer" },
    isPlaylist: false,
  },
  {
    id: "wr_004",
    title: "WR Speed Training - 40 Yard Dash Improvement",
    description: "Position-specific speed training for receivers. Focus on acceleration and top-end speed.",
    url: "https://www.youtube.com/watch?v=2TYk-PkSxDo",
    platform: "youtube",
    duration: 20,
    positions: ["WR"],
    trainingFocus: ["speed"],
    skillLevel: "intermediate",
    phase: ["off_season", "pre_season"],
    equipment: ["cones", "field"],
    muscleGroups: ["glutes", "hamstrings", "hip flexors"],
    drillTypes: ["sprint"],
    tags: ["40 yard dash", "speed", "acceleration"],
    rating: 4.7,
    addedDate: "2024-03-10",
    source: { channel: "Speed Training", credibility: "professional" },
    isPlaylist: false,
  },

  // ============================================================================
  // POSITION-SPECIFIC: DEFENSIVE BACK
  // ============================================================================
  {
    id: "db_001",
    title: "Backpedal Technique & Drills",
    description: "Master proper backpedal mechanics for zone and man coverage. Foundation skill for all DBs.",
    url: "https://www.youtube.com/watch?v=Xk_0yJHlK0Q",
    platform: "youtube",
    duration: 15,
    positions: ["DB", "LB"],
    trainingFocus: ["coverage", "skills"],
    skillLevel: "beginner",
    phase: ["all"],
    equipment: ["cones"],
    muscleGroups: ["hip flexors", "glutes", "calves"],
    drillTypes: ["skill"],
    tags: ["backpedal", "coverage", "technique"],
    rating: 4.8,
    addedDate: "2024-01-25",
    source: { channel: "DB Academy", credibility: "professional" },
    isPlaylist: false,
  },
  {
    id: "db_002",
    title: "Hip Turn & Transition Drills",
    description: "Develop fluid hip turns for man coverage. Critical for staying with receivers on deep routes.",
    url: "https://www.youtube.com/watch?v=BqKpVYz8Wzk",
    platform: "youtube",
    duration: 12,
    positions: ["DB"],
    trainingFocus: ["coverage", "agility"],
    skillLevel: "intermediate",
    phase: ["pre_season", "in_season"],
    equipment: ["cones"],
    muscleGroups: ["hip rotators", "glutes", "hamstrings"],
    drillTypes: ["skill", "agility"],
    tags: ["hip turn", "transition", "man coverage"],
    rating: 4.7,
    addedDate: "2024-02-10",
    source: { channel: "DB Training", credibility: "coach" },
    isPlaylist: false,
  },
  {
    id: "db_003",
    title: "Zone Coverage Drops & Reads",
    description: "Learn proper zone drops, eye discipline, and route recognition for zone coverage.",
    url: "https://www.youtube.com/watch?v=8Xj_0LJPWAM",
    platform: "youtube",
    duration: 18,
    positions: ["DB", "LB"],
    trainingFocus: ["coverage", "skills"],
    skillLevel: "intermediate",
    phase: ["pre_season", "in_season"],
    equipment: ["cones", "partner"],
    muscleGroups: ["full body"],
    drillTypes: ["skill"],
    tags: ["zone coverage", "drops", "reads"],
    rating: 4.6,
    addedDate: "2024-02-25",
    source: { channel: "Defensive Training", credibility: "coach" },
    isPlaylist: false,
  },
  {
    id: "db_004",
    title: "DB Lateral Movement & Shuffle Drills",
    description: "Improve lateral quickness for zone coverage. Focus on maintaining athletic position.",
    url: "https://www.youtube.com/watch?v=Lp_9TbK8Fqk",
    platform: "youtube",
    duration: 14,
    positions: ["DB"],
    trainingFocus: ["agility", "coverage"],
    skillLevel: "all",
    phase: ["all"],
    equipment: ["cones"],
    muscleGroups: ["adductors", "glutes", "hip flexors"],
    drillTypes: ["agility"],
    tags: ["lateral", "shuffle", "zone coverage"],
    rating: 4.5,
    addedDate: "2024-03-05",
    source: { channel: "Agility Training", credibility: "trainer" },
    isPlaylist: false,
  },

  // ============================================================================
  // POSITION-SPECIFIC: RUSHER
  // ============================================================================
  {
    id: "rusher_001",
    title: "Pass Rush Techniques & Get-Offs",
    description: "Master the first step explosion and pass rush moves for flag football rushers.",
    url: "https://www.youtube.com/watch?v=vQp_5xCTvzs",
    platform: "youtube",
    duration: 16,
    positions: ["Rusher"],
    trainingFocus: ["rushing", "skills"],
    skillLevel: "all",
    phase: ["all"],
    equipment: ["cones"],
    muscleGroups: ["hip flexors", "glutes", "core"],
    drillTypes: ["skill"],
    tags: ["pass rush", "get-off", "first step"],
    rating: 4.7,
    addedDate: "2024-02-01",
    source: { channel: "D-Line Training", credibility: "coach" },
    isPlaylist: false,
  },
  {
    id: "rusher_002",
    title: "Rush Moves & Counter Moves",
    description: "Learn multiple rush moves including speed rush, bull rush, and spin moves adapted for flag.",
    url: "https://www.youtube.com/watch?v=Ks_5KqQfPnE",
    platform: "youtube",
    duration: 20,
    positions: ["Rusher"],
    trainingFocus: ["rushing", "skills"],
    skillLevel: "intermediate",
    phase: ["pre_season", "in_season"],
    equipment: ["cones", "partner"],
    muscleGroups: ["full body"],
    drillTypes: ["skill"],
    tags: ["rush moves", "technique", "counter"],
    rating: 4.6,
    addedDate: "2024-02-20",
    source: { channel: "Flag Football Training", credibility: "coach" },
    isPlaylist: false,
  },
  {
    id: "rusher_003",
    title: "Rusher Agility & Pursuit Angles",
    description: "Develop the agility to chase down scrambling QBs and take proper pursuit angles.",
    url: "https://www.youtube.com/watch?v=Qp6Qj_0LBAM",
    platform: "youtube",
    duration: 12,
    positions: ["Rusher", "LB"],
    trainingFocus: ["agility", "rushing"],
    skillLevel: "intermediate",
    phase: ["in_season"],
    equipment: ["cones"],
    muscleGroups: ["full body"],
    drillTypes: ["agility"],
    tags: ["pursuit", "angles", "agility"],
    rating: 4.5,
    addedDate: "2024-03-10",
    source: { channel: "Defensive Training", credibility: "trainer" },
    isPlaylist: false,
  },

  // ============================================================================
  // STRENGTH & POWER
  // ============================================================================
  {
    id: "strength_001",
    title: "Lower Body Strength for Football",
    description: "Complete lower body program including squats, deadlifts, and single-leg work. Build the foundation for speed and power.",
    url: "https://www.youtube.com/watch?v=Dy28eq2PjcM",
    platform: "youtube",
    duration: 30,
    positions: ["All"],
    trainingFocus: ["strength"],
    skillLevel: "intermediate",
    phase: ["off_season", "pre_season"],
    equipment: ["weights"],
    muscleGroups: ["glutes", "quads", "hamstrings"],
    drillTypes: ["strength"],
    tags: ["squat", "deadlift", "lower body"],
    rating: 4.8,
    addedDate: "2024-01-10",
    source: { channel: "Strength Coach", credibility: "professional" },
    isPlaylist: false,
  },
  {
    id: "strength_002",
    title: "Nordic Curls - Proper Technique & Progressions",
    description: "Master the Nordic curl for hamstring injury prevention. 51% injury reduction based on Al Attar et al. research.",
    url: "https://www.youtube.com/watch?v=d8AAPcYxHKE",
    platform: "youtube",
    duration: 10,
    positions: ["All"],
    trainingFocus: ["strength", "injury_prevention"],
    skillLevel: "all",
    phase: ["all"],
    equipment: ["partner"],
    muscleGroups: ["hamstrings"],
    drillTypes: ["strength", "prehab"],
    tags: ["Nordic curl", "hamstring", "injury prevention"],
    rating: 4.9,
    addedDate: "2024-01-15",
    source: { channel: "Sports Science", credibility: "professional" },
    isPlaylist: false,
  },
  {
    id: "strength_003",
    title: "Copenhagen Adductor Exercise",
    description: "Learn the Copenhagen exercise for groin injury prevention. 41% injury reduction based on Harøy et al. research.",
    url: "https://www.youtube.com/watch?v=Dsh0Z1qQNME",
    platform: "youtube",
    duration: 8,
    positions: ["All"],
    trainingFocus: ["strength", "injury_prevention"],
    skillLevel: "all",
    phase: ["all"],
    equipment: ["partner"],
    muscleGroups: ["adductors"],
    drillTypes: ["strength", "prehab"],
    tags: ["Copenhagen", "groin", "adductors", "injury prevention"],
    rating: 4.8,
    addedDate: "2024-01-20",
    source: { channel: "Sports Medicine", credibility: "professional" },
    isPlaylist: false,
  },
  {
    id: "strength_004",
    title: "Power Development - Plyometrics for Football",
    description: "Plyometric exercises to develop explosive power. Includes box jumps, bounds, and depth jumps.",
    url: "https://www.youtube.com/watch?v=SNkCYhtSq4M",
    platform: "youtube",
    duration: 20,
    positions: ["All"],
    trainingFocus: ["power"],
    skillLevel: "intermediate",
    phase: ["pre_season"],
    equipment: ["none"],
    muscleGroups: ["glutes", "quads", "calves"],
    drillTypes: ["plyometric"],
    tags: ["plyometrics", "power", "explosiveness"],
    rating: 4.7,
    addedDate: "2024-02-01",
    source: { channel: "Athletic Performance", credibility: "professional" },
    isPlaylist: false,
  },
  {
    id: "strength_005",
    title: "Single Leg Strength for Athletes",
    description: "Essential single-leg exercises for injury prevention and performance. Includes split squats, RDLs, and step-ups.",
    url: "https://www.youtube.com/watch?v=SsP0FGwW2Oc",
    platform: "youtube",
    duration: 18,
    positions: ["All"],
    trainingFocus: ["strength", "injury_prevention"],
    skillLevel: "all",
    phase: ["all"],
    equipment: ["weights"],
    muscleGroups: ["glutes", "quads", "hamstrings"],
    drillTypes: ["strength"],
    tags: ["single leg", "balance", "stability"],
    rating: 4.7,
    addedDate: "2024-02-15",
    source: { channel: "Strength Coach", credibility: "professional" },
    isPlaylist: false,
  },

  // ============================================================================
  // MOBILITY & RECOVERY
  // ============================================================================
  
  // ⭐ DAILY MOBILITY PLAYLIST - Essential for all flag football players
  {
    id: "mobility_daily_playlist",
    title: "Daily Mobility for Flag Football Athletes - Complete Playlist",
    description: "Comprehensive daily mobility playlist specifically curated for flag football players. Do these routines every morning or evening before sleep to maintain movement quality, prevent injuries, and improve athletic performance. Essential for players who practice only 1-2x per week.",
    url: "https://www.youtube.com/watch?v=IWNnTJFwi3s&list=PLIconE7hKrWGw8lprYWFeU5k2QbuKdSuf",
    platform: "youtube",
    duration: 45,
    positions: ["All"],
    trainingFocus: ["mobility", "recovery", "injury_prevention"],
    skillLevel: "all",
    phase: ["all"],
    equipment: ["none"],
    muscleGroups: ["hip flexors", "glutes", "hamstrings", "ankles", "thoracic spine", "shoulders", "full body"],
    drillTypes: ["mobility", "prehab"],
    tags: ["daily mobility", "morning routine", "evening routine", "flexibility", "injury prevention", "recovery", "flag football"],
    rating: 5.0,
    addedDate: "2024-12-27",
    source: { 
      channel: "Flag Football Mobility", 
      channelUrl: "https://www.youtube.com/playlist?list=PLIconE7hKrWGw8lprYWFeU5k2QbuKdSuf",
      credibility: "professional" 
    },
    isPlaylist: true,
    playlistVideos: 15,
  },
  
  // ⭐ FOAM ROLLING ROUTINE - Essential recovery for all athletes
  {
    id: "foam_rolling_routine",
    title: "Complete Foam Rolling Routine for Athletes",
    description: "Full-body foam rolling routine for muscle recovery and tissue quality. WHEN TO DO: (1) Before bed if you did morning mobility, OR (2) After practice if you do evening mobility instead of morning. Helps release muscle tension, improve recovery, and reduce soreness. Essential for flag football players with demanding schedules.",
    url: "https://www.youtube.com/watch?v=Oz4xHEgMaLY",
    platform: "youtube",
    duration: 15,
    positions: ["All"],
    trainingFocus: ["recovery", "mobility"],
    skillLevel: "all",
    phase: ["all"],
    equipment: ["none"],
    muscleGroups: ["quads", "hamstrings", "IT band", "calves", "glutes", "back", "lats", "full body"],
    drillTypes: ["cool_down", "mobility", "prehab"],
    tags: ["foam rolling", "recovery", "muscle release", "before bed", "after practice", "tissue quality", "soreness relief"],
    rating: 4.9,
    addedDate: "2024-12-27",
    source: { channel: "Recovery Training", credibility: "professional" },
    isPlaylist: false,
  },
  
  // ⭐ REST DAY STRETCHING - Essential for recovery days
  {
    id: "rest_day_stretching",
    title: "Rest Day Full Body Stretching Routine",
    description: "Complete stretching routine specifically designed for rest days. Helps maintain flexibility, promotes recovery, and prepares your body for the next training session. WHEN TO DO: On rest days (no training/practice), can be done morning, afternoon, or evening. Perfect for flag football players to use on their off days to stay loose and recover faster.",
    url: "https://www.youtube.com/watch?v=_r8RPkprhVM",
    platform: "youtube",
    duration: 20,
    positions: ["All"],
    trainingFocus: ["recovery", "mobility"],
    skillLevel: "all",
    phase: ["all"],
    equipment: ["none"],
    muscleGroups: ["hip flexors", "hamstrings", "quads", "glutes", "back", "shoulders", "calves", "full body"],
    drillTypes: ["mobility", "cool_down"],
    tags: ["rest day", "stretching", "recovery", "flexibility", "off day", "full body stretch", "static stretching"],
    rating: 4.9,
    addedDate: "2024-12-27",
    source: { channel: "Recovery Training", credibility: "professional" },
    isPlaylist: false,
  },
  {
    id: "mobility_morning",
    title: "10-Minute Morning Mobility for Athletes",
    description: "Quick morning mobility routine to wake up your body and prepare for the day. Perfect for flag football players to do right after waking up. Focuses on hips, spine, and ankles - the key areas for athletic movement.",
    url: "https://www.youtube.com/watch?v=IWNnTJFwi3s&list=PLIconE7hKrWGw8lprYWFeU5k2QbuKdSuf",
    platform: "youtube",
    duration: 10,
    positions: ["All"],
    trainingFocus: ["mobility"],
    skillLevel: "all",
    phase: ["all"],
    equipment: ["none"],
    muscleGroups: ["hip flexors", "spine", "ankles"],
    drillTypes: ["mobility"],
    tags: ["morning routine", "wake up", "daily", "quick mobility"],
    rating: 4.9,
    addedDate: "2024-12-27",
    source: { channel: "Flag Football Mobility", credibility: "professional" },
    isPlaylist: false,
  },
  {
    id: "mobility_evening",
    title: "15-Minute Evening Mobility & Recovery",
    description: "Wind-down mobility routine for before bed. Helps release tension from the day, improves sleep quality, and prepares your body for recovery. Essential for flag football players, especially after training or games.",
    url: "https://www.youtube.com/watch?v=IWNnTJFwi3s&list=PLIconE7hKrWGw8lprYWFeU5k2QbuKdSuf",
    platform: "youtube",
    duration: 15,
    positions: ["All"],
    trainingFocus: ["mobility", "recovery"],
    skillLevel: "all",
    phase: ["all"],
    equipment: ["none"],
    muscleGroups: ["hip flexors", "hamstrings", "lower back", "shoulders"],
    drillTypes: ["mobility", "cool_down"],
    tags: ["evening routine", "before bed", "sleep", "recovery", "wind down"],
    rating: 4.9,
    addedDate: "2024-12-27",
    source: { channel: "Flag Football Mobility", credibility: "professional" },
    isPlaylist: false,
  },
  {
    id: "mobility_hip_flexor_focus",
    title: "Hip Flexor Mobility for Sprinters",
    description: "Targeted hip flexor mobility routine. Critical for flag football players as tight hip flexors limit sprint speed and increase injury risk. Based on research showing hip flexor strength correlates with stride frequency (Morin & Samozino, 2016).",
    url: "https://www.youtube.com/watch?v=IWNnTJFwi3s&list=PLIconE7hKrWGw8lprYWFeU5k2QbuKdSuf",
    platform: "youtube",
    duration: 12,
    positions: ["All"],
    trainingFocus: ["mobility", "injury_prevention"],
    skillLevel: "all",
    phase: ["all"],
    equipment: ["none"],
    muscleGroups: ["hip flexors", "psoas", "rectus femoris"],
    drillTypes: ["mobility", "prehab"],
    tags: ["hip flexors", "sprint speed", "tight hips", "psoas"],
    rating: 4.9,
    addedDate: "2024-12-27",
    source: { channel: "Flag Football Mobility", credibility: "professional" },
    isPlaylist: false,
  },
  {
    id: "mobility_ankle_achilles",
    title: "Ankle & Achilles Mobility for Explosive Athletes",
    description: "Ankle mobility and Achilles tendon preparation. Essential for flag football players as ankle stiffness correlates with sprint performance (Kubo et al., 2000). Improves change of direction and reduces ankle sprain risk.",
    url: "https://www.youtube.com/watch?v=IWNnTJFwi3s&list=PLIconE7hKrWGw8lprYWFeU5k2QbuKdSuf",
    platform: "youtube",
    duration: 10,
    positions: ["All"],
    trainingFocus: ["mobility", "injury_prevention"],
    skillLevel: "all",
    phase: ["all"],
    equipment: ["none"],
    muscleGroups: ["ankles", "achilles", "calves", "soleus"],
    drillTypes: ["mobility", "prehab"],
    tags: ["ankle mobility", "achilles", "sprint", "COD", "ankle sprain prevention"],
    rating: 4.8,
    addedDate: "2024-12-27",
    source: { channel: "Flag Football Mobility", credibility: "professional" },
    isPlaylist: false,
  },
  {
    id: "mobility_thoracic_spine",
    title: "Thoracic Spine Mobility for Throwing Athletes",
    description: "Thoracic spine mobility routine especially important for QBs. Improved thoracic rotation allows better throwing mechanics and reduces shoulder/elbow stress. Also benefits all positions for better running mechanics.",
    url: "https://www.youtube.com/watch?v=IWNnTJFwi3s&list=PLIconE7hKrWGw8lprYWFeU5k2QbuKdSuf",
    platform: "youtube",
    duration: 10,
    positions: ["QB", "All"],
    trainingFocus: ["mobility"],
    skillLevel: "all",
    phase: ["all"],
    equipment: ["none"],
    muscleGroups: ["thoracic spine", "upper back", "shoulders"],
    drillTypes: ["mobility"],
    tags: ["thoracic", "t-spine", "throwing", "rotation", "QB mobility"],
    rating: 4.8,
    addedDate: "2024-12-27",
    source: { channel: "Flag Football Mobility", credibility: "professional" },
    isPlaylist: false,
  },
  {
    id: "mobility_groin_adductors",
    title: "Groin & Adductor Mobility",
    description: "Groin and adductor mobility routine. Critical for DBs who do lateral shuffling and all players who cut. Groin injuries are common in flag football - this routine helps prevent them. Complements Copenhagen adductor strength work.",
    url: "https://www.youtube.com/watch?v=IWNnTJFwi3s&list=PLIconE7hKrWGw8lprYWFeU5k2QbuKdSuf",
    platform: "youtube",
    duration: 10,
    positions: ["DB", "All"],
    trainingFocus: ["mobility", "injury_prevention"],
    skillLevel: "all",
    phase: ["all"],
    equipment: ["none"],
    muscleGroups: ["adductors", "groin", "inner thigh"],
    drillTypes: ["mobility", "prehab"],
    tags: ["groin", "adductors", "lateral movement", "DB mobility", "injury prevention"],
    rating: 4.8,
    addedDate: "2024-12-27",
    source: { channel: "Flag Football Mobility", credibility: "professional" },
    isPlaylist: false,
  },
  {
    id: "mobility_001",
    title: "Hip Mobility Routine for Athletes",
    description: "15-minute hip mobility routine to improve movement quality and reduce injury risk. Do daily.",
    url: "https://www.youtube.com/watch?v=NG9qbvAN3gQ",
    platform: "youtube",
    duration: 15,
    positions: ["All"],
    trainingFocus: ["mobility"],
    skillLevel: "all",
    phase: ["all"],
    equipment: ["none"],
    muscleGroups: ["hip flexors", "glutes", "adductors"],
    drillTypes: ["mobility"],
    tags: ["hip mobility", "flexibility", "daily routine"],
    rating: 4.8,
    addedDate: "2024-01-10",
    source: { channel: "Mobility Training", credibility: "professional" },
    isPlaylist: false,
  },
  {
    id: "mobility_002",
    title: "Ankle Mobility for Sprinters",
    description: "Improve ankle dorsiflexion for better sprint mechanics and reduced injury risk.",
    url: "https://www.youtube.com/watch?v=XISJxsccN68",
    platform: "youtube",
    duration: 10,
    positions: ["All"],
    trainingFocus: ["mobility"],
    skillLevel: "all",
    phase: ["all"],
    equipment: ["bands"],
    muscleGroups: ["ankles", "calves"],
    drillTypes: ["mobility"],
    tags: ["ankle mobility", "dorsiflexion", "sprint"],
    rating: 4.6,
    addedDate: "2024-01-25",
    source: { channel: "Movement Training", credibility: "trainer" },
    isPlaylist: false,
  },
  {
    id: "mobility_003",
    title: "Post-Game Recovery Routine",
    description: "Complete recovery routine for after games or hard training. Includes foam rolling and stretching.",
    url: "https://www.youtube.com/watch?v=g_tea8ZNk5A",
    platform: "youtube",
    duration: 20,
    positions: ["All"],
    trainingFocus: ["recovery"],
    skillLevel: "all",
    phase: ["in_season"],
    equipment: ["none"],
    muscleGroups: ["full body"],
    drillTypes: ["cool_down", "mobility"],
    tags: ["recovery", "foam rolling", "stretching"],
    rating: 4.7,
    addedDate: "2024-02-10",
    source: { channel: "Recovery Science", credibility: "professional" },
    isPlaylist: false,
  },
  {
    id: "mobility_004",
    title: "Dynamic Warm-Up for Football",
    description: "Complete dynamic warm-up routine before training or games. Activates all key muscle groups.",
    url: "https://www.youtube.com/watch?v=3B-3Khbht5s",
    platform: "youtube",
    duration: 12,
    positions: ["All"],
    trainingFocus: ["mobility"],
    skillLevel: "all",
    phase: ["all"],
    equipment: ["none"],
    muscleGroups: ["full body"],
    drillTypes: ["warm_up"],
    tags: ["warm-up", "dynamic", "activation"],
    rating: 4.8,
    addedDate: "2024-01-05",
    source: { channel: "Athletic Performance", credibility: "professional" },
    isPlaylist: false,
  },

  // ============================================================================
  // CONDITIONING
  // ============================================================================
  {
    id: "conditioning_001",
    title: "Repeated Sprint Ability Training",
    description: "Build the ability to maintain sprint quality throughout a game. Essential for flag football.",
    url: "https://www.youtube.com/watch?v=QGc-wc3RGK0",
    platform: "youtube",
    duration: 15,
    positions: ["All"],
    trainingFocus: ["conditioning", "speed"],
    skillLevel: "intermediate",
    phase: ["pre_season", "in_season"],
    equipment: ["cones", "field"],
    muscleGroups: ["full body"],
    drillTypes: ["conditioning", "sprint"],
    tags: ["RSA", "conditioning", "game fitness"],
    rating: 4.7,
    addedDate: "2024-02-01",
    source: { channel: "Sports Science", credibility: "professional" },
    isPlaylist: false,
  },
  {
    id: "conditioning_002",
    title: "Tournament Conditioning Protocol",
    description: "Build the fitness to play 6-8 games in a weekend tournament. Includes work-to-rest ratios.",
    url: "https://www.youtube.com/watch?v=9Y9wYxwQp4M",
    platform: "youtube",
    duration: 20,
    positions: ["All"],
    trainingFocus: ["conditioning"],
    skillLevel: "intermediate",
    phase: ["pre_season", "tournament_prep"],
    equipment: ["cones", "field"],
    muscleGroups: ["full body"],
    drillTypes: ["conditioning"],
    tags: ["tournament", "fitness", "endurance"],
    rating: 4.6,
    addedDate: "2024-03-01",
    source: { channel: "Flag Football Training", credibility: "coach" },
    isPlaylist: false,
  },

  // ============================================================================
  // MENTAL TRAINING
  // ============================================================================
  {
    id: "mental_001",
    title: "Pre-Game Mental Preparation",
    description: "Mental preparation routine for competition. Includes visualization and focus techniques.",
    url: "https://www.youtube.com/watch?v=yG7v4y_xwzQ",
    platform: "youtube",
    duration: 15,
    positions: ["All"],
    trainingFocus: ["mental"],
    skillLevel: "all",
    phase: ["in_season", "tournament_prep"],
    equipment: ["none"],
    muscleGroups: [],
    drillTypes: [],
    tags: ["mental", "visualization", "focus"],
    rating: 4.5,
    addedDate: "2024-02-20",
    source: { channel: "Sports Psychology", credibility: "professional" },
    isPlaylist: false,
  },
];

// ============================================================================
// PRE-BUILT TRAINING SESSIONS
// ============================================================================

const TRAINING_SESSIONS: TrainingSession[] = [
  // ============================================================================
  // DAILY MOBILITY SESSIONS (Morning & Evening)
  // ============================================================================
  {
    id: "session_morning_mobility",
    name: "Morning Mobility Routine",
    description: "10-minute morning routine to wake up your body. Do this every day right after waking up. Essential for flag football players to maintain movement quality.",
    totalDuration: 10,
    position: "All",
    focus: ["mobility"],
    phase: "all",
    skillLevel: "all",
    videos: [
      { videoId: "mobility_morning", order: 1, duration: 10, notes: "Follow along - do every morning" },
    ],
    restBetweenVideos: 0,
    weeklyFrequency: "Daily (7x per week)",
    notes: [
      "Do immediately after waking up",
      "No equipment needed",
      "Can do in bedroom or living room",
      "Helps wake up the body and mind",
      "Prepares joints for the day ahead",
    ],
  },
  {
    id: "session_evening_mobility",
    name: "Evening Mobility & Wind-Down",
    description: "15-minute evening routine before bed. Helps release tension, improves sleep quality, and accelerates recovery. Critical for flag football players, especially after training days.",
    totalDuration: 15,
    position: "All",
    focus: ["mobility", "recovery"],
    phase: "all",
    skillLevel: "all",
    videos: [
      { videoId: "mobility_evening", order: 1, duration: 15, notes: "Do 30-60 min before sleep" },
    ],
    restBetweenVideos: 0,
    weeklyFrequency: "Daily (7x per week)",
    notes: [
      "Do 30-60 minutes before bed",
      "Helps improve sleep quality",
      "Releases tension from training/games",
      "Accelerates recovery",
      "Calms nervous system for better sleep",
    ],
  },
  {
    id: "session_daily_full_mobility",
    name: "Complete Daily Mobility (Morning + Evening)",
    description: "Full daily mobility protocol combining morning activation and evening recovery. The gold standard for flag football players who want to stay healthy and perform at their best.",
    totalDuration: 25,
    position: "All",
    focus: ["mobility", "recovery", "injury_prevention"],
    phase: "all",
    skillLevel: "all",
    videos: [
      { videoId: "mobility_morning", order: 1, duration: 10, notes: "Morning - right after waking" },
      { videoId: "mobility_evening", order: 2, duration: 15, notes: "Evening - before bed" },
    ],
    restBetweenVideos: 0,
    weeklyFrequency: "Daily (7x per week)",
    notes: [
      "Split into morning and evening sessions",
      "Total 25 minutes per day",
      "Non-negotiable for serious athletes",
      "Based on evidence for injury prevention",
      "Maintains movement quality year-round",
    ],
  },
  {
    id: "session_targeted_hip_flexors",
    name: "Hip Flexor Focus Session",
    description: "Targeted hip flexor mobility for sprinters. Do 3-4x per week in addition to daily mobility. Critical for improving sprint speed and preventing hip flexor strains.",
    totalDuration: 12,
    position: "All",
    focus: ["mobility", "injury_prevention"],
    phase: "all",
    skillLevel: "all",
    videos: [
      { videoId: "mobility_hip_flexor_focus", order: 1, duration: 12 },
    ],
    restBetweenVideos: 0,
    weeklyFrequency: "3-4x per week",
    notes: [
      "Especially important for WRs, DBs, and Rushers",
      "Can do after training or separately",
      "Hip flexor tightness limits sprint speed",
      "Based on Morin & Samozino research",
    ],
  },
  {
    id: "session_targeted_ankles",
    name: "Ankle & Achilles Focus Session",
    description: "Targeted ankle mobility for explosive athletes. Do 3-4x per week. Improves ground contact efficiency and reduces ankle sprain risk.",
    totalDuration: 10,
    position: "All",
    focus: ["mobility", "injury_prevention"],
    phase: "all",
    skillLevel: "all",
    videos: [
      { videoId: "mobility_ankle_achilles", order: 1, duration: 10 },
    ],
    restBetweenVideos: 0,
    weeklyFrequency: "3-4x per week",
    notes: [
      "Critical for all cutting sports",
      "Ankle stiffness improves sprint performance",
      "Reduces ankle sprain risk",
      "Based on Kubo et al. research",
    ],
  },
  
  // ============================================================================
  // REST DAY SESSIONS
  // ============================================================================
  {
    id: "session_rest_day_recovery",
    name: "Rest Day Recovery Session",
    description: "Complete rest day routine combining stretching and light mobility. Do this on days with no training or practice to maintain flexibility and promote recovery.",
    totalDuration: 35,
    position: "All",
    focus: ["recovery", "mobility"],
    phase: "all",
    skillLevel: "all",
    videos: [
      { videoId: "rest_day_stretching", order: 1, duration: 20, notes: "Full body stretching" },
      { videoId: "foam_rolling_routine", order: 2, duration: 15, notes: "Foam rolling for tissue quality" },
    ],
    restBetweenVideos: 60,
    weeklyFrequency: "1-2x per week (rest days)",
    notes: [
      "Do on complete rest days (no training/practice)",
      "Can split into morning stretching + evening foam rolling",
      "Helps maintain flexibility between training days",
      "Promotes faster recovery",
      "Essential for athletes practicing only 1-2x per week",
    ],
  },
  {
    id: "session_rest_day_stretching_only",
    name: "Rest Day Stretching",
    description: "Full body stretching routine for rest days. Perfect when you want a lighter recovery session without foam rolling.",
    totalDuration: 20,
    position: "All",
    focus: ["recovery", "mobility"],
    phase: "all",
    skillLevel: "all",
    videos: [
      { videoId: "rest_day_stretching", order: 1, duration: 20 },
    ],
    restBetweenVideos: 0,
    weeklyFrequency: "1-2x per week (rest days)",
    notes: [
      "Lighter option for rest days",
      "Good for when you're feeling very sore",
      "Can do morning, afternoon, or evening",
      "Maintains flexibility without adding stress",
    ],
  },
  {
    id: "session_active_recovery_day",
    name: "Active Recovery Day (Complete)",
    description: "Full active recovery protocol for rest days. Combines morning mobility, stretching, and evening foam rolling for maximum recovery.",
    totalDuration: 45,
    position: "All",
    focus: ["recovery", "mobility"],
    phase: "all",
    skillLevel: "all",
    videos: [
      { videoId: "mobility_morning", order: 1, duration: 10, notes: "Morning - wake up routine" },
      { videoId: "rest_day_stretching", order: 2, duration: 20, notes: "Midday or afternoon - stretching" },
      { videoId: "foam_rolling_routine", order: 3, duration: 15, notes: "Evening - foam rolling before bed" },
    ],
    restBetweenVideos: 0,
    weeklyFrequency: "1x per week (full rest day)",
    notes: [
      "The gold standard for rest day recovery",
      "Split across the day: morning, afternoon, evening",
      "Maximizes recovery without training stress",
      "Perfect for the day after a tournament or hard training",
      "Helps you come back stronger for next session",
    ],
  },
  {
    id: "session_qb_mobility",
    name: "QB-Specific Mobility",
    description: "Mobility routine specifically for quarterbacks. Focuses on thoracic spine rotation, shoulder mobility, and hip rotation for throwing mechanics.",
    totalDuration: 22,
    position: "QB",
    focus: ["mobility", "injury_prevention"],
    phase: "all",
    skillLevel: "all",
    videos: [
      { videoId: "mobility_thoracic_spine", order: 1, duration: 10, notes: "T-spine for throwing" },
      { videoId: "mobility_hip_flexor_focus", order: 2, duration: 12, notes: "Hips for scrambling" },
    ],
    restBetweenVideos: 30,
    weeklyFrequency: "Daily for QBs",
    notes: [
      "Essential for QB arm health",
      "Improves throwing mechanics",
      "Reduces shoulder and elbow stress",
      "Do in addition to arm care routine",
    ],
  },
  {
    id: "session_db_mobility",
    name: "DB-Specific Mobility",
    description: "Mobility routine specifically for defensive backs. Focuses on hip rotation for backpedal, groin for lateral movement, and ankles for reactive cuts.",
    totalDuration: 22,
    position: "DB",
    focus: ["mobility", "injury_prevention"],
    phase: "all",
    skillLevel: "all",
    videos: [
      { videoId: "mobility_groin_adductors", order: 1, duration: 10, notes: "Groin for lateral movement" },
      { videoId: "mobility_hip_flexor_focus", order: 2, duration: 12, notes: "Hips for backpedal" },
    ],
    restBetweenVideos: 30,
    weeklyFrequency: "Daily for DBs",
    notes: [
      "Prevents groin strains common in DBs",
      "Improves backpedal depth",
      "Better hip turn transitions",
      "Complements Copenhagen strength work",
    ],
  },

  // ============================================================================
  // 15-MINUTE SESSIONS
  // ============================================================================
  {
    id: "session_15_speed",
    name: "15-Minute Speed Blast",
    description: "Quick speed session focusing on acceleration. Perfect for time-limited training.",
    totalDuration: 15,
    position: "All",
    focus: ["speed"],
    phase: "all",
    skillLevel: "all",
    videos: [
      { videoId: "speed_002", order: 1, duration: 12, notes: "Focus on first step" },
    ],
    restBetweenVideos: 60,
    weeklyFrequency: "2-3x per week",
    notes: ["Do after proper warm-up", "Full recovery between sprints"],
  },
  {
    id: "session_15_mobility",
    name: "15-Minute Hip Mobility",
    description: "Daily hip mobility routine to improve movement and prevent injury.",
    totalDuration: 15,
    position: "All",
    focus: ["mobility"],
    phase: "all",
    skillLevel: "all",
    videos: [
      { videoId: "mobility_001", order: 1, duration: 15 },
    ],
    restBetweenVideos: 0,
    weeklyFrequency: "Daily",
    notes: ["Can do morning or evening", "Great for recovery days"],
  },
  {
    id: "session_15_prehab",
    name: "15-Minute Injury Prevention",
    description: "Essential injury prevention exercises: Nordic curls and Copenhagen.",
    totalDuration: 15,
    position: "All",
    focus: ["injury_prevention"],
    phase: "all",
    skillLevel: "all",
    videos: [
      { videoId: "strength_002", order: 1, sets: 3, reps: "6-10" },
      { videoId: "strength_003", order: 2, sets: 3, reps: "8-12 each side" },
    ],
    restBetweenVideos: 60,
    weeklyFrequency: "3x per week",
    notes: ["Non-negotiable for all athletes", "Do year-round"],
  },

  // 30-MINUTE SESSIONS
  {
    id: "session_30_qb",
    name: "30-Minute QB Development",
    description: "Complete QB session covering arm care, footwork, and throwing on the run.",
    totalDuration: 30,
    position: "QB",
    focus: ["throwing", "skills", "injury_prevention"],
    phase: "all",
    skillLevel: "intermediate",
    videos: [
      { videoId: "qb_003", order: 1, duration: 12, notes: "Arm care first" },
      { videoId: "qb_004", order: 2, duration: 18, notes: "Footwork drills" },
    ],
    restBetweenVideos: 60,
    weeklyFrequency: "2-3x per week",
    notes: ["Always start with arm care", "Can add throwing after footwork"],
  },
  {
    id: "session_30_wr",
    name: "30-Minute WR Development",
    description: "Route running and catching development for receivers.",
    totalDuration: 30,
    position: "WR",
    focus: ["route_running", "catching"],
    phase: "all",
    skillLevel: "all",
    videos: [
      { videoId: "wr_001", order: 1, duration: 25, notes: "Route fundamentals" },
    ],
    restBetweenVideos: 60,
    weeklyFrequency: "2-3x per week",
    notes: ["Focus on technique over speed initially"],
  },
  {
    id: "session_30_db",
    name: "30-Minute DB Development",
    description: "Complete DB session covering backpedal, hip turns, and coverage.",
    totalDuration: 30,
    position: "DB",
    focus: ["coverage", "agility"],
    phase: "all",
    skillLevel: "all",
    videos: [
      { videoId: "db_001", order: 1, duration: 15, notes: "Backpedal technique" },
      { videoId: "db_002", order: 2, duration: 12, notes: "Hip turn drills" },
    ],
    restBetweenVideos: 60,
    weeklyFrequency: "2-3x per week",
    notes: ["Can combine with lateral movement drills"],
  },
  {
    id: "session_30_speed_agility",
    name: "30-Minute Speed & Agility",
    description: "Combined speed and agility session for all positions.",
    totalDuration: 30,
    position: "All",
    focus: ["speed", "agility"],
    phase: "pre_season",
    skillLevel: "intermediate",
    videos: [
      { videoId: "speed_002", order: 1, duration: 12 },
      { videoId: "agility_001", order: 2, duration: 8 },
      { videoId: "agility_003", order: 3, duration: 12 },
    ],
    restBetweenVideos: 90,
    weeklyFrequency: "2x per week",
    notes: ["Full recovery between drills", "Quality over quantity"],
  },

  // 45-MINUTE SESSIONS
  {
    id: "session_45_complete",
    name: "45-Minute Complete Athlete",
    description: "Full session covering speed, strength, and injury prevention.",
    totalDuration: 45,
    position: "All",
    focus: ["speed", "strength", "injury_prevention"],
    phase: "pre_season",
    skillLevel: "intermediate",
    videos: [
      { videoId: "mobility_004", order: 1, duration: 12, notes: "Warm-up" },
      { videoId: "speed_002", order: 2, duration: 12, notes: "Speed work" },
      { videoId: "strength_002", order: 3, sets: 3, reps: "6-10" },
      { videoId: "strength_005", order: 4, duration: 18 },
    ],
    restBetweenVideos: 90,
    weeklyFrequency: "2x per week",
    notes: ["Complete training session", "Covers all bases"],
  },
  {
    id: "session_45_rusher",
    name: "45-Minute Rusher Development",
    description: "Complete rusher training: get-off, rush moves, and pursuit.",
    totalDuration: 45,
    position: "Rusher",
    focus: ["rushing", "agility", "speed"],
    phase: "all",
    skillLevel: "all",
    videos: [
      { videoId: "mobility_004", order: 1, duration: 12, notes: "Warm-up" },
      { videoId: "rusher_001", order: 2, duration: 16, notes: "Get-off drills" },
      { videoId: "rusher_002", order: 3, duration: 20, notes: "Rush moves" },
    ],
    restBetweenVideos: 90,
    weeklyFrequency: "2x per week",
    notes: ["Focus on first step explosion"],
  },

  // 60-MINUTE SESSIONS
  {
    id: "session_60_strength",
    name: "60-Minute Strength Session",
    description: "Complete lower body strength session for off-season development.",
    totalDuration: 60,
    position: "All",
    focus: ["strength", "power"],
    phase: "off_season",
    skillLevel: "intermediate",
    videos: [
      { videoId: "mobility_004", order: 1, duration: 12, notes: "Warm-up" },
      { videoId: "strength_001", order: 2, duration: 30, notes: "Main lifts" },
      { videoId: "strength_004", order: 3, duration: 20, notes: "Power work" },
    ],
    restBetweenVideos: 120,
    weeklyFrequency: "2-3x per week",
    notes: ["Off-season focus", "Build strength base"],
  },
];

// ============================================================================
// WEEKLY PLANS FOR LIMITED PRACTICE ATHLETES
// ============================================================================

const WEEKLY_PLANS: WeeklyPlan[] = [
  // ============================================================================
  // DAILY MOBILITY PLAN (Foundation for all athletes)
  // ============================================================================
  {
    id: "plan_daily_mobility",
    name: "Daily Mobility Protocol",
    description: "Essential daily mobility routine for ALL flag football players. Do morning and evening mobility EVERY DAY regardless of your other training. This is the foundation for injury prevention and performance.",
    position: "All",
    teamPracticesPerWeek: 0,
    additionalSessionsRecommended: 14,
    sessions: [
      { day: "Monday", type: "individual", sessionId: "session_morning_mobility", duration: 10, focus: "Morning Mobility" },
      { day: "Monday", type: "individual", sessionId: "session_evening_mobility", duration: 15, focus: "Evening Mobility" },
      { day: "Tuesday", type: "individual", sessionId: "session_morning_mobility", duration: 10, focus: "Morning Mobility" },
      { day: "Tuesday", type: "individual", sessionId: "session_evening_mobility", duration: 15, focus: "Evening Mobility" },
      { day: "Wednesday", type: "individual", sessionId: "session_morning_mobility", duration: 10, focus: "Morning Mobility" },
      { day: "Wednesday", type: "individual", sessionId: "session_evening_mobility", duration: 15, focus: "Evening Mobility" },
      { day: "Thursday", type: "individual", sessionId: "session_morning_mobility", duration: 10, focus: "Morning Mobility" },
      { day: "Thursday", type: "individual", sessionId: "session_evening_mobility", duration: 15, focus: "Evening Mobility" },
      { day: "Friday", type: "individual", sessionId: "session_morning_mobility", duration: 10, focus: "Morning Mobility" },
      { day: "Friday", type: "individual", sessionId: "session_evening_mobility", duration: 15, focus: "Evening Mobility" },
      { day: "Saturday", type: "individual", sessionId: "session_morning_mobility", duration: 10, focus: "Morning Mobility" },
      { day: "Saturday", type: "individual", sessionId: "session_evening_mobility", duration: 15, focus: "Evening Mobility" },
      { day: "Sunday", type: "individual", sessionId: "session_morning_mobility", duration: 10, focus: "Morning Mobility" },
      { day: "Sunday", type: "individual", sessionId: "session_evening_mobility", duration: 15, focus: "Evening Mobility" },
    ],
    totalWeeklyMinutes: 175,
    goals: [
      "Maintain movement quality year-round",
      "Prevent injuries through consistent mobility work",
      "Improve sleep quality with evening routine",
      "Wake up the body each morning",
      "Build the habit of daily self-care",
    ],
  },

  // ============================================================================
  // WEEKLY PLANS WITH DAILY MOBILITY INCLUDED
  // ============================================================================
  {
    id: "plan_1_practice",
    name: "1 Practice Per Week Plan (with Daily Mobility)",
    description: "For athletes with only 1 team practice per week. Includes DAILY morning and evening mobility plus focused training sessions. Maximize individual development.",
    position: "All",
    teamPracticesPerWeek: 1,
    additionalSessionsRecommended: 4,
    sessions: [
      { day: "Monday", type: "individual", sessionId: "session_30_speed_agility", duration: 30, focus: "Speed & Agility + Daily Mobility" },
      { day: "Tuesday", type: "individual", sessionId: "session_15_prehab", duration: 15, focus: "Injury Prevention + Daily Mobility" },
      { day: "Wednesday", type: "team_practice", duration: 90, focus: "Team Practice + Daily Mobility" },
      { day: "Thursday", type: "recovery", sessionId: "session_daily_full_mobility", duration: 25, focus: "Recovery - Full Mobility Day" },
      { day: "Friday", type: "individual", sessionId: "session_45_complete", duration: 45, focus: "Complete Training + Daily Mobility" },
      { day: "Saturday", type: "individual", sessionId: "session_targeted_hip_flexors", duration: 12, focus: "Hip Flexor Focus + Daily Mobility" },
      { day: "Sunday", type: "rest", sessionId: "session_rest_day_recovery", duration: 35, focus: "Rest Day - Stretching + Foam Rolling" },
    ],
    totalWeeklyMinutes: 400,
    goals: [
      "Daily mobility (morning + evening) EVERY day",
      "Maintain fitness between practices",
      "Develop individual skills",
      "Prevent injuries with consistent prehab",
    ],
  },
  {
    id: "plan_2_practice",
    name: "2 Practices Per Week Plan (with Daily Mobility)",
    description: "For athletes with 2 team practices per week. Includes DAILY mobility plus targeted individual work.",
    position: "All",
    teamPracticesPerWeek: 2,
    additionalSessionsRecommended: 3,
    sessions: [
      { day: "Monday", type: "individual", sessionId: "session_30_speed_agility", duration: 30, focus: "Speed & Agility" },
      { day: "Tuesday", type: "team_practice", duration: 90, focus: "Team Practice" },
      { day: "Wednesday", type: "individual", sessionId: "session_15_prehab", duration: 15, focus: "Injury Prevention" },
      { day: "Thursday", type: "team_practice", duration: 90, focus: "Team Practice" },
      { day: "Friday", type: "recovery", duration: 20, focus: "Recovery" },
      { day: "Saturday", type: "individual", sessionId: "session_15_mobility", duration: 15, focus: "Mobility" },
      { day: "Sunday", type: "rest", sessionId: "session_rest_day_stretching_only", duration: 20, focus: "Rest Day - Stretching" },
    ],
    totalWeeklyMinutes: 280,
    goals: [
      "Complement team practices",
      "Focus on individual weaknesses",
      "Maintain injury prevention routine",
    ],
  },
  {
    id: "plan_1_practice_qb",
    name: "1 Practice Per Week - QB Specific",
    description: "QB-specific plan for athletes with only 1 team practice per week.",
    position: "QB",
    teamPracticesPerWeek: 1,
    additionalSessionsRecommended: 4,
    sessions: [
      { day: "Monday", type: "individual", sessionId: "session_30_qb", duration: 30, focus: "QB Development" },
      { day: "Tuesday", type: "individual", sessionId: "session_15_prehab", duration: 15, focus: "Arm Care + Prehab" },
      { day: "Wednesday", type: "team_practice", duration: 90, focus: "Team Practice" },
      { day: "Thursday", type: "individual", sessionId: "session_30_qb", duration: 30, focus: "QB Development" },
      { day: "Friday", type: "recovery", duration: 20, focus: "Recovery" },
      { day: "Saturday", type: "individual", sessionId: "session_15_mobility", duration: 15, focus: "Mobility" },
      { day: "Sunday", type: "rest", sessionId: "session_rest_day_stretching_only", duration: 20, focus: "Rest Day - Stretching" },
    ],
    totalWeeklyMinutes: 220,
    goals: [
      "Develop throwing mechanics",
      "Maintain arm health",
      "Build footwork and pocket presence",
      "Rest day stretching for recovery",
    ],
  },
  {
    id: "plan_1_practice_wr",
    name: "1 Practice Per Week - WR Specific",
    description: "WR-specific plan for athletes with only 1 team practice per week.",
    position: "WR",
    teamPracticesPerWeek: 1,
    additionalSessionsRecommended: 4,
    sessions: [
      { day: "Monday", type: "individual", sessionId: "session_30_wr", duration: 30, focus: "Route Running" },
      { day: "Tuesday", type: "individual", sessionId: "session_30_speed_agility", duration: 30, focus: "Speed & Agility" },
      { day: "Wednesday", type: "team_practice", duration: 90, focus: "Team Practice" },
      { day: "Thursday", type: "individual", sessionId: "session_15_prehab", duration: 15, focus: "Injury Prevention" },
      { day: "Friday", type: "recovery", duration: 20, focus: "Recovery" },
      { day: "Saturday", type: "individual", sessionId: "session_15_mobility", duration: 15, focus: "Mobility" },
      { day: "Sunday", type: "rest", sessionId: "session_rest_day_stretching_only", duration: 20, focus: "Rest Day - Stretching" },
    ],
    totalWeeklyMinutes: 220,
    goals: [
      "Master route running technique",
      "Develop speed and acceleration",
      "Improve catching ability",
      "Rest day stretching for recovery",
    ],
  },
  {
    id: "plan_1_practice_db",
    name: "1 Practice Per Week - DB Specific",
    description: "DB-specific plan for athletes with only 1 team practice per week.",
    position: "DB",
    teamPracticesPerWeek: 1,
    additionalSessionsRecommended: 4,
    sessions: [
      { day: "Monday", type: "individual", sessionId: "session_30_db", duration: 30, focus: "Coverage Skills" },
      { day: "Tuesday", type: "individual", sessionId: "session_30_speed_agility", duration: 30, focus: "Speed & Agility" },
      { day: "Wednesday", type: "team_practice", duration: 90, focus: "Team Practice" },
      { day: "Thursday", type: "individual", sessionId: "session_15_prehab", duration: 15, focus: "Injury Prevention" },
      { day: "Friday", type: "recovery", duration: 20, focus: "Recovery" },
      { day: "Saturday", type: "individual", sessionId: "session_15_mobility", duration: 15, focus: "Mobility" },
      { day: "Sunday", type: "rest", sessionId: "session_rest_day_stretching_only", duration: 20, focus: "Rest Day - Stretching" },
    ],
    totalWeeklyMinutes: 220,
    goals: [
      "Master backpedal and hip turns",
      "Develop reactive agility",
      "Improve lateral movement",
      "Rest day stretching for recovery",
    ],
  },
  {
    id: "plan_tournament_prep",
    name: "Tournament Preparation Week",
    description: "Week before a tournament. Reduce volume, maintain sharpness.",
    position: "All",
    teamPracticesPerWeek: 1,
    additionalSessionsRecommended: 2,
    sessions: [
      { day: "Monday", type: "individual", sessionId: "session_15_speed", duration: 15, focus: "Speed Sharpness" },
      { day: "Tuesday", type: "individual", sessionId: "session_15_prehab", duration: 15, focus: "Injury Prevention" },
      { day: "Wednesday", type: "team_practice", duration: 60, focus: "Light Team Practice" },
      { day: "Thursday", type: "individual", sessionId: "session_15_mobility", duration: 15, focus: "Mobility" },
      { day: "Friday", type: "rest", duration: 0, focus: "Rest - Travel" },
      { day: "Saturday", type: "rest", duration: 0, focus: "Tournament Day 1" },
      { day: "Sunday", type: "rest", duration: 0, focus: "Tournament Day 2" },
    ],
    totalWeeklyMinutes: 105,
    goals: [
      "Maintain sharpness without fatigue",
      "Arrive fresh for tournament",
      "Focus on injury prevention",
    ],
  },
];

// ============================================================================
// SERVICE
// ============================================================================

@Injectable({
  providedIn: "root",
})
export class TrainingVideoDatabaseService {
  // Signals for reactive state
  private _allVideos = signal<TrainingVideo[]>(VIDEO_DATABASE);
  private _allSessions = signal<TrainingSession[]>(TRAINING_SESSIONS);
  private _allPlans = signal<WeeklyPlan[]>(WEEKLY_PLANS);

  // Computed values
  readonly totalVideos = computed(() => this._allVideos().length);
  readonly totalSessions = computed(() => this._allSessions().length);
  readonly totalPlans = computed(() => this._allPlans().length);

  // ============================================================================
  // VIDEO METHODS
  // ============================================================================

  /**
   * Get all videos
   */
  getAllVideos(): TrainingVideo[] {
    return this._allVideos();
  }

  /**
   * Get video by ID
   */
  getVideoById(id: string): TrainingVideo | undefined {
    return this._allVideos().find((v) => v.id === id);
  }

  /**
   * Get videos by position
   */
  getVideosByPosition(position: FlagPosition): TrainingVideo[] {
    return this._allVideos().filter(
      (v) => v.positions.includes(position) || v.positions.includes("All")
    );
  }

  /**
   * Get videos by training focus
   */
  getVideosByFocus(focus: TrainingFocus): TrainingVideo[] {
    return this._allVideos().filter((v) => v.trainingFocus.includes(focus));
  }

  /**
   * Get videos by duration (max minutes)
   */
  getVideosByDuration(maxMinutes: number): TrainingVideo[] {
    return this._allVideos().filter((v) => v.duration <= maxMinutes);
  }

  /**
   * Get videos by skill level
   */
  getVideosBySkillLevel(level: SkillLevel): TrainingVideo[] {
    return this._allVideos().filter(
      (v) => v.skillLevel === level || v.skillLevel === "all"
    );
  }

  /**
   * Get videos by training phase
   */
  getVideosByPhase(phase: TrainingPhase): TrainingVideo[] {
    return this._allVideos().filter(
      (v) => v.phase.includes(phase) || v.phase.includes("all")
    );
  }

  /**
   * Get videos by equipment required
   */
  getVideosByEquipment(equipment: Equipment[]): TrainingVideo[] {
    return this._allVideos().filter((v) =>
      v.equipment.every((e) => equipment.includes(e) || e === "none")
    );
  }

  /**
   * Search videos by keyword
   */
  searchVideos(keyword: string): TrainingVideo[] {
    const lowerKeyword = keyword.toLowerCase();
    return this._allVideos().filter(
      (v) =>
        v.title.toLowerCase().includes(lowerKeyword) ||
        v.description.toLowerCase().includes(lowerKeyword) ||
        v.tags.some((t) => t.toLowerCase().includes(lowerKeyword))
    );
  }

  /**
   * Get top-rated videos
   */
  getTopRatedVideos(limit: number = 10): TrainingVideo[] {
    return [...this._allVideos()]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }

  /**
   * Get videos with no equipment required
   */
  getNoEquipmentVideos(): TrainingVideo[] {
    return this._allVideos().filter(
      (v) => v.equipment.length === 1 && v.equipment[0] === "none"
    );
  }

  /**
   * Advanced filter
   */
  filterVideos(filters: {
    position?: FlagPosition;
    focus?: TrainingFocus[];
    maxDuration?: number;
    skillLevel?: SkillLevel;
    phase?: TrainingPhase;
    equipment?: Equipment[];
  }): TrainingVideo[] {
    let results = this._allVideos();

    if (filters.position) {
      results = results.filter(
        (v) => v.positions.includes(filters.position!) || v.positions.includes("All")
      );
    }

    if (filters.focus && filters.focus.length > 0) {
      results = results.filter((v) =>
        filters.focus!.some((f) => v.trainingFocus.includes(f))
      );
    }

    if (filters.maxDuration) {
      results = results.filter((v) => v.duration <= filters.maxDuration!);
    }

    if (filters.skillLevel) {
      results = results.filter(
        (v) => v.skillLevel === filters.skillLevel || v.skillLevel === "all"
      );
    }

    if (filters.phase) {
      results = results.filter(
        (v) => v.phase.includes(filters.phase!) || v.phase.includes("all")
      );
    }

    if (filters.equipment && filters.equipment.length > 0) {
      results = results.filter((v) =>
        v.equipment.every((e) => filters.equipment!.includes(e) || e === "none")
      );
    }

    return results;
  }

  // ============================================================================
  // SESSION METHODS
  // ============================================================================

  /**
   * Get all training sessions
   */
  getAllSessions(): TrainingSession[] {
    return this._allSessions();
  }

  /**
   * Get session by ID
   */
  getSessionById(id: string): TrainingSession | undefined {
    return this._allSessions().find((s) => s.id === id);
  }

  /**
   * Get sessions by duration
   */
  getSessionsByDuration(duration: 15 | 30 | 45 | 60): TrainingSession[] {
    return this._allSessions().filter((s) => s.totalDuration === duration);
  }

  /**
   * Get sessions by position
   */
  getSessionsByPosition(position: FlagPosition): TrainingSession[] {
    return this._allSessions().filter(
      (s) => s.position === position || s.position === "All"
    );
  }

  /**
   * Get session with full video details
   */
  getSessionWithVideos(sessionId: string): {
    session: TrainingSession;
    videos: TrainingVideo[];
  } | null {
    const session = this.getSessionById(sessionId);
    if (!session) return null;

    const videos = session.videos
      .map((sv) => this.getVideoById(sv.videoId))
      .filter((v): v is TrainingVideo => v !== undefined);

    return { session, videos };
  }

  // ============================================================================
  // WEEKLY PLAN METHODS
  // ============================================================================

  /**
   * Get all weekly plans
   */
  getAllPlans(): WeeklyPlan[] {
    return this._allPlans();
  }

  /**
   * Get plan by ID
   */
  getPlanById(id: string): WeeklyPlan | undefined {
    return this._allPlans().find((p) => p.id === id);
  }

  /**
   * Get plans by team practice frequency
   */
  getPlansByPracticeFrequency(practicesPerWeek: number): WeeklyPlan[] {
    return this._allPlans().filter(
      (p) => p.teamPracticesPerWeek === practicesPerWeek
    );
  }

  /**
   * Get plans by position
   */
  getPlansByPosition(position: FlagPosition): WeeklyPlan[] {
    return this._allPlans().filter(
      (p) => p.position === position || p.position === "All"
    );
  }

  /**
   * Get recommended plan for athlete
   */
  getRecommendedPlan(
    position: FlagPosition,
    practicesPerWeek: number
  ): WeeklyPlan | undefined {
    // First try to find position-specific plan
    const positionPlan = this._allPlans().find(
      (p) =>
        p.position === position && p.teamPracticesPerWeek === practicesPerWeek
    );

    if (positionPlan) return positionPlan;

    // Fall back to general plan
    return this._allPlans().find(
      (p) =>
        p.position === "All" && p.teamPracticesPerWeek === practicesPerWeek
    );
  }

  /**
   * Get plan with full session and video details
   */
  getPlanWithDetails(planId: string): {
    plan: WeeklyPlan;
    sessionDetails: { day: string; session: TrainingSession | null; videos: TrainingVideo[] }[];
  } | null {
    const plan = this.getPlanById(planId);
    if (!plan) return null;

    const sessionDetails = plan.sessions.map((ws) => {
      if (ws.type !== "individual" || !ws.sessionId) {
        return { day: ws.day, session: null, videos: [] };
      }

      const sessionData = this.getSessionWithVideos(ws.sessionId);
      return {
        day: ws.day,
        session: sessionData?.session || null,
        videos: sessionData?.videos || [],
      };
    });

    return { plan, sessionDetails };
  }

  // ============================================================================
  // RECOMMENDATION METHODS
  // ============================================================================

  /**
   * Get quick workout recommendation
   */
  getQuickWorkout(
    availableMinutes: number,
    position: FlagPosition,
    focus?: TrainingFocus
  ): TrainingVideo[] {
    let videos = this.filterVideos({
      position,
      maxDuration: availableMinutes,
      focus: focus ? [focus] : undefined,
    });

    // Sort by rating and return best matches
    return videos.sort((a, b) => b.rating - a.rating).slice(0, 3);
  }

  /**
   * Get today's recommended videos
   */
  getTodaysRecommendation(
    position: FlagPosition,
    phase: TrainingPhase,
    dayOfWeek: number // 0 = Sunday, 6 = Saturday
  ): TrainingVideo[] {
    // Define focus by day of week
    const dayFocus: Record<number, TrainingFocus[]> = {
      0: ["recovery", "mobility"], // Sunday
      1: ["speed", "power"], // Monday
      2: ["strength"], // Tuesday
      3: ["agility", "skills"], // Wednesday
      4: ["skills"], // Thursday
      5: ["conditioning"], // Friday
      6: ["speed", "agility"], // Saturday
    };

    return this.filterVideos({
      position,
      focus: dayFocus[dayOfWeek],
      phase,
    }).slice(0, 5);
  }

  /**
   * Get videos for specific training need
   */
  getVideosForNeed(need: string): TrainingVideo[] {
    const needMappings: Record<string, { focus: TrainingFocus[]; tags: string[] }> = {
      "faster_40": { focus: ["speed"], tags: ["40 yard dash", "acceleration"] },
      "better_cuts": { focus: ["agility"], tags: ["COD", "cutting", "deceleration"] },
      "injury_prevention": { focus: ["injury_prevention"], tags: ["Nordic", "Copenhagen", "prehab"] },
      "arm_health": { focus: ["injury_prevention"], tags: ["arm care", "shoulder"] },
      "route_running": { focus: ["route_running"], tags: ["routes", "technique"] },
      "coverage": { focus: ["coverage"], tags: ["backpedal", "hip turn", "zone"] },
      "first_step": { focus: ["speed"], tags: ["first step", "explosion", "acceleration"] },
    };

    const mapping = needMappings[need];
    if (!mapping) return [];

    return this._allVideos().filter(
      (v) =>
        v.trainingFocus.some((f) => mapping.focus.includes(f)) ||
        v.tags.some((t) => mapping.tags.some((mt) => t.toLowerCase().includes(mt.toLowerCase())))
    );
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Get video statistics
   */
  getVideoStats(): {
    totalVideos: number;
    byPosition: Record<string, number>;
    byFocus: Record<string, number>;
    totalMinutes: number;
    averageRating: number;
  } {
    const videos = this._allVideos();

    const byPosition: Record<string, number> = {};
    const byFocus: Record<string, number> = {};

    videos.forEach((v) => {
      v.positions.forEach((p) => {
        byPosition[p] = (byPosition[p] || 0) + 1;
      });
      v.trainingFocus.forEach((f) => {
        byFocus[f] = (byFocus[f] || 0) + 1;
      });
    });

    return {
      totalVideos: videos.length,
      byPosition,
      byFocus,
      totalMinutes: videos.reduce((sum, v) => sum + v.duration, 0),
      averageRating: videos.reduce((sum, v) => sum + v.rating, 0) / videos.length,
    };
  }

  // ============================================================================
  // DAILY MOBILITY METHODS
  // ============================================================================

  /**
   * Get daily mobility routine based on time of day
   */
  getDailyMobilityRoutine(timeOfDay: "morning" | "evening" | "both"): TrainingVideo[] {
    const mobilityVideos = this._allVideos().filter(
      (v) => v.tags.includes("morning routine") || v.tags.includes("evening routine") || v.tags.includes("daily mobility")
    );

    if (timeOfDay === "morning") {
      return mobilityVideos.filter((v) => v.tags.includes("morning routine") || v.tags.includes("wake up"));
    } else if (timeOfDay === "evening") {
      return mobilityVideos.filter((v) => v.tags.includes("evening routine") || v.tags.includes("before bed"));
    }
    
    return mobilityVideos;
  }

  /**
   * Get the main daily mobility playlist
   */
  getDailyMobilityPlaylist(): TrainingVideo | undefined {
    return this._allVideos().find((v) => v.id === "mobility_daily_playlist");
  }

  /**
   * Get position-specific mobility routine
   */
  getPositionMobilityRoutine(position: FlagPosition): TrainingSession | undefined {
    const positionMobilitySessions: Record<string, string> = {
      "QB": "session_qb_mobility",
      "DB": "session_db_mobility",
      "WR": "session_targeted_hip_flexors",
      "Center": "session_targeted_hip_flexors",
      "Rusher": "session_targeted_ankles",
      "LB": "session_db_mobility",
      "Hybrid": "session_daily_full_mobility",
      "All": "session_daily_full_mobility",
    };

    const sessionId = positionMobilitySessions[position];
    return this.getSessionById(sessionId);
  }

  /**
   * Get targeted mobility for specific body area
   */
  getTargetedMobility(bodyArea: "hips" | "ankles" | "thoracic" | "groin" | "full"): TrainingVideo[] {
    const areaMapping: Record<string, string[]> = {
      "hips": ["hip flexors", "hip mobility", "psoas"],
      "ankles": ["ankle", "achilles", "calves"],
      "thoracic": ["thoracic", "t-spine", "upper back"],
      "groin": ["groin", "adductors", "inner thigh"],
      "full": ["full body", "daily mobility"],
    };

    const keywords = areaMapping[bodyArea];
    return this._allVideos().filter(
      (v) =>
        v.trainingFocus.includes("mobility") &&
        (v.muscleGroups.some((m) => keywords.some((k) => m.toLowerCase().includes(k))) ||
         v.tags.some((t) => keywords.some((k) => t.toLowerCase().includes(k))))
    );
  }

  /**
   * Get complete daily protocol for an athlete
   */
  getCompleteDailyProtocol(position: FlagPosition): {
    morning: TrainingVideo | undefined;
    evening: TrainingVideo | undefined;
    positionSpecific: TrainingSession | undefined;
    playlist: TrainingVideo | undefined;
    totalDailyMinutes: number;
    weeklyMinutes: number;
  } {
    const morning = this.getVideoById("mobility_morning");
    const evening = this.getVideoById("mobility_evening");
    const positionSpecific = this.getPositionMobilityRoutine(position);
    const playlist = this.getDailyMobilityPlaylist();

    const morningDuration = morning?.duration || 0;
    const eveningDuration = evening?.duration || 0;
    const totalDailyMinutes = morningDuration + eveningDuration;

    return {
      morning,
      evening,
      positionSpecific,
      playlist,
      totalDailyMinutes,
      weeklyMinutes: totalDailyMinutes * 7,
    };
  }

  /**
   * Get mobility videos suitable for pre-sleep
   */
  getPreSleepMobility(): TrainingVideo[] {
    return this._allVideos().filter(
      (v) =>
        v.trainingFocus.includes("mobility") &&
        (v.tags.includes("evening routine") ||
         v.tags.includes("before bed") ||
         v.tags.includes("sleep") ||
         v.tags.includes("wind down") ||
         v.tags.includes("recovery"))
    );
  }

  /**
   * Get all mobility videos organized by time/purpose
   */
  getAllMobilityVideos(): {
    morning: TrainingVideo[];
    evening: TrainingVideo[];
    targeted: TrainingVideo[];
    recovery: TrainingVideo[];
    warmUp: TrainingVideo[];
    foamRolling: TrainingVideo[];
    playlist: TrainingVideo | undefined;
  } {
    const allMobility = this._allVideos().filter(
      (v) => v.trainingFocus.includes("mobility") || v.trainingFocus.includes("recovery")
    );

    return {
      morning: allMobility.filter((v) => v.tags.includes("morning routine") || v.tags.includes("wake up")),
      evening: allMobility.filter((v) => v.tags.includes("evening routine") || v.tags.includes("before bed")),
      targeted: allMobility.filter((v) => 
        v.tags.includes("hip flexors") || 
        v.tags.includes("ankle") || 
        v.tags.includes("thoracic") || 
        v.tags.includes("groin")
      ),
      recovery: allMobility.filter((v) => v.trainingFocus.includes("recovery")),
      warmUp: allMobility.filter((v) => v.drillTypes.includes("warm_up")),
      foamRolling: allMobility.filter((v) => v.tags.includes("foam rolling")),
      playlist: this.getDailyMobilityPlaylist(),
    };
  }

  // ============================================================================
  // SCHEDULE-BASED RECOMMENDATIONS
  // ============================================================================

  /**
   * Get foam rolling video
   */
  getFoamRollingVideo(): TrainingVideo | undefined {
    return this._allVideos().find((v) => v.id === "foam_rolling_routine");
  }

  /**
   * Get routine recommendation based on athlete's work schedule
   */
  getScheduleBasedRoutine(scheduleType: WorkScheduleType): DailyRoutineRecommendation {
    return SCHEDULE_RECOMMENDATIONS[scheduleType];
  }

  /**
   * Get all schedule types with descriptions
   */
  getAllScheduleTypes(): { type: WorkScheduleType; name: string; description: string }[] {
    return [
      { 
        type: "early_bird", 
        name: "Early Bird (6am start)", 
        description: "You start work around 6am - no time for morning mobility" 
      },
      { 
        type: "standard", 
        name: "Standard (9am start)", 
        description: "You start work around 9am - time for morning routine" 
      },
      { 
        type: "late_starter", 
        name: "Late Starter (afternoon)", 
        description: "You start work in the afternoon - lots of morning time" 
      },
      { 
        type: "shift_worker", 
        name: "Shift Worker", 
        description: "Variable shifts - need flexible routine" 
      },
      { 
        type: "student", 
        name: "Student", 
        description: "Student schedule - flexible with more free time" 
      },
      { 
        type: "remote_worker", 
        name: "Remote Worker", 
        description: "Work from home - most flexible schedule" 
      },
    ];
  }

  /**
   * Get personalized daily routine based on schedule and practice day
   */
  getPersonalizedDailyRoutine(
    scheduleType: WorkScheduleType,
    isPracticeDay: boolean,
    hasMorningTime: boolean
  ): {
    routines: { time: string; video: TrainingVideo | undefined; notes: string }[];
    totalMinutes: number;
    explanation: string;
  } {
    const recommendation = SCHEDULE_RECOMMENDATIONS[scheduleType];
    const routines: { time: string; video: TrainingVideo | undefined; notes: string }[] = [];
    let totalMinutes = 0;

    // Morning routine (if applicable and has time)
    if (recommendation.morning && hasMorningTime) {
      const video = this.getVideoById(recommendation.morning.videoId);
      routines.push({
        time: "Morning",
        video,
        notes: recommendation.morning.description,
      });
      totalMinutes += recommendation.morning.duration;
    }

    // Practice day logic
    if (isPracticeDay) {
      // After practice: always foam rolling
      const foamRolling = this.getFoamRollingVideo();
      routines.push({
        time: "After Practice",
        video: foamRolling,
        notes: "Foam rolling after practice for recovery - replaces evening routine",
      });
      totalMinutes += 15;
    } else {
      // Non-practice day: evening routine
      if (recommendation.evening) {
        const video = this.getVideoById(recommendation.evening.videoId);
        routines.push({
          time: "Evening",
          video,
          notes: recommendation.evening.description,
        });
        totalMinutes += recommendation.evening.duration;
      }
    }

    // Build explanation
    let explanation = "";
    if (scheduleType === "early_bird") {
      explanation = "Since you start work early, focus on evening recovery. On practice days, foam rolling after practice is your main recovery work.";
    } else if (scheduleType === "standard") {
      explanation = "You have the ideal schedule for both morning mobility and evening foam rolling. On practice days, do foam rolling after practice instead of evening.";
    } else if (scheduleType === "late_starter") {
      explanation = "Use your morning time for extended mobility work. Evenings are free for rest.";
    } else if (scheduleType === "shift_worker") {
      explanation = "Adapt to your shifts - the key is consistency. Always do something before sleep, and always foam roll after practice.";
    } else if (scheduleType === "student") {
      explanation = "You have more flexibility - use it to build great habits. Extended routines will pay off long-term.";
    } else if (scheduleType === "remote_worker") {
      explanation = "Working from home gives you the most flexibility. You can even add mid-day mobility breaks.";
    }

    return {
      routines,
      totalMinutes,
      explanation,
    };
  }

  /**
   * Get weekly mobility schedule based on athlete profile
   */
  getWeeklyMobilitySchedule(
    scheduleType: WorkScheduleType,
    practiceDays: string[] // e.g., ["Tuesday", "Thursday"]
  ): {
    day: string;
    morning: string | null;
    evening: string | null;
    notes: string;
  }[] {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const recommendation = SCHEDULE_RECOMMENDATIONS[scheduleType];

    return days.map((day) => {
      const isPracticeDay = practiceDays.includes(day);
      
      let morning: string | null = null;
      let evening: string | null = null;
      let notes = "";

      // Morning routine
      if (recommendation.morning && scheduleType !== "early_bird") {
        morning = "Morning Mobility (10 min)";
      }

      // Evening/After practice
      if (isPracticeDay) {
        evening = "Foam Rolling after practice (15 min)";
        notes = "Practice day - foam rolling replaces evening mobility";
      } else {
        if (recommendation.evening) {
          evening = scheduleType === "standard" || scheduleType === "remote_worker"
            ? "Foam Rolling before bed (15 min)"
            : "Evening Mobility (15 min)";
        }
        notes = "Rest day - full recovery routine";
      }

      // Weekend adjustments
      if (day === "Saturday" || day === "Sunday") {
        if (!isPracticeDay) {
          notes = "Weekend - great time for extended mobility work";
        }
      }

      return { day, morning, evening, notes };
    });
  }

  /**
   * Determine best schedule type based on work hours
   */
  suggestScheduleType(workStartHour: number): WorkScheduleType {
    if (workStartHour <= 6) return "early_bird";
    if (workStartHour <= 9) return "standard";
    if (workStartHour >= 12) return "late_starter";
    return "standard";
  }

  /**
   * Get practice day foam rolling recommendation
   */
  getPracticeDayRecovery(): {
    video: TrainingVideo | undefined;
    timing: string;
    notes: string[];
  } {
    return {
      video: this.getFoamRollingVideo(),
      timing: "Within 30 minutes after practice",
      notes: [
        "Foam rolling after practice is more effective than later",
        "Focus on areas that feel tight from practice",
        "This replaces your evening mobility routine",
        "Helps reduce next-day soreness",
        "Improves recovery before next training session",
      ],
    };
  }

  // ============================================================================
  // REST DAY METHODS
  // ============================================================================

  /**
   * Get rest day stretching video
   */
  getRestDayStretchingVideo(): TrainingVideo | undefined {
    return this._allVideos().find((v) => v.id === "rest_day_stretching");
  }

  /**
   * Get rest day recovery recommendation
   */
  getRestDayRecovery(intensityLevel: "light" | "moderate" | "full"): {
    session: TrainingSession | undefined;
    videos: TrainingVideo[];
    totalMinutes: number;
    description: string;
    notes: string[];
  } {
    let sessionId: string;
    let description: string;
    let notes: string[];

    switch (intensityLevel) {
      case "light":
        sessionId = "session_rest_day_stretching_only";
        description = "Light stretching only - perfect when you're very sore or fatigued";
        notes = [
          "Just stretching, no foam rolling",
          "Good for when you're feeling beat up",
          "Can do any time of day",
          "Maintains flexibility without stress",
        ];
        break;
      case "moderate":
        sessionId = "session_rest_day_recovery";
        description = "Stretching + foam rolling - standard rest day recovery";
        notes = [
          "Combines stretching and foam rolling",
          "Good balance of recovery work",
          "Can split into two sessions if preferred",
          "Recommended for most rest days",
        ];
        break;
      case "full":
        sessionId = "session_active_recovery_day";
        description = "Full active recovery - morning mobility + stretching + evening foam rolling";
        notes = [
          "The complete recovery protocol",
          "Split across the day",
          "Best for the day after tournaments or hard training",
          "Maximizes recovery without training stress",
        ];
        break;
    }

    const session = this.getSessionById(sessionId);
    const videos = session?.videos
      .map((sv) => this.getVideoById(sv.videoId))
      .filter((v): v is TrainingVideo => v !== undefined) || [];

    return {
      session,
      videos,
      totalMinutes: session?.totalDuration || 0,
      description,
      notes,
    };
  }

  /**
   * Get all rest day sessions
   */
  getRestDaySessions(): TrainingSession[] {
    return this._allSessions().filter(
      (s) => s.id.includes("rest_day") || s.id.includes("active_recovery")
    );
  }

  /**
   * Get recommended rest day routine based on previous day's activity
   */
  getRestDayRecommendation(previousDayActivity: "tournament" | "hard_practice" | "light_training" | "rest"): {
    recommendation: string;
    session: TrainingSession | undefined;
    rationale: string;
  } {
    switch (previousDayActivity) {
      case "tournament":
        return {
          recommendation: "Full Active Recovery Day",
          session: this.getSessionById("session_active_recovery_day"),
          rationale: "After a tournament, your body needs maximum recovery. Spread mobility, stretching, and foam rolling throughout the day.",
        };
      case "hard_practice":
        return {
          recommendation: "Rest Day Recovery (Stretching + Foam Rolling)",
          session: this.getSessionById("session_rest_day_recovery"),
          rationale: "After hard practice, combine stretching and foam rolling to reduce soreness and maintain flexibility.",
        };
      case "light_training":
        return {
          recommendation: "Rest Day Stretching Only",
          session: this.getSessionById("session_rest_day_stretching_only"),
          rationale: "After light training, stretching is sufficient. Save foam rolling for after harder sessions.",
        };
      case "rest":
        return {
          recommendation: "Rest Day Stretching Only",
          session: this.getSessionById("session_rest_day_stretching_only"),
          rationale: "If yesterday was also rest, light stretching keeps you loose without overdoing recovery work.",
        };
    }
  }

  /**
   * Get complete day type recommendations
   */
  getDayTypeRecommendation(dayType: "practice" | "training" | "rest" | "tournament"): {
    morning: TrainingVideo | undefined;
    mainActivity: string;
    evening: TrainingVideo | undefined;
    notes: string[];
  } {
    const morningMobility = this.getVideoById("mobility_morning");
    const foamRolling = this.getFoamRollingVideo();
    const eveningMobility = this.getVideoById("mobility_evening");
    const restDayStretching = this.getRestDayStretchingVideo();

    switch (dayType) {
      case "practice":
        return {
          morning: morningMobility,
          mainActivity: "Team Practice",
          evening: foamRolling,
          notes: [
            "Morning mobility to prepare for practice",
            "Foam rolling after practice (replaces evening mobility)",
            "Focus on areas worked during practice",
          ],
        };
      case "training":
        return {
          morning: morningMobility,
          mainActivity: "Individual Training",
          evening: foamRolling,
          notes: [
            "Morning mobility to prepare for training",
            "Foam rolling after training",
            "Can do evening mobility if training was light",
          ],
        };
      case "rest":
        return {
          morning: morningMobility,
          mainActivity: "Rest Day Stretching",
          evening: foamRolling,
          notes: [
            "Morning mobility to start the day",
            "Stretching midday or afternoon",
            "Foam rolling before bed",
            "Can combine stretching + foam rolling into one session",
          ],
        };
      case "tournament":
        return {
          morning: morningMobility,
          mainActivity: "Tournament Games",
          evening: undefined,
          notes: [
            "Light morning mobility only",
            "Save energy for games",
            "Light foam rolling between games if time",
            "Full recovery protocol the day after tournament",
          ],
        };
    }
  }
}
