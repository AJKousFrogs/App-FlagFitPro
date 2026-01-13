# 🛡️ Player Data Safety Guide

## ⚠️ CRITICAL: Why This Matters

**Mock data in a training app can cause real injuries.** Athletes making training decisions based on fake metrics may:

- Overtrain due to false low ACWR readings
- Undertrain due to false high readiness scores
- Ignore genuine fatigue signals
- Make poor recovery decisions
- Risk serious injury from incorrect load calculations

This guide establishes best practices for handling data in the FlagFit Pro application to protect athlete health and safety.

---

## 🎯 Core Principles

### 1. Never Show Mock Data as Real Data

```typescript
// ❌ DANGEROUS - Don't do this
const acwr = mockData.acwr || 0.95; // Athlete might think this is real!

// ✅ SAFE - Always check data source
if (dataSourceService.isRealData()) {
  return <ACWRCard value={realAcwr} />;
} else {
  return <NoDataEntry context="training" />;
}
```

### 2. Distinguish Between States

| State | What It Means | What to Show |
|-------|--------------|--------------|
| **No Data Entry** | User hasn't logged any data yet | Welcome message + CTA to log first entry |
| **Insufficient Data** | Some data, but not enough for reliable calculations | Progress indicator + how many more entries needed |
| **Mock/Demo Data** | Fake data for demonstration only | **PROMINENT WARNING** - DO NOT make decisions based on this |
| **Real Data** | User's actual logged data | Normal display (optionally show "✅ Real Data" indicator) |

### 3. Minimum Data Requirements

Based on sports science best practices:

| Metric | Minimum Data Points | Why |
|--------|-------------------|-----|
| **ACWR** | 28 days (4 weeks) | Need chronic load baseline |
| **Readiness Score** | 7 days | Need pattern recognition |
| **Performance Trends** | 2 data points | Need comparison baseline |
| **Wellness Tracking** | 7 days | Need baseline for anomaly detection |
| **Body Composition** | 4 measurements | Need trend establishment |
| **Training Load** | 7 days | Need weekly pattern |

---

## 🔧 Implementation Guide

### Using the DataSourceService

```typescript
import { DataSourceService, DATA_REQUIREMENTS } from './data-source.service';

@Component({...})
export class MyDashboard {
  private dataSourceService = inject(DataSourceService);
  
  // Check if user has real data
  isRealData = this.dataSourceService.isRealData;
  isFirstTimeUser = this.dataSourceService.isFirstTimeUser;
  hasEnoughData = this.dataSourceService.hasEnoughData;
  
  ngOnInit() {
    // Register metrics with their requirements
    this.dataSourceService.registerMetric(
      'acwr',
      'Acute:Chronic Workload Ratio',
      this.userDataCount,
      DATA_REQUIREMENTS.acwr.minimumDataPoints,
      this.userDataCount > 0 ? 'real' : 'unknown'
    );
  }
}
```

### Using the DataSourceBannerComponent

Add this to the top of any dashboard showing performance metrics:

```html
<!-- Always show at top of dashboard -->
<app-data-source-banner
  actionRoute="/training/log"
  actionLabel="Log Training"
></app-data-source-banner>
```

The banner automatically:
- Shows **danger** warning for mock/demo data
- Shows **info** message for first-time users
- Shows **warning** for insufficient data
- Hides when user has enough real data

### Using the NoDataEntryComponent

For specific metrics with no data:

```html
<!-- For training data -->
<app-no-data-entry
  context="training"
  [showMinimumInfo]="true"
  [minimumEntries]="28"
  metricName="ACWR"
></app-no-data-entry>

<!-- For wellness check-ins -->
<app-no-data-entry
  context="wellness"
></app-no-data-entry>

<!-- Compact version for inline use -->
<app-no-data-entry
  context="performance"
  [compact]="true"
  [inline]="true"
  [showBenefits]="false"
></app-no-data-entry>
```

Available contexts:
- `training` - Training sessions
- `wellness` - Wellness check-ins
- `performance` - Performance tests
- `nutrition` - Nutrition tracking
- `recovery` - Recovery activities
- `measurements` - Body measurements
- `generic` - Generic empty state

---

## 📱 UI Patterns

### Pattern 1: First-Time User Welcome

```html
@if (isFirstTimeUser()) {
  <app-no-data-entry
    context="training"
    [showMinimumInfo]="true"
    [minimumEntries]="28"
    metricName="ACWR"
  ></app-no-data-entry>
}
```

**Shows:**
- Welcoming icon and message
- Benefits of tracking
- Clear CTA to log first entry
- Safety note about not showing fake data

### Pattern 2: Insufficient Data Warning

```html
@if (!hasEnoughData() && !isFirstTimeUser()) {
  <div class="insufficient-data-warning">
    <i class="pi pi-info-circle"></i>
    <span>
      {{ remainingEntries }} more entries needed for reliable 
      {{ metricName }} calculations
    </span>
  </div>
}
```

