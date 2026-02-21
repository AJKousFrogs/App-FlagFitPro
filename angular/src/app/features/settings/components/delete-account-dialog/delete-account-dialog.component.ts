import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Dialog } from "primeng/dialog";
import { InputText } from "primeng/inputtext";
import {
  DialogFooterComponent,
  DialogHeaderComponent,
} from "../../../../shared/components/ui-components";

@Component({
  selector: "app-delete-account-dialog",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    Dialog,
    InputText,
    DialogHeaderComponent,
    DialogFooterComponent,
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
