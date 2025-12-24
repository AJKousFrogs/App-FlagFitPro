/**
 * FlagFit Pro - Achievements Service
 * Gamification system for tracking milestones and motivating users
 * 100% FREE - Uses localStorage
 */

import { storageService } from "./services/storage-service-unified.js";

import { logger } from '../logger.js';

class AchievementsService {
  constructor() {
    this.storageKey = "flagfit_achievements";
    this.historyKey = "flagfit_achievement_history";
    this.achievements = this.defineAchievements();
    this.loadUnlockedAchievements();
  }

  /**
   * Define all available achievements
   */
  defineAchievements() {
    return {
      // Wellness Achievements
      "wellness-first": {
        id: "wellness-first",
        name: "First Steps",
        description: "Log your first wellness check-in",
        icon: "🎯",
        category: "wellness",
        points: 10,
        condition: (data) => data.wellnessCount >= 1,
        unlocked: false,
      },
      "wellness-streak-3": {
        id: "wellness-streak-3",
        name: "Getting Started",
        description: "3-day wellness tracking streak",
        icon: "🔥",
        category: "wellness",
        points: 25,
        condition: (data) => data.wellnessStreak >= 3,
        unlocked: false,
      },
      "wellness-streak-7": {
        id: "wellness-streak-7",
        name: "Wellness Warrior",
        description: "7-day wellness tracking streak",
        icon: "🔥🔥",
        category: "wellness",
        points: 50,
        condition: (data) => data.wellnessStreak >= 7,
        unlocked: false,
      },
      "wellness-streak-30": {
        id: "wellness-streak-30",
        name: "Dedicated Athlete",
        description: "30-day wellness tracking streak",
        icon: "🔥🔥🔥",
        category: "wellness",
        points: 150,
        condition: (data) => data.wellnessStreak >= 30,
        unlocked: false,
      },
      "wellness-streak-100": {
        id: "wellness-streak-100",
        name: "Elite Commitment",
        description: "100-day wellness tracking streak",
        icon: "💎",
        category: "wellness",
        points: 500,
        condition: (data) => data.wellnessStreak >= 100,
        unlocked: false,
      },
      "sleep-master": {
        id: "sleep-master",
        name: "Sleep Master",
        description: "Maintain 8+ hours of sleep for 7 days",
        icon: "😴",
        category: "wellness",
        points: 75,
        condition: (data) => data.consecutiveDaysGoodSleep >= 7,
        unlocked: false,
      },
      "recovery-champ": {
        id: "recovery-champ",
        name: "Recovery Champion",
        description: "Maintain high recovery scores for 14 days",
        icon: "💪",
        category: "wellness",
        points: 100,
        condition: (data) => data.consecutiveDaysHighRecovery >= 14,
        unlocked: false,
      },

      // Training Achievements
      "training-first": {
        id: "training-first",
        name: "Training Begins",
        description: "Complete your first training session",
        icon: "🏃",
        category: "training",
        points: 10,
        condition: (data) => data.totalTrainingSessions >= 1,
        unlocked: false,
      },
      "training-10": {
        id: "training-10",
        name: "Getting Stronger",
        description: "Complete 10 training sessions",
        icon: "💪",
        category: "training",
        points: 50,
        condition: (data) => data.totalTrainingSessions >= 10,
        unlocked: false,
      },
      "training-50": {
        id: "training-50",
        name: "Half Century",
        description: "Complete 50 training sessions",
        icon: "🎖️",
        category: "training",
        points: 150,
        condition: (data) => data.totalTrainingSessions >= 50,
        unlocked: false,
      },
      "training-100": {
        id: "training-100",
        name: "Century Club",
        description: "Complete 100 training sessions",
        icon: "💯",
        category: "training",
        points: 300,
        condition: (data) => data.totalTrainingSessions >= 100,
        unlocked: false,
      },
      "early-bird": {
        id: "early-bird",
        name: "Early Bird",
        description: "Complete 10 morning workouts (before 8 AM)",
        icon: "🌅",
        category: "training",
        points: 75,
        condition: (data) => data.morningWorkouts >= 10,
        unlocked: false,
      },
      "night-owl": {
        id: "night-owl",
        name: "Night Owl",
        description: "Complete 10 evening workouts (after 6 PM)",
        icon: "🦉",
        category: "training",
        points: 75,
        condition: (data) => data.eveningWorkouts >= 10,
        unlocked: false,
      },

      // Performance Achievements
      "speed-demon": {
        id: "speed-demon",
        name: "Speed Demon",
        description: "Improve your 40-yard dash time by 0.5 seconds",
        icon: "⚡",
        category: "performance",
        points: 100,
        condition: (data) => data.speedImprovement >= 0.5,
        unlocked: false,
      },
      "agility-master": {
        id: "agility-master",
        name: "Agility Master",
        description: "Improve cone drill time by 1 second",
        icon: "🌀",
        category: "performance",
        points: 100,
        condition: (data) => data.agilityImprovement >= 1.0,
        unlocked: false,
      },
      "consistent-performer": {
        id: "consistent-performer",
        name: "Consistent Performer",
        description: "Maintain 80%+ performance score for 30 days",
        icon: "📊",
        category: "performance",
        points: 200,
        condition: (data) => data.consecutiveDaysHighPerformance >= 30,
        unlocked: false,
      },

      // Social Achievements
      "team-player": {
        id: "team-player",
        name: "Team Player",
        description: "Join a team",
        icon: "👥",
        category: "social",
        points: 25,
        condition: (data) => data.hasJoinedTeam === true,
        unlocked: false,
      },
      mentor: {
        id: "mentor",
        name: "Mentor",
        description: "Help 5 teammates with their training",
        icon: "🎓",
        category: "social",
        points: 150,
        condition: (data) => data.teammatesHelped >= 5,
        unlocked: false,
      },

      // Special Achievements
      "perfect-week": {
        id: "perfect-week",
        name: "Perfect Week",
        description: "Log wellness 7 days straight with 8+ sleep each day",
        icon: "⭐",
        category: "special",
        points: 200,
        condition: (data) => data.hasPerfectWeek === true,
        unlocked: false,
      },
      "comeback-kid": {
        id: "comeback-kid",
        name: "Comeback Kid",
        description: "Return to training after 7+ day break",
        icon: "🔄",
        category: "special",
        points: 50,
        condition: (data) => data.hasComeback === true,
        unlocked: false,
      },
    };
  }

