-- =============================================================================
-- TRAINING LOAD, ISOMETRICS & PERIODIZATION KNOWLEDGE BASE EXPANSION
-- =============================================================================

-- =============================================================================
-- SECTION 1: TRAINING LOAD MONITORING (EXPANDED)
-- =============================================================================

INSERT INTO knowledge_base_entries (title, content, category, subcategory, source_type, source_title, publication_date, evidence_grade, source_quality_score, is_active) VALUES
(
    'ACWR: Acute to Chronic Workload Ratio Deep Dive',
    'The ACWR is a key metric for managing training load and injury risk.

**Calculation Methods:**

**Rolling Average (Traditional):**
- Acute load: Sum of last 7 days
- Chronic load: Average of last 28 days (sum/4)
- ACWR = Acute / Chronic
- Simple but has limitations

**Exponentially Weighted Moving Average (EWMA):**
- Gives more weight to recent loads
- Better accounts for decay of fitness/fatigue
- More sensitive to recent changes
- Recommended by recent research

**Interpreting ACWR:**

**Sweet Spot (0.8-1.3):**
- Optimal training zone
- Progressive overload occurring
- Lowest relative injury risk
- Target for most training periods

**Danger Zone (>1.5):**
- Spike in training load
- Significantly elevated injury risk
- May indicate poor planning
- Requires immediate attention

**Under-Training (<0.8):**
- Chronic load declining
- Detraining may occur
- Athlete may be underprepared
- Common during tapers or injury

**Limitations:**
- Doesn''t account for load type
- Individual responses vary
- Absolute loads also matter
- One metric among many

**Best Practices:**
- Track consistently over time
- Use with other markers (wellness, performance)
- Consider sport-specific demands
- Don''t use in isolation
- Week-to-week changes <10% ideal',
    'training_load',
    'acwr',
    'research_synthesis',
    'ACWR Research - Gabbett et al.',
    '2024-01-01',
    'A',
    9.0,
    true
),
(
    'Session RPE Method for Load Monitoring',
    'Session RPE (sRPE) is a simple, valid method for quantifying training load.

**The Method:**
- Rate session difficulty 0-10 (CR-10 scale)
- Multiply by session duration (minutes)
- Result = session load (arbitrary units)

**RPE Scale:**
- 0: Rest
- 1-2: Very easy
- 3-4: Easy/moderate
- 5-6: Somewhat hard
- 7-8: Hard
- 9: Very hard
- 10: Maximal

**Timing:**
- Collect 10-30 minutes post-session
- Allows integration of entire session
- Too early = influenced by end of session
- Consistent timing important

**Calculating Weekly Load:**
- Sum all session loads
- Track week-to-week changes
- Calculate ACWR from sRPE data

**Validity:**
- Correlates well with HR-based methods
- Valid across different sports
- Sensitive to training changes
- Cost-effective and practical

**Implementation Tips:**
- Educate athletes on scale use
- Practice before relying on data
- Use consistently
- Compare within individuals, not between
- Combine with objective measures

**Example Calculation:**
- 60-minute practice, RPE = 7
- Session load = 60 × 7 = 420 AU
- Sum weekly sessions for total load

**Limitations:**
- Subjective (but that''s also a strength)
- Requires athlete buy-in
- Doesn''t capture load type
- Individual interpretation varies',
    'training_load',
    'rpe',
    'research_synthesis',
    'Session RPE Research - Foster et al.',
    '2024-01-01',
    'A',
    9.0,
    true
),
(
    'Monitoring Athlete Wellness and Readiness',
    'Daily wellness monitoring provides early warning signs of maladaptation.

**Key Wellness Markers:**

**Sleep:**
- Quality (1-5 scale)
- Duration (hours)
- Most predictive of readiness
- Poor sleep = reduced recovery

**Fatigue:**
- General fatigue level (1-5)
- Muscle soreness (1-5)
- Elevated = need recovery
- Track trends, not single days

**Stress:**
- Life stress (1-5)
- Affects recovery capacity
- Consider total stress load
- May need training adjustment

**Mood:**
- General mood state (1-5)
- Motivation to train
- Early indicator of overreaching
- Persistent low mood = concern

**Wellness Questionnaire Example:**
Rate 1-5 (1=very poor, 5=very good):
1. Sleep quality last night
2. Energy levels today
3. Muscle soreness
4. Stress levels
5. Mood/motivation

**Using the Data:**

**Green Light (Score 20-25):**
- Train as planned
- Good readiness
- Recovery adequate

**Yellow Light (Score 15-19):**
- Monitor closely
- Consider reducing intensity
- Check individual markers

**Red Light (Score <15):**
- Reduce training load
- Prioritize recovery
- Investigate cause

**Best Practices:**
- Collect daily, same time
- Keep it short (<2 min)
- Act on the data
- Look for trends
- Combine with performance data',
    'training_load',
    'wellness',
    'research_synthesis',
    'Athlete Monitoring Research',
    '2024-01-01',
    'A',
    8.5,
    true
),
(
    'Recognizing and Preventing Overtraining Syndrome',
    'Overtraining syndrome (OTS) is a serious condition requiring extended recovery.

**Terminology:**
- **Functional Overreaching**: Short-term performance decline, recovers in days-weeks
- **Non-Functional Overreaching**: Performance decline lasting weeks-months
- **Overtraining Syndrome**: Severe, prolonged performance decline + symptoms

**Warning Signs:**

**Performance:**
- Unexplained performance decline
- Unable to complete normal training
- Decreased strength/power
- Slower recovery between sessions

**Physiological:**
- Persistent fatigue
- Frequent illness
- Altered heart rate (rest and exercise)
- Sleep disturbances
- Appetite changes
- Weight loss

**Psychological:**
- Mood disturbances
- Decreased motivation
- Irritability
- Depression symptoms
- Loss of competitive drive

**Risk Factors:**
- Rapid training load increases
- Monotonous training
- Inadequate recovery
- Poor nutrition
- Life stress
- Insufficient sleep

**Prevention:**

**Training:**
- Progressive overload (≤10%/week)
- Periodization with recovery weeks
- Varied training stimuli
- Monitor training load

**Recovery:**
- Adequate sleep (8-10 hours)
- Proper nutrition
- Planned rest days
- Active recovery

**Monitoring:**
- Track wellness markers
- Performance testing
- Listen to athletes
- Act on early signs

**Treatment:**
- Extended rest (weeks to months)
- Address contributing factors
- Gradual return to training
- Psychological support if needed
- Medical evaluation',
    'training_load',
    'overtraining',
    'research_synthesis',
    'Overtraining Syndrome Research',
    '2024-01-01',
    'A',
    9.0,
    true
);

