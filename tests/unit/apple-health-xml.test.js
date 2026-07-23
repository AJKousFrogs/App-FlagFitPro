import { describe, it, expect } from "vitest";
import { parseAppleHealthExport } from "../../netlify/functions/utils/apple-health-xml.js";

function record(attrs) {
  const attrString = Object.entries(attrs)
    .map(([k, v]) => `${k}="${v}"`)
    .join(" ");
  return `<Record ${attrString}/>`;
}

describe("parseAppleHealthExport", () => {
  it("maps a known quantity type to its canonical metric", () => {
    const xml = `<HealthData>${record({
      type: "HKQuantityTypeIdentifierHeartRate",
      sourceName: "Apple Watch",
      unit: "count/min",
      value: "62",
      startDate: "2024-01-01 07:59:00 -0700",
      endDate: "2024-01-01 08:00:00 -0700",
    })}</HealthData>`;

    const { readings, recordCount, skippedCount } = parseAppleHealthExport(xml);
    expect(recordCount).toBe(1);
    expect(skippedCount).toBe(0);
    expect(readings).toEqual([
      {
        metric: "heart_rate",
        value: 62,
        unit: "count/min",
        recordedAt: new Date("2024-01-01 07:59:00 -0700").toISOString(),
      },
    ]);
  });

  it("maps multiple known quantity types", () => {
    const xml = [
      record({
        type: "HKQuantityTypeIdentifierHeartRateVariabilitySDNN",
        unit: "ms",
        value: "45.2",
        startDate: "2024-01-01 06:00:00 -0700",
      }),
      record({
        type: "HKQuantityTypeIdentifierRestingHeartRate",
        unit: "count/min",
        value: "58",
        startDate: "2024-01-01 06:05:00 -0700",
      }),
    ].join("\n");

    const { readings } = parseAppleHealthExport(xml);
    expect(readings.map((r) => r.metric)).toEqual(["hrv", "resting_heart_rate"]);
  });

  it("skips category types (e.g. sleep analysis) — not a numeric quantity", () => {
    const xml = record({
      type: "HKCategoryTypeIdentifierSleepAnalysis",
      value: "HKCategoryValueSleepAnalysisAsleep",
      startDate: "2024-01-01 23:00:00 -0700",
    });
    const { readings, recordCount, skippedCount } = parseAppleHealthExport(xml);
    expect(recordCount).toBe(1);
    expect(readings).toHaveLength(0);
    expect(skippedCount).toBe(1);
  });

  it("skips a known type with a non-numeric value", () => {
    const xml = record({
      type: "HKQuantityTypeIdentifierHeartRate",
      unit: "count/min",
      value: "not-a-number",
      startDate: "2024-01-01 06:00:00 -0700",
    });
    const { readings, skippedCount } = parseAppleHealthExport(xml);
    expect(readings).toHaveLength(0);
    expect(skippedCount).toBe(1);
  });

  it("unescapes XML entities in attribute values", () => {
    const xml = record({
      type: "HKQuantityTypeIdentifierHeartRate",
      sourceName: "Watch &amp; Phone",
      unit: "count/min",
      value: "70",
      startDate: "2024-01-01 06:00:00 -0700",
    });
    // sourceName isn't surfaced in the reading, but this proves the parser
    // doesn't choke on entity-escaped attributes elsewhere in a real export.
    const { readings } = parseAppleHealthExport(xml);
    expect(readings).toHaveLength(1);
  });

  it("truncates at maxReadings while still reporting the true recordCount", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      record({
        type: "HKQuantityTypeIdentifierHeartRate",
        unit: "count/min",
        value: String(60 + i),
        startDate: `2024-01-0${i + 1} 06:00:00 -0700`,
      }),
    ).join("\n");

    const { readings, recordCount, truncated } = parseAppleHealthExport(records, {
      maxReadings: 2,
    });
    expect(recordCount).toBe(5);
    expect(readings).toHaveLength(2);
    expect(truncated).toBe(true);
  });

  it("reports recordCount 0 and no truncation for an export with no Records", () => {
    const { readings, recordCount, truncated } = parseAppleHealthExport(
      "<HealthData></HealthData>",
    );
    expect(recordCount).toBe(0);
    expect(readings).toHaveLength(0);
    expect(truncated).toBe(false);
  });
});
