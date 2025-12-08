/**
 * Comprehensive test suite for Statistics Calculation Service (JavaScript)
 * Run with: npm test or vitest
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { statisticsCalculationService } from '../src/js/services/statisticsCalculationService.js';

describe('StatisticsCalculationService - JavaScript', () => {
  describe('Completion Percentage', () => {
    it('should calculate standard completion percentage', () => {
      const result = statisticsCalculationService.calculateCompletionPercentage(10, 20);
      expect(result.percentage).toBe(50.0);
    });

    it('should handle repeating decimals correctly', () => {
      const result = statisticsCalculationService.calculateCompletionPercentage(1, 3);
      expect(result.percentage).toBe(33.3);
    });

    it('should throw on negative values', () => {
      expect(() => statisticsCalculationService.calculateCompletionPercentage(-1, 10))
        .toThrow('Stats cannot be negative');
    });

    it('should throw when completions exceed attempts', () => {
      expect(() => statisticsCalculationService.calculateCompletionPercentage(20, 10))
        .toThrow('Completions cannot exceed attempts');
    });

    it('should return 0 for zero attempts', () => {
      const result = statisticsCalculationService.calculateCompletionPercentage(0, 10);
      expect(result.percentage).toBe(0);
    });

    it('should return 100 for perfect completion', () => {
      const result = statisticsCalculationService.calculateCompletionPercentage(10, 10);
      expect(result.percentage).toBe(100.0);
    });
  });

  describe('Drop Rate Severity', () => {
    it('should classify critical drop rate', () => {
      const result = statisticsCalculationService.calculateDropRate(5, 25); // 20% drop rate
      expect(result.severity).toBe('critical');
    });

    it('should classify low drop rate', () => {
      const result = statisticsCalculationService.calculateDropRate(1, 50); // 2% drop rate
      expect(result.severity).toBe('low');
    });

    it('should provide recommendations for each level', () => {
      const critical = statisticsCalculationService.calculateDropRate(5, 20);
      const low = statisticsCalculationService.calculateDropRate(1, 50);

      expect(critical.recommendation).toContain('hand placement');
      expect(low.recommendation).toContain('Excellent');
    });
  });

  describe('Flag Pull Success Rate with Confidence', () => {
    it('should calculate with 95% confidence interval', () => {
      const result = statisticsCalculationService.calculateFlagPullSuccessRate(45, 50);

      expect(result.rate).toBe(90.0);
      expect(result.confidence95[0]).toBeLessThan(90);
      expect(result.confidence95[1]).toBeGreaterThan(90);
    });

    it('should flag inadequate sample size', () => {
      const result = statisticsCalculationService.calculateFlagPullSuccessRate(2, 3);

      expect(result.sampleSizeAdequate).toBe(false);
    });

    it('should return correct defensive grade', () => {
      const elite = statisticsCalculationService.calculateFlagPullSuccessRate(90, 100);
      const poor = statisticsCalculationService.calculateFlagPullSuccessRate(50, 100);

      expect(elite.defensiveGrade).toContain('Elite');
      expect(poor.defensiveGrade).toContain('Improvement');
    });
  });

  describe('Streak Calculation', () => {
    it('should calculate current streak correctly', () => {
      const workouts = [
        { date: new Date('2025-12-07'), type: 'speed' },
        { date: new Date('2025-12-06'), type: 'strength' },
        { date: new Date('2025-12-05'), type: 'agility' },
        { date: new Date('2025-12-03'), type: 'endurance' } // 2-day gap
      ];

      const result = statisticsCalculationService.calculateStreak(
        workouts,
        new Date('2025-12-07')
      );

      expect(result.currentStreak).toBe(3); // Dec 7, 6, 5
      expect(result.longestStreak).toBeGreaterThanOrEqual(3);
    });

    it('should handle timezone changes correctly', () => {
      const workouts = [
        { date: new Date('2025-12-08T02:00:00Z'), type: 'speed' },
        { date: new Date('2025-12-07T22:00:00Z'), type: 'strength' }
      ];

      const result = statisticsCalculationService.calculateStreak(
        workouts,
        new Date('2025-12-08')
      );

      expect(result.currentStreak).toBe(2);
    });

    it('should eliminate same-day duplicate workouts', () => {
      const workouts = [
        { date: new Date('2025-12-07T08:00:00'), type: 'speed' },
        { date: new Date('2025-12-07T17:00:00'), type: 'strength' },
        { date: new Date('2025-12-06'), type: 'agility' }
      ];

      const result = statisticsCalculationService.calculateStreak(
        workouts,
        new Date('2025-12-07')
      );

      expect(result.currentStreak).toBe(2); // Only 2 unique days
    });
  });

  describe('Weekly Stats Calculation', () => {
    it('should calculate weekly stats with data quality', () => {
      const workouts = [
        { date: new Date('2025-12-07'), type: 'speed', duration: 1.0 },
        { date: new Date('2025-12-06'), type: 'strength', duration: 1.5 },
        { date: new Date('2025-12-05'), type: 'agility' } // Missing duration
      ];

      const result = statisticsCalculationService.calculateWeeklyStats(
        workouts,
        new Date('2025-12-07')
      );

      expect(result.sessionsCompleted).toBe(3);
      expect(result.totalHours).toBeGreaterThan(0);
      expect(result.dataQuality).toBeDefined();
      expect(result.confidenceLevel).toBeGreaterThanOrEqual(0);
      expect(result.confidenceLevel).toBeLessThanOrEqual(100);
    });
  });
});

