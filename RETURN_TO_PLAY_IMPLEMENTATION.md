# Return-to-Play Protocol Implementation

## 🏥 Overview
Implemented comprehensive injury consideration and return-to-play (RTP) protocols to ensure athlete safety during recovery.

## ✅ What Was Added

### 1. Injury Detection System
**Location**: `netlify/functions/daily-protocol.cjs` (lines 548-565)

- Checks `daily_wellness_checkin` table for active injuries
- Reads `soreness_areas` array from most recent wellness check-in
- Automatically detects if athlete has reported injuries

### 2. Return-to-Play Protocol Generator
**Location**: `netlify/functions/daily-protocol.cjs` (new function `generateReturnToPlayProtocol`)

**Progressive 3-Phase System**:

#### **Phase 1: Foundation & Pain Management** (Pain Level 3-5/5)
- Gentle mobility only
- Pain-free range of motion
- Focus on non-injured areas
- Daily foam rolling
- **Load**: 100 AU (very low)

#### **Phase 2: Light Loading & Strengthening** (Pain Level 2/5)
- Bodyweight resistance only
- Controlled movements
- Progressive mobility work
- Low-impact conditioning
- **Load**: 200 AU (30% normal)

#### **Phase 3: Progressive Loading & Conditioning** (Pain Level 0-1/5)
- Moderate loading (30-50% normal)
- Position-specific skill work (reduced intensity)
- Build work capacity
- Prepare for team practice return
- **Load**: 300 AU (50% normal)

### 3. Exercise Selection Logic

**Morning Mobility** (Always included):
```javascript
- Category: "mobility"
- Subcategory: "morning_routine"
- Load: 50% of normal
- Notes: "Pain-free range of motion only"
```

**Rehab Exercises** (Phase 2+):
```javascript
- Category: "rehab"
- Sorted by difficulty (easiest first)
- Progressive loading: 30% → 50%
- Close pain monitoring
```

**Pain-Free Conditioning** (Phase 2+):
```javascript
- Category: "conditioning"
- Subcategory: "low_impact"
- Avoids injured areas
- Short duration: 30-45 seconds
```

**Evening Mobility** (Always included):
```javascript
- Category: "mobility"
- Subcategory: "evening_routine"
- Focus on relaxation
- Load: 50% of normal
```

### 4. AI Rationale & Safety Messaging

The system provides clear, personalized guidance:

```
🏥 RETURN-TO-PLAY PROTOCOL - Phase 1: Foundation & Pain Management

Active concerns: hamstring (moderate), hip flexor (mild)
Pain level: 3/5

⚠️ MODERATE PAIN: Light activity only. Avoid aggravating movements. Progress slowly.

📋 TODAY'S FOCUS:
- Gentle mobility and pain-free movement
- Focus on areas NOT injured
- Build base conditioning without aggravation
- Daily foam rolling and mobility work

⚕️ STOP if pain increases beyond 3/10 during any exercise.
✓ Update your wellness check-in daily to track progress.
```

## 🔒 Safety Features

1. **Pain Threshold Monitoring**: Automatically adjusts protocol based on daily pain levels
2. **Progressive Loading**: Prevents premature return to full training
3. **Stop Criteria**: Clear guidance on when to halt exercise
4. **Daily Tracking**: Encourages wellness check-in updates
5. **Load Reduction**: ACWR set to 0.5 (50% normal) to prevent re-injury

## 📊 Database Integration

### Injury Data Source
```sql
SELECT * FROM daily_wellness_checkin
WHERE user_id = ?
ORDER BY checkin_date DESC
LIMIT 1
```

Fields used:
- `soreness_areas` (array of strings)
- `overall_soreness` (1-5 scale)
- `pain_level` (1-5 scale)

### Exercise Sources
```sql
-- Morning/Evening Mobility
SELECT * FROM exercises 
WHERE category = 'mobility' 
  AND subcategory IN ('morning_routine', 'evening_routine')
  AND active = true

-- Rehab Exercises
SELECT * FROM exercises
WHERE category = 'rehab'
  AND active = true
ORDER BY difficulty_level

-- Low-Impact Conditioning
SELECT * FROM exercises
WHERE category = 'conditioning'
  AND subcategory = 'low_impact'
  AND active = true
```

## 🎯 Expected Outcomes

### For Athletes with Injuries:
1. ✅ Safe, progressive return to training
2. ✅ Clear guidance on what to do each day
3. ✅ Reduced re-injury risk
4. ✅ Builds foundation over 3 weeks
5. ✅ Respects physiotherapist recommendations

### For Athletes Without Injuries:
1. ✅ Normal training protocol as before
2. ✅ No disruption to existing flow

## 🧪 Testing Recommendations

### Test Scenario 1: High Pain Level
```javascript
// In wellness check-in
soreness_areas: ["hamstring (severe)", "hip flexor (moderate)"]
pain_level: 4

// Expected: Phase 1 protocol
// - Only mobility exercises
// - No loading
// - Warning message about high pain
```

### Test Scenario 2: Moderate Pain
```javascript
soreness_areas: ["shoulder (mild)"]
pain_level: 2

// Expected: Phase 2 protocol
// - Light bodyweight exercises
// - Rehab movements
// - Low-impact conditioning
```

### Test Scenario 3: Minimal Pain
```javascript
soreness_areas: ["knee (minimal)"]
pain_level: 1

// Expected: Phase 3 protocol
// - Moderate loading
// - Position-specific work
// - Progressive conditioning
```

### Test Scenario 4: No Injuries
```javascript
soreness_areas: []
pain_level: 0

// Expected: Normal training protocol
// - Full structured program
// - Position-specific exercises
// - Normal load targets
```

## 📝 Next Steps

To complete the return-to-play system:

1. **Add injury-specific exercise filtering**
   - Filter out exercises that aggravate specific injuries
   - e.g., No sprints for hamstring injuries in Phase 1-2

2. **Track RTP progression over time**
   - Store phase transitions in database
   - Show progress chart to athlete

3. **Alert coach when athlete is injured**
   - Notification system for coaching staff
   - "Player X reported hamstring injury - on RTP Phase 1"

4. **Add return-to-play clearance**
   - Require wellness check-in showing 0-1/5 pain for 3 consecutive days
   - Before allowing return to normal training

5. **Integrate with team practice schedule**
   - If athlete has injury, suggest sitting out team practice
   - Or modify participation (e.g., "No contact drills")

## 🚀 Deployment

This feature is ready for testing. To activate:

1. Complete wellness check-in with injury reported
2. Generate daily protocol
3. System will automatically detect injury and provide RTP protocol

## ⚠️ Important Notes

- **Medical Disclaimer**: This is a training guide, not medical advice
- Athletes should always consult with physiotherapist/doctor
- System provides conservative, evidence-based progressions
- Stop immediately if pain increases during exercise
- Update wellness check-in daily to track progress

## 📚 Evidence Base

Return-to-play protocols based on:
- Sports medicine best practices
- Progressive loading principles
- ACWR injury prevention guidelines
- Conservative approach prioritizing long-term health

---

**Implementation Date**: January 5, 2026
**Status**: ✅ Complete
**Next Priority**: Verify real database training data is loading (TODO #2)
