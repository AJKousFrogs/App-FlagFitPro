// Personalization Service
// Enriches chatbot questions with user profile data (body metrics, injuries, training schedule, position)

const logger = window.logger || {
  error: (...args) => console.error(...args),
  warn: (...args) => console.warn(...args),
  info: (...args) => console.info(...args),
  debug: (...args) => console.debug(...args),
};

class PersonalizationService {
  constructor(userId) {
    this.userId = userId;
    this.profileCache = null;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
  }

  /**
   * Get comprehensive user profile including body metrics, injuries, and training data
   */
  async getUserProfile() {
    // Return cached profile if still valid
    if (this.profileCache && Date.now() - this.profileCache.timestamp < this.cacheTimeout) {
      return this.profileCache.data;
    }

    try {
      const authToken = await this.getAuthToken();
      if (!authToken) {
        logger.debug('No auth token available for profile fetch');
        return null;
      }

      const response = await fetch('/.netlify/functions/user-profile?userId=' + encodeURIComponent(this.userId), {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          this.profileCache = {
            data: result.data,
            timestamp: Date.now()
          };
          return result.data;
        }
      }
    } catch (error) {
      logger.error('Failed to load user profile:', error);
    }

    return null;
  }

  /**
   * Enrich parsed question with user profile data
   * Adds body metrics, injury history, position, and training schedule context
   */
  async enrichQuestion(parsedQuestion) {
    if (!parsedQuestion) {
      return parsedQuestion;
    }

    const profile = await this.getUserProfile();
    if (!profile) {
      return parsedQuestion; // Return unchanged if no profile
    }

    // Ensure entities object exists
    if (!parsedQuestion.entities) {
      parsedQuestion.entities = {};
    }

    // Add body metrics if not already in question
    if (!parsedQuestion.entities.bodyStats) {
      parsedQuestion.entities.bodyStats = {};
    }

    // Add height if available and not already parsed
    if (profile.height_cm && !parsedQuestion.entities.bodyStats.height) {
      parsedQuestion.entities.bodyStats.height = parseFloat(profile.height_cm);
    }

    // Add weight if available and not already parsed
    if (profile.weight_kg && !parsedQuestion.entities.bodyStats.weight) {
      parsedQuestion.entities.bodyStats.weight = parseFloat(profile.weight_kg);
    }

    // Add age if available (calculate from birth_date)
    if (profile.birth_date && !parsedQuestion.entities.bodyStats.age) {
      const birthDate = new Date(profile.birth_date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        parsedQuestion.entities.bodyStats.age = age - 1;
      } else {
        parsedQuestion.entities.bodyStats.age = age;
      }
    }

    // Add position context
    if (profile.position && !parsedQuestion.entities.position) {
      parsedQuestion.entities.position = profile.position;
    }

    // Add injury history context
    if (profile.injuries && profile.injuries.length > 0) {
      parsedQuestion.entities.injuryHistory = profile.injuries.map(i => ({
        type: i.type,
        status: i.status,
        severity: i.severity,
        startDate: i.start_date,
        recoveryDate: i.recovery_date
      }));

      // Add active injuries flag
      const activeInjuries = profile.injuries.filter(i => 
        ['active', 'recovering', 'monitoring'].includes(i.status)
      );
      parsedQuestion.entities.hasActiveInjuries = activeInjuries.length > 0;
      parsedQuestion.entities.activeInjuries = activeInjuries;
    }

    // Add training schedule context
    if (profile.trainingFrequency !== undefined || profile.typicalDuration) {
      parsedQuestion.entities.trainingSchedule = {
        frequency: profile.trainingFrequency || 0, // Sessions per week (last 30 days)
        typicalDuration: profile.typicalDuration || null, // Average duration in minutes
        avgIntensity: profile.avgIntensity || null, // Average intensity level
        recentSessions: profile.recentSessions || [] // Recent session types
      };
    }

    // Add experience level
    if (profile.experience_level && !parsedQuestion.entities.experienceLevel) {
      parsedQuestion.entities.experienceLevel = profile.experience_level;
    }

    return parsedQuestion;
  }

