/**
 * Seed Knowledge Base with Evidence-Based Content
 *
 * Sources structured from peer-reviewed research and sports science literature.
 * Each entry includes evidence grade (A/B/C) based on study quality.
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const knowledgeEntries = [
  // =========================================================================
  // TRAINING LOAD MANAGEMENT (ACWR)
  // =========================================================================
  {
    title: "Session RPE Method for Training Load Monitoring",
    category: "training_load",
    subcategory: "rpe",
    source_type: "research",
    source_title: "Foster C (1998) - Session RPE Method",
    evidence_grade: "A",
    risk_level: "low",
    requires_professional: false,
    source_quality_score: 0.92,
    is_active: true,
    content: `## Session RPE Method (Foster 1998)

The Session RPE method is a validated tool for monitoring internal training load.

### How to Use
1. **Rate your session** on a 0-10 scale (see below)
2. **Multiply by duration** in minutes
3. **Result** = Session training load (AU)

### Modified Borg Scale
| Score | Description |
|-------|-------------|
| 0 | Rest |
| 1 | Very, very easy |
| 2 | Easy |
| 3 | Moderate |
| 4 | Somewhat hard |
| 5 | Hard |
| 6 | - |
| 7 | Very hard |
| 8 | - |
| 9 | Very, very hard |
| 10 | Maximal |

### Example Calculation
- 60-minute practice at RPE 6
- Session Load = 60 × 6 = 360 AU

### Why It Works
- Validated across 36+ studies
- Correlates with heart rate-based measures
- Works for all sports and training types
- Simple and cost-effective

### Best Practices
- Collect RPE 15-30 minutes post-session
- Use consistent timing for accuracy
- Consider factors: sleep, stress, nutrition

**Sources**: Foster C (1998) Med Sci Sports Exerc; Haddad M (2017) Front Neurosci`,
  },

  // =========================================================================
  // FLAG FOOTBALL SPECIFIC TRAINING
  // =========================================================================
  {
    title: "Agility and Cutting Skills for Flag Football",
    category: "training",
    subcategory: "agility",
    source_type: "research",
    source_title: "JHRLMC (2023) - ABC drills comparison",
    evidence_grade: "B",
    risk_level: "low",
    requires_professional: false,
    source_quality_score: 0.88,
    is_active: true,
    content: `## Evidence-Based Agility Training

Flag football requires quick direction changes, acceleration, and deceleration.

### 1. ABC Drills (Agility, Balance, Coordination)
**Evidence**: Improves sprint performance more than plyometrics alone
- Rapid direction changes
- Precise movement control
- Enhanced proprioception

### 2. Cutting Technique Training
**Research Finding**: 6-week cutting modification programs improve movement quality during 45° and 90° cuts
- Focus on proper plant foot mechanics
- Reduce knee valgus during cuts

### 3. Recommended Drills

**Agility Ladder** (2-3x per week)
- Improves foot speed and coordination
- 10-15 reps of various patterns

**SAQ Training**
- Moderate effect on sprint performance
- Best for short-distance quickness

**HIIT with COD** (Change of Direction)
- Effective for linear speed AND agility
- 15-20 minutes, 2x per week

### Program Design
- Include 2-3 agility sessions per week
- Progress from simple to complex patterns
- Combine with strength training for best results

**Sources**: JHRLMC (2023); Dos Santos T (2023) J Strength Cond Res`,
  },
  {
    title: "Plyometric Training for Explosive Power",
    category: "training",
    subcategory: "plyometrics",
    source_type: "research",
    source_title: "Wang J (2024) - Plyometric training for sprinters",
    evidence_grade: "A",
    risk_level: "medium",
    requires_professional: false,
    source_quality_score: 0.9,
    is_active: true,
    content: `## Plyometric Training Guide

Plyometrics (jump training) develops explosive power through the stretch-shortening cycle.

### Research-Backed Benefits
- **28.5% increase** in squat jump power (6-week program)
- **5.2% improvement** in 30m sprint time
- Gains retained after 2-week detraining
- More effective than strength training alone for explosiveness

### Effective Exercises

**Lower Body**
1. Box Jumps (24-30 inch)
2. Depth Jumps (start 12-18 inches)
3. Broad Jumps
4. Single-Leg Hops
5. Lateral Bounds

**Upper Body**
1. Medicine Ball Throws
2. Plyo Push-ups
3. Overhead Slams

### Program Guidelines

| Variable | Beginner | Intermediate | Advanced |
|----------|----------|--------------|----------|
| Contacts/session | 60-80 | 100-120 | 120-150 |
| Sessions/week | 2 | 2-3 | 2-3 |
| Rest between sets | 60-90s | 90-120s | 2-3 min |

### Key Principles
1. Quality over quantity - every rep explosive
2. Full recovery between sets
3. Proper landing - soft knees, hip hinge
4. Progress gradually - master basics first
5. Combine with strength for synergistic effect

**Sources**: Wang J (2024) J Sports Sci; Ramirez-Campillo R (2023) Sports Med`,
  },

  // =========================================================================
  // POSITION-SPECIFIC TRAINING
  // =========================================================================
  {
    title: "Quarterback Arm Care and Shoulder Strengthening",
    category: "position_training",
    subcategory: "quarterback",
    source_type: "expert_consensus",
    source_title: "Wilk KE (2011) - Thrower's Ten Program",
    evidence_grade: "B",
    risk_level: "medium",
    requires_professional: false,
    source_quality_score: 0.85,
    is_active: true,
    content: `## QB Arm Care Program

Shoulder health is critical for quarterbacks.

### Essential Exercises

**1. Rotator Cuff Strengthening**
- Internal/External Rotations (8-12 reps)
- Use light resistance band
- 3 sets, 3-4x per week

**2. Scapular Stability**
- Wall Slides (10-15 reps)
- Prone Y-T-W (8-10 each)
- Band Pull-Aparts (15-20 reps)

**3. Power Development**
- Single-Arm Dumbbell Snatch (5-8 reps)
- Landmine Press (8-15 reps)
- Medicine Ball Throws

**4. Full-Body Integration**
- Turkish Get-Up (4-8 per arm)
- Crawls (10-15 yards each direction)
- Kettlebell Bottom-Up Press (8-12 reps)

### The "Thrower's Ten" Program
Perform 3-4x per week on non-consecutive days:
1. Diagonal patterns with tubing
2. Shoulder abduction to 90°
3. External rotation at 90° abduction
4. Internal rotation at 90° abduction
5. Prone horizontal abduction
6. Press-ups
7. Rowing
8. Bicep curls
9. Tricep extensions
10. Wrist flexion/extension

### Recovery Protocol
- Ice shoulder 15-20 min post-throwing
- Monitor throw count (avoid overuse)
- Include rest days between heavy throwing sessions

**Sources**: Wilk KE (2011) J Orthop Sports Phys Ther; TrainHeroic (2024)`,
  },
  {
    title: "Wide Receiver Route Running and Footwork",
    category: "position_training",
    subcategory: "wide_receiver",
    source_type: "expert_consensus",
    source_title: "Stack Sports - Route running drills",
    evidence_grade: "B",
    risk_level: "low",
    requires_professional: false,
    source_quality_score: 0.82,
    is_active: true,
    content: `## WR Route Running Development

Creating separation requires precise footwork and sharp route breaks.

### Fundamental Drills

**1. Ladder Drills**
- 10-15 repetitions at high speed
- Focus: Quick foot placement

**2. Diamond Drill**
- 4 cones in diamond shape (5yd apart)
- Figure-eight pattern
- Purpose: Quick deceleration and acceleration

**3. Route Tree Drill**
- Set up cones for each route
- Run at full speed
- Routes: Slant, out, comeback, post, corner, dig

### Break Point Techniques

**The Plant & Drive**
1. Lower center of gravity 2-3 steps before break
2. Plant hard with outside foot
3. Drive off at 45° angle or greater
4. Accelerate through the break

### Route-Specific Tips

| Route | Key Focus |
|-------|-----------|
| Slant | Quick 3-step burst, inside break |
| Out | Speed cut, get hips around |
| Comeback | Sell vertical, plant hard |
| Post | Inside shoulder dip, burst upfield |
| Corner | Outside release, back shoulder |

### Weekly Training Structure
- Monday: Route tree (all routes, 3 reps each)
- Wednesday: Break point focus
- Friday: 1-on-1 with DB, competitive reps

**Sources**: Stack.com (2024); Glazier Clinics (2024)`,
  },

  // =========================================================================
  // NUTRITION AND HYDRATION
  // =========================================================================
  {
    title: "Post-Exercise Nutrition for Recovery",
    category: "nutrition",
    subcategory: "recovery_nutrition",
    source_type: "research",
    source_title: "ACSM/AND/DC (2016) - Nutrition and Athletic Performance",
    evidence_grade: "A",
    risk_level: "low",
    requires_professional: false,
    source_quality_score: 0.93,
    is_active: true,
    content: `## Evidence-Based Recovery Nutrition

Proper post-workout nutrition optimizes muscle repair and glycogen replenishment.

### Carbohydrate Timing

**Optimal Window**: Within 30-60 minutes post-exercise

**Recommended Intake**:
- 1.0-1.2g carbohydrate per kg bodyweight per hour
- Continue for 4-6 hours post-exercise

### Protein Timing

**Daily Target**: 1.6-2.2g per kg bodyweight
**Post-Workout**: 20-40g high-quality protein
**Distribution**: Spread across 4-5 meals

**Best Sources**:
- Whey protein (fast-absorbing)
- Chicken, fish, eggs
- Greek yogurt

### Practical Recovery Meals

**Quick Options (within 30 min)**:
- Chocolate milk (ideal ratio!)
- Protein shake + banana
- Greek yogurt + granola

**Full Meal (within 2 hours)**:
- Grilled chicken + rice + vegetables
- Salmon + sweet potato + greens

### Sample Recovery Timeline

| Time Post-Exercise | What to Consume |
|--------------------|-----------------|
| 0-30 min | Quick carbs + protein |
| 1-2 hours | Balanced meal |
| 3-4 hours | Another protein-rich meal |
| Before bed | Casein protein or cottage cheese |

**Sources**: ACSM/AND/DC (2016) Med Sci Sports Exerc; Kerksick CM (2017) J Int Soc Sports Nutr`,
  },
  {
    title: "Hydration and Electrolytes for Athletes",
    category: "nutrition",
    subcategory: "hydration",
    source_type: "research",
    source_title: "GSSI (2023) - Hydration for Football Athletes",
    evidence_grade: "A",
    risk_level: "low",
    requires_professional: false,
    source_quality_score: 0.91,
    is_active: true,
    content: `## Athletic Hydration Guide

Proper hydration is critical for performance. Even 2% dehydration impairs function.

### Signs of Dehydration
- Dark urine (aim for pale yellow)
- Thirst (already dehydrated!)
- Headache
- Decreased performance
- Muscle cramps

### Sweat Rate Calculation
1. Weigh yourself before exercise (nude)
2. Exercise for 1 hour
3. Weigh yourself after
4. Weight lost + fluid consumed = sweat rate

### Hydration Timeline

| Timing | Recommendation |
|--------|----------------|
| 2-4 hours before | 5-7 mL/kg body weight |
| 10-20 min before | 200-300 mL |
| During exercise | 400-800 mL/hour |
| Post-exercise | 1.5L per kg lost |

### When to Add Electrolytes
- Exercise > 60 minutes
- Heavy sweating
- Hot/humid conditions
- Salt crystals on skin/clothes

### Sports Drinks vs Water

**Use Sports Drinks When**:
- Exercise > 60 minutes
- High intensity
- Hot/humid conditions

**Water is Fine For**:
- Exercise < 60 minutes
- Moderate intensity

**Sources**: GSSI (2023); Sawka MN (2007) Med Sci Sports Exerc`,
  },

  // =========================================================================
  // INJURY PREVENTION
  // =========================================================================
  {
    title: "ACL Injury Prevention for Cutting Sports",
    category: "injury_prevention",
    subcategory: "acl",
    source_type: "research",
    source_title: "Sugimoto D (2015) - ACL prevention meta-analysis",
    evidence_grade: "A",
    risk_level: "medium",
    requires_professional: false,
    source_quality_score: 0.94,
    is_active: true,
    content: `## ACL Injury Prevention

Prevention programs can reduce ACL injury risk by 50-70%.

### Risk Factors
- Knee valgus during landing/cutting
- Quadriceps dominant activation
- Weak hamstrings
- Poor landing mechanics

### Hamstring:Quadriceps Ratio

**Optimal H:Q Ratio**: 0.6-0.8

**Why It Matters**:
- Hamstrings counteract anterior tibial shear
- Low ratio = increased ACL strain

### Key Prevention Exercises

**1. Eccentric Hamstring Training**
- Nordic hamstring curls (gold standard)
- Romanian deadlifts
- 2-3x per week

**2. Hip Strengthening**
- Lateral band walks
- Single-leg glute bridges
- Clamshells

**3. Landing Mechanics**
- Box drop to stick landing
- Single-leg landing progressions
- Focus: soft knees, no valgus

**4. Cutting Technique**
- Pre-planned cuts → reactive cuts
- Trunk control during direction change

### Sample Prevention Protocol (FIFA 11+)
20 minutes, 2-3x per week:
- Running exercises
- Strength & balance
- Plyometrics

**Sources**: Sugimoto D (2015) Br J Sports Med; Hewett TE (2005) Am J Sports Med`,
  },
  {
    title: "Ankle Sprain Prevention and Recovery",
    category: "injury_prevention",
    subcategory: "ankle",
    source_type: "research",
    source_title: "Doherty C (2017) - Treatment of ankle sprains",
    evidence_grade: "A",
    risk_level: "medium",
    requires_professional: false,
    source_quality_score: 0.89,
    is_active: true,
    content: `## Ankle Sprain Prevention

Prevention and proper rehab reduce recurrence by 50%.

### Risk Factors
- Previous ankle sprain (biggest risk!)
- Poor balance/proprioception
- Inadequate warm-up
- Fatigue

### Prevention Strategies

**1. Balance Training** (Most effective!)
- Single-leg stance: 30 sec each leg
- Eyes closed progression
- Unstable surface progression

**2. Ankle Strengthening**
- Resistance band 4-way
- Calf raises
- Toe walks and heel walks

**3. Taping/Bracing**
- Recommended for athletes with history of sprains
- Lace-up braces as effective as tape

### Acute Sprain Management (PRICE)

| Step | Action |
|------|--------|
| Protect | Brace/crutches if needed |
| Rest | Avoid painful activities |
| Ice | 15-20 min every 2-3 hours |
| Compress | Elastic bandage |
| Elevate | Above heart level |

### Return to Play Criteria
- Full range of motion
- 90% strength compared to other side
- Single-leg balance equal both sides
- Sport-specific movements pain-free

**Sources**: Doherty C (2017) J Athl Train; Hupperets MD (2009) BMJ`,
  },

  // =========================================================================
  // RECOVERY AND SLEEP
  // =========================================================================
  {
    title: "Sleep and Athletic Recovery",
    category: "recovery",
    subcategory: "sleep",
    source_type: "research",
    source_title: "Watson AM (2017) - Sleep and Athletic Performance",
    evidence_grade: "A",
    risk_level: "low",
    requires_professional: false,
    source_quality_score: 0.92,
    is_active: true,
    content: `## Sleep: The Ultimate Recovery Tool

Sleep is when your body repairs, builds muscle, and consolidates skills.

### Why Sleep Matters for Athletes

**Muscle Repair & Growth**
- 70% of growth hormone released during deep sleep
- Muscle protein synthesis peaks during sleep
- Sleep deprivation reduces muscle recovery by up to 60%

**Performance Impact**
- <6 hours sleep = 11% decrease in time to exhaustion
- Reaction time worsens with each hour of lost sleep
- Injury risk increases 1.7x with <8 hours sleep

### Sleep Recommendations

| Age Group | Hours Needed |
|-----------|-------------|
| Teens (14-17) | 8-10 hours |
| Adults (18-64) | 7-9 hours |
| Athletes | 8-10 hours (ideally 9+) |

### Sleep Hygiene Checklist
- Consistent sleep/wake times (±30 min)
- Cool room (65-68°F / 18-20°C)
- Dark environment
- No screens 1 hour before bed
- Avoid caffeine after 2 PM

### Napping for Athletes
- Ideal duration: 20-30 min OR 90 min
- Best timing: Early afternoon (1-3 PM)
- Avoid after 4 PM

### Signs of Sleep Debt
- Difficulty waking up
- Needing caffeine to function
- Irritability
- Decreased motivation
- Getting sick frequently

**Sources**: Watson AM (2017) Curr Sports Med Rep; Mah CD (2011) Sleep`,
  },
  {
    title: "Active Recovery and Rest Days",
    category: "recovery",
    subcategory: "active_recovery",
    source_type: "research",
    source_title: "Dupuy O (2018) - Recovery after exercise meta-analysis",
    evidence_grade: "B",
    risk_level: "low",
    requires_professional: false,
    source_quality_score: 0.85,
    is_active: true,
    content: `## Active Recovery Guide

Complete rest isn't always best. Active recovery can enhance adaptation.

### Active vs Passive Recovery

**Active Recovery**:
- Low-intensity movement (30-50% max effort)
- Promotes blood flow
- Clears metabolic waste
- Maintains range of motion

**Passive Recovery**:
- Complete rest
- Appropriate after extreme fatigue or injury

### Effective Active Recovery Methods

**1. Low-Intensity Cardio**
- Walking (20-30 min)
- Swimming (easy laps)
- Cycling (light resistance)
- Target: 50-60% max heart rate

**2. Mobility Work**
- Foam rolling (1-2 min per muscle group)
- Dynamic stretching
- Yoga or Pilates

### Recovery Modalities Comparison

| Method | Evidence | Best For |
|--------|----------|----------|
| Active recovery | Strong | Muscle soreness |
| Foam rolling | Moderate | Muscle tension |
| Cold water immersion | Moderate | Acute inflammation |
| Massage | Moderate | Relaxation |

### Signs You Need More Recovery
- Persistent muscle soreness (>72 hours)
- Decreased performance
- Poor sleep quality
- Elevated resting heart rate
- Mood disturbances

**Sources**: Dupuy O (2018) Front Physiol; Peake JM (2017) Sports Med`,
  },

  // =========================================================================
  // WARM-UP AND GAME PREPARATION
  // =========================================================================
  {
    title: "Dynamic Warm-Up Protocol for Flag Football",
    category: "game_preparation",
    subcategory: "warmup",
    source_type: "research",
    source_title: "Blazevich AJ (2018) - Effects of warm-up on performance",
    evidence_grade: "A",
    risk_level: "low",
    requires_professional: false,
    source_quality_score: 0.9,
    is_active: true,
    content: `## Evidence-Based Dynamic Warm-Up

Dynamic stretching before activity enhances performance better than static stretching.

### Research Findings
- Dynamic warm-up improves power and sprint performance
- Static stretching may temporarily reduce strength/power
- Effects last through competition (45+ minutes)

### Flag Football Dynamic Warm-Up (15-20 min)

**Phase 1: General Movement (5 min)**
1. Light jog - 2 lengths
2. High knees - 15 yards
3. Butt kicks - 15 yards
4. Lateral shuffle - 15 yards each direction
5. Carioca - 15 yards each direction

**Phase 2: Dynamic Stretches (5 min)**
1. Leg swings (front/back) - 10 each leg
2. Leg swings (side/side) - 10 each leg
3. Walking lunges with rotation - 10 steps
4. Walking RDL - 8 each leg
5. World's greatest stretch - 3 each side

**Phase 3: Activation (3 min)**
1. Glute bridges - 10 reps
2. Band walks (lateral) - 10 each direction
3. Squat jumps - 5 reps

**Phase 4: Sport-Specific (5 min)**
1. Route running at 75% speed
2. Backpedal to sprint transitions
3. Cutting drills (5 each direction)

### Common Mistakes
- Too short (<10 min)
- Static stretching as primary method
- Warming up too early (>20 min before start)

**Sources**: Blazevich AJ (2018) Br J Sports Med; McCrary JM (2015) J Sports Sci`,
  },

  // =========================================================================
  // MENTAL PERFORMANCE
  // =========================================================================
  {
    title: "Visualization and Mental Rehearsal for Athletes",
    category: "mental_performance",
    subcategory: "visualization",
    source_type: "research",
    source_title: "Slimani M (2016) - Mental imagery meta-analysis",
    evidence_grade: "A",
    risk_level: "low",
    requires_professional: false,
    source_quality_score: 0.88,
    is_active: true,
    content: `## Mental Visualization Guide

Visualization activates the same neural pathways as physical practice.

### Research-Backed Benefits
- Improved motor skill execution
- Enhanced confidence
- Better performance under pressure
- Faster skill acquisition

### How to Visualize Effectively

**1. Create Vivid Imagery**
Use all senses:
- Visual: See the field, players, ball
- Auditory: Hear the snap count, crowd
- Kinesthetic: Feel your muscles, ground contact
- Emotional: Experience confidence, focus

**2. First-Person vs Third-Person**
- First-person: See through your own eyes (best for execution)
- Third-person: Watch yourself (good for technique analysis)

### Visualization Protocol

**Daily Practice (5-10 min)**
1. Find quiet space, close eyes
2. Deep breaths to relax (30 seconds)
3. Set the scene (where, when, conditions)
4. Run through key plays/skills
5. Include emotional response
6. Visualize successful outcome

**Pre-Competition (5 min)**
- Focus on first few plays
- Confident, calm state
- See yourself ready

### Sport-Specific Applications

**Quarterback**: Reading defense, throwing mechanics, timing
**Receiver**: Run routes, feel break points, see catches
**Defensive Back**: Read receiver's hips, break on ball

**Sources**: Slimani M (2016) Int J Sport Exerc Psychol; Afrouzeh M (2024) Percept Mot Skills`,
  },
  {
    title: "Managing Performance Anxiety",
    category: "mental_performance",
    subcategory: "anxiety",
    source_type: "research",
    source_title: "Brooks AW (2014) - Reappraising Performance Anxiety",
    evidence_grade: "B",
    risk_level: "low",
    requires_professional: false,
    source_quality_score: 0.86,
    is_active: true,
    content: `## Performance Anxiety Management

Some anxiety is normal and can enhance performance. Too much impairs it.

### Techniques to Manage Anxiety

**1. Controlled Breathing**
*4-7-8 Technique*:
- Inhale for 4 counts
- Hold for 7 counts
- Exhale for 8 counts
- Repeat 3-4 times

*Box Breathing*:
- Inhale 4 counts
- Hold 4 counts
- Exhale 4 counts
- Hold 4 counts

**2. Cognitive Reframing**
Change "I'm nervous" to "I'm excited"
- Same physiological response
- Different interpretation
- Improves performance

**3. Focus Cues**
- Create simple action cues
- "See ball, catch ball"
- "Explode off the line"
- Keeps mind on process, not outcome

**4. Pre-Performance Routine**
- Consistent actions before every play
- Creates sense of control
- Anchors confident state

### Pre-Game Anxiety Protocol

**2 Hours Before**: Light activity, visualization
**30 Minutes Before**: Dynamic warm-up, music
**Right Before**: Breathing exercises, focus cues

### Signs You Need Professional Help
- Anxiety prevents participation
- Physical symptoms are severe
- Panic attacks
- Can't control worry

**Sources**: Brooks AW (2014) J Exp Psychol Gen; Hanton S (2008) J Sports Sci`,
  },

  // =========================================================================
  // COMMON QUESTIONS
  // =========================================================================
  {
    title: "What is RPE and How to Use It",
    category: "faq",
    subcategory: "training_basics",
    source_type: "educational",
    source_title: "Foster C (2001) - Monitoring exercise training",
    evidence_grade: "A",
    risk_level: "low",
    requires_professional: false,
    source_quality_score: 0.9,
    is_active: true,
    content: `## RPE (Rate of Perceived Exertion) Explained

RPE is a simple 0-10 scale to measure how hard a workout feels.

### The Scale

| RPE | Description | Can You Talk? |
|-----|-------------|---------------|
| 0-1 | Rest / Very light | Normal conversation |
| 2-3 | Light activity | Easy to talk |
| 4-5 | Moderate | Slightly breathless |
| 6-7 | Hard | Talking difficult |
| 8-9 | Very hard | Few words only |
| 10 | Maximum effort | Cannot talk |

### Why Use RPE?
- No equipment needed
- Accounts for daily variation
- Validated by research
- Works for any type of training
- Helps prevent overtraining

### How to Rate Accurately
1. Wait 15-30 minutes after workout
2. Consider entire session
3. Be honest
4. Account for conditions

### Using RPE for Training

**Easy/Recovery Session**: RPE 2-4
**Moderate Session**: RPE 5-6
**Hard Session**: RPE 7-8
**Maximum Effort**: RPE 9-10

### Calculating Training Load
Session Load = RPE × Duration (minutes)

Example: 90-minute practice at RPE 6 = 540 AU

**Source**: Foster C (2001) J Strength Cond Res`,
  },
  {
    title: "How Much Water Should I Drink?",
    category: "faq",
    subcategory: "hydration",
    source_type: "educational",
    source_title: "ACSM (2007) - Exercise and Fluid Replacement",
    evidence_grade: "A",
    risk_level: "low",
    requires_professional: false,
    source_quality_score: 0.88,
    is_active: true,
    content: `## Hydration Guidelines for Athletes

Water needs vary by person, activity level, and environment.

### Daily Baseline
- General guideline: Half your body weight (lbs) in ounces
- Example: 160 lb person → 80 oz (~2.4L) daily
- This is BEFORE adding exercise needs

### Exercise Hydration

**Before Exercise (2-4 hours)**: 5-7 mL per kg body weight
**During Exercise**: 400-800 mL per hour
**After Exercise**: 1.5L per kg body weight lost

### Simple Hydration Check
**Urine Color Guide**:
- Pale yellow = Well hydrated
- Yellow = OK, drink soon
- Dark yellow = Dehydrated
- Brown = Severely dehydrated

### When to Add Electrolytes
- Exercise > 60 minutes
- Heavy sweating
- Hot/humid conditions
- Multiple training sessions per day

### Quick Reference

| Situation | Fluid Recommendation |
|-----------|---------------------|
| Wake up | 500 mL water |
| 2 hrs pre-game | 500-750 mL |
| During practice | 400-800 mL/hour |
| Post-practice | 500-1000 mL + electrolytes |

### Hydration Mistakes
- Waiting until thirsty
- Only drinking during exercise
- Too much water without electrolytes

**Source**: ACSM (2007) Med Sci Sports Exerc`,
  },
];

async function seedKnowledgeBase() {
  console.log("🧠 Seeding Knowledge Base with Evidence-Based Content...\n");

  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (const entry of knowledgeEntries) {
    try {
      // Check if entry exists (by title)
      const { data: existing } = await supabase
        .from("knowledge_base_entries")
        .select("id")
        .eq("title", entry.title)
        .single();

      if (existing) {
        // Update existing entry
        const { error } = await supabase
          .from("knowledge_base_entries")
          .update({
            ...entry,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (error) {
          throw error;
        }
        updated++;
        console.log(`📝 Updated: ${entry.title}`);
      } else {
        // Insert new entry
        const { error } = await supabase
          .from("knowledge_base_entries")
          .insert(entry);

        if (error) {
          throw error;
        }
        inserted++;
        console.log(`✅ Inserted: ${entry.title}`);
      }
    } catch (error) {
      errors++;
      console.error(`❌ Error with "${entry.title}":`, error.message);
    }
  }

  console.log("\n📊 Summary:");
  console.log(`   ✅ Inserted: ${inserted}`);
  console.log(`   📝 Updated: ${updated}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   📚 Total entries: ${knowledgeEntries.length}`);
}

// Run the seed
seedKnowledgeBase()
  .then(() => {
    console.log("\n✨ Knowledge base seeding complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Seeding failed:", error);
    process.exit(1);
  });
