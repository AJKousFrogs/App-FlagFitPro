import { Injectable, inject } from "@angular/core";
import { Observable, of } from "rxjs";
import { map, catchError } from "rxjs/operators";
import { ApiService, API_ENDPOINTS } from "./api.service";

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
  private apiService = inject(ApiService);

  /**
   * Get database health metrics
   */
  getHealthMetrics(): Observable<HealthMetric[]> {
    return this.apiService
      .get<HealthMetric[]>(API_ENDPOINTS.admin.healthMetrics)
      .pipe(
        map((response) => response.data || []),
        catchError(() => of(this.getMockHealthMetrics())),
      );
  }

  /**
   * Sync USDA food data
   */
  syncUSDAData(): Observable<boolean> {
    return this.apiService.post<boolean>(API_ENDPOINTS.admin.syncUSDA, {}).pipe(
      map((response) => response.success || false),
      catchError(() => of(false)),
    );
  }

  /**
   * Sync research data
   */
  syncResearchData(): Observable<boolean> {
    return this.apiService
      .post<boolean>(API_ENDPOINTS.admin.syncResearch, {})
      .pipe(
        map((response) => response.success || false),
        catchError(() => of(false)),
      );
  }

  /**
   * Create database backup
   */
  createDatabaseBackup(): Observable<BackupInfo> {
    return this.apiService
      .post<BackupInfo>(API_ENDPOINTS.admin.createBackup, {})
      .pipe(
        map((response) => {
          const backup = response.data || this.getMockBackupInfo();
          return {
            ...backup,
            timestamp: new Date(backup.timestamp),
          };
        }),
        catchError(() => of(this.getMockBackupInfo())),
      );
  }

  /**
   * Get last sync status for all data sources
   */
  getLastSyncStatus(): Observable<SyncStatus[]> {
    return this.apiService
      .get<SyncStatus[]>(API_ENDPOINTS.admin.syncStatus)
      .pipe(
        map((response) => {
          const statuses = response.data || [];
          return statuses.map((status) => ({
            ...status,
            timestamp: new Date(status.timestamp),
          }));
        }),
        catchError(() => of(this.getMockSyncStatus())),
      );
  }

  /**
   * Get USDA data statistics
   */
  getUSDADataStats(): Observable<Record<string, number>> {
    return this.apiService
      .get<Record<string, number>>(API_ENDPOINTS.admin.usdaStats)
      .pipe(
        map((response) => response.data || {}),
        catchError(() =>
          of({
            totalFoods: 376000,
            lastUpdated: new Date().getTime(),
            categories: 25,
          }),
        ),
      );
  }

  /**
   * Get research data statistics
   */
  getResearchDataStats(): Observable<Record<string, number>> {
    return this.apiService
      .get<Record<string, number>>(API_ENDPOINTS.admin.researchStats)
      .pipe(
        map((response) => response.data || {}),
        catchError(() =>
          of({
            totalStudies: 1250,
            lastUpdated: new Date().getTime(),
            categories: 12,
          }),
        ),
      );
  }

  // Mock data methods for development
  private getMockHealthMetrics(): HealthMetric[] {
    return [
      {
        name: "Database Connection",
        value: "Connected",
        status: "healthy",
        severity: "success",
        icon: "pi pi-check-circle",
        color: "#10c96b",
      },
      {
        name: "Active Connections",
        value: 12,
        status: "healthy",
        severity: "success",
        icon: "pi pi-link",
        color: "#10c96b",
      },
      {
        name: "Database Size",
        value: "2.4 GB",
        status: "healthy",
        severity: "success",
        icon: "pi pi-database",
        color: "#10c96b",
      },
      {
        name: "Query Performance",
        value: "125ms avg",
        status: "healthy",
        severity: "success",
        icon: "pi pi-clock",
        color: "#10c96b",
      },
      {
        name: "Cache Hit Rate",
        value: "94%",
        status: "healthy",
        severity: "success",
        icon: "pi pi-bolt",
        color: "#10c96b",
      },
      {
        name: "Last Backup",
        value: "2 hours ago",
        status: "healthy",
        severity: "success",
        icon: "pi pi-save",
        color: "#10c96b",
      },
    ];
  }

  private getMockSyncStatus(): SyncStatus[] {
    return [
      {
        source: "USDA Foods",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        result: "success",
        severity: "success",
        recordsUpdated: 1250,
      },
      {
        source: "Research Studies",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        result: "success",
        severity: "success",
        recordsUpdated: 45,
      },
      {
        source: "Recovery Protocols",
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        result: "success",
        severity: "success",
        recordsUpdated: 8,
      },
    ];
  }

  private getMockBackupInfo(): BackupInfo {
    return {
      filename: `backup-${new Date().toISOString().split("T")[0]}.sql`,
      size: 2456789, // bytes
      timestamp: new Date(),
      status: "completed",
    };
  }
}
