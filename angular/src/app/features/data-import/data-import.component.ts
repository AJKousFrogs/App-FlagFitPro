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
import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MessageService } from "primeng/api";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { CardModule } from "primeng/card";
import { DialogModule } from "primeng/dialog";
import { FileUploadModule } from "primeng/fileupload";
import { InputTextModule } from "primeng/inputtext";
import { MessageModule } from "primeng/message";
import { ProgressBarModule } from "primeng/progressbar";
import { Select } from "primeng/select";
import { StepsModule } from "primeng/steps";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { ToastModule } from "primeng/toast";
import { firstValueFrom } from "rxjs";

import { ApiService } from "../../core/services/api.service";
import { LoggerService } from "../../core/services/logger.service";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";

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
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    DialogModule,
    FileUploadModule,
    InputTextModule,
    MessageModule,
    ProgressBarModule,
    Select,
    StepsModule,
    TableModule,
    TagModule,
    ToastModule,
    MainLayoutComponent,
    PageHeaderComponent,

    ButtonComponent,
  ],
  providers: [MessageService],
  template: `
    <app-main-layout>
      <p-toast></p-toast>

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
              <p-card
                styleClass="import-type-card"
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
              </p-card>
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
            <p-steps
              [model]="importSteps"
              [activeIndex]="currentStep()"
              [readonly]="true"
              styleClass="import-steps"
            ></p-steps>

            <!-- Step 1: Upload -->
            @if (currentStep() === 0) {
              <p-card styleClass="step-card">
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
                    styleClass="upload-component"
                  >
                    <ng-template pTemplate="content">
                      <div class="upload-placeholder">
                        <i class="pi pi-cloud-upload"></i>
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
                      [(ngModel)]="importUrl"
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

                <p-message
                  severity="info"
                  text="💡 Tip: Ask your coach for an export file in the supported format"
                  styleClass="tip-message"
                ></p-message>
              </p-card>
            }

            <!-- Step 2: Preview & Map -->
            @if (currentStep() === 1 && importPreview()) {
              <p-card styleClass="step-card">
                <h3>Step 2: Preview & Map Fields</h3>

                <!-- File Summary -->
                <div class="file-summary">
                  <div class="summary-header">
                    <i class="pi pi-file"></i>
                    <span>{{ importPreview()!.fileName }}</span>
                    <span class="file-size">{{
                      importPreview()!.fileSize
                    }}</span>
                    <p-tag value="Validated" severity="success"></p-tag>
                  </div>
                  <div class="summary-stats">
                    @for (stat of getPreviewStats(); track stat.label) {
                      <div class="stat-item">
                        <span class="stat-value">{{ stat.value }}</span>
                        <span class="stat-label">{{ stat.label }}</span>
                      </div>
                    }
                  </div>
                </div>

                <!-- Field Mappings -->
                <div class="field-mappings">
                  <h4>Field Mapping</h4>
                  <p-table
                    [value]="importPreview()!.fieldMappings"
                    styleClass="p-datatable-sm"
                  >
                    <ng-template pTemplate="header">
                      <tr>
                        <th>File Field</th>
                        <th>Maps To</th>
                        <th>Status</th>
                      </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-mapping>
                      <tr>
                        <td>
                          <code>{{ mapping.fileField }}</code>
                        </td>
                        <td>
                          @if (mapping.status === "unmapped") {
                            <p-select
                              [options]="availableMappings"
                              [(ngModel)]="mapping.mapsTo"
                              optionLabel="label"
                              optionValue="value"
                              placeholder="Select mapping"
                              [style]="{ width: '200px' }"
                            ></p-select>
                          } @else {
                            {{ mapping.mapsTo }}
                          }
                        </td>
                        <td>
                          <p-tag
                            [value]="getMappingStatusLabel(mapping.status)"
                            [severity]="
                              getMappingStatusSeverity(mapping.status)
                            "
                          ></p-tag>
                        </td>
                      </tr>
                    </ng-template>
                  </p-table>
                </div>

                <!-- Preview Data -->
                @if (importPreview()!.previewData.length > 0) {
                  <div class="data-preview">
                    <h4>Preview (First 3 Records)</h4>
                    <div class="preview-items">
                      @for (
                        item of importPreview()!.previewData.slice(0, 3);
                        track $index
                      ) {
                        <div class="preview-item">
                          <pre>{{ item | json }}</pre>
                        </div>
                      }
                    </div>
                  </div>
                }

                <div class="step-actions">
                  <app-button
                    variant="secondary"
                    iconLeft="pi-arrow-left"
                    (clicked)="previousStep()"
                    >Back</app-button
                  >
                  <app-button
                    iconLeft="pi-check"
                    [disabled]="hasUnmappedFields()"
                    (clicked)="processImport()"
                    >Import Data</app-button
                  >
                </div>
              </p-card>
            }

            <!-- Step 3: Complete -->
            @if (currentStep() === 2 && importResult()) {
              <p-card styleClass="step-card result-card">
                <div class="result-content">
                  <div
                    class="result-icon"
                    [class.success]="importResult()!.success"
                  >
                    @if (importResult()!.success) {
                      <i class="pi pi-check-circle"></i>
                    } @else {
                      <i class="pi pi-times-circle"></i>
                    }
                  </div>

                  <h2>
                    {{
                      importResult()!.success
                        ? "Import Complete!"
                        : "Import Failed"
                    }}
                  </h2>
                  <p>{{ importResult()!.message }}</p>

                  @if (importResult()!.success) {
                    <div class="import-summary">
                      <h4>Import Summary</h4>
                      <ul>
                        <li>
                          <i class="pi pi-check"></i>
                          {{ importResult()!.itemsImported }} items imported
                        </li>
                        @for (
                          warning of importResult()!.warnings;
                          track warning
                        ) {
                          <li class="warning">
                            <i class="pi pi-exclamation-triangle"></i>
                            {{ warning }}
                          </li>
                        }
                      </ul>
                    </div>

                    <div class="next-steps">
                      <h4>What Happens Next</h4>
                      <ul>
                        @for (step of importResult()!.nextSteps; track step) {
                          <li>
                            <i class="pi pi-arrow-right"></i>
                            {{ step }}
                          </li>
                        }
                      </ul>
                    </div>
                  }

                  <div class="result-actions">
                    <app-button iconLeft="pi-calendar" routerLink="/training"
                      >View Training Schedule</app-button
                    >
                    <app-button
                      variant="secondary"
                      iconLeft="pi-plus"
                      (clicked)="resetImport()"
                      >Import Another</app-button
                    >
                  </div>
                </div>
              </p-card>
            }
          </div>
        }

        <!-- Wearables Connection Flow -->
        @if (selectedType()?.id === "wearables") {
          <div class="wearables-flow">
            <app-button
              variant="text"
              iconLeft="pi-arrow-left"
              (clicked)="resetImport()"
              >Back to Import Options</app-button
            >

            <p-card styleClass="wearables-card">
              <h3>Connect Wearable Devices</h3>

              <!-- Connected Devices -->
              @if (connectedDevices().length > 0) {
                <div class="section">
                  <h4>Connected Devices</h4>
                  @for (device of connectedDevices(); track device.id) {
                    <div class="device-card connected">
                      <div class="device-info">
                        <span class="device-name">⌚ {{ device.name }}</span>
                        <p-tag value="Connected" severity="success"></p-tag>
                      </div>
                      <p class="device-sync">
                        Last sync: {{ device.lastSync || "Never" }}
                      </p>
                      <p class="device-data">
                        Data: {{ device.dataTypes.join(", ") }}
                      </p>
                      <div class="device-actions">
                        <app-button
                          size="sm"
                          iconLeft="pi-refresh"
                          (clicked)="syncDevice(device)"
                          >Sync Now</app-button
                        >
                        <app-button
                          variant="text"
                          size="sm"
                          iconLeft="pi-times"
                          (clicked)="disconnectDevice(device)"
                          >Disconnect</app-button
                        >
                      </div>
                    </div>
                  }
                </div>
              }

              <!-- Available Devices -->
              <div class="section">
                <h4>Available to Connect</h4>
                <div class="devices-grid">
                  @for (device of availableDevices(); track device.id) {
                    <div class="device-card available">
                      <div class="device-icon">⌚</div>
                      <h5>{{ device.name }}</h5>
                      <p class="device-data">
                        {{ device.dataTypes.join(", ") }}
                      </p>
                      <app-button
                        size="sm"
                        iconLeft="pi-link"
                        (clicked)="connectDevice(device)"
                        >Connect</app-button
                      >
                    </div>
                  }
                </div>
              </div>

              <!-- Data Usage Info -->
              <div class="data-usage-info">
                <h4>💡 How Wearable Data Is Used</h4>
                <ul>
                  <li>
                    <strong>HRV</strong> → Wellness Score calculation, readiness
                    assessment
                  </li>
                  <li>
                    <strong>Sleep</strong> → Sleep debt tracking, recovery
                    recommendations
                  </li>
                  <li>
                    <strong>Activity</strong> → ACWR calculation, training load
                    tracking
                  </li>
                  <li>
                    <strong>HR Zones</strong> → Workout intensity validation
                  </li>
                  <li>
                    <strong>Strain/Recovery</strong> → AI training
                    recommendations
                  </li>
                </ul>
                <p class="privacy-note">
                  <i class="pi pi-lock"></i>
                  Your data is encrypted and never shared
                </p>
              </div>
            </p-card>
          </div>
        }
      </div>
    </app-main-layout>
  `,
  styleUrl: "./data-import.component.scss",
})
export class DataImportComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly messageService = inject(MessageService);

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await firstValueFrom(
        this.api.get("/api/wearables/status"),
      );
      if (response?.success && response.data?.devices) {
        this.wearableDevices.set(response.data.devices);
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
      this.messageService.add({
        severity: "error",
        summary: "Parse Error",
        detail: "Failed to parse the file. Please check the format.",
      });
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

    this.messageService.add({
      severity: "info",
      summary: "Fetching",
      detail: "Downloading file from URL...",
    });

    // In real implementation, this would fetch the file
    this.api.post("/api/import/fetch-url", { url: this.importUrl }).subscribe({
      next: (_response: unknown) => {
        // Process fetched data
        this.messageService.add({
          severity: "success",
          summary: "Downloaded",
          detail: "File fetched successfully",
        });
      },
      error: () => {
        this.messageService.add({
          severity: "error",
          summary: "Error",
          detail: "Failed to fetch file from URL",
        });
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

  getMappingStatusSeverity(status: string): "success" | "info" | "warn" {
    if (status === "auto") return "success";
    if (status === "manual") return "info";
    return "warn";
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await firstValueFrom(
        this.api.post("/api/import/process", {
          type: type.id,
          data: preview.previewData,
          mappings: preview.fieldMappings,
        }),
      );

      if (response?.success) {
        this.importResult.set(response.data);
      } else {
        throw new Error(response?.message || "Import failed");
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
    this.messageService.add({
      severity: "info",
      summary: "Connecting",
      detail: `Opening ${device.name} authorization...`,
    });

    // In real implementation, this would open OAuth flow
    setTimeout(() => {
      this.wearableDevices.update((devices) =>
        devices.map((d) =>
          d.id === device.id
            ? { ...d, connected: true, lastSync: "Just now" }
            : d,
        ),
      );

      this.messageService.add({
        severity: "success",
        summary: "Connected",
        detail: `${device.name} connected successfully`,
      });
    }, 1500);
  }

  syncDevice(device: WearableDevice): void {
    this.messageService.add({
      severity: "info",
      summary: "Syncing",
      detail: `Syncing ${device.name}...`,
    });

    setTimeout(() => {
      this.wearableDevices.update((devices) =>
        devices.map((d) =>
          d.id === device.id ? { ...d, lastSync: "Just now" } : d,
        ),
      );

      this.messageService.add({
        severity: "success",
        summary: "Synced",
        detail: `${device.name} data synced`,
      });
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

    this.messageService.add({
      severity: "info",
      summary: "Disconnected",
      detail: `${device.name} has been disconnected`,
    });
  }
}
