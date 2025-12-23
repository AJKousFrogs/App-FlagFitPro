/**
 * Schedule Service
 * Generates weekly training schedules based on settings and workout templates
 */

import { workoutService } from "./workoutService.js";

class ScheduleService {
  /**
   * Generate a weekly schedule
   * @param {Object} options - Schedule generation options
   * @param {Date} options.today - Reference date (defaults to now)
   * @param {Object} options.scheduleSettings - User's schedule settings
   * @param {Array} options.recentWorkouts - Array of completed workout sessions
   * @returns {Array} Array of 7 day objects
   */
  generateWeekSchedule({
    today = new Date(),
    scheduleSettings,
    recentWorkouts = [],
  }) {
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start from Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const weekSchedule = [];

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + i);
      const dayOfWeek = dayDate.getDay();
      const dayName = daysOfWeek[dayOfWeek];
      const isToday = dayDate.toDateString() === today.toDateString();
      const isGameDay = this.isGameDay(dayOfWeek, dayDate, scheduleSettings);

      // Check if workout completed this day
      const dayWorkouts = recentWorkouts.filter((w) => {
        const workoutDate = new Date(w.date);
        workoutDate.setHours(0, 0, 0, 0);
        const compareDate = new Date(dayDate);
        compareDate.setHours(0, 0, 0, 0);
        return workoutDate.getTime() === compareDate.getTime();
      });
      const isCompleted = dayWorkouts.length > 0;

      // Determine workout for this day
      const plannedWorkout = this.getPlannedWorkoutForDay(
        dayOfWeek,
        dayDate,
        isGameDay,
        scheduleSettings,
      );

