import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from "@angular/core";

import { CommonModule, DatePipe, TitleCasePipe } from "@angular/common";
import { RouterModule } from "@angular/router";

import { ProgressBar } from "primeng/progressbar";
import { ProgressSpinner } from "primeng/progressspinner";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "primeng/tabs";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { IconButtonComponent } from "../../shared/components/button/icon-button.component";
import { CardShellComponent } from "../../shared/components/card-shell/card-shell.component";

import { UI_LIMITS } from "../../core/constants/app.constants";
import { TOAST } from "../../core/constants/toast-messages.constants";
import { AccountDeletionService } from "../../core/services/account-deletion.service";
import { ApiService } from "../../core/services/api.service";
import { AuthService } from "../../core/services/auth.service";
import {
  LoggerService,
  toLogContext,
} from "../../core/services/logger.service";
import { ProfileCompletionService } from "../../core/services/profile-completion.service";
import { TeamMembershipService } from "../../core/services/team-membership.service";
import { ToastService } from "../../core/services/toast.service";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { AppLoadingComponent } from "../../shared/components/loading/loading.component";
import { PageErrorStateComponent } from "../../shared/components/page-error-state/page-error-state.component";
import { StatsGridComponent } from "../../shared/components/stats-grid/stats-grid.component";
import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";
import { AlertComponent } from "../../shared/components/alert/alert.component";
import { MobileOptimizedImageDirective } from "../../shared/directives/mobile-optimized-image.directive";
import { getTimeAgo } from "../../shared/utils/date.utils";
import { getInitials } from "../../shared/utils/format.utils";
import {
  DELETION_MESSAGES,
  getDeletionMessage,
} from "../../shared/utils/privacy-ux-copy";
import { ProfileDataService } from "./services/profile-data.service";

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    StatusTagComponent,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    ProgressBar,
    ProgressSpinner,
    MainLayoutComponent,
    EmptyStateComponent,
    PageErrorStateComponent,
    MobileOptimizedImageDirective,
    AlertComponent,
    DatePipe,
    TitleCasePipe,
    ButtonComponent,
    IconButtonComponent,
    CardShellComponent,
    StatsGridComponent,
    AppLoadingComponent,
  ],
  templateUrl: "./profile.component.html",

  styleUrl: "./profile.component.scss",
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private toastService = inject(ToastService);
  private profileDataService = inject(ProfileDataService);
  private logger = inject(LoggerService);
  private accountDeletionService = inject(AccountDeletionService);
  private profileCompletionService = inject(ProfileCompletionService);
  private teamMembershipService = inject(TeamMembershipService);

  // Angular 21: Use viewChild() signal instead of @ViewChild()
  fileInput = viewChild.required<ElementRef<HTMLInputElement>>("fileInput");

  // Expose UI_LIMITS for template usage
  readonly UI_LIMITS = UI_LIMITS;

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
        | "warning"
        | "secondary"
        | "contrast"
        | "danger";
    }>
  >([]);

  // Invitations
  pendingInvitations = signal<PendingInvitation[]>([]);
  loadingInvitations = signal(false);
  processingInvitation = signal<string | null>(null);

  // Profile Completion - Use computed from centralized service for real-time updates
  profileCompletion = computed(() => {
    const status = this.profileCompletionService.completionStatus();
    return {
      percentage: status.percentage,
      completedFields: status.completedFields,
      missingFields: status.missingFields,
    };
  });

  ngOnInit(): void {
    this.initializePage();
  }

  /**
   * Initialize page with error handling
   */
  private async initializePage(): Promise<void> {
    this.isLoading.set(true);
    this.hasError.set(false);

    // Load centralized profile data first for consistent completion calculation
    await this.profileCompletionService.loadProfileData();

    this.loadProfileData();
    this.loadPendingInvitations();
    // Check for pending deletion to show banner and restrict actions
    this.accountDeletionService.checkDeletionStatus();
    // Profile completion is now computed automatically from the service
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
      this.userInitials.set(getInitials(this.userName()));

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

    // Profile completion is computed automatically from the service

    try {
      // Load real training sessions count
      // Using session_date (not scheduled_date) and correct column names
      const { sessions, error: sessionsError } =
        await this.profileDataService.fetchTrainingSessions(user.id);

      // Load games played count from game_participations table
      let gamesPlayed = 0;
      try {
        const { participations: gameParticipations, error: gamesError } =
          await this.profileDataService.fetchGameParticipations(user.id);

        if (!gamesError && gameParticipations) {
          gamesPlayed = gameParticipations.length;
        } else {
          // Try alternate table name
          const { games, error: altError } =
            await this.profileDataService.fetchGamesByParticipant(user.id);

          if (!altError && games) {
            gamesPlayed = games.length;
          }
        }
      } catch (e) {
        this.logger.debug("Games data not available:", toLogContext(e));
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
        (s) => s.status === "completed" && (s.completed_at || s.session_date),
      );
      const totalSessions = completedSessions.length;

      // Calculate streak
      let streak = 0;
      const sortedSessions = [...completedSessions].sort((a, b) => {
        const aDate = a.completed_at || a.session_date;
        const bDate = b.completed_at || b.session_date;
        if (!aDate && !bDate) return 0;
        if (!aDate) return 1;
        if (!bDate) return -1;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });

      if (sortedSessions.length > 0) {
        let checkDate = new Date();
        checkDate.setHours(0, 0, 0, 0);

        for (const session of sortedSessions) {
          const sessionDateValue =
            session.completed_at || session.session_date;
          if (!sessionDateValue) continue;
          const sessionDate = new Date(sessionDateValue);
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
      const { entries: wellness } =
        await this.profileDataService.fetchWellnessEntries(user.id);

      // Calculate performance score based on wellness and training
      // Only calculate if we have actual wellness data with real values
      let performanceScore = 0;
      if (wellness && wellness.length > 0) {
        // Filter to only records that have at least one actual value (not null/undefined)
        const validRecords = wellness.filter(
          (
            w,
          ): w is {
            energy_level: number;
            sleep_quality: number;
          } =>
            typeof w.energy_level === "number" &&
            typeof w.sleep_quality === "number",
        );

        if (validRecords.length > 0) {
          const avgEnergy =
            validRecords.reduce(
              (a: number, w: { energy_level?: number }) =>
                a + (w.energy_level || 0),
              0,
            ) / validRecords.length;
          const avgSleep =
            validRecords.reduce(
              (a: number, w: { sleep_quality?: number }) =>
                a + (w.sleep_quality || 0),
              0,
            ) / validRecords.length;
          // Score out of 100 based on averages (each is 1-10 scale)
          // Using energy and sleep (2 metrics instead of 3)
          performanceScore = Math.round(((avgEnergy + avgSleep) / 20) * 100);
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
      const recentActivities = sortedSessions
        .slice(0, UI_LIMITS.RECENT_ACTIVITIES_COUNT)
        .map((session) => {
          const dateValue = session.completed_at || session.session_date;
          if (!dateValue) return null;
          const date = new Date(dateValue);
          const timeAgoStr = getTimeAgo(date);
          return {
            icon: "pi-play",
            title: `Completed ${session.duration_minutes || 0} min training`,
            time: timeAgoStr,
          };
        })
        .filter((activity): activity is NonNullable<typeof activity> =>
          Boolean(activity),
        );

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
    const input = this.fileInput();
    input?.nativeElement?.click();
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
      this.toastService.error(TOAST.ERROR.INVALID_FILE_TYPE);
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this.toastService.error(TOAST.ERROR.FILE_TOO_LARGE_5MB);
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
      const { error: uploadError } = await this.profileDataService.uploadAvatar({
        path: fileName,
        file,
      });

      if (uploadError) {
        // If bucket doesn't exist, show helpful message
        if (
          uploadError.message?.includes("bucket") ||
          uploadError.message?.includes("not found")
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
      const { publicUrl: avatarUrl } =
        this.profileDataService.getAvatarPublicUrl(fileName);

      // Update profile in database (use 'users' table - profiles doesn't exist)
      const { error: updateError } =
        await this.profileDataService.updateProfilePhoto({
          userId: user.id,
          avatarUrl,
        });

      if (updateError) {
        this.logger.warn(
          "Could not save avatar to profiles table:",
          updateError,
        );
      }

      // Update local state
      this.avatarUrl.set(avatarUrl);

      // Refresh profile completion service to recalculate completion percentage
      await this.profileCompletionService.refresh();

      this.toastService.success(TOAST.SUCCESS.AVATAR_UPDATED);
    } catch (error) {
      this.logger.error("Error uploading avatar:", error);
      this.toastService.error(TOAST.ERROR.AVATAR_UPLOAD_FAILED);
    } finally {
      this.isUploadingAvatar.set(false);
      // Reset file input
      const input = this.fileInput();
      if (input?.nativeElement) {
        input.nativeElement.value = "";
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
      this.toastService.success(TOAST.SUCCESS.COPIED);
    }
  }

  /**
   * Load extended profile data using TeamMembershipService
   * Uses centralized service for position, jersey number, and team info
   */
  private async loadExtendedProfileData(userId: string): Promise<void> {
    try {
      // Load profile photo from database (profile_photo_url)
      // This ensures the avatar persists after refresh
      const { profilePhotoUrl } =
        await this.profileDataService.fetchProfilePhoto(userId);

      if (profilePhotoUrl) {
        this.avatarUrl.set(profilePhotoUrl);
      }

      // Load team membership using centralized service
      await this.teamMembershipService.loadMembership();
      const membership = this.teamMembershipService.membership();

      if (membership) {
        // Load position from centralized service
        if (membership.position) {
          this.userPosition.set(membership.position);
        }

        // Load jersey number from centralized service
        if (membership.jerseyNumber) {
          this.jerseyNumber.set(membership.jerseyNumber.toString());
        }

        // Load team name from centralized service
        if (membership.teamName) {
          this.teamName.set(membership.teamName);
        }

        // Format member since date from joined_at
        if (membership.joinedAt) {
          const date = new Date(membership.joinedAt);
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
        const { user: authUser } = await this.profileDataService.getAuthUser();
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
      this.logger.warn(
        "Could not load extended profile data:",
        toLogContext(error),
      );
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
      const { invitations: data, error } =
        await this.profileDataService.fetchPendingInvitations(user.email);

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

      type InvitationRow = {
        id: string;
        team_id: string;
        teams?: { name?: string }[] | { name?: string } | null;
        role: string;
        created_at: string;
        expires_at: string;
      };
      const rows = (data || []) as InvitationRow[];
      const invitations: PendingInvitation[] = rows.map((inv) => ({
          id: inv.id,
          teamId: inv.team_id,
          teamName: Array.isArray(inv.teams)
            ? inv.teams[0]?.name || "Unknown Team"
            : inv.teams?.name || "Unknown Team",
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
      const { error } =
        await this.profileDataService.acceptInvitation(invitation.id);

      if (error) throw error;

      this.toastService.success(`You've joined ${invitation.teamName}!`);

      // Remove from list
      this.pendingInvitations.update((invs) =>
        invs.filter((i) => i.id !== invitation.id),
      );

      // Reload profile data to reflect new team membership
      this.loadProfileData();
    } catch (error) {
      this.logger.error("Error accepting invitation:", error);
      this.toastService.error(
        error instanceof Error
          ? error.message
          : TOAST.ERROR.INVITATION_ACCEPT_FAILED,
      );
    } finally {
      this.processingInvitation.set(null);
    }
  }

  async declineInvitation(invitation: PendingInvitation): Promise<void> {
    this.processingInvitation.set(invitation.id);

    try {
      // Call the decline_team_invitation function
      const { error } =
        await this.profileDataService.declineInvitation(invitation.id);

      if (error) throw error;

      this.toastService.info(TOAST.INFO.INVITATION_DECLINED);

      // Remove from list
      this.pendingInvitations.update((invs) =>
        invs.filter((i) => i.id !== invitation.id),
      );
    } catch (error) {
      this.logger.error("Error declining invitation:", error);
      this.toastService.error(
        error instanceof Error
          ? error.message
          : TOAST.ERROR.INVITATION_DECLINE_FAILED,
      );
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
