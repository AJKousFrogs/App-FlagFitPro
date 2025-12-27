/**
 * Announcements Banner Component
 *
 * Displays unread team announcements as a dismissible banner.
 * Shows important announcements prominently at the top of pages.
 *
 * Features:
 * - Auto-loads unread announcements
 * - Dismissible with acknowledgment
 * - Links to full announcement in chat
 * - Visual priority for important messages
 */

import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import {
  TeamNotificationService,
  UnreadAnnouncement,
} from "../../../core/services/team-notification.service";
import { ButtonModule } from "primeng/button";
import { TagModule } from "primeng/tag";

@Component({
  selector: "app-announcements-banner",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ButtonModule, TagModule],
  template: `
    @if (visible() && currentAnnouncement()) {
      <div
        class="announcements-banner"
        [class.important]="currentAnnouncement()?.is_important"
      >
        <div class="banner-icon">
          @if (currentAnnouncement()?.is_important) {
            <i class="pi pi-exclamation-circle"></i>
          } @else {
            <i class="pi pi-megaphone"></i>
          }
        </div>

        <div class="banner-content">
          <div class="banner-header">
            @if (currentAnnouncement()?.is_important) {
              <p-tag severity="danger" value="Important" [rounded]="true"></p-tag>
            }
            <span class="announcement-channel">
              #{{ currentAnnouncement()?.channel_name }}
            </span>
            <span class="announcement-author">
              {{ currentAnnouncement()?.author_name }}
            </span>
            <span class="announcement-time">
              {{ formatTime(currentAnnouncement()?.created_at || '') }}
            </span>
          </div>
          <div class="banner-message">
            {{ currentAnnouncement()?.message }}
          </div>
        </div>

        <div class="banner-actions">
          @if (unreadCount() > 1) {
            <span class="more-count">+{{ unreadCount() - 1 }} more</span>
          }
          <p-button
            label="View"
            [text]="true"
            size="small"
            routerLink="/chat"
            (onClick)="onViewClick()"
          ></p-button>
          <p-button
            icon="pi pi-check"
            [text]="true"
            [rounded]="true"
            severity="success"
            pTooltip="Mark as read"
            (onClick)="acknowledgeAnnouncement()"
          ></p-button>
          <p-button
            icon="pi pi-times"
            [text]="true"
            [rounded]="true"
            (onClick)="dismiss()"
          ></p-button>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .announcements-banner {
        display: flex;
        align-items: center;
        gap: var(--space-4);
        padding: var(--space-3) var(--space-4);
        background: var(--color-brand-light);
        border: 1px solid var(--color-brand-primary);
        border-radius: var(--p-border-radius);
        margin-bottom: var(--space-4);
        animation: slideIn 0.3s ease-out;
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .announcements-banner.important {
        background: linear-gradient(
          135deg,
          var(--color-status-warning-light) 0%,
          var(--color-status-error-light) 100%
        );
        border-color: var(--color-status-warning);
      }

      .banner-icon {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--color-brand-primary);
        border-radius: 50%;
        flex-shrink: 0;
      }

      .important .banner-icon {
        background: var(--color-status-warning);
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0%,
        100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.05);
        }
      }

      .banner-icon i {
        color: white;
        font-size: 1.25rem;
      }

      .banner-content {
        flex: 1;
        min-width: 0;
      }

      .banner-header {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        margin-bottom: var(--space-1);
        flex-wrap: wrap;
      }

      .announcement-channel {
        font-weight: var(--font-weight-semibold);
        color: var(--color-brand-primary);
      }

      .announcement-author {
        color: var(--text-secondary);
        font-size: var(--font-body-sm);
      }

      .announcement-time {
        color: var(--text-tertiary);
        font-size: var(--font-body-xs);
      }

      .banner-message {
        color: var(--text-primary);
        line-height: 1.4;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }

      .banner-actions {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        flex-shrink: 0;
      }

      .more-count {
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
        background: var(--p-surface-100);
        padding: var(--space-1) var(--space-2);
        border-radius: var(--p-border-radius);
      }

      @media (max-width: 768px) {
        .announcements-banner {
          flex-direction: column;
          align-items: flex-start;
        }

        .banner-actions {
          width: 100%;
          justify-content: flex-end;
          margin-top: var(--space-2);
        }
      }
    `,
  ],
})
export class AnnouncementsBannerComponent implements OnInit {
  private notificationService = inject(TeamNotificationService);

  // Inputs
  @Input() maxDisplay = 1;

  // Outputs
  @Output() viewed = new EventEmitter<string>();
  @Output() acknowledged = new EventEmitter<string>();

  // State
  private readonly _visible = signal(true);
  private readonly _currentIndex = signal(0);

  // From service
  readonly announcements = this.notificationService.unreadAnnouncements;
  readonly hasAnnouncements = this.notificationService.hasUnreadAnnouncements;

  // Computed
  readonly visible = computed(() => this._visible() && this.hasAnnouncements());
  readonly unreadCount = computed(() => this.announcements().length);

  readonly currentAnnouncement = computed(() => {
    const all = this.announcements();
    const index = this._currentIndex();
    return all[index] || null;
  });

  ngOnInit(): void {
    this.loadAnnouncements();
  }

  async loadAnnouncements(): Promise<void> {
    await this.notificationService.loadUnreadAnnouncements();
  }

  async acknowledgeAnnouncement(): Promise<void> {
    const current = this.currentAnnouncement();
    if (!current) return;

    await this.notificationService.markAnnouncementRead(current.id);
    this.acknowledged.emit(current.id);

    // Move to next announcement or hide
    const remaining = this.announcements().length;
    if (remaining === 0) {
      this._visible.set(false);
    } else if (this._currentIndex() >= remaining) {
      this._currentIndex.set(0);
    }
  }

  dismiss(): void {
    this._visible.set(false);
  }

  onViewClick(): void {
    const current = this.currentAnnouncement();
    if (current) {
      this.viewed.emit(current.id);
    }
  }

  formatTime(timestamp: string): string {
    if (!timestamp) return "";

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString();
  }
}
