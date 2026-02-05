import { ComponentFixture, TestBed } from "@angular/core/testing";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { of } from "rxjs";
import { MessageService } from "primeng/api";
import { QbThrowingTrackerComponent } from "./qb-throwing-tracker.component";
import { ApiService } from "../../../core/services/api.service";
import { LoggerService } from "../../../core/services/logger.service";

describe("QbThrowingTrackerComponent", () => {
  let fixture: ComponentFixture<QbThrowingTrackerComponent>;
  let component: QbThrowingTrackerComponent;

  beforeEach(async () => {
    const mockApiService = {
      get: vi.fn().mockReturnValue(
        of({
          success: true,
          data: {
            progression: {
              currentWeekAvg: 160,
              targetThrows: 200,
              progressionPhase: "Building Phase",
              daysSinceLastSession: 1,
              weeklyCompliancePct: 85,
              recommendation: "Maintain steady progression.",
            },
            weeklyStats: [],
            recentSessions: [],
          },
        }),
      ),
    };

    const mockLoggerService = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      success: vi.fn(),
    };

    const mockMessageService = {
      add: vi.fn(),
      addAll: vi.fn(),
      clear: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [QbThrowingTrackerComponent],
      providers: [
        { provide: ApiService, useValue: mockApiService },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: MessageService, useValue: mockMessageService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(QbThrowingTrackerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it("calculates progress percent from current week average", () => {
    component.progressionStatus.set({
      currentWeekAvg: 160,
      targetThrows: 200,
      progressionPhase: "Building Phase",
      daysSinceLastSession: 1,
      weeklyCompliancePct: 90,
      recommendation: "Keep going",
    });

    expect(component.getProgressPercent()).toBe(80);
  });

  it("caps progress percent at 100", () => {
    component.progressionStatus.set({
      currentWeekAvg: 260,
      targetThrows: 200,
      progressionPhase: "Building Phase",
      daysSinceLastSession: 1,
      weeklyCompliancePct: 90,
      recommendation: "Keep going",
    });

    expect(component.getProgressPercent()).toBe(100);
  });

  it("calculates bar height with min and max bounds", () => {
    expect(component.getBarHeight(0)).toBe(15);
    expect(component.getBarHeight(400)).toBe(50);
    expect(component.getBarHeight(800)).toBe(100);
  });
});
