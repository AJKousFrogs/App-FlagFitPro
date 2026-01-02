import {
  Component,
  Input,
  ChangeDetectionStrategy,
  computed,
  inject,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Router } from "@angular/router";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import {
  CONSENT_BLOCKED_MESSAGES,
  PrivacyMessage,
  getConsentBlockedMessage,
  UserRole,
} from "../../utils/privacy-ux-copy";

/**
 * Consent Blocked Message Component
 *
 * Displays a user-friendly message when data is hidden due to missing consent.
 * Used in coach dashboards and team views to explain why player data isn't visible.
 *
 * Now uses centralized privacy-ux-copy.ts for all messages.
 *
 * Usage:
 * <app-consent-blocked-message
 *   [playerName]="player.name"
 *   [dataType]="'performance'"
 *   [showContactOption]="true"
 * ></app-consent-blocked-message>
 *
 * Športno društvo Žabe - Athletes helping athletes since 2020
 */

export type ConsentBlockedDataType =
  | "performance"
  | "health"
  | "training"
  | "wellness"
  | "all";

@Component({
  selector: "app-consent-blocked-message",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, CardModule, ButtonModule],
  template: `
    <div class="consent-blocked" [class]="variant">
      <div class="consent-icon">
        <i [class]="'pi ' + getIcon()"></i>
      </div>
      <div class="consent-content">
        <h4 class="consent-title">{{ getTitle() }}</h4>
        <p class="consent-message">{{ getMessage() }}</p>
        <p class="consent-reason">{{ getReason() }}</p>
        @if (showContactOption) {
          <div class="consent-action">
            <p class="action-text">{{ getAction() }}</p>
            <a [routerLink]="getHelpLink()" class="action-link">
              <i class="pi pi-external-link"></i>
              {{ getActionLabel() }}
            </a>
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: './consent-blocked-message.component.scss',
})
export class ConsentBlockedMessageComponent {
  @Input() playerName?: string;
  @Input() dataType: ConsentBlockedDataType = "all";
  @Input() showContactOption = false;
  @Input() variant: "default" | "inline" | "card" = "default";
  @Input() customMessage?: string;
  @Input() context: "single_player" | "team_partial" | "health_data" =
    "single_player";
  @Input() role: UserRole = "coach";

  /**
   * Get the appropriate privacy message based on context
   */
  private getPrivacyMessage(): PrivacyMessage {
    // For health data, always use health-specific message
    if (this.dataType === "health" || this.dataType === "wellness") {
      return CONSENT_BLOCKED_MESSAGES.healthDataBlocked;
    }

    // Use centralized helper for context-based message
    return getConsentBlockedMessage(this.role, this.context);
  }

  getTitle(): string {
    if (this.playerName) {
      return `${this.playerName}'s Data Not Shared`;
    }
    return this.getPrivacyMessage().title;
  }

  getMessage(): string {
    if (this.customMessage) {
      return this.customMessage;
    }

    const message = this.getPrivacyMessage();

    if (this.playerName) {
      return `${this.playerName} has not enabled sharing of ${this.getDataTypeLabel()} with your team.`;
    }

    return message.reason;
  }

  getReason(): string {
    return this.getPrivacyMessage().reason;
  }

  getAction(): string {
    return this.getPrivacyMessage().action;
  }

  getActionLabel(): string {
    return this.getPrivacyMessage().actionLabel || "Learn More";
  }

  getHelpLink(): string {
    return this.getPrivacyMessage().helpLink || "/help/privacy-sharing";
  }

  getIcon(): string {
    return this.getPrivacyMessage().icon || "pi-lock";
  }

  private getDataTypeLabel(): string {
    switch (this.dataType) {
      case "performance":
        return "performance data";
      case "health":
        return "health and wellness data";
      case "training":
        return "training data";
      case "wellness":
        return "wellness data";
      case "all":
      default:
        return "their data";
    }
  }
}
