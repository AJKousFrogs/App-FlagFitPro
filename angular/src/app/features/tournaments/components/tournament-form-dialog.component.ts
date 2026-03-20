import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from "@angular/core";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { Checkbox } from "primeng/checkbox";
import { InputNumber } from "primeng/inputnumber";
import { InputText } from "primeng/inputtext";
import { Select } from "primeng/select";
import { Textarea } from "primeng/textarea";
import { Tournament } from "../../../core/services/tournament.service";
import { AlertComponent } from "../../../shared/components/alert/alert.component";
import { AppDialogComponent } from "../../../shared/components/dialog/dialog.component";
import { DialogFooterComponent } from "../../../shared/components/dialog-footer/dialog-footer.component";
import { DialogHeaderComponent } from "../../../shared/components/dialog-header/dialog-header.component";

@Component({
  selector: "app-tournament-form-dialog",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AlertComponent,
    AppDialogComponent,
    DialogHeaderComponent,
    DialogFooterComponent,
    InputText,
    InputNumber,
    Select,
    Checkbox,
    Textarea,
  ],
  templateUrl: "./tournament-form-dialog.component.html",
  styleUrl: "./tournament-form-dialog.component.scss",
})
export class TournamentFormDialogComponent {
  @Input() visible = false;
  @Input() dialogTitle = "Tournament";
  @Input() form!: FormGroup;
  @Input() loading = false;
  @Input() isPlayer = false;
  @Input() isCoachOrAdmin = false;
  @Input() editingTournament: Tournament | null = null;
  @Input() isPersonalTournament = false;
  @Input() tournamentTypes: Array<{ label: string; value: string }> = [];
  @Input() competitionLevels: Array<{ label: string; value: string }> = [];

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<void>();

  onClose(): void {
    this.visibleChange.emit(false);
  }

  getDateInputValue(controlName: string): string {
    const value = this.form?.get(controlName)?.value;
    return this.formatDateInputValue(value instanceof Date ? value : null);
  }

  onDateInput(controlName: string, value: string): void {
    this.form?.get(controlName)?.setValue(this.parseDateInputValue(value));
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
