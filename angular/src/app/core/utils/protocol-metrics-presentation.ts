import { getReadinessLevel } from "../constants/wellness.constants";
import type { RiskZone } from "../models/acwr.models";

export type PresentationSeverity =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "secondary"
  | "primary";

export type ProtocolAcwrLevel =
  | "sweet-spot"
  | "under-training"
  | "elevated-risk"
  | "danger-zone"
  | "no-data";

export interface ProtocolAcwrPresentation {
  value: number | null;
  level: ProtocolAcwrLevel;
  label: string | null;
  text: string | null;
}

export interface ProtocolMetricsSnapshot {
  id?: string;
  protocol_date?: string;
  readiness_score?: number | null;
  acwr_value?: number | null;
  acwr_presentation?: ProtocolAcwrPresentation | null;
  confidence_metadata?: {
    readiness?: {
      daysStale?: number | null;
    };
    acwr?: {
      trainingDaysLogged?: number | null;
    };
  } | null;
  aiRationale?: string | null;
}

export interface ReadinessPresentation {
  score: number | null;
  label: string;
  severity: PresentationSeverity;
  cssClass: string;
}

export interface AcwrDisplayPresentation {
  value: number | null;
  label: string;
  severity: PresentationSeverity;
  text: string | null;
  level: ProtocolAcwrLevel;
  trainingDaysLogged: number | null;
  hasData: boolean;
  baselineBuilding: boolean;
}

export type TrainingPlanReadinessLevel = "low" | "moderate" | "high";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getNumber(
  source: Record<string, unknown>,
  ...keys: string[]
): number | null | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (value === null) {
      return null;
    }
  }
  return undefined;
}

function getString(
  source: Record<string, unknown>,
  ...keys: string[]
): string | null | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string") {
      return value;
    }
    if (value === null) {
      return null;
    }
  }
  return undefined;
}

export function buildProtocolAcwrPresentation(
  acwrValue: number | null | undefined,
  trainingDaysLogged?: number | null,
): ProtocolAcwrPresentation {
  if (
    typeof acwrValue !== "number" ||
    !Number.isFinite(acwrValue) ||
    acwrValue <= 0
  ) {
    const baselineBuilding =
      typeof trainingDaysLogged === "number" &&
      trainingDaysLogged > 0 &&
      trainingDaysLogged < 21;

    return {
      value: null,
      level: "no-data",
      label: baselineBuilding ? "baseline building" : "no data",
      text: baselineBuilding
        ? `ACWR baseline building (${trainingDaysLogged}/21 logged)`
        : null,
    };
  }

  if (acwrValue < 0.8) {
    return {
      value: acwrValue,
      level: "under-training",
      label: "under target",
      text: `ACWR ${acwrValue.toFixed(2)} · under target`,
    };
  }

  if (acwrValue <= 1.3) {
    return {
      value: acwrValue,
      level: "sweet-spot",
      label: "sweet spot",
      text: `ACWR ${acwrValue.toFixed(2)} · sweet spot`,
    };
  }

  if (acwrValue <= 1.5) {
    return {
      value: acwrValue,
      level: "elevated-risk",
      label: "elevated",
      text: `ACWR ${acwrValue.toFixed(2)} · elevated`,
    };
  }

  return {
    value: acwrValue,
    level: "danger-zone",
    label: "high risk",
    text: `ACWR ${acwrValue.toFixed(2)} · high risk`,
  };
}

export function normalizeProtocolMetricsSnapshot(
  data: unknown,
): ProtocolMetricsSnapshot | null {
  if (!isRecord(data)) {
    return null;
  }

  const confidenceMetadataSource = isRecord(data.confidence_metadata)
    ? data.confidence_metadata
    : isRecord(data.confidenceMetadata)
      ? data.confidenceMetadata
      : null;

  const readinessMetadata = confidenceMetadataSource?.readiness;
  const acwrMetadata = confidenceMetadataSource?.acwr;

  const readiness = getNumber(data, "readiness_score", "readinessScore");
  const acwrValue = getNumber(data, "acwr_value", "acwrValue");
  const trainingDaysLogged = isRecord(acwrMetadata)
    ? getNumber(acwrMetadata, "trainingDaysLogged", "training_days_logged")
    : null;

  const acwrPresentationSource = isRecord(data.acwr_presentation)
    ? data.acwr_presentation
    : isRecord(data.acwrPresentation)
      ? data.acwrPresentation
      : null;

  const acwrPresentation = acwrPresentationSource
    ? {
        value:
          getNumber(acwrPresentationSource, "value") ??
          (typeof acwrValue === "number" ? acwrValue : null),
        level:
          (getString(acwrPresentationSource, "level") as ProtocolAcwrLevel) ??
          "no-data",
        label: getString(acwrPresentationSource, "label") ?? null,
        text: getString(acwrPresentationSource, "text") ?? null,
      }
    : buildProtocolAcwrPresentation(acwrValue, trainingDaysLogged ?? null);

  return {
    id: getString(data, "id") ?? undefined,
    protocol_date:
      getString(data, "protocol_date", "protocolDate", "date") ?? undefined,
    readiness_score: readiness ?? null,
    acwr_value: acwrValue ?? null,
    acwr_presentation: acwrPresentation,
    confidence_metadata: confidenceMetadataSource
      ? {
          readiness: isRecord(readinessMetadata)
            ? {
                daysStale:
                  getNumber(readinessMetadata, "daysStale", "days_stale") ??
                  null,
              }
            : undefined,
          acwr: isRecord(acwrMetadata)
            ? {
                trainingDaysLogged: trainingDaysLogged ?? null,
              }
            : undefined,
        }
      : null,
    aiRationale:
      getString(data, "aiRationale", "ai_rationale") ?? null,
  };
}

