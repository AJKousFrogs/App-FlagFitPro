/**
 * Shared Training Protocols
 * Universal warm-ups, recovery routines, and daily protocols
 * Used by both WR/DB and QB programs
 */

/**
 * 15-Minute Daily Morning Mobility Routine
 * Should be done every morning, regardless of training day
 * All levels - critical for injury prevention
 */
export const MORNING_MOBILITY_ROUTINE = {
    title: "15 Minute Full Body DAILY Mobility Routine",
    description: "Complete this every morning to optimize movement quality and prevent injuries",
    duration: 15,
    frequency: "Daily (7 days/week)",
    level: "All levels",

    exercises: [
        {
            name: "Hip Circles",
            duration: "10 each direction",
            sets: 1,
            focus: "Hip mobility and activation",
            cues: ["Control the movement", "Full range of motion", "Both directions"]
        },
        {
            name: "Leg Swings (all directions)",
            duration: "10 each",
            sets: 1,
            variations: ["Front-to-back", "Side-to-side", "Diagonal"],
            focus: "Dynamic hip mobility",
            cues: ["Relaxed leg", "Control with core", "Gradually increase range"]
        },
        {
            name: "Ankle Circles",
            duration: "10 each direction",
            sets: 1,
            focus: "Ankle mobility",
            cues: ["Point toes and rotate", "Both directions", "Each ankle"]
        },
        {
            name: "Dynamic Quad Stretches",
            duration: "30s each",
            sets: 1,
            focus: "Quadriceps flexibility",
            cues: ["Pull heel to glute", "Keep knees together", "Stand tall"]
        },
        {
            name: "Walking Lunges",
            reps: "10 each leg",
            sets: 1,
            focus: "Hip flexor and quad activation",
            cues: ["Back knee nearly touches ground", "Upright torso", "Control the movement"]
        },
        {
            name: "World's Greatest Stretch",
            reps: "5 each side",
            sets: 1,
            focus: "Full body mobility",
            cues: [
                "Lunge position",
                "Elbow to instep",
                "Rotate and reach up",
                "Hold each position"
            ],
            description: "The single best full-body mobility exercise"
        },
        {
            name: "Glute Bridges",
            reps: 10,
            sets: 2,
            focus: "Glute activation",
            cues: ["Squeeze glutes at top", "Hold 2 seconds", "Controlled descent"]
        },
        {
            name: "Bodyweight Squats",
            reps: 10,
            sets: 1,
            focus: "Movement pattern reinforcement",
            cues: ["Chest up", "Knees track over toes", "Full depth if possible"]
        }
    ],

    notes: [
        "This is NON-NEGOTIABLE for injury prevention",
        "Do it even on rest days",
        "Takes only 15 minutes - no excuses",
        "Best done right after waking up"
    ]
};

/**
 * Universal Warm-Up Protocol
 * Used before EVERY training session
 * 15-20 minutes
 */
