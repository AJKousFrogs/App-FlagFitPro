import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable, of, catchError, map } from "rxjs";
import { AuthService } from "./auth.service";
import { LoggerService } from "./logger.service";
import { environment } from "../../../environments/environment";

export interface WarmupPhase {
  name: string;
  duration: number;
  exercises: WarmupExercise[];
}

export interface WarmupExercise {
  name: string;
  duration?: string;
  sets?: number;
  reps?: number | string;
  distance?: string;
  focus?: string;
  intensity?: string;
  variations?: string[];
  movements?: string[];
  breakdown?: Array<{ variation: string; duration: string }>;
}

export interface WarmupProtocol {
  title: string;
  totalDuration: number;
  phases: WarmupPhase[];
}

export interface PlyometricExercise {
  id: string;
  exercise_name: string;
  exercise_category: string;
  difficulty_level: string;
  description: string;
  instructions: string[];
  intensity_level: string;
  volume_recommendations: string[];
  rest_periods: string[];
  progression_guidelines: string[];
  safety_notes: string[];
  contraindications: string[];
  proper_form_guidelines: string[];
  common_mistakes: string[];
  applicable_sports: string[];
  equipment_needed: string[];
  effectiveness_rating: number;
  performance_improvements: Record<string, string>;
  injury_risk_rating: string;
  recommended_contacts: number;
  session_sets: number;
  session_reps: number;
}

export interface IsometricExercise {
  id: string;
  name: string;
  description: string;
  category: string;
  muscle_groups: string[];
  protocol_type: string;
  recommended_duration_seconds: number;
  recommended_sets: number;
  rest_period_seconds: number;
  intensity_percentage: number;
  difficulty_level: string;
  equipment_required: string[];
  setup_instructions: string;
  execution_cues: string[];
  safety_notes: string;
  research_studies: string[];
  evidence_level: string;
  lifting_synergy_exercises: string[];
  injury_prevention_benefits: string[];
  session_duration: number;
  session_sets: number;
  rest_between_sets: number;
}

export interface ScheduleBlock {
  block: string;
  duration: number;
  completed: boolean;
  protocol?: WarmupProtocol;
  exercises?: PlyometricExercise[] | IsometricExercise[];
  totalContacts?: number;
  totalDuration?: number;
  notes?: string;
  purpose?: string;
  type?: string;
  focus?: string[];
  activities?: string[];
}

export interface TrainingStatus {
  phase: string;
  acwr: number;
  acwrStatus: string;
  recentSessions: number;
}

export interface SeasonalContext {
  month: number;
  season: string;
  primaryFocus: string;
  secondaryFocus?: string;
  outdoorSprintSuitable: boolean;
  coachingNotes?: string;
  injuryPreventionFocus?: string[];
}

export interface PlayerContext {
  position: string;
  experienceLevel: string;
  primaryGoal?: string;
  trainingDaysPerWeek?: number;
  hasGymAccess?: boolean;
  hasOutdoorSpace?: boolean;
  previousInjuries?: string[];
}

export interface TodaysPractice {
  sessionType: string;
  focus: string[];
  totalDuration: number;
  schedule: ScheduleBlock[];
}

export interface DailyTrainingResponse {
  greeting: string;
  date: string;
  dayOfWeek: string;
  seasonalContext?: SeasonalContext;
  trainingStatus: TrainingStatus;
  playerContext?: PlayerContext;
  todaysPractice: TodaysPractice;
  motivationalMessage: string;
}

