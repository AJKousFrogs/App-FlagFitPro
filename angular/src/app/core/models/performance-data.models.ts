/**
 * Performance Data Models
 *
 * Shared interfaces for physical measurements, performance tests,
 * and related database types. Extracted from performance-data.service.ts.
 *
 * @module core/models/performance-data
 */

// Physical Measurements Interfaces
export interface PhysicalMeasurement {
  id?: string;
  userId?: string;
  weight: number;
  height: number;
  bodyFat?: number;
  muscleMass?: number;
  // Enhanced body composition from smart scales
  bodyWaterMass?: number;
  fatMass?: number;
  proteinMass?: number;
  boneMineralContent?: number;
  skeletalMuscleMass?: number;
  musclePercentage?: number;
  bodyWaterPercentage?: number;
  proteinPercentage?: number;
  boneMineralPercentage?: number;
  visceralFatRating?: number;
  basalMetabolicRate?: number;
  waistToHipRatio?: number;
  bodyAge?: number;
  notes?: string;
  timestamp: string;
}

export interface MeasurementsSummary {
  latest?: PhysicalMeasurement;
  changes?: {
    weight?: string;
    bodyFat?: string;
  };
}

// Performance Test Interfaces
export interface PerformanceTest {
  id?: number;
  userId?: string;
  testType: string;
  result: number;
  target?: number;
  timestamp: string;
  conditions?: Record<string, unknown>;
}

export interface TrendValue {
  value: number;
  change?: number;
  trend?: "up" | "down" | "stable";
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
}

export interface TestSummary {
  totalTests: number;
  byType?: Record<string, number>;
  improvements?: Record<string, number>;
}

// Database row types (snake_case matching Supabase columns)

export interface DatabaseMeasurement {
  id: string;
  user_id: string;
  weight: number; // in kg
  height: number; // in cm
  body_fat?: number; // percentage
  muscle_mass?: number; // in kg
  body_water_mass?: number;
  fat_mass?: number;
  protein_mass?: number;
  bone_mineral_content?: number;
  skeletal_muscle_mass?: number;
  muscle_percentage?: number;
  body_water_percentage?: number;
  protein_percentage?: number;
  bone_mineral_percentage?: number;
  visceral_fat_rating?: number;
  basal_metabolic_rate?: number;
  waist_to_hip_ratio?: number;
  body_age?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown; // Allow additional properties for Record<string, unknown> compatibility
}

export interface DatabaseSupplement {
  id: number;
  user_id: string;
  supplement_name: string;
  dosage?: string;
  taken: boolean;
  date: string;
  time_of_day?: "morning" | "afternoon" | "evening" | "pre-workout" | "post-workout";
  notes?: string;
  created_at: string;
  [key: string]: unknown; // Allow additional properties for Record<string, unknown> compatibility
}

export interface DatabaseTest {
  id: number;
  user_id: string;
  test_name: string;
  test_type?: string;
  result_value: number;
  target_value?: number;
  performed_at: string;
  test_date?: string;
  test_conditions?: Record<string, unknown>;
  conditions?: Record<string, unknown>;
  [key: string]: unknown; // Allow additional properties for Record<string, unknown> compatibility
}
