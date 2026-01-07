/**
 * Instagram Video Service
 *
 * INSTAGRAM REELS & VIDEO INTEGRATION FOR FLAG FOOTBALL ATHLETES
 *
 * This service provides Instagram video embedding, curated training content
 * from Instagram Reels, and integration with the training video system.
 *
 * Features:
 * - Instagram Reel embedding via oEmbed API
 * - Curated flag football training content from Instagram creators
 * - Position-specific drill videos from pro athletes
 * - Integration with existing training video database
 * - Caching for performance optimization
 * - Platform detection and fallback handling
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 * @angular 21
 */

import { Injectable, inject, signal, computed } from "@angular/core";
import { LoggerService } from "./logger.service";
import {
  FlagPosition,
  TrainingFocus,
  SkillLevel,
  TrainingPhase,
} from "./training-video-database.service";

// ============================================================================
// INTERFACES
// ============================================================================

export interface InstagramVideo {
  id: string;
  shortcode: string;
  title: string;
  description: string;
  url: string;
  embedUrl: string;
  thumbnailUrl?: string;
  duration?: number; // seconds (if available)
  creator: InstagramCreator;
  positions: FlagPosition[];
  trainingFocus: TrainingFocus[];
  skillLevel: SkillLevel;
  phase: TrainingPhase[];
  tags: string[];
  rating: number;
  addedDate: string;
  isReel: boolean;
  viewCount?: number;
  likeCount?: number;
}

export interface InstagramCreator {
  username: string;
  displayName: string;
  profileUrl: string;
  verified: boolean;
  credibility: "pro_athlete" | "coach" | "trainer" | "influencer" | "team";
  sport?: string;
  position?: FlagPosition;
  followers?: number;
}

export interface InstagramEmbedResponse {
  version: string;
  title: string;
  author_name: string;
  author_url: string;
  author_id: number;
  media_id: string;
  provider_name: string;
  provider_url: string;
  type: string;
  width: number;
  height?: number;
  html: string;
  thumbnail_url: string;
  thumbnail_width: number;
  thumbnail_height: number;
}

export interface InstagramVideoFilter {
  positions?: FlagPosition[];
  focus?: TrainingFocus[];
  skillLevel?: SkillLevel;
  phase?: TrainingPhase;
  creator?: string;
  tags?: string[];
  isReel?: boolean;
  minRating?: number;
}

export interface InstagramPlaylist {
  id: string;
  name: string;
  description: string;
  videos: InstagramVideo[];
  position?: FlagPosition;
  focus: TrainingFocus[];
  totalDuration: number;
  createdBy: string;
  createdAt: string;
}

// ============================================================================
// CURATED INSTAGRAM CONTENT DATABASE
// ============================================================================

