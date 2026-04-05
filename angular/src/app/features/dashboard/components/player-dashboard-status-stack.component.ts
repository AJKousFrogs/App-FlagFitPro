import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { CloseButtonComponent } from "../../../shared/components/close-button/close-button.component";
import { CoachOverrideNotificationComponent } from "../../../shared/components/coach-override-notification/coach-override-notification.component";
import { MissingDataExplanationComponent } from "../../../shared/components/missing-data-explanation/missing-data-explanation.component";
import { OwnershipTransitionBadgeComponent } from "../../../shared/components/ownership-transition-badge/ownership-transition-badge.component";
import type { MissingDataStatus } from "../../../core/services/missing-data-detection.service";
import type { CoachOverride } from "../../../core/services/override-logging.service";
import type { OwnershipTransition } from "../../../core/services/ownership-transition.service";
import type { DashboardAnnouncementBanner } from "../models/dashboard-announcement.types";

interface OverrideDisplayItem {
  override: CoachOverride;
  coachName: string;
}

@Component({
  selector: "app-player-dashboard-status-stack",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CloseButtonComponent,
    CoachOverrideNotificationComponent,
    MissingDataExplanationComponent,
    OwnershipTransitionBadgeComponent,
  ],
  templateUrl: "./player-dashboard-status-stack.component.html",
  styleUrl: "./player-dashboard-status-stack.component.scss",
})
export class PlayerDashboardStatusStackComponent {
  readonly announcement = input<DashboardAnnouncementBanner | null>(null);
  readonly announcementDismissed = input(false);
  readonly announcementTimeAgo = input("");
  readonly overrideItems = input<OverrideDisplayItem[]>([]);
  readonly currentUserId = input.required<string>();
  readonly activeTransitions = input<OwnershipTransition[]>([]);
  readonly missingWellnessStatus = input<MissingDataStatus | null>(null);
  readonly dismissAnnouncement = output<void>();
}
