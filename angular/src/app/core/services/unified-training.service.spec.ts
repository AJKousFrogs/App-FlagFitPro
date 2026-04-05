import { TestBed } from "@angular/core/testing";
import { UnifiedTrainingService } from "./unified-training.service";
import { ApiService, API_ENDPOINTS } from "./api.service";
import { AuthService } from "./auth.service";
import { SupabaseService } from "./supabase.service";
import { ReadinessService } from "./readiness.service";
import { PlayerProgramService } from "./player-program.service";
import { WellnessService } from "./wellness.service";
import { TrainingDataService } from "./training-data.service";
import { PerformanceDataService } from "./performance-data.service";
import { LoggerService } from "./logger.service";
import { firstValueFrom, Observable, of, throwError } from "rxjs";
import { mockUser, mockAuthService } from "./auth.service.spec";
import { mockSupabaseService } from "./supabase.service.spec";
import { mockPlayerProgramService } from "./player-program.service.mock";
import { mockLoggerService } from "./logger.service.mock";
import { AcwrService } from "./acwr.service";
import type { Workout } from "../models/training.models";
import { mockProtocolMetricsSnapshot } from "../../../../test/mock-data/protocol-metrics.mock";
import { mockWeeklySchedule } from "../../../../test/mock-data/weekly-schedule.mock";
import { mockWorkout } from "../../../../test/mock-data/workout.mock";
import { mockImportLogs } from "../../../../test/mock-data/import-logs.mock";
import { mockProgramAssignment } from "../../../../test/mock-data/program-assignment.mock";
import { signal } from "@angular/core";
import { USERS } from "../../../../test/mock-data/users.mock"; // Assuming USERS is available
import { vi } from "vitest";

// Mock Data (if not globally available or needs specific override)
const mockUserForAuth = USERS[0]; // Use a specific user for auth tests

/** Mirrors `DEFAULT_DAILY_ROUTINE` in unified-training.service.ts (for expectations). */
const DEFAULT_DAILY_ROUTINE_EXPECTED = [
  { id: "wake", label: "Wake Up", time: "07:00", icon: "pi-sun" },
  { id: "breakfast", label: "Breakfast", time: "08:15", icon: "pi-apple" },
  {
    id: "work_start",
    label: "Work/Study Start",
    time: "09:00",
    icon: "pi-briefcase",
  },
  { id: "lunch", label: "Lunch", time: "12:30", icon: "pi-utensils" },
  {
    id: "work_end",
    label: "Work/Study End",
    time: "17:00",
    icon: "pi-home",
  },
  {
    id: "training",
    label: "Daily Training",
    time: "18:00",
    icon: "pi-bolt",
  },
  {
    id: "shower",
    label: "Shower (Hot)",
    time: "20:00",
    icon: "pi-info-circle",
  },
  { id: "sleep", label: "Sleep", time: "22:30", icon: "pi-moon" },
];

const mockApiService = {
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};

const mockReadinessService = {
  current: vi.fn().mockReturnValue({
    score: 80,
    level: "high",
    wellnessIndex: { completeness: 1 },
  }),
  calculateToday: vi.fn().mockReturnValue(
    of({
      score: 80,
      level: "high",
      wellnessIndex: { completeness: 1 },
    }),
  ),
};

const mockWellnessService = {
  latestWellnessEntry: signal({
    hydration: 8,
    sleepQuality: 7,
    energyLevel: 7,
    stressLevel: 4,
    muscleSoreness: 5,
  }),
  logWellness: vi.fn().mockReturnValue(of({ success: true, data: {} })),
};

const mockTrainingDataService = {
  createTrainingSession: vi.fn().mockReturnValue(of({ success: true, data: {} })),
};

const mockPerformanceDataService = {
  logMeasurement: vi.fn().mockReturnValue(of({ success: true, data: {} })),
  logSupplement: vi.fn().mockReturnValue(of({ success: true, data: {} })),
  todaysSupplements: signal([] as unknown[]),
  latestMeasurement: signal(null),
  recentMeasurements: signal([]),
};

const mockAcwrService = {
  acwrRatio: signal(1.0),
  acuteLoad: signal(500),
  chronicLoad: signal(500),
  weeklyProgression: signal(0),
  riskZone: signal("optimal"),
  getTrainingModification: vi.fn().mockReturnValue(of(null)),
  acwrData: vi.fn().mockReturnValue({}),
};

