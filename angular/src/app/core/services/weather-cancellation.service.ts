import { Injectable, inject, signal, computed } from "@angular/core";
import { Observable, firstValueFrom, from, of } from "rxjs";
import { catchError, map, switchMap, tap } from "rxjs";
import { WeatherData, WeatherService } from "./weather.service";
import { SupabaseService } from "./supabase.service";
import { LoggerService, toLogContext } from "./logger.service";
import { PrivacySettingsService } from "./privacy-settings.service";
import { ApiService } from "./api.service";
import { extractApiPayload } from "../utils/api-response-mapper";

/**
 * Weather conditions that trigger cancellation warnings
 */
export interface WeatherAlert {
  severity: "warning" | "danger";
  reason: string;
  recommendation: string;
  canProceed: boolean;
}

/**
 * Training session with weather sensitivity info
 */
export interface WeatherSensitiveSession {
  id: string;
  sessionName: string;
  sessionType: string;
  isOutdoor: boolean;
  isTeamPractice: boolean;
  weatherSensitive: boolean;
  durationMinutes: number;
  description?: string;
  equipmentNeeded?: string[];
}

interface PlayerProgramAssignmentResponse {
  assignment?: {
    program_id?: string | null;
  } | null;
}

interface ProgramTemplateSessionResponse {
  id: string;
  session_name?: string | null;
  session_type?: string | null;
  day_of_week?: number | null;
  session_order?: number | null;
  duration_minutes?: number | null;
  description?: string | null;
  equipment_needed?: string[] | null;
  is_team_practice?: boolean | null;
  is_outdoor?: boolean | null;
  weather_sensitive?: boolean | null;
}

interface ProgramTemplateWeekResponse {
  start_date: string;
  end_date: string;
  sessions?: ProgramTemplateSessionResponse[] | null;
}

interface ProgramTemplatePhaseResponse {
  weeks?: ProgramTemplateWeekResponse[] | null;
}

interface TrainingProgramDetailsResponse {
  data?: {
    training_phases?: ProgramTemplatePhaseResponse[] | null;
  } | null;
}

/**
 * Exercise in a substitute workout
 */
export interface SubstituteExercise {
  name: string;
  category: string;
  sets?: number;
  reps?: string;
  durationSeconds?: number;
  restSeconds?: number;
  intensity: string;
  description?: string;
  equipment?: string[];
  alternatives?: string[];
}

/**
 * AI-generated substitute workout
 */
export interface SubstituteWorkout {
  id?: string;
  workoutName: string;
  workoutType: "indoor" | "home" | "gym" | "bodyweight";
  locationType: "home" | "gym" | "indoor_facility";
  durationMinutes: number;
  intensityLevel: string;
  description: string;
  warmUp: string;
  mainWorkout: SubstituteExercise[];
  coolDown: string;
  equipmentNeeded: string[];
  cancellationReason: string;
  trainingGoals: string[];
  targetMuscleGroups: string[];
  weatherAtCancellation?: WeatherData;
  status?: "suggested" | "accepted" | "completed" | "declined";
}

/**
 * Thresholds for weather-based training decisions
 */
const WEATHER_THRESHOLDS = {
  // Temperature in Fahrenheit
  tempTooHot: 95,
  tempTooCold: 32,
  tempCautionHot: 85,
  tempCautionCold: 40,
  // Wind speed in mph
  windDangerous: 30,
  windCaution: 20,
  // Conditions that are unsafe
  unsafeConditions: [
    "thunderstorm",
    "lightning",
    "tornado",
    "hurricane",
    "blizzard",
    "ice storm",
    "heavy rain",
    "hail",
  ],
  // Conditions that warrant caution
  cautionConditions: ["rain", "snow", "fog", "drizzle", "mist", "sleet"],
};

@Injectable({
  providedIn: "root",
})
export class WeatherCancellationService {
  private weatherService = inject(WeatherService);
  private supabaseService = inject(SupabaseService);
  private logger = inject(LoggerService);
  private privacySettingsService = inject(PrivacySettingsService);
  private apiService = inject(ApiService);

  // Reactive state
  private _currentWeather = signal<WeatherData | null>(null);
  private _weatherAlert = signal<WeatherAlert | null>(null);
  private _suggestedSubstitute = signal<SubstituteWorkout | null>(null);
  private _isGeneratingSubstitute = signal(false);

