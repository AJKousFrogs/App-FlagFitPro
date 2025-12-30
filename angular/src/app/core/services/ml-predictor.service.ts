import { Injectable, inject } from "@angular/core";
import { LoggerService } from "./logger.service";
import { SupabaseService } from "./supabase.service";

/**
 * Interface for ML Model Configuration
 */
export interface ModelConfig {
  type: "regression" | "classification" | "neural_network";
  features: string[];
  weights?: number[];
  bias?: number;
  layers?: number[];
  activation?: string;
  accuracy: number;
}

/**
 * Athlete Data for Sprint Predictions
 */
export interface AthleteData {
  acceleration?: number;
  topSpeed?: number;
  agility?: number;
  strength?: number;
  recovery?: number;
  recentPerformances?: number[];
  trainingHistory?: TrainingDataPoint[];
  bodyMetrics?: BodyMetrics;
}

export interface TrainingDataPoint {
  date: Date;
  type: string;
  intensity: number;
  duration: number;
}

export interface BodyMetrics {
  weight?: number;
  height?: number;
  bodyFat?: number;
  muscleMass?: number;
}

/**
 * Skill Data for Route Progression
 */
export interface SkillData {
  routeTypes?: Record<string, number>;
  practiceHours?: number;
  successRate?: number;
  progressHistory?: ProgressDataPoint[];
}

export interface ProgressDataPoint {
  date: Date;
  metric: string;
  value: number;
}

/**
 * Player Data for Decision Making
 */
export interface PlayerData {
  cognitiveMetrics?: CognitiveMetrics;
  experienceLevel?: number;
  gameHistory?: GameDataPoint[];
  trainingData?: TrainingDataPoint[];
}

export interface CognitiveMetrics {
  reactionTime?: number;
  decisionSpeed?: number;
  patternRecognition?: number;
  situationalAwareness?: number;
}

export interface GameDataPoint {
  date: Date;
  performance: number;
  decisions: number;
  successRate: number;
}

/**
 * Feature Vectors for ML Models
 */
export interface FeatureVector {
  values: number[];
  names: string[];
}

/**
 * Model Prediction Output
 */
export interface PredictionResult {
  value: number;
  confidence: number;
  features: FeatureVector;
}

/**
 * Interface for Sprint Prediction Result
 */
export interface SprintPredictionResult {
  predictedTime: number;
  improvement: number;
  confidence: number;
  factors: {
    acceleration: number;
    topSpeed: number;
    agility: number;
    recovery: number;
  };
  recommendations: Recommendation[];
  timeline: string;
  note?: string;
}

/**
 * Interface for Recommendation
 */
export interface Recommendation {
  focus: string;
  exercises: string[];
  frequency: string;
  duration: string;
}

/**
 * Interface for Route Prediction Result
 */
export interface RoutePredictionResult {
  routePredictions: Record<string, RouteSkillLevel>;
  overallProgression: number;
  focusAreas: string[];
  timeline: string;
  confidence: number;
}

export interface RouteSkillLevel {
  currentLevel: number;
  projectedLevel: number;
  improvementRate: number;
  practiceRequired: number;
}

/**
 * Interface for Decision Prediction Result
 */
export interface DecisionPredictionResult {
  position: string;
  decisionPredictions: Record<string, DecisionMetrics>;
  overallDecisionMaking: number;
  cognitiveLoad: {
    current: number;
    optimal: number;
    status: "high" | "low" | "optimal";
    recommendations: string[];
  };
  trainingPriority: string[];
  confidence: number;
}

export interface DecisionMetrics {
  successRate: number;
  timing: number;
  improvement: number;
  trainingFocus: string[];
}

/**
 * Enhanced ML Performance Prediction Engine
 * Advanced algorithms for player performance forecasting and optimization.
 * Ported from legacy ml-performance-predictor.js
 */
@Injectable({
  providedIn: "root",
})
export class MlPredictorService {
  private logger = inject(LoggerService);
  private supabase = inject(SupabaseService);

  private models = new Map<string, ModelConfig>();
  private trainingData = new Map<string, any[]>();
  private predictionCache = new Map<string, any>();

  private readonly modelAccuracy = {
    sprintPerformance: 0.874,
    routeRunning: 0.892,
    injuryRisk: 0.782,
    skillProgression: 0.815,
  };

  constructor() {
    this.initializeModels();
  }

