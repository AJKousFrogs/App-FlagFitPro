# Legacy Neon DB Scripts Archive

This directory contains scripts that were written for Neon DB but are no longer actively used since the project migrated to Supabase.

## Scripts Archived

### Seed Scripts (May contain useful data)

1. **`seedNFLPlayerDatabase.js`** - Seeds NFL player comparison data for user performance comparisons
   - Contains 20 years of NFL combine data
   - Could be useful if updated to use Supabase client
   - **Status**: Not actively used, archived for potential future use

2. **`seedEliteSprintTrainingDatabase.js`** - Seeds elite sprint training workouts
   - Based on research of USA, Jamaica, UK sprinter training methods
   - Contains sprint workouts, agility patterns, and flag football scenarios
   - **Status**: Not actively used, archived for potential future use

3. **`seedCompletePlayerSystem.js`** - Seeds player archetypes and development data
   - Contains player archetypes, position suitability data
   - **Status**: Not actively used, archived for potential future use

### Health Check Script

4. **`database-health-check.js`** - Database connectivity and health checker
   - Validates database connectivity, schema integrity, and performance
   - Uses Neon client but could be updated to Supabase
   - **Status**: Not actively used, archived for potential future use

## Why Archived?

- These scripts use `@neondatabase/serverless` which is not part of the current tech stack
- They are not referenced in `package.json` scripts
- The project has fully migrated to Supabase
- They could cause confusion for developers

## Future Use

If you need to use any of these scripts:

1. **Update to Supabase**: Replace `neon()` calls with Supabase client
2. **Check dependencies**: Ensure `@neondatabase/serverless` is removed from `package.json` if not needed elsewhere
3. **Test thoroughly**: Verify the scripts work with Supabase before using

## Example: Converting from Neon to Supabase

**Before (Neon):**

```javascript
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);
await sql`SELECT * FROM table`;
```

**After (Supabase):**

```javascript
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);
const { data } = await supabase.from("table").select("*");
```

---

**Archived**: 2024
**Reason**: Project migrated from Neon DB to Supabase
