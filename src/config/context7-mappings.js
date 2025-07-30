/**
 * Context7 Library Mappings for Sports Science
 * Maps common sports/nutrition terms to Context7-compatible library IDs
 */

export const SPORTS_SCIENCE_MAPPINGS = {
  // Nutrition & Diet
  'sports-nutrition': 'sports-nutrition-science-2025',
  'nutrition-timing': 'nutrient-timing-protocols-2025',
  'hydration': 'hydration-performance-research-2025',
  'supplements': 'sports-supplements-evidence-2025',
  'macronutrients': 'macronutrient-optimization-2025',
  'micronutrients': 'micronutrient-performance-2025',
  'meal-planning': 'athlete-meal-planning-2025',
  'recovery-nutrition': 'post-exercise-nutrition-2025',
  'pre-workout-nutrition': 'pre-exercise-fueling-2025',
  'protein-intake': 'protein-requirements-athletes-2025',
  'carbohydrate-loading': 'carb-loading-strategies-2025',
  'fat-adaptation': 'fat-adaptation-endurance-2025',

  // Training & Performance
  'strength-training': 'strength-conditioning-science-2025',
  'endurance-training': 'endurance-performance-methods-2025',
  'speed-training': 'speed-development-protocols-2025',
  'agility-training': 'agility-training-systems-2025',
  'plyometrics': 'plyometric-training-research-2025',
  'periodization': 'training-periodization-models-2025',
  'overtraining': 'overtraining-prevention-2025',
  'deloading': 'deload-recovery-strategies-2025',
  'functional-training': 'functional-movement-training-2025',
  'sport-specific': 'sport-specific-training-2025',
  'youth-training': 'youth-athlete-development-2025',
  'female-athletes': 'female-athlete-considerations-2025',

  // Recovery & Regeneration
  'recovery-methods': 'recovery-science-protocols-2025',
  'sleep-performance': 'sleep-athletic-performance-2025',
  'active-recovery': 'active-recovery-strategies-2025',
  'massage-therapy': 'massage-recovery-research-2025',
  'cold-therapy': 'cold-water-immersion-2025',
  'heat-therapy': 'heat-therapy-recovery-2025',
  'compression-therapy': 'compression-garments-2025',
  'stretching': 'stretching-flexibility-research-2025',
  'foam-rolling': 'self-myofascial-release-2025',
  'meditation': 'mindfulness-athletic-performance-2025',

  // Injury Prevention & Rehabilitation
  'injury-prevention': 'injury-prevention-strategies-2025',
  'movement-screening': 'functional-movement-screening-2025',
  'corrective-exercise': 'corrective-exercise-protocols-2025',
  'rehabilitation': 'sports-rehabilitation-methods-2025',
  'return-to-play': 'return-to-play-protocols-2025',
  'concussion': 'concussion-management-2025',
  'acl-prevention': 'acl-injury-prevention-2025',
  'shoulder-health': 'shoulder-injury-prevention-2025',

  // Sports Psychology
  'mental-training': 'sport-psychology-research-2025',
  'motivation': 'athlete-motivation-strategies-2025',
  'confidence': 'sport-confidence-building-2025',
  'anxiety-management': 'performance-anxiety-management-2025',
  'goal-setting': 'athletic-goal-setting-2025',
  'visualization': 'mental-imagery-performance-2025',
  'team-cohesion': 'team-dynamics-psychology-2025',
  'leadership': 'athletic-leadership-development-2025',
  'burnout-prevention': 'athlete-burnout-prevention-2025',

  // Biomechanics & Movement
  'biomechanics': 'biomechanics-analysis-2025',
  'movement-analysis': 'movement-pattern-analysis-2025',
  'running-mechanics': 'running-biomechanics-2025',
  'jumping-mechanics': 'jumping-biomechanics-2025',
  'throwing-mechanics': 'throwing-biomechanics-2025',
  'landing-mechanics': 'landing-technique-analysis-2025',
  'gait-analysis': 'gait-analysis-methods-2025',

  // Technology & Monitoring
  'wearable-technology': 'wearable-tech-sports-2025',
  'gps-tracking': 'gps-athlete-monitoring-2025',
  'heart-rate-monitoring': 'hr-variability-training-2025',
  'load-monitoring': 'training-load-monitoring-2025',
  'performance-analytics': 'sports-analytics-methods-2025',
  'video-analysis': 'video-analysis-sports-2025',

  // Flag Football Specific
  'flag-football': 'flag-football-training-methods-2025',
  'non-contact-sports': 'non-contact-sport-training-2025',
  'flag-football-drills': 'flag-football-skill-development-2025',
  'flag-football-strategy': 'flag-football-tactics-2025',
  'youth-flag-football': 'youth-flag-football-development-2025',
  'flag-football-conditioning': 'flag-football-fitness-2025',

  // Environmental Factors
  'heat-illness': 'heat-illness-prevention-2025',
  'altitude-training': 'altitude-adaptation-2025',
  'weather-performance': 'weather-impact-performance-2025',
  'travel-fatigue': 'travel-fatigue-management-2025',
  'jet-lag': 'jet-lag-athletic-performance-2025',

  // General Categories
  'exercise-physiology': 'exercise-physiology-research-2025',
  'sports-medicine': 'sports-medicine-updates-2025',
  'performance-testing': 'athletic-testing-protocols-2025',
  'talent-identification': 'talent-id-development-2025',
  'long-term-development': 'ltad-models-2025'
};