export const UNIVERSAL_WARMUP = {
    title: "Universal Warm-Up (Every Session)",
    description: "Complete warm-up protocol for all training sessions",
    duration: "15-20 minutes",
    phases: [
        {
            title: "Phase 1: General Activation",
            duration: 5,
            purpose: "Increase heart rate, body temperature, and neural activation",
            exercises: [
                {
                    name: "Light jog",
                    duration: "2 minutes",
                    intensity: "50-60% effort",
                    cues: ["Relaxed pace", "Focus on breathing", "Warm up gradually"]
                },
                {
                    name: "Jump rope",
                    duration: "2 minutes",
                    intensity: "Moderate",
                    cues: ["Light on feet", "Relaxed shoulders", "Rhythm focus"]
                },
                {
                    name: "Dynamic stretching",
                    duration: "1 minute",
                    exercises: ["Arm swings", "Leg swings", "Torso rotations"],
                    cues: ["Controlled movements", "Gradually increase range"]
                },
                {
                    name: "Plank",
                    duration: "3 minutes total",
                    breakdown: [
                        { variation: "Standard plank", duration: "1.5 minutes" },
                        { variation: "Right arm side plank", duration: "45s" },
                        { variation: "Left arm side plank", duration: "45s" }
                    ],
                    cues: ["Straight body line", "Engaged core", "Control breathing"]
                },
                {
                    name: "Copenhagen Plank",
                    duration: "45s each side",
                    sets: 1,
                    focus: "Adductor and core strength",
                    cues: ["Top leg on bench", "Straight body", "Hold position"],
                    notes: ["Advanced exercise", "Critical for injury prevention"]
                }
            ]
        },
        {
            title: "Phase 2: Lower Body Chain Activation",
            duration: 10,
            purpose: "Activate ankle, knee, hip, and quad complex",
            sections: [
                {
                    title: "Ankle Complex",
                    duration: 2,
                    importance: "Foundation of all movement",
                    exercises: [
                        {
                            name: "Ankle circles",
                            reps: "10 each direction",
                            cues: ["Point toes", "Full circles", "Both ankles"]
                        },
                        {
                            name: "Calf raises",
                            sets: 2,
                            reps: 10,
                            tempo: "2s up, 2s down",
                            cues: ["Full range", "Control descent", "Balance"]
                        },
                        {
                            name: "Tibialis raises",
                            sets: 2,
                            reps: 10,
                            focus: "Anterior lower leg",
                            cues: ["Toes to shins", "Control movement", "Feel the burn"]
                        },
                        {
                            name: "Single-leg balance",
                            duration: "20s each",
                            progression: ["Eyes open", "Eyes closed (advanced)"],
                            cues: ["Stable ankle", "Slight knee bend", "Engage core"]
                        }
                    ]
                },
                {
                    title: "Knee Stability",
                    duration: 2,
                    importance: "Prevent knee injuries",
                    exercises: [
                        {
                            name: "Mini-band walks",
                            sets: 2,
                            reps: 10,
                            directions: ["Lateral", "Forward", "Backward"],
                            cues: ["Athletic stance", "Constant tension", "Controlled steps"]
                        },
                        {
                            name: "Single-leg mini squats",
                            sets: 2,
                            reps: "6 each",
                            cues: ["Knee tracks over toe", "Controlled descent", "Balance"]
                        }
                    ]
                },
                {
                    title: "Hip Complex",
                    duration: 3,
                    importance: "Power source for all movement",
                    exercises: [
                        {
                            name: "Hip circles",
                            reps: "10 each direction",
                            cues: ["Full range", "Controlled", "Both hips"]
                        },
                        {
                            name: "Leg swings (all directions)",
                            reps: "10 each",
                            variations: ["Sagittal", "Frontal", "Transverse"],
                            cues: ["Relaxed leg", "Increase range gradually"]
                        },
                        {
                            name: "Glute bridges",
                            sets: 2,
                            reps: 10,
                            cues: ["Squeeze glutes", "Full hip extension", "Hold top"]
                        }
                    ]
                },
                {
                    title: "Quadriceps Prep",
                    duration: 3,
                    importance: "Prepare for loading",
                    exercises: [
                        {
                            name: "Walking lunges",
                            reps: "10 each leg",
                            cues: ["Upright torso", "Back knee down", "Control"]
                        },
                        {
                            name: "Dynamic quad stretches",
                            duration: "30s each",
                            cues: ["Pull heel to glute", "Stand tall", "Both legs"]
                        },
                        {
                            name: "Bodyweight squats",
                            reps: 10,
                            cues: ["Full depth", "Chest up", "Knees out"]
                        },
                        {
                            name: "Sled push or treadmill",
                            options: [
                                { exercise: "Sled push", distance: "100m" },
                                { exercise: "Treadmill forward", distance: "1km" },
                                { exercise: "Treadmill backpedal", distance: "500m" }
                            ],
                            purpose: "General conditioning warm-up",
                            cues: ["Moderate pace", "Focus on form", "Breathing rhythm"]
                        }
                    ]
                }
            ]
        },
        {
            title: "Phase 3: Sprint Drill Series",
            duration: 5,
            purpose: "Activate sprint mechanics and neural patterns",
            applicability: "When sprint work is planned",
            exercises: [
                {
                    name: "A-march",
                    sets: 2,
                    distance: "20m",
                    focus: "Knee drive mechanics",
                    cues: ["High knee", "Dorsiflexed ankle", "Tall posture", "Arm drive"]
                },
                {
                    name: "A-skip",
                    sets: 2,
                    distance: "20m",
                    focus: "Rhythm and coordination",
                    cues: ["Skip pattern", "High knee", "Ankle dorsiflexion"]
                },
                {
                    name: "B-skip",
                    sets: 2,
                    distance: "20m",
                    focus: "Pawing action",
                    cues: ["Extend leg", "Pull back to ground", "Aggressive contact"]
                },
                {
                    name: "C-skip",
                    sets: 2,
                    distance: "20m",
                    focus: "Circular motion",
                    cues: ["Knee up", "Out", "Down", "Back"]
                },
                {
                    name: "High knees",
                    sets: 2,
                    distance: "20m",
                    focus: "Knee drive frequency",
                    cues: ["Fast turnover", "Tall posture", "On toes"]
                },
                {
                    name: "Butt kicks",
                    sets: 2,
                    distance: "20m",
                    focus: "Hamstring recovery",
                    cues: ["Heel to glute", "Fast turnover", "Stay tall"]
                },
                {
                    name: "Scissors",
                    sets: 2,
                    distance: "20m",
                    focus: "Leg cycling",
                    cues: ["Alternate legs", "Quick transitions", "Arm coordination"]
                },
                {
                    name: "Toy soldiers",
                    sets: 2,
                    distance: "20m",
                    focus: "Hamstring flexibility dynamic",
                    cues: ["Straight leg", "Touch toe", "Controlled"]
                },
                {
                    name: "Hamstring stretch",
                    duration: "30s each leg",
                    cues: ["Gentle stretch", "Breathe", "No bouncing"]
                }
            ]
        }
    ],

    notes: [
        "NEVER skip the warm-up - this is injury prevention",
        "Takes 15-20 minutes but saves months of injury time",
        "Adjust intensity based on session to follow",
        "If short on time, minimum is Phase 1 + 2 (15 min)"
    ]
};

