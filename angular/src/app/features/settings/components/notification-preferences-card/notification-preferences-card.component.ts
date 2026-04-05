import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { SelectComponent } from "../../../../shared/components/select/select.component";
import { ToggleSwitchComponent } from "../../../../shared/components/toggle-switch/toggle-switch.component";
import {
  CardShellComponent,
  ControlRowComponent,
} from "../../../../shared/components/ui-components";

@Component({
  selector: "app-notification-preferences-card",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    SelectComponent,
    ToggleSwitchComponent,
    CardShellComponent,
    ControlRowComponent,
  ],
  templateUrl: "./notification-preferences-card.component.html",
  styleUrl: "./notification-preferences-card.component.scss",
})
export class NotificationPreferencesCardComponent {
  notificationForm = input.required<FormGroup>();

  /** Stable reference for p-select options (avoids churn with inline arrays in @defer). */
  readonly digestFrequencyOptions = [
    { label: "Real-time (Instant)", value: "realtime" },
    { label: "Daily Digest", value: "daily" },
    { label: "Weekly Summary", value: "weekly" },
  ];
}
