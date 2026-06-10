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

  return {
    acwr:
      chronicLoad > 0 ? round(acuteLoad / chronicLoad, cfg.precision) : null,
    acuteLoad,
    chronicLoad,
    lowConfidence: daysWithData < cfg.minDaysWithData,
    daysWithData,
  };
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
 * ACWR risk zones (evidence-based thresholds — Gabbett 2016 / Lolli 2017).
 * `risk` = relative injury-risk multiplier; `action` = load recommendation.
 * Single source for both the zone label and the per-zone metadata that
 * training-plan and smart-training-recommendations previously duplicated.
 */
export const ACWR_RISK_ZONES = Object.freeze({
  detraining: { min: 0, max: 0.8, label: "Detraining", action: "increase_load", risk: 1.2 },
  safe: { min: 0.8, max: 1.3, label: "Safe", action: "maintain", risk: 1.0 },
  caution: { min: 1.3, max: 1.5, label: "Caution", action: "reduce_slightly", risk: 1.5 },
  danger: { min: 1.5, max: 1.8, label: "Danger", action: "reduce_significantly", risk: 2.0 },
  critical: { min: 1.8, max: Infinity, label: "Critical", action: "rest", risk: 4.2 },
});

/** Classify an ACWR ratio into a zone key, or null if not a finite number. */
export function classifyAcwrZone(acwr) {
  if (!Number.isFinite(acwr)) {
    return null;
  }
  if (acwr < 0.8) {
    return "detraining";
  }
  if (acwr <= 1.3) {
    return "safe";
  }
  if (acwr <= 1.5) {
    return "caution";
  }
  if (acwr < 1.8) {
    return "danger";
  }
  return "critical";
}
