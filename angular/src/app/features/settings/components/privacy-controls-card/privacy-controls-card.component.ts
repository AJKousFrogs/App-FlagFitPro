import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { Divider } from "primeng/divider";
import { Select } from "primeng/select";
import { ToggleSwitch } from "primeng/toggleswitch";
import {
  ButtonComponent,
  CardComponent,
} from "../../../../shared/components/ui-components";

type VisibilityOption = {
  label: string;
  value: string;
  description: string;
};

@Component({
  selector: "app-privacy-controls-card",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    Select,
    ToggleSwitch,
    Divider,
    RouterLink,
    CardComponent,
    ButtonComponent,
  ],
  templateUrl: "./privacy-controls-card.component.html",
  styleUrl: "./privacy-controls-card.component.scss",
})
export class PrivacyControlsCardComponent {
  privacyForm = input.required<FormGroup>();
  visibilityOptions = input.required<VisibilityOption[]>();

  exportData = output<void>();
}