      weekSchedule.push({
        date: dayDate,
        dayOfWeek,
        dayName,
        isToday,
        isGameDay,
        isCompleted,
        completedSessions: dayWorkouts,
        plannedWorkout,
      });
    }

    return weekSchedule;
  }

  /**
   * Check if a day is a game day
   * @param {number} dayOfWeek - Day of week (0-6, 0=Sunday)
   * @param {Date} date - The specific date to check
   * @param {Object} scheduleSettings - User's schedule settings
   * @returns {boolean} True if game day
   */
  isGameDay(dayOfWeek, date, scheduleSettings) {
    if (!scheduleSettings) {return false;}

    // Check for specific dates (from calendar or uploaded schedule)
    if (scheduleSettings.gameDays && Array.isArray(scheduleSettings.gameDays)) {
      const dateStr = date.toISOString().split("T")[0];
      
      // Check if this specific date is a game day
      const isSpecificDate = scheduleSettings.gameDays.some(
        (gd) => gd.date === dateStr
      );
      if (isSpecificDate) {return true;}

      // Check if this day of week matches recurring game days
      const isRecurringDay = scheduleSettings.gameDays.some(
        (gd) => gd.dayOfWeek === dayOfWeek && !gd.date
      );
      if (isRecurringDay) {return true;}
    }

    // Legacy: single recurring day
    if (scheduleSettings.gameDay) {
      return (
        (scheduleSettings.gameDay === "saturday" && dayOfWeek === 6) ||
        (scheduleSettings.gameDay === "sunday" && dayOfWeek === 0)
      );
    }

    return false;
  }

  /**
   * Check if a date is within X days before a game day
   * @param {Date} date - Date to check
   * @param {number} daysBefore - Number of days before game
   * @param {Object} scheduleSettings - User's schedule settings
   * @returns {boolean} True if within daysBefore of a game
   */
  isDaysBeforeGame(date, daysBefore, scheduleSettings) {
    if (!scheduleSettings?.gameDays) {return false;}

    for (let i = 1; i <= daysBefore; i++) {
      const checkDate = new Date(date);
      checkDate.setDate(checkDate.getDate() + i);
      const checkDayOfWeek = checkDate.getDay();
      const dateStr = checkDate.toISOString().split("T")[0];

      // Check if this future date is a game day
      if (scheduleSettings.gameDays.some(
        (gd) => gd.date === dateStr || (gd.dayOfWeek === checkDayOfWeek && !gd.date)
      )) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get planned workout for a specific day with AI training adjustments
   * @param {number} dayOfWeek - Day of week (0-6)
   * @param {Date} date - The specific date
   * @param {boolean} isGameDay - Whether this is a game day
   * @param {Object} scheduleSettings - User's schedule settings
   * @returns {Object} Planned workout object
   */
  getPlannedWorkoutForDay(dayOfWeek, date, isGameDay, scheduleSettings) {
    let workoutType = null;
    let workoutTitle = null;
    let workoutMeta = null;
    let workoutClass = "";
    let isSkipped = false;
    let adjustmentReason = null;

    // AI Training Adjustment Logic
    // Check if there's a game tomorrow (next day)
    const tomorrow = new Date(date);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const hasGameTomorrow = this.isGameDay(tomorrow.getDay(), tomorrow, scheduleSettings);
    
    // Check if there's a game on Saturday (this week)
    const saturday = new Date(date);
    const daysUntilSaturday = (6 - dayOfWeek + 7) % 7;
    saturday.setDate(saturday.getDate() + (daysUntilSaturday === 0 ? 7 : daysUntilSaturday));
    const hasGameSaturday = this.isGameDay(6, saturday, scheduleSettings);
    
    // Check if there's a game on Sunday (this week)
    const sunday = new Date(date);
    const daysUntilSunday = (0 - dayOfWeek + 7) % 7;
    sunday.setDate(sunday.getDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday));
    const hasGameSunday = this.isGameDay(0, sunday, scheduleSettings);
    
    // Check if game is within 1 day
    const isDayBeforeGame = this.isDaysBeforeGame(date, 1, scheduleSettings);

    if (isGameDay) {
      // Game day - recovery or rest
      isSkipped = true;
      workoutTitle = "Game Day - Rest & Recovery";
      workoutMeta = "⏱️ Rest day • Focus on game performance";
      workoutClass = "game-day";
      adjustmentReason = "Game day - training skipped";
    } else if (dayOfWeek === 6) {
      // Saturday - Sprint Session
      if (hasGameTomorrow) {
        // Game tomorrow (Sunday) - skip sprint on Saturday
        workoutType = "endurance";
        workoutTitle = "Light Recovery Session";
        workoutMeta = "⏱️ 30 min • 🔥 Low intensity • Game tomorrow";
        workoutClass = "recovery";
        adjustmentReason = "Game on Sunday - sprint training skipped on Saturday";
      } else {
        workoutType = "speed";
        workoutTitle = "Sprint Session";
        const template = workoutService.getWorkoutTemplate("speed");
        workoutMeta = `⏱️ ${template.duration} min • 🔥 High intensity`;
        workoutClass = "sprint-session";
      }
    } else if (dayOfWeek === 5) {
      // Friday - Speed Training
      if (hasGameTomorrow) {
        // Game tomorrow (Saturday) - skip sprint on Friday
        workoutType = "endurance";
        workoutTitle = "Light Recovery Session";
        workoutMeta = "⏱️ 30 min • 🔥 Low intensity • Game tomorrow";
        workoutClass = "recovery";
        adjustmentReason = "Game on Saturday - sprint training skipped on Friday";
      } else {
        workoutType = "speed";
        workoutTitle = "Speed Training";
        const template = workoutService.getWorkoutTemplate("speed");
        workoutMeta = `⏱️ ${template.duration} min • 🔥 High intensity`;
      }
    } else if (dayOfWeek === 0) {
      // Sunday
      if (isGameDay) {
        // Game on Sunday - Recovery
        workoutType = "endurance";
        workoutTitle = "Recovery Session";
        workoutMeta = "⏱️ 30 min • 🔥 Low intensity";
        workoutClass = "recovery";
        adjustmentReason = "Game day recovery";
      } else {
        // Check if game was yesterday (Saturday)
        const yesterday = new Date(date);
        yesterday.setDate(yesterday.getDate() - 1);
        const hadGameYesterday = this.isGameDay(yesterday.getDay(), yesterday, scheduleSettings);
        
        if (hadGameYesterday) {
          // Game was yesterday (Saturday) - recovery today
          workoutType = "endurance";
          workoutTitle = "Recovery Session";
          workoutMeta = "⏱️ 30 min • 🔥 Low intensity • Post-game recovery";
          workoutClass = "recovery";
          adjustmentReason = "Post-game recovery - sprint training skipped";
        } else {
          // Regular Sunday - Endurance
          workoutType = "endurance";
          workoutTitle = "Endurance Training";
          const template = workoutService.getWorkoutTemplate("endurance");
          workoutMeta = `⏱️ ${template.duration} min • 🔥 Low intensity`;
        }
      }
    } else if (dayOfWeek === 1 || dayOfWeek === 3) {
      // Monday, Wednesday - Strength
      if (isDayBeforeGame) {
        // Lighten intensity before game
        workoutType = "strength";
        workoutTitle = "Light Strength Training";
        workoutMeta = "⏱️ 45 min • 🔥 Low-Medium intensity • Game approaching";
        workoutClass = "strength-light";
        adjustmentReason = "Reduced intensity before game day";
      } else {
        workoutType = "strength";
        workoutTitle = "Strength Training";
        const template = workoutService.getWorkoutTemplate("strength");
        workoutMeta = `⏱️ ${template.duration} min • 🔥 Medium intensity`;
      }
    } else if (dayOfWeek === 2 || dayOfWeek === 4) {
      // Tuesday, Thursday - Agility
      if (isDayBeforeGame) {
        // Lighten intensity before game
        workoutType = "agility";
        workoutTitle = "Light Agility Training";
        workoutMeta = "⏱️ 45 min • 🔥 Low-Medium intensity • Game approaching";
        workoutClass = "agility-light";
        adjustmentReason = "Reduced intensity before game day";
      } else {
        workoutType = "agility";
        workoutTitle = "Agility Training";
        const template = workoutService.getWorkoutTemplate("agility");
        workoutMeta = `⏱️ ${template.duration} min • 🔥 Medium intensity`;
      }
    }

    return {
      type: workoutType,
      title: workoutTitle,
      meta: workoutMeta,
      class: workoutClass,
      isSkipped,
      adjustmentReason,
    };
  }
}

// Export singleton instance
export const scheduleService = new ScheduleService();
