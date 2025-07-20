# Production Environment Variables - Quick Reference

## 🔐 Critical Security Variables (NEW)

```bash
# CSRF Protection
CSRF_SECRET=1ca9d3d51aac5c879736edfee4e0895a2356fdfcd44f0ab7b40b21816660658c

# API Configuration
VITE_API_BASE_URL=https://your-production-api-domain.com
VITE_AI_SERVICE_URL=https://your-ai-service-domain.com

# CORS Configuration
ALLOWED_ORIGINS=https://your-production-domain.com,https://www.your-production-domain.com

# Environment
NODE_ENV=production
```

## 📋 Complete Production Variables List

### Required Variables (Add These)

| Variable | Value | Description |
|----------|-------|-------------|
| `CSRF_SECRET` | `1ca9d3d51aac5c879736edfee4e0895a2356fdfcd44f0ab7b40b21816660658c` | CSRF protection secret |
| `VITE_API_BASE_URL` | `https://your-api-domain.com` | Your API server URL |
| `VITE_AI_SERVICE_URL` | `https://your-ai-service.com` | AI service URL |
| `ALLOWED_ORIGINS` | `https://your-domain.com` | CORS allowed origins |
| `NODE_ENV` | `production` | Environment setting |

### Database Variables (If Using Separate DB)

| Variable | Value | Description |
|----------|-------|-------------|
| `PGUSER` | `your_production_user` | Database username |
| `PGHOST` | `your_production_host` | Database host |
| `PGDATABASE` | `your_production_db` | Database name |
| `PGPASSWORD` | `your_production_password` | Database password |
| `PGPORT` | `5432` | Database port |

### Existing Variables (Verify These Are Set)

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `your_supabase_anon_key` | Supabase anonymous key |
| `VITE_APP_NAME` | `FlagFit Pro` | Application name |
| `VITE_APP_VERSION` | `1.0.0` | Application version |
| `VITE_APP_ENVIRONMENT` | `production` | App environment |
| `VITE_ENABLE_ANALYTICS` | `true` | Enable analytics |
| `VITE_ENABLE_PUSH_NOTIFICATIONS` | `true` | Enable push notifications |
| `VITE_YOUTUBE_API_KEY` | `your_youtube_api_key` | YouTube API key |
| `VITE_SENTRY_DSN` | `your_sentry_dsn` | Sentry error tracking |
| `VITE_GOOGLE_ANALYTICS_ID` | `your_ga_id` | Google Analytics ID |

## 🚀 Quick Setup Commands

### Generate New CSRF Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Test Environment Variables
```bash
# Add this to your server temporarily
curl https://your-api-domain.com/api/env-check
```

### Verify Security Headers
```bash
curl -I https://your-domain.com
```

## 📱 Platform-Specific Setup

### Netlify
1. Dashboard → Site → Site settings → Environment variables
2. Add each variable from the table above
3. Trigger new deployment

### Railway
1. Dashboard → Project → Variables tab
2. Add each variable from the table above
3. Redeploy service

## ✅ Verification Checklist

After deployment, verify:

- [ ] `GET /api/health` returns `{"status":"ok"}`
- [ ] `GET /api/csrf-token` returns CSRF token
- [ ] Security headers are present in response
- [ ] CORS allows requests from your domain
- [ ] Rate limiting is working (test with multiple requests)
- [ ] Password validation requires 8+ chars with complexity
- [ ] No console errors related to environment variables

## 🆘 Troubleshooting

### Common Issues

**CORS Errors:**
- Verify `ALLOWED_ORIGINS` includes your exact domain
- Include protocol (https://)
- No trailing slashes

**CSRF Errors:**
- Verify `CSRF_SECRET` is set correctly
- Check that cookies are enabled
- Ensure HTTPS is used

**Environment Variables Not Loading:**
- Restart application after adding variables
- Check variable names are exact (case-sensitive)
- Verify variables are set for correct environment

---

*Save this reference for quick access during deployment!* 