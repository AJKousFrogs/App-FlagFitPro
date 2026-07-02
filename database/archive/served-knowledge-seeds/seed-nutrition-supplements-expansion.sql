-- =============================================================================
-- NUTRITION & SUPPLEMENTS KNOWLEDGE BASE EXPANSION
-- Adds comprehensive evidence-based nutrition and supplement entries
-- =============================================================================

-- =============================================================================
-- SECTION 1: MACRONUTRIENT TIMING & PERIODIZATION
-- =============================================================================

INSERT INTO knowledge_base_entries (title, content, category, subcategory, source_type, source_title, publication_date, evidence_grade, source_quality_score, is_active) VALUES
(
    'Carbohydrate Periodization for Athletes',
    'Strategic carbohydrate manipulation optimizes training adaptations and performance.

**Fuel for the Work Required:**
Match carbohydrate intake to training demands rather than fixed daily amounts.

**High Carbohydrate Days (8-12 g/kg):**
- Competition days
- High-intensity training
- Multiple sessions
- Glycogen-depleting workouts

**Moderate Carbohydrate Days (5-7 g/kg):**
- Moderate training days
- Skill/technical sessions
- Single moderate session

**Low Carbohydrate Days (3-5 g/kg):**
- Rest days
- Light recovery sessions
- Low-intensity aerobic work

**Train Low Strategies:**

**Sleep Low:**
- Evening training, skip carbs at dinner
- Morning fasted training
- Enhances fat oxidation capacity
- Use for aerobic adaptations

**Train Low:**
- Deliberate low glycogen training
- Enhances mitochondrial adaptations
- Not for high-intensity work
- 1-2x per week maximum

**Cautions:**
- Don''t train low for key sessions
- Maintain protein intake
- Monitor energy availability
- Not appropriate for all athletes

**Competition Preparation:**
- Carb loading 24-48 hours before
- 10-12 g/kg/day
- Reduce fiber intake
- Familiar foods only',
    'nutrition',
    'macronutrients',
    'research_synthesis',
    'Carbohydrate Periodization Research - Burke et al.',
    '2024-01-01',
    'A',
    9.0,
    true
),
(
    'Protein Distribution and Timing',
    'How protein is distributed throughout the day matters for muscle protein synthesis.

**Optimal Distribution:**
- 4-5 protein doses per day
- 0.4-0.5 g/kg per meal
- Every 3-5 hours
- Even distribution superior to skewed

**Per-Meal Recommendations:**
- Minimum: 20g high-quality protein
- Optimal: 30-40g per meal
- Upper useful limit: ~40-50g
- More may be oxidized, not used for MPS

**Timing Considerations:**

**Pre-Exercise (1-3 hours before):**
- 20-40g protein
- With carbohydrates
- Familiar, easily digested
- Starts MPS before training

**Post-Exercise (0-2 hours after):**
- 20-40g protein
- The "anabolic window" is wider than once thought
- More important if training fasted
- Combine with carbohydrates

**Before Sleep:**
- 30-40g casein or mixed protein
- Sustains overnight MPS
- Particularly important during heavy training
- May improve recovery

**Protein Quality:**
- Leucine content key (2.5-3g per dose)
- Complete amino acid profile
- Animal sources generally superior
- Plant sources: combine or use more

**Practical Tips:**
- Include protein at every meal
- Don''t skip breakfast protein
- Pre-bed protein beneficial
- Supplement if meals inadequate',
    'nutrition',
    'macronutrients',
    'research_synthesis',
    'Protein Timing Research',
    '2024-01-01',
    'A',
    9.0,
    true
),
(
    'Fat Intake for Athletic Performance',
    'Dietary fat is essential for health and performance in athletes.

**Recommended Intake:**
- 20-35% of total calories
- Minimum 0.5-1.0 g/kg/day
- Don''t go below 20% long-term
- Quality matters more than exact amount

**Essential Functions:**
- Hormone production (testosterone, estrogen)
- Cell membrane integrity
- Fat-soluble vitamin absorption (A, D, E, K)
- Brain function
- Inflammation regulation

**Fat Types:**

**Prioritize:**
- Monounsaturated (olive oil, avocados, nuts)
- Omega-3 polyunsaturated (fatty fish, flaxseed)
- Some saturated (needed for hormones)

**Limit:**
- Trans fats (avoid completely)
- Excessive saturated fat
- Highly processed oils

**Omega-3 Recommendations:**
- EPA + DHA: 1-2g daily
- Fatty fish 2-3x per week
- Or supplement if not eating fish
- Benefits: Recovery, inflammation, brain health

**Timing Considerations:**
- Reduce fat close to training (slows digestion)
- Include with meals for satiety
- Spread throughout day
- Pre-competition: Lower fat meals

**Low-Fat Diets - Cautions:**
- May impair hormone production
- Can reduce fat-soluble vitamin absorption
- Associated with menstrual dysfunction
- Not recommended below 20% calories',
    'nutrition',
    'macronutrients',
    'research_synthesis',
    'Dietary Fat Research for Athletes',
    '2024-01-01',
    'A',
    8.5,
    true
);