  // Public computed signals
  readonly currentWeather = this._currentWeather.asReadonly();
  readonly weatherAlert = this._weatherAlert.asReadonly();
  readonly suggestedSubstitute = this._suggestedSubstitute.asReadonly();
  readonly isGeneratingSubstitute = this._isGeneratingSubstitute.asReadonly();

  readonly shouldShowWeatherWarning = computed(() => {
    const alert = this._weatherAlert();
    return alert !== null && !alert.canProceed;
  });

  /**
   * Check weather conditions for outdoor training
   * Returns weather data and any alerts
   */
  checkWeatherForTraining(
    session?: WeatherSensitiveSession,
  ): Observable<{ weather: WeatherData | null; alert: WeatherAlert | null }> {
    return this.weatherService.getWeatherData().pipe(
      tap((weather) => {
        this._currentWeather.set(weather);

        if (weather && session?.weatherSensitive) {
          const alert = this.assessWeatherRisk(weather, session);
          this._weatherAlert.set(alert);
        } else {
          this._weatherAlert.set(null);
        }
      }),
      map((weather) => ({
        weather,
        alert: this._weatherAlert(),
      })),
      catchError((error) => {
        this.logger.warn("Failed to fetch weather data:", toLogContext(error));
        return of({ weather: null, alert: null });
      }),
    );
  }

  /**
   * Assess weather risk for a specific session
   */
  assessWeatherRisk(
    weather: WeatherData,
    session: WeatherSensitiveSession,
  ): WeatherAlert | null {
    // Only check outdoor, weather-sensitive sessions
    if (!session.isOutdoor || !session.weatherSensitive) {
      return null;
    }

    const condition = weather.condition.toLowerCase();

    // Check for dangerous conditions
    for (const unsafe of WEATHER_THRESHOLDS.unsafeConditions) {
      if (condition.includes(unsafe)) {
        return {
          severity: "danger",
          reason: `Dangerous weather: ${weather.condition}`,
          recommendation: `Outdoor training is not recommended due to ${weather.condition}. Consider an indoor alternative.`,
          canProceed: false,
        };
      }
    }

    // Check temperature extremes
    if (weather.temp >= WEATHER_THRESHOLDS.tempTooHot) {
      return {
        severity: "danger",
        reason: `Extreme heat: ${weather.temp}°F`,
        recommendation:
          "Heat stroke risk is high. Train indoors or reschedule to cooler hours.",
        canProceed: false,
      };
    }

    if (weather.temp <= WEATHER_THRESHOLDS.tempTooCold) {
      return {
        severity: "danger",
        reason: `Freezing temperatures: ${weather.temp}°F`,
        recommendation:
          "Risk of hypothermia and muscle injury. Train indoors instead.",
        canProceed: false,
      };
    }

    // Check wind speed
    if (
      weather.windSpeed &&
      weather.windSpeed >= WEATHER_THRESHOLDS.windDangerous
    ) {
      return {
        severity: "danger",
        reason: `Dangerous wind: ${weather.windSpeed} mph`,
        recommendation:
          "High winds make outdoor training unsafe. Move indoors.",
        canProceed: false,
      };
    }

    // Check for caution conditions
    for (const caution of WEATHER_THRESHOLDS.cautionConditions) {
      if (condition.includes(caution)) {
        return {
          severity: "warning",
          reason: `Weather condition: ${weather.condition}`,
          recommendation: `Outdoor training is possible but conditions are not ideal. Consider indoor alternatives or proceed with caution.`,
          canProceed: true,
        };
      }
    }

    // Check temperature caution zones
    if (weather.temp >= WEATHER_THRESHOLDS.tempCautionHot) {
      return {
        severity: "warning",
        reason: `Hot weather: ${weather.temp}°F`,
        recommendation:
          "Stay hydrated and take frequent breaks. Consider shorter sessions.",
        canProceed: true,
      };
    }

    if (weather.temp <= WEATHER_THRESHOLDS.tempCautionCold) {
      return {
        severity: "warning",
        reason: `Cold weather: ${weather.temp}°F`,
        recommendation:
          "Ensure proper warm-up and wear layers. Watch for signs of hypothermia.",
        canProceed: true,
      };
    }

    // Check wind caution
    if (
      weather.windSpeed &&
      weather.windSpeed >= WEATHER_THRESHOLDS.windCaution
    ) {
      return {
        severity: "warning",
        reason: `Windy conditions: ${weather.windSpeed} mph`,
        recommendation:
          "Wind may affect throwing accuracy. Adjust drills accordingly.",
        canProceed: true,
      };
    }

    return null;
  }

