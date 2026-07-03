import { TestBed } from "@angular/core/testing";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { firstValueFrom, of } from "rxjs";
import { ReadinessService } from "./readiness.service";
import { ApiService } from "./api.service";
import { LoggerService } from "./logger.service";
import { mockLoggerService as createMockLoggerService } from "./logger.service.mock";

const mockApiService = {
  post: vi.fn(),
  get: vi.fn(),
};

const mockLoggerService = createMockLoggerService();

describe("ReadinessService", () => {
  let service: ReadinessService;

  beforeEach(() => {
    mockApiService.post.mockReset();
    mockApiService.get.mockReset();

    TestBed.configureTestingModule({
      providers: [
        ReadinessService,
        { provide: ApiService, useValue: mockApiService },
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    });

    service = TestBed.inject(ReadinessService);
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
