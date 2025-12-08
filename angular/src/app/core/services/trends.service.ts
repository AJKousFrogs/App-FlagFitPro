/**
 * Trends Service
 * 
 * Calculates and retrieves trend data for dashboards:
 * - Change of direction sessions (last 4 weeks)
 * - Sprint volume trends
 * - Game-to-game performance metrics
 */

import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface ChangeOfDirectionTrend {
  current: number;
  previous: number;
  change: number;
  weeks: Array<{ week: string; count: number }>;
}

export interface SprintVolumeTrend {
  current: number;
  previous: number;
  change: number;
  weeks: Array<{ week: string; volume: number }>;
}

export interface GamePerformanceTrend {
  games: Array<{
    date: string;
    opponent: string;
    performance: number;
    metrics: {
      touchdowns?: number;
      completions?: number;
      yards?: number;
      [key: string]: any;
    };
  }>;
  averagePerformance: number;
  trend: 'improving' | 'declining' | 'stable';
}

@Injectable({
  providedIn: 'root'
})
export class TrendsService {
  private apiService = inject(ApiService);

  /**
   * Get change of direction sessions trend (last 4 weeks)
   */
  getChangeOfDirectionTrend(athleteId: string): Observable<ChangeOfDirectionTrend> {
    return this.apiService.get<ChangeOfDirectionTrend>(
      '/api/trends/change-of-direction',
      { athleteId, weeks: 4 }
    ).pipe(
      map(res => {
        // Handle both response formats
        if (res && typeof res === 'object' && 'data' in res) {
          return res.data as ChangeOfDirectionTrend;
        }
        return res as ChangeOfDirectionTrend;
      }),
      catchError(error => {
        console.error('Error fetching change of direction trend:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get sprint volume trend (last 4 weeks)
   */
  getSprintVolumeTrend(athleteId: string): Observable<SprintVolumeTrend> {
    return this.apiService.get<SprintVolumeTrend>(
      '/api/trends/sprint-volume',
      { athleteId, weeks: 4 }
    ).pipe(
      map(res => {
        if (res && typeof res === 'object' && 'data' in res) {
          return res.data as SprintVolumeTrend;
        }
        return res as SprintVolumeTrend;
      }),
      catchError(error => {
        console.error('Error fetching sprint volume trend:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get game-to-game performance metrics
   */
  getGamePerformanceTrend(athleteId: string, games: number = 5): Observable<GamePerformanceTrend> {
    return this.apiService.get<GamePerformanceTrend>(
      '/api/trends/game-performance',
      { athleteId, games }
    ).pipe(
      map(res => {
        if (res && typeof res === 'object' && 'data' in res) {
          return res.data as GamePerformanceTrend;
        }
        return res as GamePerformanceTrend;
      }),
      catchError(error => {
        console.error('Error fetching game performance trend:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Calculate percentage change
   */
  calculateChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }
}

