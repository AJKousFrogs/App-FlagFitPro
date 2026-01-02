import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { LoadingService } from "../../../core/services/loading.service";

@Component({
  selector: "app-loading-overlay",
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (loadingService.isLoading()) {
      <div
        class="loading-overlay"
        role="status"
        aria-live="polite"
        [attr.aria-label]="loadingService.currentMessage()"
      >
        <div class="loading-content">
          <div class="loading-spinner"></div>
          <div class="loading-message">
            {{ loadingService.currentMessage() }}
          </div>

          @for (loader of loadingService.loaders(); track loader.id) {
            @if (loader.cancellable) {
              <button
                class="loading-cancel-btn"
                (click)="cancel(loader.id, loader.onCancel)"
                aria-label="Cancel loading"
              >
                Cancel
              </button>
            }
          }
        </div>
      </div>
    }
  `,
  styleUrl: './loading-overlay.component.scss',
})
export class LoadingOverlayComponent {
  public loadingService = inject(LoadingService);

  cancel(id: string, onCancel?: () => void) {
    if (onCancel) {
      onCancel();
    }
    this.loadingService.hide(id);
  }
}
