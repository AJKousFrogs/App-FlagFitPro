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
  input,
  output,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { TeamNotificationService } from "../../../core/services/team-notification.service";
import { ButtonComponent } from "../button/button.component";
import { IconButtonComponent } from "../button/icon-button.component";
import { formatDate, getTimeAgo } from "../../utils/date.utils";
import { TagModule } from "primeng/tag";

@Component({
  selector: "app-announcements-banner",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    TagModule,
    ButtonComponent,
    IconButtonComponent,
  ],
  template: `
    @if (visible() && currentAnnouncement(); as announcement) {
      <div
        class="announcements-banner"
        [class.important]="announcement.is_important"
      >
        <div class="banner-icon">
          @if (announcement.is_important) {
            <i class="pi pi-exclamation-circle"></i>
          } @else {
            <i class="pi pi-megaphone"></i>
          }
        </div>

        <div class="banner-content">
          <div class="banner-header">
            @if (announcement.is_important) {
              <p-tag severity="danger" value="Important"></p-tag>
            }
            <span class="announcement-channel">
              #{{ announcement.channel_name }}
            </span>
            <span class="announcement-author">
              {{ announcement.author_name }}
            </span>
            <span class="announcement-time">
              {{ formatTime(announcement.created_at || "") }}
            </span>
          </div>
          <div class="banner-message">
            {{ announcement.message }}
          </div>
        </div>

        <div class="banner-actions">
          @if (unreadCount() > 1) {
            <span class="more-count">+{{ unreadCount() - 1 }} more</span>
          }
          <app-button
            variant="text"
            size="sm"
            routerLink="/chat"
            (clicked)="onViewClick()"
            >View</app-button
          >
          <app-icon-button
            icon="pi-check"
            variant="text"
            (clicked)="acknowledgeAnnouncement()"
            ariaLabel="check"
          />
          <app-icon-button
            icon="pi-times"
            variant="text"
            (clicked)="dismiss()"
            ariaLabel="times"
          />
        </div>
      </div>
    }
  `,
  styleUrl: "./announcements-banner.component.scss",
})
export class AnnouncementsBannerComponent implements OnInit {
  private notificationService = inject(TeamNotificationService);

  // Inputs
  readonly maxDisplay = input<number>(1);

  // Outputs
  readonly viewed = output<string>();
  readonly acknowledged = output<string>();

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

  formatTime = (timestamp: string): string => {
    if (!timestamp) return "";
    return getTimeAgo(timestamp);
  };
}