  /**
   * Initialize ML models with pre-trained weights
   */
  private initializeModels(): void {
    // Sprint Performance Prediction Model
    this.models.set("sprint", {
      type: "regression",
      features: [
        "current_speed",
        "training_load",
        "recovery_score",
        "biomechanics",
        "weather",
      ],
      weights: [0.45, 0.25, 0.15, 0.1, 0.05],
      bias: 0.12,
      accuracy: this.modelAccuracy.sprintPerformance,
    });

    // Route Running Skill Model
    this.models.set("routes", {
      type: "classification",
      features: [
        "practice_reps",
        "success_rate",
        "complexity_level",
        "cognitive_load",
        "fatigue",
      ],
      weights: [0.35, 0.3, 0.2, 0.1, 0.05],
      bias: 0.08,
      accuracy: this.modelAccuracy.routeRunning,
    });

    // Decision Making Model (QB/DB specific)
    this.models.set("decisions", {
      type: "neural_network",
      features: [
        "reaction_time",
        "field_vision",
        "pressure_handling",
        "experience",
        "game_situation",
      ],
      layers: [5, 10, 8, 3],
      activation: "relu",
      accuracy: 0.823,
    });

    this.logger.info("ML Performance Predictor initialized with 3 models");
  }

  /**
   * Predict sprint performance for 10-25 yard distances (flag football optimized)
   */
  predictSprintPerformance(athleteData: any): SprintPredictionResult {
    const cacheKey = `sprint_${athleteData.playerId}_${Date.now()}`;

    if (this.predictionCache.has(cacheKey)) {
      return this.predictionCache.get(cacheKey);
    }

    try {
      const model = this.models.get("sprint")!;
      const features = this.extractSprintFeatures(athleteData);

      // Weighted linear regression with flag football optimizations
      const prediction = this.computeLinearRegression(
        features,
        model.weights!,
        model.bias!,
      );

      // Apply flag football specific adjustments
      const flagFootballAdjustment = this.applyFlagFootballOptimization(
        prediction,
        athleteData,
      );

      const result: SprintPredictionResult = {
        predictedTime: flagFootballAdjustment.time,
        improvement: flagFootballAdjustment.improvement,
        confidence: model.accuracy,
        factors: {
          acceleration: flagFootballAdjustment.acceleration,
          topSpeed: flagFootballAdjustment.topSpeed,
          agility: flagFootballAdjustment.agility,
          recovery: features.recovery_score,
        },
        recommendations: this.generateSprintRecommendations(
          flagFootballAdjustment,
        ),
        timeline: "2-6 weeks",
      };

      this.predictionCache.set(cacheKey, result);
      this.logger.debug(
        `Sprint prediction generated for player ${athleteData.playerId}`,
      );

      return result;
    } catch (error) {
      this.logger.error("Sprint prediction failed:", error);
      return this.getFallbackSprintPrediction(athleteData);
    }
  }

  /**
   * Predict route running skill progression
   */
  predictRouteProgression(skillData: any): RoutePredictionResult {
    try {
      const model = this.models.get("routes")!;
      const features = this.extractRouteFeatures(skillData);

      // Multi-class classification for route types
      const routeTypes = ["slant", "out", "comeback", "post", "fade", "screen"];
      const predictions: Record<string, RouteSkillLevel> = {};

      routeTypes.forEach((routeType) => {
        const typeFeatures = { ...features, route_type: routeType };
        const skillLevel = this.computeSkillClassification(typeFeatures, model);
        predictions[routeType] = {
          currentLevel: skillLevel.current,
          projectedLevel: skillLevel.projected,
          improvementRate: skillLevel.rate,
          practiceRequired: skillLevel.practiceHours,
        };
      });

      return {
        routePredictions: predictions,
        overallProgression: this.calculateOverallProgression(predictions),
        focusAreas: this.identifyFocusAreas(predictions),
        timeline: "4-8 weeks",
        confidence: model.accuracy,
      };
    } catch (error) {
      this.logger.error("Route progression prediction failed:", error);
      return this.getFallbackRoutePrediction();
    }
  }

  /**
   * Enhanced decision making prediction for QBs and DBs
   */
  predictDecisionMaking(playerData: any, position: string): DecisionPredictionResult {
    try {
      const model = this.models.get("decisions")!;
      const features = this.extractDecisionFeatures(playerData, position);

      // Position-specific decision scenarios
      const scenarios =
        position === "QB"
          ? [
              "pre_snap_read",
              "pocket_pressure",
              "coverage_recognition",
              "audible_calls",
            ]
          : [
              "route_anticipation",
              "flag_pull_timing",
              "coverage_responsibility",
              "help_defense",
            ];

      const predictions: Record<string, DecisionMetrics> = {};

      scenarios.forEach((scenario) => {
        const scenarioFeatures = { ...features, scenario_type: scenario };
        const decision = this.computeNeuralNetwork(scenarioFeatures, model);
        predictions[scenario] = {
          successRate: decision.probability,
          timing: decision.timing,
          improvement: decision.potential,
          trainingFocus: decision.recommendations,
        };
      });

      return {
        position,
        decisionPredictions: predictions,
        overallDecisionMaking: this.calculateDecisionAccuracy(predictions),
        cognitiveLoad: this.assessCognitiveLoad(features),
        trainingPriority: this.rankTrainingPriorities(predictions),
        confidence: model.accuracy,
      };
    } catch (error) {
      this.logger.error("Decision making prediction failed:", error);
      return this.getFallbackDecisionPrediction(position);
    }
  }