-- =============================================================================
-- SECTION 2: ISOMETRIC TRAINING (EXPANDED)
-- =============================================================================

INSERT INTO knowledge_base_entries (title, content, category, subcategory, source_type, source_title, publication_date, evidence_grade, source_quality_score, is_active) VALUES
(
    'Isometric Training: Types and Applications',
    'Isometric training involves muscle contraction without joint movement.

**Types of Isometric Contractions:**

**Yielding Isometrics:**
- Holding a position against gravity/load
- Example: Wall sit, plank
- Develops strength at specific angle
- Good for beginners

**Overcoming Isometrics:**
- Pushing/pulling against immovable object
- Maximum effort contractions
- Develops rate of force development
- More advanced application

**Quasi-Isometrics:**
- Very slow movement through range
- Maintains tension throughout
- Combines isometric and dynamic benefits
- Example: 10-second squat descent

**Benefits:**
- Angle-specific strength gains
- Minimal muscle damage
- Can train around injuries
- Develops RFD
- Easy to standardize

**Applications:**

**Injury Prevention:**
- Tendon loading (tendinopathy)
- Muscle activation
- Addressing weak points

**Rehabilitation:**
- Pain-free loading option
- Early-stage strengthening
- Maintaining strength during injury

**Performance:**
- Sticking point training
- Rate of force development
- Sport-specific positions

**Programming Variables:**
- Intensity: % of maximum voluntary contraction
- Duration: 3-45 seconds depending on goal
- Sets/reps: Typically 3-5 sets
- Rest: 60-180 seconds
- Frequency: 2-4x per week',
    'training',
    'isometrics',
    'research_synthesis',
    'Isometric Training Research',
    '2024-01-01',
    'A',
    9.0,
    true
),
(
    'Isometric Training for Tendinopathy',
    'Isometric exercise is a first-line treatment for tendon pain.

**Mechanism:**
- Provides load without length change
- Stimulates tendon adaptation
- May have analgesic (pain-relieving) effect
- Maintains strength during rehabilitation

**Protocols:**

**Pain Relief Protocol:**
- 5 x 45-second holds
- 70% maximum voluntary contraction
- 2-minute rest between sets
- 2-3x daily
- Immediate pain relief possible

**Strength Maintenance Protocol:**
- 4-5 x 30-45 second holds
- 70-80% MVC
- Once daily
- During activity modification phase

**Evidence:**

**Patellar Tendinopathy:**
- Single-leg decline squat hold
- Knee at 60° flexion
- 70% MVC
- Significant pain reduction

**Achilles Tendinopathy:**
- Heel raise hold
- Single or double leg
- Progress to weighted

**Lateral Elbow Tendinopathy:**
- Wrist extension hold
- Grip strength holds
- Tyler twist variations

**Rotator Cuff Tendinopathy:**
- External rotation holds
- Shoulder elevation holds
- Progress load gradually

**Integration with Rehabilitation:**
- Start with isometrics (pain allowing)
- Progress to isotonic loading
- Add eccentric loading
- Return to sport-specific loading

**Key Points:**
- Isometrics are a starting point, not endpoint
- Must progress to dynamic loading
- Individual response varies
- May take 2-4 weeks for adaptation',
    'training',
    'isometrics',
    'research_synthesis',
    'Isometrics for Tendinopathy Research',
    '2024-01-01',
    'A',
    9.0,
    true
),
(
    'Rate of Force Development Training',
    'Rate of force development (RFD) is critical for athletic performance.

**What is RFD?**
- How quickly force can be produced
- Measured in N/s or N/ms
- Critical when ground contact times are short
- Different from maximum strength

**Why RFD Matters:**
- Sprint ground contact: 80-200ms
- Cutting/jumping: 150-300ms
- Maximum strength takes 300-600ms to develop
- Must produce force quickly to use strength

**Training Methods:**

**1. Explosive Isometrics:**
- Push against immovable resistance
- Maximum effort, explosive intent
- 3-5 second efforts
- 3-5 sets of 3-5 reps
- Full recovery between sets

**2. Ballistic Training:**
- Jump squats, throws
- Accelerate through entire range
- Light to moderate loads
- Focus on speed of movement

**3. Olympic Lifts:**
- Clean, snatch, derivatives
- High velocity, moderate load
- Technical proficiency required
- Excellent RFD developers

**4. Plyometrics:**
- Rapid stretch-shortening cycle
- Develops reactive RFD
- Progress intensity gradually
- Sport-specific variations

**5. Contrast Training:**
- Heavy load followed by light/explosive
- Post-activation potentiation
- Example: Heavy squat → jump squat

**Programming:**
- Train RFD when fresh (early in session)
- Quality over quantity
- Full recovery between sets
- 2-3x per week
- Maintain maximum strength base

**Assessment:**
- Isometric mid-thigh pull
- Countermovement jump
- Force plate analysis
- Track changes over time',
    'training',
    'strength',
    'research_synthesis',
    'Rate of Force Development Research',
    '2024-01-01',
    'A',
    9.0,
    true
);

