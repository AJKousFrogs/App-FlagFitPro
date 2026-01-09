/**
 * QB-Specific Training Protocols
 * Enhanced warm-ups, arm care, and QB-specific recovery
 * Used in addition to shared protocols for QB program
 */

/**
 * Enhanced 30-Minute QB Preparation Protocol
 * Used before EVERY QB training session
 * More comprehensive than universal warm-up due to throwing demands
 */
export const QB_ENHANCED_WARMUP = {
  title: "Enhanced 30-Minute QB Prep (Every Session)",
  description:
    "Comprehensive QB warm-up emphasizing shoulder health and throwing chain",
  duration: 30,
  frequency: "Every QB training session",
  importance: "CRITICAL for injury prevention and performance",

  phases: [
    {
      title: "Phase 1: Cardiovascular Prep & Core",
      duration: 10,
      purpose:
        "Increase body temperature, activate nervous system, and build core stability",
      exercises: [
        {
          name: "Jump rope",
          duration: "5 minutes",
          intensity: "Moderate to moderate-high",
          variations: [
            "Basic bounce (2 min)",
            "Alternating feet (1 min)",
            "High knees (1 min)",
            "Fast singles (1 min)",
          ],
          focus: "Coordination and footwork",
          cues: [
            "Light on feet",
            "Relaxed shoulders",
            "Rhythm",
            "Stay on balls of feet",
          ],
        },
        {
          name: "Plank series",
          duration: "3 minutes total",
          breakdown: [
            "Standard plank - 1.5 minutes",
            "Right side plank - 45s",
            "Left side plank - 45s",
          ],
          cues: ["Straight body line", "Engaged core", "Control breathing"],
        },
        {
          name: "Arm circles (progressive)",
          duration: "2 minutes",
          progression: [
            "Small circles forward - 30s",
            "Small circles backward - 30s",
            "Large circles forward - 30s",
            "Large circles backward - 30s",
          ],
          cues: [
            "Start small",
            "Gradually increase",
            "Control movement",
            "Both directions",
          ],
        },
      ],
    },
    {
      title: "Phase 2: Shoulder Complex Activation",
      duration: 12,
      purpose: "Activate and prepare the throwing shoulder",
      importance: "Most critical phase for QBs",

      sections: [
        {
          title: "Rotator Cuff Activation",
          duration: 4,
          importance: "Primary velocity generators - MUST be activated",
          exercises: [
            {
              name: "Band external rotation",
              sets: 2,
              reps: "15 each arm",
              resistance: "Light band",
              setup: "Band at elbow height, elbow at 90°",
              cues: [
                "Keep elbow at side",
                "Rotate forearm away from body",
                "Control both directions",
                "Feel it in back of shoulder",
              ],
              note: "Critical for velocity - 30% of throwing power",
            },
            {
              name: "Band internal rotation",
              sets: 2,
              reps: "15 each arm",
              resistance: "Light band",
              purpose: "Balance external rotation work",
              cues: [
                "Keep elbow at side",
                "Rotate forearm toward body",
                "Control movement",
                "Equal work both directions",
              ],
            },
            {
              name: "Empty can raises",
              sets: 2,
              reps: "10 each arm",
              equipment: "Light dumbbell (2-5 lbs) or no weight",
              position: "Thumbs down (like emptying a can)",
              cues: [
                "Arm at 45° angle",
                "Raise to shoulder height",
                "Control descent",
              ],
            },
            {
              name: "Full can raises",
              sets: 2,
              reps: "10 each arm",
              equipment: "Light dumbbell (2-5 lbs) or no weight",
              position: "Thumbs up",
              cues: [
                "Arm at 45° angle",
                "Raise to shoulder height",
                "Control descent",
              ],
            },
          ],
        },
        {
          title: "Scapular Stabilization",
          duration: 4,
          importance: "Stable base for throwing power",
          exercises: [
            {
              name: "Wall slides",
              sets: 2,
              reps: 12,
              setup: "Back against wall, arms in 'W' position",
              execution: [
                "Slide arms up wall",
                "Keep back and arms in contact with wall",
                "Return to start",
                "Control entire movement",
              ],
              cues: ["Back flat on wall", "Full range", "Control"],
            },
            {
              name: "Band pull-aparts",
              sets: 2,
              reps: 20,
              resistance: "Light to medium band",
              cues: [
                "Arms straight",
                "Pull band apart to chest",
                "Squeeze shoulder blades",
                "Control return",
              ],
            },
            {
              name: "Scapular push-ups",
              sets: 2,
              reps: 10,
              focus: "Scapular protraction/retraction",
              execution: [
                "Plank position",
                "Keep arms straight",
                "Push shoulder blades apart",
                "Pull shoulder blades together",
              ],
              note: "Small movement, big impact",
            },
            {
              name: "Lower trap raises",
              sets: 2,
              reps: 12,
              equipment: "Light dumbbells or no weight",
              position: "Prone (lying face down) or bent over",
              cues: [
                "Thumbs up",
                "Raise arms at 135° angle",
                "Squeeze shoulder blades down and back",
              ],
            },
          ],
        },
        {
          title: "Shoulder Mobility",
          duration: 4,
          importance: "Range of motion for injury-free throwing",
          exercises: [
            {
              name: "Cross-body stretch",
              sets: 2,
              duration: "30s each",
              setup: "Pull arm across chest with opposite hand",
              cues: [
                "Keep shoulders down",
                "Pull arm across body",
                "Feel stretch in back of shoulder",
              ],
            },
            {
              name: "Sleeper stretch",
              sets: 2,
              duration: "30s each",
              setup: "Lying on throwing side, arm at 90°",
              execution: [
                "Lie on throwing shoulder",
                "Upper arm perpendicular to body",
                "Use other hand to push forearm down",
                "Hold stretch at end range",
              ],
              importance: "CRITICAL - increases internal rotation",
              cues: [
                "Should feel stretch in back of shoulder",
                "Gentle pressure",
                "Breathe into stretch",
              ],
              note: "Do this DAILY - prevents velocity-limiting tightness",
            },
            {
              name: "Posterior capsule stretch",
              sets: 2,
              duration: "30s each",
              position: "Various angles to target posterior shoulder",
              cues: ["Gentle stretch", "Multiple angles", "Breathe"],
            },
            {
              name: "Doorway chest stretch",
              sets: 2,
              duration: "45s",
              variations: [
                "High (above head)",
                "Mid (shoulder level)",
                "Low (below shoulder)",
              ],
              setup: "Arm on doorframe, step through",
              cues: [
                "Feel stretch in chest",
                "Keep shoulders back",
                "All three heights",
              ],
            },
          ],
        },
      ],
    },
    {
      title: "Phase 3: Throwing Chain Integration",
      duration: 10,
      purpose: "Activate hip flexors, back, and throwing motion",
      importance: "Connects lower and upper body for throwing power",

      sections: [
        {
          title: "Hip & Back Activation",
          duration: 5,
          importance: "50% of throwing power comes from lower body",
          exercises: [
            {
              name: "Hip flexor dynamic stretch",
              sets: 2,
              duration: "30s each leg",
              execution: "Lunge position with movement",
              cues: [
                "Back knee on ground",
                "Drive hips forward",
                "Pulse gently",
                "Feel stretch in front of hip",
              ],
              note: "Tight hip flexors = 15-20% velocity loss",
            },
            {
              name: "World's greatest stretch",
              sets: 2,
              reps: "3 each side",
              execution: [
                "Lunge position",
                "Elbow to instep",
                "Rotate and reach up",
                "Hold each position 2-3 seconds",
              ],
              purpose: "Full body integration",
            },
            {
              name: "Thoracic rotation",
              sets: 2,
              reps: "10 each direction",
              position: "Quadruped (hands and knees)",
              execution: [
                "Hand behind head",
                "Rotate trunk",
                "Follow elbow with eyes",
                "Full range of motion",
              ],
              importance: "Thoracic mobility adds 8-12 mph velocity",
            },
            {
              name: "Cat-cow",
              sets: 2,
              reps: 12,
              position: "Hands and knees",
              execution: [
                "Arch back (cow)",
                "Round back (cat)",
                "Slow and controlled",
              ],
              purpose: "Spinal mobility",
            },
            {
              name: "Lat activation",
              sets: 2,
              reps: "10 each arm",
              equipment: "Band or cable",
              execution: "Pull-down or rowing motion",
              cues: ["Feel lats engage", "Control movement", "Both arms"],
              note: "Lats provide 18% of throwing power",
            },
          ],
        },
        {
          title: "Throwing Motion Prep",
          duration: 5,
          purpose: "Rehearse throwing pattern without ball",
          exercises: [
            {
              name: "Shadow throwing (no ball)",
              sets: 2,
              reps: 10,
              focus: "Perfect mechanics without load",
              cues: [
                "Full throwing motion",
                "No ball",
                "Focus on hip rotation",
                "Arm path consistency",
                "Follow through",
              ],
            },
            {
              name: "Step-through mechanics",
              sets: 2,
              reps: "8 each direction",
              execution: "Step and rotate pattern",
              cues: [
                "Proper foot placement",
                "Hip rotation first",
                "Trunk follows hips",
                "Arm last",
              ],
              note: "Kinetic chain sequence critical",
            },
            {
              name: "Trunk rotation with resistance",
              sets: 2,
              reps: "10 each way",
              equipment: "Band or cable",
              focus: "Rotational power",
              cues: ["Explosive rotation", "Full range", "Control"],
            },
            {
              name: "Progressive throwing motion",
              sets: 3,
              progression: ["25% ROM", "50% ROM", "75% ROM"],
              purpose: "Gradually increase range of motion",
              cues: [
                "Start small",
                "Gradually increase",
                "Feel the pattern",
                "Build to full ROM",
              ],
            },
          ],
        },
      ],
    },
  ],

  notes: [
    "NEVER skip this warm-up before throwing",
    "This is your injury insurance policy",
    "Takes 30 minutes but saves months of injury time",
    "Each phase builds on the previous",
    "Can be done anywhere with minimal equipment",
  ],

  equipment: [
    "Resistance bands (light, medium)",
    "Light dumbbells (2-10 lbs)",
    "Wall space",
    "Minimal setup required",
  ],
};

