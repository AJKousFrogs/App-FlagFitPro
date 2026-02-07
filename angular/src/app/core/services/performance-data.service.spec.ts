import { TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { PerformanceDataService } from "./performance-data.service";
import { SupabaseService } from "./supabase.service";
import { LoggerService } from "./logger.service";
import { RealtimeService } from "./realtime.service";
import { AuthService } from "./auth.service";

const mockSupabaseService = {
  userId: () => null,
};

const mockLoggerService = {
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
  debug: () => undefined,
  success: () => undefined,
};

const mockRealtimeService = {
  subscribe: () => () => undefined,
};

const mockAuthService = {};

describe("PerformanceDataService", () => {
  let service: PerformanceDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PerformanceDataService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: RealtimeService, useValue: mockRealtimeService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    });

    service = TestBed.inject(PerformanceDataService);
  });

  it("calculates BMI with 1 decimal precision", () => {
    expect(service.calculateBMI(80, 180)).toBe(24.7);
    expect(service.calculateBMI(90, 180)).toBe(27.8);
  });

  it("categorizes BMI correctly", () => {
    expect(service.getBMICategory(18.4).category).toBe("Underweight");
    expect(service.getBMICategory(22).category).toBe("Normal");
    expect(service.getBMICategory(27).category).toBe("Overweight");
    expect(service.getBMICategory(32).category).toBe("Obese");
  });

  it("calculates lean body mass", () => {
    expect(service.calculateLeanBodyMass(80, 20)).toBe(64.0);
    expect(service.calculateLeanBodyMass(90, 15)).toBe(76.5);
  });
});
