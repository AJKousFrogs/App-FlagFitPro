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
import { CalendarModule } from "primeng/calendar";
import { TagModule } from "primeng/tag";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";

@Component({
  selector: "app-qb-training-schedule",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    CardModule,
    ButtonModule,
    CalendarModule,
    TagModule,
    MainLayoutComponent,
    PageHeaderComponent
  ],
  template: `
    <app-main-layout>
      <div class="qb-training-schedule-page">
        <app-page-header
          title="QB Training Schedule"
          subtitle="Quarterback-specific training program"
          icon="pi-calendar"
        ></app-page-header>

        <p-card class="schedule-card">
          <ng-template pTemplate="header">
            <h3>Throwing Volume Program</h3>
          </ng-template>
          <div class="program-info">
            <p>This is a specialized training schedule for quarterbacks focusing on throwing volume periodization.</p>
            <p-button
              label="View Full Program"
              icon="pi pi-book"
              [outlined]="true"
              class="mt-4"
            ></p-button>
          </div>
        </p-card>

        <p-card class="calendar-card mt-4">
          <ng-template pTemplate="header">
            <h3>Weekly Schedule</h3>
          </ng-template>
          <p-calendar
            [(ngModel)]="selectedDate"
            [inline]="true"
            [showWeek]="true"
          ></p-calendar>
        </p-card>
      </div>
    </app-main-layout>
  `,
  styles: [
    `
      .qb-training-schedule-page {
        padding: var(--space-6);
      }

      .schedule-card,
      .calendar-card {
        margin-top: var(--space-4);
      }

      .program-info {
        padding: var(--space-4);
      }
    `,
  ],
})
export class QbTrainingScheduleComponent implements OnInit {
  selectedDate = signal<Date>(new Date());

  ngOnInit(): void {
    // Load QB training schedule
  }
}

