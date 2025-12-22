# Database Integration Summary

## ✅ Successfully Applied Migrations

### Migration 039 - Chatbot Role-Aware System
**Status:** ✅ Applied to Supabase database

**Changes:**
- Added `team_type`, `region`, and `country_code` columns to `teams` table
- Created `chatbot_user_context` table for user personalization
- Created database functions:
  - `get_or_create_chatbot_context(user_id)` - Gets or creates user context
  - `update_chatbot_query_stats(user_id, topic)` - Updates usage statistics

**Application Code Status:**
- ✅ `netlify/functions/user-context.cjs` - Uses `get_or_create_chatbot_context()` function
- ✅ `netlify/functions/update-chatbot-stats.cjs` - Uses `update_chatbot_query_stats()` function
- ✅ `src/js/components/chatbot.js` - Calls update stats API after queries
- ✅ `src/js/utils/role-aware-response-generator.js` - Uses team type for responses
- ✅ `src/js/services/personalization-service.js` - Uses user context data

### Migration 040 - Knowledge Base Governance
**Status:** ⏸️ Skipped (knowledge_base_entries table doesn't exist yet)
- Will automatically apply when knowledge base table is created

---

## 📋 Database Schema Updates

### Teams Table
New columns available:
- `team_type` - VARCHAR(20) - 'domestic' or 'international' (default: 'domestic')
- `region` - VARCHAR(100) - Geographic region or country
- `country_code` - VARCHAR(3) - ISO 3166-1 alpha-3 country code (e.g., 'USA', 'CAN', 'GBR')

### Chatbot User Context Table
New table with columns:
- `user_id` - UUID (references users.id)
- `user_role` - VARCHAR(20) - 'player', 'coach', or 'admin'
- `primary_team_id` - UUID (references teams.id)
- `team_type` - VARCHAR(20) - Denormalized from teams table
- `preferred_topics` - TEXT[] - Topics user frequently asks about
- `expertise_level` - VARCHAR(20) - 'beginner', 'intermediate', 'advanced'
- `total_queries` - INTEGER - Total chatbot queries made
- `last_query_at` - TIMESTAMP - Last query timestamp
- `created_at`, `updated_at` - Timestamps

---

## 🔧 API Endpoints

### GET `/netlify/functions/user-context`
Returns user context for chatbot personalization.

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "role": "player|coach|admin",
    "teamType": "domestic|international",
    "primaryTeamId": "uuid",
    "teamInfo": {
      "id": "uuid",
      "name": "Team Name",
      "team_type": "domestic|international",
      "region": "Region Name",
      "country_code": "USA"
    },
    "position": "QB|WR|RB|DB|LB",
    "expertiseLevel": "beginner|intermediate|advanced",
    "preferredTopics": ["topic1", "topic2"],
    "totalQueries": 42,
    "heightCm": 180,
    "weightKg": 75,
    "experienceLevel": "intermediate"
  }
}
```

### POST `/netlify/functions/update-chatbot-stats`
Updates chatbot usage statistics.

**Request Body:**
```json
{
  "topic": "nutrition|recovery|training|injuries|psychology|general"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Statistics updated successfully"
  }
}
```

---

## 📝 Usage Examples

### Creating a Team with New Fields

When creating teams, include the new fields:

```javascript
// Example: Creating a team via Supabase
const { data, error } = await supabase
  .from('teams')
  .insert({
    name: 'International Champions',
    team_type: 'international', // 'domestic' or 'international'
    region: 'North America',
    country_code: 'USA' // ISO 3166-1 alpha-3 code
  });
```

### Updating Team Type

```javascript
// Update team to international
const { data, error } = await supabase
  .from('teams')
  .update({
    team_type: 'international',
    region: 'Europe',
    country_code: 'GBR'
  })
  .eq('id', teamId);
```

### Getting User Context

```javascript
// Frontend: Get user context for chatbot
const response = await fetch('/.netlify/functions/user-context', {
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  }
});

const result = await response.json();
const context = result.data;

// Use context in chatbot
if (context.teamType === 'international') {
  // Show international-specific content
}
```

### Updating Chatbot Stats

```javascript
// After a chatbot query
await fetch('/.netlify/functions/update-chatbot-stats', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    topic: 'nutrition' // or 'recovery', 'training', etc.
  })
});
```

---

## 🎯 Next Steps

1. **Team Creation Forms:** Update any team creation forms to include:
   - Team type selector (domestic/international)
   - Region input field
   - Country code selector/input

2. **Team Management:** Update team management pages to:
   - Display team type, region, and country code
   - Allow editing these fields

3. **Chatbot Integration:** The chatbot already uses these features:
   - ✅ Role-aware responses (player/coach/admin)
   - ✅ Team type adjustments (domestic/international)
   - ✅ Usage statistics tracking
   - ✅ Preferred topics tracking

4. **Knowledge Base:** When knowledge base is implemented:
   - Migration 040 will automatically apply
   - Governance features will be available

---

## 🔍 Verification

To verify everything is working:

1. **Check Database:**
   ```sql
   -- Verify teams table has new columns
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'teams' 
   AND column_name IN ('team_type', 'region', 'country_code');

   -- Verify chatbot_user_context table exists
   SELECT * FROM chatbot_user_context LIMIT 1;

   -- Test database functions
   SELECT get_or_create_chatbot_context('user-uuid-here');
   ```

2. **Test API Endpoints:**
   - Call `/netlify/functions/user-context` with valid auth token
   - Call `/netlify/functions/update-chatbot-stats` with POST request

3. **Test Chatbot:**
   - Ask chatbot a question
   - Verify it tracks statistics
   - Check that role-aware responses work

---

## 📚 Related Files

- Database Migrations:
  - `database/migrations/039_chatbot_role_aware_system.sql`
  - `database/migrations/040_knowledge_base_governance.sql`
  - `supabase/migrations/20250108000000_chatbot_role_aware_system.sql`
  - `supabase/migrations/20250108000001_knowledge_base_governance.sql`

- Application Code:
  - `netlify/functions/user-context.cjs`
  - `netlify/functions/update-chatbot-stats.cjs`
  - `src/js/components/chatbot.js`
  - `src/js/utils/role-aware-response-generator.js`
  - `src/js/services/personalization-service.js`

- TypeScript Types:
  - `supabase-types.ts` (auto-generated from database)

---

**Last Updated:** 2025-01-08
**Database:** Supabase (pvziciccwxgftcielknm)
**Status:** ✅ Migrations Applied, Code Integrated

