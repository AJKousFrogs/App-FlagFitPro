/**
 * Live Indicator Component
 *
 * Shows a live status indicator when real-time subscriptions are active.
 * Displays a pulsing red dot with "LIVE" text.
 */

import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-live-indicator',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="live-indicator" [class.live-active]="isLive">
      <span class="live-dot"></span>
      <span class="live-text">LIVE</span>
    </div>
  `,
  styles: [`
    .live-indicator {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 12px;
      background: rgba(239, 68, 68, 0.1);
      opacity: 0.5;
      transition: opacity 0.3s ease;
    }

    .live-indicator.live-active {
      opacity: 1;
    }

    .live-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #ef4444;
      position: relative;
    }

    .live-indicator.live-active .live-dot {
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0.5;
        transform: scale(1.2);
      }
    }

    .live-indicator.live-active .live-dot::after {
      content: '';
      position: absolute;
      top: -4px;
      left: -4px;
      right: -4px;
      bottom: -4px;
      border-radius: 50%;
      background: #ef4444;
      opacity: 0.3;
      animation: ripple 2s infinite;
    }

    @keyframes ripple {
      0% {
        transform: scale(0.8);
        opacity: 0.6;
      }
      100% {
        transform: scale(1.5);
        opacity: 0;
      }
    }

    .live-text {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: #ef4444;
      text-transform: uppercase;
    }

    .live-indicator:not(.live-active) .live-text {
      color: #9ca3af;
    }

    .live-indicator:not(.live-active) .live-dot {
      background: #9ca3af;
    }
  `]
})
export class LiveIndicatorComponent {
  @Input() isLive: boolean = false;
}
