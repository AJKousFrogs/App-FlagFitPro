import React from 'react';
import { useMeasurement } from '../contexts/MeasurementContext';

const MeasurementToggle = ({ className = '' }) => {
  const { toggleSystem, isImperial, isMetric } = useMeasurement();

  return (
    <div className={`measurement-toggle ${className}`}>
      <label>Measurement System:</label>
      <div className="toggle-buttons">
        <button 
          className={isImperial ? 'active' : ''}
          onClick={() => !isImperial && toggleSystem()}
        >
          Imperial (lbs, inches)
        </button>
        <button 
          className={isMetric ? 'active' : ''}
          onClick={() => !isMetric && toggleSystem()}
        >
          Metric (kg, cm)
        </button>
      </div>
    </div>
  );
};

export default MeasurementToggle; 