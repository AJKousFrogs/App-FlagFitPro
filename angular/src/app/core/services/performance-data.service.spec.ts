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

  // BMI/lean-body-mass calculation tests live in body-composition.service.spec.ts.
  // PerformanceDataService is now a data-access layer for measurements/tests/supplements.
  it("instantiates the service", () => {
    expect(service).toBeTruthy();
  });
});
