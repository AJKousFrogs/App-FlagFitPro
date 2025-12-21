import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
  OnInit,
} from "@angular/core";

import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { CalendarModule } from "primeng/calendar";
import { TagModule } from "primeng/tag";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import { ApiService } from "../../../core/services/api.service";
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
    CalendarModule,
    TagModule,
    MainLayoutComponent,
    PageHeaderComponent
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
            <p-calendar
              [(ngModel)]="selectedDate"
              [inline]="true"
              [showWeek]="true"
              (onSelect)="onDateSelect($event)"
            ></p-calendar>
          </p-card>

          <p-card class="sessions-card">
            <ng-template pTemplate="header">
              <h3>Upcoming Sessions</h3>
            </ng-template>
            <div class="sessions-list">
              @if (sessions().length === 0) {
                <div class="empty-state">
                  <p>No training sessions scheduled. Click "New Session" to add one.</p>
                </div>
              } @else {
                @for (session of sessions(); track session.id) {
                  <div class="session-item">
                    <div class="session-info">
                      <h4>{{ session.type }}</h4>
                      <p class="session-date">
                        {{ session.date | date: "MMM d, y 'at' h:mm a" }}
                      </p>
                      <p class="session-duration">Duration: {{ session.duration }} min</p>
                    </div>
                    <div class="session-status">
                      <p-tag
                        [value]="session.status"
                        [severity]="getStatusSeverity(session.status)"
                      ></p-tag>
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
  private apiService = inject(ApiService);
  private logger = inject(LoggerService);

  selectedDate = signal<Date>(new Date());
  sessions = signal<TrainingSession[]>([]);

  ngOnInit(): void {
    this.loadSessions();
  }

  async loadSessions(): Promise<void> {
    try {
      // TODO: Call API to load training sessions
      // const response = await this.apiService.getTrainingSessions();
      
      // Mock data
      this.sessions.set([
        {
          id: "1",
          date: new Date(),
          type: "Speed & Agility",
          duration: 60,
          status: "scheduled",
        },
        {
          id: "2",
          date: new Date(Date.now() + 86400000),
          type: "Strength Training",
          duration: 45,
          status: "scheduled",
        },
      ]);
    } catch (error) {
      this.logger.error("Error loading sessions:", error);
    }
  }

  onDateSelect(date: Date): void {
    this.selectedDate.set(date);
    // Filter sessions for selected date
  }

  createNewSession(): void {
    // TODO: Open modal or navigate to session creation
    this.logger.debug("Create new session");
  }

  getStatusSeverity(status: string): string {
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

