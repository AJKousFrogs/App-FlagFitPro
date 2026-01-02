import { vi } from "vitest";

/**
 * Test Helpers and Utilities for FlagFit Pro
 *
 * Provides mock factories, test utilities, and helper functions
 * for unit, integration, and E2E testing.
 */

// ============================================================================
// Mock API Response Helper
// ============================================================================

/**
 * Creates a mock fetch response
 * @param {object} data - Response data
 * @param {object} options - Response options (status, ok, delay)
 * @returns {Promise<object>} Mock response object
 */
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
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockResponse), delay);
    });
  }

  return Promise.resolve(mockResponse);
};

/**
 * Creates a mock error response
 * @param {string} message - Error message
 * @param {number} status - HTTP status code
 * @returns {Promise<object>} Mock error response
 */
export const createMockErrorResponse = (message, status = 500) => {
  return createMockApiResponse(
    { success: false, error: message },
    { status, ok: false },
  );
};

// ============================================================================
// Mock User Data Factory
// ============================================================================

/**
 * Creates a mock user object
 * @param {object} overrides - Properties to override
 * @returns {object} Mock user data
 */
export const createMockUser = (overrides = {}) => ({
  id: `user-${Math.random().toString(36).substr(2, 9)}`,
  email: "athlete@flagfitpro.com",
  name: "Test Athlete",
  role: "player",
  profile: {
    position: "wide_receiver",
    experience: "intermediate",
    goals: ["speed", "agility", "technique"],
    height: 180,
    weight: 75,
    age: 24,
    team_id: null,
  },
  preferences: {
    units: "metric",
    notifications: true,
    privacy: "public",
    theme: "dark",
  },
  stats: {
    totalTrainingSessions: 45,
    averageWeeklyHours: 8.5,
    currentStreak: 7,
    longestStreak: 21,
  },
  email_verified: true,
  created_at: "2024-01-15T10:00:00Z",
  updated_at: new Date().toISOString(),
  ...overrides,
});

/**
 * Creates a mock coach user
 * @param {object} overrides - Properties to override
 * @returns {object} Mock coach data
 */
export const createMockCoach = (overrides = {}) =>
  createMockUser({
    role: "coach",
    email: "coach@flagfitpro.com",
    name: "Coach",
    profile: {
      certifications: ["NFHS Certified", "USA Football Coach"],
      yearsExperience: 10,
      specialties: ["offense", "quarterback_development"],
    },
    ...overrides,
  });

/**
 * Creates a mock admin user
 * @param {object} overrides - Properties to override
 * @returns {object} Mock admin data
 */
export const createMockAdmin = (overrides = {}) =>
  createMockUser({
    role: "admin",
    email: "admin@flagfitpro.com",
    name: "Admin User",
    ...overrides,
  });

// ============================================================================
// Mock Training Session Factory
// ============================================================================

/**
 * Creates a mock training session
 * @param {object} overrides - Properties to override
 * @returns {object} Mock training session data
 */
