import { Injectable, computed, inject, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";

import {
  AttendanceService,
  AbsenceRequest,
  TeamEvent,
} from "../../../core/services/attendance.service";
import { LoggerService } from "../../../core/services/logger.service";
import {
  CoachInfo,
  TeamMembershipService,
} from "../../../core/services/team-membership.service";
import {
  CoachActivityItem,
  TeamNotificationService,
} from "../../../core/services/team-notification.service";
import {
  TeamOverviewStats,
  TeamStatisticsService,
} from "../../../core/services/team-statistics.service";
import { SupabaseService } from "../../../core/services/supabase.service";

export interface WorkspaceInvitation {
  id: string;
  email: string;
  role: string | null;
  expiresAt: string | null;
}

export interface WorkspaceActionItem {
  id: string;
  title: string;
  detail: string;
  route: string;
  icon: string;
}

export interface WorkspaceCoachSignalSummary {
  unreadActivityCount: number;
  unreadWellnessCount: number;
  unreadTrainingCount: number;
  latestActivity: CoachActivityItem | null;
}

@Injectable()
export class TeamWorkspaceVmService {
  private readonly teamMembershipService = inject(TeamMembershipService);
  private readonly teamStatisticsService = inject(TeamStatisticsService);
  private readonly attendanceService = inject(AttendanceService);
  private readonly supabaseService = inject(SupabaseService);
  private readonly logger = inject(LoggerService);
  private readonly teamNotificationService = inject(TeamNotificationService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly overview = signal<TeamOverviewStats | null>(null);
  readonly coaches = signal<CoachInfo[]>([]);
  readonly upcomingEvents = signal<TeamEvent[]>([]);
  readonly pendingInvitations = signal<WorkspaceInvitation[]>([]);
  readonly pendingAbsenceRequests = signal<AbsenceRequest[]>([]);
  readonly coachSignalSummary = signal<WorkspaceCoachSignalSummary>({
    unreadActivityCount: 0,
    unreadWellnessCount: 0,
    unreadTrainingCount: 0,
    latestActivity: null,
  });

  readonly pendingActionCount = computed(
    () => this.pendingInvitations().length + this.pendingAbsenceRequests().length,
  );

  readonly nextEvent = computed(() => this.upcomingEvents()[0] ?? null);

  readonly actionItems = computed<WorkspaceActionItem[]>(() => {
    const actions: WorkspaceActionItem[] = [];
    const nextEvent = this.nextEvent();

    if (nextEvent) {
      actions.push({
        id: `event-${nextEvent.id}`,
        title: "Review next event",
        detail: nextEvent.title,
        route: "/attendance",
        icon: "pi-calendar",
      });
    }

    if (this.pendingAbsenceRequests().length > 0) {
      actions.push({
        id: "absence-requests",
        title: "Resolve absence requests",
        detail: `${this.pendingAbsenceRequests().length} pending`,
        route: "/attendance",
        icon: "pi-inbox",
      });
    }

    if (this.pendingInvitations().length > 0) {
      actions.push({
        id: "team-invitations",
        title: "Follow up on invites",
        detail: `${this.pendingInvitations().length} waiting to accept`,
        route: "/coach/team",
        icon: "pi-send",
      });
    }

    if (this.coachSignalSummary().unreadActivityCount > 0) {
      actions.push({
        id: "coach-activity",
        title: "Review coach activity",
        detail: `${this.coachSignalSummary().unreadActivityCount} unread updates`,
        route: "/coach/activity",
        icon: "pi-bell",
      });
    }

    if ((this.overview()?.playersAtRisk ?? 0) > 0) {
      actions.push({
        id: "at-risk-players",
        title: "Check at-risk players",
        detail: `${this.overview()?.playersAtRisk ?? 0} flagged`,
        route: "/roster",
        icon: "pi-exclamation-triangle",
      });
    }

    return actions.slice(0, 4);
  });

  readonly hasTeam = computed(() => Boolean(this.teamMembershipService.teamId()));

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      await this.teamMembershipService.loadMembership();
      const teamId = this.teamMembershipService.teamId();

      if (!teamId) {
        this.overview.set(null);
        this.coaches.set([]);
        this.upcomingEvents.set([]);
        this.pendingInvitations.set([]);
        this.pendingAbsenceRequests.set([]);
        return;
      }

      const today = new Date().toISOString();

      const [
        overview,
        coaches,
        upcomingEvents,
        pendingAbsenceRequests,
        pendingInvitations,
        coachSignalSummary,
      ] = await Promise.all([
        this.loadOverview(teamId),
        this.teamMembershipService.getTeamCoaches(),
        firstValueFrom(
          this.attendanceService.getTeamEvents(teamId, {
            startDate: today,
            limit: 4,
          }),
        ),
        firstValueFrom(this.attendanceService.getPendingAbsenceRequests(teamId)),
        this.loadPendingInvitations(teamId),
        this.loadCoachSignalSummary(teamId),
      ]);

      this.overview.set(overview);
      this.coaches.set(coaches);
      this.upcomingEvents.set(
        [...upcomingEvents].sort(
          (left, right) =>
            new Date(left.start_time).getTime() - new Date(right.start_time).getTime(),
        ),
      );
      this.pendingAbsenceRequests.set(pendingAbsenceRequests);
      this.pendingInvitations.set(pendingInvitations);
      this.coachSignalSummary.set(coachSignalSummary);
    } catch (error) {
      this.logger.error("team_workspace_load_failed", error);
      this.error.set(
        error instanceof Error ? error.message : "Failed to load team workspace.",
      );
    } finally {
      this.loading.set(false);
    }
  }

  private async loadOverview(teamId: string): Promise<TeamOverviewStats | null> {
    try {
      return await firstValueFrom(this.teamStatisticsService.getTeamOverview(teamId));
    } catch (error) {
      this.logger.warn("team_workspace_overview_unavailable", error);
      return null;
    }
  }

  private async loadPendingInvitations(
    teamId: string,
  ): Promise<WorkspaceInvitation[]> {
    const { data, error } = await this.supabaseService.client
      .from("team_invitations")
      .select("id, email, role, expires_at")
      .eq("team_id", teamId)
      .eq("status", "pending")
      .order("expires_at", { ascending: true })
      .limit(5);

    if (error) {
      this.logger.warn("team_workspace_pending_invitations_unavailable", error);
      return [];
    }

    const rows = Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
    return rows.map((row) => ({
      id: String(row["id"] ?? ""),
      email: String(row["email"] ?? ""),
      role: typeof row["role"] === "string" ? row["role"] : null,
      expiresAt: typeof row["expires_at"] === "string" ? row["expires_at"] : null,
    }));
  }

  private async loadCoachSignalSummary(
    teamId: string,
  ): Promise<WorkspaceCoachSignalSummary> {
    try {
      const activities = await this.teamNotificationService.loadActivityFeed({
        teamIds: [teamId],
        limit: 12,
      });
      const unreadActivities = activities.filter((activity) => !activity.is_read);

      return {
        unreadActivityCount: unreadActivities.length,
        unreadWellnessCount: unreadActivities.filter(
          (activity) => activity.activity_type === "wellness_logged",
        ).length,
        unreadTrainingCount: unreadActivities.filter(
          (activity) => activity.activity_type === "training_completed",
        ).length,
        latestActivity: activities[0] ?? null,
      };
    } catch (error) {
      this.logger.warn("team_workspace_activity_summary_unavailable", error);
      return {
        unreadActivityCount: 0,
        unreadWellnessCount: 0,
        unreadTrainingCount: 0,
        latestActivity: null,
      };
    }
  }
}
