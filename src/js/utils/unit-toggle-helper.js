/**
 * Unit Toggle Helper
 * Reusable utility for creating unit toggle buttons and handling conversions
 */

import { unitManager } from '../../unit-manager.js';
import { logger } from '../../logger.js';

/**
 * Create unit toggle buttons HTML
 * @param {string} type - 'weight', 'distance', 'time'
 * @param {string} inputId - ID of the input field
 * @param {string} unitLabelId - ID of the unit label element
 * @param {string} hiddenInputId - ID of hidden input for unit value
 * @param {string} defaultValue - Default unit value
 * @returns {string} HTML string for toggle buttons
 */
export function createUnitToggleHTML(type, inputId, unitLabelId, hiddenInputId, defaultValue = null) {
  const configs = {
    weight: {
      imperial: { label: 'Pounds (lbs)', unit: 'lbs', storageKey: 'flagfit_weight_unit' },
      metric: { label: 'Kilograms (kg)', unit: 'kg', storageKey: 'flagfit_weight_unit' },
      default: defaultValue || localStorage.getItem('flagfit_weight_unit') || 'imperial'
    },
    distance: {
      imperial: { label: 'Yards', unit: 'yds', storageKey: 'flagfit_distance_unit' },
      metric: { label: 'Meters', unit: 'm', storageKey: 'flagfit_distance_unit' },
      default: defaultValue || localStorage.getItem('flagfit_distance_unit') || 'imperial'
    },
    time: {
      minutes: { label: 'Minutes', unit: 'min', storageKey: 'flagfit_time_unit' },
      seconds: { label: 'Seconds', unit: 's', storageKey: 'flagfit_time_unit' },
      default: defaultValue || localStorage.getItem('flagfit_time_unit') || 'minutes'
    }
  };

  const config = configs[type];
  if (!config) {
    logger.warn(`Unknown unit type: ${type}`);
    return '';
  }

  const isImperial = config.default === 'imperial' || config.default === 'minutes';
  const imperialConfig = type === 'time' ? config.minutes : config.imperial;
  const metricConfig = type === 'time' ? config.seconds : config.metric;
  const imperialKey = type === 'time' ? 'minutes' : 'imperial';
  const metricKey = type === 'time' ? 'seconds' : 'metric';

  return `
    <div class="unit-toggle-group" style="display: flex; gap: 0.5rem; margin-bottom: 0.75rem;">
      <button 
        type="button" 
        class="unit-toggle-btn ${isImperial ? 'unit-toggle-active' : ''}" 
        data-unit="${imperialKey}"
        id="${inputId}-unit-${imperialKey}"
        style="flex: 1; padding: 0.5rem 1rem; border: 2px solid ${isImperial ? 'var(--color-brand-primary, #10c96b)' : 'var(--color-border-secondary, #e5e7eb)'}; background: ${isImperial ? 'var(--color-brand-primary, #10c96b)' : 'white'}; color: ${isImperial ? 'white' : 'var(--color-text-secondary, #6b7280)'}; border-radius: 0.5rem; cursor: pointer; font-weight: 600; font-size: 0.875rem; transition: all 0.2s;">
        ${imperialConfig.label}
      </button>
      <button 
        type="button" 
        class="unit-toggle-btn ${!isImperial ? 'unit-toggle-active' : ''}" 
        data-unit="${metricKey}"
        id="${inputId}-unit-${metricKey}"
        style="flex: 1; padding: 0.5rem 1rem; border: 2px solid ${!isImperial ? 'var(--color-brand-primary, #10c96b)' : 'var(--color-border-secondary, #e5e7eb)'}; background: ${!isImperial ? 'var(--color-brand-primary, #10c96b)' : 'white'}; color: ${!isImperial ? 'white' : 'var(--color-text-secondary, #6b7280)'}; border-radius: 0.5rem; cursor: pointer; font-weight: 600; font-size: 0.875rem; transition: all 0.2s;">
        ${metricConfig.label}
      </button>
    </div>
  `;
}

/**
 * Setup unit toggle functionality
 * @param {string} type - 'weight', 'distance', 'time'
 * @param {string} inputId - ID of the input field
 * @param {string} unitLabelId - ID of the unit label element
 * @param {string} hiddenInputId - ID of hidden input for unit value
 */
