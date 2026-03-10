import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { Checkbox } from "primeng/checkbox";
import { DatePicker } from "primeng/datepicker";
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
    DatePicker,
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
}
