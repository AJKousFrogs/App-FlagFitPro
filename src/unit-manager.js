/* ====================================================================
   UNIT MANAGEMENT SYSTEM
   Handles conversions between metric and imperial units
   ==================================================================== */

export class UnitManager {
  constructor() {
    this.units = this.loadUnits();
    this.setupEventListeners();
  }

  loadUnits() {
    const saved = localStorage.getItem("flagfit_units");
    return saved
      ? JSON.parse(saved)
      : {
          distance: "imperial", // 'metric' or 'imperial'
          weight: "imperial", // 'metric' or 'imperial'
          height: "imperial", // 'metric' or 'imperial'
          time: "minutes", // 'minutes' or 'seconds'
          temperature: "fahrenheit", // 'fahrenheit' or 'celsius'
        };
  }

  saveUnits() {
    localStorage.setItem("flagfit_units", JSON.stringify(this.units));
    this.updateAllDisplays();
  }

  setDistanceUnit(unit) {
    this.units.distance = unit;
    this.saveUnits();
  }

  setWeightUnit(unit) {
    this.units.weight = unit;
    this.saveUnits();
  }

  setHeightUnit(unit) {
    this.units.height = unit;
    this.saveUnits();
  }

  setTimeUnit(unit) {
    this.units.time = unit;
    this.saveUnits();
  }

  getTimeUnit() {
    return this.units.time || "minutes";
  }

  formatTime(value, preferredUnit = null) {
    const unit = preferredUnit || this.units.time || "minutes";
    
    if (unit === "seconds") {
      return `${Math.round(value)}s`;
    } else {
      const minutes = Math.floor(value / 60);
      const seconds = Math.round(value % 60);
      if (seconds === 0) {
        return `${minutes} min`;
      }
      return `${minutes}m ${seconds}s`;
    }
  }

  formatDistance(value, preferredUnit = null) {
    const unit = preferredUnit || this.units.distance;
    
    if (unit === "metric") {
      if (value >= 1000) {
        return `${(value / 1000).toFixed(2)}km`;
      } else if (value >= 1) {
        return `${value.toFixed(1)}m`;
      } else {
        return `${Math.round(value * 100)}cm`;
      }
    } else {
      // Imperial: prefer yards for longer distances, feet/inches for shorter
      const yards = value * 1.09361; // meters to yards
      if (yards >= 1760) {
        return `${(yards / 1760).toFixed(2)} miles`;
      } else if (yards >= 1) {
        return `${Math.round(yards)} yds`;
      } else {
        const feet = value * 3.28084;
        const inches = Math.round((feet % 1) * 12);
        const wholeFeet = Math.floor(feet);
        if (inches === 0) {
          return `${wholeFeet}'`;
        }
        return `${wholeFeet}'${inches}"`;
      }
    }
  }

  // Distance conversions (yards, feet, inches, meters, cm, miles)
  convertDistance(value, fromUnit, toUnit) {
    if (fromUnit === toUnit) {return value;}

    // Convert to meters first
    let meters;
    switch (fromUnit) {
      case "yards":
      case "yds":
        meters = value * 0.9144;
        break;
      case "feet":
      case "ft":
        meters = value * 0.3048;
        break;
      case "inches":
      case "in":
        meters = value * 0.0254;
        break;
      case "miles":
      case "mi":
        meters = value * 1609.34;
        break;
      case "cm":
        meters = value * 0.01;
        break;
      case "meters":
      case "m":
        meters = value;
        break;
      default:
        meters = value;
    }

    // Convert from meters to target unit
    switch (toUnit) {
      case "yards":
      case "yds":
        return meters / 0.9144;
      case "feet":
      case "ft":
        return meters / 0.3048;
      case "inches":
      case "in":
        return meters / 0.0254;
      case "miles":
      case "mi":
        return meters / 1609.34;
      case "cm":
        return meters / 0.01;
      case "meters":
      case "m":
        return meters;
      default:
        return meters;
    }
  }

  // Time/Duration conversions
  convertTime(value, fromUnit, toUnit) {
    if (fromUnit === toUnit) {return value;}

    if (fromUnit === "seconds" && toUnit === "minutes") {
      return value / 60;
    } else if (fromUnit === "minutes" && toUnit === "seconds") {
      return value * 60;
    }
    return value;
  }

