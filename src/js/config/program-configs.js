/**
 * Program Configuration
 * Centralized configuration for training programs
 * Enhanced with complete metadata from training documents
 */

export const OFFSEASON_PROGRAM_CONFIG = {
    id: 'offseason-wr-db',
    name: '14-Week WR/DB Program',
    title: 'COMPLETE FLAG FOOTBALL OFFSEASON TRAINING PROGRAM',
    subtitle: 'WR/DB PERFORMANCE OPTIMIZATION',
    description: 'Evidence-based 14-week periodized program for flag football WR/DB players. Build sprint speed, explosive power, posterior chain strength, and game-specific conditioning for 40+ sprints per game.',
    role: 'WR/DB',

    // Program Timeline
    startDate: '2025-11-17',
    endDate: '2026-02-28',
    durationWeeks: 14,

    // Training Details
    frequency: '5-6 days/week',
    sessionDuration: '60-90 minutes',
    weeklyHours: '5-9 hours',
    maxLoadLimit: '40% body weight external resistance',

    // Visual Identity
    icon: '🏆',
    color: 'var(--primary-500)',
    gradient: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',

    // Training Philosophy
    philosophy: [
        'Evidence-based sprint development (track & field research)',
        'Comprehensive posterior chain emphasis (injury prevention + power)',
        'Game-specific conditioning (40+ sprints per game capacity)',
        'Lower body chain optimization (ankle/knee/hip/quad health)',
        'Indoor-to-outdoor transition (December-February gym → March outdoor)'
    ],

    // Phases
    phases: [
        {
            id: 'foundation',
            name: 'Foundation Phase',
            weeks: '1-4',
            dateRange: 'December 1-28, 2025',
            icon: '🏗️',
            color: 'var(--success-500)',
            goals: [
                'Build structural strength and movement quality',
                'Establish posterior chain foundation (Nordic curls, RDLs)',
                'Develop aerobic base (tempo running)',
                'Learn sprint mechanics (drill work)',
                'Optimize lower body chain health',
                'Introduction to isometric training'
            ]
        },
        {
            id: 'strength',
            name: 'Strength Development',
            weeks: '5-8',
            dateRange: 'January 5 - February 1, 2026',
            icon: '💪',
            color: 'var(--primary-500)',
            goals: [
                'Build maximum strength (heavy loads)',
                'Increase sprint volume and intensity',
                'Advanced plyometric work (depth jumps, reactive bounds)',
                'Repeated sprint ability development',
                'Maximal isometric contractions',
                'Enhanced change of direction'
            ]
        },
        {
            id: 'power',
            name: 'Power Phase',
            weeks: '9-12',
            dateRange: 'February 2-28, 2026',
            icon: '⚡',
            color: 'var(--tertiary-500)',
            goals: [
                'Convert strength to explosive power',
                'Reactive abilities at maximum',
                'Game-specific conditioning peak',
                'Multi-directional power',
                'Competition preparation',
                'Outdoor transition begins (late phase)'
            ]
        },
        {
            id: 'competition',
            name: 'Competition Prep',
            weeks: '13-14',
            dateRange: 'March 2-15, 2026',
            icon: '🏆',
            color: 'var(--secondary-500)',
            goals: [
                'Outdoor transition complete',
                'Peak power maintenance',
                'Volume reduction (taper)',
                'Competition simulation',
                'Mental preparation',
                'Physical freshness for competition'
            ]
        }
    ],

    // Expected Results
    expectedResults: {
        sprint: {
            '10yard': '0.05-0.15s improvement',
            '20yard': '0.10-0.20s improvement',
            '40yard': '0.15-0.35s improvement'
        },
        power: {
            verticalJump: '+3-5 inches',
            broadJump: '+6-12 inches'
        },
        agility: {
            proAgility: '0.1-0.2s improvement',
            lDrill: '0.1-0.3s improvement'
        },
        strength: {
            nordicCurls: '+5-10 reps',
            squat: '+20-40% (within load limits)'
        }
    },

    // Key Features
    features: [
        '5-6 days/week training',
        '60-90 min sessions',
        'Max 40% BW load limit',
        '14-week periodization',
        'Indoor-to-outdoor transition',
        'Comprehensive injury prevention'
    ],

    // Assessment Schedule
    assessments: [
        { week: 4, name: 'Foundation Phase Assessment', type: 'comprehensive' },
        { week: 7, name: 'Mid-Strength Assessment', type: 'power-agility' },
        { week: 11, name: 'Power Phase Assessment', type: 'comprehensive' },
        { week: 14, name: 'Pre-Competition Validation', type: 'performance' }
    ]
};

