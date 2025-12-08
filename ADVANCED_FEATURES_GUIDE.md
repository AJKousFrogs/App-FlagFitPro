# Advanced Features Guide

This guide covers the new advanced features added to FlagFit Pro for training data management and analysis.

## Features Overview

### ✅ 1. Test Dataset Generator

**Service:** `DatasetGeneratorService` (`angular/src/app/core/services/dataset-generator.service.ts`)

Generates realistic test datasets for simulation and testing.

**Usage:**
```typescript
import { DatasetGeneratorService } from './core/services/dataset-generator.service';

constructor(private generator: DatasetGeneratorService) {}

// Generate a single session
const dataset = this.generator.generateDataset({
  durationMinutes: 90,
  intensity: 'high',
  athleteProfile: 'competitive',
  includeWarmup: true,
  includeCooldown: true
});

// Generate a full week
const weeklyData = this.generator.generateWeeklyDataset('competitive');

// Get as JSON string
const json = this.generator.generateDatasetJSON({ durationMinutes: 60 });
```

**Options:**
- `durationMinutes`: Session duration (default: 90)
- `samplingRateHz`: Samples per second (default: 1)
- `intensity`: 'low' | 'medium' | 'high' | 'game'
- `includeWarmup`: Include warmup phase (default: true)
- `includeCooldown`: Include cooldown phase (default: true)
- `athleteProfile`: 'recreational' | 'competitive' | 'elite'

### ✅ 2. Tailwind UI Dashboards

All dashboards now use Tailwind CSS for modern, responsive styling:

- **FlagLoadComponent**: ACWR analysis table and 4-week metrics chart
- **ImportDatasetComponent**: Multi-tab interface for data import
- **TrafficLightRiskComponent**: Visual risk indicator
- **MicrocyclePlannerComponent**: Weekly training plan dashboard

**Tailwind Classes Used:**
- Layout: `flex`, `grid`, `gap-*`, `p-*`, `m-*`
- Colors: `bg-surface-primary`, `text-text-primary`, `border-gray-*`
- Typography: `text-2xl`, `font-bold`, `font-semibold`
- Effects: `shadow-medium`, `rounded-lg`, `hover:*`, `transition-*`

### ✅ 3. AI Parser for Wearable Data

**Service:** `WearableParserService` (`angular/src/app/core/services/wearable-parser.service.ts`)

Intelligent parser that handles CSV, JSON, and XML files from various wearable devices.

**Supported Formats:**
- **CSV**: Auto-detects speed/distance columns
- **JSON**: Handles multiple JSON structures (arrays, nested objects)
- **XML**: Parses GPS/activity XML formats

**Device Support:**
- Garmin
- Polar
- Suunto
- Fitbit
- Apple Watch
- Generic formats

**Usage:**
```typescript
import { WearableParserService } from './core/services/wearable-parser.service';

constructor(private parser: WearableParserService) {}

async handleFileUpload(file: File) {
  try {
    const parsed = await this.parser.parseFile(file, {
      deviceType: 'garmin', // Optional
      autoDetect: true
    });
    
    console.log('Parsed data:', parsed.data);
    console.log('Metadata:', parsed.metadata);
    if (parsed.errors) {
      console.warn('Parsing errors:', parsed.errors);
    }
  } catch (error) {
    console.error('Parse failed:', error);
  }
}
```

**Features:**
- Auto-detects speed/distance columns
- Handles various units (km/h, m/s, pace)
- Converts distances (km to m)
- Normalizes speed formats
- Provides error reporting

### ✅ 4. Traffic Light Risk Zones Component

**Component:** `TrafficLightRiskComponent` (`angular/src/app/shared/components/traffic-light-risk/traffic-light-risk.component.ts`)

Visual traffic light display showing ACWR risk zones with animated indicators.

**Usage:**
```typescript
<app-traffic-light-risk 
  [riskZone]="riskZone" 
  [acwrValue]="acwrValue">
</app-traffic-light-risk>
```

**Features:**
- 5-light traffic light display (Red, Yellow, Green, Orange, Gray)
- Animated active light with pulse effect
- Risk zone scale with marker
- Color-coded information cards
- Responsive design

