import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { FormInputComponent } from "../../../../shared/components/form-input/form-input.component";
import { TextareaComponent } from "../../../../shared/components/textarea/textarea.component";
import {
  AppDialogComponent,
  DialogFooterComponent,
  DialogHeaderComponent,
} from "../../../../shared/components/ui-components";
import { AlertComponent } from "../../../../shared/components/alert/alert.component";

@Component({
  selector: "app-new-team-request-dialog",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppDialogComponent,
    FormInputComponent,
    TextareaComponent,
    DialogHeaderComponent,
    DialogFooterComponent,
    AlertComponent,
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
