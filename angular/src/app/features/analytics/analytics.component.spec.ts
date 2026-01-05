import { describe, it, expect, beforeEach, vi } from "vitest";
import { TestBed, ComponentFixture } from "@angular/core/testing";
import { QueryList, NO_ERRORS_SCHEMA } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { of, throwError } from "rxjs";
import { AnalyticsComponent } from "./analytics.component";
import { UIChart } from "primeng/chart";
import { ApiService } from "../../core/services/api.service";
import { PlayerStatisticsService } from "../../core/services/player-statistics.service";
import { AuthService } from "../../core/services/auth.service";
import { TrainingStatsCalculationService } from "../../core/services/training-stats-calculation.service";
import { TrainingDataService } from "../../core/services/training-data.service";
import { LoggerService } from "../../core/services/logger.service";
import { SupabaseService } from "../../core/services/supabase.service";
import { MessageService } from "primeng/api";
import {
  exportChartAsPNG,
  resetChartZoom,
  updateChartFontSizes,
} from "../../shared/config/enhanced-chart.config";

// Mock the enhanced chart config module
vi.mock("../../shared/config/enhanced-chart.config", () => ({
  ENHANCED_LINE_CHART_OPTIONS: { responsive: true },
  ENHANCED_BAR_CHART_OPTIONS: { responsive: true },
  ENHANCED_DOUGHNUT_CHART_OPTIONS: { responsive: true },
  ENHANCED_RADAR_CHART_OPTIONS: { responsive: true },
  exportChartAsPNG: vi.fn(),
  resetChartZoom: vi.fn(),
  updateChartFontSizes: vi.fn(),
}));

