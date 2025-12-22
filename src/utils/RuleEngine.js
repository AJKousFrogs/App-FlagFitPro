// Rule Engine - Data-driven evaluation system
// Eliminates complex if-chains by using polymorphic rule evaluation

import {
  WEATHER_IMPACT_RULES,
  TRAINING_RULES,
  ACTIVITY_MULTIPLIERS,
  CALORIE_MATCH_RATINGS,
  COLOR_SCHEMES,
  CORRELATION_LEVELS,
  SCORE_LEVELS
} from '../config/thresholds';

/**
 * Base Rule Evaluator
 * Evaluates rules against data using functional approach
 */
class RuleEvaluator {
  /**
   * Evaluate a set of rules and return matching results
   * @param {Array} rules - Array of rule objects with condition and impacts
   * @param {*} value - Value to evaluate
   * @returns {Array} Matching rule impacts
   */
  static evaluate(rules, value) {
    return rules
      .filter(rule => rule.condition(value))
      .flatMap(rule => rule.impacts || [rule]);
  }

  /**
   * Find first matching rule
   * @param {Array} rules - Array of rule objects
   * @param {*} value - Value to evaluate
   * @returns {Object|null} First matching rule or null
   */
  static findFirst(rules, value) {
    return rules.find(rule => rule.condition(value)) || null;
  }
}

/**
 * Weather Impact Calculator
 * Strategy pattern for weather condition evaluation
 */
export class WeatherImpactCalculator {
  constructor() {
    this.impactStrategies = {
      temperature: this.evaluateTemperature.bind(this),
      wind: this.evaluateWind.bind(this),
      humidity: this.evaluateHumidity.bind(this),
      precipitation: this.evaluatePrecipitation.bind(this)
    };
  }

  /**
   * Calculate all weather impacts
   * @param {Object} weather - Weather data object
   * @returns {Object} Comprehensive impact analysis
   */
  calculateImpact(weather) {
    const impact = {
      passing: 0,
      running: 0,
      endurance: 0,
      performance: 0,
      injuryRisk: 'Low',
      recommendations: []
    };

    // Early return guard clause
    if (!weather) {return impact;}

    // Apply each strategy
    Object.entries(this.impactStrategies).forEach(([key, strategy]) => {
      strategy(weather, impact);
    });

    // Calculate risk level
    impact.riskLevel = this.calculateRiskLevel(weather);

    return impact;
  }

  evaluateTemperature(weather, impact) {
    const matches = RuleEvaluator.evaluate(
      WEATHER_IMPACT_RULES.temperature,
      weather.temp
    );

    matches.forEach(match => {
      this.applyImpact(impact, match);
    });
  }

  evaluateWind(weather, impact) {
    const matches = RuleEvaluator.evaluate(
      WEATHER_IMPACT_RULES.wind,
      weather.windSpeed
    );

    matches.forEach(match => {
      this.applyImpact(impact, match);
    });
  }

  evaluateHumidity(weather, impact) {
    const matches = RuleEvaluator.evaluate(
      WEATHER_IMPACT_RULES.humidity,
      weather.humidity
    );

    matches.forEach(match => {
      this.applyImpact(impact, match);
    });
  }

  evaluatePrecipitation(weather, impact) {
    const matches = RuleEvaluator.evaluate(
      WEATHER_IMPACT_RULES.precipitation,
      weather.conditions
    );

    matches.forEach(match => {
      this.applyImpact(impact, match);
    });
  }

  applyImpact(impact, match) {
    Object.entries(match).forEach(([key, value]) => {
      if (key === 'recommendations') {
        impact.recommendations.push(...value);
      } else if (typeof value === 'number') {
        impact[key] = (impact[key] || 0) + value;
      } else {
        impact[key] = value;
      }
    });
  }

  calculateRiskLevel(weather) {
    const score = WEATHER_IMPACT_RULES.riskFactors
      .filter(factor => factor.condition(weather.temp || weather.windSpeed || weather.conditions))
      .reduce((sum, factor) => sum + factor.score, 0);

    // Guard clauses for risk level
    if (score >= 5) {return 'High';}
    if (score >= 3) {return 'Medium';}
    return 'Low';
  }
}

