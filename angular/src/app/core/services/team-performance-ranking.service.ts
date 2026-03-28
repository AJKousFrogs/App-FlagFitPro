/**
 * Team Performance Ranking Service
 *
 * Compares a player's performance metrics against their teammates.
 * - Shows team rankings (1st, 2nd, 3rd, etc.)
 * - Shows gap from team leader
 * - Awards achievement badges for top 3 performers
 *
 * PRIVACY: Only shows your own ranking and gap from leader.
 * Does not expose other players' actual performance numbers.
 */

import { Injectable, inject, signal, computed } from "@angular/core";
import { LoggerService } from "./logger.service";
import { SupabaseService } from "./supabase.service";
import { TeamMembershipService } from "./team-membership.service";
import { AchievementsService } from "./achievements.service";
import { isBenignSupabaseQueryError } from "../../shared/utils/error.utils";

/**
 * Performance metric types that can be ranked
 */
export type RankableMetric =
  | "dash_40"
  | "sprint_10m"
  | "sprint_20m"
  | "pro_agility"
  | "vertical_jump"
  | "broad_jump"
  | "bench_press"
  | "back_squat"
  | "deadlift";

/**
 * Individual metric ranking result
 */
export interface MetricRanking {
  metric: RankableMetric;
  metricLabel: string;
  yourValue: number;
  yourRank: number;
  totalPlayers: number;
  teamBestValue: number;
  gapFromLeader: number;
  gapFormatted: string;
  isLowerBetter: boolean; // true for time-based metrics (40-yard, etc.)
  percentile: number;
  achievementTier: "gold" | "silver" | "bronze" | null;
}

/**
 * Team ranking overview for a player
 */
export interface TeamRankingOverview {
  rankings: MetricRanking[];
  totalGoldBadges: number;
  totalSilverBadges: number;
  totalBronzeBadges: number;
  strongestMetric: MetricRanking | null;
  weakestMetric: MetricRanking | null;
  lastUpdated: Date;
}

/**
 * Achievement badge for top performers
 */
export interface PerformanceAchievement {
  id: string;
  metric: RankableMetric;
  metricLabel: string;
  rank: 1 | 2 | 3;
  tier: "gold" | "silver" | "bronze";
  value: number;
  valueFormatted: string;
  awardedAt: Date;
}

// Metric configuration
const METRIC_CONFIG: Record<
  RankableMetric,
  { label: string; unit: string; isLowerBetter: boolean }
> = {
  dash_40: { label: "40-Yard Dash", unit: "s", isLowerBetter: true },
  sprint_10m: { label: "10-Yard Sprint", unit: "s", isLowerBetter: true },
  sprint_20m: { label: "20-Yard Sprint", unit: "s", isLowerBetter: true },
  pro_agility: {
    label: "Pro Agility (5-10-5)",
    unit: "s",
    isLowerBetter: true,
  },
  vertical_jump: { label: "Vertical Jump", unit: '"', isLowerBetter: false },
  broad_jump: { label: "Broad Jump", unit: '"', isLowerBetter: false },
  bench_press: { label: "Bench Press", unit: " lbs", isLowerBetter: false },
  back_squat: { label: "Back Squat", unit: " lbs", isLowerBetter: false },
  deadlift: { label: "Deadlift", unit: " lbs", isLowerBetter: false },
};

@Injectable({
  providedIn: "root",
})
export class TeamPerformanceRankingService {
  private readonly logger = inject(LoggerService);
  private readonly supabaseService = inject(SupabaseService);
  private readonly teamMembershipService = inject(TeamMembershipService);
  private readonly achievementsService = inject(AchievementsService);
  private performanceRecordsUnavailable = false;

