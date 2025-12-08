import { Injectable, inject } from "@angular/core";
import { Observable, BehaviorSubject } from "rxjs";
import { map, tap } from "rxjs/operators";
import { ApiService, API_ENDPOINTS } from "./api.service";

export interface WellnessData {
  id?: number;
  userId?: string;
  date: string;
  sleep?: number;
  energy?: number;
  stress?: number;
  soreness?: number;
  motivation?: number;
  mood?: number;
  hydration?: number;
  notes?: string;
  timestamp?: string;
}

export interface WellnessAverages {
  sleep?: number;
  energy?: number;
  stress?: number;
  soreness?: number;
  motivation?: number;
  mood?: number;
  hydration?: number;
}

export interface WellnessPatterns {
  patterns: string[];
  insights: string[];
  averages?: WellnessAverages;
}

export interface WellnessResponse {
  success: boolean;
  data: WellnessData[];
  averages?: WellnessAverages;
  patterns?: WellnessPatterns;
}

@Injectable({
  providedIn: "root",
})
export class WellnessService {
  private apiService = inject(ApiService);

  // State management
  private wellnessDataSubject = new BehaviorSubject<WellnessData[]>([]);
  public wellnessData$ = this.wellnessDataSubject.asObservable();

  private averagesSubject = new BehaviorSubject<WellnessAverages | null>(null);
  public averages$ = this.averagesSubject.asObservable();

  /**
   * Get wellness data for a specific timeframe
   * @param timeframe - Time range (e.g., '7d', '30d', '3m')
   */
  getWellnessData(timeframe: string = '30d'): Observable<WellnessResponse> {
    return this.apiService
      .get<WellnessResponse>(API_ENDPOINTS.performanceData.wellness, { timeframe })
      .pipe(
        map(response => response.data || { success: false, data: [] }),
        tap(wellnessResponse => {
          if (wellnessResponse.success && wellnessResponse.data) {
            this.wellnessDataSubject.next(wellnessResponse.data);
            if (wellnessResponse.averages) {
              this.averagesSubject.next(wellnessResponse.averages);
            }
          }
        })
      );
  }

  /**
   * Log wellness entry for today or specific date
   */
  logWellness(data: Partial<WellnessData>): Observable<any> {
    const wellnessEntry = {
      date: data.date || new Date().toISOString().split('T')[0],
      sleep: data.sleep,
      energy: data.energy,
      stress: data.stress,
      soreness: data.soreness,
      motivation: data.motivation,
      mood: data.mood,
      hydration: data.hydration,
      notes: data.notes,
    };

    return this.apiService
      .post(API_ENDPOINTS.performanceData.wellness, wellnessEntry)
      .pipe(
        tap(() => {
          // Refresh wellness data after successful post
          this.getWellnessData('30d').subscribe();
        })
      );
  }

  /**
   * Get wellness score (average of all metrics)
   */
  getWellnessScore(data: WellnessData): number {
    const metrics = [
      data.sleep,
      data.energy,
      data.stress ? 10 - data.stress : undefined, // Invert stress
      data.soreness ? 10 - data.soreness : undefined, // Invert soreness
      data.motivation,
      data.mood,
      data.hydration
    ].filter((m): m is number => m !== undefined && m !== null);

    if (metrics.length === 0) return 0;

    const sum = metrics.reduce((acc, val) => acc + val, 0);
    return Math.round((sum / metrics.length) * 10) / 10;
  }

  /**
   * Get wellness status based on score
   */
  getWellnessStatus(score: number): {
    status: 'excellent' | 'good' | 'fair' | 'poor';
    color: string;
    message: string;
  } {
    if (score >= 8) {
      return {
        status: 'excellent',
        color: '#10c96b',
        message: 'Your wellness is excellent! Keep up the great work.'
      };
    } else if (score >= 6) {
      return {
        status: 'good',
        color: '#2196f3',
        message: 'Your wellness is good. Small improvements can make a big difference.'
      };
    } else if (score >= 4) {
      return {
        status: 'fair',
        color: '#ff9800',
        message: 'Your wellness needs attention. Focus on recovery and rest.'
      };
    } else {
      return {
        status: 'poor',
        color: '#f44336',
        message: 'Your wellness is concerning. Consider taking a rest day and consulting a coach.'
      };
    }
  }

  /**
   * Get wellness trends over time
   */
  getWellnessTrends(data: WellnessData[]): {
    metric: string;
    trend: 'improving' | 'declining' | 'stable';
    change: number;
  }[] {
    if (data.length < 2) return [];

    const metrics = ['sleep', 'energy', 'stress', 'soreness', 'motivation', 'mood', 'hydration'];
    const trends: any[] = [];

    metrics.forEach(metric => {
      const values = data
        .map(d => (d as any)[metric])
        .filter((v): v is number => v !== undefined && v !== null);

      if (values.length < 2) return;

      const recent = values.slice(0, Math.floor(values.length / 2));
      const earlier = values.slice(Math.floor(values.length / 2));

      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;

      const change = ((recentAvg - earlierAvg) / earlierAvg) * 100;

      // For stress and soreness, lower is better
      const invertMetrics = ['stress', 'soreness'];
      const adjustedChange = invertMetrics.includes(metric) ? -change : change;

      trends.push({
        metric,
        trend: adjustedChange > 5 ? 'improving' : adjustedChange < -5 ? 'declining' : 'stable',
        change: Math.round(Math.abs(change) * 10) / 10
      });
    });

    return trends;
  }

  /**
   * Get recommendations based on wellness data
   */
  getRecommendations(data: WellnessData): string[] {
    const recommendations: string[] = [];

    if (data.sleep !== undefined && data.sleep < 6) {
      recommendations.push('Prioritize 7-9 hours of sleep for optimal recovery');
    }

    if (data.energy !== undefined && data.energy < 5) {
      recommendations.push('Consider a rest day or light training session');
    }

    if (data.stress !== undefined && data.stress > 7) {
      recommendations.push('Practice stress management techniques like meditation or breathing exercises');
    }

    if (data.soreness !== undefined && data.soreness > 7) {
      recommendations.push('Focus on recovery protocols: foam rolling, stretching, ice baths');
    }

    if (data.hydration !== undefined && data.hydration < 6) {
      recommendations.push('Increase water intake to support performance and recovery');
    }

    if (data.motivation !== undefined && data.motivation < 5) {
      recommendations.push('Try varying your training routine to maintain engagement');
    }

    if (recommendations.length === 0) {
      recommendations.push('Keep up the excellent wellness habits!');
    }

    return recommendations;
  }

  /**
   * Clear cached wellness data
   */
  clearCache(): void {
    this.wellnessDataSubject.next([]);
    this.averagesSubject.next(null);
  }
}
