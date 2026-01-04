import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
  OnInit,
} from "@angular/core";

import { FormsModule } from "@angular/forms";
import { CardModule } from "primeng/card";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { DatePicker } from "primeng/datepicker";
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
    DatePicker,
    TagModule,
    MainLayoutComponent,
    PageHeaderComponent,
  
    ButtonComponent,
  ],
  template: `
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
            <p>
              This is a specialized training schedule for quarterbacks focusing
              on throwing volume periodization.
            </p>
            <app-button variant="outlined" iconLeft="pi-book">View Full Program</app-button>
          </div>
        </p-card>

        <p-card class="calendar-card mt-4">
          <ng-template pTemplate="header">
            <h3>Weekly Schedule</h3>
          </ng-template>
          <p-datepicker
            [(ngModel)]="selectedDate"
            [inline]="true"
            [showWeek]="true"
          ></p-datepicker>
        </p-card>
    </div>
  `,
  styleUrl: './qb-training-schedule.component.scss',
})
export class QbTrainingScheduleComponent implements OnInit {
  selectedDate = signal<Date>(new Date());

  ngOnInit(): void {
    // Load QB training schedule
  }
}
