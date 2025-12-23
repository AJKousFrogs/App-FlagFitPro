# Deployment Checklist - Advanced UX/UI Components

## Pre-Deployment Checklist

### 1. Environment Variables ✅

Ensure these are set in Netlify Dashboard → Site Settings → Environment Variables:

- [ ] `JWT_SECRET` - Secret key for JWT token verification
- [ ] `SUPABASE_URL` - Your Supabase project URL
- [ ] `SUPABASE_SERVICE_KEY` - Supabase service role key (for admin operations)
- [ ] `SUPABASE_ANON_KEY` - Supabase anonymous key (for client operations)
- [ ] `SUPABASE_URL` - Supabase project URL
- [ ] `SUPABASE_SERVICE_KEY` - Supabase service role key
- [ ] `SUPABASE_ANON_KEY` - Supabase anonymous key

### 2. Database Migrations ✅

Run the following migration to ensure database schema is up to date:

```bash
# Connect to your database and run:
psql $DATABASE_URL -f database/migrations/030_advanced_ux_components_support.sql
```

Or via Supabase SQL Editor:

- Copy contents of `database/migrations/030_advanced_ux_components_support.sql`
- Paste into Supabase SQL Editor
- Execute

**Required Tables:**

- [ ] `training_sessions` table exists
- [ ] `users` table exists
- [ ] `athlete_performance_tests` table exists (optional, for enhanced metrics)

**Required Columns in `training_sessions`:**

- [ ] `equipment` (TEXT[])
- [ ] `goals` (TEXT[])
- [ ] `exercises` (JSONB)
- [ ] `completed_at` (TIMESTAMP)

### 3. Netlify Configuration ✅

Verify `netlify.toml` includes routes for new functions:

- [ ] `/api/performance/metrics` → `performance-metrics`
- [ ] `/api/performance/heatmap` → `performance-heatmap`
- [ ] `/api/training/sessions` → `training-sessions`

### 4. Function Files ✅

Verify all Netlify functions exist:

- [ ] `netlify/functions/performance-metrics.cjs`
- [ ] `netlify/functions/training-sessions.cjs`
- [ ] `netlify/functions/performance-heatmap.cjs`

### 5. Frontend Components ✅

Verify Angular components are integrated:

- [ ] `angular/src/app/shared/components/performance-dashboard/`
- [ ] `angular/src/app/shared/components/training-builder/`
- [ ] `angular/src/app/shared/components/swipe-table/`
- [ ] `angular/src/app/shared/components/training-heatmap/`

### 6. API Service Configuration ✅

Verify `angular/src/app/core/services/api.service.ts` includes:

- [ ] `performance.metrics` endpoint
- [ ] `performance.heatmap` endpoint
- [ ] `training.sessions` endpoint
- [ ] `training.createSession` endpoint

## Deployment Steps

### Step 1: Build Angular Application

```bash
cd angular
npm install
npm run build
```

### Step 2: Commit Changes

```bash
git add .
git commit -m "Add advanced UX/UI components and backend APIs"
git push origin main
```

### Step 3: Deploy to Netlify

- Netlify will automatically deploy on push to main branch
- Or manually trigger deployment from Netlify Dashboard

### Step 4: Verify Deployment

1. Check Netlify build logs for errors
2. Verify all functions deployed successfully
3. Test API endpoints (see Testing Guide below)

## Post-Deployment Verification

### 1. Function Health Checks

Test each endpoint:

```bash
# Performance Metrics
curl https://your-site.netlify.app/api/performance/metrics \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Training Sessions (GET)
curl https://your-site.netlify.app/api/training/sessions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Performance Heatmap
curl https://your-site.netlify.app/api/performance/heatmap?timeRange=6months \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Frontend Component Testing

- [ ] Navigate to Dashboard - verify Performance Dashboard component loads
- [ ] Navigate to Training - verify Training Builder component loads
- [ ] Test Training Builder wizard flow
- [ ] Verify real-time updates in Performance Dashboard
- [ ] Test Training Heatmap (if integrated into a page)

### 3. Database Verification

```sql
-- Check training_sessions table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'training_sessions';

-- Verify indexes exist
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'training_sessions';

-- Check views exist
SELECT viewname
FROM pg_views
WHERE viewname IN ('performance_metrics_summary', 'training_load_daily');
```

### 4. Error Monitoring

- [ ] Check Netlify Function logs for errors
- [ ] Monitor error rates in Netlify Analytics
- [ ] Set up error alerts (optional)

## Rollback Plan

If issues occur:

1. **Revert Git Commit:**

   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Disable Functions:**
   - Comment out routes in `netlify.toml`
   - Redeploy

3. **Database Rollback:**
   ```sql
   -- Remove new columns (if needed)
   ALTER TABLE training_sessions DROP COLUMN IF EXISTS equipment;
   ALTER TABLE training_sessions DROP COLUMN IF EXISTS goals;
   ALTER TABLE training_sessions DROP COLUMN IF EXISTS exercises;
   ```

## Performance Optimization

### After Deployment:

1. Monitor function execution times
2. Check database query performance
3. Optimize slow queries if needed
4. Consider adding caching for frequently accessed data

### Database Indexes:

All required indexes are created in the migration. Monitor:

- Query performance on `training_sessions` table
- Index usage statistics
- Consider additional indexes based on query patterns

## Security Checklist

- [ ] JWT tokens are properly validated
- [ ] User data is filtered by user_id
- [ ] CORS headers are configured correctly
- [ ] No sensitive data in error messages
- [ ] Environment variables are not exposed

## Documentation

- [ ] Update API documentation
- [ ] Update component usage guides
- [ ] Document any custom configurations
- [ ] Update README with new features

## Support Contacts

- **Database Issues:** Check Supabase dashboard
- **Function Errors:** Check Netlify Function logs
- **Frontend Issues:** Check browser console and Angular build logs

## Success Criteria

✅ All functions deploy without errors  
✅ API endpoints return expected responses  
✅ Frontend components render correctly  
✅ Database queries execute successfully  
✅ No security vulnerabilities  
✅ Performance is acceptable (< 2s response time)

---

**Last Updated:** 2024-01-XX  
**Deployment Status:** Ready for Production
