import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { SelectComponent } from "../../../../shared/components/select/select.component";
import { CardShellComponent } from "../../../../shared/components/ui-components";

interface ThemeOption {
  label: string;
  value: string;
  icon: string;
}

interface LanguageOption {
  label: string;
  value: string;
  flag: string;
  native: string;
}

@Component({
  selector: "app-app-preferences-card",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, SelectComponent, CardShellComponent],
  templateUrl: "./app-preferences-card.component.html",
  styleUrl: "./app-preferences-card.component.scss",
})
export class AppPreferencesCardComponent {
  preferencesForm = input.required<FormGroup>();
  themeOptions = input.required<ThemeOption[]>();
  languageOptions = input.required<LanguageOption[]>();

  themeSelected = output<string>();
}
