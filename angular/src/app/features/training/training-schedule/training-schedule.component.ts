import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  OnInit,
} from "@angular/core";

import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { DatePicker } from "primeng/datepicker";
import { TagModule } from "primeng/tag";
import { SkeletonModule } from "primeng/skeleton";
import { ToastModule } from "primeng/toast";
import { TooltipModule } from "primeng/tooltip";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import { SupabaseService } from "../../../core/services/supabase.service";
import { AuthService } from "../../../core/services/auth.service";
import { ToastService } from "../../../core/services/toast.service";
import { LoggerService } from "../../../core/services/logger.service";

interface TrainingSession {
  id: string;
  date: Date;
  type: string;
  duration: number;
  status: "scheduled" | "completed" | "missed";
}

@Component({
  selector: "app-training-schedule",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    CommonModule,
    CardModule,
    ButtonModule,
    DatePicker,
    TagModule,
    SkeletonModule,
    ToastModule,
    TooltipModule,
    MainLayoutComponent,
    PageHeaderComponent,
  ],
  template: `
    <app-main-layout>
      <div class="training-schedule-page">
        <app-page-header
          title="Training Schedule"
          subtitle="View and manage your training sessions"
          icon="pi-calendar"
        >
          <p-button
            label="New Session"
            icon="pi pi-plus"
            (onClick)="createNewSession()"
          ></p-button>
        </app-page-header>

        <div class="schedule-content">
          <p-card class="calendar-card">
            <ng-template pTemplate="header">
              <h3>Training Calendar</h3>
            </ng-template>
            <p-datepicker
              [(ngModel)]="selectedDate"
              [inline]="true"
              [showWeek]="true"
              (onSelect)="onDateSelect($event)"
            ></p-datepicker>
          </p-card>

          <p-card class="sessions-card">
            <ng-template pTemplate="header">
              <h3>Upcoming Sessions</h3>
            </ng-template>
            <div class="sessions-list">
              @if (isLoading()) {
                @for (i of [1, 2, 3]; track i) {
                  <div class="session-item">
                    <div class="session-info">
                      <p-skeleton width="150px" height="20px"></p-skeleton>
                      <p-skeleton width="200px" height="14px" class="mt-2"></p-skeleton>
                      <p-skeleton width="100px" height="14px" class="mt-1"></p-skeleton>
                    </div>
                    <p-skeleton width="80px" height="24px"></p-skeleton>
                  </div>
                }
              } @else if (filteredSessions().length === 0) {
                <div class="empty-state">
                  <i class="pi pi-calendar-times" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                  <p>
                    No training sessions scheduled. Click "New Session" to add
                    one.
                  </p>
                </div>
              } @else {
                @for (session of filteredSessions(); track session.id) {
                  <div class="session-item" (click)="viewSession(session)">
                    <div class="session-info">
                      <h4>{{ session.type }}</h4>
                      <p class="session-date">
                        {{ session.date | date: "MMM d, y 'at' h:mm a" }}
                      </p>
                      <p class="session-duration">
                        Duration: {{ session.duration }} min
                      </p>
                    </div>
                    <div class="session-actions">
                      <p-tag
                        [value]="session.status"
                        [severity]="getStatusSeverity(session.status)"
                      ></p-tag>
                      @if (session.status === 'scheduled') {
                        <p-button
                          icon="pi pi-check"
                          [rounded]="true"
                          [text]="true"
                          size="small"
                          pTooltip="Mark Complete"
                          (onClick)="markComplete($event, session)"
                        ></p-button>
                      }
                    </div>
                  </div>
                }
              }
            </div>
          </p-card>
        </div>
      </div>
    </app-main-layout>
  `,
  styles: [
    `
      .training-schedule-page {
        padding: var(--space-6);
      }

      .schedule-content {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-6);
        margin-top: var(--space-6);
      }

      @media (max-width: 1024px) {
        .schedule-content {
          grid-template-columns: 1fr;
        }
      }

      .calendar-card,
      .sessions-card {
        height: fit-content;
      }

      .sessions-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .session-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-4);
        background: var(--p-surface-50);
        border-radius: var(--p-border-radius);
        cursor: pointer;
        transition: all 0.2s;
      }

      .session-item:hover {
        background: var(--p-surface-100);
        transform: translateX(4px);
      }

      .session-actions {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .session-info h4 {
        margin: 0 0 var(--space-1) 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .session-date,
      .session-duration {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin: 0;
      }

      .empty-state {
        text-align: center;
        padding: var(--space-6);
        color: var(--text-secondary);
      }
    `,
  ],
})
export class TrainingScheduleComponent implements OnInit {
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private logger = inject(LoggerService);