-- =============================================================================
-- SECTION 2: HYDRATION ADVANCED
-- =============================================================================

INSERT INTO knowledge_base_entries (title, content, category, subcategory, source_type, source_title, publication_date, evidence_grade, source_quality_score, is_active) VALUES
(
    'Sweat Rate Testing and Individualized Hydration',
    'Individual sweat rates vary dramatically and should guide hydration strategies.

**Sweat Rate Calculation:**
1. Weigh before exercise (minimal clothing)
2. Exercise for set duration (e.g., 60 min)
3. Track fluid consumed during
4. Weigh after exercise (dry off, same clothing)
5. Calculate: (Pre-weight - Post-weight + Fluid consumed) / Exercise duration

**Typical Sweat Rates:**
- Light exercise: 0.3-0.5 L/hour
- Moderate exercise: 0.5-1.0 L/hour
- Intense exercise: 1.0-2.0 L/hour
- Elite athletes in heat: 2.0-3.0+ L/hour

**Factors Affecting Sweat Rate:**
- Environmental temperature and humidity
- Exercise intensity
- Fitness level (fitter = sweat more)
- Acclimatization status
- Body size
- Genetics

**Hydration Strategy Development:**
- Test in conditions similar to competition
- Test multiple times for reliability
- Adjust for different conditions
- Plan fluid intake based on results

**Practical Application:**
- Aim to replace 80-100% of sweat losses
- Don''t over-drink (hyponatremia risk)
- Include electrolytes if >60 min or heavy sweater
- Practice drinking during training

**Monitoring Hydration Status:**
- Urine color (pale yellow = hydrated)
- Body weight changes
- Thirst (though not always reliable)
- Performance/perceived exertion',
    'nutrition',
    'hydration',
    'research_synthesis',
    'Sweat Rate and Hydration Research',
    '2024-01-01',
    'A',
    9.0,
    true
),
(
    'Electrolyte Replacement Strategies',
    'Electrolyte balance is critical for performance, especially in prolonged or hot conditions.

**Key Electrolytes:**

**Sodium:**
- Primary electrolyte lost in sweat
- Loss: 200-2000+ mg/L sweat
- Functions: Fluid balance, nerve function, muscle contraction
- Most important to replace

**Potassium:**
- Lost in smaller amounts
- Functions: Muscle contraction, heart rhythm
- Usually adequate from diet
- Supplement rarely needed

**Magnesium:**
- Lost in sweat
- Functions: Muscle function, energy production
- Deficiency can cause cramping
- Consider supplementation if deficient

**Sodium Replacement Guidelines:**

**Light Exercise (<60 min):**
- Water usually sufficient
- Sodium not critical
- Post-exercise: Normal meals

**Moderate Exercise (60-90 min):**
- Sports drink or electrolyte tabs
- 300-600 mg sodium/hour
- Especially in heat

**Prolonged/Intense (>90 min):**
- 500-1000 mg sodium/hour
- Higher for heavy sweaters
- Salt tabs or concentrated drinks
- Practice in training

**Hyponatremia Prevention:**
- Don''t over-drink
- Include sodium in fluids
- Know your sweat rate
- Don''t gain weight during exercise

**Practical Sources:**
- Sports drinks (varies: 200-500 mg/L)
- Electrolyte tablets
- Salt capsules
- Salty foods post-exercise',
    'nutrition',
    'hydration',
    'research_synthesis',
    'Electrolyte Research for Athletes',
    '2024-01-01',
    'A',
    9.0,
    true
);

