/**
 * ACWR (Acute:Chronic Workload Ratio) — canonical, state-of-the-art implementation.
 *
 * Single source of truth for ACWR on the server. Both `calc-readiness.js`
 * (readiness/prescription) and `compute-acwr.js` (dashboard series) call this so
 * they can never drift. The Angular client (`acwr.service.ts`) mirrors the same
 * definition for display; the server value is canonical.
 *
 * Method (evidence-based):
 * - EXPONENTIALLY WEIGHTED MOVING AVERAGE (EWMA), not rolling average. EWMA weights
 *   recent load more and models fitness decay; it is a more sensitive injury-risk
 *   indicator than rolling averages (Williams et al. 2017, BJSM).
 * - UNCOUPLED windows: the chronic window is the 21 days *preceding* the acute
 *   7-day window (no overlap). Coupling (acute inside chronic) induces a spurious
 *   mathematical correlation (Lolli et al. 2017; Impellizzeri et al. 2020).
 * - Decay factor lambda = 2 / (N + 1) per window (the standard EWMA span<->lambda
 *   relation): acute N=7 -> 0.25, chronic N=21 -> ~0.0909.
 * - Safeguards: a chronic-load floor prevents inflated ratios when returning from a
 *   layoff (chronic ~ 0); a min-history flag marks low-confidence results.
 *
 * ACWR is treated as ONE input to the readiness composite — not a sole gate —
 * consistent with current best practice that cautions against over-trusting the
 * ratio in isolation (Impellizzeri et al. 2020).
 */

/** Default parameters. Override via opts for testing or team calibration. */
export const ACWR_DEFAULTS = Object.freeze({
  acuteDays: 7,
  chronicDays: 21, // uncoupled: the 21 days immediately before the acute week
  // lambda = 2 / (N + 1)
  acuteLambda: 2 / (7 + 1), // 0.25
  chronicLambda: 2 / (21 + 1), // ~0.0909
  minChronicLoad: 50, // AU floor — divide-by-small guard on return from layoff
  minDaysWithData: 14, // < 14 nonzero-load days in the 28d span => low confidence
  // Graded confidence (2026-07-14 audit C2): a binary low-confidence flag at 14
  // days is permanently "low" for a typical 2-3×/week amateur (~8-12 loaded
  // days/28) and stops carrying information. high ≥ 14 · medium 8-13 · low < 8.
  mediumDaysWithData: 8,
  // Below this RAW chronic EWMA (pre-floor) the ratio is not a meaningful
  // training signal — the divisor becomes the artificial minChronicLoad floor,
  // so a single 300 AU return session against a ~0 chronic produces ACWR ≈ 6 →
  // "Critical, rest", when the athlete actually needs a gradual re-entry ramp
  // (audit C3). Set AT the floor (50): above it the ratio divides real data.
  // (The audit proposed ~150, but a steady 2-3×/week amateur holds a chronic
  // EWMA of ~100-150 — that would misclassify real training as "no base".)
  minChronicForRatio: 50,
  precision: 3,
});

/** Date -> 'YYYY-MM-DD' (UTC), matching session_date keys used by callers. */
export function acwrDateKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function round(value, precision) {
  const f = 10 ** precision;
  return Math.round(value * f) / f;
}

/**
 * EWMA over a chronological series (index 0 = oldest, last = newest).
 * newest day gets weight lambda; older days decay by (1 - lambda).
 */
export function ewma(series, lambda) {
  if (!Array.isArray(series) || series.length === 0) {
    return 0;
  }
  const l = Math.min(Math.max(lambda, 0), 1);
  let value = series[0] || 0;
  for (let i = 1; i < series.length; i += 1) {
    value = l * (series[i] || 0) + (1 - l) * value;
  }
  return value;
}

/**
 * Build a chronological (oldest->newest) daily-load array for the window
 * [endDate - (count-1) ... endDate], shifted back by `offsetDays`, reading a
 * Map<'YYYY-MM-DD', number> and zero-filling missing days (EWMA needs contiguity).
 */
