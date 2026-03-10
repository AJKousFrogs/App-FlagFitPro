import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { CloseButtonComponent } from "../../../shared/components/close-button/close-button.component";
import { CoachOverrideNotificationComponent } from "../../../shared/components/coach-override-notification/coach-override-notification.component";
import { MissingDataExplanationComponent } from "../../../shared/components/missing-data-explanation/missing-data-explanation.component";
import { OwnershipTransitionBadgeComponent } from "../../../shared/components/ownership-transition-badge/ownership-transition-badge.component";
import { SemanticMeaningRendererComponent } from "../../../shared/components/semantic-meaning-renderer/semantic-meaning-renderer.component";
import type { MissingDataStatus } from "../../../core/services/missing-data-detection.service";
import type { CoachOverride } from "../../../core/services/override-logging.service";
import type { OwnershipTransition } from "../../../core/services/ownership-transition.service";
import type { CoachOverrideMeaning } from "../../../core/semantics/semantic-meaning.types";

interface AnnouncementBanner {
  message: string | null;
  coachName: string | null;
  postedAt: Date | null;
  priority: "info" | "important";
}

interface OverrideDisplayItem {
  override: CoachOverride;
  coachName: string;
  meaning: CoachOverrideMeaning | null;
}

@Component({
  selector: "app-player-dashboard-status-stack",
  standalone: true,
  imports: [
    CommonModule,
    CloseButtonComponent,
    CoachOverrideNotificationComponent,
    MissingDataExplanationComponent,
    OwnershipTransitionBadgeComponent,
    SemanticMeaningRendererComponent,
  ],
  templateUrl: "./player-dashboard-status-stack.component.html",
  styleUrl: "./player-dashboard-status-stack.component.scss",
})
export class PlayerDashboardStatusStackComponent {
  readonly announcement = input<AnnouncementBanner | null>(null);
  readonly announcementDismissed = input(false);
  readonly announcementTimeAgo = input("");
  readonly overrideItems = input<OverrideDisplayItem[]>([]);
  readonly currentUserId = input.required<string>();
  readonly activeTransitions = input<OwnershipTransition[]>([]);
  readonly missingWellnessStatus = input<MissingDataStatus | null>(null);
  readonly dismissAnnouncement = output<void>();
}