/**
 * Sunday Recovery Protocol
 * Complete rest and recovery day
 * 45-60 minutes dedicated recovery
 */
export const SUNDAY_RECOVERY_PROTOCOL = {
    title: "Sunday Recovery Protocol",
    description: "Comprehensive weekly recovery routine - NON-NEGOTIABLE",
    duration: "45-60 minutes",
    frequency: "Every Sunday",
    importance: "Recovery IS training - this is where adaptation happens",

    sections: [
        {
            title: "Lower Body Chain Recovery",
            duration: "25-30 minutes",
            purpose: "Address accumulated fatigue from week of training",

            exercises: [
                {
                    category: "Ankle Mobility",
                    exercises: [
                        {
                            name: "Calf stretching",
                            sets: 3,
                            duration: "45s each",
                            variations: ["Straight leg (gastrocnemius)", "Bent knee (soleus)"],
                            cues: ["Deep stretch", "Breathe into it", "Both legs"]
                        },
                        {
                            name: "Tibialis stretching",
                            sets: 2,
                            duration: "30s each",
                            cues: ["Point toes", "Gentle pressure", "Feel front of shin"]
                        }
                    ]
                },
                {
                    category: "Knee Recovery",
                    exercises: [
                        {
                            name: "Quad stretching",
                            sets: 3,
                            duration: "45s each",
                            variations: ["Standing", "Lying", "Couch stretch"],
                            cues: ["Pull heel to glute", "Keep knees together", "Tall posture"]
                        },
                        {
                            name: "Hamstring stretching",
                            sets: 3,
                            duration: "45s each",
                            variations: ["Standing", "Seated", "Lying"],
                            cues: ["Straight leg", "Hinge at hip", "Feel the stretch"]
                        },
                        {
                            name: "Foam rolling",
                            focus: "Quads, hamstrings, IT band",
                            duration: "5 minutes",
                            cues: ["Slow rolling", "Pause on tender spots", "Breathe through it"]
                        }
                    ]
                },
                {
                    category: "Hip Complex",
                    exercises: [
                        {
                            name: "Hip flexor stretching",
                            sets: 4,
                            duration: "45s each",
                            importance: "CRITICAL - tight hip flexors limit performance",
                            cues: ["Lunge position", "Drive hips forward", "Tall torso", "Deep stretch"]
                        },
                        {
                            name: "Couch stretch",
                            sets: 2,
                            duration: "90s each leg",
                            importance: "The king of hip flexor stretches",
                            setup: "Rear foot elevated on couch/bench",
                            cues: [
                                "Front foot planted",
                                "Rear knee on ground",
                                "Drive hips forward",
                                "Feel DEEP stretch in front of hip",
                                "Can use hands for support initially"
                            ],
                            note: "This stretch is life-changing for athletes"
                        },
                        {
                            name: "Pigeon pose",
                            sets: 2,
                            duration: "90s each side",
                            focus: "Hip external rotation and glutes",
                            cues: [
                                "Front leg bent 90°",
                                "Back leg straight",
                                "Square hips",
                                "Lean forward for deeper stretch"
                            ]
                        },
                        {
                            name: "90/90 hip stretches",
                            sets: 2,
                            duration: "60s each position",
                            variations: ["Both positions"],
                            focus: "Hip rotation mobility",
                            cues: ["Both knees at 90°", "Upright torso", "Hold position"]
                        },
                        {
                            name: "World's greatest stretch",
                            sets: 2,
                            reps: "5 each side",
                            focus: "Dynamic full body mobility",
                            cues: ["Lunge", "Elbow to instep", "Rotate up", "Hold each"]
                        }
                    ]
                }
            ]
        },
        {
            title: "Additional Recovery Modalities",
            duration: "20-30 minutes",
            purpose: "Enhance recovery and prepare for next week",

            activities: [
                {
                    name: "Foam rolling",
                    duration: "15 minutes",
                    focus: "Full body",
                    areas: [
                        "Calves",
                        "Hamstrings",
                        "Quads",
                        "IT band",
                        "Glutes",
                        "Lower back",
                        "Upper back"
                    ],
                    technique: "Slow, controlled, pause on tender spots"
                },
                {
                    name: "Light walk",
                    duration: "20 minutes",
                    intensity: "Easy pace",
                    purpose: "Active recovery, blood flow",
                    cues: ["Relaxed", "Enjoy movement", "Light conversation pace"]
                },
                {
                    name: "Visualization/mental training",
                    duration: "10 minutes",
                    purpose: "Mental recovery and preparation",
                    activities: [
                        "Review week's training",
                        "Visualize upcoming week",
                        "Mental rehearsal of key movements",
                        "Gratitude practice"
                    ]
                },
                {
                    name: "Compression therapy",
                    optional: true,
                    duration: "15-30 minutes",
                    equipment: "Compression boots or tight leggings",
                    benefits: "Enhanced blood flow and recovery"
                },
                {
                    name: "Massage gun",
                    optional: true,
                    duration: "10-15 minutes",
                    preference: "Heated if possible",
                    focus: "Major muscle groups, tender areas"
                },
                {
                    name: "TENS/EMS",
                    optional: true,
                    duration: "15-20 minutes",
                    purpose: "Muscle recovery and pain relief",
                    note: "Follow device instructions"
                }
            ]
        }
    ],

    nutrition: {
        title: "Sunday Nutrition Focus",
        emphasis: "Recovery and preparation",
        guidelines: [
            "Extra protein intake (muscle repair)",
            "Hydration emphasis (3-4L water minimum)",
            "Anti-inflammatory foods (berries, leafy greens, fatty fish)",
            "Recovery supplementation if using (protein, omega-3s)",
            "Prepare meals for upcoming week"
        ]
    },

    mentalRecovery: {
        title: "Mental Recovery Activities",
        importance: "Mental recovery is as important as physical",
        activities: [
            "Reflect on week's progress",
            "Celebrate wins (big and small)",
            "Identify lessons learned",
            "Set intentions for upcoming week",
            "Enjoy rest - guilt-free recovery day"
        ]
    },

    notes: [
        "This is your most important training session of the week",
        "Recovery IS training - this is where you get stronger",
        "Don't skip this - it prevents overtraining and injury",
        "Quality rest leads to quality performance",
        "Take the full 45-60 minutes - you earned it"
    ]
};

