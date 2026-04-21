import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { Tournament } from "../../../core/services/tournament.service";
import { AlertComponent } from "../../../shared/components/alert/alert.component";
import { CheckboxComponent } from "../../../shared/components/checkbox/checkbox.component";
import { AppDialogComponent } from "../../../shared/components/dialog/dialog.component";
import { DialogFooterComponent } from "../../../shared/components/dialog-footer/dialog-footer.component";
import { DialogHeaderComponent } from "../../../shared/components/dialog-header/dialog-header.component";
import { InputNumberComponent } from "../../../shared/components/input-number/input-number.component";
import { SelectComponent } from "../../../shared/components/select/select.component";
import { TextareaComponent } from "../../../shared/components/textarea/textarea.component";
import { FormInputComponent } from "../../../shared/components/form-input/form-input.component";

@Component({
  selector: "app-tournament-form-dialog",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    AlertComponent,
    AppDialogComponent,
    DialogHeaderComponent,
    DialogFooterComponent,
    CheckboxComponent,
    InputNumberComponent,
    SelectComponent,
    TextareaComponent,
    FormInputComponent,
  ],
  templateUrl: "./tournament-form-dialog.component.html",
  styleUrl: "./tournament-form-dialog.component.scss",
})
export class TournamentFormDialogComponent {
  visible = input(false);
  dialogTitle = input("Tournament");
  form = input.required<FormGroup>();
  loading = input(false);
  isPlayer = input(false);
  isCoachOrAdmin = input(false);
  editingTournament = input<Tournament | null>(null);
  isPersonalTournament = input(false);
  tournamentTypes = input<{ label: string; value: string }[]>([]);
  competitionLevels = input<{ label: string; value: string }[]>([]);

  visibleChange = output<boolean>();
  save = output<void>();

  onClose(): void {
    this.visibleChange.emit(false);
  }

  getDateInputValue(controlName: string): string {
    const value = this.form()?.get(controlName)?.value;
    return this.formatDateInputValue(value instanceof Date ? value : null);
  }

  onDateInput(controlName: string, value: string): void {
    this.form()?.get(controlName)?.setValue(this.parseDateInputValue(value));
  }

  onDateInputEvent(controlName: string, event: Event): void {
    const target = event.target;
    this.onDateInput(
      controlName,
      target instanceof HTMLInputElement ? target.value : "",
    );
  }

  private formatDateInputValue(value: Date | null): string {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      return "";
    }

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  private parseDateInputValue(value: string): Date | null {
    if (!value) {
      return null;
    }

    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
}
