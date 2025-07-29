// Measurement conversion utilities
export const MEASUREMENT_SYSTEMS = {
  IMPERIAL: 'imperial',
  METRIC: 'metric'
};

// Weight conversions
export const convertWeight = (value, fromSystem, toSystem) => {
  if (fromSystem === toSystem) return value;
  
  if (fromSystem === MEASUREMENT_SYSTEMS.IMPERIAL && toSystem === MEASUREMENT_SYSTEMS.METRIC) {
    // Pounds to kilograms
    return Math.round((value * 0.453592) * 100) / 100;
  } else if (fromSystem === MEASUREMENT_SYSTEMS.METRIC && toSystem === MEASUREMENT_SYSTEMS.IMPERIAL) {
    // Kilograms to pounds
    return Math.round((value * 2.20462) * 100) / 100;
  }
  return value;
};

// Height conversions
export const convertHeight = (value, fromSystem, toSystem) => {
  if (fromSystem === toSystem) return value;
  
  if (fromSystem === MEASUREMENT_SYSTEMS.IMPERIAL && toSystem === MEASUREMENT_SYSTEMS.METRIC) {
    // Inches to centimeters
    return Math.round((value * 2.54) * 100) / 100;
  } else if (fromSystem === MEASUREMENT_SYSTEMS.METRIC && toSystem === MEASUREMENT_SYSTEMS.IMPERIAL) {
    // Centimeters to inches
    return Math.round((value * 0.393701) * 100) / 100;
  }
  return value;
};

// Format weight for display
export const formatWeight = (value, system) => {
  if (system === MEASUREMENT_SYSTEMS.IMPERIAL) {
    return `${value} lbs`;
  } else {
    return `${value} kg`;
  }
};

// Format height for display
export const formatHeight = (value, system) => {
  if (system === MEASUREMENT_SYSTEMS.IMPERIAL) {
    return `${value}"`;
  } else {
    return `${value} cm`;
  }
};

// Get measurement labels
export const getMeasurementLabels = (system) => {
  if (system === MEASUREMENT_SYSTEMS.IMPERIAL) {
    return {
      weight: 'lbs',
      height: 'inches',
      distance: 'yards',
      speed: 'mph'
    };
  } else {
    return {
      weight: 'kg',
      height: 'cm',
      distance: 'meters',
      speed: 'km/h'
    };
  }
};

// Convert feet and inches to total inches
export const feetInchesToInches = (feet, inches) => {
  return (feet * 12) + inches;
};

// Convert inches to feet and inches
export const inchesToFeetInches = (totalInches) => {
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return { feet, inches };
};

// Convert centimeters to meters and centimeters
export const cmToMetersCm = (totalCm) => {
  const meters = Math.floor(totalCm / 100);
  const cm = totalCm % 100;
  return { meters, cm };
};

// Convert meters and centimeters to total centimeters
export const metersCmToCm = (meters, cm) => {
  return (meters * 100) + cm;
}; 