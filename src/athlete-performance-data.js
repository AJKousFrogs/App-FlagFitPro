/**
 * Comprehensive Athlete Performance and Nutrition Data
 * 
 * This module provides data structures, constants, and utility functions for:
 * - Physical measurements and anthropometric data
 * - Performance tests and benchmarks
 * - Wellness tracking metrics
 * - Injury tracking categories
 * - Supplement guidance and schedules
 * - Nutrition recommendations
 * 
 * @module athlete-performance-data
 * @version 2.0.0
 */

// ============================================================================
// SUPPLEMENT GUIDE
// ============================================================================

/**
 * Comprehensive supplement guide with timing, benefits, and recommendations
 * @typedef {Object} SupplementGuide
 * @property {Array<Supplement>} supplements - List of recommended supplements
 * @property {Object} nutritionCategories - Food categories by nutritional purpose
 * @property {Array<string>} implementationTips - Practical implementation tips
 * @property {Array<string>} keyPrinciples - Core principles for nutrition and supplementation
 */
export const SUPPLEMENT_GUIDE = {
  supplements: [
    {
      name: "Magnesium",
      timing: "30–60 min before OR post workout, or before bed",
      notes:
        "Ensures muscle function, recovery, and sleep. Consistency is key.",
      benefits: ["Muscle function", "Recovery", "Sleep quality"],
      category: "Recovery",
      dosage: "200-400mg",
      form: "Citrate, Glycinate, or Threonate",
      interactions: ["May enhance calcium absorption", "Avoid with high-dose zinc"],
    },
    {
      name: "Vitamin D",
      timing: "Morning, with a fat-containing meal",
      notes: "Increases absorption; aligns with sunlight/hormone cycles.",
      benefits: ["Bone health", "Immune function", "Hormone regulation"],
      category: "Essential",
      dosage: "1000-4000 IU",
      form: "D3 (cholecalciferol)",
      interactions: ["Take with fat for absorption", "Monitor levels if taking high doses"],
    },
    {
      name: "Omega-3",
      timing: "With a main meal (any time)",
      notes:
        "Better absorption with dietary fat. Supports anti-inflammation & recovery.",
      benefits: ["Anti-inflammation", "Recovery", "Brain health"],
      category: "Recovery",
      dosage: "1000-3000mg EPA+DHA",
      form: "Fish oil or Algae-based",
      interactions: ["Take with meals", "May thin blood - consult if on blood thinners"],
    },
    {
      name: "Vitamin C",
      timing: "After workouts or with meals, split doses",
      notes:
        "Supports recovery, avoid mega doses. Split into 2–3 smaller doses per day.",
      benefits: ["Recovery", "Immune support", "Antioxidant"],
      category: "Recovery",
      dosage: "500-1000mg (split)",
      form: "Ascorbic acid or buffered",
      interactions: ["Enhances iron absorption", "May interfere with some medications"],
    },
    {
      name: "Iron",
      timing: "Morning, empty stomach or post-exercise (30min window)",
      notes:
        "Better absorbed away from coffee/tea/calcium. Avoid 6h post-exercise peak.",
      benefits: ["Energy", "Oxygen transport", "Performance"],
      category: "Performance",
      dosage: "18-27mg (consult doctor)",
      form: "Ferrous sulfate or chelated",
      interactions: ["Avoid with coffee/tea", "Take with Vitamin C", "Separate from calcium"],
    },
    {
      name: "Probiotics",
      timing: "With or 30min before meals, daily",
      notes: "Consistency matters. Supports gut and immune health.",
      benefits: ["Gut health", "Immune support", "Recovery"],
      category: "Health",
      dosage: "10-50 billion CFU",
      form: "Multi-strain capsules",
      interactions: ["Take away from antibiotics", "Refrigerate if required"],
    },
    {
      name: "Creatine",
      timing: "Post-workout or anytime, with carbs",
      notes: "Most researched supplement. Supports power output and recovery.",
      benefits: ["Power output", "Muscle strength", "Recovery"],
      category: "Performance",
      dosage: "3-5g daily (maintenance), 20g loading phase",
      form: "Monohydrate",
      interactions: ["Safe with most supplements", "Increase water intake"],
    },
    {
      name: "B-Complex",
      timing: "Morning, with food",
      notes: "Essential for energy metabolism and recovery.",
      benefits: ["Energy metabolism", "Nervous system", "Recovery"],
      category: "Essential",
      dosage: "As per label",
      form: "B-complex supplement",
      interactions: ["Water-soluble, excess excreted", "May cause bright yellow urine"],
    },
  ],

  nutritionCategories: {
    proteins: {
      title: "High-Quality Proteins",
      foods: [
        "Eggs (especially whole eggs)",
        "Fatty fish (salmon, mackerel, sardines, tuna)",
        "Greek yogurt, cottage cheese",
        "Lean poultry and red meats",
        "Legumes (beans, lentils, chickpeas)",
        "Tofu and tempeh",
        "Whey or plant-based protein powders",
      ],
      servingSize: "20-30g per meal",
      timing: "Post-workout (30-60min), with meals",
    },
    carbohydrates: {
      title: "Complex Carbohydrates",
      foods: ["Sweet potato", "Quinoa", "Oats", "Brown rice", "Whole grain pasta", "Barley", "Buckwheat"],
      servingSize: "40-60g per meal",
      timing: "Pre-workout (1-2h), post-workout (30-60min)",
    },
    antiInflammatory: {
      title: "Anti-Inflammatory & Antioxidant Foods",
      foods: [
        "Tart cherry/juice (muscle recovery, sleep support)",
        "All berries (blueberry, blackberry, strawberry)",
        "Leafy greens (spinach, kale, Swiss chard)",
        "Turmeric and ginger",
        "Dark chocolate (70%+ cacao)",
        "Nuts/seeds (walnuts, chia, flaxseed, pumpkin seeds)",
        "Fermented foods (kimchi, sauerkraut, kefir, yogurt)",
        "Green tea",
        "Olive oil",
      ],
      servingSize: "Varied - include daily",
      timing: "Throughout day, especially post-workout",
    },
    brainSupport: {
      title: "Brain & Mood Support",
      foods: [
        "Fatty fish, walnuts, avocado",
        "Whole grains (finger millet, oats)",
        "Dark chocolate",
        "Fiber-rich foods (for gut health)",
        "Blueberries",
        "Leafy greens",
      ],
      servingSize: "Varied - include regularly",
      timing: "Throughout day",
    },
    sleepOptimization: {
      title: "Sleep Optimization",
      foods: [
        "Tart cherry/juice, kiwi, chamomile tea, milk, oats",
        "Nuts/seeds (especially walnuts and pumpkin)",
        "Magnesium-rich foods (spinach, almonds)",
        "Bananas",
        "Turkey",
      ],
      servingSize: "Small portions",
      timing: "Evening, 1-2 hours before bed",
    },
    hydration: {
      title: "Hydration & Electrolyte Sources",
      foods: ["Coconut water", "Watermelon", "Milk", "Bananas", "Electrolyte drinks"],
      servingSize: "As needed",
      timing: "Before, during, and after exercise",
    },
  },

  implementationTips: [
    "Post-workout (30–60min): Protein + carbs (e.g., Greek yogurt + berries, milk, protein smoothie)",
    "Evening: Tryptophan-rich protein + complex carbs (e.g., turkey + sweet potato, oats + nuts)",
    "Throughout day: Rotate anti-inflammatory foods, omega-3s, and leafy greens",
    "Hydrate: Drink water/electrolyte beverages before, during, and after exercise",
    "Pre-workout (1-2h): Complex carbs + light protein for sustained energy",
    "Meal timing: Eat every 3-4 hours to maintain stable blood sugar",
    "Recovery window: Prioritize protein and carbs within 2 hours post-exercise",
  ],

  keyPrinciples: [
    "Consistency beats perfection: Stick to routines with both supplements and meals.",
    "Variety matters: Rotate protein, produce, and healthy fat sources.",
    "Monitor timing: Pair fat-soluble vitamins and omega-3s with meals; iron and magnesium when best tolerated.",
    "Support sleep and mental health: Prioritize anti-inflammatory foods, pre-bed carbohydrates, and magnesium.",
    "Individualize: Track how different foods and supplements affect your performance and recovery.",
    "Quality over quantity: Choose whole, minimally processed foods when possible.",
  ],
};

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

