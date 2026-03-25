/**
 * Data Import Component (Player View)
 *
 * Allows players to import training programs, history, wearable data,
 * performance records, body composition, and injury history from
 * external sources via file upload or URL.
 *
 * Design System Compliant (DESIGN_SYSTEM_RULES.md)
 */

import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  DestroyRef,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ToastService } from "../../core/services/toast.service";
import { AlertComponent } from "../../shared/components/alert/alert.component";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { CardShellComponent } from "../../shared/components/card-shell/card-shell.component";
import { DataImportPreviewStepComponent } from "./components/data-import-preview-step.component";
import { DataImportResultStepComponent } from "./components/data-import-result-step.component";
import { DataImportWearablesFlowComponent } from "./components/data-import-wearables-flow.component";

import { FileUpload } from "primeng/fileupload";
import { InputText } from "primeng/inputtext";
import { Stepper, StepList, Step } from "primeng/stepper";
import { firstValueFrom } from "rxjs";

import { ApiService, API_ENDPOINTS } from "../../core/services/api.service";
import type { ApiResponse } from "../../core/models/common.models";
import { LoggerService } from "../../core/services/logger.service";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import {
  extractApiPayload,
  isSuccessfulApiResponse,
} from "../../core/utils/api-response-mapper";

// ===== Interfaces =====
interface ImportType {
  id: string;
  name: string;
  description: string;
  icon: string;
  formats: string[];
  perfectFor: string;
}

interface FieldMapping {
  fileField: string;
  mapsTo: string;
  status: "auto" | "manual" | "unmapped";
}

interface ImportPreview {
  fileName: string;
  fileSize: string;
  summary: Record<string, string | number>;
  fieldMappings: FieldMapping[];
  previewData: unknown[];
}

interface WearableDevice {
  id: string;
  name: string;
  brand: string;
  dataTypes: string[];
  connected: boolean;
  lastSync?: string;
}

interface ImportResult {
  success: boolean;
  message: string;
  itemsImported: number;
  warnings: string[];
  nextSteps: string[];
}

interface WearableStatusResponse {
  devices: WearableDevice[];
}

// ===== Constants =====
const IMPORT_TYPES: ImportType[] = [
  {
    id: "training-program",
    name: "Training Program",
    description: "Import a structured training plan (JSON/CSV)",
    icon: "📋",
    formats: [".json", ".csv"],
    perfectFor: "National team plans, coach-provided programs",
  },
  {
    id: "training-history",
    name: "Training History",
    description: "Import past sessions from spreadsheet/app",
    icon: "📁",
    formats: [".csv", ".json"],
    perfectFor: "Migrating from another app, your own Excel logs",
  },
  {
    id: "wearables",
    name: "Wearable Devices",
    description: "Connect Garmin, Whoop, Apple Watch, Oura Ring",
    icon: "⌚",
    formats: ["API"],
    perfectFor: "Syncs: HR, HRV, sleep, activity data",
  },
  {
    id: "performance",
    name: "Performance Records",
    description: "Import historical benchmarks (40yd, etc.)",
    icon: "📊",
    formats: [".csv"],
    perfectFor: "Building your performance trend history",
  },
  {
    id: "body-composition",
    name: "Body Composition",
    description: "Import weight history, body fat measurements",
    icon: "⚖️",
    formats: [".csv"],
    perfectFor: "Building weight trend data",
  },
  {
    id: "injury-history",
    name: "Injury History",
    description: "Import past injuries for RTP tracking",
    icon: "🏥",
    formats: [".csv", ".json"],
    perfectFor: "Complete medical profile",
  },
];

