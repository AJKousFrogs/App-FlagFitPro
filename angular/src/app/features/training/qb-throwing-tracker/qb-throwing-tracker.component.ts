import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
  OnInit,
} from "@angular/core";

import { FormsModule } from "@angular/forms";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { InputNumberModule } from "primeng/inputnumber";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";

@Component({
  selector: "app-qb-throwing-tracker",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    CardModule,
    ButtonModule,
    InputNumberModule,
    MainLayoutComponent,
    PageHeaderComponent
  ],
  template: `
    <app-main-layout>
      <div class="qb-throwing-tracker-page">
        <app-page-header
          title="QB Throwing Tracker"
          subtitle="Track your throwing volume and accuracy"
          icon="pi-chart-bar"
        ></app-page-header>

        <p-card class="tracker-card">
          <ng-template pTemplate="header">
            <h3>Log Throwing Session</h3>
          </ng-template>
          <form class="tracker-form">
            <div class="form-group">
              <label>Total Throws</label>
              <p-inputNumber
                [(ngModel)]="sessionData.totalThrows"
                [min]="0"
                [max]="1000"
                placeholder="Enter number of throws"
                class="w-full"
              ></p-inputNumber>
            </div>
            <div class="form-group">
              <label>Completion Rate (%)</label>
              <p-inputNumber
                [(ngModel)]="sessionData.completionRate"
                [min]="0"
                [max]="100"
                placeholder="Enter completion rate"
                class="w-full"
              ></p-inputNumber>
            </div>
            <p-button
              label="Save Session"
              icon="pi pi-save"
              (onClick)="saveSession()"
              class="w-full mt-4"
            ></p-button>
          </form>
        </p-card>

        <p-card class="stats-card mt-4">
          <ng-template pTemplate="header">
            <h3>Weekly Stats</h3>
          </ng-template>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">{{ weeklyStats().totalThrows }}</div>
              <div class="stat-label">Total Throws</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ weeklyStats().avgCompletion }}%</div>
              <div class="stat-label">Avg Completion</div>
            </div>
          </div>
        </p-card>
      </div>
    </app-main-layout>
  `,
  styles: [
    `
      .qb-throwing-tracker-page {
        padding: var(--space-6);
      }

      .tracker-card,
      .stats-card {
        margin-top: var(--space-4);
      }

      .form-group {
        margin-bottom: var(--space-4);
      }

      .form-group label {
        display: block;
        margin-bottom: var(--space-2);
        font-weight: 500;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--space-4);
      }

      .stat-item {
        text-align: center;
        padding: var(--space-4);
        background: var(--p-surface-50);
        border-radius: var(--p-border-radius);
      }

      .stat-value {
        font-size: 2rem;
        font-weight: 700;
        color: var(--color-brand-primary);
      }

      .stat-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-top: var(--space-2);
      }
    `,
  ],
})
export class QbThrowingTrackerComponent implements OnInit {
  sessionData = {
    totalThrows: 0,
    completionRate: 0,
  };

  weeklyStats = signal({
    totalThrows: 0,
    avgCompletion: 0,
  });

  ngOnInit(): void {
    this.loadStats();
  }

  async loadStats(): Promise<void> {
    // TODO: Load weekly throwing stats
    this.weeklyStats.set({
      totalThrows: 245,
      avgCompletion: 78,
    });
  }

  async saveSession(): Promise<void> {
    // TODO: Save throwing session
    console.log("Save session:", this.sessionData);
  }
}

