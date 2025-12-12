/**
 * Dataset Generator Service
 * 
 * Generates realistic test datasets for simulation and testing
 * Supports various sport-science data formats
 */

import { Injectable } from '@angular/core';
import { TRAINING_THRESHOLDS } from '../constants/training-thresholds';

export interface GeneratedDataset {
  data: Array<{ speed_m_s: number; distance_m: number }>;
  metadata: {
    totalEntries: number;
    durationMinutes: number;
    totalDistance: number;
    avgSpeed: number;
    maxSpeed: number;
    sprintCount: number;
    highSpeedDistance: number;
  };
}

export interface DatasetOptions {
  durationMinutes?: number; // Session duration
  samplingRateHz?: number; // Samples per second (default: 1 Hz)
  intensity?: 'low' | 'medium' | 'high' | 'game'; // Training intensity
  includeWarmup?: boolean; // Include warmup phase
  includeCooldown?: boolean; // Include cooldown phase
  athleteProfile?: 'recreational' | 'competitive' | 'elite'; // Athlete level
}

@Injectable({
  providedIn: 'root'
})
export class DatasetGeneratorService {
  private readonly HIGH_SPEED_THRESHOLD = TRAINING_THRESHOLDS.HIGH_SPEED_M_S;
  private readonly SPRINT_THRESHOLD = TRAINING_THRESHOLDS.SPRINT_M_S;

  /**
   * Generate a realistic training session dataset
   */
  generateDataset(options: DatasetOptions = {}): GeneratedDataset {
    const {
      durationMinutes = 90,
      samplingRateHz = 1,
      intensity = 'medium',
      includeWarmup = true,
      includeCooldown = true,
      athleteProfile = 'competitive'
    } = options;

    const totalSamples = durationMinutes * 60 * samplingRateHz;
    const data: Array<{ speed_m_s: number; distance_m: number }> = [];

    // Profile-based speed ranges
    const profileRanges = {
      recreational: { max: 6.5, avg: 3.5 },
      competitive: { max: 8.5, avg: 4.5 },
      elite: { max: 10.0, avg: 5.5 }
    };

    const range = profileRanges[athleteProfile];
    const warmupSamples = includeWarmup ? Math.floor(totalSamples * 0.15) : 0;
    const cooldownSamples = includeCooldown ? Math.floor(totalSamples * 0.1) : 0;
    const mainSamples = totalSamples - warmupSamples - cooldownSamples;

    // Warmup phase (gradual increase)
    if (includeWarmup) {
      for (let i = 0; i < warmupSamples; i++) {
        const progress = i / warmupSamples;
        const speed = this.generateSpeed(progress * range.avg, range.avg * 0.3, intensity);
        const distance = speed / samplingRateHz; // Distance per second
        data.push({ speed_m_s: speed, distance_m: distance });
      }
    }

    // Main training phase
    const intensityMultipliers = {
      low: 0.7,
      medium: 1.0,
      high: 1.3,
      game: 1.5
    };

    const multiplier = intensityMultipliers[intensity];
    const baseSpeed = range.avg * multiplier;

    for (let i = 0; i < mainSamples; i++) {
      // Create realistic variation with occasional sprints
      let speed: number;
      
      // Simulate interval training or game-like patterns
      if (intensity === 'game' || intensity === 'high') {
        // More variable with sprints
        if (Math.random() < 0.05) {
          // Sprint effort (5% chance)
          speed = this.generateSpeed(range.max * 0.9, range.max * 0.2, intensity);
        } else if (Math.random() < 0.15) {
          // High-speed running (15% chance)
          speed = this.generateSpeed(this.HIGH_SPEED_THRESHOLD + 1, 1.5, intensity);
        } else {
          // Normal running
          speed = this.generateSpeed(baseSpeed, baseSpeed * 0.4, intensity);
        }
      } else {
        // Steady training with occasional bursts
        if (Math.random() < 0.02) {
          speed = this.generateSpeed(range.max * 0.8, range.max * 0.3, intensity);
        } else {
          speed = this.generateSpeed(baseSpeed, baseSpeed * 0.3, intensity);
        }
      }

      const distance = speed / samplingRateHz;
      data.push({ speed_m_s: speed, distance_m: distance });
    }

    // Cooldown phase (gradual decrease)
    if (includeCooldown) {
      for (let i = 0; i < cooldownSamples; i++) {
        const progress = 1 - (i / cooldownSamples);
        const speed = this.generateSpeed(progress * range.avg * 0.5, range.avg * 0.2, intensity);
        const distance = speed / samplingRateHz;
        data.push({ speed_m_s: speed, distance_m: distance });
      }
    }

    // Calculate metadata
    const totalDistance = data.reduce((sum, entry) => sum + entry.distance_m, 0);
    const avgSpeed = data.reduce((sum, entry) => sum + entry.speed_m_s, 0) / data.length;
    const maxSpeed = Math.max(...data.map(entry => entry.speed_m_s));
    const sprintCount = data.filter(entry => entry.speed_m_s >= this.SPRINT_THRESHOLD).length;
    const highSpeedDistance = data
      .filter(entry => entry.speed_m_s >= this.HIGH_SPEED_THRESHOLD)
      .reduce((sum, entry) => sum + entry.distance_m, 0);

    return {
      data,
      metadata: {
        totalEntries: data.length,
        durationMinutes,
        totalDistance: Math.round(totalDistance * 100) / 100,
        avgSpeed: Math.round(avgSpeed * 100) / 100,
        maxSpeed: Math.round(maxSpeed * 100) / 100,
        sprintCount,
        highSpeedDistance: Math.round(highSpeedDistance * 100) / 100
      }
    };
  }

  /**
   * Generate speed with realistic variation
   */
  private generateSpeed(base: number, variation: number, intensity: string): number {
    // Use normal distribution approximation
    const random = (Math.random() + Math.random() + Math.random() + Math.random()) / 4;
    const offset = (random - 0.5) * 2 * variation;
    const speed = Math.max(0, base + offset);
    
    // Ensure speed doesn't exceed realistic maximums
    return Math.min(speed, 12.0);
  }

  /**
   * Generate multiple sessions for a week
   */
  generateWeeklyDataset(athleteProfile: 'recreational' | 'competitive' | 'elite' = 'competitive'): GeneratedDataset[] {
    const sessions = [
      { day: 'Monday', intensity: 'high' as const, duration: 90 },
      { day: 'Tuesday', intensity: 'low' as const, duration: 60 },
      { day: 'Wednesday', intensity: 'medium' as const, duration: 75 },
      { day: 'Thursday', intensity: 'high' as const, duration: 90 },
      { day: 'Friday', intensity: 'low' as const, duration: 45 },
      { day: 'Saturday', intensity: 'game' as const, duration: 120 },
      { day: 'Sunday', intensity: 'low' as const, duration: 30 }
    ];

    return sessions.map(session => 
      this.generateDataset({
        durationMinutes: session.duration,
        intensity: session.intensity,
        athleteProfile,
        includeWarmup: true,
        includeCooldown: true
      })
    );
  }

  /**
   * Generate dataset in JSON string format
   */
  generateDatasetJSON(options: DatasetOptions = {}): string {
    const dataset = this.generateDataset(options);
    return JSON.stringify(dataset.data, null, 2);
  }
}