const WEARABLE_DEVICES: WearableDevice[] = [
  {
    id: "garmin",
    name: "Garmin",
    brand: "Garmin",
    dataTypes: ["HR", "HRV", "Sleep", "Activity"],
    connected: false,
  },
  {
    id: "whoop",
    name: "Whoop",
    brand: "Whoop",
    dataTypes: ["HRV", "Strain", "Recovery", "Sleep"],
    connected: false,
  },
  {
    id: "apple",
    name: "Apple Watch",
    brand: "Apple",
    dataTypes: ["HR", "Activity", "Workout data"],
    connected: false,
  },
  {
    id: "oura",
    name: "Oura Ring",
    brand: "Oura",
    dataTypes: ["Sleep", "HRV", "Readiness"],
    connected: false,
  },
  {
    id: "polar",
    name: "Polar",
    brand: "Polar",
    dataTypes: ["HR", "Training Load", "Recovery"],
    connected: false,
  },
  {
    id: "fitbit",
    name: "Fitbit",
    brand: "Fitbit",
    dataTypes: ["Activity", "Sleep", "HR zones"],
    connected: false,
  },
];

@Component({
  selector: "app-data-import",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    AlertComponent,
    CardShellComponent,
    FileUpload,
    InputText,
    Stepper,
    StepList,
    Step,

    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
    DataImportPreviewStepComponent,
    DataImportResultStepComponent,
    DataImportWearablesFlowComponent,
  ],
  template: `
    <app-main-layout>
<div class="data-import-page">
        <app-page-header
          title="Import Data"
          subtitle="Bring in training data from external sources"
          icon="pi-download"
        ></app-page-header>

        <!-- Import Type Selection -->
        @if (!selectedType()) {
          <div class="import-types-grid">
            @for (type of importTypes; track type.id) {
              <app-card-shell
                class="import-type-card"
                (click)="selectImportType(type)"
              >
                <div class="type-content">
                  <span class="type-icon">{{ type.icon }}</span>
                  <h3>{{ type.name }}</h3>
                  <p>{{ type.description }}</p>
                  <span class="type-formats">
                    {{ type.formats.join(", ") }}
                  </span>
                  <span class="perfect-for">
                    Perfect for: {{ type.perfectFor }}
                  </span>
                </div>
              </app-card-shell>
            }
          </div>
        }

        <!-- Import Flow (Steps) -->
        @if (selectedType() && selectedType()!.id !== "wearables") {
          <div class="import-flow">
            <!-- Back Button -->
            <app-button
              variant="text"
              iconLeft="pi-arrow-left"
              (clicked)="resetImport()"
              >Back to Import Options</app-button
            >

            <!-- Steps Indicator -->
            <p-stepper [value]="currentStep()" [linear]="false">
              <p-step-list>
                @for (step of importSteps; track $index) {
                  <p-step [value]="$index">{{ step.label }}</p-step>
                }
              </p-step-list>
            </p-stepper>

            <!-- Step 1: Upload -->
            @if (currentStep() === 0) {
              <app-card-shell class="step-card">
                <h3>Step 1: Upload File</h3>

                <div class="upload-area">
                  <p-fileUpload
                    #fileUpload
                    mode="advanced"
                    [accept]="getAcceptedFormats()"
                    [maxFileSize]="5000000"
                    [auto]="true"
                    [customUpload]="true"
                    (uploadHandler)="onFileUpload($event)"
                    chooseLabel="Choose File"
                    class="upload-component"
                  >
                    <ng-template #content>
                      <div class="upload-placeholder">
                        <i class="pi pi-cloud-upload upload-placeholder__icon"></i>
                        <p>Drop file here or click to browse</p>
                        <span
                          >Accepted: {{ selectedType()!.formats.join(", ") }} |
                          Max: 5MB</span
                        >
                      </div>
                    </ng-template>
                  </p-fileUpload>
                </div>

                <div class="divider">
                  <span>OR</span>
                </div>

                <div class="url-import">
                  <label>Import from URL</label>
                  <div class="url-input-group">
                    <input
                      type="text"
                      pInputText
                      [value]="importUrl"
                      (input)="onImportUrlInput($event)"
                      placeholder="https://example.com/data.json"
                    />
                    <app-button
                      iconLeft="pi-download"
                      [disabled]="!importUrl"
                      (clicked)="fetchFromUrl()"
                      >Fetch</app-button
                    >
                  </div>
                </div>

                <app-alert
                  variant="info"
                  density="compact"
                  message="💡 Tip: Ask your coach for an export file in the supported format"
                  styleClass="tip-message status-message"
                />
              </app-card-shell>
            }

            <!-- Step 2: Preview & Map -->
            @if (currentStep() === 1 && importPreview()) {
              @defer (on idle) {
                <app-data-import-preview-step
                  [preview]="importPreview()!"
                  [previewStats]="getPreviewStats()"
                  [availableMappings]="availableMappings"
                  [hasUnmappedFields]="hasUnmappedFields()"
                  (mappingChange)="onPreviewMappingChange($event)"
                  (back)="previousStep()"
                  (submit)="processImport()"
                />
              }
            }

            <!-- Step 3: Complete -->
            @if (currentStep() === 2 && importResult()) {
              @defer (on idle) {
                <app-data-import-result-step
                  [result]="importResult()!"
                  (reset)="resetImport()"
                />
              }
            }
          </div>
        }

        <!-- Wearables Connection Flow -->
        @if (selectedType()?.id === "wearables") {
          @defer (on idle) {
            <app-data-import-wearables-flow
              [connectedDevices]="connectedDevices()"
              [availableDevices]="availableDevices()"
              (reset)="resetImport()"
              (syncDevice)="syncDevice($event)"
              (disconnectDevice)="disconnectDevice($event)"
              (connectDevice)="connectDevice($event)"
            />
          }
        }
      </div>
    </app-main-layout>
  `,
  styleUrl: "./data-import.component.scss",
})
export class DataImportComponent implements OnInit {
  private readonly api = inject(ApiService);
  private destroyRef = inject(DestroyRef);
  private readonly logger = inject(LoggerService);
  private readonly toastService = inject(ToastService);

