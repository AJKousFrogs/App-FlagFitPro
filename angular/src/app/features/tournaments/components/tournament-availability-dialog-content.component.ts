import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { Checkbox } from "primeng/checkbox";
import { InputText } from "primeng/inputtext";
import { Textarea } from "primeng/textarea";

import type { Tournament } from "../../../core/services/tournament.service";

interface AvailabilityOption {
  value: "pending" | "confirmed" | "declined" | "tentative";
  label: string;
  icon: string;
}

@Component({
  selector: "app-tournament-availability-dialog-content",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Checkbox,
    InputText,
    Textarea,
  ],
  templateUrl: "./tournament-availability-dialog-content.component.html",
  styleUrl: "./tournament-availability-dialog-content.component.scss",
})
export class TournamentAvailabilityDialogContentComponent {
  readonly tournament = input.required<Tournament>();
  readonly dateRangeLabel = input.required<string>();
  readonly availabilityForm = input.required<FormGroup>();
  readonly availabilityOptions = input.required<AvailabilityOption[]>();
  readonly currentStatus = input.required<
    "pending" | "confirmed" | "declined" | "tentative"
  >();
  readonly tournamentCost = input(0);

  readonly setStatus = output<
    "pending" | "confirmed" | "declined" | "tentative"
  >();

  getDateInputValue(controlName: string): string {
    const value = this.availabilityForm().get(controlName)?.value;
    return this.formatDateInputValue(value instanceof Date ? value : null);
  }

  onDateInput(controlName: string, value: string): void {
    this.availabilityForm().get(controlName)?.setValue(
      this.parseDateInputValue(value),
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
