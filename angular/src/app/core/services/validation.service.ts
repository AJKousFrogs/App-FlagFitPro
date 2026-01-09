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
        errors.push(
          "Weight below viable minimum (40kg). Medical evaluation needed.",
        );
      }
      if (measurements.weight > 200) {
        warnings.push(
          "Unusual weight for flag football athlete. Verify measurement.",
        );
      }
      if (measurements.weight < 50) {
        suggestions.push(
          "Consider increased caloric intake for athletic performance.",
        );
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
        errors.push(
          "Body fat below minimum viable level (3%). Medical evaluation needed.",
        );
      }
      if (measurements.bodyFat > 50) {
        warnings.push(
          "Body fat above typical range. Health assessment recommended.",
        );
      }
      if (measurements.bodyFat > 25) {
        suggestions.push(
          "Target body fat reduction through cardio and nutrition.",
        );
      }
    }

    // Muscle mass validation (kg)
    if (measurements.muscleMass !== undefined) {
      if (measurements.muscleMass < 0) {
        errors.push("Muscle mass cannot be negative.");
      }
      if (
        measurements.weight &&
        measurements.muscleMass > measurements.weight * 0.8
      ) {
        errors.push(
          "Muscle mass exceeds possible maximum (cannot exceed 80% of body weight).",
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions,
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
        suggestions.push(
          "Low energy. Consider recovery day or nutrition adjustment.",
        );
      }
    }

    if (wellness.stress !== undefined) {
      validateScale(wellness.stress, "Stress");
      if (wellness.stress > 7) {
        suggestions.push(
          "High stress levels. Incorporate breathing exercises.",
        );
      }
    }

    if (wellness.soreness !== undefined) {
      validateScale(wellness.soreness, "Soreness");
      if (wellness.soreness > 6) {
        suggestions.push(
          "High soreness. Reduce intensity or add mobility work.",
        );
      }
    }

    if (wellness.motivation !== undefined) {
      validateScale(wellness.motivation, "Motivation");
      if (wellness.motivation < 4) {
        warnings.push(
          "Low motivation detected. Consider mental health check-in.",
        );
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
        warnings.push(
          "Poor sleep combined with high stress. Priority: sleep improvement.",
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions,
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
      suggestions,
    };
  }

  /**
   * Validate integer range
   */
  validateIntegerRange(
    value: number,
    min: number,
    max: number,
    fieldName: string,
  ): ValidationResult {
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
      suggestions,
    };
  }

  /**
   * Validate percentage (0-100)
   */
  validatePercentage(value: number, fieldName: string): ValidationResult {
    return this.validateIntegerRange(value, 0, 100, fieldName);
  }

  /**
   * Validate training load value
   */
  validateTrainingLoad(load: {
    duration?: number;
    intensity?: number;
    distance?: number;
    rpe?: number;
  }): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Duration validation (minutes)
    if (load.duration !== undefined) {
      if (load.duration < 1 || load.duration > 480) {
        errors.push("Duration must be between 1 and 480 minutes (8 hours)");
      }
      if (load.duration > 240) {
        warnings.push("Very long session. Ensure this is accurate.");
      }
    }

    // Intensity validation (1-10 scale)
    if (load.intensity !== undefined) {
      if (load.intensity < 1 || load.intensity > 10) {
        errors.push("Intensity must be between 1 and 10");
      }
    }

    // Distance validation (meters)
    if (load.distance !== undefined) {
      if (load.distance < 0) {
        errors.push("Distance cannot be negative");
      }
      if (load.distance > 50000) {
        warnings.push("Distance exceeds 50km. Verify accuracy.");
      }
    }

    // RPE validation
    if (load.rpe !== undefined) {
      if (!Number.isInteger(load.rpe)) {
        errors.push("RPE must be an integer");
      }
      if (load.rpe < 1 || load.rpe > 10) {
        errors.push("RPE must be between 1 and 10");
      }
    }

    // Cross-validation
    if (
      load.duration &&
      load.intensity &&
      load.duration > 120 &&
      load.intensity > 8
    ) {
      warnings.push(
        "High intensity for long duration. Monitor athlete carefully.",
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * Validate athlete profile data
   */
  validateAthleteProfile(profile: {
    name?: string;
    email?: string;
    dateOfBirth?: string;
    jerseyNumber?: number;
  }): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Name validation
    if (profile.name !== undefined) {
      const trimmed = profile.name.trim();
      if (trimmed.length < 2) {
        errors.push("Name must be at least 2 characters");
      }
      if (trimmed.length > 100) {
        errors.push("Name must not exceed 100 characters");
      }
      if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) {
        errors.push("Name contains invalid characters");
      }
    }

    // Email validation
    if (profile.email !== undefined) {
      const emailPattern =
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      if (!emailPattern.test(profile.email) || profile.email.length > 254) {
        errors.push("Invalid email format");
      }
    }

    // Date of birth validation
    if (profile.dateOfBirth !== undefined) {
      const dob = new Date(profile.dateOfBirth);
      const now = new Date();
      const age = now.getFullYear() - dob.getFullYear();

      if (isNaN(dob.getTime())) {
        errors.push("Invalid date of birth");
      } else if (age < 10 || age > 100) {
        errors.push("Age must be between 10 and 100 years");
      } else if (age < 13) {
        warnings.push("Athlete under 13 requires parental consent");
      }
    }

    // Jersey number validation
    if (profile.jerseyNumber !== undefined) {
      if (
        !Number.isInteger(profile.jerseyNumber) ||
        profile.jerseyNumber < 0 ||
        profile.jerseyNumber > 99
      ) {
        errors.push("Jersey number must be between 0 and 99");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * Validate file upload
   */
  validateFileUpload(
    file: File,
    options: {
      maxSizeMB?: number;
      allowedTypes?: string[];
      allowedExtensions?: string[];
    } = {},
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    const maxSizeMB = options.maxSizeMB || 10;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    // Size validation
    if (file.size > maxSizeBytes) {
      errors.push(`File size must not exceed ${maxSizeMB}MB`);
    }

    // MIME type validation
    if (options.allowedTypes && options.allowedTypes.length > 0) {
      if (!options.allowedTypes.includes(file.type)) {
        errors.push(
          `File type ${file.type} not allowed. Allowed types: ${options.allowedTypes.join(", ")}`,
        );
      }
    }

    // Extension validation
    if (options.allowedExtensions && options.allowedExtensions.length > 0) {
      const fileName = file.name.toLowerCase();
      const hasAllowedExt = options.allowedExtensions.some((ext) =>
        fileName.endsWith(ext.toLowerCase()),
      );
      if (!hasAllowedExt) {
        errors.push(
          `File extension not allowed. Allowed extensions: ${options.allowedExtensions.join(", ")}`,
        );
      }
    }

    // Warning for large files
    if (file.size > maxSizeBytes * 0.8) {
      warnings.push("File is close to maximum size limit");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }
}
