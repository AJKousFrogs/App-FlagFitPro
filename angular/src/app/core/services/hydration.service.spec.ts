/**
 * HydrationService tests.
 *
 * Pure helpers (`sumLogs`, `filterToToday`) are exported and tested
 * without DI. The injectable surface is exercised through SupabaseService
 * mocking — the real client is not contacted.
 */

import { TestBed } from "@angular/core/testing";
import { describe, it, expect, beforeEach, vi } from "vitest";

import {
  HydrationService,
  filterToToday,
  sumLogs,
} from "./hydration.service";
import { SupabaseService } from "./supabase.service";
import { LoggerService } from "./logger.service";
import { HydrationLog } from "../models/hydration.models";

// ──────────────────────────────────────────────────────────────────────────
// Pure helpers
// ──────────────────────────────────────────────────────────────────────────

function log(partial: Partial<HydrationLog> & { loggedAt: string; amountMl: number }): HydrationLog {
  return {
    id: partial.id ?? "id",
    userId: partial.userId ?? "u",
    loggedAt: partial.loggedAt,
    amountMl: partial.amountMl,
    beverageType: partial.beverageType ?? "water",
    note: partial.note ?? null,
    source: partial.source ?? "manual",
    metadata: partial.metadata ?? {},
    createdAt: partial.createdAt ?? "2026-05-08T00:00:00Z",
    updatedAt: partial.updatedAt ?? "2026-05-08T00:00:00Z",
  };
}

describe("sumLogs", () => {
  it("returns 0 for an empty list", () => {
    expect(sumLogs([])).toBe(0);
  });

  it("sums amountMl across logs", () => {
    expect(
      sumLogs([
        log({ loggedAt: "2026-05-08T08:00:00Z", amountMl: 250 }),
        log({ loggedAt: "2026-05-08T10:00:00Z", amountMl: 500 }),
        log({ loggedAt: "2026-05-08T13:00:00Z", amountMl: 750 }),
      ]),
    ).toBe(1500);
  });
});

describe("filterToToday", () => {
  it("includes logs from the local current day", () => {
    const today = new Date("2026-05-08T15:00:00");
    const logs = [
      log({ loggedAt: "2026-05-08T08:00:00", amountMl: 250 }),
      log({ loggedAt: "2026-05-08T20:00:00", amountMl: 500 }),
    ];
    expect(filterToToday(logs, today)).toHaveLength(2);
  });

  it("excludes logs from yesterday", () => {
    const today = new Date("2026-05-08T15:00:00");
    const logs = [
      log({ loggedAt: "2026-05-07T22:00:00", amountMl: 100 }),
      log({ loggedAt: "2026-05-08T08:00:00", amountMl: 250 }),
    ];
    const filtered = filterToToday(logs, today);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].amountMl).toBe(250);
  });

  it("excludes logs from tomorrow", () => {
    const today = new Date("2026-05-08T15:00:00");
    const logs = [
      log({ loggedAt: "2026-05-08T08:00:00", amountMl: 250 }),
      log({ loggedAt: "2026-05-09T01:00:00", amountMl: 500 }),
    ];
    const filtered = filterToToday(logs, today);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].amountMl).toBe(250);
  });

  it("returns empty when no logs match", () => {
    const today = new Date("2026-05-08T15:00:00");
    const logs = [log({ loggedAt: "2026-05-01T08:00:00", amountMl: 250 })];
    expect(filterToToday(logs, today)).toHaveLength(0);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// HydrationService DI surface
// ──────────────────────────────────────────────────────────────────────────

const mockSupabaseService = {
  userId: vi.fn(() => null as string | null),
  client: {
    from: vi.fn(),
  },
};

const mockLoggerService = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

describe("HydrationService", () => {
  let service: HydrationService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseService.userId.mockReturnValue(null);

    TestBed.configureTestingModule({
      providers: [
        HydrationService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    });
    service = TestBed.inject(HydrationService);
  });

  describe("logHydration validation", () => {
    it("rejects amounts <= 0", async () => {
      mockSupabaseService.userId.mockReturnValue("user-1");
      await expect(service.logHydration({ amountMl: 0 })).rejects.toThrow(
        /between 1 and 5000/,
      );
    });

    it("rejects amounts > 5000ml", async () => {
      mockSupabaseService.userId.mockReturnValue("user-1");
      await expect(service.logHydration({ amountMl: 5001 })).rejects.toThrow(
        /between 1 and 5000/,
      );
    });

    it("rejects non-finite amounts", async () => {
      mockSupabaseService.userId.mockReturnValue("user-1");
      await expect(
        service.logHydration({ amountMl: Number.NaN }),
      ).rejects.toThrow(/between 1 and 5000/);
    });

    it("throws when there is no signed-in user", async () => {
      mockSupabaseService.userId.mockReturnValue(null);
      await expect(service.logHydration({ amountMl: 250 })).rejects.toThrow(
        /Not signed in/,
      );
    });
  });

  describe("signal accessors", () => {
    it("starts with empty logs and zero todayTotalMl", () => {
      expect(service.logs()).toEqual([]);
      expect(service.todayLogs()).toEqual([]);
      expect(service.todayTotalMl()).toBe(0);
      expect(service.loading()).toBe(false);
      expect(service.error()).toBeNull();
    });
  });
});
