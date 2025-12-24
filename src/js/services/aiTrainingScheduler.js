/**
 * AI-Powered Training Scheduler
 * Intelligently adjusts training periodization based on:
 * - Tournament dates
 * - Player practice schedules
 * - Game schedules
 * - League commitments
 * - Recovery needs
 *
 * Evidence-Based Tapering & Periodization:
 * - 7-14 day taper with 40-60% volume reduction (consensus range)
 * - Up to 60-90% volume reduction after heavy overload blocks
 * - Minimum intensity floor: 80-90% of normal (maintain intensity during taper)
 * - Major events: 10-14 day structured taper (after 2-4 weeks overload)
 * - Minor events: 4-7 day taper
 * - Back-to-back peak logic: post-event recovery → mini-overload → mini-taper
 *
 * References:
 * - Bosquet et al. (2007): Effects of tapering on performance
 * - Mujika & Padilla (2003): Scientific bases for precompetition tapering strategies
 * - Multiple reviews on team-sport tapering protocols
 */

import { ANNUAL_TRAINING_PROGRAM } from "../../training-program-data.js";
import {
  getAllTournaments,
  getDaysUntilTournament,
} from "../../tournament-schedule.js";

/**
 * Event importance levels for taper differentiation
 */
const EVENT_IMPORTANCE = {
  MAJOR: "major", // Elite 8, World Championship - 10-14 day taper, 50-70% volume cut
  HIGH: "high", // Major tournaments - 7-10 day taper, 40-60% volume cut
  MEDIUM: "medium", // Regular tournaments - 5-7 day taper, 30-50% volume cut
  MINOR: "minor", // League games, scrimmages - 3-5 day taper, 20-40% volume cut
};

class AITrainingScheduler {
  constructor() {
    this.tournamentDates = this.loadTournamentDates();
    this.periodizationRules = this.initializePeriodizationRules();
    this.taperConfig = this.initializeTaperConfig();
  }

  /**
   * Initialize evidence-based taper configuration
   * Based on consensus ranges: 7-14 day taper, 40-60% volume reduction
   */
  initializeTaperConfig() {
    return {
      // Target total volume reduction across last 10-14 days (evidence-based)
      targetVolumeReduction: {
        major: { min: 0.5, max: 0.7 }, // 50-70% reduction for major events
        high: { min: 0.4, max: 0.6 }, // 40-60% reduction (consensus range)
        medium: { min: 0.3, max: 0.5 }, // 30-50% reduction
        minor: { min: 0.2, max: 0.4 }, // 20-40% reduction
      },
      // Minimum intensity floor (80-90% of normal) - maintain intensity during taper
      minIntensityFloor: 0.8, // 80% minimum intensity
      maxIntensityFloor: 0.9, // 90% maximum intensity (moderate-high)
      // Taper duration ranges (days)
      taperDuration: {
        major: { min: 10, max: 14 }, // 10-14 days for major events
        high: { min: 7, max: 10 }, // 7-10 days for high-priority events
        medium: { min: 5, max: 7 }, // 5-7 days for medium-priority events
        minor: { min: 3, max: 5 }, // 3-5 days for minor events (league games)
      },
      // Post-overload taper (after heavy overload blocks: 60-90% reduction)
      postOverloadTaper: {
        volumeReduction: { min: 0.6, max: 0.9 },
        duration: { min: 10, max: 14 },
      },
      // Overload period before major events (2-4 weeks)
      overloadPeriod: {
        duration: { min: 14, max: 28 }, // 2-4 weeks
        volumeMultiplier: 1.1, // 10% volume increase
        intensityMultiplier: 0.95, // Slight intensity reduction during overload
      },
    };
  }

  /**
   * Load official tournament dates with event importance
   */
  loadTournamentDates() {
    const tournaments = getAllTournaments();
    return tournaments
      .filter((t) => t.startDate !== "TBD")
      .map((t) => ({
        id: t.id,
        name: t.name,
        startDate: new Date(t.startDate),
        endDate: new Date(t.endDate),
        location: t.location,
        priority: this.getTournamentPriority(t),
        eventImportance: this.getEventImportance(t), // NEW: Explicit importance field
      }))
      .sort((a, b) => a.startDate - b.startDate);
  }

