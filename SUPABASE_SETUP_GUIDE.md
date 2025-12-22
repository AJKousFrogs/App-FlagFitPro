# 🚀 Supabase Setup Guide - Next Steps

## ✅ Migration Complete!

Your data is now using Supabase PostgreSQL.
**373 rows** across **72 tables** are now in Supabase.

---

## 📋 Step 1: Update Netlify Environment Variables

Your Netlify Functions need the new Supabase credentials.

### Go to Netlify Dashboard:
1. Visit: https://app.netlify.com/sites/YOUR_SITE_NAME/configuration/env
2. Update these 3 variables:

```
SUPABASE_URL=https://pvziciccwxgftcielknm.supabase.co
SUPABASE_ANON_KEY=sb_publishable_4mRqHbz4cFVXzpDi8nJc3A_rknKjryk
SUPABASE_SERVICE_KEY=sb_secret_ZbZdfro3oCkX1wAiyYg__g_SUrhZI1R
```

### Important:
- Click **"Deploy new build"** after updating
- This will redeploy your site with new credentials

---

## 📋 Step 2: Test Your Application

### Local Testing:

```bash
# Start local dev server
npm run dev
# or
npm start
```

### Test These Features:
- [ ] **Login** - Can users log in?
- [ ] **Register** - Can new users sign up?
- [ ] **Dashboard** - Does it load user data?
- [ ] **Roster** - Can you view/edit roster?
- [ ] **Training Schedule** - Does it display?
- [ ] **Performance Tracking** - Can you add/view metrics?

### Check Browser Console:
- Look for any errors related to database connections
- All API calls should now go to Supabase

---

## 📋 Step 3: Set Up Supabase Auth (IMPORTANT!)

Your app currently has login/register pages but they may not be using Supabase Auth yet.

### Current Status:
Your Netlify Functions use:
- `supabaseAdmin` (service key) - for backend operations
- `supabase` (anon key) - for regular operations

### What You Need:

**Option A: Use Supabase Auth (Recommended)**
- Supabase handles authentication automatically
- Provides JWT tokens
- Integrates with RLS policies

**Option B: Custom Auth (Current Setup?)**
- You manage users table manually
- Need to create your own JWT tokens
- More work but more control

### To Set Up Supabase Auth:

1. **Enable Email Auth in Supabase:**
   - Go to: https://supabase.com/dashboard/project/pvziciccwxgftcielknm/auth/providers
   - Enable "Email" provider
   - Configure email templates

2. **Update Your Frontend:**
   ```javascript
   // In your login.html or login.js
   import { createClient } from '@supabase/supabase-js'

   const supabase = createClient(
     'https://pvziciccwxgftcielknm.supabase.co',
     'sb_publishable_4mRqHbz4cFVXzpDi8nJc3A_rknKjryk'
   )

   // Login
   const { data, error } = await supabase.auth.signInWithPassword({
     email: 'user@example.com',
     password: 'password'
   })

   // Register
   const { data, error } = await supabase.auth.signUp({
     email: 'user@example.com',
     password: 'password'
   })
   ```

3. **Update Your Backend (Netlify Functions):**
   ```javascript
   // In your functions, verify the user token:
   const token = event.headers.authorization?.replace('Bearer ', '')
   const { data: user, error } = await supabase.auth.getUser(token)
   ```

---

## 📋 Step 4: Enable RLS Policies for User Tables

Once Supabase Auth is working, enable RLS on user-specific tables:

```sql
-- Run this in Supabase SQL Editor after auth is working:

-- Users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON users FOR SELECT
  USING (auth.uid()::text = id::text);

-- User behavior
ALTER TABLE user_behavior ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own behavior" ON user_behavior FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Training analytics
ALTER TABLE training_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own analytics" ON training_analytics FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Performance metrics
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own metrics" ON performance_metrics FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Analytics events
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own events" ON analytics_events FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Wearables data
ALTER TABLE wearables_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own wearables" ON wearables_data FOR ALL
  USING (auth.uid()::text = user_id::text);
```

---

## 📋 Step 5: Deploy to Production

### After Local Testing Works:

1. **Commit Your Changes:**
   ```bash
   git add .
   git commit -m "Migrate to Supabase, update environment config"
   git push origin main
   ```

2. **Netlify Will Auto-Deploy**
   - With the updated environment variables
   - Check deployment logs for errors

3. **Test Production:**
   - Visit your live site
   - Test login, register, dashboard
   - Check that data loads correctly

---

## 📋 Step 6: Monitor for 30 Days

### Migration Complete:
- All data is now in Supabase
- Keep it as a safety net for 30 days
- Monitor your app for any issues

### What to Check:
- [ ] All logins working
- [ ] Data saving correctly
- [ ] No database errors in logs
- [ ] Performance is good

### After 30 Days (if all is well):

1. **Clean up old database references:**
   - Remove any old database integration references from Netlify
   - Ensure only Supabase environment variables are set

2. **Verify Supabase Environment Variables:**
   ```
   SUPABASE_URL
   SUPABASE_SERVICE_KEY
   SUPABASE_ANON_KEY
   ```

3. **Update .env file:**
   - Ensure all references point to Supabase
   - Keep only Supabase credentials

---

## 🆘 Troubleshooting

### If Login Doesn't Work:
1. Check browser console for errors
2. Verify Supabase URL and keys are correct in Netlify
3. Check that Supabase Auth is enabled

### If Data Doesn't Load:
1. Check RLS policies are correct
2. Verify user is authenticated
3. Check Netlify Function logs

### If You Get "Row Level Security" Errors:
- The user isn't authenticated properly
- Or the RLS policy doesn't match the user's auth.uid()

---

## 📚 Resources

- **Supabase Dashboard:** https://supabase.com/dashboard/project/pvziciccwxgftcielknm
- **Supabase Auth Docs:** https://supabase.com/docs/guides/auth
- **RLS Docs:** https://supabase.com/docs/guides/auth/row-level-security
- **Your Backups:** `/backups/` (if any migration backups exist)

---

## ✅ Checklist

- [ ] Update Netlify environment variables
- [ ] Test application locally
- [ ] Set up Supabase Auth
- [ ] Enable RLS on user tables
- [ ] Deploy to production
- [ ] Monitor for 30 days
- [ ] Verify all Supabase connections are working

---

**Need Help?** Ask me anything! I can help you:
- Set up Supabase Auth
- Debug connection issues
- Write custom RLS policies
- Update your frontend code
