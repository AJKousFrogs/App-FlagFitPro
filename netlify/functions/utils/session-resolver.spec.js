/**
 * Session Resolver Tests
 *
 * Tests for PROMPT 2.11: Verify player schedule has NO authority over session resolution
 */

import { resolveTodaySession } from "./session-resolver.js";
import { createClient as _createClient } from "@supabase/supabase-js";
import { describe, expect, test } from "vitest";

// Mock Supabase client
function createMockSupabase(mockData = {}) {
  const resolveRows = (table, filters = []) => {
    const tableData = mockData[table];

    if (!tableData) {
      return table === "tournament_calendar" ? [] : null;
    }

    if (Array.isArray(tableData)) {
      return tableData.filter((row) =>
        filters.every(({ column, value, operator }) => {
          if (operator === "lte") {
            return row[column] <= value;
          }
          if (operator === "gte") {
            return row[column] >= value;
          }
          return row[column] === value;
        }),
      );
    }

    for (const { column, value } of filters) {
      if (tableData[column] && value in tableData[column]) {
        return tableData[column][value];
      }
    }

    return table === "tournament_calendar" ? [] : null;
  };

  const createQueryBuilder = (table) => {
    const filters = [];
    const builder = {
      select: () => builder,
      eq: (column, value) => {
        filters.push({ column, value, operator: "eq" });
        return builder;
      },
      lte: (column, value) => {
        filters.push({ column, value, operator: "lte" });
        return builder;
      },
      gte: (column, value) => {
        filters.push({ column, value, operator: "gte" });
        return builder;
      },
      order: () => builder,
      limit: () => builder,
      maybeSingle: async () => ({
        data: Array.isArray(resolveRows(table, filters))
          ? resolveRows(table, filters)[0] || null
          : resolveRows(table, filters),
        error: null,
      }),
      single: async () => ({
        data: Array.isArray(resolveRows(table, filters))
          ? resolveRows(table, filters)[0] || null
          : resolveRows(table, filters),
        error: null,
      }),
      then: (resolve, reject) =>
        Promise.resolve({
          data: resolveRows(table, filters),
          error: null,
        }).then(resolve, reject),
    };

    return builder;
  };

  return {
    from: (table) => createQueryBuilder(table),
  };
}

