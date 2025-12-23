# 🏈 ACWR Implementation Guide

## Acute:Chronic Workload Ratio for Injury Prevention

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Core Concepts](#core-concepts)
4. [Service Architecture](#service-architecture)
5. [Usage Examples](#usage-examples)
6. [Integration Steps](#integration-steps)
7. [Dashboard Component](#dashboard-component)
8. [API Reference](#api-reference)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Overview

### What is ACWR?

ACWR (Acute:Chronic Workload Ratio) is a scientific method for monitoring training load and preventing injuries by comparing:

- **Acute Load** (7 days): Recent training stress (fatigue)
- **Chronic Load** (28 days): Long-term fitness base
- **Ratio**: Acute ÷ Chronic = Injury risk indicator

### Why EWMA Model?

This implementation uses **Exponentially Weighted Moving Average (EWMA)** instead of simple rolling averages because:

✅ **More sensitive** to day-to-day changes
✅ **Better models fitness decay** over time
✅ **Ideal for 5x weekly training** schedules
✅ **Research-validated** for flag football/team sports

### Risk Zones

| ACWR Range | Zone           | Color     | Meaning                     | Action                      |
| ---------- | -------------- | --------- | --------------------------- | --------------------------- |
| < 0.80     | Under-Training | 🟠 Orange | Insufficient conditioning   | Increase load 5-10%         |
| 0.80-1.30  | Sweet Spot     | 🟢 Green  | Optimal, lowest injury risk | Maintain                    |
| 1.30-1.50  | Elevated Risk  | 🟡 Yellow | Caution needed              | Reduce intensity            |
| > 1.50     | Danger Zone    | 🔴 Red    | Highest injury risk         | Reduce 20-30%, skip sprints |

---

## Quick Start

### 1. Import Services

```typescript
// app.config.ts or module providers
import { AcwrService } from "./core/services/acwr.service";
import { LoadMonitoringService } from "./core/services/load-monitoring.service";
import { AcwrAlertsService } from "./core/services/acwr-alerts.service";

export const appConfig: ApplicationConfig = {
  providers: [
    AcwrService,
    LoadMonitoringService,
    AcwrAlertsService,
    // ... other providers
  ],
};
```

### 2. Log a Training Session (Simple)

```typescript
import { Component } from "@angular/core";
import { LoadMonitoringService } from "./core/services/load-monitoring.service";
import { AcwrService } from "./core/services/acwr.service";

@Component({
  selector: "app-training-log",
  template: ` <button (click)="logSession()">Log Training</button> `,
})
export class TrainingLogComponent {
  constructor(
    private loadService: LoadMonitoringService,
    private acwrService: AcwrService,
  ) {}

  logSession() {
    // Player rates session 7/10, trained for 90 minutes
    const session = this.loadService.createQuickSession(
      "player123",
      "technical",
      7, // RPE (1-10)
      90, // Duration (minutes)
    );

    // Load = 7 × 90 = 630 AU
    this.acwrService.addSession(session);

    console.log("Session logged! ACWR:", this.acwrService.acwrRatio());
  }
}
```

### 3. Check Risk Status

```typescript
const riskZone = this.acwrService.riskZone();

if (riskZone.level === "danger-zone") {
  alert(`⚠️ ${riskZone.description}`);
  console.log("Recommendation:", riskZone.recommendation);
}
```

---

## Core Concepts

### EWMA Calculation

The EWMA formula applies exponential decay to weight recent days more heavily:

```
EWMA_today = λ × Load_today + (1 - λ) × EWMA_yesterday
```

**Lambda (λ) Values:**

- **Acute (7-day)**: λ = 0.20 (20% weight to today)
- **Chronic (28-day)**: λ = 0.05 (5% weight to today)

Higher λ = more sensitive to recent changes

### Load Calculation

**Internal Load (Always Required):**

```
sRPE × Duration = Workload (AU)
```

**Example:**

- Session RPE: 8/10
- Duration: 100 minutes
- **Load = 8 × 100 = 800 AU**

**Combined Load (Optional):**

```
(External Score × 50%) + (Internal Load × 50%)
```

**External Score Components:**

- Distance: 30%
- Sprint work: 40%
- Player Load device: 30%

### Weekly Progression Rule

**40% of injuries** occur when weekly load increases >10%

The system automatically warns when:

```
(This Week Load - Last Week Load) / Last Week Load > 10%
```

---

## Service Architecture

```
┌─────────────────────────────────────────────────┐
│         AcwrAlertsService                       │
│  - Monitors risk zones                          │
│  - Generates alerts                             │
│  - Notifies coach                               │
└────────────┬────────────────────────────────────┘
             │
             ├──> Browser Notifications
             ├──> Email/SMS (backend integration)
             └──> Coach Dashboard Alerts

┌─────────────────────────────────────────────────┐
│         AcwrService (Core)                      │
│  - EWMA calculation                             │
│  - Risk zone detection                          │
│  - Training modifications                       │
└────────────┬────────────────────────────────────┘
             │
             ├──> Reactive Signals (Angular 19)
             │    • acwrRatio()
             │    • riskZone()
             │    • weeklyProgression()
             │
             └──> Training Adjustments

┌─────────────────────────────────────────────────┐
│     LoadMonitoringService                       │
│  - Internal load (sRPE)                         │
│  - External load (GPS)                          │
│  - Wellness integration                         │
└─────────────────────────────────────────────────┘
```

---

## Usage Examples

### Example 1: Logging Multi-Metric Session

```typescript
// Technical training with GPS data
const external: ExternalLoad = {
  totalDistance: 8500, // meters
  sprintCount: 12,
  sprintDistance: 450, // meters
  playerLoad: 350, // Device metric
};

const internal: InternalLoad = {
  sessionRPE: 7,
  duration: 100, // minutes
  workload: 700, // 7 × 100
  avgHeartRate: 165,
  maxHeartRate: 190,
};

const wellness: WellnessMetrics = {
  sleepQuality: 7,
  sleepDuration: 7.5,
  muscleSoreness: 6,
  stressLevel: 4,
  energyLevel: 7,
  mood: 8,
};

const session = this.loadService.createSession(
  "player123",
  "technical",
  internal,
  external,
  wellness,
  "Great session, felt strong",
);

this.acwrService.addSession(session);
```

### Example 2: Multiple Daily Sessions

```typescript
// Morning: Gym session
const gymSession = this.loadService.createQuickSession(
  "player123",
  "strength",
  5, // RPE
  60, // minutes
);

// Afternoon: Field work
const fieldSession = this.loadService.createQuickSession(
  "player123",
  "technical",
  7,
  90,
);

// Evening: Recovery
const recoverySession = this.loadService.createQuickSession(
  "player123",
  "recovery",
  3,
  30,
);

// Add all sessions
this.acwrService.addSessions([gymSession, fieldSession, recoverySession]);

// Total daily load = 300 + 630 + 90 = 1020 AU
```

### Example 3: Pre-Session Check

```typescript
// Before training, check if player should skip sprints
const shouldSkip = this.acwrService.shouldSkipSprints(
  5, // Today is Friday (0=Sunday, 5=Friday)
  6, // Game on Saturday
);

if (shouldSkip) {
  console.log("⚠️ SKIP SPRINTS - High ACWR or pre-game day");
  // Modify training plan
  this.modifyPlan();
}
```

### Example 4: Training Plan Adjustment

```typescript
// Plan next session
const plannedSession = {
  sessionType: "conditioning",
  plannedIntensity: 8,
  plannedDuration: 90,
};

// Get prediction
const prediction = this.acwrService.predictNextSessionLoad(8);

console.log("Projected ACWR:", prediction.projectedACWR);
console.log("Recommendation:", prediction.recommendation);

if (prediction.projectedACWR > 1.5) {
  // Auto-adjust
  const adjustment = this.alertsService.generateAdjustment(
    "player123",
    plannedSession,
  );

  console.log("Original intensity:", adjustment.originalPlan.plannedIntensity);
  console.log("Adjusted intensity:", adjustment.adjustedPlan.adjustedIntensity);
  console.log("Modifications:", adjustment.adjustedPlan.modifications);
}
```

### Example 5: Weekly Summary for Coach

```typescript
const summary = this.alertsService.getWeeklySummary();

console.log(`
  📊 Weekly Summary:
  - Total Alerts: ${summary.totalAlerts}
  - Critical Days: ${summary.criticalDays}
  - Average ACWR: ${summary.averageACWR}

  Recommendations:
  ${summary.recommendations.join("\n  ")}
`);
```

---

## Integration Steps

### Step 1: Add to App Routes

```typescript
// app.routes.ts
import { Routes } from "@angular/router";
import { AcwrDashboardComponent } from "./features/acwr-dashboard/acwr-dashboard.component";

export const routes: Routes = [
  {
    path: "acwr",
    component: AcwrDashboardComponent,
    title: "Load Monitoring - ACWR",
  },
  {
    path: "performance",
    loadComponent: () =>
      import("./features/acwr-dashboard/acwr-dashboard.component").then(
        (m) => m.AcwrDashboardComponent,
      ),
  },
];
```

### Step 2: Create Session Logging Form

```typescript
@Component({
  selector: "app-session-form",
  template: `
    <form [formGroup]="sessionForm" (ngSubmit)="onSubmit()">
      <label>
        Session Type:
        <select formControlName="sessionType">
          <option value="technical">Technical</option>
          <option value="conditioning">Conditioning</option>
          <option value="strength">Strength</option>
          <option value="game">Game</option>
          <option value="sprint">Sprint Work</option>
          <option value="recovery">Recovery</option>
        </select>
      </label>

      <label>
        Session RPE (1-10):
        <input type="range" formControlName="rpe" min="1" max="10" />
        <span>{{ sessionForm.get("rpe")?.value }}</span>
      </label>

      <label>
        Duration (minutes):
        <input type="number" formControlName="duration" min="15" max="240" />
      </label>

      <label>
        Notes (optional):
        <textarea formControlName="notes"></textarea>
      </label>

      <button type="submit" [disabled]="!sessionForm.valid">Log Session</button>
    </form>

    <div class="preview">
      <p>Estimated Load: {{ estimatedLoad }} AU</p>
      <p>Projected ACWR: {{ projectedACWR | number: "1.2-2" }}</p>
    </div>
  `,
})
export class SessionFormComponent {
  sessionForm = new FormGroup({
    sessionType: new FormControl("technical", Validators.required),
    rpe: new FormControl(6, [
      Validators.required,
      Validators.min(1),
      Validators.max(10),
    ]),
    duration: new FormControl(90, [Validators.required, Validators.min(15)]),
    notes: new FormControl(""),
  });

  get estimatedLoad(): number {
    const rpe = this.sessionForm.get("rpe")?.value || 0;
    const duration = this.sessionForm.get("duration")?.value || 0;
    return rpe * duration;
  }

  get projectedACWR(): number {
    const predicted = this.acwrService.predictNextSessionLoad(
      this.sessionForm.get("rpe")?.value || 0,
    );
    return predicted.projectedACWR;
  }

  onSubmit() {
    const values = this.sessionForm.value;
    const session = this.loadService.createQuickSession(
      this.playerId,
      values.sessionType,
      values.rpe,
      values.duration,
      values.notes,
    );

    this.acwrService.addSession(session);
    this.sessionForm.reset();
  }
}
```

### Step 3: Add to Dashboard

```typescript
// dashboard.component.ts
import { AcwrDashboardComponent } from "../acwr-dashboard/acwr-dashboard.component";

@Component({
  template: `
    <div class="dashboard">
      <app-acwr-dashboard />
      <!-- Other dashboard components -->
    </div>
  `,
  imports: [AcwrDashboardComponent],
})
export class DashboardComponent {}
```

---

## API Reference

### AcwrService

**Signals (Reactive):**

```typescript
acuteLoad: Signal<number>          // 7-day EWMA load
chronicLoad: Signal<number>        // 28-day EWMA load
acwrRatio: Signal<number>          // Acute ÷ Chronic
riskZone: Signal<RiskZone>         // Risk classification
weeklyProgression: Signal<...>     // Weekly change stats
acwrData: Signal<ACWRData>         // Complete data
```

**Methods:**

```typescript
addSession(session: TrainingSession): void
addSessions(sessions: TrainingSession[]): void
setPlayer(playerId: string): void
clearSessions(): void
predictNextSessionLoad(intensity: number): {...}
shouldSkipSprints(dayOfWeek: number, gameDay?: number): boolean
getTrainingModification(): {...}
```

### LoadMonitoringService

```typescript
calculateInternalLoad(rpe: number, duration: number): InternalLoad
calculateExternalLoad(external: ExternalLoad): number
calculateCombinedLoad(internal, external?, wellness?): LoadMetrics
createSession(...): TrainingSession
createQuickSession(playerId, type, rpe, duration, notes?): TrainingSession
estimatePlannedLoad(type, intensity, duration): number
validateSession(session): { valid: boolean; errors: string[] }
```

### AcwrAlertsService

```typescript
getActiveAlerts(): LoadAlert[]
getAlertsBySeverity(severity): LoadAlert[]
acknowledgeAlert(id: string, user: string): void
dismissAlert(id: string): void
canTrainToday(): { canTrain: boolean; reason: string; modifications? }
getWeeklySummary(): {...}
generateAdjustment(playerId, plannedSession): TrainingAdjustment
```

---

## Best Practices

### 1. Consistent Data Entry

✅ **Log sessions daily** - Missing data skews ACWR
✅ **Use honest RPE** - Don't underreport
✅ **Include all sessions** - Gym + field + conditioning
✅ **Note modifications** - Track when plans change

### 2. ACWR Interpretation

✅ **Don't chase perfect 1.0** - Sweet spot is 0.80-1.30
✅ **Context matters** - Account for game weeks
✅ **Individual baselines** - Players have different tolerances
✅ **Wellness integration** - Poor sleep = higher perceived load

### 3. Training Adjustments

✅ **Auto-adjust conservatively** - Reduce by 15-20%, not 50%
✅ **Coach override option** - Don't fully automate
✅ **Communicate changes** - Explain why to players
✅ **Monitor compliance** - Did they actually reduce load?

### 4. Alert Management

✅ **Acknowledge alerts** - Don't let them pile up
✅ **Weekly reviews** - Coach checks summary
✅ **Trend analysis** - Look for patterns
✅ **Injury tracking** - Log injuries with ACWR at time

---

## Troubleshooting

### Issue: ACWR shows 0

**Cause:** No training sessions logged

**Solution:**

```typescript
// Check sessions
const sessions = this.acwrService.getSessionsInRange(
  new Date("2024-01-01"),
  new Date(),
);
console.log("Sessions:", sessions.length);
```

### Issue: ACWR stuck at same value

**Cause:** Not adding new sessions

**Solution:** Verify sessions have current dates:

```typescript
const session = this.loadService.createQuickSession(...);
session.date = new Date(); // Ensure current date
this.acwrService.addSession(session);
```

### Issue: Load seems too high/low

**Cause:** Incorrect calculation options

**Solution:**

```typescript
// Check calculation settings
const options = this.loadService.getCalculationOptions();
console.log("Options:", options);

// Adjust if needed
this.loadService.setCalculationOptions({
  includeWellness: true,
  externalLoadWeight: 0.5,
});
```

### Issue: No alerts appearing

**Cause:** Notifications disabled

**Solution:**

```typescript
// Enable notifications
this.alertsService.setNotificationEnabled(true);

// Request browser permission
await this.alertsService.requestNotificationPermission();
```

---

## Next Steps

1. ✅ **Test with sample data** - Run dashboard with mock sessions
2. ✅ **Integrate with player profiles** - Connect to your user system
3. ✅ **Add backend persistence** - Save sessions to database
4. ✅ **Create mobile app** - Build native iOS/Android version
5. ✅ **Team analytics** - Multi-player ACWR dashboard
6. ✅ **Export reports** - PDF/CSV for coaches
7. ✅ **Historical analysis** - Track ACWR vs injury rates

---

## Support

- **Documentation:** This guide
- **Example Code:** `acwr-dashboard.component.ts`
- **Sports Science Reference:** [ACWR Research](https://bjsm.bmj.com/content/50/5/273)
- **EWMA Model Paper:** [Exponentially Weighted Moving Averages](https://pubmed.ncbi.nlm.nih.gov/30076845/)

---

**Built with Angular 19 Signals for maximum reactivity and performance! 🚀**
