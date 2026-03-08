import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { InputText } from "primeng/inputtext";
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
    InputText,
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

  onTeamNameInput(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.teamNameChange.emit(input?.value ?? "");
  }

  onTeamNotesInput(event: Event): void {
    const input = event.target as HTMLTextAreaElement | null;
    this.teamNotesChange.emit(input?.value ?? "");
  }
}
