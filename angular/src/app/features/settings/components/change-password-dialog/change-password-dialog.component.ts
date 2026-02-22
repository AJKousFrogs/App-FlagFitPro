import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { Dialog } from "primeng/dialog";
import { Password } from "primeng/password";
import {
  DialogFooterComponent,
  DialogHeaderComponent,
} from "../../../../shared/components/ui-components";

@Component({
  selector: "app-change-password-dialog",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    Dialog,
    Password,
    DialogHeaderComponent,
    DialogFooterComponent,
  ],
  templateUrl: "./change-password-dialog.component.html",
  styleUrl: "./change-password-dialog.component.scss",
})
export class ChangePasswordDialogComponent {
  visible = input(false);
  passwordForm = input.required<FormGroup>();
  loading = input(false);

  visibleChange = output<boolean>();
  submit = output<void>();

  hasUppercase(): boolean {
    const password = this.passwordForm().get("newPassword")?.value || "";
    return /[A-Z]/.test(password);
  }

  hasNumber(): boolean {
    const password = this.passwordForm().get("newPassword")?.value || "";
    return /\d/.test(password);
  }

  hasSpecialChar(): boolean {
    const password = this.passwordForm().get("newPassword")?.value || "";
    return /[!@#$%^&*(),.?":{}|<>]/.test(password);
  }

  passwordsMatch(): boolean {
    const newPassword = this.passwordForm().get("newPassword")?.value;
    const confirmPassword = this.passwordForm().get("confirmNewPassword")?.value;
    return newPassword === confirmPassword && !!newPassword;
  }

  closeDialog(): void {
    this.visibleChange.emit(false);
  }
}
