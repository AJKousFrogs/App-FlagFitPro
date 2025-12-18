/* eslint-disable no-console */
/**
 * FlagFit Pro - Achievements Service
 * Gamification system for tracking milestones and motivating users
 * 100% FREE - Uses localStorage
 */

import { storageService } from './services/storage-service-unified.js';

class AchievementsService {
  constructor() {
    this.storageKey = 'flagfit_achievements';
    this.historyKey = 'flagfit_achievement_history';
    this.achievements = this.defineAchievements();
    this.loadUnlockedAchievements();
  }

  /**
   * Define all available achievements
   * Rarity tiers: common (gray), rare (blue), epic (purple), legendary (gold)
   */
  defineAchievements() {
    return {
      // ============================================
      // WELLNESS ACHIEVEMENTS
      // ============================================
      'wellness-first': {
        id: 'wellness-first',
        name: 'First Steps',
        description: 'Log your first wellness check-in',
        icon: '🎯',
        category: 'wellness',
        rarity: 'common',
        points: 10,
        condition: (data) => data.wellnessCount >= 1,
        unlocked: false
      },
      'wellness-streak-3': {
        id: 'wellness-streak-3',
        name: 'Getting Started',
        description: '3-day wellness tracking streak',
        icon: '🔥',
        category: 'wellness',
        rarity: 'common',
        points: 25,
        condition: (data) => data.wellnessStreak >= 3,
        unlocked: false
      },
      'wellness-streak-7': {
        id: 'wellness-streak-7',
        name: 'Wellness Warrior',
        description: '7-day wellness tracking streak',
        icon: '🔥🔥',
        category: 'wellness',
        rarity: 'rare',
        points: 50,
        condition: (data) => data.wellnessStreak >= 7,
        unlocked: false
      },
      'wellness-streak-14': {
        id: 'wellness-streak-14',
        name: 'Two Week Champion',
        description: '14-day wellness tracking streak',
        icon: '🔥🔥🔥',
        category: 'wellness',
        rarity: 'rare',
        points: 100,
        condition: (data) => data.wellnessStreak >= 14,
        unlocked: false
      },
      'wellness-streak-30': {
        id: 'wellness-streak-30',
        name: 'Dedicated Athlete',
        description: '30-day wellness tracking streak',
        icon: '🔥🔥🔥',
        category: 'wellness',
        rarity: 'epic',
        points: 150,
        condition: (data) => data.wellnessStreak >= 30,
        unlocked: false
      },
      'wellness-streak-60': {
        id: 'wellness-streak-60',
        name: 'Two Month Master',
        description: '60-day wellness tracking streak',
        icon: '💎',
        category: 'wellness',
        rarity: 'epic',
        points: 300,
        condition: (data) => data.wellnessStreak >= 60,
        unlocked: false
      },
      'wellness-streak-100': {
        id: 'wellness-streak-100',
        name: 'Elite Commitment',
        description: '100-day wellness tracking streak',
        icon: '💎',
        category: 'wellness',
        rarity: 'legendary',
        points: 500,
        condition: (data) => data.wellnessStreak >= 100,
        unlocked: false
      },
      'wellness-streak-365': {
        id: 'wellness-streak-365',
        name: 'Year of Excellence',
        description: '365-day wellness tracking streak',
        icon: '👑',
        category: 'wellness',
        rarity: 'legendary',
        points: 1000,
        condition: (data) => data.wellnessStreak >= 365,
        unlocked: false
      },
      'sleep-master': {
        id: 'sleep-master',
        name: 'Sleep Master',
        description: 'Maintain 8+ hours of sleep for 7 days',
        icon: '😴',
        category: 'wellness',
        rarity: 'rare',
        points: 75,
        condition: (data) => data.consecutiveDaysGoodSleep >= 7,
        unlocked: false
      },
      'sleep-champion': {
        id: 'sleep-champion',
        name: 'Sleep Champion',
        description: 'Maintain 8+ hours of sleep for 30 days',
        icon: '😴💤',
        category: 'wellness',
        rarity: 'epic',
        points: 250,
        condition: (data) => data.consecutiveDaysGoodSleep >= 30,
        unlocked: false
      },
      'recovery-champ': {
        id: 'recovery-champ',
        name: 'Recovery Champion',
        description: 'Maintain high recovery scores for 14 days',
        icon: '💪',
        category: 'wellness',
        rarity: 'rare',
        points: 100,
        condition: (data) => data.consecutiveDaysHighRecovery >= 14,
        unlocked: false
      },
      'recovery-master': {
        id: 'recovery-master',
        name: 'Recovery Master',
        description: 'Maintain high recovery scores for 30 days',
        icon: '💪💪',
        category: 'wellness',
        rarity: 'epic',
        points: 300,
        condition: (data) => data.consecutiveDaysHighRecovery >= 30,
        unlocked: false
      },
      'wellness-50': {
        id: 'wellness-50',
        name: 'Wellness Veteran',
        description: 'Log 50 wellness check-ins',
        icon: '📝',
        category: 'wellness',
        rarity: 'rare',
        points: 100,
        condition: (data) => data.wellnessCount >= 50,
        unlocked: false
      },
      'wellness-100': {
        id: 'wellness-100',
        name: 'Wellness Centurion',
        description: 'Log 100 wellness check-ins',
        icon: '📝📝',
        category: 'wellness',
        rarity: 'epic',
        points: 250,
        condition: (data) => data.wellnessCount >= 100,
        unlocked: false
      },

      // ============================================
      // TRAINING ACHIEVEMENTS
      // ============================================
      'training-first': {
        id: 'training-first',
        name: 'Training Begins',
        description: 'Complete your first training session',
        icon: '🏃',
        category: 'training',
        rarity: 'common',
        points: 10,
        condition: (data) => data.totalTrainingSessions >= 1,
        unlocked: false
      },
      'training-5': {
        id: 'training-5',
        name: 'Building Momentum',
        description: 'Complete 5 training sessions',
        icon: '💪',
        category: 'training',
        rarity: 'common',
        points: 30,
        condition: (data) => data.totalTrainingSessions >= 5,
        unlocked: false
      },
      'training-10': {
        id: 'training-10',
        name: 'Getting Stronger',
        description: 'Complete 10 training sessions',
        icon: '💪',
        category: 'training',
        rarity: 'common',
        points: 50,
        condition: (data) => data.totalTrainingSessions >= 10,
        unlocked: false
      },
      'training-25': {
        id: 'training-25',
        name: 'Quarter Century',
        description: 'Complete 25 training sessions',
        icon: '🎖️',
        category: 'training',
        rarity: 'rare',
        points: 100,
        condition: (data) => data.totalTrainingSessions >= 25,
        unlocked: false
      },
      'training-50': {
        id: 'training-50',
        name: 'Half Century',
        description: 'Complete 50 training sessions',
        icon: '🎖️',
        category: 'training',
        rarity: 'rare',
        points: 150,
        condition: (data) => data.totalTrainingSessions >= 50,
        unlocked: false
      },
      'training-100': {
        id: 'training-100',
        name: 'Century Club',
        description: 'Complete 100 training sessions',
        icon: '💯',
        category: 'training',
        rarity: 'epic',
        points: 300,
        condition: (data) => data.totalTrainingSessions >= 100,
        unlocked: false
      },
      'training-250': {
        id: 'training-250',
        name: 'Training Legend',
        description: 'Complete 250 training sessions',
        icon: '🏆',
        category: 'training',
        rarity: 'epic',
        points: 600,
        condition: (data) => data.totalTrainingSessions >= 250,
        unlocked: false
      },
      'training-500': {
        id: 'training-500',
        name: 'Training Master',
        description: 'Complete 500 training sessions',
        icon: '👑',
        category: 'training',
        rarity: 'legendary',
        points: 1000,
        condition: (data) => data.totalTrainingSessions >= 500,
        unlocked: false
      },
      'early-bird': {
        id: 'early-bird',
        name: 'Early Bird',
        description: 'Complete 10 morning workouts (before 8 AM)',
        icon: '🌅',
        category: 'training',
        rarity: 'rare',
        points: 75,
        condition: (data) => data.morningWorkouts >= 10,
        unlocked: false
      },
      'early-bird-master': {
        id: 'early-bird-master',
        name: 'Dawn Warrior',
        description: 'Complete 50 morning workouts',
        icon: '🌅🌅',
        category: 'training',
        rarity: 'epic',
        points: 200,
        condition: (data) => data.morningWorkouts >= 50,
        unlocked: false
      },
      'night-owl': {
        id: 'night-owl',
        name: 'Night Owl',
        description: 'Complete 10 evening workouts (after 6 PM)',
        icon: '🦉',
        category: 'training',
        rarity: 'rare',
        points: 75,
        condition: (data) => data.eveningWorkouts >= 10,
        unlocked: false
      },
      'night-owl-master': {
        id: 'night-owl-master',
        name: 'Midnight Champion',
        description: 'Complete 50 evening workouts',
        icon: '🦉🦉',
        category: 'training',
        rarity: 'epic',
        points: 200,
        condition: (data) => data.eveningWorkouts >= 50,
        unlocked: false
      },
      'training-streak-7': {
        id: 'training-streak-7',
        name: 'Weekly Warrior',
        description: 'Train 7 days in a row',
        icon: '🔥',
        category: 'training',
        rarity: 'rare',
        points: 100,
        condition: (data) => data.trainingStreak >= 7,
        unlocked: false
      },
      'training-streak-30': {
        id: 'training-streak-30',
        name: 'Monthly Grind',
        description: 'Train 30 days in a row',
        icon: '🔥🔥',
        category: 'training',
        rarity: 'epic',
        points: 300,
        condition: (data) => data.trainingStreak >= 30,
        unlocked: false
      },

      // ============================================
      // PERFORMANCE ACHIEVEMENTS
      // ============================================
      'speed-demon': {
        id: 'speed-demon',
        name: 'Speed Demon',
        description: 'Improve your 40-yard dash time by 0.5 seconds',
        icon: '⚡',
        category: 'performance',
        rarity: 'rare',
        points: 100,
        condition: (data) => data.speedImprovement >= 0.5,
        unlocked: false
      },
      'speed-legend': {
        id: 'speed-legend',
        name: 'Speed Legend',
        description: 'Improve your 40-yard dash time by 1 second',
        icon: '⚡⚡',
        category: 'performance',
        rarity: 'epic',
        points: 300,
        condition: (data) => data.speedImprovement >= 1.0,
        unlocked: false
      },
      'agility-master': {
        id: 'agility-master',
        name: 'Agility Master',
        description: 'Improve cone drill time by 1 second',
        icon: '🌀',
        category: 'performance',
        rarity: 'rare',
        points: 100,
        condition: (data) => data.agilityImprovement >= 1.0,
        unlocked: false
      },
      'agility-legend': {
        id: 'agility-legend',
        name: 'Agility Legend',
        description: 'Improve cone drill time by 2 seconds',
        icon: '🌀🌀',
        category: 'performance',
        rarity: 'epic',
        points: 300,
        condition: (data) => data.agilityImprovement >= 2.0,
        unlocked: false
      },
      'consistent-performer': {
        id: 'consistent-performer',
        name: 'Consistent Performer',
        description: 'Maintain 80%+ performance score for 30 days',
        icon: '📊',
        category: 'performance',
        rarity: 'epic',
        points: 200,
        condition: (data) => data.consecutiveDaysHighPerformance >= 30,
        unlocked: false
      },
      'elite-performer': {
        id: 'elite-performer',
        name: 'Elite Performer',
        description: 'Maintain 90%+ performance score for 30 days',
        icon: '📊📊',
        category: 'performance',
        rarity: 'legendary',
        points: 500,
        condition: (data) => data.consecutiveDaysElitePerformance >= 30,
        unlocked: false
      },
      'pb-setter': {
        id: 'pb-setter',
        name: 'Personal Best Setter',
        description: 'Set 5 personal best records',
        icon: '⭐',
        category: 'performance',
        rarity: 'rare',
        points: 150,
        condition: (data) => data.personalBestsSet >= 5,
        unlocked: false
      },
      'pb-master': {
        id: 'pb-master',
        name: 'Personal Best Master',
        description: 'Set 20 personal best records',
        icon: '⭐⭐',
        category: 'performance',
        rarity: 'epic',
        points: 400,
        condition: (data) => data.personalBestsSet >= 20,
        unlocked: false
      },

      // ============================================
      // GAME ACHIEVEMENTS
      // ============================================
      'game-first': {
        id: 'game-first',
        name: 'Game Day',
        description: 'Play your first game',
        icon: '🏈',
        category: 'games',
        rarity: 'common',
        points: 25,
        condition: (data) => data.totalGamesPlayed >= 1,
        unlocked: false
      },
      'game-5': {
        id: 'game-5',
        name: 'Rookie Season',
        description: 'Play 5 games',
        icon: '🏈',
        category: 'games',
        rarity: 'common',
        points: 75,
        condition: (data) => data.totalGamesPlayed >= 5,
        unlocked: false
      },
      'game-10': {
        id: 'game-10',
        name: 'Veteran Player',
        description: 'Play 10 games',
        icon: '🏈🏈',
        category: 'games',
        rarity: 'rare',
        points: 150,
        condition: (data) => data.totalGamesPlayed >= 10,
        unlocked: false
      },
      'game-25': {
        id: 'game-25',
        name: 'Seasoned Competitor',
        description: 'Play 25 games',
        icon: '🏈🏈🏈',
        category: 'games',
        rarity: 'epic',
        points: 300,
        condition: (data) => data.totalGamesPlayed >= 25,
        unlocked: false
      },
      'game-50': {
        id: 'game-50',
        name: 'Game Master',
        description: 'Play 50 games',
        icon: '👑',
        category: 'games',
        rarity: 'legendary',
        points: 600,
        condition: (data) => data.totalGamesPlayed >= 50,
        unlocked: false
      },
      'first-win': {
        id: 'first-win',
        name: 'First Victory',
        description: 'Win your first game',
        icon: '🏆',
        category: 'games',
        rarity: 'common',
        points: 50,
        condition: (data) => data.gamesWon >= 1,
        unlocked: false
      },
      'win-streak-3': {
        id: 'win-streak-3',
        name: 'Hot Streak',
        description: 'Win 3 games in a row',
        icon: '🔥',
        category: 'games',
        rarity: 'rare',
        points: 150,
        condition: (data) => data.winStreak >= 3,
        unlocked: false
      },
      'win-streak-5': {
        id: 'win-streak-5',
        name: 'Dominant Force',
        description: 'Win 5 games in a row',
        icon: '🔥🔥',
        category: 'games',
        rarity: 'epic',
        points: 400,
        condition: (data) => data.winStreak >= 5,
        unlocked: false
      },
      'perfect-game': {
        id: 'perfect-game',
        name: 'Perfect Game',
        description: 'Win a game without allowing any points',
        icon: '🛡️',
        category: 'games',
        rarity: 'epic',
        points: 500,
        condition: (data) => data.perfectGames >= 1,
        unlocked: false
      },
      'comeback-win': {
        id: 'comeback-win',
        name: 'Comeback King',
        description: 'Win a game after being down by 2+ scores',
        icon: '🔄',
        category: 'games',
        rarity: 'rare',
        points: 200,
        condition: (data) => data.comebackWins >= 1,
        unlocked: false
      },
      'mvp-game': {
        id: 'mvp-game',
        name: 'Game MVP',
        description: 'Be named MVP in a game',
        icon: '⭐',
        category: 'games',
        rarity: 'rare',
        points: 150,
        condition: (data) => data.mvpGames >= 1,
        unlocked: false
      },
      'mvp-multiple': {
        id: 'mvp-multiple',
        name: 'MVP Machine',
        description: 'Be named MVP in 5 games',
        icon: '⭐⭐',
        category: 'games',
        rarity: 'epic',
        points: 500,
        condition: (data) => data.mvpGames >= 5,
        unlocked: false
      },

      // ============================================
      // TOURNAMENT ACHIEVEMENTS
      // ============================================
      'tournament-first': {
        id: 'tournament-first',
        name: 'Tournament Debut',
        description: 'Participate in your first tournament',
        icon: '🏅',
        category: 'tournaments',
        rarity: 'common',
        points: 50,
        condition: (data) => data.tournamentsEntered >= 1,
        unlocked: false
      },
      'tournament-5': {
        id: 'tournament-5',
        name: 'Tournament Regular',
        description: 'Participate in 5 tournaments',
        icon: '🏅🏅',
        category: 'tournaments',
        rarity: 'rare',
        points: 200,
        condition: (data) => data.tournamentsEntered >= 5,
        unlocked: false
      },
      'tournament-champion': {
        id: 'tournament-champion',
        name: 'Tournament Champion',
        description: 'Win your first tournament',
        icon: '🥇',
        category: 'tournaments',
        rarity: 'epic',
        points: 500,
        condition: (data) => data.tournamentsWon >= 1,
        unlocked: false
      },
      'tournament-dynasty': {
        id: 'tournament-dynasty',
        name: 'Tournament Dynasty',
        description: 'Win 3 tournaments',
        icon: '👑',
        category: 'tournaments',
        rarity: 'legendary',
        points: 1000,
        condition: (data) => data.tournamentsWon >= 3,
        unlocked: false
      },
      'finalist': {
        id: 'finalist',
        name: 'Finalist',
        description: 'Reach the tournament finals',
        icon: '🥈',
        category: 'tournaments',
        rarity: 'rare',
        points: 200,
        condition: (data) => data.tournamentFinals >= 1,
        unlocked: false
      },

      // ============================================
      // QB-SPECIFIC ACHIEVEMENTS
      // ============================================
      'qb-first-throw': {
        id: 'qb-first-throw',
        name: 'First Throw',
        description: 'Log your first throwing session',
        icon: '🏈',
        category: 'qb',
        rarity: 'common',
        points: 10,
        condition: (data) => data.qbThrowingSessions >= 1,
        unlocked: false
      },
      'qb-100-throws': {
        id: 'qb-100-throws',
        name: 'Century of Throws',
        description: 'Complete 100 throwing sessions',
        icon: '🏈🏈',
        category: 'qb',
        rarity: 'rare',
        points: 150,
        condition: (data) => data.qbThrowingSessions >= 100,
        unlocked: false
      },
      'qb-perfect-throw': {
        id: 'qb-perfect-throw',
        name: 'Perfect Throw',
        description: 'Complete a throwing session with 100% accuracy',
        icon: '🎯',
        category: 'qb',
        rarity: 'rare',
        points: 100,
        condition: (data) => data.qbPerfectSessions >= 1,
        unlocked: false
      },
      'qb-accuracy-master': {
        id: 'qb-accuracy-master',
        name: 'Accuracy Master',
        description: 'Maintain 90%+ accuracy for 10 sessions',
        icon: '🎯🎯',
        category: 'qb',
        rarity: 'epic',
        points: 300,
        condition: (data) => data.qbHighAccuracyStreak >= 10,
        unlocked: false
      },
      'qb-distance-master': {
        id: 'qb-distance-master',
        name: 'Distance Master',
        description: 'Throw 50+ yards',
        icon: '🚀',
        category: 'qb',
        rarity: 'rare',
        points: 150,
        condition: (data) => data.qbMaxDistance >= 50,
        unlocked: false
      },
      'qb-distance-legend': {
        id: 'qb-distance-legend',
        name: 'Distance Legend',
        description: 'Throw 70+ yards',
        icon: '🚀🚀',
        category: 'qb',
        rarity: 'epic',
        points: 400,
        condition: (data) => data.qbMaxDistance >= 70,
        unlocked: false
      },

      // ============================================
      // SOCIAL ACHIEVEMENTS
      // ============================================
      'team-player': {
        id: 'team-player',
        name: 'Team Player',
        description: 'Join a team',
        icon: '👥',
        category: 'social',
        rarity: 'common',
        points: 25,
        condition: (data) => data.hasJoinedTeam === true,
        unlocked: false
      },
      'team-captain': {
        id: 'team-captain',
        name: 'Team Captain',
        description: 'Become a team captain',
        icon: '👑',
        category: 'social',
        rarity: 'rare',
        points: 200,
        condition: (data) => data.isTeamCaptain === true,
        unlocked: false
      },
      'mentor': {
        id: 'mentor',
        name: 'Mentor',
        description: 'Help 5 teammates with their training',
        icon: '🎓',
        category: 'social',
        rarity: 'rare',
        points: 150,
        condition: (data) => data.teammatesHelped >= 5,
        unlocked: false
      },
      'mentor-master': {
        id: 'mentor-master',
        name: 'Master Mentor',
        description: 'Help 20 teammates with their training',
        icon: '🎓🎓',
        category: 'social',
        rarity: 'epic',
        points: 400,
        condition: (data) => data.teammatesHelped >= 20,
        unlocked: false
      },
      'community-contributor': {
        id: 'community-contributor',
        name: 'Community Contributor',
        description: 'Post 10 times in the community',
        icon: '💬',
        category: 'social',
        rarity: 'common',
        points: 50,
        condition: (data) => data.communityPosts >= 10,
        unlocked: false
      },
      'community-star': {
        id: 'community-star',
        name: 'Community Star',
        description: 'Get 50 likes on your posts',
        icon: '⭐',
        category: 'social',
        rarity: 'rare',
        points: 150,
        condition: (data) => data.communityLikes >= 50,
        unlocked: false
      },

      // ============================================
      // SPECIAL ACHIEVEMENTS
      // ============================================
      'perfect-week': {
        id: 'perfect-week',
        name: 'Perfect Week',
        description: 'Log wellness 7 days straight with 8+ sleep each day',
        icon: '⭐',
        category: 'special',
        rarity: 'epic',
        points: 200,
        condition: (data) => data.hasPerfectWeek === true,
        unlocked: false
      },
      'perfect-month': {
        id: 'perfect-month',
        name: 'Perfect Month',
        description: 'Log wellness 30 days straight with 8+ sleep each day',
        icon: '⭐⭐',
        category: 'special',
        rarity: 'legendary',
        points: 800,
        condition: (data) => data.hasPerfectMonth === true,
        unlocked: false
      },
      'comeback-kid': {
        id: 'comeback-kid',
        name: 'Comeback Kid',
        description: 'Return to training after 7+ day break',
        icon: '🔄',
        category: 'special',
        rarity: 'common',
        points: 50,
        condition: (data) => data.hasComeback === true,
        unlocked: false
      },
      'jack-of-all-trades': {
        id: 'jack-of-all-trades',
        name: 'Jack of All Trades',
        description: 'Unlock achievements in all categories',
        icon: '🎭',
        category: 'special',
        rarity: 'epic',
        points: 500,
        condition: (data) => data.hasAllCategories === true,
        unlocked: false
      },
      'achievement-collector': {
        id: 'achievement-collector',
        name: 'Achievement Collector',
        description: 'Unlock 25 achievements',
        icon: '🏆',
        category: 'special',
        rarity: 'epic',
        points: 400,
        condition: (data) => data.unlockedAchievementCount >= 25,
        unlocked: false
      },
      'achievement-master': {
        id: 'achievement-master',
        name: 'Achievement Master',
        description: 'Unlock 50 achievements',
        icon: '👑',
        category: 'special',
        rarity: 'legendary',
        points: 1000,
        condition: (data) => data.unlockedAchievementCount >= 50,
        unlocked: false
      },
      'points-milestone-1000': {
        id: 'points-milestone-1000',
        name: 'Thousand Point Club',
        description: 'Earn 1,000 achievement points',
        icon: '💯',
        category: 'special',
        rarity: 'epic',
        points: 0, // Bonus achievement, no additional points
        condition: (data) => data.totalAchievementPoints >= 1000,
        unlocked: false
      },
      'points-milestone-5000': {
        id: 'points-milestone-5000',
        name: 'Five Thousand Elite',
        description: 'Earn 5,000 achievement points',
        icon: '💎',
        category: 'special',
        rarity: 'legendary',
        points: 0,
        condition: (data) => data.totalAchievementPoints >= 5000,
        unlocked: false
      }
    };
  }

