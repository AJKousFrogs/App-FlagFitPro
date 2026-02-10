import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";

import { ToastService } from "../../core/services/toast.service";
import { TOAST } from "../../core/constants/toast-messages.constants";
import { TrainingMetricsService } from "../../core/services/training-metrics.service";
import { WearableParserService } from "../../core/services/wearable-parser.service";
import { getErrorMessage } from "../../shared/utils/error.utils";

@Component({
  selector: "app-import-dataset",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule,],

  template: `
    <div class="import-dataset-container">
      <div class="import-header">
        <h2 class="import-title">
          Import Training Data
        </h2>
        <p class="import-subtitle">
          Upload wearable device files or paste JSON data
        </p>
      </div>

      <!-- Tabs -->
      <div class="import-tabs">
        <button
          class="tab-button"
          [class.active]="activeTab() === 'upload'"
          (click)="activeTab.set('upload')"
        >
          Upload File
        </button>
        <button
          class="tab-button"
          [class.active]="activeTab() === 'paste'"
          (click)="activeTab.set('paste')"
        >
          Paste JSON
        </button>
      </div>

      <!-- Upload Tab -->
      @if (activeTab() === "upload") {
        <div class="upload-section">
          <div
            class="upload-area"
          >
            <input
              type="file"
              id="fileInput"
              class="upload-input"
              accept=".csv,.json,.xml"
              (change)="onFileSelected($event)"
            />
            <label for="fileInput" class="upload-label">
              <div class="upload-icon">📁</div>
              <div class="upload-title">
                Click to upload or drag and drop
              </div>
              <div class="upload-subtitle">
                CSV, JSON, or XML files
              </div>
            </label>
          </div>
          @if (selectedFile()) {
            <div class="file-info">
              <div class="file-info-row">
                <div>
                  <div class="file-name">{{ selectedFile()?.name }}</div>
                  <div class="file-size">
                    {{ (selectedFile()?.size || 0) / 1024 | number: "1.0-0" }}
                    KB
                  </div>
                </div>
                <button
                  class="primary-button"
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
          <div class="form-group">
            <label
              for="athleteId"
              class="form-label"
              >Athlete ID</label
            >
            <input
              id="athleteId"
              type="text"
              [value]="athleteId()"
              (input)="athleteId.set($any($event.target).value)"
              placeholder="Enter athlete UUID"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label
              for="jsonText"
              class="form-label"
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
              class="form-textarea"
            ></textarea>
            <small class="form-helper">
              Format: Array of objects with speed_m_s (or speed) and distance_m
              (or distance) fields
            </small>
          </div>

          <div class="form-actions">
            <button
              class="primary-button primary-button--wide"
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
          class="import-result"
          [class.import-result--success]="importResult()?.success"
          [class.import-result--error]="!importResult()?.success"
        >
          @if (importResult()?.success) {
            <div class="result-body result-body--success">
              <p class="result-title">
                ✓ Success! Dataset imported successfully.
              </p>
              <p class="result-subtitle">Metrics computed:</p>
              <ul class="result-list">
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
            <div class="result-body result-body--error">
              <p class="result-title">✗ Error:</p>
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
      const errorMessage = getErrorMessage(error, "Failed to import dataset");
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
