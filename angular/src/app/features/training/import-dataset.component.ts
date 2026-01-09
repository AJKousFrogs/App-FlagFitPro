import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";
import { CardModule } from "primeng/card";
import { InputTextModule } from "primeng/inputtext";
import { MessageModule } from "primeng/message";
import { ToastModule } from "primeng/toast";
import { ToastService } from "../../core/services/toast.service";
import { TOAST } from "../../core/constants/toast-messages.constants";
import { TrainingMetricsService } from "../../core/services/training-metrics.service";
import { WearableParserService } from "../../core/services/wearable-parser.service";
import { getErrorMessage } from "../../shared/utils/error.utils";

@Component({
  selector: "app-import-dataset",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    CardModule,
    InputTextModule,
    MessageModule,
    ToastModule,
  ],

  template: `
    <p-toast></p-toast>
    <div
      class="import-dataset-container bg-surface-primary p-6 rounded-lg shadow-medium max-w-4xl mx-auto"
    >
      <div class="header mb-6">
        <h2 class="text-2xl font-bold text-text-primary mb-2">
          Import Training Data
        </h2>
        <p class="text-text-secondary">
          Upload wearable device files or paste JSON data
        </p>
      </div>

      <!-- Tabs -->
      <div class="tabs mb-6 border-b border-gray-200">
        <button
          class="tab-button px-4 py-2 font-semibold"
          [class.active]="activeTab() === 'upload'"
          [class.border-b-2]="activeTab() === 'upload'"
          [class.border-brand-primary]="activeTab() === 'upload'"
          (click)="activeTab.set('upload')"
        >
          Upload File
        </button>
        <button
          class="tab-button px-4 py-2 font-semibold"
          [class.active]="activeTab() === 'paste'"
          [class.border-b-2]="activeTab() === 'paste'"
          [class.border-brand-primary]="activeTab() === 'paste'"
          (click)="activeTab.set('paste')"
        >
          Paste JSON
        </button>
      </div>

      <!-- Upload Tab -->
      @if (activeTab() === "upload") {
        <div class="upload-section">
          <div
            class="upload-area p-8 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-brand-primary transition-colors"
          >
            <input
              type="file"
              id="fileInput"
              class="hidden"
              accept=".csv,.json,.xml"
              (change)="onFileSelected($event)"
            />
            <label for="fileInput" class="cursor-pointer">
              <div class="text-4xl mb-4">📁</div>
              <div class="text-lg font-semibold text-text-primary mb-2">
                Click to upload or drag and drop
              </div>
              <div class="text-sm text-text-secondary">
                CSV, JSON, or XML files
              </div>
            </label>
          </div>
          @if (selectedFile()) {
            <div class="file-info mt-4 p-4 bg-surface-secondary rounded-lg">
              <div class="flex items-center justify-between">
                <div>
                  <div class="font-semibold">{{ selectedFile()?.name }}</div>
                  <div class="text-sm text-text-secondary">
                    {{ (selectedFile()?.size || 0) / 1024 | number: "1.0-0" }}
                    KB
                  </div>
                </div>
                <button
                  class="px-4 py-2 bg-brand-primary text-white rounded hover:bg-brand-primary-hover transition-colors"
                  (click)="parseAndImport()"
                  [disabled]="isLoading() || !athleteId()"
                >
                  Parse & Import
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Paste Tab -->
      @if (activeTab() === "paste") {
        <div class="paste-section">
          <div class="mb-4">
            <label
              for="athleteId"
              class="block text-sm font-semibold text-text-primary mb-2"
              >Athlete ID</label
            >
            <input
              id="athleteId"
              type="text"
              [value]="athleteId()"
              (input)="athleteId.set($any($event.target).value)"
              placeholder="Enter athlete UUID"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          <div class="mb-4">
            <label
              for="jsonText"
              class="block text-sm font-semibold text-text-primary mb-2"
              >Dataset JSON</label
            >
            <textarea
              id="jsonText"
              [value]="jsonText()"
              (input)="jsonText.set($any($event.target).value)"
              placeholder='Paste your dataset JSON here, e.g.:
[
  { "speed_m_s": 6.1, "distance_m": 3.2 },
  { "speed_m_s": 7.8, "distance_m": 2.9 }
]'
              [rows]="10"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary font-mono text-sm"
            ></textarea>
            <small class="text-text-secondary text-xs mt-1 block">
              Format: Array of objects with speed_m_s (or speed) and distance_m
              (or distance) fields
            </small>
          </div>

          <div class="flex justify-end">
            <button
              class="px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              [disabled]="!athleteId() || !jsonText().trim() || isLoading()"
              (click)="import()"
            >
              {{ isLoading() ? "Importing..." : "Import Dataset" }}
            </button>
          </div>
        </div>
      }

      <!-- Results -->
      @if (importResult()) {
        <div
          class="import-result mt-6 p-4 rounded-lg"
          [class]="
            importResult()?.success
              ? 'bg-green-50 border-2 border-green-500'
              : 'bg-red-50 border-2 border-red-500'
          "
        >
          @if (importResult()?.success) {
            <div class="text-green-800">
              <p class="font-bold mb-2">
                ✓ Success! Dataset imported successfully.
              </p>
              <p class="mb-2">Metrics computed:</p>
              <ul class="list-disc list-inside space-y-1">
                <li>
                  Total Volume: {{ importResult()?.metrics?.total_volume }}m
                </li>
                <li>
                  High-Speed Distance:
                  {{ importResult()?.metrics?.high_speed_distance }}m
                </li>
                <li>
                  Sprint Count: {{ importResult()?.metrics?.sprint_count }}
                </li>
                <li>
                  Duration:
                  {{ importResult()?.metrics?.duration_minutes }} minutes
                </li>
              </ul>
            </div>
          } @else {
            <div class="text-red-800">
              <p class="font-bold">✗ Error:</p>
              <p>{{ importResult()?.error }}</p>
            </div>
          }
        </div>
      }
    </div>
  `,
  styleUrl: "./import-dataset.component.scss",
})
export class ImportDatasetComponent {
  private metricsService = inject(TrainingMetricsService);
  private wearableParser = inject(WearableParserService);
  private toastService = inject(ToastService);

