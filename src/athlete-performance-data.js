// Comprehensive Athlete Performance and Nutrition Data
// Physical measurements, performance tests, injury tracking, and supplement guidance

export const SUPPLEMENT_GUIDE = {
  supplements: [
    {
      name: "Magnesium",
      timing: "30–60 min before OR post workout, or before bed",
      notes:
        "Ensures muscle function, recovery, and sleep. Consistency is key.",
      benefits: ["Muscle function", "Recovery", "Sleep quality"],
      category: "Recovery",
    },
    {
      name: "Vitamin D",
      timing: "Morning, with a fat-containing meal",
      notes: "Increases absorption; aligns with sunlight/hormone cycles.",
      benefits: ["Bone health", "Immune function", "Hormone regulation"],
      category: "Essential",
    },
    {
      name: "Omega-3",
      timing: "With a main meal (any time)",
      notes:
        "Better absorption with dietary fat. Supports anti-inflammation & recovery.",
      benefits: ["Anti-inflammation", "Recovery", "Brain health"],
      category: "Recovery",
    },
    {
      name: "Vitamin C",
      timing: "After workouts or with meals, split doses",
      notes:
        "Supports recovery, avoid mega doses. Split into 2–3 smaller doses per day.",
      benefits: ["Recovery", "Immune support", "Antioxidant"],
      category: "Recovery",
    },
    {
      name: "Iron",
      timing: "Morning, empty stomach or post-exercise (30min window)",
      notes:
        "Better absorbed away from coffee/tea/calcium. Avoid 6h post-exercise peak.",
      benefits: ["Energy", "Oxygen transport", "Performance"],
      category: "Performance",
    },
    {
      name: "Probiotics",
      timing: "With or 30min before meals, daily",
      notes: "Consistency matters. Supports gut and immune health.",
      benefits: ["Gut health", "Immune support", "Recovery"],
      category: "Health",
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
      ],
    },
    carbohydrates: {
      title: "Complex Carbohydrates",
      foods: ["Sweet potato", "Quinoa", "Oats", "Brown rice"],
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
      ],
    },
    brainSupport: {
      title: "Brain & Mood Support",
      foods: [
        "Fatty fish, walnuts, avocado",
        "Whole grains (finger millet, oats)",
        "Dark chocolate",
        "Fiber-rich foods (for gut health)",
      ],
    },
    sleepOptimization: {
      title: "Sleep Optimization",
      foods: [
        "Tart cherry/juice, kiwi, chamomile tea, milk, oats",
        "Nuts/seeds (especially walnuts and pumpkin)",
        "Magnesium-rich foods (spinach, almonds)",
      ],
    },
    hydration: {
      title: "Hydration & Electrolyte Sources",
      foods: ["Coconut water", "Watermelon", "Milk", "Bananas"],
    },
  },

  implementationTips: [
    "Post-workout (30–60min): Protein + carbs (e.g., Greek yogurt + berries, milk, protein smoothie)",
    "Evening: Tryptophan-rich protein + complex carbs (e.g., turkey + sweet potato, oats + nuts)",
    "Throughout day: Rotate anti-inflammatory foods, omega-3s, and leafy greens",
    "Hydrate: Drink water/electrolyte beverages before, during, and after exercise",
  ],

  keyPrinciples: [
    "Consistency beats perfection: Stick to routines with both supplements and meals.",
    "Variety matters: Rotate protein, produce, and healthy fat sources.",
    "Monitor timing: Pair fat-soluble vitamins and omega-3s with meals; iron and magnesium when best tolerated.",
    "Support sleep and mental health: Prioritize anti-inflammatory foods, pre-bed carbohydrates, and magnesium.",
  ],
};

export const PERFORMANCE_TESTS = {
  physical: {
    speed: {
      name: "40-Yard Dash",
      unit: "seconds",
      target: { elite: 4.4, good: 4.8, average: 5.2 },
      frequency: "Monthly",
      description: "Straight-line speed test over 40 yards",
    },
    agility: {
      name: "Pro Agility (5-10-5)",
      unit: "seconds",
      target: { elite: 4.0, good: 4.5, average: 5.0 },
      frequency: "Monthly",
      description: "Change of direction and lateral movement test",
    },
    power: {
      name: "Broad Jump",
      unit: "feet",
      target: { elite: 10.5, good: 9.5, average: 8.5 },
      frequency: "Monthly",
      description: "Lower body explosive power test",
    },
    verticalJump: {
      name: "Vertical Jump",
      unit: "inches",
      target: { elite: 35, good: 30, average: 25 },
      frequency: "Monthly",
      description: "Vertical explosive power and jumping ability",
    },
    endurance: {
      name: "300-Yard Shuttle",
      unit: "seconds",
      target: { elite: 50, good: 55, average: 60 },
      frequency: "Monthly",
      description: "Anaerobic endurance and recovery ability",
    },
  },

  anthropometric: {
    height: {
      name: "Height",
      unit: "cm",
      frequency: "Quarterly",
      category: "Physical",
    },
    weight: {
      name: "Weight",
      unit: "kg",
      frequency: "Weekly",
      category: "Physical",
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
    },
    muscleMass: {
      name: "Muscle Mass",
      unit: "kg",
      frequency: "Monthly",
      category: "Composition",
    },
  },
};

