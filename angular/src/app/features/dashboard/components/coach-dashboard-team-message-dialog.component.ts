import {
  ChangeDetectionStrategy,
  Component,
  inject,
  model,
  output,
  signal,
} from "@angular/core";
import { firstValueFrom } from "rxjs";
import { ApiService, API_ENDPOINTS } from "../../../core/services/api.service";
import { LoggerService } from "../../../core/services/logger.service";
import { ToastService } from "../../../core/services/toast.service";
import { TOAST } from "../../../core/constants/toast-messages.constants";
import { TextareaComponent } from "../../../shared/components/textarea/textarea.component";
import {
  AppDialogComponent,
  DialogFooterComponent,
  DialogHeaderComponent,
} from "../../../shared/components/ui-components";

@Component({
  selector: "app-coach-dashboard-team-message-dialog",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TextareaComponent,
    AppDialogComponent,
    DialogFooterComponent,
    DialogHeaderComponent,
  ],
  template: `
    <app-dialog
      [visible]="visible()"
      (visibleChange)="onVisibleChange($event)"
      [modal]="true"
      class="dashboard-dialog"
      [blockScroll]="true"
      [draggable]="false"
      ariaLabel="Send team message"
    >
      <app-dialog-header
        icon="send"
        title="Send Team Message"
        subtitle="Broadcast a clear update to the full team."
        (close)="close()"
      ></app-dialog-header>
      <div class="message-form">
        <div class="form-field">
          <app-textarea
            label="Message"
            id="messageContent"
            [value]="teamMessageContent()"
            (valueChange)="onContentInput($event)"
            placeholder="Type your message to the team..."
            [rows]="5"
            class="w-full"
          ></app-textarea>
        </div>
      </div>
      <app-dialog-footer
        dialogFooter
        cancelLabel="Cancel"
        primaryLabel="Send"
        primaryIcon="send"
        (cancel)="close()"
        (primary)="sendTeamMessage()"
      ></app-dialog-footer>
    </app-dialog>
  `,
})
export class CoachDashboardTeamMessageDialogComponent {
  private readonly api = inject(ApiService);
  private readonly toastService = inject(ToastService);
  private readonly logger = inject(LoggerService);

  readonly visible = model.required<boolean>();
  readonly messageSent = output<void>();

  readonly teamMessageContent = signal("");

  onVisibleChange(value: boolean): void {
    this.visible.set(value);
    if (!value) {
      this.resetForm();
    }
  }

  close(): void {
    this.visible.set(false);
    this.resetForm();
  }

  onContentInput(value: string): void {
    this.teamMessageContent.set(value);
  }

  async sendTeamMessage(): Promise<void> {
    const message = this.teamMessageContent().trim();
    if (!message) {
      this.toastService.warn(TOAST.WARN.ENTER_MESSAGE);
      return;
    }

    try {
      await firstValueFrom(
        this.api.post(API_ENDPOINTS.coach.teamMessage, { message }),
      );
      this.toastService.success(TOAST.SUCCESS.MESSAGE_SENT_TO_TEAM);
      this.close();
      this.messageSent.emit();
    } catch (error) {
      this.logger.error("coach_dashboard_operation_failed", error, {
        operation: "send team message",
      });
      this.toastService.error(TOAST.ERROR.MESSAGE_SEND_FAILED);
    }
  }

  private resetForm(): void {
    this.teamMessageContent.set("");
  }
}
