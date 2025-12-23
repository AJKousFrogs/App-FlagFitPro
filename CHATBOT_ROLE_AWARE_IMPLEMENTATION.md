# Chatbot Role-Aware Implementation Summary

## ✅ Implementation Complete

The chatbot is now role-aware and provides different responses based on:

- **User Role**: Player (athlete), Coach, or Admin
- **Team Type**: Domestic or International
- **User Position**: QB, WR, RB, DB, LB, etc.

---

## What Was Implemented

### 1. Database Schema (`039_chatbot_role_aware_system.sql`)

**New Tables:**

- `chatbot_user_context` - Stores user context for personalization
  - User role, team type, preferred topics, expertise level
  - Usage statistics (total queries, last query time)

**New Fields on `teams` table:**

- `team_type` - 'domestic' or 'international'
- `region` - Geographic region
- `country_code` - ISO country code

**Database Functions:**

- `get_or_create_chatbot_context(user_id)` - Auto-creates/updates context
- `update_chatbot_query_stats(user_id, topic)` - Tracks usage statistics

### 2. Role-Aware Response Generator (`src/js/utils/role-aware-response-generator.js`)

**Features:**

- Adjusts responses based on user role
- Adds team type considerations (international travel, jet lag)
- Provides position-specific advice
- Enhances responses with role-appropriate tips

**Role-Specific Enhancements:**

**Coaches get:**

- Stat entry and tracking guidance
- Schedule design and periodization tips
- Team management protocols
- Player development strategies

**Athletes get:**

- Self-training protocols
- Individual performance focus
- Personal tracking reminders
- Recovery strategies

**Admins get:**

- System-level information
- Evidence and governance details
- Usage statistics

**International Teams get:**

- Jet lag management strategies
- Travel recovery protocols
- Competition calendar considerations
- International supplement regulations

### 3. API Endpoints

**`/.netlify/functions/user-context`**

- GET endpoint to fetch user context
- Returns role, team type, position, preferences
- Auto-creates context if missing

**`/.netlify/functions/update-chatbot-stats`**

- POST endpoint to update query statistics
- Tracks preferred topics
- Updates usage counts

### 4. Chatbot Integration (`src/js/components/chatbot.js`)

**New Features:**

- Loads user context on chatbot open
- Initializes role-aware generator
- Applies role-specific adjustments to all responses
- Updates query statistics after each query
- Gracefully handles missing auth/context

---

## How It Works

### Flow Diagram

```
User Opens Chatbot
    ↓
Load User Context (role, team type, position)
    ↓
Initialize Role-Aware Generator
    ↓
User Asks Question
    ↓
Parse Question (intent, entities)
    ↓
Generate Base Response
    ↓
Apply Role-Aware Adjustments
    ├─→ Coach: Add stat tracking tips
    ├─→ Athlete: Add personal tracking reminders
    ├─→ Admin: Add system info
    └─→ International: Add travel considerations
    ↓
Add Position-Specific Advice (if applicable)
    ↓
Update Query Statistics
    ↓
Return Enhanced Response
```

### Example Responses

**Coach asking about training protocol:**

```
[Base response about training protocol]

💡 Coach Tip: Consider tracking these metrics in your training logs:
• Volume (sets × reps × load)
• RPE (Rate of Perceived Exertion) - 1-10 scale
• Recovery markers (sleep quality, HRV if available)
• Player feedback scores
• Completion rates and adherence
```

**Athlete asking about recovery:**

```
[Base response about recovery]

💪 Personal Recovery: Focus on what works best for your body.
Track your recovery quality and adjust protocols based on how you feel.

📱 Track This: Log your sessions in the FlagFit app to monitor progress over time.
```

**International team asking about recovery:**

```
[Base response about recovery]

🌍 International Consideration:
• When traveling across time zones, adjust recovery protocols
• Consider jet lag management strategies:
  - Gradually shift sleep schedule before travel
  - Use light therapy to reset circadian rhythm
  - Stay hydrated during flights
  - Allow 1 day per time zone crossed for full adaptation
• Plan recovery days after long flights
• Monitor sleep quality and adjust training intensity accordingly
```

**QB asking about training:**

```
[Base response about training]

🏈 QB-Specific: Include rotational power, accuracy drills, and footwork patterns in your training.
```

---

## Database Migration

To apply the database changes:

```bash
# Connect to your database
psql $DATABASE_URL

# Run the migration
\i database/migrations/039_chatbot_role_aware_system.sql
```

Or using a migration tool:

```bash
psql $DATABASE_URL -f database/migrations/039_chatbot_role_aware_system.sql
```

---

## Testing Checklist

### Role-Aware Testing

- [ ] Coach receives stat entry and schedule design content
- [ ] Athlete receives self-training protocols
- [ ] Admin receives system-level information
- [ ] International teams get travel/jet lag considerations
- [ ] Domestic teams get standard protocols

### Position-Specific Testing

- [ ] QB gets throwing mechanics and core stability advice
- [ ] WR gets speed and agility focus
- [ ] RB gets power and balance emphasis
- [ ] DB gets backpedal and reaction training
- [ ] LB gets strength and tackling focus

### Context Loading Testing

- [ ] Context loads on chatbot open
- [ ] Falls back gracefully if auth token missing
- [ ] Updates context if role/team changes
- [ ] Handles API errors gracefully

### Statistics Tracking

- [ ] Query statistics update after each query
- [ ] Preferred topics tracked correctly
- [ ] Total queries increment properly

---

## Configuration

### Environment Variables Required

The API endpoints require:

- `DATABASE_URL` - PostgreSQL connection string
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key

### Default Behavior

If user context cannot be loaded:

- Default role: `player`
- Default team type: `domestic`
- No position-specific advice
- Role-aware generator still works with defaults

---

## Future Enhancements

Potential improvements:

1. **Expertise Level Adjustments** - Tailor response complexity based on expertise level
2. **Preferred Topics** - Prioritize responses for frequently asked topics
3. **Team-Specific Protocols** - Custom protocols per team
4. **Multi-Team Support** - Handle users on multiple teams
5. **Context Caching** - Cache context to reduce API calls
6. **Analytics Dashboard** - View chatbot usage by role/team type

---

## Files Created/Modified

### New Files

- `database/migrations/039_chatbot_role_aware_system.sql`
- `src/js/utils/role-aware-response-generator.js`
- `netlify/functions/user-context.cjs`
- `netlify/functions/update-chatbot-stats.cjs`

### Modified Files

- `src/js/components/chatbot.js` - Added role-aware integration

---

## Support

If you encounter issues:

1. Check browser console for errors
2. Verify database migration ran successfully
3. Ensure environment variables are set
4. Check API endpoint logs in Netlify dashboard
5. Verify user has valid auth token

---

**Status**: ✅ Ready for Testing
**Last Updated**: 2025-01-XX