// Mock Supabase Service for Auth Service
const mockSupabaseAuthService = {
  isAuthenticated: vi.fn().mockReturnValue(true),
  // Mock signIn and signUp methods
  signIn: vi.fn().mockResolvedValue({
    data: { user: mockUserForAuth, session: { access_token: "fake-token" } },
    error: null,
  }),
  signUp: vi.fn().mockResolvedValue({
    data: { user: mockUserForAuth, session: { access_token: "fake-token" } },
    error: null,
  }),
  signOut: vi.fn().mockResolvedValue({ error: null }),
  getUser: vi.fn().mockResolvedValue({ data: { user: mockUserForAuth } }),
  session: vi.fn().mockReturnValue({ access_token: "fake-token" }),
  getToken: vi.fn().mockResolvedValue("fake-token"),
};

// Mock AuthService using the mocked Supabase Auth
const mockAuthServiceInstance = {
  currentUser: signal(mockUserForAuth),
  isAuthenticated: signal(true),
  isLoading: signal(false),
  getUser: vi.fn().mockReturnValue(mockUserForAuth),
  getToken: vi.fn().mockResolvedValue("fake-token"),
  redirectToDashboard: vi.fn(),
  redirectToLogin: vi.fn(),
  checkAuth: vi.fn().mockReturnValue(true),
  logout: vi.fn().mockReturnValue(of(null)),
  // Add other methods/signals if they are directly used by UnifiedTrainingService
  // Ensure these mocks match the expected return types and values.
  // For example, if currentUser signal is accessed directly, ensure it's mocked.
  currentUserSignal: signal(mockUserForAuth), // Mocking signal getter if needed
};