/**
 * Volume Guidelines
 * Progressive volume across training phases
 */
export const VOLUME_GUIDELINES = {
    sprint: {
        title: "Sprint Volume by Phase",
        description: "Ground contacts per week",
        phases: {
            weeks_1_4: {
                phase: "Foundation",
                volume: "40-60 ground contacts/week",
                condition: "If indoor space available",
                focus: "Mechanics and technique"
            },
            weeks_5_8: {
                phase: "Strength Development",
                volume: "80-120 ground contacts/week",
                focus: "Increased volume and intensity"
            },
            weeks_9_12: {
                phase: "Power Phase",
                volume: "120-180 ground contacts/week",
                focus: "Maximum volume and speed"
            },
            weeks_13_14: {
                phase: "Competition Prep",
                volume: "80-100 ground contacts/week",
                note: "Taper for competition",
                focus: "Maintain speed, reduce fatigue"
            }
        }
    },

    plyometric: {
        title: "Plyometric Volume by Phase",
        description: "Total contacts per session and frequency",
        phases: {
            weeks_1_4: {
                phase: "Foundation",
                contactsPerSession: "60-80",
                frequency: "2x/week",
                focus: "Learning landing mechanics"
            },
            weeks_5_8: {
                phase: "Strength Development",
                contactsPerSession: "80-120",
                frequency: "2-3x/week",
                focus: "Power development"
            },
            weeks_9_12: {
                phase: "Power Phase",
                contactsPerSession: "120-160",
                frequency: "3x/week",
                focus: "Maximum reactive power"
            },
            weeks_13_14: {
                phase: "Competition Prep",
                contactsPerSession: "60-80",
                frequency: "2x/week",
                note: "Taper volume",
                focus: "Maintain power, fresh legs"
            }
        }
    },

    strength: {
        title: "Strength Training Volume",
        description: "Sets × Reps by phase",
        phases: {
            weeks_1_4: {
                phase: "Foundation",
                volume: "3-4 sets × 8-12 reps",
                loadRange: "25-40% BW",
                focus: "Volume accumulation and technique"
            },
            weeks_5_8: {
                phase: "Strength Development",
                volume: "4-5 sets × 5-8 reps",
                loadRange: "30-40% BW",
                focus: "Strength building"
            },
            weeks_9_12: {
                phase: "Power Phase",
                volume: "3-5 sets × 3-6 reps",
                loadRange: "35-40% BW",
                focus: "Power expression"
            },
            weeks_13_14: {
                phase: "Competition Prep",
                volume: "2-3 sets × 3-5 reps",
                loadRange: "30-35% BW",
                note: "Maintenance only",
                focus: "Maintain strength, reduce fatigue"
            }
        },
        note: "Maximum 40% body weight external resistance across ALL phases"
    }
};

