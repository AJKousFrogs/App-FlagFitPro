export const TRAINING_PROGRAM = {
  programInfo: {
    title: "COMPLETE FLAG FOOTBALL OFFSEASON TRAINING PROGRAM",
    subtitle: "WR/DB PERFORMANCE OPTIMIZATION",
    duration: "14 Weeks",
    startDate: "2025-11-17",
    endDate: "2026-02-28",
    frequency: "5-6 days/week",
    sessionDuration: "60-90 minutes",
    loadLimit: "Maximum 40% body weight external resistance",
  },

  phases: {
    foundation: {
      title: "Foundation Phase",
      weeks: "1-4",
      dateRange: "December 1-28, 2025",
      goals: [
        "Build structural strength and movement quality",
        "Establish posterior chain foundation (Nordic curls, RDLs)",
        "Develop aerobic base (tempo running)",
        "Learn sprint mechanics (drill work)",
        "Optimize lower body chain health",
        "Introduction to isometric training",
      ],
      priorities: [
        "Build posterior chain strength (Nordic curls, RDLs, hip thrusts)",
        "Establish sprint mechanics (drill work 3-4x/week)",
        "Develop aerobic base (tempo work)",
        "Lower body chain health (comprehensive activation)",
        "Learn isometric positions (80-85% effort)",
      ],
    },
    strength: {
      title: "Strength Development",
      weeks: "5-8",
      dateRange: "January 5 - February 1, 2026",
      goals: [
        "Build maximum strength (heavy loads)",
        "Increase sprint volume and intensity",
        "Advanced plyometric work (depth jumps, reactive bounds)",
        "Repeated sprint ability development",
        "Maximal isometric contractions",
        "Enhanced change of direction",
      ],
      priorities: [
        "Maximum strength (heavy squats, deadlifts, isometrics)",
        "Increase sprint volume (if indoor space available)",
        "Power development (bounds, jumps)",
        "Repeated sprint introduction",
        "Isometrics at max effort (95-100%)",
      ],
    },
    power: {
      title: "Power Phase",
      weeks: "9-12",
      dateRange: "February 2-28, 2026",
      goals: [
        "Convert strength to explosive power",
        "Reactive abilities at maximum",
        "Game-specific conditioning peak",
        "Multi-directional power",
        "Competition preparation",
        "Outdoor transition begins (late phase)",
      ],
      priorities: [
        "Convert strength to explosive power",
        "Game-specific conditioning (RSA training)",
        "Reactive abilities (change of direction)",
        "Resisted/assisted sprints",
        "Complex training methods",
      ],
    },
    competition: {
      title: "Competition Prep",
      weeks: "13-14",
      dateRange: "March 2-15, 2026",
      goals: [
        "Outdoor transition complete",
        "Peak power maintenance",
        "Volume reduction (taper)",
        "Competition simulation",
        "Mental preparation",
        "Physical freshness for competition",
      ],
      priorities: [
        "Outdoor sprint transition",
        "Peak power maintenance",
        "Volume reduction (taper)",
        "Competition simulation",
        "Final preparation",
      ],
    },
  },

  dailyProtocols: {
    morningMobility: {
      title: "15 Minute Full Body DAILY Mobility Routine",
      duration: 15,
      exercises: [
        { name: "Hip Circles", duration: "10 each direction" },
        { name: "Leg Swings (all directions)", duration: "10 each" },
        { name: "Ankle Circles", duration: "10 each direction" },
        { name: "Dynamic Quad Stretches", duration: "30s each" },
        { name: "Walking Lunges", duration: "10 each leg" },
        { name: "World's Greatest Stretch", duration: "5 each side" },
        { name: "Glute Bridges", duration: "2x10" },
        { name: "Bodyweight Squats", duration: "10 reps" },
      ],
    },
    universalWarmup: {
      title: "Universal Warm-Up (Every Session)",
      duration: "15-20 minutes",
      phases: [
        {
          title: "Phase 1: General Activation",
          duration: 5,
          exercises: [
            { name: "Light jog", duration: "2 minutes" },
            { name: "Jump rope", duration: "2 minutes" },
            { name: "Dynamic stretching", duration: "1 minute" },
          ],
        },
        {
          title: "Phase 2: Lower Body Chain Activation",
          duration: 10,
          sections: [
            {
              title: "Ankle Complex",
              duration: 2,
              exercises: [
                { name: "Ankle circles", reps: "10 each direction" },
                { name: "Calf raises", sets: "2x10" },
                { name: "Tibialis raises", sets: "2x10" },
                { name: "Single-leg balance", duration: "20s each" },
              ],
            },
            {
              title: "Knee Stability",
              duration: 2,
              exercises: [
                { name: "Mini-band walks", sets: "2x10" },
                { name: "Single-leg mini squats", sets: "2x6 each" },
              ],
            },
            {
              title: "Hip Complex",
              duration: 3,
              exercises: [
                { name: "Hip circles", reps: "10 each direction" },
                { name: "Leg swings (all directions)", reps: "10 each" },
                { name: "Glute bridges", sets: "2x10" },
              ],
            },
            {
              title: "Quadriceps Prep",
              duration: 3,
              exercises: [
                { name: "Walking lunges", reps: "10 each leg" },
                { name: "Dynamic quad stretches", duration: "30s each" },
                { name: "Bodyweight squats", reps: "10 reps" },
              ],
            },
          ],
        },
        {
          title: "Phase 3: Sprint Drill Series",
          duration: 5,
          exercises: [
            { name: "A-march", sets: "2x20m" },
            { name: "A-skip", sets: "2x20m" },
            { name: "B-skip", sets: "2x20m" },
            { name: "C-skip", sets: "2x20m" },
            { name: "High knees", sets: "2x20m" },
            { name: "Butt kicks", sets: "2x20m" },
            { name: "Scissors", sets: "2x20m" },
            { name: "Toy soldiers", sets: "2x20m" },
            { name: "Hamstring stretch", duration: "30s each" },
          ],
        },
      ],
    },
    sundayRecovery: {
      title: "Sunday Recovery Protocol",
      duration: "45-60 minutes",
      sections: [
        {
          title: "Lower Body Chain Recovery",
          exercises: [
            { name: "Calf stretching", sets: "3x45s" },
            { name: "Tibialis stretching", sets: "2x30s" },
            { name: "Quad stretching", sets: "3x45s" },
            { name: "Hamstring stretching", sets: "3x45s" },
            { name: "Hip flexor stretching", sets: "4x45s" },
            { name: "Couch stretch", sets: "2x90s each" },
            { name: "Pigeon pose", sets: "2x90s each" },
            { name: "90/90 hip stretches", sets: "2x60s each position" },
            { name: "World's greatest stretch", sets: "2x5 each side" },
          ],
        },
        {
          title: "Additional Recovery",
          activities: [
            { name: "Foam rolling", duration: "15 minutes" },
            { name: "Light walk", duration: "20 minutes" },
            { name: "Visualization/mental training", duration: "10 minutes" },
            { name: "Compression therapy", optional: true },
            { name: "Massage gun", optional: true },
            { name: "TENS/EMS", optional: true },
          ],
        },
      ],
    },
  },

  volumeGuidelines: {
    sprint: {
      "weeks1-4": "40-60 ground contacts/week (if indoor available)",
      "weeks5-8": "80-120 ground contacts/week",
      "weeks9-12": "120-180 ground contacts/week",
      "weeks13-14": "80-100 ground contacts/week (taper)",
    },
    plyometric: {
      "weeks1-4": "60-80 contacts/session, 2x/week",
      "weeks5-8": "80-120 contacts/session, 2-3x/week",
      "weeks9-12": "120-160 contacts/session, 3x/week",
      "weeks13-14": "60-80 contacts/session, 2x/week (taper)",
    },
    strength: {
      "weeks1-4": "3-4 sets × 8-12 reps (volume accumulation)",
      "weeks5-8": "4-5 sets × 5-8 reps (strength building)",
      "weeks9-12": "3-5 sets × 3-6 reps (power expression)",
      "weeks13-14": "2-3 sets × 3-5 reps (maintenance)",
    },
  },
};

// Weekly Schedule Templates for each phase
export default TRAINING_PROGRAM;
