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
        @if (unlocked() && rarity() !== 'common') {
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
                <div
                  class="progress-fill"
                  [style.width.%]="progress()"
                ></div>
              </div>
              <span class="progress-text">{{ progress() }}%</span>
            </div>
          }
        </div>
      }

      <!-- Unlock animation particles -->
      @if (showUnlockAnimation()) {
        <div class="particles">
          @for (i of [1,2,3,4,5,6,7,8]; track i) {
            <span class="particle" [style.--delay]="i * 0.1 + 's'"></span>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
    }

    .achievement-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-4);
      background: var(--surface-primary);
      border-radius: var(--radius-xl);
      border: 1px solid var(--p-surface-200);
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      position: relative;
      overflow: hidden;
    }

    .achievement-badge:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
    }

    .achievement-badge.compact {
      padding: var(--space-2);
    }

    .achievement-badge.locked {
      opacity: 0.7;
    }

    .achievement-badge.locked:hover {
      opacity: 0.85;
    }

    /* Badge container */
    .badge-container {
      position: relative;
      width: 80px;
      height: 80px;
    }

    .compact .badge-container {
      width: 48px;
      height: 48px;
    }

    /* Glow effect */
    .badge-glow {
      position: absolute;
      inset: -10px;
      border-radius: 50%;
      opacity: 0.5;
      filter: blur(15px);
      transition: opacity 0.3s ease;
    }

    .tier-bronze .badge-glow {
      background: radial-gradient(circle, #cd7f32 0%, transparent 70%);
    }

    .tier-silver .badge-glow {
      background: radial-gradient(circle, #c0c0c0 0%, transparent 70%);
    }

    .tier-gold .badge-glow {
      background: radial-gradient(circle, #ffd700 0%, transparent 70%);
    }

    .tier-platinum .badge-glow {
      background: radial-gradient(circle, #e5e4e2 0%, transparent 70%);
    }

    .tier-diamond .badge-glow {
      background: radial-gradient(circle, #b9f2ff 0%, transparent 70%);
    }

    .achievement-badge:hover .badge-glow {
      opacity: 0.8;
    }

    /* Badge shape */
    .badge-shape {
      position: relative;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 1;
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .achievement-badge:hover .badge-shape {
      transform: scale(1.1);
    }

    .tier-bronze .badge-shape {
      background: linear-gradient(135deg, #cd7f32 0%, #8b4513 100%);
      box-shadow: 0 4px 15px rgba(205, 127, 50, 0.4);
    }

    .tier-silver .badge-shape {
      background: linear-gradient(135deg, #e8e8e8 0%, #a8a8a8 100%);
      box-shadow: 0 4px 15px rgba(192, 192, 192, 0.4);
    }

    .tier-gold .badge-shape {
      background: linear-gradient(135deg, #ffd700 0%, #daa520 100%);
      box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
    }

    .tier-platinum .badge-shape {
      background: linear-gradient(135deg, #e5e4e2 0%, #a0a0a0 50%, #e5e4e2 100%);
      box-shadow: 0 4px 15px rgba(229, 228, 226, 0.5);
    }

    .tier-diamond .badge-shape {
      background: linear-gradient(135deg, #b9f2ff 0%, #00bfff 50%, #b9f2ff 100%);
      box-shadow: 0 4px 20px rgba(0, 191, 255, 0.5);
    }

    .locked .badge-shape {
      background: var(--p-surface-300);
      box-shadow: none;
    }

    /* Locked overlay */
    .locked-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.5rem;
    }

    .compact .locked-overlay {
      font-size: 1rem;
    }

    /* Badge icon */
    .badge-icon {
      color: white;
      font-size: 2rem;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .compact .badge-icon {
      font-size: 1.25rem;
    }

    .locked .badge-icon {
      opacity: 0.3;
    }

    /* Tier indicator */
    .tier-indicator {
      position: absolute;
      bottom: -4px;
      display: flex;
      gap: 2px;
    }

    .star {
      font-size: 0.6rem;
      color: rgba(255, 255, 255, 0.9);
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    .compact .tier-indicator {
      display: none;
    }

    /* Rarity border */
    .rarity-border {
      position: absolute;
      inset: -3px;
      border-radius: 50%;
      border: 2px solid transparent;
      animation: rarity-pulse 2s ease-in-out infinite;
    }

    .rarity-uncommon {
      border-color: var(--color-rarity-uncommon);
    }

    .rarity-rare {
      border-color: var(--color-rarity-rare);
    }

    .rarity-epic {
      border-color: var(--color-rarity-epic);
    }

    .rarity-legendary {
      border-color: var(--color-rarity-legendary);
      animation: legendary-glow 2s ease-in-out infinite;
    }

    @keyframes rarity-pulse {
      0%, 100% {
        opacity: 0.5;
      }
      50% {
        opacity: 1;
      }
    }

    @keyframes legendary-glow {
      0%, 100% {
        box-shadow: 0 0 10px var(--color-rarity-legendary);
      }
      50% {
        box-shadow: 0 0 20px var(--color-rarity-legendary), 0 0 30px var(--color-rarity-legendary);
      }
    }

    /* Badge info */
    .badge-info {
      text-align: center;
      max-width: 150px;
    }

    .badge-title {
      margin: 0;
      font-size: var(--font-body-sm);
      font-weight: 600;
      color: var(--text-primary);
      line-height: 1.3;
    }

    .badge-description {
      margin: var(--space-1) 0 0 0;
      font-size: var(--font-body-xs);
      color: var(--text-secondary);
      line-height: 1.4;
    }

    .badge-date {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-1);
      margin-top: var(--space-2);
      font-size: var(--font-body-xs);
      color: var(--text-tertiary);
    }

    /* Progress bar */
    .badge-progress {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin-top: var(--space-2);
    }

    .progress-bar {
      flex: 1;
      height: 6px;
      background: var(--p-surface-200);
      border-radius: var(--radius-full);
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: var(--color-brand-primary);
      border-radius: var(--radius-full);
      transition: width 0.3s ease;
    }

    .progress-text {
      font-size: var(--font-body-xs);
      color: var(--text-secondary);
      min-width: 35px;
      text-align: right;
    }

    /* Unlock animation */
    .animate-unlock {
      animation: badge-unlock 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes badge-unlock {
      0% {
        transform: scale(0.5);
        opacity: 0;
      }
      50% {
        transform: scale(1.2);
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }

    /* Particles */
    .particles {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    .particle {
      position: absolute;
      width: 8px;
      height: 8px;
      background: var(--color-brand-primary);
      border-radius: 50%;
      top: 50%;
      left: 50%;
      animation: particle-burst 0.8s ease-out forwards;
      animation-delay: var(--delay);
    }

    .particle:nth-child(1) { --angle: 0deg; }
    .particle:nth-child(2) { --angle: 45deg; }
    .particle:nth-child(3) { --angle: 90deg; }
    .particle:nth-child(4) { --angle: 135deg; }
    .particle:nth-child(5) { --angle: 180deg; }
    .particle:nth-child(6) { --angle: 225deg; }
    .particle:nth-child(7) { --angle: 270deg; }
    .particle:nth-child(8) { --angle: 315deg; }

    @keyframes particle-burst {
      0% {
        transform: translate(-50%, -50%) rotate(var(--angle)) translateY(0) scale(1);
        opacity: 1;
      }
      100% {
        transform: translate(-50%, -50%) rotate(var(--angle)) translateY(-60px) scale(0);
        opacity: 0;
      }
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .achievement-badge {
        transition: none;
      }

      .badge-shape {
        transition: none;
      }

      .animate-unlock {
        animation: none;
      }

      .particle {
        animation: none;
        display: none;
      }

      .rarity-border {
        animation: none;
      }
    }
  `],
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
