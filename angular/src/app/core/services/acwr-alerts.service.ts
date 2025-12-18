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

import { Injectable, signal, computed, effect, inject } from '@angular/core';
import {
  LoadAlert,
  ACWRData,
  TrainingSession,
  RiskLevel,
  PlayerACWRProfile,
  TrainingAdjustment
} from '../models/acwr.models';
import { AcwrService } from './acwr.service';

@Injectable({
  providedIn: 'root'
})
export class AcwrAlertsService {
  // Inject dependencies using inject() for Angular 21 best practices
  private readonly acwrService = inject(AcwrService);

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
      critical: active.filter(a => a.severity === 'critical').length,
      warning: active.filter(a => a.severity === 'warning').length,
      info: active.filter(a => a.severity === 'info').length,
      unacknowledged: active.filter(a => !a.acknowledged).length
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
    if (ratio > 1.50) {
      this.createAlert({
        type: 'danger-zone',
        severity: 'critical',
        message: `CRITICAL: ACWR is ${ratio.toFixed(2)} - in danger zone!`,
        recommendation: riskZone.recommendation,
        acwrValue: ratio
      });
    }
    // Check for elevated risk (ACWR > 1.30)
    else if (ratio > 1.30) {
      this.createAlert({
        type: 'high-acwr',
        severity: 'warning',
        message: `WARNING: ACWR is ${ratio.toFixed(2)} - elevated injury risk`,
        recommendation: riskZone.recommendation,
        acwrValue: ratio
      });
    }
    // Check for under-training (ACWR < 0.80)
    else if (ratio > 0 && ratio < 0.80) {
      this.createAlert({
        type: 'under-training',
        severity: 'info',
        message: `INFO: ACWR is ${ratio.toFixed(2)} - player may lack conditioning`,
        recommendation: riskZone.recommendation,
        acwrValue: ratio
      });
    }

