import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from "@angular/core";
import { ChatMessage } from "../../../core/services/channel.service";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { AppDialogComponent } from "../../../shared/components/dialog/dialog.component";
import { DialogHeaderComponent } from "../../../shared/components/dialog-header/dialog-header.component";
import { getTimeAgo } from "../../../shared/utils/date.utils";

@Component({
  selector: "app-chat-pinned-messages-dialog",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    AppDialogComponent,
    DialogHeaderComponent,
    ButtonComponent,
  ],
  templateUrl: "./chat-pinned-messages-dialog.component.html",
  styleUrl: "./chat-pinned-messages-dialog.component.scss",
})
export class ChatPinnedMessagesDialogComponent {
  @Input() visible = false;
  @Input() pinnedMessages: ChatMessage[] = [];
  @Input() canPinMessages = false;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() togglePin = new EventEmitter<ChatMessage>();

  onClose(): void {
    this.visibleChange.emit(false);
  }

  onTogglePin(message: ChatMessage): void {
    this.togglePin.emit(message);
  }

  formatTime(timestamp: string): string {
    return getTimeAgo(timestamp);
  }
}