-- =============================================================================
-- SECTION 3: PERIODIZATION
-- =============================================================================

INSERT INTO knowledge_base_entries (title, content, category, subcategory, source_type, source_title, publication_date, evidence_grade, source_quality_score, is_active) VALUES
(
    'Periodization Models for Team Sport Athletes',
    'Periodization organizes training into phases to optimize performance.

**Traditional (Linear) Periodization:**
- High volume → high intensity progression
- Works well for individual sports with single peak
- Less suitable for long competition seasons
- Foundation for other models

**Block Periodization:**
- Concentrated training blocks (2-4 weeks)
- Focus on 1-2 qualities per block
- Accumulation → Transmutation → Realization
- Good for advanced athletes

**Undulating Periodization:**

**Daily Undulating (DUP):**
- Vary intensity/volume each session
- Example: Mon=Strength, Wed=Power, Fri=Hypertrophy
- Good for maintaining multiple qualities
- Suits team sport athletes

**Weekly Undulating:**
- Vary emphasis each week
- Less frequent variation than DUP
- Easier to program

**Conjugate/Concurrent:**
- Train multiple qualities simultaneously
- Rotate exercises, not qualities
- Maintains all physical qualities
- Common in team sports

**Team Sport Considerations:**
- Long competition seasons
- Need to maintain multiple qualities
- Recovery between games priority
- In-season maintenance focus

**In-Season Periodization:**
- Reduce volume, maintain intensity
- 2-3 strength sessions per week
- Prioritize recovery around games
- Maintain speed/power qualities

**Off-Season Periodization:**
- Build work capacity
- Address weaknesses
- Progressive overload
- Prepare for pre-season',
    'training',
    'periodization',
    'research_synthesis',
    'Periodization Research for Team Sports',
    '2024-01-01',
    'A',
    9.0,
    true
),
(
    'Tapering and Peaking for Competition',
    'Proper tapering maximizes performance for key competitions.

**What is Tapering?**
- Systematic reduction in training load
- Maintains intensity while reducing volume
- Allows accumulated fatigue to dissipate
- Fitness is retained while freshness improves

**Taper Duration:**
- Typically 7-21 days
- Longer for endurance sports
- Shorter for strength/power sports
- Individual response varies

**Taper Types:**

**Step Taper:**
- Sudden reduction in load
- Maintain for taper duration
- Simple to implement
- May not be optimal

**Linear Taper:**
- Progressive reduction in load
- Gradual decrease over time
- Easy to plan
- Moderate effectiveness

**Exponential Taper:**
- Rapid initial reduction
- Slower reduction as competition approaches
- Research suggests most effective
- More complex to implement

**Volume vs Intensity:**
- Reduce volume 40-60%
- Maintain or slightly reduce intensity
- Frequency: Reduce slightly or maintain
- Key: Don''t reduce intensity significantly

**Research Findings:**
- Performance improvements of 2-3% typical
- Can be difference between winning and losing
- Over-tapering possible (detraining)
- Under-tapering common (not enough recovery)

**Practical Guidelines:**
- Test taper strategies in training
- Individual response varies
- Maintain confidence in taper
- Don''t add new training elements
- Trust the process

**For Team Sports:**
- Shorter tapers (5-10 days)
- Maintain technical/tactical work
- Reduce physical training volume
- Prioritize recovery',
    'training',
    'periodization',
    'research_synthesis',
    'Tapering Research - Mujika & Padilla',
    '2024-01-01',
    'A',
    9.0,
    true
),
(
    'Deload Weeks: When and How',
    'Strategic deload weeks prevent overtraining and enhance adaptation.

**What is a Deload?**
- Planned reduction in training stress
- Allows recovery and adaptation
- Prevents accumulated fatigue
- Prepares for next training block

**When to Deload:**

**Planned (Proactive):**
- Every 3-6 weeks of hard training
- End of training blocks
- Before competition phases
- Based on periodization plan

**Reactive (When Needed):**
- Performance declining
- Wellness markers dropping
- Accumulated fatigue signs
- Motivation decreasing

**How to Deload:**

**Volume Reduction (Most Common):**
- Reduce sets/reps by 40-60%
- Maintain exercise selection
- Maintain intensity
- Example: 4 sets → 2 sets

**Intensity Reduction:**
- Reduce load by 10-20%
- Maintain volume
- Less common approach
- May feel "too easy"

**Frequency Reduction:**
- Fewer training sessions
- Maintain session structure
- Good for accumulated fatigue
- Example: 4 sessions → 2-3 sessions

**Active Recovery Week:**
- Light activity only
- Cross-training
- Mobility work
- Mental break

**Duration:**
- Typically 5-7 days
- Can be 3-4 days if well-timed
- Rarely longer than 10 days
- Individual needs vary

**What NOT to Do:**
- Complete rest (usually)
- Introduce new exercises
- Test maxes
- Add extra conditioning

**Signs Deload Worked:**
- Improved energy
- Better sleep
- Renewed motivation
- Performance improvement
- Reduced soreness',
    'training',
    'periodization',
    'research_synthesis',
    'Deload Research and Guidelines',
    '2024-01-01',
    'A',
    8.5,
    true
);