  /**
   * Get tournament priority (legacy - kept for backward compatibility)
   */
  getTournamentPriority(tournament) {
    const priorityMap = {
      elite_8_2026: "peak", // Most important
      capital_bowl_2026: "high",
      big_bowl_2026: "high",
      copenhagen_bowl_2026: "high",
      adria_bowl_2026: "high",
    };
    return priorityMap[tournament.id] || "medium";
  }

  /**
   * Get event importance for taper differentiation
   * Maps to evidence-based taper durations and volume reductions
   */
  getEventImportance(tournament) {
    const importanceMap = {
      elite_8_2026: EVENT_IMPORTANCE.MAJOR, // 10-14 days, 50-70% volume cut
      world_championship_2026: EVENT_IMPORTANCE.MAJOR,
      capital_bowl_2026: EVENT_IMPORTANCE.HIGH, // 7-10 days, 40-60% volume cut
      big_bowl_2026: EVENT_IMPORTANCE.HIGH,
      copenhagen_bowl_2026: EVENT_IMPORTANCE.HIGH,
      adria_bowl_2026: EVENT_IMPORTANCE.MEDIUM, // 5-7 days, 30-50% volume cut
    };
    return importanceMap[tournament.id] || EVENT_IMPORTANCE.MEDIUM;
  }

  /**
   * Initialize periodization rules based on annual program
   * Evidence-based taper protocols with explicit parameters
   */
  initializePeriodizationRules() {
    return {
      // Days before tournament - evidence-based taper adjustments
      // Note: Actual taper duration and volume reduction determined by eventImportance
      taper: {
        "0-2": { volume: 0, intensity: 0, type: "rest" }, // Tournament days
        "3-4": { volume: 0.2, intensity: 0.85, type: "light_activation" }, // Maintain intensity floor
        "5-7": { volume: 0.4, intensity: 0.85, type: "taper" },
        "8-14": { volume: 0.6, intensity: 0.8, type: "pre_taper" },
      },
      // Days after tournament - recovery (back-to-back peak logic)
      recovery: {
        "0-1": { volume: 0, intensity: 0, type: "complete_rest" },
        "2-3": { volume: 0.1, intensity: 0.2, type: "mobility_only" },
        "4-5": { volume: 0.3, intensity: 0.4, type: "light_activation" },
        "6-7": { volume: 0.5, intensity: 0.6, type: "return_to_training" },
      },
      // Practice day adjustments
      practiceDay: {
        flagPractice: { volume: 0.8, intensity: 0.7, type: "maintenance" },
        techniqueTraining: { volume: 0.6, intensity: 0.5, type: "skill_focus" },
        gameDay: { volume: 0, intensity: 0, type: "rest" },
        dayBeforeGame: { volume: 0.3, intensity: 0.4, type: "light" },
        dayAfterGame: { volume: 0.2, intensity: 0.3, type: "recovery" },
      },
      // League game adjustments (minor events: 3-5 day taper, 20-40% cut)
      leagueGame: {
        dayBefore: { volume: 0.2, intensity: 0.3, type: "light" },
        gameDay: { volume: 0, intensity: 0, type: "rest" },
        dayAfter: { volume: 0.3, intensity: 0.4, type: "recovery" },
      },
    };
  }

  /**
   * Calculate taper parameters based on event importance
   * Returns taper duration and volume reduction targets
   */
  calculateTaperParameters(
    eventImportance,
    daysUntilEvent,
    hasOverloadPeriod = false,
  ) {
    const config = this.taperConfig;
    const importanceConfig =
      config.targetVolumeReduction[eventImportance] ||
      config.targetVolumeReduction.medium;
    const durationConfig =
      config.taperDuration[eventImportance] || config.taperDuration.medium;

    // Determine if we're in taper window
    const maxTaperDays = durationConfig.max;
    const minTaperDays = durationConfig.min;

    if (daysUntilEvent > maxTaperDays) {
      return null; // Not in taper window yet
    }

    // Calculate volume reduction based on days until event
    let volumeReduction;
    if (hasOverloadPeriod && eventImportance === EVENT_IMPORTANCE.MAJOR) {
      // Post-overload taper: 60-90% reduction
      const reductionRange = config.postOverloadTaper.volumeReduction;
      const progress = 1 - daysUntilEvent / maxTaperDays; // 0 to 1 as we approach event
      volumeReduction =
        reductionRange.min +
        (reductionRange.max - reductionRange.min) * progress;
    } else {
      // Standard taper: use importance-based range
      const progress = 1 - daysUntilEvent / maxTaperDays;
      volumeReduction =
        importanceConfig.min +
        (importanceConfig.max - importanceConfig.min) * progress;
    }

    // Calculate intensity (maintain floor: 80-90% of normal)
    const intensityFloor =
      config.minIntensityFloor +
      (config.maxIntensityFloor - config.minIntensityFloor) *
        (1 - daysUntilEvent / maxTaperDays);

    return {
      volumeMultiplier: 1 - volumeReduction, // Convert reduction to multiplier
      intensityMultiplier: Math.max(intensityFloor, config.minIntensityFloor),
      taperDuration: Math.min(daysUntilEvent, maxTaperDays),
      eventImportance,
      rationale: `Evidence-based taper: ${eventImportance} event, ${Math.round(volumeReduction * 100)}% volume reduction, ${Math.round(intensityFloor * 100)}% intensity floor`,
    };
  }

