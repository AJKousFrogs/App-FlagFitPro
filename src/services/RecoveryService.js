

class RecoveryService {
  constructor(database) {
    this.db = database;
  }

  // Calculate comprehensive recovery score
  static async calculateRecoveryScore(userId, date = new Date()) {
    try {
      const dateStr = date.toISOString().split('T')[0];

      // Get sleep data
      const sleepQuery = `
        SELECT 
          sleep_efficiency, sleep_quality_rating, total_sleep_time_minutes,
          morning_energy_level, muscle_soreness_level, stress_level
        FROM user_sleep_sessions 
        WHERE user_id = $1 AND sleep_date = $2
      `;
      const sleepResult = await this.db.query(sleepQuery, [userId, dateStr]);

      // Get wellness metrics
      const wellnessQuery = `
        SELECT 
          overall_wellness, energy_level, muscle_soreness, stress_level,
          readiness_to_train, resting_heart_rate, heart_rate_variability
        FROM daily_wellness_metrics 
        WHERE user_id = $1 AND metric_date = $2
      `;
      const wellnessResult = await this.db.query(wellnessQuery, [userId, dateStr]);

      // Get recent training load (last 7 days)
      const trainingLoadQuery = `
        SELECT 
          COUNT(*) as sessions_count,
          AVG(intensity_level::numeric) as avg_intensity,
          SUM(duration_minutes) as total_minutes,
          MAX(session_date) as last_training_date
        FROM training_sessions 
        WHERE user_id = $1 
          AND session_date >= $2::date - INTERVAL '7 days'
          AND session_date < $2::date
      `;
      const trainingLoadResult = await this.db.query(trainingLoadQuery, [userId, dateStr]);

      // Calculate component scores (0-100 scale)
      const sleepScore = this.calculateSleepScore(sleepResult.rows[0]);
      const wellnessScore = this.calculateWellnessScore(wellnessResult.rows[0]);
      const trainingLoadScore = this.calculateTrainingLoadScore(trainingLoadResult.rows[0]);

      // Weighted recovery score
      const recoveryScore = Math.round(
        (sleepScore * 0.4) + 
        (wellnessScore * 0.4) + 
        (trainingLoadScore * 0.2)
      );

      return {
        overall_score: recoveryScore,
        components: {
          sleep: {
            score: sleepScore,
            data: sleepResult.rows[0]
          },
          wellness: {
            score: wellnessScore,
            data: wellnessResult.rows[0]
          },
          training_load: {
            score: trainingLoadScore,
            data: trainingLoadResult.rows[0]
          }
        },
        interpretation: this.interpretRecoveryScore(recoveryScore),
        recommendations: await this.generateRecoveryRecommendations(userId, recoveryScore, {
          sleep: sleepResult.rows[0],
          wellness: wellnessResult.rows[0],
          trainingLoad: trainingLoadResult.rows[0]
        })
      };
    } catch (error) {
      console.error('Error calculating recovery score:', error);
      throw error;
    }
  }

  static calculateSleepScore(sleepData) {
    if (!sleepData) return 50; // neutral score if no data

    const {
      sleep_efficiency, sleep_quality_rating, total_sleep_time_minutes,
      morning_energy_level
    } = sleepData;

    let score = 0;
    let components = 0;

    // Sleep efficiency (optimal: 85-95%)
    if (sleep_efficiency) {
      if (sleep_efficiency >= 85 && sleep_efficiency <= 95) score += 25;
      else if (sleep_efficiency >= 80) score += 20;
      else if (sleep_efficiency >= 70) score += 15;
      else score += 10;
      components++;
    }

    // Sleep duration (optimal: 7-9 hours for athletes)
    if (total_sleep_time_minutes) {
      const hours = total_sleep_time_minutes / 60;
      if (hours >= 7 && hours <= 9) score += 25;
      else if (hours >= 6 && hours <= 10) score += 20;
      else if (hours >= 5) score += 15;
      else score += 10;
      components++;
    }

    // Subjective sleep quality (1-10 scale)
    if (sleep_quality_rating) {
      score += (sleep_quality_rating / 10) * 25;
      components++;
    }

    // Morning indicators
    if (morning_energy_level) {
      score += (morning_energy_level / 10) * 25;
      components++;
    }

    return components > 0 ? Math.round(score / components * 4) : 50;
  }

