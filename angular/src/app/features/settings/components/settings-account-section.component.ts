import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { DatePicker } from "primeng/datepicker";
import { InputText } from "primeng/inputtext";
import { Select } from "primeng/select";

import { ButtonComponent } from "../../../shared/components/button/button.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { BirthdayInputSuggestionDirective } from "../directives/birthday-input-suggestion.directive";

interface BirthdaySuggestionView {
  formatted: string;
  age: number | null;
}

interface SelectOption {
  label: string;
  value: string;
}

@Component({
  selector: "app-settings-account-section",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DatePicker,
    InputText,
    Select,
    ButtonComponent,
    CardShellComponent,
    BirthdayInputSuggestionDirective,
  ],
  templateUrl: "./settings-account-section.component.html",
  styleUrl: "./settings-account-section.component.scss",
})
export class SettingsAccountSectionComponent {
  profileForm = input.required<FormGroup>();
  maxBirthDate = input.required<Date>();
  birthdaySuggestion = input<BirthdaySuggestionView | null>(null);
  calculatedAge = input<number | null>(null);
  positionOptions = input.required<SelectOption[]>();
  availableTeams = input.required<SelectOption[]>();
  countryOptions = input.required<SelectOption[]>();

  birthdayInputTyped = output<string>();
  birthdayInputBlurred = output<void>();
  applyBirthdaySuggestion = output<void>();
  teamChange = output<string | null | undefined>();
}