  /**
   * Load unlocked achievements from localStorage
   */
  loadUnlockedAchievements() {
    try {
      const unlockedIds = storageService.get(this.storageKey, [], { usePrefix: false });
      unlockedIds.forEach(id => {
        if (this.achievements[id]) {
          this.achievements[id].unlocked = true;
        }
      });
    } catch (error) {
      console.error('[Achievements] Error loading achievements:', error);
    }
  }

  /**
   * Save unlocked achievements to localStorage
   */
  saveUnlockedAchievements() {
    try {
      const unlockedIds = Object.keys(this.achievements)
        .filter(id => this.achievements[id].unlocked);

      storageService.set(this.storageKey, unlockedIds, { usePrefix: false });
    } catch (error) {
      console.error('[Achievements] Error saving achievements:', error);
    }
  }

  /**
   * Check achievements against user data
   * Returns newly unlocked achievements
   */
  checkAchievements(userData) {
    const newlyUnlocked = [];

    // Enhance userData with achievement-specific data
    const enhancedData = {
      ...userData,
      unlockedAchievementCount: this.getUnlockedAchievements().length,
      totalAchievementPoints: this.getTotalPoints(),
      hasAllCategories: this.checkAllCategoriesUnlocked()
    };

    Object.values(this.achievements).forEach(achievement => {
      // Skip already unlocked
      if (achievement.unlocked) {return;}

      // Check condition
      if (achievement.condition(enhancedData)) {
        achievement.unlocked = true;
        achievement.unlockedAt = new Date().toISOString();
        newlyUnlocked.push(achievement);

        // Save to history
        this.addToHistory(achievement);

        // Show notification if available
        if (window.notificationManager && window.notificationManager.isEnabled()) {
          window.notificationManager.notifyAchievement(achievement);
        }

        console.log(`[Achievements] Unlocked: ${achievement.name} (${achievement.rarity})`);
      }
    });

    if (newlyUnlocked.length > 0) {
      this.saveUnlockedAchievements();
    }

    return newlyUnlocked;
  }