/**
 * Progressive Throwing Warm-Up
 * MANDATORY before any throwing session
 * Minimum 35 throws to properly warm up arm
 */
export const PROGRESSIVE_THROWING_WARMUP = {
  title: "Progressive Throwing Warm-Up",
  description: "Essential preparation before any throwing training or games",
  importance: "NEVER throw hard when cold - recipe for injury",
  minimumThrows: 35,
  duration: "12-15 minutes",

  protocol: [
    {
      distance: "5 yards",
      throws: 5,
      intensity: "30% effort",
      focus: "Arm circle and release point",
      cues: ["Soft toss", "Feel the motion", "Establish rhythm"],
    },
    {
      distance: "10 yards",
      throws: 5,
      intensity: "40% effort",
      focus: "Adding hip rotation",
      cues: ["Easy throws", "Rotate hips", "Arm follows body"],
    },
    {
      distance: "15 yards",
      throws: 5,
      intensity: "50% effort",
      focus: "Full kinetic chain",
      cues: ["Lower body power", "Full rotation", "Smooth release"],
    },
    {
      distance: "20 yards",
      throws: 5,
      intensity: "60% effort",
      focus: "Increasing velocity",
      cues: ["Maintain mechanics", "Gradual increase", "Stay relaxed"],
    },
    {
      distance: "25 yards",
      throws: 5,
      intensity: "70% effort",
      focus: "Approaching game speed",
      cues: ["Feel velocity increasing", "Perfect mechanics", "Controlled"],
    },
    {
      distance: "30 yards",
      throws: 5,
      intensity: "80% effort",
      focus: "Near-maximum preparation",
      cues: ["Close to game speed", "Mechanics solid", "Feeling good"],
    },
    {
      distance: "40 yards",
      throws: 5,
      intensity: "85-90% effort",
      focus: "Full preparation complete",
      cues: [
        "Game-ready throws",
        "Maximum velocity with control",
        "Arm is warm",
      ],
    },
  ],

  totalThrows: 35,
  minimumTime: "12 minutes (do NOT rush this)",

  notes: [
    "NEVER skip this progression",
    "Most important injury prevention tool for QBs",
    "Can extend with more throws at each distance if needed",
    "Better to throw extra warm-up than go in cold",
    "This is NON-NEGOTIABLE for arm health",
  ],

  competition: {
    title: "Game Day Modification",
    description: "Extended progression for competition",
    modification: "Add 3-5 throws at each distance",
    totalThrows: "50-60 throws",
    duration: "18-20 minutes",
    note: "Take extra time on game day - you have one arm",
  },
};