@Injectable({
  providedIn: "root",
})
export class DailyTrainingService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private logger = inject(LoggerService);

  private readonly apiUrl = environment.apiUrl || "/.netlify/functions";

  /**
   * Get personalized daily training plan
   */
  getDailyTraining(): Observable<DailyTrainingResponse> {
    const token = this.authService.getToken();

    if (!token) {
      this.logger.warn("[DailyTraining] No auth token, returning mock data");
      return of(this.getMockDailyTraining());
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    });

    return this.http
      .get<DailyTrainingResponse>(`${this.apiUrl}/daily-training`, { headers })
      .pipe(
        map((response) => {
          this.logger.info("[DailyTraining] Received training plan from API");
          return response;
        }),
        catchError((error) => {
          this.logger.error("[DailyTraining] API error, using mock data", error);
          return of(this.getMockDailyTraining());
        })
      );
  }

  /**
   * Update training progress (mark blocks as complete)
   */
  updateTrainingProgress(
    updates: Record<string, boolean | number | string>
  ): Observable<{ success: boolean; message: string }> {
    const token = this.authService.getToken();

    if (!token) {
      this.logger.warn("[DailyTraining] No auth token for update");
      return of({ success: false, message: "Not authenticated" });
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    });

    return this.http
      .post<{ success: boolean; message: string }>(
        `${this.apiUrl}/daily-training`,
        updates,
        { headers }
      )
      .pipe(
        catchError((error) => {
          this.logger.error("[DailyTraining] Error updating progress", error);
          return of({ success: false, message: error.message });
        })
      );
  }

  /**
   * Get plyometric exercises from database
   */
  getPlyometricExercises(
    difficulty?: string,
    limit = 6
  ): Observable<PlyometricExercise[]> {
    const token = this.authService.getToken();

    if (!token) {
      return of(this.getMockPlyometrics());
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    const params: Record<string, string> = { limit: limit.toString() };
    if (difficulty) {
      params["difficulty"] = difficulty;
    }

    return this.http
      .get<PlyometricExercise[]>(`${this.apiUrl}/plyometrics`, {
        headers,
        params,
      })
      .pipe(
        catchError(() => {
          return of(this.getMockPlyometrics());
        })
      );
  }

  /**
   * Get isometric exercises from database
   */
  getIsometricExercises(
    category?: string,
    limit = 6
  ): Observable<IsometricExercise[]> {
    const token = this.authService.getToken();

    if (!token) {
      return of(this.getMockIsometrics());
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    const params: Record<string, string> = { limit: limit.toString() };
    if (category) {
      params["category"] = category;
    }

    return this.http
      .get<IsometricExercise[]>(`${this.apiUrl}/isometrics`, {
        headers,
        params,
      })
      .pipe(
        catchError(() => {
          return of(this.getMockIsometrics());
        })
      );
  }

  /**
   * Mock data for development/fallback
   */
  private getMockDailyTraining(): DailyTrainingResponse {
    const today = new Date();
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    return {
      greeting: `Good ${this.getTimeOfDay()}, Player!`,
      date: today.toISOString().split("T")[0],
      dayOfWeek: dayNames[today.getDay()],
      trainingStatus: {
        phase: "Power Development",
        acwr: 0.95,
        acwrStatus: "Optimal training zone",
        recentSessions: 12,
      },
      todaysPractice: {
        sessionType: "Power",
        focus: ["Explosive power", "Reactive strength", "Jump ability"],
        totalDuration: 90,
        schedule: [
          {
            block: "Warm-Up",
            duration: 20,
            completed: false,
            protocol: {
              title: "Universal Warm-Up Protocol",
              totalDuration: 20,
              phases: [
                {
                  name: "Phase 1: Cardiovascular Prep & Core",
                  duration: 8,
                  exercises: [
                    { name: "Light jog", duration: "2 min", intensity: "50-60%" },
                    {
                      name: "Jump rope",
                      duration: "5 min",
                      intensity: "Moderate-High",
                      variations: ["Basic bounce", "Alternating feet", "High knees", "Fast singles"],
                    },
                    {
                      name: "Plank series",
                      duration: "3 min",
                      breakdown: [
                        { variation: "Standard plank", duration: "1.5 min" },
                        { variation: "Right side plank", duration: "45s" },
                        { variation: "Left side plank", duration: "45s" },
                      ],
                    },
                  ],
                },
                {
                  name: "Phase 2: Resistance Band Activation",
                  duration: 5,
                  exercises: [
                    { name: "Band pull-aparts", sets: 2, reps: 15, focus: "Upper back" },
                    { name: "Band external rotations", sets: 2, reps: "10 each", focus: "Rotator cuff" },
                    { name: "Band monster walks", sets: 2, distance: "10m each way", focus: "Glutes" },
                    { name: "Band squats", sets: 2, reps: 10, focus: "Glute activation" },
                    { name: "Band hip flexor march", sets: 2, reps: "10 each", focus: "Hip flexors" },
                    { name: "Band glute bridges", sets: 2, reps: 10, focus: "Glute activation" },
                  ],
                },
                {
                  name: "Phase 3: Dynamic Stretching & Mobility",
                  duration: 4,
                  exercises: [
                    {
                      name: "Dynamic stretching sequence",
                      duration: "2 min",
                      movements: ["Arm circles", "Leg swings", "Torso rotations", "Hip circles"],
                    },
                    { name: "Copenhagen plank", duration: "45s each side", focus: "Adductors" },
                    { name: "World's greatest stretch", reps: "3 each side", focus: "Full body" },
                  ],
                },
                {
                  name: "Phase 4: Final Movement Prep",
                  duration: 3,
                  exercises: [
                    { name: "Ankle circles + Calf raises", reps: "10 each" },
                    { name: "Walking lunges", reps: "10 each leg" },
                    { name: "Bodyweight squats", reps: 10 },
                    { name: "Single-leg balance", duration: "20s each" },
                  ],
                },
              ],
            },
          },
          {
            block: "Plyometrics",
            duration: 15,
            completed: false,
            exercises: this.getMockPlyometrics(),
            totalContacts: 80,
            notes: "Full plyometric session - focus on quality",
          },
          {
            block: "Isometrics",
            duration: 10,
            completed: false,
            exercises: this.getMockIsometrics(),
            totalDuration: 180,
            purpose: "Pre-activation and stability",
          },
          {
            block: "Main Session",
            duration: 35,
            completed: false,
            type: "power",
            focus: ["Explosive power", "Reactive strength", "Jump ability"],
          },
          {
            block: "Cool-Down",
            duration: 10,
            completed: false,
            activities: [
              "Light jog (2 min)",
              "Static stretching (5 min)",
              "Foam rolling (3 min)",
            ],
          },
        ],
      },
      motivationalMessage:
        "Power up! Today we build game-changing explosiveness.",
    };
  }

  private getMockPlyometrics(): PlyometricExercise[] {
    return [
      {
        id: "1",
        exercise_name: "Box Jump",
        exercise_category: "lower_body",
        difficulty_level: "intermediate",
        description:
          "A plyometric exercise where the athlete jumps onto a box or platform, focusing on explosive power development and landing mechanics.",
        instructions: [
          "Stand facing a box or platform",
          "Assume athletic stance with feet shoulder-width apart",
          "Swing arms back and bend knees",
          "Jump explosively onto the box",
          "Land softly with both feet",
          "Step down and repeat",
        ],
        intensity_level: "moderate",
        volume_recommendations: ["3-5 sets of 5-10 repetitions"],
        rest_periods: ["2-3 minutes between sets"],
        progression_guidelines: ["Start with low box heights", "Increase height as technique improves"],
        safety_notes: ["Ensure box is stable", "Focus on landing mechanics", "Step down, don't jump down"],
        contraindications: ["Lower extremity injuries", "Poor balance"],
        proper_form_guidelines: ["Land with both feet simultaneously", "Absorb landing with knees"],
        common_mistakes: ["Jumping down from the box", "Landing with one foot first"],
        applicable_sports: ["basketball", "volleyball", "flag_football"],
        equipment_needed: ["plyometric_box"],
        effectiveness_rating: 8,
        performance_improvements: { vertical_jump: "6-12% improvement" },
        injury_risk_rating: "low",
        recommended_contacts: 30,
        session_sets: 3,
        session_reps: 5,
      },
      {
        id: "2",
        exercise_name: "Lateral Bounds",
        exercise_category: "lower_body",
        difficulty_level: "intermediate",
        description:
          "Side-to-side explosive jumps to develop lateral power and stability. Essential for flag football cutting and change of direction.",
        instructions: [
          "Start in athletic stance",
          "Push off explosively to the side",
          "Land on the outside foot",
          "Immediately push back to starting position",
          "Focus on control and power",
        ],
        intensity_level: "moderate",
        volume_recommendations: ["3-4 sets of 8-10 bounds per side"],
        rest_periods: ["2-3 minutes between sets"],
        progression_guidelines: ["Start with shorter distances", "Progress distance gradually"],
        safety_notes: ["Requires good lateral stability", "Control landing carefully"],
        contraindications: ["Groin strain", "Ankle instability"],
        proper_form_guidelines: ["Push through the ground", "Land with knee over toe"],
        common_mistakes: ["Collapsing inward on landing", "Insufficient push-off"],
        applicable_sports: ["basketball", "football", "flag_football"],
        equipment_needed: ["flat_surface"],
        effectiveness_rating: 9,
        performance_improvements: { lateral_power: "12-18% improvement" },
        injury_risk_rating: "moderate",
        recommended_contacts: 30,
        session_sets: 3,
        session_reps: 8,
      },
      {
        id: "3",
        exercise_name: "Pogo Jumps",
        exercise_category: "lower_body",
        difficulty_level: "beginner",
        description:
          "Quick, low-amplitude jumps focusing on ankle stiffness and ground contact time. Foundation exercise for all plyometric training.",
        instructions: [
          "Stand with feet hip-width apart",
          "Jump continuously using ankle power",
          "Minimize knee bend",
          "Focus on quick ground contact",
          "Keep body upright throughout",
        ],
        intensity_level: "low",
        volume_recommendations: ["3-4 sets of 20-30 jumps"],
        rest_periods: ["60-90 seconds between sets"],
        progression_guidelines: ["Progress to faster tempo", "Add height gradually"],
        safety_notes: ["Low injury risk", "Good for all levels"],
        contraindications: ["Acute ankle injury"],
        proper_form_guidelines: ["Stay on balls of feet", "Keep ankles stiff"],
        common_mistakes: ["Too much knee bend", "Landing flat-footed"],
        applicable_sports: ["all_sports", "flag_football"],
        equipment_needed: [],
        effectiveness_rating: 7,
        performance_improvements: { ankle_stiffness: "15-20% improvement" },
        injury_risk_rating: "low",
        recommended_contacts: 20,
        session_sets: 2,
        session_reps: 20,
      },
    ];
  }

  private getMockIsometrics(): IsometricExercise[] {
    return [
      {
        id: "1",
        name: "Wall Squat Hold",
        description:
          "Isometric squat position against a wall to develop quadriceps and glute strength. Foundation exercise for lower body stability.",
        category: "lower_body",
        muscle_groups: ["quadriceps", "glutes", "hamstrings"],
        protocol_type: "yielding",
        recommended_duration_seconds: 30,
        recommended_sets: 3,
        rest_period_seconds: 60,
        intensity_percentage: 70,
        difficulty_level: "beginner",
        equipment_required: ["wall"],
        setup_instructions:
          "Stand with back against wall, feet shoulder-width apart, slide down until thighs are parallel to ground",
        execution_cues: ["Press back firmly into wall", "Keep knees over ankles", "Breathe normally", "Engage core"],
        safety_notes: "Maintain normal breathing, avoid breath-holding",
        research_studies: ["McBride et al., 2010"],
        evidence_level: "strong",
        lifting_synergy_exercises: ["squats", "deadlifts"],
        injury_prevention_benefits: ["Builds quad endurance", "Improves knee stability"],
        session_duration: 30,
        session_sets: 3,
        rest_between_sets: 60,
      },
      {
        id: "2",
        name: "Plank Hold",
        description:
          "Isometric core exercise to develop abdominal and back stability. Essential for all athletic movements.",
        category: "core",
        muscle_groups: ["rectus_abdominis", "transverse_abdominis", "erector_spinae"],
        protocol_type: "yielding",
        recommended_duration_seconds: 45,
        recommended_sets: 3,
        rest_period_seconds: 60,
        intensity_percentage: 60,
        difficulty_level: "beginner",
        equipment_required: [],
        setup_instructions:
          "Hold push-up position with forearms on ground, body straight from head to heels",
        execution_cues: ["Keep hips level", "Engage glutes", "Breathe steadily", "Look at floor"],
        safety_notes: "Keep hips level, avoid sagging or arching",
        research_studies: ["Oranchuk et al., 2019"],
        evidence_level: "strong",
        lifting_synergy_exercises: ["deadlifts", "squats"],
        injury_prevention_benefits: ["Improves core stability", "Reduces low back injury risk"],
        session_duration: 45,
        session_sets: 3,
        rest_between_sets: 60,
      },
      {
        id: "3",
        name: "Glute Bridge Hold",
        description:
          "Isometric hip extension hold to activate and strengthen glutes. Foundation for sprinting power.",
        category: "lower_body",
        muscle_groups: ["glutes", "hamstrings", "core"],
        protocol_type: "yielding",
        recommended_duration_seconds: 30,
        recommended_sets: 3,
        rest_period_seconds: 60,
        intensity_percentage: 65,
        difficulty_level: "beginner",
        equipment_required: [],
        setup_instructions:
          "Lie on back with knees bent, feet flat. Drive hips up and hold at top position.",
        execution_cues: ["Squeeze glutes at top", "Keep core engaged", "Don't hyperextend back", "Press through heels"],
        safety_notes: "Don't overarch lower back. Focus on glute activation.",
        research_studies: ["Contreras et al., 2015"],
        evidence_level: "strong",
        lifting_synergy_exercises: ["squats", "deadlifts", "hip_thrusts"],
        injury_prevention_benefits: ["Activates glutes for power", "Reduces hamstring strain risk"],
        session_duration: 30,
        session_sets: 3,
        rest_between_sets: 60,
      },
    ];
  }

  private getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 17) return "afternoon";
    return "evening";
  }
}