  /**
   * Generate personalized recommendations based on profile
   */
  generatePersonalizedRecommendations(parsedQuestion, baseAnswer) {
    if (!parsedQuestion || !parsedQuestion.entities) {
      return baseAnswer;
    }

    const { bodyStats, position, injuryHistory, trainingSchedule, hasActiveInjuries, activeInjuries } = parsedQuestion.entities;
    
    let personalized = baseAnswer;

    // Injury-aware recommendations
    if (hasActiveInjuries && activeInjuries && activeInjuries.length > 0) {
      personalized += this.getInjuryAwareAdvice(activeInjuries, parsedQuestion.intent, parsedQuestion.entities);
    }

    // Training schedule-aware recommendations
    if (trainingSchedule) {
      personalized += this.getScheduleAwareAdvice(trainingSchedule, parsedQuestion.intent);
    }

    // Body metrics-aware recommendations (for nutrition questions)
    if (bodyStats && (parsedQuestion.intent === 'dosage' || parsedQuestion.entities.supplements?.length > 0)) {
      personalized += this.getBodyMetricsAdvice(bodyStats, parsedQuestion);
    }

    return personalized;
  }

  /**
   * Get injury-aware advice based on active injuries
   */
  getInjuryAwareAdvice(activeInjuries, intent, entities) {
    const injuryTypes = activeInjuries.map(i => i.type.toLowerCase());
    const injuryList = activeInjuries.map(i => i.type).join(', ');
    
    let advice = '\n\n**⚠️ Injury Considerations:**\n';
    advice += `Based on your current injuries (${injuryList}), please consider:\n\n`;

    // Check if question is about something that could affect injuries
    const questionAboutInjury = entities.injuries?.some(i => 
      injuryTypes.some(it => i.toLowerCase().includes(it) || it.includes(i.toLowerCase()))
    );

    if (questionAboutInjury) {
      advice += '• This topic directly relates to your current injury status\n';
      advice += '• Consult with your healthcare provider before starting any new protocols\n';
      advice += '• Start with lower intensity and gradually progress\n';
      advice += '• Monitor pain levels and stop if pain increases\n';
    } else {
      // General injury considerations
      advice += '• Be cautious with exercises that stress these areas\n';
      advice += '• Modify protocols to avoid aggravating current injuries\n';
      advice += '• Focus on recovery and rehabilitation exercises\n';
      advice += '• Consider consulting a healthcare provider before starting new training\n';
    }

    // Specific injury advice
    if (injuryTypes.some(it => it.includes('ankle'))) {
      advice += '\n**Ankle-Specific:**\n';
      advice += '• Avoid high-impact activities until cleared\n';
      advice += '• Focus on balance and proprioception exercises\n';
      advice += '• Use ankle support if recommended by healthcare provider\n';
    }

    if (injuryTypes.some(it => it.includes('hamstring') || it.includes('hamstring'))) {
      advice += '\n**Hamstring-Specific:**\n';
      advice += '• Avoid explosive sprinting until fully recovered\n';
      advice += '• Focus on eccentric strengthening\n';
      advice += '• Gradually increase running volume\n';
    }

    if (injuryTypes.some(it => it.includes('shoulder'))) {
      advice += '\n**Shoulder-Specific:**\n';
      advice += '• Avoid overhead movements if painful\n';
      advice += '• Focus on rotator cuff strengthening\n';
      advice += '• Maintain range of motion with gentle stretching\n';
    }

    if (injuryTypes.some(it => it.includes('knee'))) {
      advice += '\n**Knee-Specific:**\n';
      advice += '• Avoid deep squats and high-impact jumping\n';
      advice += '• Focus on quad and glute strengthening\n';
      advice += '• Use proper landing mechanics when cleared\n';
    }

    advice += '\n**Important:** Always prioritize recovery and follow your healthcare provider\'s recommendations.';

    return advice;
  }

