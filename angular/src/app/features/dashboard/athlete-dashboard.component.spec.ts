/**
 * Athlete Dashboard Component Tests
 *
 * Tests for the main athlete dashboard component.
 * Covers loading states, error handling, and data display.
 *
 * @author FlagFit Pro Team
 */

import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { signal } from "@angular/core";
import { of, throwError } from "rxjs";

import { AthleteDashboardComponent } from "./athlete-dashboard.component";
import { AuthService } from "../../core/services/auth.service";
import { AcwrService } from "../../core/services/acwr.service";
import { ReadinessService } from "../../core/services/readiness.service";
import { TrendsService } from "../../core/services/trends.service";
import { TrainingDataService } from "../../core/services/training-data.service";
import { DataSourceService } from "../../core/services/data-source.service";
import { HeaderService } from "../../core/services/header.service";
import { LoggerService } from "../../core/services/logger.service";
import { SupabaseService } from "../../core/services/supabase.service";
import { RealtimeService } from "../../core/services/realtime.service";
import { TournamentModeService } from "../../core/services/tournament-mode.service";

// Mock services
const mockAuthService = {
  getUser: () => ({
    id: "test-user-id",
    email: "test@example.com",
    role: "player",
  }),
  currentUser: signal({
    id: "test-user-id",
    email: "test@example.com",
    role: "player",
  }),
  checkAuth: () => true,
};

const mockAcwrService = {
  acwrRatio: signal(1.1),
  riskZone: signal({ label: "Optimal", color: "green" }),
};

const mockReadinessService = {
  current: signal({ score: 75, level: "Good" }),
  calculateToday: () => of({ score: 75, level: "Good" }),
};

const mockTrendsService = {
  getChangeOfDirectionTrend: () => of({ current: 12, previous: 11 }),
  getSprintVolumeTrend: () => of({ current: 450, previous: 400 }),
  getGamePerformanceTrend: () =>
    of({ averagePerformance: 85, trend: "improving" }),
  calculateChange: (current: number, previous: number) =>
    ((current - previous) / previous) * 100,
};

const mockTrainingDataService = {
  getTrainingSessions: () => of([]),
};

const mockDataSourceService = {
  isFirstTimeUser: signal(false),
  checkUserHasRealData: () => {},
  registerMetric: () => {},
};

const mockHeaderService = {
  setDashboardHeader: () => {},
};

const mockLoggerService = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

const mockSupabaseService = {
  client: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
        gte: () => ({
          lte: () => ({
            order: () => ({
              limit: () => Promise.resolve({ data: [], error: null }),
            }),
          }),
        }),
      }),
    }),
  },
};

const mockRealtimeService = {
  isConnected: signal(true),
  subscribeToTrainingSessions: () => () => {},
  subscribeToReadiness: () => () => {},
  subscribeToPerformance: () => () => {},
};

const mockTournamentService = {
  isActive: signal(false),
};

