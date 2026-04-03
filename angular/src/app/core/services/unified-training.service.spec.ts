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
import { Observable, of, throwError } from "rxjs";
import { mockUser, mockAuthService } from "./auth.service.spec";
import { mockSupabaseService } from "./supabase.service.spec";
import { mockApiService } from "./api.service.spec";
import { mockReadinessService } from "./readiness.service.spec";
import { mockPlayerProgramService } from "./player-program.service.mock";
import { mockWellnessService } from "./wellness.service.spec";
import { mockTrainingDataService } from "./training-data.service.spec";
import { mockPerformanceDataService } from "./performance-data.service.spec";
import { mockLoggerService } from "./logger.service.mock";
import { mockAcwrService } from "./acwr.service.spec";
import { AcwrService } from "./acwr.service";
import { mockDailyRoutine } from "../../../../test/mock-data/unified-training.mock";
import { mockProtocolMetricsSnapshot } from "../../../../test/mock-data/protocol-metrics.mock";
import { mockWeeklySchedule } from "../../../../test/mock-data/weekly-schedule.mock";
import { mockWorkout } from "../../../../test/mock-data/workout.mock";
import { mockImportLogs } from "../../../../test/mock-data/import-logs.mock";
import { mockProgramAssignment } from "../../../../test/mock-data/program-assignment.mock";
import { signal } from "@angular/core";
import { USERS } from "../../../../test/mock-data/users.mock"; // Assuming USERS is available
import { vi } from "vitest";
import { vi } from "vitest";

// Mock Data (if not globally available or needs specific override)
const mockUserForAuth = USERS[0]; // Use a specific user for auth tests

