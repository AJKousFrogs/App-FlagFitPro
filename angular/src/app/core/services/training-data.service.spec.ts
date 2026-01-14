/**
 * Training Data Service Unit Tests
 *
 * Focused coverage for session logging + weekly volume calculations.
 */

import { TestBed } from "@angular/core/testing";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { firstValueFrom } from "rxjs";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { TrainingDataService } from "./training-data.service";
import { SupabaseService } from "./supabase.service";
import { LoggerService } from "./logger.service";

const createThenableQuery = (data: unknown) => {
  const query: Record<string, unknown> = {};
  query.eq = () => query;
  query.lte = () => query;
  query.gte = () => query;
  query.order = () => query;
  query.limit = () => query;
  query.single = () => Promise.resolve({ data, error: null });
  query.then = (resolve: (value: unknown) => unknown) =>
    Promise.resolve({ data, error: null }).then(resolve);
  return query;
};

describe("TrainingDataService", () => {
  let service: TrainingDataService;
  const workoutLogsInsert = vi.fn(() => Promise.resolve({ error: null }));
  const mockLoggerService = {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    const mockSupabaseService = {
      userId: vi.fn(() => "user-123"),
      client: {
        from: vi.fn((table: string) => {
          if (table === "training_sessions") {
            return {
              insert: () => ({
                select: () => ({
                  single: () =>
                    Promise.resolve({
                      data: {
                        id: "session-1",
                        user_id: "user-123",
                        session_date: "2025-01-10",
                        duration_minutes: 60,
                        rpe: 6,
                        notes: "test",
                      },
                      error: null,
                    }),
                }),
              }),
              select: () => createThenableQuery([]),
            };
          }

          if (table === "workout_logs") {
            return { insert: workoutLogsInsert };
          }

          if (table === "load_monitoring") {
            return {
              select: () => ({
                eq: () => ({
                  order: () => ({
                    limit: () => ({
                      single: () =>
                        Promise.resolve({ data: null, error: null }),
                    }),
                  }),
                }),
              }),
            };
          }

          return { select: () => createThenableQuery([]) };
        }),
      },
    } as unknown as SupabaseService;

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        TrainingDataService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    });

    service = TestBed.inject(TrainingDataService);
  });

  it("creates a workout log after session creation", async () => {
    await firstValueFrom(
      service.createTrainingSession({
        user_id: "user-123",
        session_date: "2025-01-10",
        session_type: "practice",
        duration_minutes: 60,
        rpe: 6,
        notes: "test",
      }),
    );

    expect(workoutLogsInsert).toHaveBeenCalled();
    const payload = workoutLogsInsert.mock.calls[0][0];
    expect(payload.player_id).toBe("user-123");
    expect(payload.session_id).toBe("session-1");
    expect(payload.duration_minutes).toBe(60);
    expect(payload.rpe).toBe(6);
    expect(payload.completed_at.startsWith("2025-01-10")).toBe(true);
  });

  it("uses weekly load for weekly_volume", async () => {
    const recentSession = {
      session_date: new Date().toISOString().split("T")[0],
      duration_minutes: 30,
      rpe: 4,
    };
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 30);
    const oldSession = {
      session_date: oldDate.toISOString().split("T")[0],
      duration_minutes: 50,
      rpe: 5,
    };

    const mockSupabaseService = TestBed.inject(
      SupabaseService,
    ) as unknown as {
      client: { from: (table: string) => Record<string, unknown> };
    };

    mockSupabaseService.client.from = vi.fn((table: string) => {
      if (table === "training_sessions") {
        return { select: () => createThenableQuery([recentSession, oldSession]) };
      }
      if (table === "load_monitoring") {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => ({
                  single: () =>
                    Promise.resolve({ data: null, error: null }),
                }),
              }),
            }),
          }),
        };
      }
      return { select: () => createThenableQuery([]) };
    });

    const stats = await firstValueFrom(service.getTrainingStats());
    const expectedWeeklyLoad = recentSession.duration_minutes * recentSession.rpe;
    expect(stats?.weekly_volume).toBe(expectedWeeklyLoad);
  });
});
