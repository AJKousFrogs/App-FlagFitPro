# Load Management Quick Start Guide

**Version**: 2.0  
**Last Updated**: 29. December 2025  
**Last Verified Against Codebase**: 2025-12-28

## No GPS Required - Session RPE Only

This guide shows you how to use the load management system with **just Session RPE** - no GPS or wearable devices needed!

---

## What You Need

**Minimum Required Data**:

- **Session RPE** (0-10 scale): How hard was the session?
- **Duration** (minutes): How long was the session?

That's it! Everything else is optional.

---

## How It Works

### The Formula

```
Training Load = Session RPE × Duration
```

**Example**:

- Session RPE: 7 (moderately hard)
- Duration: 60 minutes
- **Training Load: 420** (7 × 60)

This single number drives all calculations:

- ACWR (Acute:Chronic Workload Ratio)
- Training Monotony
- Training Stress Balance (TSB)
- Injury Risk Prediction

---

## API Endpoints

The load management system is accessed via these API endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/load-management` | GET | Overview (ACWR, monotony, TSB) |
| `/api/load-management/acwr` | GET | ACWR calculation |
| `/api/load-management/monotony` | GET | Training monotony |
| `/api/load-management/tsb` | GET | Training stress balance |
| `/api/load-management/injury-risk` | GET | Composite injury risk |
| `/api/load-management/training-loads` | GET | Training load history |

---

## Step-by-Step Usage

### 1. After Each Training Session

Ask the athlete: **"On a scale of 0-10, how hard was that session?"**

Record:

- RPE: 7
- Duration: 60 minutes
- Date: 2024-01-15

### 2. Log Training Session via API

```javascript
// POST /api/training/sessions
const response = await fetch('/api/training/sessions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    session_date: '2024-01-15',
    rpe: 7,
    duration_minutes: 60,
    session_type: 'practice',
    status: 'completed'
  })
});
```

### 3. Calculate ACWR (After 7+ Days of Data)

```javascript
// GET /api/load-management/acwr
const response = await fetch('/api/load-management/acwr', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const data = await response.json();
console.log('ACWR:', data.data.acwr);
console.log('Risk Zone:', data.data.riskZone);
console.log('Recommendation:', data.data.recommendation);
```

**Example Response**:

```json
{
  "success": true,
  "data": {
    "acwr": 1.15,
    "riskZone": "safe",
    "injuryRiskMultiplier": 1.0,
    "acuteAverage": 450.5,
    "chronicAverage": 391.7,
    "acuteLoads": 7,
    "chronicLoads": 28,
    "recommendation": "Training load is in the optimal 'sweet spot'. Maintain current progression.",
    "calculatedFor": "2024-01-15"
  }
}
```

### 4. Get Composite Injury Risk

```javascript
// GET /api/load-management/injury-risk
const response = await fetch('/api/load-management/injury-risk', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const data = await response.json();
console.log('Risk Level:', data.data.riskLevel);
console.log('Overall Risk:', data.data.overallRisk);
```

**Example Response**:

```json
{
  "success": true,
  "data": {
    "overallRisk": 0.234,
    "riskLevel": "moderate",
    "recommendation": "Moderate risk. Monitor fatigue and recovery closely.",
    "individualRisks": {
      "acwr": 0.15,
      "monotony": 0.25,
      "tsb": 0.30
    },
    "weights": {
      "acwr": 0.45,
      "monotony": 0.25,
      "tsb": 0.30
    }
  }
}
```

---

## Angular Service Usage

If using the Angular frontend:

```typescript
import { ApiService, API_ENDPOINTS } from '@core/services/api.service';

@Injectable({ providedIn: 'root' })
export class LoadManagementComponent {
  private api = inject(ApiService);
  
  acwrData = signal<ACWRData | null>(null);
  
  async loadACWR() {
    const response = await firstValueFrom(
      this.api.get<ACWRData>('/api/load-management/acwr')
    );
    this.acwrData.set(response.data);
  }
}
```

---

## RPE Scale Reference

Use this Modified Borg CR-10 Scale:

| RPE | Description    | Example                       |
| --- | -------------- | ----------------------------- |
| 0   | Rest           | No activity                   |
| 1   | Very Easy      | Walking slowly                |
| 2   | Easy           | Light warm-up                 |
| 3   | Moderate       | Easy jogging                  |
| 4   | Somewhat Hard  | Moderate pace running         |
| 5   | Hard           | Hard running, breathing heavy |
| 6   | Very Hard      | Very hard effort, can't talk  |
| 7   | Extremely Hard | Max effort, very difficult    |
| 8   | Maximal        | Maximum sustainable effort    |
| 9   | Near Maximal   | Almost maximum                |
| 10  | Maximum        | Absolute maximum effort       |

**Tip**: Collect RPE **15-30 minutes after** the session ends for best accuracy.

---

## Risk Zones (Gabbett 2016)

| ACWR Range | Risk Zone | Injury Risk Multiplier | AI Behavior |
|------------|-----------|------------------------|-------------|
| < 0.80 | Detraining | 1.2x | Can recommend more training |
| 0.80 - 1.30 | Safe (Sweet Spot) | 1.0x | All recommendations allowed |
| 1.30 - 1.50 | Caution | 1.5x | Allowed with monitoring advice |
| > 1.50 | Danger | 2.0x | **BLOCKS high-intensity** |
| > 1.80 | Critical | 4.2x | **Recommends rest only** |

---

## Optional Enhancements

### Add Subjective Metrics

If you track recovery metrics, add them:

```javascript
const sessionData = {
  session_date: '2024-01-15',
  rpe: 7,
  duration_minutes: 60,
  session_type: 'practice',
  status: 'completed',
  
  // Optional subjective metrics (via wellness check-in)
  perceived_recovery: 6,
  muscle_soreness: 4,
  sleep_quality: 7,
  stress_level: 3,
  mood_rating: 8
};
```

### Manual Flag Football Metrics

Count manually if you want:

```javascript
const flagFootballData = {
  ...sessionData,
  
  // Manual counts (optional)
  routes_run: 25,
  cutting_movements: 15,
  sprint_repetitions: 12
};
```

---

## Weekly Workflow

### Monday - Sunday: Collect RPE After Each Session

```
Monday:   RPE 6, Duration 45 → Load: 270
Tuesday:  RPE 8, Duration 60 → Load: 480
Wednesday: REST
Thursday: RPE 7, Duration 50 → Load: 350
Friday:   RPE 5, Duration 30 → Load: 150
Saturday: RPE 9, Duration 90 → Load: 810 (game)
Sunday:   REST
```

### End of Week: Check Monotony

```javascript
// GET /api/load-management/monotony?weekStart=2024-01-08
const response = await fetch('/api/load-management/monotony?weekStart=2024-01-08', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const data = await response.json();
if (data.data.monotony > 2.0) {
  console.log('⚠️ High monotony - add variety next week');
}
```

---

## Common Questions

### Q: Do I need GPS?

**A**: No! Session RPE is the primary method. GPS is optional.

### Q: How accurate is RPE?

**A**: 98% correlation with objective GPS measures (Foster et al. 2001).

### Q: What if I miss a day?

**A**: That's fine - use 0 for rest days. The system handles missing data.

### Q: How many days do I need?

**A**:

- ACWR: Needs 7+ days (ideally 28+)
- Monotony: Needs 3+ training days in a week
- TSB: Needs 7+ days (ideally 60+)

### Q: Can I add GPS later?

**A**: Yes! All GPS fields are optional. Add them whenever available.

---

## Benefits of RPE-Only Approach

✅ **No equipment costs** - completely free  
✅ **Easy to implement** - just ask athletes  
✅ **Highly accurate** - 98% correlation with GPS  
✅ **Works immediately** - no setup time  
✅ **Scalable** - works for any number of athletes  
✅ **Research-backed** - validated by Foster et al. (2001)

---

## Related Documentation

- [API.md](./API.md) - Full API reference
- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - Database schema
- [FLAG_FOOTBALL_TRAINING_SCIENCE.md](./FLAG_FOOTBALL_TRAINING_SCIENCE.md) - Training science

---

## Next Steps

1. Start collecting Session RPE after each training session
2. Calculate Training Load = RPE × Duration
3. Log sessions via `/api/training/sessions`
4. After 7 days, start checking ACWR via `/api/load-management/acwr`
5. Monitor weekly monotony
6. Use injury risk predictions to guide training

**Remember**: GPS is nice-to-have, but Session RPE is all you need!
