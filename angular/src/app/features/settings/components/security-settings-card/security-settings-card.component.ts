import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";
import { Divider } from "primeng/divider";
import {
  ButtonComponent,
  CardShellComponent,
} from "../../../../shared/components/ui-components";

@Component({
  selector: "app-security-settings-card",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardShellComponent, ButtonComponent, Divider],
  templateUrl: "./security-settings-card.component.html",
  styleUrl: "./security-settings-card.component.scss",
})
export class SecuritySettingsCardComponent {
  isTwoFactorEnabled = input(false);

  changePassword = output<void>();
  enableTwoFactor = output<void>();
  disableTwoFactor = output<void>();
  viewSessions = output<void>();
  deleteAccount = output<void>();
}