/**
 * Performance test definitions and benchmarks
 * @typedef {Object} PerformanceTests
 * @property {Object} physical - Physical performance tests
 * @property {Object} anthropometric - Body measurements and composition
 */
export const PERFORMANCE_TESTS = {
  physical: {
    speed: {
      name: "40-Yard Dash",
      unit: "seconds",
      target: { elite: 4.4, good: 4.8, average: 5.2 },
      frequency: "Monthly",
      description: "Straight-line speed test over 40 yards",
      category: "Speed",
      equipment: ["Stopwatch", "40-yard marked track"],
      protocol: "3 attempts, best time recorded",
    },
    agility: {
      name: "Pro Agility (5-10-5)",
      unit: "seconds",
      target: { elite: 4.0, good: 4.5, average: 5.0 },
      frequency: "Monthly",
      description: "Change of direction and lateral movement test",
      category: "Agility",
      equipment: ["Cones", "Stopwatch"],
      protocol: "3 attempts each direction, best time recorded",
    },
    power: {
      name: "Broad Jump",
      unit: "feet",
      target: { elite: 10.5, good: 9.5, average: 8.5 },
      frequency: "Monthly",
      description: "Lower body explosive power test",
      category: "Power",
      equipment: ["Measuring tape", "Jump mat"],
      protocol: "3 attempts, best distance recorded",
    },
    verticalJump: {
      name: "Vertical Jump",
      unit: "inches",
      target: { elite: 35, good: 30, average: 25 },
      frequency: "Monthly",
      description: "Vertical explosive power and jumping ability",
      category: "Power",
      equipment: ["Vertec or wall measurement"],
      protocol: "3 attempts, best height recorded",
    },
    endurance: {
      name: "300-Yard Shuttle",
      unit: "seconds",
      target: { elite: 50, good: 55, average: 60 },
      frequency: "Monthly",
      description: "Anaerobic endurance and recovery ability",
      category: "Endurance",
      equipment: ["Cones", "Stopwatch"],
      protocol: "Single attempt, total time recorded",
    },
    threeConeDrill: {
      name: "3-Cone Drill",
      unit: "seconds",
      target: { elite: 6.8, good: 7.2, average: 7.8 },
      frequency: "Monthly",
      description: "Agility, balance, and change of direction",
      category: "Agility",
      equipment: ["Cones", "Stopwatch"],
      protocol: "3 attempts, best time recorded",
    },
    benchPress: {
      name: "Bench Press (1RM)",
      unit: "lbs",
      target: { elite: 225, good: 185, average: 155 },
      frequency: "Quarterly",
      description: "Upper body strength test",
      category: "Strength",
      equipment: ["Barbell", "Bench", "Spotters"],
      protocol: "Progressive loading to 1RM",
    },
    squat: {
      name: "Back Squat (1RM)",
      unit: "lbs",
      target: { elite: 315, good: 275, average: 225 },
      frequency: "Quarterly",
      description: "Lower body strength test",
      category: "Strength",
      equipment: ["Barbell", "Squat rack", "Spotters"],
      protocol: "Progressive loading to 1RM",
    },
  },

  anthropometric: {
    height: {
      name: "Height",
      unit: "cm",
      frequency: "Quarterly",
      category: "Physical",
      description: "Standing height measurement",
      equipment: ["Stadiometer"],
    },
    weight: {
      name: "Weight",
      unit: "kg",
      frequency: "Weekly",
      category: "Physical",
      description: "Body weight measurement",
      equipment: ["Scale"],
      notes: "Measure at same time of day, preferably morning",
    },
    bodyFat: {
      name: "Body Fat %",
      unit: "%",
      target: {
        male: { elite: 8, good: 12, average: 15 },
        female: { elite: 15, good: 18, average: 22 },
      },
      frequency: "Monthly",
      category: "Composition",
      description: "Body fat percentage",
      methods: ["DEXA", "BodPod", "Bioimpedance", "Skinfold"],
      notes: "Use consistent method for tracking",
    },
    muscleMass: {
      name: "Muscle Mass",
      unit: "kg",
      frequency: "Monthly",
      category: "Composition",
      description: "Lean muscle mass",
      methods: ["DEXA", "BodPod", "Bioimpedance"],
    },
    waistCircumference: {
      name: "Waist Circumference",
      unit: "cm",
      frequency: "Monthly",
      category: "Composition",
      description: "Waist measurement at navel level",
      equipment: ["Measuring tape"],
      target: { male: { elite: 80, good: 90, average: 100 }, female: { elite: 70, good: 80, average: 90 } },
    },
    hipCircumference: {
      name: "Hip Circumference",
      unit: "cm",
      frequency: "Monthly",
      category: "Composition",
      description: "Hip measurement at widest point",
      equipment: ["Measuring tape"],
    },
  },
};

