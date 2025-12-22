# Deployment Guide - FlagFit Pro

## Quick Start - Deploy to Netlify

### Step 1: Prepare Your Code

All fixes have been applied. Your code is ready to deploy.

**Changes Made:**
1. Fixed Supabase URL typo in `src/js/services/supabase-client.js`
2. Updated API configuration to use Netlify Functions
3. Verified all Supabase connections

### Step 2: Set Environment Variables in Netlify

Go to your Netlify dashboard and add these environment variables:

```bash
# Supabase Configuration (REQUIRED)
SUPABASE_URL=https://pvziciccwxgftcielknm.supabase.co
SUPABASE_ANON_KEY=sb_publishable_4mRqHbz4cFVXzpDi8nJc3A_rknKjryk
SUPABASE_SERVICE_KEY=sb_secret_ZbZdfro3oCkX1wAiyYg__g_SUrhZI1R

# JWT Secret (REQUIRED)
JWT_SECRET=flagfit-pro-jwt-secret-key-2025-production

# Database (REQUIRED)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_ANON_KEY=your-anon-key

# Optional: Third-party APIs
VITE_YOUTUBE_API_KEY=your_youtube_api_key_here
VITE_GOOGLE_ANALYTICS_ID=your_ga_id_here
```

### Step 3: Deploy

#### Option A: Automatic Deploy (Recommended)

If you've connected your GitHub repo to Netlify:

```bash
git add .
git commit -m "Pre-deployment fixes: Ready for production"
git push origin main
```

Netlify will automatically deploy your site.

#### Option B: Manual Deploy via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy to production
netlify deploy --prod
```

### Step 4: Verify Deployment

After deployment, test these critical features:

1. **Login/Registration**
   - Go to `/login.html`
   - Try logging in with demo credentials:
     - Email: `test@flagfitpro.com`
     - Password: `demo123`

2. **Dashboard**
   - Verify dashboard loads at `/dashboard.html`
   - Check that stats are displayed
   - No console errors

3. **API Endpoints**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Verify API calls to `/auth-login`, `/dashboard`, etc. succeed

4. **Database Connection**
   - Create a test user
   - Add training session
   - Verify data persists

---

## Troubleshooting

### Issue: "Failed to connect to Supabase"

**Solution:**
1. Check environment variables in Netlify
2. Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
3. Check browser console for specific errors

### Issue: "JWT_SECRET not set"

**Solution:**
1. Add `JWT_SECRET` environment variable in Netlify
2. Use a strong, random secret (at least 32 characters)
3. Redeploy the site

### Issue: "Authentication failed"

**Solution:**
1. Clear browser cache and localStorage
2. Try demo credentials: `test@flagfitpro.com` / `demo123`
3. Check Netlify function logs for errors

### Issue: "Database connection error"

**Solution:**
1. Verify `DATABASE_URL` is set in Netlify
2. Check Supabase project is active
3. Test connection from Netlify Functions logs

### Issue: "CORS errors"

**Solution:**
- CORS is configured in `netlify.toml`
- Verify the file is in the root directory
- Check Netlify build logs for configuration errors

---

## Post-Deployment Checklist

- [ ] Login functionality works
- [ ] Dashboard displays user data
- [ ] Training sessions can be created
- [ ] Community posts load
- [ ] Real-time features work
- [ ] Mobile responsive design works
- [ ] All pages load without errors
- [ ] API calls succeed (check Network tab)

---

## Monitoring & Maintenance

### Check Netlify Function Logs

```bash
netlify functions:log
```

Or view in Netlify dashboard:
1. Go to your site
2. Click "Functions"
3. Click on a function to view logs

### Monitor Supabase

1. Go to Supabase dashboard
2. Click on your project
3. View "Logs" section for database queries
4. Check "API" section for usage stats

### Database Backups

Supabase provides automatic backups. To verify:
1. Go to Supabase dashboard
2. Navigate to "Database" → "Backups"
3. Confirm automatic backups are enabled

---

## Updating the Application

### Making Changes

1. Make changes locally
2. Test thoroughly in development
3. Commit and push to GitHub
4. Netlify will auto-deploy

```bash
git add .
git commit -m "Description of changes"
git push origin main
```

### Rolling Back

If deployment causes issues:

```bash
# Via Netlify CLI
netlify rollback

# Or in Netlify dashboard:
# 1. Go to "Deploys"
# 2. Find previous working deploy
# 3. Click "Publish deploy"
```

---

## Security Best Practices

### 1. Rotate Secrets Regularly

Change these every 90 days:
- `JWT_SECRET`
- `SUPABASE_SERVICE_KEY` (generate new in Supabase dashboard)

### 2. Monitor for Suspicious Activity

Check Netlify and Supabase logs for:
- Failed login attempts
- Unusual API usage
- Database errors

### 3. Keep Dependencies Updated

```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Audit for vulnerabilities
npm audit
npm audit fix
```

---

## Performance Optimization

### Enable Netlify CDN

Already configured via `netlify.toml`:
- Static assets cached
- Gzip compression enabled
- Headers optimized

### Database Query Optimization

Monitor slow queries in Supabase:
1. Go to Supabase → Database → Logs
2. Check query performance
3. Add indexes if needed:

```sql
-- Example: Add index on user_id for faster queries
CREATE INDEX idx_training_sessions_user_id ON training_sessions(user_id);
```

### Caching Strategy

Already implemented:
- Dashboard data: 5 minutes
- Static assets: 1 year (with versioning)
- API responses: As configured per endpoint

---

## Scaling Considerations

### Current Limits

**Netlify Free Tier:**
- 100GB bandwidth/month
- 300 build minutes/month
- 125k function invocations/month

**Supabase Free Tier:**
- 500MB database space
- 2GB bandwidth/month
- 50,000 monthly active users

### When to Upgrade

Consider upgrading when:
- Monthly active users > 10,000
- Database size > 400MB
- Function invocations > 100k/month
- Bandwidth > 50GB/month

---

## Support & Resources

### Documentation
- Netlify Docs: https://docs.netlify.com
- Supabase Docs: https://supabase.com/docs
- Project README: See project files

### Getting Help
1. Check Netlify function logs
2. Review Supabase logs
3. Check browser console errors
4. Review `PRE_DEPLOYMENT_AUDIT_REPORT.md`

---

## Quick Reference

### Demo Credentials
```
Email: test@flagfitpro.com
Password: demo123

Email: coach@flagfitpro.com
Password: demo123
```

### Important URLs
- Production: `https://your-site.netlify.app`
- Supabase: https://pvziciccwxgftcielknm.supabase.co
- Netlify Functions: `/.netlify/functions/*`

### Key Files
- Configuration: `netlify.toml`
- Environment: `src/config/environment.js`
- Supabase Client: `src/js/services/supabase-client.js`
- Auth Manager: `src/auth-manager.js`

---

**Last Updated:** December 2, 2024
**Status:** Ready for Production Deployment ✅