  /**
   * Cancel a session due to weather and generate substitute workout
   */
  cancelSessionForWeather(
    sessionId: string,
    session: WeatherSensitiveSession,
    weather: WeatherData,
  ): Observable<SubstituteWorkout | null> {
    const user = this.supabaseService.currentUser();
    if (!user?.id) {
      this.logger.error("Cannot cancel session: No user logged in");
      return of(null);
    }

    this._isGeneratingSubstitute.set(true);

    // First, generate the substitute workout
    return this.generateSubstituteWorkout(session, weather, "weather").pipe(
      switchMap((substitute) => {
        if (!substitute) {
          return of(null);
        }

        // Save substitute to database
        return from(
          this.supabaseService.client
            .from("substitute_workouts")
            .insert({
              user_id: user.id,
              original_session_id: sessionId,
              original_session_type: session.sessionType,
              workout_name: substitute.workoutName,
              workout_type: substitute.workoutType,
              location_type: substitute.locationType,
              duration_minutes: substitute.durationMinutes,
              intensity_level: substitute.intensityLevel,
              description: substitute.description,
              warm_up: substitute.warmUp,
              main_workout: substitute.mainWorkout,
              cool_down: substitute.coolDown,
              equipment_needed: substitute.equipmentNeeded,
              cancellation_reason: "weather",
              weather_at_cancellation: weather,
              training_goals: substitute.trainingGoals,
              target_muscle_groups: substitute.targetMuscleGroups,
              status: "suggested",
            })
            .select()
            .single(),
        ).pipe(
          switchMap(({ data: savedSubstitute, error: insertError }) => {
            if (insertError) {
              this.logger.error(
                "Failed to save substitute workout:",
                toLogContext(insertError),
              );
              // Still return the generated substitute even if save failed
              return of(substitute);
            }

            // Update the original session with cancellation info
            return from(
              this.supabaseService.client
                .from("training_sessions")
                .update({
                  cancellation_reason: "weather",
                  cancelled_at: new Date().toISOString(),
                  weather_conditions: weather,
                  substitute_workout_id: savedSubstitute?.id,
                  status: "cancelled",
                })
                .eq("id", sessionId),
            ).pipe(
              map(() => {
                const result = {
                  ...substitute,
                  id: savedSubstitute?.id,
                  status: "suggested" as const,
                };
                this._suggestedSubstitute.set(result);
                return result;
              }),
              catchError((updateError) => {
                this.logger.warn(
                  "Failed to update original session:",
                  toLogContext(updateError),
                );
                return of({ ...substitute, id: savedSubstitute?.id });
              }),
            );
          }),
        );
      }),
      tap(() => this._isGeneratingSubstitute.set(false)),
      catchError((error) => {
        this.logger.error("Error in cancel session flow:", toLogContext(error));
        this._isGeneratingSubstitute.set(false);
        return of(null);
      }),
    );
  }

  /**
   * Generate an AI-powered substitute workout
   */
  generateSubstituteWorkout(
    originalSession: WeatherSensitiveSession,
    weather: WeatherData | null,
    reason: "weather" | "injury" | "facility_closed" | "other",
  ): Observable<SubstituteWorkout | null> {
    // Determine workout type based on what's available
    const workoutType = this.determineSubstituteType(originalSession);
    const locationType = this.determineLocation(workoutType);

    // Try AI-powered generation first (requires consent)
    return from(this.privacySettingsService.requireAiConsent()).pipe(
      switchMap(() =>
        of(
          this.generateLocalSubstitute(
            originalSession,
            weather,
            reason,
            workoutType,
            locationType,
          ),
        ),
      ),
      catchError(() => {
        // Fallback to local generation if consent is not given.
        this.logger.info(
          "Using local substitute workout generation",
        );
        return of(
          this.generateLocalSubstitute(
            originalSession,
            weather,
            reason,
            workoutType,
            locationType,
          ),
        );
      }),
    );
  }