const CURATED_INSTAGRAM_VIDEOS: InstagramVideo[] = [
  // ============================================================================
  // QUARTERBACK DRILLS
  // ============================================================================
  {
    id: "ig_qb_001",
    shortcode: "C1example1",
    title: "Quick Release Footwork Drill",
    description:
      "Pro QB demonstrates the 3-step drop with quick release mechanics. Perfect for flag football where pocket time is minimal.",
    url: "https://www.instagram.com/reel/C1example1/",
    embedUrl: "https://www.instagram.com/reel/C1example1/embed/",
    creator: {
      username: "qb_mechanics",
      displayName: "QB Mechanics Lab",
      profileUrl: "https://www.instagram.com/qb_mechanics/",
      verified: true,
      credibility: "coach",
      sport: "football",
      position: "QB",
    },
    positions: ["QB"],
    trainingFocus: ["throwing", "skills"],
    skillLevel: "intermediate",
    phase: ["pre_season", "in_season"],
    tags: ["quick release", "footwork", "3-step drop", "mechanics"],
    rating: 4.8,
    addedDate: "2024-12-01",
    isReel: true,
  },
  {
    id: "ig_qb_002",
    shortcode: "C2example2",
    title: "Flag Football Rollout Throws",
    description:
      "How to maintain accuracy while rolling out - essential for flag football QBs escaping rushers.",
    url: "https://www.instagram.com/reel/C2example2/",
    embedUrl: "https://www.instagram.com/reel/C2example2/embed/",
    creator: {
      username: "flagfootballpro",
      displayName: "Flag Football Pro",
      profileUrl: "https://www.instagram.com/flagfootballpro/",
      verified: false,
      credibility: "pro_athlete",
      sport: "flag_football",
      position: "QB",
    },
    positions: ["QB"],
    trainingFocus: ["throwing", "agility"],
    skillLevel: "advanced",
    phase: ["in_season", "tournament_prep"],
    tags: ["rollout", "on the run", "accuracy", "scramble"],
    rating: 4.9,
    addedDate: "2024-12-05",
    isReel: true,
  },

  // ============================================================================
  // WIDE RECEIVER DRILLS
  // ============================================================================
  {
    id: "ig_wr_001",
    shortcode: "C3example3",
    title: "Route Running: The Perfect Slant",
    description:
      "Breaking down slant route technique - the most effective route in flag football. Includes stem, break, and hand positioning.",
    url: "https://www.instagram.com/reel/C3example3/",
    embedUrl: "https://www.instagram.com/reel/C3example3/embed/",
    creator: {
      username: "route_running_101",
      displayName: "Route Running Academy",
      profileUrl: "https://www.instagram.com/route_running_101/",
      verified: true,
      credibility: "trainer",
      sport: "football",
      position: "WR",
    },
    positions: ["WR"],
    trainingFocus: ["route_running", "skills"],
    skillLevel: "beginner",
    phase: ["all"],
    tags: ["slant", "route running", "technique", "separation"],
    rating: 4.7,
    addedDate: "2024-11-20",
    isReel: true,
  },
  {
    id: "ig_wr_002",
    shortcode: "C4example4",
    title: "Contested Catch Drills",
    description:
      "Develop strong hands and body positioning for catching in traffic. Essential for red zone situations.",
    url: "https://www.instagram.com/reel/C4example4/",
    embedUrl: "https://www.instagram.com/reel/C4example4/embed/",
    creator: {
      username: "wr_university",
      displayName: "WR University",
      profileUrl: "https://www.instagram.com/wr_university/",
      verified: true,
      credibility: "coach",
      sport: "football",
      position: "WR",
    },
    positions: ["WR"],
    trainingFocus: ["catching", "skills"],
    skillLevel: "intermediate",
    phase: ["pre_season", "in_season"],
    tags: ["contested catch", "hands", "red zone", "body control"],
    rating: 4.6,
    addedDate: "2024-11-25",
    isReel: true,
  },
  {
    id: "ig_wr_003",
    shortcode: "C5example5",
    title: "Release Moves vs Press Coverage",
    description:
      "5 release moves to beat press coverage at the line. Perfect for flag football where physical play is limited.",
    url: "https://www.instagram.com/reel/C5example5/",
    embedUrl: "https://www.instagram.com/reel/C5example5/embed/",
    creator: {
      username: "elite_receivers",
      displayName: "Elite Receiver Training",
      profileUrl: "https://www.instagram.com/elite_receivers/",
      verified: false,
      credibility: "trainer",
      sport: "football",
      position: "WR",
    },
    positions: ["WR"],
    trainingFocus: ["route_running", "agility"],
    skillLevel: "advanced",
    phase: ["in_season", "tournament_prep"],
    tags: ["release", "press coverage", "footwork", "separation"],
    rating: 4.8,
    addedDate: "2024-12-10",
    isReel: true,
  },

  // ============================================================================
  // DEFENSIVE BACK DRILLS
  // ============================================================================
  {
    id: "ig_db_001",
    shortcode: "C6example6",
    title: "Backpedal to Hip Turn Technique",
    description:
      "Master the fundamental DB movement - smooth backpedal transitioning to explosive hip turn. Critical for flag football coverage.",
    url: "https://www.instagram.com/reel/C6example6/",
    embedUrl: "https://www.instagram.com/reel/C6example6/embed/",
    creator: {
      username: "db_drills",
      displayName: "DB Drills Daily",
      profileUrl: "https://www.instagram.com/db_drills/",
      verified: true,
      credibility: "coach",
      sport: "football",
      position: "DB",
    },
    positions: ["DB"],
    trainingFocus: ["coverage", "agility"],
    skillLevel: "beginner",
    phase: ["all"],
    tags: ["backpedal", "hip turn", "coverage", "fundamentals"],
    rating: 4.9,
    addedDate: "2024-11-15",
    isReel: true,
  },
  {
    id: "ig_db_002",
    shortcode: "C7example7",
    title: "Flag Pulling Technique & Timing",
    description:
      "The art of pulling flags - body positioning, timing, and hand technique for clean pulls without fouls.",
    url: "https://www.instagram.com/reel/C7example7/",
    embedUrl: "https://www.instagram.com/reel/C7example7/embed/",
    creator: {
      username: "flagfootball_defense",
      displayName: "Flag Football Defense",
      profileUrl: "https://www.instagram.com/flagfootball_defense/",
      verified: false,
      credibility: "pro_athlete",
      sport: "flag_football",
    },
    positions: ["DB", "Rusher", "LB"],
    trainingFocus: ["skills"],
    skillLevel: "all",
    phase: ["all"],
    tags: ["flag pulling", "technique", "defense", "timing"],
    rating: 4.7,
    addedDate: "2024-12-08",
    isReel: true,
  },

  // ============================================================================
  // RUSHER DRILLS
  // ============================================================================
  {
    id: "ig_rush_001",
    shortcode: "C8example8",
    title: "7-Second Rush Timing Drill",
    description:
      "Perfect your 7-second rush timing. Includes countdown drills and explosive first step techniques.",
    url: "https://www.instagram.com/reel/C8example8/",
    embedUrl: "https://www.instagram.com/reel/C8example8/embed/",
    creator: {
      username: "flagrush_academy",
      displayName: "Flag Rush Academy",
      profileUrl: "https://www.instagram.com/flagrush_academy/",
      verified: false,
      credibility: "trainer",
      sport: "flag_football",
      position: "Rusher",
    },
    positions: ["Rusher"],
    trainingFocus: ["speed", "skills"],
    skillLevel: "intermediate",
    phase: ["pre_season", "in_season"],
    tags: ["7 second rush", "timing", "first step", "explosion"],
    rating: 4.8,
    addedDate: "2024-12-03",
    isReel: true,
  },

  // ============================================================================
  // SPEED & AGILITY
  // ============================================================================
  {
    id: "ig_speed_001",
    shortcode: "C9example9",
    title: "Cone Drill for Quick Direction Changes",
    description:
      "5-10-5 pro agility drill breakdown. Essential for all flag football positions requiring quick cuts.",
    url: "https://www.instagram.com/reel/C9example9/",
    embedUrl: "https://www.instagram.com/reel/C9example9/embed/",
    creator: {
      username: "speed_training_pro",
      displayName: "Speed Training Pro",
      profileUrl: "https://www.instagram.com/speed_training_pro/",
      verified: true,
      credibility: "trainer",
      sport: "football",
    },
    positions: ["All"],
    trainingFocus: ["agility", "speed"],
    skillLevel: "all",
    phase: ["all"],
    tags: ["5-10-5", "pro agility", "cone drill", "direction change"],
    rating: 4.6,
    addedDate: "2024-11-28",
    isReel: true,
  },
  {
    id: "ig_speed_002",
    shortcode: "C10example10",
    title: "First Step Explosion Training",
    description:
      "Develop explosive first step for all positions. Box jumps, resistance bands, and acceleration drills.",
    url: "https://www.instagram.com/reel/C10example10/",
    embedUrl: "https://www.instagram.com/reel/C10example10/embed/",
    creator: {
      username: "athletic_performance",
      displayName: "Athletic Performance Lab",
      profileUrl: "https://www.instagram.com/athletic_performance/",
      verified: true,
      credibility: "trainer",
      sport: "multi-sport",
    },
    positions: ["All"],
    trainingFocus: ["speed", "power"],
    skillLevel: "intermediate",
    phase: ["off_season", "pre_season"],
    tags: ["first step", "explosion", "plyometrics", "acceleration"],
    rating: 4.7,
    addedDate: "2024-12-12",
    isReel: true,
  },

  // ============================================================================
  // RECOVERY & MOBILITY
  // ============================================================================
  {
    id: "ig_recovery_001",
    shortcode: "C11example11",
    title: "5-Minute Hip Mobility Routine",
    description:
      "Quick hip mobility routine perfect for pre-game or daily maintenance. Essential for flag football athletes.",
    url: "https://www.instagram.com/reel/C11example11/",
    embedUrl: "https://www.instagram.com/reel/C11example11/embed/",
    creator: {
      username: "mobility_rx",
      displayName: "Mobility Rx",
      profileUrl: "https://www.instagram.com/mobility_rx/",
      verified: true,
      credibility: "trainer",
      sport: "multi-sport",
    },
    positions: ["All"],
    trainingFocus: ["mobility", "injury_prevention"],
    skillLevel: "all",
    phase: ["all"],
    tags: ["hip mobility", "warm up", "recovery", "flexibility"],
    rating: 4.9,
    addedDate: "2024-11-10",
    isReel: true,
  },
  {
    id: "ig_recovery_002",
    shortcode: "C12example12",
    title: "Post-Game Recovery Protocol",
    description:
      "Complete post-game recovery routine: foam rolling, stretching, and cool-down exercises.",
    url: "https://www.instagram.com/reel/C12example12/",
    embedUrl: "https://www.instagram.com/reel/C12example12/embed/",
    creator: {
      username: "recovery_science",
      displayName: "Recovery Science",
      profileUrl: "https://www.instagram.com/recovery_science/",
      verified: false,
      credibility: "trainer",
      sport: "multi-sport",
    },
    positions: ["All"],
    trainingFocus: ["recovery", "mobility"],
    skillLevel: "all",
    phase: ["in_season"],
    tags: ["recovery", "foam rolling", "stretching", "cool down"],
    rating: 4.5,
    addedDate: "2024-12-15",
    isReel: true,
  },

  // ============================================================================
  // CENTER DRILLS
  // ============================================================================
  {
    id: "ig_center_001",
    shortcode: "C13example13",
    title: "Perfect Shotgun Snap Technique",
    description:
      "Master the shotgun snap - grip, spiral, and accuracy. Critical for flag football centers.",
    url: "https://www.instagram.com/reel/C13example13/",
    embedUrl: "https://www.instagram.com/reel/C13example13/embed/",
    creator: {
      username: "oline_academy",
      displayName: "O-Line Academy",
      profileUrl: "https://www.instagram.com/oline_academy/",
      verified: false,
      credibility: "coach",
      sport: "football",
      position: "Center",
    },
    positions: ["Center"],
    trainingFocus: ["skills"],
    skillLevel: "beginner",
    phase: ["all"],
    tags: ["snap", "shotgun", "center", "technique"],
    rating: 4.6,
    addedDate: "2024-11-22",
    isReel: true,
  },

  // ============================================================================
  // PLYOMETRICS
  // ============================================================================
  {
    id: "ig_plyo_001",
    shortcode: "C14example14",
    title: "Box Jump Progressions for Athletes",
    description:
      "Complete box jump progression from beginner to advanced. Develop explosive power for flag football speed.",
    url: "https://www.instagram.com/reel/C14example14/",
    embedUrl: "https://www.instagram.com/reel/C14example14/embed/",
    creator: {
      username: "plyometric_power",
      displayName: "Plyometric Power Lab",
      profileUrl: "https://www.instagram.com/plyometric_power/",
      verified: true,
      credibility: "trainer",
      sport: "multi-sport",
    },
    positions: ["All"],
    trainingFocus: ["plyometrics", "explosive_power"],
    skillLevel: "beginner",
    phase: ["off_season", "pre_season"],
    tags: ["box jumps", "plyometrics", "explosive", "vertical leap"],
    rating: 4.8,
    addedDate: "2024-12-18",
    isReel: true,
  },
  {
    id: "ig_plyo_002",
    shortcode: "C15example15",
    title: "Depth Jump to Sprint - Reactive Power",
    description:
      "Advanced depth jump drill transitioning to sprint. Develops reactive strength for explosive first steps.",
    url: "https://www.instagram.com/reel/C15example15/",
    embedUrl: "https://www.instagram.com/reel/C15example15/embed/",
    creator: {
      username: "elite_athletic_dev",
      displayName: "Elite Athletic Development",
      profileUrl: "https://www.instagram.com/elite_athletic_dev/",
      verified: true,
      credibility: "trainer",
      sport: "football",
    },
    positions: ["WR", "DB", "Rusher", "All"],
    trainingFocus: ["plyometrics", "reactive_eccentrics", "acceleration"],
    skillLevel: "advanced",
    phase: ["off_season", "pre_season"],
    tags: ["depth jump", "reactive", "sprint", "explosive power"],
    rating: 4.9,
    addedDate: "2024-12-19",
    isReel: true,
  },
  {
    id: "ig_plyo_003",
    shortcode: "C16example16",
    title: "Single Leg Bounds for Speed Development",
    description:
      "Unilateral plyometric bounds to develop single-leg power. Essential for cutting and acceleration.",
    url: "https://www.instagram.com/reel/C16example16/",
    embedUrl: "https://www.instagram.com/reel/C16example16/embed/",
    creator: {
      username: "speed_science",
      displayName: "Speed Science Institute",
      profileUrl: "https://www.instagram.com/speed_science/",
      verified: true,
      credibility: "trainer",
      sport: "track",
    },
    positions: ["All"],
    trainingFocus: ["plyometrics", "speed", "power"],
    skillLevel: "intermediate",
    phase: ["off_season", "pre_season"],
    tags: ["bounds", "single leg", "unilateral", "power"],
    rating: 4.7,
    addedDate: "2024-12-20",
    isReel: true,
  },
  {
    id: "ig_plyo_004",
    shortcode: "C17example17",
    title: "Lateral Bounds for COD Power",
    description:
      "Lateral plyometric bounds for change of direction power. Critical for DBs, WRs, and rushers.",
    url: "https://www.instagram.com/reel/C17example17/",
    embedUrl: "https://www.instagram.com/reel/C17example17/embed/",
    creator: {
      username: "lateral_movement_pro",
      displayName: "Lateral Movement Pro",
      profileUrl: "https://www.instagram.com/lateral_movement_pro/",
      verified: false,
      credibility: "coach",
      sport: "football",
    },
    positions: ["DB", "WR", "Rusher"],
    trainingFocus: ["plyometrics", "agility", "deceleration"],
    skillLevel: "intermediate",
    phase: ["pre_season", "in_season"],
    tags: ["lateral bounds", "COD", "agility", "lateral power"],
    rating: 4.6,
    addedDate: "2024-12-21",
    isReel: true,
  },

  // ============================================================================
  // ISOMETRICS
  // ============================================================================
  {
    id: "ig_iso_001",
    shortcode: "C18example18",
    title: "Wall Sit Progressions for Leg Strength",
    description:
      "Isometric wall sit variations to build quad endurance and knee stability. Great for injury prevention.",
    url: "https://www.instagram.com/reel/C18example18/",
    embedUrl: "https://www.instagram.com/reel/C18example18/embed/",
    creator: {
      username: "isometric_strength",
      displayName: "Isometric Strength Lab",
      profileUrl: "https://www.instagram.com/isometric_strength/",
      verified: true,
      credibility: "trainer",
      sport: "multi-sport",
    },
    positions: ["All"],
    trainingFocus: ["isometrics", "strength", "injury_prevention"],
    skillLevel: "beginner",
    phase: ["all"],
    tags: ["wall sit", "isometric", "quad strength", "endurance"],
    rating: 4.5,
    addedDate: "2024-12-22",
    isReel: true,
  },
  {
    id: "ig_iso_002",
    shortcode: "C19example19",
    title: "ISO Hold Split Squat for Single Leg Strength",
    description:
      "Isometric split squat holds to develop single-leg stability and strength at key joint angles.",
    url: "https://www.instagram.com/reel/C19example19/",
    embedUrl: "https://www.instagram.com/reel/C19example19/embed/",
    creator: {
      username: "functional_strength",
      displayName: "Functional Strength Training",
      profileUrl: "https://www.instagram.com/functional_strength/",
      verified: true,
      credibility: "trainer",
      sport: "multi-sport",
    },
    positions: ["All"],
    trainingFocus: ["isometrics", "strength"],
    skillLevel: "intermediate",
    phase: ["off_season", "pre_season"],
    tags: ["split squat", "isometric", "single leg", "stability"],
    rating: 4.7,
    addedDate: "2024-12-23",
    isReel: true,
  },
  {
    id: "ig_iso_003",
    shortcode: "C20example20",
    title: "Isometric Hamstring Bridge Holds",
    description:
      "Hamstring isometric holds for injury prevention and posterior chain strength. Essential for sprinters.",
    url: "https://www.instagram.com/reel/C20example20/",
    embedUrl: "https://www.instagram.com/reel/C20example20/embed/",
    creator: {
      username: "hamstring_health",
      displayName: "Hamstring Health Pro",
      profileUrl: "https://www.instagram.com/hamstring_health/",
      verified: false,
      credibility: "trainer",
      sport: "football",
    },
    positions: ["All"],
    trainingFocus: ["isometrics", "injury_prevention", "strength"],
    skillLevel: "all",
    phase: ["all"],
    tags: ["hamstring", "isometric", "bridge", "injury prevention"],
    rating: 4.8,
    addedDate: "2024-12-24",
    isReel: true,
  },

  // ============================================================================
  // REACTIVE ECCENTRICS
  // ============================================================================
  {
    id: "ig_reactive_001",
    shortcode: "C21example21",
    title: "Eccentric Nordic Hamstring Curls",
    description:
      "Gold standard eccentric hamstring exercise. Reduces hamstring injury risk by 51% when done consistently.",
    url: "https://www.instagram.com/reel/C21example21/",
    embedUrl: "https://www.instagram.com/reel/C21example21/embed/",
    creator: {
      username: "eccentric_training",
      displayName: "Eccentric Training Lab",
      profileUrl: "https://www.instagram.com/eccentric_training/",
      verified: true,
      credibility: "trainer",
      sport: "football",
    },
    positions: ["All"],
    trainingFocus: ["reactive_eccentrics", "injury_prevention", "strength"],
    skillLevel: "intermediate",
    phase: ["off_season", "pre_season", "in_season"],
    tags: ["nordic curl", "eccentric", "hamstring", "injury prevention"],
    rating: 4.9,
    addedDate: "2024-12-25",
    isReel: true,
  },
  {
    id: "ig_reactive_002",
    shortcode: "C22example22",
    title: "Reactive Drop Landings",
    description:
      "Eccentric landing mechanics for absorbing force. Critical for deceleration and injury prevention.",
    url: "https://www.instagram.com/reel/C22example22/",
    embedUrl: "https://www.instagram.com/reel/C22example22/embed/",
    creator: {
      username: "landing_mechanics",
      displayName: "Landing Mechanics Pro",
      profileUrl: "https://www.instagram.com/landing_mechanics/",
      verified: true,
      credibility: "trainer",
      sport: "multi-sport",
    },
    positions: ["All"],
    trainingFocus: ["reactive_eccentrics", "deceleration", "injury_prevention"],
    skillLevel: "beginner",
    phase: ["all"],
    tags: ["landing", "eccentric", "absorption", "deceleration"],
    rating: 4.7,
    addedDate: "2024-12-26",
    isReel: true,
  },
  {
    id: "ig_reactive_003",
    shortcode: "C23example23",
    title: "Eccentric Accentuated Split Squats",
    description:
      "Slow eccentric split squats with explosive concentric. Builds strength through full ROM.",
    url: "https://www.instagram.com/reel/C23example23/",
    embedUrl: "https://www.instagram.com/reel/C23example23/embed/",
    creator: {
      username: "tempo_training",
      displayName: "Tempo Training Systems",
      profileUrl: "https://www.instagram.com/tempo_training/",
      verified: false,
      credibility: "trainer",
      sport: "multi-sport",
    },
    positions: ["All"],
    trainingFocus: ["reactive_eccentrics", "strength", "power"],
    skillLevel: "advanced",
    phase: ["off_season"],
    tags: ["eccentric", "split squat", "tempo", "strength"],
    rating: 4.6,
    addedDate: "2024-12-27",
    isReel: true,
  },

  // ============================================================================
  // DECELERATION
  // ============================================================================
  {
    id: "ig_decel_001",
    shortcode: "C24example24",
    title: "Deceleration Mechanics 101",
    description:
      "Master the fundamentals of deceleration - body position, foot strike, and force absorption for safe cutting.",
    url: "https://www.instagram.com/reel/C24example24/",
    embedUrl: "https://www.instagram.com/reel/C24example24/embed/",
    creator: {
      username: "decel_science",
      displayName: "Deceleration Science",
      profileUrl: "https://www.instagram.com/decel_science/",
      verified: true,
      credibility: "trainer",
      sport: "football",
    },
    positions: ["All"],
    trainingFocus: ["deceleration", "agility", "injury_prevention"],
    skillLevel: "beginner",
    phase: ["all"],
    tags: ["deceleration", "braking", "mechanics", "cutting"],
    rating: 4.9,
    addedDate: "2024-12-28",
    isReel: true,
  },
  {
    id: "ig_decel_002",
    shortcode: "C25example25",
    title: "Stop-Start Deceleration Drill",
    description:
      "Sprint to stop drill for developing rapid deceleration. Essential for route running and coverage.",
    url: "https://www.instagram.com/reel/C25example25/",
    embedUrl: "https://www.instagram.com/reel/C25example25/embed/",
    creator: {
      username: "speed_coach_elite",
      displayName: "Speed Coach",
      profileUrl: "https://www.instagram.com/speed_coach_elite/",
      verified: true,
      credibility: "coach",
      sport: "football",
    },
    positions: ["WR", "DB"],
    trainingFocus: ["deceleration", "speed", "agility"],
    skillLevel: "intermediate",
    phase: ["pre_season", "in_season"],
    tags: ["stop-start", "deceleration", "braking", "route running"],
    rating: 4.8,
    addedDate: "2024-12-28",
    isReel: true,
  },
  {
    id: "ig_decel_003",
    shortcode: "C26example26",
    title: "Multi-Directional Deceleration",
    description:
      "Deceleration from multiple angles and directions. Prepares athletes for game-speed cutting.",
    url: "https://www.instagram.com/reel/C26example26/",
    embedUrl: "https://www.instagram.com/reel/C26example26/embed/",
    creator: {
      username: "agility_lab",
      displayName: "Agility Lab Pro",
      profileUrl: "https://www.instagram.com/agility_lab/",
      verified: true,
      credibility: "trainer",
      sport: "multi-sport",
    },
    positions: ["All"],
    trainingFocus: ["deceleration", "agility"],
    skillLevel: "advanced",
    phase: ["pre_season", "in_season"],
    tags: ["multi-directional", "deceleration", "cutting", "agility"],
    rating: 4.7,
    addedDate: "2024-12-28",
    isReel: true,
  },

  // ============================================================================
  // ACCELERATION
  // ============================================================================
  {
    id: "ig_accel_001",
    shortcode: "C27example27",
    title: "Acceleration Mechanics - First 10 Yards",
    description:
      "Perfect your acceleration mechanics for the critical first 10 yards. Body lean, arm drive, and foot strike.",
    url: "https://www.instagram.com/reel/C27example27/",
    embedUrl: "https://www.instagram.com/reel/C27example27/embed/",
    creator: {
      username: "acceleration_pro",
      displayName: "Acceleration Pro",
      profileUrl: "https://www.instagram.com/acceleration_pro/",
      verified: true,
      credibility: "trainer",
      sport: "track",
    },
    positions: ["All"],
    trainingFocus: ["acceleration", "speed"],
    skillLevel: "beginner",
    phase: ["all"],
    tags: ["acceleration", "first step", "mechanics", "speed"],
    rating: 4.9,
    addedDate: "2024-12-28",
    isReel: true,
  },
  {
    id: "ig_accel_002",
    shortcode: "C28example28",
    title: "Resisted Acceleration Sprints",
    description:
      "Sled and band resisted sprints for developing acceleration power. Overload the drive phase.",
    url: "https://www.instagram.com/reel/C28example28/",
    embedUrl: "https://www.instagram.com/reel/C28example28/embed/",
    creator: {
      username: "resisted_speed",
      displayName: "Resisted Speed Training",
      profileUrl: "https://www.instagram.com/resisted_speed/",
      verified: false,
      credibility: "trainer",
      sport: "football",
    },
    positions: ["All"],
    trainingFocus: ["acceleration", "strength", "speed"],
    skillLevel: "intermediate",
    phase: ["off_season", "pre_season"],
    tags: ["resisted", "sled", "acceleration", "power"],
    rating: 4.7,
    addedDate: "2024-12-28",
    isReel: true,
  },
  {
    id: "ig_accel_003",
    shortcode: "C29example29",
    title: "Acceleration from Various Stances",
    description:
      "Accelerate from 2-point, 3-point, and reactive starts. Game-specific acceleration training.",
    url: "https://www.instagram.com/reel/C29example29/",
    embedUrl: "https://www.instagram.com/reel/C29example29/embed/",
    creator: {
      username: "stance_speed",
      displayName: "Stance & Speed Academy",
      profileUrl: "https://www.instagram.com/stance_speed/",
      verified: true,
      credibility: "coach",
      sport: "football",
    },
    positions: ["WR", "DB", "Rusher"],
    trainingFocus: ["acceleration", "speed", "skills"],
    skillLevel: "intermediate",
    phase: ["pre_season", "in_season"],
    tags: ["stance", "starts", "acceleration", "reactive"],
    rating: 4.8,
    addedDate: "2024-12-28",
    isReel: true,
  },

  // TWITCHES (FAST TWITCH MUSCLE FIBER TRAINING)
  // ============================================================================
  {
    id: "ig_twitch_001",
    shortcode: "C30example30",
    title: "Fast Twitch Activation Drills",
    description:
      "Quick-fire drills to activate and develop fast twitch muscle fibers. Essential for explosive athletes.",
    url: "https://www.instagram.com/reel/C30example30/",
    embedUrl: "https://www.instagram.com/reel/C30example30/embed/",
    creator: {
      username: "fast_twitch_lab",
      displayName: "Fast Twitch Lab",
      profileUrl: "https://www.instagram.com/fast_twitch_lab/",
      verified: true,
      credibility: "trainer",
      sport: "multi-sport",
    },
    positions: ["All"],
    trainingFocus: ["twitches", "explosive_power", "speed"],
    skillLevel: "intermediate",
    phase: ["off_season", "pre_season"],
    tags: ["fast twitch", "explosive", "activation", "power"],
    rating: 4.8,
    addedDate: "2024-12-28",
    isReel: true,
  },
  {
    id: "ig_twitch_002",
    shortcode: "C31example31",
    title: "Reactive Foot Fire Drills",
    description:
      "High-frequency foot contacts for neural activation. Develops fast twitch response and foot speed.",
    url: "https://www.instagram.com/reel/C31example31/",
    embedUrl: "https://www.instagram.com/reel/C31example31/embed/",
    creator: {
      username: "foot_speed_pro",
      displayName: "Foot Speed Pro",
      profileUrl: "https://www.instagram.com/foot_speed_pro/",
      verified: false,
      credibility: "trainer",
      sport: "football",
    },
    positions: ["All"],
    trainingFocus: ["twitches", "agility", "speed"],
    skillLevel: "beginner",
    phase: ["all"],
    tags: ["foot fire", "quick feet", "neural", "activation"],
    rating: 4.6,
    addedDate: "2024-12-28",
    isReel: true,
  },
  {
    id: "ig_twitch_003",
    shortcode: "C32example32",
    title: "Medicine Ball Reactive Throws",
    description:
      "Explosive medicine ball throws for upper body fast twitch development. Great for QBs and all positions.",
    url: "https://www.instagram.com/reel/C32example32/",
    embedUrl: "https://www.instagram.com/reel/C32example32/embed/",
    creator: {
      username: "med_ball_power",
      displayName: "Med Ball Power Training",
      profileUrl: "https://www.instagram.com/med_ball_power/",
      verified: true,
      credibility: "trainer",
      sport: "multi-sport",
    },
    positions: ["QB", "All"],
    trainingFocus: ["twitches", "power", "throwing"],
    skillLevel: "intermediate",
    phase: ["off_season", "pre_season"],
    tags: ["medicine ball", "throws", "explosive", "upper body"],
    rating: 4.7,
    addedDate: "2024-12-28",
    isReel: true,
  },

  // ============================================================================
  // STRENGTH TRAINING
  // ============================================================================
  {
    id: "ig_strength_001",
    shortcode: "C33example33",
    title: "Goblet Squat Fundamentals",
    description:
      "Master the goblet squat for lower body strength. Perfect form cues for athletes of all levels.",
    url: "https://www.instagram.com/reel/C33example33/",
    embedUrl: "https://www.instagram.com/reel/C33example33/embed/",
    creator: {
      username: "strength_basics",
      displayName: "Strength Basics Pro",
      profileUrl: "https://www.instagram.com/strength_basics/",
      verified: true,
      credibility: "trainer",
      sport: "multi-sport",
    },
    positions: ["All"],
    trainingFocus: ["strength"],
    skillLevel: "beginner",
    phase: ["off_season", "pre_season"],
    tags: ["goblet squat", "squat", "lower body", "fundamentals"],
    rating: 4.7,
    addedDate: "2024-12-28",
    isReel: true,
  },
  {
    id: "ig_strength_002",
    shortcode: "C34example34",
    title: "Single Leg RDL for Hamstring Strength",
    description:
      "Romanian deadlift on one leg for hamstring strength and balance. Critical for sprint performance.",
    url: "https://www.instagram.com/reel/C34example34/",
    embedUrl: "https://www.instagram.com/reel/C34example34/embed/",
    creator: {
      username: "unilateral_strength",
      displayName: "Unilateral Strength Lab",
      profileUrl: "https://www.instagram.com/unilateral_strength/",
      verified: true,
      credibility: "trainer",
      sport: "multi-sport",
    },
    positions: ["All"],
    trainingFocus: ["strength", "injury_prevention"],
    skillLevel: "intermediate",
    phase: ["off_season", "pre_season"],
    tags: ["RDL", "hamstring", "single leg", "balance"],
    rating: 4.8,
    addedDate: "2024-12-28",
    isReel: true,
  },
  {
    id: "ig_strength_003",
    shortcode: "C35example35",
    title: "Hip Thrust for Glute Power",
    description:
      "Barbell hip thrust for maximum glute development. Essential for acceleration and sprinting power.",
    url: "https://www.instagram.com/reel/C35example35/",
    embedUrl: "https://www.instagram.com/reel/C35example35/embed/",
    creator: {
      username: "glute_lab",
      displayName: "Glute Lab Training",
      profileUrl: "https://www.instagram.com/glute_lab/",
      verified: true,
      credibility: "trainer",
      sport: "multi-sport",
    },
    positions: ["All"],
    trainingFocus: ["strength", "power", "acceleration"],
    skillLevel: "intermediate",
    phase: ["off_season", "pre_season"],
    tags: ["hip thrust", "glutes", "power", "strength"],
    rating: 4.9,
    addedDate: "2024-12-28",
    isReel: true,
  },
  {
    id: "ig_strength_004",
    shortcode: "C36example36",
    title: "Copenhagen Adductor Exercise",
    description:
      "Copenhagen plank for groin/adductor strength. Reduces groin injury risk by up to 41%.",
    url: "https://www.instagram.com/reel/C36example36/",
    embedUrl: "https://www.instagram.com/reel/C36example36/embed/",
    creator: {
      username: "injury_prevention_pro",
      displayName: "Injury Prevention Pro",
      profileUrl: "https://www.instagram.com/injury_prevention_pro/",
      verified: true,
      credibility: "trainer",
      sport: "football",
    },
    positions: ["All"],
    trainingFocus: ["strength", "injury_prevention"],
    skillLevel: "intermediate",
    phase: ["all"],
    tags: ["Copenhagen", "adductor", "groin", "injury prevention"],
    rating: 4.8,
    addedDate: "2024-12-28",
    isReel: true,
  },

  // ============================================================================
  // EXPLOSIVE POWER
  // ============================================================================
  {
    id: "ig_power_001",
    shortcode: "C37example37",
    title: "Hang Clean for Athletes",
    description:
      "Olympic lift variation for developing total body explosive power. Simplified technique for athletes.",
    url: "https://www.instagram.com/reel/C37example37/",
    embedUrl: "https://www.instagram.com/reel/C37example37/embed/",
    creator: {
      username: "olympic_lift_athletes",
      displayName: "Olympic Lifts for Athletes",
      profileUrl: "https://www.instagram.com/olympic_lift_athletes/",
      verified: true,
      credibility: "coach",
      sport: "multi-sport",
    },
    positions: ["All"],
    trainingFocus: ["explosive_power", "strength", "power"],
    skillLevel: "advanced",
    phase: ["off_season"],
    tags: ["hang clean", "olympic lift", "explosive", "power"],
    rating: 4.7,
    addedDate: "2024-12-28",
    isReel: true,
  },
  {
    id: "ig_power_002",
    shortcode: "C38example38",
    title: "Trap Bar Jump for Power",
    description:
      "Loaded jump with trap bar for developing explosive hip extension. Safer than barbell alternatives.",
    url: "https://www.instagram.com/reel/C38example38/",
    embedUrl: "https://www.instagram.com/reel/C38example38/embed/",
    creator: {
      username: "power_development",
      displayName: "Power Development Lab",
      profileUrl: "https://www.instagram.com/power_development/",
      verified: true,
      credibility: "trainer",
      sport: "football",
    },
    positions: ["All"],
    trainingFocus: ["explosive_power", "plyometrics", "strength"],
    skillLevel: "intermediate",
    phase: ["off_season", "pre_season"],
    tags: ["trap bar", "jump", "explosive", "power"],
    rating: 4.8,
    addedDate: "2024-12-28",
    isReel: true,
  },
];

