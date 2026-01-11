/**
 * Player-related type definitions
 * 
 * Centralized types for player data structures across the application
 */

/**
 * Player statistics for game tracking
 * Used in game stats service and game tracking components
 */
export interface GamePlayerStats {
  passAttempts: number;
  completions: number;
  interceptions: number;
  drops: number;
  targets: number;
  receptions: number;
  rushingAttempts: number;
  rushingYards: number;
  flagPullAttempts: number;
  flagPulls: number;
  missedFlagPulls: number;
}

/**
 * Player with comprehensive statistics
 * Used for player comparison and display components
 */
export interface PlayerWithStats {
  id: string;
  name: string;
  position: string;
  avatarUrl?: string;
  jerseyNumber?: number;
  stats: {
    [key: string]: number | string;
  };
  // Common football stats
  touchdowns?: number;
  receptions?: number;
  rushingYards?: number;
  passingYards?: number;
  interceptions?: number;
  tackles?: number;
  flagPulls?: number;
  completionRate?: number;
  // Training stats
  trainingHours?: number;
  workoutsCompleted?: number;
  attendanceRate?: number;
  // Physical stats
  speed40yd?: number;
  verticalJump?: number;
  agility?: number;
}

/**
 * Legacy PlayerStats interface - use GamePlayerStats or PlayerWithStats instead
 * @deprecated Use GamePlayerStats for game statistics or PlayerWithStats for player display
 */
export type PlayerStats = GamePlayerStats | PlayerWithStats;