  selectedDate = signal<Date>(new Date());
  sessions = signal<TrainingSession[]>([]);
  isLoading = signal<boolean>(false);

  // Filter sessions based on selected date
  filteredSessions = computed(() => {
    const selected = this.selectedDate();
    const allSessions = this.sessions();

    if (!selected) return allSessions;

    // Show sessions for the selected week
    const startOfWeek = new Date(selected);
    startOfWeek.setDate(selected.getDate() - selected.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    return allSessions.filter((session) => {
      const sessionDate = new Date(session.date);
      return sessionDate >= startOfWeek && sessionDate < endOfWeek;
    });
  });

  ngOnInit(): void {
    this.loadSessions();
  }

  async loadSessions(): Promise<void> {
    this.isLoading.set(true);

    try {
      const user = this.authService.getUser();
      if (!user?.id) {
        this.logger.warn("No user found, cannot load sessions");
        return;
      }

      // Fetch training sessions from Supabase
      const { data, error } = await this.supabaseService.client
        .from("training_sessions")
        .select(`
          id,
          scheduled_date,
          session_type,
          duration_minutes,
          status,
          notes,
          created_at
        `)
        .eq("user_id", user.id)
        .gte("scheduled_date", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order("scheduled_date", { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      const mappedSessions: TrainingSession[] = (data || []).map((session) => ({
        id: session.id,
        date: new Date(session.scheduled_date),
        type: session.session_type || "Training",
        duration: session.duration_minutes || 60,
        status: session.status as "scheduled" | "completed" | "missed",
      }));

      this.sessions.set(mappedSessions);
    } catch (error) {
      this.logger.error("Error loading sessions:", error);
      this.toastService.error("Failed to load training sessions");
    } finally {
      this.isLoading.set(false);
    }
  }

  onDateSelect(date: Date): void {
    this.selectedDate.set(date);
  }

  createNewSession(): void {
    const selectedDateStr = this.selectedDate()?.toISOString().split("T")[0];
    this.router.navigate(["/training/smart-form"], {
      queryParams: selectedDateStr ? { date: selectedDateStr } : {},
    });
    this.logger.debug("Navigating to session creation form", {
      date: selectedDateStr,
    });
  }

  viewSession(session: TrainingSession): void {
    this.router.navigate(["/training/session", session.id]);
  }

  async markComplete(event: Event, session: TrainingSession): Promise<void> {
    event.stopPropagation();

    try {
      const { error } = await this.supabaseService.client
        .from("training_sessions")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", session.id);

      if (error) {
        throw new Error(error.message);
      }

      // Update local state
      this.sessions.update((sessions) =>
        sessions.map((s) =>
          s.id === session.id ? { ...s, status: "completed" as const } : s
        )
      );

      this.toastService.success("Session marked as complete!");
    } catch (error) {
      this.logger.error("Error marking session complete:", error);
      this.toastService.error("Failed to update session");
    }
  }

  getStatusSeverity(
    status: string,
  ):
    | "success"
    | "info"
    | "warn"
    | "secondary"
    | "contrast"
    | "danger"
    | null
    | undefined {
    switch (status) {
      case "completed":
        return "success";
      case "missed":
        return "danger";
      default:
        return "info";
    }
  }
}
