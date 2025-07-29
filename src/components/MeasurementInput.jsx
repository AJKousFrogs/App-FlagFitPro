import React, { useState, useEffect } from 'react';
import { useMeasurement } from '../contexts/MeasurementContext';
import { 
  feetInchesToInches,
  inchesToFeetInches,
  cmToMetersCm,
  metersCmToCm
} from '../utils/measurementUtils';

const MeasurementInput = ({ 
  type = 'weight', // 'weight' or 'height'
  value, 
  onChange, 
  label, 
  className = '',
  placeholder = ''
}) => {
  const { isImperial } = useMeasurement();
  const [displayValue, setDisplayValue] = useState('');
  const [feet, setFeet] = useState('');
  const [inches, setInches] = useState('');
  const [meters, setMeters] = useState('');
  const [centimeters, setCentimeters] = useState('');

  // Initialize display values when component mounts or system changes
  useEffect(() => {
    if (value && type === 'weight') {
      setDisplayValue(value.toString());
    } else if (value && type === 'height') {
      if (isImperial) {
        const { feet: f, inches: i } = inchesToFeetInches(value);
        setFeet(f.toString());
        setInches(i.toString());
      } else {
        const { meters: m, cm } = cmToMetersCm(value);
        setMeters(m.toString());
        setCentimeters(cm.toString());
      }
    }
  }, [value, type, isImperial]);

  const handleWeightChange = (e) => {
    const newValue = parseFloat(e.target.value) || 0;
    setDisplayValue(e.target.value);
    onChange(newValue);
  };

  const handleHeightChange = () => {
    let totalValue = 0;
    
    if (isImperial) {
      const feetValue = parseInt(feet) || 0;
      const inchesValue = parseInt(inches) || 0;
      totalValue = feetInchesToInches(feetValue, inchesValue);
    } else {
      const metersValue = parseInt(meters) || 0;
      const cmValue = parseInt(centimeters) || 0;
      totalValue = metersCmToCm(metersValue, cmValue);
    }
    
    onChange(totalValue);
  };

  const handleFeetChange = (e) => {
    setFeet(e.target.value);
    handleHeightChange();
  };

  const handleInchesChange = (e) => {
    setInches(e.target.value);
    handleHeightChange();
  };

  const handleMetersChange = (e) => {
    setMeters(e.target.value);
    handleHeightChange();
  };

  const handleCentimetersChange = (e) => {
    setCentimeters(e.target.value);
    handleHeightChange();
  };

  if (type === 'weight') {
    return (
      <div className={`measurement-input weight-input ${className}`}>
        <label>{label}</label>
        <div className="input-group">
          <input
            type="number"
            value={displayValue}
            onChange={handleWeightChange}
            placeholder={placeholder || `Enter weight in ${isImperial ? 'lbs' : 'kg'}`}
            min="0"
            step="0.1"
          />
          <span className="unit">{isImperial ? 'lbs' : 'kg'}</span>
        </div>
      </div>
    );
  }

  if (type === 'height') {
    return (
      <div className={`measurement-input height-input ${className}`}>
        <label>{label}</label>
        {isImperial ? (
          <div className="height-input-group">
            <div className="input-group">
              <input
                type="number"
                value={feet}
                onChange={handleFeetChange}
                placeholder="0"
                min="0"
                max="8"
              />
              <span className="unit">ft</span>
            </div>
            <div className="input-group">
              <input
                type="number"
                value={inches}
                onChange={handleInchesChange}
                placeholder="0"
                min="0"
                max="11"
              />
              <span className="unit">in</span>
            </div>
          </div>
        ) : (
          <div className="height-input-group">
            <div className="input-group">
              <input
                type="number"
                value={meters}
                onChange={handleMetersChange}
                placeholder="0"
                min="0"
                max="3"
              />
              <span className="unit">m</span>
            </div>
            <div className="input-group">
              <input
                type="number"
                value={centimeters}
                onChange={handleCentimetersChange}
                placeholder="0"
                min="0"
                max="99"
              />
              <span className="unit">cm</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default MeasurementInput; 