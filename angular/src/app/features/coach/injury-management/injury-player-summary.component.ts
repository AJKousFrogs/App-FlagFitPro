import { CommonModule, DatePipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { AvatarComponent } from "../../../shared/components/avatar/avatar.component";
import { getInitials } from "../../../shared/utils/format.utils";

/** Fields required by active + RTP injury card headers (matches InjuryRecord usage). */
export interface InjuryPlayerSummaryModel {
  playerName: string;
  jerseyNumber: string;
  playerPosition: string;
  bodyPart: string;
  injuryType: string;
  severity: "mild" | "moderate" | "severe";
  injuryDate: string;
  avatarUrl?: string;
  description: string;
  daysInProtocol?: number;
}

@Component({
  selector: "app-injury-player-summary",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DatePipe, AvatarComponent],
  templateUrl: "./injury-player-summary.component.html",
})
export class InjuryPlayerSummaryComponent {
  readonly injury = input.required<InjuryPlayerSummaryModel>();
  readonly variant = input<"active" | "rtp">("active");

  getInitialsStr(name: string): string {
    return getInitials(name);
  }
}