  // State signals
  private readonly _rankings = signal<TeamRankingOverview | null>(null);
  private readonly _achievements = signal<PerformanceAchievement[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Public readonly signals
  readonly rankings = this._rankings.asReadonly();
  readonly achievements = this._achievements.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed helpers
  readonly hasRankings = computed(() => !!this._rankings()?.rankings.length);
  readonly goldBadges = computed(() =>
    this._achievements().filter((a) => a.tier === "gold"),
  );
  readonly silverBadges = computed(() =>
    this._achievements().filter((a) => a.tier === "silver"),
  );
  readonly bronzeBadges = computed(() =>
    this._achievements().filter((a) => a.tier === "bronze"),
  );
  readonly totalBadges = computed(() => this._achievements().length);

  /**
   * Load team rankings for the current user
   */
  async loadTeamRankings(): Promise<TeamRankingOverview | null> {
    const user = this.supabaseService.getCurrentUser();
    const teamId = this.teamMembershipService.teamId();

    if (!user || !teamId) {
      this.logger.info("[TeamRanking] No user or team - skipping ranking load");
      this._rankings.set(null);
      return null;
    }

    this._isLoading.set(true);
    this._error.set(null);

    try {
      if (this.performanceRecordsUnavailable) {
        this._rankings.set(null);
        this._isLoading.set(false);
        return null;
      }

      // Get all team members' latest performance records
      const { data: teamMembers, error: membersError } =
        await this.supabaseService.client
          .from("team_members")
          .select("user_id")
          .eq("team_id", teamId)
          .eq("status", "active")
          .eq("role", "player");

      if (membersError || !teamMembers?.length) {
        this.logger.warn("[TeamRanking] No team members found");
        this._isLoading.set(false);
        return null;
      }

      const memberIds = teamMembers.map((m) => m.user_id);

      // Get latest performance record for each team member
      // Using a subquery approach to get only the latest record per user
      const { data: allRecords, error: recordsError } =
        await this.supabaseService.client
          .from("performance_records")
          .select("*")
          .in("user_id", memberIds)
          .order("recorded_at", { ascending: false });

      if (recordsError) {
        if (isBenignSupabaseQueryError(recordsError)) {
          this.performanceRecordsUnavailable = true;
          this._rankings.set(null);
          this._isLoading.set(false);
          return null;
        }
        this.logger.error(
          "[TeamRanking] Error fetching records:",
          recordsError,
        );
        this._error.set("Failed to load team rankings");
        this._isLoading.set(false);
        return null;
      }

      // Get only the latest record per user
      const latestByUser = new Map<string, (typeof allRecords)[0]>();
      for (const record of allRecords || []) {
        if (!latestByUser.has(record.user_id)) {
          latestByUser.set(record.user_id, record);
        }
      }

      const teamRecords = Array.from(latestByUser.values());

      if (teamRecords.length === 0) {
        this.logger.info("[TeamRanking] No performance records for team");
        this._rankings.set(null);
        this._isLoading.set(false);
        return null;
      }

      // Get current user's record
      const myRecord = teamRecords.find((r) => r.user_id === user.id);
      if (!myRecord) {
        this.logger.info(
          "[TeamRanking] Current user has no performance record",
        );
        this._rankings.set(null);
        this._isLoading.set(false);
        return null;
      }

      // Calculate rankings for each metric
      const rankings: MetricRanking[] = [];
      const achievements: PerformanceAchievement[] = [];

      for (const [metricKey, config] of Object.entries(METRIC_CONFIG)) {
        const metric = metricKey as RankableMetric;
        const myValue = myRecord[metric];

        if (myValue === null || myValue === undefined) continue;

        // Get all values for this metric
        const values = teamRecords
          .filter((r) => r[metric] !== null && r[metric] !== undefined)
          .map((r) => ({ userId: r.user_id, value: r[metric] as number }));

        if (values.length < 2) continue; // Need at least 2 players to rank

        // Sort values (ascending for time-based, descending for others)
        values.sort((a, b) =>
          config.isLowerBetter ? a.value - b.value : b.value - a.value,
        );

        // Find my rank
        const myRank = values.findIndex((v) => v.userId === user.id) + 1;
        const teamBestValue = values[0].value;
        const totalPlayers = values.length;

        // Calculate gap from leader
        let gapFromLeader: number;
        let gapFormatted: string;

        if (myRank === 1) {
          gapFromLeader = 0;
          gapFormatted = "Team Leader!";
        } else if (config.isLowerBetter) {
          gapFromLeader = myValue - teamBestValue;
          gapFormatted = `+${gapFromLeader.toFixed(2)}${config.unit} behind`;
        } else {
          gapFromLeader = teamBestValue - myValue;
          gapFormatted = `-${gapFromLeader.toFixed(0)}${config.unit} behind`;
        }

        // Calculate percentile
        const percentile = Math.round(
          ((totalPlayers - myRank + 1) / totalPlayers) * 100,
        );

        // Determine achievement tier
        let achievementTier: "gold" | "silver" | "bronze" | null = null;
        if (myRank === 1) achievementTier = "gold";
        else if (myRank === 2) achievementTier = "silver";
        else if (myRank === 3) achievementTier = "bronze";

        const ranking: MetricRanking = {
          metric,
          metricLabel: config.label,
          yourValue: myValue,
          yourRank: myRank,
          totalPlayers,
          teamBestValue,
          gapFromLeader,
          gapFormatted,
          isLowerBetter: config.isLowerBetter,
          percentile,
          achievementTier,
        };

        rankings.push(ranking);

        // Create achievement if top 3
        if (achievementTier) {
          achievements.push({
            id: `${metric}-${achievementTier}`,
            metric,
            metricLabel: config.label,
            rank: myRank as 1 | 2 | 3,
            tier: achievementTier,
            value: myValue,
            valueFormatted: `${myValue}${config.unit}`,
            awardedAt: new Date(),
          });
        }
      }

      // Calculate summary
      const goldCount = rankings.filter(
        (r) => r.achievementTier === "gold",
      ).length;
      const silverCount = rankings.filter(
        (r) => r.achievementTier === "silver",
      ).length;
      const bronzeCount = rankings.filter(
        (r) => r.achievementTier === "bronze",
      ).length;

      // Find strongest/weakest metrics by percentile
      const sortedByPercentile = [...rankings].sort(
        (a, b) => b.percentile - a.percentile,
      );
      const strongestMetric = sortedByPercentile[0] || null;
      const weakestMetric =
        sortedByPercentile[sortedByPercentile.length - 1] || null;

      const overview: TeamRankingOverview = {
        rankings,
        totalGoldBadges: goldCount,
        totalSilverBadges: silverCount,
        totalBronzeBadges: bronzeCount,
        strongestMetric,
        weakestMetric,
        lastUpdated: new Date(),
      };

      this._rankings.set(overview);
      this._achievements.set(achievements);
      this._isLoading.set(false);

      this.logger.info("[TeamRanking] Rankings loaded", {
        metricsRanked: rankings.length,
        goldBadges: goldCount,
        silverBadges: silverCount,
        bronzeBadges: bronzeCount,
      });

      // Unlock achievements for top performers
      await this.unlockPerformanceAchievements(achievements);

      return overview;
    } catch (error) {
      this.logger.error("[TeamRanking] Unexpected error:", error);
      this._error.set("Failed to load team rankings");
      this._isLoading.set(false);
      return null;
    }
  }

  /**
   * Unlock achievements in the achievements system for top performers
   */
  private async unlockPerformanceAchievements(
    achievements: PerformanceAchievement[],
  ): Promise<void> {
    for (const achievement of achievements) {
      const achievementId = `team-${achievement.tier}-${achievement.metric}`;
      try {
        // This will handle deduplication - won't unlock if already unlocked
        this.achievementsService.unlockAchievement(achievementId).subscribe();
      } catch (_error) {
        this.logger.warn(
          "[TeamRanking] Failed to unlock achievement:",
          achievementId,
        );
      }
    }
  }

  /**
   * Get ranking for a specific metric
   */
  getRankingForMetric(metric: RankableMetric): MetricRanking | null {
    return this._rankings()?.rankings.find((r) => r.metric === metric) || null;
  }

  /**
   * Get formatted rank string (1st, 2nd, 3rd, etc.)
   */
  formatRank(rank: number): string {
    if (rank === 1) return "1st";
    if (rank === 2) return "2nd";
    if (rank === 3) return "3rd";
    return `${rank}th`;
  }

  /**
   * Get rank emoji
   */
  getRankEmoji(rank: number): string {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return "";
  }

  /**
   * Get tier color for CSS
   */
  getTierColor(tier: "gold" | "silver" | "bronze" | null): string {
    switch (tier) {
      case "gold":
        return "var(--color-metallic-gold)";
      case "silver":
        return "var(--color-metallic-silver)";
      case "bronze":
        return "var(--color-metallic-bronze)";
      default:
        return "var(--text-color-secondary)";
    }
  }

  /**
   * Clear rankings (e.g., on logout)
   */
  clearRankings(): void {
    this._rankings.set(null);
    this._achievements.set([]);
  }
}