  /**
   * Generate a substitute workout locally (fallback when AI unavailable)
   */
  private generateLocalSubstitute(
    originalSession: WeatherSensitiveSession,
    weather: WeatherData | null,
    reason: string,
    workoutType: SubstituteWorkout["workoutType"],
    locationType: SubstituteWorkout["locationType"],
  ): SubstituteWorkout {
    const sessionType = originalSession.sessionType.toLowerCase();
    const isTeamPractice = originalSession.isTeamPractice;

    // Determine training goals based on original session
    const trainingGoals = this.mapSessionTypeToGoals(
      sessionType,
      isTeamPractice,
    );
    const targetMuscleGroups = this.mapSessionTypeToMuscleGroups(sessionType);

    // Generate appropriate exercises
    const exercises = this.generateExercisesForGoals(
      trainingGoals,
      workoutType,
      originalSession.durationMinutes,
    );

    const workoutName = isTeamPractice
      ? `Indoor Flag Football Skills (Weather Substitute)`
      : `${this.capitalizeFirst(sessionType)} Alternative (${this.capitalizeFirst(workoutType)})`;

    return {
      workoutName,
      workoutType,
      locationType,
      durationMinutes: Math.min(originalSession.durationMinutes, 60), // Cap at 60 for indoor
      intensityLevel: "moderate",
      description: this.generateDescription(originalSession, reason, weather),
      warmUp: this.generateWarmUp(workoutType, sessionType),
      mainWorkout: exercises,
      coolDown: this.generateCoolDown(workoutType),
      equipmentNeeded: this.getEquipmentForType(workoutType, exercises),
      cancellationReason: reason,
      trainingGoals,
      targetMuscleGroups,
      weatherAtCancellation: weather || undefined,
      status: "suggested",
    };
  }

  /**
   * Map session type to training goals
   */
  private mapSessionTypeToGoals(
    sessionType: string,
    isTeamPractice: boolean,
  ): string[] {
    if (isTeamPractice) {
      return [
        "route running technique",
        "hand-eye coordination",
        "agility",
        "reaction time",
        "football IQ",
      ];
    }

    const goalMap: Record<string, string[]> = {
      practice: ["skills", "coordination", "agility", "endurance"],
      speed: ["acceleration", "top speed", "power", "explosiveness"],
      power: ["strength", "explosiveness", "power output"],
      conditioning: ["endurance", "cardio", "stamina", "work capacity"],
      recovery: ["mobility", "flexibility", "blood flow", "muscle recovery"],
      strength: ["muscle strength", "power", "stability"],
    };

    for (const [type, goals] of Object.entries(goalMap)) {
      if (sessionType.includes(type)) {
        return goals;
      }
    }

    return ["general fitness", "maintenance", "skill work"];
  }

  /**
   * Map session type to target muscle groups
   */
  private mapSessionTypeToMuscleGroups(sessionType: string): string[] {
    const muscleMap: Record<string, string[]> = {
      practice: ["legs", "core", "shoulders", "back"],
      speed: ["quads", "hamstrings", "glutes", "calves", "hip flexors"],
      power: ["quads", "glutes", "core", "shoulders"],
      conditioning: ["full body", "cardiovascular system"],
      recovery: ["all major muscle groups"],
      strength: ["legs", "core", "upper body"],
    };

    for (const [type, muscles] of Object.entries(muscleMap)) {
      if (sessionType.toLowerCase().includes(type)) {
        return muscles;
      }
    }

    return ["full body"];
  }

