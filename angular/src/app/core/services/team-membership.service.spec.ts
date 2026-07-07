import { TestBed } from "@angular/core/testing";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { TeamMembershipService } from "./team-membership.service";
import { SupabaseService } from "./supabase.service";
import { LoggerService } from "./logger.service";

const noopLogger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
  success: () => {},
};

const TEAM_ROWS: Record<string, Record<string, unknown>> = {
  userA: {
    id: "m1",
    team_id: "teamA",
    user_id: "userA",
    role: "player",
    position: "qb",
    jersey_number: 7,
    status: "active",
    joined_at: "2026-01-01",
    teams: { id: "teamA", name: "Team A" },
  },
  userB: {
    id: "m2",
    team_id: "teamB",
    user_id: "userB",
    role: "coach",
    position: null,
    jersey_number: null,
    status: "active",
    joined_at: "2026-01-02",
    teams: { id: "teamB", name: "Team B" },
  },
};

/**
 * Regression: this root singleton outlives the in-SPA sign-out, and its 30s TTL
 * cache was keyed only on time — so a second user signing in on a shared device
 * within 30s was served the FIRST user's role/team/jersey (wrong permissions).
 * Fixed by also keying the cache (and the in-flight-request dedup) on userId
 * (SOURCE_OF_TRUTH §6). These tests lock that behaviour.
 */
describe("TeamMembershipService — cross-user cache isolation", () => {
  let service: TeamMembershipService;
  let currentUserId: string;
  let maybeSingle: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    currentUserId = "userA";
    maybeSingle = vi.fn(async () => ({
      data: TEAM_ROWS[currentUserId],
      error: null,
    }));

    const chain = { maybeSingle };
    const eq2 = { eq: () => chain, maybeSingle };
    const eq1 = { eq: () => eq2 };
    const mockSupabase = {
      isAuthenticated: () => true,
      currentUser: () => ({ id: currentUserId }),
      client: { from: () => ({ select: () => eq1 }) },
    };

    TestBed.configureTestingModule({
      providers: [
        TeamMembershipService,
        { provide: SupabaseService, useValue: mockSupabase },
        { provide: LoggerService, useValue: noopLogger },
      ],
    });
    service = TestBed.inject(TeamMembershipService);
  });

  it("serves a fresh fetch for a different user within the cache TTL (no stale leak)", async () => {
    const a = await service.loadMembership();
    expect(a?.teamId).toBe("teamA");
    expect(a?.role).toBe("player");

    // Same device, second user signs in immediately (well within the 30s TTL).
    currentUserId = "userB";
    const b = await service.loadMembership();

    // The bug returned the cached userA membership here.
    expect(b?.teamId).toBe("teamB");
    expect(b?.role).toBe("coach");
    expect(service.role()).toBe("coach");
    expect(maybeSingle).toHaveBeenCalledTimes(2);
  });

  it("still serves the cache for the SAME user within the TTL (no redundant refetch)", async () => {
    await service.loadMembership();
    await service.loadMembership();
    expect(maybeSingle).toHaveBeenCalledTimes(1);
  });
});