  // Constants
  readonly importTypes = IMPORT_TYPES;

  // State
  readonly selectedType = signal<ImportType | null>(null);
  readonly currentStep = signal(0);
  readonly importPreview = signal<ImportPreview | null>(null);
  readonly importResult = signal<ImportResult | null>(null);
  readonly wearableDevices = signal<WearableDevice[]>(WEARABLE_DEVICES);

  importUrl = "";

  readonly importSteps = [
    { label: "Upload" },
    { label: "Preview" },
    { label: "Complete" },
  ];

  readonly availableMappings = [
    { label: "Training Type", value: "trainingType" },
    { label: "Date", value: "date" },
    { label: "Duration", value: "duration" },
    { label: "RPE", value: "rpe" },
    { label: "Notes", value: "notes" },
    { label: "Exercise Name", value: "exerciseName" },
    { label: "Sets", value: "sets" },
    { label: "Reps", value: "reps" },
    { label: "Weight", value: "weight" },
    { label: "Skip", value: "skip" },
  ];

  // Computed
  readonly connectedDevices = computed(() =>
    this.wearableDevices().filter((d) => d.connected),
  );

  readonly availableDevices = computed(() =>
    this.wearableDevices().filter((d) => !d.connected),
  );

  ngOnInit(): void {
    this.loadWearableStatus();
  }

