/**
 * Parent Dashboard Component
 *
 * Phase 3: Dashboard for parents to monitor their youth athletes' AI interactions
 *
 * Features:
 * - Linked children overview with stats
 * - AI activity feed for each child
 * - Notifications with action buttons
 * - Pending approval requests
 * - Youth settings management
 */

import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RealtimeChannel } from "@supabase/supabase-js";
import { AvatarModule } from "primeng/avatar";
import { BadgeModule } from "primeng/badge";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { DialogModule } from "primeng/dialog";
import { DividerModule } from "primeng/divider";
import { SkeletonModule } from "primeng/skeleton";
import { TabPanel, Tabs } from "primeng/tabs";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";
import { TimelineModule } from "primeng/timeline";
import { ToggleSwitchModule } from "primeng/toggleswitch";
import { TooltipModule } from "primeng/tooltip";
import { ApiService } from "../../core/services/api.service";
import { AuthService } from "../../core/services/auth.service";
import { LoggerService } from "../../core/services/logger.service";
import { SupabaseService } from "../../core/services/supabase.service";
import { ToastService } from "../../core/services/toast.service";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";

interface LinkedChild {
  linkId: string;
  relationship: string;
  canViewAiChats: boolean;
  canApprove: boolean;
  linkedAt: string;
  child: {
    id: string;
    email: string;
    name: string;
    birthDate: string | null;
    position: string | null;
  } | null;
}

interface ChildStats {
  last30Days: {
    totalQueries: number;
    highRiskQueries: number;
    mediumRiskQueries: number;
    lowRiskQueries: number;
  };
  sessions: {
    total: number;
    completed: number;
    skipped: number;
    completionRate: number;
  };
  readiness: {
    averageScore: number | null;
    recentPainLevels: number[];
  };
}

interface ActivityItem {
  id: string;
  timestamp: string;
  userQuery: string;
  intent: string;
  riskLevel: string;
  restrictionsApplied: string[];
  confidence: number;
  aiResponse: string | null;
  coachReviewed: boolean;
}

interface Notification {
  id: string;
  notification_type: string;
  priority: string;
  title: string;
  summary: string;
  status: string;
  created_at: string;
  childName: string;
  youth_id: string;
  details: Record<string, unknown>;
}

interface ApprovalRequest {
  id: string;
  request_type: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  expires_at: string;
  childName: string;
  youth_id: string;
  context: Record<string, unknown>;
}

interface YouthSettings {
  restrict_supplement_topics: boolean;
  restrict_weight_training: boolean;
  restrict_high_intensity: boolean;
  restrict_nutrition_advice: boolean;
  require_parent_approval_programs: boolean;
  require_parent_approval_supplements: boolean;
  use_simplified_language: boolean;
  include_parent_cc: boolean;
  max_session_duration_minutes: number;
}

