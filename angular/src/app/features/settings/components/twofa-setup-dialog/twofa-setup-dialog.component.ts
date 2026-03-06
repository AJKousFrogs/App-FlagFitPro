import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { Dialog } from "primeng/dialog";
import { AlertComponent } from "../../../../shared/components/alert/alert.component";
import { ButtonComponent } from "../../../../shared/components/button/button.component";
import { IconButtonComponent } from "../../../../shared/components/button/icon-button.component";
import { DialogHeaderComponent } from "../../../../shared/components/ui-components";
import { MobileOptimizedImageDirective } from "../../../../shared/directives/mobile-optimized-image.directive";

@Component({
  selector: "app-twofa-setup-dialog",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Dialog,
    AlertComponent,
    ButtonComponent,
    IconButtonComponent,
    DialogHeaderComponent,
    MobileOptimizedImageDirective,
  ],
  templateUrl: "./twofa-setup-dialog.component.html",
  styleUrl: "./twofa-setup-dialog.component.scss",
})
export class TwofaSetupDialogComponent {
  visible = input(false);
  step = input.required<number>();
  qrCodeUrl = input("");
  twoFASecret = input("");
  verificationCode = input("");
  twoFAError = input("");
  backupCodes = input<string[]>([]);
  isEnabling = input(false);

  visibleChange = output<boolean>();
  stepChange = output<number>();
  verificationCodeChange = output<string>();
  copySecret = output<void>();
  verify = output<void>();
  downloadBackupCodes = output<void>();

  closeDialog(): void {
    this.visibleChange.emit(false);
  }

  onVerificationCodeInput(event: Event): void {
    const value = (event.target as HTMLInputElement | null)?.value ?? "";
    this.verificationCodeChange.emit(value);
  }
}