  /**
   * Load unlocked achievements from localStorage
   */
  loadUnlockedAchievements() {
    try {
      const unlockedIds = storageService.get(this.storageKey, [], {
        usePrefix: false,
      });
      unlockedIds.forEach((id) => {
        if (this.achievements[id]) {
          this.achievements[id].unlocked = true;
        }
      });
    } catch (error) {
      logger.error("[Achievements] Error loading achievements:", error);
    }
  }

  /**
   * Save unlocked achievements to localStorage
   */
  saveUnlockedAchievements() {
    try {
      const unlockedIds = Object.keys(this.achievements).filter(
        (id) => this.achievements[id].unlocked,
      );

      storageService.set(this.storageKey, unlockedIds, { usePrefix: false });
    } catch (error) {
      logger.error("[Achievements] Error saving achievements:", error);
    }
  }

  /**
   * Check achievements against user data
   * Returns newly unlocked achievements
   */
  checkAchievements(userData) {
    const newlyUnlocked = [];

    Object.values(this.achievements).forEach((achievement) => {
      // Skip already unlocked
      if (achievement.unlocked) {
        return;
      }

      // Check condition
      if (achievement.condition(userData)) {
        achievement.unlocked = true;
        achievement.unlockedAt = new Date().toISOString();
        newlyUnlocked.push(achievement);

        // Save to history
        this.addToHistory(achievement);

        // Show notification if available
        if (
          window.notificationManager &&
          window.notificationManager.isEnabled()
        ) {
          window.notificationManager.notifyAchievement(achievement);
        }

        logger.info(`[Achievements] Unlocked: ${achievement.name}`);
      }
    });

    if (newlyUnlocked.length > 0) {
      this.saveUnlockedAchievements();
    }

    return newlyUnlocked;
  }

  /**
   * Add achievement to history
   */
  addToHistory(achievement) {
    try {
      const history = storageService.get(this.historyKey, [], {
        usePrefix: false,
      });
      history.push({
        id: achievement.id,
        name: achievement.name,
        unlockedAt: achievement.unlockedAt,
        points: achievement.points,
      });
      storageService.set(this.historyKey, history, { usePrefix: false });
    } catch (error) {
      logger.error("[Achievements] Error adding to history:", error);
    }
  }

  /**
   * Get all achievements
   */
  getAllAchievements() {
    return Object.values(this.achievements);
  }

  /**
   * Get unlocked achievements
   */
  getUnlockedAchievements() {
    return Object.values(this.achievements).filter((a) => a.unlocked);
  }

  /**
   * Get locked achievements
   */
  getLockedAchievements() {
    return Object.values(this.achievements).filter((a) => !a.unlocked);
  }

  /**
   * Get achievements by category
   */
  getAchievementsByCategory(category) {
    return Object.values(this.achievements).filter(
      (a) => a.category === category,
    );
  }

  /**
   * Get total points earned
   */
  getTotalPoints() {
    return this.getUnlockedAchievements().reduce((sum, a) => sum + a.points, 0);
  }

  /**
   * Get achievement progress (percentage)
   */
  getProgress() {
    const total = Object.keys(this.achievements).length;
    const unlocked = this.getUnlockedAchievements().length;
    return Math.round((unlocked / total) * 100);
  }

  /**
   * Get achievement history
   */
  getHistory() {
    try {
      return storageService.get(this.historyKey, [], { usePrefix: false });
    } catch (error) {
      logger.error("[Achievements] Error getting history:", error);
      return [];
    }
  }

  /**
   * Reset all achievements (for testing)
   */
  resetAll() {
    storageService.remove(this.storageKey, { usePrefix: false });
    storageService.remove(this.historyKey, { usePrefix: false });
    Object.values(this.achievements).forEach((a) => {
      a.unlocked = false;
      delete a.unlockedAt;
    });
    logger.info("[Achievements] All achievements reset");
  }

  /**
   * Export achievements data
   */
  export() {
    return {
      achievements: this.getAllAchievements(),
      totalPoints: this.getTotalPoints(),
      progress: this.getProgress(),
      history: this.getHistory(),
    };
  }
}

// Create singleton instance
const achievementsService = new AchievementsService();

// Make available globally
window.achievementsService = achievementsService;

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = achievementsService;
}

logger.info("[Achievements] Achievements Service loaded");
logger.info(
  `[Achievements] ${achievementsService.getAllAchievements().length} achievements available`,
);
logger.info(
  `[Achievements] ${achievementsService.getUnlockedAchievements().length} unlocked`,
);