  /**
   * Post-event recovery phase (back-to-back peak logic)
   * Initial short recovery: very low volume, moderate intensity
   * Based on research: recovery phase before secondary peak
   */
  calculatePostEventRecovery(daysSinceEvent, nextEventImportance = null) {
    const recoveryPhases = {
      "0-1": {
        volume: 0,
        intensity: 0,
        type: "complete_rest",
        rationale: "Immediate post-event recovery - complete rest",
      },
      "2-3": {
        volume: 0.1,
        intensity: 0.5, // Moderate intensity (research: maintain intensity during recovery)
        type: "mobility_only",
        rationale: "Post-event recovery: very low volume, moderate intensity",
      },
      "4-5": {
        volume: 0.2,
        intensity: 0.6,
        type: "light_activation",
        rationale: "Post-event recovery: light activation phase",
      },
      "6-7": {
        volume: 0.3,
        intensity: 0.7,
        type: "return_to_training",
        rationale: "Post-event recovery: returning to training",
      },
    };

    // Determine phase
    let phase;
    if (daysSinceEvent <= 1) phase = recoveryPhases["0-1"];
    else if (daysSinceEvent <= 3) phase = recoveryPhases["2-3"];
    else if (daysSinceEvent <= 5) phase = recoveryPhases["4-5"];
    else if (daysSinceEvent <= 7) phase = recoveryPhases["6-7"];
    else phase = null; // Recovery phase complete

    return phase;
  }

  /**
   * Secondary-peak microcycle (back-to-back peak logic)
   * Mini-overload and mini-taper into second event
   * Used when two major events are close together (e.g., World Championship → Elite 8)
   */
  calculateSecondaryPeakMicrocycle(
    daysSinceFirstEvent,
    daysUntilSecondEvent,
    secondEventImportance,
  ) {
    // Typical pattern: World Championship (end Aug) → Elite 8 (mid Sep)
    // Recovery (days 0-7) → Mini-overload (days 8-14) → Mini-taper (days 15-21)

    if (daysSinceFirstEvent <= 7) {
      // Still in recovery phase
      return this.calculatePostEventRecovery(daysSinceFirstEvent);
    }

    if (daysSinceFirstEvent <= 14 && daysUntilSecondEvent > 7) {
      // Mini-overload phase: slight volume increase, moderate intensity
      return {
        volume: 0.9, // 90% of normal (slight overload)
        intensity: 0.85, // 85% intensity
        type: "mini_overload",
        rationale:
          "Secondary-peak microcycle: mini-overload phase (research: rebuild before second peak)",
      };
    }

    if (daysUntilSecondEvent <= 7 && daysUntilSecondEvent > 0) {
      // Mini-taper into second event
      const taperParams = this.calculateTaperParameters(
        secondEventImportance,
        daysUntilSecondEvent,
        false, // Not post-overload taper
      );

      if (taperParams) {
        return {
          volume: taperParams.volumeMultiplier,
          intensity: taperParams.intensityMultiplier,
          type: "mini_taper",
          rationale: `Secondary-peak microcycle: mini-taper into ${secondEventImportance} event`,
        };
      }
    }

    return null;
  }

