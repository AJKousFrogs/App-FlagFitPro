import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { CardShellComponent } from "../card-shell/card-shell.component";
import { StatusTagComponent } from "../status-tag/status-tag.component";
import type { SharedInsight } from "../../../core/services/shared-insight-feed.service";
import {
  formatStaffInsightRelativeDate,
  getStaffInsightMetadataEntries,
  getStaffInsightPrioritySeverity,
  getStaffInsightRoleSeverity,
  getStaffInsightTypeLabel,
  staffInsightHasMetadata,
} from "../../utils/staff-insight-display.utils";

@Component({
  selector: "app-staff-insight-feed-card",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardShellComponent, StatusTagComponent],
  templateUrl: "./staff-insight-feed-card.component.html",
  styleUrl: "./staff-insight-feed-card.component.scss",
})
export class StaffInsightFeedCardComponent {
  readonly insight = input.required<SharedInsight>();

  protected readonly getRoleSeverity = getStaffInsightRoleSeverity;
  protected readonly getInsightTypeLabel = getStaffInsightTypeLabel;
  protected readonly getPrioritySeverity = getStaffInsightPrioritySeverity;
  protected readonly formatDate = formatStaffInsightRelativeDate;
  protected readonly hasMetadata = staffInsightHasMetadata;
  protected readonly getMetadataEntries = getStaffInsightMetadataEntries;
}