/**
 * Daily QB Arm Care Protocol
 * Post-throwing recovery and maintenance
 * Essential for 320-throw capacity
 */
export const DAILY_ARM_CARE = {
  title: "Daily QB Arm Care Protocol",
  description: "Post-throwing recovery - NON-NEGOTIABLE",
  timing: "After EVERY throwing session",
  duration: "15-20 minutes",
  importance: "This is how you build capacity for 320 throws",

  protocol: [
    {
      phase: "Immediate Post-Throwing",
      timing: "Within 5 minutes of finishing",
      duration: "5 minutes",
      activities: [
        {
          name: "Light throwing",
          throws: "10-15 easy tosses",
          distance: "10-15 yards",
          intensity: "30% effort",
          purpose: "Gradual cool-down",
          cues: ["Gentle", "Easy motion", "Blood flow"],
        },
      ],
    },
    {
      phase: "Stretching Sequence",
      timing: "5-10 minutes post-throwing",
      duration: "10 minutes",
      exercises: [
        {
          name: "Sleeper stretch",
          sets: 3,
          duration: "60s each arm",
          importance: "CRITICAL - do every day",
          cues: ["Lying on side", "Gentle pressure", "Deep stretch"],
        },
        {
          name: "Cross-body stretch",
          sets: 3,
          duration: "45s each",
          cues: ["Pull across chest", "Feel posterior shoulder"],
        },
        {
          name: "Doorway chest stretch",
          sets: 2,
          duration: "60s",
          variations: "All three heights",
          cues: ["Open up chest", "Multiple angles"],
        },
        {
          name: "Lat stretch",
          sets: 2,
          duration: "45s each",
          execution: "Overhead reach and lean",
          cues: ["Feel side stretch", "Both sides"],
        },
        {
          name: "Tricep stretch",
          sets: 2,
          duration: "30s each",
          execution: "Arm overhead, pull elbow",
          cues: ["Gentle pull", "Both arms"],
        },
      ],
    },
    {
      phase: "Recovery Modalities",
      timing: "10-15 minutes post-throwing",
      duration: "5-10 minutes",
      options: [
        {
          name: "Ice therapy",
          when: "After high-volume sessions (150+ throws)",
          duration: "10-15 minutes",
          method: "Ice pack on shoulder",
          note: "Not needed for every session",
        },
        {
          name: "Massage gun",
          focus: "Shoulder, upper back, forearm",
          duration: "5-8 minutes",
          intensity: "Light to moderate",
          areas: ["Rotator cuff", "Deltoids", "Upper back", "Forearm"],
        },
        {
          name: "Foam rolling",
          focus: "Upper back and lats",
          duration: "5 minutes",
          cues: ["Slow rolling", "Pause on tender spots"],
        },
      ],
    },
  ],

  highVolumeDays: {
    title: "High Volume Day Recovery (150+ throws)",
    additionalSteps: [
      "Extended ice therapy (15-20 minutes)",
      "Extra stretching time (add 5 minutes)",
      "Anti-inflammatory nutrition (tart cherry juice, omega-3s)",
      "Extra sleep (aim for 9+ hours)",
      "Light mobility work next morning",
    ],
  },

  weeklySchedule: {
    title: "Weekly Arm Care Emphasis",
    monday: {
      focus: "Post-strength work",
      emphasis: "Rotator cuff recovery",
      time: "15 minutes",
    },
    tuesday: {
      focus: "Post-mobility work",
      emphasis: "Maintain flexibility",
      time: "10 minutes",
    },
    wednesday: {
      focus: "Recovery day",
      emphasis: "Light stretching only",
      time: "10 minutes",
    },
    thursday: {
      focus: "Post-throwing integration",
      emphasis: "Full protocol",
      time: "15 minutes",
    },
    friday: {
      focus: "Post-endurance work",
      emphasis: "Extended care (high volume)",
      time: "20 minutes",
    },
    saturday: {
      focus: "Post-throwing session",
      emphasis: "Full protocol + ice",
      time: "20 minutes",
    },
    sunday: {
      focus: "Recovery emphasis",
      emphasis: "Extended stretching and recovery",
      time: "30 minutes (part of Sunday protocol)",
    },
  },

  notes: [
    "This is HOW you build endurance for 320 throws",
    "Skip this and you WILL get injured",
    "Consistency is everything - every single session",
    "Better to do 10 minutes than skip entirely",
    "Your arm is your career - treat it that way",
  ],
};