  // Angular 21: Use model() signals for two-way binding instead of ngModel
  athleteId = signal("");
  jsonText = signal("");
  activeTab = signal<"upload" | "paste" | "generate">("upload");
  selectedFile = signal<File | null>(null);
  isLoading = signal(false);
  importResult = signal<{
    success: boolean;
    metrics?: {
      total_volume: number;
      high_speed_distance: number;
      sprint_count: number;
      duration_minutes: number;
    };
    error?: string;
  } | null>(null);

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]);
    }
  }

  async parseAndImport() {
    const file = this.selectedFile();
    if (!file || !this.athleteId()) {
      this.toastService.warn(TOAST.WARN.MISSING_FILE_AND_ID);
      return;
    }

    this.isLoading.set(true);
    this.importResult.set(null);

    try {
      const parsed = await this.wearableParser.parseFile(file);
      const result = await this.metricsService.importOpenDataset(
        this.athleteId(),
        parsed.data,
      );

      if (result.ok) {
        this.importResult.set({
          success: true,
          metrics: result.metrics,
        });
        this.toastService.success(TOAST.SUCCESS.DATA_IMPORTED);
        this.selectedFile.set(null);
      } else {
        throw new Error("Import failed");
      }
    } catch (error) {
      const errorMessage = getErrorMessage(
        error,
        "Failed to parse and import file",
      );
      this.importResult.set({
        success: false,
        error: errorMessage,
      });
      this.toastService.error(errorMessage, "Import Failed");
    } finally {
      this.isLoading.set(false);
    }
  }

  async import() {
    const athleteId = this.athleteId();
    const jsonText = this.jsonText();
    if (!athleteId || !jsonText.trim()) {
      this.toastService.warn(TOAST.WARN.MISSING_REQUIRED_FIELDS);
      return;
    }

    this.isLoading.set(true);
    this.importResult.set(null);

    try {
      // Parse JSON
      const dataset = JSON.parse(jsonText);

      if (!Array.isArray(dataset)) {
        throw new Error("Dataset must be an array of objects");
      }

      // Import dataset
      const result = await this.metricsService.importOpenDataset(
        athleteId,
        dataset,
      );

      if (result.ok) {
        this.importResult.set({
          success: true,
          metrics: result.metrics,
        });
        this.toastService.success(TOAST.SUCCESS.DATA_IMPORTED);
        // Clear form
        this.jsonText.set("");
      } else {
        throw new Error("Import failed");
      }
    } catch (error) {
      const errorMessage = getErrorMessage(
        error,
        "Failed to import dataset",
      );
      this.importResult.set({
        success: false,
        error: errorMessage,
      });
      this.toastService.error(errorMessage, "Import Failed");
    } finally {
      this.isLoading.set(false);
    }
  }
}
