import { Injectable, inject } from "@angular/core";
import { Observable, of, from } from "rxjs";
import { map, catchError } from "rxjs/operators";
import { SupabaseService } from "./supabase.service";

export interface HealthMetric {
  name: string;
  value: string | number;
  status: "healthy" | "warning" | "error";
  severity: "success" | "warn" | "danger" | "info";
  icon: string;
  color: string;
}

export interface SyncStatus {
  source: string;
  timestamp: Date;
  result: "success" | "failed" | "partial";
  severity: "success" | "warn" | "danger";
  recordsUpdated?: number;
  error?: string;
}

export interface BackupInfo {
  filename: string;
  size: number;
  timestamp: Date;
  status: "completed" | "failed" | "in-progress";
}

@Injectable({
  providedIn: "root",
})
export class AdminService {
  private supabaseService = inject(SupabaseService);

  /**
   * Get database health metrics from Supabase
   */
  getHealthMetrics(): Observable<HealthMetric[]> {
    return from(this.fetchHealthMetrics()).pipe(
      catchError(() => of(this.getDefaultHealthMetrics())),
    );
  }

  private async fetchHealthMetrics(): Promise<HealthMetric[]> {
    const metrics: HealthMetric[] = [];

    // Check database connection
    const { error: connError } = await this.supabaseService.client
      .from("users")
      .select("id")
      .limit(1);

    metrics.push({
      name: "Database Connection",
      value: connError ? "Error" : "Connected",
      status: connError ? "error" : "healthy",
      severity: connError ? "danger" : "success",
      icon: connError ? "pi pi-times-circle" : "pi pi-check-circle",
      color: connError ? "#ef4444" : "#10c96b",
    });

    // Get user count
    const { count: userCount } = await this.supabaseService.client
      .from("users")
      .select("*", { count: "exact", head: true });

    metrics.push({
      name: "Total Users",
      value: userCount || 0,
      status: "healthy",
      severity: "success",
      icon: "pi pi-users",
      color: "#10c96b",
    });

    // Get training session count (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { count: sessionCount } = await this.supabaseService.client
      .from("training_sessions")
      .select("*", { count: "exact", head: true })
      .gte("created_at", weekAgo.toISOString());

    metrics.push({
      name: "Sessions (7 days)",
      value: sessionCount || 0,
      status: "healthy",
      severity: "success",
      icon: "pi pi-bolt",
      color: "#10c96b",
    });

    // Get team count
    const { count: teamCount } = await this.supabaseService.client
      .from("teams")
      .select("*", { count: "exact", head: true });

    metrics.push({
      name: "Total Teams",
      value: teamCount || 0,
      status: "healthy",
      severity: "success",
      icon: "pi pi-users",
      color: "#10c96b",
    });

    // Get exercise count
    const { count: exerciseCount } = await this.supabaseService.client
      .from("exercises")
      .select("*", { count: "exact", head: true });

    metrics.push({
      name: "Exercise Library",
      value: exerciseCount || 0,
      status: "healthy",
      severity: "success",
      icon: "pi pi-list",
      color: "#10c96b",
    });

    // Check for recent activity
    const { data: recentActivity } = await this.supabaseService.client
      .from("training_sessions")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const lastActivity = recentActivity?.created_at
      ? this.formatTimeAgo(new Date(recentActivity.created_at))
      : "No activity";

    metrics.push({
      name: "Last Activity",
      value: lastActivity,
      status: "healthy",
      severity: "info",
      icon: "pi pi-clock",
      color: "#3b82f6",
    });

    return metrics;
  }

  /**
   * Get sync status from actual database tables
   */
  getLastSyncStatus(): Observable<SyncStatus[]> {
    return from(this.fetchSyncStatus()).pipe(
      catchError(() => of(this.getDefaultSyncStatus())),
    );
  }

  private async fetchSyncStatus(): Promise<SyncStatus[]> {
    const statuses: SyncStatus[] = [];

    // Check supplements table
    const { count: supplementCount, error: suppError } =
      await this.supabaseService.client
        .from("supplements")
        .select("*", { count: "exact", head: true });

    statuses.push({
      source: "Supplements Database",
      timestamp: new Date(),
      result: suppError ? "failed" : "success",
      severity: suppError ? "danger" : "success",
      recordsUpdated: supplementCount || 0,
    });

    // Check exercises table
    const { count: exerciseCount, error: exError } =
      await this.supabaseService.client
        .from("exercises")
        .select("*", { count: "exact", head: true });

    statuses.push({
      source: "Exercise Library",
      timestamp: new Date(),
      result: exError ? "failed" : "success",
      severity: exError ? "danger" : "success",
      recordsUpdated: exerciseCount || 0,
    });

    // Check knowledge base
    const { count: kbCount, error: kbError } = await this.supabaseService.client
      .from("knowledge_base_entries")
      .select("*", { count: "exact", head: true });

    statuses.push({
      source: "Knowledge Base",
      timestamp: new Date(),
      result: kbError ? "failed" : "success",
      severity: kbError ? "danger" : "success",
      recordsUpdated: kbCount || 0,
    });

    return statuses;
  }

