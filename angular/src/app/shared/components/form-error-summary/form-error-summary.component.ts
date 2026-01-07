/**
 * Form Error Summary Component
 * 
 * WCAG 2.1 Success Criterion 3.3.1 (Error Identification) - Level A
 * WCAG 2.1 Success Criterion 3.3.3 (Error Suggestion) - Level AA
 * 
 * Evidence: Baymard Institute - 60% → 85% error recovery rate with summaries
 * Pattern: GOV.UK Design System (mandatory), Microsoft Fluent UI
 * 
 * Displays a summary of form errors at the top of the form with:
 * - Clear error count
 * - Clickable links to jump to each error field
 * - Screen reader announcements
 * - Auto-scroll to summary on submit with errors
 */

import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
  effect,
  ElementRef,
  inject,
} from "@angular/core";
import { CommonModule } from "@angular/common";

export interface FormError {
  /** Field identifier (matches form control name or ID) */
  field: string;
  
  /** User-friendly field label */
  fieldLabel: string;
  
  /** Error message to display */
  message: string;
  
  /** Optional: Suggestion for fixing the error */
  suggestion?: string;
}

@Component({
  selector: "app-form-error-summary",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    @if (errors().length > 0) {
      <div 
        class="error-summary"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        tabindex="-1"
        #errorSummary
      >
        <div class="error-summary-header">
          <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
          <h2 class="error-summary-title">
            @if (errors().length === 1) {
              There is 1 error preventing submission
            } @else {
              There are {{ errors().length }} errors preventing submission
            }
          </h2>
        </div>
        
        <ul class="error-summary-list">
          @for (error of errors(); track error.field) {
            <li class="error-summary-item">
              <button
                type="button"
                class="error-link"
                (click)="scrollToField.emit(error.field)"
              >
                <strong>{{ error.fieldLabel }}:</strong> {{ error.message }}
              </button>
              @if (error.suggestion) {
                <div class="error-suggestion">
                  <i class="pi pi-lightbulb" aria-hidden="true"></i>
                  {{ error.suggestion }}
                </div>
              }
            </li>
          }
        </ul>
        
        <button
          type="button"
          class="error-summary-dismiss"
          (click)="dismissSummary.emit()"
          aria-label="Dismiss error summary"
        >
          <i class="pi pi-times"></i>
        </button>
      </div>
    }
  `,
  styleUrl: "./form-error-summary.component.scss",
})
export class FormErrorSummaryComponent {
  private elementRef = inject(ElementRef);
  
  /** Array of form errors to display */
  errors = input.required<FormError[]>();
  
  /** Emitted when user clicks an error to scroll to that field */
  scrollToField = output<string>();
  
  /** Emitted when user dismisses the summary */
  dismissSummary = output<void>();
  
  constructor() {
    // Auto-scroll to summary when errors appear
    effect(() => {
      const errorCount = this.errors().length;
      if (errorCount > 0) {
        // Wait for rendering
        setTimeout(() => {
          const summaryElement = this.elementRef.nativeElement.querySelector('.error-summary');
          if (summaryElement) {
            summaryElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start' 
            });
            summaryElement.focus();
          }
        }, 100);
      }
    });
  }
}
