import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { RouterLink } from "@angular/router";
import {
  AI_PROCESSING_MESSAGES,
  PrivacyMessage,
} from "../../utils/privacy-ux-copy";

/**
 * AI Consent Required Component
 *
 * Displays a message when AI features are disabled due to missing consent.
 * Provides a link to privacy settings to enable AI processing.
 *
 * Now uses centralized privacy-ux-copy.ts for all messages.
 *
 * Usage:
 * <app-ai-consent-required
 *   featureName="Training Recommendations"
 *   [showSettingsLink]="true"
 * ></app-ai-consent-required>
 *
 * Športno društvo Žabe - Athletes helping athletes since 2020
 */

@Component({
  selector: "app-ai-consent-required",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CardModule, ButtonModule, RouterLink],
  template: `
    <div class="ai-consent-required" [class]="variant">
      <div class="consent-icon">
        <i [class]="'pi ' + getIcon()"></i>
      </div>
      <div class="consent-content">
        <h4 class="consent-title">{{ getTitle() }}</h4>
        <p class="consent-message">
          @if (featureName) {
            <strong>{{ featureName }}</strong> requires AI processing to work.
          } @else {
            This feature requires AI processing to work.
          }
          {{ getReason() }}
        </p>
        <p class="consent-explanation">
          <small>
            When AI processing is enabled, we analyze your training data to
            provide personalized recommendations, injury risk assessments, and
            performance insights. You can disable it anytime in your privacy
            settings.
          </small>
        </p>
        @if (showSettingsLink) {
          <div class="consent-actions">
            <p-button
              [label]="getActionLabel()"
              icon="pi pi-cog"
              [outlined]="true"
              size="small"
              [routerLink]="getHelpLink()"
            ></p-button>
            @if (showDismiss) {
              <p-button
                label="Continue Without AI"
                [text]="true"
                size="small"
                (onClick)="onDismiss.emit()"
              ></p-button>
            }
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: './ai-consent-required.component.scss',
})
export class AiConsentRequiredComponent {
  @Input() featureName?: string;
  @Input() showSettingsLink = true;
  @Input() showDismiss = false;
  @Input() variant: "default" | "banner" | "card" = "default";
  @Input() status: "disabled" | "not_consented" | "consent_required" =
    "consent_required";

  @Output() onDismiss = new EventEmitter<void>();

  private getPrivacyMessage(): PrivacyMessage {
    // Map snake_case status to camelCase keys in AI_PROCESSING_MESSAGES
    const statusMap: Record<string, keyof typeof AI_PROCESSING_MESSAGES> = {
      disabled: "disabled",
      not_consented: "notConsented",
      consent_required: "consentRequired",
    };
    const key = statusMap[this.status] || "consentRequired";
    return AI_PROCESSING_MESSAGES[key];
  }

  getTitle(): string {
    return this.getPrivacyMessage().title;
  }

  getReason(): string {
    return this.getPrivacyMessage().reason;
  }

  getActionLabel(): string {
    return this.getPrivacyMessage().actionLabel || "Privacy Settings";
  }

  getHelpLink(): string {
    return this.getPrivacyMessage().helpLink || "/settings/privacy#ai";
  }

  getIcon(): string {
    return this.getPrivacyMessage().icon || "pi-sparkles";
  }
}
