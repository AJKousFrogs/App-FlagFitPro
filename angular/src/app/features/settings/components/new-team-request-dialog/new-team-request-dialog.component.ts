import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Dialog } from "primeng/dialog";
import { InputText } from "primeng/inputtext";
import {
  DialogFooterComponent,
  DialogHeaderComponent,
} from "../../../../shared/components/ui-components";

@Component({
  selector: "app-new-team-request-dialog",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    Dialog,
    InputText,
    DialogHeaderComponent,
    DialogFooterComponent,
  ],
  templateUrl: "./new-team-request-dialog.component.html",
  styleUrl: "./new-team-request-dialog.component.scss",
})
export class NewTeamRequestDialogComponent {
  visible = input(false);
  teamName = input("");
  teamNotes = input("");
  loading = input(false);

  visibleChange = output<boolean>();
  teamNameChange = output<string>();
  teamNotesChange = output<string>();
  submit = output<void>();

  closeDialog(): void {
    this.visibleChange.emit(false);
  }
}