export function setupUnitToggle(type, inputId, unitLabelId, hiddenInputId) {
  const input = document.getElementById(inputId);
  const unitLabel = document.getElementById(unitLabelId);
  const unitInput = document.getElementById(hiddenInputId);
  
  if (!input || !unitLabel) {
    logger.warn(`Unit toggle setup failed: missing elements for ${inputId}`);
    return;
  }

  const configs = {
    weight: {
      imperial: { unit: 'lbs', storageKey: 'flagfit_weight_unit', convert: (val) => val * 2.20462, reverse: (val) => val / 2.20462 },
      metric: { unit: 'kg', storageKey: 'flagfit_weight_unit', convert: (val) => val / 2.20462, reverse: (val) => val * 2.20462 }
    },
    distance: {
      imperial: { unit: 'yds', storageKey: 'flagfit_distance_unit', convert: (val) => val * 1.09361, reverse: (val) => val / 1.09361 },
      metric: { unit: 'm', storageKey: 'flagfit_distance_unit', convert: (val) => val / 1.09361, reverse: (val) => val * 1.09361 }
    },
    time: {
      minutes: { unit: 'min', storageKey: 'flagfit_time_unit', convert: (val) => val / 60, reverse: (val) => val * 60 },
      seconds: { unit: 's', storageKey: 'flagfit_time_unit', convert: (val) => val * 60, reverse: (val) => val / 60 }
    }
  };

  const config = configs[type];
  if (!config) {
    logger.warn(`Unknown unit type: ${type}`);
    return;
  }

  // Get saved preference or default
  const savedUnit = localStorage.getItem(config.imperial.storageKey) || 
                    (type === 'time' ? 'minutes' : 'imperial');
  let currentUnit = savedUnit;

  // Get button IDs
  const imperialKey = type === 'time' ? 'minutes' : 'imperial';
  const metricKey = type === 'time' ? 'seconds' : 'metric';
  const imperialBtn = document.getElementById(`${inputId}-unit-${imperialKey}`);
  const metricBtn = document.getElementById(`${inputId}-unit-${metricKey}`);

  if (!imperialBtn || !metricBtn) {
    logger.warn(`Unit toggle buttons not found for ${inputId}`);
    return;
  }

  function updateUnit(unit) {
    currentUnit = unit;
    localStorage.setItem(config.imperial.storageKey, unit);
    
    const isImperial = unit === imperialKey;
    const activeConfig = isImperial ? config[imperialKey] : config[metricKey];
    const inactiveConfig = isImperial ? config[metricKey] : config[imperialKey];

    // Update button styles
    if (isImperial) {
      imperialBtn.classList.add('unit-toggle-active');
      imperialBtn.style.borderColor = 'var(--color-brand-primary, #10c96b)';
      imperialBtn.style.background = 'var(--color-brand-primary, #10c96b)';
      imperialBtn.style.color = 'white';
      metricBtn.classList.remove('unit-toggle-active');
      metricBtn.style.borderColor = 'var(--color-border-secondary, #e5e7eb)';
      metricBtn.style.background = 'white';
      metricBtn.style.color = 'var(--color-text-secondary, #6b7280)';
    } else {
      metricBtn.classList.add('unit-toggle-active');
      metricBtn.style.borderColor = 'var(--color-brand-primary, #10c96b)';
      metricBtn.style.background = 'var(--color-brand-primary, #10c96b)';
      metricBtn.style.color = 'white';
      imperialBtn.classList.remove('unit-toggle-active');
      imperialBtn.style.borderColor = 'var(--color-border-secondary, #e5e7eb)';
      imperialBtn.style.background = 'white';
      imperialBtn.style.color = 'var(--color-text-secondary, #6b7280)';
    }

    // Update unit label
    unitLabel.textContent = activeConfig.unit;
    
    // Update hidden input if exists
    if (unitInput) {
      unitInput.value = unit;
    }

    // Update placeholder
    const placeholderText = type === 'weight' 
      ? (unit === 'imperial' ? 'Enter weight in pounds' : 'Enter weight in kilograms')
      : type === 'distance'
      ? (unit === 'imperial' ? 'Enter distance in yards' : 'Enter distance in meters')
      : (unit === 'minutes' ? 'Enter duration in minutes' : 'Enter duration in seconds');
    input.placeholder = placeholderText;
  }

  // Add event listeners
  imperialBtn.addEventListener('click', () => {
    // Convert value if switching from metric
    if (currentUnit !== imperialKey && input.value) {
      const currentValue = parseFloat(input.value);
      if (!isNaN(currentValue)) {
        const convertedValue = config[metricKey].reverse(currentValue);
        input.value = convertedValue.toFixed(type === 'weight' ? 1 : type === 'distance' ? 1 : 0);
      }
    }
    updateUnit(imperialKey);
  });

  metricBtn.addEventListener('click', () => {
    // Convert value if switching from imperial
    if (currentUnit !== metricKey && input.value) {
      const currentValue = parseFloat(input.value);
      if (!isNaN(currentValue)) {
        const convertedValue = config[imperialKey].reverse(currentValue);
        input.value = convertedValue.toFixed(type === 'weight' ? 1 : type === 'distance' ? 1 : 0);
      }
    }
    updateUnit(metricKey);
  });

  // Initialize with saved preference
  updateUnit(currentUnit);
}

/**
 * Convert value based on unit type and current unit preference
 * @param {number} value - Value to convert
 * @param {string} type - 'weight', 'distance', 'time'
 * @param {string} fromUnit - Unit of input value
 * @param {string} toUnit - Target unit (optional, uses preference if not provided)
 * @returns {number} Converted value
 */
export function convertValue(value, type, fromUnit, toUnit = null) {
  if (!toUnit) {
    const storageKeys = {
      weight: 'flagfit_weight_unit',
      distance: 'flagfit_distance_unit',
      time: 'flagfit_time_unit'
    };
    toUnit = localStorage.getItem(storageKeys[type]) || 
             (type === 'time' ? 'minutes' : 'imperial');
  }

  if (fromUnit === toUnit) return value;

  switch (type) {
    case 'weight':
      return unitManager.convertWeight(value, fromUnit === 'imperial' ? 'lbs' : 'kg', toUnit === 'imperial' ? 'lbs' : 'kg');
    case 'distance':
      return unitManager.convertDistance(value, fromUnit === 'imperial' ? 'yards' : 'meters', toUnit === 'imperial' ? 'yards' : 'meters');
    case 'time':
      return unitManager.convertTime(value, fromUnit, toUnit);
    default:
      return value;
  }
}