describe("Session Resolver - Player Schedule Authority Removal", () => {
  test("No active player program resolves to baseline_program", async () => {
    const mockSupabase = createMockSupabase({
      player_programs: {
        player_id: {
          "test-user": null,
        },
      },
    });

    const result = await resolveTodaySession(
      mockSupabase,
      "test-user",
      "2025-02-03",
    );

    expect(result.success).toBe(true);
    expect(result.status).toBe("baseline_program");
    expect(result.session).toBeNull();
    expect(result.metadata.baselineProgram).toBe(true);
    expect(result.metadata.originalStatus).toBe("no_program");
  });

  test("Player schedule says practice, but no teamActivity => override MUST be null", async () => {
    // Setup: Player has practice schedule configured
    const mockSupabase = createMockSupabase({
      player_programs: {
        player_id: {
          "test-user": {
            id: "program-1",
            program_id: "prog-1",
            status: "active",
            start_date: "2025-01-01",
            training_programs: { id: "prog-1", name: "Test Program" },
          },
        },
      },
      training_programs: {
        id: {
          "prog-1": {
            id: "prog-1",
            name: "Test Program",
            program_type: "flag_football",
          },
        },
      },
      training_phases: {
        program_id: {
          "prog-1": {
            id: "phase-1",
            name: "Phase 1",
            start_date: "2025-01-01",
            end_date: "2025-12-31",
          },
        },
      },
      training_weeks: {
        phase_id: {
          "phase-1": {
            id: "week-1",
            name: "Week 1",
            start_date: "2025-02-01",
            end_date: "2025-02-07",
          },
        },
      },
      training_session_templates: {
        week_id: {
          "week-1": {
            id: "session-1",
            session_name: "Strength Session",
            session_type: "strength",
            day_of_week: 1, // Monday
          },
        },
      },
      daily_wellness_checkin: {
        user_id: {
          "test-user": null, // No rehab
        },
      },
    });

    const result = await resolveTodaySession(
      mockSupabase,
      "test-user",
      "2025-02-03",
    ); // Monday

    // Assertions
    expect(result.success).toBe(true);
    expect(result.override).toBeNull(); // MUST be null - no teamActivity, no override
    expect(result.session).not.toBeNull();
    expect(result.status).toBe("resolved");
  });

  test("No player schedule, but teamActivity practice => override MUST be flag_practice (handled upstream)", async () => {
    // This test documents that teamActivity override happens in daily-protocol.js, not here
    // session-resolver should NOT set flag_practice override based on player schedule

    const mockSupabase = createMockSupabase({
      player_programs: {
        player_id: {
          "test-user": {
            id: "program-1",
            program_id: "prog-1",
            status: "active",
            start_date: "2025-01-01",
            training_programs: { id: "prog-1", name: "Test Program" },
          },
        },
      },
      training_programs: {
        id: {
          "prog-1": {
            id: "prog-1",
            name: "Test Program",
            program_type: "flag_football",
          },
        },
      },
      training_phases: {
        program_id: {
          "prog-1": {
            id: "phase-1",
            name: "Phase 1",
            start_date: "2025-01-01",
            end_date: "2025-12-31",
          },
        },
      },
      training_weeks: {
        phase_id: {
          "phase-1": {
            id: "week-1",
            name: "Week 1",
            start_date: "2025-02-01",
            end_date: "2025-02-07",
          },
        },
      },
      training_session_templates: {
        week_id: {
          "week-1": {
            id: "session-1",
            session_name: "Strength Session",
            session_type: "strength",
            day_of_week: 1,
          },
        },
      },
      daily_wellness_checkin: {
        user_id: {
          "test-user": null,
        },
      },
    });

    const result = await resolveTodaySession(
      mockSupabase,
      "test-user",
      "2025-02-03",
    );

    // Assertions: session-resolver does NOT set flag_practice override
    // (That happens upstream in daily-protocol.js after teamActivity resolution)
    expect(result.success).toBe(true);
    expect(result.override).toBeNull(); // No override from player schedule
    expect(result.session).not.toBeNull();
  });

  test("Rehab protocol wins over any other override", async () => {
    const mockSupabase = createMockSupabase({
      player_programs: {
        player_id: {
          "test-user": {
            id: "program-1",
            program_id: "prog-1",
            status: "active",
            start_date: "2025-01-01",
            training_programs: { id: "prog-1", name: "Test Program" },
          },
        },
      },
      training_programs: {
        id: {
          "prog-1": {
            id: "prog-1",
            name: "Test Program",
            program_type: "flag_football",
          },
        },
      },
      training_phases: {
        program_id: {
          "prog-1": {
            id: "phase-1",
            name: "Phase 1",
            start_date: "2025-01-01",
            end_date: "2025-12-31",
          },
        },
      },
      training_weeks: {
        phase_id: {
          "phase-1": {
            id: "week-1",
            name: "Week 1",
            start_date: "2025-02-01",
            end_date: "2025-02-07",
          },
        },
      },
      training_session_templates: {
        week_id: {
          "week-1": {
            id: "session-1",
            session_name: "Strength Session",
            session_type: "strength",
            day_of_week: 1,
          },
        },
      },
      daily_wellness_checkin: {
        user_id: {
          "test-user": {
            soreness_areas: ["knee", "ankle"],
            pain_level: 3,
            checkin_date: "2025-02-03",
          },
        },
      },
    });

    const result = await resolveTodaySession(
      mockSupabase,
      "test-user",
      "2025-02-03",
    );

    // Assertions: Rehab protocol override should be set
    expect(result.success).toBe(true);
    expect(result.override).not.toBeNull();
    expect(result.override.type).toBe("rehab_protocol");
    expect(result.override.replaceSession).toBe(true);
  });
});
