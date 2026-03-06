/**
 * AI Training Scheduler Component
 *
 * AI-powered training schedule generator that creates optimized training
 * programs based on team events, player readiness, periodization principles,
 * and competition calendar.
 *
 * Design System Compliant (DESIGN_SYSTEM_RULES.md)
 */

import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { ToastService } from "../../../core/services/toast.service";
import { Card } from "primeng/card";

import { ProgressBar } from "primeng/progressbar";
import { Select } from "primeng/select";

import { firstValueFrom } from "rxjs";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { CardHeaderComponent } from "../../../shared/components/card-header/card-header.component";

import { ApiService, API_ENDPOINTS } from "../../../core/services/api.service";
import { LoggerService } from "../../../core/services/logger.service";
import { ApiResponse } from "../../../core/models/common.models";
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
    CommonModule,
    Card,
    ProgressBar,
    Select,

    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
    CardHeaderComponent,
  ],
  template: `
    <app-main-layout>
<div class="ai-scheduler-page">
        <app-page-header
          title="AI Training Scheduler"
          subtitle="Let Merlin optimize your training plan"
          icon="pi-bolt"
        ></app-page-header>

        @if (!generatedSchedule()) {
          <!-- Generation Form -->
          <p-card class="generation-form-card">
            <div class="merlin-intro">
              <div class="merlin-avatar">🤖</div>
              <div class="merlin-message">
                <h3>MERLIN - Training Scheduler</h3>
                <p>
                  "I'll create an optimized training schedule based on your
                  team's calendar, player readiness, and your goals. Just tell
                  me what you need to prepare for."
                </p>
              </div>
            </div>

            <!-- Step 1: Target Event -->
            <div class="form-step">
              <h4>STEP 1: Target Event</h4>
              <p class="step-description">What are you preparing for?</p>

              <div class="radio-group">
                @for (type of targetTypes; track type.value) {
                  <div class="radio-option">
                    <input
                      type="radio"
                      name="targetType"
                      [id]="'target-' + type.value"
                      [value]="type.value"
                      [checked]="formData.targetType === type.value"
                      (change)="onTargetTypeChange(type.value)"
                    />
                    <label [for]="'target-' + type.value">{{
                      type.label
                    }}</label>
                  </div>
                }
              </div>

              @if (
                formData.targetType === "tournament" ||
                formData.targetType === "game"
              ) {
                <div class="event-selector">
                  <label for="event-select">Select event:</label>
                  <p-select
                    inputId="event-select"
                    [options]="upcomingEvents()"
                    (onChange)="onEventIdChange($event.value)"
                    optionLabel="name"
                    optionValue="id"
                    placeholder="Select upcoming event"
                    class="w-full"
                    [attr.aria-label]="'Select upcoming event'"
                  ></p-select>
                  @if (selectedEvent()) {
                    <p class="event-info">
                      Time until event:
                      <strong>{{ selectedEvent()?.daysUntil }} days</strong>
                    </p>
                  }
                </div>
              }
            </div>

            <!-- Step 2: Training Focus -->
            <div class="form-step">
              <h4>STEP 2: Training Focus</h4>
              <p class="step-description">
                What should we prioritize? (Select up to 3)
              </p>

              <div class="checkbox-grid">
                @for (area of focusAreas; track area.value) {
                  <div class="checkbox-option">
                    <input
                      type="checkbox"
                      [id]="'focus-' + area.value"
                      [checked]="formData.focusAreas.includes(area.value)"
                      (change)="onFocusAreaToggle(area.value, isChecked($event))"
                      [disabled]="
                        formData.focusAreas.length >= 3 &&
                        !formData.focusAreas.includes(area.value)
                      "
                    />
                    <label [for]="'focus-' + area.value"
                      >{{ area.icon }} {{ area.label }}</label
                    >
                  </div>
                }
              </div>
            </div>

            <!-- Step 3: Constraints -->
            <div class="form-step">
              <h4>STEP 3: Constraints</h4>
              <p class="step-description">Practice days available:</p>

              <div class="days-grid">
                @for (day of weekDays; track day.value) {
                  <div class="day-checkbox">
                    <input
                      type="checkbox"
                      [id]="'day-' + day.value"
                      [checked]="formData.availableDays.includes(day.value)"
                      (change)="onAvailableDayToggle(day.value, isChecked($event))"
                    />
                    <label [for]="'day-' + day.value">{{ day.label }}</label>
                  </div>
                }
              </div>

              <div class="constraints-row">
                <div class="constraint-field">
                  <label for="practice-duration">Practice duration:</label>
                  <p-select
                    inputId="practice-duration"
                    [options]="practiceDurations"
                    (onChange)="onDurationChange($event.value)"
                    optionLabel="label"
                    optionValue="value"
                    [attr.aria-label]="'Select practice duration'"
                  ></p-select>
                </div>
                <div class="constraint-field">
                  <label for="facility-select">Facility:</label>
                  <p-select
                    inputId="facility-select"
                    [options]="facilities()"
                    (onChange)="onFacilityChange($event.value)"
                    optionLabel="name"
                    optionValue="id"
                    placeholder="Select facility"
                    [attr.aria-label]="'Select facility'"
                  ></p-select>
                </div>
              </div>

              <div class="special-considerations">
                <p class="step-description">Special considerations:</p>
                <div class="checkbox-option">
                  <input
                    type="checkbox"
                    id="considerRtp"
                    [checked]="formData.considerRtp"
                    (change)="onConsiderRtpChange(isChecked($event))"
                  />
                  <label for="considerRtp"
                    >🏥 {{ rtpPlayerCount() }} players in RTP ({{
                      rtpPlayerNames()
                    }})</label
                  >
                </div>
                <div class="checkbox-option">
                  <input
                    type="checkbox"
                    id="considerAcwr"
                    [checked]="formData.considerAcwr"
                    (change)="onConsiderAcwrChange(isChecked($event))"
                  />
                  <label for="considerAcwr"
                    >⚠️ {{ highAcwrCount() }} players with elevated ACWR (reduce
                    their load)</label
                  >
                </div>
                <div class="checkbox-option">
                  <input
                    type="checkbox"
                    id="weatherAdjust"
                    [checked]="formData.weatherAdjust"
                    (change)="onWeatherAdjustChange(isChecked($event))"
                  />
                  <label for="weatherAdjust"
                    >🌧️ Weather-adjusted (indoor alternatives)</label
                  >
                </div>
              </div>
            </div>

            <div class="generate-action">
              <app-button
                iconLeft="pi-bolt"
                [loading]="isGenerating()"
                [disabled]="!canGenerate()"
                (clicked)="generateSchedule()"
                >Generate Schedule</app-button
              >
            </div>
          </p-card>
        } @else {
          <!-- Generated Schedule View -->
          <div class="schedule-header-actions">
            <app-button
              variant="secondary"
              iconLeft="pi-arrow-left"
              (clicked)="resetSchedule()"
              >Back</app-button
            >
            <app-button
              variant="secondary"
              iconLeft="pi-refresh"
              (clicked)="regenerateSchedule()"
              >Regenerate</app-button
            >
            <app-button variant="secondary" iconLeft="pi-pencil"
              >Edit</app-button
            >
          </div>

          <!-- Merlin Recommendation -->
          <p-card class="recommendation-card">
            <div class="merlin-recommendation">
              <span class="merlin-icon">🤖</span>
              <div class="recommendation-content">
                <h3>MERLIN'S RECOMMENDATION</h3>
                <p>{{ merlinRecommendation() }}</p>
              </div>
            </div>
          </p-card>

          <!-- Periodization Overview -->
          <p-card>
            <ng-template #header>
              <app-card-header title="Periodization Overview" />
            </ng-template>
            <div class="periodization-timeline">
              @for (phase of periodizationPhases(); track phase.name) {
                <div
                  class="phase-block"
                  [class.current]="phase.name === 'CURRENT'"
                >
                  <div class="phase-header">
                    <span class="phase-dates">{{ phase.dateRange }}</span>
                    <span class="phase-name">{{ phase.name }}</span>
                  </div>
                  <div class="phase-load">
                    <p-progressBar
                      [value]="phase.loadPercent"
                      [showValue]="false"
                      class="periodization-load-bar"
                    ></p-progressBar>
                    <span class="load-label">{{ phase.description }}</span>
                  </div>
                </div>
              }
            </div>
          </p-card>

          <!-- Weekly Schedule -->
          @for (week of scheduleWeeks(); track week.name) {
            <p-card>
              <ng-template #header>
                <app-card-header [title]="week.name" />
              </ng-template>
              <div class="sessions-list">
                @for (session of week.sessions; track session.id) {
                  <div
                    class="session-card"
                    [class.rest-day]="session.isRestDay"
                  >
                    <div class="session-day">
                      <span class="day-name">{{ session.day }}</span>
                      <span class="day-date">{{ session.date }}</span>
                      @if (!session.isRestDay) {
                        <span class="item-time">{{ session.time }}</span>
                      }
                    </div>
                    <div class="session-content">
                      <div class="session-header">
                        <span class="session-icon">{{ session.icon }}</span>
                        <h4>{{ session.title }}</h4>
                        @if (!session.isRestDay) {
                          <span class="session-duration">{{
                            session.duration
                          }}</span>
                        }
                      </div>
                      @if (!session.isRestDay) {
                        <ul class="session-activities">
                          @for (
                            activity of session.activities;
                            track activity
                          ) {
                            <li>{{ activity }}</li>
                          }
                        </ul>
                        <div class="session-meta">
                          <span>Target RPE: {{ session.targetRpe }}</span>
                          <span>Load: {{ session.load }}</span>
                          <span>Focus: {{ session.focus }}</span>
                        </div>
                        @if (session.location) {
                          <p class="session-location">
                            📍 {{ session.location }}
                          </p>
                        }
                      }
                    </div>
                    @if (!session.isRestDay) {
                      <div class="session-actions">
                        <app-button
                          variant="text"
                          size="sm"
                          iconLeft="pi-pencil"
                          >Edit session</app-button
                        >
                        <app-button variant="text" size="sm" iconLeft="pi-times"
                          >Remove session</app-button
                        >
                      </div>
                    }
                  </div>
                }
              </div>
            </p-card>
          }

          <!-- Player Modifications -->
          @if (playerModifications().length > 0) {
            <p-card class="modifications-card">
              <ng-template #header>
                <app-card-header
                  icon="pi-exclamation-triangle"
                  title="Player-Specific Modifications"
                />
              </ng-template>

              @if (highAcwrMods().length > 0) {
                <div class="mod-section">
                  <h4>🔴 HIGH ACWR - Load Reduction</h4>
                  @for (mod of highAcwrMods(); track mod.playerId) {
                    <div class="mod-card">
                      <strong
                        >{{ mod.playerName }} (ACWR:
                        {{ mod.acwr?.toFixed(2) }})</strong
                      >
                      <p>{{ mod.modification }}</p>
                    </div>
                  }
                </div>
              }

              @if (rtpMods().length > 0) {
                <div class="mod-section">
                  <h4>🏥 RETURN-TO-PLAY - Modified Activities</h4>
                  @for (mod of rtpMods(); track mod.playerId) {
                    <div class="mod-card">
                      <strong
                        >{{ mod.playerName }} (RTP Stage
                        {{ mod.rtpStage }})</strong
                      >
                      <p>{{ mod.modification }}</p>
                      @if (mod.clearedFor && mod.clearedFor.length > 0) {
                        <p class="cleared">
                          <strong>Cleared for:</strong>
                          {{ mod.clearedFor.join(", ") }}
                        </p>
                      }
                      @if (mod.notClearedFor && mod.notClearedFor.length > 0) {
                        <p class="not-cleared">
                          <strong>NOT cleared:</strong>
                          {{ mod.notClearedFor.join(", ") }}
                        </p>
                      }
                    </div>
                  }
                </div>
              }
            </p-card>
          }

          <!-- Export Actions -->
          <div class="export-actions">
            <app-button
              variant="secondary"
              iconLeft="pi-file-pdf"
              (clicked)="exportPdf()"
              >Export to PDF</app-button
            >
            <app-button
              variant="secondary"
              iconLeft="pi-calendar"
              (clicked)="addToCalendar()"
              >Add to Calendar</app-button
            >
            <app-button iconLeft="pi-check" (clicked)="applySchedule()"
              >Apply Schedule</app-button
            >
          </div>
        }
      </div>
    </app-main-layout>
  `,
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

  onDurationChange(value: string | null): void {
    this.formData = { ...this.formData, duration: value ?? this.formData.duration };
  }

  onFacilityChange(value: string | null): void {
    this.formData = { ...this.formData, facility: value ?? "" };
  }

  onConsiderRtpChange(value: boolean): void {
    this.formData = { ...this.formData, considerRtp: value };
  }

  onConsiderAcwrChange(value: boolean): void {
    this.formData = { ...this.formData, considerAcwr: value };
  }

  onWeatherAdjustChange(value: boolean): void {
    this.formData = { ...this.formData, weatherAdjust: value };
  }

  isChecked(event: Event): boolean {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      return target.checked;
    }
    return false;
  }

  async loadData(): Promise<void> {
    try {
      const response: ApiResponse<{ events?: TargetEvent[] }> =
        await firstValueFrom(
        this.api.get(API_ENDPOINTS.coach.eventsUpcoming),
      );
      if (response?.success && response.data?.events) {
        this.events.set(response.data.events);
      }
    } catch (err) {
      this.logger.error("Failed to load events", err);
      this.events.set([]);
    }
  }

  async generateSchedule(): Promise<void> {
    this.isGenerating.set(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    this.periodization.set([
      {
        name: "CURRENT",
        dateRange: "Jan 3-5",
        loadPercent: 0,
        description: "0%",
      },
      {
        name: "PEAK INTENSITY",
        dateRange: "Jan 6-12",
        loadPercent: 100,
        description: "100% Load",
      },
      {
        name: "TAPER",
        dateRange: "Jan 13-17",
        loadPercent: 60,
        description: "60% Load",
      },
      {
        name: "COMPETE",
        dateRange: "Jan 18-19",
        loadPercent: 0,
        description: "🏆 Tournament",
      },
    ]);

    this.generatedSchedule.set([
      {
        id: "w1-1",
        day: "MON",
        date: "Jan 6",
        time: "6:00 PM",
        title: "Speed & Explosiveness",
        icon: "🏃",
        duration: "2 hrs",
        activities: [
          "Warm-up (15 min)",
          "Sprint mechanics & acceleration (30 min)",
          "Agility ladder & cone drills (25 min)",
          "Position-specific explosive work (30 min)",
          "Cool down (10 min)",
        ],
        targetRpe: 8,
        load: "High",
        focus: "Speed",
        location: "Central Park Field",
      },
      {
        id: "w1-2",
        day: "TUE",
        date: "Jan 7",
        time: "6:00 PM",
        title: "Game Tactics - Offense",
        icon: "🏈",
        duration: "2 hrs",
        activities: [
          "Warm-up (15 min)",
          "Red zone offense 7v7 (40 min)",
          "New plays installation (30 min)",
          "Live scrimmage - offense focus (25 min)",
          "Team talk (10 min)",
        ],
        targetRpe: 8,
        load: "High",
        focus: "Tactics",
        location: "Central Park Field",
      },
      {
        id: "w1-3",
        day: "THU",
        date: "Jan 9",
        time: "6:00 PM",
        title: "Game Tactics - Defense + Communication",
        icon: "🛡️",
        duration: "2 hrs",
        activities: [
          "Warm-up (15 min)",
          "Defensive rotations & coverage (40 min)",
          "Communication drills (20 min)",
          "Live scrimmage - defense focus (25 min)",
          "Film preview: opponent tendencies (10 min)",
        ],
        targetRpe: 8,
        load: "High",
        focus: "Defense",
        location: "Central Park Field",
      },
      {
        id: "w1-4",
        day: "SAT",
        date: "Jan 11",
        time: "10:00 AM",
        title: "Full Game Simulation",
        icon: "⚔️",
        duration: "2 hrs",
        activities: [
          "Warm-up (15 min)",
          "Full scrimmage with tournament rules (75 min)",
          "Special situations practice (20 min)",
          "Cool down & team chemistry (10 min)",
        ],
        targetRpe: 9,
        load: "Max",
        focus: "Game Sim",
        location: "Central Park Field",
      },
      {
        id: "w2-1",
        day: "MON",
        date: "Jan 13",
        time: "6:00 PM",
        title: "Light Skills & Recovery",
        icon: "🔄",
        duration: "90 min",
        activities: ["Light position work", "Recovery protocols"],
        targetRpe: 5,
        load: "Low",
        focus: "Maintenance",
      },
      {
        id: "w2-2",
        day: "TUE",
        date: "Jan 14",
        time: "6:00 PM",
        title: "Walkthrough & Film",
        icon: "📋",
        duration: "90 min",
        activities: ["Walkthrough", "Film review", "Mental prep"],
        targetRpe: 3,
        load: "Min",
        focus: "Mental Prep",
      },
      {
        id: "w2-3",
        day: "THU",
        date: "Jan 16",
        time: "6:00 PM",
        title: "Light Activation & Final Prep",
        icon: "⚡",
        duration: "60 min",
        activities: ["Activation drills", "Final prep walkthrough"],
        targetRpe: 4,
        load: "Min",
        focus: "Activation",
      },
      {
        id: "w2-4",
        day: "FRI",
        date: "Jan 17",
        time: "",
        title: "REST DAY - Travel if needed",
        icon: "😴",
        duration: "",
        activities: [],
        targetRpe: 0,
        load: "Min",
        focus: "",
        isRestDay: true,
      },
    ]);

    this.modifications.set([
      {
        playerId: "1",
        playerName: "Chris Martinez",
        reason: "acwr",
        acwr: 1.42,
        modification:
          "-25% load. Skip Saturday max-intensity scrimmage. Instead: Light position work + film study",
      },
      {
        playerId: "2",
        playerName: "Morgan Davis",
        reason: "acwr",
        acwr: 1.35,
        modification: "-20% load. Limit full-speed sprints.",
      },
      {
        playerId: "3",
        playerName: "Riley Brown",
        reason: "acwr",
        acwr: 1.32,
        modification: "-15% load. Extra recovery time between drills.",
      },
      {
        playerId: "4",
        playerName: "Alex Thompson",
        reason: "rtp",
        rtpStage: 4,
        modification: "Non-contact drills only. 60% intensity cap.",
        clearedFor: ["Position drills", "Walkthrough", "Film"],
        notClearedFor: ["Live scrimmage", "Full-speed contact"],
      },
      {
        playerId: "5",
        playerName: "Emily Chen",
        reason: "rtp",
        rtpStage: 2,
        modification: "Light activity only. 20% intensity cap.",
        clearedFor: ["Walkthrough", "Film", "Light stretching"],
        notClearedFor: ["Running", "Drills", "Any intensity work"],
      },
    ]);

    this.isGenerating.set(false);

    this.toastService.success(
      "Merlin has created your optimized training schedule",
      "Schedule Generated",
    );
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
