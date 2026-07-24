import { describe, it, expect, vi } from "vitest";
import {
  ConsentDataReader,
  AccessContext,
} from "../../netlify/functions/utils/consent-data-reader.js";

/**
 * Regression test for the 2026-07-24/25 finding (docs/SOURCE_OF_TRUTH.md §6):
 * `_logAccess()` used to insert columns that don't exist on the live
 * `consent_access_log` table (accessor_user_id/target_user_id/resource_type/
 * access_granted/consent_type/team_id/access_reason), so every insert
 * silently no-opped. Pins the insert to the REAL live columns — verified
 * against docs/generated/live-schema.snapshot.json:
 *   id, user_id, accessed_by, access_type, data_category, accessed_at,
 *   reason, consent_given.
 * No live DB needed — the supabase client is faked.
 */

function fakeSupabase(insertSpy) {
  return {
    from: (table) => ({
      insert: (rows) => insertSpy(table, rows),
    }),
  };
}

describe("ConsentDataReader._logAccess — real consent_access_log columns", () => {
  const REAL_COLUMNS = [
    "user_id",
    "accessed_by",
    "access_type",
    "data_category",
    "reason",
    "consent_given",
  ];

  it("inserts only columns that exist on the live table", async () => {
    const insertSpy = vi.fn().mockResolvedValue({ error: null });
    const reader = new ConsentDataReader(fakeSupabase(insertSpy), {
      enableAuditLogging: true,
    });

    await reader._logAccess({
      accessorUserId: "coach-1",
      targetUserIds: ["athlete-1", "athlete-2"],
      resourceType: "training_sessions",
      teamId: "team-1",
      context: AccessContext.COACH_TEAM_DATA,
    });

    expect(insertSpy).toHaveBeenCalledTimes(1);
    const [table, rows] = insertSpy.mock.calls[0];
    expect(table).toBe("consent_access_log");
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(Object.keys(row).sort()).toEqual([...REAL_COLUMNS].sort());
    }
  });

  it("maps accessor -> accessed_by and each target -> its own user_id row", async () => {
    const insertSpy = vi.fn().mockResolvedValue({ error: null });
    const reader = new ConsentDataReader(fakeSupabase(insertSpy), {
      enableAuditLogging: true,
    });

    await reader._logAccess({
      accessorUserId: "coach-1",
      targetUserIds: ["athlete-1", "athlete-2"],
      resourceType: "wellness_entries",
      teamId: "team-1",
      context: AccessContext.COACH_TEAM_DATA,
    });

    const [, rows] = insertSpy.mock.calls[0];
    expect(rows[0]).toMatchObject({
      user_id: "athlete-1",
      accessed_by: "coach-1",
      access_type: "read",
      data_category: "wellness_entries",
      reason: AccessContext.COACH_TEAM_DATA,
      consent_given: true,
    });
    expect(rows[1]).toMatchObject({ user_id: "athlete-2" });
  });

  it("never throws when the insert itself fails (audit logging is best-effort)", async () => {
    const insertSpy = vi.fn().mockRejectedValue(new Error("boom"));
    const reader = new ConsentDataReader(fakeSupabase(insertSpy), {
      enableAuditLogging: true,
    });

    await expect(
      reader._logAccess({
        accessorUserId: "coach-1",
        targetUserIds: ["athlete-1"],
        resourceType: "training_sessions",
        teamId: "team-1",
        context: AccessContext.COACH_TEAM_DATA,
      }),
    ).resolves.not.toThrow();
  });

  it("no-ops cleanly with zero targets (no insert call)", async () => {
    const insertSpy = vi.fn();
    const reader = new ConsentDataReader(fakeSupabase(insertSpy), {
      enableAuditLogging: true,
    });

    await reader._logAccess({
      accessorUserId: "coach-1",
      targetUserIds: [],
      resourceType: "training_sessions",
      teamId: "team-1",
      context: AccessContext.COACH_TEAM_DATA,
    });

    expect(insertSpy).not.toHaveBeenCalled();
  });
});
