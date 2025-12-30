import { Component, Input, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import {
  CONSENT_BLOCKED_MESSAGES,
  PrivacyMessage,
  getConsentBlockedMessage,
  UserRole
} from '../../utils/privacy-ux-copy';

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

export type ConsentBlockedDataType = 'performance' | 'health' | 'training' | 'wellness' | 'all';

@Component({
  selector: 'app-consent-blocked-message',
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
  styles: [`
    .consent-blocked {
      display: flex;
      align-items: flex-start;
      gap: var(--space-4);
      padding: var(--space-4);
      background: var(--p-surface-50);
      border: 1px solid var(--p-surface-200);
      border-radius: var(--p-border-radius);
      border-left: 4px solid var(--p-blue-500);
    }

    .consent-blocked.inline {
      padding: var(--space-3);
      gap: var(--space-3);
    }

    .consent-blocked.card {
      flex-direction: column;
      text-align: center;
      padding: var(--space-6);
    }

    .consent-icon {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--p-blue-100);
      border-radius: 50%;
      flex-shrink: 0;
    }

    .consent-blocked.card .consent-icon {
      width: 64px;
      height: 64px;
      margin: 0 auto var(--space-4);
    }

    .consent-icon i {
      font-size: 1.25rem;
      color: var(--p-blue-600);
    }

    .consent-blocked.card .consent-icon i {
      font-size: 2rem;
    }

    .consent-content {
      flex: 1;
    }

    .consent-title {
      margin: 0 0 var(--space-2) 0;
      font-size: var(--font-body-md);
      font-weight: var(--font-weight-semibold);
      color: var(--text-primary);
    }

    .consent-message {
      margin: 0 0 var(--space-1) 0;
      font-size: var(--font-body-sm);
      color: var(--text-secondary);
      line-height: 1.5;
    }

    .consent-reason {
      margin: 0;
      font-size: var(--font-body-xs);
      color: var(--text-tertiary);
      font-style: italic;
    }

    .consent-action {
      margin: var(--space-3) 0 0 0;
      padding-top: var(--space-3);
      border-top: 1px solid var(--p-surface-200);
    }

    .action-text {
      margin: 0 0 var(--space-2) 0;
      font-size: var(--font-body-sm);
      color: var(--text-secondary);
    }

    .action-link {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      font-size: var(--font-body-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-brand-primary);
      text-decoration: none;
      transition: color 0.2s;
    }

    .action-link:hover {
      color: var(--color-brand-primary-dark);
      text-decoration: underline;
    }

    .action-link i {
      font-size: 0.75rem;
    }
  `]
})
export class ConsentBlockedMessageComponent {
  @Input() playerName?: string;
  @Input() dataType: ConsentBlockedDataType = 'all';
  @Input() showContactOption = false;
  @Input() variant: 'default' | 'inline' | 'card' = 'default';
  @Input() customMessage?: string;
  @Input() context: 'single_player' | 'team_partial' | 'health_data' = 'single_player';
  @Input() role: UserRole = 'coach';

  /**
   * Get the appropriate privacy message based on context
   */
  private getPrivacyMessage(): PrivacyMessage {
    // For health data, always use health-specific message
    if (this.dataType === 'health' || this.dataType === 'wellness') {
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
    return this.getPrivacyMessage().actionLabel || 'Learn More';
  }

  getHelpLink(): string {
    return this.getPrivacyMessage().helpLink || '/help/privacy-sharing';
  }

  getIcon(): string {
    return this.getPrivacyMessage().icon || 'pi-lock';
  }

  private getDataTypeLabel(): string {
    switch (this.dataType) {
      case 'performance':
        return 'performance data';
      case 'health':
        return 'health and wellness data';
      case 'training':
        return 'training data';
      case 'wellness':
        return 'wellness data';
      case 'all':
      default:
        return 'their data';
    }
  }
}

