import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';
import { AI_PROCESSING_MESSAGES, PrivacyMessage } from '../../utils/privacy-ux-copy';

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
  selector: 'app-ai-consent-required',
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
            When AI processing is enabled, we analyze your training data to provide 
            personalized recommendations, injury risk assessments, and performance insights. 
            You can disable it anytime in your privacy settings.
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
  styles: [`
    .ai-consent-required {
      display: flex;
      align-items: flex-start;
      gap: var(--space-4);
      padding: var(--space-5);
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
      border: 1px solid rgba(102, 126, 234, 0.2);
      border-radius: var(--p-border-radius);
      border-left: 4px solid #667eea;
    }

    .ai-consent-required.banner {
      border-radius: 0;
      border-left: none;
      border-top: 4px solid #667eea;
    }

    .ai-consent-required.card {
      flex-direction: column;
      text-align: center;
      padding: var(--space-8);
    }

    .consent-icon {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      flex-shrink: 0;
    }

    .ai-consent-required.card .consent-icon {
      width: 72px;
      height: 72px;
      margin: 0 auto var(--space-4);
      border-radius: 16px;
    }

    .consent-icon i {
      font-size: 1.5rem;
      color: white;
    }

    .ai-consent-required.card .consent-icon i {
      font-size: 2rem;
    }

    .consent-content {
      flex: 1;
    }

    .consent-title {
      margin: 0 0 var(--space-2) 0;
      font-size: var(--font-body-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--text-primary);
    }

    .consent-message {
      margin: 0 0 var(--space-2) 0;
      font-size: var(--font-body-md);
      color: var(--text-secondary);
      line-height: 1.5;
    }

    .consent-message strong {
      color: var(--text-primary);
    }

    .consent-explanation {
      margin: 0 0 var(--space-4) 0;
    }

    .consent-explanation small {
      color: var(--text-tertiary);
      line-height: 1.5;
    }

    .consent-actions {
      display: flex;
      gap: var(--space-3);
      flex-wrap: wrap;
    }

    .ai-consent-required.card .consent-actions {
      justify-content: center;
    }
  `]
})
export class AiConsentRequiredComponent {
  @Input() featureName?: string;
  @Input() showSettingsLink = true;
  @Input() showDismiss = false;
  @Input() variant: 'default' | 'banner' | 'card' = 'default';
  @Input() status: 'disabled' | 'not_consented' | 'consent_required' = 'consent_required';
  
  @Output() onDismiss = new EventEmitter<void>();

  private getPrivacyMessage(): PrivacyMessage {
    return AI_PROCESSING_MESSAGES[this.status] || AI_PROCESSING_MESSAGES.consentRequired;
  }

  getTitle(): string {
    return this.getPrivacyMessage().title;
  }

  getReason(): string {
    return this.getPrivacyMessage().reason;
  }

  getActionLabel(): string {
    return this.getPrivacyMessage().actionLabel || 'Privacy Settings';
  }

  getHelpLink(): string {
    return this.getPrivacyMessage().helpLink || '/settings/privacy#ai';
  }

  getIcon(): string {
    return this.getPrivacyMessage().icon || 'pi-sparkles';
  }
}