// ============================================================================
// CURATED CREATOR DATABASE
// ============================================================================

const FEATURED_CREATORS: InstagramCreator[] = [
  {
    username: "flagfootballpro",
    displayName: "Flag Football Pro",
    profileUrl: "https://www.instagram.com/flagfootballpro/",
    verified: true,
    credibility: "pro_athlete",
    sport: "flag_football",
    followers: 125000,
  },
  {
    username: "qb_mechanics",
    displayName: "QB Mechanics Lab",
    profileUrl: "https://www.instagram.com/qb_mechanics/",
    verified: true,
    credibility: "coach",
    sport: "football",
    position: "QB",
    followers: 89000,
  },
  {
    username: "route_running_101",
    displayName: "Route Running Academy",
    profileUrl: "https://www.instagram.com/route_running_101/",
    verified: true,
    credibility: "trainer",
    sport: "football",
    position: "WR",
    followers: 156000,
  },
  {
    username: "db_drills",
    displayName: "DB Drills Daily",
    profileUrl: "https://www.instagram.com/db_drills/",
    verified: true,
    credibility: "coach",
    sport: "football",
    position: "DB",
    followers: 203000,
  },
  {
    username: "speed_training_pro",
    displayName: "Speed Training Pro",
    profileUrl: "https://www.instagram.com/speed_training_pro/",
    verified: true,
    credibility: "trainer",
    sport: "football",
    followers: 312000,
  },
  {
    username: "mobility_rx",
    displayName: "Mobility Rx",
    profileUrl: "https://www.instagram.com/mobility_rx/",
    verified: true,
    credibility: "trainer",
    sport: "multi-sport",
    followers: 445000,
  },
  {
    username: "plyometric_power",
    displayName: "Plyometric Power Lab",
    profileUrl: "https://www.instagram.com/plyometric_power/",
    verified: true,
    credibility: "trainer",
    sport: "multi-sport",
    followers: 178000,
  },
  {
    username: "eccentric_training",
    displayName: "Eccentric Training Lab",
    profileUrl: "https://www.instagram.com/eccentric_training/",
    verified: true,
    credibility: "trainer",
    sport: "football",
    followers: 95000,
  },
  {
    username: "decel_science",
    displayName: "Deceleration Science",
    profileUrl: "https://www.instagram.com/decel_science/",
    verified: true,
    credibility: "trainer",
    sport: "football",
    followers: 142000,
  },
  {
    username: "acceleration_pro",
    displayName: "Acceleration Pro",
    profileUrl: "https://www.instagram.com/acceleration_pro/",
    verified: true,
    credibility: "trainer",
    sport: "track",
    followers: 267000,
  },
  {
    username: "fast_twitch_lab",
    displayName: "Fast Twitch Lab",
    profileUrl: "https://www.instagram.com/fast_twitch_lab/",
    verified: true,
    credibility: "trainer",
    sport: "multi-sport",
    followers: 189000,
  },
  {
    username: "isometric_strength",
    displayName: "Isometric Strength Lab",
    profileUrl: "https://www.instagram.com/isometric_strength/",
    verified: true,
    credibility: "trainer",
    sport: "multi-sport",
    followers: 112000,
  },
  {
    username: "glute_lab",
    displayName: "Glute Lab Training",
    profileUrl: "https://www.instagram.com/glute_lab/",
    verified: true,
    credibility: "trainer",
    sport: "multi-sport",
    followers: 523000,
  },
  {
    username: "injury_prevention_pro",
    displayName: "Injury Prevention Pro",
    profileUrl: "https://www.instagram.com/injury_prevention_pro/",
    verified: true,
    credibility: "trainer",
    sport: "football",
    followers: 234000,
  },
];

