import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
} from "@angular/core";

import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { DatePicker } from "primeng/datepicker";

import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";

@Component({
  selector: "app-qb-training-schedule",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    DatePicker,
    PageHeaderComponent,
    ButtonComponent,
    CardShellComponent,
  ],
  template: `
    <div class="qb-training-schedule-page">
      <app-page-header
        title="QB Training Schedule"
        subtitle="Quarterback-specific training program"
        icon="pi-calendar"
      ></app-page-header>

      <app-card-shell class="schedule-card" title="Throwing Volume Program">
        <div class="program-info">
          <p>
            This is a specialized training schedule for quarterbacks focusing on
            throwing volume periodization.
          </p>
          <app-button variant="outlined" iconLeft="pi-book"
            >View Full Program</app-button
          >
        </div>
      </app-card-shell>

      <app-card-shell class="calendar-card mt-4" title="Weekly Schedule">
        <p-datepicker
          [formControl]="selectedDateControl"
          [inline]="true"
          [showWeek]="true"
        ></p-datepicker>
      </app-card-shell>
    </div>
  `,
  styleUrl: "./qb-training-schedule.component.scss",
})
export class QbTrainingScheduleComponent implements OnInit {
  readonly selectedDateControl = new FormControl(new Date(), {
    nonNullable: true,
  });

  ngOnInit(): void {
    // Load QB training schedule
  }
}