/**
 * Training Recommendation Engine
 * Data-driven training prescription based on muscle strength
 */
export class TrainingRecommendationEngine {
  /**
   * Get training recommendations for a specific muscle group
   * @param {string} muscleGroup - Name of muscle group (hamstring, quadriceps, core)
   * @param {number} strength - Current strength level (0-100)
   * @returns {Object} Training recommendations
   */
  static getRecommendations(muscleGroup, strength) {
    // Guard clause - validate input
    if (!TRAINING_RULES[muscleGroup]) {
      return {
        error: `Unknown muscle group: ${muscleGroup}`,
        recommendations: []
      };
    }

    // Guard clause - validate strength
    if (strength < 0 || strength > 100) {
      return {
        error: 'Strength must be between 0 and 100',
        recommendations: []
      };
    }

    const rules = TRAINING_RULES[muscleGroup].thresholds;
    const matchingRule = RuleEvaluator.findFirst(rules, strength);

    // Guard clause - no matching rule
    if (!matchingRule) {
      return {
        severity: 'unknown',
        recommendations: [],
        note: 'No recommendations available'
      };
    }

    return {
      muscleGroup,
      currentStrength: strength,
      ...matchingRule
    };
  }

  /**
   * Get comprehensive training plan for all muscle groups
   * @param {Object} strengthProfile - Object with muscle group strengths
   * @returns {Array} Array of recommendations for each muscle group
   */
  static getComprehensivePlan(strengthProfile) {
    return Object.entries(strengthProfile).map(([muscle, strength]) => ({
      muscle,
      ...this.getRecommendations(muscle, strength)
    }));
  }
}

/**
 * Color/Level Classifier
 * Polymorphic approach to classification using guard clauses
 */
export class Classifier {
  /**
   * Get color based on threshold configuration
   * @param {number} value - Value to classify
   * @param {Array} thresholds - Array of threshold configurations
   * @returns {string} Color code
   */
  static getColorByThreshold(value, thresholds) {
    // Guard clause for invalid input
    if (value === null || value === undefined) {return '#9E9E9E';}

    for (const threshold of thresholds) {
      if (value >= threshold.min) {
        return threshold.color;
      }
    }

    return '#9E9E9E'; // Default gray
  }

  /**
   * Get label based on threshold configuration
   * @param {number} value - Value to classify
   * @param {Array} thresholds - Array of threshold configurations
   * @returns {string} Label
   */
  static getLabelByThreshold(value, thresholds) {
    // Guard clause
    if (value === null || value === undefined) {return 'Unknown';}

    for (const threshold of thresholds) {
      if (value >= threshold.min) {
        return threshold.label;
      }
    }

    return 'Unknown';
  }

  /**
   * Get risk classification
   * @param {number} riskScore - Risk score (0-100)
   * @returns {Object} Risk classification with color and label
   */
  static getRiskLevel(riskScore) {
    const levels = Object.values(COLOR_SCHEMES.risk);

    for (const level of levels) {
      if (riskScore <= level.threshold) {
        return {
          color: level.value,
          label: level.label,
          score: riskScore
        };
      }
    }

    return {
      color: '#9E9E9E',
      label: 'Unknown',
      score: riskScore
    };
  }

  /**
   * Get chemistry level classification
   * @param {number} score - Chemistry score
   * @returns {Object} Chemistry classification
   */
  static getChemistryLevel(score) {
    return {
      color: this.getColorByThreshold(score, Object.values(COLOR_SCHEMES.chemistry)),
      label: this.getLabelByThreshold(score, Object.values(COLOR_SCHEMES.chemistry)),
      score
    };
  }

  /**
   * Get completion level classification
   * @param {number} current - Current value
   * @param {number} target - Target value
   * @returns {Object} Completion classification
   */
  static getCompletionLevel(current, target) {
    // Guard clause
    if (!target || target === 0) {
      return { color: '#9E9E9E', label: 'Unknown', percentage: 0 };
    }

    const percentage = (current / target) * 100;

    return {
      color: this.getColorByThreshold(percentage, Object.values(COLOR_SCHEMES.completion)),
      label: this.getLabelByThreshold(percentage, Object.values(COLOR_SCHEMES.completion)),
      percentage: Math.round(percentage)
    };
  }

