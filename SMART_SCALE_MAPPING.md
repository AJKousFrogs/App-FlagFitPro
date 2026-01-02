# Smart Scale Data Mapping Guide
**Reference:** User's Xiaomi Mi Body Composition Scale Screenshot

---

## 📸 Scale Screenshot Analysis

### **Main Metrics Displayed:**

```
┌─────────────────────────────────────┐
│         Weight Report               │
├─────────────────────────────────────┤
│                                     │
│   [Body Diagram]     52.5 kg        │
│                      Body water mass│
│                                     │
│                      22.7 kg        │
│                      Fat mass       │
│                                     │
│                      3.9 kg         │
│                      Bone mineral   │
│                                     │
│                      13.2 kg        │
│                      Protein mass   │
└─────────────────────────────────────┘

┌──────────────┬──────────────┐
│ 66.5 kg ↑1.9 │ 71.4 % ↓1.6  │
│ Muscle mass  │ Muscle %     │
│ Standard     │ Standard     │
├──────────────┼──────────────┤
│ 56.4 % ↓0.4  │ 14.2 % ↓1.1  │
│ Body water   │ Protein %    │
│ Good         │ Standard     │
├──────────────┼──────────────┤
│ 4.2 % ↓0.1   │ 38.5 kg ↑1.7 │
│ Bone mineral%│ Skeletal mus │
│ Standard     │ Standard     │
├──────────────┼──────────────┤
│ 10           │ 1891 kcal ↑44│
│ Visceral fat │ Basal metab  │
│ Very high    │ Over         │
├──────────────┼──────────────┤
│ 1.1 ↓0.2     │ 35 years ↑1  │
│ Waist-to-hip │ Body age     │
│ Over         │              │
└──────────────┴──────────────┘
│ 70.4 kg ↑2   │
│ Total weight │
└──────────────┘
```

---

## 🔗 Field Mapping

### **Component Form Fields → Database Columns**

| **Form Label** | **Component Property** | **Database Column** | **Scale Value** |
|----------------|------------------------|---------------------|-----------------|
| **Total Weight (kg)** | `totalWeight` | `weight` | **70.4 kg** |
| **Body Water Mass (kg)** | `bodyWaterMass` | `body_water_mass` | **52.5 kg** |
| **Fat Mass (kg)** | `fatMass` | `fat_mass` | **22.7 kg** |
| **Bone Mineral Content (kg)** | `boneMineralContent` | `bone_mineral_content` | **3.9 kg** |
| **Protein Mass (kg)** | `proteinMass` | `protein_mass` | **13.2 kg** |
| **Muscle Mass (kg)** | `muscleMass` | `muscle_mass` | **66.5 kg** |
| **Skeletal Muscle Mass (kg)** | `skeletalMuscleMass` | `skeletal_muscle_mass` | **38.5 kg** |
| **Muscle %** | `musclePercentage` | `muscle_percentage` | **71.4%** |
| **Body Water %** | `bodyWaterPercentage` | `body_water_percentage` | **56.4%** |
| **Protein %** | `proteinPercentage` | `protein_percentage` | **14.2%** |
| **Bone Mineral %** | `boneMineralPercentage` | `bone_mineral_percentage` | **4.2%** |
| **Visceral Fat Rating** | `visceralFatRating` | `visceral_fat_rating` | **10** |
| **Basal Metabolic Rate (kcal)** | `basalMetabolicRate` | `basal_metabolic_rate` | **1891** |
| **Waist-to-Hip Ratio** | `waistToHipRatio` | `waist_to_hip_ratio` | **1.1** |
| **Body Age (years)** | `bodyAge` | `body_age` | **35** |

---

## 📊 Data Type Specifications

### Mass Values (in kilograms):
```typescript
weight: DECIMAL(5,2)              // 40.00 - 200.00 kg
body_water_mass: DECIMAL(5,2)    // 0.00 - 100.00 kg
fat_mass: DECIMAL(5,2)            // 0.00 - 100.00 kg
protein_mass: DECIMAL(5,2)        // 0.00 - 50.00 kg
bone_mineral_content: DECIMAL(5,2) // 0.00 - 10.00 kg
muscle_mass: DECIMAL(5,2)         // 0.00 - 100.00 kg
skeletal_muscle_mass: DECIMAL(5,2) // 0.00 - 100.00 kg
```

### Percentage Values:
```typescript
muscle_percentage: DECIMAL(4,2)         // 0.00 - 100.00%
body_water_percentage: DECIMAL(4,2)     // 0.00 - 100.00%
protein_percentage: DECIMAL(4,2)        // 0.00 - 100.00%
bone_mineral_percentage: DECIMAL(4,2)   // 0.00 - 100.00%
```

### Special Metrics:
```typescript
visceral_fat_rating: INTEGER      // 1-59 (1-12 = standard, 13-59 = high)
basal_metabolic_rate: INTEGER     // 800-5000 kcal/day
waist_to_hip_ratio: DECIMAL(4,2)  // 0.50 - 2.00
body_age: INTEGER                 // 10-100 years
```

---

## 🎯 Health Benchmarks

### Visceral Fat Rating:
- **1-12:** Standard (Healthy)
- **13-59:** High (Health risk)
- **Scale shows:** 10 (Standard, but close to threshold)

### Body Water Percentage:
- **Men:** 50-65% (Optimal)
- **Women:** 45-60% (Optimal)
- **Scale shows:** 56.4% (Good)

