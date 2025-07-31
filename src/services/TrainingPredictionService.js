import { Pool } from 'pg';

class TrainingPredictionService {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    // LA28 Olympics date
    this.LA28_DATE = new Date('2028-07-28');
    
    // Mathematical constants for predictions
    this.MATH_CONSTANTS = {
      BASE_IMPROVEMENT_RATE: 0.02, // 2% base improvement per week
      FATIGUE_DECAY_RATE: 0.15, // 15% fatigue impact
      RECOVERY_RATE: 0.85, // 85% recovery rate
      PLATEAU_THRESHOLD: 0.80, // 80% proficiency triggers plateau
      SYNERGY_BONUS: 0.12, // 12% synergy bonus
      REST_REQUIREMENT: 24, // 24 hours complete rest per week
      MAX_WEEKLY_SESSIONS: 7, // Maximum 7 training sessions per week
      MIN_REST_HOURS: 8 // Minimum 8 hours rest between sessions
    };
  }

  // =============================================================================
  // CORE PREDICTION ALGORITHMS
  // =============================================================================

  /**
   * Calculate 3-year progression towards LA28 Olympics
   * @param {string} userId - User ID
   * @param {Date} startDate - Starting date for prediction
   * @returns {Object} Comprehensive prediction results
   */
  async calculateLA28Progression(userId, startDate = new Date()) {
    try {
      const weeksToLA28 = this.calculateWeeksToLA28(startDate);
      const currentProgress = await this.getCurrentProgress(userId);
      const predictions = await this.generatePredictions(userId, currentProgress, weeksToLA28);
      
      return {
        userId,
        startDate,
        la28Date: this.LA28_DATE,
        weeksToLA28,
        currentProgress,
        predictions,
        recommendations: this.generateRecommendations(predictions, weeksToLA28),
        confidenceLevel: this.calculateConfidenceLevel(predictions)
      };
    } catch (error) {
      console.error('Error calculating LA28 progression:', error);
      throw error;
    }
  }

  /**
   * Mathematical prediction algorithm with correction factors
   * @param {Object} currentProgress - Current user progress
   * @param {number} weeksRemaining - Weeks until LA28
   * @returns {Object} Predicted outcomes
   */
  calculateMathematicalPrediction(currentProgress, weeksRemaining) {
    const {
      currentProficiency,
      currentSessions,
      averageQuality,
      consistencyScore
    } = currentProgress;

    // Base improvement calculation
    let baseImprovement = this.MATH_CONSTANTS.BASE_IMPROVEMENT_RATE * weeksRemaining;
    
    // Apply mathematical corrections
    const fatigueCorrection = this.calculateFatigueCorrection(currentSessions, weeksRemaining);
    const recoveryCorrection = this.calculateRecoveryCorrection(consistencyScore);
    const plateauCorrection = this.calculatePlateauCorrection(currentProficiency);
    const synergyCorrection = this.calculateSynergyCorrection(averageQuality);

    // Final prediction calculation
    const totalCorrection = fatigueCorrection + recoveryCorrection + plateauCorrection + synergyCorrection;
    const predictedProficiency = Math.min(100, currentProficiency + (baseImprovement * totalCorrection));
    
    // Calculate required sessions
    const requiredSessions = this.calculateRequiredSessions(predictedProficiency, currentProficiency, weeksRemaining);
    
    return {
      predictedProficiency: Math.round(predictedProficiency * 100) / 100,
      requiredSessions,
      fatigueCorrection: Math.round(fatigueCorrection * 100) / 100,
      recoveryCorrection: Math.round(recoveryCorrection * 100) / 100,
      plateauCorrection: Math.round(plateauCorrection * 100) / 100,
      synergyCorrection: Math.round(synergyCorrection * 100) / 100,
      totalCorrection: Math.round(totalCorrection * 100) / 100
    };
  }

  // =============================================================================
  // MATHEMATICAL CORRECTION FACTORS
  // =============================================================================

  /**
   * Calculate fatigue impact on performance
   * @param {number} currentSessions - Current weekly sessions
   * @param {number} weeksRemaining - Weeks until target
   * @returns {number} Fatigue correction factor
   */
  calculateFatigueCorrection(currentSessions, weeksRemaining) {
    const maxSessions = this.MATH_CONSTANTS.MAX_WEEKLY_SESSIONS;
    const fatigueFactor = Math.min(1, currentSessions / maxSessions);
    const cumulativeFatigue = fatigueFactor * this.MATH_CONSTANTS.FATIGUE_DECAY_RATE;
    
    return Math.max(0.5, 1 - (cumulativeFatigue * Math.sqrt(weeksRemaining)));
  }

  /**
   * Calculate recovery impact on performance
   * @param {number} consistencyScore - User's consistency score (0-1)
   * @returns {number} Recovery correction factor
   */
  calculateRecoveryCorrection(consistencyScore) {
    const baseRecovery = this.MATH_CONSTANTS.RECOVERY_RATE;
    const consistencyBonus = consistencyScore * 0.2; // Up to 20% bonus for consistency
    
    return Math.min(1.2, baseRecovery + consistencyBonus);
  }

  /**
   * Calculate plateau effect on improvement
   * @param {number} currentProficiency - Current proficiency level (0-100)
   * @returns {number} Plateau correction factor
   */
  calculatePlateauCorrection(currentProficiency) {
    if (currentProficiency < this.MATH_CONSTANTS.PLATEAU_THRESHOLD * 100) {
      return 1.0; // No plateau effect
    }
    
    const plateauIntensity = (currentProficiency - (this.MATH_CONSTANTS.PLATEAU_THRESHOLD * 100)) / 20;
    const plateauFactor = this.MATH_CONSTANTS.PLATEAU_THRESHOLD * plateauIntensity;
    
    return Math.max(0.3, 1 - plateauFactor);
  }

  /**
   * Calculate synergy bonus from training combinations
   * @param {number} averageQuality - Average session quality (0-1)
   * @returns {number} Synergy correction factor
   */
  calculateSynergyCorrection(averageQuality) {
    const baseSynergy = this.MATH_CONSTANTS.SYNERGY_BONUS;
    const qualityBonus = averageQuality * 0.15; // Up to 15% bonus for high quality
    
    return 1 + baseSynergy + qualityBonus;
  }

  // =============================================================================
  // LA28 SPECIFIC CALCULATIONS
  // =============================================================================

  /**
   * Calculate weeks remaining until LA28 Olympics
   * @param {Date} startDate - Starting date
   * @returns {number} Weeks until LA28
   */
  calculateWeeksToLA28(startDate) {
    const timeDiff = this.LA28_DATE.getTime() - startDate.getTime();
    const weeksDiff = Math.ceil(timeDiff / (1000 * 3600 * 24 * 7));
    return Math.max(0, weeksDiff);
  }

  /**
   * Calculate required sessions to reach LA28 proficiency
   * @param {number} targetProficiency - Target proficiency level
   * @param {number} currentProficiency - Current proficiency level
   * @param {number} weeksRemaining - Weeks until LA28
   * @returns {number} Required weekly sessions
   */
  calculateRequiredSessions(targetProficiency, currentProficiency, weeksRemaining) {
    const proficiencyGap = targetProficiency - currentProficiency;
    const weeklyImprovementNeeded = proficiencyGap / weeksRemaining;
    const baseSessionsPerWeek = 3; // Base assumption
    const sessionEfficiency = 0.8; // 80% efficiency per session
    
    return Math.ceil(weeklyImprovementNeeded / (baseSessionsPerWeek * sessionEfficiency));
  }

  /**
   * Generate weekly schedule recommendations
   * @param {Object} predictions - Prediction results
   * @param {number} weeksRemaining - Weeks until LA28
   * @returns {Object} Weekly schedule recommendations
   */
  generateWeeklyScheduleRecommendations(predictions, weeksRemaining) {
    const totalSessions = predictions.requiredSessions;
    const restHours = this.MATH_CONSTANTS.REST_REQUIREMENT;
    
    // Distribute sessions across the week
    const dailySessions = this.distributeSessionsAcrossWeek(totalSessions);
    
    // Ensure rest requirements are met
    const restSchedule = this.calculateRestSchedule(dailySessions, restHours);
    
    return {
      weeklySessions: totalSessions,
      dailyDistribution: dailySessions,
      restSchedule,
      totalWeeklyHours: this.calculateTotalWeeklyHours(dailySessions),
      restHoursAllocated: restHours,
      energyBalance: this.calculateEnergyBalance(dailySessions)
    };
  }

  // =============================================================================
  // DATABASE OPERATIONS
  // =============================================================================

  /**
   * Get current user progress across all 12 training categories
   * @param {string} userId - User ID
   * @returns {Object} Current progress data
   */
  async getCurrentProgress(userId) {
    const query = `
      SELECT 
        cpt.category_id,
        etc.name as category_name,
        cpt.sessions_completed,
        cpt.total_sessions_attempted,
        cpt.current_proficiency,
        cpt.average_session_quality,
        cpt.consistency_score,
        cpt.la28_readiness_score,
        etc.la28_weekly_target,
        etc.la28_total_sessions,
        etc.la28_minimum_proficiency
      FROM category_progress_tracking cpt
      JOIN enhanced_training_categories etc ON cpt.category_id = etc.id
      WHERE cpt.user_id = $1
      AND cpt.assessment_date = (
        SELECT MAX(assessment_date) 
        FROM category_progress_tracking 
        WHERE user_id = $1 AND category_id = cpt.category_id
      )
    `;
    
    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Save prediction results to database
   * @param {string} userId - User ID
   * @param {Object} predictions - Prediction results
   * @returns {Object} Saved prediction data
   */
  async savePredictionResults(userId, predictions) {
    const query = `
      INSERT INTO training_progress_predictions (
        user_id, prediction_date, target_date, weeks_remaining,
        current_week, current_total_sessions, current_proficiency,
        predicted_sessions_by_target, predicted_proficiency_by_target,
        confidence_level, fatigue_correction, recovery_correction,
        plateau_correction, synergy_correction,
        recommended_weekly_sessions, recommended_rest_days,
        recommended_intensity_adjustment
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `;
    
    const values = [
      userId,
      new Date(),
      this.LA28_DATE,
      predictions.weeksRemaining,
      predictions.currentWeek,
      predictions.currentTotalSessions,
      predictions.currentProficiency,
      predictions.predictedSessions,
      predictions.predictedProficiency,
      predictions.confidenceLevel,
      predictions.fatigueCorrection,
      predictions.recoveryCorrection,
      predictions.plateauCorrection,
      predictions.synergyCorrection,
      predictions.recommendedWeeklySessions,
      predictions.recommendedRestDays,
      predictions.recommendedIntensityAdjustment
    ];
    
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  /**
   * Distribute sessions across the week optimally
   * @param {number} totalSessions - Total sessions per week
   * @returns {Object} Daily session distribution
   */
  distributeSessionsAcrossWeek(totalSessions) {
    // Optimal distribution considering rest requirements
    const distribution = {
      monday: Math.ceil(totalSessions * 0.2),
      tuesday: Math.ceil(totalSessions * 0.15),
      wednesday: Math.ceil(totalSessions * 0.2),
      thursday: Math.ceil(totalSessions * 0.15),
      friday: Math.ceil(totalSessions * 0.15),
      saturday: Math.ceil(totalSessions * 0.1),
      sunday: Math.ceil(totalSessions * 0.05)
    };
    
    // Ensure total doesn't exceed target
    const total = Object.values(distribution).reduce((sum, val) => sum + val, 0);
    if (total > totalSessions) {
      const excess = total - totalSessions;
      // Reduce from highest days
      if (distribution.monday > 0) distribution.monday = Math.max(0, distribution.monday - Math.ceil(excess * 0.4));
      if (distribution.wednesday > 0) distribution.wednesday = Math.max(0, distribution.wednesday - Math.ceil(excess * 0.4));
      if (distribution.tuesday > 0) distribution.tuesday = Math.max(0, distribution.tuesday - Math.ceil(excess * 0.2));
    }
    
    return distribution;
  }

  /**
   * Calculate rest schedule based on training intensity
   * @param {Object} dailySessions - Daily session distribution
   * @param {number} requiredRestHours - Required rest hours per week
   * @returns {Object} Rest schedule
   */
  calculateRestSchedule(dailySessions, requiredRestHours) {
    const restSchedule = {};
    const totalSessions = Object.values(dailySessions).reduce((sum, val) => sum + val, 0);
    
    // Distribute rest hours based on training intensity
    Object.keys(dailySessions).forEach(day => {
      const sessions = dailySessions[day];
      const intensity = sessions / totalSessions;
      restSchedule[day] = Math.round(requiredRestHours * intensity);
    });
    
    return restSchedule;
  }

  /**
   * Calculate total weekly training hours
   * @param {Object} dailySessions - Daily session distribution
   * @returns {number} Total weekly hours
   */
  calculateTotalWeeklyHours(dailySessions) {
    const averageSessionHours = 1.5; // Average 1.5 hours per session
    const totalSessions = Object.values(dailySessions).reduce((sum, val) => sum + val, 0);
    return totalSessions * averageSessionHours;
  }

  /**
   * Calculate energy balance for the week
   * @param {Object} dailySessions - Daily session distribution
   * @returns {Object} Energy balance metrics
   */
  calculateEnergyBalance(dailySessions) {
    const maxDailyEnergy = 10; // Maximum energy units per day
    const sessionEnergyCost = 2; // Energy cost per session
    
    const dailyEnergy = {};
    let totalEnergyUsed = 0;
    
    Object.keys(dailySessions).forEach(day => {
      const sessions = dailySessions[day];
      const energyUsed = sessions * sessionEnergyCost;
      dailyEnergy[day] = {
        sessions,
        energyUsed,
        energyRemaining: Math.max(0, maxDailyEnergy - energyUsed)
      };
      totalEnergyUsed += energyUsed;
    });
    
    return {
      dailyEnergy,
      totalEnergyUsed,
      averageDailyEnergy: totalEnergyUsed / 7,
      energyBalance: totalEnergyUsed <= (maxDailyEnergy * 7) ? 'balanced' : 'overloaded'
    };
  }

  /**
   * Generate recommendations based on predictions
   * @param {Object} predictions - Prediction results
   * @param {number} weeksRemaining - Weeks until LA28
   * @returns {Object} Recommendations
   */
  generateRecommendations(predictions, weeksRemaining) {
    const recommendations = {
      weeklySessions: Math.min(7, Math.max(3, predictions.requiredSessions)),
      restDays: Math.max(1, Math.ceil(7 - predictions.requiredSessions / 2)),
      intensityAdjustment: this.calculateIntensityAdjustment(predictions),
      criticalAreas: this.identifyCriticalAreas(predictions),
      timeline: this.generateTimeline(weeksRemaining, predictions)
    };
    
    return recommendations;
  }

  /**
   * Calculate confidence level for predictions
   * @param {Object} predictions - Prediction results
   * @returns {number} Confidence level (0-1)
   */
  calculateConfidenceLevel(predictions) {
    const factors = [
      predictions.consistencyScore || 0.5,
      predictions.averageQuality || 0.5,
      1 - Math.abs(predictions.fatigueCorrection - 1),
      1 - Math.abs(predictions.recoveryCorrection - 1)
    ];
    
    return factors.reduce((sum, factor) => sum + factor, 0) / factors.length;
  }

  /**
   * Calculate intensity adjustment factor
   * @param {Object} predictions - Prediction results
   * @returns {number} Intensity adjustment (0-1)
   */
  calculateIntensityAdjustment(predictions) {
    const baseIntensity = 0.7;
    const proficiencyGap = predictions.targetProficiency - predictions.currentProficiency;
    const timePressure = Math.min(1, 156 / predictions.weeksRemaining); // 156 weeks = 3 years
    
    return Math.min(1, baseIntensity + (proficiencyGap * 0.001) + (timePressure * 0.2));
  }

  /**
   * Identify critical training areas
   * @param {Object} predictions - Prediction results
   * @returns {Array} Critical areas requiring attention
   */
  identifyCriticalAreas(predictions) {
    const criticalAreas = [];
    
    if (predictions.currentProficiency < 60) {
      criticalAreas.push('foundation_building');
    }
    if (predictions.fatigueCorrection < 0.8) {
      criticalAreas.push('recovery_optimization');
    }
    if (predictions.consistencyScore < 0.7) {
      criticalAreas.push('consistency_improvement');
    }
    if (predictions.weeksRemaining < 52) {
      criticalAreas.push('time_optimization');
    }
    
    return criticalAreas;
  }

  /**
   * Generate timeline for LA28 preparation
   * @param {number} weeksRemaining - Weeks until LA28
   * @param {Object} predictions - Prediction results
   * @returns {Object} Timeline phases
   */
  generateTimeline(weeksRemaining, predictions) {
    const timeline = {
      phase1: { name: 'Foundation Building', weeks: Math.ceil(weeksRemaining * 0.3) },
      phase2: { name: 'Skill Development', weeks: Math.ceil(weeksRemaining * 0.4) },
      phase3: { name: 'Performance Optimization', weeks: Math.ceil(weeksRemaining * 0.2) },
      phase4: { name: 'Peak Preparation', weeks: Math.ceil(weeksRemaining * 0.1) }
    };
    
    return timeline;
  }
}

export default TrainingPredictionService; 