export const WELLNESS_TRACKING = {
  dailyMetrics: {
    sleep: {
      name: "Sleep Quality",
      scale: "1-10",
      description: "Overall sleep quality and restfulness",
    },
    energy: {
      name: "Energy Level",
      scale: "1-10",
      description: "General energy and alertness throughout day",
    },
    stress: {
      name: "Stress Level",
      scale: "1-10",
      description: "Overall stress and mental state",
    },
    soreness: {
      name: "Muscle Soreness",
      scale: "1-10",
      description: "General muscle soreness and stiffness",
    },
    motivation: {
      name: "Training Motivation",
      scale: "1-10",
      description: "Motivation and enthusiasm for training",
    },
  },

  injuryTracking: {
    categories: [
      "Minor soreness/stiffness",
      "Muscle strain",
      "Joint pain",
      "Acute injury",
      "Previous injury flare-up",
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
      { level: 1, description: "No impact on training" },
      { level: 2, description: "Slight modification needed" },
      { level: 3, description: "Significant modification required" },
      { level: 4, description: "Unable to train specific movements" },
      { level: 5, description: "Unable to train at all" },
    ],
  },
};

// Mock data for demonstration
export const MOCK_ATHLETE_DATA = {
  personalInfo: {
    name: "Alex Johnson",
    position: "Wide Receiver",
    jersey: 15,
    age: 24,
    experience: "3 years",
  },

  currentMeasurements: {
    height: 183, // cm
    weight: 82.5, // kg
    bodyFat: 11.2, // %
    muscleMass: 72.8, // kg
    lastUpdated: "2024-11-01",
  },

  performanceTests: {
    "40YardDash": {
      current: 4.52,
      previous: 4.58,
      best: 4.48,
      target: 4.4,
      lastTest: "2024-11-01",
    },
    BroadJump: {
      current: 9.8,
      previous: 9.6,
      best: 10.1,
      target: 10.5,
      lastTest: "2024-11-01",
    },
    VerticalJump: {
      current: 32,
      previous: 30,
      best: 33,
      target: 35,
      lastTest: "2024-11-01",
    },
    ProAgility: {
      current: 4.35,
      previous: 4.41,
      best: 4.28,
      target: 4.0,
      lastTest: "2024-11-01",
    },
    "300YardShuttle": {
      current: 53.2,
      previous: 54.8,
      best: 52.1,
      target: 50.0,
      lastTest: "2024-11-01",
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
      injuries: [],
    },
    {
      date: "2024-11-07",
      sleep: 7,
      energy: 8,
      stress: 2,
      soreness: 3,
      motivation: 8,
      injuries: [
        {
          bodyPart: "Knee",
          category: "Minor soreness/stiffness",
          severity: 2,
          notes: "Left knee slight soreness after practice",
        },
      ],
    },
  ],

  supplementSchedule: [
    {
      supplement: "Magnesium",
      time: "22:00",
      taken: true,
      date: "2024-11-08",
    },
    {
      supplement: "Vitamin D",
      time: "08:00",
      taken: true,
      date: "2024-11-08",
    },
    {
      supplement: "Omega-3",
      time: "12:00",
      taken: false,
      date: "2024-11-08",
    },
  ],
};

// Utility functions
export const getPerformanceGrade = (current, targets) => {
  if (current <= targets.elite) return "Elite";
  if (current <= targets.good) return "Good";
  if (current <= targets.average) return "Average";
  return "Needs Improvement";
};

export const calculatePerformanceImprovement = (current, previous) => {
  if (!previous) return 0;
  return (((previous - current) / previous) * 100).toFixed(1);
};

export const getWellnessColor = (score) => {
  if (score >= 8) return "var(--success)";
  if (score >= 6) return "var(--accent)";
  if (score >= 4) return "var(--warning)";
  return "var(--error)";
};

export const getSupplementReminders = (schedule) => {
  const now = new Date();
  const currentHour = now.getHours();

  return schedule.filter((item) => {
    const supplementHour = parseInt(item.time.split(":")[0]);
    return !item.taken && Math.abs(currentHour - supplementHour) <= 1;
  });
};

export const calculateBMI = (weight, height) => {
  // weight in kg, height in cm
  const heightInMeters = height / 100;
  return (weight / (heightInMeters * heightInMeters)).toFixed(1);
};

export const getBMICategory = (bmi) => {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
};