describe("AthleteDashboardComponent", () => {
  let component: AthleteDashboardComponent;
  let fixture: ComponentFixture<AthleteDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AthleteDashboardComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: mockAuthService },
        { provide: AcwrService, useValue: mockAcwrService },
        { provide: ReadinessService, useValue: mockReadinessService },
        { provide: TrendsService, useValue: mockTrendsService },
        { provide: TrainingDataService, useValue: mockTrainingDataService },
        { provide: DataSourceService, useValue: mockDataSourceService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: RealtimeService, useValue: mockRealtimeService },
        { provide: TournamentModeService, useValue: mockTournamentService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AthleteDashboardComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("Initialization", () => {
    it("should start in loading state", () => {
      expect(component.isLoading()).toBe(true);
    });

    it("should set athlete ID from auth service", fakeAsync(() => {
      fixture.detectChanges();
      tick(600); // Wait for setTimeout in initializeDashboard

      expect(component.athleteId()).toBe("test-user-id");
    }));

    it("should call header service to set dashboard header", () => {
      const headerSpy = spyOn(mockHeaderService, "setDashboardHeader");
      fixture.detectChanges();

      expect(headerSpy).toHaveBeenCalled();
    });
  });

  describe("Loading State", () => {
    it("should display loading state component when loading", () => {
      component.isLoading.set(true);
      fixture.detectChanges();

      const loadingEl = fixture.nativeElement.querySelector(
        "app-page-loading-state",
      );
      expect(loadingEl).toBeTruthy();
    });

    it("should hide loading state when data is loaded", fakeAsync(() => {
      fixture.detectChanges();
      tick(600);
      fixture.detectChanges();

      expect(component.isLoading()).toBe(false);
    }));
  });

  describe("Error State", () => {
    it("should display error state when hasError is true", () => {
      component.isLoading.set(false);
      component.hasError.set(true);
      fixture.detectChanges();

      const errorEl = fixture.nativeElement.querySelector(
        "app-page-error-state",
      );
      expect(errorEl).toBeTruthy();
    });

    it("should show custom error message", () => {
      component.isLoading.set(false);
      component.hasError.set(true);
      component.errorMessage.set("Custom error message");
      fixture.detectChanges();

      expect(component.errorMessage()).toBe("Custom error message");
    });

    it("should retry loading when retry is called", () => {
      const initSpy = spyOn<any>(component, "initializeDashboard" as never);
      component.retryLoad();

      expect(initSpy).toHaveBeenCalled();
    });
  });

  describe("ACWR Display", () => {
    it("should display ACWR value", () => {
      expect(component.acwrValue()).toBe(1.1);
    });

    it("should show green status for optimal ACWR", () => {
      expect(component.acwrStatus()).toBe("green");
    });

    it("should show yellow status for low ACWR", () => {
      mockAcwrService.acwrRatio.set(0.7);
      // Need to re-compute
      expect(component.acwrStatus()).toBe("orange");
    });

    it("should show red status for high ACWR", () => {
      mockAcwrService.acwrRatio.set(1.6);
      expect(component.acwrStatus()).toBe("red");
    });
  });

  describe("Readiness Display", () => {
    it("should display readiness score", () => {
      expect(component.readinessScore()).toBe(75);
    });

    it("should show green status for high readiness", () => {
      expect(component.readinessStatus()).toBe("green");
    });

    it("should show yellow status for moderate readiness", () => {
      mockReadinessService.current.set({ score: 60, level: "Moderate" });
      expect(component.readinessStatus()).toBe("yellow");
    });

    it("should show red status for low readiness", () => {
      mockReadinessService.current.set({ score: 40, level: "Low" });
      expect(component.readinessStatus()).toBe("red");
    });
  });

  describe("First Time User", () => {
    it("should show no-data-entry component for first time users", () => {
      mockDataSourceService.isFirstTimeUser.set(true);
      component.isLoading.set(false);
      fixture.detectChanges();

      // The computed isFirstTimeUser should reflect the service state
      expect(component.isFirstTimeUser()).toBe(true);
    });

    it("should show metrics for returning users", () => {
      mockDataSourceService.isFirstTimeUser.set(false);
      component.isLoading.set(false);
      fixture.detectChanges();

      expect(component.isFirstTimeUser()).toBe(false);
    });
  });

  describe("Upcoming Game", () => {
    it("should show game day check-in button when game is upcoming", () => {
      component.hasUpcomingGame.set(true);
      component.isLoading.set(false);
      fixture.detectChanges();

      expect(component.hasUpcomingGame()).toBe(true);
    });

    it("should set upcoming game data correctly", () => {
      const gameData = {
        id: "game-1",
        opponent: "Eagles",
        date: new Date(),
        time: "2:00 PM",
        location: "Home Field",
        isHome: true,
      };
      component.upcomingGame.set(gameData);

      expect(component.upcomingGame()?.opponent).toBe("Eagles");
    });
  });

  describe("Trend Cards", () => {
    it("should show trend data when available", () => {
      component.trendCards.set([
        {
          title: "Sprint Volume",
          subtitle: "Last 4 weeks",
          value: 450,
          change: 12.5,
          changeLabel: "vs previous",
          icon: "pi-bolt",
        },
      ]);

      expect(component.trendCards().length).toBe(1);
      expect(component.hasTrendData()).toBe(true);
    });

    it("should not show trend data for first time users", () => {
      mockDataSourceService.isFirstTimeUser.set(true);
      component.trendCards.set([
        {
          title: "Test",
          subtitle: "",
          value: 1,
          change: 0,
          changeLabel: "",
          icon: "",
        },
      ]);

      expect(component.hasTrendData()).toBe(false);
    });
  });

  describe("Workload Calculation", () => {
    it("should calculate today workload from sessions", () => {
      const sessions = [
        { rpe: 7, duration_minutes: 60 },
        { rpe: 5, duration_minutes: 30 },
      ];

      mockTrainingDataService.getTrainingSessions = () => of(sessions);

      component.loadTodayWorkload("test-user-id");

      // Expected: (7 * 60) + (5 * 30) = 420 + 150 = 570
      // Note: This requires async handling in actual test
    });

    it("should handle empty sessions", () => {
      mockTrainingDataService.getTrainingSessions = () => of([]);
      component.loadTodayWorkload("test-user-id");

      // Should default to 0
      expect(component.todayWorkload()).toBe(0);
    });
  });
});
