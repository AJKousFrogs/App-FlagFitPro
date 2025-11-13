# Load Management Quick Start Guide
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

## Step-by-Step Usage

### 1. After Each Training Session

Ask the athlete: **"On a scale of 0-10, how hard was that session?"**

Record:
- RPE: 7
- Duration: 60 minutes
- Date: 2024-01-15

### 2. Calculate Training Load

```javascript
import { LoadManagementService } from './services/LoadManagementService.js';

const loadService = new LoadManagementService();

const trainingLoad = loadService.calculateTrainingLoad(7, 60);
// Result: 420
```

### 3. Save to Database

```javascript
const sessionData = {
  sessionRPE: 7,
  durationMinutes: 60,
  sessionDate: '2024-01-15',
  sessionType: 'practice'
};

const loadEntry = loadService.createLoadEntryFromRPE(sessionData);

// Save to database
await saveToDatabase('training_load_metrics', loadEntry);
```

### 4. Calculate ACWR (After 7+ Days of Data)

```javascript
const acwrData = await loadService.calculateACWR(userId);

console.log('ACWR:', acwrData.acwr);
console.log('Risk Zone:', acwrData.riskZone);
console.log('Recommendation:', acwrData.recommendation);
```

**Example Output**:
```
ACWR: 1.35
Risk Zone: caution
Recommendation: ACWR elevated (1.3-1.5). Monitor closely and consider reducing load by 10-20%.
```

---

## RPE Scale Reference

Use this Modified Borg CR-10 Scale:

| RPE | Description | Example |
|-----|-------------|---------|
| 0 | Rest | No activity |
| 1 | Very Easy | Walking slowly |
| 2 | Easy | Light warm-up |
| 3 | Moderate | Easy jogging |
| 4 | Somewhat Hard | Moderate pace running |
| 5 | Hard | Hard running, breathing heavy |
| 6 | Very Hard | Very hard effort, can't talk |
| 7 | Extremely Hard | Max effort, very difficult |
| 8 | Maximal | Maximum sustainable effort |
| 9 | Near Maximal | Almost maximum |
| 10 | Maximum | Absolute maximum effort |

**Tip**: Collect RPE **15-30 minutes after** the session ends for best accuracy.

---

## Optional Enhancements

### Add Subjective Metrics

If you track recovery metrics, add them:

```javascript
const enhancedData = {
  sessionRPE: 7,
  durationMinutes: 60,
  sessionDate: '2024-01-15',
  sessionType: 'practice',
  
  // Optional subjective metrics
  perceivedRecovery: 6,        // How recovered? (0-10)
  muscleSoreness: 4,          // How sore? (0-10)
  sleepQuality: 7,             // Sleep quality (0-10)
  stressLevel: 3,              // Stress level (0-10)
  moodRating: 8                // Mood (0-10)
};
```

### Manual Flag Football Metrics

Count manually if you want:

```javascript
const flagFootballData = {
  ...enhancedData,
  
  // Manual counts (optional)
  routesRun: 25,               // Number of routes run
  cuttingMovements: 15,        // Number of hard cuts
  sprintRepetitions: 12       // Number of sprint efforts
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
const weekStart = getWeekStart(new Date());
const monotonyData = await loadService.calculateTrainingMonotony(userId, weekStart);

if (monotonyData.monotony > 2.0) {
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

## Example: Complete Workflow

```javascript
// 1. After training session
const session = {
  sessionRPE: 7,
  durationMinutes: 60,
  sessionDate: '2024-01-15',
  sessionType: 'practice',
  perceivedRecovery: 6,
  sleepQuality: 7
};

// 2. Calculate and save
const loadEntry = loadService.createLoadEntryFromRPE(session);
await saveToDatabase('training_load_metrics', loadEntry);

// 3. Check ACWR (after 7+ days)
const acwr = await loadService.calculateACWR(userId);
console.log(`ACWR: ${acwr.acwr} (${acwr.riskZone})`);

// 4. Check injury risk
const risk = await loadService.calculateInjuryRisk(userId);
if (risk.riskLevel === 'high') {
  console.log('⚠️ High injury risk detected');
  console.log('Top factors:', risk.topFactors);
  console.log('Recommendations:', risk.recommendations);
}
```

---

## Benefits of RPE-Only Approach

✅ **No equipment costs** - completely free  
✅ **Easy to implement** - just ask athletes  
✅ **Highly accurate** - 98% correlation with GPS  
✅ **Works immediately** - no setup time  
✅ **Scalable** - works for any number of athletes  
✅ **Research-backed** - validated by Foster et al. (2001)

---

## Next Steps

1. Start collecting Session RPE after each training session
2. Calculate Training Load = RPE × Duration
3. Save to `training_load_metrics` table
4. After 7 days, start calculating ACWR
5. Monitor weekly monotony
6. Use injury risk predictions to guide training

**Remember**: GPS is nice-to-have, but Session RPE is all you need!