function windowSeries(dailyLoads, endDate, count, offsetDays = 0) {
  const series = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(endDate);
    d.setUTCDate(d.getUTCDate() - (i + offsetDays));
    series.push(dailyLoads.get(acwrDateKey(d)) || 0);
  }
  return series; // oldest -> newest
}

/**
 * Compute ACWR at a single date from a Map of daily loads.
 *
 * @param {Map<string, number>} dailyLoads - 'YYYY-MM-DD' -> summed daily load (e.g. session-RPE)
 * @param {Date|string} targetDate - the day to evaluate
 * @param {object} [opts] - overrides of ACWR_DEFAULTS
 * @returns {{acwr: number|null, acuteLoad: number, chronicLoad: number, lowConfidence: boolean, daysWithData: number}}
 */
export function computeAcwrAt(dailyLoads, targetDate, opts = {}) {
  const cfg = { ...ACWR_DEFAULTS, ...opts };
  const end = new Date(targetDate);

  // Acute = last `acuteDays`; chronic = the `chronicDays` immediately before them (uncoupled).
  const acuteSeries = windowSeries(dailyLoads, end, cfg.acuteDays, 0);
  const chronicSeries = windowSeries(
    dailyLoads,
    end,
    cfg.chronicDays,
    cfg.acuteDays,
  );

  const acuteLoad = round(ewma(acuteSeries, cfg.acuteLambda), cfg.precision);
  const chronicRaw = ewma(chronicSeries, cfg.chronicLambda);
  const chronicLoad = round(
    Math.max(chronicRaw, cfg.minChronicLoad),
    cfg.precision,
  );

  const daysWithData = [...acuteSeries, ...chronicSeries].filter(
    (v) => v > 0,
  ).length;

  // Return-to-training state (audit C3): with a raw chronic below the ratio
  // threshold, the ratio is dominated by the divide-by-small floor and reads
  // as fabricated risk ("ACWR 6 — Critical, rest" after one return session).
  // The honest signal is "building base — ramp gradually", not a ratio.
  const buildingBase = chronicRaw < cfg.minChronicForRatio;

  const confidence =
    daysWithData >= cfg.minDaysWithData
      ? "high"
      : daysWithData >= cfg.mediumDaysWithData
        ? "medium"
        : "low";

  return {
    acwr:
      buildingBase || chronicLoad <= 0
        ? null
        : round(acuteLoad / chronicLoad, cfg.precision),
    acuteLoad,
    chronicLoad,
    lowConfidence: daysWithData < cfg.minDaysWithData,
    /** "high" | "medium" | "low" — graded (audit C2); scale decision weight, don't binarize. */
    confidence,
    /** "normal" | "building_base" — building_base ⇒ acwr is null by design. */
    state: buildingBase ? "building_base" : "normal",
    daysWithData,
  };
}

/**
 * Resolve the effective ACWR evaluation date, accounting for a paused
 * account with ACWR freezing enabled (`account_pause_requests.acwr_frozen`).
 *
 * Without this, a paused athlete's acute/chronic windows keep advancing
 * against `computeAcwrAt`'s zero-fill-missing-days behavior — every day of
 * the pause reads as a zero-load day, silently decaying their ACWR toward
 * "detraining"/"building_base" even though nothing about their actual
 * training history changed; they just paused the app. Freezing means the
 * window stops advancing at the pause moment and keeps returning the last
 * true reading until they resume — never a fabricated decay through a gap
 * that isn't real detraining.
 *
 * Only ever moves evaluation EARLIER than requested (to the pause moment),
 * never later — this can only make the result more conservative/accurate,
 * never mask a real, current safety signal.
 *
 * The one I/O-touching export in this module; everything else above is pure
 * math. Both callers (`calc-readiness.js`, `compute-acwr.js`) resolve this
 * once and pass the result to `computeAcwrAt`/the series builder, so the
 * freeze policy itself has exactly one implementation (CLAUDE.md §4).
 */