  /**
   * Generate exercises based on training goals
   */
  private generateExercisesForGoals(
    goals: string[],
    workoutType: SubstituteWorkout["workoutType"],
    targetDuration: number,
  ): SubstituteExercise[] {
    const exercises: SubstituteExercise[] = [];

    // Flag football specific drills (can be done indoors)
    const flagFootballDrills: SubstituteExercise[] = [
      {
        name: "Cone Route Running",
        category: "Skills",
        sets: 4,
        reps: "5 routes each direction",
        intensity: "high",
        description:
          "Set up cones in slant, out, and comeback patterns. Focus on sharp cuts and acceleration.",
        equipment: ["cones"],
        alternatives: ["Line drills without cones"],
      },
      {
        name: "Wall Ball Catching Drill",
        category: "Skills",
        sets: 3,
        reps: "20 catches",
        intensity: "moderate",
        description:
          "Throw football against wall and catch. Vary angles and distances.",
        equipment: ["football", "wall"],
        alternatives: ["Partner catch if available"],
      },
      {
        name: "Ladder Agility Drills",
        category: "Agility",
        sets: 4,
        reps: "2 lengths each pattern",
        intensity: "high",
        description:
          "Ickey shuffle, in-out, lateral runs. Focus on quick feet and body control.",
        equipment: ["agility ladder"],
        alternatives: ["Floor tape ladder", "Imaginary ladder"],
      },
      {
        name: "Backpedal to Sprint",
        category: "Speed",
        sets: 6,
        reps: "15 yards each",
        intensity: "high",
        description:
          "Backpedal 5 yards, open hips, sprint 10 yards. Simulates defensive coverage.",
        equipment: [],
        alternatives: [],
      },
      {
        name: "Flag Pull Reaction Drill",
        category: "Skills",
        durationSeconds: 120,
        intensity: "moderate",
        description:
          "Practice flag pulling motion with resistance band or solo. Focus on hand speed and accuracy.",
        equipment: ["resistance band"],
        alternatives: ["Shadow flag pulls"],
      },
    ];

    // Bodyweight exercises for general conditioning
    const bodyweightExercises: SubstituteExercise[] = [
      {
        name: "Jump Squats",
        category: "Power",
        sets: 4,
        reps: "12",
        restSeconds: 45,
        intensity: "high",
        description: "Explosive squat jumps focusing on maximum height.",
        equipment: [],
      },
      {
        name: "Lateral Bounds",
        category: "Agility",
        sets: 3,
        reps: "10 each side",
        restSeconds: 30,
        intensity: "high",
        description: "Single-leg lateral jumps for change of direction power.",
        equipment: [],
      },
      {
        name: "Mountain Climbers",
        category: "Conditioning",
        durationSeconds: 45,
        sets: 4,
        restSeconds: 15,
        intensity: "high",
        description: "Fast-paced for cardio and core engagement.",
        equipment: [],
      },
      {
        name: "Plank with Shoulder Taps",
        category: "Core",
        durationSeconds: 45,
        sets: 3,
        restSeconds: 30,
        intensity: "moderate",
        description: "Core stability with anti-rotation component.",
        equipment: [],
      },
      {
        name: "Burpees",
        category: "Conditioning",
        sets: 4,
        reps: "10",
        restSeconds: 45,
        intensity: "high",
        description: "Full body conditioning exercise.",
        equipment: [],
      },
      {
        name: "Single Leg RDL",
        category: "Strength",
        sets: 3,
        reps: "10 each leg",
        restSeconds: 30,
        intensity: "moderate",
        description: "Balance and hamstring/glute activation.",
        equipment: [],
        alternatives: ["Use dumbbell for added resistance"],
      },
    ];

    // Gym exercises (if gym available)
    const gymExercises: SubstituteExercise[] = [
      {
        name: "Box Jumps",
        category: "Power",
        sets: 4,
        reps: "8",
        restSeconds: 60,
        intensity: "high",
        description: "Explosive hip extension and landing mechanics.",
        equipment: ["plyo box"],
      },
      {
        name: "Trap Bar Deadlift",
        category: "Strength",
        sets: 4,
        reps: "6",
        restSeconds: 90,
        intensity: "high",
        description: "Lower body power development.",
        equipment: ["trap bar", "weights"],
      },
      {
        name: "Cable Rotation",
        category: "Core",
        sets: 3,
        reps: "12 each side",
        restSeconds: 45,
        intensity: "moderate",
        description: "Rotational power for throwing.",
        equipment: ["cable machine"],
      },
      {
        name: "Treadmill Sprints",
        category: "Speed",
        sets: 8,
        durationSeconds: 20,
        restSeconds: 40,
        intensity: "high",
        description: "Sprint intervals at 10-12% incline.",
        equipment: ["treadmill"],
      },
    ];

    // Select exercises based on workout type and goals
    const hasSkillGoals = goals.some((g) =>
      ["route running", "coordination", "agility", "skills"].some((skill) =>
        g.toLowerCase().includes(skill),
      ),
    );

    if (hasSkillGoals) {
      // Add flag football specific drills
      exercises.push(...flagFootballDrills.slice(0, 3));
    }

    if (workoutType === "gym") {
      exercises.push(...gymExercises.slice(0, 3));
    } else {
      // Home or bodyweight
      exercises.push(...bodyweightExercises.slice(0, 4));
    }

    // Ensure we have enough exercises for target duration
    const estimatedTime = exercises.reduce((total, ex) => {
      const exerciseTime = ex.sets
        ? ex.sets * (ex.durationSeconds || 30) +
          (ex.restSeconds || 30) * (ex.sets - 1)
        : ex.durationSeconds || 60;
      return total + exerciseTime / 60;
    }, 0);

    // Add more exercises if needed
    if (estimatedTime < targetDuration * 0.6) {
      const additionalExercises =
        workoutType === "gym"
          ? gymExercises.slice(3)
          : bodyweightExercises.slice(4);
      exercises.push(...additionalExercises);
    }

    return exercises;
  }

