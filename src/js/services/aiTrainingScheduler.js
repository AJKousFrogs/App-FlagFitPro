/**
 * AI-Powered Training Scheduler
 * Intelligently adjusts training periodization based on:
 * - Tournament dates
 * - Player practice schedules
 * - Game schedules
 * - League commitments
 * - Recovery needs
 */

import { ANNUAL_TRAINING_PROGRAM } from "../../training-program-data.js";
import { getAllTournaments, getDaysUntilTournament } from "../../tournament-schedule.js";

class AITrainingScheduler {
  constructor() {
    this.tournamentDates = this.loadTournamentDates();
    this.periodizationRules = this.initializePeriodizationRules();
  }

  /**
   * Load official tournament dates
   */
  loadTournamentDates() {
    const tournaments = getAllTournaments();
    return tournaments
      .filter(t => t.startDate !== "TBD")
      .map(t => ({
        id: t.id,
        name: t.name,
        startDate: new Date(t.startDate),
        endDate: new Date(t.endDate),
        location: t.location,
        priority: this.getTournamentPriority(t),
      }))
      .sort((a, b) => a.startDate - b.startDate);
  }

  /**
   * Get tournament priority for periodization
   */
  getTournamentPriority(tournament) {
    const priorityMap = {
      "elite_8_2026": "peak", // Most important
      "capital_bowl_2026": "high",
      "big_bowl_2026": "high",
      "copenhagen_bowl_2026": "high",
      "adria_bowl_2026": "high",
    };
    return priorityMap[tournament.id] || "medium";
  }

  /**
   * Initialize periodization rules based on annual program
   */
  initializePeriodizationRules() {
    return {
      // Days before tournament - training adjustments
      taper: {
        "0-2": { volume: 0, intensity: 0, type: "rest" }, // Tournament days
        "3-4": { volume: 0.2, intensity: 0.3, type: "light_activation" },
        "5-7": { volume: 0.4, intensity: 0.5, type: "taper" },
        "8-14": { volume: 0.6, intensity: 0.7, type: "pre_taper" },
      },
      // Days after tournament - recovery
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
      // League game adjustments
      leagueGame: {
        dayBefore: { volume: 0.2, intensity: 0.3, type: "light" },
        gameDay: { volume: 0, intensity: 0, type: "rest" },
        dayAfter: { volume: 0.3, intensity: 0.4, type: "recovery" },
      },
    };
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
    const allDates = this.getAllRelevantDates(playerProfile, startDate, endDate);
    
    // Group by weeks
    const weeks = this.groupDatesByWeek(allDates, startDate, endDate);

    // Generate schedule for each week
    weeks.forEach((week, weekIndex) => {
      const weekSchedule = this.generateWeekSchedule(
        week,
        weekIndex,
        playerProfile,
        allDates
      );
      schedule.weeks.push(weekSchedule);
    });

    // Calculate summary statistics
    schedule.summary = this.calculateScheduleSummary(schedule.weeks, playerProfile);

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
      t => t.startDate >= startDate && t.startDate <= endDate
    );

    // Player practice schedule
    if (playerProfile.practices) {
      dates.practices = playerProfile.practices
        .filter(p => {
          const practiceDate = new Date(p.date);
          return practiceDate >= startDate && practiceDate <= endDate;
        })
        .map(p => ({
          date: new Date(p.date),
          type: p.type || "flag_practice",
          duration: p.duration || 120,
          intensity: p.intensity || "medium",
        }));
    }

    // Player game schedule
    if (playerProfile.games) {
      dates.games = playerProfile.games
        .filter(g => {
          const gameDate = new Date(g.date);
          return gameDate >= startDate && gameDate <= endDate;
        })
        .map(g => ({
          date: new Date(g.date),
          type: g.type || "game",
          opponent: g.opponent,
          location: g.location,
        }));
    }