export const CATEGORY_MAPPINGS = {
  'nutrition': [
    'sports-nutrition', 'nutrition-timing', 'hydration', 'supplements',
    'macronutrients', 'micronutrients', 'meal-planning', 'recovery-nutrition'
  ],
  'training': [
    'strength-training', 'endurance-training', 'speed-training', 'agility-training',
    'plyometrics', 'periodization', 'functional-training', 'sport-specific'
  ],
  'recovery': [
    'recovery-methods', 'sleep-performance', 'active-recovery', 'massage-therapy',
    'cold-therapy', 'heat-therapy', 'compression-therapy', 'stretching'
  ],
  'psychology': [
    'mental-training', 'motivation', 'confidence', 'anxiety-management',
    'goal-setting', 'visualization', 'team-cohesion', 'leadership'
  ],
  'biomechanics': [
    'biomechanics', 'movement-analysis', 'running-mechanics', 'jumping-mechanics',
    'throwing-mechanics', 'landing-mechanics', 'gait-analysis'
  ],
  'injury-prevention': [
    'injury-prevention', 'movement-screening', 'corrective-exercise',
    'rehabilitation', 'return-to-play', 'concussion', 'acl-prevention'
  ],
  'technology': [
    'wearable-technology', 'gps-tracking', 'heart-rate-monitoring',
    'load-monitoring', 'performance-analytics', 'video-analysis'
  ],
  'flag-football': [
    'flag-football', 'non-contact-sports', 'flag-football-drills',
    'flag-football-strategy', 'youth-flag-football', 'flag-football-conditioning'
  ]
};

/**
 * Get Context7 library ID for a given term
 * @param {string} term - Search term or library name
 * @returns {string|null} Context7-compatible library ID
 */
export function getLibraryId(term) {
  const normalizedTerm = term.toLowerCase().replace(/[_\s]/g, '-');
  return SPORTS_SCIENCE_MAPPINGS[normalizedTerm] || null;
}

/**
 * Get all library IDs for a category
 * @param {string} category - Category name
 * @returns {Array<string>} Array of Context7 library IDs
 */
export function getCategoryLibraryIds(category) {
  const terms = CATEGORY_MAPPINGS[category.toLowerCase()] || [];
  return terms.map(term => SPORTS_SCIENCE_MAPPINGS[term]).filter(Boolean);
}

/**
 * Search for relevant library IDs based on query
 * @param {string} query - Search query
 * @returns {Array<string>} Relevant Context7 library IDs
 */
export function searchLibraryIds(query) {
  const normalizedQuery = query.toLowerCase();
  const matches = [];
  
  Object.entries(SPORTS_SCIENCE_MAPPINGS).forEach(([term, libraryId]) => {
    if (term.includes(normalizedQuery) || normalizedQuery.includes(term)) {
      matches.push(libraryId);
    }
  });
  
  return [...new Set(matches)]; // Remove duplicates
}

export default {
  SPORTS_SCIENCE_MAPPINGS,
  CATEGORY_MAPPINGS,
  getLibraryId,
  getCategoryLibraryIds,
  searchLibraryIds
};