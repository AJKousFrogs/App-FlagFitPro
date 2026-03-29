import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
  output,
} from "@angular/core";
import { Avatar } from "primeng/avatar";
import { InputText } from "primeng/inputtext";

import {
  ChannelMemberDetails,
  ChannelMembersResponse,
} from "../../../core/services/channel.service";
import { IconButtonComponent } from "../../../shared/components/button/icon-button.component";
import { AppDialogComponent } from "../../../shared/components/dialog/dialog.component";
import { DialogHeaderComponent } from "../../../shared/components/dialog-header/dialog-header.component";
import { AppLoadingComponent } from "../../../shared/components/loading/loading.component";
import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";
import { getInitials } from "../../../shared/utils/format.utils";

type ChatMemberWithPresence = ChannelMemberDetails & { is_online: boolean };

@Component({
  selector: "app-chat-members-dialog",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    AppDialogComponent,
    DialogHeaderComponent,
    InputText,
    Avatar,
    StatusTagComponent,
    IconButtonComponent,
    AppLoadingComponent,
  ],
  templateUrl: "./chat-members-dialog.component.html",
  styleUrl: "./chat-members-dialog.component.scss",
})
export class ChatMembersDialogComponent {
  readonly visible = model(false);
  readonly subtitle = input("");
  readonly membersData = input<ChannelMembersResponse | null>(null);
  readonly loading = input(false);
  readonly memberSearchQuery = model("");
  readonly coaches = input<ChatMemberWithPresence[]>([]);
  readonly athletes = input<ChatMemberWithPresence[]>([]);
  readonly onlineCoachCount = input(0);
  readonly onlineAthleteCount = input(0);

  readonly startDirectMessage = output<ChannelMemberDetails>();

  onClose(): void {
    this.visible.set(false);
  }

  onMemberSearchInput(event: Event): void {
    const target = event.target;
    const value = target instanceof HTMLInputElement ? target.value : "";
    this.memberSearchQuery.set(value);
  }

  onStartDirectMessage(member: ChannelMemberDetails): void {
    this.startDirectMessage.emit(member);
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
