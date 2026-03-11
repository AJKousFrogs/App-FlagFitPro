import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { Select } from "primeng/select";
import { CardShellComponent } from "../../../../shared/components/ui-components";

type ThemeOption = {
  label: string;
  value: string;
  icon: string;
};

type LanguageOption = {
  label: string;
  value: string;
  flag: string;
  native: string;
};

@Component({
  selector: "app-app-preferences-card",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Select, CardShellComponent],
  templateUrl: "./app-preferences-card.component.html",
  styleUrl: "./app-preferences-card.component.scss",
})
export class AppPreferencesCardComponent {
  preferencesForm = input.required<FormGroup>();
  themeOptions = input.required<ThemeOption[]>();
  languageOptions = input.required<LanguageOption[]>();

  themeSelected = output<string>();
}