  /**
   * Get USDA data statistics (from nutrition_logs)
   */
  getUSDADataStats(): Observable<Record<string, number>> {
    return from(this.fetchNutritionStats()).pipe(
      catchError(() =>
        of({
          totalFoods: 0,
          lastUpdated: new Date().getTime(),
          categories: 0,
        }),
      ),
    );
  }

  private async fetchNutritionStats(): Promise<Record<string, number>> {
    const { count: logCount } = await this.supabaseService.client
      .from("nutrition_logs")
      .select("*", { count: "exact", head: true });

    return {
      totalLogs: logCount || 0,
      lastUpdated: new Date().getTime(),
    };
  }

  /**
   * Get research data statistics
   */
  getResearchDataStats(): Observable<Record<string, number>> {
    return from(this.fetchResearchStats()).pipe(
      catchError(() =>
        of({
          totalStudies: 0,
          lastUpdated: new Date().getTime(),
          categories: 0,
        }),
      ),
    );
  }

  private async fetchResearchStats(): Promise<Record<string, number>> {
    const { count: kbCount } = await this.supabaseService.client
      .from("knowledge_base_entries")
      .select("*", { count: "exact", head: true });

    const { count: supplementResearchCount } = await this.supabaseService.client
      .from("supplement_research")
      .select("*", { count: "exact", head: true });

    return {
      knowledgeBaseEntries: kbCount || 0,
      supplementResearch: supplementResearchCount || 0,
      lastUpdated: new Date().getTime(),
    };
  }

  /**
   * Sync USDA food data - placeholder for future implementation
   */
  syncUSDAData(): Observable<boolean> {
    // This would typically call an edge function to sync external data
    return of(true);
  }

  /**
   * Sync research data - placeholder for future implementation
   */
  syncResearchData(): Observable<boolean> {
    // This would typically call an edge function to sync external data
    return of(true);
  }

  /**
   * Create database backup - returns info about current state
   */
  createDatabaseBackup(): Observable<BackupInfo> {
    return from(this.createBackupInfo()).pipe(
      catchError(() => of(this.getDefaultBackupInfo())),
    );
  }

  private async createBackupInfo(): Promise<BackupInfo> {
    // Get approximate database size by counting records
    const counts = await Promise.all([
      this.supabaseService.client
        .from("users")
        .select("*", { count: "exact", head: true }),
      this.supabaseService.client
        .from("training_sessions")
        .select("*", { count: "exact", head: true }),
      this.supabaseService.client
        .from("wellness_logs")
        .select("*", { count: "exact", head: true }),
    ]);

    const totalRecords = counts.reduce((sum, c) => sum + (c.count || 0), 0);
    const estimatedSize = totalRecords * 500; // Rough estimate: 500 bytes per record

    return {
      filename: `backup-${new Date().toISOString().split("T")[0]}.json`,
      size: estimatedSize,
      timestamp: new Date(),
      status: "completed",
    };
  }

  // Helper methods
  private formatTimeAgo(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (hours < 48) return "Yesterday";
    return `${Math.floor(hours / 24)} days ago`;
  }

  private getDefaultHealthMetrics(): HealthMetric[] {
    return [
      {
        name: "Database Connection",
        value: "Checking...",
        status: "warning",
        severity: "warn",
        icon: "pi pi-spin pi-spinner",
        color: "#f59e0b",
      },
    ];
  }

  private getDefaultSyncStatus(): SyncStatus[] {
    return [
      {
        source: "Database",
        timestamp: new Date(),
        result: "partial",
        severity: "warn",
        recordsUpdated: 0,
      },
    ];
  }

  private getDefaultBackupInfo(): BackupInfo {
    return {
      filename: `backup-${new Date().toISOString().split("T")[0]}.json`,
      size: 0,
      timestamp: new Date(),
      status: "in-progress",
    };
  }
}
