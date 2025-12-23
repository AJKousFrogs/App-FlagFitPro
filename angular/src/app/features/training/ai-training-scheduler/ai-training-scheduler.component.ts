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
import { DatePicker } from "primeng/datepicker";
import { TagModule } from "primeng/tag";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import { ApiService } from "../../../core/services/api.service";
import { LoggerService } from "../../../core/services/logger.service";

interface AISuggestion {
  id: string;
  type: "swap" | "reduce" | "increase";
  message: string;
  date: Date;
  accepted: boolean;
}

@Component({
  selector: "app-ai-training-scheduler",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    CommonModule,
    CardModule,
    ButtonModule,
    DatePicker,
    TagModule,
    MainLayoutComponent,
    PageHeaderComponent,
  ],
  template: `
    <app-main-layout>
      <div class="ai-training-scheduler-page">
        <app-page-header
          title="AI Training Scheduler"
          subtitle="AI-powered training schedule optimization"
          icon="pi-sparkles"
        ></app-page-header>

        <div class="scheduler-content">
          <p-card class="suggestions-card">
            <ng-template pTemplate="header">
              <h3>AI Suggestions</h3>
            </ng-template>
            <div class="suggestions-list">
              @if (suggestions().length === 0) {
                <div class="empty-state">
                  <p>
                    No suggestions at this time. Your schedule looks optimal!
                  </p>
                </div>
              } @else {
                @for (suggestion of suggestions(); track suggestion.id) {
                  <div class="suggestion-item">
                    <div class="suggestion-content">
                      <p-tag
                        [value]="suggestion.type"
                        [severity]="getSuggestionSeverity(suggestion.type)"
                      ></p-tag>
                      <p class="suggestion-message">{{ suggestion.message }}</p>
                      <small class="suggestion-date">
                        {{ suggestion.date | date: "MMM d, y" }}
                      </small>
                    </div>
                    <div class="suggestion-actions">
                      @if (!suggestion.accepted) {
                        <p-button
                          label="Apply"
                          icon="pi pi-check"
                          size="small"
                          (onClick)="applySuggestion(suggestion.id)"
                        ></p-button>
                        <p-button
                          label="Dismiss"
                          [outlined]="true"
                          severity="secondary"
                          size="small"
                          (onClick)="dismissSuggestion(suggestion.id)"
                        ></p-button>
                      } @else {
                        <p-tag value="Applied" severity="success"></p-tag>
                      }
                    </div>
                  </div>
                }
              }
            </div>
          </p-card>

          <p-card class="calendar-card">
            <ng-template pTemplate="header">
              <h3>Optimized Schedule</h3>
            </ng-template>
            <p-datepicker
              [(ngModel)]="selectedDate"
              [inline]="true"
              [showWeek]="true"
            ></p-datepicker>
          </p-card>
        </div>
      </div>
    </app-main-layout>
  `,
  styles: [
    `
      .ai-training-scheduler-page {
        padding: var(--space-6);
      }

      .scheduler-content {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-6);
        margin-top: var(--space-6);
      }

      @media (max-width: 1024px) {
        .scheduler-content {
          grid-template-columns: 1fr;
        }
      }

      .suggestions-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .suggestion-item {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: var(--space-4);
        background: var(--p-surface-50);
        border-radius: var(--p-border-radius);
      }

      .suggestion-content {
        flex: 1;
      }

      .suggestion-message {
        margin: var(--space-2) 0;
        color: var(--text-primary);
      }

      .suggestion-date {
        color: var(--text-secondary);
        font-size: 0.875rem;
      }

      .suggestion-actions {
        display: flex;
        gap: var(--space-2);
        margin-left: var(--space-4);
      }

      .empty-state {
        text-align: center;
        padding: var(--space-6);
        color: var(--text-secondary);
      }
    `,
  ],
})
export class AiTrainingSchedulerComponent implements OnInit {
  private apiService = inject(ApiService);
  private logger = inject(LoggerService);

  selectedDate = signal<Date>(new Date());
  suggestions = signal<AISuggestion[]>([]);

  ngOnInit(): void {
    this.loadSuggestions();
  }

  async loadSuggestions(): Promise<void> {
    try {
      // TODO: Call API to load AI suggestions
      // const response = await this.apiService.getAITrainingSuggestions();

      // Mock suggestions
      this.suggestions.set([
        {
          id: "1",
          type: "swap",
          message:
            "Consider moving speed session 24h later based on your readiness score",
          date: new Date(),
          accepted: false,
        },
        {
          id: "2",
          type: "reduce",
          message:
            "Reduce intensity for tomorrow's session - ACWR slightly elevated",
          date: new Date(),
          accepted: false,
        },
      ]);
    } catch (error) {
      this.logger.error("Error loading suggestions:", error);
    }
  }

  applySuggestion(suggestionId: string): void {
    // TODO: Apply suggestion
    const suggestions = this.suggestions();
    const index = suggestions.findIndex((s) => s.id === suggestionId);
    if (index > -1) {
      suggestions[index].accepted = true;
      this.suggestions.set([...suggestions]);
    }
  }

  dismissSuggestion(suggestionId: string): void {
    // TODO: Dismiss suggestion
    const suggestions = this.suggestions().filter((s) => s.id !== suggestionId);
    this.suggestions.set(suggestions);
  }

  getSuggestionSeverity(
    type: string,
  ):
    | "success"
    | "info"
    | "warn"
    | "secondary"
    | "contrast"
    | "danger"
    | null
    | undefined {
    switch (type) {
      case "swap":
        return "info";
      case "reduce":
        return "warn";
      case "increase":
        return "success";
      default:
        return "info";
    }
  }
}
