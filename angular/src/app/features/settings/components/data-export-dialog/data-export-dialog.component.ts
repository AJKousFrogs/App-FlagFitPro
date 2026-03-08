import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ProgressBar } from "primeng/progressbar";
import { ToggleSwitch } from "primeng/toggleswitch";
import {
  AppDialogComponent,
  DialogFooterComponent,
  DialogHeaderComponent,
} from "../../../../shared/components/ui-components";

type ExportOptions = {
  profile: boolean;
  training: boolean;
  wellness: boolean;
  achievements: boolean;
  settings: boolean;
};

@Component({
  selector: "app-data-export-dialog",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    AppDialogComponent,
    ProgressBar,
    ToggleSwitch,
    DialogHeaderComponent,
    DialogFooterComponent,
  ],
  templateUrl: "./data-export-dialog.component.html",
  styleUrl: "./data-export-dialog.component.scss",
})
export class DataExportDialogComponent {
  visible = input(false);
  exportFormat = input<"json" | "csv">("json");
  exportOptions = input.required<ExportOptions>();
  isExportingData = input(false);
  exportProgress = input(0);
  exportTakingLong = input(false);

  visibleChange = output<boolean>();
  exportFormatChange = output<"json" | "csv">();
  exportOptionsChange = output<ExportOptions>();
  submit = output<void>();

  closeDialog(): void {
    this.visibleChange.emit(false);
  }

  setFormat(format: "json" | "csv"): void {
    this.exportFormatChange.emit(format);
  }

  updateOption<K extends keyof ExportOptions>(
    key: K,
    value: ExportOptions[K] | undefined,
  ): void {
    this.exportOptionsChange.emit({
      ...this.exportOptions(),
      [key]: (value ?? false) as ExportOptions[K],
    });
  }
}