  // Temperature conversions (Fahrenheit ↔ Celsius)
  convertTemperature(value, fromUnit, toUnit) {
    if (fromUnit === toUnit) {return value;}

    if (fromUnit === "fahrenheit" && toUnit === "celsius") {
      return (value - 32) * 5 / 9;
    } else if (fromUnit === "celsius" && toUnit === "fahrenheit") {
      return (value * 9 / 5) + 32;
    }
    return value;
  }

  // Weight conversions
  convertWeight(value, fromUnit, toUnit) {
    if (fromUnit === toUnit) {return value;}

    if (fromUnit === "lbs" && toUnit === "kg") {
      return value * 0.453592;
    } else if (fromUnit === "kg" && toUnit === "lbs") {
      return value / 0.453592;
    }
    return value;
  }

  // Time/Duration conversions
  convertTime(value, fromUnit, toUnit) {
    if (fromUnit === toUnit) {return value;}

    if (fromUnit === "seconds" && toUnit === "minutes") {
      return value / 60;
    } else if (fromUnit === "minutes" && toUnit === "seconds") {
      return value * 60;
    }
    return value;
  }

  // Distance conversions (enhanced for miles/yards/meters)
  convertDistance(value, fromUnit, toUnit) {
    if (fromUnit === toUnit) {return value;}

    // Convert to meters first
    let meters;
    switch (fromUnit) {
      case "yards":
        meters = value * 0.9144;
        break;
      case "feet":
        meters = value * 0.3048;
        break;
      case "inches":
        meters = value * 0.0254;
        break;
      case "miles":
        meters = value * 1609.34;
        break;
      case "cm":
        meters = value * 0.01;
        break;
      case "meters":
      case "m":
        meters = value;
        break;
      default:
        meters = value;
    }

    // Convert from meters to target unit
    switch (toUnit) {
      case "yards":
        return meters / 0.9144;
      case "feet":
        return meters / 0.3048;
      case "inches":
        return meters / 0.0254;
      case "miles":
        return meters / 1609.34;
      case "cm":
        return meters / 0.01;
      case "meters":
      case "m":
        return meters;
      default:
        return meters;
    }
  }

  // Height conversions (for jump measurements)
  convertHeight(value, fromUnit, toUnit) {
    return this.convertDistance(value, fromUnit, toUnit);
  }

  // Format display values with units
  formatDistance(value, preferredUnit = null) {
    const unit = preferredUnit || this.units.distance;

    if (unit === "metric") {
      if (value >= 100) {
        return `${(value / 100).toFixed(1)}m`;
      } else {
        return `${Math.round(value)}cm`;
      }
    } else {
      if (value >= 36) {
        const feet = Math.floor(value / 12);
        const inches = Math.round(value % 12);
        return inches > 0 ? `${feet}'${inches}"` : `${feet}'`;
      } else {
        return `${Math.round(value)}"`;
      }
    }
  }

  formatWeight(value, preferredUnit = null) {
    const unit = preferredUnit || this.units.weight;

    if (unit === "metric") {
      return `${value.toFixed(1)}kg`;
    } else {
      return `${Math.round(value)}lbs`;
    }
  }

  formatHeight(value, preferredUnit = null) {
    return this.formatDistance(value, preferredUnit);
  }

  // Get current unit labels
  getDistanceUnit() {
    return this.units.distance === "metric" ? "cm" : "in";
  }

  getWeightUnit() {
    return this.units.weight === "metric" ? "kg" : "lbs";
  }

  getHeightUnit() {
    return this.units.height === "metric" ? "cm" : "in";
  }

  // Convert for display based on current settings
  displayDistance(valueInInches) {
    if (this.units.distance === "metric") {
      return this.convertDistance(valueInInches, "inches", "cm");
    }
    return valueInInches;
  }

  displayWeight(valueInLbs) {
    if (this.units.weight === "metric") {
      return this.convertWeight(valueInLbs, "lbs", "kg");
    }
    return valueInLbs;
  }

  displayHeight(valueInInches) {
    if (this.units.height === "metric") {
      return this.convertDistance(valueInInches, "inches", "cm");
    }
    return valueInInches;
  }

