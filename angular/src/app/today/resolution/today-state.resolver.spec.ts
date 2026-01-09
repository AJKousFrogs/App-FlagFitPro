/**
 * TODAY State Resolver Unit Tests
 *
 * Tests all 12 canonical scenarios from CONTRACT_2.2_TODAY_State_Behavior_Resolution.md
 */

import { describe, it, expect } from "vitest";
import { resolveTodayState, ProtocolJson } from "./today-state.resolver";

describe("resolveTodayState", () => {
  const nowLocal = new Date("2026-01-06T10:00:00Z");

  // ========================================================================
  // SCENARIO 1: Missing Readiness + Baseline ACWR + Normal Day
  // ========================================================================
  it("Scenario 1: Missing Readiness + Baseline ACWR + Normal Day", () => {
    const protocol: ProtocolJson = {
      id: "test-1",
      protocol_date: "2026-01-06",
      readiness_score: null,
      acwr_value: null,
      confidence_metadata: {
        readiness: {
          hasData: false,
          source: "none",
          daysStale: null,
          confidence: "none",
        },
        acwr: {
          hasData: false,
          source: "none",
          trainingDaysLogged: 5,
          confidence: "building_baseline",
        },
        sessionResolution: {
          success: true,
          status: "resolved",
          hasProgram: true,
          hasSessionTemplate: true,
          override: null,
        },
        hasActiveProgram: true,
        injuryProtocolActive: false,
      },
      session_resolution: {
        success: true,
        status: "resolved",
        override: null,
      },
    };

    const result = resolveTodayState(protocol, nowLocal);

    expect(result.trainingAllowed).toBe(true);
    expect(result.banners).toHaveLength(1);
    expect(result.banners[0].type).toBe("info");
    expect(result.banners[0].style).toBe("blue");
    expect(result.banners[0].text).toContain("Check-in not logged yet");
    expect(result.primaryCta?.label).toBe("2-min Check-in");
    expect(result.secondaryCta?.label).toBe("Start Training Anyway");
    expect(result.merlinPosture).toBe("explanatory");
    expect(result.acwrBaseline?.trainingDaysLogged).toBe(5);
    expect(result.acwrBaseline?.progressPercent).toBeCloseTo(23.81, 1);
  });

  // ========================================================================
  // SCENARIO 2: Stale Readiness + Practice Day
  // ========================================================================
  it("Scenario 2: Stale Readiness + Practice Day", () => {
    const protocol: ProtocolJson = {
      id: "test-2",
      protocol_date: "2026-01-06",
      readiness_score: 78,
      confidence_metadata: {
        readiness: {
          hasData: true,
          source: "wellness_checkin",
          daysStale: 1.5,
          confidence: "stale",
        },
        sessionResolution: {
          success: true,
          status: "resolved",
          hasProgram: true,
          hasSessionTemplate: true,
          override: "flag_practice",
        },
        hasActiveProgram: true,
        injuryProtocolActive: false,
      },
      session_resolution: {
        success: true,
        status: "resolved",
        override: {
          type: "flag_practice",
        },
      },
      teamActivity: {
        type: "practice",
        startTimeLocal: "18:00",
        participation: "required",
        createdByCoachName: "Coach Smith",
      },
    };

    const result = resolveTodayState(protocol, nowLocal);

    expect(result.trainingAllowed).toBe(true);
    expect(result.banners.length).toBeGreaterThanOrEqual(2);
    expect(result.banners[0].type).toBe("warning");
    expect(result.banners[0].text).toContain("Last check-in was");
    expect(result.banners[1].type).toBe("info");
    expect(result.banners[1].text).toContain("Flag Practice Today");
    expect(result.blocksDisplayed).toContain("pre_practice_activation");
    expect(result.blocksDisplayed).toContain("flag_practice");
    expect(result.merlinPosture).toBe("warning");
  });

  // ========================================================================
  // SCENARIO 3: Rehab Protocol + Team Practice (Conflict)
  // ========================================================================
  it("Scenario 3: Rehab Protocol + Team Practice", () => {
    const protocol: ProtocolJson = {
      id: "test-3",
      protocol_date: "2026-01-06",
      confidence_metadata: {
        injuryProtocolActive: true,
        sessionResolution: {
          success: true,
          status: "resolved",
          hasProgram: true,
          hasSessionTemplate: true,
          override: "rehab_protocol",
        },
        hasActiveProgram: true,
      },
      session_resolution: {
        success: true,
        status: "resolved",
        override: {
          type: "rehab_protocol",
        },
      },
      teamActivity: {
        type: "practice",
        startTimeLocal: "18:00",
        participation: "excluded", // Excluded due to rehab
        createdByCoachName: "Coach Smith",
      },
    };

    const result = resolveTodayState(protocol, nowLocal);

    expect(result.trainingAllowed).toBe(true);
    expect(result.banners[0].type).toBe("alert");
    expect(result.banners[0].text).toContain("Return-to-Play Protocol Active");
    expect(result.banners[0].text).toContain("Team practice today");
    expect(result.blocksDisplayed).toContain("rehab_exercises");
    expect(result.blocksDisplayed).not.toContain("flag_practice");
    expect(result.merlinPosture).toBe("refusal");
    expect(result.primaryCta?.label).toBe("View Rehab Phase Details");
  });

  // ========================================================================
  // SCENARIO 4: Weather Override + No Wellness
  // ========================================================================
  it("Scenario 4: Weather Override + No Wellness", () => {
    const protocol: ProtocolJson = {
      id: "test-4",
      protocol_date: "2026-01-06",
      readiness_score: null,
      confidence_metadata: {
        readiness: {
          hasData: false,
          source: "none",
          confidence: "none",
        },
        sessionResolution: {
          success: true,
          status: "resolved",
          hasProgram: true,
          hasSessionTemplate: true,
          override: "weather_override",
        },
        hasActiveProgram: true,
        injuryProtocolActive: false,
      },
      session_resolution: {
        success: true,
        status: "resolved",
        override: {
          type: "weather_override",
        },
      },
      weather_override: true,
      weather_condition: "rain",
      coach_modified: true,
      modified_by_coach_name: "Coach Smith",
    };

    const result = resolveTodayState(protocol, nowLocal);

    expect(result.trainingAllowed).toBe(true);
    expect(result.banners[0].type).toBe("alert");
    expect(result.banners[0].text).toContain("Weather Alert");
    expect(result.banners[0].text).toContain("Coach Smith");
    expect(result.banners.length).toBeGreaterThan(1); // Should have wellness banner too
    expect(result.blocksDisplayed).toContain("film_room");
    expect(result.merlinPosture).toBe("explanatory");
  });

  // ========================================================================
  // SCENARIO 5: External Program + Baseline ACWR
  // ========================================================================
  it("Scenario 5: External Program + Baseline ACWR", () => {
    const protocol: ProtocolJson = {
      id: "test-5",
      protocol_date: "2026-01-06",
      confidence_metadata: {
        acwr: {
          hasData: false,
          source: "none",
          trainingDaysLogged: 3,
          confidence: "building_baseline",
        },
        sessionResolution: {
          success: false,
          status: "external_program",
          hasProgram: false,
          hasSessionTemplate: false,
          override: null,
        },
        hasActiveProgram: false,
        injuryProtocolActive: false,
      },
      session_resolution: {
        success: false,
        status: "external_program",
        override: null,
      },
    };

    const result = resolveTodayState(protocol, nowLocal);

    // External program should still allow training (self-managed)
    expect(result.trainingAllowed).toBe(true);
    expect(
      result.banners.some((b) => b.text.includes("External Program")),
    ).toBe(true);
    expect(result.blocksDisplayed).toContain("morning_mobility");
    expect(result.acwrBaseline?.trainingDaysLogged).toBe(3);
  });

  // ========================================================================
  // SCENARIO 6: Taper + Fresh Readiness
  // ========================================================================
  it("Scenario 6: Taper + Fresh Readiness", () => {
    const protocol: ProtocolJson = {
      id: "test-6",
      protocol_date: "2026-01-06",
      readiness_score: 85,
      confidence_metadata: {
        readiness: {
          hasData: true,
          source: "wellness_checkin",
          daysStale: 0,
          confidence: "measured",
        },
        sessionResolution: {
          success: true,
          status: "resolved",
          hasProgram: true,
          hasSessionTemplate: true,
          override: "taper",
        },
        hasActiveProgram: true,
        injuryProtocolActive: false,
      },
      session_resolution: {
        success: true,
        status: "resolved",
        override: {
          type: "taper",
        },
      },
      taper_active: true,
      taper_days_until: 4,
      tournament_name: "Regional Championship",
    };

    const result = resolveTodayState(protocol, nowLocal);

    expect(result.trainingAllowed).toBe(true);
    expect(result.banners[0].type).toBe("info");
    expect(result.banners[0].text).toContain("Tapering");
    expect(result.banners[0].text).toContain("Regional Championship");
    expect(result.banners[0].text).toContain("4 days out");
    expect(result.blocksDisplayed).toContain("taper_session");
    expect(result.merlinPosture).toBe("warning");
    expect(result.headerContext?.taperContext).toContain(
      "Regional Championship",
    );
  });

  // ========================================================================
  // SCENARIO 7: Coach Alert + Anything Else
  // ========================================================================
  it("Scenario 7: Coach Alert + Anything Else", () => {
    const protocol: ProtocolJson = {
      id: "test-7",
      protocol_date: "2026-01-06",
      readiness_score: 75,
      confidence_metadata: {
        readiness: {
          hasData: true,
          confidence: "measured",
        },
        sessionResolution: {
          success: true,
          status: "resolved",
          hasProgram: true,
          hasSessionTemplate: true,
          override: null,
        },
        hasActiveProgram: true,
        injuryProtocolActive: false,
      },
      session_resolution: {
        success: true,
        status: "resolved",
        override: null,
      },
      coach_alert_active: true,
      coach_alert_type: "session_modified",
      coach_alert_message: "Session intensity increased for competition prep",
      coach_alert_requires_acknowledgment: true,
      coach_acknowledged: false,
    };

    const result = resolveTodayState(protocol, nowLocal);

    expect(result.trainingAllowed).toBe(false); // Blocked until acknowledged
    expect(result.banners[0].type).toBe("alert");
    expect(result.banners[0].text).toContain("Coach Alert");
    expect(result.banners[0].text).toContain("Acknowledgment required");
    expect(result.merlinPosture).toBe("silent");
    expect(result.primaryCta?.action).toBe("acknowledge_coach_alert");
  });

  // ========================================================================
  // SCENARIO 8: Session Resolution Failure
  // ========================================================================
  it("Scenario 8: Session Resolution Failure", () => {
    const protocol: ProtocolJson = {
      id: "test-8",
      protocol_date: "2026-01-06",
      confidence_metadata: {
        sessionResolution: {
          success: false,
          status: "no_template",
          hasProgram: true,
          hasSessionTemplate: false,
          override: null,
        },
        hasActiveProgram: true,
        injuryProtocolActive: false,
      },
      session_resolution: {
        success: false,
        status: "no_template",
        override: null,
      },
    };

    const result = resolveTodayState(protocol, nowLocal);

    expect(result.trainingAllowed).toBe(false);
    expect(result.errorState?.reason_code).toBe("SESSION_RESOLUTION_FAILED");
    expect(result.banners[0].type).toBe("error");
    expect(result.banners[0].text).toContain("No session found");
    expect(result.blocksDisplayed).toHaveLength(0);
    expect(result.merlinPosture).toBe("explanatory");
  });

  // ========================================================================
  // SCENARIO 9: No Active Program
  // ========================================================================
  it("Scenario 9: No Active Program", () => {
    const protocol: ProtocolJson = {
      id: "test-9",
      protocol_date: "2026-01-06",
      confidence_metadata: {
        sessionResolution: {
          success: false,
          status: "no_program",
          hasProgram: false,
          hasSessionTemplate: false,
          override: null,
        },
        hasActiveProgram: false,
        injuryProtocolActive: false,
      },
      session_resolution: {
        success: false,
        status: "no_program",
        override: null,
      },
    };

    const result = resolveTodayState(protocol, nowLocal);

    expect(result.trainingAllowed).toBe(false);
    expect(result.errorState?.reason_code).toBe("NO_ACTIVE_PROGRAM");
    expect(result.banners[0].type).toBe("error");
    expect(result.banners[0].text).toContain("No training program assigned");
    expect(result.merlinPosture).toBe("refusal");
  });

  // ========================================================================
  // SCENARIO 10: Film Room Day (No Field Training)
  // ========================================================================
  it("Scenario 10: Film Room Day", () => {
    const protocol: ProtocolJson = {
      id: "test-10",
      protocol_date: "2026-01-06",
      readiness_score: 82,
      confidence_metadata: {
        readiness: {
          hasData: true,
          confidence: "measured",
        },
        sessionResolution: {
          success: true,
          status: "resolved",
          hasProgram: true,
          hasSessionTemplate: true,
          override: "film_room",
        },
        hasActiveProgram: true,
        injuryProtocolActive: false,
      },
      session_resolution: {
        success: true,
        status: "resolved",
        override: {
          type: "film_room",
        },
      },
      teamActivity: {
        type: "film_room",
        startTimeLocal: "10:00",
        participation: "required",
        createdByCoachName: "Coach Smith",
      },
    };

    const result = resolveTodayState(protocol, nowLocal);

    expect(result.trainingAllowed).toBe(true);
    expect(result.banners[0].type).toBe("info");
    expect(result.banners[0].text).toContain("Film Room Today");
    expect(result.banners[0].text).toContain("10:00");
    expect(result.blocksDisplayed).toContain("film_room");
    expect(result.blocksDisplayed).not.toContain("main_session");
    expect(result.merlinPosture).toBe("explanatory");
    expect(result.headerContext?.filmRoomTime).toBe("10:00");
  });

  // ========================================================================
  // SCENARIO 11: Practice Day + Stale Readiness (2+ days)
  // ========================================================================
  it("Scenario 11: Practice Day + Stale Readiness (2+ days)", () => {
    const protocol: ProtocolJson = {
      id: "test-11",
      protocol_date: "2026-01-06",
      readiness_score: 72,
      confidence_metadata: {
        readiness: {
          hasData: true,
          source: "wellness_checkin",
          daysStale: 2.2,
          confidence: "stale",
        },
        sessionResolution: {
          success: true,
          status: "resolved",
          hasProgram: true,
          hasSessionTemplate: true,
          override: "flag_practice",
        },
        hasActiveProgram: true,
        injuryProtocolActive: false,
      },
      session_resolution: {
        success: true,
        status: "resolved",
        override: {
          type: "flag_practice",
        },
      },
      teamActivity: {
        type: "practice",
        startTimeLocal: "18:00",
        participation: "required",
        createdByCoachName: "Coach Smith",
      },
    };

    const result = resolveTodayState(protocol, nowLocal);

    expect(result.trainingAllowed).toBe(true);
    expect(result.banners.length).toBeGreaterThanOrEqual(2);
    expect(result.banners[0].type).toBe("warning");
    expect(result.banners[0].text).toContain("2 days ago");
    expect(result.banners[1].text).toContain("Flag Practice Today");
    expect(result.merlinPosture).toBe("warning");
    expect(result.primaryCta?.label).toBe("Update Check-in");
  });

  // ========================================================================
  // SCENARIO 12: Rehab Protocol + Practice Day (Detailed)
  // ========================================================================
  it("Scenario 12: Rehab Protocol + Practice Day (Detailed)", () => {
    const protocol: ProtocolJson = {
      id: "test-12",
      protocol_date: "2026-01-06",
      confidence_metadata: {
        injuryProtocolActive: true,
        sessionResolution: {
          success: true,
          status: "resolved",
          hasProgram: true,
          hasSessionTemplate: true,
          override: "rehab_protocol",
        },
        hasActiveProgram: true,
      },
      session_resolution: {
        success: true,
        status: "resolved",
        override: {
          type: "rehab_protocol",
        },
      },
      teamActivity: {
        type: "practice",
        startTimeLocal: "18:00",
        participation: "excluded", // Excluded due to rehab
        createdByCoachName: "Coach Smith",
      },
    };

    const result = resolveTodayState(protocol, nowLocal);

    expect(result.trainingAllowed).toBe(true);
    expect(result.banners[0].type).toBe("alert");
    expect(result.banners[0].text).toContain("Return-to-Play Protocol Active");
    expect(result.banners[0].text).toContain("Team practice today");
    expect(result.banners[0].text).toContain("excluded for rehab");
    expect(result.banners.length).toBeGreaterThan(1); // Should have practice context banner
    expect(result.blocksDisplayed).toContain("rehab_exercises");
    expect(result.blocksDisplayed).not.toContain("flag_practice");
    expect(result.merlinPosture).toBe("refusal");
    expect(result.primaryCta?.label).toBe("View Rehab Phase Details");
  });

  // ========================================================================
  // Edge Cases
  // ========================================================================
  it("Handles null protocol gracefully", () => {
    const result = resolveTodayState(null, nowLocal);

    expect(result.trainingAllowed).toBe(false);
    expect(result.errorState?.reason_code).toBe("NO_PROTOCOL_DATA");
  });

  it("Handles missing confidence_metadata", () => {
    const protocol: ProtocolJson = {
      id: "test-edge",
      protocol_date: "2026-01-06",
    };

    const result = resolveTodayState(protocol, nowLocal);

    // Should default to normal day if no errors detected
    expect(result.trainingAllowed).toBe(true);
  });
});