export async function resolveAcwrEvaluationDate(supabase, userId, requestedDate) {
  const requested = new Date(requestedDate);
  if (!userId || Number.isNaN(requested.getTime())) {
    return requested;
  }

  const { data: pause } = await supabase
    .from("account_pause_requests")
    .select("paused_at")
    .eq("user_id", userId)
    .eq("is_active", true)
    .eq("acwr_frozen", true)
    .order("paused_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!pause?.paused_at) {
    return requested;
  }

  const pausedAt = new Date(pause.paused_at);
  return pausedAt < requested ? pausedAt : requested;
}

/**
 * Canonical session load (session-RPE): the stored `workload` if real, else
 * `rpe × duration_minutes`, else 0 (load is never fabricated from defaults).
 * Was hand-written in compute-acwr / training-plan / daily-training /
 * training-metrics; this is the single definition.
 */
export function computeSessionLoad(session) {
  const workload = Number(session?.workload);
  if (Number.isFinite(workload) && workload > 0) {
    return Math.round(workload * 100) / 100;
  }
  const rpe = Number(session?.rpe);
  const minutes = Number(session?.duration_minutes);
  if (rpe > 0 && minutes > 0) {
    return Math.round(rpe * minutes * 100) / 100;
  }
  return 0;
}

/**
 * ACWR zones — ADVISORY bands, not risk facts. The former per-zone
 * `risk` multipliers (1.2×/1.5×/2.0×/4.2×) were point estimates from the
 * contested Hulin/Gabbett-era association studies; the only cluster-RCT of
 * ACWR-guided load management found no effect (Dalen-Lorentsen 2021, BJSM,
 * doi:10.1136/bjsports-2020-103003), and whether ACWR associates with injury
 * at all is method-dependent (Dalen-Lorentsen 2021 JOSPT; Impellizzeri 2020).
 * Presenting multipliers as facts was false precision — removed 2026-07-14
 * (audit §1.1). Zones keep their labels + load-recommendation actions only.
 */
export const ACWR_RISK_ZONES = Object.freeze({
  detraining: {
    min: 0,
    max: 0.8,
    label: "Detraining",
    action: "increase_load",
  },
  safe: { min: 0.8, max: 1.3, label: "Safe", action: "maintain" },
  caution: {
    min: 1.3,
    max: 1.5,
    label: "Caution",
    action: "reduce_slightly",
  },
  danger: {
    min: 1.5,
    max: 1.8,
    label: "Danger",
    action: "reduce_significantly",
  },
  critical: {
    min: 1.8,
    max: Infinity,
    label: "Critical",
    action: "rest",
  },
});

/**
 * Classify an ACWR ratio into a zone key, or null if not a finite number.
 * `thresholds` (2026-07-14, cohort-aware backend): optional cohort boundaries
 * ({ sweetSpotLow, sweetSpotHigh, dangerHigh } — see utils/cohort.js).
 * Omitted → the adult ACWR_RISK_ZONES boundaries (back-compat; display lanes
 * that don't know the athlete's cohort stay on the adult baseline, which the
 * client tightens per the safe-direction rule). The critical line sits at
 * dangerHigh + 0.3, mirroring the adult 1.5→1.8 gap. Inclusivity preserved:
 * detraining/danger open at the top; safe/caution closed.
 */
export function classifyAcwrZone(acwr, thresholds = null) {
  if (!Number.isFinite(acwr)) {
    return null;
  }
  const Z = ACWR_RISK_ZONES;
  const low = thresholds?.sweetSpotLow ?? Z.safe.min;
  const high = thresholds?.sweetSpotHigh ?? Z.safe.max;
  const danger = thresholds?.dangerHigh ?? Z.caution.max;
  const critical = thresholds ? danger + 0.3 : Z.critical.min;
  if (acwr < low) {
    return "detraining";
  }
  if (acwr <= high) {
    return "safe";
  }
  if (acwr <= danger) {
    return "caution";
  }
  if (acwr < critical) {
    return "danger";
  }
  return "critical";
}
