import {
  Component,
  Input,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ButtonModule } from "primeng/button";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";
import { DataState } from "../../../core/services/data-source.service";
import {
  DATA_STATE_MESSAGES,
  DataStateMessage,
  DataStateType,
} from "../../utils/privacy-ux-copy";

/**
 * Data Source Banner Component
 *
 * Displays a prominent banner when data is not in REAL_DATA state.
 * Used to ensure users always know when they're looking at:
 * - No data
 * - Insufficient data for reliable metrics
 * - Demo/mock data
 *
 * Now uses centralized privacy-ux-copy.ts for all messages.
 *
 * Based on PLAYER_DATA_SAFETY_GUIDE.md requirements.
 *
 * Športno društvo Žabe - Athletes helping athletes since 2020
 */

@Component({
  selector: "app-data-source-banner",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ButtonModule, TagModule, TooltipModule],
  template: `
    @if (shouldShow()) {
      <div class="data-source-banner" [class]="bannerClass()">
        <div class="banner-content">
          <div class="banner-icon">
            <i [class]="'pi ' + icon()"></i>
          </div>
          <div class="banner-text">
            <h4 class="banner-title">{{ title() }}</h4>
            <p class="banner-message">{{ message() }}</p>
            @if (showProgress()) {
              <div class="progress-info">
                <div class="progress-bar">
                  <div
                    class="progress-fill"
                    [style.width.%]="progressPercent()"
                  ></div>
                </div>
                <span class="progress-text">
                  {{ currentDataPoints }} / {{ minimumRequired }} days
                </span>
              </div>
            }
          </div>
          @if (showDismiss) {
            <button
              class="dismiss-btn"
              (click)="onDismiss()"
              pTooltip="Dismiss this notice"
            >
              <i class="pi pi-times"></i>
            </button>
          }
        </div>
        @if (warnings.length > 0) {
          <div class="banner-warnings">
            @for (warning of warnings; track $index) {
              <span class="warning-item">
                <i class="pi pi-info-circle"></i>
                {{ warning }}
              </span>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [
    `
      .data-source-banner {
        border-radius: var(--p-border-radius);
        margin-bottom: var(--space-4);
        overflow: hidden;
      }

      .banner-content {
        display: flex;
        align-items: flex-start;
        gap: var(--space-4);
        padding: var(--space-4);
      }

      .banner-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .banner-icon i {
        font-size: 1.5rem;
      }

      .banner-text {
        flex: 1;
      }

      .banner-title {
        margin: 0 0 var(--space-1) 0;
        font-size: var(--font-body-md);
        font-weight: var(--font-weight-semibold);
      }

      .banner-message {
        margin: 0;
        font-size: var(--font-body-sm);
        opacity: 0.9;
      }

      .dismiss-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        padding: var(--space-2);
        border-radius: var(--p-border-radius);
        opacity: 0.7;
        transition: opacity 0.2s ease;
      }

      .dismiss-btn:hover {
        opacity: 1;
      }

      .progress-info {
        margin-top: var(--space-3);
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }

      .progress-bar {
        flex: 1;
        height: 8px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 4px;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        background: rgba(255, 255, 255, 0.8);
        border-radius: 4px;
        transition: width 0.3s ease;
      }

      .progress-text {
        font-size: var(--font-body-xs);
        font-weight: var(--font-weight-medium);
        white-space: nowrap;
      }

      .banner-warnings {
        padding: var(--space-3) var(--space-4);
        background: rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .warning-item {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: var(--font-body-xs);
        opacity: 0.9;
      }

      /* State-specific styles */
      .data-source-banner.no-data {
        background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
        color: white;
      }

      .data-source-banner.no-data .banner-icon {
        background: rgba(255, 255, 255, 0.2);
      }

      .data-source-banner.insufficient {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: white;
      }

      .data-source-banner.insufficient .banner-icon {
        background: rgba(255, 255, 255, 0.2);
      }

      .data-source-banner.demo {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white;
      }

      .data-source-banner.demo .banner-icon {
        background: rgba(255, 255, 255, 0.2);
      }

      .data-source-banner.real {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
      }

      .data-source-banner.real .banner-icon {
        background: rgba(255, 255, 255, 0.2);
      }

      @media (max-width: 768px) {
        .banner-content {
          flex-direction: column;
          text-align: center;
        }

        .banner-icon {
          margin: 0 auto;
        }

        .dismiss-btn {
          position: absolute;
          top: var(--space-2);
          right: var(--space-2);
        }

        .data-source-banner {
          position: relative;
        }
      }
    `,
  ],
})
export class DataSourceBannerComponent {
  @Input() dataState: DataState = DataState.NO_DATA;
  @Input() currentDataPoints: number = 0;
  @Input() minimumRequired: number = 28;
  @Input() warnings: string[] = [];
  @Input() metricName: string = "metrics";
  @Input() showDismiss: boolean = false;
  @Input() showWhenReal: boolean = false;

  private dismissed = false;

  private getPrivacyMessage(): DataStateMessage {
    const stateKey = (
      this.dataState === DataState.INSUFFICIENT_DATA
        ? "INSUFFICIENT_DATA"
        : this.dataState === DataState.NO_DATA
          ? "NO_DATA"
          : this.dataState === DataState.DEMO_DATA
            ? "DEMO_DATA"
            : "REAL_DATA"
    ) as DataStateType;
    return DATA_STATE_MESSAGES[stateKey];
  }

  // Computed properties
  shouldShow = computed(() => {
    if (this.dismissed) return false;
    if (this.dataState === DataState.REAL_DATA && !this.showWhenReal)
      return false;
    return true;
  });

  bannerClass = computed(() => {
    switch (this.dataState) {
      case DataState.NO_DATA:
        return "no-data";
      case DataState.INSUFFICIENT_DATA:
        return "insufficient";
      case DataState.DEMO_DATA:
        return "demo";
      case DataState.REAL_DATA:
        return "real";
    }
  });

  icon = computed(() => {
    return this.getPrivacyMessage().icon || "pi-info-circle";
  });

  title = computed(() => {
    return this.getPrivacyMessage().title;
  });

  message = computed(() => {
    const msg = this.getPrivacyMessage();
    return msg.reason.replace("training data", this.metricName + " data");
  });

  showProgress = computed(() => {
    return this.dataState === DataState.INSUFFICIENT_DATA;
  });

  progressPercent = computed(() => {
    if (this.minimumRequired === 0) return 0;
    return Math.min((this.currentDataPoints / this.minimumRequired) * 100, 100);
  });

  onDismiss(): void {
    this.dismissed = true;
  }
}
