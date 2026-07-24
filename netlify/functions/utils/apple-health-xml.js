// Parses Apple Health's `export.xml` (from the Health app's own "Export All
// Health Data" -> a ZIP containing export.xml) into wearable_health readings.
//
// Apple has no server-to-server HealthKit API at all (deliberate privacy
// design) -- this manual-export path is one of the only ways to get Apple
// Watch/Health data into the app without a native companion iOS app. See
// docs/gps_wearable_csv_import_proposal.md §3.
//
// export.xml's <Record> elements are simple, flat, self-closing tags
// (type/sourceName/unit/value/startDate/endDate as attributes) -- a real,
// stable, Apple-documented shape (unlike a vendor's webhook payload), so a
// small dependency-free regex extractor is used here rather than pulling in
// a full XML-parsing library for a format this simple.
//
// The caller is expected to unzip export.zip themselves and upload the raw
// export.xml text -- no ZIP-extraction dependency is added for this.

// Apple's HKQuantityTypeIdentifier -> our canonical wearable_health.metric
// name. Deliberately QUANTITY types only (a straight 1 record = 1 reading
// mapping) -- HKCategoryTypeIdentifierSleepAnalysis and other category types
// (value is a state name like "HKCategoryValueSleepAnalysisAsleep", not a
// number, and a real "hours slept" figure needs aggregating potentially many
// overlapping asleep-state intervals per night) are a real, separate gap,
// not attempted here.
export const APPLE_HEALTH_QUANTITY_TYPES = Object.freeze({
  HKQuantityTypeIdentifierHeartRate: "heart_rate",
  HKQuantityTypeIdentifierRestingHeartRate: "resting_heart_rate",
  HKQuantityTypeIdentifierHeartRateVariabilitySDNN: "hrv",
  HKQuantityTypeIdentifierDistanceWalkingRunning: "distance_walking_running_m",
  HKQuantityTypeIdentifierActiveEnergyBurned: "active_energy_kcal",
  HKQuantityTypeIdentifierStepCount: "steps",
  HKQuantityTypeIdentifierVO2Max: "vo2_max",
  HKQuantityTypeIdentifierRespiratoryRate: "respiratory_rate",
});

function unescapeXmlEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function parseAttributes(tag) {
  const attrs = {};
  const attrRe = /([A-Za-z]+)="([^"]*)"/g;
  let match;
  while ((match = attrRe.exec(tag))) {
    attrs[match[1]] = unescapeXmlEntities(match[2]);
  }
  return attrs;
}

/**
 * @returns {{readings: object[], recordCount: number, skippedCount: number}}
 *   readings: [{metric, value, unit, recordedAt}], ready for
 *   ingestWearableReadings(supabase, userId, "apple_health", readings).
 *   recordCount: total <Record> elements found (for a truncation warning).
 *   skippedCount: recordCount minus readings.length (category types, bad values).
 */
export function parseAppleHealthExport(xml, { maxReadings = 5000 } = {}) {
  const readings = [];
  let recordCount = 0;
  let truncated = false;

  for (const match of xml.matchAll(/<Record\b[^>]*\/>/g)) {
    recordCount += 1;

    const attrs = parseAttributes(match[0]);
    const metric = APPLE_HEALTH_QUANTITY_TYPES[attrs.type];
    if (!metric) {
      continue; // unmapped/category type — see module doc comment
    }

    const value = Number(attrs.value);
    if (!Number.isFinite(value) || !attrs.startDate) {
      continue;
    }

    if (readings.length >= maxReadings) {
      truncated = true;
      continue; // keep scanning to report an accurate recordCount
    }

    readings.push({
      metric,
      value,
      unit: attrs.unit ?? null,
      // Apple's format ("2024-01-01 07:59:00 -0700") parses fine via Date —
      // not strict ISO 8601, but a valid Date constructor input.
      recordedAt: new Date(attrs.startDate).toISOString(),
    });
  }

  return {
    readings,
    recordCount,
    skippedCount: recordCount - readings.length,
    truncated,
  };
}
