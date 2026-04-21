import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
  output,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { SearchInputComponent } from "../../../shared/components/search-input/search-input.component";


import {
  ChannelMemberDetails,
  ChannelMembersResponse,
} from "../../../core/services/channel.service";
import { AppDialogComponent } from "../../../shared/components/dialog/dialog.component";
import { DialogHeaderComponent } from "../../../shared/components/dialog-header/dialog-header.component";
import { AppLoadingComponent } from "../../../shared/components/loading/loading.component";
import { ChatMemberRowComponent } from "./chat-member-row.component";

type ChatMemberWithPresence = ChannelMemberDetails & { is_online: boolean };

@Component({
  selector: "app-chat-members-dialog",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    AppDialogComponent,
    DialogHeaderComponent,
    SearchInputComponent,
    ChatMemberRowComponent,
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
}
