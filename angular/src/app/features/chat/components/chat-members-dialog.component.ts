import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
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
  @Input() visible = false;
  @Input() subtitle = "";
  @Input() membersData: ChannelMembersResponse | null = null;
  @Input() loading = false;
  @Input() memberSearchQuery = "";
  @Input() coaches: ChatMemberWithPresence[] = [];
  @Input() athletes: ChatMemberWithPresence[] = [];
  @Input() onlineCoachCount = 0;
  @Input() onlineAthleteCount = 0;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() memberSearchQueryChange = new EventEmitter<string>();
  @Output() startDirectMessage = new EventEmitter<ChannelMemberDetails>();

  onClose(): void {
    this.visibleChange.emit(false);
  }

  onMemberSearchInput(event: Event): void {
    const target = event.target;
    const value = target instanceof HTMLInputElement ? target.value : "";
    this.memberSearchQueryChange.emit(value);
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
