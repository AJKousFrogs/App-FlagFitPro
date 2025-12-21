// Centralized Configuration for Thresholds and Rules
// Data-driven approach to eliminate hardcoded conditionals

/**
 * Color Schemes - Centralized color configuration
 */
export const COLOR_SCHEMES = {
  risk: {
    low: { value: '#10b981', threshold: 25, label: 'Low' },
    moderate: { value: '#f59e0b', threshold: 50, label: 'Moderate' },
    high: { value: '#ef4444', threshold: Infinity, label: 'High' }
  },

  status: {
    excellent: '#4CAF50',
    good: '#2196F3',
    fair: '#FF9800',
    poor: '#F44336',
    unknown: '#9E9E9E'
  },

  difficulty: {
    Beginner: '#4CAF50',
    Intermediate: '#FF9800',
    Advanced: '#F44336',
    default: '#9E9E9E'
  },

  level: {
    Elite: '#FFD700',
    Pro: '#C0C0C0',
    Advanced: '#CD7F32',
    Intermediate: '#4CAF50',
    Beginner: '#2196F3',
    default: '#666'
  },

  severity: {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#3b82f6',
    default: '#6b7280'
  },

  chemistry: {
    excellent: { min: 9.0, color: '#10b981', label: 'Excellent' },
    strong: { min: 8.0, color: '#3b82f6', label: 'Strong' },
    good: { min: 7.0, color: '#f59e0b', label: 'Good' },
    needsWork: { min: 0, color: '#ef4444', label: 'Needs Work' }
  },

  completion: {
    excellent: { min: 95, color: '#10b981', label: 'Excellent' },
    good: { min: 80, color: '#f59e0b', label: 'Good' },
    poor: { min: 0, color: '#ef4444', label: 'Needs Work' }
  }
};

/**
 * Weather Impact Rules - Data-driven weather condition impacts
 */
export const WEATHER_IMPACT_RULES = {
  temperature: [
    {
      condition: (temp) => temp > 85,
      impacts: {
        endurance: -15,
        injuryRisk: 'High',
        recommendations: ['Extra hydration every 15 minutes', 'Monitor for heat exhaustion']
      }
    },
    {
      condition: (temp) => temp < 40,
      impacts: {
        running: -10,
        recommendations: ['Warm up for 20 minutes minimum', 'Layer clothing appropriately']
      }
    },
    {
      condition: (temp) => temp >= 70 && temp <= 75,
      impacts: {
        endurance: 5,
        performance: 5,
        recommendations: ['Ideal conditions for peak performance']
      }
    }
  ],

  wind: [
    {
      condition: (speed) => speed > 15,
      impacts: {
        passing: -20,
        recommendations: ['Adjust passing strategy for wind', 'Focus on running plays']
      }
    },
    {
      condition: (speed) => speed > 10,
      impacts: {
        passing: -10,
        recommendations: ['Consider wind direction in play calling']
      }
    }
  ],

  humidity: [
    {
      condition: (humidity) => humidity > 80,
      impacts: {
        endurance: -10,
        recommendations: ['Monitor hydration levels closely', 'Take more frequent breaks']
      }
    }
  ],

  precipitation: [
    {
      condition: (conditions) => conditions.includes('rain'),
      impacts: {
        passing: -15,
        running: -5,
        recommendations: ['Use weather-appropriate equipment', 'Adjust grip on ball']
      }
    },
    {
      condition: (conditions) => conditions.includes('snow'),
      impacts: {
        passing: -20,
        running: -15,
        recommendations: ['Focus on short passes', 'Wear appropriate footwear']
      }
    }
  ],

  riskFactors: [
    { condition: (temp) => temp > 90 || temp < 35, score: 3 },
    { condition: (wind) => wind > 20, score: 2 },
    { condition: (conditions) => conditions.includes('thunderstorm'), score: 3 },
    { condition: (conditions) => conditions.includes('snow'), score: 2 }
  ]
};

/**
 * Training Rules - Muscle strength thresholds and recommendations
 */
