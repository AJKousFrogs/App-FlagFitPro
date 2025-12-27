import { Injectable, inject } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService, API_ENDPOINTS } from './api.service';
import { LoggerService } from './logger.service';

// ============================================================================
// INTERFACES
// ============================================================================

export interface TeamOverviewStats {
  teamId: string;
  teamName: string;
  season: string;
  
  // Record
  wins: number;
  losses: number;
  ties: number;
  winPercentage: number;
  streak: string; // e.g., "W3" or "L1"
  
  // Squad
  totalPlayers: number;
  activePlayers: number;
  injuredPlayers: number;
  
  // Ratings
  overallRating: number;
  offenseRating: number;
  defenseRating: number;
  teamChemistry: number;
  
  // Attendance
  practiceAttendanceRate: number;
  gameAttendanceRate: number;
  
  // Training
  avgTeamWorkload: number;
  playersAtRisk: number;
  trainingConsistency: number;
}

export interface PlayerPerformanceStats {
  playerId: string;
  playerName: string;
  position: string;
  jerseyNumber?: string;
  avatarInitials: string;
  status: 'active' | 'injured' | 'inactive' | 'at_risk';
  
  // Overall
  performanceScore: number;
  performanceTrend: 'up' | 'down' | 'stable';
  gamesPlayed: number;
  gamesMissed: number;
  attendanceRate: number;
  
  // Workload & Risk
  workload: number;
  acwr: number;
  readiness: number;
  riskLevel: 'low' | 'medium' | 'high';
  
  // Position-specific stats (varies by position)
  positionStats: PositionStats;
}

export interface PositionStats {
  // QB Stats
  passAttempts?: number;
  completions?: number;
  completionPercentage?: number;
  passingYards?: number;
  passingTDs?: number;
  interceptions?: number;
  qbRating?: number;
  
  // Receiving Stats
  targets?: number;
  receptions?: number;
  receivingYards?: number;
  receivingTDs?: number;
  catchRate?: number;
  drops?: number;
  yardsAfterCatch?: number;
  
  // Rushing Stats
  rushAttempts?: number;
  rushingYards?: number;
  rushingTDs?: number;
  yardsPerCarry?: number;
  
  // Defensive Stats
  flagPulls?: number;
  flagPullAttempts?: number;
  flagPullSuccessRate?: number;
  interceptionsDef?: number;
  passDeflections?: number;
}

export interface GameResult {
  gameId: string;
  date: Date;
  opponent: string;
  opponentLogo?: string;
  location: 'home' | 'away' | 'neutral';
  result: 'win' | 'loss' | 'tie';
  teamScore: number;
  opponentScore: number;
  gameType: string;
  highlights?: string[];
}

export interface UpcomingGame {
  gameId: string;
  date: Date;
  opponent: string;
  opponentLogo?: string;
  location: string;
  gameType: string;
  daysUntil: number;
  teamReadiness: number;
}

export interface TrainingSession {
  sessionId: string;
  date: Date;
  time: string;
  title: string;
  type: 'practice' | 'game_prep' | 'conditioning' | 'film_study';
  duration: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  attendanceCount?: number;
  totalPlayers?: number;
}

export interface TeamMessage {
  messageId: string;
  author: string;
  authorAvatar: string;
  content: string;
  timestamp: Date;
  type: 'announcement' | 'player' | 'coach' | 'system';
  isRead: boolean;
}

export interface RiskAlert {
  playerId: string;
  playerName: string;
  position: string;
  alertType: 'high_acwr' | 'low_readiness' | 'injury_risk' | 'overtraining' | 'undertraining';
  severity: 'warning' | 'critical';
  message: string;
  recommendation: string;
  acwr?: number;
  readiness?: number;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable({
  providedIn: 'root'
})
export class TeamStatisticsService {
  private apiService = inject(ApiService);
  private logger = inject(LoggerService);