// ============================================================================
// WELLNESS TRACKING
// ============================================================================

/**
 * Wellness tracking metrics and injury categories
 * @typedef {Object} WellnessTracking
 * @property {Object} dailyMetrics - Daily wellness metrics
 * @property {Object} injuryTracking - Injury tracking categories and severity levels
 */
export const WELLNESS_TRACKING = {
  dailyMetrics: {
    sleep: {
      name: "Sleep Quality",
      scale: "1-10",
      description: "Overall sleep quality and restfulness",
      factors: ["Duration", "Restfulness", "Recovery feeling"],
      ideal: "7-9 hours, score 7+",
    },
    energy: {
      name: "Energy Level",
      scale: "1-10",
      description: "General energy and alertness throughout day",
      factors: ["Morning energy", "Sustained energy", "Afternoon slump"],
      ideal: "Score 7+",
    },
    stress: {
      name: "Stress Level",
      scale: "1-10",
      description: "Overall stress and mental state",
      factors: ["Work stress", "Training stress", "Life stress"],
      ideal: "Score 3-5",
      note: "Lower is better",
    },
    soreness: {
      name: "Muscle Soreness",
      scale: "1-10",
      description: "General muscle soreness and stiffness",
      factors: ["DOMS", "General stiffness", "Pain level"],
      ideal: "Score 1-3",
      note: "Lower is better",
    },
    motivation: {
      name: "Training Motivation",
      scale: "1-10",
      description: "Motivation and enthusiasm for training",
      factors: ["Desire to train", "Focus", "Enthusiasm"],
      ideal: "Score 7+",
    },
    readiness: {
      name: "Readiness to Train",
      scale: "1-10",
      description: "Overall readiness for training session",
      factors: ["Sleep", "Energy", "Soreness", "Stress"],
      ideal: "Score 7+",
      calculated: true,
    },
  },

  injuryTracking: {
    categories: [
      "Minor soreness/stiffness",
      "Muscle strain",
      "Joint pain",
      "Acute injury",
      "Previous injury flare-up",
      "Overuse injury",
      "Contusion/bruise",
    ],
    bodyParts: [
      "Head/Neck",
      "Shoulder",
      "Arm/Elbow",
      "Wrist/Hand",
      "Upper back",
      "Lower back",
      "Hip/Groin",
      "Thigh",
      "Knee",
      "Calf/Shin",
      "Ankle/Foot",
    ],
    severity: [
      { level: 1, description: "No impact on training", color: "green", action: "Monitor" },
      { level: 2, description: "Slight modification needed", color: "yellow", action: "Modify training" },
      { level: 3, description: "Significant modification required", color: "orange", action: "Reduce intensity" },
      { level: 4, description: "Unable to train specific movements", color: "red", action: "Rest affected area" },
      { level: 5, description: "Unable to train at all", color: "red", action: "Seek medical attention" },
    ],
    recoveryPhases: [
      "Acute (0-3 days)",
      "Subacute (4-14 days)",
      "Remodeling (2-6 weeks)",
      "Return to play",
    ],
  },
};

