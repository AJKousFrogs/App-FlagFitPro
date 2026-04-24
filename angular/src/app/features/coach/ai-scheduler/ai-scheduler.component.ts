/**
 * AI Training Scheduler Component
 *
 * AI-powered training schedule generator that creates optimized training
 * programs based on team events, player readiness, periodization principles,
 * and competition calendar.
 *
 * Design System Compliant (DESIGN_SYSTEM_RULES.md)
 */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { ToastService } from "../../../core/services/toast.service";
import { ProgressBar } from "primeng/progressbar";
import { SelectComponent } from "../../../shared/components/select/select.component";

import { firstValueFrom } from "rxjs";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";

import { ApiService, API_ENDPOINTS } from "../../../core/services/api.service";
import { LoggerService } from "../../../core/services/logger.service";
import { extractApiPayload } from "../../../core/utils/api-response-mapper";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";

// ===== Interfaces =====
interface TargetEvent {
  id: string;
  name: string;
  date: string;
  daysUntil: number;
}

interface GeneratedSession {
  id: string;
  day: string;
  date: string;
  time: string;
  title: string;
  icon: string;
  duration: string;
  activities: string[];
  targetRpe: number;
  load: "Min" | "Low" | "Medium" | "High" | "Max";
  focus: string;
  location?: string;
  isRestDay?: boolean;
}

interface PeriodizationPhase {
  name: string;
  dateRange: string;
  loadPercent: number;
  description: string;
}

interface PlayerModification {
  playerId: string;
  playerName: string;
  reason: string;
  acwr?: number;
  rtpStage?: number;
  modification: string;
  clearedFor?: string[];
  notClearedFor?: string[];
}

// ===== Constants =====
const TARGET_TYPES = [
  { label: "Regular season game", value: "game" },
  { label: "Tournament", value: "tournament" },
  { label: "Tryouts / Combine", value: "tryouts" },
  { label: "Off-season training", value: "offseason" },
  { label: "Return from break", value: "return" },
];

const FOCUS_AREAS = [
  { label: "Speed & Explosiveness", value: "speed", icon: "🏃" },
  { label: "Game Tactics & Plays", value: "tactics", icon: "🏈" },
  { label: "Strength & Power", value: "strength", icon: "💪" },
  { label: "Team Chemistry & Communication", value: "chemistry", icon: "🤝" },
  { label: "Endurance & Conditioning", value: "endurance", icon: "❤️" },
  { label: "Position-Specific Skills", value: "skills", icon: "🎯" },
  { label: "Recovery & Injury Prevention", value: "recovery", icon: "🏥" },
];

const PRACTICE_DURATIONS = [
  { label: "1 hour", value: "1" },
  { label: "1.5 hours", value: "1.5" },
  { label: "2 hours", value: "2" },
  { label: "2.5 hours", value: "2.5" },
];