  /**
   * Get correlation level
   * @param {number} correlation - Correlation coefficient
   * @returns {Object} Correlation classification
   */
  static getCorrelationLevel(correlation) {
    return {
      color: this.getColorByThreshold(correlation, CORRELATION_LEVELS),
      label: this.getLabelByThreshold(correlation, CORRELATION_LEVELS),
      value: correlation
    };
  }

  /**
   * Get score level
   * @param {number} score - Score value
   * @returns {Object} Score classification
   */
  static getScoreLevel(score) {
    return {
      color: this.getColorByThreshold(score, SCORE_LEVELS),
      label: this.getLabelByThreshold(score, SCORE_LEVELS),
      score
    };
  }
}

/**
 * Activity Level Calculator
 * Uses guard clauses instead of if-else chains
 */
export class ActivityLevelCalculator {
  /**
   * Get activity multiplier based on sessions per week
   * @param {number} sessionsPerWeek - Number of training sessions
   * @returns {Object} Activity level with multiplier and label
   */
  static getActivityLevel(sessionsPerWeek) {
    // Guard clause for invalid input
    if (sessionsPerWeek < 0) {
      return { multiplier: 1.0, label: 'Invalid', sessions: 0 };
    }

    // Find first matching threshold using guard clause pattern
    for (const level of ACTIVITY_MULTIPLIERS) {
      if (sessionsPerWeek >= level.minSessions) {
        return {
          multiplier: level.multiplier,
          label: level.label,
          sessions: sessionsPerWeek
        };
      }
    }

    // Fallback
    return { multiplier: 1.2, label: 'Sedentary', sessions: sessionsPerWeek };
  }
}

/**
 * Calorie Match Evaluator
 * Guard clause pattern for calorie matching
 */
export class CalorieMatchEvaluator {
  /**
   * Evaluate calorie match between template and target
   * @param {number} templateCalories - Template calorie amount
   * @param {number} targetCalories - Target calorie amount
   * @returns {Object} Match evaluation
   */
  static evaluate(templateCalories, targetCalories) {
    // Guard clauses
    if (!templateCalories || !targetCalories) {
      return { rating: 'Unknown', color: '#9E9E9E', difference: 0 };
    }

    if (targetCalories === 0) {
      return { rating: 'Invalid Target', color: '#9E9E9E', difference: 0 };
    }

    const difference = Math.abs(templateCalories - targetCalories);
    const percentageDiff = (difference / targetCalories) * 100;

    // Find matching rating using guard clause
    for (const match of CALORIE_MATCH_RATINGS) {
      if (percentageDiff <= match.threshold) {
        return {
          rating: match.rating,
          color: match.color,
          difference: Math.round(difference),
          percentage: Math.round(percentageDiff)
        };
      }
    }

    // Fallback
    return {
      rating: 'Poor match',
      color: '#9E9E9E',
      difference: Math.round(difference),
      percentage: Math.round(percentageDiff)
    };
  }
}

/**
 * Lookup Helper
 * Simple map-based lookups to replace switch statements
 */
export class LookupHelper {
  /**
   * Get value from lookup map with default fallback
   * @param {Object} map - Lookup map
   * @param {string} key - Lookup key
   * @param {*} defaultValue - Default value if key not found
   * @returns {*} Looked up value or default
   */
  static get(map, key, defaultValue = null) {
    return map[key] ?? defaultValue;
  }

  /**
   * Get value or call default function
   * @param {Object} map - Lookup map
   * @param {string} key - Lookup key
   * @param {Function} defaultFn - Function to call for default
   * @returns {*} Looked up value or function result
   */
  static getOrCompute(map, key, defaultFn) {
    return map[key] ?? defaultFn(key);
  }
}

export default {
  WeatherImpactCalculator,
  TrainingRecommendationEngine,
  Classifier,
  ActivityLevelCalculator,
  CalorieMatchEvaluator,
  LookupHelper
};
