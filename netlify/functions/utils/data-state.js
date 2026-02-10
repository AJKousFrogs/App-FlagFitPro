/**
 * Data State Utilities
 *
 * Implements the "Data State" contract from PLAYER_DATA_SAFETY_GUIDE.md
 *
 * Športno društvo Žabe - Athletes helping athletes since 2020
 */

export const DataState = {
  NO_DATA: "NO_DATA",
  INSUFFICIENT_DATA: "INSUFFICIENT_DATA",
  DEMO_DATA: "DEMO_DATA",
  REAL_DATA: "REAL_DATA",
};

export const MINIMUM_DATA_REQUIREMENTS = {
  acwr: {
    minimumDays: 28,
    description:
      "28 days of training data required for reliable ACWR calculation",
    source: "Gabbett, T.J. (2016) - The training-injury prevention paradox",
  },
  acuteLoad: {
    minimumDays: 7,
    description: "7 days of training data required for acute load",
    source: "Standard rolling average calculation",
  },
  chronicLoad: {
    minimumDays: 28,
    description: "28 days of training data required for chronic load",
    source: "Gabbett, T.J. (2016)",
  },
  trainingMonotony: {
    minimumDays: 7,
    description: "7 days of data required for monotony calculation",
    source: "Foster, C. (1998)",
  },
  tsb: {
    minimumDays: 42,
    description: "42 days of data for Training Stress Balance",
    source: "Bannister model",
  },
  injuryRisk: {
    minimumDays: 28,
    description: "28 days of load data for injury risk assessment",
    source: "ACWR-based injury prediction models",
  },
};

export function evaluateDataState(currentDataPoints, metricType, isDemo = false) {
  if (isDemo) {
    return DataState.DEMO_DATA;
  }
  if (currentDataPoints === 0) {
    return DataState.NO_DATA;
  }

  const requirement = MINIMUM_DATA_REQUIREMENTS[metricType];
  if (!requirement) {
    return currentDataPoints >= 7
      ? DataState.REAL_DATA
      : DataState.INSUFFICIENT_DATA;
  }

  if (currentDataPoints < requirement.minimumDays) {
    return DataState.INSUFFICIENT_DATA;
  }

  return DataState.REAL_DATA;
}

export function createDataResponse(
  value,
  currentDataPoints,
  metricType,
  options = {},
) {
  const { lastUpdated = null, metadata = {} } = options;
  const requirement = MINIMUM_DATA_REQUIREMENTS[metricType] || {
    minimumDays: 7,
    description: "Minimum data required",
  };
  const dataState = evaluateDataState(currentDataPoints, metricType);

  const warnings = [];

  switch (dataState) {
    case DataState.NO_DATA:
      warnings.push(
        "No data available yet. Start logging your training to see metrics.",
      );
      break;
    case DataState.INSUFFICIENT_DATA: {
      const daysNeeded = requirement.minimumDays - currentDataPoints;
      warnings.push(
        `${requirement.description}. You have ${currentDataPoints} days, need ${daysNeeded} more.`,
      );
      break;
    }
  }

  const safeValue = dataState === DataState.REAL_DATA ? value : null;

  return {
    value: safeValue,
    dataState,
    currentDataPoints,
    minimumRequiredDataPoints: requirement.minimumDays,
    warnings,
    lastUpdated,
    metadata: {
      source: requirement.source || "Unknown",
      ...metadata,
    },
  };
}

export function wrapWithDataState(response, dataStateInfo) {
  return {
    ...response,
    dataState: dataStateInfo.dataState,
    dataStateInfo: {
      currentDataPoints: dataStateInfo.currentDataPoints,
      minimumRequiredDataPoints: dataStateInfo.minimumRequiredDataPoints,
      warnings: dataStateInfo.warnings,
      isReliable: dataStateInfo.dataState === DataState.REAL_DATA,
    },
  };
}

export function isDataSafe(dataState) {
  return dataState === DataState.REAL_DATA;
}

export function canCalculate(currentDataPoints, metricType) {
  const requirement = MINIMUM_DATA_REQUIREMENTS[metricType];
  if (!requirement) {
    return currentDataPoints >= 7;
  }
  return currentDataPoints >= requirement.minimumDays;
}

export function getDataStateFromRiskZone(riskZone) {
  if (riskZone === "insufficient_data") {
    return DataState.INSUFFICIENT_DATA;
  }
  if (riskZone === "unknown" || riskZone === "no_data") {
    return DataState.NO_DATA;
  }
  return DataState.REAL_DATA;
}
