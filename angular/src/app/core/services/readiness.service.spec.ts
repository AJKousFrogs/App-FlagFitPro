import { TestBed } from "@angular/core/testing";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { firstValueFrom, of } from "rxjs";
import { ReadinessService } from "./readiness.service";
import { EvidenceConfigService } from "./evidence-config.service";
import { ApiService } from "./api.service";
import { LoggerService } from "./logger.service";

const mockEvidenceConfigService = {
  getReadinessConfig: () => ({
    weightings: {
      workload: 0.4,
      wellness: 0.4,
      sleep: 0.15,
      proximity: 0.05,
    },
    cutPoints: {
      lowMax: 55,
      moderateMax: 75,
    },
    reducedDataMode: {
      enabled: false,
      wellnessCompletenessThreshold: 0.5,
      sleepWeightMultiplier: 1.2,
    },
    wellnessIndex: {
      use1to5Scale: false,
      requiredFields: ["sleep", "energy"],
      optionalFields: ["stress", "soreness", "mood"],
    },
  }),
  getActivePreset: () => ({
    name: "Default",
    version: "1.0",
    readiness: {
      citations: [],
      scienceNotes: {
        weightings: "",
        cutPoints: "",
        coachOverride: "",
      },
    },
  }),
};

const mockApiService = {
  post: vi.fn(),
  get: vi.fn(),
};

const mockLoggerService = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  success: vi.fn(),
};

describe("ReadinessService", () => {
  let service: ReadinessService;

  beforeEach(() => {
    mockApiService.post.mockReset();
    mockApiService.get.mockReset();

    TestBed.configureTestingModule({
      providers: [
        ReadinessService,
        { provide: EvidenceConfigService, useValue: mockEvidenceConfigService },
        { provide: ApiService, useValue: mockApiService },
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    });

    service = TestBed.inject(ReadinessService);
  });

  it("classifies readiness level using cut points", () => {
    expect(service.getReadinessLevel(40)).toBe("low");
    expect(service.getReadinessLevel(55)).toBe("moderate");
    expect(service.getReadinessLevel(75)).toBe("moderate");
    expect(service.getReadinessLevel(76)).toBe("high");
  });

  it("maps readiness score to suggestion", () => {
    expect(service.getSuggestion(40)).toBe("deload");
    expect(service.getSuggestion(55)).toBe("maintain");
    expect(service.getSuggestion(70)).toBe("maintain");
    expect(service.getSuggestion(76)).toBe("push");
  });

  it("maps readiness level to severity", () => {
    expect(service.getSeverity("high")).toBe("success");
    expect(service.getSeverity("moderate")).toBe("warning");
    expect(service.getSeverity("low")).toBe("danger");
  });

  it("maps readiness score to score color class", () => {
    expect(service.getScoreColor(80)).toBe("text-green-600");
    expect(service.getScoreColor(60)).toBe("text-yellow-600");
    expect(service.getScoreColor(40)).toBe("text-red-600");
  });

  it("returns calibration note containing cut points", () => {
    const note = service.getCalibrationNote();
    expect(note).toContain("Low: <55");
    expect(note).toContain("Moderate: 55-75");
    expect(note).toContain("High: >75");
  });

  it("stores readiness history from API response", async () => {
    const history = [
      {
        day: "2026-01-28",
        score: 78,
        level: "high",
        suggestion: "push",
        acwr: 1.1,
      },
      {
        day: "2026-01-27",
        score: 62,
        level: "moderate",
        suggestion: "maintain",
        acwr: 1.0,
      },
    ];
    mockApiService.get.mockReturnValue(of({ success: true, data: history }));

    const result = await firstValueFrom(service.getHistory("athlete-1", 7));

    expect(result).toEqual(history);
    expect(service.history()).toEqual(history);
  });

  it("returns empty history when API response has no data", async () => {
    mockApiService.get.mockReturnValue(of({ success: true }));

    const result = await firstValueFrom(service.getHistory("athlete-1", 7));

    expect(result).toEqual([]);
    expect(service.history()).toEqual([]);
  });
});