export const createMockTrainingSession = (overrides = {}) => ({
  id: Math.floor(Math.random() * 10000),
  userId: "user-123",
  type: "flag_football_drill",
  date: new Date().toISOString().split("T")[0],
  duration: 60,
  status: "completed",
  exercises: [
    {
      id: 1,
      name: "Sprint intervals",
      type: "speed",
      sets: 5,
      reps: 100,
      distance: "40_yards",
      restTime: 90,
      intensity: 8.5,
      completed: true,
    },
    {
      id: 2,
      name: "Flag pulling drills",
      type: "technique",
      sets: 10,
      reps: 20,
      successRate: 85,
      reactionTime: 0.32,
      completed: true,
    },
    {
      id: 3,
      name: "Route running",
      type: "agility",
      sets: 8,
      reps: 5,
      intensity: 7.5,
      completed: true,
    },
  ],
  metrics: {
    averageSpeed: 12.5,
    maxHeartRate: 185,
    averageHeartRate: 155,
    caloriesBurned: 450,
    distanceCovered: 2.5,
  },
  notes: "Excellent session focused on speed and agility",
  rating: 4,
  coachFeedback: "Great improvement in sprint times",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

/**
 * Creates a list of mock training sessions
 * @param {number} count - Number of sessions to create
 * @returns {array} Array of mock training sessions
 */
export const createMockTrainingSessions = (count = 5) => {
  return Array.from({ length: count }, (_, index) =>
    createMockTrainingSession({
      id: index + 1,
      date: new Date(Date.now() - index * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    }),
  );
};

// ============================================================================
// Mock Nutrition Data Factory
// ============================================================================

/**
 * Creates mock nutrition data
 * @param {object} overrides - Properties to override
 * @returns {object} Mock nutrition data
 */
export const createMockNutritionData = (overrides = {}) => ({
  id: Math.floor(Math.random() * 10000),
  userId: "user-123",
  date: new Date().toISOString().split("T")[0],
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
        {
          name: "Banana",
          calories: 105,
          protein: 1.3,
          carbs: 27,
          fat: 0.4,
        },
      ],
    },
    {
      type: "lunch",
      time: "12:30",
      foods: [
        {
          name: "Grilled chicken breast",
          calories: 280,
          protein: 52,
          carbs: 0,
          fat: 6,
        },
        {
          name: "Brown rice",
          calories: 215,
          protein: 5,
          carbs: 45,
          fat: 1.8,
        },
        {
          name: "Mixed vegetables",
          calories: 85,
          protein: 3,
          carbs: 15,
          fat: 0.5,
        },
      ],
    },
    {
      type: "dinner",
      time: "19:00",
      foods: [
        {
          name: "Salmon fillet",
          calories: 350,
          protein: 40,
          carbs: 0,
          fat: 20,
        },
        {
          name: "Sweet potato",
          calories: 180,
          protein: 4,
          carbs: 41,
          fat: 0.2,
        },
        {
          name: "Broccoli",
          calories: 55,
          protein: 3.7,
          carbs: 11,
          fat: 0.6,
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
    {
      name: "Protein powder",
      amount: 30,
      unit: "g",
      timing: "post_workout",
    },
  ],
  analysis: {
    totalCalories: 1670,
    macroRatio: { protein: 30, carbs: 50, fat: 20 },
    timing: "optimal",
    hydrationScore: 85,
  },
  created_at: new Date().toISOString(),
  ...overrides,
});

// ============================================================================
// Mock Performance Analytics Factory
// ============================================================================

/**
 * Creates mock performance data
 * @param {object} overrides - Properties to override
 * @returns {object} Mock performance data
 */
export const createMockPerformanceData = (overrides = {}) => ({
  userId: "user-123",
  period: "30_days",
  metrics: {
    speed: {
      current: 12.8,
      previous: 12.2,
      improvement: 4.9,
      percentile: 85,
      trend: "improving",
    },
    agility: {
      current: 8.7,
      previous: 8.4,
      improvement: 3.6,
      percentile: 78,
      trend: "stable",
    },
    endurance: {
      current: 58.5,
      previous: 56.1,
      improvement: 4.3,
      percentile: 82,
      trend: "improving",
    },
    technique: {
      flagPulling: 88,
      routeRunning: 92,
      catchSuccess: 89,
      overall: 90,
    },
  },
  predictions: {
    nextSessionOptimalIntensity: 8.2,
    injuryRisk: "low",
    recoveryTime: 18, // hours
    recommendedRestDays: 1,
  },
  trends: {
    lastWeek: "improving",
    lastMonth: "steady_growth",
    seasonTrend: "peak_building",
  },
  comparisons: {
    vsLastMonth: {
      speed: "+5%",
      agility: "+3%",
      endurance: "+4%",
    },
    vsPeers: {
      percentileRank: 82,
      category: "above_average",
    },
  },
  ...overrides,
});

// ============================================================================
// Mock Notification Factory
// ============================================================================

/**
 * Creates a mock notification
 * @param {object} overrides - Properties to override
 * @returns {object} Mock notification data
 */
export const createMockNotification = (overrides = {}) => ({
  id: Math.floor(Math.random() * 10000),
  userId: "user-123",
  type: "training_reminder",
  title: "Training Session Reminder",
  message: "Don't forget your scheduled training session today at 3 PM",
  read: false,
  priority: "normal",
  actionUrl: "/training",
  created_at: new Date().toISOString(),
  ...overrides,
});

/**
 * Creates a list of mock notifications
 * @param {number} count - Number of notifications to create
 * @returns {array} Array of mock notifications
 */
export const createMockNotifications = (count = 5) => {
  const types = [
    "training_reminder",
    "achievement",
    "coach_message",
    "system",
    "nutrition_tip",
  ];
  return Array.from({ length: count }, (_, index) =>
    createMockNotification({
      id: index + 1,
      type: types[index % types.length],
      read: index > 1, // First 2 unread
    }),
  );
};

// ============================================================================
// Mock AI Coach Response Factory
// ============================================================================

/**
 * Creates a mock AI coach response
 * @param {string} query - User query
 * @param {object} overrides - Properties to override
 * @returns {object} Mock AI response data
 */
export const createMockAIResponse = (query, overrides = {}) => ({
  response: `Based on your query about "${query}", I recommend focusing on technique refinement and progressive overload.`,
  confidence: 0.92,
  sources: [
    "Journal of Sports Science (2024)",
    "NFL Combine Training Guidelines",
    "Flag Football Performance Research",
  ],
  actionable: true,
  recommendations: [
    {
      type: "exercise",
      name: "Sprint intervals",
      description: "5x40 yard sprints with 90s rest",
    },
    {
      type: "technique",
      name: "Flag pull timing",
      description: "Practice reaction drills",
    },
  ],
  followUp: [
    "Would you like specific drill recommendations?",
    "Should we adjust your training schedule?",
  ],
  timestamp: new Date().toISOString(),
  sessionId: `ai-session-${Math.random().toString(36).substr(2, 9)}`,
  ...overrides,
});

// ============================================================================
// Database Test Utilities
// ============================================================================

/**
 * Creates a mock database connection
 * @returns {object} Mock database connection
 */
export const createMockDatabaseConnection = () => ({
  query: vi.fn(),
  transaction: vi.fn(),
  close: vi.fn(),
  isConnected: vi.fn().mockReturnValue(true),
});

/**
 * Creates a mock Supabase client
 * @returns {object} Mock Supabase client
 */
export const createMockSupabaseClient = () => ({
  auth: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    getUser: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  })),
});

