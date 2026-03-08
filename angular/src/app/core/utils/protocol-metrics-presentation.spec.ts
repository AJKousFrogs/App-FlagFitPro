import { describe, expect, it } from "vitest";
import {
  buildProtocolAcwrPresentation,
  getProtocolAcwrDisplay,
  getProtocolRiskZone,
  getProtocolReadinessPresentation,
  getProtocolTrainingPlanReadinessLevel,
  normalizeProtocolMetricsSnapshot,
} from "./protocol-metrics-presentation";

describe("protocol-metrics-presentation", () => {
  it("normalizes protocol metrics and preserves backend acwr presentation", () => {
    const snapshot = normalizeProtocolMetricsSnapshot({
      id: "proto-1",
      protocol_date: "2026-03-07",
      readiness_score: 81,
      acwr_value: 1.09,
      acwr_presentation: {
        value: 1.09,
        level: "sweet-spot",
        label: "sweet spot",
        text: "ACWR 1.09 · sweet spot",
      },
      confidence_metadata: {
        acwr: { trainingDaysLogged: 21 },
      },
      ai_rationale: "Stay sharp today.",
    });

    expect(snapshot).toEqual({
      id: "proto-1",
      protocol_date: "2026-03-07",
      readiness_score: 81,
      acwr_value: 1.09,
      acwr_presentation: {
        value: 1.09,
        level: "sweet-spot",
        label: "sweet spot",
        text: "ACWR 1.09 · sweet spot",
      },
      confidence_metadata: {
        readiness: undefined,
        acwr: { trainingDaysLogged: 21 },
      },
      aiRationale: "Stay sharp today.",
    });
  });

  it("builds baseline-building acwr presentation when only training days are available", () => {
    expect(buildProtocolAcwrPresentation(null, 8)).toEqual({
      value: null,
      level: "no-data",
      label: "baseline building",
      text: "ACWR baseline building (8/21 logged)",
    });
  });

  it("prefers protocol truth for readiness and acwr displays", () => {
    const protocol = normalizeProtocolMetricsSnapshot({
      readiness_score: 74,
      acwr_presentation: {
        value: 1.44,
        level: "elevated-risk",
        label: "elevated",
        text: "ACWR 1.44 · elevated",
      },
      confidence_metadata: {
        acwr: { trainingDaysLogged: 21 },
      },
    });

    const readiness = getProtocolReadinessPresentation(protocol, 61);
    const acwr = getProtocolAcwrDisplay(protocol, 1.01, 12);

    expect(readiness.score).toBe(74);
    expect(readiness.label).toBe("Good");
    expect(acwr.value).toBe(1.44);
    expect(acwr.label).toBe("elevated");
    expect(acwr.severity).toBe("warning");
    expect(acwr.trainingDaysLogged).toBe(21);
  });

  it("maps protocol readiness into planner-friendly levels", () => {
    const protocol = normalizeProtocolMetricsSnapshot({
      readiness_score: 68,
    });

    expect(
      getProtocolTrainingPlanReadinessLevel(protocol, "low", null),
    ).toBe("high");
    expect(
      getProtocolTrainingPlanReadinessLevel(
        normalizeProtocolMetricsSnapshot({ readiness_score: 45 }),
        "high",
        null,
      ),
    ).toBe("moderate");
    expect(
      getProtocolTrainingPlanReadinessLevel(
        normalizeProtocolMetricsSnapshot({ readiness_score: 20 }),
        "high",
        null,
      ),
    ).toBe("low");
  });

  it("builds a protocol risk zone from backend acwr presentation", () => {
    const protocol = normalizeProtocolMetricsSnapshot({
      acwr_presentation: {
        value: 1.52,
        level: "danger-zone",
        label: "high risk",
        text: "ACWR 1.52 · high risk",
      },
    });

    expect(
      getProtocolRiskZone(
        protocol,
        {
          level: "sweet-spot",
          color: "green",
          label: "Sweet Spot",
          description: "fallback",
          recommendation: "fallback",
        },
        1.01,
        null,
      ),
    ).toMatchObject({
      level: "danger-zone",
      color: "red",
      label: "Danger Zone",
    });
  });
});