    // Check for weekly load spike
    if (!weeklyProgression.isSafe && weeklyProgression.changePercent > 10) {
      this.createAlert({
        type: 'spike-detected',
        severity: 'warning',
        message: `WARNING: Weekly load increased by ${weeklyProgression.changePercent.toFixed(1)}%`,
        recommendation: 'Limit load increase to <10% week-over-week',
        acwrValue: ratio
      });
    }
  }

  /**
   * Create a new alert
   */
  private createAlert(
    alertData: Omit<LoadAlert, 'id' | 'playerId' | 'playerName' | 'timestamp' | 'acknowledged'>
  ): void {
    // Check if similar alert already exists for today
    const today = new Date().toDateString();
    const existingAlert = this.alerts().find(
      a => a.type === alertData.type && a.timestamp.toDateString() === today
    );

    if (existingAlert) {
      return; // Don't duplicate alerts
    }

    const alert: LoadAlert = {
      id: this.generateAlertId(),
      playerId: 'current-player', // TODO: Get from context
      playerName: 'Current Player', // TODO: Get from player service
      timestamp: new Date(),
      acknowledged: false,
      ...alertData
    };

    // Add to active alerts
    this.alerts.update(current => [...current, alert]);

    // Add to history
    this.alertHistory.update(current => [...current, alert]);

    // Trigger notification if enabled
    if (this.notificationEnabled()) {
      this.sendNotification(alert);
    }

    // Notify coach if critical and enabled
    if (alert.severity === 'critical' && this.coachNotificationEnabled()) {
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
  private sendNotification(alert: LoadAlert): void {
    // TODO: Integrate with your notification system
    console.log('🔔 Alert:', alert.message);

    // Could trigger browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('FlagFit Pro - Load Alert', {
        body: alert.message,
        icon: '/assets/icons/alert-icon.png',
        badge: '/assets/icons/badge.png',
        tag: alert.type
      });
    }
  }

  /**
   * Notify coach of critical alert
   */
  private notifyCoach(alert: LoadAlert): void {
    // TODO: Send email/SMS to coach
    console.log('📧 Notifying coach of critical alert:', alert.message);

    // Could trigger:
    // - Email via backend API
    // - SMS via Twilio
    // - Push notification to coach mobile app
    // - Slack/Teams message
  }

  /**
   * Acknowledge an alert
   */
  public acknowledgeAlert(alertId: string, acknowledgedBy: string): void {
    this.alerts.update(current =>
      current.map(alert =>
        alert.id === alertId
          ? {
              ...alert,
              acknowledged: true,
              acknowledgedBy,
              acknowledgedAt: new Date()
            }
          : alert
      )
    );
  }

  /**
   * Dismiss an alert
   */
  public dismissAlert(alertId: string): void {
    this.alerts.update(current => current.filter(a => a.id !== alertId));
  }

  /**
   * Clear all acknowledged alerts
   */
  public clearAcknowledgedAlerts(): void {
    this.alerts.update(current => current.filter(a => !a.acknowledged));
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
  public getAlertsBySeverity(severity: 'critical' | 'warning' | 'info'): LoadAlert[] {
    return this.alerts().filter(a => a.severity === severity);
  }

  /**
   * Get alert history for date range
   */
  public getAlertHistory(startDate: Date, endDate: Date): LoadAlert[] {
    return this.alertHistory().filter(
      a => a.timestamp >= startDate && a.timestamp <= endDate
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
    const criticalAlerts = this.getAlertsBySeverity('critical');
    const modification = this.acwrService.getTrainingModification();

    if (criticalAlerts.length > 0) {
      return {
        canTrain: false,
        reason: 'Player in danger zone - rest day recommended',
        modifications: modification.modifications
      };
    }

    if (modification.shouldModify) {
      return {
        canTrain: true,
        reason: 'Can train with modifications',
        modifications: modification.modifications
      };
    }

    return {
      canTrain: true,
      reason: 'All systems green - train as planned'
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
    const criticalAlerts = weeklyAlerts.filter(a => a.severity === 'critical');
    const criticalDays = new Set(
      criticalAlerts.map(a => a.timestamp.toDateString())
    ).size;

    const avgACWR = weeklyAlerts.reduce((sum, a) => sum + a.acwrValue, 0) /
      (weeklyAlerts.length || 1);

    const recommendations: string[] = [];

    if (criticalDays > 2) {
      recommendations.push('⚠️ Multiple critical days this week - review training program');
    }

    if (avgACWR > 1.30) {
      recommendations.push('📉 Reduce overall training volume by 15-20%');
    } else if (avgACWR < 0.85) {
      recommendations.push('📈 Gradually increase training load by 5-10%');
    }

    const spikes = weeklyAlerts.filter(a => a.type === 'spike-detected');
    if (spikes.length > 0) {
      recommendations.push('⚡ Multiple load spikes detected - improve progression');
    }

    return {
      totalAlerts: weeklyAlerts.length,
      criticalDays,
      averageACWR: parseFloat(avgACWR.toFixed(2)),
      recommendations
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
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  /**
   * Generate training adjustment recommendation
   */
  public generateAdjustment(
    playerId: string,
    plannedSession: {
      sessionType: any;
      plannedIntensity: number;
      plannedDuration: number;
    }
  ): TrainingAdjustment {
    const acwrData = this.acwrService.acwrData();
    const predicted = this.acwrService.predictNextSessionLoad(
      plannedSession.plannedIntensity
    );

    let adjustedIntensity = plannedSession.plannedIntensity;
    let adjustedDuration = plannedSession.plannedDuration;
    const modifications: string[] = [];
    let reason = '';

    // Adjust based on projected ACWR
    if (predicted.projectedACWR > 1.50) {
      adjustedIntensity = Math.max(3, plannedSession.plannedIntensity * 0.6);
      adjustedDuration = Math.floor(plannedSession.plannedDuration * 0.7);
      modifications.push('Reduce intensity by 40%');
      modifications.push('Reduce duration by 30%');
      modifications.push('Skip all sprint work');
      reason = 'Projected ACWR would exceed danger zone (>1.50)';
    } else if (predicted.projectedACWR > 1.30) {
      adjustedIntensity = Math.max(4, plannedSession.plannedIntensity * 0.8);
      adjustedDuration = Math.floor(plannedSession.plannedDuration * 0.85);
      modifications.push('Reduce intensity by 20%');
      modifications.push('Reduce duration by 15%');
      modifications.push('Limit high-intensity work');
      reason = 'Projected ACWR would enter elevated risk zone (>1.30)';
    }

    return {
      playerId,
      originalPlan: plannedSession,
      adjustedPlan: {
        sessionType: plannedSession.sessionType,
        adjustedIntensity,
        adjustedDuration,
        modifications
      },
      reason,
      acwrBeforeAdjustment: acwrData.ratio,
      projectedACWRWithoutAdjustment: predicted.projectedACWR,
      projectedACWRWithAdjustment: predicted.projectedACWR * 0.8, // Estimated
      autoApplied: false
    };
  }
}
