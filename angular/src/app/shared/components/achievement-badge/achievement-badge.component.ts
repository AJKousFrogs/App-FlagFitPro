/**
 * Achievement Badge Component
 *
 * Gamification element for displaying achievements, milestones, and rewards.
 * Perfect for training streaks, personal records, team achievements, etc.
 *
 * Features:
 * - Multiple badge styles (bronze, silver, gold, platinum, diamond)
 * - Unlock animation
 * - Progress towards next achievement
 * - Rarity indicators
 * - Hover effects with details
 *
 * @example
 * <app-achievement-badge
 *   icon="pi-trophy"
 *   title="7-Day Streak"
 *   description="Completed training 7 days in a row"
 *   tier="gold"
 *   [unlocked]="true"
 *   [unlockedDate]="streakDate"
 * />
 */

import {
  Component,
  input,
  output,
  signal,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { TooltipModule } from "primeng/tooltip";

export type BadgeTier = "bronze" | "silver" | "gold" | "platinum" | "diamond";
export type BadgeRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

@Component({
  selector: "app-achievement-badge",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TooltipModule],
  template: `
    <div
      class="achievement-badge"
      [class]="'tier-' + tier()"
      [class.unlocked]="unlocked()"
      [class.locked]="!unlocked()"
      [class.compact]="compact()"
      [class.animate-unlock]="showUnlockAnimation()"
      [pTooltip]="tooltipContent()"
      tooltipPosition="top"
      (click)="handleClick()"
      (mouseenter)="onHover()"
      (mouseleave)="onLeave()"
    >
      <!-- Badge container -->
      <div class="badge-container">
        <!-- Glow effect for unlocked badges -->
        @if (unlocked()) {
          <div class="badge-glow"></div>
        }

        <!-- Badge shape -->
        <div class="badge-shape">
          <!-- Locked overlay -->
          @if (!unlocked()) {
            <div class="locked-overlay">
              <i class="pi pi-lock"></i>
            </div>
          }

          <!-- Icon -->
          <div class="badge-icon">
            <i [class]="'pi ' + icon()"></i>
          </div>

          <!-- Tier indicator -->
          <div class="tier-indicator">
            @for (star of tierStars(); track $index) {
              <span class="star">★</span>
            }
          </div>
        </div>

        <!-- Rarity border effect -->
        @if (unlocked() && rarity() !== "common") {
          <div class="rarity-border" [class]="'rarity-' + rarity()"></div>
        }
      </div>

      <!-- Badge info -->
      @if (!compact()) {
        <div class="badge-info">
          <h4 class="badge-title">{{ title() }}</h4>
          @if (description()) {
            <p class="badge-description">{{ description() }}</p>
          }
          @if (unlocked() && unlockedDate()) {
            <span class="badge-date">
              <i class="pi pi-calendar"></i>
              {{ formatDate(unlockedDate()!) }}
            </span>
          }
          @if (!unlocked() && progress() !== null) {
            <div class="badge-progress">
              <div class="progress-bar">
                <div class="progress-fill" [style.width.%]="progress()"></div>
              </div>
              <span class="progress-text">{{ progress() }}%</span>
            </div>
          }
        </div>
      }

      <!-- Unlock animation particles -->
      @if (showUnlockAnimation()) {
        <div class="particles">
          @for (i of [1, 2, 3, 4, 5, 6, 7, 8]; track i) {
            <span class="particle" [style.--delay]="i * 0.1 + 's'"></span>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './achievement-badge.component.scss',
})
export class AchievementBadgeComponent {
  // Inputs
  icon = input<string>("pi-trophy");
  title = input.required<string>();
  description = input<string>("");
  tier = input<BadgeTier>("bronze");
  rarity = input<BadgeRarity>("common");
  unlocked = input<boolean>(false);
  unlockedDate = input<Date | null>(null);
  progress = input<number | null>(null);
  compact = input<boolean>(false);

  // Outputs
  badgeClick = output<void>();

  // State
  showUnlockAnimation = signal(false);
  isHovered = signal(false);

  // Computed
  tierStars = computed(() => {
    const tierMap: Record<BadgeTier, number> = {
      bronze: 1,
      silver: 2,
      gold: 3,
      platinum: 4,
      diamond: 5,
    };
    return new Array(tierMap[this.tier()]).fill(0);
  });

  tooltipContent = computed(() => {
    if (!this.compact()) return "";

    let content = this.title();
    if (this.description()) {
      content += `\n${this.description()}`;
    }
    if (!this.unlocked() && this.progress() !== null) {
      content += `\nProgress: ${this.progress()}%`;
    }
    return content;
  });

  handleClick(): void {
    this.badgeClick.emit();
  }

  onHover(): void {
    this.isHovered.set(true);
  }

  onLeave(): void {
    this.isHovered.set(false);
  }

  triggerUnlockAnimation(): void {
    this.showUnlockAnimation.set(true);
    setTimeout(() => this.showUnlockAnimation.set(false), 1000);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  }
}