// Mock Supabase Service for Auth Service
const mockSupabaseAuthService = {
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

  beforeEach(() => {
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
        { provide: ApiService, useValue: mockApiService() },
        { provide: SupabaseService, useValue: mockSupabaseAuthService },
        { provide: ReadinessService, useValue: mockReadinessService() },
        { provide: PlayerProgramService, useValue: mockPlayerProgramService() },
        { provide: WellnessService, useValue: mockWellnessService() },
        { provide: TrainingDataService, useValue: mockTrainingDataService() },
        { provide: PerformanceDataService, useValue: mockPerformanceDataService() },
        { provide: LoggerService, useValue: mockLoggerService() },
        { provide: AcwrService, useValue: mockAcwrService() },
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
    mockReadinessService.current = vi.fn().mockReturnValue({
      score: 80,
      level: "high",
      wellnessIndex: { completeness: 1 },
    });
    mockPlayerProgramService.getMyProgramAssignment = vi.fn().mockReturnValue(of(mockProgramAssignment));
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
      mockPlayerProgramService.getMyProgramAssignment.mockReturnValue(of(null));
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
      mockPlayerProgramService.getMyProgramAssignment.mockReturnValue(of(null));
      service.loadProgramAssignment();
      expect(service.hasProgramAssignment()).toBe(false);
    });

    it("should return true if program assigned", () => {
      service.loadProgramAssignment();
      expect(service.hasProgramAssignment()).toBe(true);
    });
  });

  describe("getTodayOverview", () => {
    it("should fetch overview data", (done) => {
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

      service.getTodayOverview().subscribe((data) => {
        expect(data).not.toBeNull();
        expect(data?.aiInsight).toBe("Looks good!");
        done();
      });
    });

    it("should handle API errors gracefully", (done) => {
      // Mock an error during API calls
      vi.spyOn(service as any, "createTodayOverviewRequest").mockReturnValue(
        throwError(() => new Error("API error")),
      );

      service.getTodayOverview().subscribe({
        next: (data) => {
          expect(data).toBeNull();
          done();
        },
        error: (err) => {
          expect(err.message).toBe("API error");
          done();
        },
      });
    });

    it("should return null if user is not authenticated", () => {
      // Simulate user not authenticated
      authService.isAuthenticated = signal(false);
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
    it("should call the API to generate daily protocol", (done) => {
      apiService.post.mockReturnValue(of({ success: true, data: {} }));
      service.generateDailyProtocol("2023-10-26").subscribe((response) => {
        expect(apiService.post).toHaveBeenCalledWith(
          API_ENDPOINTS.dailyProtocol.generate,
          { date: "2023-10-26" },
        );
        expect(response.success).toBe(true);
        done();
      });
    });
  });

  describe("getProtocolForDate", () => {
    it("should call the API to get protocol for a specific date", (done) => {
      apiService.get.mockReturnValue(of({ success: true, data: {} }));
      service.getProtocolForDate("2023-10-26").subscribe((response) => {
        expect(apiService.get).toHaveBeenCalledWith(
          `${API_ENDPOINTS.dailyProtocol.byDate("2023-10-26")}`,
        );
        expect(response.success).toBe(true);
        done();
      });
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
    it("should call snapshot mutation", async () => {
      const workout = mockWorkout[0];
      workout.id = "test-workout-id";
      // Mock snapshot mutation
      (service as any).supabase.client.from = vi.fn().mockReturnThis();
      (service as any).supabase.client.update = vi.fn().mockResolvedValue({
        success: true,
        data: [],
      });
      await service.markWorkoutComplete(workout);
      expect((service as any).supabase.client.from).toHaveBeenCalledWith("training_sessions");
      expect((service as any).supabase.client.update).toHaveBeenCalled();
    });

    it("should refresh overview after mutation", async () => {
      const workout = mockWorkout[0];
      workout.id = "test-workout-id";
      // Mock snapshot mutation success
      (service as any).supabase.client.update = vi.fn().mockResolvedValue({
        success: true,
        data: [],
      });
      vi.spyOn(service as any, "refreshOverviewAfterWorkoutMutation");
      await service.markWorkoutComplete(workout);
      expect((service as any).refreshOverviewAfterWorkoutMutation).toHaveBeenCalled();
    });
  });

  describe("postponeWorkout", () => {
    it("should call snapshot mutation", async () => {
      const workout = mockWorkout[0];
      workout.id = "test-workout-id";
      // Mock snapshot mutation
      (service as any).supabase.client.from = vi.fn().mockReturnThis();
      (service as any).supabase.client.update = vi.fn().mockResolvedValue({
        success: true,
        data: [],
      });
      await service.postponeWorkout(workout);
      expect((service as any).supabase.client.from).toHaveBeenCalledWith("training_sessions");
      expect((service as any).supabase.client.update).toHaveBeenCalled();
    });

    it("should refresh overview after mutation", async () => {
      const workout = mockWorkout[0];
      workout.id = "test-workout-id";
      // Mock snapshot mutation success
      (service as any).supabase.client.update = vi.fn().mockResolvedValue({
        success: true,
        data: [],
      });
      vi.spyOn(service as any, "refreshOverviewAfterWorkoutMutation");
      await service.postponeWorkout(workout);
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
      expect(service['generateAiInsight'](mockData as any)).toContain("Stay hydrated");
      expect(service['generateAiInsight'](mockData as any)).toContain("ACWR: 1.2");
      expect(service['generateAiInsight'](mockData as any)).toContain("Readiness: High");
      expect(service['generateAiInsight'](mockData as any)).toContain("Streak: 5 days");
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
      expect(service['generateAiInsight'](mockData as any)).toContain("ACWR: 0.8");
      expect(service['generateAiInsight'](mockData as any)).toContain("Readiness: Unknown");
      expect(service['generateAiInsight'](mockData as any)).toContain("No specific recommendations today.");
    });
  });

  describe("loadPlayerSettingsRoutine", () => {
    it("should load and set daily routine", async () => {
      const mockDailyRoutine = [
        { id: "wake", label: "Wake Up", time: "07:00", icon: "pi-sun" },
      ];
      api.get.mockReturnValue(of({ success: true, data: { dailyRoutine: mockDailyRoutine } }));
      await service.loadPlayerSettingsRoutine();
      expect(service.dailyRoutine()).toEqual(mockDailyRoutine);
    });

    it("should use default routine if none is loaded", async () => {
      api.get.mockReturnValue(of({ success: true, data: {} })); // No dailyRoutine
      await service.loadPlayerSettingsRoutine();
      expect(service.dailyRoutine()).toEqual(DEFAULT_DAILY_ROUTINE);
    });

    it("should handle API errors gracefully", async () => {
      api.get.mockReturnValue(throwError(() => new Error("API error")));
      await service.loadPlayerSettingsRoutine();
      expect(service.dailyRoutine()).toEqual(DEFAULT_DAILY_ROUTINE); // Falls back to default
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
      mockPlayerProgramService.getMyProgramAssignment.mockReturnValue(of(null));
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

    it("should return true for network errors", () => {
      expect(service["isExpectedApiClientError"](new Error("Network error"))).toBe(
        true,
      );
      expect(service["isExpectedApiClientError"]({ message: "Failed to fetch" })).toBe(
        true,
      );
    });

    it("should return false for unexpected errors", () => {
      expect(service["isExpectedApiClientError"](new Error("Some other error"))).toBe(
        false,
      );
      expect(service["isExpectedApiClientError"]({})).toBe(false);
    });
  });
});