-- =============================================================================
-- SECTION 4: MUSCLE FIBER TYPES
-- =============================================================================

INSERT INTO knowledge_base_entries (title, content, category, subcategory, source_type, source_title, publication_date, evidence_grade, source_quality_score, is_active) VALUES
(
    'Muscle Fiber Types and Athletic Performance',
    'Understanding muscle fiber types helps optimize training for specific sports.

**Fiber Type Classification:**

**Type I (Slow Twitch):**
- High oxidative capacity
- Fatigue resistant
- Lower force production
- Suited for endurance
- Red appearance (myoglobin)

**Type IIa (Fast Twitch Oxidative):**
- Intermediate characteristics
- Good power AND endurance
- Adaptable to training
- Important for most sports

**Type IIx (Fast Twitch Glycolytic):**
- Highest force/power production
- Fatigue quickly
- Low oxidative capacity
- Critical for explosive sports
- White appearance

**Distribution:**
- Genetically influenced (50-60%)
- Training can shift IIx ↔ IIa
- Cannot convert Type I ↔ Type II
- Elite sprinters: 70-80% Type II
- Elite endurance: 70-80% Type I

**Training Effects:**

**Endurance Training:**
- Increases Type I characteristics
- Shifts IIx → IIa
- Improves oxidative capacity
- May reduce power potential

**Strength/Power Training:**
- Maintains/increases Type II characteristics
- Can shift IIa → IIx (with detraining)
- Increases force production
- Preserves explosive capacity

**Concurrent Training:**
- Can cause "interference effect"
- Type II may shift toward Type I
- Careful programming needed
- Separate sessions when possible

**Implications for Flag Football:**
- Need mix of fiber types
- Repeated sprint ability (Type IIa)
- Explosive plays (Type IIx)
- Game endurance (Type I support)
- Train all qualities',
    'training',
    'muscle_fiber',
    'research_synthesis',
    'Muscle Fiber Type Research',
    '2024-01-01',
    'A',
    8.5,
    true
);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'TRAINING LOAD & ISOMETRICS EXPANSION COMPLETE';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Added entries:';
    RAISE NOTICE '  - Training Load Monitoring: 4 entries';
    RAISE NOTICE '  - Isometric Training: 3 entries';
    RAISE NOTICE '  - Periodization: 3 entries';
    RAISE NOTICE '  - Muscle Fiber Types: 1 entry';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'TOTAL NEW ENTRIES: 11 evidence-based articles';
    RAISE NOTICE '===========================================';
END $$;

