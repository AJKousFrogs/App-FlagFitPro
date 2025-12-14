import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { StatisticsCalculationService } from './statistics-calculation.service';

describe('StatisticsCalculationService', () => {
  let service: StatisticsCalculationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StatisticsCalculationService);
  });

  describe('Completion Percentage', () => {
    it('should calculate standard completion percentage', () => {
      const result = service.calculateCompletionPercentage(10, 20);
      expect(result.percentage).toBe(50.0);
    });

    it('should handle repeating decimals correctly', () => {
      const result = service.calculateCompletionPercentage(1, 3);
      expect(result.percentage).toBe(33.3);
    });

    it('should throw on negative values', () => {
      expect(() => service.calculateCompletionPercentage(-1, 10))
        .toThrowError('Stats cannot be negative');
    });

    it('should throw when completions exceed attempts', () => {
      expect(() => service.calculateCompletionPercentage(20, 10))
        .toThrowError('Completions cannot exceed attempts');
    });

    it('should return 0 for zero attempts', () => {
      const result = service.calculateCompletionPercentage(0, 10);
      expect(result.percentage).toBe(0);
    });

    it('should return 100 for perfect completion', () => {
      const result = service.calculateCompletionPercentage(10, 10);
      expect(result.percentage).toBe(100.0);
    });

    it('should throw on non-integer values', () => {
      expect(() => service.calculateCompletionPercentage(10.5, 20))
        .toThrowError('Completion stats must be integers');
    });
  });

  describe('Drop Rate Calculation', () => {
    it('should classify critical drop rate', () => {
      const result = service.calculateDropRate(5, 25); // 20% drop rate
      expect(result.severity).toBe('critical');
      expect(result.rate).toBe(20.0);
    });

    it('should classify low drop rate', () => {
      const result = service.calculateDropRate(1, 50); // 2% drop rate
      expect(result.severity).toBe('low');
      expect(result.rate).toBe(2.0);
    });

    it('should provide recommendations for each level', () => {
      const critical = service.calculateDropRate(5, 20);
      const low = service.calculateDropRate(1, 50);

      expect(critical.recommendation).toContain('hand placement');
      expect(low.recommendation).toContain('Excellent');
    });

    it('should throw when drops exceed targets', () => {
      expect(() => service.calculateDropRate(10, 5))
        .toThrowError('Drops cannot exceed targets');
    });

    it('should return 0 for zero targets', () => {
      const result = service.calculateDropRate(0, 0);
      expect(result.rate).toBe(0);
      expect(result.severity).toBe('low');
    });
  });

  describe('Flag Pull Success Rate with Confidence', () => {
    it('should calculate with 95% confidence interval', () => {
      const result = service.calculateFlagPullSuccessRate(45, 50);

      expect(result.rate).toBe(90.0);
      expect(result.confidence95[0]).toBeLessThan(90);
      expect(result.confidence95[1]).toBeGreaterThan(90);
    });

    it('should flag inadequate sample size', () => {
      const result = service.calculateFlagPullSuccessRate(2, 3);

      expect(result.sampleSizeAdequate).toBe(false);
    });

    it('should return correct defensive grade', () => {
      const elite = service.calculateFlagPullSuccessRate(90, 100);
      const poor = service.calculateFlagPullSuccessRate(50, 100);

      expect(elite.defensiveGrade).toContain('Elite');
      expect(poor.defensiveGrade).toContain('Improvement');
    });

    it('should handle zero attempts', () => {
      const result = service.calculateFlagPullSuccessRate(0, 0);
      expect(result.rate).toBe(0);
      expect(result.sampleSizeAdequate).toBe(false);
      expect(result.defensiveGrade).toBe('Insufficient Data');
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

      const result = service.calculateStreak(
        workouts,
        new Date('2025-12-07')
      );

      expect(result.currentStreak).toBe(3); // Dec 7, 6, 5
      expect(result.longestStreak).toBeGreaterThanOrEqual(3);
    });

    it('should handle timezone changes correctly', () => {
      // Test with dates across timezone boundary
      const workouts = [
        { date: new Date('2025-12-08T02:00:00Z'), type: 'speed' },
        { date: new Date('2025-12-07T22:00:00Z'), type: 'strength' }
      ];

      const result = service.calculateStreak(
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

      const result = service.calculateStreak(
        workouts,
        new Date('2025-12-07')
      );

      expect(result.currentStreak).toBe(2); // Only 2 unique days
    });

    it('should return zero streak for empty array', () => {
      const result = service.calculateStreak([], new Date());
      expect(result.currentStreak).toBe(0);
      expect(result.longestStreak).toBe(0);
    });
  });

  describe('Weekly Stats Calculation', () => {
    it('should calculate weekly stats with data quality', () => {
      const workouts = [
        { date: new Date('2025-12-07'), type: 'speed', duration: 1.0 },
        { date: new Date('2025-12-06'), type: 'strength', duration: 1.5 },
        { date: new Date('2025-12-05'), type: 'agility' } // Missing duration
      ];

      const result = service.calculateWeeklyStats(
        workouts,
        new Date('2025-12-07')
      );

      expect(result.sessionsCompleted).toBe(3);
      expect(result.totalHours).toBeGreaterThan(0);
      expect(result.dataQuality).toBeDefined();
      expect(result.confidenceLevel).toBeGreaterThanOrEqual(0);
      expect(result.confidenceLevel).toBeLessThanOrEqual(100);
    });

    it('should classify data quality correctly', () => {
      const completeData = [
        { date: new Date(), type: 'speed', duration: 1.0 },
        { date: new Date(), type: 'strength', duration: 1.5 },
        { date: new Date(), type: 'agility', duration: 0.5 }
      ];

      const result = service.calculateWeeklyStats(completeData);
      expect(result.dataQuality).toBe('complete');
    });
  });

  describe('BMI Calculation', () => {
    it('should calculate BMI correctly', () => {
      const result = service.calculateBMI(75, 180); // 75kg, 180cm
      expect(result.bmi).toBeGreaterThan(20);
      expect(result.bmi).toBeLessThan(25);
      expect(result.category).toBeDefined();
    });

    it('should detect outliers', () => {
      const result = service.calculateBMI(50, 200);
      expect(result.isOutlier).toBe(false); // Normal range
    });

    it('should throw on invalid weight', () => {
      expect(() => service.calculateBMI(20, 180))
        .toThrowError('Weight must be between 30-300 kg');
    });

    it('should throw on invalid height', () => {
      expect(() => service.calculateBMI(75, 50))
        .toThrowError('Height must be between 100-250 cm');
    });
  });

  describe('Body Fat Calculation', () => {
    it('should calculate body fat for males', () => {
      const result = service.calculateBodyFat(85, 40, undefined, 180, 'male');
      expect(result.bodyFatPercentage).toBeGreaterThan(0);
      expect(result.bodyFatPercentage).toBeLessThan(60);
      expect(result.category).toBeDefined();
    });

    it('should calculate body fat for females', () => {
      const result = service.calculateBodyFat(75, 35, 95, 165, 'female');
      expect(result.bodyFatPercentage).toBeGreaterThan(0);
      expect(result.bodyFatPercentage).toBeLessThan(60);
      expect(result.category).toBeDefined();
    });

    it('should require hips for females', () => {
      expect(() => service.calculateBodyFat(75, 35, undefined, 165, 'female'))
        .toThrowError('Hip measurement required');
    });

    it('should validate waist measurement', () => {
      expect(() => service.calculateBodyFat(30, 40, undefined, 180, 'male'))
        .toThrowError('Waist measurement invalid');
    });
  });
});