  /**
   * Get comprehensive team overview statistics
   */
  getTeamOverview(teamId: string): Observable<TeamOverviewStats> {
    return this.apiService.get<TeamOverviewStats>(API_ENDPOINTS.coach.dashboard, { teamId })
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return this.getMockTeamOverview();
        }),
        catchError(error => {
          this.logger.warn('Using mock team overview data:', error);
          return of(this.getMockTeamOverview());
        })
      );
  }

  /**
   * Get all players with their performance statistics
   */
  getTeamPlayersStats(teamId: string): Observable<PlayerPerformanceStats[]> {
    return this.apiService.get<PlayerPerformanceStats[]>(API_ENDPOINTS.coach.team, { teamId })
      .pipe(
        map(response => {
          if (response.success && response.data && Array.isArray(response.data)) {
            return this.processPlayersData(response.data);
          }
          return this.getMockPlayersStats();
        }),
        catchError(error => {
          this.logger.warn('Using mock players stats:', error);
          return of(this.getMockPlayersStats());
        })
      );
  }

  /**
   * Get recent game results
   */
  getRecentGames(teamId: string, limit: number = 5): Observable<GameResult[]> {
    return this.apiService.get<GameResult[]>(API_ENDPOINTS.games.list, { teamId, limit, past: true })
      .pipe(
        map(response => {
          if (response.success && response.data && Array.isArray(response.data)) {
            return this.processGamesData(response.data);
          }
          return this.getMockRecentGames();
        }),
        catchError(error => {
          this.logger.warn('Using mock recent games:', error);
          return of(this.getMockRecentGames());
        })
      );
  }

  /**
   * Get upcoming games/fixtures
   */
  getUpcomingGames(teamId: string, limit: number = 5): Observable<UpcomingGame[]> {
    return this.apiService.get<UpcomingGame[]>(API_ENDPOINTS.coach.games, { teamId, limit })
      .pipe(
        map(response => {
          if (response.success && response.data && Array.isArray(response.data)) {
            return this.processUpcomingGames(response.data);
          }
          return this.getMockUpcomingGames();
        }),
        catchError(error => {
          this.logger.warn('Using mock upcoming games:', error);
          return of(this.getMockUpcomingGames());
        })
      );
  }

  /**
   * Get training schedule
   */
  getTrainingSchedule(teamId: string, days: number = 7): Observable<TrainingSession[]> {
    return this.apiService.get<TrainingSession[]>(API_ENDPOINTS.training.sessions, { teamId, days })
      .pipe(
        map(response => {
          if (response.success && response.data && Array.isArray(response.data)) {
            return response.data;
          }
          return this.getMockTrainingSessions();
        }),
        catchError(error => {
          this.logger.warn('Using mock training sessions:', error);
          return of(this.getMockTrainingSessions());
        })
      );
  }

  /**
   * Get risk alerts for players needing attention
   */
  getRiskAlerts(teamId: string): Observable<RiskAlert[]> {
    return this.apiService.get<RiskAlert[]>(API_ENDPOINTS.analytics.injuryRisk, { teamId })
      .pipe(
        map(response => {
          if (response.success && response.data && Array.isArray(response.data)) {
            return response.data;
          }
          return this.getMockRiskAlerts();
        }),
        catchError(error => {
          this.logger.warn('Using mock risk alerts:', error);
          return of(this.getMockRiskAlerts());
        })
      );
  }

  /**
   * Get team messages/communications
   */
  getTeamMessages(teamId: string, limit: number = 10): Observable<TeamMessage[]> {
    return this.apiService.get<TeamMessage[]>(API_ENDPOINTS.community.feed, { teamId, limit })
      .pipe(
        map(response => {
          if (response.success && response.data && Array.isArray(response.data)) {
            return response.data;
          }
          return this.getMockTeamMessages();
        }),
        catchError(error => {
          this.logger.warn('Using mock team messages:', error);
          return of(this.getMockTeamMessages());
        })
      );
  }

  /**
   * Get team performance trend data for charts
   */
  getPerformanceTrend(teamId: string, weeks: number = 10): Observable<{ labels: string[]; scores: number[] }> {
    return this.apiService.get<{ labels: string[]; scores: number[] }>(
      API_ENDPOINTS.analytics.performanceTrends, 
      { teamId, weeks }
    ).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        return this.getMockPerformanceTrend();
      }),
      catchError(error => {
        this.logger.warn('Using mock performance trend:', error);
        return of(this.getMockPerformanceTrend());
      })
    );
  }

  // ============================================================================
  // DATA PROCESSING HELPERS
  // ============================================================================

  private processPlayersData(players: unknown[]): PlayerPerformanceStats[] {
    return players.map((p: unknown) => {
      const player = p as Record<string, unknown>;
      const name = String(player['name'] || player['full_name'] || 'Unknown');
      const acwr = Number(player['acwr']) || 1.0;
      const readiness = Number(player['readiness']) || 75;
      
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (acwr > 1.5 || readiness < 55) {
        riskLevel = 'high';
      } else if (acwr > 1.3 || readiness < 70) {
        riskLevel = 'medium';
      }

      let status: 'active' | 'injured' | 'inactive' | 'at_risk' = 'active';
      if (player['status'] === 'injured') status = 'injured';
      else if (player['status'] === 'inactive') status = 'inactive';
      else if (riskLevel === 'high') status = 'at_risk';

      return {
        playerId: String(player['id'] || player['user_id'] || ''),
        playerName: name,
        position: String(player['position'] || 'N/A'),
        jerseyNumber: player['jersey_number'] ? String(player['jersey_number']) : undefined,
        avatarInitials: this.getInitials(name),
        status,
        performanceScore: Number(player['performance_score'] || player['overall_rating']) || 75,
        performanceTrend: this.getTrend(player['performance_trend']),
        gamesPlayed: Number(player['games_played']) || 0,
        gamesMissed: Number(player['games_missed']) || 0,
        attendanceRate: Number(player['attendance_rate']) || 90,
        workload: Number(player['workload'] || player['today_workload']) || 0,
        acwr,
        readiness,
        riskLevel,
        positionStats: this.extractPositionStats(player),
      };
    });
  }

  private processGamesData(games: unknown[]): GameResult[] {
    return games.map((g: unknown) => {
      const game = g as Record<string, unknown>;
      const teamScore = Number(game['team_score'] || game['our_score']) || 0;
      const opponentScore = Number(game['opponent_score']) || 0;
      
      let result: 'win' | 'loss' | 'tie' = 'tie';
      if (teamScore > opponentScore) result = 'win';
      else if (teamScore < opponentScore) result = 'loss';

      return {
        gameId: String(game['id'] || game['game_id'] || ''),
        date: new Date(String(game['date'] || game['game_date'] || new Date())),
        opponent: String(game['opponent'] || game['opponent_name'] || 'TBD'),
        location: (game['location'] as 'home' | 'away' | 'neutral') || 'home',
        result,
        teamScore,
        opponentScore,
        gameType: String(game['game_type'] || 'Regular Season'),
      };
    });
  }

  private processUpcomingGames(games: unknown[]): UpcomingGame[] {
    const now = new Date();
    return games
      .map((g: unknown) => {
        const game = g as Record<string, unknown>;
        const date = new Date(String(game['date'] || game['game_start'] || game['game_date'] || new Date()));
        const daysUntil = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          gameId: String(game['id'] || game['game_id'] || ''),
          date,
          opponent: String(game['opponent'] || game['opponent_name'] || 'TBD'),
          location: String(game['location'] || 'TBD'),
          gameType: String(game['game_type'] || 'Game'),
          daysUntil,
          teamReadiness: Number(game['team_readiness']) || 85,
        };
      })
      .filter(g => g.daysUntil >= 0)
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }

  private extractPositionStats(player: Record<string, unknown>): PositionStats {
    return {
      passAttempts: player['pass_attempts'] as number | undefined,
      completions: player['completions'] as number | undefined,
      completionPercentage: player['completion_percentage'] as number | undefined,
      passingYards: player['passing_yards'] as number | undefined,
      passingTDs: player['passing_tds'] as number | undefined,
      interceptions: player['interceptions'] as number | undefined,
      qbRating: player['qb_rating'] as number | undefined,
      targets: player['targets'] as number | undefined,
      receptions: player['receptions'] as number | undefined,
      receivingYards: player['receiving_yards'] as number | undefined,
      receivingTDs: player['receiving_tds'] as number | undefined,
      catchRate: player['catch_rate'] as number | undefined,
      drops: player['drops'] as number | undefined,
      yardsAfterCatch: player['yards_after_catch'] as number | undefined,
      rushAttempts: player['rush_attempts'] as number | undefined,
      rushingYards: player['rushing_yards'] as number | undefined,
      rushingTDs: player['rushing_tds'] as number | undefined,
      yardsPerCarry: player['yards_per_carry'] as number | undefined,
      flagPulls: player['flag_pulls'] as number | undefined,
      flagPullAttempts: player['flag_pull_attempts'] as number | undefined,
      flagPullSuccessRate: player['flag_pull_success_rate'] as number | undefined,
      interceptionsDef: player['interceptions_def'] as number | undefined,
      passDeflections: player['pass_deflections'] as number | undefined,
    };
  }

  private getInitials(name: string): string {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  private getTrend(value: unknown): 'up' | 'down' | 'stable' {
    if (typeof value === 'string') {
      if (value === 'up' || value === 'improving') return 'up';
      if (value === 'down' || value === 'declining') return 'down';
    }
    if (typeof value === 'number') {
      if (value > 0) return 'up';
      if (value < 0) return 'down';
    }
    return 'stable';
  }

  // ============================================================================
  // MOCK DATA
  // ============================================================================

  private getMockTeamOverview(): TeamOverviewStats {
    return {
      teamId: 'team-1',
      teamName: 'Lightning Bolts',
      season: '2024',
      wins: 8,
      losses: 2,
      ties: 0,
      winPercentage: 80,
      streak: 'W3',
      totalPlayers: 14,
      activePlayers: 12,
      injuredPlayers: 2,
      overallRating: 87,
      offenseRating: 92,
      defenseRating: 85,
      teamChemistry: 8.4,
      practiceAttendanceRate: 92,
      gameAttendanceRate: 96,
      avgTeamWorkload: 460,
      playersAtRisk: 3,
      trainingConsistency: 88,
    };
  }

  private getMockPlayersStats(): PlayerPerformanceStats[] {
    return [
      {
        playerId: '1',
        playerName: 'Marcus Johnson',
        position: 'QB',
        jerseyNumber: '7',
        avatarInitials: 'MJ',
        status: 'active',
        performanceScore: 92,
        performanceTrend: 'up',
        gamesPlayed: 10,
        gamesMissed: 0,
        attendanceRate: 100,
        workload: 480,
        acwr: 1.15,
        readiness: 85,
        riskLevel: 'low',
        positionStats: {
          passAttempts: 245,
          completions: 178,
          completionPercentage: 72.7,
          passingYards: 2340,
          passingTDs: 24,
          interceptions: 4,
          qbRating: 112.5,
        },
      },
      {
        playerId: '2',
        playerName: 'Sarah Williams',
        position: 'WR',
        jerseyNumber: '21',
        avatarInitials: 'SW',
        status: 'active',
        performanceScore: 88,
        performanceTrend: 'up',
        gamesPlayed: 10,
        gamesMissed: 0,
        attendanceRate: 100,
        workload: 520,
        acwr: 1.42,
        readiness: 68,
        riskLevel: 'medium',
        positionStats: {
          targets: 85,
          receptions: 68,
          receivingYards: 945,
          receivingTDs: 9,
          catchRate: 80,
          drops: 3,
          yardsAfterCatch: 312,
        },
      },
      {
        playerId: '3',
        playerName: 'Mike Davis',
        position: 'DB',
        jerseyNumber: '24',
        avatarInitials: 'MD',
        status: 'at_risk',
        performanceScore: 76,
        performanceTrend: 'down',
        gamesPlayed: 8,
        gamesMissed: 2,
        attendanceRate: 80,
        workload: 580,
        acwr: 1.68,
        readiness: 52,
        riskLevel: 'high',
        positionStats: {
          flagPulls: 24,
          flagPullAttempts: 32,
          flagPullSuccessRate: 75,
          interceptionsDef: 3,
          passDeflections: 8,
        },
      },
      {
        playerId: '4',
        playerName: 'Chris Brown',
        position: 'RB',
        jerseyNumber: '22',
        avatarInitials: 'CB',
        status: 'active',
        performanceScore: 85,
        performanceTrend: 'stable',
        gamesPlayed: 10,
        gamesMissed: 0,
        attendanceRate: 95,
        workload: 440,
        acwr: 1.18,
        readiness: 78,
        riskLevel: 'low',
        positionStats: {
          rushAttempts: 65,
          rushingYards: 412,
          rushingTDs: 5,
          yardsPerCarry: 6.3,
          targets: 28,
          receptions: 24,
          receivingYards: 186,
        },
      },
      {
        playerId: '5',
        playerName: 'Emily Rodriguez',
        position: 'WR',
        jerseyNumber: '15',
        avatarInitials: 'ER',
        status: 'injured',
        performanceScore: 84,
        performanceTrend: 'stable',
        gamesPlayed: 7,
        gamesMissed: 3,
        attendanceRate: 70,
        workload: 0,
        acwr: 0,
        readiness: 45,
        riskLevel: 'high',
        positionStats: {
          targets: 52,
          receptions: 42,
          receivingYards: 580,
          receivingTDs: 5,
          catchRate: 80.8,
        },
      },
      {
        playerId: '6',
        playerName: 'David Chen',
        position: 'Rusher',
        jerseyNumber: '55',
        avatarInitials: 'DC',
        status: 'active',
        performanceScore: 81,
        performanceTrend: 'up',
        gamesPlayed: 10,
        gamesMissed: 0,
        attendanceRate: 98,
        workload: 410,
        acwr: 1.22,
        readiness: 82,
        riskLevel: 'low',
        positionStats: {
          flagPulls: 28,
          flagPullAttempts: 35,
          flagPullSuccessRate: 80,
          passDeflections: 5,
        },
      },
      {
        playerId: '7',
        playerName: 'Alex Thompson',
        position: 'WR',
        jerseyNumber: '88',
        avatarInitials: 'AT',
        status: 'active',
        performanceScore: 79,
        performanceTrend: 'up',
        gamesPlayed: 9,
        gamesMissed: 1,
        attendanceRate: 90,
        workload: 450,
        acwr: 1.28,
        readiness: 74,
        riskLevel: 'low',
        positionStats: {
          targets: 62,
          receptions: 48,
          receivingYards: 620,
          receivingTDs: 6,
          catchRate: 77.4,
        },
      },
      {
        playerId: '8',
        playerName: 'Jordan Lee',
        position: 'DB',
        jerseyNumber: '3',
        avatarInitials: 'JL',
        status: 'active',
        performanceScore: 83,
        performanceTrend: 'stable',
        gamesPlayed: 10,
        gamesMissed: 0,
        attendanceRate: 94,
        workload: 420,
        acwr: 1.12,
        readiness: 80,
        riskLevel: 'low',
        positionStats: {
          flagPulls: 32,
          flagPullAttempts: 38,
          flagPullSuccessRate: 84.2,
          interceptionsDef: 4,
          passDeflections: 12,
        },
      },
    ];
  }

  private getMockRecentGames(): GameResult[] {
    const now = new Date();
    return [
      {
        gameId: 'g1',
        date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        opponent: 'Storm Riders',
        location: 'home',
        result: 'win',
        teamScore: 28,
        opponentScore: 14,
        gameType: 'Regular Season',
        highlights: ['Marcus Johnson: 3 TDs', 'Sarah Williams: 125 receiving yards'],
      },
      {
        gameId: 'g2',
        date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        opponent: 'Fire Dragons',
        location: 'away',
        result: 'loss',
        teamScore: 21,
        opponentScore: 24,
        gameType: 'Regular Season',
      },
      {
        gameId: 'g3',
        date: new Date(now.getTime() - 17 * 24 * 60 * 60 * 1000),
        opponent: 'Thunder Hawks',
        location: 'home',
        result: 'win',
        teamScore: 35,
        opponentScore: 21,
        gameType: 'Regular Season',
      },
      {
        gameId: 'g4',
        date: new Date(now.getTime() - 24 * 24 * 60 * 60 * 1000),
        opponent: 'Night Wolves',
        location: 'away',
        result: 'win',
        teamScore: 31,
        opponentScore: 17,
        gameType: 'Regular Season',
      },
      {
        gameId: 'g5',
        date: new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000),
        opponent: 'Iron Eagles',
        location: 'home',
        result: 'win',
        teamScore: 24,
        opponentScore: 21,
        gameType: 'Regular Season',
      },
    ];
  }

  private getMockUpcomingGames(): UpcomingGame[] {
    const now = new Date();
    return [
      {
        gameId: 'ug1',
        date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        opponent: 'Thunder Bolts',
        location: 'Home Field',
        gameType: 'Regular Season',
        daysUntil: 3,
        teamReadiness: 87,
      },
      {
        gameId: 'ug2',
        date: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
        opponent: 'Fire Hawks',
        location: 'Away - Central Park',
        gameType: 'Regular Season',
        daysUntil: 10,
        teamReadiness: 82,
      },
      {
        gameId: 'ug3',
        date: new Date(now.getTime() + 17 * 24 * 60 * 60 * 1000),
        opponent: 'Storm Chasers',
        location: 'Home Field',
        gameType: 'Playoff',
        daysUntil: 17,
        teamReadiness: 85,
      },
    ];
  }

  private getMockTrainingSessions(): TrainingSession[] {
    const now = new Date();
    return [
      {
        sessionId: 'ts1',
        date: now,
        time: '6:00 PM',
        title: 'Offensive Drills & Route Running',
        type: 'practice',
        duration: 90,
        status: 'scheduled',
        attendanceCount: 11,
        totalPlayers: 12,
      },
      {
        sessionId: 'ts2',
        date: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
        time: '5:30 PM',
        title: 'Defensive Coverage & Flag Pulling',
        type: 'practice',
        duration: 90,
        status: 'scheduled',
      },
      {
        sessionId: 'ts3',
        date: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        time: '6:00 PM',
        title: 'Game Prep vs Thunder Bolts',
        type: 'game_prep',
        duration: 75,
        status: 'scheduled',
      },
      {
        sessionId: 'ts4',
        date: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
        time: '7:00 PM',
        title: 'Film Study Session',
        type: 'film_study',
        duration: 60,
        status: 'scheduled',
      },
    ];
  }

  private getMockRiskAlerts(): RiskAlert[] {
    return [
      {
        playerId: '3',
        playerName: 'Mike Davis',
        position: 'DB',
        alertType: 'high_acwr',
        severity: 'critical',
        message: 'ACWR at 1.68 - significantly above safe threshold',
        recommendation: 'Reduce training load by 30% for next 5 days',
        acwr: 1.68,
        readiness: 52,
      },
      {
        playerId: '2',
        playerName: 'Sarah Williams',
        position: 'WR',
        alertType: 'low_readiness',
        severity: 'warning',
        message: 'Readiness score dropped to 68/100',
        recommendation: 'Consider lighter practice load and extra recovery',
        acwr: 1.42,
        readiness: 68,
      },
      {
        playerId: '5',
        playerName: 'Emily Rodriguez',
        position: 'WR',
        alertType: 'injury_risk',
        severity: 'critical',
        message: 'Currently injured - ankle sprain',
        recommendation: 'Follow rehabilitation protocol, estimated 2 weeks',
        readiness: 45,
      },
    ];
  }

  private getMockTeamMessages(): TeamMessage[] {
    const now = new Date();
    return [
      {
        messageId: 'm1',
        author: 'Marcus Johnson',
        authorAvatar: 'MJ',
        content: 'Great practice today team! Ready for Thunder Bolts on Saturday!',
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        type: 'player',
        isRead: true,
      },
      {
        messageId: 'm2',
        author: 'Coach',
        authorAvatar: '🏈',
        content: 'Practice moved to 6:30 PM tomorrow due to field maintenance.',
        timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000),
        type: 'announcement',
        isRead: true,
      },
      {
        messageId: 'm3',
        author: 'Emily Rodriguez',
        authorAvatar: 'ER',
        content: 'Physical therapy going well. Should be back for playoffs!',
        timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        type: 'player',
        isRead: false,
      },
    ];
  }

  private getMockPerformanceTrend(): { labels: string[]; scores: number[] } {
    return {
      labels: ['Game 1', 'Game 2', 'Game 3', 'Game 4', 'Game 5', 'Game 6', 'Game 7', 'Game 8', 'Game 9', 'Game 10'],
      scores: [78, 82, 79, 85, 88, 84, 91, 87, 89, 92],
    };
  }
}
