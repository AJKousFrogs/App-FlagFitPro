import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  ViewEncapsulation,
  inject,
  signal,
} from "@angular/core";

import { CommonModule, DatePipe, TitleCasePipe } from "@angular/common";
import { RouterModule } from "@angular/router";
import { AvatarModule } from "primeng/avatar";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { IconButtonComponent } from "../../shared/components/button/icon-button.component";
import { CardShellComponent } from "../../shared/components/card-shell/card-shell.component";
import { ProgressBarModule } from "primeng/progressbar";
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
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageErrorStateComponent } from "../../shared/components/page-error-state/page-error-state.component";
import { StatsGridComponent } from "../../shared/components/stats-grid/stats-grid.component";
import {
  DELETION_MESSAGES,
  getDeletionMessage,
} from "../../shared/utils/privacy-ux-copy";
import { MobileOptimizedImageDirective } from "../../shared/directives/mobile-optimized-image.directive";

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
    AvatarModule,
    TagModule,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    ProgressBarModule,
    ProgressSpinnerModule,
    TooltipModule,
    MainLayoutComponent,
    PageErrorStateComponent,
    MobileOptimizedImageDirective,
    DatePipe,
    TitleCasePipe,
    ButtonComponent,
    IconButtonComponent,
    CardShellComponent,
    StatsGridComponent,
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
                <app-icon-button
                  icon="pi-times"
                  [loading]="cancellingDeletion()"
                  (clicked)="cancelDeletion()"
                  ariaLabel="times"
                />
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
                    appMobileOptimized
                    [width]="200"
                    [height]="200"
                    [lazy]="false"
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

            <!-- Profile Completion Indicator -->
            @if (profileCompletion().percentage < 100) {
              <div class="profile-completion-card">
                <div class="completion-header">
                  <span class="completion-label">Profile Completion</span>
                  <span class="completion-percentage"
                    >{{ profileCompletion().percentage }}%</span
                  >
                </div>
                <p-progressBar
                  [value]="profileCompletion().percentage"
                  [showValue]="false"
                  styleClass="completion-progress"
                ></p-progressBar>
                @if (profileCompletion().missingFields.length > 0) {
                  <div class="completion-hint">
                    <i class="pi pi-info-circle"></i>
                    <span
                      >Complete your profile:
                      {{
                        profileCompletion().missingFields.slice(0, 2).join(", ")
                      }}
                      @if (profileCompletion().missingFields.length > 2) {
                        and
                        {{ profileCompletion().missingFields.length - 2 }} more
                      }
                    </span>
                  </div>
                }
              </div>
            } @else {
              <div class="profile-complete-badge">
                <i class="pi pi-check-circle"></i>
                <span>Profile Complete</span>
              </div>
            }

            <!-- Action Buttons -->
            <div class="profile-header-actions">
              <app-button
                iconLeft="pi-cog"
                routerLink="/settings"
                [disabled]="deletionPending()"
                >Edit Profile</app-button
              >
              <app-icon-button
                icon="pi-share-alt"
                variant="outlined"
                (clicked)="shareProfile()"
                ariaLabel="Share profile"
              />
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
                    <app-card-shell
                      title="Recent Activity"
                      headerIcon="pi-clock"
                    >
                      @if (activities().length === 0) {
                        <div class="card-empty-state card-empty-state--compact">
                          <i class="pi pi-clock card-empty-state__icon"></i>
                          <div class="card-empty-state__content">
                            <p class="card-empty-state__title">
                              No Recent Activity
                            </p>
                            <p class="card-empty-state__text">
                              Your activity will appear here once you start
                              training.
                            </p>
                          </div>
                        </div>
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
                    </app-card-shell>
                  </div>
                </p-tabpanel>
                <p-tabpanel value="achievements">
                  @if (achievements().length === 0) {
                    <div class="card-empty-state">
                      <i class="pi pi-trophy card-empty-state__icon"></i>
                      <div class="card-empty-state__content">
                        <p class="card-empty-state__title">
                          No Achievements Yet
                        </p>
                        <p class="card-empty-state__text">
                          Complete training sessions and reach milestones to
                          earn achievements.
                        </p>
                      </div>
                    </div>
                  } @else {
                    <div class="achievements-grid">
                      @for (
                        achievement of achievements();
                        track trackByAchievementTitle($index, achievement)
                      ) {
                        <app-card-shell>
                          <div class="achievement-content">
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
                          </div>
                        </app-card-shell>
                      }
                    </div>
                  }
                </p-tabpanel>
                <p-tabpanel value="statistics">
                  <app-card-shell
                    title="Performance Statistics"
                    headerIcon="pi-chart-bar"
                  >
                    <div class="performance-stats-grid">
                      @for (
                        stat of performanceStats();
                        track trackByPerformanceStatLabel($index, stat)
                      ) {
                        <div class="stat-block">
                          <div class="stat-block__content">
                            <span class="stat-block__value">{{
                              stat.value
                            }}</span>
                            <span class="stat-block__label">{{
                              stat.label
                            }}</span>
                          </div>
                          <p-tag
                            class="stat-block__tag"
                            [value]="stat.trend"
                            [severity]="stat.trendType"
                          ></p-tag>
                        </div>
                      }
                    </div>
                  </app-card-shell>
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
                      <div class="card-empty-state">
                        <i class="pi pi-envelope card-empty-state__icon"></i>
                        <div class="card-empty-state__content">
                          <p class="card-empty-state__title">
                            No Pending Invitations
                          </p>
                          <p class="card-empty-state__text">
                            You don't have any team invitations at the moment.
                          </p>
                        </div>
                      </div>
                    } @else {
                      <div class="invitations-list">
                        @for (
                          invitation of pendingInvitations();
                          track invitation.id
                        ) {
                          <app-card-shell class="invitation-card">
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
                                  <app-button
                                    iconLeft="pi-check"
                                    [loading]="
                                      processingInvitation() === invitation.id
                                    "
                                    (clicked)="acceptInvitation(invitation)"
                                    >Accept</app-button
                                  >
                                  <app-button
                                    variant="outlined"
                                    iconLeft="pi-times"
                                    [loading]="
                                      processingInvitation() === invitation.id
                                    "
                                    (clicked)="declineInvitation(invitation)"
                                    >Decline</app-button
                                  >
                                } @else {
                                  <app-button
                                    variant="outlined"
                                    iconLeft="pi-refresh"
                                    (clicked)="requestNewInvitation(invitation)"
                                    >Request New Invitation</app-button
                                  >
                                }
                              </div>
                            </div>
                          </app-card-shell>
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
  styleUrl: "./profile.component.scss",
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
  stats = signal<
    Array<{
      value: string;
      label: string;
      icon?: string;
      iconType?: "primary" | "error" | "warning" | "info";
      trend?: string;
      trendType?: "positive" | "negative" | "neutral";
    }>
  >([]);
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

  // Profile Completion
  profileCompletion = signal<{
    percentage: number;
    missingFields: string[];
    completedFields: string[];
  }>({ percentage: 0, missingFields: [], completedFields: [] });

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
    // Calculate profile completion
    this.calculateProfileCompletion();
  }

  /**
   * Calculate profile completion percentage
   */
  private calculateProfileCompletion(): void {
    const fields = [
      { name: "Display Name", value: this.userName(), required: true },
      { name: "Email", value: this.userEmail(), required: true },
      { name: "Profile Photo", value: this.avatarUrl(), required: false },
      { name: "Position", value: this.userPosition(), required: false },
      { name: "Jersey Number", value: this.jerseyNumber(), required: false },
      { name: "Team", value: this.teamName(), required: false },
    ];

    const completedFields: string[] = [];
    const missingFields: string[] = [];

    fields.forEach((field) => {
      const hasValue =
        field.value &&
        field.value !== "Loading..." &&
        field.value !== "User" &&
        field.value !== null;

      if (hasValue) {
        completedFields.push(field.name);
      } else {
        missingFields.push(field.name);
      }
    });

    const percentage = Math.round(
      (completedFields.length / fields.length) * 100,
    );

    this.profileCompletion.set({
      percentage,
      completedFields,
      missingFields,
    });
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

    // Recalculate profile completion after extended data loads
    this.calculateProfileCompletion();

    try {
      // Load real training sessions count
      // Using session_date (not scheduled_date) and correct column names
      const { data: sessions, error: sessionsError } =
        await this.supabaseService.client
          .from("training_sessions")
          .select("id, status, completed_at, session_date, duration_minutes")
          .eq("user_id", user.id);

      // Load games played count from game_participations table
      let gamesPlayed = 0;
      try {
        const { data: gameParticipations, error: gamesError } =
          await this.supabaseService.client
            .from("game_participations")
            .select("id, game_id, status")
            .eq("player_id", user.id)
            .eq("status", "played");

        if (!gamesError && gameParticipations) {
          gamesPlayed = gameParticipations.length;
        } else {
          // Try alternate table name
          const { data: games, error: altError } =
            await this.supabaseService.client
              .from("games")
              .select("id")
              .contains("participants", [user.id]);

          if (!altError && games) {
            gamesPlayed = games.length;
          }
        }
      } catch (e) {
        this.logger.debug("Games data not available:", e);
      }

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

      // Load stats with real data - matches Dashboard stat cards
      this.stats.set([
        {
          value: totalSessions.toString(),
          label: "Training Sessions",
          icon: "pi-calendar-plus",
          iconType: "primary",
          trend: totalSessions > 0 ? "Active" : "Start training",
          trendType:
            totalSessions > 0
              ? "positive"
              : ("neutral" as "positive" | "negative" | "neutral"),
        },
        {
          value: performanceScore > 0 ? `${performanceScore}%` : "—",
          label: "Performance Score",
          icon: "pi-heart",
          iconType: "error",
          trend:
            performanceScore >= 70
              ? "Good"
              : performanceScore >= 50
                ? "Moderate"
                : "Building",
          trendType:
            performanceScore >= 70
              ? "positive"
              : performanceScore >= 50
                ? "neutral"
                : ("neutral" as "positive" | "negative" | "neutral"),
        },
        {
          value: streak.toString(),
          label: "Day Streak",
          icon: "pi-bolt",
          iconType: "warning",
          trend:
            streak >= 7
              ? "On fire!"
              : streak > 0
                ? "Keep going"
                : "Start streak",
          trendType:
            streak >= 7
              ? "positive"
              : streak > 0
                ? "neutral"
                : ("neutral" as "positive" | "negative" | "neutral"),
        },
        {
          value: gamesPlayed.toString(),
          label: "Games Played",
          icon: "pi-flag",
          iconType: "info",
          trend:
            gamesPlayed > 0
              ? gamesPlayed >= 10
                ? "Veteran"
                : "Active"
              : "No games yet",
          trendType:
            gamesPlayed > 0
              ? "positive"
              : ("neutral" as "positive" | "negative" | "neutral"),
        },
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
      {
        value: "0",
        label: "Training Sessions",
        icon: "pi-calendar-plus",
        iconType: "primary",
        trend: "Start training",
        trendType: "neutral" as "positive" | "negative" | "neutral",
      },
      {
        value: "—",
        label: "Performance Score",
        icon: "pi-heart",
        iconType: "error",
        trend: "No data yet",
        trendType: "neutral" as "positive" | "negative" | "neutral",
      },
      {
        value: "0",
        label: "Day Streak",
        icon: "pi-bolt",
        iconType: "warning",
        trend: "Start streak",
        trendType: "neutral" as "positive" | "negative" | "neutral",
      },
      {
        value: "0",
        label: "Games Played",
        icon: "pi-flag",
        iconType: "info",
        trend: "Coming soon",
        trendType: "neutral" as "positive" | "negative" | "neutral",
      },
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
      const { error: uploadError } = await this.supabaseService.client.storage
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