  /**
   * Get training schedule-aware advice
   */
  getScheduleAwareAdvice(schedule, intent) {
    const { frequency, typicalDuration, avgIntensity } = schedule;
    let advice = '';

    if (intent === 'protocol' || intent === 'how_to') {
      if (frequency < 3) {
        advice += '\n\n**📅 Schedule Note:**\n';
        advice += `With your current training frequency (${frequency} sessions/week), focus on:\n`;
        advice += '• Quality over quantity - make each session count\n';
        advice += '• Ensure adequate recovery between sessions\n';
        advice += '• Consider adding 1-2 more sessions per week if your schedule allows\n';
        advice += '• Focus on consistency rather than intensity\n';
      } else if (frequency >= 5) {
        advice += '\n\n**📅 High-Volume Training:**\n';
        advice += `With ${frequency} sessions per week, prioritize:\n`;
        advice += '• Recovery strategies between sessions\n';
        advice += '• Sleep quality and nutrition\n';
        advice += '• Periodization to avoid overtraining\n';
        advice += '• Listen to your body and take rest days when needed\n';
      }

      if (typicalDuration && typicalDuration < 30) {
        advice += '\n\n**⏱️ Session Duration:**\n';
        advice += 'Your sessions are relatively short. Consider:\n';
        advice += '• Extending warm-up and cool-down periods\n';
        advice += '• Focusing on high-intensity, efficient workouts\n';
        advice += '• Ensuring adequate volume within time constraints\n';
      }
    }

    if (intent === 'recovery' || intent === 'protocol') {
      if (avgIntensity && avgIntensity >= 8) {
        advice += '\n\n**🔥 High Intensity Training:**\n';
        advice += 'With high-intensity sessions, ensure:\n';
        advice += '• 48-72 hours recovery between intense sessions\n';
        advice += '• Active recovery on off days\n';
        advice += '• Proper nutrition and hydration\n';
        advice += '• Quality sleep (7-9 hours)\n';
      }
    }

    return advice;
  }

  /**
   * Get body metrics-aware advice (for nutrition questions)
   */
  getBodyMetricsAdvice(bodyStats, parsedQuestion) {
    const { height, weight, age } = bodyStats;
    let advice = '';

    // Only add if we have meaningful data
    if (weight && parsedQuestion.entities.supplements?.length > 0) {
      const supplement = parsedQuestion.entities.supplements[0].toLowerCase();
      
      if (supplement === 'protein' && weight) {
        const proteinPerKg = 1.6; // g/kg for athletes
        const dailyProtein = Math.round(weight * proteinPerKg);
        advice += `\n\n**📊 Personalized Protein Recommendation:**\n`;
        advice += `Based on your weight (${weight}kg), aim for **${dailyProtein}g of protein per day**.\n`;
        advice += `• Spread across 4-5 meals: ~${Math.round(dailyProtein / 4)}g per meal\n`;
        advice += `• Post-workout: 20-30g within 30 minutes\n`;
        advice += `• Pre-sleep: 20-30g casein protein\n`;
      }

      if (supplement === 'iron' && (height || weight)) {
        const baseIron = 8; // Base RDA for adult males
        const athleteMultiplier = 1.5;
        const recommended = Math.round(baseIron * athleteMultiplier);
        advice += `\n\n**📊 Personalized Iron Recommendation:**\n`;
        advice += `Based on your profile, aim for **${recommended}mg of iron per day**.\n`;
        advice += `• Get from food sources first: lean red meat, dark poultry, beans, lentils\n`;
        advice += `• Pair with vitamin C to enhance absorption\n`;
        advice += `• Avoid taking with coffee/tea or calcium supplements\n`;
      }
    }

    return advice;
  }

  /**
   * Clear profile cache (useful when profile is updated)
   */
  clearCache() {
    this.profileCache = null;
  }

  /**
   * Get auth token from secure storage
   * Upgraded to use secureStorage API with AES-GCM encryption
   */
  async getAuthToken() {
    try {
      // First, try to use secureStorage API (preferred method)
      if (window.secureStorage && typeof window.secureStorage.getAuthToken === 'function') {
        try {
          const token = await window.secureStorage.getAuthToken();
          if (token) {
            return token;
          }
        } catch (error) {
          logger.debug("Secure storage getAuthToken failed, trying fallback:", error);
        }
      }

      // Fallback: Try to get from localStorage (legacy support)
      const authData = localStorage.getItem('auth');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.token || parsed.access_token || null;
      }

      // Fallback: Try to get from sessionStorage (legacy support)
      const sessionAuth = sessionStorage.getItem('auth');
      if (sessionAuth) {
        const parsed = JSON.parse(sessionAuth);
        return parsed.token || parsed.access_token || null;
      }

      // Fallback: Try to get from window if available
      if (window.auth && window.auth.token) {
        return window.auth.token;
      }

      return null;
    } catch (error) {
      logger.debug("Error getting auth token:", error);
      return null;
    }
  }
}

export { PersonalizationService };

