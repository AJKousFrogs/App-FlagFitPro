import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { Dialog } from "primeng/dialog";
import {
  DialogFooterComponent,
  DialogHeaderComponent,
} from "../../../../shared/components/ui-components";

@Component({
  selector: "app-disable-twofa-dialog",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Dialog, DialogHeaderComponent, DialogFooterComponent],
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

  onDisableCodeInput(event: Event): void {
    const value = (event.target as HTMLInputElement | null)?.value ?? "";
    this.disableCodeChange.emit(value);
  }
}
