/**
 * Supplement Models
 * 
 * Canonical type definitions for supplement-related data structures.
 * All supplement interfaces should import from this file.
 * 
 * @module core/models/supplement
 */

/**
 * Supplement record from database/service layer
 * Used for CRUD operations and data persistence
 */
export interface Supplement {
  id?: number;
  userId?: string;
  name: string;
  dosage?: string;
  taken: boolean;
  date: string;
  timeOfDay?: "morning" | "afternoon" | "evening" | "pre-workout" | "post-workout";
  notes?: string;
  timestamp?: string;
}

/**
 * Supplement with UI-specific fields
 * Used in components for display and interaction
 */
export interface SupplementDisplay {
  id: string;
  name: string;
  dosage?: string;
  timing: "morning" | "pre-workout" | "post-workout" | "evening" | "anytime";
  category: "vitamin" | "mineral" | "amino" | "performance" | "recovery" | "other";
  taken: boolean;
  takenAt?: Date;
  notes?: string;
}

/**
 * Supplement entry for daily protocol/today view
 * Simplified structure for quick logging
 */
export interface SupplementEntry {
  name: string;
  taken: boolean;
  timeOfDay: "morning" | "afternoon" | "evening" | "pre-workout" | "post-workout";
  dosage?: string;
}

/**
 * Supplement compliance metrics
 */
export interface SupplementCompliance {
  complianceRate: number;
  totalDays: number;
  missedDays: number;
  bySupplement?: Record<string, { taken: number; missed: number }>;
}

/**
 * Helper function to convert Supplement to SupplementDisplay
 */
export function supplementToDisplay(supplement: Supplement): SupplementDisplay {
  return {
    id: supplement.id?.toString() || "",
    name: supplement.name,
    dosage: supplement.dosage,
    timing: supplement.timeOfDay || "anytime",
    category: "other", // Default category, can be enhanced with mapping logic
    taken: supplement.taken,
    takenAt: supplement.timestamp ? new Date(supplement.timestamp) : undefined,
    notes: supplement.notes,
  };
}

/**
 * Helper function to convert SupplementDisplay to Supplement
 */
export function displayToSupplement(display: SupplementDisplay, userId?: string): Partial<Supplement> {
  return {
    name: display.name,
    dosage: display.dosage,
    taken: display.taken,
    timeOfDay: display.timing === "anytime" ? undefined : display.timing,
    notes: display.notes,
    userId,
    timestamp: display.takenAt?.toISOString(),
  };
}
