import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
  model,
} from "@angular/core";
import { firstValueFrom } from "rxjs";
import { ApiService, API_ENDPOINTS } from "../../../core/services/api.service";
import { LoggerService } from "../../../core/services/logger.service";
import { ToastService } from "../../../core/services/toast.service";
import { TOAST } from "../../../core/constants/toast-messages.constants";
import { FormInputComponent } from "../../../shared/components/form-input/form-input.component";
import { SelectComponent } from "../../../shared/components/select/select.component";
import { TextareaComponent } from "../../../shared/components/textarea/textarea.component";
import {
  AppDialogComponent,
  DialogFooterComponent,
  DialogHeaderComponent,
} from "../../../shared/components/ui-components";

interface NewSessionDraft {
  title: string;
  type: string;
  date: Date;
  duration: number;
  notes: string;
}

@Component({
  selector: "app-coach-dashboard-create-session-dialog",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormInputComponent,
    SelectComponent,
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
      ariaLabel="Create training session"
    >
      <app-dialog-header
        icon="calendar-plus"
        title="Create Training Session"
        subtitle="Schedule a new practice, prep block, or recovery session."
        (close)="close()"
      ></app-dialog-header>
      <div class="session-form">
        <div class="form-field">
          <app-form-input
            label="Session Title"
            id="coach-sessionTitle"
            name="sessionTitle"
            type="text"
            [value]="newSession.title"
            (valueChange)="onTitleInput($event)"
            placeholder="e.g., Offensive Drills"
            class="w-full"
            autocomplete="off"
          ></app-form-input>
        </div>
        <div class="form-field">
          <app-select
            label="Type"
            inputId="coach-sessionType"
            (change)="onTypeSelect($event)"
            [options]="sessionTypes"
            optionLabel="label"
            optionValue="value"
            placeholder="Select type"
            class="w-full"
            appendTo="body"
          ></app-select>
        </div>
        <div class="form-field">
          <label for="coach-sessionDate">Date &amp; Time</label>
          <input
            id="coach-sessionDate"
            name="sessionDate"
            type="datetime-local"
            [value]="getDateInputValue()"
            (input)="onDateInputEvent($event)"
            class="w-full"
          />
        </div>
        <div class="form-field">
          <app-form-input
            label="Duration (minutes)"
            id="coach-sessionDuration"
            name="sessionDuration"
            type="number"
            [value]="'' + newSession.duration"
            (valueChange)="onDurationInput($event)"
            placeholder="90"
            class="w-full"
            autocomplete="off"
          ></app-form-input>
        </div>
        <div class="form-field">
          <app-textarea
            label="Notes"
            id="coach-sessionNotes"
            name="sessionNotes"
            [value]="newSession.notes"
            (valueChange)="onNotesInput($event)"
            placeholder="Session notes..."
            [rows]="3"
            class="w-full"
            autocomplete="off"
          ></app-textarea>
        </div>
      </div>
      <app-dialog-footer
        dialogFooter
        cancelLabel="Cancel"
        primaryLabel="Create"
        primaryIcon="check"
        (cancel)="close()"
        (primary)="createSession()"
      ></app-dialog-footer>
    </app-dialog>
  `,
})
export class CoachDashboardCreateSessionDialogComponent {
  private readonly api = inject(ApiService);
  private readonly toastService = inject(ToastService);
  private readonly logger = inject(LoggerService);

  readonly visible = model.required<boolean>();
  readonly sessionCreated = output<void>();

  readonly sessionTypes = [
    { label: "Practice", value: "practice" },
    { label: "Game Prep", value: "game_prep" },
    { label: "Conditioning", value: "conditioning" },
    { label: "Film Study", value: "film_study" },
  ];

  newSession: NewSessionDraft = this.createDefaultDraft();

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

  onTitleInput(value: string): void {
    this.newSession = { ...this.newSession, title: value };
  }

  onTypeSelect(value: unknown): void {
    const type = typeof value === "string" ? value : null;
    this.newSession = { ...this.newSession, type: type ?? "practice" };
  }

  getDateInputValue(): string {
    const date = this.newSession.date;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  onDateInputEvent(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    const value = target.value;
    if (!value) return;
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return;
    this.newSession = { ...this.newSession, date: parsedDate };
  }

  onDurationInput(value: string): void {
    const parsedValue = Number.parseInt(value, 10);
    this.newSession = {
      ...this.newSession,
      duration: Number.isFinite(parsedValue) ? parsedValue : this.newSession.duration,
    };
  }

  onNotesInput(value: string): void {
    this.newSession = { ...this.newSession, notes: value };
  }

  async createSession(): Promise<void> {
    const title = this.newSession.title.trim();
    if (!title) {
      this.toastService.warn(TOAST.WARN.ENTER_SESSION_TITLE);
      return;
    }

    try {
      await firstValueFrom(
        this.api.post(API_ENDPOINTS.coach.createTrainingSession, {
          title,
          type: this.newSession.type,
          date: this.newSession.date.toISOString(),
          duration: this.newSession.duration,
          notes: this.newSession.notes,
        }),
      );
      this.toastService.success(`Training session "${title}" created`);
      this.close();
      this.sessionCreated.emit();
    } catch (error) {
      this.logger.warn(
        "[CoachDashboard] createSession API call failed, feature may not be available yet",
        error,
      );
      this.toastService.warn(
        "Session creation is not available yet. Coming soon.",
      );
    }
  }

  private resetForm(): void {
    this.newSession = this.createDefaultDraft();
  }

  private createDefaultDraft(): NewSessionDraft {
    return {
      title: "",
      type: "practice",
      date: new Date(),
      duration: 90,
      notes: "",
    };
  }
}
