import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ToggleSwitch } from "primeng/toggleswitch";
import { CardComponent } from "../../../../shared/components/ui-components";

@Component({
  selector: "app-experimental-features-card",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ToggleSwitch, CardComponent],
  templateUrl: "./experimental-features-card.component.html",
  styleUrl: "./experimental-features-card.component.scss",
})
export class ExperimentalFeaturesCardComponent {
  nextGenMetricsPreview = input(false);
  nextGenMetricsPreviewChange = output<boolean>();
}