  // Convert for storage (always store in imperial internally)
  storeDistance(displayValue) {
    if (this.units.distance === "metric") {
      return this.convertDistance(displayValue, "cm", "inches");
    }
    return displayValue;
  }

  storeWeight(displayValue) {
    if (this.units.weight === "metric") {
      return this.convertWeight(displayValue, "kg", "lbs");
    }
    return displayValue;
  }

  storeHeight(displayValue) {
    if (this.units.height === "metric") {
      return this.convertDistance(displayValue, "cm", "inches");
    }
    return displayValue;
  }

  // Update all displays when units change
  updateAllDisplays() {
    // Dispatch custom event for components to listen to
    window.dispatchEvent(
      new CustomEvent("unitsChanged", {
        detail: this.units,
      }),
    );

    // Update any visible unit labels
    this.updateUnitLabels();
  }

  updateUnitLabels() {
    // Update distance unit labels
    document.querySelectorAll(".unit-distance").forEach((el) => {
      el.textContent = this.getDistanceUnit();
    });

    // Update weight unit labels
    document.querySelectorAll(".unit-weight").forEach((el) => {
      el.textContent = this.getWeightUnit();
    });

    // Update height unit labels
    document.querySelectorAll(".unit-height").forEach((el) => {
      el.textContent = this.getHeightUnit();
    });
  }

  // Create unit toggle buttons
  createUnitToggles() {
    return `
            <div class="unit-toggles" style="
                display: flex; gap: var(--space-4); align-items: center;
                padding: var(--space-4); background: var(--bg-gray);
                border-radius: var(--radius-lg); margin-bottom: var(--space-6);
            ">
                <div style="display: flex; align-items: center; gap: var(--space-2);">
                    <span style="font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--color-text-secondary);">
                        Distance:
                    </span>
                    <div class="btn-group">
                        <button onclick="unitManager.setDistanceUnit('imperial')"
                                class="btn btn-sm ${this.units.distance === "imperial" ? "btn-primary" : "btn-secondary"}">
                            Inches
                        </button>
                        <button onclick="unitManager.setDistanceUnit('metric')"
                                class="btn btn-sm ${this.units.distance === "metric" ? "btn-primary" : "btn-secondary"}">
                            CM
                        </button>
                    </div>
                </div>

                <div style="display: flex; align-items: center; gap: var(--space-2);">
                    <span style="font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--color-text-secondary);">
                        Weight:
                    </span>
                    <div class="btn-group">
                        <button onclick="unitManager.setWeightUnit('imperial')"
                                class="btn btn-sm ${this.units.weight === "imperial" ? "btn-primary" : "btn-secondary"}">
                            LBS
                        </button>
                        <button onclick="unitManager.setWeightUnit('metric')"
                                class="btn btn-sm ${this.units.weight === "metric" ? "btn-primary" : "btn-secondary"}">
                            KG
                        </button>
                    </div>
                </div>
            </div>
        `;
  }

  // Performance test ranges based on units
  getPerformanceRanges() {
    return {
      fortyYardDash: {
        min: 3.5,
        max: 8.0,
        unit: "sec",
        elite: "< 4.40s",
        good: "4.40-4.65s",
        average: "4.65-4.80s",
      },
      verticalJump: {
        min: this.units.distance === "metric" ? 38 : 15,
        max: this.units.distance === "metric" ? 127 : 50,
        unit: this.getDistanceUnit(),
        elite: this.units.distance === "metric" ? "> 89cm" : "> 35in",
        good: this.units.distance === "metric" ? "64-89cm" : "25-35in",
        average: this.units.distance === "metric" ? "51-64cm" : "20-25in",
      },
      boxJump: {
        min: this.units.distance === "metric" ? 51 : 20,
        max: this.units.distance === "metric" ? 152 : 60,
        unit: this.getDistanceUnit(),
        elite: this.units.distance === "metric" ? "> 102cm" : "> 40in",
        good: this.units.distance === "metric" ? "76-102cm" : "30-40in",
        average: this.units.distance === "metric" ? "61-76cm" : "24-30in",
      },
    };
  }

  setupEventListeners() {
    // Listen for unit changes and update displays
    window.addEventListener("unitsChanged", () => {
      this.updateUnitLabels();
    });
  }
}

// Create global instance
export const unitManager = new UnitManager();

// Make available globally
window.unitManager = unitManager;