export function getProtocolReadinessPresentation(
  protocol: ProtocolMetricsSnapshot | null | undefined,
  fallbackScore: number | null,
): ReadinessPresentation {
  const score = protocol?.readiness_score ?? fallbackScore;
  if (score === null || score === undefined) {
    return {
      score: null,
      label: "No data",
      severity: "info",
      cssClass: "unknown",
    };
  }

  const readiness = getReadinessLevel(score);
  return {
    score,
    label: readiness.label,
    severity: readiness.severity === "warning" ? "warning" : readiness.severity,
    cssClass: readiness.cssClass,
  };
}

export function getProtocolAcwrDisplay(
  protocol: ProtocolMetricsSnapshot | null | undefined,
  fallbackValue: number | null,
  fallbackTrainingDays: number | null,
): AcwrDisplayPresentation {
  const trainingDaysLogged =
    protocol?.confidence_metadata?.acwr?.trainingDaysLogged ??
    fallbackTrainingDays ??
    null;

  const presentation =
    protocol?.acwr_presentation ??
    buildProtocolAcwrPresentation(
      protocol?.acwr_value ?? fallbackValue,
      trainingDaysLogged,
    );

  const severityMap: Record<ProtocolAcwrLevel, PresentationSeverity> = {
    "sweet-spot": "success",
    "under-training": "warning",
    "elevated-risk": "warning",
    "danger-zone": "danger",
    "no-data": "info",
  };

  return {
    value: presentation.value,
    label: presentation.label ?? "No data",
    severity: severityMap[presentation.level],
    text: presentation.text,
    level: presentation.level,
    trainingDaysLogged,
    hasData: typeof presentation.value === "number",
    baselineBuilding:
      presentation.level === "no-data" &&
      typeof trainingDaysLogged === "number" &&
      trainingDaysLogged > 0,
  };
}

export function getProtocolTrainingPlanReadinessLevel(
  protocol: ProtocolMetricsSnapshot | null | undefined,
  fallbackLevel: TrainingPlanReadinessLevel | null,
  fallbackScore: number | null,
): TrainingPlanReadinessLevel {
  const readiness = getProtocolReadinessPresentation(protocol, fallbackScore);

  switch (readiness.cssClass) {
    case "excellent":
    case "good":
      return "high";
    case "moderate":
      return "moderate";
    case "low":
      return "low";
    default:
      return fallbackLevel ?? "moderate";
  }
}

export function getProtocolRiskZone(
  protocol: ProtocolMetricsSnapshot | null | undefined,
  fallbackRiskZone: RiskZone,
  fallbackValue: number | null,
  fallbackTrainingDays: number | null,
): RiskZone {
  if (!protocol) {
    return fallbackRiskZone;
  }

  const display = getProtocolAcwrDisplay(
    protocol,
    fallbackValue,
    fallbackTrainingDays,
  );

  switch (display.level) {
    case "sweet-spot":
      return {
        level: "sweet-spot",
        color: "green",
        label: "Sweet Spot",
        description: "Optimal training load with the lowest injury risk.",
        recommendation: "Maintain current training load.",
      };
    case "under-training":
      return {
        level: "under-training",
        color: "orange",
        label: "Under Training",
        description: "Training load is below the recommended target.",
        recommendation: "Progress load gradually to build tolerance.",
      };
    case "elevated-risk":
      return {
        level: "elevated-risk",
        color: "yellow",
        label: "Elevated Risk",
        description: "Training load is above the ideal range.",
        recommendation: "Reduce volume or intensity and monitor closely.",
      };
    case "danger-zone":
      return {
        level: "danger-zone",
        color: "red",
        label: "Danger Zone",
        description: "Training load is in the highest injury-risk band.",
        recommendation: "Deload immediately and prioritise recovery.",
      };
    case "no-data":
      return {
        level: "no-data",
        color: "gray",
        label: display.baselineBuilding ? "Baseline Building" : "No Data",
        description: display.baselineBuilding
          ? "Not enough logged training sessions to complete the ACWR baseline yet."
          : "ACWR cannot be calculated until more training data is logged.",
        recommendation: display.baselineBuilding
          ? "Keep logging sessions to complete the 21-day baseline."
          : "Log training sessions consistently to unlock ACWR guidance.",
      };
  }
}