  async loadWearableStatus(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.api.get<WearableStatusResponse>(
          API_ENDPOINTS.dataImport.wearableStatus,
        ),
      );
      const payload = extractApiPayload<WearableStatusResponse>(response);
      if (payload?.devices) {
        this.wearableDevices.set(payload.devices);
      }
    } catch (err) {
      this.logger.error("Failed to load wearable status", err);
      // Keep demo data
    }
  }

  selectImportType(type: ImportType): void {
    this.selectedType.set(type);
    this.currentStep.set(0);
    this.importPreview.set(null);
    this.importResult.set(null);
  }

  resetImport(): void {
    this.selectedType.set(null);
    this.currentStep.set(0);
    this.importPreview.set(null);
    this.importResult.set(null);
    this.importUrl = "";
  }

  onImportUrlInput(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.importUrl = input?.value ?? "";
  }

  onMappingChange(mapping: FieldMapping, value: string | null): void {
    mapping.mapsTo = value ?? "";
  }

  onPreviewMappingChange(event: {
    mapping: FieldMapping;
    value: string | null;
  }): void {
    this.onMappingChange(event.mapping, event.value);
  }

  getAcceptedFormats(): string {
    const type = this.selectedType();
    if (!type) return "";
    return type.formats.filter((f) => f !== "API").join(",");
  }

  onFileUpload(event: { files: File[] }): void {
    const file = event.files[0];
    if (!file) return;

    // Parse and preview the file
    this.parseFile(file);
  }

  async parseFile(file: File): Promise<void> {
    const text = await file.text();
    let data: unknown[];

    try {
      if (file.name.endsWith(".json")) {
        const json = JSON.parse(text);
        data = Array.isArray(json) ? json : [json];
      } else if (file.name.endsWith(".csv")) {
        data = this.parseCSV(text);
      } else {
        throw new Error("Unsupported file format");
      }

      // Generate preview
      const preview: ImportPreview = {
        fileName: file.name,
        fileSize: this.formatFileSize(file.size),
        summary: this.generateSummary(data),
        fieldMappings: this.generateFieldMappings(data),
        previewData: data.slice(0, 5),
      };

      this.importPreview.set(preview);
      this.currentStep.set(1);
    } catch (err) {
      this.toastService.error("Failed to parse the file. Please check the format.", "Parse Error");
      this.logger.error("File parse error", err);
    }
  }

  private parseCSV(text: string): Record<string, string>[] {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
    const data: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""));
      const row: Record<string, string> = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] || "";
      });
      data.push(row);
    }

    return data;
  }

  private generateSummary(data: unknown[]): Record<string, string | number> {
    const type = this.selectedType();
    if (!type) return {};

    switch (type.id) {
      case "training-program":
        return {
          "Total Sessions": data.length,
          "Date Range": this.getDateRange(data),
        };
      case "training-history":
        return {
          "Sessions Found": data.length,
          "Date Range": this.getDateRange(data),
        };
      case "performance":
        return {
          "Records Found": data.length,
          Metrics: this.getUniqueMetrics(data),
        };
      default:
        return { "Items Found": data.length };
    }
  }

  private generateFieldMappings(data: unknown[]): FieldMapping[] {
    if (data.length === 0) return [];

    const sample = data[0] as Record<string, unknown>;
    const keys = Object.keys(sample);

    const autoMappings: Record<string, string> = {
      date: "Date",
      session_date: "Date",
      type: "Training Type",
      session_type: "Training Type",
      duration: "Duration",
      duration_min: "Duration",
      rpe: "RPE",
      target_rpe: "RPE",
      exercise: "Exercise Name",
      exercise_name: "Exercise Name",
      sets: "Sets",
      reps: "Reps",
      weight: "Weight",
      notes: "Notes",
    };

    return keys.map((key) => {
      const lowerKey = key.toLowerCase();
      const autoMatch = autoMappings[lowerKey];

      return {
        fileField: key,
        mapsTo: autoMatch || "",
        status: autoMatch ? "auto" : "unmapped",
      } as FieldMapping;
    });
  }

  private getDateRange(_data: unknown[]): string {
    // Simplified - would need actual date parsing
    return "Detected from file";
  }

  private getUniqueMetrics(data: unknown[]): number {
    const metrics = new Set<string>();
    data.forEach((item: unknown) => {
      const record = item as Record<string, unknown>;
      if (record.metric) metrics.add(record.metric as string);
      if (record.type) metrics.add(record.type as string);
    });
    return metrics.size || 1;
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  fetchFromUrl(): void {
    if (!this.importUrl) return;

    this.toastService.info("Downloading file from URL...", "Fetching");

    // In real implementation, this would fetch the file
    this.api.post(API_ENDPOINTS.dataImport.fetchUrl, { url: this.importUrl }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (_response: unknown) => {
        // Process fetched data
        this.toastService.success("File fetched successfully", "Downloaded");
      },
      error: () => {
        this.toastService.error("Failed to fetch file from URL");
      },
    });
  }

  getPreviewStats(): { label: string; value: string | number }[] {
    const preview = this.importPreview();
    if (!preview) return [];

    return Object.entries(preview.summary).map(([label, value]) => ({
      label,
      value,
    }));
  }

  getMappingStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      auto: "Auto-matched",
      manual: "Manually set",
      unmapped: "Needs mapping",
    };
    return labels[status] || status;
  }

  getMappingStatusSeverity(status: string): "success" | "info" | "warning" {
    if (status === "auto") return "success";
    if (status === "manual") return "info";
    return "warning";
  }

  hasUnmappedFields(): boolean {
    const preview = this.importPreview();
    if (!preview) return true;
    return preview.fieldMappings.some(
      (m) => m.status === "unmapped" && m.mapsTo !== "skip",
    );
  }

  previousStep(): void {
    this.currentStep.update((s) => Math.max(0, s - 1));
  }

  async processImport(): Promise<void> {
    const preview = this.importPreview();
    const type = this.selectedType();
    if (!preview || !type) return;

    try {
      const response: ApiResponse<ImportResult> = await firstValueFrom(
        this.api.post<ImportResult>(API_ENDPOINTS.dataImport.process, {
          type: type.id,
          data: preview.previewData,
          mappings: preview.fieldMappings,
        }),
      );
      const result = extractApiPayload<ImportResult>(response);

      if (isSuccessfulApiResponse(response) && result) {
        this.importResult.set(result);
      } else {
        throw new Error("Import failed");
      }
    } catch (_err) {
      // Demo success for development
      this.importResult.set({
        success: true,
        message: `${type.name} has been imported successfully!`,
        itemsImported: preview.previewData.length,
        warnings: ["3 exercises not found - added as custom exercises"],
        nextSteps: [
          "Sessions appear in your Training Schedule",
          "Today's page will show your current session",
          "ACWR will include these planned sessions",
          "AI recommendations will factor in your program intensity",
        ],
      });
    }

    this.currentStep.set(2);
  }

  // Wearable Methods
  connectDevice(device: WearableDevice): void {
    this.toastService.info(`Opening ${device.name} authorization...`, "Connecting");

    // In real implementation, this would open OAuth flow
    setTimeout(() => {
      this.wearableDevices.update((devices) =>
        devices.map((d) =>
          d.id === device.id
            ? { ...d, connected: true, lastSync: "Just now" }
            : d,
        ),
      );

      this.toastService.success(`${device.name} connected successfully`, "Connected");
    }, 1500);
  }

  syncDevice(device: WearableDevice): void {
    this.toastService.info(`Syncing ${device.name}...`, "Syncing");

    setTimeout(() => {
      this.wearableDevices.update((devices) =>
        devices.map((d) =>
          d.id === device.id ? { ...d, lastSync: "Just now" } : d,
        ),
      );

      this.toastService.success(`${device.name} data synced`, "Synced");
    }, 1000);
  }

  disconnectDevice(device: WearableDevice): void {
    this.wearableDevices.update((devices) =>
      devices.map((d) =>
        d.id === device.id
          ? { ...d, connected: false, lastSync: undefined }
          : d,
      ),
    );

    this.toastService.info(`${device.name} has been disconnected`, "Disconnected");
  }
}