-- =============================================================================
-- SECTION 3: SUPPLEMENT EVIDENCE (AIS ABCD FRAMEWORK)
-- =============================================================================

INSERT INTO knowledge_base_entries (title, content, category, subcategory, source_type, source_title, publication_date, evidence_grade, source_quality_score, is_active) VALUES
(
    'AIS Supplement Framework: Category A Supplements',
    'Category A supplements have strong evidence for performance benefits when used appropriately.

**What is Category A?**
- Strong scientific evidence
- Supports specific performance outcomes
- Used according to evidence-based protocols
- Appropriate for elite athletes

**Category A Supplements:**

**1. Caffeine**
- Dose: 3-6 mg/kg, 60 min pre-exercise
- Benefits: Endurance, power, cognitive function
- Evidence: Very strong
- Cautions: Individual tolerance varies

**2. Creatine Monohydrate**
- Loading: 20g/day x 5-7 days, then 3-5g/day
- Or: 3-5g/day (slower saturation)
- Benefits: Strength, power, repeated sprints
- Evidence: Very strong

**3. Beta-Alanine**
- Dose: 3.2-6.4g/day (split doses)
- Benefits: High-intensity efforts 1-10 min
- Evidence: Strong
- Side effect: Tingling (harmless)

**4. Sodium Bicarbonate**
- Dose: 0.2-0.3 g/kg, 60-90 min pre-exercise
- Benefits: High-intensity efforts 1-7 min
- Evidence: Strong
- Caution: GI distress common

**5. Beetroot Juice/Nitrates**
- Dose: 6-8 mmol nitrate, 2-3 hours pre-exercise
- Benefits: Endurance, efficiency
- Evidence: Strong
- Note: Effects may be less in elite athletes

**6. Sports Foods**
- Sports drinks, gels, bars
- Convenient fuel delivery
- Evidence: Strong for intended use

**Implementation:**
- Test in training first
- Follow evidence-based protocols
- Consider individual response
- Don''t exceed recommended doses',
    'supplements',
    'ergogenic_aids',
    'research_synthesis',
    'AIS Supplement Framework - Category A',
    '2024-01-01',
    'A',
    9.5,
    true
),
(
    'AIS Supplement Framework: Category B Supplements',
    'Category B supplements have emerging evidence but require more research.

**What is Category B?**
- Emerging scientific support
- Deserving of further research
- May be provided to athletes under specific protocols
- Results may be inconsistent

**Category B Supplements:**

**1. Collagen/Gelatin + Vitamin C**
- Dose: 15g gelatin + 50mg Vit C, 60 min pre-exercise
- Potential: Connective tissue support
- Evidence: Emerging, promising
- Use: Injury prevention/recovery

**2. Curcumin**
- Dose: 200-500mg/day
- Potential: Anti-inflammatory, recovery
- Evidence: Mixed results
- Note: Bioavailability issues

**3. Tart Cherry Juice**
- Dose: 30ml concentrate 2x/day
- Potential: Recovery, sleep, inflammation
- Evidence: Promising but variable
- Use: Around intense training/competition

**4. HMB (Beta-Hydroxy Beta-Methylbutyrate)**
- Dose: 3g/day
- Potential: Muscle preservation, recovery
- Evidence: Mixed, may help untrained more
- Use: During caloric restriction or injury

**5. Probiotics**
- Dose: Strain-specific
- Potential: Immune function, GI health
- Evidence: Growing but strain-dependent
- Use: Travel, heavy training periods

**6. Vitamin D**
- Dose: Based on blood levels (target 75-125 nmol/L)
- Potential: Bone health, immune, muscle function
- Evidence: Strong for deficiency correction
- Test before supplementing

**Approach:**
- Use under professional guidance
- Monitor individual response
- Document effects
- Not first-line supplements',
    'supplements',
    'ergogenic_aids',
    'research_synthesis',
    'AIS Supplement Framework - Category B',
    '2024-01-01',
    'B',
    8.5,
    true
),
(
    'Supplement Safety and Anti-Doping Considerations',
    'Athletes must be vigilant about supplement safety and anti-doping compliance.

**Contamination Risks:**
- Studies show 10-25% of supplements contaminated
- May contain undeclared substances
- Can cause positive drug tests
- Even "natural" products at risk

**Common Contaminants:**
- Anabolic steroids/prohormones
- Stimulants
- Diuretics
- SARMs (selective androgen receptor modulators)

**Risk Mitigation:**

**1. Third-Party Testing:**
- NSF Certified for Sport
- Informed Sport
- BSCG (Banned Substances Control Group)
- Look for batch-specific testing

**2. Manufacturer Vetting:**
- Reputable companies only
- GMP (Good Manufacturing Practice) certified
- Transparent labeling
- Avoid proprietary blends

**3. Ingredient Awareness:**
- Research all ingredients
- Check WADA prohibited list
- Be wary of "breakthrough" claims
- If unsure, don''t use

**Prohibited Substance Examples:**
- Ephedrine/ephedra
- DMAA
- Methylhexaneamine
- Many "pre-workouts"

**Safe Practices:**
- Consult sports dietitian
- Use certified products only
- Keep records of all supplements
- Report any adverse effects
- Food first approach

**If Tested Positive:**
- Strict liability applies
- "I didn''t know" is not a defense
- Career consequences severe
- Prevention is only solution

**Resources:**
- WADA Prohibited List (updated annually)
- USADA Supplement 411
- Global DRO (Drug Reference Online)
- Sport-specific anti-doping agencies',
    'supplements',
    'safety',
    'research_synthesis',
    'Supplement Safety and Anti-Doping',
    '2024-01-01',
    'A',
    9.5,
    true
);

