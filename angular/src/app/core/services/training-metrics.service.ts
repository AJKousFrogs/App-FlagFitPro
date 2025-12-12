/**
 * Training Metrics Service
 * 
 * Handles importing open-source sport-science datasets and retrieving
 * processed flag-football metrics including ACWR calculations.
 * 
 * @author FlagFit Pro Team
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface ACWRData {
  session_date: string;
  load: number;
  acute_load: number;
  chronic_load: number;
  acwr: number | null;
}

export interface FlagMetrics {
  date: string;
  total_volume: number;
  high_speed_distance: number;
  sprint_count: number;
}

export interface ImportDatasetResponse {
  ok: boolean;
  metrics: {
    total_volume: number;
    high_speed_distance: number;
    sprint_count: number;
    duration_minutes: number;
  };
  session_id?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TrainingMetricsService {
  private apiService = inject(ApiService);
  private http = inject(HttpClient);

  /**
   * Get ACWR data for an athlete using the stored procedure
   */
  async getACWR(athleteId: string): Promise<ACWRData[]> {
    return this.apiService.post<{ data: ACWRData[] }>(
      '/api/compute-acwr',
      { athleteId }
    ).pipe(
      map(response => response.data?.data || []),
      catchError(error => {
        console.error('Error fetching ACWR:', error);
        return throwError(() => error);
      })
    ).toPromise().then(result => result || []);
  }

  /**
   * Import open-source dataset
   * @param athleteId - UUID of the athlete
   * @param dataset - Array of data entries with speed_m_s and distance_m
   */
  async importOpenDataset(
    athleteId: string,
    dataset: Array<{ speed_m_s?: number; distance_m?: number; speed?: number; distance?: number }>
  ): Promise<ImportDatasetResponse> {
    return this.apiService.post<ImportDatasetResponse>(
      '/api/import-open-data',
      { athleteId, dataset }
    ).pipe(
      map(response => response.data || { ok: false, metrics: { total_volume: 0, high_speed_distance: 0, sprint_count: 0, duration_minutes: 0 } }),
      catchError(error => {
        console.error('Error importing dataset:', error);
        return throwError(() => error);
      })
    ).toPromise().then(result => result || { ok: false, metrics: { total_volume: 0, high_speed_distance: 0, sprint_count: 0, duration_minutes: 0 } });
  }

  /**
   * Get 4-week flag-football metrics
   * @param athleteId - UUID of the athlete
   */
  async get4WeekFlagMetrics(athleteId: string): Promise<FlagMetrics[]> {
    const fourWeeksAgo = new Date(Date.now() - 28 * 86400000).toISOString().split('T')[0];
    
    return this.apiService.get<FlagMetrics[]>(
      '/api/training-metrics',
      { athleteId, startDate: fourWeeksAgo }
    ).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching flag metrics:', error);
        return throwError(() => error);
      })
    ).toPromise().then(result => result || []);
  }
}

