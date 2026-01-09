/**
 * ACWR Alerts Service
 *
 * Monitors ACWR values and generates alerts for:
 * - High ACWR ratios (> 1.30)
 * - Danger zones (> 1.50)
 * - Weekly load spikes (> 10%)
 * - Under-training (<0.80)
 * - Consecutive high-load days
 *
 * Integrates with notification system and coach dashboard
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import { Injectable, signal, computed, effect, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { LoggerService } from "./logger.service";
import { AuthService } from "./auth.service";
import { SupabaseService } from "./supabase.service";
import { TeamMembershipService } from "./team-membership.service";
import { NotificationStateService } from "./notification-state.service";
import {
  LoadAlert,
  ACWRData,
  type TrainingSession as _TrainingSession,
  type RiskLevel as _RiskLevel,
  type PlayerACWRProfile as _PlayerACWRProfile,
  TrainingAdjustment,
  SessionType,
} from "../models/acwr.models";
import { AcwrService } from "./acwr.service";
import { OwnershipTransitionService } from "./ownership-transition.service";
import { environment } from "../../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class AcwrAlertsService {
  // Inject dependencies using inject() for Angular 21 best practices
  private readonly acwrService = inject(AcwrService);
  private readonly ownershipTransitionService = inject(OwnershipTransitionService);
  private logger = inject(LoggerService);
  private authService = inject(AuthService);
  private supabaseService = inject(SupabaseService);
  private teamMembershipService = inject(TeamMembershipService);
  private notificationService = inject(NotificationStateService);
  private http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiUrl || "";

  // Active alerts
  private readonly alerts = signal<LoadAlert[]>([]);

  // Alert history (last 30 days)
  private readonly alertHistory = signal<LoadAlert[]>([]);

  // Notification preferences
  private readonly notificationEnabled = signal<boolean>(true);
  private readonly coachNotificationEnabled = signal<boolean>(true);

  // Alert counters - readonly computed signal
  public readonly alertStats = computed(() => {
    const active = this.alerts();
    return {
      total: active.length,
      critical: active.filter((a) => a.severity === "critical").length,
      warning: active.filter((a) => a.severity === "warning").length,
      info: active.filter((a) => a.severity === "info").length,
      unacknowledged: active.filter((a) => !a.acknowledged).length,
    };
  });

  constructor() {
    // Monitor ACWR changes and generate alerts
    // Effect automatically cleans up when service is destroyed in Angular 21
    effect(() => {
      const acwrData = this.acwrService.acwrData();
      this.checkForAlerts(acwrData);
    });
  }

  /**
   * Check ACWR data and generate alerts if needed
   */
  private checkForAlerts(acwrData: ACWRData): void {
    const { ratio, riskZone, weeklyProgression } = acwrData;

    // Check for danger zone (ACWR > 1.50)
    if (ratio > 1.5) {
      this.createAlert({
        type: "danger-zone",
        severity: "critical",
        message: `CRITICAL: ACWR is ${ratio.toFixed(2)} - in danger zone!`,
        recommendation: riskZone.recommendation,
        acwrValue: ratio,
      });
      
      // Log ownership transition for critical ACWR
      this.logOwnershipTransition("acwr_critical", ratio);
    }
    // Check for elevated risk (ACWR > 1.30)
    else if (ratio > 1.3) {
      this.createAlert({
        type: "high-acwr",
        severity: "warning",
        message: `WARNING: ACWR is ${ratio.toFixed(2)} - elevated injury risk`,
        recommendation: riskZone.recommendation,
        acwrValue: ratio,
      });
      
      // Log ownership transition for elevated ACWR
      this.logOwnershipTransition("acwr_elevated", ratio);
    }
    // Check for under-training (ACWR < 0.80)
    else if (ratio > 0 && ratio < 0.8) {
      this.createAlert({
        type: "under-training",
        severity: "info",
        message: `INFO: ACWR is ${ratio.toFixed(2)} - player may lack conditioning`,
        recommendation: riskZone.recommendation,
        acwrValue: ratio,
      });
    }

    // Check for weekly load spike
    if (!weeklyProgression.isSafe && weeklyProgression.changePercent > 10) {
      this.createAlert({
        type: "spike-detected",
        severity: "warning",
        message: `WARNING: Weekly load increased by ${weeklyProgression.changePercent.toFixed(1)}%`,
        recommendation: "Limit load increase to <10% week-over-week",
        acwrValue: ratio,
      });
    }
  }

  /**
   * Create a new alert
   */
  private createAlert(
    alertData: Omit<
      LoadAlert,
      "id" | "playerId" | "playerName" | "timestamp" | "acknowledged"
    >,
  ): void {
    // Check if similar alert already exists for today
    const today = new Date().toDateString();
    const existingAlert = this.alerts().find(
      (a) => a.type === alertData.type && a.timestamp.toDateString() === today,
    );

    if (existingAlert) {
      return; // Don't duplicate alerts
    }

    // Get player info from auth service
    const user = this.authService.getUser();
    const playerId = user?.id || "anonymous";
    const rawMetadata =
      (user as { user_metadata?: { full_name?: string } } | null)
        ?.user_metadata || {};
    const playerName =
      rawMetadata?.full_name || user?.email?.split("@")[0] || "Player";

    const alert: LoadAlert = {
      id: this.generateAlertId(),
      playerId,
      playerName,
      timestamp: new Date(),
      acknowledged: false,
      ...alertData,
    };

    // Add to active alerts
    this.alerts.update((current) => [...current, alert]);

    // Add to history
    this.alertHistory.update((current) => [...current, alert]);

    // Trigger notification if enabled
    if (this.notificationEnabled()) {
      this.sendNotification(alert);
    }

    // Notify coach if critical and enabled
    if (alert.severity === "critical" && this.coachNotificationEnabled()) {
      this.notifyCoach(alert);
    }
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Send in-app notification
   */
  private async sendNotification(alert: LoadAlert): Promise<void> {
    this.logger.info("🔔 Alert:", alert.message);

    // Save notification to database
    const user = this.authService.getUser();
    if (user?.id) {
      try {
        await this.supabaseService.client.from("notifications").insert({
          user_id: user.id,
          type: "acwr_alert",
          title: `Load Alert: ${alert.type.replace(/_/g, " ")}`,
          message: alert.message,
          data: {
            alertId: alert.id,
            severity: alert.severity,
            recommendation: alert.recommendation,
            acwrValue: alert.acwrValue,
          },
        });

        // Refresh notification badge
        this.notificationService.refreshBadgeCount();
      } catch (error) {
        this.logger.warn("Failed to save notification to database:", error);
      }
    }

    // Trigger browser notification if permitted
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("FlagFit Pro - Load Alert", {
        body: alert.message,
        icon: "/assets/icons/alert-icon.png",
        badge: "/assets/icons/badge.png",
        tag: alert.type,
      });
    }
  }

  /**
   * Notify coach of critical alert
   * Sends database notification, push notification, and email notification
   * Falls back gracefully if push/email fail - DB notification always succeeds
   * Uses TeamMembershipService for centralized team queries
   */
  private async notifyCoach(alert: LoadAlert): Promise<void> {
    this.logger.info("📧 Notifying coach of critical alert:", alert.message);

    const user = this.authService.getUser();
    if (!user?.id) return;

    try {
      // Get team ID and coaches using centralized service
      const teamId = this.teamMembershipService.teamId();
      if (!teamId) return;

      const coaches = await this.teamMembershipService.getTeamCoaches();
      if (coaches && coaches.length > 0) {
        // Create database notification for each coach (always succeeds)
        const coachNotifications = coaches.map((coach) => ({
          user_id: coach.userId,
          type: "player_alert",
          title: `Critical Alert: ${alert.playerName}`,
          message: alert.message,
          priority: alert.severity === "critical" ? "high" : "medium",
          data: {
            alertId: alert.id,
            playerId: alert.playerId,
            playerName: alert.playerName,
            severity: alert.severity,
            recommendation: alert.recommendation,
            acwrValue: alert.acwrValue,
          },
        }));

        // Always create DB notifications first (fallback)
        await this.supabaseService.client
          .from("notifications")
          .insert(coachNotifications);

        // Refresh notification badge
        this.notificationService.refreshBadgeCount();

        // Send push and email notifications to each coach (with fallback)
        const dashboardUrl = `${window.location.origin}/coach/dashboard`;

        for (const coach of coaches) {
          const coachUserId = coach.userId;

          // Use coach name from centralized service
          let coachEmail: string | null = null;
          let coachName = coach.fullName || "Coach";

          try {
            // Use 'users' table for email
            const { data: profile } = await this.supabaseService.client
              .from("users")
              .select("email")
              .eq("id", coachUserId)
              .single();

            if (profile) {
              coachEmail = profile.email || null;
            }
          } catch (_profileError) {
            this.logger.debug(
              `[ACWR Alert] Could not fetch email for coach ${coachUserId}, will skip email`,
            );
          }

          // Send push notification (non-blocking, failures logged but don't stop process)
          this.sendPushNotificationToCoach(coachUserId, alert, dashboardUrl).catch(
            (error) => {
              this.logger.warn(
                `[ACWR Alert] Failed to send push notification to coach ${coachUserId}:`,
                error,
              );
            },
          );

          // Send email notification (non-blocking, failures logged but don't stop process)
          if (coachEmail) {
            this.sendEmailNotificationToCoach(
              coachEmail,
              coachName,
              alert,
              dashboardUrl,
            ).catch((error) => {
              this.logger.warn(
                `[ACWR Alert] Failed to send email notification to coach ${coachEmail}:`,
                error,
              );
            });
          } else {
            this.logger.warn(
              `[ACWR Alert] Coach ${coachUserId} has no email address, skipping email notification`,
            );
          }
        }
      }
    } catch (error) {
      // Even if everything fails, log but don't throw - DB notification is the fallback
      this.logger.error("[ACWR Alert] Failed to notify coach:", error);
    }
  }

  /**
   * Send push notification to coach
   * Non-blocking - failures are logged but don't prevent DB notification
   */
  private async sendPushNotificationToCoach(
    coachUserId: string,
    alert: LoadAlert,
    dashboardUrl: string,
  ): Promise<void> {
    try {
      const isCritical = alert.acwrValue > 1.5;
      const pushEndpoint = `${this.apiBaseUrl}/api/push/send-to-user`;

      const pushPayload = {
        targetUserId: coachUserId,
        title: `${isCritical ? "🚨 CRITICAL" : "⚠️"} ACWR Alert: ${alert.playerName}`,
        body: alert.message,
        icon: "/assets/icons/alert-icon.png",
        badge: "/assets/icons/badge.png",
        tag: `acwr-alert-${alert.id}`,
        type: "acwr_alert",
        url: dashboardUrl,
        urgency: isCritical ? "high" : "normal",
        requireInteraction: isCritical,
        data: {
          alertId: alert.id,
          playerId: alert.playerId,
          playerName: alert.playerName,
          acwrValue: alert.acwrValue,
          severity: alert.severity,
        },
      };

      const response = await firstValueFrom(
        this.http.post<{ success: boolean; message?: string }>(
          pushEndpoint,
          pushPayload,
        ),
      );

      if (response.success) {
        this.logger.info(
          `[ACWR Alert] Push notification sent to coach ${coachUserId}`,
        );
      } else {
        throw new Error(response.message || "Push notification failed");
      }
    } catch (error: any) {
      // Log but don't throw - push failures are acceptable
      this.logger.warn(
        `[ACWR Alert] Push notification error for coach ${coachUserId}:`,
        error.message || error,
      );
      throw error; // Re-throw so caller can handle gracefully
    }
  }

  /**
   * Send email notification to coach
   * Non-blocking - failures are logged but don't prevent DB notification
   */
  private async sendEmailNotificationToCoach(
    coachEmail: string,
    coachName: string,
    alert: LoadAlert,
    dashboardUrl: string,
  ): Promise<void> {
    try {
      const emailEndpoint = `${this.apiBaseUrl}/api/send-email`;

      const emailPayload = {
        type: "acwr_alert",
        to: coachEmail,
        coachName: coachName,
        playerName: alert.playerName,
        acwrValue: alert.acwrValue,
        alertMessage: alert.message,
        recommendation: alert.recommendation,
        dashboardUrl: dashboardUrl,
      };

      const response = await firstValueFrom(
        this.http.post<{ success: boolean; messageId?: string; error?: string }>(
          emailEndpoint,
          emailPayload,
        ),
      );

      if (response.success) {
        this.logger.info(
          `[ACWR Alert] Email notification sent to coach ${coachEmail} (messageId: ${response.messageId})`,
        );
      } else {
        throw new Error(response.error || "Email notification failed");
      }
    } catch (error: any) {
      // Log but don't throw - email failures are acceptable
      this.logger.warn(
        `[ACWR Alert] Email notification error for coach ${coachEmail}:`,
        error.message || error,
      );
      throw error; // Re-throw so caller can handle gracefully
    }
  }

  /**
   * Acknowledge an alert
   */
  public acknowledgeAlert(alertId: string, acknowledgedBy: string): void {
    this.alerts.update((current) =>
      current.map((alert) =>
        alert.id === alertId
          ? {
              ...alert,
              acknowledged: true,
              acknowledgedBy,
              acknowledgedAt: new Date(),
            }
          : alert,
      ),
    );
  }

  /**
   * Dismiss an alert
   */
  public dismissAlert(alertId: string): void {
    this.alerts.update((current) => current.filter((a) => a.id !== alertId));
  }

  /**
   * Clear all acknowledged alerts
   */
  public clearAcknowledgedAlerts(): void {
    this.alerts.update((current) => current.filter((a) => !a.acknowledged));
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(): LoadAlert[] {
    return this.alerts();
  }

  /**
   * Get alerts by severity
   */
  public getAlertsBySeverity(
    severity: "critical" | "warning" | "info",
  ): LoadAlert[] {
    return this.alerts().filter((a) => a.severity === severity);
  }

  /**
   * Get alert history for date range
   */
  public getAlertHistory(startDate: Date, endDate: Date): LoadAlert[] {
    return this.alertHistory().filter(
      (a) => a.timestamp >= startDate && a.timestamp <= endDate,
    );
  }

  /**
   * Check if player should train today
   */
  public canTrainToday(): {
    canTrain: boolean;
    reason: string;
    modifications?: string[];
  } {
    const criticalAlerts = this.getAlertsBySeverity("critical");
    const modification = this.acwrService.getTrainingModification();

    if (criticalAlerts.length > 0) {
      return {
        canTrain: false,
        reason: "Player in danger zone - rest day recommended",
        modifications: modification.modifications,
      };
    }

    if (modification.shouldModify) {
      return {
        canTrain: true,
        reason: "Can train with modifications",
        modifications: modification.modifications,
      };
    }

    return {
      canTrain: true,
      reason: "All systems green - train as planned",
    };
  }

  /**
   * Generate weekly alert summary for coach
   */
  public getWeeklySummary(): {
    totalAlerts: number;
    criticalDays: number;
    averageACWR: number;
    recommendations: string[];
  } {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weeklyAlerts = this.getAlertHistory(oneWeekAgo, new Date());
    const criticalAlerts = weeklyAlerts.filter(
      (a) => a.severity === "critical",
    );
    const criticalDays = new Set(
      criticalAlerts.map((a) => a.timestamp.toDateString()),
    ).size;

    const avgACWR =
      weeklyAlerts.reduce((sum, a) => sum + a.acwrValue, 0) /
      (weeklyAlerts.length || 1);

    const recommendations: string[] = [];

    if (criticalDays > 2) {
      recommendations.push(
        "⚠️ Multiple critical days this week - review training program",
      );
    }

    if (avgACWR > 1.3) {
      recommendations.push("📉 Reduce overall training volume by 15-20%");
    } else if (avgACWR < 0.85) {
      recommendations.push("📈 Gradually increase training load by 5-10%");
    }

    const spikes = weeklyAlerts.filter((a) => a.type === "spike-detected");
    if (spikes.length > 0) {
      recommendations.push(
        "⚡ Multiple load spikes detected - improve progression",
      );
    }

    return {
      totalAlerts: weeklyAlerts.length,
      criticalDays,
      averageACWR: parseFloat(avgACWR.toFixed(2)),
      recommendations,
    };
  }

  /**
   * Enable/disable notifications
   */
  public setNotificationEnabled(enabled: boolean): void {
    this.notificationEnabled.set(enabled);
  }

  /**
   * Enable/disable coach notifications
   */
  public setCoachNotificationEnabled(enabled: boolean): void {
    this.coachNotificationEnabled.set(enabled);
  }

  /**
   * Request browser notification permission
   */
  public async requestNotificationPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      this.logger.warn("Browser does not support notifications");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }

    return false;
  }

  /**
   * Log ownership transition for ACWR alerts
   */
  private async logOwnershipTransition(trigger: string, acwrValue: number): Promise<void> {
    const user = this.authService.getUser();
    if (!user?.id) return;

    try {
      const actionRequired = 
        trigger === "acwr_critical"
          ? `ACWR critical (${acwrValue.toFixed(2)}) - adjust training load immediately`
          : `ACWR elevated (${acwrValue.toFixed(2)}) - monitor and consider load reduction`;

      await this.ownershipTransitionService.logTransition({
        trigger,
        fromRole: "player",
        toRole: "coach",
        playerId: user.id,
        actionRequired,
        status: trigger === "acwr_critical" ? "pending" : "pending",
      });

      this.logger.info(`[ACWRAlerts] Logged ownership transition: ${trigger} (ACWR: ${acwrValue.toFixed(2)})`);
    } catch (error) {
      this.logger.error("[ACWRAlerts] Error logging ownership transition:", error);
    }
  }

  /**
   * Generate training adjustment recommendation
   */
  public generateAdjustment(
    playerId: string,
    plannedSession: {
      sessionType: SessionType;
      plannedIntensity: number;
      plannedDuration: number;
    },
  ): TrainingAdjustment {
    const acwrData = this.acwrService.acwrData();
    const predicted = this.acwrService.predictNextSessionLoad(
      plannedSession.plannedIntensity,
    );

    let adjustedIntensity = plannedSession.plannedIntensity;
    let adjustedDuration = plannedSession.plannedDuration;
    const modifications: string[] = [];
    let reason = "";

    // Adjust based on projected ACWR
    if (predicted.projectedACWR > 1.5) {
      adjustedIntensity = Math.max(3, plannedSession.plannedIntensity * 0.6);
      adjustedDuration = Math.floor(plannedSession.plannedDuration * 0.7);
      modifications.push("Reduce intensity by 40%");
      modifications.push("Reduce duration by 30%");
      modifications.push("Skip all sprint work");
      reason = "Projected ACWR would exceed danger zone (>1.50)";
    } else if (predicted.projectedACWR > 1.3) {
      adjustedIntensity = Math.max(4, plannedSession.plannedIntensity * 0.8);
      adjustedDuration = Math.floor(plannedSession.plannedDuration * 0.85);
      modifications.push("Reduce intensity by 20%");
      modifications.push("Reduce duration by 15%");
      modifications.push("Limit high-intensity work");
      reason = "Projected ACWR would enter elevated risk zone (>1.30)";
    }

    return {
      playerId,
      originalPlan: plannedSession,
      adjustedPlan: {
        sessionType: plannedSession.sessionType,
        adjustedIntensity,
        adjustedDuration,
        modifications,
      },
      reason,
      acwrBeforeAdjustment: acwrData.ratio,
      projectedACWRWithoutAdjustment: predicted.projectedACWR,
      projectedACWRWithAdjustment: predicted.projectedACWR * 0.8, // Estimated
      autoApplied: false,
    };
  }
}