/**
 * Assessment Schedule
 * When and what to test
 */
export const ASSESSMENT_SCHEDULE = {
    week_1: {
        title: "Baseline Assessment",
        timing: "Before starting program",
        tests: [
            "40-yard sprint (3 trials)",
            "20-yard sprint (3 trials)",
            "10-yard sprint (3 trials)",
            "Vertical jump (3 trials)",
            "Broad jump (3 trials)",
            "Pro-Agility 5-10-5 (3 trials)",
            "L-drill (3 trials)",
            "Nordic curl max reps (1 set)",
            "Single-leg balance (30s eyes closed)"
        ],
        purpose: "Establish baseline for comparison"
    },

    week_4: {
        title: "End of Foundation Phase",
        timing: "End of week 4",
        tests: [
            "All sprint tests (40y, 20y, 10y)",
            "All power tests (vertical, broad)",
            "All agility tests (pro-agility, L-drill)",
            "Nordic curl max reps",
            "Movement quality assessment"
        ],
        purpose: "Evaluate foundation phase progress"
    },

    week_7: {
        title: "Mid-Strength Phase Check",
        timing: "Middle of week 7",
        tests: [
            "Repeat sprint testing",
            "Power assessments (vertical, broad)",
            "Agility testing"
        ],
        purpose: "Monitor strength development"
    },

    week_11: {
        title: "End of Power Phase",
        timing: "End of week 11",
        tests: [
            "Complete testing battery",
            "Film sprint mechanics",
            "Strength assessments",
            "Compare to Week 4 baseline"
        ],
        purpose: "Validate power development and progress"
    },

    week_14: {
        title: "Pre-Competition Final Check",
        timing: "Early in week 14",
        tests: [
            "Final sprint validation",
            "Position-specific assessments",
            "Movement quality check"
        ],
        purpose: "Confirm competition readiness"
    }
};

/**
 * Standard Session Structure
 * Template for organizing workout sessions
 */
export const SESSION_STRUCTURE = {
    title: "Standard Training Session Structure",
    description: "How every session should be organized",

    structure: [
        {
            phase: "Arrival",
            duration: "5-10 min",
            activities: ["Equipment setup", "Mental preparation", "Review workout"]
        },
        {
            phase: "Warm-Up",
            duration: "15-20 min",
            protocol: "Universal Warm-Up (all 3 phases)",
            importance: "NON-NEGOTIABLE"
        },
        {
            phase: "Skill/Technical Work",
            duration: "10-15 min",
            examples: ["Sprint mechanics", "Jump technique", "Movement patterns"],
            note: "When fresh, high neural demand"
        },
        {
            phase: "Main Training",
            duration: "30-45 min",
            structure: "Blocks as prescribed in program",
            note: "Focus and intensity"
        },
        {
            phase: "Cool-Down",
            duration: "10 min",
            activities: [
                "Light movement (walk/jog)",
                "Static stretching",
                "Breathing exercises"
            ]
        },
        {
            phase: "Recovery",
            duration: "5-10 min",
            activities: [
                "Foam rolling",
                "Hydration",
                "Nutrition",
                "Session notes/tracking"
            ]
        }
    ],

    totalTime: "75-110 minutes (depending on session type)"
};

export default {
    MORNING_MOBILITY_ROUTINE,
    UNIVERSAL_WARMUP,
    SUNDAY_RECOVERY_PROTOCOL,
    VOLUME_GUIDELINES,
    ASSESSMENT_SCHEDULE,
    SESSION_STRUCTURE
};
