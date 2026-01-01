import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
  signal,
} from "@angular/core";

import { CommonModule, DatePipe, TitleCasePipe } from "@angular/common";
import { RouterModule } from "@angular/router";
import { AvatarModule } from "primeng/avatar";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "primeng/tabs";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";
import { AccountDeletionService } from "../../core/services/account-deletion.service";
import { ApiService } from "../../core/services/api.service";
import { AuthService } from "../../core/services/auth.service";
import { LoggerService } from "../../core/services/logger.service";
import { SupabaseService } from "../../core/services/supabase.service";
import { ToastService } from "../../core/services/toast.service";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageErrorStateComponent } from "../../shared/components/page-error-state/page-error-state.component";
import { StatsGridComponent } from "../../shared/components/stats-grid/stats-grid.component";
import {
  DELETION_MESSAGES,
  getDeletionMessage,
} from "../../shared/utils/privacy-ux-copy";

interface PendingInvitation {
  id: string;
  teamId: string;
  teamName: string;
  role: string;
  message?: string;
  invitedBy: string;
  createdAt: string;
  expiresAt: string;
  isExpired: boolean;
}

@Component({
  selector: "app-profile",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ButtonModule,
    AvatarModule,
    TagModule,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    ProgressSpinnerModule,
    TooltipModule,
    MainLayoutComponent,
    StatsGridComponent,
    EmptyStateComponent,
    PageErrorStateComponent,
    DatePipe,
    TitleCasePipe,
  ],
  template: `
    <app-main-layout>
      <div class="profile-page">
        <!-- Deletion Pending Banner - Using Centralized UX Copy -->
        @if (deletionPending()) {
          <div class="deletion-pending-banner">
            <div class="deletion-banner-content">
              <i class="pi {{ deletionMessage.icon }}"></i>
              <div class="deletion-banner-text">
                <h4>{{ deletionMessage.title }}</h4>
                <p>{{ getDeletionReason() }}</p>
              </div>
              <div class="deletion-banner-actions">
                <p-button
                  [label]="deletionMessage.actionLabel"
                  icon="pi pi-times"
                  severity="warn"
                  (onClick)="cancelDeletion()"
                  [loading]="cancellingDeletion()"
                ></p-button>
                <a
                  [routerLink]="deletionMessage.helpLink"
                  class="deletion-help-link"
                >
                  Learn More
                </a>
              </div>
            </div>
          </div>
        }

        <!-- Loading State -->
        @if (isLoading()) {
          <div class="loading-state">
            <p-progressSpinner
              [style]="{ width: '50px', height: '50px' }"
              strokeWidth="4"
            ></p-progressSpinner>
            <p class="loading-message">Loading profile...</p>
          </div>
        }

        <!-- Error State -->
        @else if (hasError()) {
          <app-page-error-state
            title="Unable to load profile"
            [message]="errorMessage()"
            (retry)="retryLoad()"
          ></app-page-error-state>
        } @else {
          <!-- Profile Header - Redesigned -->
          <div class="profile-header-card">
            <!-- Background Decoration -->
            <div class="profile-header-bg">
              <div class="bg-pattern"></div>
            </div>

            <!-- Avatar Section -->
            <div class="profile-avatar-container">
              <div class="avatar-wrapper">
                @if (avatarUrl()) {
                  <img
                    [src]="avatarUrl()"
                    alt="Profile picture"
                    class="profile-avatar-img"
                  />
                } @else {
                  <div class="profile-avatar-fallback">
                    <span>{{ userInitials() }}</span>
                  </div>
                }
                <button
                  class="avatar-upload-btn"
                  (click)="triggerFileUpload()"
                  [disabled]="isUploadingAvatar()"
                >
                  @if (isUploadingAvatar()) {
                    <i class="pi pi-spin pi-spinner"></i>
                  } @else {
                    <i class="pi pi-camera"></i>
                  }
                </button>
                <input
                  #fileInput
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  class="hidden-file-input"
                  (change)="onFileSelected($event)"
                />
              </div>

              <!-- Jersey Number Badge -->
              @if (jerseyNumber()) {
                <div class="jersey-badge">
                  <span>#{{ jerseyNumber() }}</span>
                </div>
              }
            </div>

            <!-- User Info -->
            <div class="profile-info-section">
              <h1 class="profile-display-name">{{ userName() }}</h1>

              <!-- Position & Team Info -->
              <div class="profile-position-team">
                @if (userPosition()) {
                  <span class="position-tag">
                    <i class="pi pi-user"></i>
                    {{ userPosition() }}
                  </span>
                }
                @if (teamName()) {
                  <span class="team-tag">
                    <i class="pi pi-users"></i>
                    {{ teamName() }}
                  </span>
                }
              </div>

              <p class="profile-email-text">{{ userEmail() }}</p>

              <!-- Member Since -->
              <p class="member-since">
                <i class="pi pi-calendar"></i>
                Member since {{ memberSince() }}
              </p>
            </div>

            <!-- Action Buttons -->
            <div class="profile-header-actions">
              <button
                class="edit-profile-btn"
                [routerLink]="['/settings']"
                [disabled]="deletionPending()"
              >
                <i class="pi pi-cog"></i>
                <span>Edit Profile</span>
              </button>
              <button class="share-profile-btn" (click)="shareProfile()">
                <i class="pi pi-share-alt"></i>
              </button>
            </div>
          </div>

          <!-- Profile Stats -->
          <app-stats-grid [stats]="stats()"></app-stats-grid>

          <!-- Profile Tabs -->
          <div class="profile-tabs-container">
            <p-tabs [(value)]="activeTab">
              <p-tablist>
                <p-tab value="overview">
                  <i class="pi pi-chart-line"></i>
                  <span class="tab-label">Overview</span>
                </p-tab>
                <p-tab value="achievements">
                  <i class="pi pi-trophy"></i>
                  <span class="tab-label">Achievements</span>
                </p-tab>
                <p-tab value="statistics">
                  <i class="pi pi-chart-bar"></i>
                  <span class="tab-label">Statistics</span>
                </p-tab>
                <p-tab value="invitations">
                  <i class="pi pi-envelope"></i>
                  <span class="tab-label">Invitations</span>
                  @if (pendingInvitations().length > 0) {
                    <span class="invitation-badge">{{
                      pendingInvitations().length
                    }}</span>
                  }
                </p-tab>
              </p-tablist>
              <p-tabpanels>
                <p-tabpanel value="overview">
                  <div class="overview-content">
                    <p-card>
                      <ng-template pTemplate="header">
                        <h3>Recent Activity</h3>
                      </ng-template>
                      @if (activities().length === 0) {
                        <app-empty-state
                          title="No Recent Activity"
                          message="Your activity will appear here once you start training."
                          icon="pi-clock"
                          [compact]="true"
                        ></app-empty-state>
                      } @else {
                        <div class="activity-list">
                          @for (
                            activity of activities();
                            track trackByActivityTitle($index, activity)
                          ) {
                            <div class="activity-item">
                              <div class="activity-icon">
                                <i class="pi" [ngClass]="activity.icon"></i>
                              </div>
                              <div class="activity-content">
                                <div class="activity-title">
                                  {{ activity.title }}
                                </div>
                                <div class="activity-time">
                                  {{ activity.time }}
                                </div>
                              </div>
                            </div>
                          }
                        </div>
                      }
                    </p-card>
                  </div>
                </p-tabpanel>
                <p-tabpanel value="achievements">
                  @if (achievements().length === 0) {
                    <app-empty-state
                      title="No Achievements Yet"
                      message="Complete training sessions and reach milestones to earn achievements."
                      icon="pi-trophy"
                    ></app-empty-state>
                  } @else {
                    <div class="achievements-grid">
                      @for (
                        achievement of achievements();
                        track trackByAchievementTitle($index, achievement)
                      ) {
                        <p-card class="achievement-card">
                          <div class="achievement-icon">
                            <i class="pi" [ngClass]="achievement.icon"></i>
                          </div>
                          <h4 class="achievement-title">
                            {{ achievement.title }}
                          </h4>
                          <p class="achievement-description">
                            {{ achievement.description }}
                          </p>
                          <div class="achievement-date">
                            {{ achievement.date }}
                          </div>
                        </p-card>
                      }
                    </div>
                  }
                </p-tabpanel>
                <p-tabpanel value="statistics">
                  <p-card>
                    <ng-template pTemplate="header">
                      <h3>Performance Statistics</h3>
                    </ng-template>
                    <div class="stats-grid">
                      @for (
                        stat of performanceStats();
                        track trackByPerformanceStatLabel($index, stat)
                      ) {
                        <div class="performance-stat">
                          <div class="stat-label">{{ stat.label }}</div>
                          <div class="stat-value">{{ stat.value }}</div>
                          <p-tag
                            [value]="stat.trend"
                            [severity]="stat.trendType"
                          ></p-tag>
                        </div>
                      }
                    </div>
                  </p-card>
                </p-tabpanel>
                <p-tabpanel value="invitations">
                  <div class="invitations-section">
                    @if (loadingInvitations()) {
                      <div class="loading-invitations">
                        <p-progressSpinner
                          [style]="{ width: '30px', height: '30px' }"
                          strokeWidth="4"
                        ></p-progressSpinner>
                        <span>Loading invitations...</span>
                      </div>
                    } @else if (pendingInvitations().length === 0) {
                      <app-empty-state
                        title="No Pending Invitations"
                        message="You don't have any team invitations at the moment."
                        icon="pi-envelope"
                      ></app-empty-state>
                    } @else {
                      <div class="invitations-list">
                        @for (
                          invitation of pendingInvitations();
                          track invitation.id
                        ) {
                          <p-card class="invitation-card">
                            <div class="invitation-content">
                              <div class="invitation-header">
                                <h4>{{ invitation.teamName }}</h4>
                                <p-tag
                                  [value]="invitation.role | titlecase"
                                  severity="info"
                                ></p-tag>
                              </div>
                              <p class="invitation-message">
                                @if (invitation.message) {
                                  "{{ invitation.message }}"
                                } @else {
                                  You've been invited to join this team as a
                                  {{ invitation.role }}.
                                }
                              </p>
                              <div class="invitation-meta">
                                <span
                                  ><i class="pi pi-user"></i> Invited by
                                  {{ invitation.invitedBy }}</span
                                >
                                <span
                                  ><i class="pi pi-calendar"></i>
                                  {{
                                    invitation.createdAt | date: "mediumDate"
                                  }}</span
                                >
                                @if (invitation.isExpired) {
                                  <p-tag
                                    value="Expired"
                                    severity="danger"
                                  ></p-tag>
                                } @else {
                                  <span class="expires-soon"
                                    >Expires
                                    {{
                                      invitation.expiresAt | date: "mediumDate"
                                    }}</span
                                  >
                                }
                              </div>
                              <div class="invitation-actions">
                                @if (!invitation.isExpired) {
                                  <p-button
                                    label="Accept"
                                    icon="pi pi-check"
                                    (onClick)="acceptInvitation(invitation)"
                                    [loading]="
                                      processingInvitation() === invitation.id
                                    "
                                  ></p-button>
                                  <p-button
                                    label="Decline"
                                    icon="pi pi-times"
                                    [outlined]="true"
                                    severity="secondary"
                                    (onClick)="declineInvitation(invitation)"
                                    [loading]="
                                      processingInvitation() === invitation.id
                                    "
                                  ></p-button>
                                } @else {
                                  <p-button
                                    label="Request New Invitation"
                                    icon="pi pi-refresh"
                                    [outlined]="true"
                                    (onClick)="requestNewInvitation(invitation)"
                                  ></p-button>
                                }
                              </div>
                            </div>
                          </p-card>
                        }
                      </div>
                    }
                  </div>
                </p-tabpanel>
              </p-tabpanels>
            </p-tabs>
          </div>
        }
      </div>
    </app-main-layout>
  `,
  styles: [
    `
      .profile-page {
        padding: var(--space-6);
      }

      /* Deletion Pending Banner - Centralized UX Copy */
      .deletion-pending-banner {
        background: linear-gradient(
          135deg,
          var(--color-status-warning-bg, #fff8e1) 0%,
          #fff3cd 100%
        );
        border: 1px solid var(--color-status-warning, #f59e0b);
        border-radius: var(--radius-lg);
        padding: var(--space-4);
        margin-bottom: var(--space-6);
        box-shadow: var(--shadow-sm);
      }

      .deletion-banner-content {
        display: flex;
        align-items: flex-start;
        gap: var(--space-4);
      }

      .deletion-banner-content > i {
        font-size: 1.75rem;
        color: var(--color-status-warning, #f59e0b);
        flex-shrink: 0;
        margin-top: var(--space-1);
      }

      .deletion-banner-text {
        flex: 1;
      }

      .deletion-banner-text h4 {
        margin: 0 0 var(--space-2) 0;
        font-size: var(--font-heading-sm);
        font-weight: var(--font-weight-semibold);
        color: var(--color-status-warning-dark, #b45309);
      }

      .deletion-banner-text p {
        margin: 0;
        color: var(--text-primary);
        font-size: var(--font-body-md);
      }

      .deletion-banner-actions {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: var(--space-2);
        flex-shrink: 0;
      }

      .deletion-help-link {
        font-size: var(--font-body-sm);
        color: var(--color-status-warning-dark, #b45309);
        text-decoration: underline;
      }

      .deletion-help-link:hover {
        color: var(--color-status-warning, #f59e0b);
      }

      @media (max-width: 640px) {
        .deletion-banner-content {
          flex-direction: column;
        }

        .deletion-banner-actions {
          flex-direction: row;
          width: 100%;
          justify-content: space-between;
          align-items: center;
        }
      }

      .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--space-12);
        min-height: 300px;
      }

      .loading-message {
        margin-top: var(--space-4);
        font-size: var(--font-body-md);
        color: var(--text-secondary);
      }

      /* ========== Redesigned Profile Header ========== */
      .profile-header-card {
        position: relative;
        background: var(--surface-primary, #ffffff);
        border-radius: 20px;
        margin-bottom: var(--space-6);
        overflow: hidden;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        border: 1px solid var(--color-border-secondary, #f0f0f0);
      }

      .profile-header-bg {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 120px;
        background: linear-gradient(
          135deg,
          var(--ds-primary-green, #089949) 0%,
          #0ab85a 50%,
          #067a3b 100%
        );
        overflow: hidden;
      }

      .bg-pattern {
        position: absolute;
        inset: 0;
        background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
      }

      .profile-avatar-container {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding-top: 60px;
        z-index: 1;
      }

      .avatar-wrapper {
        position: relative;
        width: 140px;
        height: 140px;
      }

      .profile-avatar-img,
      .profile-avatar-fallback {
        width: 140px;
        height: 140px;
        border-radius: 50%;
        border: 5px solid var(--surface-primary, #ffffff);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      }

      .profile-avatar-img {
        object-fit: cover;
      }

      .profile-avatar-fallback {
        background: linear-gradient(
          135deg,
          var(--ds-primary-green, #089949) 0%,
          #0ab85a 100%
        );
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .profile-avatar-fallback span {
        font-family: "Poppins", sans-serif;
        font-size: 3rem;
        font-weight: 700;
        color: white;
        letter-spacing: 2px;
      }

      .avatar-upload-btn {
        position: absolute;
        bottom: 8px;
        right: 8px;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: var(--ds-primary-green, #089949);
        border: 3px solid var(--surface-primary, #ffffff);
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        box-shadow: 0 4px 12px rgba(8, 153, 73, 0.3);
      }

      .avatar-upload-btn:hover:not(:disabled) {
        transform: scale(1.1);
        background: #067a3b;
      }

      .avatar-upload-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }

      .avatar-upload-btn i {
        font-size: 1.125rem;
      }

      .hidden-file-input {
        display: none;
      }

      .jersey-badge {
        margin-top: 0.75rem;
        padding: 0.375rem 1rem;
        background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%);
        border-radius: 20px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }

      .jersey-badge span {
        font-family: "Poppins", sans-serif;
        font-size: 1.125rem;
        font-weight: 800;
        color: white;
        letter-spacing: 1px;
      }

      .profile-info-section {
        text-align: center;
        padding: 1.5rem 2rem 2rem;
      }

      .profile-display-name {
        font-family: "Poppins", sans-serif;
        font-size: 2rem;
        font-weight: 700;
        color: var(--color-text-primary, #1a1a1a);
        margin: 0 0 0.75rem 0;
        line-height: 1.2;
      }

      .profile-position-team {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
        margin-bottom: 1rem;
      }

      .position-tag,
      .team-tag {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-family: "Poppins", sans-serif;
        font-size: 0.875rem;
        font-weight: 600;
      }

      .position-tag {
        background: rgba(8, 153, 73, 0.1);
        color: var(--ds-primary-green, #089949);
      }

      .team-tag {
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
      }

      .position-tag i,
      .team-tag i {
        font-size: 0.875rem;
      }

      .profile-email-text {
        font-size: 0.9375rem;
        color: var(--color-text-secondary, #6b7280);
        margin: 0 0 0.75rem 0;
      }

      .member-since {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8125rem;
        color: var(--color-text-tertiary, #9ca3af);
        margin: 0;
      }

      .member-since i {
        font-size: 0.75rem;
      }

      .profile-header-actions {
        display: flex;
        justify-content: center;
        gap: 0.75rem;
        padding: 0 2rem 2rem;
      }

      .edit-profile-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        font-family: "Poppins", sans-serif;
        font-size: 0.9375rem;
        font-weight: 600;
        color: white;
        background: linear-gradient(
          135deg,
          var(--ds-primary-green, #089949) 0%,
          #0ab85a 100%
        );
        border: none;
        border-radius: 9999px;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 12px rgba(8, 153, 73, 0.3);
      }

      .edit-profile-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(8, 153, 73, 0.4);
      }

      .edit-profile-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .share-profile-btn {
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--surface-secondary, #f8f8f8);
        border: 2px solid var(--color-border-primary, #e0e0e0);
        border-radius: 50%;
        color: var(--color-text-secondary, #6b7280);
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .share-profile-btn:hover {
        background: var(--ds-primary-green, #089949);
        border-color: var(--ds-primary-green, #089949);
        color: white;
      }

      .share-profile-btn i {
        font-size: 1.125rem;
      }

      .profile-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--space-4);
        margin-bottom: var(--space-6);
      }

      .stat-card {
        text-align: center;
      }

      .stat-value {
        font-size: var(--font-heading-2xl);
        font-weight: var(--font-weight-bold);
        color: var(--color-brand-primary);
        margin-bottom: var(--space-2);
      }

      .stat-label {
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
      }

      .overview-content {
        margin-top: var(--space-4);
      }

      .activity-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .activity-item {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3);
        border-radius: var(--p-border-radius);
        transition: background 0.2s;
      }

      .activity-item:hover {
        background: var(--p-surface-50);
      }

      .activity-icon {
        font-size: var(--icon-3xl);
      }

      .activity-title {
        font-weight: var(--font-weight-semibold);
        color: var(--text-primary);
        margin-bottom: var(--space-1);
      }

      .activity-time {
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
      }

      .achievements-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: var(--space-4);
        margin-top: var(--space-4);
      }

      .achievement-card {
        text-align: center;
        transition: transform 0.2s;
      }

      .achievement-card:hover {
        transform: translateY(-4px);
      }

      .achievement-icon {
        font-size: var(--icon-4xl);
        margin-bottom: var(--space-3);
      }

      .achievement-title {
        font-size: var(--font-body-lg);
        font-weight: var(--font-weight-semibold);
        margin-bottom: var(--space-2);
        color: var(--text-primary);
      }

      .achievement-description {
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
        margin-bottom: var(--space-3);
      }

      .achievement-date {
        font-size: var(--font-body-xs);
        color: var(--text-secondary);
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--space-4);
      }

      /* Remove borders from statistics card */
      .profile-tabs-container :host ::ng-deep p-card,
      .profile-tabs-container ::ng-deep p-card,
      .profile-tabs-container :host ::ng-deep .p-card,
      .profile-tabs-container ::ng-deep .p-card {
        border: none !important;
        box-shadow: none !important;
      }

      .performance-stat {
        padding: var(--space-4);
        background: var(--surface-primary, #ffffff);
        border-radius: var(--radius-lg, 12px);
        text-align: center;
        border: none;
        box-shadow: none;
      }

      .performance-stat .stat-label {
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
        margin-bottom: var(--space-2);
      }

      .performance-stat .stat-value {
        font-size: var(--font-heading-lg);
        font-weight: var(--font-weight-bold);
        color: var(--text-primary);
        margin-bottom: var(--space-2);
      }

      /* Fix p-tag colors - transparent background with black text */
      .performance-stat :host ::ng-deep .p-tag,
      .performance-stat ::ng-deep .p-tag,
      .performance-stat .p-tag {
        background: transparent !important;
        color: var(--color-text-primary, #1a1a1a) !important;
        border: none !important;
        padding: 0 !important;
        font-weight: 500;
      }

      .performance-stat :host ::ng-deep .p-tag-info,
      .performance-stat ::ng-deep .p-tag-info,
      .performance-stat .p-tag-info {
        background: transparent !important;
        color: var(--color-text-primary, #1a1a1a) !important;
      }

      .performance-stat :host ::ng-deep .p-tag-secondary,
      .performance-stat ::ng-deep .p-tag-secondary,
      .performance-stat .p-tag-secondary {
        background: transparent !important;
        color: var(--color-text-primary, #1a1a1a) !important;
      }

      .performance-stat :host ::ng-deep .p-tag-success,
      .performance-stat ::ng-deep .p-tag-success,
      .performance-stat .p-tag-success {
        background: transparent !important;
        color: var(--color-text-primary, #1a1a1a) !important;
      }

      /* ========== Profile Tabs - Premium Pill Button Design ========== */
      .profile-tabs-container {
        margin-top: 1.5rem;
      }

      /* Reset all PrimeNG tab styles */
      .profile-tabs-container ::ng-deep .p-tabs,
      .profile-tabs-container ::ng-deep .p-tabs * {
        border: none !important;
        outline: none !important;
        box-shadow: none !important;
      }

      .profile-tabs-container ::ng-deep .p-tabs {
        background: transparent !important;
      }

      .profile-tabs-container ::ng-deep .p-tablist {
        display: flex !important;
        align-items: center !important;
        background: transparent !important;
        padding: 0 !important;
        margin-bottom: 1.5rem !important;
      }

      .profile-tabs-container ::ng-deep .p-tablist-content,
      .profile-tabs-container ::ng-deep .p-tablist-viewport {
        background: transparent !important;
        overflow: visible !important;
      }

      .profile-tabs-container ::ng-deep .p-tablist-tab-list {
        display: flex !important;
        gap: 0.75rem !important;
        flex-wrap: wrap !important;
        justify-content: center !important;
        width: 100% !important;
      }

      /* Hide the active bar indicator */
      .profile-tabs-container ::ng-deep .p-tablist-active-bar {
        display: none !important;
      }

      /* Individual Tab - Premium Pill Button (Inactive) */
      .profile-tabs-container ::ng-deep .p-tab {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 0.625rem !important;
        padding: 0.875rem 1.75rem !important;
        font-family:
          "Poppins",
          -apple-system,
          BlinkMacSystemFont,
          sans-serif !important;
        font-size: 0.9375rem !important;
        font-weight: 600 !important;
        letter-spacing: 0.01em !important;
        color: #374151 !important;
        background: #ffffff !important;
        border-radius: 9999px !important;
        cursor: pointer !important;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
        box-shadow:
          0 1px 3px rgba(0, 0, 0, 0.08),
          0 4px 12px rgba(0, 0, 0, 0.04),
          inset 0 0 0 1px rgba(0, 0, 0, 0.06) !important;
        min-height: 48px !important;
        flex: none !important;
        position: relative !important;
        overflow: hidden !important;
      }

      /* Subtle shine effect on inactive tabs */
      .profile-tabs-container ::ng-deep .p-tab::before {
        content: "" !important;
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        height: 50% !important;
        background: linear-gradient(
          180deg,
          rgba(255, 255, 255, 0.8) 0%,
          rgba(255, 255, 255, 0) 100%
        ) !important;
        pointer-events: none !important;
        border-radius: 9999px 9999px 0 0 !important;
      }

      /* Icon styling in inactive tabs */
      .profile-tabs-container ::ng-deep .p-tab i,
      .profile-tabs-container ::ng-deep .p-tab .pi {
        font-size: 1.125rem !important;
        color: var(--ds-primary-green, #089949) !important;
        transition: all 0.25s ease !important;
      }

      /* Tab label styling */
      .profile-tabs-container ::ng-deep .p-tab .tab-label {
        color: #374151 !important;
        transition: color 0.25s ease !important;
      }

      /* Hover state for inactive tabs */
      .profile-tabs-container
        ::ng-deep
        .p-tab:hover:not([data-p-active="true"]):not([aria-selected="true"]) {
        transform: translateY(-3px) !important;
        box-shadow:
          0 4px 12px rgba(8, 153, 73, 0.15),
          0 8px 24px rgba(8, 153, 73, 0.1),
          inset 0 0 0 2px rgba(8, 153, 73, 0.2) !important;
        background: #ffffff !important;
      }

      .profile-tabs-container
        ::ng-deep
        .p-tab:hover:not([data-p-active="true"]):not([aria-selected="true"])
        i,
      .profile-tabs-container
        ::ng-deep
        .p-tab:hover:not([data-p-active="true"]):not([aria-selected="true"])
        .pi {
        color: var(--ds-primary-green, #089949) !important;
        transform: scale(1.1) !important;
      }

      .profile-tabs-container
        ::ng-deep
        .p-tab:hover:not([data-p-active="true"]):not([aria-selected="true"])
        .tab-label {
        color: var(--ds-primary-green, #089949) !important;
      }

      /* Active Tab - Premium Green Gradient */
      .profile-tabs-container ::ng-deep .p-tab[data-p-active="true"],
      .profile-tabs-container ::ng-deep .p-tab[aria-selected="true"],
      .profile-tabs-container ::ng-deep .p-tab.p-tab-active {
        color: #ffffff !important;
        background: linear-gradient(
          135deg,
          #0ab85a 0%,
          var(--ds-primary-green, #089949) 50%,
          #067a3b 100%
        ) !important;
        box-shadow:
          0 4px 14px rgba(8, 153, 73, 0.4),
          0 8px 24px rgba(8, 153, 73, 0.2),
          inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
        transform: translateY(-1px) !important;
      }

      /* Shine effect on active tab */
      .profile-tabs-container ::ng-deep .p-tab[data-p-active="true"]::before,
      .profile-tabs-container ::ng-deep .p-tab[aria-selected="true"]::before,
      .profile-tabs-container ::ng-deep .p-tab.p-tab-active::before {
        background: linear-gradient(
          180deg,
          rgba(255, 255, 255, 0.25) 0%,
          rgba(255, 255, 255, 0) 100%
        ) !important;
      }

      /* Icon in active tab - white */
      .profile-tabs-container ::ng-deep .p-tab[data-p-active="true"] i,
      .profile-tabs-container ::ng-deep .p-tab[data-p-active="true"] .pi,
      .profile-tabs-container ::ng-deep .p-tab[aria-selected="true"] i,
      .profile-tabs-container ::ng-deep .p-tab[aria-selected="true"] .pi,
      .profile-tabs-container ::ng-deep .p-tab.p-tab-active i,
      .profile-tabs-container ::ng-deep .p-tab.p-tab-active .pi {
        color: #ffffff !important;
      }

      /* Tab label in active tab - white */
      .profile-tabs-container ::ng-deep .p-tab[data-p-active="true"] .tab-label,
      .profile-tabs-container ::ng-deep .p-tab[aria-selected="true"] .tab-label,
      .profile-tabs-container ::ng-deep .p-tab.p-tab-active .tab-label {
        color: #ffffff !important;
      }

      /* Active tab hover - elevated with glow */
      .profile-tabs-container ::ng-deep .p-tab[data-p-active="true"]:hover,
      .profile-tabs-container ::ng-deep .p-tab[aria-selected="true"]:hover,
      .profile-tabs-container ::ng-deep .p-tab.p-tab-active:hover {
        transform: translateY(-3px) !important;
        box-shadow:
          0 6px 20px rgba(8, 153, 73, 0.5),
          0 12px 32px rgba(8, 153, 73, 0.25),
          inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
      }

      /* Active/pressed state */
      .profile-tabs-container ::ng-deep .p-tab:active {
        transform: translateY(0) scale(0.98) !important;
      }

      /* Focus state for accessibility */
      .profile-tabs-container ::ng-deep .p-tab:focus-visible {
        box-shadow:
          0 0 0 3px #ffffff,
          0 0 0 5px var(--ds-primary-green, #089949),
          0 4px 12px rgba(8, 153, 73, 0.2) !important;
      }

      /* Invitation badge */
      .invitation-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 20px;
        height: 20px;
        padding: 0 6px;
        font-size: 0.6875rem;
        font-weight: 700;
        color: white;
        background: var(--color-status-error, #ef4444);
        border-radius: 10px;
        margin-left: 6px;
        line-height: 1;
      }

      /* Tab label */
      .tab-label {
        color: inherit;
      }

      /* Invitations Section */
      .invitations-section {
        margin-top: var(--space-4);
      }

      .loading-invitations {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-3);
        padding: var(--space-8);
        color: var(--text-secondary);
      }

      .invitations-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .invitation-card {
        border-left: 4px solid var(--color-brand-primary);
        transition:
          transform 0.2s,
          box-shadow 0.2s;
      }

      .invitation-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
      }

      .invitation-content {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .invitation-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .invitation-header h4 {
        margin: 0;
        font-size: var(--font-heading-sm);
        color: var(--text-primary);
      }

      .invitation-message {
        font-style: italic;
        color: var(--text-secondary);
        margin: 0;
        padding: var(--space-3);
        background: var(--p-surface-50);
        border-radius: var(--p-border-radius);
      }

      .invitation-meta {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-4);
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
      }

      .invitation-meta span {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .expires-soon {
        color: var(--color-status-warning);
      }

      .invitation-actions {
        display: flex;
        gap: var(--space-3);
        margin-top: var(--space-2);
      }

      @media (max-width: 768px) {
        .profile-header-card {
          border-radius: 16px;
        }

        .profile-header-bg {
          height: 100px;
        }

        .profile-avatar-container {
          padding-top: 40px;
        }

        .avatar-wrapper {
          width: 120px;
          height: 120px;
        }

        .profile-avatar-img,
        .profile-avatar-fallback {
          width: 120px;
          height: 120px;
          border-width: 4px;
        }

        .profile-avatar-fallback span {
          font-size: 2.5rem;
        }

        .avatar-upload-btn {
          width: 40px;
          height: 40px;
        }

        .profile-display-name {
          font-size: 1.5rem;
        }

        .profile-position-team {
          flex-direction: column;
          gap: 0.5rem;
        }

        .profile-info-section {
          padding: 1rem 1.5rem 1.5rem;
        }

        .profile-header-actions {
          padding: 0 1.5rem 1.5rem;
        }

        .edit-profile-btn {
          flex: 1;
          justify-content: center;
        }

        .profile-stats {
          grid-template-columns: repeat(2, 1fr);
        }

        /* Mobile tabs styling */
        .invitation-header {
          flex-direction: column;
          align-items: flex-start;
          gap: var(--space-2);
        }

        .invitation-meta {
          flex-direction: column;
          gap: var(--space-2);
        }

        .invitation-actions {
          flex-direction: column;
        }
      }

      /* Tablet - Slightly smaller tabs */
      @media (max-width: 768px) {
        .profile-tabs-container ::ng-deep .p-tablist-tab-list {
          gap: 0.5rem !important;
        }

        .profile-tabs-container ::ng-deep .p-tab {
          padding: 0.75rem 1.25rem !important;
          font-size: 0.875rem !important;
          min-height: 44px !important;
        }

        .profile-tabs-container ::ng-deep .p-tab i,
        .profile-tabs-container ::ng-deep .p-tab .pi {
          font-size: 1rem !important;
        }
      }

      /* Mobile - Compact pills */
      @media (max-width: 540px) {
        .profile-tabs-container ::ng-deep .p-tablist-tab-list {
          gap: 0.375rem !important;
          justify-content: space-between !important;
        }

        .profile-tabs-container ::ng-deep .p-tab {
          padding: 0.625rem 0.875rem !important;
          font-size: 0.8125rem !important;
          min-height: 40px !important;
          flex: 1 !important;
          max-width: calc(25% - 0.375rem) !important;
        }

        .tab-label {
          display: none !important;
        }

        .profile-tabs-container ::ng-deep .p-tab i,
        .profile-tabs-container ::ng-deep .p-tab .pi {
          font-size: 1.125rem !important;
        }

        .invitation-badge {
          margin-left: 0 !important;
          position: absolute !important;
          top: -4px !important;
          right: -4px !important;
          min-width: 18px !important;
          height: 18px !important;
          font-size: 0.625rem !important;
        }

        .profile-tabs-container ::ng-deep .p-tab {
          position: relative !important;
        }
      }
    `,
  ],
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private supabaseService = inject(SupabaseService);
  private toastService = inject(ToastService);
  private logger = inject(LoggerService);
  private accountDeletionService = inject(AccountDeletionService);

  @ViewChild("fileInput") fileInput!: ElementRef<HTMLInputElement>;

  // Centralized UX copy for deletion state
  readonly deletionMessage = DELETION_MESSAGES.pending;

  // Deletion state - restricts profile actions when pending
  deletionPending = this.accountDeletionService.hasPendingDeletion;
  daysUntilDeletion = this.accountDeletionService.daysRemaining;
  cancellingDeletion = signal(false);

  isLoading = signal(true);
  hasError = signal(false);
  errorMessage = signal(
    "Something went wrong while loading your profile. Please try again.",
  );

  userName = signal("Loading...");
  userEmail = signal("Loading...");
  userRole = signal("Player");
  userPosition = signal<string | null>(null);
  teamName = signal<string | null>(null);
  jerseyNumber = signal<string | null>(null);
  memberSince = signal("Recently");
  avatarUrl = signal<string | null>(null);
  isUploadingAvatar = signal(false);
  userInitials = signal("U");
  activeTab = signal<string>("overview");
  stats = signal<Array<{ value: string; label: string }>>([]);
  activities = signal<Array<{ icon: string; title: string; time: string }>>([]);
  achievements = signal<
    Array<{ icon: string; title: string; description: string; date: string }>
  >([]);
  performanceStats = signal<
    Array<{
      label: string;
      value: string;
      trend: string;
      trendType:
        | "success"
        | "info"
        | "warn"
        | "secondary"
        | "contrast"
        | "danger";
    }>
  >([]);

  // Invitations
  pendingInvitations = signal<PendingInvitation[]>([]);
  loadingInvitations = signal(false);
  processingInvitation = signal<string | null>(null);

  ngOnInit(): void {
    this.initializePage();
  }

  /**
   * Initialize page with error handling
   */
  private initializePage(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.loadProfileData();
    this.loadPendingInvitations();
    // Check for pending deletion to show banner and restrict actions
    this.accountDeletionService.checkDeletionStatus();
  }

  /**
   * Retry loading the page
   */
  retryLoad(): void {
    this.initializePage();
  }

  async loadProfileData(): Promise<void> {
    this.isLoading.set(true);
    const user = this.authService.getUser();

    if (user) {
      this.userName.set(user.name || user.email || "User");
      this.userEmail.set(user.email || "");
      this.userRole.set(user.role || "Player");
      this.userInitials.set(this.getInitials(this.userName()));

      // Load position from user data or profile
      if (user.position) {
        this.userPosition.set(user.position);
      }

      // Load avatar URL
      if (user.avatar_url) {
        this.avatarUrl.set(user.avatar_url);
      }
    }

    if (!user?.id) {
      this.loadEmptyState();
      this.isLoading.set(false);
      return;
    }

    // Load extended profile data from Supabase
    await this.loadExtendedProfileData(user.id);

    try {
      // Load real training sessions count
      // Using session_date (not scheduled_date) and correct column names
      const { data: sessions, error: sessionsError } =
        await this.supabaseService.client
          .from("training_sessions")
          .select("id, status, completed_at, session_date, duration_minutes")
          .eq("user_id", user.id);

      if (sessionsError) {
        // If table doesn't exist or user_id column missing, use empty data
        if (sessionsError.code === "42P01" || sessionsError.code === "42703") {
          this.logger.warn(
            "Training sessions query failed:",
            sessionsError.message,
          );
          this.loadEmptyState();
          this.isLoading.set(false);
          return;
        }
        throw sessionsError;
      }

      const completedSessions = (sessions || []).filter(
        (s) => s.status === "completed",
      );
      const totalSessions = completedSessions.length;

      // Calculate streak
      let streak = 0;
      const sortedSessions = [...completedSessions].sort(
        (a, b) =>
          new Date(b.completed_at || b.session_date).getTime() -
          new Date(a.completed_at || a.session_date).getTime(),
      );

      if (sortedSessions.length > 0) {
        let checkDate = new Date();
        checkDate.setHours(0, 0, 0, 0);

        for (const session of sortedSessions) {
          const sessionDate = new Date(
            session.completed_at || session.session_date,
          );
          sessionDate.setHours(0, 0, 0, 0);

          const daysDiff = Math.floor(
            (checkDate.getTime() - sessionDate.getTime()) /
              (1000 * 60 * 60 * 24),
          );

          if (daysDiff <= 1) {
            streak++;
            checkDate = sessionDate;
          } else {
            break;
          }
        }
      }

      // Load wellness data for performance score
      // Using checkin_date (not date) and energy_level (not energy)
      const { data: wellness } = await this.supabaseService.client
        .from("wellness_checkins")
        .select("energy_level, motivation_level, sleep_quality, checkin_date")
        .eq("user_id", user.id)
        .order("checkin_date", { ascending: false })
        .limit(7);

      // Calculate performance score based on wellness and training
      // Only calculate if we have actual wellness data with real values
      let performanceScore = 0;
      if (wellness && wellness.length > 0) {
        // Filter to only records that have at least one actual value (not null/undefined)
        const validRecords = wellness.filter(
          (w) =>
            w.energy_level !== null &&
            w.energy_level !== undefined &&
            w.motivation_level !== null &&
            w.motivation_level !== undefined &&
            w.sleep_quality !== null &&
            w.sleep_quality !== undefined,
        );

        if (validRecords.length > 0) {
          const avgEnergy =
            validRecords.reduce((a, w) => a + w.energy_level, 0) /
            validRecords.length;
          const avgMotivation =
            validRecords.reduce((a, w) => a + w.motivation_level, 0) /
            validRecords.length;
          const avgSleep =
            validRecords.reduce((a, w) => a + w.sleep_quality, 0) /
            validRecords.length;
          // Score out of 100 based on averages (each is 1-10 scale)
          performanceScore = Math.round(
            ((avgEnergy + avgMotivation + avgSleep) / 30) * 100,
          );
        }
      }

      // Load stats with real data - only show actual data, not placeholders
      this.stats.set([
        { value: totalSessions.toString(), label: "Training Sessions" },
        {
          value: performanceScore > 0 ? `${performanceScore}%` : "—",
          label: "Performance Score",
        },
        { value: streak.toString(), label: "Day Streak" },
        { value: "0", label: "Games Played" },
      ]);

      // Load recent activities from training sessions
      const recentActivities = sortedSessions.slice(0, 5).map((session) => {
        const date = new Date(session.completed_at || session.session_date);
        const timeAgo = this.getTimeAgo(date);
        return {
          icon: "pi-play",
          title: `Completed ${session.duration_minutes || 0} min training`,
          time: timeAgo,
        };
      });

      this.activities.set(recentActivities.length > 0 ? recentActivities : []);

      // Build achievements based on real data
      const achievements: Array<{
        icon: string;
        title: string;
        description: string;
        date: string;
      }> = [];

      if (streak >= 7) {
        achievements.push({
          icon: "pi-bolt",
          title: `${streak}-Day Streak`,
          description: `Completed ${streak} consecutive training days`,
          date: "Current",
        });
      }
      if (totalSessions >= 10) {
        achievements.push({
          icon: "pi-play",
          title: "10 Sessions Complete",
          description: "Reached your first training milestone",
          date: "Achieved",
        });
      }
      if (totalSessions >= 25) {
        achievements.push({
          icon: "pi-star",
          title: "25 Sessions Complete",
          description: "Consistent training pays off",
          date: "Achieved",
        });
      }
      if (totalSessions >= 50) {
        achievements.push({
          icon: "pi-trophy",
          title: "Dedicated Athlete",
          description: "50+ training sessions logged",
          date: "Achieved",
        });
      }

      this.achievements.set(achievements);

      // Load performance stats with real data
      const totalMinutes = completedSessions.reduce(
        (a, s) => a + (s.duration_minutes || 0),
        0,
      );
      const avgSessionLength =
        totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;

      // Performance stats - only show meaningful trends when there's actual data
      this.performanceStats.set([
        {
          label: "Performance Score",
          value: performanceScore > 0 ? `${performanceScore}%` : "—",
          trend:
            performanceScore > 0
              ? performanceScore >= 80
                ? "Excellent"
                : performanceScore >= 60
                  ? "Good"
                  : "Building"
              : "No wellness data yet",
          trendType:
            performanceScore > 0
              ? performanceScore >= 80
                ? "success"
                : performanceScore >= 60
                  ? "info"
                  : "secondary"
              : "secondary",
        },
        {
          label: "Avg Session Length",
          value: avgSessionLength > 0 ? `${avgSessionLength} min` : "—",
          trend:
            avgSessionLength > 0
              ? avgSessionLength >= 45
                ? "Great duration"
                : "Keep it up"
              : "No sessions yet",
          trendType:
            avgSessionLength > 0
              ? avgSessionLength >= 45
                ? "success"
                : "info"
              : "secondary",
        },
        {
          label: "Total Training Hours",
          value: totalMinutes > 0 ? `${(totalMinutes / 60).toFixed(1)}h` : "0h",
          trend:
            totalMinutes > 0
              ? totalMinutes >= 600
                ? "Strong commitment"
                : "Building base"
              : "Start training to track",
          trendType:
            totalMinutes > 0
              ? totalMinutes >= 600
                ? "success"
                : "info"
              : "secondary",
        },
      ]);
    } catch (error) {
      this.logger.error("Error loading profile data:", error);

      // Check if it's a critical error
      if (
        error instanceof Error &&
        (error.message.includes("auth") || error.message.includes("401"))
      ) {
        this.hasError.set(true);
        this.errorMessage.set("Your session has expired. Please log in again.");
      } else {
        // For non-critical errors, show empty state
        this.loadEmptyState();
      }
    }

    this.isLoading.set(false);
  }

  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  }

  private loadEmptyState(): void {
    this.stats.set([
      { value: "0", label: "Training Sessions" },
      { value: "—", label: "Performance Score" },
      { value: "0", label: "Day Streak" },
      { value: "0", label: "Games Played" },
    ]);

    this.activities.set([]);
    this.achievements.set([]);
    this.performanceStats.set([
      {
        label: "Performance Score",
        value: "—",
        trend: "No wellness data yet",
        trendType: "secondary",
      },
      {
        label: "Avg Session Length",
        value: "—",
        trend: "No sessions yet",
        trendType: "secondary",
      },
      {
        label: "Total Training Hours",
        value: "0h",
        trend: "Start training to track",
        trendType: "secondary",
      },
    ]);
  }

  getInitials(name: string): string {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  trackByActivityTitle(
    index: number,
    activity: { icon: string; title: string; time: string },
  ): string {
    return activity.title || index.toString();
  }

  trackByAchievementTitle(
    index: number,
    achievement: {
      icon: string;
      title: string;
      description: string;
      date: string;
    },
  ): string {
    return achievement.title || index.toString();
  }

  trackByPerformanceStatLabel(
    index: number,
    stat: { label: string; value: string; trend: string; trendType: string },
  ): string {
    return stat.label || index.toString();
  }

  /**
   * Trigger file input click
   */
  triggerFileUpload(): void {
    this.fileInput?.nativeElement?.click();
  }

  /**
   * Handle file selection for profile picture upload
   */
  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      this.toastService.error("Please select a JPEG, PNG, or WebP image");
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this.toastService.error("Image must be smaller than 5MB");
      return;
    }

    this.isUploadingAvatar.set(true);

    try {
      const user = this.authService.getUser();
      if (!user?.id) throw new Error("Not logged in");

      // Create unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } =
        await this.supabaseService.client.storage
          .from("avatars")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: true,
          });

      if (uploadError) {
        // If bucket doesn't exist, show helpful message
        if (
          uploadError.message.includes("bucket") ||
          uploadError.message.includes("not found")
        ) {
          this.toastService.error(
            "Avatar storage is not configured. Please contact support.",
          );
          this.logger.error("Avatars bucket not found:", uploadError);
          return;
        }
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = this.supabaseService.client.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const avatarUrl = urlData.publicUrl;

      // Update profile in database
      const { error: updateError } = await this.supabaseService.client
        .from("profiles")
        .upsert({
          id: user.id,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        });

      if (updateError) {
        this.logger.warn(
          "Could not save avatar to profiles table:",
          updateError,
        );
      }

      // Update local state
      this.avatarUrl.set(avatarUrl);
      this.toastService.success("Profile picture updated!");
    } catch (error) {
      this.logger.error("Error uploading avatar:", error);
      this.toastService.error("Failed to upload profile picture");
    } finally {
      this.isUploadingAvatar.set(false);
      // Reset file input
      if (this.fileInput?.nativeElement) {
        this.fileInput.nativeElement.value = "";
      }
    }
  }

  /**
   * Share profile
   */
  shareProfile(): void {
    if (navigator.share) {
      navigator
        .share({
          title: `${this.userName()} - FlagFit Pro`,
          text: `Check out ${this.userName()}'s profile on FlagFit Pro!`,
          url: window.location.href,
        })
        .catch(() => {
          // User cancelled or error - ignore
        });
    } else {
      // Fallback: copy URL to clipboard
      navigator.clipboard.writeText(window.location.href);
      this.toastService.success("Profile link copied to clipboard!");
    }
  }

  /**
   * Load extended profile data from Supabase
   * Uses team_members table for position, jersey number, and team info
   */
  private async loadExtendedProfileData(userId: string): Promise<void> {
    try {
      // Load team membership data (includes position, jersey number, team)
      const { data: membership, error: memberError } =
        await this.supabaseService.client
          .from("team_members")
          .select(
            `
          position,
          jersey_number,
          role,
          joined_at,
          teams:team_id(name)
        `,
          )
          .eq("user_id", userId)
          .eq("status", "active")
          .limit(1)
          .maybeSingle();

      if (!memberError && membership) {
        // Load position
        if (membership.position) {
          this.userPosition.set(membership.position);
        }

        // Load jersey number
        if (membership.jersey_number) {
          this.jerseyNumber.set(membership.jersey_number.toString());
        }

        // Load team name - teams is returned as an object from the join
        const teamsData = membership.teams as unknown as {
          name: string;
        } | null;
        if (teamsData?.name) {
          this.teamName.set(teamsData.name);
        }

        // Format member since date from joined_at
        if (membership.joined_at) {
          const date = new Date(membership.joined_at);
          this.memberSince.set(
            date.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            }),
          );
        }
      }

      // Set member since from Supabase auth user if not set from team membership
      if (this.memberSince() === "Recently") {
        const {
          data: { user: authUser },
        } = await this.supabaseService.client.auth.getUser();
        if (authUser?.created_at) {
          const date = new Date(authUser.created_at);
          this.memberSince.set(
            date.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            }),
          );
        }
      }
    } catch (error) {
      this.logger.warn("Could not load extended profile data:", error);
      // Non-critical error, continue with basic profile
    }
  }

  // ============================================================================
  // INVITATIONS
  // ============================================================================

  async loadPendingInvitations(): Promise<void> {
    this.loadingInvitations.set(true);

    try {
      const user = this.authService.currentUser();
      if (!user?.email) {
        this.loadingInvitations.set(false);
        return;
      }

      // Query invitations without the problematic join - invited_by doesn't have a FK relationship
      const { data, error } = await this.supabaseService.client
        .from("team_invitations")
        .select(
          `
          id,
          team_id,
          role,
          status,
          expires_at,
          created_at,
          invited_by,
          teams:team_id(name)
        `,
        )
        .eq("email", user.email)
        .in("status", ["pending", "expired"])
        .order("created_at", { ascending: false });

      if (error) {
        // Table doesn't exist or other non-critical error
        if (error.code === "42P01" || error.code === "PGRST200") {
          this.logger.warn(
            "Team invitations table not configured:",
            error.message,
          );
          return;
        }
        throw error;
      }

      const invitations: PendingInvitation[] = (data || []).map((inv: any) => ({
        id: inv.id,
        teamId: inv.team_id,
        teamName: inv.teams?.name || "Unknown Team",
        role: inv.role,
        message: "", // No message column in table
        invitedBy: "Team Admin", // Can't join to auth.users directly
        createdAt: inv.created_at,
        expiresAt: inv.expires_at,
        isExpired: new Date(inv.expires_at) < new Date(),
      }));

      this.pendingInvitations.set(invitations);
    } catch (error) {
      this.logger.error("Error loading invitations:", error);
    } finally {
      this.loadingInvitations.set(false);
    }
  }

  async acceptInvitation(invitation: PendingInvitation): Promise<void> {
    this.processingInvitation.set(invitation.id);

    try {
      // Call the accept_team_invitation function
      const { error } = await this.supabaseService.client.rpc(
        "accept_team_invitation",
        { p_invitation_id: invitation.id },
      );

      if (error) throw error;

      this.toastService.success(`You've joined ${invitation.teamName}!`);

      // Remove from list
      this.pendingInvitations.update((invs) =>
        invs.filter((i) => i.id !== invitation.id),
      );

      // Reload profile data to reflect new team membership
      this.loadProfileData();
    } catch (error: any) {
      this.logger.error("Error accepting invitation:", error);
      this.toastService.error(error.message || "Failed to accept invitation");
    } finally {
      this.processingInvitation.set(null);
    }
  }

  async declineInvitation(invitation: PendingInvitation): Promise<void> {
    this.processingInvitation.set(invitation.id);

    try {
      // Call the decline_team_invitation function
      const { error } = await this.supabaseService.client.rpc(
        "decline_team_invitation",
        { p_invitation_id: invitation.id },
      );

      if (error) throw error;

      this.toastService.info("Invitation declined");

      // Remove from list
      this.pendingInvitations.update((invs) =>
        invs.filter((i) => i.id !== invitation.id),
      );
    } catch (error: any) {
      this.logger.error("Error declining invitation:", error);
      this.toastService.error(error.message || "Failed to decline invitation");
    } finally {
      this.processingInvitation.set(null);
    }
  }

  requestNewInvitation(invitation: PendingInvitation): void {
    // This would typically send a notification to the team admin
    this.toastService.info(
      `A request has been sent to ${invitation.teamName} for a new invitation.`,
    );
  }

  // ============================================================================
  // DELETION STATE HANDLING - Using Centralized UX Copy
  // ============================================================================

  /**
   * Get the deletion reason with days remaining interpolated
   * Uses centralized getDeletionMessage helper for consistent UX
   */
  getDeletionReason(): string {
    const days = this.daysUntilDeletion();
    // Use the centralized helper which handles days interpolation
    const message = getDeletionMessage("pending", days ?? undefined);
    return message.reason;
  }

  /**
   * Cancel pending account deletion
   */
  async cancelDeletion(): Promise<void> {
    this.cancellingDeletion.set(true);
    try {
      const success = await this.accountDeletionService.cancelDeletion();
      if (success) {
        // Reload profile data to refresh state
        this.loadProfileData();
      }
    } finally {
      this.cancellingDeletion.set(false);
    }
  }
}
