/**
 * FlagFit Pro - Achievements Integration
 * Automatically checks achievements when users log activities
 */

import { logger } from '../logger.js';

(function() {
  'use strict';

  function initAchievementsIntegration() {
    // Wait for achievements service
    if (!window.achievementsService) {
      setTimeout(initAchievementsIntegration, 100);
      return;
    }

    logger.info('[Achievements Integration] Initializing...');

    // Listen for wellness submissions
    document.addEventListener('wellnessSubmitted', handleWellnessSubmitted);

    // Listen for training completions
    document.addEventListener('trainingCompleted', handleTrainingCompleted);

    // Listen for game events
    document.addEventListener('gameCompleted', handleGameCompleted);
    document.addEventListener('gameWon', handleGameWon);
    document.addEventListener('gameMVP', handleGameMVP);

    // Listen for tournament events
    document.addEventListener('tournamentEntered', handleTournamentEntered);
    document.addEventListener('tournamentWon', handleTournamentWon);
    document.addEventListener('tournamentFinal', handleTournamentFinal);

    // Listen for QB-specific events
    document.addEventListener('qbThrowingSession', handleQBThrowingSession);
    document.addEventListener('qbPerfectSession', handleQBPerfectSession);
    document.addEventListener('qbDistanceRecord', handleQBDistanceRecord);

    // Listen for social events
    document.addEventListener('teamJoined', handleTeamJoined);
    document.addEventListener('teamCaptainAssigned', handleTeamCaptainAssigned);
    document.addEventListener('communityPost', handleCommunityPost);
    document.addEventListener('communityLike', handleCommunityLike);

    logger.info('[Achievements Integration] Ready');
  }

  /**
   * Handle wellness check-in submission
   */
  function handleWellnessSubmitted(event) {
    const wellnessData = event.detail;

    // Get user data for achievement checking
    const userData = calculateUserData();

    // Check achievements
    const newAchievements = window.achievementsService.checkAchievements(userData);

    if (newAchievements.length > 0) {
      logger.info(`[Achievements] Unlocked ${newAchievements.length} new achievement(s)!`);

      // Refresh widget if it exists
      if (window.renderAchievementsWidget && document.getElementById('achievements-widget-container')) {
        window.renderAchievementsWidget('achievements-widget-container');
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
    const newAchievements = window.achievementsService.checkAchievements(userData);

    if (newAchievements.length > 0) {
      logger.info(`[Achievements] Unlocked ${newAchievements.length} new achievement(s)!`);

      // Refresh widget
      if (window.renderAchievementsWidget && document.getElementById('achievements-widget-container')) {
        window.renderAchievementsWidget('achievements-widget-container');
      }
    }
  }

  /**
   * Calculate user data for achievement checking
   */
  function calculateUserData() {
    const wellnessHistory = JSON.parse(localStorage.getItem('wellnessHistory') || '[]');
    const trainingHistory = JSON.parse(localStorage.getItem('trainingHistory') || '[]');
    const gameHistory = JSON.parse(localStorage.getItem('gameHistory') || '[]');
    const tournamentHistory = JSON.parse(localStorage.getItem('tournamentHistory') || '[]');
    const qbHistory = JSON.parse(localStorage.getItem('qbThrowingHistory') || '[]');

    return {
      // Wellness data
      wellnessCount: wellnessHistory.length,
      wellnessStreak: calculateWellnessStreak(wellnessHistory),
      consecutiveDaysGoodSleep: calculateConsecutiveDaysGoodSleep(wellnessHistory),
      consecutiveDaysHighRecovery: calculateConsecutiveDaysHighRecovery(wellnessHistory),
      hasPerfectWeek: checkPerfectWeek(wellnessHistory),
      hasPerfectMonth: checkPerfectMonth(wellnessHistory),

      // Training data
      totalTrainingSessions: trainingHistory.length,
      trainingStreak: calculateTrainingStreak(trainingHistory),
      morningWorkouts: trainingHistory.filter(t => {
        const hour = new Date(t.startTime || t.date).getHours();
        return hour < 8;
      }).length,
      eveningWorkouts: trainingHistory.filter(t => {
        const hour = new Date(t.startTime || t.date).getHours();
        return hour >= 18;
      }).length,

      // Performance data
      speedImprovement: parseFloat(localStorage.getItem('speedImprovement') || '0'),
      agilityImprovement: parseFloat(localStorage.getItem('agilityImprovement') || '0'),
      consecutiveDaysHighPerformance: parseInt(localStorage.getItem('consecutiveDaysHighPerformance') || '0'),
      consecutiveDaysElitePerformance: parseInt(localStorage.getItem('consecutiveDaysElitePerformance') || '0'),
      personalBestsSet: parseInt(localStorage.getItem('personalBestsSet') || '0'),

      // Game data
      totalGamesPlayed: gameHistory.length,
      gamesWon: gameHistory.filter(g => g.result === 'win' || g.won === true).length,
      winStreak: calculateWinStreak(gameHistory),
      perfectGames: gameHistory.filter(g => g.opponentScore === 0 && (g.result === 'win' || g.won === true)).length,
      comebackWins: gameHistory.filter(g => g.comebackWin === true).length,
      mvpGames: gameHistory.filter(g => g.mvp === true).length,

      // Tournament data
      tournamentsEntered: tournamentHistory.length,
      tournamentsWon: tournamentHistory.filter(t => t.won === true || t.result === 'won').length,
      tournamentFinals: tournamentHistory.filter(t => t.reachedFinals === true || t.finalist === true).length,

      // QB-specific data
      qbThrowingSessions: qbHistory.length,
      qbPerfectSessions: qbHistory.filter(q => q.accuracy === 100 || q.perfect === true).length,
      qbHighAccuracyStreak: calculateQBAccuracyStreak(qbHistory),
      qbMaxDistance: Math.max(...qbHistory.map(q => q.maxDistance || q.distance || 0), 0),

      // Social data
      hasJoinedTeam: localStorage.getItem('hasJoinedTeam') === 'true',
      isTeamCaptain: localStorage.getItem('isTeamCaptain') === 'true',
      teammatesHelped: parseInt(localStorage.getItem('teammatesHelped') || '0'),
      communityPosts: parseInt(localStorage.getItem('communityPosts') || '0'),
      communityLikes: parseInt(localStorage.getItem('communityLikes') || '0'),

      // Special flags
      hasComeback: localStorage.getItem('hasComeback') === 'true'
    };
  }

  /**
   * Calculate wellness streak
   */
  function calculateWellnessStreak(history) {
    if (history.length === 0) {return 0;}

    const sorted = history.sort((a, b) => new Date(b.date) - new Date(a.date));
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    const currentDate = new Date(today);

    for (const entry of sorted) {
      const entryDate = new Date(entry.date).toISOString().split('T')[0];
      const expectedDate = currentDate.toISOString().split('T')[0];

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
    if (history.length === 0) {return 0;}

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
    if (history.length === 0) {return 0;}

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
    if (history.length < 7) {return false;}

    const sorted = history.sort((a, b) => new Date(b.date) - new Date(a.date));
    const lastWeek = sorted.slice(0, 7);

    return lastWeek.every(entry => entry.sleep >= 8);
  }

  /**
   * Check for perfect month (30 days with 8+ sleep)
   */
  function checkPerfectMonth(history) {
    if (history.length < 30) {return false;}

    const sorted = history.sort((a, b) => new Date(b.date) - new Date(a.date));
    const lastMonth = sorted.slice(0, 30);

    return lastMonth.every(entry => entry.sleep >= 8);
  }

  /**
   * Calculate training streak
   */
  function calculateTrainingStreak(history) {
    if (history.length === 0) {return 0;}

    const sorted = history.sort((a, b) => new Date(b.startTime || b.date) - new Date(a.startTime || a.date));
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    const currentDate = new Date(today);

    for (const entry of sorted) {
      const entryDate = new Date(entry.startTime || entry.date).toISOString().split('T')[0];
      const expectedDate = currentDate.toISOString().split('T')[0];

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
   * Calculate win streak from game history
   */
  function calculateWinStreak(gameHistory) {
    if (gameHistory.length === 0) {return 0;}

    const sorted = gameHistory.sort((a, b) => new Date(b.date || b.gameDate) - new Date(a.date || a.gameDate));
    let streak = 0;

    for (const game of sorted) {
      if (game.result === 'win' || game.won === true) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Calculate QB accuracy streak
   */
  function calculateQBAccuracyStreak(qbHistory) {
    if (qbHistory.length === 0) {return 0;}

    const sorted = qbHistory.sort((a, b) => new Date(b.date || b.sessionDate) - new Date(a.date || a.sessionDate));
    let streak = 0;

    for (const session of sorted) {
      const accuracy = session.accuracy || (session.completions / session.attempts * 100) || 0;
      if (accuracy >= 90) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Handle game completion
   */
  function handleGameCompleted(event) {
    const gameData = event.detail;
    const userData = calculateUserData();
    const newAchievements = window.achievementsService.checkAchievements(userData);

    if (newAchievements.length > 0) {
      logger.info(`[Achievements] Unlocked ${newAchievements.length} new achievement(s)!`);
      refreshWidget();
    }
  }

  /**
   * Handle game win
   */
  function handleGameWon(event) {
    const gameData = event.detail;
    
    // Check for comeback win
    if (gameData.wasBehind && gameData.comebackWin) {
      localStorage.setItem('comebackWins', (parseInt(localStorage.getItem('comebackWins') || '0') + 1).toString());
    }

    const userData = calculateUserData();
    const newAchievements = window.achievementsService.checkAchievements(userData);

    if (newAchievements.length > 0) {
      refreshWidget();
    }
  }

  /**
   * Handle game MVP
   */
  function handleGameMVP(event) {
    localStorage.setItem('mvpGames', (parseInt(localStorage.getItem('mvpGames') || '0') + 1).toString());
    
    const userData = calculateUserData();
    const newAchievements = window.achievementsService.checkAchievements(userData);

    if (newAchievements.length > 0) {
      refreshWidget();
    }
  }

  /**
   * Handle tournament entered
   */
  function handleTournamentEntered(event) {
    const userData = calculateUserData();
    const newAchievements = window.achievementsService.checkAchievements(userData);

    if (newAchievements.length > 0) {
      refreshWidget();
    }
  }

  /**
   * Handle tournament won
   */
  function handleTournamentWon(event) {
    const userData = calculateUserData();
    const newAchievements = window.achievementsService.checkAchievements(userData);

    if (newAchievements.length > 0) {
      refreshWidget();
    }
  }

  /**
   * Handle tournament final
   */
  function handleTournamentFinal(event) {
    localStorage.setItem('tournamentFinals', (parseInt(localStorage.getItem('tournamentFinals') || '0') + 1).toString());
    
    const userData = calculateUserData();
    const newAchievements = window.achievementsService.checkAchievements(userData);

    if (newAchievements.length > 0) {
      refreshWidget();
    }
  }

  /**
   * Handle QB throwing session
   */
  function handleQBThrowingSession(event) {
    const sessionData = event.detail;
    
    // Track max distance
    const currentMax = parseFloat(localStorage.getItem('qbMaxDistance') || '0');
    const sessionMax = sessionData.maxDistance || sessionData.distance || 0;
    if (sessionMax > currentMax) {
      localStorage.setItem('qbMaxDistance', sessionMax.toString());
    }

    const userData = calculateUserData();
    const newAchievements = window.achievementsService.checkAchievements(userData);

    if (newAchievements.length > 0) {
      refreshWidget();
    }
  }

  /**
   * Handle QB perfect session
   */
  function handleQBPerfectSession(event) {
    localStorage.setItem('qbPerfectSessions', (parseInt(localStorage.getItem('qbPerfectSessions') || '0') + 1).toString());
    
    const userData = calculateUserData();
    const newAchievements = window.achievementsService.checkAchievements(userData);

    if (newAchievements.length > 0) {
      refreshWidget();
    }
  }

  /**
   * Handle QB distance record
   */
  function handleQBDistanceRecord(event) {
    const recordData = event.detail;
    localStorage.setItem('qbMaxDistance', recordData.distance.toString());
    
    const userData = calculateUserData();
    const newAchievements = window.achievementsService.checkAchievements(userData);

    if (newAchievements.length > 0) {
      refreshWidget();
    }
  }

  /**
   * Handle team joined
   */
  function handleTeamJoined(event) {
    localStorage.setItem('hasJoinedTeam', 'true');
    
    const userData = calculateUserData();
    const newAchievements = window.achievementsService.checkAchievements(userData);

    if (newAchievements.length > 0) {
      refreshWidget();
    }
  }

  /**
   * Handle team captain assigned
   */
  function handleTeamCaptainAssigned(event) {
    localStorage.setItem('isTeamCaptain', 'true');
    
    const userData = calculateUserData();
    const newAchievements = window.achievementsService.checkAchievements(userData);

    if (newAchievements.length > 0) {
      refreshWidget();
    }
  }

  /**
   * Handle community post
   */
  function handleCommunityPost(event) {
    localStorage.setItem('communityPosts', (parseInt(localStorage.getItem('communityPosts') || '0') + 1).toString());
    
    const userData = calculateUserData();
    const newAchievements = window.achievementsService.checkAchievements(userData);

    if (newAchievements.length > 0) {
      refreshWidget();
    }
  }

  /**
   * Handle community like
   */
  function handleCommunityLike(event) {
    localStorage.setItem('communityLikes', (parseInt(localStorage.getItem('communityLikes') || '0') + 1).toString());
    
    const userData = calculateUserData();
    const newAchievements = window.achievementsService.checkAchievements(userData);

    if (newAchievements.length > 0) {
      refreshWidget();
    }
  }

  /**
   * Refresh achievements widget
   */
  function refreshWidget() {
    if (window.renderAchievementsWidget && document.getElementById('achievements-widget-container')) {
      window.renderAchievementsWidget('achievements-widget-container');
    }
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAchievementsIntegration);
  } else {
    initAchievementsIntegration();
  }

  logger.info('[Achievements Integration] Script loaded');
})();