-- =============================================================================
-- SECTION 4: MEAL PLANNING & PRACTICAL NUTRITION
-- =============================================================================

INSERT INTO knowledge_base_entries (title, content, category, subcategory, source_type, source_title, publication_date, evidence_grade, source_quality_score, is_active) VALUES
(
    'Athlete Plate Model: Practical Meal Planning',
    'The Athlete''s Plate provides visual guidance for meal composition based on training demands.

**Easy Training Day Plate:**
- 1/2 plate: Vegetables/fruits (color variety)
- 1/4 plate: Lean protein
- 1/4 plate: Whole grains/starches
- Add healthy fats
- Total carbs: ~3-5 g/kg/day

**Moderate Training Day Plate:**
- 1/3 plate: Vegetables/fruits
- 1/3 plate: Lean protein
- 1/3 plate: Whole grains/starches
- Add healthy fats
- Total carbs: ~5-7 g/kg/day

**Hard Training Day Plate:**
- 1/4 plate: Vegetables/fruits
- 1/4 plate: Lean protein
- 1/2 plate: Whole grains/starches
- Add healthy fats
- Total carbs: ~7-12 g/kg/day

**Protein Sources:**
- Chicken, turkey, lean beef
- Fish and seafood
- Eggs
- Greek yogurt, cottage cheese
- Legumes, tofu (plant-based)

**Carbohydrate Sources:**
- Rice, pasta, bread
- Oats, quinoa
- Potatoes, sweet potatoes
- Fruits
- Whole grain cereals

**Vegetable Priorities:**
- Dark leafy greens
- Colorful vegetables
- Cruciferous (broccoli, cauliflower)
- Variety is key

**Healthy Fats:**
- Olive oil, avocado
- Nuts and seeds
- Fatty fish
- Nut butters

**Practical Tips:**
- Prep meals in advance
- Keep healthy snacks available
- Learn to estimate portions
- Adjust based on hunger and performance',
    'nutrition',
    'meal_planning',
    'practical_guide',
    'USOC Athlete Plate Model',
    '2024-01-01',
    'A',
    9.0,
    true
),
(
    'Game Day Nutrition Protocol',
    'Optimizing nutrition on competition day maximizes performance.

**Night Before:**
- Carbohydrate-rich dinner
- Familiar foods only
- Moderate protein
- Lower fiber than usual
- Adequate hydration
- Early bedtime

**Morning of Competition:**

**3-4 Hours Before:**
- Substantial meal
- 1-4 g/kg carbohydrates
- Moderate protein (20-30g)
- Low fat, low fiber
- Examples: Oatmeal + banana + eggs, Toast + peanut butter + fruit

**1-2 Hours Before:**
- Light snack if needed
- Easily digested carbs
- 30-60g carbohydrates
- Examples: Banana, sports drink, energy bar

**30-60 Minutes Before:**
- Fluids
- Small carb if needed
- Caffeine if using (3-6 mg/kg)

**During Competition:**

**<60 minutes:**
- Water usually sufficient
- Sports drink if preferred

**60-90 minutes:**
- 30-60g carbs/hour
- Fluids with electrolytes

**>90 minutes:**
- Up to 90g carbs/hour (trained gut)
- Multiple carb sources
- Regular fluid intake

**Between Games/Events:**
- Begin refueling immediately
- 1-1.2 g/kg carbs first hour
- Protein for recovery (20-30g)
- Rehydrate based on losses

**Post-Competition:**
- Recovery nutrition priority
- Carbs + protein within 2 hours
- Rehydrate fully
- Celebrate with balanced meal

**What to Avoid:**
- New foods on game day
- High fat/fiber pre-competition
- Excessive caffeine
- Alcohol night before',
    'nutrition',
    'competition',
    'practical_guide',
    'Competition Nutrition Guidelines',
    '2024-01-01',
    'A',
    9.0,
    true
),
(
    'Recovery Nutrition: The 3 Rs',
    'Post-exercise nutrition focuses on Refuel, Repair, and Rehydrate.

**The 3 Rs Framework:**

**1. REFUEL (Carbohydrates)**

**Timing:**
- Begin within 30-60 minutes post-exercise
- Most critical if training again within 8 hours
- Less urgent if 24+ hours until next session

**Amount:**
- 1-1.2 g/kg in first hour
- Continue every 2 hours until meal
- Total daily needs based on training

**Best Sources:**
- Quick: Sports drinks, fruit, white rice
- Sustained: Whole grains, potatoes, oats

**2. REPAIR (Protein)**

**Timing:**
- Include with carbohydrates post-exercise
- Within 2 hours optimal
- Continue at regular meals

**Amount:**
- 20-40g high-quality protein
- 0.3-0.4 g/kg per meal
- Leucine content important (2.5-3g)

**Best Sources:**
- Whey protein (fast absorbing)
- Eggs, chicken, fish
- Greek yogurt, milk
- Plant: Soy, pea protein blends

**3. REHYDRATE (Fluids)**

**Assessment:**
- Weigh before and after exercise
- Replace 150% of weight lost
- Monitor urine color

**Approach:**
- Include sodium for retention
- Drink with meals/snacks
- Spread intake over 4-6 hours

**Best Options:**
- Water + salty foods
- Sports drinks
- Milk (protein + carbs + fluid)
- Electrolyte beverages

**Practical Recovery Meals:**
- Chocolate milk + banana
- Greek yogurt + granola + berries
- Chicken stir-fry with rice
- Smoothie with protein + fruit + milk
- Turkey sandwich + fruit + pretzels',
    'nutrition',
    'recovery_nutrition',
    'practical_guide',
    'Recovery Nutrition Research',
    '2024-01-01',
    'A',
    9.0,
    true
);

