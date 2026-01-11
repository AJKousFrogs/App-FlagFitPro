# 🛡️ Data Safety Policy

**Last Updated:** January 2026  
**Status:** ✅ Enforced Policy

---

## ⚠️ CRITICAL RULE

**Mock data in a training app can cause real injuries.** Athletes making training decisions based on fake metrics may:

- Overtrain due to false low ACWR readings
- Undertrain due to false high readiness scores
- Ignore genuine fatigue signals
- Make poor recovery decisions
- Risk serious injury from incorrect load calculations

> **When in doubt, show "No Data" rather than fake data. An athlete's health is more important than a polished UI.**

---

## 📋 Policy Summary

| Context                  | Mock Data Allowed? | Notes                                                         |
| ------------------------ | ------------------ | ------------------------------------------------------------- |
| **Local Development**    | ✅ Yes             | Only for UI testing, must be clearly marked                   |
| **Unit Tests**           | ✅ Yes             | Standard testing practice with HttpTestingController          |
| **Integration Tests**    | ✅ Yes             | Test fixtures and mock services                               |
| **Production Build**     | ❌ **NEVER**       | Production must use real data only                            |
| **User-Facing Features** | ❌ **NEVER**       | Even in development, mock data must be clearly marked as demo |
| **Fallback Values**      | ❌ **NEVER**       | Use "No Data" states instead of mock values                   |

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

### 2. Distinguish Between Data States

| State                 | What It Means                                       | What to Show                                                |
| --------------------- | --------------------------------------------------- | ----------------------------------------------------------- |
| **No Data Entry**     | User hasn't logged any data yet                     | Welcome message + CTA to log first entry                    |
| **Insufficient Data** | Some data, but not enough for reliable calculations | Progress indicator + how many more entries needed           |
| **Mock/Demo Data**    | Fake data for demonstration only                    | **PROMINENT WARNING** - DO NOT make decisions based on this |
| **Real Data**         | User's actual logged data                           | Normal display (optionally show "✅ Real Data" indicator)   |

### 3. Minimum Data Requirements

Based on sports science best practices:

| Metric                 | Minimum Data Points | Why                                 |
| ---------------------- | ------------------- | ----------------------------------- |
| **ACWR**               | 28 days (4 weeks)   | Need chronic load baseline          |
| **Readiness Score**    | 7 days              | Need pattern recognition            |
| **Performance Trends** | 2 data points       | Need comparison baseline            |
| **Wellness Tracking**  | 7 days              | Need baseline for anomaly detection |
| **Body Composition**   | 4 measurements      | Need trend establishment            |
| **Training Load**      | 7 days              | Need weekly pattern                 |

---

## ✅ Allowed Uses

### 1. Local Development (UI Testing Only)

```typescript
// ✅ ALLOWED - Development only, clearly marked
if (!environment.production && USE_MOCK_DATA) {
  console.warn("⚠️ USING MOCK DATA - DEVELOPMENT ONLY");
  return of(mockTrainingData);
}
```

**Requirements:**
- Must check `environment.production` first
- Must show clear warning in console/logs
- Must never be accessible in production builds

### 2. Unit Tests

```typescript
// ✅ ALLOWED - Standard testing practice
const httpMock = TestBed.inject(HttpTestingController);
const mockUser = { id: "1", name: "Test" };
```

### 3. Integration Tests

```typescript
// ✅ ALLOWED - Test fixtures
const mockService = {
  getData: () => of(testFixtureData),
};
```

---

## ❌ Prohibited Uses

### 1. Production Fallbacks

```typescript
// ❌ PROHIBITED - Never use mock data as fallback
loadACWR() {
  this.api.getACWR().subscribe({
    next: (data) => this.acwr.set(data),
    error: () => this.acwr.set(0.95) // NEVER do this!
  });
}

// ✅ CORRECT - Show "No Data" instead
loadACWR() {
  this.api.getACWR().subscribe({
    next: (data) => {
      this.acwr.set(data);
      this.dataSourceService.updateMetricSource('acwr', { source: 'real' });
    },
    error: () => {
      this.acwr.set(null); // Show "no data" state
      this.dataSourceService.updateMetricSource('acwr', { source: 'unknown' });
    }
  });
}
```

### 2. User-Facing Demo Data

```typescript
// ❌ PROHIBITED - User doesn't know data is fake
<div class="acwr-card">
  <span>{{ acwr }}</span>
</div>

// ✅ CORRECT - Always indicate data source
<div class="acwr-card">
  <span>{{ acwr }}</span>
  @if (!isRealData()) {
    <span class="demo-badge">DEMO</span>
  }
</div>
```

### 3. Default Values for Calculations

```typescript
// ❌ PROHIBITED - Never use mock values as defaults
calculateACWR(sessions: TrainingSession[]) {
  if (sessions.length < 7) {
    return 1.0; // DANGEROUS default!
  }
}

// ✅ CORRECT - Return null if insufficient data
calculateACWR(sessions: TrainingSession[]): number | null {
  if (sessions.length < 28) { // 4 weeks minimum
    return null; // UI shows "insufficient data"
  }
  // ... calculation
}
```

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

### Pattern 2: Insufficient Data Warning

```html
@if (!hasEnoughData() && !isFirstTimeUser()) {
  <div class="insufficient-data-warning">
    <i class="pi pi-info-circle"></i>
    <span>
      {{ remainingEntries }} more entries needed for reliable {{ metricName }}
      calculations
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

### Pattern 4: Using DataSourceService

```typescript
import { DataSourceService, DATA_REQUIREMENTS } from './data-source.service';

@Component({...})
export class MyDashboard {
  private dataSourceService = inject(DataSourceService);

  isRealData = this.dataSourceService.isRealData;
  isFirstTimeUser = this.dataSourceService.isFirstTimeUser;
  hasEnoughData = this.dataSourceService.hasEnoughData;

  ngOnInit() {
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

---

## 📊 When Can Athletes Start Using the App?

| Timeline | Available Features | Restrictions |
|----------|-------------------|--------------|
| **Day 1** | Log training, wellness, measurements, view history | ❌ ACWR, ❌ Trends |
| **Week 1** | Weekly load totals, basic wellness patterns | ⚠️ Preliminary readiness (with warning) |
| **Week 4+** | All features: ACWR, trends, personalized recommendations, injury risk | ✅ Full functionality |

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

## 🔍 Code Review Requirements

### Code Review Checklist

Before merging any PR:

- [ ] No mock data used as fallback values
- [ ] No mock data in production code paths
- [ ] Mock data only in test files or clearly marked development-only code
- [ ] All user-facing features show "No Data" states instead of mock data
- [ ] Environment checks prevent mock data in production builds

---

## 🆘 Violations

If you find mock data being used in production:

1. **Immediate Action**: Remove mock data from production code
2. **Review**: Check this policy
3. **Fix**: Implement proper "No Data" states
4. **Test**: Verify production build has no mock data

---

## 📚 Related Documentation

- [ERROR_HANDLING_GUIDE.md](./ERROR_HANDLING_GUIDE.md) - Error handling patterns
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Testing with mock data (development only)
- [AUTHENTICATION_PATTERN.md](./AUTHENTICATION_PATTERN.md) - Auth patterns

---

**Remember: An athlete's health is more important than a polished UI. When in doubt, show "No Data" rather than fake data.**
