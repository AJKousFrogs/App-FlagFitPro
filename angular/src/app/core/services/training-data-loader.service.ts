import { Injectable, inject, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { WellnessService } from './wellness.service';
import { LoggerService } from './logger.service';
import {
  TrainingStatCard,
  WeeklyScheduleDay,
  Workout,
  Achievement,
  WellnessAlert,
  ReadinessStatus,
  WellnessTrainingData,
  TrainingDataResult,
  SessionType
} from '../models/training.models';

/**
 * Training Data Loader Service
 *
 * Handles all async data loading and transformation for Training Component.
 * Separates data operations from UI state management.
 *
 * Responsibilities:
 * - Load training data from Supabase
 * - Transform database models to UI models
 * - Calculate statistics and metrics
 * - Handle errors and fallbacks
 * - Coordinate wellness data integration
 * - Execute workout actions (complete, postpone)
 *
 * Works in tandem with TrainingStateService:
 * - This service: Loads data (async)
 * - State service: Manages data (sync signals)
 *
 * @example
 * ```typescript
 * export class TrainingComponent {
 *   private dataLoader = inject(TrainingDataLoaderService);
 *   private trainingState = inject(TrainingStateService);
 *
 *   async ngOnInit() {
 *     const data = await this.dataLoader.loadAllTrainingData();
 *     this.trainingState.setAllTrainingData(data);
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class TrainingDataLoaderService {
  private supabase = inject(SupabaseService);
  private wellness = inject(WellnessService);
  private logger = inject(LoggerService);

  // Computed userId from Supabase service
  private userId = computed(() => this.supabase.userId());

  // ============================================================================
  // MAIN DATA LOADING ORCHESTRATOR
  // ============================================================================

  /**
   * Load all training data needed by the component
   * Orchestrates parallel data loading for optimal performance
   */
  async loadAllTrainingData(): Promise<TrainingDataResult> {
    try {
      const userId = this.userId();
      if (!userId) {
        this.logger.warn('No user ID available, returning fallback data');
        return this.getFallbackData();
      }

      // Load all data in parallel for better performance
      const [sessions, schedule, workouts, wellnessData] = await Promise.all([
        this.loadTrainingSessions(userId),
        this.loadWeeklySchedule(userId),
        this.loadAvailableWorkouts(),
        this.checkWellnessForTraining(userId)
      ]);

      // Calculate derived data
      const stats = this.calculateTrainingStats(sessions);
      const streak = this.calculateStreak(sessions);
      const totalSessions = sessions.length;
      const achievements = this.loadAchievements(userId, streak, totalSessions);

      // Get user profile data
      const userName = await this.getUserName(userId);

      return {
        stats,
        schedule,
        workouts,
        achievements,
        wellnessData,
        userName,
        lastRefresh: new Date()
      };

    } catch (error) {
      this.logger.error('Error loading training data:', error);
      return this.getFallbackData();
    }
  }

  // ============================================================================
  // INDIVIDUAL DATA LOADERS
  // ============================================================================

  /**
   * Load training sessions from database
   */
  private async loadTrainingSessions(userId: string): Promise<any[]> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await this.supabase.client
        .from('training_sessions')
        .select('*')
        .eq('user_id', userId)
        .gte('date', thirtyDaysAgo.toISOString())
        .order('date', { ascending: false });

      if (error) {
        this.logger.error('Error loading training sessions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      this.logger.error('Error in loadTrainingSessions:', error);
      return [];
    }
  }

  /**
   * Load weekly schedule
   */
  async loadWeeklySchedule(userId: string): Promise<WeeklyScheduleDay[]> {
    try {
      // Get current week's sessions
      const startOfWeek = this.getStartOfWeek();
      const endOfWeek = this.getEndOfWeek();

      const { data, error } = await this.supabase.client
        .from('training_sessions')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startOfWeek.toISOString())
        .lte('date', endOfWeek.toISOString())
        .order('date', { ascending: true });

      if (error) {
        this.logger.error('Error loading weekly schedule:', error);
        return this.getEmptyWeeklySchedule();
      }

      return this.transformToWeeklySchedule(data || []);
    } catch (error) {
      this.logger.error('Error in loadWeeklySchedule:', error);
      return this.getEmptyWeeklySchedule();
    }
  }

  /**
   * Load available workouts
   */
  async loadAvailableWorkouts(): Promise<Workout[]> {
    try {
      const userId = this.userId();
      if (!userId) return this.getDefaultWorkouts();

      // Load user's scheduled workouts for today
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await this.supabase.client
        .from('scheduled_workouts')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .eq('completed', false)
        .order('scheduled_time', { ascending: true });

      if (error) {
        this.logger.error('Error loading workouts:', error);
        return this.getDefaultWorkouts();
      }

      if (!data || data.length === 0) {
        return this.getDefaultWorkouts();
      }

      return data.map(w => this.transformToWorkout(w));
    } catch (error) {
      this.logger.error('Error in loadAvailableWorkouts:', error);
      return this.getDefaultWorkouts();
    }
  }

  /**
   * Load or generate achievements
   */
  loadAchievements(userId: string, currentStreak: number, totalSessions: number): Achievement[] {
    const achievements: Achievement[] = [];

    // Streak achievements
    if (currentStreak >= 7) {
      achievements.push({
        icon: 'pi-bolt',
        title: '7-Day Streak',
        description: 'Trained for 7 consecutive days',
        date: new Date().toISOString().split('T')[0],
        category: 'streak',
        level: 'bronze'
      });
    }

    if (currentStreak >= 30) {
      achievements.push({
        icon: 'pi-star',
        title: '30-Day Streak',
        description: 'Incredible consistency!',
        date: new Date().toISOString().split('T')[0],
        category: 'streak',
        level: 'gold'
      });
    }

    // Milestone achievements
    if (totalSessions >= 10) {
      achievements.push({
        icon: 'pi-check-circle',
        title: '10 Sessions Complete',
        description: 'Great start to your training journey',
        date: new Date().toISOString().split('T')[0],
        category: 'milestone',
        level: 'bronze'
      });
    }

    if (totalSessions >= 50) {
      achievements.push({
        icon: 'pi-trophy',
        title: '50 Sessions Complete',
        description: 'You\'re a training champion!',
        date: new Date().toISOString().split('T')[0],
        category: 'milestone',
        level: 'silver'
      });
    }

    if (totalSessions >= 100) {
      achievements.push({
        icon: 'pi-crown',
        title: '100 Sessions Complete',
        description: 'Elite athlete status achieved!',
        date: new Date().toISOString().split('T')[0],
        category: 'milestone',
        level: 'platinum'
      });
    }

    return achievements;
  }

  /**
   * Get user's display name
   */
  private async getUserName(userId: string): Promise<string> {
    try {
      const { data, error } = await this.supabase.client
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', userId)
        .single();

      if (error || !data) {
        return 'Athlete';
      }

      return data.first_name || 'Athlete';
    } catch (error) {
      this.logger.error('Error loading user name:', error);
      return 'Athlete';
    }
  }

  // ============================================================================
  // STATISTICS CALCULATORS
  // ============================================================================

  /**
   * Calculate training statistics cards
   */
  calculateTrainingStats(sessions: any[]): TrainingStatCard[] {
    const thisWeekSessions = sessions.filter(s => this.isThisWeek(new Date(s.date)));
    const lastWeekSessions = sessions.filter(s => this.isLastWeek(new Date(s.date)));

    const thisWeekCount = thisWeekSessions.length;
    const lastWeekCount = lastWeekSessions.length;
    const weekChange = lastWeekCount > 0 ? ((thisWeekCount - lastWeekCount) / lastWeekCount * 100) : 0;

    const totalDuration = thisWeekSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const avgIntensity = thisWeekSessions.length > 0
      ? thisWeekSessions.reduce((sum, s) => sum + (s.intensity || 0), 0) / thisWeekSessions.length
      : 0;

    const streak = this.calculateStreak(sessions);

    return [
      {
        label: 'This Week',
        value: `${thisWeekCount} sessions`,
        icon: 'pi-calendar',
        color: '#3b82f6',
        trend: weekChange > 0 ? `+${weekChange.toFixed(0)}%` : weekChange < 0 ? `${weekChange.toFixed(0)}%` : '0%',
        trendType: weekChange > 0 ? 'positive' : weekChange < 0 ? 'negative' : 'neutral'
      },
      {
        label: 'Total Duration',
        value: `${totalDuration} min`,
        icon: 'pi-clock',
        color: '#10b981',
        trend: 'This week',
        trendType: 'neutral'
      },
      {
        label: 'Avg Intensity',
        value: avgIntensity.toFixed(1),
        icon: 'pi-chart-line',
        color: '#f59e0b',
        trend: 'Out of 10',
        trendType: 'neutral'
      },
      {
        label: 'Current Streak',
        value: `${streak} days`,
        icon: 'pi-bolt',
        color: '#ef4444',
        trend: streak > 0 ? 'Keep it going!' : 'Start today!',
        trendType: streak > 0 ? 'positive' : 'neutral'
      }
    ];
  }

  /**
   * Calculate current training streak
   */
  calculateStreak(sessions: any[]): number {
    if (sessions.length === 0) return 0;

    const sortedDates = sessions
      .map(s => new Date(s.date).toISOString().split('T')[0])
      .sort()
      .reverse();

    const uniqueDates = [...new Set(sortedDates)];
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Streak must include today or yesterday
    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
      return 0;
    }

    let streak = 0;
    let currentDate = new Date();

    for (const dateStr of uniqueDates) {
      const expectedDate = new Date(currentDate);
      expectedDate.setDate(expectedDate.getDate() - streak);
      const expectedDateStr = expectedDate.toISOString().split('T')[0];

      if (dateStr === expectedDateStr) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Format next session info
   */
  formatNextSession(session: any): string {
    if (!session) return 'No sessions scheduled';

    const date = new Date(session.date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (this.isSameDay(date, today)) {
      return `Today at ${session.time || 'TBD'}`;
    } else if (this.isSameDay(date, tomorrow)) {
      return `Tomorrow at ${session.time || 'TBD'}`;
    } else {
      return `${date.toLocaleDateString()} at ${session.time || 'TBD'}`;
    }
  }

  // ============================================================================
  // WELLNESS INTEGRATION
  // ============================================================================

  /**
   * Check wellness data and generate training alert if needed
   */
  async checkWellnessForTraining(userId: string): Promise<WellnessTrainingData> {
    try {
      // Get latest wellness check-in
      const { data, error } = await this.supabase.client
        .from('wellness_checkins')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return {
          alert: null,
          readinessScore: 0,
          readinessStatus: 'good'
        };
      }

      // Calculate readiness score (0-100)
      const readinessScore = this.calculateReadinessScore(data);
      const readinessStatus = this.getReadinessStatus(readinessScore);

      // Generate alert if needed
      const alert = this.generateWellnessAlert(readinessScore, readinessStatus, data);

      return {
        alert,
        readinessScore,
        readinessStatus,
        lastCheckin: new Date(data.date),
        metrics: {
          sleep: data.sleep,
          energy: data.energy,
          stress: data.stress,
          soreness: data.soreness,
          motivation: data.motivation
        }
      };

    } catch (error) {
      this.logger.error('Error checking wellness:', error);
      return {
        alert: null,
        readinessScore: 0,
        readinessStatus: 'good'
      };
    }
  }

  /**
   * Calculate readiness score from wellness metrics
   */
  private calculateReadinessScore(wellness: any): number {
    const sleep = wellness.sleep || 0;
    const energy = wellness.energy || 0;
    const stress = wellness.stress || 10;
    const soreness = wellness.soreness || 10;
    const motivation = wellness.motivation || 0;

    // Weighted average (higher is better)
    // Sleep and energy are most important
    const score = (
      (sleep * 2) +
      (energy * 2) +
      ((10 - stress) * 1.5) +
      ((10 - soreness) * 1.5) +
      (motivation * 1)
    ) / 8;

    return Math.round(score * 10); // Scale to 0-100
  }

  /**
   * Get readiness status from score
   */
  private getReadinessStatus(score: number): ReadinessStatus {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'caution';
    return 'rest';
  }

  /**
   * Generate wellness alert based on metrics
   */
  private generateWellnessAlert(
    score: number,
    status: ReadinessStatus,
    wellness: any
  ): WellnessAlert | null {
    if (status === 'rest') {
      return {
        severity: 'critical',
        message: 'Your body needs rest. Consider taking today off or doing light recovery work.',
        recommendations: [
          'Focus on sleep and recovery',
          'Light stretching or yoga',
          'Proper hydration and nutrition',
          'Avoid high-intensity training'
        ],
        icon: 'pi-exclamation-triangle',
        actionLabel: 'Update Wellness Check-in',
        actionRoute: '/wellness'
      };
    }

    if (status === 'caution') {
      return {
        severity: 'warning',
        message: 'You\'re showing signs of fatigue. Train with caution today.',
        recommendations: [
          'Reduce training intensity by 20-30%',
          'Extra warm-up time',
          'Listen to your body',
          'Prioritize recovery after training'
        ],
        icon: 'pi-info-circle',
        actionLabel: 'View Recommendations',
        actionRoute: '/wellness'
      };
    }

    // Check specific red flags
    if (wellness.sleep && wellness.sleep < 4) {
      return {
        severity: 'warning',
        message: 'Poor sleep detected. This significantly impacts performance and recovery.',
        recommendations: [
          'Reduce training intensity today',
          'Prioritize sleep tonight',
          'Avoid late training sessions'
        ],
        icon: 'pi-moon',
        actionLabel: 'Sleep Tips',
        actionRoute: '/wellness/sleep'
      };
    }

    if (wellness.soreness && wellness.soreness >= 8) {
      return {
        severity: 'warning',
        message: 'High soreness levels. Focus on recovery today.',
        recommendations: [
          'Active recovery session',
          'Foam rolling and stretching',
          'Cold therapy or ice bath',
          'Avoid the same muscle groups'
        ],
        icon: 'pi-heart',
        actionLabel: 'Recovery Guide',
        actionRoute: '/recovery'
      };
    }

    return null;
  }

  // ============================================================================
  // WORKOUT ACTIONS
  // ============================================================================

  /**
   * Mark workout as complete
   */
  async markWorkoutComplete(workout: Workout): Promise<boolean> {
    try {
      const userId = this.userId();
      if (!userId) {
        this.logger.warn('No user ID, cannot mark workout complete');
        return false;
      }

      // Create completed session record
      const { error } = await this.supabase.client
        .from('training_sessions')
        .insert({
          user_id: userId,
          date: new Date().toISOString(),
          type: this.mapWorkoutTypeToSessionType(workout.type),
          duration: parseInt(workout.duration) || 60,
          intensity: this.mapIntensityToNumber(workout.intensity),
          completed: true,
          notes: `Completed: ${workout.title}`
        });

      if (error) {
        this.logger.error('Error marking workout complete:', error);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Error in markWorkoutComplete:', error);
      return false;
    }
  }

  /**
   * Postpone workout to later
   */
  async postponeWorkout(workout: Workout): Promise<boolean> {
    try {
      const userId = this.userId();
      if (!userId || !workout.id) return false;

      // Update scheduled workout to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { error } = await this.supabase.client
        .from('scheduled_workouts')
        .update({
          date: tomorrow.toISOString().split('T')[0],
          postponed: true
        })
        .eq('id', workout.id);

      if (error) {
        this.logger.error('Error postponing workout:', error);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Error in postponeWorkout:', error);
      return false;
    }
  }

  // ============================================================================
  // DATA TRANSFORMATION HELPERS
  // ============================================================================

  /**
   * Transform database sessions to weekly schedule
   */
  private transformToWeeklySchedule(sessions: any[]): WeeklyScheduleDay[] {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const schedule: WeeklyScheduleDay[] = [];

    const today = new Date();
    const startOfWeek = this.getStartOfWeek();

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(currentDate.getDate() + i);

      const dayName = days[i];
      const daySessions = sessions.filter(s =>
        this.isSameDay(new Date(s.date), currentDate)
      );

      schedule.push({
        name: dayName,
        date: currentDate,
        sessions: daySessions.map(s => ({
          time: s.scheduled_time || 'TBD',
          title: s.title || this.getDefaultSessionTitle(s.type),
          type: s.type,
          duration: s.duration
        })),
        isToday: this.isSameDay(currentDate, today)
      });
    }

    return schedule;
  }

  /**
   * Transform database workout to UI workout
   */
  private transformToWorkout(dbWorkout: any): Workout {
    return {
      id: dbWorkout.id,
      type: dbWorkout.type || 'training',
      title: dbWorkout.title || 'Workout',
      description: dbWorkout.description || '',
      duration: `${dbWorkout.duration || 60} min`,
      intensity: this.mapNumberToIntensity(dbWorkout.intensity),
      location: dbWorkout.location || 'Gym',
      icon: this.getWorkoutIcon(dbWorkout.type),
      iconBg: this.getWorkoutIconBg(dbWorkout.type),
      scheduledTime: dbWorkout.scheduled_time,
      completed: dbWorkout.completed || false
    };
  }

  // ============================================================================
  // FALLBACK DATA
  // ============================================================================

  /**
   * Get fallback data when database is unavailable
   */
  getFallbackData(): TrainingDataResult {
    return {
      stats: this.getDefaultStats(),
      schedule: this.getEmptyWeeklySchedule(),
      workouts: this.getDefaultWorkouts(),
      achievements: [],
      wellnessData: {
        alert: null,
        readinessScore: 0,
        readinessStatus: 'good'
      },
      userName: 'Athlete',
      lastRefresh: new Date()
    };
  }

  /**
   * Get default training stats
   */
  private getDefaultStats(): TrainingStatCard[] {
    return [
      {
        label: 'This Week',
        value: '0 sessions',
        icon: 'pi-calendar',
        color: '#3b82f6',
        trend: 'Start training!',
        trendType: 'neutral'
      },
      {
        label: 'Total Duration',
        value: '0 min',
        icon: 'pi-clock',
        color: '#10b981',
        trend: 'This week',
        trendType: 'neutral'
      },
      {
        label: 'Avg Intensity',
        value: '0',
        icon: 'pi-chart-line',
        color: '#f59e0b',
        trend: 'Out of 10',
        trendType: 'neutral'
      },
      {
        label: 'Current Streak',
        value: '0 days',
        icon: 'pi-bolt',
        color: '#ef4444',
        trend: 'Start today!',
        trendType: 'neutral'
      }
    ];
  }

  /**
   * Get empty weekly schedule
   */
  private getEmptyWeeklySchedule(): WeeklyScheduleDay[] {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const today = new Date();
    const startOfWeek = this.getStartOfWeek();

    return days.map((name, i) => {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);

      return {
        name,
        date,
        sessions: [],
        isToday: this.isSameDay(date, today)
      };
    });
  }

  /**
   * Get default workouts
   */
  private getDefaultWorkouts(): Workout[] {
    return [
      {
        type: 'speed',
        title: 'Speed Development',
        description: 'Acceleration and top-speed work',
        duration: '45 min',
        intensity: 'high',
        location: 'Track',
        icon: 'pi-bolt',
        iconBg: '#ef4444'
      },
      {
        type: 'strength',
        title: 'Strength Training',
        description: 'Lower body power and stability',
        duration: '60 min',
        intensity: 'medium',
        location: 'Gym',
        icon: 'pi-shield',
        iconBg: '#3b82f6'
      },
      {
        type: 'skills',
        title: 'Position Skills',
        description: 'Route running and technique',
        duration: '50 min',
        intensity: 'medium',
        location: 'Field',
        icon: 'pi-flag',
        iconBg: '#10b981'
      }
    ];
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private getStartOfWeek(): Date {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Adjust for Monday start
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  private getEndOfWeek(): Date {
    const start = this.getStartOfWeek();
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.toISOString().split('T')[0] === date2.toISOString().split('T')[0];
  }

  private isThisWeek(date: Date): boolean {
    const start = this.getStartOfWeek();
    const end = this.getEndOfWeek();
    return date >= start && date <= end;
  }

  private isLastWeek(date: Date): boolean {
    const start = this.getStartOfWeek();
    start.setDate(start.getDate() - 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return date >= start && date <= end;
  }

  private mapWorkoutTypeToSessionType(workoutType: string): SessionType {
    const typeMap: Record<string, SessionType> = {
      'speed': 'speed',
      'strength': 'strength',
      'skills': 'skills',
      'game': 'game',
      'recovery': 'recovery'
    };
    return typeMap[workoutType.toLowerCase()] || 'mixed';
  }

  private mapIntensityToNumber(intensity: 'low' | 'medium' | 'high'): number {
    const map = { low: 3, medium: 6, high: 9 };
    return map[intensity] || 5;
  }

  private mapNumberToIntensity(num: number): 'low' | 'medium' | 'high' {
    if (num <= 3) return 'low';
    if (num <= 6) return 'medium';
    return 'high';
  }

  private getWorkoutIcon(type: string): string {
    const iconMap: Record<string, string> = {
      'speed': 'pi-bolt',
      'strength': 'pi-shield',
      'skills': 'pi-flag',
      'recovery': 'pi-heart',
      'game': 'pi-trophy'
    };
    return iconMap[type] || 'pi-calendar';
  }

  private getWorkoutIconBg(type: string): string {
    const colorMap: Record<string, string> = {
      'speed': '#ef4444',
      'strength': '#3b82f6',
      'skills': '#10b981',
      'recovery': '#8b5cf6',
      'game': '#f59e0b'
    };
    return colorMap[type] || '#6b7280';
  }

  private getDefaultSessionTitle(type: string): string {
    const titleMap: Record<string, string> = {
      'speed': 'Speed Session',
      'strength': 'Strength Training',
      'skills': 'Skills Practice',
      'recovery': 'Recovery Session',
      'game': 'Game/Scrimmage'
    };
    return titleMap[type] || 'Training Session';
  }
}
