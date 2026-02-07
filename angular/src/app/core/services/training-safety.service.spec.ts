import { TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { TrainingSafetyService } from "./training-safety.service";
import { SupabaseService } from "./supabase.service";
import { LoggerService } from "./logger.service";
import { DataSourceService } from "./data-source.service";

const mockSupabaseService = {
  userId: () => null,
  client: {},
};

const mockLoggerService = {
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
  debug: () => undefined,
  success: () => undefined,
};

const mockDataSourceService = {};

describe("TrainingSafetyService", () => {
  let service: TrainingSafetyService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TrainingSafetyService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: DataSourceService, useValue: mockDataSourceService },
      ],
    });

    service = TestBed.inject(TrainingSafetyService);
  });

  it("assigns correct age group boundaries", () => {
    expect(service.getAgeGroup(17)).toBe("youth");
    expect(service.getAgeGroup(18)).toBe("adult");
    expect(service.getAgeGroup(34)).toBe("adult");
    expect(service.getAgeGroup(35)).toBe("masters");
    expect(service.getAgeGroup(44)).toBe("masters");
    expect(service.getAgeGroup(45)).toBe("senior");
  });

  it("adjusts movement limits by age profile", () => {
    const limits = service.getAdjustedLimits(40);

    expect(limits.maxSessionsPerWeek).toBe(5);
    expect(limits.maxHighIntensityPerWeek).toBe(2);
    expect(limits.maxConsecutiveTrainingDays).toBe(3);
    expect(limits.maxSprintsPerSession).toBe(23);
    expect(limits.maxCutsPerSession).toBe(38);
  });

  it("returns defaults when no age is available", () => {
    const limits = service.getAdjustedLimits();

    expect(limits.maxSessionsPerWeek).toBe(6);
    expect(limits.maxHighIntensityPerWeek).toBe(3);
    expect(limits.maxSprintsPerSession).toBe(30);
  });

  it("calculates sleep debt and impact for severe debt", () => {
    const sleepEntries = Array.from({ length: 7 }, (_, index) => ({
      hours: 6,
      date: `2026-01-${String(28 - index).padStart(2, "0")}`,
    }));

    const result = service.calculateSleepDebt(sleepEntries);

    expect(result.last7DaysAverage).toBe(6);
    expect(result.cumulativeDebt).toBe(14);
    expect(result.debtLevel).toBe("severe");
    expect(result.trainingImpact).toBe(0.58);
    expect(result.daysToRecover).toBe(14);
  });

  it("returns neutral sleep debt when no data exists", () => {
    const result = service.calculateSleepDebt([]);

    expect(result.debtLevel).toBe("none");
    expect(result.trainingImpact).toBe(1.0);
    expect(result.daysToRecover).toBe(0);
  });
});
