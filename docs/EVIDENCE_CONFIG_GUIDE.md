# Evidence Configuration System Guide

## Overview

The Evidence Configuration System provides a centralized, versioned approach to managing evidence-based training parameters. It makes explicit what comes from research vs. what coaches can override, and enables real-world calibration over time.

---

## Architecture

### EvidenceConfig Layer

All evidence-based parameters are defined in JSON/TypeScript config objects:

- **`evidence-config.ts`**: Type definitions and interfaces
- **`evidence-presets.ts`**: Versioned preset configurations
- **`evidence-config.service.ts`**: Service to manage active preset

### Services Integration

Services import evidence configs rather than hard-coding values:

- **`acwr.service.ts`**: Uses `EvidenceConfigService.getACWRConfig()`
- **`readiness.service.ts`**: Uses `EvidenceConfigService.getReadinessConfig()`
- **`aiTrainingScheduler.js`**: Uses tapering config from preset

---

## Presets

### Available Presets

1. **`adult_flag_competitive_v1`** (Default)
   - Standard competitive adult flag football
   - Age: 18-35 years
   - Training: 3-6 sessions/week
   - ACWR thresholds: 0.8-1.3 sweet spot, >1.5 danger zone
   - Readiness cut-points: Low <55, Moderate 55-75, High >75

2. **`youth_flag_v1`**
   - Youth/adolescent flag football
   - Age: 13-17 years
   - Training: 3-5 sessions/week
   - More conservative thresholds (sweet spot: 0.8-1.2, danger: >1.4)
   - Lower weekly increase cap (7% vs 10%)

3. **`return_to_play_v1`**
   - Return-to-play protocols
   - Very conservative thresholds (sweet spot: 0.7-1.1, danger: >1.3)
   - Lower weekly increase cap (5%)
   - No overload period

### Preset Structure

Each preset includes:

```typescript
{
  id: "adult_flag_competitive_v1",
  name: "Adult Flag Football Competitive v1",
  version: "1.0",
  description: "...",
  population: {
    ageRange: "18-35 years",
    sportType: "5v5 flag football",
    competitionLevel: "competitive",
    trainingFrequency: "3-6 sessions/week",
  },
  acwr: { /* ACWR config with citations */ },
  readiness: { /* Readiness config with citations */ },
  tapering: { /* Tapering config with citations */ },
  citations: [ /* Research citations */ ],
  scienceNotes: { /* What comes from research */ },
  coachOverride: { /* What coaches can adjust */ },
}
```

---

## Science vs. Coach Choice

### Science (Research-Based)

**ACWR Thresholds**:
- Range 0.8-1.3 comes from large-scale team-sport research on injury risk (Gabbett 2016)
- These are population-level findings from multiple studies
- Thresholds are starting points based on common athlete monitoring scales

**Readiness Weightings**:
- Weightings optimized for team-sport contexts (McLellan 2011, Saw 2016)
- Sleep weightings based on strong evidence (Halson 2014, Fullagar 2015)

**Tapering Protocols**:
- Taper duration (7-14 days) from meta-analysis (Bosquet 2007)
- Volume reduction (40-60%) based on systematic reviews
- Intensity floor (80-90%) prevents detraining (Mujika 2003)

### Coach Override

**ACWR Thresholds**:
- Coaches can override thresholds if they have their own philosophy
- Team-specific data may show different optimal ranges
- Individual athletes may have different tolerance levels

**Readiness Cut-Points**:
- Cut-points require team-specific calibration
- Weightings can be adjusted based on team philosophy
- Individual athlete needs should be considered

**Tapering Protocols**:
- Taper duration and volume reductions can be adjusted
- Based on athlete response, team philosophy, or individual needs
- Intensity floor can be modified but research suggests maintaining intensity

---

## Calibration Logging

### Purpose

Log training recommendations alongside outcomes to:
- Track whether thresholds are conservative or aggressive
- Fit simple internal models showing effectiveness
- Enable individualization over time

### Logged Data

