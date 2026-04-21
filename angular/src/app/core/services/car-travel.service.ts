/**
 * Car Travel Service
 *
 * EVIDENCE-BASED LONG-DISTANCE CAR TRAVEL PROTOCOLS FOR ATHLETES
 *
 * Covers blood circulation management, DVT prevention, compression
 * garment guidance, and massage gun protocols for 6-12+ hour car journeys.
 *
 * Research Base:
 * - Engel et al. (2016) - Sports compression garments enhance venous blood flow
 *   (PubMed: 36622554) - Systematic review & meta-analysis
 * - Konrad et al. (2023) - Localized percussion vibration increases blood
 *   flow velocity and muscle volume (MDPI: 10.3390/jcm12052047)
 * - Scurr et al. (2001) / Clarke et al. (2016) Cochrane Review - DVT prevention
 *
 * Extracted from TravelRecoveryService to keep each service single-responsibility.
 * Jet lag / air travel protocols remain in TravelRecoveryService.
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import { Injectable, inject } from "@angular/core";
import { LoggerService } from "./logger.service";
import type { TravelChecklist } from "./travel-recovery.service";
import {
  SEATED_EXERCISES,
  REST_STOP_EXERCISES,
  POST_ARRIVAL_EXERCISES,
  MASSAGE_GUN_PROTOCOL,
  CAR_TRAVEL_CHECKLIST,
  CAR_TRAVEL_RESEARCH_SUMMARY,
} from "./car-travel.data";

// ============================================================================
// INTERFACES
// ============================================================================

export interface CarTravelPlan {
  id: string;
  userId: string;
  tripName: string;
  departureDate: Date;
  departureTime: string;
  estimatedDuration: number; // hours
  competitionDate?: Date;
  competitionTime?: string;
  isDriver: boolean;
  numberOfPassengers: number;
  vehicleType: "car" | "suv" | "van" | "bus";
  notes?: string;
  createdAt: Date;
}

export interface CarTravelProtocol {
  phase: "pre-departure" | "during-travel" | "rest-stop" | "post-arrival";
  hourMark: number; // hours into journey
  recommendations: CarTravelRecommendation[];
  circulationExercises: CirculationExercise[];
  compressionGuidelines: CompressionGuideline;
  hydrationTarget: number; // ml
  nutritionGuidelines: NutritionGuideline[];
}

export interface CarTravelRecommendation {
  time: string;
  action: string;
  importance: "critical" | "high" | "medium" | "low";
  category:
    | "circulation"
    | "compression"
    | "hydration"
    | "nutrition"
    | "rest"
    | "driver-safety";
  evidenceBase?: string;
  duration?: number; // minutes
}

export interface CirculationExercise {
  name: string;
  description: string;
  sets: number;
  reps: number;
  duration?: number; // seconds
  targetArea: "calves" | "thighs" | "glutes" | "lower-back" | "full-body";
  canDoSeated: boolean;
  evidenceBase?: string;
}

export interface CompressionGuideline {
  garmentType: "socks" | "calf-sleeves" | "full-leggings" | "shorts";
  pressureLevel: "light" | "moderate" | "firm";
  pressureMmHg: string; // e.g., "15-20 mmHg"
  wearDuration: string;
  whenToWear: string;
  whenToRemove: string;
  cautions: string[];
  evidenceBase: string;
}

export interface NutritionGuideline {
  timing: string;
  recommendation: string;
  foods: string[];
  avoid: string[];
  reason: string;
}

export interface MassageGunProtocol {
  timing: "pre-travel" | "rest-stop" | "post-arrival";
  targetMuscles: MuscleTarget[];
  totalDuration: number; // minutes
  frequency: string; // e.g., "Every 2-3 hours at rest stops"
  cautions: string[];
  evidenceBase: string;
}

export interface MuscleTarget {
  muscle: string;
  duration: number; // seconds
  pressure: "light" | "moderate" | "firm";
  technique: string;
  purpose: string;
}

export interface BloodCirculationRisk {
  riskLevel: "low" | "moderate" | "high" | "very-high";
  score: number; // 0-100
  factors: string[];
  recommendations: string[];
  warningSymptoms: string[];
}


// ============================================================================
// SERVICE
// ============================================================================

@Injectable({
  providedIn: "root",
})
export class CarTravelService {
  private logger = inject(LoggerService);


  /**
   * Calculate blood circulation risk for car travel
   * Based on duration, driver status, and other factors
   */
  calculateCarTravelRisk(
    durationHours: number,
    isDriver: boolean,
  ): BloodCirculationRisk {
    const factors: string[] = [];
    const recommendations: string[] = [];
    let score = 0;

    // Duration-based risk (primary factor)
    if (durationHours >= 10) {
      score += 40;
      factors.push("Very long travel duration (10+ hours)");
    } else if (durationHours >= 6) {
      score += 25;
      factors.push("Long travel duration (6-10 hours)");
    } else if (durationHours >= 4) {
      score += 15;
      factors.push("Moderate travel duration (4-6 hours)");
    }

    // Driver vs passenger (drivers have less movement options)
    if (isDriver) {
      score += 15;
      factors.push("Driving limits movement opportunities");
      recommendations.push("Switch drivers every 2 hours if possible");
    }

    // Determine risk level
    let riskLevel: BloodCirculationRisk["riskLevel"] = "low";
    if (score >= 50) {
      riskLevel = "very-high";
    } else if (score >= 35) {
      riskLevel = "high";
    } else if (score >= 20) {
      riskLevel = "moderate";
    }

    // Add risk-appropriate recommendations
    if (riskLevel === "very-high" || riskLevel === "high") {
      recommendations.push(
        "Wear compression garments throughout entire journey",
      );
      recommendations.push("Stop every 1-1.5 hours for movement breaks");
      recommendations.push("Use massage gun at every rest stop");
      recommendations.push("Perform seated exercises every 30 minutes");
    } else if (riskLevel === "moderate") {
      recommendations.push("Wear compression socks during travel");
      recommendations.push("Stop every 2 hours for movement breaks");
      recommendations.push("Perform ankle pumps every 30 minutes while seated");
    } else {
      recommendations.push("Stay hydrated and take periodic breaks");
    }

    const warningSymptoms = [
      "Leg swelling or puffiness",
      "Pain or tenderness in calf or thigh",
      "Warmth in one leg",
      "Red or discolored skin on leg",
      "Leg cramps that don't resolve with stretching",
      "Numbness or tingling in legs/feet",
    ];

    return {
      riskLevel,
      score,
      factors,
      recommendations,
      warningSymptoms,
    };
  }

  /**
   * Generate comprehensive car travel protocol
   */
  generateCarTravelProtocol(
    durationHours: number,
    isDriver: boolean,
  ): CarTravelProtocol[] {
    const protocols: CarTravelProtocol[] = [];

    // Pre-departure protocol
    protocols.push(this.generatePreDepartureProtocol());

    // During travel protocols (every 2 hours)
    const numStops = Math.floor(durationHours / 2);
    for (let i = 1; i <= numStops; i++) {
      protocols.push(
        this.generateDuringTravelProtocol(i * 2, isDriver, durationHours),
      );
    }

    // Post-arrival protocol
    protocols.push(this.generatePostArrivalProtocol(durationHours));

    return protocols;
  }

  /**
   * Pre-departure protocol for car travel
   */
  private generatePreDepartureProtocol(): CarTravelProtocol {
    return {
      phase: "pre-departure",
      hourMark: 0,
      recommendations: [
        {
          time: "30 min before",
          action: "Put on compression garments (socks or full leggings)",
          importance: "critical",
          category: "compression",
          evidenceBase:
            "Engel et al. (2016) - Compression enhances venous blood flow at rest",
        },
        {
          time: "30 min before",
          action: "Pre-hydrate with 500ml water + electrolytes",
          importance: "high",
          category: "hydration",
          evidenceBase: "Dehydration increases blood viscosity and DVT risk",
        },
        {
          time: "15 min before",
          action:
            "Use massage gun on calves, quads, and glutes for 5 minutes total",
          importance: "high",
          category: "circulation",
          evidenceBase:
            "Konrad et al. (2023) - Percussion therapy increases blood flow velocity",
          duration: 5,
        },
        {
          time: "Before departure",
          action:
            "Adjust seat for optimal posture - knees slightly higher than hips if possible",
          importance: "medium",
          category: "circulation",
        },
        {
          time: "Before departure",
          action:
            "Pack healthy snacks: bananas (potassium), nuts, whole grain crackers",
          importance: "medium",
          category: "nutrition",
        },
      ],
      circulationExercises: this.getSeatedExercises(),
      compressionGuidelines: this.getCompressionGuidelines("pre-travel"),
      hydrationTarget: 500,
      nutritionGuidelines: [
        {
          timing: "Before departure",
          recommendation: "Light, balanced meal 1-2 hours before travel",
          foods: ["Oatmeal", "Banana", "Eggs", "Whole grain toast"],
          avoid: ["Heavy fatty foods", "Excessive caffeine", "Alcohol"],
          reason:
            "Heavy meals divert blood to digestion; caffeine/alcohol cause dehydration",
        },
      ],
    };
  }

  /**
   * During travel protocol (rest stops)
   */
  private generateDuringTravelProtocol(
    hourMark: number,
    isDriver: boolean,
    totalDuration: number,
  ): CarTravelProtocol {
    const isLongTrip = totalDuration >= 8;
    const isMidPoint =
      hourMark >= totalDuration / 2 - 1 && hourMark <= totalDuration / 2 + 1;

    const recommendations: CarTravelRecommendation[] = [
      {
        time: `Hour ${hourMark}`,
        action: "STOP - Take a 10-15 minute break",
        importance: "critical",
        category: "rest",
        evidenceBase:
          "Regular breaks every 2 hours reduce DVT risk significantly",
        duration: 15,
      },
      {
        time: "At stop",
        action: "Walk briskly for 5 minutes minimum",
        importance: "critical",
        category: "circulation",
        evidenceBase:
          "Walking activates calf muscle pump, promoting venous return",
        duration: 5,
      },
      {
        time: "At stop",
        action: "Perform dynamic stretches: leg swings, lunges, calf raises",
        importance: "high",
        category: "circulation",
        duration: 3,
      },
      {
        time: "At stop",
        action: "Drink 250-500ml water or electrolyte drink",
        importance: "high",
        category: "hydration",
      },
    ];

    // Add massage gun recommendation at longer stops
    if (isMidPoint || isLongTrip) {
      recommendations.push({
        time: "At stop",
        action:
          "Use massage gun on calves (60s each), quads (60s each), glutes (60s each)",
        importance: "high",
        category: "circulation",
        evidenceBase:
          "Konrad et al. (2023) - 60-120s application increases blood flow 30-50%",
        duration: 6,
      });
    }

    // Driver-specific recommendations
    if (isDriver) {
      recommendations.push({
        time: "At stop",
        action: "Switch drivers if possible to allow leg movement",
        importance: "medium",
        category: "driver-safety",
      });
      recommendations.push({
        time: "At stop",
        action: "Do eye exercises and neck rolls to reduce driver fatigue",
        importance: "medium",
        category: "driver-safety",
      });
    }

    // Mid-trip meal recommendation
    if (isMidPoint) {
      recommendations.push({
        time: "At stop",
        action:
          "Have a light meal: sandwich, fruit, yogurt - avoid heavy/greasy food",
        importance: "medium",
        category: "nutrition",
      });
    }

    return {
      phase: "rest-stop",
      hourMark,
      recommendations,
      circulationExercises: this.getRestStopExercises(),
      compressionGuidelines: this.getCompressionGuidelines("during-travel"),
      hydrationTarget: 500,
      nutritionGuidelines: [
        {
          timing: `Hour ${hourMark}`,
          recommendation: "Light snack with potassium and complex carbs",
          foods: [
            "Banana",
            "Trail mix",
            "Whole grain crackers",
            "Apple with nut butter",
          ],
          avoid: ["Chips", "Candy", "Soda", "Fast food"],
          reason:
            "Potassium helps prevent muscle cramps; complex carbs provide sustained energy",
        },
      ],
    };
  }

  /**
   * Post-arrival protocol
   */
  private generatePostArrivalProtocol(
    totalDuration: number,
  ): CarTravelProtocol {
    const isLongTrip = totalDuration >= 8;

    return {
      phase: "post-arrival",
      hourMark: totalDuration,
      recommendations: [
        {
          time: "Immediately",
          action: "Walk for 10-15 minutes before sitting again",
          importance: "critical",
          category: "circulation",
          evidenceBase:
            "Post-travel movement critical for restoring normal circulation",
          duration: 15,
        },
        {
          time: "Within 30 min",
          action:
            "Use massage gun comprehensively: calves, quads, hamstrings, glutes, lower back",
          importance: "critical",
          category: "circulation",
          evidenceBase:
            "Konrad et al. (2023) - Post-activity percussion reduces muscle stiffness",
          duration: 10,
        },
        {
          time: "Within 30 min",
          action:
            "Perform full stretching routine focusing on hip flexors, hamstrings, calves",
          importance: "high",
          category: "circulation",
          duration: 10,
        },
        {
          time: "Within 1 hour",
          action: isLongTrip
            ? "Consider a 20-30 min light jog or swim to fully restore circulation"
            : "Light walk or mobility work recommended",
          importance: "high",
          category: "circulation",
        },
        {
          time: "Within 1 hour",
          action: "Rehydrate with 500-750ml water + electrolytes",
          importance: "high",
          category: "hydration",
        },
        {
          time: "Evening",
          action: "Keep compression garments on for 2-4 hours post-arrival",
          importance: "medium",
          category: "compression",
          evidenceBase:
            "Extended compression wear aids recovery from prolonged sitting",
        },
        {
          time: "Before bed",
          action: "Elevate legs for 15-20 minutes",
          importance: "medium",
          category: "circulation",
        },
      ],
      circulationExercises: this.getPostArrivalExercises(),
      compressionGuidelines: this.getCompressionGuidelines("post-arrival"),
      hydrationTarget: 750,
      nutritionGuidelines: [
        {
          timing: "Post-arrival meal",
          recommendation: "Anti-inflammatory meal with lean protein",
          foods: [
            "Grilled salmon or chicken",
            "Leafy greens",
            "Sweet potato",
            "Berries",
            "Turmeric/ginger",
          ],
          avoid: ["Alcohol", "Processed foods", "Excessive sodium"],
          reason:
            "Anti-inflammatory foods support recovery; protein aids muscle repair",
        },
      ],
    };
  }

  /**
   * Get compression garment guidelines for a travel phase
   */
  getCompressionGuidelines(
    phase: "pre-travel" | "during-travel" | "post-arrival",
  ): CompressionGuideline {
    const base: CompressionGuideline = {
      garmentType: "full-leggings",
      pressureLevel: "moderate",
      pressureMmHg: "15-20 mmHg",
      wearDuration: "Entire journey",
      whenToWear: "Put on 30 minutes before departure",
      whenToRemove: "2-4 hours after arrival",
      cautions: [
        "Ensure proper fit — should be snug but not painful",
        "Remove immediately if numbness, tingling, or increased pain occurs",
        "Not recommended if you have peripheral artery disease",
        "Consult doctor if you have diabetes or circulation issues",
      ],
      evidenceBase:
        "Compression garments (15-30 mmHg) significantly enhance venous blood flow. Engel et al. (2016) meta-analysis of 29 studies; Brophy-Williams et al. (2017) improved muscle blood flow.",
    };

    if (phase === "pre-travel") {
      return { ...base, wearDuration: "Day before travel if >8 h trip", whenToWear: "Morning of travel preparation" };
    }
    if (phase === "post-arrival") {
      return { ...base, wearDuration: "2-4 hours post-arrival", whenToWear: "Keep on until settled", whenToRemove: "After light movement or shower" };
    }
    return base;
  }

  /**
   * Get seated exercises for during travel
   */
  getSeatedExercises(): CirculationExercise[] {
    return SEATED_EXERCISES;
  }

  /**
   * Get rest stop exercises
   */
  getRestStopExercises(): CirculationExercise[] {
    return REST_STOP_EXERCISES;
  }

  /**
   * Get post-arrival exercises
   */
  getPostArrivalExercises(): CirculationExercise[] {
    return POST_ARRIVAL_EXERCISES;
  }

  /**
   * Get massage gun protocol
   */
  getMassageGunProtocol(): MassageGunProtocol[] {
    return MASSAGE_GUN_PROTOCOL;
  }

  /**
   * Get car travel checklist
   */
  getCarTravelChecklist(): TravelChecklist[] {
    return CAR_TRAVEL_CHECKLIST;
  }

  /**
   * Get car travel research summary
   */
  getCarTravelResearchSummary(): {
    topic: string;
    finding: string;
    source: string;
    pubmedId?: string;
    recommendation: string;
  }[] {
    return CAR_TRAVEL_RESEARCH_SUMMARY;
  }
}
