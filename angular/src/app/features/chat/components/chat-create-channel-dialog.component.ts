import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
  output,
} from "@angular/core";
import { type SelectChangeEvent } from "primeng/select";
import { FormInputComponent } from "../../../shared/components/form-input/form-input.component";
import { TextareaComponent } from "../../../shared/components/textarea/textarea.component";
import { SelectComponent } from "../../../shared/components/select/select.component";
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
    AppDialogComponent,
    DialogHeaderComponent,
    DialogFooterComponent,
    FormInputComponent,
    TextareaComponent,
    SelectComponent,
  ],
  templateUrl: "./chat-create-channel-dialog.component.html",
  styleUrl: "./chat-create-channel-dialog.component.scss",
})
export class ChatCreateChannelDialogComponent {
  readonly visible = model(false);
  readonly channelTypeOptions = input<{ label: string; value: string }[]>([]);
  readonly positionOptions = input<{ label: string; value: string }[]>([]);

  readonly createChannel = output<ChatChannelCreateRequest>();

  channelName = "";
  channelDescription = "";
  channelType: ChannelType = "team_general";
  channelPosition = "";

  onClose(): void {
    this.visible.set(false);
    this.resetForm();
  }

  onChannelNameInput(value: string): void {
    this.channelName = value;
  }

  onChannelDescriptionInput(value: string): void {
    this.channelDescription = value;
  }

  onChannelTypeChange(value: ChannelType | null): void {
    this.channelType = value ?? "team_general";
    if (this.channelType !== "position_group") {
      this.channelPosition = "";
    }
  }

  onChannelTypeSelect(event: SelectChangeEvent): void {
    this.onChannelTypeChange(
      (event.value as ChannelType | null | undefined) ?? null,
    );
  }

  onChannelPositionChange(value: string | null): void {
    this.channelPosition = value ?? "";
  }

  onChannelPositionSelect(event: SelectChangeEvent): void {
    this.onChannelPositionChange(
      typeof event.value === "string" ? event.value : null,
    );
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

  private resetForm(): void {
    this.channelName = "";
    this.channelDescription = "";
    this.channelType = "team_general";
    this.channelPosition = "";
  }
}
