import { ChangeDetectionStrategy, Component, input, signal, OnInit, inject } from "@angular/core";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { SelectComponent } from "../../../../shared/components/select/select.component";
import { ToggleSwitchComponent } from "../../../../shared/components/toggle-switch/toggle-switch.component";
import { AlertComponent } from "../../../../shared/components/alert/alert.component";
import { ButtonComponent } from "../../../../shared/components/button/button.component";
import {
  CardShellComponent,
  ControlRowComponent,
} from "../../../../shared/components/ui-components";
import { PlatformService } from "../../../../core/services/platform.service";

@Component({
  selector: "app-notification-preferences-card",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    SelectComponent,
    ToggleSwitchComponent,
    CardShellComponent,
    ControlRowComponent,
    AlertComponent,
    ButtonComponent,
  ],
  templateUrl: "./notification-preferences-card.component.html",
  styleUrl: "./notification-preferences-card.component.scss",
})
export class NotificationPreferencesCardComponent implements OnInit {
  private readonly platform = inject(PlatformService);

  notificationForm = input.required<FormGroup>();

  readonly pushPermission = signal<NotificationPermission | "unsupported">("default");

  /** Stable reference for p-select options (avoids churn with inline arrays in @defer). */
  readonly digestFrequencyOptions = [
    { label: "Real-time (Instant)", value: "realtime" },
    { label: "Daily Digest", value: "daily" },
    { label: "Weekly Summary", value: "weekly" },
  ];

  ngOnInit(): void {
    if (this.platform.isBrowser && "Notification" in window) {
      this.pushPermission.set(Notification.permission);
    } else {
      this.pushPermission.set("unsupported");
    }
  }

  async requestPushPermission(): Promise<void> {
    if (!this.platform.isBrowser || !("Notification" in window)) {
      this.pushPermission.set("unsupported");
      return;
    }

    const result = await Notification.requestPermission();
    this.pushPermission.set(result);

    if (result !== "granted") {
      this.notificationForm().get("pushNotifications")?.setValue(false);
    }
  }
}
