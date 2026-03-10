import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { RouterLink } from "@angular/router";

import { AlertComponent } from "../../../shared/components/alert/alert.component";

export interface CoachDashboardPartialDataMessage {
  title: string;
  reason: string;
  icon?: string | null;
  helpLink: string;
  actionLabel: string;
}

@Component({
  selector: "app-coach-dashboard-partial-data-notice",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AlertComponent],
  templateUrl: "./coach-dashboard-partial-data-notice.component.html",
  styleUrl: "./coach-dashboard-partial-data-notice.component.scss",
})
export class CoachDashboardPartialDataNoticeComponent {
  readonly message = input.required<CoachDashboardPartialDataMessage>();
}
