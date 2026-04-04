import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { TableModule } from "primeng/table";
import { SelectComponent } from "../../../shared/components/select/select.component";

import { ButtonComponent } from "../../../shared/components/button/button.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";

type MappingStatus = "auto" | "manual" | "unmapped";

export interface DataImportFieldMapping {
  fileField: string;
  mapsTo: string;
  status: MappingStatus;
}

export interface DataImportPreview {
  fileName: string;
  fileSize: string;
  summary: Record<string, string | number>;
  fieldMappings: DataImportFieldMapping[];
  previewData: unknown[];
}

@Component({
  selector: "app-data-import-preview-step",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    CardShellComponent,
    TableModule,
    SelectComponent,
    StatusTagComponent,
    ButtonComponent,
  ],
  templateUrl: "./data-import-preview-step.component.html",
})
export class DataImportPreviewStepComponent {
  preview = input.required<DataImportPreview>();
  previewStats = input.required<{ label: string; value: string | number }[]>();
  availableMappings = input.required<{ label: string; value: string }[]>();
  hasUnmappedFields = input<boolean>(true);

  mappingChange = output<{ mapping: DataImportFieldMapping; value: string | null }>();
  back = output<void>();
  submit = output<void>();

  emitMappingChange(
    mapping: DataImportFieldMapping,
    value: unknown,
  ): void {
    this.mappingChange.emit({
      mapping,
      value: (value as string | null | undefined) ?? null,
    });
  }

  getMappingStatusLabel(status: MappingStatus): string {
    const labels: Record<MappingStatus, string> = {
      auto: "Auto-matched",
      manual: "Manually set",
      unmapped: "Needs mapping",
    };
    return labels[status];
  }

  getMappingStatusSeverity(status: MappingStatus): "success" | "info" | "warning" {
    if (status === "auto") return "success";
    if (status === "manual") return "info";
    return "warning";
  }
}
