import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { LoadingService } from "../../../core/services/loading.service";

@Component({
  selector: "app-loading-overlay",
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (loadingService.isLoading()) {
      <div class="loading-overlay" role="status" aria-live="polite" [attr.aria-label]="loadingService.currentMessage()">
        <div class="loading-content">
          <div class="loading-spinner"></div>
          <div class="loading-message">{{ loadingService.currentMessage() }}</div>
          
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
  styles: [`
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: var(--surface-overlay);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: var(--z-index-loading-overlay);
      -webkit-backdrop-filter: blur(4px);
      backdrop-filter: blur(4px);
      transition: opacity var(--transition-slow);
    }

    .loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      color: var(--color-text-on-primary);
    }

    .loading-spinner {
      width: 50px;
      height: 50px;
      border: 4px solid rgba(255, 255, 255, 0.1);
      border-left-color: var(--color-brand-primary);
      border-radius: var(--radius-full);
      animation: spin 1s linear infinite;
      margin-bottom: var(--space-4);
    }

    .loading-message {
      font-size: var(--font-body-lg);
      font-weight: var(--font-weight-medium);
    }

    .loading-cancel-btn {
      margin-top: var(--space-4);
      padding: var(--space-2) var(--space-4);
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: var(--color-text-on-primary);
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-size: var(--font-body-sm);
      transition: background var(--transition-base);
    }

    .loading-cancel-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
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

