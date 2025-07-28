import React, { createContext, useContext, useState, useEffect } from 'react';
import { MEASUREMENT_SYSTEMS } from '../utils/measurementUtils';

const MeasurementContext = createContext();

export const useMeasurement = () => {
  const context = useContext(MeasurementContext);
  if (!context) {
    throw new Error('useMeasurement must be used within a MeasurementProvider');
  }
  return context;
};

export const MeasurementProvider = ({ children }) => {
  const [system, setSystem] = useState(MEASUREMENT_SYSTEMS.IMPERIAL);

  // Load user preference from localStorage on mount
  useEffect(() => {
    const savedSystem = localStorage.getItem('measurementSystem');
    if (savedSystem && Object.values(MEASUREMENT_SYSTEMS).includes(savedSystem)) {
      setSystem(savedSystem);
    }
  }, []);

  // Save user preference to localStorage when it changes
  const updateSystem = (newSystem) => {
    setSystem(newSystem);
    localStorage.setItem('measurementSystem', newSystem);
  };

  const toggleSystem = () => {
    const newSystem = system === MEASUREMENT_SYSTEMS.IMPERIAL 
      ? MEASUREMENT_SYSTEMS.METRIC 
      : MEASUREMENT_SYSTEMS.IMPERIAL;
    updateSystem(newSystem);
  };

  const value = {
    system,
    updateSystem,
    toggleSystem,
    isImperial: system === MEASUREMENT_SYSTEMS.IMPERIAL,
    isMetric: system === MEASUREMENT_SYSTEMS.METRIC
  };

  return (
    <MeasurementContext.Provider value={value}>
      {children}
    </MeasurementContext.Provider>
  );
}; 