  static calculateWellnessScore(wellnessData) {
    if (!wellnessData) return 50;

    const {
      overall_wellness, energy_level, muscle_soreness, stress_level,
      readiness_to_train, heart_rate_variability
    } = wellnessData;

    let score = 0;
    let components = 0;

    // Subjective wellness metrics (higher is better, except soreness and stress)
    [overall_wellness, energy_level, readiness_to_train].forEach(metric => {
      if (metric !== null) {
        score += (metric / 10) * 100;
        components++;
      }
    });

    // Inverse metrics (lower is better)
    [muscle_soreness, stress_level].forEach(metric => {
      if (metric !== null) {
        score += ((10 - metric) / 10) * 100;
        components++;
      }
    });

    // HRV (if available, higher typically better for recovery)
    if (heart_rate_variability) {
      // Normalize HRV score (this would need individual baseline)
      // For now, use general ranges
      if (heart_rate_variability >= 50) score += 100;
      else if (heart_rate_variability >= 30) score += 80;
      else if (heart_rate_variability >= 20) score += 60;
      else score += 40;
      components++;
    }

    return components > 0 ? Math.round(score / components) : 50;
  }

  static calculateTrainingLoadScore(trainingData) {
    if (!trainingData) return 75; // assume moderate if no data

    const { sessions_count, avg_intensity, total_minutes, last_training_date } = trainingData;

    // Calculate training stress
    const weeklyVolume = total_minutes || 0;
    const avgIntensity = avg_intensity || 0;
    const sessionCount = sessions_count || 0;

    // Optimal ranges for recovery
    let score = 100;

    // Volume check (too much volume reduces recovery)
    if (weeklyVolume > 600) score -= 20; // > 10 hours
    else if (weeklyVolume > 450) score -= 10; // 7.5-10 hours

    // Intensity check
    if (avgIntensity > 8) score -= 20; // very high intensity
    else if (avgIntensity > 6) score -= 10; // high intensity

    // Frequency check
    if (sessionCount > 6) score -= 15; // training every day
    else if (sessionCount > 4) score -= 5; // 5-6 sessions

    // Time since last training (recovery window)
    if (last_training_date) {
      const daysSinceTraining = Math.floor(
        (Date.now() - new Date(last_training_date).getTime()) / (24 * 60 * 60 * 1000)
      );
      if (daysSinceTraining === 0) score -= 10; // trained today
      else if (daysSinceTraining >= 2) score += 10; // good recovery time
    }

    return Math.max(0, Math.min(100, score));
  }

  static interpretRecoveryScore(score) {
    if (score >= 90) return { level: 'Excellent', description: 'Fully recovered and ready for high-intensity training' };
    if (score >= 80) return { level: 'Good', description: 'Well recovered, can handle moderate to high intensity' };
    if (score >= 70) return { level: 'Fair', description: 'Adequate recovery, focus on moderate intensity' };
    if (score >= 60) return { level: 'Poor', description: 'Limited recovery, consider light training or rest' };
    return { level: 'Very Poor', description: 'Significant fatigue, prioritize rest and recovery' };
  }