    // League games (Austrian league, Slovenian league, etc.)
    if (playerProfile.leagueGames) {
      dates.leagueGames = playerProfile.leagueGames
        .filter(lg => {
          const gameDate = new Date(lg.date);
          return gameDate >= startDate && gameDate <= endDate;
        })
        .map(lg => ({
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
            t => t.startDate >= weekStart && t.startDate <= weekEnd
          ),
          practices: allDates.practices.filter(
            p => p.date >= weekStart && p.date <= weekEnd
          ),
          games: allDates.games.filter(
            g => g.date >= weekStart && g.date <= weekEnd
          ),
          leagueGames: allDates.leagueGames.filter(
            lg => lg.date >= weekStart && lg.date <= weekEnd
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
        allDates
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
    if (month === 12) {return "foundation";}
    
    // January (1) - Power Development
    if (month === 1) {return "power_development";}
    
    // February (2) - Competition Preparation
    if (month === 2) {return "competition_preparation";}
    
    // March (3) - Explosive Phase
    if (month === 3) {return "explosive_phase";}
    
    // April-June (4-6) - Tournament Maintenance
    if (month >= 4 && month <= 6) {return "tournament_maintenance";}
    
    // July (7) - Off-Season Conditioning
    if (month === 7) {return "off_season_conditioning";}
    
    // August (8) - World Championship Prep
    if (month === 8) {return "world_championship_prep";}
    
    // September (9) - Peak for Elite 8
    if (month === 9) {return "peak_elite_8";}
    
    // October (10) - Transition
    if (month === 10) {return "transition";}
    
    // November (11) - Rest
    return "rest";
  }

  /**
   * Determine periodization adjustments for this week
   */
  determinePeriodization(week, allDates) {
    const adjustments = {
      volume: 1.0,
      intensity: 1.0,
      type: "normal",
      reasons: [],
    };

    // Check for upcoming tournaments
    const upcomingTournaments = allDates.tournaments.filter(
      t => {
        const daysUntil = Math.floor((t.startDate - week.startDate) / (1000 * 60 * 60 * 24));
        return daysUntil >= 0 && daysUntil <= 14;
      }
    );

    if (upcomingTournaments.length > 0) {
      const nearestTournament = upcomingTournaments[0];
      const daysUntil = Math.floor(
        (nearestTournament.startDate - week.startDate) / (1000 * 60 * 60 * 24)
      );

      if (daysUntil <= 2) {
        adjustments.volume = 0;
        adjustments.intensity = 0;
        adjustments.type = "rest";
        adjustments.reasons.push(`Tournament: ${nearestTournament.name} (${daysUntil} days)`);
      } else if (daysUntil <= 7) {
        adjustments.volume = 0.4;
        adjustments.intensity = 0.5;
        adjustments.type = "taper";
        adjustments.reasons.push(`Tapering for ${nearestTournament.name}`);
      } else if (daysUntil <= 14) {
        adjustments.volume = 0.6;
        adjustments.intensity = 0.7;
        adjustments.type = "pre_taper";
        adjustments.reasons.push(`Pre-taper for ${nearestTournament.name}`);
      }
    }

    // Check for recent tournaments (recovery)
    const recentTournaments = allDates.tournaments.filter(
      t => {
        const daysSince = Math.floor((week.startDate - t.endDate) / (1000 * 60 * 60 * 24));
        return daysSince >= 0 && daysSince <= 7;
      }
    );

    if (recentTournaments.length > 0) {
      const recentTournament = recentTournaments[0];
      const daysSince = Math.floor(
        (week.startDate - recentTournament.endDate) / (1000 * 60 * 60 * 24)
      );

      if (daysSince <= 1) {
        adjustments.volume = 0;
        adjustments.intensity = 0;
        adjustments.type = "complete_rest";
        adjustments.reasons.push(`Post-tournament recovery: ${recentTournament.name}`);
      } else if (daysSince <= 3) {
        adjustments.volume = 0.1;
        adjustments.intensity = 0.2;
        adjustments.type = "mobility_only";
        adjustments.reasons.push(`Post-tournament recovery: ${recentTournament.name}`);
      } else if (daysSince <= 7) {
        adjustments.volume = 0.5;
        adjustments.intensity = 0.6;
        adjustments.type = "return_to_training";
        adjustments.reasons.push(`Returning to training after ${recentTournament.name}`);
      }
    }

    // Check practice frequency
    const practiceCount = week.dates.practices.length;
    if (practiceCount >= 3) {
      adjustments.volume *= 0.6;
      adjustments.reasons.push(`High practice frequency (${practiceCount}x/week)`);
    } else if (practiceCount === 2) {
      adjustments.volume *= 0.8;
      adjustments.reasons.push(`Moderate practice frequency (${practiceCount}x/week)`);
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
      t => dayDate >= t.startDate && dayDate <= t.endDate
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
    const leagueGame = week.dates.leagueGames.find(
      lg => {
        const gameDate = new Date(lg.date);
        return gameDate.toDateString() === dayDate.toDateString();
      }
    );

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
    const practice = week.dates.practices.find(
      p => {
        const practiceDate = new Date(p.date);
        return practiceDate.toDateString() === dayDate.toDateString();
      }
    );

    if (practice) {
      daySchedule.activities.push({
        type: practice.type,
        duration: practice.duration,
        intensity: practice.intensity,
      });

      // Adjust training based on practice
      const practiceAdjustment = this.periodizationRules.practiceDay[practice.type] ||
        this.periodizationRules.practiceDay.flagPractice;

      daySchedule.training = this.generateTrainingSession(
        dayDate,
        periodization,
        practiceAdjustment,
        playerProfile
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
        playerProfile
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
  generateTrainingSession(dayDate, periodization, practiceAdjustment, playerProfile) {
    const phase = this.determinePhase(dayDate);
    const dayOfWeek = dayDate.getDay();
    
    // Get base training from annual program
    const baseTraining = this.getBaseTrainingForPhase(phase, dayOfWeek);

    // Apply adjustments
    const adjustedTraining = {
      ...baseTraining,
      volume: baseTraining.volume * periodization.volume * practiceAdjustment.volume,
      intensity: baseTraining.intensity * periodization.intensity * practiceAdjustment.intensity,
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
    const trainingDays = weekSchedule.days.filter(d => d.training && d.training.volume > 0);
    const restDays = weekSchedule.days.filter(d => !d.training || d.training.volume === 0);
    const practiceDays = weekSchedule.days.filter(d => 
      d.activities.some(a => a.type.includes("practice"))
    );

    return {
      trainingDays: trainingDays.length,
      restDays: restDays.length,
      practiceDays: practiceDays.length,
      averageVolume: trainingDays.length > 0
        ? trainingDays.reduce((sum, d) => sum + d.training.volume, 0) / trainingDays.length
        : 0,
      averageIntensity: trainingDays.length > 0
        ? trainingDays.reduce((sum, d) => sum + d.training.intensity, 0) / trainingDays.length
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
      0
    );
    const totalRestDays = weeks.reduce(
      (sum, w) => sum + w.summary.restDays,
      0
    );
    const totalPracticeDays = weeks.reduce(
      (sum, w) => sum + w.summary.practiceDays,
      0
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
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
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
    
    schedule.weeks.forEach(week => {
      week.days.forEach(day => {
        const dateStr = day.date.toISOString().split("T")[0];
        const trainingType = day.training?.type || "rest";
        const title = day.training?.title || "Rest Day";
        const volume = day.training?.volume || 0;
        const intensity = day.training?.intensity || 0;
        const activities = day.activities.map(a => a.type).join("; ");
        
        rows.push(
          `${dateStr},${day.dayName},${trainingType},${title},${volume},${intensity},"${activities}"`
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
    let ical = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Training Scheduler//EN\n";
    
    schedule.weeks.forEach(week => {
      week.days.forEach(day => {
        if (day.training && day.training.volume > 0) {
          const dateStr = day.date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
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