/**
 * Sunday QB Recovery Protocol
 * Extended recovery for QB-specific demands
 * In addition to shared Sunday recovery
 */
export const SUNDAY_QB_RECOVERY = {
  title: "Sunday QB-Specific Recovery",
  description: "Additional QB recovery on top of shared Sunday protocol",
  duration: "30 additional minutes",
  timing: "After completing shared Sunday recovery",

  sections: [
    {
      title: "Shoulder Comprehensive Recovery",
      duration: 25,
      exercises: [
        {
          name: "Extended shoulder mobility sequence",
          duration: "10 minutes",
          exercises: [
            "Sleeper stretch: 3×90s each",
            "Cross-body stretch: 3×60s each",
            "Posterior capsule work: 3×60s each",
            "Doorway chest stretch: 3×90s (all heights)",
          ],
          importance: "Maintain mobility through recovery day",
        },
        {
          name: "Rotator cuff recovery work",
          duration: "8 minutes",
          exercises: [
            "Light band external rotation: 2×20 each",
            "Light band internal rotation: 2×20 each",
            "Scapular wall slides: 2×15",
            "Band pull-aparts: 2×25",
          ],
          resistance: "Very light band",
          purpose: "Active recovery and blood flow",
        },
        {
          name: "Shoulder massage and release",
          duration: "7 minutes",
          tools: ["Massage gun", "Lacrosse ball", "Foam roller"],
          areas: [
            "Rotator cuff muscles",
            "Deltoids (all three heads)",
            "Upper trapezius",
            "Levator scapulae",
            "Rhomboids",
          ],
          technique: "Light pressure, focus on blood flow",
        },
      ],
    },
    {
      title: "Hip Flexor Deep Work",
      duration: 20,
      importance: "Hip flexibility = 15-20% of throwing velocity",
      exercises: [
        {
          name: "Extended couch stretch",
          sets: 3,
          duration: "2 minutes each leg",
          execution: [
            "Rear foot elevated high",
            "Front foot planted",
            "Progressive hip drive forward",
            "Can add reaches overhead",
          ],
          cues: [
            "Deepest stretch of the week",
            "Breathe into it",
            "This is life-changing",
          ],
        },
        {
          name: "Multiple hip flexor variations",
          total: "15 minutes",
          variations: [
            "Standing hip flexor: 3×90s each",
            "Kneeling hip flexor: 3×90s each",
            "90/90 hip stretch: 3×90s each position",
            "Pigeon pose: 2×2min each side",
          ],
          goal: "Maximum hip flexibility by end of week",
        },
      ],
    },
    {
      title: "Back Recovery and Mobility",
      duration: 20,
      importance: "Back strength = 18% of throwing power",
      exercises: [
        {
          name: "Lat recovery",
          duration: "8 minutes",
          exercises: [
            "Lat stretches: 4×60s each",
            "Child's pose with reaches: 3×60s each side",
            "Lat foam rolling: 3 minutes",
          ],
        },
        {
          name: "Thoracic mobility",
          duration: "7 minutes",
          exercises: [
            "Thoracic extension on roller: 3 minutes",
            "Quadruped thoracic rotation: 3×10 each",
            "Cat-cow: 3×15 reps",
          ],
        },
        {
          name: "Lower trap and rhomboid release",
          duration: "5 minutes",
          tools: "Lacrosse ball or massage gun",
          focus: "Scapular stabilizers",
          technique: "Gentle pressure, search for tender spots",
        },
      ],
    },
  ],

  mentalRecovery: {
    title: "QB Mental Recovery",
    duration: 10,
    activities: [
      "Review week's throwing performance",
      "Visualize perfect throws",
      "Mental rehearsal of throwing mechanics",
      "Confidence building exercises",
      "Gratitude for healthy throwing arm",
    ],
  },

  notes: [
    "This is IN ADDITION to shared Sunday recovery (75 min total)",
    "QBs need extra care due to throwing demands",
    "This extra work enables 320-throw capacity",
    "Don't skip - this is training",
    "Come back Monday ready to train hard",
  ],
};