  // Log a recovery session
  static async logRecoverySession(sessionData) {
    try {
      const {
        userId, teamId, sessionDate, startTime, endTime, recoveryType,
        intensityLevel, activities, location, equipmentUsed, 
        preSessions, postSessions, effectivenessRating,
        relatedTrainingSessionId, notes
      } = sessionData;

      const duration = endTime ? 
        Math.round((new Date(endTime) - new Date(startTime)) / (1000 * 60)) : null;

      const query = `
        INSERT INTO recovery_sessions (
          user_id, team_id, session_date, start_time, end_time, duration_minutes,
          recovery_type, intensity_level, activities, location, equipment_used,
          pre_session_soreness, pre_session_stiffness, pre_session_energy,
          post_session_soreness, post_session_stiffness, post_session_energy,
          effectiveness_rating, related_training_session_id, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        RETURNING *
      `;

      const result = await this.db.query(query, [
        userId, teamId, sessionDate, startTime, endTime, duration,
        recoveryType, intensityLevel, JSON.stringify(activities), location,
        equipmentUsed, preSessions.soreness, preSessions.stiffness, preSessions.energy,
        postSessions.soreness, postSessions.stiffness, postSessions.energy,
        effectivenessRating, relatedTrainingSessionId, notes
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Error logging recovery session:', error);
      throw error;
    }
  }

  // Log daily wellness metrics
  static async logWellnessMetrics(userId, metrics) {
    try {
      const {
        metricDate, overallWellness, energyLevel, muscleSoreness, stressLevel,
        motivationLevel, readinessToTrain, injuryConcerns, painAreas, painLevels,
        moodRating, focusLevel, anxietyLevel, restingHeartRate, heartRateVariability,
        bodyWeight, bodyFatPercentage, urineColor, thirstLevel, notes
      } = metrics;

      const query = `
        INSERT INTO daily_wellness_metrics (
          user_id, metric_date, overall_wellness, energy_level, muscle_soreness,
          stress_level, motivation_level, readiness_to_train, injury_concerns,
          pain_areas, pain_levels, mood_rating, focus_level, anxiety_level,
          resting_heart_rate, heart_rate_variability, body_weight_kg, 
          body_fat_percentage, urine_color, thirst_level, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        ON CONFLICT (user_id, metric_date) DO UPDATE SET
          overall_wellness = EXCLUDED.overall_wellness,
          energy_level = EXCLUDED.energy_level,
          muscle_soreness = EXCLUDED.muscle_soreness,
          stress_level = EXCLUDED.stress_level,
          motivation_level = EXCLUDED.motivation_level,
          readiness_to_train = EXCLUDED.readiness_to_train,
          injury_concerns = EXCLUDED.injury_concerns,
          pain_areas = EXCLUDED.pain_areas,
          pain_levels = EXCLUDED.pain_levels,
          mood_rating = EXCLUDED.mood_rating,
          focus_level = EXCLUDED.focus_level,
          anxiety_level = EXCLUDED.anxiety_level,
          resting_heart_rate = EXCLUDED.resting_heart_rate,
          heart_rate_variability = EXCLUDED.heart_rate_variability,
          body_weight_kg = EXCLUDED.body_weight_kg,
          body_fat_percentage = EXCLUDED.body_fat_percentage,
          urine_color = EXCLUDED.urine_color,
          thirst_level = EXCLUDED.thirst_level,
          notes = EXCLUDED.notes,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;

      const result = await this.db.query(query, [
        userId, metricDate, overallWellness, energyLevel, muscleSoreness,
        stressLevel, motivationLevel, readinessToTrain, injuryConcerns,
        painAreas, JSON.stringify(painLevels), moodRating, focusLevel,
        anxietyLevel, restingHeartRate, heartRateVariability, bodyWeight,
        bodyFatPercentage, urineColor, thirstLevel, notes
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Error logging wellness metrics:', error);
      throw error;
    }
  }

  // Generate recovery recommendations
  static async generateRecoveryRecommendations(userId, recoveryScore, data) {
    try {
      const recommendations = [];
      
      // Sleep-based recommendations
      if (data.sleep) {
        if (data.sleep.sleep_efficiency < 80) {
          recommendations.push({
            type: 'sleep_optimization',
            priority: 'high',
            title: 'Improve Sleep Efficiency',
            description: 'Focus on sleep hygiene to increase time actually sleeping in bed',
            actions: [
              'Establish consistent bedtime routine',
              'Limit screen time 1 hour before bed',
              'Keep bedroom cool (65-68°F)',
              'Consider white noise or blackout curtains'
            ]
          });
        }

        if (data.sleep.total_sleep_time_minutes < 420) { // < 7 hours
          recommendations.push({
            type: 'sleep_duration',
            priority: 'high',
            title: 'Increase Sleep Duration',
            description: 'Athletes need 7-9 hours of sleep for optimal recovery',
            actions: [
              'Go to bed 30 minutes earlier',
              'Schedule morning commitments later if possible',
              'Avoid caffeine after 2 PM',
              'Create a pre-sleep routine to wind down faster'
            ]
          });
        }
      }

      // Wellness-based recommendations
      if (data.wellness) {
        if (data.wellness.muscle_soreness >= 7) {
          recommendations.push({
            type: 'muscle_recovery',
            priority: 'medium',
            title: 'Address Muscle Soreness',
            description: 'High soreness levels indicate need for active recovery',
            actions: [
              'Perform gentle stretching or yoga',
              'Use foam roller for 10-15 minutes',
              'Consider massage or percussion therapy',
              'Take a warm bath with Epsom salts'
            ]
          });
        }

        if (data.wellness.stress_level >= 7) {
          recommendations.push({
            type: 'stress_management',
            priority: 'medium',
            title: 'Manage Stress Levels',
            description: 'High stress impairs recovery and performance',
            actions: [
              'Practice 10 minutes of meditation',
              'Try breathing exercises',
              'Consider light walk outdoors',
              'Talk to coach or counselor if stress persists'
            ]
          });
        }
      }

      // Training load recommendations
      if (data.trainingLoad && data.trainingLoad.sessions_count >= 6) {
        recommendations.push({
          type: 'training_load',
          priority: 'high',
          title: 'Reduce Training Volume',
          description: 'High training frequency may be limiting recovery',
          actions: [
            'Consider adding a complete rest day',
            'Replace one training day with active recovery',
            'Reduce intensity of next training session',
            'Focus on recovery activities today'
          ]
        });
      }

      // Save recommendations to database
      for (const rec of recommendations) {
        await this.saveRecoveryRecommendation(userId, rec, recoveryScore);
      }

      return recommendations;
    } catch (error) {
      console.error('Error generating recovery recommendations:', error);
      throw error;
    }
  }

  static async saveRecoveryRecommendation(userId, recommendation, recoveryScore) {
    try {
      const query = `
        INSERT INTO recovery_recommendations (
          user_id, date_generated, recommendation_type, recovery_score,
          priority_level, title, description, recommended_activities,
          confidence_score, reasoning
        ) VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const result = await this.db.query(query, [
        userId, recommendation.type, recoveryScore, recommendation.priority,
        recommendation.title, recommendation.description, recommendation.actions,
        0.85, `Generated based on recovery score of ${recoveryScore}`
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Error saving recovery recommendation:', error);
      throw error;
    }
  }

  // Get recovery trends over time
  static async getRecoveryTrends(userId, days = 30) {
    try {
      const query = `
        SELECT 
          dwm.metric_date,
          dwm.overall_wellness,
          dwm.energy_level,
          dwm.muscle_soreness,
          dwm.stress_level,
          dwm.readiness_to_train,
          uss.sleep_efficiency,
          uss.total_sleep_time_minutes,
          uss.sleep_quality_rating
        FROM daily_wellness_metrics dwm
        LEFT JOIN user_sleep_sessions uss ON uss.user_id = dwm.user_id 
          AND uss.sleep_date = dwm.metric_date
        WHERE dwm.user_id = $1 
          AND dwm.metric_date >= CURRENT_DATE - INTERVAL '${days} days'
        ORDER BY dwm.metric_date DESC
      `;

      const result = await this.db.query(query, [userId]);
      
      // Calculate daily recovery scores
      const trends = result.rows.map(row => {
        const sleepScore = this.calculateSleepScore({
          sleep_efficiency: row.sleep_efficiency,
          sleep_quality_rating: row.sleep_quality_rating,
          total_sleep_time_minutes: row.total_sleep_time_minutes,
          morning_energy_level: row.energy_level
        });

        const wellnessScore = this.calculateWellnessScore({
          overall_wellness: row.overall_wellness,
          energy_level: row.energy_level,
          muscle_soreness: row.muscle_soreness,
          stress_level: row.stress_level,
          readiness_to_train: row.readiness_to_train
        });

        const overallScore = Math.round((sleepScore * 0.5) + (wellnessScore * 0.5));

        return {
          date: row.metric_date,
          recovery_score: overallScore,
          sleep_score: sleepScore,
          wellness_score: wellnessScore,
          metrics: {
            overall_wellness: row.overall_wellness,
            energy_level: row.energy_level,
            muscle_soreness: row.muscle_soreness,
            stress_level: row.stress_level,
            readiness_to_train: row.readiness_to_train,
            sleep_efficiency: row.sleep_efficiency,
            sleep_hours: row.total_sleep_time_minutes ? row.total_sleep_time_minutes / 60 : null,
            sleep_quality: row.sleep_quality_rating
          }
        };
      });

      return {
        trends,
        summary: {
          avg_recovery_score: trends.reduce((sum, t) => sum + t.recovery_score, 0) / trends.length,
          best_day: trends.reduce((best, current) => 
            current.recovery_score > best.recovery_score ? current : best
          ),
          worst_day: trends.reduce((worst, current) => 
            current.recovery_score < worst.recovery_score ? current : worst
          ),
          trend_direction: this.calculateTrendDirection(trends.map(t => t.recovery_score))
        }
      };
    } catch (error) {
      console.error('Error getting recovery trends:', error);
      throw error;
    }
  }

  static calculateTrendDirection(scores) {
    if (scores.length < 7) return 'insufficient_data';
    
    const recent = scores.slice(0, 7).reduce((a, b) => a + b, 0) / 7;
    const older = scores.slice(-7).reduce((a, b) => a + b, 0) / 7;
    
    const difference = recent - older;
    
    if (difference > 5) return 'improving';
    if (difference < -5) return 'declining';
    return 'stable';
  }
}

module.exports = RecoveryService;