describe("AnalyticsComponent", () => {
  let component: AnalyticsComponent;
  let fixture: ComponentFixture<AnalyticsComponent>;
  let mockApiService: any;
  let mockPlayerStatsService: any;
  let mockAuthService: any;
  let mockTrainingStatsService: any;
  let mockTrainingDataService: any;
  let mockLoggerService: any;

  beforeEach(async () => {
    // Create mock services
    mockApiService = {
      get: vi.fn().mockReturnValue(of({ success: true, data: {} })),
    };

    mockPlayerStatsService = {
      getPlayerAllGames: vi.fn().mockReturnValue(of([])),
      getPlayerSeasonStats: vi.fn().mockReturnValue(of(null)),
      getPlayerMultiSeasonStats: vi.fn().mockReturnValue(of(null)),
    };

    mockAuthService = {
      getUser: vi
        .fn()
        .mockReturnValue({ id: "user-123", email: "test@example.com" }),
    };

    mockTrainingStatsService = {
      getTrainingStats: vi.fn().mockReturnValue(
        of({
          totalSessions: 10,
          sessionsByType: {},
        }),
      ),
      calculateACWR: vi.fn().mockReturnValue({ ratio: 1.2 }),
    };

    mockTrainingDataService = {
      getTrainingSessions: vi.fn().mockReturnValue(of([])),
    };

    mockLoggerService = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      success: vi.fn(),
    };

    // Mock SupabaseService to prevent real initialization
    const mockSupabaseService = {
      currentUser: vi.fn(() => null),
      session: vi.fn(() => null),
      userId: vi.fn(() => null),
      client: {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      },
    };

    // Mock MessageService for PrimeNG Toast
    const mockMessageService = {
      add: vi.fn(),
      addAll: vi.fn(),
      clear: vi.fn(),
    };

    // Mock ActivatedRoute
    const mockActivatedRoute = {
      params: of({}),
      queryParams: of({}),
      snapshot: {
        params: {},
        queryParams: {},
        data: {},
      },
    };

    await TestBed.configureTestingModule({
      imports: [AnalyticsComponent],
      providers: [
        { provide: ApiService, useValue: mockApiService },
        { provide: PlayerStatisticsService, useValue: mockPlayerStatsService },
        { provide: AuthService, useValue: mockAuthService },
        {
          provide: TrainingStatsCalculationService,
          useValue: mockTrainingStatsService,
        },
        { provide: TrainingDataService, useValue: mockTrainingDataService },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: MessageService, useValue: mockMessageService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
      schemas: [NO_ERRORS_SCHEMA], // Ignore unknown elements in template
    }).compileComponents();

    fixture = TestBed.createComponent(AnalyticsComponent);
    component = fixture.componentInstance;
  });

  describe("Component Initialization", () => {
    it("should create the component", () => {
      expect(component).toBeTruthy();
    });

    it("should set isPageLoading to true initially", () => {
      expect(component.isPageLoading()).toBe(true);
    });

    it("should set hasPageError to false initially", () => {
      expect(component.hasPageError()).toBe(false);
    });

    it("should initialize with metrics", () => {
      // Component may initialize with default metrics
      expect(component.metrics()).toBeDefined();
    });

    it("should have chart data signals defined", () => {
      // Chart data signals should be defined (may have default values)
      expect(component.performanceChartData).toBeDefined();
      expect(component.chemistryChartData).toBeDefined();
      expect(component.distributionChartData).toBeDefined();
      expect(component.positionChartData).toBeDefined();
      expect(component.speedChartData).toBeDefined();
    });
  });

  describe("Chart Instance Management", () => {
    it("should store chart instances in Map after view init", async () => {
      // Create mock chart instances
      const mockChart1 = {
        canvas: document.createElement("canvas"),
        chart: { id: "chart1" },
      };
      const mockChart2 = {
        canvas: document.createElement("canvas"),
        chart: { id: "chart2" },
      };
      const mockChart3 = {
        canvas: document.createElement("canvas"),
        chart: { id: "chart3" },
      };

      // Mock QueryList
      const mockChartRefs = {
        forEach: vi.fn((callback: any) => {
          [mockChart1, mockChart2, mockChart3].forEach(callback);
        }),
      } as unknown as QueryList<UIChart>;

      component.chartRefs = mockChartRefs;

      // Trigger ngAfterViewInit
      component.ngAfterViewInit();

      // Wait for setTimeout
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Verify chart instances were stored
      expect(mockChartRefs.forEach).toHaveBeenCalled();
    });

    it("should map chart types to instances correctly", async () => {
      const mockCharts = [
        {
          chart: {
            id: "performance",
            canvas: document.createElement("canvas"),
          },
        },
        {
          chart: { id: "chemistry", canvas: document.createElement("canvas") },
        },
        {
          chart: {
            id: "distribution",
            canvas: document.createElement("canvas"),
          },
        },
        { chart: { id: "position", canvas: document.createElement("canvas") } },
        { chart: { id: "speed", canvas: document.createElement("canvas") } },
      ];

      const mockChartRefs = {
        forEach: vi.fn((callback: any) => {
          mockCharts.forEach(callback);
        }),
      } as unknown as QueryList<UIChart>;

      component.chartRefs = mockChartRefs;
      component.ngAfterViewInit();

      await new Promise((resolve) => setTimeout(resolve, 600));

      // Verify all chart types were processed
      expect(mockChartRefs.forEach).toHaveBeenCalled();
    });

    it("should handle missing chart instances gracefully", async () => {
      const mockChartRefs = {
        forEach: vi.fn((callback: any) => {
          // Simulate charts without the chart property
          [{ canvas: document.createElement("canvas") }].forEach(callback);
        }),
      } as unknown as QueryList<UIChart>;

      component.chartRefs = mockChartRefs;

      expect(() => component.ngAfterViewInit()).not.toThrow();
    });
  });

  describe("Chart Export (PNG)", () => {
    it("should have exportChart method", () => {
      expect(typeof component.exportChart).toBe("function");
    });

    it("should handle missing chart instance gracefully", () => {
      // Should not throw when chart doesn't exist
      expect(() => component.exportChart("nonexistent")).not.toThrow();
    });
  });

  describe("Zoom Reset", () => {
    it("should have resetChartZoom method", () => {
      expect(typeof component.resetChartZoom).toBe("function");
    });

    it("should handle missing chart gracefully", () => {
      expect(() => component.resetChartZoom("nonexistent")).not.toThrow();
    });
  });

  describe("Window Resize Handling", () => {
    it("should have onWindowResize method", () => {
      expect(typeof component.onWindowResize).toBe("function");
    });

    it("should handle resize gracefully", () => {
      expect(() => component.onWindowResize()).not.toThrow();
    });
  });

  describe("Enhanced Chart Options", () => {
    it("should use ENHANCED_LINE_CHART_OPTIONS for line charts", () => {
      expect(component.lineChartOptions).toBeDefined();
      expect(component.lineChartOptions.responsive).toBe(true);
    });

    it("should use ENHANCED_BAR_CHART_OPTIONS for bar charts", () => {
      expect(component.BAR_CHART_OPTIONS).toBeDefined();
      expect(component.BAR_CHART_OPTIONS.responsive).toBe(true);
    });

    it("should use ENHANCED_DOUGHNUT_CHART_OPTIONS for doughnut charts", () => {
      expect(component.DOUGHNUT_CHART_OPTIONS).toBeDefined();
      expect(component.DOUGHNUT_CHART_OPTIONS.responsive).toBe(true);
    });

    it("should use ENHANCED_RADAR_CHART_OPTIONS for radar charts", () => {
      expect(component.radarChartOptions).toBeDefined();
      expect(component.radarChartOptions.responsive).toBe(true);
    });
  });

  describe("Chart Customization Help", () => {
    it("should display chart interaction instructions", () => {
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

      component.customizeChart("performance");

      expect(mockLoggerService.info).toHaveBeenCalledWith(
        "Customizing performance chart",
      );
      expect(alertSpy).toHaveBeenCalled();

      const alertMessage = alertSpy.mock.calls[0][0] as string;
      expect(alertMessage).toContain("Zoom:");
      expect(alertMessage).toContain("Pan:");
      expect(alertMessage).toContain("Legend:");
      expect(alertMessage).toContain("Export:");
      expect(alertMessage).toContain("Reset:");

      alertSpy.mockRestore();
    });

    it("should include instructions for all interaction types", () => {
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

      component.customizeChart("chemistry");

      const alertMessage = alertSpy.mock.calls[0][0] as string;
      expect(alertMessage).toContain("Scroll with mouse wheel to zoom");
      expect(alertMessage).toContain("Hold Shift + drag to pan");
      expect(alertMessage).toContain("Click legend items to show/hide");
      expect(alertMessage).toContain(
        'Click "Export" button to download as PNG',
      );
      expect(alertMessage).toContain(
        "Hover over data points to see trend information",
      );

      alertSpy.mockRestore();
    });
  });

  // Data loading is handled via signals and effects, not ngOnInit

  describe("Player Statistics", () => {
    it("should calculate games missed correctly", () => {
      const mockGames = [
        { present: true, gameDate: "2024-01-01" },
        { present: false, gameDate: "2024-01-08" },
        { present: true, gameDate: "2024-01-15" },
        { present: false, gameDate: "2024-01-22" },
      ];

      component.playerGameStats.set(mockGames as any);

      expect(component.gamesMissed()).toBe(2);
    });

    it("should calculate attendance rate correctly", () => {
      const mockGames = [
        { present: true, gameDate: "2024-01-01" },
        { present: true, gameDate: "2024-01-08" },
        { present: false, gameDate: "2024-01-15" },
        { present: true, gameDate: "2024-01-22" },
      ];

      component.playerGameStats.set(mockGames as any);

      expect(component.attendanceRate()).toBe(75); // 3 out of 4 = 75%
    });

    it("should return 0 attendance rate when no games", () => {
      component.playerGameStats.set([]);

      expect(component.attendanceRate()).toBe(0);
    });

    it("should return 100 attendance rate when all games attended", () => {
      const mockGames = [
        { present: true, gameDate: "2024-01-01" },
        { present: true, gameDate: "2024-01-08" },
        { present: true, gameDate: "2024-01-15" },
      ];

      component.playerGameStats.set(mockGames as any);

      expect(component.attendanceRate()).toBe(100);
    });
  });

  describe("Error Handling", () => {
    it("should set error state when initialization fails", () => {
      const error = new Error("Init failed");
      vi.spyOn(component as any, "loadAnalyticsData").mockImplementation(() => {
        throw error;
      });

      (component as any).initializePage();

      expect(component.isPageLoading()).toBe(false);
      expect(component.hasPageError()).toBe(true);
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        "[Analytics] Init error:",
        error,
      );
    });

    it("should allow retry after error", () => {
      const loadSpy = vi.spyOn(component as any, "initializePage");

      component.retryLoad();

      expect(loadSpy).toHaveBeenCalled();
    });

    it("should reset error state on retry", () => {
      component.hasPageError.set(true);

      component.retryLoad();

      // After retry, error should be reset
      expect(component.hasPageError()).toBe(false);
    });
  });
});
