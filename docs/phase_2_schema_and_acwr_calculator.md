# Phase 2: Database Schema & ACWR Calculator Engine

**Status:** Comprehensive schema design integrating all Phase 1, 1B, 1C, 1D evidence  
**Purpose:** Unified athlete profile + personalized ACWR calculation + injury RTP tracking + recovery modality recommendation  
**Architecture:** Supabase PostgreSQL + Edge Functions for ACWR computation + real-time athlete state tracking

---

## I. Core Athlete Profile Schema

### Table: `athletes`
```sql
CREATE TABLE athletes (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  sport TEXT NOT NULL, -- 'soccer', 'basketball', 'volleyball', 'rugby', 'track', etc.
  position TEXT, -- position-specific demands (e.g., 'midfielder', 'point guard', 'setter')
  chronotype TEXT, -- 'morning_lark', 'evening_owl', 'intermediate'
  age_years INT NOT NULL,
  sex TEXT NOT NULL, -- 'M', 'F', 'NB'
  injury_history_json JSONB, -- array of prior injuries with dates
  current_injury_id UUID REFERENCES injuries(id) ON DELETE SET NULL,
  acwr_baseline_multiplier FLOAT DEFAULT 1.0 -- personalized threshold adjustment
);
```

### Table: `genetic_profiles`
```sql
CREATE TABLE genetic_profiles (
  id UUID PRIMARY KEY,
  athlete_id UUID UNIQUE NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  
  -- Genotype Data (binary: 'I/I', 'I/D', 'D/D', 'RR', 'RX', 'XX', etc.)
  ace_polymorphism TEXT, -- 'I/I', 'I/D', 'D/D'
  actn3_r577x TEXT, -- 'RR', 'RX', 'XX'
  ppargc1a_genotype TEXT, -- 'AA', 'AG', 'GG'
  cyp1a2_rs762551 TEXT, -- 'AA' (fast), 'AC', 'CC' (slow)
  col5a1_rs12722 TEXT, -- 'CC', 'CT', 'TT' (ACL risk, esp. females)
  il6_rs1800795 TEXT, -- 'GG', 'GC', 'CC'
  
  -- Derived Metrics
  training_genetic_score FLOAT, -- TGS composite: <56 high-risk, >70 low-risk
  injury_risk_category TEXT, -- 'high', 'moderate', 'low' (based on polygenic score)
  training_response_phenotype TEXT, -- 'high_responder' (VO2max +20-25%), 'typical' (5-15%), 'low_responder' (<5%)
  caffeine_metabolizer TEXT, -- 'fast' (AA), 'intermediate' (AC), 'slow' (CC)
  collagen_injury_risk_multiplier FLOAT, -- e.g., 6.6 for COL5A1 TT females; 1.0 baseline
  endurance_vs_strength_bias FLOAT, -- ACE I/D: positive = endurance preference, negative = strength
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Table: `individual_profiles`
```sql
CREATE TABLE individual_profiles (
  id UUID PRIMARY KEY,
  athlete_id UUID UNIQUE NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  
  -- Baseline Performance (Objective Anchors)
  cmj_baseline_cm FLOAT, -- countermovement jump at baseline (cm)
  hrv_baseline_ms FLOAT, -- heart rate variability at baseline (ms)
  
  -- Biomarker Status (Most Recent)
  ferritin_ugL FLOAT, -- μg/L; <20 = functional deficiency (-20% ACWR capacity)
  iron_status TEXT, -- 'sufficient', 'deficient', 'depleted'
  vitamin_d_status TEXT, -- 'sufficient' (>30), 'insufficient' (20-30), 'deficient' (<20 ng/mL)
  cortisol_morning_nmolL FLOAT, -- nmol/L (emerging marker)
  
  -- Lifestyle Confounds (Last 7 Days Average)
  alcohol_units_per_week FLOAT, -- units; >14 = -25% recovery efficiency
  caffeine_mg_per_day FLOAT, -- mg; >6mg/kg = threshold effect
  sleep_quality_1_10 INT, -- subjective rating
  menstrual_cycle_day INT, -- if applicable; NULL if N/A
  menstrual_cycle_phase TEXT, -- 'menstrual' (±5% capacity), 'follicular', 'ovulatory', 'luteal'
  
  -- Position-Specific Demands
  position_demands_json JSONB, -- {"hamstring_load": 1.4, "knee_valgus_risk": 0.8, "shoulder_overhead": 0.3}
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## II. ACWR Calculation Engine

### Table: `training_sessions`
```sql
CREATE TABLE training_sessions (
  id UUID PRIMARY KEY,
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  session_duration_minutes INT NOT NULL,
  session_rpe_0_10 INT NOT NULL, -- Rating of Perceived Exertion (CR-10 scale)
  session_load INT GENERATED ALWAYS AS (session_duration_minutes * session_rpe_0_10) STORED,
  session_type TEXT, -- 'strength', 'cardio', 'sport_specific', 'recovery', 'mobility'
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(athlete_id, session_date) -- one session per day per athlete
);

-- Index for rolling-window queries
CREATE INDEX idx_training_sessions_athlete_date ON training_sessions(athlete_id, session_date DESC);
```

### Table: `acwr_snapshots` (Computed Daily)
```sql
CREATE TABLE acwr_snapshots (
  id UUID PRIMARY KEY,
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  
  -- Load Calculations
  acute_load_7day INT, -- Sum of session_load last 7 days
  chronic_load_28day INT, -- Sum of session_load last 28 days (4-week rolling)
  acwr_ratio FLOAT GENERATED ALWAYS AS (
    CASE WHEN chronic_load_28day > 0 THEN acute_load_7day::FLOAT / chronic_load_28day ELSE 0 END
  ) STORED,
  
  -- Athlete-Specific Thresholds (Applied Multipliers)
  base_safe_zone_lower FLOAT DEFAULT 0.8,
  base_safe_zone_upper FLOAT DEFAULT 1.3,
  personalized_safe_zone_lower FLOAT, -- = base * ACWR_multiplier (see below)
  personalized_safe_zone_upper FLOAT,
  
  -- Applied Multipliers (Cumulative from individual_profiles)
  biomarker_multiplier FLOAT DEFAULT 1.0, -- ferritin <20: ×0.8; vitamin D deficiency: ×0.9
  confound_multiplier FLOAT DEFAULT 1.0, -- alcohol: ×0.75; caffeine: ×0.95-1.05 depending on genotype
  menstrual_cycle_multiplier FLOAT DEFAULT 1.0, -- menstrual phase: ±1.05
  chronotype_multiplier FLOAT DEFAULT 1.0, -- evening training for owl: ×0.9; morning for lark: ×0.85
  position_multiplier FLOAT DEFAULT 1.0, -- midfielder high hamstring load: ×1.2; goalkeeper low knee load: ×0.8
  genetic_injury_risk_multiplier FLOAT DEFAULT 1.0, -- high TGS (low risk): ×0.95; low TGS (high risk): ×1.2
  
  -- Composite Multiplier
  cumulative_acwr_multiplier FLOAT GENERATED ALWAYS AS (
    biomarker_multiplier * confound_multiplier * menstrual_cycle_multiplier * 
    chronotype_multiplier * position_multiplier * genetic_injury_risk_multiplier
  ) STORED,
  
  -- Status Flags
  acwr_status TEXT, -- 'safe', 'yellow_flag' (1.3-1.5), 'red_flag' (>1.5), 'underload' (<0.8)
  safety_alert BOOLEAN DEFAULT FALSE,
  
  snapshot_date UNIQUE(athlete_id, snapshot_date),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Materialized view for daily calculation
CREATE INDEX idx_acwr_snapshots_athlete_date ON acwr_snapshots(athlete_id, snapshot_date DESC);
```

### Stored Procedure: Calculate Daily ACWR
```sql
CREATE OR REPLACE FUNCTION calculate_acwr_for_athlete(p_athlete_id UUID, p_date DATE)
RETURNS TABLE(
  acwr_ratio FLOAT,
  personalized_lower FLOAT,
  personalized_upper FLOAT,
  status TEXT,
  alert BOOLEAN
) AS $$
DECLARE
  v_acute_load INT;
  v_chronic_load INT;
  v_acwr FLOAT;
  v_bio_mult FLOAT := 1.0;
  v_conf_mult FLOAT := 1.0;
  v_mens_mult FLOAT := 1.0;
  v_chrono_mult FLOAT := 1.0;
  v_pos_mult FLOAT := 1.0;
  v_gen_mult FLOAT := 1.0;
  v_cumulative FLOAT;
  v_safe_lower FLOAT;
  v_safe_upper FLOAT;
BEGIN
  -- Acute load: last 7 days
  SELECT COALESCE(SUM(session_load), 0) INTO v_acute_load
  FROM training_sessions
  WHERE athlete_id = p_athlete_id
    AND session_date BETWEEN (p_date - INTERVAL '7 days') AND p_date;
  
  -- Chronic load: last 28 days
  SELECT COALESCE(SUM(session_load), 0) INTO v_chronic_load
  FROM training_sessions
  WHERE athlete_id = p_athlete_id
    AND session_date BETWEEN (p_date - INTERVAL '28 days') AND p_date;
  
  -- ACWR ratio
  v_acwr := CASE WHEN v_chronic_load > 0 THEN v_acute_load::FLOAT / v_chronic_load ELSE 0 END;
  
  -- Apply Multipliers (from individual_profiles)
  SELECT 
    COALESCE(CASE 
      WHEN ferritin_ugL < 20 THEN 0.8 -- -20% capacity
      WHEN ferritin_ugL < 30 THEN 0.9 -- -10% capacity
      ELSE 1.0
    END, 1.0) *
    COALESCE(CASE
      WHEN vitamin_d_status = 'deficient' THEN 0.9 -- -10%
      ELSE 1.0
    END, 1.0)
  INTO v_bio_mult
  FROM individual_profiles
  WHERE athlete_id = p_athlete_id;
  
  SELECT 
    COALESCE(CASE
      WHEN alcohol_units_per_week > 14 THEN 0.75 -- -25% recovery
      ELSE 1.0
    END, 1.0) *
    COALESCE(CASE
      WHEN caffeine_mg_per_day > 6 * (SELECT COALESCE(NULLIF((SELECT weight_kg FROM athletes WHERE id = p_athlete_id), 0), 70)) THEN 0.95
      ELSE 1.0
    END, 1.0)
  INTO v_conf_mult
  FROM individual_profiles
  WHERE athlete_id = p_athlete_id;
  
  SELECT COALESCE(CASE
    WHEN menstrual_cycle_phase = 'menstrual' THEN 0.95 -- ±5%
    ELSE 1.0
  END, 1.0)
  INTO v_mens_mult
  FROM individual_profiles
  WHERE athlete_id = p_athlete_id;
  
  SELECT COALESCE(CASE
    WHEN chronotype = 'morning_lark' AND EXTRACT(HOUR FROM NOW()) < 12 THEN 0.85
    WHEN chronotype = 'evening_owl' AND EXTRACT(HOUR FROM NOW()) > 18 THEN 0.9
    ELSE 1.0
  END, 1.0)
  INTO v_chrono_mult
  FROM athletes
  WHERE id = p_athlete_id;
  
  SELECT COALESCE((position_demands_json->>'hamstring_load')::FLOAT, 1.0)
  INTO v_pos_mult
  FROM individual_profiles
  WHERE athlete_id = p_athlete_id;
  
  SELECT COALESCE(genetic_injury_risk_multiplier, 1.0)
  INTO v_gen_mult
  FROM genetic_profiles
  WHERE athlete_id = p_athlete_id;
  
  v_cumulative := v_bio_mult * v_conf_mult * v_mens_mult * v_chrono_mult * v_pos_mult * v_gen_mult;
  
  -- Apply multiplier to safe zone
  v_safe_lower := 0.8 * v_cumulative;
  v_safe_upper := 1.3 * v_cumulative;
  
  RETURN QUERY SELECT 
    v_acwr,
    v_safe_lower,
    v_safe_upper,
    CASE 
      WHEN v_acwr < v_safe_lower THEN 'underload'
      WHEN v_acwr BETWEEN v_safe_lower AND v_safe_upper THEN 'safe'
      WHEN v_acwr BETWEEN v_safe_upper AND (v_safe_upper * 1.15) THEN 'yellow_flag'
      ELSE 'red_flag'
    END::TEXT,
    (v_acwr > (v_safe_upper * 1.15))::BOOLEAN;
END;
$$ LANGUAGE plpgsql;
```

---

## III. Injury Tracking & RTP Progression

### Table: `injuries`
```sql
CREATE TABLE injuries (
  id UUID PRIMARY KEY,
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  
  -- Injury Metadata
  injury_type TEXT NOT NULL, -- 'ACL', 'ankle_sprain', 'hamstring_strain', 'shin_splints', etc. (20 types from Phase 1D)
  injury_date DATE NOT NULL,
  severity TEXT, -- 'mild', 'moderate', 'severe' (or grade-specific: I, II, III)
  anatomical_side TEXT, -- 'left', 'right', 'bilateral'
  
  -- Treatment Path
  treatment_type TEXT, -- 'conservative', 'surgical', 'hybrid'
  surgery_date DATE, -- NULL if conservative
  surgical_procedure TEXT, -- 'ACLR', 'meniscus_repair', 'rotator_cuff_repair', etc.
  
  -- Current RTP Status
  current_rtp_phase INT, -- 1 (Protection) to 5 (Sport-Specific Integration)
  phase_start_date DATE,
  expected_rtp_date DATE, -- from Phase 1D timelines + individual modifiers
  actual_rtp_date DATE, -- NULL until RTP achieved
  
  -- Individual Modifiers Applied
  age_modifier_weeks INT DEFAULT 0, -- add 6-8 weeks for adolescents, 4-8 for >50
  sex_modifier_weeks INT DEFAULT 0, -- females ACL +60 days
  prior_injury_same_structure BOOLEAN DEFAULT FALSE, -- 3-5× re-injury risk, add 1-2 weeks
  
  -- RTP Criteria Tracking (Checkboxes for Phase 4/5 Gates)
  strength_lsi_90_achieved BOOLEAN DEFAULT FALSE,
  hop_test_battery_90_lsi BOOLEAN DEFAULT FALSE, -- 4 tests all ≥90% LSI
  acl_rsi_56_or_higher BOOLEAN DEFAULT FALSE, -- psychological readiness
  tsk11_normalized BOOLEAN DEFAULT FALSE, -- <37 = low fear
  biomechanics_symmetrical BOOLEAN DEFAULT FALSE, -- video analysis
  
  status TEXT, -- 'active_recovery', 'phase_X', 'rtp_cleared', 'reinjured', 'retired'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Table: `rtp_phase_progress`
```sql
CREATE TABLE rtp_phase_progress (
  id UUID PRIMARY KEY,
  injury_id UUID NOT NULL REFERENCES injuries(id) ON DELETE CASCADE,
  
  phase_number INT NOT NULL, -- 1-5
  phase_name TEXT, -- 'Protection', 'Early Loading', 'Strength', 'Power', 'Sport-Specific'
  phase_start_date DATE NOT NULL,
  phase_end_date DATE, -- NULL if current phase
  
  -- Weekly ACWR Target (from Phase 1D)
  acwr_target_min FLOAT, -- e.g., 0.3 for Phase 2
  acwr_target_max FLOAT, -- e.g., 0.6 for Phase 2
  
  -- Weekly Check-ins
  current_acwr FLOAT, -- most recent week's ACWR
  avg_acwr_this_phase FLOAT,
  compliance_pct INT, -- % of sessions completed as prescribed
  
  -- Subjective Readiness
  athlete_confidence_1_10 INT,
  coach_confidence_1_10 INT,
  pain_level_0_10 INT, -- 0 = none, 10 = severe
  
  -- Notes for Phase Progression
  notes TEXT,
  ready_for_next_phase BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## IV. Recovery Modality Recommendation Engine

### Table: `recovery_modalities` (Pre-loaded from Phase 1)
```sql
CREATE TABLE recovery_modalities (
  id UUID PRIMARY KEY,
  modality_name TEXT UNIQUE NOT NULL, -- 'foam_rolling', 'ice_bath', 'compression_boots', 'massage', 'yoga', etc.
  evidence_grade TEXT NOT NULL, -- 'A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'C3', 'D'
  study_count INT,
  mean_sample_size INT,
  effect_size_hedges_g FLOAT, -- standardized effect size
  recovery_domains JSONB, -- ["muscular_soreness", "inflammation", "proprioception", "psychological"]
  contraindications_json JSONB, -- {"menstrual_phase": ["menstrual"], "injury_types": ["ACL_week0_2"]}
  implementation_protocol TEXT, -- duration, intensity, frequency
  created_at TIMESTAMP DEFAULT NOW()
);

-- Pre-populated examples:
-- Foam Rolling: A2, 12 studies, 150 avg n, g=0.65, targets DOMS/proprioception
-- Ice Bath: A1, 35 studies, 450 avg n, g=0.73, targets inflammation/parasympathetic
-- Compression Boots: B1, 8 studies, 120 avg n, g=0.48, targets DOMS/swelling
-- Sport Psychology (ACL-RSI coaching): A1, 28 studies, 250 avg n, r=0.56, targets psychological readiness
-- Yoga: A2, 15 studies, 180 avg n, g=0.71 (HF power), targets parasympathetic
-- Massage: B1, 22 studies, 200 avg n, g=0.45, targets DOMS/ROM
-- Sleep Optimization: A1, 40+ studies, 500+ avg n, g=0.82, targets CNS recovery
```

### Table: `athlete_recovery_logs`
```sql
CREATE TABLE athlete_recovery_logs (
  id UUID PRIMARY KEY,
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  modality_id UUID NOT NULL REFERENCES recovery_modalities(id),
  log_date DATE NOT NULL,
  session_duration_minutes INT,
  perceived_effectiveness_1_10 INT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(athlete_id, modality_id, log_date) -- one modality per day per athlete
);
```

### Stored Procedure: Recommend Recovery Modalities
```sql
CREATE OR REPLACE FUNCTION recommend_recovery_modalities(p_athlete_id UUID, p_date DATE)
RETURNS TABLE(
  modality_name TEXT,
  evidence_grade TEXT,
  effect_size FLOAT,
  rationale TEXT,
  priority INT -- 1 = highest priority
) AS $$
DECLARE
  v_acwr_status TEXT;
  v_cmj_change_pct FLOAT; -- % change from baseline
  v_hrv_depressed BOOLEAN; -- >15% below rolling mean
  v_ferritin_status TEXT;
  v_sleep_last_night INT; -- 0-10 rating
  v_injury_type TEXT;
  v_injury_phase INT;
BEGIN
  -- Fetch current ACWR status
  SELECT acwr_status INTO v_acwr_status
  FROM acwr_snapshots
  WHERE athlete_id = p_athlete_id AND snapshot_date = p_date
  LIMIT 1;
  
  -- Fetch current objective markers (if available)
  SELECT (cmj_baseline_cm - COALESCE(
    (SELECT AVG((ts.session_load)::FLOAT) 
     FROM training_sessions ts 
     WHERE ts.athlete_id = p_athlete_id 
     AND ts.session_date BETWEEN (p_date - INTERVAL '1 day') AND p_date) / cmj_baseline_cm * 100, 0
  )) / cmj_baseline_cm * 100
  INTO v_cmj_change_pct
  FROM individual_profiles
  WHERE athlete_id = p_athlete_id;
  
  -- High load fatigue recommendation
  IF v_acwr_status = 'red_flag' THEN
    RETURN QUERY SELECT 
      'Ice Bath'::TEXT, 'A1'::TEXT, 0.73::FLOAT, 
      'High ACWR (red flag); reduce inflammation & parasympathetic reactivation'::TEXT, 1::INT
    UNION ALL SELECT 
      'Sleep Optimization'::TEXT, 'A1'::TEXT, 0.82::FLOAT,
      'CNS fatigue; prioritize sleep architecture'::TEXT, 2::INT;
  END IF;
  
  -- Low CMJ performance (muscular soreness)
  IF v_cmj_change_pct < -7 THEN -- >7% drop indicates acute fatigue
    RETURN QUERY SELECT 
      'Foam Rolling'::TEXT, 'A2'::TEXT, 0.65::FLOAT,
      'CMJ depressed >7%; target DOMS recovery'::TEXT, 1::INT
    UNION ALL SELECT 
      'Massage'::TEXT, 'B1'::TEXT, 0.45::FLOAT,
      'Muscular soreness; improve ROM'::TEXT, 2::INT;
  END IF;
  
  -- Injury-phase-specific recommendations
  SELECT injury_type, current_rtp_phase INTO v_injury_type, v_injury_phase
  FROM injuries
  WHERE athlete_id = p_athlete_id AND status IN ('active_recovery', 'phase_1', 'phase_2', 'phase_3', 'phase_4', 'phase_5')
  LIMIT 1;
  
  IF v_injury_type IS NOT NULL THEN
    IF v_injury_phase IN (1, 2) THEN -- Early phases: psychology critical
      RETURN QUERY SELECT 
        'Sport Psychology (ACL-RSI Coaching)'::TEXT, 'A1'::TEXT, 0.56::FLOAT,
        'Early RTP phase; build confidence & coping strategies'::TEXT, 1::INT;
    ELSIF v_injury_phase IN (4, 5) THEN -- Late phases: proprioception
      RETURN QUERY SELECT 
        'Yoga'::TEXT, 'A2'::TEXT, 0.71::FLOAT,
        'Late RTP phase; parasympathetic reactivation & proprioceptive awareness'::TEXT, 2::INT;
    END IF;
  END IF;
  
  -- Biomarker-based recommendations
  SELECT iron_status, vitamin_d_status INTO v_ferritin_status, v_sleep_last_night
  FROM individual_profiles
  WHERE athlete_id = p_athlete_id;
  
  IF v_ferritin_status = 'deficient' THEN
    RETURN QUERY SELECT 
      'Iron Supplementation'::TEXT, 'A2'::TEXT, 0.60::FLOAT,
      'Iron deficiency detected; restore aerobic capacity'::TEXT, 3::INT;
  END IF;
  
  -- Default: recover from training stimulus
  RETURN QUERY SELECT 
    'Compression Boots'::TEXT, 'B1'::TEXT, 0.48::FLOAT,
    'Standard recovery modality; reduce DOMS & swelling'::TEXT, 3::INT;
END;
$$ LANGUAGE plpgsql;
```

---

## V. Psychological Readiness Assessment

### Table: `psychological_assessments`
```sql
CREATE TABLE psychological_assessments (
  id UUID PRIMARY KEY,
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  injury_id UUID REFERENCES injuries(id) ON DELETE SET NULL,
  assessment_date DATE NOT NULL,
  assessment_type TEXT, -- 'ACL-RSI', 'TSK-11', 'baseline_coping', 'progress_check'
  
  -- ACL-RSI (Athlete Competency Level) -- 12 items, 0-100 scale
  acl_rsi_score INT, -- ≥56 = psychologically ready for RTP
  
  -- Tampa Scale of Kinesiophobia (TSK-11)
  tsk11_score INT, -- <37 = low fear (appropriate); ≥37 = fear-avoidance
  
  -- Subjective Items
  confidence_in_limb_1_10 INT,
  fear_of_reinjury_1_10 INT,
  coping_strategies_documented BOOLEAN,
  
  -- Clinician Notes
  clinical_impression TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## VI. Queries for Coach/Athlete Dashboards

### Query 1: Athlete RTP Dashboard (One Athlete)
```sql
SELECT 
  a.id, a.email, a.sport, a.position,
  i.injury_type, i.severity, i.injury_date,
  i.current_rtp_phase,
  (SELECT acwr_ratio FROM acwr_snapshots 
   WHERE athlete_id = a.id ORDER BY snapshot_date DESC LIMIT 1) AS current_acwr,
  (SELECT (SELECT personalized_safe_zone_upper FROM acwr_snapshots 
    WHERE athlete_id = a.id ORDER BY snapshot_date DESC LIMIT 1)) AS acwr_upper_threshold,
  i.expected_rtp_date,
  EXTRACT(DAY FROM i.expected_rtp_date - CURRENT_DATE) AS days_to_expected_rtp,
  i.strength_lsi_90_achieved,
  i.hop_test_battery_90_lsi,
  i.acl_rsi_56_or_higher,
  (SELECT acl_rsi_score FROM psychological_assessments 
   WHERE athlete_id = a.id AND injury_id = i.id ORDER BY assessment_date DESC LIMIT 1) AS latest_acl_rsi,
  i.status
FROM athletes a
LEFT JOIN injuries i ON a.id = i.athlete_id AND i.status IN ('active_recovery', 'phase_1', 'phase_2', 'phase_3', 'phase_4', 'phase_5')
WHERE a.id = $1; -- parameterized athlete_id
```

### Query 2: Team Load Summary (Injury Risk)
```sql
SELECT 
  a.id, a.email, a.position,
  acwr_snap.snapshot_date,
  acwr_snap.acwr_ratio,
  acwr_snap.acwr_status,
  CASE 
    WHEN acwr_snap.acwr_status = 'red_flag' THEN 'HIGH RISK'
    WHEN acwr_snap.acwr_status = 'yellow_flag' THEN 'MODERATE RISK'
    WHEN acwr_snap.acwr_status = 'safe' THEN 'LOW RISK'
    ELSE 'UNDERLOAD'
  END AS injury_risk_level,
  gp.injury_risk_category AS genetic_risk,
  ip.ferritin_ugL,
  CASE WHEN ip.ferritin_ugL < 20 THEN 'DEFICIENT' ELSE 'SUFFICIENT' END AS iron_status,
  COUNT(DISTINCT ts.id) FILTER (WHERE ts.session_date >= CURRENT_DATE - INTERVAL '7 days') AS sessions_last_7_days
FROM athletes a
LEFT JOIN acwr_snapshots acwr_snap ON a.id = acwr_snap.athlete_id AND acwr_snap.snapshot_date = CURRENT_DATE
LEFT JOIN genetic_profiles gp ON a.id = gp.athlete_id
LEFT JOIN individual_profiles ip ON a.id = ip.athlete_id
LEFT JOIN training_sessions ts ON a.id = ts.athlete_id
GROUP BY a.id, a.email, a.position, acwr_snap.snapshot_date, acwr_snap.acwr_ratio, acwr_snap.acwr_status, gp.injury_risk_category, ip.ferritin_ugL
ORDER BY acwr_snap.acwr_status DESC NULLS LAST, gp.injury_risk_category;
```

### Query 3: Recovery Modality Effectiveness (by Phase)
```sql
SELECT 
  rm.modality_name,
  rm.evidence_grade,
  COUNT(arl.id) AS times_logged,
  AVG(arl.perceived_effectiveness_1_10) AS avg_perceived_effectiveness,
  i.current_rtp_phase,
  AVG((SELECT acwr_ratio FROM acwr_snapshots 
       WHERE athlete_id = arl.athlete_id AND snapshot_date = arl.log_date)) AS avg_acwr_on_log_date
FROM recovery_modalities rm
LEFT JOIN athlete_recovery_logs arl ON rm.id = arl.modality_id
LEFT JOIN athletes a ON arl.athlete_id = a.id
LEFT JOIN injuries i ON a.id = i.athlete_id AND i.status IN ('active_recovery', 'phase_1', 'phase_2', 'phase_3', 'phase_4', 'phase_5')
GROUP BY rm.modality_name, rm.evidence_grade, i.current_rtp_phase
ORDER BY rm.evidence_grade, AVG(arl.perceived_effectiveness_1_10) DESC;
```

---

## VII. Implementation Roadmap

### Phase 2a: Core Schema (Weeks 1-2)
- [ ] Create all tables (athletes, genetic_profiles, individual_profiles, training_sessions, injuries, rtp_phase_progress)
- [ ] Deploy ACWR calculation stored procedure
- [ ] Create materialized view for daily ACWR snapshots
- [ ] Wire training session logging endpoint

### Phase 2b: RTP Tracking (Weeks 2-3)
- [ ] Injury intake form (injury_type, severity, date, treatment_type)
- [ ] RTP phase progression logic (auto-advance criteria)
- [ ] Phase-specific ACWR targets enforcement
- [ ] Functional test result logging (strength LSI, hop tests, psychological scores)

### Phase 2c: Recovery Modality Engine (Weeks 3-4)
- [ ] Pre-load recovery_modalities table with all Phase 1 data
- [ ] Deploy recommendation function (ACWR-triggered + phase-triggered + biomarker-triggered)
- [ ] Build athlete recovery log UI (modality selection + effectiveness rating)
- [ ] Dashboard widget: "Recommended Recovery for Today"

### Phase 2d: Dashboards (Weeks 4-5)
- [ ] Coach dashboard: team load summary, injury risk heatmap, recovery compliance
- [ ] Athlete dashboard: RTP progress, ACWR trending, recovery recommendations, psychological check-in
- [ ] Real-time alerts: ACWR red-flag, biomarker threshold breached, RTP criteria gates unlocked

### Phase 2e: Testing & Validation (Weeks 5-6)
- [ ] Unit test ACWR calculation with diverse athlete profiles (high iron vs deficient, high-risk genetics vs low, etc.)
- [ ] End-to-end test RTP progression (simulate 12-week ACL recovery with phase gates)
- [ ] Validate recovery modality recommendations against Phase 1 evidence
- [ ] Load testing with team of 30+ athletes logging daily sessions

---

## VIII. Key Design Decisions & Trade-offs

**Decision 1: ACWR Calculation Frequency**
- **Choice:** Daily materialized snapshot (not real-time)
- **Rationale:** Prevents explosive computation on every session log; 24-hour freshness acceptable for athlete load management
- **Trade-off:** Slightly stale data (if athlete logs session at 23:59, coach sees updated ACWR next morning)

**Decision 2: Multiplier Application (Additive vs Multiplicative)**
- **Choice:** Multiplicative (each factor scales the safe zone independently)
- **Rationale:** Reflects biological reality — low iron + high stress + poor sleep = compounding fatigue, not additive
- **Example:** Midfield (1.2×) × low iron (0.8×) × evening chronotype (0.9×) = 0.864× safe zone = 0.69–1.12 actual safe range (vs 0.8–1.3 baseline)

**Decision 3: Injury-Specific RTP Phase Automation**
- **Choice:** Semi-automated progression (criteria gates unlock phases; coach confirms advancement)
- **Rationale:** Prevents premature progression while respecting biological windows; coach retains final authority
- **Implementation:** Weekly phase progress form auto-checks gates; if all criteria ≥90% LSI, ACL-RSI ≥56, biomechanics symmetrical → phase ready; coach clicks "Advance Phase"

**Decision 4: Genetic Data Storage**
- **Choice:** Store raw genotypes + derived injury risk categories (not phenotypes or private interpretation)
- **Rationale:** Privacy-first; raw data allows future recalibration; derived metrics show clinical relevance without exposing sensitive inferences
- **Compliance:** Genetic data flagged PII; access logged; athlete explicit consent required

**Decision 5: Recovery Modality Recommendation Triggering**
- **Choice:** Multi-axis recommendation engine (ACWR-based, objective marker-based, phase-based, biomarker-based)
- **Rationale:** Reflects evidence that different recovery tools target different fatigue types (inflammatory vs neuromotor vs psychological)
- **Example:** Red-flag ACWR + CMJ >7% drop → ice bath + foam rolling + sleep focus; early RTP phase → psychology coaching priority

---

## IX. Data Privacy & Security

- **Genetic Data:** Encrypted at rest (field-level); access audited; athlete PII separation
- **Training Load:** Visible to athlete + assigned coach + medical staff only (role-based access control)
- **Biomarker Data:** Linked to athlete but flagged as sensitive health data (HIPAA-relevant if applicable)
- **Psychological Assessments:** Encrypted; accessed only by athlete + clinician + coach (athlete consent granular per assessment type)

---

**Phase 2 Status:** Schema designed. Ready for implementation in Supabase + Angular frontend.
**Next Step:** Phase 2a deployment (schema creation, ACWR procedure, first materialized view).
