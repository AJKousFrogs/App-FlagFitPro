import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { RouterModule } from "@angular/router";
import { Timeline } from "primeng/timeline";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";

interface DashboardScheduleItem {
  id: string;
  time: string;
  title: string;
  duration: number;
  completed: boolean;
}

interface DashboardContinuityDisplayEvent {
  type: string;
  title: string;
  description: string;
  icon: string;
  daysRemaining?: number;
  sessionsRemaining?: number;
}

interface DashboardUpcomingDisplayEvent {
  id: string;
  day: string;
  month: string;
  title: string;
  type: string;
  typeLabel: string;
  severity: "success" | "warning" | "danger" | "info" | "secondary" | "primary";
}

@Component({
  selector: "app-player-dashboard-events-section",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    Timeline,
    ButtonComponent,
    CardShellComponent,
    StatusTagComponent,
  ],
  templateUrl: "./player-dashboard-events-section.component.html",
  styleUrl: "./player-dashboard-events-section.component.scss",
})
export class PlayerDashboardEventsSectionComponent {
  readonly schedulePreviewCount = input.required<number>();
  readonly eventsPreviewCount = input.required<number>();
  readonly continuityEvents = input.required<DashboardContinuityDisplayEvent[]>();
  readonly tomorrowSchedule = input.required<DashboardScheduleItem[]>();
  readonly upcomingEvents = input.required<DashboardUpcomingDisplayEvent[]>();
}
