/**
 * FlagFit Pro - Angular Achievements Service
 * Handles achievement management with database sync
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { LoggerService } from './logger.service';
import { ToastService } from './toast.service';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  unlocked: boolean;
  unlockedAt?: string | null;
}

export interface AchievementsResponse {
  achievements: Achievement[];
  unlockedCount: number;
  totalCount: number;
  totalPoints: number;
  progress: number;
  history: AchievementHistoryEntry[];
}

export interface AchievementHistoryEntry {
  id: string;
  achievement_id: string;
  event_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface UnlockResult {
  success: boolean;
  alreadyUnlocked: boolean;
  achievement?: Achievement;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class AchievementsService {
  private http = inject(HttpClient);
  private logger = inject(LoggerService);
  private toastService = inject(ToastService);

  // State signals
  private readonly achievementsData = signal<AchievementsResponse | null>(null);
  private readonly loading = signal(false);
  private readonly error = signal<string | null>(null);

  // Computed signals
  readonly achievements = computed(() => this.achievementsData()?.achievements || []);
  readonly unlockedAchievements = computed(() => 
    this.achievements().filter(a => a.unlocked)
  );
  readonly lockedAchievements = computed(() => 
    this.achievements().filter(a => !a.unlocked)
  );
  readonly totalPoints = computed(() => this.achievementsData()?.totalPoints || 0);
  readonly progress = computed(() => this.achievementsData()?.progress || 0);
  readonly unlockedCount = computed(() => this.achievementsData()?.unlockedCount || 0);
  readonly totalCount = computed(() => this.achievementsData()?.totalCount || 0);
  readonly history = computed(() => this.achievementsData()?.history || []);
  readonly isLoading = computed(() => this.loading());
  readonly hasError = computed(() => this.error());

  // Category-based computed signals
  readonly wellnessAchievements = computed(() => 
    this.achievements().filter(a => a.category === 'wellness')
  );
  readonly trainingAchievements = computed(() => 
    this.achievements().filter(a => a.category === 'training')
  );
  readonly performanceAchievements = computed(() => 
    this.achievements().filter(a => a.category === 'performance')
  );
  readonly socialAchievements = computed(() => 
    this.achievements().filter(a => a.category === 'social')
  );
  readonly specialAchievements = computed(() => 
    this.achievements().filter(a => a.category === 'special')
  );

  /**
   * Load achievements from the server
   */
  loadAchievements(): Observable<AchievementsResponse> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.get<{ success: boolean; data: AchievementsResponse }>('/api/achievements').pipe(
      map(response => {
        if (!response.success) {
          throw new Error('Failed to load achievements');
        }
        return response.data;
      }),
      tap(data => {
        this.achievementsData.set(data);
        this.loading.set(false);
        this.logger.info('[Achievements] Loaded achievements', {
          unlocked: data.unlockedCount,
          total: data.totalCount,
          points: data.totalPoints,
        });
      }),
      catchError(error => {
        this.error.set(error.message || 'Failed to load achievements');
        this.loading.set(false);
        this.logger.error('[Achievements] Error loading achievements', error);
        return of({
          achievements: [],
          unlockedCount: 0,
          totalCount: 0,
          totalPoints: 0,
          progress: 0,
          history: [],
        });
      })
    );
  }

  /**
   * Unlock a specific achievement
   */
  unlockAchievement(achievementId: string): Observable<UnlockResult> {
    return this.http.post<{ success: boolean; data: UnlockResult }>('/api/achievements', {
      achievementId,
      unlockedAt: new Date().toISOString(),
    }).pipe(
      map(response => {
        if (!response.success) {
          throw new Error('Failed to unlock achievement');
        }
        return response.data;
      }),
      tap(result => {
        if (!result.alreadyUnlocked) {
          // Show toast notification
          const achievement = this.achievements().find(a => a.id === achievementId);
          if (achievement) {
            this.toastService.success(
              `${achievement.name} - ${achievement.description}`,
              'Achievement Unlocked!'
            );
          }
          // Reload achievements to get updated state
          this.loadAchievements().subscribe();
        }
        this.logger.info('[Achievements] Unlock result', result);
      }),
      catchError(error => {
        this.logger.error('[Achievements] Error unlocking achievement', error);
        return of({
          success: false,
          alreadyUnlocked: false,
          message: error.message || 'Failed to unlock achievement',
        });
      })
    );
  }

  /**
   * Sync local achievements with database
   * Used when user has achievements stored in localStorage
   */
  syncFromLocalStorage(): Observable<{ synced: number; alreadyUnlocked: number }> {
    // Get achievements from localStorage
    const storedAchievements = localStorage.getItem('flagfit_achievements');
    const storedHistory = localStorage.getItem('flagfit_achievement_history');

    if (!storedAchievements) {
      return of({ synced: 0, alreadyUnlocked: 0 });
    }

    try {
      const achievementIds = JSON.parse(storedAchievements);
      const history = storedHistory ? JSON.parse(storedHistory) : [];

      if (!Array.isArray(achievementIds) || achievementIds.length === 0) {
        return of({ synced: 0, alreadyUnlocked: 0 });
      }

      return this.http.put<{ success: boolean; data: { synced: string[]; alreadyUnlocked: string[] } }>(
        '/api/achievements',
        { achievementIds, history }
      ).pipe(
        map(response => {
          if (!response.success) {
            throw new Error('Failed to sync achievements');
          }
          return {
            synced: response.data.synced.length,
            alreadyUnlocked: response.data.alreadyUnlocked.length,
          };
        }),
        tap(result => {
          this.logger.info('[Achievements] Synced from localStorage', result);
          // Reload to get fresh data
          this.loadAchievements().subscribe();
        }),
        catchError(error => {
          this.logger.error('[Achievements] Error syncing from localStorage', error);
          return of({ synced: 0, alreadyUnlocked: 0 });
        })
      );
    } catch {
      return of({ synced: 0, alreadyUnlocked: 0 });
    }
  }

  /**
   * Get achievements by category
   */
  getByCategory(category: string): Achievement[] {
    return this.achievements().filter(a => a.category === category);
  }

  /**
   * Get recently unlocked achievements
   */
  getRecentlyUnlocked(limit = 5): Achievement[] {
    return this.unlockedAchievements()
      .filter(a => a.unlockedAt)
      .sort((a, b) => {
        const dateA = new Date(a.unlockedAt!).getTime();
        const dateB = new Date(b.unlockedAt!).getTime();
        return dateB - dateA;
      })
      .slice(0, limit);
  }

  /**
   * Get next achievements to unlock (based on category progress)
   */
  getNextToUnlock(limit = 3): Achievement[] {
    const locked = this.lockedAchievements();
    
    // Prioritize achievements in categories where user has some progress
    const categoriesWithProgress = new Set(
      this.unlockedAchievements().map(a => a.category)
    );

    const prioritized = locked.filter(a => categoriesWithProgress.has(a.category));
    const others = locked.filter(a => !categoriesWithProgress.has(a.category));

    return [...prioritized, ...others]
      .sort((a, b) => a.points - b.points) // Lower points = easier to unlock
      .slice(0, limit);
  }

  /**
   * Calculate category progress
   */
  getCategoryProgress(category: string): { unlocked: number; total: number; percentage: number } {
    const categoryAchievements = this.getByCategory(category);
    const unlocked = categoryAchievements.filter(a => a.unlocked).length;
    const total = categoryAchievements.length;
    const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0;

    return { unlocked, total, percentage };
  }

  /**
   * Get all category progress
   */
  getAllCategoryProgress(): Record<string, { unlocked: number; total: number; percentage: number }> {
    const categories = ['wellness', 'training', 'performance', 'social', 'special'];
    const progress: Record<string, { unlocked: number; total: number; percentage: number }> = {};

    for (const category of categories) {
      progress[category] = this.getCategoryProgress(category);
    }

    return progress;
  }
}
