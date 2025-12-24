import { logger } from '../logger.js';

/**
 * FlagFit Pro - Achievements Integration
 * Automatically checks achievements when users log activities
 */

(function () {
  "use strict";

  function initAchievementsIntegration() {
    // Wait for achievements service
    if (!window.achievementsService) {
      setTimeout(initAchievementsIntegration, 100);
      return;
    }

    logger.info("[Achievements Integration] Initializing...");

    // Listen for wellness submissions
    document.addEventListener("wellnessSubmitted", handleWellnessSubmitted);

    // Listen for training completions
    document.addEventListener("trainingCompleted", handleTrainingCompleted);

    logger.info("[Achievements Integration] Ready");
  }

  /**
   * Handle wellness check-in submission
   */
  function handleWellnessSubmitted(event) {
    const wellnessData = event.detail;

    // Get user data for achievement checking
    const userData = calculateUserData();

    // Check achievements
    const newAchievements =
      window.achievementsService.checkAchievements(userData);

    if (newAchievements.length > 0) {
      logger.info(
        `[Achievements] Unlocked ${newAchievements.length} new achievement(s)!`,
      );

      // Refresh widget if it exists
      if (
        window.renderAchievementsWidget &&
        document.getElementById("achievements-widget-container")
      ) {
        window.renderAchievementsWidget("achievements-widget-container");
      }
    }
  }

  /**
   * Handle training session completion
   */
  function handleTrainingCompleted(event) {
    const trainingData = event.detail;

    // Get user data
    const userData = calculateUserData();

    // Update training-specific data
    if (trainingData.startTime) {
      const hour = new Date(trainingData.startTime).getHours();
      if (hour < 8) {
        userData.morningWorkouts = (userData.morningWorkouts || 0) + 1;
      } else if (hour >= 18) {
        userData.eveningWorkouts = (userData.eveningWorkouts || 0) + 1;
      }
    }

    // Check achievements
    const newAchievements =
      window.achievementsService.checkAchievements(userData);

    if (newAchievements.length > 0) {
      logger.info(
        `[Achievements] Unlocked ${newAchievements.length} new achievement(s)!`,
      );

      // Refresh widget
      if (
        window.renderAchievementsWidget &&
        document.getElementById("achievements-widget-container")
      ) {
        window.renderAchievementsWidget("achievements-widget-container");
      }
    }
  }

  /**
   * Calculate user data for achievement checking
   */
  function calculateUserData() {
    const wellnessHistory = JSON.parse(
      localStorage.getItem("wellnessHistory") || "[]",
    );
    const trainingHistory = JSON.parse(
      localStorage.getItem("trainingHistory") || "[]",
    );

    return {
      // Wellness data
      wellnessCount: wellnessHistory.length,
      wellnessStreak: calculateWellnessStreak(wellnessHistory),
      consecutiveDaysGoodSleep:
        calculateConsecutiveDaysGoodSleep(wellnessHistory),
      consecutiveDaysHighRecovery:
        calculateConsecutiveDaysHighRecovery(wellnessHistory),
      hasPerfectWeek: checkPerfectWeek(wellnessHistory),

      // Training data
      totalTrainingSessions: trainingHistory.length,
      morningWorkouts: trainingHistory.filter((t) => {
        const hour = new Date(t.startTime || t.date).getHours();
        return hour < 8;
      }).length,
      eveningWorkouts: trainingHistory.filter((t) => {
        const hour = new Date(t.startTime || t.date).getHours();
        return hour >= 18;
      }).length,

      // Performance data (from localStorage or defaults)
      speedImprovement: parseFloat(
        localStorage.getItem("speedImprovement") || "0",
      ),
      agilityImprovement: parseFloat(
        localStorage.getItem("agilityImprovement") || "0",
      ),
      consecutiveDaysHighPerformance: parseInt(
        localStorage.getItem("consecutiveDaysHighPerformance") || "0",
      ),

      // Social data
      hasJoinedTeam: localStorage.getItem("hasJoinedTeam") === "true",
      teammatesHelped: parseInt(localStorage.getItem("teammatesHelped") || "0"),

      // Special flags
      hasComeback: localStorage.getItem("hasComeback") === "true",
    };
  }

  /**
   * Calculate wellness streak
   */
  function calculateWellnessStreak(history) {
    if (history.length === 0) {
      return 0;
    }

    const sorted = history.sort((a, b) => new Date(b.date) - new Date(a.date));
    let streak = 0;
    const today = new Date().toISOString().split("T")[0];
    const currentDate = new Date(today);

    for (const entry of sorted) {
      const entryDate = new Date(entry.date).toISOString().split("T")[0];
      const expectedDate = currentDate.toISOString().split("T")[0];

      if (entryDate === expectedDate) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Calculate consecutive days with good sleep (8+ hours)
   */
  function calculateConsecutiveDaysGoodSleep(history) {
    if (history.length === 0) {
      return 0;
    }

    const sorted = history.sort((a, b) => new Date(b.date) - new Date(a.date));
    let consecutive = 0;

    for (const entry of sorted) {
      if (entry.sleep >= 8) {
        consecutive++;
      } else {
        break;
      }
    }

    return consecutive;
  }

  /**
   * Calculate consecutive days with high recovery
   */
  function calculateConsecutiveDaysHighRecovery(history) {
    if (history.length === 0) {
      return 0;
    }

    const sorted = history.sort((a, b) => new Date(b.date) - new Date(a.date));
    let consecutive = 0;

    for (const entry of sorted) {
      // High recovery = energy >= 7 and stress <= 3
      if (entry.energy >= 7 && (entry.stress || 10) <= 3) {
        consecutive++;
      } else {
        break;
      }
    }

    return consecutive;
  }

  /**
   * Check for perfect week (7 days with 8+ sleep)
   */
  function checkPerfectWeek(history) {
    if (history.length < 7) {
      return false;
    }

    const sorted = history.sort((a, b) => new Date(b.date) - new Date(a.date));
    const lastWeek = sorted.slice(0, 7);

    return lastWeek.every((entry) => entry.sleep >= 8);
  }

  // Initialize
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAchievementsIntegration);
  } else {
    initAchievementsIntegration();
  }

  logger.info("[Achievements Integration] Script loaded");
})();