// ============================================================================
// MOCK DATA
// ============================================================================

/**
 * Mock athlete data for demonstration and testing
 * @typedef {Object} MockAthleteData
 */
export const MOCK_ATHLETE_DATA = {
  personalInfo: {
    name: "Alex Johnson",
    position: "Wide Receiver",
    jersey: 15,
    age: 24,
    experience: "3 years",
    team: "Thunderbolts",
    height: 183, // cm
    weight: 82.5, // kg
  },

  currentMeasurements: {
    height: 183, // cm
    weight: 82.5, // kg
    bodyFat: 11.2, // %
    muscleMass: 72.8, // kg
    waistCircumference: 82, // cm
    hipCircumference: 95, // cm
    lastUpdated: "2024-11-01",
  },

  performanceTests: {
    "40YardDash": {
      current: 4.52,
      previous: 4.58,
      best: 4.48,
      target: 4.4,
      lastTest: "2024-11-01",
      trend: "improving",
      improvement: 1.3,
    },
    BroadJump: {
      current: 9.8,
      previous: 9.6,
      best: 10.1,
      target: 10.5,
      lastTest: "2024-11-01",
      trend: "improving",
      improvement: 2.1,
    },
    VerticalJump: {
      current: 32,
      previous: 30,
      best: 33,
      target: 35,
      lastTest: "2024-11-01",
      trend: "improving",
      improvement: 6.7,
    },
    ProAgility: {
      current: 4.35,
      previous: 4.41,
      best: 4.28,
      target: 4.0,
      lastTest: "2024-11-01",
      trend: "improving",
      improvement: 1.4,
    },
    "300YardShuttle": {
      current: 53.2,
      previous: 54.8,
      best: 52.1,
      target: 50.0,
      lastTest: "2024-11-01",
      trend: "improving",
      improvement: 2.9,
    },
    "3ConeDrill": {
      current: 7.1,
      previous: 7.3,
      best: 6.9,
      target: 6.8,
      lastTest: "2024-10-15",
      trend: "improving",
      improvement: 2.7,
    },
  },

  recentWellness: [
    {
      date: "2024-11-08",
      sleep: 8,
      energy: 7,
      stress: 3,
      soreness: 4,
      motivation: 9,
      readiness: 7,
      injuries: [],
      notes: "Feeling strong, ready for game day",
    },
    {
      date: "2024-11-07",
      sleep: 7,
      energy: 8,
      stress: 2,
      soreness: 3,
      motivation: 8,
      readiness: 8,
      injuries: [
        {
          bodyPart: "Knee",
          category: "Minor soreness/stiffness",
          severity: 2,
          notes: "Left knee slight soreness after practice",
          dateReported: "2024-11-07",
        },
      ],
    },
    {
      date: "2024-11-06",
      sleep: 6,
      energy: 6,
      stress: 4,
      soreness: 5,
      motivation: 7,
      readiness: 6,
      injuries: [],
      notes: "Recovery day needed",
    },
  ],

  supplementSchedule: [
    {
      supplement: "Magnesium",
      time: "22:00",
      taken: true,
      date: "2024-11-08",
      dosage: "400mg",
    },
    {
      supplement: "Vitamin D",
      time: "08:00",
      taken: true,
      date: "2024-11-08",
      dosage: "2000 IU",
    },
    {
      supplement: "Omega-3",
      time: "12:00",
      taken: false,
      date: "2024-11-08",
      dosage: "2000mg",
    },
    {
      supplement: "Creatine",
      time: "18:00",
      taken: true,
      date: "2024-11-08",
      dosage: "5g",
    },
  ],
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate performance grade based on current value and targets
 * @param {number} current - Current performance value
 * @param {Object} targets - Target values with elite, good, and average thresholds
 * @param {boolean} lowerIsBetter - Whether lower values are better (e.g., time-based tests)
 * @returns {string} Performance grade: "Elite", "Good", "Average", or "Needs Improvement"
 */
export const getPerformanceGrade = (current, targets, lowerIsBetter = false) => {
  if (!targets || typeof current !== "number") {
    return "Unknown";
  }

  if (lowerIsBetter) {
    if (current <= targets.elite) {return "Elite";}
    if (current <= targets.good) {return "Good";}
    if (current <= targets.average) {return "Average";}
  } else {
    if (current >= targets.elite) {return "Elite";}
    if (current >= targets.good) {return "Good";}
    if (current >= targets.average) {return "Average";}
  }

  return "Needs Improvement";
};

/**
 * Calculate performance improvement percentage
 * @param {number} current - Current performance value
 * @param {number} previous - Previous performance value
 * @param {boolean} lowerIsBetter - Whether lower values are better
 * @returns {number} Improvement percentage (positive = improvement)
 */
export const calculatePerformanceImprovement = (current, previous, lowerIsBetter = false) => {
  if (!previous || previous === 0) {return 0;}
  
  if (lowerIsBetter) {
    // For time-based tests, improvement means lower time
    return (((previous - current) / previous) * 100).toFixed(1);
  } else {
    // For distance/height-based tests, improvement means higher value
    return (((current - previous) / previous) * 100).toFixed(1);
  }
};

/**
 * Get color code for wellness score
 * @param {number} score - Wellness score (1-10)
 * @param {boolean} lowerIsBetter - Whether lower scores are better (e.g., stress, soreness)
 * @returns {string} CSS color variable or hex color
 */
export const getWellnessColor = (score, lowerIsBetter = false) => {
  if (typeof score !== "number" || score < 1 || score > 10) {
    return "var(--text-secondary)";
  }

  if (lowerIsBetter) {
    // For stress, soreness - lower is better
    if (score <= 3) {return "var(--success)";}
    if (score <= 5) {return "var(--accent)";}
    if (score <= 7) {return "var(--warning)";}
    return "var(--error)";
  } else {
    // For sleep, energy, motivation - higher is better
    if (score >= 8) {return "var(--success)";}
    if (score >= 6) {return "var(--accent)";}
    if (score >= 4) {return "var(--warning)";}
    return "var(--error)";
  }
};

/**
 * Get supplement reminders based on current time
 * @param {Array} schedule - Supplement schedule array
 * @param {number} reminderWindow - Hours before/after scheduled time to show reminder
 * @returns {Array} Array of supplements that need reminders
 */
export const getSupplementReminders = (schedule, reminderWindow = 1) => {
  if (!Array.isArray(schedule)) {return [];}

  const now = new Date();
  const currentHour = now.getHours();
  const currentDate = now.toISOString().split("T")[0];

  return schedule.filter((item) => {
    if (item.taken || item.date !== currentDate) {return false;}
    
    const supplementHour = parseInt(item.time.split(":")[0]);
    const timeDiff = Math.abs(currentHour - supplementHour);
    
    return timeDiff <= reminderWindow && !item.taken;
  });
};

/**
 * Calculate BMI (Body Mass Index)
 * @param {number} weight - Weight in kg
 * @param {number} height - Height in cm
 * @returns {number} BMI value
 */
export const calculateBMI = (weight, height) => {
  if (!weight || !height || height <= 0) {return null;}
  
  const heightInMeters = height / 100;
  return parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
};

/**
 * Get BMI category based on BMI value
 * @param {number} bmi - BMI value
 * @returns {string} BMI category
 */
export const getBMICategory = (bmi) => {
  if (!bmi || typeof bmi !== "number") {return "Unknown";}
  
  if (bmi < 18.5) {return "Underweight";}
  if (bmi < 25) {return "Normal";}
  if (bmi < 30) {return "Overweight";}
  return "Obese";
};

/**
 * Calculate readiness score from wellness metrics
 * @param {Object} wellness - Wellness metrics object
 * @returns {number} Readiness score (1-10)
 */
export const calculateReadinessScore = (wellness) => {
  if (!wellness) {return null;}

  const factors = {
    sleep: wellness.sleep || 5,
    energy: wellness.energy || 5,
    stress: wellness.stress || 5,
    soreness: wellness.soreness || 5,
    motivation: wellness.motivation || 5,
  };

  // Weighted calculation
  // Sleep and energy are most important (30% each)
  // Stress and soreness are negative factors (20% each, inverted)
  // Motivation contributes 10%
  const sleepScore = factors.sleep * 0.3;
  const energyScore = factors.energy * 0.3;
  const stressScore = (10 - factors.stress) * 0.2; // Invert stress
  const sorenessScore = (10 - factors.soreness) * 0.2; // Invert soreness
  const motivationScore = factors.motivation * 0.1;

  const total = sleepScore + energyScore + stressScore + sorenessScore + motivationScore;
  return Math.round(total * 10) / 10; // Round to 1 decimal
};

/**
 * Get performance trend direction
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @param {boolean} lowerIsBetter - Whether lower values are better
 * @returns {string} Trend: "improving", "declining", or "stable"
 */
export const getPerformanceTrend = (current, previous, lowerIsBetter = false) => {
  if (!previous || previous === 0) {return "stable";}
  
  const threshold = 0.01; // 1% change threshold
  
  if (lowerIsBetter) {
    const change = (previous - current) / previous;
    if (change > threshold) {return "improving";}
    if (change < -threshold) {return "declining";}
  } else {
    const change = (current - previous) / previous;
    if (change > threshold) {return "improving";}
    if (change < -threshold) {return "declining";}
  }
  
  return "stable";
};

/**
 * Validate performance test data
 * @param {string} testName - Name of the test
 * @param {number} value - Test value
 * @returns {Object} Validation result with isValid and message
 */
export const validatePerformanceTest = (testName, value) => {
  if (typeof value !== "number" || isNaN(value)) {
    return { isValid: false, message: "Value must be a number" };
  }

  const test = PERFORMANCE_TESTS.physical[testName] || 
               Object.values(PERFORMANCE_TESTS.physical).find(t => t.name === testName);
  
  if (!test) {
    return { isValid: false, message: "Unknown test type" };
  }

  // Basic range validation based on test type
  const ranges = {
    "40-Yard Dash": { min: 3.0, max: 8.0 },
    "Pro Agility (5-10-5)": { min: 3.0, max: 8.0 },
    "Broad Jump": { min: 5.0, max: 15.0 },
    "Vertical Jump": { min: 10, max: 50 },
    "300-Yard Shuttle": { min: 40, max: 90 },
    "3-Cone Drill": { min: 5.0, max: 10.0 },
  };

  const range = ranges[test.name];
  if (range && (value < range.min || value > range.max)) {
    return {
      isValid: false,
      message: `Value ${value} is outside expected range (${range.min}-${range.max} ${test.unit})`,
    };
  }

  return { isValid: true, message: "Valid" };
};

/**
 * Format date for display
 * @param {string|Date} date - Date string or Date object
 * @param {string} format - Format style: "short", "long", "iso"
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = "short") => {
  if (!date) {return "";}
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) {return "";}

  const options = {
    short: { month: "short", day: "numeric", year: "numeric" },
    long: { month: "long", day: "numeric", year: "numeric" },
    iso: {},
  };

  if (format === "iso") {
    return dateObj.toISOString().split("T")[0];
  }

  return dateObj.toLocaleDateString("en-US", options[format] || options.short);
};

/**
 * Get days since last test
 * @param {string|Date} lastTestDate - Date of last test
 * @returns {number} Number of days since last test
 */
export const getDaysSinceLastTest = (lastTestDate) => {
  if (!lastTestDate) {return null;}
  
  const testDate = typeof lastTestDate === "string" ? new Date(lastTestDate) : lastTestDate;
  if (isNaN(testDate.getTime())) {return null;}
  
  const now = new Date();
  const diffTime = Math.abs(now - testDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Check if test is due based on frequency
 * @param {string|Date} lastTestDate - Date of last test
 * @param {string} frequency - Test frequency (e.g., "Monthly", "Weekly")
 * @returns {boolean} True if test is due
 */
export const isTestDue = (lastTestDate, frequency) => {
  if (!lastTestDate) {return true;}
  
  const daysSince = getDaysSinceLastTest(lastTestDate);
  if (daysSince === null) {return true;}
  
  const frequencyDays = {
    Weekly: 7,
    Monthly: 30,
    Quarterly: 90,
    Annually: 365,
  };
  
  const requiredDays = frequencyDays[frequency] || 30;
  return daysSince >= requiredDays;
};

/**
 * Get injury severity color
 * @param {number} severity - Severity level (1-5)
 * @returns {string} Color code
 */
export const getInjurySeverityColor = (severity) => {
  const colors = {
    1: "var(--success)",
    2: "var(--accent)",
    3: "var(--warning)",
    4: "var(--error)",
    5: "var(--error)",
  };
  
  return colors[severity] || "var(--text-secondary)";
};

/**
 * Calculate body fat percentage target based on gender
 * @param {string} gender - "male" or "female"
 * @param {number} currentBodyFat - Current body fat percentage
 * @returns {Object} Target information
 */
export const getBodyFatTarget = (gender, currentBodyFat) => {
  const targets = PERFORMANCE_TESTS.anthropometric.bodyFat.target;
  const genderTargets = targets[gender] || targets.male;
  
  let category = "Needs Improvement";
  if (currentBodyFat <= genderTargets.elite) {category = "Elite";} else if (currentBodyFat <= genderTargets.good) {category = "Good";} else if (currentBodyFat <= genderTargets.average) {category = "Average";}
  
  return {
    category,
    elite: genderTargets.elite,
    good: genderTargets.good,
    average: genderTargets.average,
    current: currentBodyFat,
  };
};

// ============================================================================
// EXPORT SUMMARY
// ============================================================================

/**
 * @exports
 * All exports from this module:
 * - SUPPLEMENT_GUIDE: Comprehensive supplement and nutrition data
 * - PERFORMANCE_TESTS: Performance test definitions and benchmarks
 * - WELLNESS_TRACKING: Wellness metrics and injury tracking
 * - MOCK_ATHLETE_DATA: Sample athlete data for testing
 * - Utility functions: Performance calculations, validations, and helpers
 */