**Recommendations**:
- Type: deload/maintain/push
- Readiness score
- ACWR value
- Rationale
- Context (preset, phase, event proximity)

**Outcomes** (filled in later):
- Injury flagged (yes/no, date, type)
- Performance rating (1-10 scale)
- Session quality (1-10 scale)
- Subjective feedback

### Usage

```typescript
// Log recommendation
calibrationLoggingService.logRecommendation({
  athleteId: 'athlete-123',
  timestamp: new Date(),
  recommendation: {
    type: 'deload',
    readinessScore: 45,
    acwr: 1.6,
    rationale: 'ACWR exceeds danger threshold',
  },
  context: {
    presetId: 'adult_flag_competitive_v1',
    presetVersion: '1.0',
  },
});

// Log outcome
calibrationLoggingService.logOutcome(
  'athlete-123',
  timestamp,
  {
    injuryFlagged: false,
    performanceRating: 7,
    sessionQuality: 8,
  }
);
```

---

## UI Integration

### Evidence Preset Indicator

Component displays:
- Active preset name and version
- Population assumptions
- Link to evidence details

### Evidence Details Dialog

Shows:
- **Science Notes**: What comes from research
- **Coach Override**: What coaches can adjust
- **Citations**: Supporting research with DOIs
- **Thresholds**: Current values and rationale

### Tooltips

Throughout the UI, tooltips explain:
- "This range (0.8-1.3) comes from large-scale team-sport research on injury risk (Gabbett 2016); coaches can override it if they have their own philosophy."
- "Sleep targets (<8 hours consistently linked to worse cognitive and performance outcomes)"
- "Taper duration (7-14 days) from meta-analysis (Bosquet 2007)"

---

## Versioning

### Preset Versions

Presets are versioned (e.g., `v1.0`, `v1.1`, `v2.0`):
- **Major version** (v1 → v2): Significant changes based on new research
- **Minor version** (v1.0 → v1.1): Minor adjustments or bug fixes

### Changelog

Each preset includes a changelog:
```typescript
changelog: [
  "v1.0 (2026-01-01): Initial release with evidence-based configurations",
  "v1.1 (2026-03-15): Adjusted readiness cut-points based on team calibration data",
]
```

### Updating Presets

When new research emerges:
1. Create new preset version (e.g., `v1.1`)
2. Update values based on new evidence
3. Add citation to research database
4. Update changelog
5. Coaches can switch to new version when ready

---

## Backend Integration

### Calibration Logging Endpoints

**POST `/api/calibration-logs`**
- Log training recommendation
- Returns: success/failure

**POST `/api/calibration-logs/outcome`**
- Log outcome for previous recommendation
- Returns: success/failure

**GET `/api/calibration-logs/stats/:athleteId`**
- Get calibration statistics for athlete
- Returns: recommendation counts, injury rates, performance ratings

**GET `/api/calibration-logs/preset-stats/:presetId`**
- Get calibration statistics for preset
- Returns: threshold effectiveness, recommendation (conservative/optimal/aggressive)

---

## Best Practices

### For Coaches

1. **Start with default preset** (`adult_flag_competitive_v1`)
2. **Monitor calibration data** over time
3. **Adjust thresholds** based on team-specific data
4. **Switch presets** if population changes (e.g., youth → adult)
5. **Review evidence details** before making major changes

### For Developers

1. **Always use EvidenceConfigService** - don't hard-code values
2. **Add citations** when creating new presets
3. **Document science vs. coach choice** clearly
4. **Version presets** when updating based on new research
5. **Log recommendations** for calibration analysis

---

## Future Enhancements

### Planned Features

1. **Auto-calibration**: System suggests threshold adjustments based on calibration data
2. **Individual presets**: Per-athlete preset customization
3. **Machine learning**: Optimize thresholds from performance data
4. **Research updates**: Automatic notifications when new research emerges
5. **Team-specific presets**: Create custom presets based on team calibration

---

**Version**: 1.0  
**Last Updated**: January 2026  
**Status**: ✅ Implemented

