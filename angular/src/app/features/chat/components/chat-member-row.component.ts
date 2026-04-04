import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { ChannelMemberDetails } from "../../../core/services/channel.service";
import { AvatarComponent } from "../../../shared/components/avatar/avatar.component";
import { IconButtonComponent } from "../../../shared/components/button/icon-button.component";
import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";
import { getInitials } from "../../../shared/utils/format.utils";

export type ChatMemberRowPresence = ChannelMemberDetails & { is_online: boolean };

@Component({
  selector: "app-chat-member-row",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, AvatarComponent, StatusTagComponent, IconButtonComponent],
  templateUrl: "./chat-member-row.component.html",
  styleUrl: "./chat-member-row.component.scss",
})
export class ChatMemberRowComponent {
  readonly member = input.required<ChatMemberRowPresence>();
  /** Coach rows show Head Coach / Assistant; athlete rows show position, jersey, view-only. */
  readonly variant = input<"coach" | "athlete">("athlete");

  readonly startDirectMessage = output<ChannelMemberDetails>();

  onMessage(): void {
    this.startDirectMessage.emit(this.member());
  }

  getInitialsStr(name: string): string {
    return getInitials(name);
  }

  getAvatarColorClass(name: string): string {
    const paletteSize = 6;
    const index = name.charCodeAt(0) % paletteSize;
    return `avatar-color-${index + 1}`;
  }
}
