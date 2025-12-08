import { Injectable } from "@angular/core";

/**
 * Validation Service
 * Provides comprehensive data validation with context-aware rules,
 * error reporting, and actionable suggestions.
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

@Injectable({
  providedIn: "root",
})
export class ValidationService {

  /**
   * Physical measurements validation with medical guidelines
   */
  validatePhysicalMeasurements(measurements: {
    weight?: number;
    height?: number;
    bodyFat?: number;
    muscleMass?: number;
  }): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Weight validation (kg)
    if (measurements.weight !== undefined) {
      if (measurements.weight < 40) {
        errors.push("Weight below viable minimum (40kg). Medical evaluation needed.");
      }
      if (measurements.weight > 200) {
        warnings.push("Unusual weight for flag football athlete. Verify measurement.");
      }
      if (measurements.weight < 50) {
        suggestions.push("Consider increased caloric intake for athletic performance.");
      }
    }

    // Height validation (cm)
    if (measurements.height !== undefined) {
      if (measurements.height < 140) {
        warnings.push("Height below typical adult range. Verify measurement.");
      }
      if (measurements.height > 220) {
        warnings.push("Unusual height for flag football. Verify measurement.");
      }
    }

    // Body fat validation (%)
    if (measurements.bodyFat !== undefined) {
      if (measurements.bodyFat < 3) {
        errors.push("Body fat below minimum viable level (3%). Medical evaluation needed.");
      }
      if (measurements.bodyFat > 50) {
        warnings.push("Body fat above typical range. Health assessment recommended.");
      }
      if (measurements.bodyFat > 25) {
        suggestions.push("Target body fat reduction through cardio and nutrition.");
      }
    }

    // Muscle mass validation (kg)
    if (measurements.muscleMass !== undefined) {
      if (measurements.muscleMass < 0) {
        errors.push("Muscle mass cannot be negative.");
      }
      if (measurements.weight && measurements.muscleMass > measurements.weight * 0.8) {
        errors.push("Muscle mass exceeds possible maximum (cannot exceed 80% of body weight).");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Wellness data validation with context-aware rules
   */
  validateWellnessData(wellness: {
    sleep?: number;
    energy?: number;
    stress?: number;
    soreness?: number;
    motivation?: number;
    mood?: number;
    hydration?: number;
  }): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    const validateScale = (value: number, name: string): boolean => {
      if (value < 0 || value > 10) {
        errors.push(`${name} must be between 0-10. Received: ${value}`);
        return false;
      }
      return true;
    };

    // Validate each metric
    if (wellness.sleep !== undefined) {
      validateScale(wellness.sleep, "Sleep");
      if (wellness.sleep < 6) {
        suggestions.push("Inadequate sleep. Target 7-9 hours for recovery.");
      }
    }

    if (wellness.energy !== undefined) {
      validateScale(wellness.energy, "Energy");
      if (wellness.energy < 5) {
        suggestions.push("Low energy. Consider recovery day or nutrition adjustment.");
      }
    }

    if (wellness.stress !== undefined) {
      validateScale(wellness.stress, "Stress");
      if (wellness.stress > 7) {
        suggestions.push("High stress levels. Incorporate breathing exercises.");
      }
    }

    if (wellness.soreness !== undefined) {
      validateScale(wellness.soreness, "Soreness");
      if (wellness.soreness > 6) {
        suggestions.push("High soreness. Reduce intensity or add mobility work.");
      }
    }

    if (wellness.motivation !== undefined) {
      validateScale(wellness.motivation, "Motivation");
      if (wellness.motivation < 4) {
        warnings.push("Low motivation detected. Consider mental health check-in.");
      }
    }

    if (wellness.mood !== undefined) {
      validateScale(wellness.mood, "Mood");
    }

    if (wellness.hydration !== undefined) {
      validateScale(wellness.hydration, "Hydration");
      if (wellness.hydration < 5) {
        suggestions.push("Increase water intake - minimum 3 liters daily.");
      }
    }

    // Cross-metric validation
    if (wellness.sleep && wellness.stress && wellness.energy) {
      if (wellness.sleep < 6 && wellness.stress > 7) {
        warnings.push("Poor sleep combined with high stress. Priority: sleep improvement.");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Game play data validation with sport-specific rules
   */
  validateGamePlay(play: {
    playType: "pass" | "run" | "flag_pull";
    outcome?: string;
    quarterbackId?: string;
    receiverId?: string;
    ballCarrierId?: string;
    defenderId?: string;
    yardsGained?: number;
    routeType?: string;
    dropSeverity?: string;
    dropReason?: string;
    missReason?: string;
  }): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Yards validation
    if (play.yardsGained !== undefined) {
      if (!Number.isInteger(play.yardsGained)) {
        errors.push("Yards gained must be an integer");
      }
      if (play.yardsGained < -10) {
        warnings.push("Loss of more than 10 yards. Verify accuracy.");
      }
      if (play.yardsGained > 100) {
        errors.push("Yards gained exceeds field length. Invalid entry.");
      }
    }

    // Play type specific validation
    switch (play.playType) {
      case "pass":
        if (!play.quarterbackId) {
          errors.push("Pass play requires QB identification");
        }
        if (!play.receiverId && play.outcome === "completion") {
          errors.push("Completed pass requires receiver identification");
        }
        if (!play.routeType) {
          warnings.push("Route type not specified for pass play");
        }
        if (play.outcome === "drop" && !play.dropReason) {
          warnings.push("Drop recorded but reason not provided");
        }
        break;

      case "run":
        if (!play.ballCarrierId) {
          errors.push("Run play requires ball carrier identification");
        }
        if (play.yardsGained === undefined) {
          warnings.push("Yards gained not recorded for run play");
        }
        break;

      case "flag_pull":
        if (!play.defenderId) {
          errors.push("Flag pull requires defender identification");
        }
        if (!play.ballCarrierId) {
          errors.push("Flag pull requires ball carrier identification");
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Validate integer range
   */
  validateIntegerRange(value: number, min: number, max: number, fieldName: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    if (!Number.isInteger(value)) {
      errors.push(`${fieldName} must be an integer`);
    } else {
      if (value < min) {
        errors.push(`${fieldName} must be at least ${min}`);
      }
      if (value > max) {
        errors.push(`${fieldName} must be at most ${max}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Validate percentage (0-100)
   */
  validatePercentage(value: number, fieldName: string): ValidationResult {
    return this.validateIntegerRange(value, 0, 100, fieldName);
  }
}