// ============================================================================
// SERVICE
// ============================================================================

@Injectable({
  providedIn: "root",
})
export class InstagramVideoService {
  private logger = inject(LoggerService);

  // Reactive state with signals
  private readonly _videos = signal<InstagramVideo[]>(CURATED_INSTAGRAM_VIDEOS);
  private readonly _creators = signal<InstagramCreator[]>(FEATURED_CREATORS);
  private readonly _embedCache = signal<Map<string, InstagramEmbedResponse>>(
    new Map(),
  );
  private readonly _loadingStates = signal<Map<string, boolean>>(new Map());
  private readonly _selectedVideo = signal<InstagramVideo | null>(null);

  // Public readonly signals
  readonly videos = this._videos.asReadonly();
  readonly creators = this._creators.asReadonly();
  readonly selectedVideo = this._selectedVideo.asReadonly();

  // Computed signals
  readonly totalVideos = computed(() => this._videos().length);
  readonly reelsOnly = computed(() => this._videos().filter((v) => v.isReel));
  readonly verifiedCreators = computed(() =>
    this._creators().filter((c) => c.verified),
  );

  readonly videosByPosition = computed(() => {
    const grouped = new Map<FlagPosition, InstagramVideo[]>();
    for (const video of this._videos()) {
      for (const position of video.positions) {
        const existing = grouped.get(position) || [];
        grouped.set(position, [...existing, video]);
      }
    }
    return grouped;
  });