/**
 * Between-Game Recovery Protocol
 * For tournament simulation and competition
 * 8-12 minute recovery between games
 */
export const BETWEEN_GAME_PROTOCOL = {
  title: "Between-Game Recovery Protocol",
  description: "Optimize recovery during 8-game tournament",
  duration: "8-12 minutes",
  timing: "Immediately after game, before next game",
  importance: "Critical for maintaining velocity through 320 throws",

  sequence: [
    {
      activity: "Light arm stretching",
      duration: "2 minutes",
      timing: "First 2 minutes post-game",
      exercises: [
        "Sleeper stretch: 30s each",
        "Cross-body stretch: 30s each",
        "Arm circles: 30s",
        "Gentle rotations: 30s",
      ],
      purpose: "Prevent shoulder stiffening",
      cues: ["Keep arm loose", "Gentle movements", "Maintain blood flow"],
    },
    {
      activity: "Hydration + light nutrition",
      duration: "3 minutes",
      timing: "Minutes 3-5",
      protocol: [
        "8-12 oz electrolyte drink (not just water)",
        "Simple carb snack (banana, energy bar)",
        "Small protein if 2+ hours to next game",
      ],
      avoid: ["Heavy meals", "High fiber", "High fat"],
      note: "Liquid calories preferred between games",
    },
    {
      activity: "Mental reset/visualization",
      duration: "2 minutes",
      timing: "Minutes 6-7",
      protocol: [
        "Close eyes",
        "Deep breathing (4-7-8 pattern)",
        "Visualize perfect throws next game",
        "Release any negative plays",
        "Focus on 'next game, clean slate'",
      ],
      importance: "Mental recovery as important as physical",
    },
    {
      activity: "Light throwing preparation",
      duration: "3 minutes",
      timing: "Final 3 minutes before next game",
      throws: "5-10 easy tosses",
      distance: "10-15 yards",
      intensity: "40% effort",
      purpose: "Re-activate arm without fatigue",
      cues: ["Easy motion", "Feel mechanics", "Confidence"],
    },
  ],

  longerBreaks: {
    title: "If 20+ Minutes Between Games",
    additions: [
      "Light walking (5 minutes)",
      "More comprehensive stretching (5 minutes)",
      "Slightly larger snack",
      "Ice shoulder briefly (5 minutes) if available",
    ],
  },

  dayTransition: {
    title: "End of Day 1 Recovery",
    duration: "Evening after 4 games",
    protocol: [
      "Extended arm care protocol (30 minutes)",
      "Ice therapy (15-20 minutes)",
      "Full meal within 60 minutes",
      "Aggressive rehydration",
      "Anti-inflammatory foods",
      "Compression if available",
      "Extra sleep (9+ hours)",
      "Light morning mobility next day",
    ],
  },

  notes: [
    "Practice this during tournament simulations",
    "Timing is critical - stick to sequence",
    "Mental recovery prevents late-game breakdown",
    "Hydration and nutrition maintain performance",
    "This is the difference between game 1 and game 8",
  ],
};

export default {
  QB_ENHANCED_WARMUP,
  PROGRESSIVE_THROWING_WARMUP,
  DAILY_ARM_CARE,
  SUNDAY_QB_RECOVERY,
  BETWEEN_GAME_PROTOCOL,
};
