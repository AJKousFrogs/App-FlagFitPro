import { RiskMeaning } from "@core/semantics/semantic-meaning.types";

/**
 * Risk severity mapping utilities
 * Centralized to avoid drift across dashboards and cards.
 */
export const alertSeverityToRiskSeverityMap: Record<
  string,
  RiskMeaning["severity"]
> = {
  warning: "moderate",
  critical: "critical",
};

export const zoneLevelToRiskSeverityMap: Record<
  string,
  RiskMeaning["severity"]
> = {
  "elevated-risk": "high",
  "danger-zone": "critical",
};

export const riskLevelToMeaningSeverityMap: Record<
  string,
  RiskMeaning["severity"]
> = {
  low: "low",
  moderate: "moderate",
  high: "high",
  critical: "critical",
};

export function getRiskSeverityFromAlert(
  severity: string,
  fallback: RiskMeaning["severity"] = "moderate",
): RiskMeaning["severity"] {
  return alertSeverityToRiskSeverityMap[severity] || fallback;
}

export function getRiskSeverityFromZone(
  level: string,
  fallback: RiskMeaning["severity"] = "moderate",
): RiskMeaning["severity"] {
  return zoneLevelToRiskSeverityMap[level] || fallback;
}

export function getRiskSeverityFromLevel(
  level: string,
  fallback: RiskMeaning["severity"] = "moderate",
): RiskMeaning["severity"] {
  return riskLevelToMeaningSeverityMap[level] || fallback;
}