// ============================================================================
// WebSocket Mock for Real-time Features
// ============================================================================

/**
 * Creates a mock WebSocket
 * @returns {object} Mock WebSocket
 */
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

// ============================================================================
// Local Storage Mock with Event Simulation
// ============================================================================

/**
 * Creates an enhanced localStorage mock with event simulation
 * @returns {object} Mock localStorage
 */
export const createEnhancedLocalStorageMock = () => {
  const store = new Map();

  return {
    getItem: vi.fn((key) => store.get(key) || null),
    setItem: vi.fn((key, value) => {
      const oldValue = store.get(key);
      store.set(key, value);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new StorageEvent("storage", {
            key,
            newValue: value,
            oldValue: oldValue || null,
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
    get length() {
      return store.size;
    },
    key: vi.fn((index) => Array.from(store.keys())[index] || null),
    _store: store, // Expose for testing
  };
};

// ============================================================================
// Performance Test Utilities
// ============================================================================

/**
 * Creates a load test scenario configuration
 * @param {number} userCount - Number of virtual users
 * @param {number} duration - Test duration in seconds
 * @returns {object} Load test scenario
 */
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
        "GET /api/analytics/summary",
      ],
    },
  ],
  acceptanceCriteria: {
    averageResponseTime: 200, // ms
    errorRate: 0.1, // 0.1%
    throughput: 1000, // requests/second
  },
});

// ============================================================================
// Test Environment Setup
// ============================================================================

/**
 * Sets up the test environment with common mocks
 * @returns {object} Cleanup function
 */
export const setupTestEnvironment = () => {
  // Mock window globals
  global.window ||= {};
  global.document ||= {};
  global.navigator ||= { userAgent: "test" };

  // Mock performance API
  global.performance ||= {
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

  // Mock fetch
  global.fetch = vi.fn();

  return {
    cleanup: () => {
      vi.clearAllMocks();
    },
  };
};

// ============================================================================
// Test Data Validation
// ============================================================================

/**
 * Validates test data against a schema
 * @param {object} data - Data to validate
 * @param {object} schema - Validation schema
 * @returns {object} Validation result
 */
export const validateTestData = (data, schema) => {
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

      if (rules.min !== undefined && data[key] < rules.min) {
        errors.push(
          `Value for ${key} below minimum: ${data[key]} < ${rules.min}`,
        );
      }

      if (rules.max !== undefined && data[key] > rules.max) {
        errors.push(
          `Value for ${key} above maximum: ${data[key]} > ${rules.max}`,
        );
      }

      if (rules.pattern && !rules.pattern.test(data[key])) {
        errors.push(`Value for ${key} does not match pattern`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
};

// ============================================================================
// Async Test Utilities
// ============================================================================

/**
 * Waits for a specified number of milliseconds
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Promise that resolves after delay
 */
// eslint-disable-next-line no-promise-executor-return
export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Waits for a condition to be true
 * @param {function} condition - Function that returns boolean
 * @param {number} timeout - Maximum wait time in ms
 * @param {number} interval - Check interval in ms
 * @returns {Promise} Promise that resolves when condition is true
 */
export const waitFor = async (condition, timeout = 5000, interval = 100) => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    await wait(interval);
  }

  throw new Error(`Condition not met within ${timeout}ms`);
};

// ============================================================================
// Mock Date Utilities
// ============================================================================

/**
 * Creates a mock date for testing
 * @param {string} dateString - ISO date string
 * @returns {function} Cleanup function to restore Date
 */
export const mockDate = (dateString) => {
  const RealDate = Date;
  const mockDate = new RealDate(dateString);

  global.Date = class extends RealDate {
    constructor(...args) {
      if (args.length === 0) {
        return mockDate;
      }
      return new RealDate(...args);
    }

    static now() {
      return mockDate.getTime();
    }
  };

  return () => {
    global.Date = RealDate;
  };
};