  private extractSprintFeatures(athleteData: any): any {
    return {
      current_speed: athleteData.sprintTimes?.average || 4.5,
      training_load: athleteData.weeklyLoad || 100,
      recovery_score: athleteData.recoveryMetrics?.overall || 0.7,
      biomechanics: athleteData.movementQuality || 0.8,
      weather: athleteData.conditions?.temperature || 70,
      position_factor: this.getPositionSpeedFactor(athleteData.position),
      age_factor: this.getAgeFactor(athleteData.age || 22),
    };
  }

  private extractRouteFeatures(skillData: any): any {
    return {
      practice_reps: skillData.reps || 50,
      success_rate: skillData.successRate || 0.65,
      complexity_level: skillData.complexity || 0.5,
      cognitive_load: skillData.fatigueLevel || 0.4,
      fatigue: skillData.currentFatigue || 0.3,
    };
  }

  private extractDecisionFeatures(playerData: any, position: string): any {
    return {
      reaction_time: playerData.reactionTime || 0.45,
      field_vision: playerData.visionScore || 0.75,
      pressure_handling: playerData.pressureScore || 0.7,
      experience: (playerData.yearsExperience || 2) / 10,
      game_situation: 0.5,
    };
  }

  private applyFlagFootballOptimization(prediction: number, athleteData: any): any {
    const agilityWeight = 0.3;
    const accelerationWeight = 0.4;
    const topSpeedWeight = 0.3;

    const adjustedTime =
      prediction *
      (1 +
        agilityWeight * (athleteData.agilityScore || 0.8) +
        accelerationWeight * (athleteData.accelerationScore || 0.75) +
        topSpeedWeight * (athleteData.topSpeedScore || 0.7));

    return {
      time: Math.max(3.8, Math.min(6.0, adjustedTime)),
      improvement: (prediction - adjustedTime) / prediction,
      acceleration: athleteData.accelerationScore || 0.75,
      topSpeed: athleteData.topSpeedScore || 0.7,
      agility: athleteData.agilityScore || 0.8,
    };
  }

  private generateSprintRecommendations(performance: any): Recommendation[] {
    const recommendations: Recommendation[] = [];

    if (performance.acceleration < 0.8) {
      recommendations.push({
        focus: "Acceleration Development",
        exercises: [
          "10-yard build-ups",
          "Resistance sprints",
          "Starting blocks practice",
        ],
        frequency: "3x per week",
        duration: "4 weeks",
      });
    }

    if (performance.agility < 0.8) {
      recommendations.push({
        focus: "Agility Enhancement",
        exercises: [
          "Cone drills",
          "5-10-5 shuttle",
          "Change of direction drills",
        ],
        frequency: "4x per week",
        duration: "6 weeks",
      });
    }

    if (performance.topSpeed < 0.7) {
      recommendations.push({
        focus: "Top Speed Development",
        exercises: [
          "Flying 20s",
          "Overspeed training",
          "Stride frequency drills",
        ],
        frequency: "2x per week",
        duration: "8 weeks",
      });
    }

    return recommendations;
  }

  private computeLinearRegression(features: any, weights: number[], bias: number): number {
    let prediction = bias;
    const featureValues = Object.values(features) as number[];

    featureValues.forEach((value, index) => {
      if (weights[index]) {
        prediction += value * weights[index];
      }
    });

    return prediction;
  }

  private computeSkillClassification(features: any, model: ModelConfig): any {
    // Simplified classification logic
    const score = this.computeLinearRegression(features, model.weights || [], model.bias || 0);
    return {
      current: score,
      projected: score * 1.15,
      rate: 0.05,
      practiceHours: 20,
    };
  }

  private computeNeuralNetwork(features: any, _model: ModelConfig): any {
    const input = Object.values(features) as number[];
    let output = input.reduce(
      (sum, val, idx) => sum + val * (0.1 + idx * 0.05),
      0,
    );

    output = Math.max(0, output);
    output = Math.min(1, output / 10);

    return {
      probability: output,
      timing: Math.random() * 0.5 + 0.3,
      potential: Math.random() * 0.3 + 0.1,
      recommendations: this.generateTrainingRecommendations(features),
    };
  }

  private calculateOverallProgression(predictions: Record<string, RouteSkillLevel>): number {
    const values = Object.values(predictions);
    return values.reduce((sum, p) => sum + p.projectedLevel, 0) / values.length;
  }