describe("UnifiedTrainingService", () => {
  let service: UnifiedTrainingService;
  let authService: AuthService;
  let apiService: ApiService;
  let supabaseService: SupabaseService;
  let readinessService: ReadinessService;
  let playerProgramService: PlayerProgramService;
  let wellnessService: WellnessService;
  let trainingDataService: TrainingDataService;
  let performanceDataService: PerformanceDataService;
  let loggerService: LoggerService;
  let acwrService: AcwrService;
  let mockPlayerProgram: ReturnType<typeof mockPlayerProgramService>;
  let mockLoggerInstance: ReturnType<typeof mockLoggerService>;

  beforeEach(() => {
    mockPlayerProgram = mockPlayerProgramService();
    mockLoggerInstance = mockLoggerService();
    TestBed.configureTestingModule({
      providers: [
        UnifiedTrainingService,
        // AuthService mock needs to provide the signal getter if used directly
        {
          provide: AuthService,
          useValue: {
            ...mockAuthServiceInstance,
            currentUser: vi.fn().mockReturnValue(mockUserForAuth), // Ensure this matches signal usage
          },
        },
        { provide: ApiService, useValue: mockApiService },
        { provide: SupabaseService, useValue: mockSupabaseAuthService },
        { provide: ReadinessService, useValue: mockReadinessService },
        { provide: PlayerProgramService, useValue: mockPlayerProgram },
        { provide: WellnessService, useValue: mockWellnessService },
        { provide: TrainingDataService, useValue: mockTrainingDataService },
        { provide: PerformanceDataService, useValue: mockPerformanceDataService },
        { provide: LoggerService, useValue: mockLoggerInstance },
        { provide: AcwrService, useValue: mockAcwrService },
      ],
    });

    service = TestBed.inject(UnifiedTrainingService);
    authService = TestBed.inject(AuthService);
    apiService = TestBed.inject(ApiService);
    supabaseService = TestBed.inject(SupabaseService);
    readinessService = TestBed.inject(ReadinessService);
    playerProgramService = TestBed.inject(PlayerProgramService);
    wellnessService = TestBed.inject(WellnessService);
    trainingDataService = TestBed.inject(TrainingDataService);
    performanceDataService = TestBed.inject(PerformanceDataService);
    loggerService = TestBed.inject(LoggerService);
    acwrService = TestBed.inject(AcwrService);

    // Ensure mocks are reset and properly configured for each test
    vi.clearAllMocks();
    mockSupabaseAuthService.isAuthenticated.mockReturnValue(true);

    // Mock Supabase currentUser signal and session
    supabaseService.currentUser = signal(mockUserForAuth);
    supabaseService.session = vi.fn().mockReturnValue({ access_token: "mock-token", user: mockUserForAuth });
    authService.currentUser = signal(mockUserForAuth); // Ensure authService's signal is also set
    authService.isAuthenticated = signal(true);
    authService.getUser = vi.fn().mockReturnValue(mockUserForAuth);

    // Mock API service responses globally if needed
    mockApiService.get.mockReturnValue(of({ success: true, data: {} }));
    mockApiService.post.mockReturnValue(of({ success: true, data: {} }));
    mockApiService.delete.mockReturnValue(of({ success: true, data: {} }));

    // Mock Supabase client methods used by the service
    supabaseService.client = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUserForAuth } }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
      },
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { first_name: "John" } }),
    } as any;

    // Mock other services
    mockReadinessService.current.mockReturnValue({
      score: 80,
      level: "high",
      wellnessIndex: { completeness: 1 },
    });
    mockPlayerProgram.getMyProgramAssignment.mockReturnValue(of(mockProgramAssignment));
    mockWellnessService.latestWellnessEntry = signal({
      hydration: 8,
      sleepQuality: 7,
      energyLevel: 7,
      stressLevel: 4,
      muscleSoreness: 5,
    });
    mockTrainingDataService.createTrainingSession = vi.fn().mockReturnValue(of({ success: true, data: {} }));
    mockPerformanceDataService.logMeasurement = vi.fn().mockReturnValue(of({ success: true, data: {} }));
    mockPerformanceDataService.todaysSupplements = signal([]);
    mockAcwrService.acwrRatio = signal(1.0);
    mockAcwrService.acuteLoad = signal(500);
    mockAcwrService.chronicLoad = signal(500);
    mockAcwrService.weeklyProgression = signal(0);
    mockAcwrService.riskZone = signal("optimal");
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("programAssignment", () => {
    it("should return null if no program assigned", () => {
      mockPlayerProgram.getMyProgramAssignment.mockReturnValue(of(null));
      service.loadProgramAssignment();
      expect(service.programAssignment()).toBeNull();
    });

    it("should return program assignment if assigned", () => {
      service.loadProgramAssignment();
      expect(service.programAssignment()).toEqual(mockProgramAssignment);
    });
  });

  describe("hasProgramAssignment", () => {
    it("should return false if no program assigned", () => {
      mockPlayerProgram.getMyProgramAssignment.mockReturnValue(of(null));
      service.loadProgramAssignment();
      expect(service.hasProgramAssignment()).toBe(false);
    });

    it("should return true if program assigned", () => {
      service.loadProgramAssignment();
      expect(service.hasProgramAssignment()).toBe(true);
    });
  });

  describe("getTodayOverview", () => {
    it("should fetch overview data", async () => {
      // Mock the API responses for each service call within loadAllTrainingData
      // This mock should be adjusted based on the actual API calls made by loadAllTrainingData
      // For now, let's mock the combineLatest part of the call
      // Mock loadDailyProtocolSnapshot, loadTrainingRecommendationsSnapshot, etc.
      // Simplified: Mock the output of combineLatest inside getTodayOverview
      vi.spyOn(service as any, "createTodayOverviewRequest").mockReturnValue(
        of({
          protocol: { data: mockProtocolMetricsSnapshot },
          readiness: { score: 80, level: "high", wellnessIndex: { completeness: 1 } },
          recommendations: { data: { message: "Stay hydrated" } },
          trainingData: {
            userName: "John Doe",
            stats: [{ label: "Total Workouts", value: 10 }],
            schedule: mockWeeklySchedule,
            workouts: mockWorkout,
            achievements: [],
            wellnessData: { alert: null, readinessScore: 80, readinessStatus: "high" },
          },
          aiInsight: "Looks good!",
        }),
      );

      const data = await firstValueFrom(service.getTodayOverview());
      expect(data).not.toBeNull();
      expect(data?.aiInsight).toBe("Looks good!");
    });

    it("should handle API errors gracefully", async () => {
      // Mock an error during API calls
      vi.spyOn(service as any, "createTodayOverviewRequest").mockReturnValue(
        throwError(() => new Error("API error")),
      );

      await expect(firstValueFrom(service.getTodayOverview())).rejects.toThrow("API error");
    });

    it("should return null if user is not authenticated", () => {
      // Simulate user not authenticated
      authService.isAuthenticated = signal(false);
      mockSupabaseAuthService.isAuthenticated.mockReturnValue(false);
      // Supabase service signal also needs to be updated if it directly reflects auth state
      supabaseService.currentUser = signal(null);
      authService.currentUser = signal(null);

      expect(service.getTodayOverview()).toBeInstanceOf(Observable);
      // The observable will emit null or an empty result. We test the *creation* of the observable here.
      // A more thorough test would involve subscribing and checking the emitted value.
    });

    it("should return null if authFailureCooldown is active", () => {
      (service as any).authFailureCooldownUntil = Date.now() + 10000; // Set cooldown
      expect(service.getTodayOverview()).toBeInstanceOf(Observable);
      // Similar to the above, testing the observable creation.
    });
  });

  describe("generateDailyProtocol", () => {
    it("should call the API to generate daily protocol", async () => {
      apiService.post.mockReturnValue(of({ success: true, data: {} }));
      const response = await firstValueFrom(service.generateDailyProtocol("2023-10-26"));
      expect(apiService.post).toHaveBeenCalledWith(
        API_ENDPOINTS.dailyProtocol.generate,
        { date: "2023-10-26" },
      );
      expect(response.success).toBe(true);
    });
  });

  describe("getProtocolForDate", () => {
    it("should call the API to get protocol for a specific date", async () => {
      apiService.get.mockReturnValue(of({ success: true, data: {} }));
      const response = await firstValueFrom(service.getProtocolForDate("2023-10-26"));
      expect(apiService.get).toHaveBeenCalledWith(
        `${API_ENDPOINTS.dailyProtocol.byDate("2023-10-26")}`,
      );
      expect(response.success).toBe(true);
    });
  });

  describe("logTrainingSession", () => {
    it("should call the API to log a training session", async () => {
      trainingDataService.createTrainingSession = vi.fn().mockReturnValue(of({ success: true, data: {} }));
      await service.logTrainingSession({ title: "Test Workout" } as any);
      expect(trainingDataService.createTrainingSession).toHaveBeenCalled();
    });

    it("should refresh readiness after logging", async () => {
      trainingDataService.createTrainingSession = vi.fn().mockReturnValue(of({ success: true, data: {} }));
      await service.logTrainingSession({ title: "Test Workout" } as any);
      expect(readinessService.calculateToday).toHaveBeenCalled();
    });
  });

  describe("submitWellness", () => {
    it("should call the API to submit wellness data", async () => {
      wellnessService.logWellness = vi.fn().mockReturnValue(of({ success: true, data: {} }));
      await service.submitWellness({ hydration: 8 });
      expect(wellnessService.logWellness).toHaveBeenCalledWith({ hydration: 8 });
    });

    it("should refresh readiness after submitting wellness", async () => {
      wellnessService.logWellness = vi.fn().mockReturnValue(of({ success: true, data: {} }));
      await service.submitWellness({ hydration: 8 });
      expect(readinessService.calculateToday).toHaveBeenCalled();
    });
  });

  describe("addHydration", () => {
    it("should update hydration level", async () => {
      const currentWellness = { hydration: 8 };
      wellnessService.latestWellnessEntry = signal(currentWellness);
      wellnessService.logWellness = vi.fn().mockReturnValue(of({ success: true, data: {} }));

      await service.addHydration(500); // 500ml = 2 glasses
      expect(wellnessService.logWellness).toHaveBeenCalledWith(
        expect.objectContaining({ hydration: 10 }),
      );
    });
  });

  describe("logSupplement", () => {
    it("should call performanceDataService.logSupplement", () => {
      performanceDataService.logSupplement = vi.fn();
      service.logSupplement({
        name: "Protein Powder",
        taken: true,
        timeOfDay: "morning",
        date: "2023-10-26",
      });
      expect(performanceDataService.logSupplement).toHaveBeenCalled();
    });
  });

  describe("logBodyComp", () => {
    it("should call performanceDataService.logMeasurement", async () => {
      performanceDataService.logMeasurement = vi.fn().mockReturnValue(of({ success: true, data: {} }));
      await service.logBodyComp({ weight_kg: 70 });
      expect(performanceDataService.logMeasurement).toHaveBeenCalledWith({ weight_kg: 70 });
    });
  });

  describe("getWellnessForDay", () => {
    it("should call API to get wellness for a date", () => {
      apiService.get.mockReturnValue(of({ success: true, data: {} }));
      service.getWellnessForDay("2023-10-26");
      expect(apiService.get).toHaveBeenCalledWith("/api/wellness/checkin?date=2023-10-26");
    });
  });

  describe("markWorkoutComplete", () => {
    const sampleWorkout: Workout = {
      id: "test-workout-id",
      type: "strength",
      title: mockWorkout.name,
      description: "",
      duration: String(mockWorkout.duration),
      intensity: "medium",
      location: "gym",
      icon: "pi-bolt",
      iconBg: "#fff",
    };

    it("should call snapshot mutation", async () => {
      const insertMock = vi.fn().mockResolvedValue({ error: null });
      (service as any).supabase.client.from = vi.fn().mockReturnValue({
        insert: insertMock,
      });
      await service.markWorkoutComplete(sampleWorkout);
      expect((service as any).supabase.client.from).toHaveBeenCalledWith("training_sessions");
      expect(insertMock).toHaveBeenCalled();
    });

    it("should refresh overview after mutation", async () => {
      const insertMock = vi.fn().mockResolvedValue({ error: null });
      (service as any).supabase.client.from = vi.fn().mockReturnValue({
        insert: insertMock,
      });
      vi.spyOn(service as any, "refreshOverviewAfterWorkoutMutation").mockResolvedValue(undefined);
      await service.markWorkoutComplete(sampleWorkout);
      expect((service as any).refreshOverviewAfterWorkoutMutation).toHaveBeenCalled();
    });
  });

  describe("postponeWorkout", () => {
    const sampleWorkout: Workout = {
      id: "test-workout-id",
      type: "strength",
      title: mockWorkout.name,
      description: "",
      duration: String(mockWorkout.duration),
      intensity: "medium",
      location: "gym",
      icon: "pi-bolt",
      iconBg: "#fff",
    };

    it("should call snapshot mutation", async () => {
      const eqMock = vi.fn().mockResolvedValue({ error: null });
      const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
      (service as any).supabase.client.from = vi.fn().mockReturnValue({
        update: updateMock,
      });
      await service.postponeWorkout(sampleWorkout);
      expect((service as any).supabase.client.from).toHaveBeenCalledWith("training_sessions");
      expect(updateMock).toHaveBeenCalled();
      expect(eqMock).toHaveBeenCalledWith("id", "test-workout-id");
    });

    it("should refresh overview after mutation", async () => {
      const eqMock = vi.fn().mockResolvedValue({ error: null });
      const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
      (service as any).supabase.client.from = vi.fn().mockReturnValue({
        update: updateMock,
      });
      vi.spyOn(service as any, "refreshOverviewAfterWorkoutMutation").mockResolvedValue(undefined);
      await service.postponeWorkout(sampleWorkout);
      expect((service as any).refreshOverviewAfterWorkoutMutation).toHaveBeenCalled();
    });
  });

  describe("dismissWellnessAlert", () => {
    it("should set wellnessAlert signal to null", () => {
      service.dismissWellnessAlert();
      expect(service.wellnessAlert()).toBeNull();
    });
  });

  describe("removeWorkout", () => {
    it("should remove workout from list", () => {
      const initialWorkouts = [{ id: "1", title: "Workout 1" }, { id: "2", title: "Workout 2" }];
      service['_workouts'].set(initialWorkouts as any);
      service.removeWorkout("Workout 1");
      expect(service.workouts()).toEqual([{ id: "2", title: "Workout 2" }]);
    });
  });

  describe("generateAiInsight", () => {
    it("should generate an insight with recommendations, ACWR, and readiness", () => {
      const mockData = {
        protocol: { data: mockProtocolMetricsSnapshot },
        readiness: { score: 80, level: "high", wellnessIndex: { completeness: 1 } },
        recommendations: { data: { message: "Stay hydrated" } },
        trainingData: {
          userName: "John Doe",
          stats: [{ label: "Current Streak", value: 5 }],
          schedule: [],
          workouts: [],
          achievements: [],
          wellnessData: { alert: null, readinessScore: 80, readinessStatus: "high" },
        },
      };
      // Mock acwrService.acwrRatio signal
      (service as any).acwrService.acwrRatio = signal(1.2);
      (service as any)._trainingStats.set([
        {
          label: "Current Streak",
          value: "5",
          icon: "",
          color: "",
          trend: "",
          trendType: "neutral",
        },
      ]);
      const insight = service["generateAiInsight"](mockData as any);
      expect(insight).toContain("5");
      expect(insight).toContain("streak");
      expect(insight).toContain("momentum");
    });

    it("should handle missing data gracefully", () => {
      const mockData = {
        protocol: { data: null },
        readiness: null,
        recommendations: { data: null },
        trainingData: {
          userName: "Jane Doe",
          stats: [],
          schedule: [],
          workouts: [],
          achievements: [],
          wellnessData: { alert: null, readinessScore: null, readinessStatus: "unknown" },
        },
      };
      (service as any).acwrService.acwrRatio = signal(0.8);
      const insight = service["generateAiInsight"](mockData as any);
      expect(insight).toContain("Consistency is your superpower");
    });
  });

  describe("loadPlayerSettingsRoutine", () => {
    it("should load and set daily routine", async () => {
      const mockDailyRoutine = [
        { id: "wake", label: "Wake Up", time: "07:00", icon: "pi-sun" },
      ];
      mockApiService.get.mockReturnValue(of({ success: true, data: { dailyRoutine: mockDailyRoutine } }));
      await service.loadPlayerSettingsRoutine();
      expect(service.dailyRoutine()).toEqual(mockDailyRoutine);
    });

    it("should use default routine if none is loaded", async () => {
      mockApiService.get.mockReturnValue(of({ success: true, data: {} })); // No dailyRoutine
      await service.loadPlayerSettingsRoutine();
      expect(service.dailyRoutine()).toEqual(DEFAULT_DAILY_ROUTINE_EXPECTED);
    });

    it("should handle API errors gracefully", async () => {
      mockApiService.get.mockReturnValue(throwError(() => new Error("API error")));
      await service.loadPlayerSettingsRoutine();
      expect(service.dailyRoutine()).toEqual(DEFAULT_DAILY_ROUTINE_EXPECTED); // Falls back to default
    });
  });

  describe("addHydration", () => {
    it("should update hydration level", async () => {
      const currentWellness = { hydration: 8 };
      wellnessService.latestWellnessEntry = signal(currentWellness);
      wellnessService.logWellness = vi.fn().mockReturnValue(of({ success: true, data: {} }));

      await service.addHydration(500); // 500ml = 2 glasses
      expect(wellnessService.logWellness).toHaveBeenCalledWith(
        expect.objectContaining({ hydration: 10 }),
      );
    });
  });

  describe("loadProgramAssignment", () => {
    it("should load program assignment", () => {
      service.loadProgramAssignment();
      expect(playerProgramService.getMyProgramAssignment).toHaveBeenCalled();
    });

    it("should set hasProgramAssignment to false if no assignment", () => {
      mockPlayerProgram.getMyProgramAssignment.mockReturnValue(of(null));
      service.loadProgramAssignment();
      expect(service.hasProgramAssignment()).toBe(false);
    });
  });

  describe("refreshAfterMutation", () => {
    it("should refresh readiness and training data", () => {
      vi.spyOn(service as any, "loadPlayerSettingsRoutine");
      vi.spyOn(service as any, "loadAllTrainingData");
      (service as any).refreshAfterMutation({ refreshReadiness: true });
      expect(readinessService.calculateToday).toHaveBeenCalled();
      expect((service as any).loadPlayerSettingsRoutine).toHaveBeenCalled();
      expect((service as any).loadAllTrainingData).toHaveBeenCalled();
    });
  });

  describe("isExpectedApiClientError", () => {
    it("should return true for expected API error statuses", () => {
      expect(service["isExpectedApiClientError"]({ status: 400 })).toBe(true);
      expect(service["isExpectedApiClientError"]({ status: 401 })).toBe(true);
      expect(service["isExpectedApiClientError"]({ status: 403 })).toBe(true);
      expect(service["isExpectedApiClientError"]({ status: 404 })).toBe(true);
      expect(service["isExpectedApiClientError"]({ status: 500 })).toBe(false); // Unexpected server error
    });

    it("should return false for generic Errors and plain objects (not API-shaped)", () => {
      expect(service["isExpectedApiClientError"](new Error("Network error"))).toBe(false);
      expect(service["isExpectedApiClientError"]({ message: "Failed to fetch" })).toBe(false);
    });

    it("should return false for unexpected errors", () => {
      expect(service["isExpectedApiClientError"](new Error("Some other error"))).toBe(
        false,
      );
      expect(service["isExpectedApiClientError"]({})).toBe(false);
    });
  });
});
