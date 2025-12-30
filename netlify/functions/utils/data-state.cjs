/**
 * Data State Utilities
 * 
 * Implements the "Data State" contract from PLAYER_DATA_SAFETY_GUIDE.md:
 * - Never show mock data as real data
 * - Don't compute metrics without enough data
 * - Clear API responses about data state
 * 
 * Športno društvo Žabe - Athletes helping athletes since 2020
 */

// ============================================================================
// DATA STATE ENUM
// ============================================================================

const DataState = {
  NO_DATA: 'NO_DATA',
  INSUFFICIENT_DATA: 'INSUFFICIENT_DATA',
  DEMO_DATA: 'DEMO_DATA',
  REAL_DATA: 'REAL_DATA',
};

// ============================================================================
// MINIMUM DATA REQUIREMENTS
// ============================================================================

const MINIMUM_DATA_REQUIREMENTS = {
  // ACWR requires 28 days of data for chronic load calculation
  acwr: {
    minimumDays: 28,
    description: '28 days of training data required for reliable ACWR calculation',
    source: 'Gabbett, T.J. (2016) - The training-injury prevention paradox',
  },
  
  // Acute load requires 7 days
  acuteLoad: {
    minimumDays: 7,
    description: '7 days of training data required for acute load',
    source: 'Standard rolling average calculation',
  },
  
  // Chronic load requires 28 days
  chronicLoad: {
    minimumDays: 28,
    description: '28 days of training data required for chronic load',
    source: 'Gabbett, T.J. (2016)',
  },
  
  // Training monotony requires 7 days
  trainingMonotony: {
    minimumDays: 7,
    description: '7 days of data required for monotony calculation',
    source: 'Foster, C. (1998)',
  },
  
  // TSB requires 42 days (ATL + CTL)
  tsb: {
    minimumDays: 42,
    description: '42 days of data for Training Stress Balance',
    source: 'Bannister model',
  },
  
  // Injury risk requires 28 days
  injuryRisk: {
    minimumDays: 28,
    description: '28 days of load data for injury risk assessment',
    source: 'ACWR-based injury prediction models',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Evaluate the data state based on available data points
 */
function evaluateDataState(currentDataPoints, metricType, isDemo = false) {
  if (isDemo) {
    return DataState.DEMO_DATA;
  }

  if (currentDataPoints === 0) {
    return DataState.NO_DATA;
  }

  const requirement = MINIMUM_DATA_REQUIREMENTS[metricType];
  if (!requirement) {
    // Unknown metric type, assume 7 days minimum
    return currentDataPoints >= 7 ? DataState.REAL_DATA : DataState.INSUFFICIENT_DATA;
  }

  if (currentDataPoints < requirement.minimumDays) {
    return DataState.INSUFFICIENT_DATA;
  }

  return DataState.REAL_DATA;
}

/**
 * Create a data response with state information
 */
function createDataResponse(value, currentDataPoints, metricType, options = {}) {
  const { isDemo = false, lastUpdated = null, metadata = {} } = options;
  const requirement = MINIMUM_DATA_REQUIREMENTS[metricType] || { minimumDays: 7, description: 'Minimum data required' };
  const dataState = evaluateDataState(currentDataPoints, metricType, isDemo);
  
  const warnings = [];
  
  // Generate appropriate warnings
  switch (dataState) {
    case DataState.NO_DATA:
      warnings.push('No data available yet. Start logging your training to see metrics.');
      break;
    case DataState.INSUFFICIENT_DATA:
      const daysNeeded = requirement.minimumDays - currentDataPoints;
      warnings.push(
        `${requirement.description}. You have ${currentDataPoints} days, need ${daysNeeded} more.`
      );
      break;
    case DataState.DEMO_DATA:
      warnings.push('This is demonstration data, not your actual metrics.');
      break;
  }

  // If data is insufficient, don't return the value
  const safeValue = dataState === DataState.REAL_DATA ? value : null;

  return {
    value: safeValue,
    dataState,
    currentDataPoints,
    minimumRequiredDataPoints: requirement.minimumDays,
    warnings,
    lastUpdated,
    metadata: {
      source: requirement.source || 'Unknown',
      ...metadata,
    },
  };
}

/**
 * Wrap an existing response with data state information
 * This is useful for adding data state to existing API responses
 */
function wrapWithDataState(response, dataStateInfo) {
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

/**
 * Check if data is safe to display as real
 */
function isDataSafe(dataState) {
  return dataState === DataState.REAL_DATA;
}

/**
 * Check if data can be used for calculations
 */
function canCalculate(currentDataPoints, metricType) {
  const requirement = MINIMUM_DATA_REQUIREMENTS[metricType];
  if (!requirement) return currentDataPoints >= 7;
  return currentDataPoints >= requirement.minimumDays;
}

/**
 * Get data state from risk zone string (for backwards compatibility)
 */
function getDataStateFromRiskZone(riskZone) {
  if (riskZone === 'insufficient_data') {
    return DataState.INSUFFICIENT_DATA;
  }
  if (riskZone === 'unknown' || riskZone === 'no_data') {
    return DataState.NO_DATA;
  }
  return DataState.REAL_DATA;
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  DataState,
  MINIMUM_DATA_REQUIREMENTS,
  evaluateDataState,
  createDataResponse,
  wrapWithDataState,
  isDataSafe,
  canCalculate,
  getDataStateFromRiskZone,
};




