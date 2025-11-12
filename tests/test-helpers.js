import { vi } from "vitest";

// Test Helpers and Utilities for Flag Football Training App

// Mock API Response Helper
export const createMockApiResponse = (data, options = {}) => {
  const { status = 200, ok = true, delay = 0 } = options;

  const mockResponse = {
    ok,
    status,
    json: vi.fn().mockResolvedValue(data),
    text: vi.fn().mockResolvedValue(JSON.stringify(data)),
    headers: new Map([["content-type", "application/json"]]),
  };

  if (delay > 0) {
    return new Promise((resolve) =>
      setTimeout(() => resolve(mockResponse), delay),
    );
  }

  return Promise.resolve(mockResponse);
};

// Mock User Data Factory
export const createMockUser = (overrides = {}) => ({
  id: 1,
  email: "athlete@flagfit.com",
  name: "Test Athlete",
  role: "athlete",
  profile: {
    position: "wide_receiver",
    experience: "intermediate",
    goals: ["speed", "agility", "olympic_qualification"],
    height: 180,
    weight: 75,
    age: 24,
  },
  preferences: {
    units: "metric",
    notifications: true,
    privacy: "public",
  },
  stats: {
    totalTrainingSessions: 45,
    averageWeeklyHours: 8.5,
    olympicQualificationScore: 78.2,
  },
  createdAt: "2024-01-15T10:00:00Z",
  ...overrides,
});

// Mock Training Session Factory
export const createMockTrainingSession = (overrides = {}) => ({
  id: 123,
  userId: 1,
  type: "flag_football_drill",
  date: "2025-01-15",
  duration: 60,
  exercises: [
    {
      name: "Sprint intervals",
      type: "speed",
      sets: 5,
      reps: 100,
      distance: "40_yards",
      restTime: 90,
      intensity: 8.5,
    },
    {
      name: "Flag pulling drills",
      type: "technique",
      sets: 10,
      reps: 20,
      successRate: 85,
      reactionTime: 0.32,
    },
  ],
  metrics: {
    averageSpeed: 12.5,
    maxHeartRate: 185,
    caloriesBurned: 450,
    vo2Max: 58.2,
  },
  notes: "Excellent session focused on speed and agility",
  coachFeedback: "Great improvement in sprint times",
  olympicImpact: 2.1,
  ...overrides,
});

// Mock Nutrition Data Factory
export const createMockNutritionData = (overrides = {}) => ({
  id: 456,
  userId: 1,
  date: "2025-01-15",
  meals: [
    {
      type: "breakfast",
      time: "07:30",
      foods: [
        {
          name: "Oatmeal with berries",
          calories: 250,
          protein: 8,
          carbs: 45,
          fat: 4,
          fiber: 6,
          micronutrients: {
            iron: 2.5,
            vitaminC: 15,
            magnesium: 65,
          },
        },
        {
          name: "Greek yogurt",
          calories: 150,
          protein: 20,
          carbs: 10,
          fat: 5,
        },
      ],
    },
  ],
  hydration: {
    water: 2500, // ml
    electrolytes: "adequate",
    timing: "pre_post_training",
  },
  supplements: [
    {
      name: "Creatine",
      amount: 5,
      unit: "g",
      timing: "post_workout",
    },
  ],
  analysis: {
    totalCalories: 2450,
    macroRatio: { protein: 25, carbs: 55, fat: 20 },
    timing: "optimal",
    olympicReadiness: "excellent",
  },
  ...overrides,
});

// Mock Performance Analytics Factory
export const createMockPerformanceData = (overrides = {}) => ({
  userId: 1,
  period: "30_days",
  metrics: {
    speed: {
      current: 12.8,
      previous: 12.2,
      improvement: 4.9,
      percentile: 85,
    },
    agility: {
      current: 8.7,
      previous: 8.4,
      improvement: 3.6,
      percentile: 78,
    },
    endurance: {
      current: 58.5,
      previous: 56.1,
      improvement: 4.3,
      percentile: 82,
    },
    technique: {
      flagPulling: 88,
      routeRunning: 92,
      catchSuccess: 89,
    },
  },
  olympicQualification: {
    currentScore: 78.2,
    requiredScore: 85.0,
    progressRate: 1.2, // points per month
    estimatedQualificationDate: "2025-08-15",
    probability: 76,
  },
  predictions: {
    nextSessionOptimalIntensity: 8.2,
    injuryRisk: "low",
    recoveryTime: 18, // hours
    peakPerformanceWindow: "2025-07-01 to 2025-07-15",
  },
  trends: {
    lastWeek: "improving",
    lastMonth: "steady_growth",
    seasonTrend: "peak_building",
  },
  ...overrides,
});

