import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { Select } from "primeng/select";
import { ToggleSwitch } from "primeng/toggleswitch";
import {
  CardComponent,
  ControlRowComponent,
} from "../../../../shared/components/ui-components";

@Component({
  selector: "app-notification-preferences-card",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    Select,
    ToggleSwitch,
    CardComponent,
    ControlRowComponent,
  ],
  templateUrl: "./notification-preferences-card.component.html",
  styleUrl: "./notification-preferences-card.component.scss",
})
export class NotificationPreferencesCardComponent {
  notificationForm = input.required<FormGroup>();
}
