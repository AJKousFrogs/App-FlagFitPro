import {
  Component,
  input,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { TooltipModule } from "primeng/tooltip";
import { StatusTagComponent } from "../status-tag/status-tag.component";
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
  imports: [CommonModule, TooltipModule, StatusTagComponent],
  template: `
    @if (shouldShow()) {
      <div class="data-source-banner" [class]="bannerClass()">
        <div class="banner-content">
          <div class="banner-icon">
            <i [class]="'pi ' + icon()"></i>
          </div>
          <div class="banner-text">
            <div class="banner-header">
              <h4 class="banner-title">{{ title() }}</h4>
              <app-status-tag
                [value]="badgeText()"
                [severity]="badgeSeverity()"
                [icon]="badgeIcon()"
                size="sm"
              />
            </div>
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
                  {{ currentDataPoints() }} / {{ minimumRequired() }} days
                </span>
              </div>
            }
          </div>
          @if (showDismiss()) {
            <button
              class="dismiss-btn"
              (click)="onDismiss()"
              pTooltip="Dismiss this notice"
            >
              <i class="pi pi-times"></i>
            </button>
          }
        </div>
        @if (warnings().length > 0) {
          <div class="banner-warnings">
            @for (warning of warnings(); track $index) {
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
  styleUrl: "./data-source-banner.component.scss",
})
export class DataSourceBannerComponent {
  readonly dataState = input<DataState>(DataState.NO_DATA);
  readonly currentDataPoints = input<number>(0);
  readonly minimumRequired = input<number>(28);
  readonly warnings = input<string[]>([]);
  readonly metricName = input<string>("metrics");
  readonly showDismiss = input<boolean>(false);
  readonly showWhenReal = input<boolean>(false);

  private dismissed = false;

  private getPrivacyMessage(): DataStateMessage {
    const stateKey = (
      this.dataState() === DataState.INSUFFICIENT_DATA
        ? "INSUFFICIENT_DATA"
        : this.dataState() === DataState.NO_DATA
          ? "NO_DATA"
          : "REAL_DATA"
    ) as DataStateType;
    return DATA_STATE_MESSAGES[stateKey];
  }

  // Computed properties
  shouldShow = computed(() => {
    if (this.dismissed) return false;
    if (this.dataState() === DataState.REAL_DATA && !this.showWhenReal())
      return false;
    return true;
  });

  bannerClass = computed(() => {
    switch (this.dataState()) {
      case DataState.NO_DATA:
        return "no-data";
      case DataState.INSUFFICIENT_DATA:
        return "insufficient";
      case DataState.REAL_DATA:
        return "real";
      default:
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
    return msg.reason.replace("training data", this.metricName() + " data");
  });

  showProgress = computed(() => {
    return this.dataState() === DataState.INSUFFICIENT_DATA;
  });

  progressPercent = computed(() => {
    if (this.minimumRequired() === 0) return 0;
    return Math.min(
      (this.currentDataPoints() / this.minimumRequired()) * 100,
      100,
    );
  });

  badgeText = computed(() => {
    switch (this.dataState()) {
      case DataState.NO_DATA:
        return "No Data";
      case DataState.INSUFFICIENT_DATA:
        return "Limited Data";
      case DataState.REAL_DATA:
        return "Live Data";
      default:
        return "Unknown";
    }
  });

  badgeSeverity = computed(() => {
    switch (this.dataState()) {
      case DataState.NO_DATA:
        return "secondary";
      case DataState.INSUFFICIENT_DATA:
        return "warn"; // PrimeNG uses "warn" not "warning"
      case DataState.REAL_DATA:
        return "success";
      default:
        return "info";
    }
  });

  badgeIcon = computed(() => {
    switch (this.dataState()) {
      case DataState.NO_DATA:
        return "pi-inbox";
      case DataState.INSUFFICIENT_DATA:
        return "pi-chart-line";
      case DataState.REAL_DATA:
        return "pi-check-circle";
      default:
        return "pi-info-circle";
    }
  });

  onDismiss(): void {
    this.dismissed = true;
  }
}
