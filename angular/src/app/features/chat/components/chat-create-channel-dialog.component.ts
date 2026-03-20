import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from "@angular/core";
import { InputText } from "primeng/inputtext";
import { Select } from "primeng/select";
import { Textarea } from "primeng/textarea";
import { ChannelType } from "../../../core/services/channel.service";
import { AppDialogComponent } from "../../../shared/components/dialog/dialog.component";
import { DialogFooterComponent } from "../../../shared/components/dialog-footer/dialog-footer.component";
import { DialogHeaderComponent } from "../../../shared/components/dialog-header/dialog-header.component";

export interface ChatChannelCreateRequest {
  name: string;
  description: string;
  channelType: ChannelType;
  position: string;
}

@Component({
  selector: "app-chat-create-channel-dialog",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    AppDialogComponent,
    DialogHeaderComponent,
    DialogFooterComponent,
    InputText,
    Textarea,
    Select,
  ],
  templateUrl: "./chat-create-channel-dialog.component.html",
  styleUrl: "./chat-create-channel-dialog.component.scss",
})
export class ChatCreateChannelDialogComponent {
  @Input() visible = false;
  @Input() channelTypeOptions: Array<{ label: string; value: string }> = [];
  @Input() positionOptions: Array<{ label: string; value: string }> = [];

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() createChannel = new EventEmitter<ChatChannelCreateRequest>();

  channelName = "";
  channelDescription = "";
  channelType: ChannelType = "team_general";
  channelPosition = "";

  onClose(): void {
    this.visibleChange.emit(false);
    this.resetForm();
  }

  onChannelNameInput(event: Event): void {
    this.channelName = this.getInputValue(event);
  }

  onChannelDescriptionInput(event: Event): void {
    this.channelDescription = this.getInputValue(event);
  }

  onChannelTypeChange(value: ChannelType | null): void {
    this.channelType = value ?? "team_general";
    if (this.channelType !== "position_group") {
      this.channelPosition = "";
    }
  }

  onChannelPositionChange(value: string | null): void {
    this.channelPosition = value ?? "";
  }

  onCreate(): void {
    if (!this.channelName.trim()) {
      return;
    }

    this.createChannel.emit({
      name: this.channelName,
      description: this.channelDescription,
      channelType: this.channelType,
      position: this.channelPosition,
    });
  }

  private getInputValue(event: Event): string {
    const target = event.target;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement
    ) {
      return target.value;
    }
    return "";
  }

  private resetForm(): void {
    this.channelName = "";
    this.channelDescription = "";
    this.channelType = "team_general";
    this.channelPosition = "";
  }
}