export const QB_PROGRAM_CONFIG = {
    id: 'qb-elite',
    name: '14-Week Elite QB Program',
    title: 'COMPLETE QUARTERBACK FLAG FOOTBALL TRAINING PROGRAM',
    subtitle: '14-WEEK ELITE QB DEVELOPMENT',
    description: 'Comprehensive quarterback development program preparing you for the ultimate challenge: 320 throws in a weekend tournament while maintaining velocity and accuracy. Dual-track training combines lower body power with QB-specific arm development.',
    role: 'QB',

    // Program Timeline
    startDate: '2025-11-17',
    endDate: '2026-02-28',
    durationWeeks: 14,

    // Training Details
    approach: 'Dual-Track Training',
    frequency: '5-6 days/week',
    sessionDuration: '90-150 minutes',
    weeklyHours: '7-9 hours',

    // Visual Identity
    icon: '🎯',
    color: 'var(--primary-500)',
    gradient: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',

    // The Challenge
    challenge: {
        name: '320 Throws in a Weekend',
        gamesPerWeekend: 8,
        throwsPerGame: 40,
        totalThrows: 320,
        gameSpacing: '2 hours apart',
        days: 2,
        description: 'This requires EXTREME preparation - sustained accuracy under fatigue',
        demands: [
            'Sustained accuracy under extreme fatigue',
            'Maximum velocity maintained throughout',
            'Mental resilience for 8 games',
            'Effective recovery between games'
        ]
    },

    // Dual-Track Approach
    dualTrack: {
        description: 'Lower body foundation + QB-specific upper body specialization',
        track1: {
            name: 'Lower Body (Same as WR/DB Program)',
            focus: [
                'Sprint speed and acceleration',
                'Explosive power development',
                'Posterior chain strength',
                'Injury prevention',
                'Game conditioning'
            ]
        },
        track2: {
            name: 'Upper Body (QB-Specific)',
            focus: [
                'Arm strength and velocity',
                'Shoulder mobility and health',
                'Throwing endurance',
                'Hip flexor flexibility (critical for throwing)',
                'Back strength for power generation'
            ]
        }
    },

    // Evidence-Based Research
    evidenceBase: [
        {
            topic: 'Arm Strength & Velocity',
            source: 'Journal of Sports Sciences, 2019',
            keyFindings: [
                'Rotator cuff strength correlates with velocity (r=0.72)',
                'Posterior deltoid = primary velocity generator',
                'Triceps contribute 23% of ball velocity',
                'Biceps provide deceleration control'
            ],
            implication: 'Must train both acceleration AND deceleration'
        },
        {
            topic: 'Hip Flexor Integration',
            source: 'American Journal of Sports Medicine, 2020',
            keyFindings: [
                'Hip flexor flexibility increases stride length 8-12%',
                'Tight hip flexors reduce velocity 15-20%',
                'Hip mobility affects trunk rotation efficiency'
            ],
            implication: 'Hip flexibility is NON-NEGOTIABLE for QBs'
        },
        {
            topic: 'Shoulder Mobility',
            source: 'Sports Health, 2018',
            requirements: {
                externalRotation: '110-130° (optimal release)',
                horizontalAbduction: '45-55° (proper arm slot)',
                scapularTilt: '20-25° (healthy mechanics)'
            },
            implication: 'Daily mobility work is mandatory'
        },
        {
            topic: 'Back Strength Integration',
            source: 'Journal of Strength & Conditioning, 2021',
            keyFindings: [
                'Latissimus dorsi provides 18% of throwing power',
                'Thoracic extension adds 8-12 mph velocity',
                'Lower trap strength prevents scapular dyskinesis'
            ],
            implication: 'Back training = throwing power'
        },
        {
            topic: 'Fatigue Resistance',
            source: 'Sports Medicine, 2019',
            criticalData: [
                'Accuracy decreases 23% after 30 consecutive throws',
                'Velocity drops 8-12% in final quarter without conditioning',
                'Shoulder endurance training improves late-game performance 15%'
            ],
            implication: 'Endurance training is THE difference-maker'
        }
    ],

    // Phases (Aligned with WR/DB but QB-enhanced)
    phases: [
        {
            id: 'foundation',
            name: 'Foundation Phase',
            weeks: '1-4',
            dateRange: 'December 1-28, 2025',
            icon: '🏗️',
            color: 'var(--success-500)',
            lowerBodyGoals: [
                'Build lower body strength foundation',
                'Establish sprint mechanics',
                'Develop aerobic base',
                'Posterior chain development'
            ],
            qbGoals: [
                'Establish arm care protocols',
                'Develop shoulder mobility baseline',
                'Learn throwing mechanics',
                'Build throwing endurance base (100-200 throws/week)',
                'Optimize hip flexor flexibility'
            ]
        },
        {
            id: 'strength',
            name: 'Strength Development',
            weeks: '5-8',
            dateRange: 'January 5 - February 1, 2026',
            icon: '💪',
            color: 'var(--primary-500)',
            lowerBodyGoals: [
                'Maximum lower body strength',
                'Increased sprint volume',
                'Power development'
            ],
            qbGoals: [
                'Peak arm strength for velocity',
                'Advanced throwing endurance (150+ throws)',
                'Competition mobility maintenance',
                'Volume progression (300-450 throws/week)'
            ]
        },
        {
            id: 'power',
            name: 'Power Phase',
            weeks: '9-12',
            dateRange: 'February 2-28, 2026',
            icon: '⚡',
            color: 'var(--tertiary-500)',
            lowerBodyGoals: [
                'Convert strength to explosive power',
                'Game-specific conditioning',
                'Competition preparation'
            ],
            qbGoals: [
                'Peak throwing velocity',
                'Game-specific conditioning (200+ throws)',
                'Tournament simulation (320 throws)',
                'Mental preparation',
                'Volume peak (500-650 throws/week)'
            ]
        },
        {
            id: 'competition',
            name: 'Competition Prep',
            weeks: '13-14',
            dateRange: 'March 2-15, 2026',
            icon: '🏆',
            color: 'var(--secondary-500)',
            lowerBodyGoals: [
                'Outdoor transition',
                'Peak power maintenance',
                'Volume reduction (taper)'
            ],
            qbGoals: [
                'Maintain peak velocity',
                'Outdoor throwing adaptation',
                'Mental peak preparation',
                'Taper volume for freshness (200-400 throws/week)'
            ]
        }
    ],

    // Throwing Volume Progression
    throwingVolume: {
        description: 'Progressive throwing volume by phase',
        week1: '80-120 throws',
        week4: '120-180 throws',
        week8: '350-450 throws',
        week12: '500-650 throws',
        week14: '320 throws (taper)',
        byPhase: {
            foundation: '100-200 throws/week',
            strength: '300-450 throws/week',
            power: '500-650 throws/week',
            competition: '200-400 throws/week'
        }
    },

    // Expected Results
    expectedResults: {
        throwing: {
            velocity: '+8-15 mph average, +10-18 mph peak',
            accuracy: '+15-25% improvement',
            endurance: '+100-150% capacity (80→320 throws)'
        },
        physical: {
            shoulderHealth: '60-70% injury risk reduction',
            hipFlexibility: '+8-15% stride length',
            armStrength: '+30-40% overall',
            backStrength: '+35-50%'
        },
        sprint: {
            '10yard': '0.05-0.10s improvement',
            '40yard': '0.12-0.25s improvement',
            proAgility: '0.1-0.2s improvement'
        }
    },

    // Key Features
    features: [
        '14 weeks dual-track training',
        '320 throws capacity',
        'Evidence-based protocols',
        'Lower body + QB-specific',
        'Tournament simulation',
        'Arm care emphasis'
    ],

    // Assessment Schedule
    assessments: [
        { week: 4, name: 'Foundation Assessment', type: 'velocity-mobility-endurance', throws: 100 },
        { week: 7, name: 'Mid-Strength Assessment', type: 'power-velocity', throws: 150 },
        { week: 11, name: 'Power Peak Assessment', type: 'comprehensive-endurance', throws: 200 },
        { week: 13, name: 'Tournament Simulation', type: 'competition', throws: 160 },
        { week: 14, name: 'Pre-Competition Validation', type: 'final-check' }
    ],

    // Weekly Schedule
    weeklySchedule: {
        monday: 'Lower body strength + QB arm strength',
        tuesday: 'Sprint/bounds + QB shoulder mobility',
        wednesday: 'Recovery + QB hip flexor/back work',
        thursday: 'Lower power + QB throwing integration',
        friday: 'Speed/RSA + QB endurance training',
        saturday: 'Sprint work + QB throwing session',
        sunday: 'Complete recovery (lower + upper body)'
    }
};

