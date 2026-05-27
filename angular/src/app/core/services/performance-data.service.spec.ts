import { TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { MeasurementDataService } from "./measurement-data.service";
import { SupplementDataService } from "./supplement-data.service";
import { PerformanceTestDataService } from "./performance-test-data.service";
import { SupabaseService } from "./supabase.service";
import { LoggerService } from "./logger.service";

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

describe("MeasurementDataService", () => {
  let service: MeasurementDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MeasurementDataService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    });

    service = TestBed.inject(MeasurementDataService);
  });

  it("instantiates the service", () => {
    expect(service).toBeTruthy();
  });
});

describe("SupplementDataService", () => {
  let service: SupplementDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SupplementDataService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    });

    service = TestBed.inject(SupplementDataService);
  });

  it("instantiates the service", () => {
    expect(service).toBeTruthy();
  });
});

describe("PerformanceTestDataService", () => {
  let service: PerformanceTestDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PerformanceTestDataService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    });

    service = TestBed.inject(PerformanceTestDataService);
  });

  it("instantiates the service", () => {
    expect(service).toBeTruthy();
  });
});