### Pattern 3: Demo Mode Banner

```html
<app-data-source-banner
  [customSeverity]="'danger'"
  customTitle="⚠️ Demo Data - Not Your Real Metrics"
  customMessage="These metrics are for demonstration only. DO NOT make training decisions based on this data."
></app-data-source-banner>
```

### Pattern 4: Metric-Specific Warnings

```html
<p-card class="metric-card">
  <div class="metric-content">
    <h3>ACWR</h3>
    @if (acwrDataSource().isReliable) {
      <div class="metric-value">{{ acwrValue() | number:'1.2-2' }}</div>
    } @else {
      <div class="metric-insufficient">
        <i class="pi pi-exclamation-triangle"></i>
        <span>Need {{ acwrDataSource().minimumRequired - acwrDataSource().dataPoints }} more days</span>
      </div>
    }
  </div>
</p-card>
```

---

## 🚨 What NOT to Do

### ❌ Don't Use Mock Data as Fallback for Real Metrics

```typescript
// ❌ DANGEROUS
loadACWR() {
  this.api.getACWR().subscribe({
    next: (data) => this.acwr.set(data),
    error: () => this.acwr.set(0.95) // NEVER do this!
  });
}

// ✅ SAFE
loadACWR() {
  this.api.getACWR().subscribe({
    next: (data) => {
      this.acwr.set(data);
      this.dataSourceService.updateMetricSource('acwr', { source: 'real' });
    },
    error: () => {
      this.acwr.set(null); // Show "no data" state instead
      this.dataSourceService.updateMetricSource('acwr', { source: 'unknown' });
    }
  });
}
```

### ❌ Don't Hide Data Source Information

```typescript
// ❌ DANGEROUS - User doesn't know data is fake
<div class="acwr-card">
  <span>{{ acwr }}</span>
</div>

// ✅ SAFE - Always indicate data source
<div class="acwr-card">
  <span>{{ acwr }}</span>
  @if (!isRealData()) {
    <span class="demo-badge">DEMO</span>
  }
</div>
```

### ❌ Don't Calculate Metrics Without Enough Data

```typescript
// ❌ DANGEROUS - ACWR needs 4 weeks of data
calculateACWR(sessions: TrainingSession[]) {
  if (sessions.length < 7) {
    return 1.0; // Default value - DANGEROUS!
  }
  // ... calculation
}

// ✅ SAFE - Return null if insufficient data
calculateACWR(sessions: TrainingSession[]): number | null {
  if (sessions.length < 28) { // 4 weeks minimum
    return null; // UI should show "insufficient data" message
  }
  // ... calculation
}
```

---

## 📊 When Can Athletes Start Using the App?

### Day 1: Immediate Value
- ✅ Log training sessions
- ✅ Log wellness check-ins
- ✅ Track body measurements
- ✅ View logged data history
- ❌ ACWR (needs 4 weeks)
- ❌ Trend analysis (needs baseline)

### Week 1: Growing Value
- ✅ All Day 1 features
- ✅ Weekly load totals
- ✅ Basic wellness patterns
- ⚠️ Preliminary readiness (with warning)
- ❌ ACWR still building

### Week 4+: Full Features
- ✅ All features unlocked
- ✅ Reliable ACWR calculations
- ✅ Trend analysis
- ✅ Personalized recommendations
- ✅ Injury risk predictions

---

## 🔄 Migration from Mock Data

If your app currently shows mock data, follow this migration path:

1. **Add DataSourceService** to track data sources
2. **Add DataSourceBannerComponent** to all dashboards
3. **Replace mock fallbacks** with NoDataEntryComponent
4. **Add metric registration** for all calculated metrics
5. **Test with new users** to ensure proper empty states
6. **Remove mock data files** from production builds

---

## ✅ Checklist for New Features

Before releasing any feature that displays athlete data:

- [ ] Does it check data source before displaying?
- [ ] Does it show appropriate empty state for no data?
- [ ] Does it warn if using mock/demo data?
- [ ] Does it indicate minimum data requirements?
- [ ] Does it prevent training decisions on insufficient data?
- [ ] Is the data source banner visible?
- [ ] Are metric-specific warnings in place?

---

## 📚 Related Documentation

- [ACWR Calculation Guide](./ACWR_CALCULATION_GUIDE.md)
- [Load Management Quick Start](./LOAD_MANAGEMENT_QUICK_START.md)
- [Error Handling Guide](./ERROR_HANDLING_GUIDE.md)
- [Authentication Pattern](./AUTHENTICATION_PATTERN.md)

---

## 🆘 Support

If you have questions about data safety implementation:

1. Check this guide first
2. Review the DataSourceService code
3. Look at athlete-dashboard.component.ts for examples
4. Contact the development team

**Remember: When in doubt, show "No Data" rather than fake data. An athlete's health is more important than a polished UI.**