### Muscle Percentage:
- **Men:** 40-50% (Average), 50-60% (Good), 60%+ (Excellent)
- **Women:** 30-40% (Average), 40-50% (Good), 50%+ (Excellent)
- **Scale shows:** 71.4% (Excellent athlete level)

### Basal Metabolic Rate:
- **Average male (35 years, 70kg):** ~1,600-1,800 kcal/day
- **Scale shows:** 1,891 kcal (Above average - indicates high muscle mass)

---

## 🔄 Change Tracking

The scale shows **trend arrows** (↑/↓) with change values:

| Metric | Current | Change | Trend |
|--------|---------|--------|-------|
| Total Weight | 70.4 kg | +2.0 kg | ↑ |
| Muscle Mass | 66.5 kg | +1.9 kg | ↑ |
| Muscle % | 71.4% | -1.6% | ↓ |
| Body Water % | 56.4% | -0.4% | ↓ |
| Protein % | 14.2% | -1.1% | ↓ |
| Bone Mineral % | 4.2% | -0.1% | ↓ |
| Skeletal Muscle | 38.5 kg | +1.7 kg | ↑ |
| BMR | 1891 kcal | +44 kcal | ↑ |
| Waist-Hip Ratio | 1.1 | -0.2 | ↓ |
| Body Age | 35 years | +1 year | ↑ |

### Analysis:
- **Weight gain:** +2.0 kg (likely muscle + water retention)
- **Muscle mass gain:** +1.9 kg (good for athletes)
- **Percentages declining:** Because total weight increased
- **BMR increasing:** More muscle = higher metabolism

---

## 💡 Future Enhancements

### Auto-Calculate Relationships:
```typescript
// Validate that components add up to total weight
total_weight ≈ body_water_mass + fat_mass + protein_mass + bone_mineral_content

// Calculate lean body mass
lean_body_mass = total_weight - fat_mass

// Calculate body fat percentage
body_fat_percentage = (fat_mass / total_weight) × 100
```

### Smart Insights:
```typescript
if (visceral_fat_rating > 12) {
  insight = "⚠️ High visceral fat detected. Consider cardio training.";
}

if (body_water_percentage < 50) {
  insight = "💧 Hydration may be low. Drink more water.";
}

if (muscle_percentage > 65) {
  insight = "💪 Excellent muscle mass for an athlete!";
}
```

### Trend Analysis:
```typescript
// Compare this week vs last week
if (muscle_mass_change > 0.5) {
  trend = "📈 Muscle mass is increasing! Keep up the training.";
}

if (weight_change > 2.0 && fat_mass_change < 0.5) {
  trend = "🎯 Weight gain is mostly muscle. Excellent bulk!";
}
```

---

## 🛠️ Integration with Smart Scales

### Supported Devices:
- **Xiaomi Mi Body Composition Scale** ✅ (user's current scale)
- Withings Body+
- Fitbit Aria
- Garmin Index S2
- Eufy Smart Scale P2

### API Integration (Future):
```typescript
// Example: Xiaomi Mi Fit API
async function importFromXiaomi() {
  const data = await XiaomiAPI.getLatestMeasurement();
  
  return {
    totalWeight: data.weight,
    bodyWaterMass: data.water,
    fatMass: data.fat,
    muscleMass: data.muscle,
    // ... all other fields
    timestamp: data.measured_at
  };
}
```

---

## 📋 User Workflow

### Current Manual Entry:
1. Step on scale
2. Wait for measurement (30 seconds)
3. Read values from scale app
4. Open FlagFit dashboard
5. Click "Log Daily Metrics"
6. Manually enter all values
7. Click save

**Time:** ~3 minutes  
**Error rate:** Medium (transcription errors)

### Future Auto-Import:
1. Step on scale
2. Measurement syncs to cloud
3. Open FlagFit dashboard
4. Click "Import from Scale"
5. Review and confirm values
6. Click save

**Time:** ~30 seconds  
**Error rate:** Very low

---

## ✅ Validation Rules

### Required Fields:
- ✅ `totalWeight` (minimum for any entry)
- ✅ `sleepScore` (minimum for any entry)

### Optional but Recommended:
- `muscleMass` (for ACWR calculations)
- `fatMass` (for body composition trends)
- `bodyWaterPercentage` (for hydration tracking)

### Smart Validation:
```typescript
// Weight should match sum of components (within 2%)
if (totalWeight > 0 && hasAllComponents) {
  const sum = bodyWaterMass + fatMass + proteinMass + boneMineralContent;
  const difference = Math.abs(totalWeight - sum);
  const percentDiff = (difference / totalWeight) * 100;
  
  if (percentDiff > 2) {
    warning = "Components don't add up to total weight. Check values.";
  }
}

// Muscle percentage should be reasonable
if (musclePercentage > 80) {
  warning = "Muscle % seems too high. Typical max is 75%.";
}

// Visceral fat rating range check
if (visceralFatRating < 1 || visceralFatRating > 59) {
  error = "Visceral fat rating must be between 1 and 59.";
}
```

---

## 📈 Expected Data Growth

### Per Athlete:
- **Daily entries:** 365/year
- **Metrics per entry:** 15 fields
- **Storage per entry:** ~500 bytes
- **Annual storage:** ~180 KB/athlete

### For 1,000 Athletes:
- **Annual entries:** 365,000
- **Annual storage:** ~180 MB
- **Database rows:** 365,000 in `physical_measurements`

---

**End of Guide**
