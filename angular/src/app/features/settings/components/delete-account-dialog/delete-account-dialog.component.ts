import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { FormInputComponent } from "../../../../shared/components/form-input/form-input.component";
import {
  AppDialogComponent,
  DialogFooterComponent,
  DialogHeaderComponent,
} from "../../../../shared/components/ui-components";
import { AlertComponent } from "../../../../shared/components/alert/alert.component";

@Component({
  selector: "app-delete-account-dialog",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppDialogComponent,
    FormInputComponent,
    DialogHeaderComponent,
    DialogFooterComponent,
    AlertComponent,
  ],
  templateUrl: "./delete-account-dialog.component.html",
  styleUrl: "./delete-account-dialog.component.scss",
})
export class DeleteAccountDialogComponent {
  visible = input(false);
  confirmText = input("");
  loading = input(false);

  visibleChange = output<boolean>();
  confirmTextChange = output<string>();
  submit = output<void>();

  closeDialog(): void {
    this.visibleChange.emit(false);
  }
}