@Component({
  selector: "app-parent-dashboard",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    Tabs,
    TabPanel,
    CardModule,
    ButtonModule,
    TagModule,
    DialogModule,
    BadgeModule,
    SkeletonModule,
    AvatarModule,
    DividerModule,
    TooltipModule,
    ToggleSwitchModule,
    TextareaModule,
    TimelineModule,
    MainLayoutComponent,
  ],
  templateUrl: "./parent-dashboard.component.html",
  styleUrl: "./parent-dashboard.component.scss",
})
export class ParentDashboardComponent implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private logger = inject(LoggerService);
  private supabaseService = inject(SupabaseService);
  private destroyRef = inject(DestroyRef);

  // State
  loadingChildren = signal(true);
  loadingActivity = signal(false);
  loadingNotifications = signal(false);
  savingSettings = signal(false);
  processingApproval = signal<string | null>(null);

  children = signal<LinkedChild[]>([]);
  childStats = signal<Record<string, ChildStats>>({});
  selectedChild = signal<LinkedChild | null>(null);
  activity = signal<ActivityItem[]>([]);
  notifications = signal<Notification[]>([]);
  pendingApprovals = signal<ApprovalRequest[]>([]);
  unreadCount = signal(0);

  // Dialog state
  activeTabIndex = 0;
  settingsDialogVisible = false;
  selectedChildForSettings = signal<LinkedChild | null>(null);
  editingSettings: YouthSettings = this.getDefaultSettings();

  // Realtime
  private notificationChannel: RealtimeChannel | null = null;

  ngOnInit(): void {
    this.loadData();
    this.setupRealtimeSubscription();
  }

  private async loadData(): Promise<void> {
    await Promise.all([
      this.loadChildren(),
      this.loadNotifications(),
      this.loadPendingApprovals(),
    ]);
  }

  private async loadChildren(): Promise<void> {
    this.loadingChildren.set(true);

    try {
      const response = await this.apiService
        .get<{ children: LinkedChild[] }>("/api/parent-dashboard/children")
        .toPromise();

      if (response?.success && response.data?.children) {
        this.children.set(response.data.children);

        // Load stats for each child
        for (const child of response.data.children) {
          if (child.child?.id) {
            this.loadChildStats(child.child.id);
          }
        }
      }
    } catch (error) {
      this.logger.error("Error loading children:", error);
      this.toastService.error("Failed to load athletes");
    } finally {
      this.loadingChildren.set(false);
    }
  }

  private async loadChildStats(childId: string): Promise<void> {
    try {
      const response = await this.apiService
        .get<{ stats: ChildStats }>(`/api/parent-dashboard/children/${childId}`)
        .toPromise();

      if (response?.success && response.data?.stats) {
        this.childStats.update((stats) => ({
          ...stats,
          [childId]: response.data!.stats,
        }));
      }
    } catch (error) {
      this.logger.error("Error loading child stats:", error);
    }
  }

  async loadChildActivity(): Promise<void> {
    const child = this.selectedChild();
    if (!child?.child?.id) return;

    this.loadingActivity.set(true);

    try {
      const response = await this.apiService
        .get<{
          activity: ActivityItem[];
        }>(`/api/parent-dashboard/children/${child.child.id}/activity`, {
          limit: 50,
        })
        .toPromise();

      if (response?.success && response.data?.activity) {
        this.activity.set(response.data.activity);
      }
    } catch (error) {
      this.logger.error("Error loading child activity:", error);
      this.toastService.error("Failed to load activity");
    } finally {
      this.loadingActivity.set(false);
    }
  }

  private async loadNotifications(): Promise<void> {
    this.loadingNotifications.set(true);

    try {
      const response = await this.apiService
        .get<{
          notifications: Notification[];
          unread_count: number;
        }>("/api/parent-dashboard/notifications")
        .toPromise();

      if (response?.success && response.data) {
        this.notifications.set(response.data.notifications || []);
        this.unreadCount.set(response.data.unread_count || 0);
      }
    } catch (error) {
      this.logger.error("Error loading notifications:", error);
    } finally {
      this.loadingNotifications.set(false);
    }
  }

  private async loadPendingApprovals(): Promise<void> {
    try {
      const response = await this.apiService
        .get<{
          approvals: ApprovalRequest[];
        }>("/api/parent-dashboard/approvals")
        .toPromise();

      if (response?.success && response.data?.approvals) {
        this.pendingApprovals.set(response.data.approvals);
      }
    } catch (error) {
      this.logger.error("Error loading pending approvals:", error);
    }
  }

  private setupRealtimeSubscription(): void {
    const user = this.authService.getUser();
    if (!user?.id) return;

    this.notificationChannel = this.supabaseService.client
      .channel("parent-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "parent_notifications",
          filter: `parent_id=eq.${user.id}`,
        },
        () => {
          // Reload notifications on new item
          this.loadNotifications();
        },
      )
      .subscribe();

    this.destroyRef.onDestroy(() => {
      if (this.notificationChannel) {
        this.supabaseService.client.removeChannel(this.notificationChannel);
      }
    });
  }

  // Actions
  selectChild(child: LinkedChild): void {
    this.selectedChild.set(child);
    this.activeTabIndex = 1;
    this.loadChildActivity();
  }

  viewChildActivity(child: LinkedChild, event: Event): void {
    event.stopPropagation();
    this.selectChild(child);
  }

  openSettingsDialog(child: LinkedChild, event: Event): void {
    event.stopPropagation();
    this.selectedChildForSettings.set(child);
    this.editingSettings = this.getDefaultSettings();
    this.settingsDialogVisible = true;

    // Load current settings
    if (child.child?.id) {
      this.loadChildSettings(child.child.id);
    }
  }

  private async loadChildSettings(childId: string): Promise<void> {
    try {
      const response = await this.apiService
        .get<YouthSettings>(`/api/parent-dashboard/settings/${childId}`)
        .toPromise();

      if (response?.success && response.data) {
        this.editingSettings = {
          ...this.getDefaultSettings(),
          ...response.data,
        };
      }
    } catch (error) {
      this.logger.error("Error loading child settings:", error);
    }
  }

  async saveSettings(): Promise<void> {
    const child = this.selectedChildForSettings();
    if (!child?.child?.id) return;

    this.savingSettings.set(true);

    try {
      await this.apiService
        .patch(
          `/api/parent-dashboard/settings/${child.child.id}`,
          this.editingSettings,
        )
        .toPromise();

      this.toastService.success("Settings saved");
      this.settingsDialogVisible = false;
    } catch (error) {
      this.logger.error("Error saving settings:", error);
      this.toastService.error("Failed to save settings");
    } finally {
      this.savingSettings.set(false);
    }
  }

  async markNotificationRead(notification: Notification): Promise<void> {
    try {
      await this.apiService
        .patch(`/api/parent-dashboard/notifications/${notification.id}`, {
          status: "read",
        })
        .toPromise();

      this.notifications.update((notifs) =>
        notifs.map((n) =>
          n.id === notification.id ? { ...n, status: "read" } : n,
        ),
      );
      this.unreadCount.update((c) => Math.max(0, c - 1));
    } catch (error) {
      this.logger.error("Error marking notification read:", error);
    }
  }

  reviewNotification(notification: Notification): void {
    // Switch to approvals tab
    this.activeTabIndex = 3;
  }

  async processApproval(
    approval: ApprovalRequest,
    decision: "approved" | "denied",
  ): Promise<void> {
    this.processingApproval.set(approval.id);

    try {
      await this.apiService
        .patch(`/api/parent-dashboard/approvals/${approval.id}`, { decision })
        .toPromise();

      this.pendingApprovals.update((approvals) =>
        approvals.filter((a) => a.id !== approval.id),
      );

      this.toastService.success(`Request ${decision}`);
    } catch (error) {
      this.logger.error("Error processing approval:", error);
      this.toastService.error("Failed to process approval");
    } finally {
      this.processingApproval.set(null);
    }
  }

  openLinkDialog(): void {
    // TODO: Implement link dialog
    this.toastService.info("Link athlete feature coming soon");
  }

  onTabChange(event: { index: number }): void {
    this.activeTabIndex = event.index;
  }

  // Helpers
  getInitials(name: string | undefined): string {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  truncate(text: string, length: number): string {
    if (!text || text.length <= length) return text;
    return text.substring(0, length) + "...";
  }

  getRiskSeverity(risk: string): "success" | "warn" | "danger" | "info" {
    switch (risk) {
      case "high":
        return "danger";
      case "medium":
        return "warn";
      default:
        return "success";
    }
  }

  getNotificationIcon(type: string): string {
    const icons: Record<string, string> = {
      high_risk_query: "pi pi-exclamation-triangle",
      supplement_topic: "pi pi-flask",
      injury_topic: "pi pi-heart",
      program_approval_needed: "pi pi-file",
      safety_concern: "pi pi-shield",
      streak_achievement: "pi pi-star",
    };
    return icons[type] || "pi pi-bell";
  }

  formatApprovalType(type: string): string {
    const types: Record<string, string> = {
      program_approval: "Training Program",
      supplement_discussion: "Supplement Topic",
      intensity_increase: "Intensity Increase",
      restriction_override: "Override Restriction",
    };
    return types[type] || type;
  }

  private getDefaultSettings(): YouthSettings {
    return {
      restrict_supplement_topics: true,
      restrict_weight_training: true,
      restrict_high_intensity: true,
      restrict_nutrition_advice: true,
      require_parent_approval_programs: true,
      require_parent_approval_supplements: true,
      use_simplified_language: true,
      include_parent_cc: true,
      max_session_duration_minutes: 30,
    };
  }
}
