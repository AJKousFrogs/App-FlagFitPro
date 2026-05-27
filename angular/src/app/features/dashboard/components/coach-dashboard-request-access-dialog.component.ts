import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
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
  selector: "app-coach-dashboard-request-access-dialog",
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
      ariaLabel="Request data access"
    >
      <app-dialog-header
        icon="shield"
        title="Request Data Access"
        subtitle="Ask a player to share their wellness and training data."
        (close)="close()"
      ></app-dialog-header>
      <div class="request-access-form">
        <p class="request-intro">
          Send a non-pushy request to the player to share their wellness and
          training data.
        </p>
        <div class="form-field">
          <app-textarea
            label="Message"
            id="accessMessage"
            [value]="requestAccessMessage()"
            (valueChange)="onMessageInput($event)"
            placeholder="Type your request message..."
            [rows]="4"
            class="w-full"
          ></app-textarea>
        </div>
      </div>
      <app-dialog-footer
        dialogFooter
        cancelLabel="Cancel"
        primaryLabel="Send Request"
        primaryIcon="send"
        (cancel)="close()"
        (primary)="sendAccessRequest()"
      ></app-dialog-footer>
    </app-dialog>
  `,
})
export class CoachDashboardRequestAccessDialogComponent {
  private readonly api = inject(ApiService);
  private readonly toastService = inject(ToastService);
  private readonly logger = inject(LoggerService);

  readonly visible = model.required<boolean>();
  readonly playerId = input<string | null>(null);
  readonly accessRequested = output<void>();

  readonly requestAccessMessage = signal("");

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

  /** Set the initial message (called by parent when opening the dialog) */
  setInitialMessage(message: string): void {
    this.requestAccessMessage.set(message);
  }

  onMessageInput(value: string): void {
    this.requestAccessMessage.set(value);
  }

  async sendAccessRequest(): Promise<void> {
    const playerIdValue = this.playerId();
    const message = this.requestAccessMessage().trim();
    if (!playerIdValue || !message) {
      this.toastService.warn(TOAST.WARN.ENTER_MESSAGE);
      return;
    }

    try {
      await firstValueFrom(
        this.api.post(API_ENDPOINTS.coach.accessRequest, {
          playerId: playerIdValue,
          message,
        }),
      );
      this.toastService.success(TOAST.SUCCESS.ACCESS_REQUEST_SENT);
      this.close();
      this.accessRequested.emit();
    } catch (error) {
      this.logger.error("coach_dashboard_operation_failed", error, {
        operation: "send access request",
      });
      this.toastService.error(TOAST.ERROR.MESSAGE_SEND_FAILED);
    }
  }

  private resetForm(): void {
    this.requestAccessMessage.set("");
  }
}