  readonly videosByFocus = computed(() => {
    const grouped = new Map<TrainingFocus, InstagramVideo[]>();
    for (const video of this._videos()) {
      for (const focus of video.trainingFocus) {
        const existing = grouped.get(focus) || [];
        grouped.set(focus, [...existing, video]);
      }
    }
    return grouped;
  });

  // ============================================================================
  // VIDEO RETRIEVAL
  // ============================================================================

  /**
   * Get all curated Instagram videos
   */
  getAllVideos(): InstagramVideo[] {
    return this._videos();
  }

  /**
   * Get video by ID
   */
  getVideoById(id: string): InstagramVideo | undefined {
    return this._videos().find((v) => v.id === id);
  }

  /**
   * Get video by Instagram shortcode
   */
  getVideoByShortcode(shortcode: string): InstagramVideo | undefined {
    return this._videos().find((v) => v.shortcode === shortcode);
  }

  /**
   * Filter videos by criteria
   */
  filterVideos(filter: InstagramVideoFilter): InstagramVideo[] {
    return this._videos().filter((video) => {
      // Position filter
      const positions = filter.positions;
      if (
        positions?.length &&
        !video.positions.some((p) => positions.includes(p) || p === "All")
      ) {
        return false;
      }

      // Focus filter
      const focus = filter.focus;
      if (
        focus?.length &&
        !video.trainingFocus.some((f) => focus.includes(f))
      ) {
        return false;
      }

      // Skill level filter
      if (
        filter.skillLevel &&
        video.skillLevel !== "all" &&
        video.skillLevel !== filter.skillLevel
      ) {
        return false;
      }

      // Phase filter
      if (
        filter.phase &&
        !video.phase.includes(filter.phase) &&
        !video.phase.includes("all")
      ) {
        return false;
      }

      // Creator filter
      if (
        filter.creator &&
        video.creator.username.toLowerCase() !== filter.creator.toLowerCase()
      ) {
        return false;
      }

      // Tags filter
      if (
        filter.tags?.length &&
        !filter.tags.some((tag) =>
          video.tags.some((vt) => vt.toLowerCase().includes(tag.toLowerCase())),
        )
      ) {
        return false;
      }

      // Reel filter
      if (filter.isReel !== undefined && video.isReel !== filter.isReel) {
        return false;
      }

      // Rating filter
      if (filter.minRating && video.rating < filter.minRating) {
        return false;
      }

      return true;
    });
  }