-- =============================================================================
-- SECTION 5: MICRONUTRIENTS FOR ATHLETES
-- =============================================================================

INSERT INTO knowledge_base_entries (title, content, category, subcategory, source_type, source_title, publication_date, evidence_grade, source_quality_score, is_active) VALUES
(
    'Iron Status in Athletes',
    'Iron deficiency is common in athletes and significantly impacts performance.

**Why Athletes Are at Risk:**
- Increased losses (sweat, GI, foot strike hemolysis)
- Increased requirements (red blood cell production)
- Dietary restrictions
- Female athletes: Menstrual losses

**Stages of Iron Deficiency:**

**Stage 1: Depleted Stores**
- Low ferritin (<30 μg/L)
- Normal hemoglobin
- May have no symptoms
- Performance may be affected

**Stage 2: Iron Deficient Erythropoiesis**
- Very low ferritin
- Decreased transferrin saturation
- Hemoglobin still normal
- Fatigue, decreased performance

**Stage 3: Iron Deficiency Anemia**
- Low hemoglobin (<12 g/dL women, <13 g/dL men)
- Severe fatigue
- Significant performance impairment
- Requires medical treatment

**Assessment:**
- Serum ferritin (primary marker)
- Hemoglobin
- Transferrin saturation
- Test regularly (every 3-6 months)

**Food Sources:**
- Heme iron (best absorbed): Red meat, liver, oysters
- Non-heme iron: Legumes, fortified cereals, spinach
- Enhance absorption: Vitamin C with meals
- Inhibit absorption: Tea, coffee, calcium with meals

**Supplementation:**
- Only if deficient (test first)
- Typical dose: 100-200mg elemental iron
- Take with vitamin C
- Avoid with calcium, tea, coffee
- GI side effects common

**Prevention:**
- Include iron-rich foods daily
- Pair non-heme iron with vitamin C
- Separate iron from inhibitors
- Consider cooking in cast iron',
    'nutrition',
    'minerals',
    'research_synthesis',
    'Iron in Athletes Research',
    '2024-01-01',
    'A',
    9.0,
    true
),
(
    'Vitamin D for Athletic Performance',
    'Vitamin D deficiency is widespread and affects multiple aspects of athletic performance.

**Functions in Athletes:**
- Bone health and calcium absorption
- Muscle function and strength
- Immune function
- Potentially: Injury prevention, recovery

**Risk Factors for Deficiency:**
- Indoor training
- Northern latitudes
- Dark skin pigmentation
- Sunscreen use
- Winter months
- Low dietary intake

**Optimal Levels:**
- Deficient: <50 nmol/L (20 ng/mL)
- Insufficient: 50-75 nmol/L
- Sufficient: 75-125 nmol/L (30-50 ng/mL)
- Target for athletes: 75-125 nmol/L

**Testing:**
- 25-hydroxyvitamin D blood test
- Test at end of winter (lowest levels)
- Retest after supplementation

**Food Sources:**
- Fatty fish (salmon, mackerel)
- Fortified milk and cereals
- Egg yolks
- Difficult to meet needs from food alone

**Supplementation:**

**If Deficient (<50 nmol/L):**
- 4000-10000 IU/day for 8-12 weeks
- Then retest
- Medical supervision recommended

**Maintenance (if sufficient):**
- 1000-2000 IU/day
- Higher in winter
- Adjust based on levels

**Safety:**
- Upper limit: 4000 IU/day (general)
- Athletes may need more
- Toxicity rare but possible
- Always test before high-dose supplementation

**Sun Exposure:**
- 10-30 min midday sun (skin type dependent)
- Not reliable year-round in many locations
- Balance with skin cancer risk',
    'nutrition',
    'vitamins',
    'research_synthesis',
    'Vitamin D Research for Athletes',
    '2024-01-01',
    'A',
    9.0,
    true
);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'NUTRITION & SUPPLEMENTS EXPANSION COMPLETE';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Added entries:';
    RAISE NOTICE '  - Macronutrient Timing: 3 entries';
    RAISE NOTICE '  - Hydration Advanced: 2 entries';
    RAISE NOTICE '  - Supplement Evidence (AIS): 3 entries';
    RAISE NOTICE '  - Meal Planning: 3 entries';
    RAISE NOTICE '  - Micronutrients: 2 entries';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'TOTAL NEW ENTRIES: 13 evidence-based articles';
    RAISE NOTICE '===========================================';
END $$;