  private identifyFocusAreas(predictions: Record<string, RouteSkillLevel>): string[] {
    return Object.entries(predictions)
      .sort(([, a], [, b]) => a.currentLevel - b.currentLevel)
      .slice(0, 2)
      .map(([type]) => `Improve ${type} route precision`);
  }

  private calculateDecisionAccuracy(predictions: Record<string, DecisionMetrics>): number {
    const values = Object.values(predictions);
    return values.reduce((sum, p) => sum + p.successRate, 0) / values.length;
  }

  private assessCognitiveLoad(features: any): DecisionPredictionResult["cognitiveLoad"] {
    const baseLoad =
      (features.field_vision +
        features.pressure_handling +
        features.experience) /
      3;
    return {
      current: baseLoad,
      optimal: 0.75,
      status: baseLoad > 0.8 ? "high" : baseLoad < 0.6 ? "low" : "optimal",
      recommendations:
        baseLoad > 0.8
          ? [
              "Simplify reads",
              "Focus on primary options",
              "Stress management training",
            ]
          : ["Add complexity", "Multi-option reads", "Pressure simulation"],
    };
  }

  private rankTrainingPriorities(predictions: Record<string, DecisionMetrics>): string[] {
    return Object.entries(predictions)
      .sort(([, a], [, b]) => a.successRate - b.successRate)
      .map(([scenario]) => scenario.replace(/_/g, " "));
  }

  private getPositionSpeedFactor(position: string): number {
    const factors: Record<string, number> = {
      QB: 0.85,
      WR: 1.0,
      DB: 0.95,
      RB: 0.9,
      LB: 0.8,
      DL: 0.7,
    };
    return factors[position] || 0.85;
  }

  private getAgeFactor(age: number): number {
    if (age < 20) return 1.05;
    if (age < 25) return 1.0;
    if (age < 30) return 0.98;
    return 0.95;
  }

  private generateTrainingRecommendations(features: any): string[] {
    const recommendations: string[] = [];
    if (features.reaction_time > 0.4) recommendations.push("Reaction time drills");
    if (features.field_vision < 0.7) recommendations.push("Film study and recognition drills");
    if (features.pressure_handling < 0.6) recommendations.push("Pressure simulation training");
    return recommendations.length > 0 ? recommendations : ["Maintain current training"];
  }

  async savePredictionData(
    playerId: string,
    predictionType: string,
    input: any,
    output: any,
    actualResult: any = null,
  ): Promise<void> {
    try {
      const trainingEntry = {
        playerId,
        predictionType,
        timestamp: Date.now(),
        input,
        predicted: output,
        actual: actualResult,
        accuracy: actualResult
          ? this.calculateAccuracy(output, actualResult)
          : null,
      };

      if (!this.trainingData.has(predictionType)) {
        this.trainingData.set(predictionType, []);
      }
      this.trainingData.get(predictionType)!.push(trainingEntry);

      // Persist to Supabase
      const { error } = await this.supabase.client
        .from("ml_training_data")
        .upsert({
          user_id: playerId,
          prediction_type: predictionType,
          data: trainingEntry,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      this.logger.debug(`Training data saved for ${predictionType} prediction`);
    } catch (error) {
      this.logger.error("Failed to save prediction data:", error);
    }
  }

  private calculateAccuracy(predicted: any, actual: any): number {
    if (typeof predicted === "number" && typeof actual === "number") {
      return 1 - Math.abs(predicted - actual) / Math.max(predicted, actual);
    }
    return predicted === actual ? 1 : 0;
  }

  private getFallbackSprintPrediction(_athleteData: any): SprintPredictionResult {
    return {
      predictedTime: 4.8,
      improvement: 0.05,
      confidence: 0.6,
      factors: {
        acceleration: 0.7,
        topSpeed: 0.7,
        agility: 0.7,
        recovery: 0.7,
      },
      recommendations: [
        {
          focus: "General Speed Development",
          exercises: ["Sprint drills"],
          frequency: "3x per week",
          duration: "4 weeks",
        },
      ],
      timeline: "4-8 weeks",
      note: "Using baseline estimation due to insufficient data",
    };
  }

  private getFallbackRoutePrediction(): RoutePredictionResult {
    return {
      routePredictions: {},
      overallProgression: 0,
      focusAreas: ["Insufficient data for route prediction"],
      timeline: "N/A",
      confidence: 0,
    };
  }

  private getFallbackDecisionPrediction(position: string): DecisionPredictionResult {
    return {
      position,
      decisionPredictions: {},
      overallDecisionMaking: 0,
      cognitiveLoad: {
        current: 0.5,
        optimal: 0.75,
        status: "optimal",
        recommendations: [],
      },
      trainingPriority: [],
      confidence: 0,
    };
  }
}