  /**
   * Generate personalized training schedule for a player
   * @param {Object} playerProfile - Player's schedule and preferences
   * @param {Date} startDate - Start date for schedule generation
   * @param {Date} endDate - End date for schedule generation
   * @returns {Object} Complete training schedule with periodization
   */
  generatePersonalizedSchedule(playerProfile, startDate, endDate) {
    const schedule = {
      playerId: playerProfile.id,
      playerName: playerProfile.name,
      startDate,
      endDate,
      weeks: [],
      adjustments: [],
      summary: {},
    };

    // Get all relevant dates
    const allDates = this.getAllRelevantDates(
      playerProfile,
      startDate,
      endDate,
    );

    // Group by weeks
    const weeks = this.groupDatesByWeek(allDates, startDate, endDate);

    // Generate schedule for each week
    weeks.forEach((week, weekIndex) => {
      const weekSchedule = this.generateWeekSchedule(
        week,
        weekIndex,
        playerProfile,
        allDates,
      );
      schedule.weeks.push(weekSchedule);
    });

    // Calculate summary statistics
    schedule.summary = this.calculateScheduleSummary(
      schedule.weeks,
      playerProfile,
    );

    return schedule;
  }

  /**
   * Get all relevant dates (tournaments, practices, games, league games)
   */
  getAllRelevantDates(playerProfile, startDate, endDate) {
    const dates = {
      tournaments: [],
      practices: [],
      games: [],
      leagueGames: [],
    };

    // Tournament dates
    dates.tournaments = this.tournamentDates.filter(
      (t) => t.startDate >= startDate && t.startDate <= endDate,
    );

    // Player practice schedule
    if (playerProfile.practices) {
      dates.practices = playerProfile.practices
        .filter((p) => {
          const practiceDate = new Date(p.date);
          return practiceDate >= startDate && practiceDate <= endDate;
        })
        .map((p) => ({
          date: new Date(p.date),
          type: p.type || "flag_practice",
          duration: p.duration || 120,
          intensity: p.intensity || "medium",
        }));
    }

    // Player game schedule
    if (playerProfile.games) {
      dates.games = playerProfile.games
        .filter((g) => {
          const gameDate = new Date(g.date);
          return gameDate >= startDate && gameDate <= endDate;
        })
        .map((g) => ({
          date: new Date(g.date),
          type: g.type || "game",
          opponent: g.opponent,
          location: g.location,
        }));
    }

    // League games (Austrian league, Slovenian league, etc.)
    if (playerProfile.leagueGames) {
      dates.leagueGames = playerProfile.leagueGames
        .filter((lg) => {
          const gameDate = new Date(lg.date);
          return gameDate >= startDate && gameDate <= endDate;
        })
        .map((lg) => ({
          date: new Date(lg.date),
          league: lg.league,
          opponent: lg.opponent,
          location: lg.location,
          gameDay: lg.gameDay || 1, // 1 = single game day, 2 = tournament format
          maxGames: lg.maxGames || 3,
        }));
    }

    return dates;
  }

  /**
   * Group dates by week
   */
  groupDatesByWeek(allDates, startDate, endDate) {
    const weeks = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const weekStart = new Date(currentDate);
      const weekEnd = new Date(currentDate);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const week = {
        startDate: new Date(weekStart),
        endDate: new Date(weekEnd),
        dates: {
          tournaments: allDates.tournaments.filter(
            (t) => t.startDate >= weekStart && t.startDate <= weekEnd,
          ),
          practices: allDates.practices.filter(
            (p) => p.date >= weekStart && p.date <= weekEnd,
          ),
          games: allDates.games.filter(
            (g) => g.date >= weekStart && g.date <= weekEnd,
          ),
          leagueGames: allDates.leagueGames.filter(
            (lg) => lg.date >= weekStart && lg.date <= weekEnd,
          ),
        },
      };

      weeks.push(week);
      currentDate.setDate(currentDate.getDate() + 7);
    }