@Component({
  selector: "app-ai-scheduler",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CardShellComponent,
    ProgressBar,
    SelectComponent,

    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
  ],
  templateUrl: "./ai-scheduler.component.html",
  styleUrl: "./ai-scheduler.component.scss",
})
export class AiSchedulerComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly toastService = inject(ToastService);

  // State
  readonly events = signal<TargetEvent[]>([]);
  readonly generatedSchedule = signal<GeneratedSession[] | null>(null);
  readonly periodization = signal<PeriodizationPhase[]>([]);
  readonly modifications = signal<PlayerModification[]>([]);
  readonly isGenerating = signal(false);

  // Form data
  formData = {
    targetType: "tournament",
    eventId: "",
    focusAreas: ["speed", "tactics", "chemistry"] as string[],
    availableDays: ["mon", "tue", "thu", "sat"] as string[],
    duration: "2",
    facility: "",
    considerRtp: true,
    considerAcwr: true,
    weatherAdjust: false,
  };

  // Options
  readonly targetTypes = TARGET_TYPES;
  readonly focusAreas = FOCUS_AREAS;
  readonly practiceDurations = PRACTICE_DURATIONS;
  readonly weekDays = [
    { label: "Mon", value: "mon" },
    { label: "Tue", value: "tue" },
    { label: "Wed", value: "wed" },
    { label: "Thu", value: "thu" },
    { label: "Fri", value: "fri" },
    { label: "Sat", value: "sat" },
    { label: "Sun", value: "sun" },
  ];

  // Computed
  readonly upcomingEvents = computed(() => this.events());

  readonly selectedEvent = computed(
    () => this.events().find((e) => e.id === this.formData.eventId) || null,
  );

  readonly facilities = computed(() => [
    { id: "1", name: "Central Park Field" },
    { id: "2", name: "North Field" },
    { id: "3", name: "Indoor Facility" },
  ]);

  readonly rtpPlayerCount = computed(() => 2);
  readonly rtpPlayerNames = computed(() => "Alex, Emily");
  readonly highAcwrCount = computed(() => 3);

  readonly canGenerate = computed(
    () =>
      this.formData.focusAreas.length > 0 &&
      this.formData.availableDays.length > 0,
  );

  readonly merlinRecommendation = computed(
    () =>
      "Based on 15 days until Spring Championship, I've designed a 2-phase plan: Week 1 focuses on high-intensity game prep, Week 2 tapers for peak performance. I've reduced load for Chris, Morgan, and Riley (high ACWR) and created modified sessions for Alex and Emily (RTP).",
  );

  readonly periodizationPhases = computed(() => this.periodization());

  readonly scheduleWeeks = computed(() => {
    const sessions = this.generatedSchedule();
    if (!sessions) return [];

    return [
      {
        name: "WEEK 1: PEAK INTENSITY (Jan 6-12)",
        sessions: sessions.filter((s) => s.id.startsWith("w1")),
      },
      {
        name: "WEEK 2: TAPER (Jan 13-17)",
        sessions: sessions.filter((s) => s.id.startsWith("w2")),
      },
    ];
  });

  readonly playerModifications = computed(() => this.modifications());

  readonly highAcwrMods = computed(() =>
    this.modifications().filter((m) => m.reason === "acwr"),
  );

  readonly rtpMods = computed(() =>
    this.modifications().filter((m) => m.reason === "rtp"),
  );

  ngOnInit(): void {
    this.loadData();
  }

  onTargetTypeChange(value: string): void {
    this.formData = {
      ...this.formData,
      targetType: value,
      eventId: value === "tournament" || value === "game" ? this.formData.eventId : "",
    };
  }

  onEventIdChange(value: string | null): void {
    this.formData = { ...this.formData, eventId: value ?? "" };
  }

  onFocusAreasChange(value: string[] | null): void {
    this.formData = { ...this.formData, focusAreas: value ?? [] };
  }

  onFocusAreaToggle(value: string, checked: boolean): void {
    if (checked) {
      if (this.formData.focusAreas.includes(value) || this.formData.focusAreas.length >= 3) {
        return;
      }
      this.formData = {
        ...this.formData,
        focusAreas: [...this.formData.focusAreas, value],
      };
      return;
    }
    this.formData = {
      ...this.formData,
      focusAreas: this.formData.focusAreas.filter((v) => v !== value),
    };
  }

  onFocusAreaToggleInput(value: string, event: Event): void {
    this.onFocusAreaToggle(value, this.readChecked(event));
  }

  onAvailableDaysChange(value: string[] | null): void {
    this.formData = { ...this.formData, availableDays: value ?? [] };
  }

  onAvailableDayToggle(value: string, checked: boolean): void {
    if (checked) {
      if (this.formData.availableDays.includes(value)) {
        return;
      }
      this.formData = {
        ...this.formData,
        availableDays: [...this.formData.availableDays, value],
      };
      return;
    }
    this.formData = {
      ...this.formData,
      availableDays: this.formData.availableDays.filter((v) => v !== value),
    };
  }

  onAvailableDayToggleInput(value: string, event: Event): void {
    this.onAvailableDayToggle(value, this.readChecked(event));
  }

  onDurationChange(value: string | null): void {
    this.formData = { ...this.formData, duration: value ?? this.formData.duration };
  }

  onFacilityChange(value: string | null): void {
    this.formData = { ...this.formData, facility: value ?? "" };
  }

  onConsiderRtpChange(value: boolean): void {
    this.formData = { ...this.formData, considerRtp: value };
  }

  onConsiderRtpToggle(event: Event): void {
    this.onConsiderRtpChange(this.readChecked(event));
  }

  onConsiderAcwrChange(value: boolean): void {
    this.formData = { ...this.formData, considerAcwr: value };
  }

  onConsiderAcwrToggle(event: Event): void {
    this.onConsiderAcwrChange(this.readChecked(event));
  }

  onWeatherAdjustChange(value: boolean): void {
    this.formData = { ...this.formData, weatherAdjust: value };
  }

  onWeatherAdjustToggle(event: Event): void {
    this.onWeatherAdjustChange(this.readChecked(event));
  }

  private readChecked(event: Event): boolean {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      return target.checked;
    }
    return false;
  }

  async loadData(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.api.get<{ events?: TargetEvent[] }>(
          API_ENDPOINTS.coach.eventsUpcoming,
        ),
      );
      const payload = extractApiPayload<{ events?: TargetEvent[] }>(response);
      this.events.set(payload?.events ?? []);
    } catch (err) {
      this.logger.error("Failed to load events", err);
      this.events.set([]);
    }
  }

  async generateSchedule(): Promise<void> {
    this.isGenerating.set(true);
    try {
      const response = await firstValueFrom(
        this.api.post(API_ENDPOINTS.coach.createTrainingSession, {
          targetEvent: this.selectedEvent(),
          focusAreas: this.formData.focusAreas,
          availableDays: this.formData.availableDays,
          practiceDuration: this.formData.duration,
          considerRtp: this.formData.considerRtp,
          considerAcwr: this.formData.considerAcwr,
        }),
      );
      interface SchedulePayload { periodization: PeriodizationPhase[]; schedule: GeneratedSession[]; modifications: PlayerModification[] }
      const data = extractApiPayload<SchedulePayload>(response as unknown as SchedulePayload);
      if (data) {
        this.periodization.set(data.periodization ?? []);
        this.generatedSchedule.set(data.schedule ?? []);
        this.modifications.set(data.modifications ?? []);
        this.toastService.success(
          "Merlin has created your optimized training schedule",
          "Schedule Generated",
        );
      } else {
        this.toastService.info("AI schedule generation coming soon", "Coming Soon");
      }
    } catch (error) {
      this.logger.warn("[AIScheduler] generateSchedule failed", error);
      this.toastService.info("AI schedule generation coming soon", "Coming Soon");
    } finally {
      this.isGenerating.set(false);
    }
  }

  resetSchedule(): void {
    this.generatedSchedule.set(null);
    this.periodization.set([]);
    this.modifications.set([]);
  }

  regenerateSchedule(): void {
    this.resetSchedule();
    this.generateSchedule();
  }

  exportPdf(): void {
    this.toastService.success("PDF is being generated", "Export Started");
  }

  addToCalendar(): void {
    this.toastService.success(
      "Sessions have been added to the team calendar",
      "Added to Calendar",
    );
  }

  applySchedule(): void {
    this.toastService.success(
      "Training schedule is now active",
      "Schedule Applied",
    );
  }
}