export const TRAINING_RULES = {
  hamstring: {
    thresholds: [
      {
        condition: (strength) => strength < 60,
        severity: 'high',
        recommendations: [
          { exercise: 'Nordic Hamstring Curls', sets: 3, reps: 8 },
          { exercise: 'Romanian Deadlifts', sets: 3, reps: 10 },
          { exercise: 'Swiss Ball Hamstring Curls', sets: 3, reps: 12 }
        ],
        frequency: '4x per week',
        injuryRisk: 'High - Immediate attention required'
      },
      {
        condition: (strength) => strength >= 60 && strength < 75,
        severity: 'medium',
        recommendations: [
          { exercise: 'Single-leg Romanian Deadlifts', sets: 3, reps: 10 },
          { exercise: 'Hamstring Curls', sets: 3, reps: 12 }
        ],
        frequency: '3x per week',
        injuryRisk: 'Moderate - Preventive training recommended'
      },
      {
        condition: (strength) => strength >= 75,
        severity: 'low',
        recommendations: [
          { exercise: 'Maintenance Hamstring Curls', sets: 2, reps: 12 }
        ],
        frequency: '2x per week',
        injuryRisk: 'Low - Maintain current level'
      }
    ]
  },

  quadriceps: {
    thresholds: [
      {
        condition: (strength) => strength < 65,
        severity: 'high',
        recommendations: [
          { exercise: 'Front Squats', sets: 4, reps: 8 },
          { exercise: 'Bulgarian Split Squats', sets: 3, reps: 10 },
          { exercise: 'Leg Press', sets: 3, reps: 12 }
        ],
        frequency: '3-4x per week'
      },
      {
        condition: (strength) => strength >= 65 && strength < 80,
        severity: 'medium',
        recommendations: [
          { exercise: 'Squats', sets: 3, reps: 10 },
          { exercise: 'Lunges', sets: 3, reps: 12 }
        ],
        frequency: '2-3x per week'
      }
    ]
  },

  core: {
    thresholds: [
      {
        condition: (stability) => stability < 70,
        severity: 'high',
        recommendations: [
          { exercise: 'Plank Variations', duration: '3 x 60s' },
          { exercise: 'Dead Bugs', sets: 3, reps: 15 },
          { exercise: 'Pallof Press', sets: 3, reps: 12 }
        ],
        frequency: '5x per week',
        note: 'Core stability critical for injury prevention'
      }
    ]
  }
};

/**
 * Position-Specific Multipliers
 */
export const POSITION_MULTIPLIERS = {
  QB: { nutrition: 1.0, agility: 1.1, strength: 0.9, description: 'Quarterback' },
  WR: { nutrition: 1.1, agility: 1.2, strength: 0.95, description: 'Wide Receiver' },
  RB: { nutrition: 1.15, agility: 1.15, strength: 1.1, description: 'Running Back' },
  DB: { nutrition: 1.1, agility: 1.2, strength: 0.95, description: 'Defensive Back' },
  LB: { nutrition: 1.05, agility: 1.0, strength: 1.15, description: 'Linebacker' },
  DL: { nutrition: 1.2, agility: 0.9, strength: 1.25, description: 'Defensive Line' },
  OL: { nutrition: 1.25, agility: 0.85, strength: 1.3, description: 'Offensive Line' }
};

/**
 * Activity Level Multipliers
 */
export const ACTIVITY_MULTIPLIERS = [
  { minSessions: 6, multiplier: 1.9, label: 'Very Active' },
  { minSessions: 4, multiplier: 1.7, label: 'Moderately Active' },
  { minSessions: 2, multiplier: 1.5, label: 'Lightly Active' },
  { minSessions: 0, multiplier: 1.4, label: 'Sedentary' }
];

/**
 * Calorie Match Ratings
 */
export const CALORIE_MATCH_RATINGS = [
  { threshold: 10, rating: 'Excellent match', color: '#10b981' },
  { threshold: 20, rating: 'Good match', color: '#3b82f6' },
  { threshold: 30, rating: 'Fair match', color: '#f59e0b' },
  { threshold: Infinity, rating: 'Adjust portions as needed', color: '#ef4444' }
];

/**
 * Rank Icons Configuration
 */
export const RANK_ICONS = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
  default: (rank) => `#${rank}`
};

/**
 * Trend Icons Configuration
 */
export const TREND_ICONS = {
  increasing: '📈',
  decreasing: '📉',
  stable: '➡️',
  default: '➡️'
};

/**
 * Correlation Interpretation
 */
export const CORRELATION_LEVELS = [
  { min: 0.7, label: 'Strong Positive', color: '#10b981' },
  { min: 0.4, label: 'Moderate', color: '#f59e0b' },
  { min: 0.2, label: 'Weak Positive', color: '#3b82f6' },
  { min: -Infinity, label: 'Minimal', color: '#6b7280' }
];

/**
 * Score Interpretations
 */
export const SCORE_LEVELS = [
  { min: 85, label: 'Excellent', color: '#10b981' },
  { min: 70, label: 'Good', color: '#f59e0b' },
  { min: 0, label: 'Needs Work', color: '#ef4444' }
];
