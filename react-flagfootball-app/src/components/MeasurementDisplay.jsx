import React from 'react';
import { useMeasurement } from '../contexts/MeasurementContext';
import { 
  convertWeight, 
  convertHeight,
  inchesToFeetInches,
  cmToMetersCm
} from '../utils/measurementUtils';

const MeasurementDisplay = ({ 
  type = 'weight', // 'weight' or 'height'
  value, 
  label, 
  className = '',
  showBoth = true 
}) => {
  const { isImperial } = useMeasurement();

  if (!value) return null;

  const getDisplayValue = () => {
    if (type === 'weight') {
      if (isImperial) {
        const imperialValue = value;
        const metricValue = convertWeight(value, 'imperial', 'metric');
        return {
          primary: formatWeight(imperialValue, 'imperial'),
          secondary: showBoth ? formatWeight(metricValue, 'metric') : null
        };
      } else {
        const metricValue = value;
        const imperialValue = convertWeight(value, 'metric', 'imperial');
        return {
          primary: formatWeight(metricValue, 'metric'),
          secondary: showBoth ? formatWeight(imperialValue, 'imperial') : null
        };
      }
    } else if (type === 'height') {
      if (isImperial) {
        const imperialValue = value;
        const metricValue = convertHeight(value, 'imperial', 'metric');
        const { feet, inches } = inchesToFeetInches(imperialValue);
        return {
          primary: `${feet}'${inches}"`,
          secondary: showBoth ? `${metricValue} cm` : null
        };
      } else {
        const metricValue = value;
        const imperialValue = convertHeight(value, 'metric', 'imperial');
        const { meters, cm } = cmToMetersCm(metricValue);
        return {
          primary: `${meters}m ${cm}cm`,
          secondary: showBoth ? `${imperialValue}"` : null
        };
      }
    }
    return { primary: value.toString(), secondary: null };
  };

  const display = getDisplayValue();

  return (
    <div className={`measurement-display ${className}`}>
      <div className="measurement-label">{label}</div>
      <div className="measurement-value">
        <span className="primary-value">{display.primary}</span>
        {display.secondary && (
          <span className="secondary-value">({display.secondary})</span>
        )}
      </div>
    </div>
  );
};

export default MeasurementDisplay; 