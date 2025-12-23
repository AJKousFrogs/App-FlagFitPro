# Chatbot Deep Personalization Implementation Summary

## ✅ Implementation Complete

The chatbot now provides deeply personalized responses based on:

- **Body Metrics**: Height, weight, age (for nutrition calculations)
- **Injury History**: Active and recent injuries (for safety warnings)
- **Training Schedule**: Frequency, duration, intensity (for protocol recommendations)
- **Position**: QB, WR, RB, DB, LB (for position-specific advice)
- **Experience Level**: Beginner, intermediate, advanced (for complexity adjustment)

---

## What Was Implemented

### 1. Personalization Service (`src/js/services/personalization-service.js`)

**Features:**

- Fetches comprehensive user profile data
- Enriches parsed questions with profile context
- Generates personalized recommendations
- Caches profile data (5-minute TTL)

**Personalization Methods:**

- `enrichQuestion()` - Adds body metrics, injuries, training schedule to parsed question
- `generatePersonalizedRecommendations()` - Adds personalized advice to responses
- `getInjuryAwareAdvice()` - Injury-specific warnings and modifications
- `getScheduleAwareAdvice()` - Training frequency and intensity considerations
- `getBodyMetricsAdvice()` - Personalized nutrition calculations

### 2. User Profile API (`netlify/functions/user-profile.cjs`)

**Returns:**

- Basic info: height, weight, position, birth_date, experience_level
- Injuries: Active, recovering, monitoring, and recent recovered injuries
- Training statistics: Frequency (sessions/week), typical duration, average intensity
- Recent sessions: Last 7 days of training sessions

**Data Sources:**

- `users` table - Body metrics and position
- `injuries` table - Injury history
- `training_sessions` table - Training frequency and statistics

### 3. Chatbot Integration

**Enhancements:**

- Questions are enriched with profile data before processing
- Responses include personalized recommendations
- Injury-aware warnings for users with active injuries
- Training schedule-aware advice based on frequency/intensity
- Body metrics used for personalized nutrition calculations

---

## How It Works

### Flow Diagram

```
User Asks Question
    ↓
Parse Question (intent, entities)
    ↓
Enrich with Profile Data
    ├─→ Add body metrics (height, weight, age)
    ├─→ Add injury history
    ├─→ Add training schedule
    ├─→ Add position
    └─→ Add experience level
    ↓
Generate Base Response
    ↓
Apply Role-Aware Adjustments
    ↓
Apply Personalized Recommendations
    ├─→ Injury-aware warnings
    ├─→ Schedule-aware advice
    ├─→ Body metrics calculations
    └─→ Position-specific tips
    ↓
Return Fully Personalized Response
```

### Example Responses

**User with active ankle injury asking about training:**

```
[Base response about training protocol]

⚠️ Injury Considerations:
Based on your current injuries (ankle sprain), please consider:

• Be cautious with exercises that stress these areas
• Modify protocols to avoid aggravating current injuries
• Focus on recovery and rehabilitation exercises
• Consider consulting a healthcare provider before starting new training

Ankle-Specific:
• Avoid high-impact activities until cleared
• Focus on balance and proprioception exercises
• Use ankle support if recommended by healthcare provider

Important: Always prioritize recovery and follow your healthcare provider's recommendations.
```

**User with low training frequency (2 sessions/week) asking about protocol:**

```
[Base response about training protocol]

📅 Schedule Note:
With your current training frequency (2 sessions/week), focus on:

• Quality over quantity - make each session count
• Ensure adequate recovery between sessions
• Consider adding 1-2 more sessions per week if your schedule allows
• Focus on consistency rather than intensity
```

**User weighing 89kg asking about protein:**

```
[Base response about protein]

📊 Personalized Protein Recommendation:
Based on your weight (89kg), aim for **142g of protein per day**.
• Spread across 4-5 meals: ~36g per meal
• Post-workout: 20-30g within 30 minutes
• Pre-sleep: 20-30g casein protein
```

**User with high-intensity training (avg intensity 8+) asking about recovery:**

```
[Base response about recovery]

🔥 High Intensity Training:
With high-intensity sessions, ensure:

• 48-72 hours recovery between intense sessions
• Active recovery on off days
• Proper nutrition and hydration
• Quality sleep (7-9 hours)
```

---

## Personalization Features

### 1. Injury-Aware Recommendations

**Triggers:**

- User has active, recovering, or monitoring injuries
- Question relates to training, recovery, or protocols

**Provides:**

- Warnings about exercises that could aggravate injuries
- Injury-specific modifications (ankle, hamstring, shoulder, knee)
- Recovery-focused advice
- Healthcare provider consultation reminders

### 2. Training Schedule-Aware Advice

**Low Frequency (< 3 sessions/week):**

- Quality over quantity emphasis
- Recovery considerations
- Suggestions to increase frequency if possible