    return weeks;
  }

  /**
   * Generate schedule for a specific week
   */
  generateWeekSchedule(week, weekIndex, playerProfile, allDates) {
    const weekSchedule = {
      weekNumber: weekIndex + 1,
      startDate: week.startDate,
      endDate: week.endDate,
      phase: this.determinePhase(week.startDate),
      days: [],
      adjustments: [],
      summary: {},
    };

    // Determine periodization for this week
    const periodization = this.determinePeriodization(week, allDates);

    // Generate each day of the week
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(week.startDate);
      dayDate.setDate(week.startDate.getDate() + i);

      const daySchedule = this.generateDaySchedule(
        dayDate,
        week,
        periodization,
        playerProfile,
        allDates,
      );

      weekSchedule.days.push(daySchedule);
    }

    // Calculate week summary
    weekSchedule.summary = this.calculateWeekSummary(weekSchedule);

    return weekSchedule;
  }

  /**
   * Determine training phase based on date
   */
  determinePhase(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 1-12
    const day = date.getDate();

    // December (12) - Foundation
    if (month === 12) {
      return "foundation";
    }

    // January (1) - Power Development
    if (month === 1) {
      return "power_development";
    }

    // February (2) - Competition Preparation
    if (month === 2) {
      return "competition_preparation";
    }

    // March (3) - Explosive Phase
    if (month === 3) {
      return "explosive_phase";
    }

    // April-June (4-6) - Tournament Maintenance
    if (month >= 4 && month <= 6) {
      return "tournament_maintenance";
    }

    // July (7) - Off-Season Conditioning
    if (month === 7) {
      return "off_season_conditioning";
    }

    // August (8) - World Championship Prep
    if (month === 8) {
      return "world_championship_prep";
    }

    // September (9) - Peak for Elite 8
    if (month === 9) {
      return "peak_elite_8";
    }

    // October (10) - Transition
    if (month === 10) {
      return "transition";
    }

    // November (11) - Rest
    return "rest";
  }

  /**
   * Determine periodization adjustments for this week
   * Enhanced with evidence-based taper parameters and back-to-back peak logic
   */
  determinePeriodization(week, allDates) {
    const adjustments = {
      volume: 1.0,
      intensity: 1.0,
      type: "normal",
      reasons: [],
      rationale: null, // Evidence-based rationale
    };

    // Check for upcoming tournaments with event importance
    const upcomingTournaments = allDates.tournaments.filter((t) => {
      const daysUntil = Math.floor(
        (t.startDate - week.startDate) / (1000 * 60 * 60 * 24),
      );
      const maxTaperDays =
        this.taperConfig.taperDuration[
          t.eventImportance || EVENT_IMPORTANCE.MEDIUM
        ]?.max || 14;
      return daysUntil >= 0 && daysUntil <= maxTaperDays;
    });

    if (upcomingTournaments.length > 0) {
      const nearestTournament = upcomingTournaments[0];
      const daysUntil = Math.floor(
        (nearestTournament.startDate - week.startDate) / (1000 * 60 * 60 * 24),
      );
      const eventImportance =
        nearestTournament.eventImportance || EVENT_IMPORTANCE.MEDIUM;

      // Check if we had an overload period (2-4 weeks before major events)
      const overloadStart = new Date(nearestTournament.startDate);
      overloadStart.setDate(
        overloadStart.getDate() - this.taperConfig.overloadPeriod.duration.max,
      );
      const hasOverloadPeriod =
        eventImportance === EVENT_IMPORTANCE.MAJOR &&
        week.startDate >= overloadStart;

      // Calculate evidence-based taper parameters
      const taperParams = this.calculateTaperParameters(
        eventImportance,
        daysUntil,
        hasOverloadPeriod,
      );

      if (daysUntil <= 2) {
        // Tournament days
        adjustments.volume = 0;
        adjustments.intensity = 0;
        adjustments.type = "rest";
        adjustments.reasons.push(
          `Tournament: ${nearestTournament.name} (${daysUntil} days)`,
        );
        adjustments.rationale = "Tournament competition days - complete rest";
      } else if (taperParams) {
        // Apply evidence-based taper
        adjustments.volume = taperParams.volumeMultiplier;
        adjustments.intensity = taperParams.intensityMultiplier;
        adjustments.type =
          taperParams.taperDuration <= 7 ? "taper" : "pre_taper";
        adjustments.reasons.push(
          `Tapering for ${nearestTournament.name} (${eventImportance} event)`,
        );
        adjustments.rationale = taperParams.rationale;
      }
    }

    // Check for recent tournaments (back-to-back peak logic)
    const recentTournaments = allDates.tournaments.filter((t) => {
      const daysSince = Math.floor(
        (week.startDate - t.endDate) / (1000 * 60 * 60 * 24),
      );
      return daysSince >= 0 && daysSince <= 14; // Extended to 14 days for back-to-back logic
    });

    // Check for upcoming second event (back-to-back peak scenario)
    const upcomingSecondEvent = allDates.tournaments.find((t) => {
      const daysUntil = Math.floor(
        (t.startDate - week.startDate) / (1000 * 60 * 60 * 24),
      );
      return daysUntil > 0 && daysUntil <= 21; // Within 3 weeks
    });

    if (recentTournaments.length > 0 && upcomingSecondEvent) {
      // Back-to-back peak scenario: use secondary-peak microcycle logic
      const recentTournament = recentTournaments[0];
      const daysSince = Math.floor(
        (week.startDate - recentTournament.endDate) / (1000 * 60 * 60 * 24),
      );
      const daysUntil = Math.floor(
        (upcomingSecondEvent.startDate - week.startDate) /
          (1000 * 60 * 60 * 24),
      );

      const secondaryPeak = this.calculateSecondaryPeakMicrocycle(
        daysSince,
        daysUntil,
        upcomingSecondEvent.eventImportance || EVENT_IMPORTANCE.MEDIUM,
      );

      if (secondaryPeak) {
        adjustments.volume = secondaryPeak.volume;
        adjustments.intensity = secondaryPeak.intensity;
        adjustments.type = secondaryPeak.type;
        adjustments.reasons.push(
          `Back-to-back peak: ${recentTournament.name} → ${upcomingSecondEvent.name}`,
        );
        adjustments.rationale = secondaryPeak.rationale;
      }
    } else if (recentTournaments.length > 0) {
      // Standard post-event recovery
      const recentTournament = recentTournaments[0];
      const daysSince = Math.floor(
        (week.startDate - recentTournament.endDate) / (1000 * 60 * 60 * 24),
      );

      const recovery = this.calculatePostEventRecovery(daysSince);
      if (recovery) {
        adjustments.volume = recovery.volume;
        adjustments.intensity = recovery.intensity;
        adjustments.type = recovery.type;
        adjustments.reasons.push(
          `Post-tournament recovery: ${recentTournament.name}`,
        );
        adjustments.rationale = recovery.rationale;
      }
    }

    // Check for upcoming league games (minor events: 3-5 day taper)
    const upcomingLeagueGames = allDates.leagueGames.filter((lg) => {
      const daysUntil = Math.floor(
        (lg.date - week.startDate) / (1000 * 60 * 60 * 24),
      );
      return daysUntil >= 0 && daysUntil <= 5; // Minor event taper window
    });

    if (upcomingLeagueGames.length > 0 && !upcomingTournaments.length) {
      // Only apply league game taper if no tournament taper is active
      const nearestGame = upcomingLeagueGames[0];
      const daysUntil = Math.floor(
        (nearestGame.date - week.startDate) / (1000 * 60 * 60 * 24),
      );

      const leagueTaperParams = this.calculateTaperParameters(
        EVENT_IMPORTANCE.MINOR,
        daysUntil,
        false,
      );

      if (leagueTaperParams) {
        adjustments.volume = leagueTaperParams.volumeMultiplier;
        adjustments.intensity = leagueTaperParams.intensityMultiplier;
        adjustments.type = "league_taper";
        adjustments.reasons.push(
          `League game taper: ${nearestGame.league} (${daysUntil} days)`,
        );
        adjustments.rationale = leagueTaperParams.rationale;
      }
    }

    // Check practice frequency
    const practiceCount = week.dates.practices.length;
    if (practiceCount >= 3) {
      adjustments.volume *= 0.6;
      adjustments.reasons.push(
        `High practice frequency (${practiceCount}x/week)`,
      );
    } else if (practiceCount === 2) {
      adjustments.volume *= 0.8;
      adjustments.reasons.push(
        `Moderate practice frequency (${practiceCount}x/week)`,
      );
    }

    return adjustments;
  }

  /**
   * Generate schedule for a specific day
   */
  generateDaySchedule(dayDate, week, periodization, playerProfile, allDates) {
    const daySchedule = {
      date: new Date(dayDate),
      dayOfWeek: dayDate.getDay(),
      dayName: this.getDayName(dayDate.getDay()),
      activities: [],
      training: null,
      adjustments: [],
    };

    // Check for tournament
    const tournament = week.dates.tournaments.find(
      (t) => dayDate >= t.startDate && dayDate <= t.endDate,
    );

    if (tournament) {
      daySchedule.activities.push({
        type: "tournament",
        name: tournament.name,
        location: tournament.location,
        priority: tournament.priority,
      });
      daySchedule.training = {
        type: "rest",
        title: `Tournament: ${tournament.name}`,
        volume: 0,
        intensity: 0,
        reason: "Tournament day",
      };
      return daySchedule;
    }

    // Check for league game
    const leagueGame = week.dates.leagueGames.find((lg) => {
      const gameDate = new Date(lg.date);
      return gameDate.toDateString() === dayDate.toDateString();
    });

    if (leagueGame) {
      daySchedule.activities.push({
        type: "league_game",
        league: leagueGame.league,
        opponent: leagueGame.opponent,
        location: leagueGame.location,
        gameDay: leagueGame.gameDay,
        maxGames: leagueGame.maxGames,
      });
      daySchedule.training = {
        type: "rest",
        title: `${leagueGame.league} Game`,
        volume: 0,
        intensity: 0,
        reason: "League game day",
      };
      return daySchedule;
    }

    // Check for practice
    const practice = week.dates.practices.find((p) => {
      const practiceDate = new Date(p.date);
      return practiceDate.toDateString() === dayDate.toDateString();
    });

    if (practice) {
      daySchedule.activities.push({
        type: practice.type,
        duration: practice.duration,
        intensity: practice.intensity,
      });

      // Adjust training based on practice
      const practiceAdjustment =
        this.periodizationRules.practiceDay[practice.type] ||
        this.periodizationRules.practiceDay.flagPractice;

      daySchedule.training = this.generateTrainingSession(
        dayDate,
        periodization,
        practiceAdjustment,
        playerProfile,
      );
      daySchedule.adjustments.push({
        reason: `${practice.type} practice`,
        adjustment: practiceAdjustment,
      });
    } else {
      // Regular training day
      daySchedule.training = this.generateTrainingSession(
        dayDate,
        periodization,
        { volume: 1.0, intensity: 1.0, type: "normal" },
        playerProfile,
      );
    }

    // Apply periodization adjustments
    if (periodization.volume !== 1.0 || periodization.intensity !== 1.0) {
      daySchedule.training.volume *= periodization.volume;
      daySchedule.training.intensity *= periodization.intensity;
      daySchedule.adjustments.push({
        reason: periodization.reasons.join(", "),
        adjustment: periodization,
      });
    }

    return daySchedule;
  }

  /**
   * Generate training session based on phase and adjustments
   */
  generateTrainingSession(
    dayDate,
    periodization,
    practiceAdjustment,
    playerProfile,
  ) {
    const phase = this.determinePhase(dayDate);
    const dayOfWeek = dayDate.getDay();

    // Get base training from annual program
    const baseTraining = this.getBaseTrainingForPhase(phase, dayOfWeek);

    // Apply adjustments
    const adjustedTraining = {
      ...baseTraining,
      volume:
        baseTraining.volume * periodization.volume * practiceAdjustment.volume,
      intensity:
        baseTraining.intensity *
        periodization.intensity *
        practiceAdjustment.intensity,
      type: practiceAdjustment.type || baseTraining.type,
    };

    return adjustedTraining;
  }

  /**
   * Get base training for phase and day
   */
  getBaseTrainingForPhase(phase, dayOfWeek) {
    // Map phases to annual program months
    const monthMap = {
      foundation: "december",
      power_development: "january",
      competition_preparation: "february",
      explosive_phase: "march",
      tournament_maintenance: "april-june",
      off_season_conditioning: "july",
      world_championship_prep: "august",
      peak_elite_8: "september",
      transition: "october",
    };

    const monthKey = monthMap[phase] || "december";
    const monthData = ANNUAL_TRAINING_PROGRAM.months[monthKey];

    if (!monthData) {
      return {
        type: "strength",
        title: "Training Session",
        volume: 1.0,
        intensity: 0.7,
        duration: 60,
      };
    }

    // Map day of week to training type
    const dayMap = {
      0: "recovery", // Sunday
      1: "strength", // Monday
      2: "sprint", // Tuesday
      3: "power", // Wednesday
      4: "explosive_hamstrings", // Thursday
      5: "light", // Friday
      6: "sprint_capacity", // Saturday
    };

    const trainingType = dayMap[dayOfWeek] || "strength";

    return {
      type: trainingType,
      title: this.getTrainingTitle(trainingType, phase),
      volume: 1.0,
      intensity: 0.7,
      duration: 60,
      exercises: this.getExercisesForType(trainingType, phase),
    };
  }

  /**
   * Get training title
   */
  getTrainingTitle(trainingType, phase) {
    const titles = {
      recovery: "Recovery Session",
      strength: "Strength Training",
      sprint: "Sprint & Movement Drills",
      power: "Power Development",
      explosive_hamstrings: "Explosive Hamstring Circuit",
      light: "Light Activation",
      sprint_capacity: "Sprint Capacity Work",
    };

    return titles[trainingType] || "Training Session";
  }

  /**
   * Get exercises for training type
   */
  getExercisesForType(trainingType, phase) {
    // This would reference the exercise library
    // For now, return basic structure
    return [];
  }

  /**
   * Calculate week summary
   */
  calculateWeekSummary(weekSchedule) {
    const trainingDays = weekSchedule.days.filter(
      (d) => d.training && d.training.volume > 0,
    );
    const restDays = weekSchedule.days.filter(
      (d) => !d.training || d.training.volume === 0,
    );
    const practiceDays = weekSchedule.days.filter((d) =>
      d.activities.some((a) => a.type.includes("practice")),
    );

    return {
      trainingDays: trainingDays.length,
      restDays: restDays.length,
      practiceDays: practiceDays.length,
      averageVolume:
        trainingDays.length > 0
          ? trainingDays.reduce((sum, d) => sum + d.training.volume, 0) /
            trainingDays.length
          : 0,
      averageIntensity:
        trainingDays.length > 0
          ? trainingDays.reduce((sum, d) => sum + d.training.intensity, 0) /
            trainingDays.length
          : 0,
    };
  }

  /**
   * Calculate overall schedule summary
   */
  calculateScheduleSummary(weeks, playerProfile) {
    const totalWeeks = weeks.length;
    const totalTrainingDays = weeks.reduce(
      (sum, w) => sum + w.summary.trainingDays,
      0,
    );
    const totalRestDays = weeks.reduce((sum, w) => sum + w.summary.restDays, 0);
    const totalPracticeDays = weeks.reduce(
      (sum, w) => sum + w.summary.practiceDays,
      0,
    );

    return {
      totalWeeks,
      totalTrainingDays,
      totalRestDays,
      totalPracticeDays,
      averageWeeklyTrainingDays: totalTrainingDays / totalWeeks,
      averageWeeklyRestDays: totalRestDays / totalWeeks,
    };
  }

  /**
   * Get day name
   */
  getDayName(dayOfWeek) {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[dayOfWeek];
  }

  /**
   * Export schedule to various formats
   */
  exportSchedule(schedule, format = "json") {
    switch (format) {
      case "json":
        return JSON.stringify(schedule, null, 2);
      case "csv":
        return this.exportToCSV(schedule);
      case "ical":
        return this.exportToICal(schedule);
      default:
        return JSON.stringify(schedule, null, 2);
    }
  }

  /**
   * Export to CSV
   */
  exportToCSV(schedule) {
    const rows = ["Date,Day,Training Type,Title,Volume,Intensity,Activities"];

    schedule.weeks.forEach((week) => {
      week.days.forEach((day) => {
        const dateStr = day.date.toISOString().split("T")[0];
        const trainingType = day.training?.type || "rest";
        const title = day.training?.title || "Rest Day";
        const volume = day.training?.volume || 0;
        const intensity = day.training?.intensity || 0;
        const activities = day.activities.map((a) => a.type).join("; ");

        rows.push(
          `${dateStr},${day.dayName},${trainingType},${title},${volume},${intensity},"${activities}"`,
        );
      });
    });

    return rows.join("\n");
  }

  /**
   * Export to iCal format
   */
  exportToICal(schedule) {
    // Basic iCal implementation
    let ical =
      "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Training Scheduler//EN\n";

    schedule.weeks.forEach((week) => {
      week.days.forEach((day) => {
        if (day.training && day.training.volume > 0) {
          const dateStr =
            day.date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
          ical += `BEGIN:VEVENT\n`;
          ical += `DTSTART:${dateStr}\n`;
          ical += `SUMMARY:${day.training.title}\n`;
          ical += `DESCRIPTION:Volume: ${day.training.volume}, Intensity: ${day.training.intensity}\n`;
          ical += `END:VEVENT\n`;
        }
      });
    });

    ical += "END:VCALENDAR\n";
    return ical;
  }
}

// Export singleton instance
export const aiTrainingScheduler = new AITrainingScheduler();

// Export EVENT_IMPORTANCE for use in other modules
export { EVENT_IMPORTANCE };