  /**
   * Check if user has unlocked achievements in all categories
   */
  checkAllCategoriesUnlocked() {
    const categories = ['wellness', 'training', 'performance', 'games', 'tournaments', 'qb', 'social'];
    const unlocked = this.getUnlockedAchievements();
    
    return categories.every(cat => {
      return unlocked.some(a => a.category === cat);
    });
  }

  /**
   * Add achievement to history
   */
  addToHistory(achievement) {
    try {
      const history = storageService.get(this.historyKey, [], { usePrefix: false });
      history.push({
        id: achievement.id,
        name: achievement.name,
        unlockedAt: achievement.unlockedAt,
        points: achievement.points
      });
      storageService.set(this.historyKey, history, { usePrefix: false });
    } catch (error) {
      console.error('[Achievements] Error adding to history:', error);
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
    return Object.values(this.achievements).filter(a => a.unlocked);
  }

  /**
   * Get locked achievements
   */
  getLockedAchievements() {
    return Object.values(this.achievements).filter(a => !a.unlocked);
  }

  /**
   * Get achievements by category
   */
  getAchievementsByCategory(category) {
    return Object.values(this.achievements).filter(a => a.category === category);
  }

  /**
   * Get achievements by rarity
   */
  getAchievementsByRarity(rarity) {
    return Object.values(this.achievements).filter(a => a.rarity === rarity);
  }

  /**
   * Get rarity statistics
   */
  getRarityStats() {
    const unlocked = this.getUnlockedAchievements();
    return {
      common: unlocked.filter(a => a.rarity === 'common').length,
      rare: unlocked.filter(a => a.rarity === 'rare').length,
      epic: unlocked.filter(a => a.rarity === 'epic').length,
      legendary: unlocked.filter(a => a.rarity === 'legendary').length
    };
  }

  /**
   * Get total points earned
   */
  getTotalPoints() {
    return this.getUnlockedAchievements()
      .reduce((sum, a) => sum + a.points, 0);
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
      console.error('[Achievements] Error getting history:', error);
      return [];
    }
  }

  /**
   * Reset all achievements (for testing)
   */
  resetAll() {
    storageService.remove(this.storageKey, { usePrefix: false });
    storageService.remove(this.historyKey, { usePrefix: false });
    Object.values(this.achievements).forEach(a => {
      a.unlocked = false;
      delete a.unlockedAt;
    });
    console.log('[Achievements] All achievements reset');
  }

  /**
   * Export achievements data
   */
  export() {
    return {
      achievements: this.getAllAchievements(),
      totalPoints: this.getTotalPoints(),
      progress: this.getProgress(),
      history: this.getHistory()
    };
  }
}

// Create singleton instance
const achievementsService = new AchievementsService();

// Make available globally
window.achievementsService = achievementsService;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = achievementsService;
}

console.log('[Achievements] Achievements Service loaded');
console.log(`[Achievements] ${achievementsService.getAllAchievements().length} achievements available`);
console.log(`[Achievements] ${achievementsService.getUnlockedAchievements().length} unlocked`);