// Mock Olympic Qualification Data
export const createMockOlympicData = (overrides = {}) => ({
  athlete: {
    id: 1,
    currentRanking: 45,
    region: "europe",
    country: "GBR",
  },
  qualification: {
    status: "in_progress",
    score: 78.2,
    requiredScore: 85.0,
    deadline: "2027-06-01",
    eventsCompleted: 8,
    eventsRequired: 12,
  },
  upcomingEvents: [
    {
      name: "European Championship Qualifier",
      date: "2025-03-15",
      location: "Paris, France",
      importance: "critical",
      estimatedPoints: 3.2,
    },
    {
      name: "International Flag Football Cup",
      date: "2025-05-20",
      location: "Los Angeles, USA",
      importance: "high",
      estimatedPoints: 2.8,
    },
  ],
  teammate: {
    averageScore: 82.1,
    ranking: 28,
    synergy: "excellent",
  },
  ...overrides,
});

// Database Test Utilities
export const createMockDatabaseConnection = () => ({
  query: vi.fn(),
  transaction: vi.fn(),
  close: vi.fn(),
  isConnected: vi.fn().mockReturnValue(true),
});

// WebSocket Mock for Real-time Features
export const createMockWebSocket = () => ({
  send: vi.fn(),
  close: vi.fn(),
  onmessage: null,
  onopen: null,
  onclose: null,
  onerror: null,
  readyState: 1, // OPEN
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
});

// Local Storage Mock with Event Simulation
export const createEnhancedLocalStorageMock = () => {
  const store = new Map();

  return {
    getItem: vi.fn((key) => store.get(key) || null),
    setItem: vi.fn((key, value) => {
      store.set(key, value);
      // Simulate storage event
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new StorageEvent("storage", {
            key,
            newValue: value,
            oldValue: store.get(key) || null,
          }),
        );
      }
    }),
    removeItem: vi.fn((key) => {
      const oldValue = store.get(key);
      store.delete(key);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new StorageEvent("storage", {
            key,
            newValue: null,
            oldValue,
          }),
        );
      }
    }),
    clear: vi.fn(() => {
      store.clear();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new StorageEvent("storage", { key: null }));
      }
    }),
    length: vi.fn(() => store.size),
    key: vi.fn((index) => Array.from(store.keys())[index] || null),
  };
};

// AI Coach Response Mock
export const createMockAIResponse = (query, overrides = {}) => ({
  response: `Based on your query about "${query}", I recommend focusing on technique refinement and progressive overload.`,
  confidence: 0.92,
  sources: [
    "Journal of Sports Science (2024)",
    "Olympic Training Guidelines",
    "Flag Football Performance Research",
  ],
  actionable: true,
  followUp: [
    "Would you like specific drill recommendations?",
    "Should we adjust your training schedule?",
  ],
  olympicRelevance: "high",
  timestamp: new Date().toISOString(),
  sessionId: "ai-session-123",
  ...overrides,
});

// Performance Test Utilities
export const createLoadTestScenario = (userCount = 100, duration = 30) => ({
  virtualUsers: userCount,
  durationSeconds: duration,
  rampUpTime: 10,
  scenarios: [
    {
      name: "login_flow",
      weight: 30,
      requests: ["POST /api/auth/login", "GET /api/dashboard"],
    },
    {
      name: "training_session",
      weight: 50,
      requests: [
        "GET /api/training/programs",
        "POST /api/training/session",
        "PUT /api/training/session/:id",
      ],
    },
    {
      name: "analytics_view",
      weight: 20,
      requests: [
        "GET /api/analytics/performance",
        "GET /api/analytics/olympic",
      ],
    },
  ],
  acceptanceCriteria: {
    averageResponseTime: 200, // ms
    errorRate: 0.1, // 0.1%
    throughput: 1000, // requests/second
  },
});

// Test Environment Setup
export const setupTestEnvironment = () => {
  // Mock window globals
  global.window = global.window || {};
  global.document = global.document || {};
  global.navigator = global.navigator || { userAgent: "test" };

  // Mock performance API
  global.performance = global.performance || {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
  };

  // Mock geolocation
  global.navigator.geolocation = {
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  };

  // Mock notification API
  global.Notification = vi.fn();
  global.Notification.permission = "granted";
  global.Notification.requestPermission = vi.fn().mockResolvedValue("granted");

  return {
    cleanup: () => {
      vi.clearAllMocks();
      // Additional cleanup if needed
    },
  };
};

// Test Data Validation
export const validateTestData = (data, schema) => {
  // Simple validation helper for test assertions
  const errors = [];

  for (const [key, rules] of Object.entries(schema)) {
    if (rules.required && !(key in data)) {
      errors.push(`Missing required field: ${key}`);
    }

    if (key in data) {
      if (rules.type && typeof data[key] !== rules.type) {
        errors.push(
          `Invalid type for ${key}: expected ${rules.type}, got ${typeof data[key]}`,
        );
      }

      if (rules.min && data[key] < rules.min) {
        errors.push(
          `Value for ${key} below minimum: ${data[key]} < ${rules.min}`,
        );
      }

      if (rules.max && data[key] > rules.max) {
        errors.push(
          `Value for ${key} above maximum: ${data[key]} > ${rules.max}`,
        );
      }
    }
  }

  return { valid: errors.length === 0, errors };
};
