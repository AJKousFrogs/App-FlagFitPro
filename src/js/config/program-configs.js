/**
 * Program Configuration
 * Centralized configuration for training programs
 */

export const OFFSEASON_PROGRAM_CONFIG = {
    id: 'offseason-wr-db',
    name: '14-Week WR/DB Program',
    title: 'WR/DB PERFORMANCE OPTIMIZATION',
    description: 'Complete WR/DB performance optimization program',
    role: 'WR/DB',
    startDate: '2025-11-17',
    endDate: '2026-02-28',
    durationWeeks: 14,
    daysPerWeek: '5-6',
    minutesPerSession: '60-90',
    maxLoad: '40%',
    icon: '🏆',
    color: 'var(--primary-500)',
    features: [
        '5-6 Days/Week',
        '60-90 Minutes/Session',
        '40% Max Load (BW)'
    ]
};

export const QB_PROGRAM_CONFIG = {
    id: 'qb-elite',
    name: '14-Week Elite QB Program',
    title: 'ELITE QB DEVELOPMENT',
    description: 'Complete quarterback development for 320 throws/weekend',
    role: 'QB',
    startDate: '2025-11-17',
    endDate: '2026-02-28',
    durationWeeks: 14,
    icon: '🎯',
    color: 'var(--primary-500)',
    challenge: {
        gamesPerWeekend: 8,
        throwsPerGame: 40,
        totalThrows: 320,
        timeBetweenGames: '2hrs',
        description: 'This requires EXTREME preparation - sustained accuracy under fatigue'
    },
    features: [
        '14 weeks',
        '320 throws capacity',
        'Dual-track training'
    ]
};

