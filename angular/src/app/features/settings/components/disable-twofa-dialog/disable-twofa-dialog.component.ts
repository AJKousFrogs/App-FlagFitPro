import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Dialog } from "primeng/dialog";
import {
  DialogFooterComponent,
  DialogHeaderComponent,
} from "../../../../shared/components/ui-components";

@Component({
  selector: "app-disable-twofa-dialog",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, Dialog, DialogHeaderComponent, DialogFooterComponent],
  templateUrl: "./disable-twofa-dialog.component.html",
  styleUrl: "./disable-twofa-dialog.component.scss",
})
export class DisableTwofaDialogComponent {
  visible = input(false);
  disableCode = input("");
  loading = input(false);

  visibleChange = output<boolean>();
  disableCodeChange = output<string>();
  submit = output<void>();

  closeDialog(): void {
    this.visibleChange.emit(false);
  }
}