  /**
   * Generate warm-up protocol
   */
  private generateWarmUp(
    workoutType: SubstituteWorkout["workoutType"],
    sessionType: string,
  ): string {
    const baseWarmUp = `
5-7 minutes dynamic warm-up:
- Light jog or jumping jacks (2 min)
- Leg swings (forward/back and side-to-side, 10 each)
- Walking lunges with rotation (10 each leg)
- High knees (30 seconds)
- Butt kicks (30 seconds)
- Arm circles and shoulder rolls
    `.trim();

    if (sessionType.toLowerCase().includes("speed")) {
      return (
        baseWarmUp +
        `
- A-skips and B-skips (20 yards each)
- Build-up sprints (3 x 40 yards at 50%, 70%, 85%)
      `.trim()
      );
    }

    return baseWarmUp;
  }

  /**
   * Generate cool-down protocol
   */
  private generateCoolDown(
    _workoutType: SubstituteWorkout["workoutType"],
  ): string {
    return `
5-10 minutes cool-down:
- Light walk or slow jog (2-3 min)
- Static stretching:
  - Hamstring stretch (30 sec each leg)
  - Quad stretch (30 sec each leg)
  - Hip flexor stretch (30 sec each side)
  - Calf stretch (30 sec each leg)
  - Shoulder/chest stretch (30 sec)
- Deep breathing exercises (1-2 min)
- Hydrate and refuel within 30 minutes
    `.trim();
  }

  /**
   * Generate description based on context
   */
  private generateDescription(
    originalSession: WeatherSensitiveSession,
    reason: string,
    weather: WeatherData | null,
  ): string {
    const weatherInfo = weather
      ? ` Current conditions: ${weather.temp}°F, ${weather.condition}.`
      : "";

    if (originalSession.isTeamPractice) {
      return `This indoor workout replaces your scheduled team practice due to ${reason}.${weatherInfo} 
      
Focus on individual skill development that you can work on solo. Practice route running footwork, ball handling, and conditioning to stay sharp for your next team session.`;
    }

    return `This workout is designed as an alternative to your scheduled ${originalSession.sessionType} session, which was cancelled due to ${reason}.${weatherInfo}
    
The exercises are selected to maintain your training goals while adapting to indoor/limited equipment conditions.`;
  }

  /**
   * Determine best substitute workout type
   */
  private determineSubstituteType(
    session: WeatherSensitiveSession,
  ): SubstituteWorkout["workoutType"] {
    // For team practice, prefer indoor skills work
    if (session.isTeamPractice) {
      return "indoor";
    }

    // For speed/power work, prefer gym if available
    if (
      session.sessionType.toLowerCase().includes("speed") ||
      session.sessionType.toLowerCase().includes("power")
    ) {
      return "gym";
    }

    // Default to home/bodyweight
    return "home";
  }

  /**
   * Determine location type
   */
  private determineLocation(
    workoutType: SubstituteWorkout["workoutType"],
  ): SubstituteWorkout["locationType"] {
    switch (workoutType) {
      case "gym":
        return "gym";
      case "indoor":
        return "indoor_facility";
      default:
        return "home";
    }
  }