  /**
   * Get videos for a specific position
   */
  getVideosForPosition(position: FlagPosition): InstagramVideo[] {
    return this.filterVideos({ positions: [position] });
  }

  /**
   * Get videos for a specific training focus
   */
  getVideosForFocus(focus: TrainingFocus): InstagramVideo[] {
    return this.filterVideos({ focus: [focus] });
  }

  /**
   * Get recommended videos based on athlete profile
   */
  getRecommendedVideos(
    position: FlagPosition,
    phase: TrainingPhase,
    skillLevel: SkillLevel,
    limit: number = 5,
  ): InstagramVideo[] {
    const filtered = this.filterVideos({
      positions: [position],
      phase,
      skillLevel,
    });

    // Sort by rating and return top results
    return filtered.sort((a, b) => b.rating - a.rating).slice(0, limit);
  }

  /**
   * Get today's featured video
   */
  getTodaysFeaturedVideo(position?: FlagPosition): InstagramVideo | null {
    const today = new Date();
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
        86400000,
    );

    let videos = this._videos();
    if (position) {
      videos = this.getVideosForPosition(position);
    }

    if (videos.length === 0) return null;

    // Rotate through videos based on day of year
    const index = dayOfYear % videos.length;
    return videos[index];
  }

  // ============================================================================
  // INSTAGRAM EMBED API
  // ============================================================================

  /**
   * Get Instagram oEmbed data for a video URL
   * Uses Instagram's oEmbed endpoint for official embedding
   */
  async getEmbedData(url: string): Promise<InstagramEmbedResponse | null> {
    // Check cache first
    const cached = this._embedCache().get(url);
    if (cached) {
      this.logger.debug("[InstagramVideoService] Returning cached embed data");
      return cached;
    }

    // Set loading state
    const loadingStates = new Map(this._loadingStates());
    loadingStates.set(url, true);
    this._loadingStates.set(loadingStates);

    try {
      // Instagram oEmbed endpoint
      const oEmbedUrl = `https://graph.facebook.com/v18.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=${this.getAccessToken()}&omitscript=true`;

      const response = await fetch(oEmbedUrl);

      if (!response.ok) {
        this.logger.warn(
          `[InstagramVideoService] oEmbed request failed: ${response.status}`,
        );
        return null;
      }

      const data: InstagramEmbedResponse = await response.json();

      // Cache the result
      const cache = new Map(this._embedCache());
      cache.set(url, data);
      this._embedCache.set(cache);

      return data;
    } catch (error) {
      this.logger.error(
        "[InstagramVideoService] Failed to fetch embed data:",
        error,
      );
      return null;
    } finally {
      // Clear loading state
      const loadingStates = new Map(this._loadingStates());
      loadingStates.set(url, false);
      this._loadingStates.set(loadingStates);
    }
  }

  /**
   * Generate embed HTML for an Instagram video
   * Falls back to iframe if oEmbed fails
   */
  generateEmbedHtml(
    video: InstagramVideo,
    options: {
      width?: number;
      maxWidth?: string;
      captioned?: boolean;
    } = {},
  ): string {
    const { width = 400, maxWidth = "100%", captioned = true } = options;

    // Use iframe embed as primary method (more reliable)
    const embedUrl = captioned
      ? `${video.embedUrl}?captioned=true`
      : video.embedUrl;

    return `
      <div class="instagram-embed-container" style="max-width: ${maxWidth}; margin: 0 auto;">
        <iframe
          src="${embedUrl}"
          width="${width}"
          height="${Math.round(width * 1.25)}"
          frameborder="0"
          scrolling="no"
          allowtransparency="true"
          allowfullscreen="true"
          loading="lazy"
          style="max-width: 100%; border-radius: 12px; background: transparent;"
        ></iframe>
      </div>
    `;
  }

  /**
   * Extract shortcode from Instagram URL
   */
  extractShortcode(url: string): string | null {
    // Handle various Instagram URL formats
    const patterns = [
      /instagram\.com\/p\/([A-Za-z0-9_-]+)/,
      /instagram\.com\/reel\/([A-Za-z0-9_-]+)/,
      /instagram\.com\/tv\/([A-Za-z0-9_-]+)/,
      /instagr\.am\/p\/([A-Za-z0-9_-]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Build Instagram URL from shortcode
   */
  buildInstagramUrl(shortcode: string, type: "post" | "reel" = "reel"): string {
    return `https://www.instagram.com/${type === "reel" ? "reel" : "p"}/${shortcode}/`;
  }

  // ============================================================================
  // CREATOR MANAGEMENT
  // ============================================================================

  /**
   * Get all featured creators
   */
  getFeaturedCreators(): InstagramCreator[] {
    return this._creators();
  }

  /**
   * Get creator by username
   */
  getCreatorByUsername(username: string): InstagramCreator | undefined {
    return this._creators().find(
      (c) => c.username.toLowerCase() === username.toLowerCase(),
    );
  }

  /**
   * Get videos by creator
   */
  getVideosByCreator(username: string): InstagramVideo[] {
    return this._videos().filter(
      (v) => v.creator.username.toLowerCase() === username.toLowerCase(),
    );
  }

  /**
   * Get creators by position specialty
   */
  getCreatorsByPosition(position: FlagPosition): InstagramCreator[] {
    return this._creators().filter((c) => c.position === position);
  }

  // ============================================================================
  // PLAYLIST MANAGEMENT
  // ============================================================================

  /**
   * Create a custom playlist from Instagram videos
   */
  createPlaylist(
    name: string,
    description: string,
    videoIds: string[],
    options: {
      position?: FlagPosition;
      focus?: TrainingFocus[];
    } = {},
  ): InstagramPlaylist {
    const videos = videoIds
      .map((id) => this.getVideoById(id))
      .filter((v): v is InstagramVideo => v !== undefined);

    const totalDuration = videos.reduce(
      (sum, v) => sum + (v.duration || 60),
      0,
    );

    return {
      id: `playlist_${Date.now()}`,
      name,
      description,
      videos,
      position: options.position,
      focus: options.focus || [],
      totalDuration,
      createdBy: "user",
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Get pre-built position-specific playlists
   */
  getPositionPlaylist(position: FlagPosition): InstagramPlaylist {
    const videos = this.getVideosForPosition(position);
    const focusSet = new Set<TrainingFocus>();
    videos.forEach((v) => v.trainingFocus.forEach((f) => focusSet.add(f)));

    return {
      id: `position_${position.toLowerCase()}`,
      name: `${position} Training Collection`,
      description: `Curated Instagram training videos for ${position} position`,
      videos,
      position,
      focus: Array.from(focusSet),
      totalDuration: videos.reduce((sum, v) => sum + (v.duration || 60), 0),
      createdBy: "system",
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Get pre-built focus-specific playlists
   */
  getFocusPlaylist(focus: TrainingFocus): InstagramPlaylist {
    const videos = this.getVideosForFocus(focus);

    return {
      id: `focus_${focus}`,
      name: `${this.formatFocusName(focus)} Training`,
      description: `Instagram videos focused on ${this.formatFocusName(focus).toLowerCase()}`,
      videos,
      focus: [focus],
      totalDuration: videos.reduce((sum, v) => sum + (v.duration || 60), 0),
      createdBy: "system",
      createdAt: new Date().toISOString(),
    };
  }

  // ============================================================================
  // SELECTION STATE
  // ============================================================================

  /**
   * Select a video for viewing
   */
  selectVideo(video: InstagramVideo | null): void {
    this._selectedVideo.set(video);
  }

  /**
   * Select video by ID
   */
  selectVideoById(id: string): boolean {
    const video = this.getVideoById(id);
    if (video) {
      this._selectedVideo.set(video);
      return true;
    }
    return false;
  }

  /**
   * Check if a video is loading
   */
  isLoading(url: string): boolean {
    return this._loadingStates().get(url) || false;
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Get video statistics
   */
  getStatistics(): {
    totalVideos: number;
    totalCreators: number;
    byPosition: Record<string, number>;
    byFocus: Record<string, number>;
    averageRating: number;
    reelCount: number;
  } {
    const videos = this._videos();
    const byPosition: Record<string, number> = {};
    const byFocus: Record<string, number> = {};

    for (const video of videos) {
      for (const position of video.positions) {
        byPosition[position] = (byPosition[position] || 0) + 1;
      }
      for (const focus of video.trainingFocus) {
        byFocus[focus] = (byFocus[focus] || 0) + 1;
      }
    }

    const totalRating = videos.reduce((sum, v) => sum + v.rating, 0);

    return {
      totalVideos: videos.length,
      totalCreators: this._creators().length,
      byPosition,
      byFocus,
      averageRating: videos.length > 0 ? totalRating / videos.length : 0,
      reelCount: videos.filter((v) => v.isReel).length,
    };
  }

  // ============================================================================
  // SEARCH
  // ============================================================================

  /**
   * Search videos by query
   */
  searchVideos(query: string): InstagramVideo[] {
    const lowerQuery = query.toLowerCase();

    return this._videos().filter(
      (video) =>
        video.title.toLowerCase().includes(lowerQuery) ||
        video.description.toLowerCase().includes(lowerQuery) ||
        video.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
        video.creator.username.toLowerCase().includes(lowerQuery) ||
        video.creator.displayName.toLowerCase().includes(lowerQuery),
    );
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Get Instagram access token
   * In production, this should come from environment/backend
   */
  private getAccessToken(): string {
    // This should be configured via environment variables
    // For now, return empty string - oEmbed will work without token for public posts
    return "";
  }

  /**
   * Format training focus name for display
   */
  private formatFocusName(focus: TrainingFocus): string {
    const names: Record<TrainingFocus, string> = {
      speed: "Speed",
      agility: "Agility",
      strength: "Strength",
      power: "Power",
      skills: "Skills",
      throwing: "Throwing",
      catching: "Catching",
      route_running: "Route Running",
      coverage: "Coverage",
      rushing: "Rushing",
      recovery: "Recovery",
      mobility: "Mobility",
      injury_prevention: "Injury Prevention",
      conditioning: "Conditioning",
      mental: "Mental Training",
      plyometrics: "Plyometrics",
      isometrics: "Isometrics",
      reactive_eccentrics: "Reactive Eccentrics",
      deceleration: "Deceleration",
      acceleration: "Acceleration",
      twitches: "Fast Twitch Training",
      explosive_power: "Explosive Power",
    };
    return names[focus] || focus;
  }
}