**High Frequency (≥ 5 sessions/week):**

- Recovery strategy emphasis
- Overtraining prevention
- Periodization recommendations

**High Intensity (avg ≥ 8):**

- Extended recovery periods
- Active recovery suggestions
- Sleep and nutrition emphasis

**Short Sessions (< 30 min):**

- Efficiency tips
- Warm-up/cool-down importance
- Volume considerations

### 3. Body Metrics Personalization

**Protein Calculations:**

- Based on weight: 1.6g/kg for athletes
- Personalized daily target
- Meal distribution recommendations

**Iron Calculations:**

- Based on height/weight
- Athlete-specific multipliers
- Absorption tips

**Age Considerations:**

- Recovery time adjustments
- Training volume recommendations

### 4. Position-Specific Advice

**QB:**

- Throwing mechanics focus
- Core stability emphasis
- Shoulder/elbow recovery priority

**WR:**

- Speed and agility focus
- Hamstring/hip flexor recovery
- Route-running precision

**RB:**

- Power and balance emphasis
- Lower body recovery priority
- Contact preparation

**DB:**

- Backpedal technique focus
- Hip mobility emphasis
- Reaction training

**LB:**

- Strength and power focus
- Full-body recovery
- Tackling form emphasis

---

## Database Queries

### User Profile Query

```sql
-- Gets comprehensive user profile
SELECT
  u.height_cm, u.weight_kg, u.position, u.birth_date, u.experience_level,
  -- Injuries
  i.type, i.severity, i.status, i.start_date, i.recovery_date,
  -- Training stats
  COUNT(ts.id) as session_count,
  AVG(ts.duration_minutes) as avg_duration,
  AVG(ts.intensity_level) as avg_intensity
FROM users u
LEFT JOIN injuries i ON i.user_id = u.id::text
LEFT JOIN training_sessions ts ON ts.user_id = u.id
WHERE u.id = $1
```

---

## Testing Checklist

### Personalization Testing

- [ ] Body metrics (height/weight) used in nutrition calculations
- [ ] Age calculated correctly from birth_date
- [ ] Position-specific advice appears for QB, WR, RB, DB, LB
- [ ] Active injuries trigger warnings
- [ ] Training frequency affects protocol recommendations
- [ ] High-intensity training triggers recovery advice
- [ ] Missing profile data gracefully handled

### Injury-Aware Testing

- [ ] Active injuries show warnings
- [ ] Recovering injuries show modifications
- [ ] Injury-specific advice (ankle, hamstring, shoulder, knee)
- [ ] Questions about injured areas get extra warnings
- [ ] No warnings if no active injuries

### Schedule-Aware Testing

- [ ] Low frequency (< 3/week) shows quality emphasis
- [ ] High frequency (≥ 5/week) shows recovery emphasis
- [ ] High intensity (≥ 8) shows extended recovery
- [ ] Short sessions (< 30 min) show efficiency tips

### Body Metrics Testing

- [ ] Protein calculated correctly from weight
- [ ] Iron calculated correctly from height/weight
- [ ] Age calculated correctly from birth_date
- [ ] Missing metrics handled gracefully

---

## Configuration

### Caching

Profile data is cached for 5 minutes to reduce API calls:

- Cache key: Based on userId
- Cache timeout: 5 minutes (300,000ms)
- Cache invalidation: On profile update or manual clear

### API Endpoints

**`/.netlify/functions/user-profile`**

- Method: GET
- Auth: Required (Bearer token)
- Parameters: `userId` (optional, defaults to authenticated user)
- Returns: Comprehensive user profile

---

## Performance Considerations

1. **Caching**: Profile data cached for 5 minutes
2. **Lazy Loading**: Profile only loaded when needed
3. **Non-Blocking**: Personalization doesn't block response generation
4. **Graceful Degradation**: Works without profile data (uses defaults)

---

## Future Enhancements

Potential improvements:

1. **Real-time Updates**: Clear cache when profile updated
2. **Historical Trends**: Use training trends for recommendations
3. **Injury Recovery Tracking**: Progress-based advice
4. **Performance Metrics**: Use performance data for recommendations
5. **Goal-Based**: Tailor advice to user's training goals
6. **Team Context**: Consider team training schedule

---

## Files Created/Modified

### New Files

- `src/js/services/personalization-service.js`
- `netlify/functions/user-profile.cjs`

### Modified Files

- `src/js/components/chatbot.js` - Added personalization integration

---

## Support

If you encounter issues:

1. Check browser console for errors
2. Verify user-profile API endpoint is accessible
3. Ensure user has valid auth token
4. Check database schema matches (injuries table uses VARCHAR for user_id)
5. Verify profile data exists in database

---

**Status**: ✅ Ready for Testing
**Last Updated**: 2025-01-XX
