import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { FormInputComponent } from "../../../shared/components/form-input/form-input.component";
import { SelectComponent } from "../../../shared/components/select/select.component";

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
    ReactiveFormsModule,
    FormInputComponent,
    SelectComponent,
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

  getMaxBirthDateInputValue(): string {
    const maxBirthDate = this.maxBirthDate();
    const year = maxBirthDate.getFullYear();
    const month = String(maxBirthDate.getMonth() + 1).padStart(2, "0");
    const day = String(maxBirthDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  getDateOfBirthInputValue(): string {
    const controlValue = this.profileForm().get("dateOfBirth")?.value;
    if (!controlValue) {
      return "";
    }

    const parsed = controlValue instanceof Date ? controlValue : new Date(controlValue);
    if (Number.isNaN(parsed.getTime())) {
      return "";
    }

    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  onDateOfBirthInput(value: string): void {
    const control = this.profileForm().get("dateOfBirth");
    if (!control) {
      return;
    }

    if (!value) {
      control.setValue(null);
      return;
    }

    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      return;
    }

    control.setValue(parsed);
  }

  onDateOfBirthInputEvent(event: Event): void {
    this.onDateOfBirthInput(this.readInputValue(event));
  }

  private readInputValue(event: Event): string {
    const target = event.target;
    return target instanceof HTMLInputElement ? target.value : "";
  }
}
