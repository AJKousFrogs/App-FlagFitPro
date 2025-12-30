import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { LoadingService } from "../../core/services/loading.service";

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
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      backdrop-filter: blur(4px);
      transition: opacity 0.3s ease;
    }

    .loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      color: white;
    }

    .loading-spinner {
      width: 50px;
      height: 50px;
      border: 4px solid rgba(255, 255, 255, 0.1);
      border-left-color: var(--primary-color, #3b82f6);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    .loading-message {
      font-size: 1.125rem;
      font-weight: 500;
    }

    .loading-cancel-btn {
      margin-top: 1rem;
      padding: 0.5rem 1rem;
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.875rem;
      transition: background 0.2s;
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