**Risk Zones:**
- 🔴 **Danger Zone** (>1.50): Highest injury risk
- 🟡 **Elevated Risk** (1.30-1.50): Caution needed
- 🟢 **Sweet Spot** (0.80-1.30): Optimal training
- 🟠 **Under-Training** (<0.80): Insufficient conditioning
- ⚪ **No Data**: Insufficient training data

### ✅ 5. Weekly Microcycle Planner

**Component:** `MicrocyclePlannerComponent` (`angular/src/app/features/training/microcycle-planner.component.ts`)

AI-powered weekly training planner that auto-suggests sprint loads based on ACWR.

**Usage:**
```typescript
<app-microcycle-planner [athleteId]="'athlete-uuid'"></app-microcycle-planner>
```

**Features:**
- 7-day sprint load plan
- ACWR-based load adjustments
- Intensity recommendations (low/medium/high/rest)
- Projected ACWR for each day
- Weekly summary statistics
- Traffic light integration

**Planning Logic:**
- **Danger Zone (ACWR > 1.5)**: Rest days + minimal sprint work
- **Elevated Risk (1.3-1.5)**: Reduced volume, rest days every 3 days
- **Sweet Spot (0.8-1.3)**: Normal training with high/medium intensity days
- **Under-Training (<0.8)**: Increased load, more high-intensity days

**Output Includes:**
- Suggested sprint load per day
- Maximum sprints allowed
- Recommended duration
- Projected ACWR
- Reasoning for each recommendation

## Integration Example

Complete example using all features:

```typescript
import { Component, OnInit } from '@angular/core';
import { FlagLoadComponent } from './features/training/flag-load.component';
import { ImportDatasetComponent } from './features/training/import-dataset.component';
import { MicrocyclePlannerComponent } from './features/training/microcycle-planner.component';
import { TrafficLightRiskComponent } from './shared/components/traffic-light-risk/traffic-light-risk.component';

@Component({
  selector: 'app-training-dashboard',
  standalone: true,
  imports: [
    FlagLoadComponent,
    ImportDatasetComponent,
    MicrocyclePlannerComponent,
    TrafficLightRiskComponent
  ],
  template: `
    <div class="training-dashboard p-6 space-y-6">
      <!-- Import Data -->
      <app-import-dataset></app-import-dataset>
      
      <!-- Current Status -->
      <app-traffic-light-risk 
        [riskZone]="riskZone()" 
        [acwrValue]="acwrValue()">
      </app-traffic-light-risk>
      
      <!-- Weekly Plan -->
      <app-microcycle-planner [athleteId]="athleteId"></app-microcycle-planner>
      
      <!-- Historical Analysis -->
      <app-flag-load [athleteId]="athleteId"></app-flag-load>
    </div>
  `
})
export class TrainingDashboardComponent implements OnInit {
  athleteId = 'your-athlete-id';
  riskZone = signal(/* ... */);
  acwrValue = signal(1.2);
  
  ngOnInit() {
    // Load data
  }
}
```

## File Structure

```
angular/src/app/
├── core/
│   └── services/
│       ├── dataset-generator.service.ts      # Test data generator
│       └── wearable-parser.service.ts         # File parser
├── features/
│   └── training/
│       ├── flag-load.component.ts            # ACWR dashboard (Tailwind)
│       ├── import-dataset.component.ts        # Import UI (Tailwind)
│       └── microcycle-planner.component.ts   # Weekly planner (Tailwind)
└── shared/
    └── components/
        └── traffic-light-risk/
            └── traffic-light-risk.component.ts  # Risk indicator
```

## Styling

All components use Tailwind CSS with your design system tokens:

- Colors: `bg-surface-primary`, `text-text-primary`, `border-gray-*`
- Spacing: `p-6`, `mb-4`, `gap-4`
- Typography: `text-2xl`, `font-bold`
- Effects: `shadow-medium`, `rounded-lg`, `hover:*`

## Next Steps

1. **Add to Routes**: Include components in your Angular routes
2. **Test Data**: Use generator to create test datasets
3. **Upload Files**: Test with real wearable device exports
4. **Monitor ACWR**: Use traffic light and planner for load management
5. **Customize**: Adjust thresholds and recommendations as needed

## Notes

- All components are standalone and can be used independently
- Services are provided in root and can be injected anywhere
- Tailwind classes work with your existing design tokens
- File parser handles common errors gracefully
- Generator creates realistic data patterns for testing

