# Evidence-Based Configuration Guide

**Version**: 1.0  
**Last Updated**: January 2025  
**Status**: ✅ Production Ready

**FlagFit Pro - ACWR, Readiness Scoring, and Taper Logic Documentation**

---

## Overview

FlagFit Pro uses evidence-based configurations for all training load monitoring, readiness assessment, and periodization decisions. This guide documents the scientific foundations, implementation details, and customization options.

### Key Features

- **Evidence-Based Parameters**: Research-backed thresholds and configurations
- **ACWR Monitoring**: Acute:Chronic Workload Ratio with EWMA method
- **Readiness Scoring**: Composite score combining workload, wellness, sleep, and game proximity
- **Tapering Logic**: Evidence-based tapering protocols for competition preparation
- **Calibration Support**: Team-specific calibration and customization options

---

## Table of Contents

1. [ACWR (Acute:Chronic Workload Ratio)](#acwr)
2. [Readiness Scoring](#readiness-scoring)
3. [Tapering Logic](#tapering-logic)
4. [Evidence Presets](#evidence-presets)
5. [Customization & Calibration](#customization--calibration)

---

## ACWR (Acute:Chronic Workload Ratio)

### Scientific Foundation

**Primary Research**: Gabbett, T. J. (2016). "The training—injury prevention paradox: should athletes be training smarter and harder?"

**Key Findings**:

- ACWR between **0.80-1.30** = "Sweet spot" with lowest injury risk
- ACWR **> 1.50** = Danger zone with highest injury risk
- ACWR **< 0.80** = Under-training, insufficient conditioning
- **10% weekly increase cap** prevents injury spikes

### Implementation

**Method**: EWMA (Exponentially Weighted Moving Average)

**Windows**:

- **Acute Load**: 7 days (fatigue indicator)
- **Chronic Load**: 28 days (fitness indicator)
- **Lambda Values**:
  - Acute: 0.2 (more weight to recent days)
  - Chronic: 0.05 (smoother, long-term trend)

**Risk Zones**:

| ACWR Range  | Risk Level     | Color  | Action                                   |
| ----------- | -------------- | ------ | ---------------------------------------- |
| < 0.80      | Under-Training | Orange | Gradually increase volume 5-10% per week |
| 0.80 - 1.30 | Sweet Spot     | Green  | Maintain current load (optimal)          |
| 1.31 - 1.50 | Elevated Risk  | Yellow | Reduce high-intensity by 15-20%          |
| > 1.50      | Danger Zone    | Red    | Reduce load 20-30%, skip sprints         |

### Safeguards

**Minimum Chronic Load Floor**: 50 AU

- Prevents inflated ratios during return from injury/time off
- Ensures meaningful ACWR calculations

**Data Quality Requirements**:

- Minimum **21 days** of data
- Minimum **12 sessions** in chronic window
- Low confidence flag if < 8 sessions in 4 weeks

**Weekly Progression Cap**:

- Standard: **10%** weekly increase (Gabbett 2016)
- Conservative: **7%** for higher-risk athletes

### Configuration

```typescript
// Default configuration (from evidence preset)
{
  acuteWindowDays: 7,
  chronicWindowDays: 28,
  acuteLambda: 0.2,
  chronicLambda: 0.05,
  thresholds: {
    sweetSpotLow: 0.8,
    sweetSpotHigh: 1.3,
    dangerHigh: 1.5,
    maxWeeklyIncreasePercent: 10,
    maxWeeklyIncreasePercentConservative: 7
  },
  minChronicLoad: 50,
  minDaysForChronic: 21,
  minSessionsForChronic: 12
}
```

### Citations

- **Gabbett, T. J. (2016)**: "The training—injury prevention paradox: should athletes be training smarter and harder?" _British Journal of Sports Medicine_, 50(5), 273-280.
- Multiple systematic reviews and practitioner guidelines

---

## Readiness Scoring

### Scientific Foundation

**Primary Research**:

- **Halson, S. L. (2014)**: Sleep and recovery in athletes
- **Fullagar, H. H. K., et al. (2015)**: Sleep and athletic performance
- **Saw, A. E., et al. (2016)**: Wellness scores predict perceived performance
- **McLellan, C. P., et al. (2011)**: Team-sport contexts show stronger associations with self-reported wellness

### Implementation

**Composite Score**: 0-100 combining four components

**Weightings (Team-Sport Optimized)**:

| Component       | Weight | Rationale                                             |
| --------------- | ------ | ----------------------------------------------------- |
| Workload (ACWR) | 35%    | Reduced from 40% to increase wellness/sleep influence |
| Wellness Index  | 30%    | Increased from 25% for team-sport contexts            |
| Sleep           | 20%    | Strong evidence base (Halson 2014, Fullagar 2015)     |
| Game Proximity  | 15%    | Post-match recovery considerations                    |

### Wellness Index

**Components** (1-5 scale):

- **Required**: Fatigue, Sleep Quality, Soreness
- **Optional**: Mood, Stress, Energy

**Calculation**:

- Average of available components
- Converted to 0-100 scale
- Completeness threshold: 60% (below this, use sleep-proxy mode)

### Cut-Points

**Starting Points** (require team calibration):

| Score Range | Level    | Suggestion | Action                        |
| ----------- | -------- | ---------- | ----------------------------- |
| < 55        | Low      | Deload     | Reduce intensity or volume    |
| 55 - 75     | Moderate | Maintain   | Keep planned workload         |
| > 75        | High     | Push       | Can tolerate higher intensity |

**Note**: These are population-level starting points. Teams should calibrate using their own injury and performance history.

### Reduced Data Mode

When wellness completeness < 60%:

- Sleep weight multiplier: **1.5x** (increases sleep influence)
- Uses sleep metrics as proxy for broader wellness
- Based on research: Simple sleep metrics can proxy broader wellness when resources are limited (Saw 2016)

### Configuration

```typescript
// Default configuration (from evidence preset)
{
  weightings: {
    workload: 0.35,
    wellness: 0.30,
    sleep: 0.20,
    proximity: 0.15
  },
  cutPoints: {
    lowMax: 55,
    moderateMax: 75
  },
  reducedDataMode: {
    enabled: true,
    wellnessCompletenessThreshold: 60,
    sleepWeightMultiplier: 1.5
  },
  wellnessIndex: {
    use1to5Scale: true,
    requiredFields: ['fatigue', 'sleepQuality', 'soreness'],
    optionalFields: ['mood', 'stress', 'energy']
  }
}
```

### Citations

- **Halson, S. L. (2014)**: Sleep in elite athletes and nutritional interventions to enhance sleep. _Sports Medicine_, 44(S1), 13-23.
- **Fullagar, H. H. K., et al. (2015)**: Sleep and athletic performance: The effects of sleep loss on exercise performance, and physiological and cognitive responses to exercise. _Sports Medicine_, 45(2), 161-186.
- **Saw, A. E., et al. (2016)**: Monitoring the athlete training response: Subjective self-reported measures trump commonly used objective measures: A systematic review. _British Journal of Sports Medicine_, 50(5), 281-291.
- **McLellan, C. P., et al. (2011)**: Markers of postmatch fatigue in professional rugby league players. _Journal of Strength and Conditioning Research_, 25(4), 1030-1039.

---

## Tapering Logic

### Scientific Foundation

**Primary Research**:

- **Bosquet, L., et al. (2007)**: Effects of tapering on performance: A meta-analysis
- **Mujika, I., & Padilla, S. (2003)**: Scientific bases for precompetition tapering strategies

### Implementation

**Taper Duration Ranges**:

| Event Importance | Duration (Days) | Volume Reduction |
| ---------------- | --------------- | ---------------- |
| Major            | 10-14           | 50-70%           |
| High             | 7-10            | 40-60%           |
| Medium           | 5-7             | 30-50%           |
| Minor            | 3-5             | 20-40%           |

**Intensity Floor**: 80-90% of normal

- Maintains moderate-high intensity during taper
- Prevents detraining (Mujika 2003)

**Post-Overload Taper**:

- Volume reduction: 60-90%
- Duration: 10-14 days
- Applied after overload periods

**Overload Period** (before major events):

- Duration: 14-28 days
- Volume multiplier: 1.1x
- Intensity multiplier: 0.95x

### Configuration

```typescript
// Default configuration (from evidence preset)
{
  taperDuration: {
    major: { min: 10, max: 14 },
    high: { min: 7, max: 10 },
    medium: { min: 5, max: 7 },
    minor: { min: 3, max: 5 }
  },
  targetVolumeReduction: {
    major: { min: 0.50, max: 0.70 },
    high: { min: 0.40, max: 0.60 },
    medium: { min: 0.30, max: 0.50 },
    minor: { min: 0.20, max: 0.40 }
  },
  minIntensityFloor: 0.80,
  maxIntensityFloor: 0.90,
  postOverloadTaper: {
    volumeReduction: { min: 0.60, max: 0.90 },
    duration: { min: 10, max: 14 }
  },
  overloadPeriod: {
    duration: { min: 14, max: 28 },
    volumeMultiplier: 1.1,
    intensityMultiplier: 0.95
  }
}
```

### Citations

- **Bosquet, L., et al. (2007)**: Effects of tapering on performance: A meta-analysis. _Medicine & Science in Sports & Exercise_, 39(8), 1358-1365.
- **Mujika, I., & Padilla, S. (2003)**: Scientific bases for precompetition tapering strategies. _Medicine & Science in Sports & Exercise_, 35(7), 1182-1187.

---

## Evidence Presets

### Available Presets

**1. Adult Flag Competitive v1** (`adult_flag_competitive_v1`)

- Population: 18-35 years, competitive, 3-6 sessions/week
- Default preset for most users

**2. Youth Flag v1** (`youth_flag_v1`)

- Population: 13-17 years, recreational/competitive
- More conservative thresholds

### Preset Structure

Each preset includes:

- **Population assumptions**: Age range, sport type, competition level
- **ACWR configuration**: Thresholds, windows, safeguards
- **Readiness configuration**: Weightings, cut-points, reduced data mode
- **Tapering configuration**: Duration ranges, volume reductions
- **Citations**: Research references with DOIs
- **Science notes**: What comes from research vs. coach choice

### Switching Presets

```typescript
// In Angular service
evidenceConfigService.setActivePreset("youth_flag_v1");

// Services automatically update
acwrService.resetConfig(); // Uses new preset
readinessService.resetConfig(); // Uses new preset
```

---

## Customization & Calibration

### Coach Override Guidelines

**What Can Be Overridden**:

- ACWR thresholds (if team-specific data shows different optimal ranges)
- Readiness cut-points (should be calibrated using team's injury/performance history)
- Taper duration and volume reductions (based on athlete response)
- Weekly progression caps (for individual athletes)

**What Should Stay Evidence-Based**:

- ACWR calculation method (EWMA)
- Window sizes (7/28 days)
- Readiness component weightings (unless strong team-specific data)
- Intensity floor during taper (prevents detraining)

### Calibration Process

**1. Readiness Cut-Points**:

- Track readiness scores and injury/performance outcomes
- Adjust cut-points based on team-specific patterns
- Document calibration rationale

**2. ACWR Thresholds**:

- Monitor injury rates at different ACWR ranges
- Adjust if team shows different tolerance patterns
- Consider individual athlete variations

**3. Weekly Progression Caps**:

- Start with evidence-based 10% cap
- Reduce to 7% for higher-risk athletes
- Increase only with strong justification

### Best Practices

1. **Start with Evidence**: Use default presets initially
2. **Collect Data**: Track outcomes for 3-6 months
3. **Calibrate Gradually**: Make small adjustments based on data
4. **Document Changes**: Record why thresholds were adjusted
5. **Monitor Continuously**: Re-evaluate as team/athletes change

---

## API Access

### Getting Current Configuration

```typescript
// ACWR
const acwrConfig = acwrService.getConfig();
const evidenceInfo = acwrService.getEvidenceInfo();

// Readiness
const readinessConfig = readinessService.getConfig();
const evidenceInfo = readinessService.getEvidenceInfo();

// Evidence Preset
const preset = evidenceConfigService.getActivePreset();
```

### Updating Configuration

```typescript
// Update ACWR thresholds
acwrService.updateConfig({
  thresholds: {
    sweetSpotHigh: 1.4, // Team-specific adjustment
  },
});

// Update Readiness cut-points
readinessService.updateConfig({
  cutPoints: {
    lowMax: 50, // Calibrated based on team data
    moderateMax: 70,
  },
});

// Reset to evidence defaults
acwrService.resetConfig();
readinessService.resetConfig();
```

---

## References

### ACWR

- Gabbett, T. J. (2016). The training—injury prevention paradox: should athletes be training smarter and harder? _British Journal of Sports Medicine_, 50(5), 273-280.

### Readiness

- Halson, S. L. (2014). Sleep in elite athletes and nutritional interventions to enhance sleep. _Sports Medicine_, 44(S1), 13-23.
- Fullagar, H. H. K., et al. (2015). Sleep and athletic performance: The effects of sleep loss on exercise performance, and physiological and cognitive responses to exercise. _Sports Medicine_, 45(2), 161-186.
- Saw, A. E., et al. (2016). Monitoring the athlete training response: Subjective self-reported measures trump commonly used objective measures: A systematic review. _British Journal of Sports Medicine_, 50(5), 281-291.
- McLellan, C. P., et al. (2011). Markers of postmatch fatigue in professional rugby league players. _Journal of Strength and Conditioning Research_, 25(4), 1030-1039.

### Tapering

- Bosquet, L., et al. (2007). Effects of tapering on performance: A meta-analysis. _Medicine & Science in Sports & Exercise_, 39(8), 1358-1365.
- Mujika, I., & Padilla, S. (2003). Scientific bases for precompetition tapering strategies. _Medicine & Science in Sports & Exercise_, 35(7), 1182-1187.

---

## Support

For questions about evidence-based configurations:

1. Review this documentation
2. Check evidence preset citations
3. Consult with sports science team
4. Refer to original research papers

## 🔗 **Related Documentation**

- [Evidence Configuration System Guide](EVIDENCE_CONFIG_GUIDE.md) - Configuration system architecture
- [AI Training Scheduler Guide](AI_TRAINING_SCHEDULER_GUIDE.md) - Training scheduler integration
- [Comprehensive Offseason Periodization](COMPREHENSIVE_OFFSEASON_PERIODIZATION.md) - Periodization plans

## 📝 **Changelog**

- **v1.0 (2025-01)**: Initial evidence-based configuration guide
- ACWR, readiness scoring, and tapering logic documented
- Scientific foundations and citations added
- Calibration process documented

**Remember**: Evidence-based configurations are starting points. Teams should calibrate using their own data for optimal accuracy.