  /**
   * Get equipment needed for exercises
   */
  private getEquipmentForType(
    workoutType: SubstituteWorkout["workoutType"],
    exercises: SubstituteExercise[],
  ): string[] {
    const equipmentSet = new Set<string>();

    for (const exercise of exercises) {
      if (exercise.equipment) {
        exercise.equipment.forEach((eq) => equipmentSet.add(eq));
      }
    }

    // Add common equipment based on type
    if (workoutType === "home") {
      equipmentSet.add("yoga mat");
      equipmentSet.add("water bottle");
    }

    if (workoutType === "gym") {
      equipmentSet.add("towel");
      equipmentSet.add("water bottle");
    }

    return Array.from(equipmentSet);
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Accept a suggested substitute workout
   */
  acceptSubstituteWorkout(workoutId: string): Observable<boolean> {
    return from(
      this.supabaseService.client
        .from("substitute_workouts")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
        })
        .eq("id", workoutId),
    ).pipe(
      map(({ error }) => {
        if (error) {
          this.logger.error(
            "Failed to accept substitute:",
            toLogContext(error),
          );
          return false;
        }
        // Update local state
        const current = this._suggestedSubstitute();
        if (current?.id === workoutId) {
          this._suggestedSubstitute.set({ ...current, status: "accepted" });
        }
        return true;
      }),
      catchError(() => of(false)),
    );
  }

  /**
   * Mark substitute workout as completed
   */
  completeSubstituteWorkout(workoutId: string): Observable<boolean> {
    return from(
      this.supabaseService.client
        .from("substitute_workouts")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", workoutId),
    ).pipe(
      map(({ error }) => {
        if (error) {
          this.logger.error(
            "Failed to complete substitute:",
            toLogContext(error),
          );
          return false;
        }
        this._suggestedSubstitute.set(null);
        return true;
      }),
      catchError(() => of(false)),
    );
  }

  /**
   * Decline a suggested substitute workout
   */
  declineSubstituteWorkout(workoutId: string): Observable<boolean> {
    return from(
      this.supabaseService.client
        .from("substitute_workouts")
        .update({ status: "declined" })
        .eq("id", workoutId),
    ).pipe(
      map(({ error }) => {
        if (error) {
          this.logger.error(
            "Failed to decline substitute:",
            toLogContext(error),
          );
          return false;
        }
        this._suggestedSubstitute.set(null);
        return true;
      }),
      catchError(() => of(false)),
    );
  }

  /**
   * Get today's weather-sensitive sessions
   */
  getTodaysWeatherSensitiveSessions(): Observable<WeatherSensitiveSession[]> {
    return from(this.loadTodaysWeatherSensitiveSessions()).pipe(
      catchError((error) => {
        this.logger.warn(
          "Failed to load today's weather-sensitive sessions:",
          toLogContext(error),
        );
        return of([]);
      }),
    );
  }

  private async loadTodaysWeatherSensitiveSessions(): Promise<
    WeatherSensitiveSession[]
  > {
    const user = this.supabaseService.currentUser();
    if (!user?.id) {
      return [];
    }

    const today = new Date();
    const todayKey = this.toLocalDateKey(today);
    const todayDayOfWeek = today.getDay();

    const assignmentResponse = await firstValueFrom(
      this.apiService.get<PlayerProgramAssignmentResponse>(
        "/api/player-programs/me",
      ),
    );
    const assignmentPayload = extractApiPayload<PlayerProgramAssignmentResponse>(
      assignmentResponse,
    );
    const activeProgramId = assignmentPayload?.assignment?.program_id;

    if (!activeProgramId) {
      return [];
    }

    const programResponse = await firstValueFrom(
      this.apiService.get<TrainingProgramDetailsResponse>(
        "/api/training-programs",
        {
          id: activeProgramId,
          full: true,
        },
      ),
    );
    const program =
      extractApiPayload<TrainingProgramDetailsResponse>(programResponse)?.data;

    return (
      program?.training_phases
        ?.flatMap((phase) => phase.weeks ?? [])
        .filter(
          (week) => week.start_date <= todayKey && week.end_date >= todayKey,
        )
        .flatMap((week) => week.sessions ?? [])
        .filter(
          (session) =>
            session.weather_sensitive === true &&
            session.day_of_week === todayDayOfWeek,
        )
        .sort((a, b) => (a.session_order ?? 0) - (b.session_order ?? 0))
        .map((session) => ({
          id: session.id,
          sessionName: session.session_name || "Training Session",
          sessionType: session.session_type || "training",
          isOutdoor: session.is_outdoor === true,
          isTeamPractice: session.is_team_practice === true,
          weatherSensitive: session.weather_sensitive === true,
          durationMinutes: session.duration_minutes ?? 0,
          description: session.description || undefined,
          equipmentNeeded: session.equipment_needed ?? undefined,
        })) ?? []
    );
  }

  private toLocalDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  /**
   * Clear current weather alert
   */
  clearWeatherAlert(): void {
    this._weatherAlert.set(null);
  }

  /**
   * Clear suggested substitute
   */
  clearSuggestedSubstitute(): void {
    this._suggestedSubstitute.set(null);
  }
}
