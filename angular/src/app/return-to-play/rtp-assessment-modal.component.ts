import {
  Component,
  signal,
  computed,
  inject,
  input,
  output,
  OnInit,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { LucideAngularModule } from "lucide-angular";

import { LoggerService } from "../core/services/logger.service";
import { RtpService, AssessmentResponse } from "./services/rtp.service";

interface FunctionalCriterion {
  id: string;
  criteria_name: string;
  criteria_type: string;
  target_value: string;
  measurement_method: string;
  pass_threshold: string;
  phase_required: number;
}

interface AssessmentPayload {
  assignmentId: string;
  criteriaId: string;
  assessedValue: string;
  pass_fail: boolean;
  notes: string;
}

@Component({
  selector: "app-rtp-assessment-modal",
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 class="text-xl font-semibold text-gray-900">
            Record Assessment: {{ criterion().criteria_name }}
          </h2>
          <button
            (click)="onCancel()"
            class="text-gray-400 hover:text-gray-600"
          >
            <i-lucide name="x" class="w-5 h-5"></i-lucide>
          </button>
        </div>

        <!-- Content -->
        <div class="px-6 py-4 space-y-4">
          <!-- Criterion Details -->
          <div class="bg-gray-50 rounded-lg p-4 space-y-2">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-xs font-medium text-gray-500 uppercase">Type</p>
                <p class="text-sm font-semibold text-gray-900">{{ criterion().criteria_type }}</p>
              </div>
              <div>
                <p class="text-xs font-medium text-gray-500 uppercase">Target</p>
                <p class="text-sm font-semibold text-gray-900">{{ criterion().target_value }}</p>
              </div>
              <div class="col-span-2">
                <p class="text-xs font-medium text-gray-500 uppercase">Measurement Method</p>
                <p class="text-sm text-gray-700">{{ criterion().measurement_method }}</p>
              </div>
              <div class="col-span-2">
                <p class="text-xs font-medium text-gray-500 uppercase">Pass Threshold</p>
                <p class="text-sm text-gray-700">{{ criterion().pass_threshold }}</p>
              </div>
            </div>
          </div>

          <!-- Form Fields -->
          <div class="space-y-4">
            <!-- Assessed Value -->
            <div>
              <label for="assessedValue" class="block text-sm font-medium text-gray-700 mb-1">
                Assessed Value *
              </label>
              <input
                id="assessedValue"
                type="text"
                [(ngModel)]="assessedValue"
                placeholder="Enter the measurement result"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p class="mt-1 text-xs text-gray-500">
                Record the actual measurement (e.g., "92%", "4.2m", "78 points")
              </p>
            </div>

            <!-- Pass/Fail -->
            <fieldset>
              <legend class="block text-sm font-medium text-gray-700 mb-2">
                Result *
              </legend>
              <div class="flex gap-4">
                <label class="flex items-center">
                  <input
                    type="radio"
                    name="pass_fail"
                    [value]="true"
                    [(ngModel)]="passFail"
                    class="mr-2"
                  />
                  <span class="text-sm text-gray-700">
                    <span class="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                    Pass
                  </span>
                </label>
                <label class="flex items-center">
                  <input
                    type="radio"
                    name="pass_fail"
                    [value]="false"
                    [(ngModel)]="passFail"
                    class="mr-2"
                  />
                  <span class="text-sm text-gray-700">
                    <span class="inline-block w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                    Fail
                  </span>
                </label>
              </div>
            </fieldset>

            <!-- Notes -->
            <div>
              <label for="notes" class="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                [(ngModel)]="notes"
                placeholder="Add any observations or context (optional)"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
          <button
            (click)="onCancel()"
            class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            (click)="onSubmit()"
            [disabled]="!isValid() || loading()"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            @if (loading()) {
              <i-lucide name="loader" class="w-4 h-4 animate-spin"></i-lucide>
            }
            <span>{{ loading() ? "Submitting..." : "Record Assessment" }}</span>
          </button>
        </div>

        <!-- Error Alert -->
        @if (error()) {
          <div class="px-6 py-3 bg-red-50 border-t border-red-200 text-red-700 text-sm">
            {{ error() }}
          </div>
        }
      </div>
    </div>
  `,
})
export class RtpAssessmentModalComponent implements OnInit {
  private rtpService = inject(RtpService);
  private logger = inject(LoggerService);

  criterion = input.required<FunctionalCriterion>();
  assignmentId = input.required<string>();

  assessmentSubmitted = output<{
    criteriaId: string;
    assessedValue: string;
    pass_fail: boolean;
    phaseAdvancementEligible: boolean;
  }>();
  modalClosed = output<void>();

  loading = signal(false);
  error = signal<string | null>(null);
  assessedValue = signal("");
  passFail = signal(true);
  notes = signal("");

  isValid = computed(() => {
    return this.assessedValue().trim().length > 0;
  });

  ngOnInit() {
    this.logger.info("RtpAssessmentModalComponent initialized", {
      criterionId: this.criterion().id,
      criterionName: this.criterion().criteria_name,
    });
  }

  onSubmit() {
    if (!this.isValid()) {
      this.error.set("Please enter an assessed value");
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const payload: AssessmentPayload = {
      assignmentId: this.assignmentId(),
      criteriaId: this.criterion().id,
      assessedValue: this.assessedValue().trim(),
      pass_fail: this.passFail(),
      notes: this.notes().trim(),
    };

    this.rtpService.recordAssessment(payload as Record<string, unknown>).subscribe({
      next: (response: AssessmentResponse) => {
        this.logger.info("Assessment recorded successfully", {
          criteriaId: this.criterion().id,
          assessedValue: payload.assessedValue,
          passFail: payload.pass_fail,
        });

        this.assessmentSubmitted.emit({
          criteriaId: this.criterion().id,
          assessedValue: payload.assessedValue,
          pass_fail: payload.pass_fail,
          phaseAdvancementEligible: response?.phaseAdvancementEligible || false,
        });

        this.loading.set(false);
      },
      error: (err: { error?: { message?: string } }) => {
        this.logger.error("Failed to record assessment", err);
        this.error.set(
          err?.error?.message || "Failed to record assessment. Please try again."
        );
        this.loading.set(false);
      },
    });
  }

  onCancel() {
    this.logger.debug("Assessment modal cancelled");
    this.modalClosed.emit();
  }
}
