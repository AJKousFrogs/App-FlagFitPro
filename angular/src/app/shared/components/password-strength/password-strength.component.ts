/**
 * Password Strength Indicator Component
 * Shows real-time password strength with visual feedback
 */

import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PasswordStrength {
  score: number; // 0-4
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong';
  color: string;
  suggestions: string[];
  requir ements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

@Component({
  selector: 'app-password-strength',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="password-strength" [attr.aria-live]="'polite'">
      <!-- Strength Bar -->
      @if (password()) {
        <div class="strength-bar">
          @for (segment of [1, 2, 3, 4]; track segment) {
            <div
              class="bar-segment"
              [class.filled]="segment <= strength().score"
              [style.background-color]="segment <= strength().score ? strength().color : 'var(--surface-200)'"
            ></div>
          }
        </div>

        <!-- Strength Label -->
        <div class="strength-label" [style.color]="strength().color">
          <i [class]="getStrengthIcon()"></i>
          <span>{{ strength().label }}</span>
        </div>

        <!-- Requirements Checklist -->
        @if (showRequirements()) {
          <div class="requirements-list">
            <div class="requirement" [class.met]="strength().requirements.length">
              <i [class]="strength().requirements.length ? 'pi pi-check-circle' : 'pi pi-circle'"></i>
              <span>At least 8 characters</span>
            </div>
            <div class="requirement" [class.met]="strength().requirements.uppercase">
              <i [class]="strength().requirements.uppercase ? 'pi pi-check-circle' : 'pi pi-circle'"></i>
              <span>One uppercase letter</span>
            </div>
            <div class="requirement" [class.met]="strength().requirements.lowercase">
              <i [class]="strength().requirements.lowercase ? 'pi pi-check-circle' : 'pi pi-circle'"></i>
              <span>One lowercase letter</span>
            </div>
            <div class="requirement" [class.met]="strength().requirements.number">
              <i [class]="strength().requirements.number ? 'pi pi-check-circle' : 'pi pi-circle'"></i>
              <span>One number</span>
            </div>
            <div class="requirement" [class.met]="strength().requirements.special">
              <i [class]="strength().requirements.special ? 'pi pi-check-circle' : 'pi pi-circle'"></i>
              <span>One special character (@$!%*?&)</span>
            </div>
          </div>
        }

        <!-- Suggestions -->
        @if (suggestions().length > 0 && showSuggestions()) {
          <div class="suggestions">
            <strong>Suggestions:</strong>
            <ul>
              @for (suggestion of suggestions(); track suggestion) {
                <li>{{ suggestion }}</li>
              }
            </ul>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .password-strength {
      margin-top: 0.5rem;
    }

    .strength-bar {
      display: flex;
      gap: 0.25rem;
      margin-bottom: 0.5rem;
    }

    .bar-segment {
      flex: 1;
      height: 4px;
      background-color: var(--surface-200);
      border-radius: 2px;
      transition: background-color 0.3s ease;
    }

    .strength-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
    }

    .strength-label i {
      font-size: 1rem;
    }

    .requirements-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 0.75rem;
      background: var(--surface-50);
      border-radius: var(--border-radius);
      margin-top: 0.75rem;
    }

    .requirement {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: var(--text-secondary);
      transition: color 0.2s ease;
    }

    .requirement.met {
      color: var(--green-600);
    }

    .requirement i {
      font-size: 0.875rem;
      color: var(--surface-400);
      transition: color 0.2s ease;
    }

    .requirement.met i {
      color: var(--green-600);
    }

    .suggestions {
      margin-top: 0.75rem;
      padding: 0.75rem;
      background: var(--blue-50);
      border-left: 3px solid var(--blue-500);
      border-radius: var(--border-radius);
      font-size: 0.8125rem;
    }

    .suggestions strong {
      display: block;
      margin-bottom: 0.5rem;
      color: var(--blue-700);
    }

    .suggestions ul {
      margin: 0;
      padding-left: 1.25rem;
      color: var(--blue-900);
    }

    .suggestions li {
      margin-bottom: 0.25rem;
    }

    .suggestions li:last-child {
      margin-bottom: 0;
    }
  `],
})
export class PasswordStrengthComponent {
  // Inputs
  password = input<string>('');
  showRequirements = input<boolean>(true);
  showSuggestions = input<boolean>(true);

  // Computed password strength
  strength = computed(() => this.calculateStrength(this.password()));

  // Computed suggestions
  suggestions = computed(() => this.strength().suggestions);

  /**
   * Calculate password strength score and requirements
   */
  private calculateStrength(password: string): PasswordStrength {
    if (!password) {
      return {
        score: 0,
        label: 'Very Weak',
        color: 'var(--red-500)',
        suggestions: ['Enter a password to see strength'],
        requirements: {
          length: false,
          uppercase: false,
          lowercase: false,
          number: false,
          special: false,
        },
      };
    }

    // Check requirements
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password),
    };

    // Calculate score
    let score = 0;
    if (requirements.length) score++;
    if (requirements.uppercase) score++;
    if (requirements.lowercase) score++;
    if (requirements.number) score++;
    if (requirements.special) score++;

    // Bonus points
    if (password.length >= 12) score += 0.5;
    if (password.length >= 16) score += 0.5;

    // Cap at 4
    score = Math.min(Math.floor(score), 4);

    // Generate suggestions
    const suggestions: string[] = [];
    if (!requirements.length) suggestions.push('Use at least 8 characters');
    if (!requirements.uppercase) suggestions.push('Add an uppercase letter');
    if (!requirements.lowercase) suggestions.push('Add a lowercase letter');
    if (!requirements.number) suggestions.push('Add a number');
    if (!requirements.special) suggestions.push('Add a special character (@$!%*?&)');
    if (password.length < 12 && Object.values(requirements).every(r => r)) {
      suggestions.push('Consider using 12+ characters for maximum security');
    }

    // Determine label and color
    let label: PasswordStrength['label'];
    let color: string;

    if (score === 0) {
      label = 'Very Weak';
      color = 'var(--red-600)';
    } else if (score === 1) {
      label = 'Weak';
      color = 'var(--orange-500)';
    } else if (score === 2) {
      label = 'Fair';
      color = 'var(--yellow-500)';
    } else if (score === 3) {
      label = 'Good';
      color = 'var(--blue-500)';
    } else {
      label = 'Strong';
      color = 'var(--green-600)';
    }

    return {
      score,
      label,
      color,
      suggestions,
      requirements,
    };
  }

  /**
   * Get icon for strength level
   */
  getStrengthIcon(): string {
    const score = this.strength().score;
    if (score === 0) return 'pi pi-times-circle';
    if (score === 1) return 'pi pi-exclamation-circle';
    if (score === 2) return 'pi pi-minus-circle';
    if (score === 3) return 'pi pi-check-circle';
    return 'pi pi-shield';
  }
}
