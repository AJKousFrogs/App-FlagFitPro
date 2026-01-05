import {
  Component,
  input,
  output,
  signal,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { DatePicker } from "primeng/datepicker";
import { ButtonComponent } from "../button/button.component";

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

/**
 * Date Range Component - Angular 21
 *
 * A date range picker component with preset options
 * Uses Angular 21 signals for reactive state management
 */
@Component({
  selector: "app-date-range",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DatePicker, ButtonComponent],
  template: `
    <div class="date-range-group">
      @if (label()) {
        <label class="form-label">{{ label() }}</label>
      }

      <!-- Presets -->
      @if (showPresets()) {
        <div class="date-range-presets">
          @for (preset of presets(); track preset.value) {
            <app-button
              variant="text"
              size="sm"
              (clicked)="applyPreset(preset.value)"
            ></app-button>
          }
        </div>
      }

      <!-- Date Range Inputs -->
      <div class="date-range-container">
        <div class="date-range-field">
          <label [for]="id() + '-start'" class="date-range-label">
            {{ startLabel() }}
          </label>
          <p-datepicker
            [id]="id() + '-start'"
            [(ngModel)]="startDate"
            [showIcon]="true"
            [disabled]="disabled()"
            [minDate]="minDate()"
            [maxDate]="endDate() || maxDate()"
            dateFormat="mm/dd/yy"
            [showButtonBar]="true"
            (onSelect)="onStartDateChange()"
            [class.is-invalid]="invalid()"
            [attr.aria-invalid]="invalid() ? 'true' : null"
            [attr.aria-describedby]="errorMessage() ? id() + '-error' : null"
          >
          </p-datepicker>
        </div>

        <div class="date-range-separator">
          <i class="pi pi-arrow-right"></i>
        </div>

        <div class="date-range-field">
          <label [for]="id() + '-end'" class="date-range-label">
            {{ endLabel() }}
          </label>
          <p-datepicker
            [id]="id() + '-end'"
            [(ngModel)]="endDate"
            [showIcon]="true"
            [disabled]="disabled()"
            [minDate]="startDate() || minDate()"
            [maxDate]="maxDate()"
            dateFormat="mm/dd/yy"
            [showButtonBar]="true"
            (onSelect)="onEndDateChange()"
            [class.is-invalid]="invalid()"
            [attr.aria-invalid]="invalid() ? 'true' : null"
          >
          </p-datepicker>
        </div>
      </div>

      @if (helpText() && !errorMessage()) {
        <div class="form-help">{{ helpText() }}</div>
      }
      @if (errorMessage()) {
        <div [id]="id() + '-error'" class="form-error" role="alert">
          {{ errorMessage() }}
        </div>
      }
    </div>
  `,
  styleUrl: "./date-range.component.scss",
})
export class DateRangeComponent {
  // Configuration
  id = input<string>(`date-range-${Math.random().toString(36).substr(2, 9)}`);
  label = input<string>();
  startLabel = input<string>("Start Date");
  endLabel = input<string>("End Date");
  helpText = input<string>();
  errorMessage = input<string>();
  disabled = input<boolean>(false);
  invalid = input<boolean>(false);
  showPresets = input<boolean>(true);
  minDate = input<Date | null>(null);
  maxDate = input<Date | null>(null);

  // State
  startDate = signal<Date | null>(null);
  endDate = signal<Date | null>(null);
  selectedPreset = signal<string | null>(null);

  // Presets
  presets = input<Array<{ label: string; value: string }>>([
    { label: "Today", value: "today" },
    { label: "Yesterday", value: "yesterday" },
    { label: "Last 7 Days", value: "last7days" },
    { label: "Last 30 Days", value: "last30days" },
    { label: "This Month", value: "thisMonth" },
    { label: "Last Month", value: "lastMonth" },
  ]);

  // Outputs
  rangeChange = output<DateRange>();

  onStartDateChange(): void {
    this.validateRange();
    this.emitChange();
  }

  onEndDateChange(): void {
    this.validateRange();
    this.emitChange();
  }

  applyPreset(preset: string): void {
    const today = new Date();
    let start: Date;
    let end: Date;

    switch (preset) {
      case "today":
        start = new Date(today);
        end = new Date(today);
        break;
      case "yesterday":
        start = new Date(today);
        start.setDate(start.getDate() - 1);
        end = new Date(start);
        break;
      case "last7days":
        start = new Date(today);
        start.setDate(start.getDate() - 7);
        end = new Date(today);
        break;
      case "last30days":
        start = new Date(today);
        start.setDate(start.getDate() - 30);
        end = new Date(today);
        break;
      case "thisMonth":
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case "lastMonth":
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      default:
        return;
    }

    this.startDate.set(start);
    this.endDate.set(end);
    this.selectedPreset.set(preset);
    this.validateRange();
    this.emitChange();
  }

  private validateRange(): void {
    const start = this.startDate();
    const end = this.endDate();

    if (start && end && end < start) {
      // Error will be shown via errorMessage input
      return;
    }
  }

  private emitChange(): void {
    this.rangeChange.emit({
      start: this.startDate(),
      end: this.endDate(),
    });
  }
}
