# Production Environment Setup Guide

**Date:** December 2024  
**Purpose:** Update production environment with new security variables and configurations

---

## 🚨 Critical: Production Environment Variables

### Required New Variables

Add these variables to your production environment (Netlify or your hosting platform):

```bash
# API Configuration (NEW)
VITE_API_BASE_URL=https://your-production-api-domain.com
VITE_AI_SERVICE_URL=https://your-ai-service-domain.com

# Security (NEW)
CSRF_SECRET=your-super-secure-csrf-secret-key-here

# Database Configuration (if using separate database)
PGUSER=your_production_db_user
PGHOST=your_production_db_host
PGDATABASE=your_production_db_name
PGPASSWORD=your_production_db_password
PGPORT=5432

# CORS Configuration (NEW)
ALLOWED_ORIGINS=https://your-production-domain.com,https://www.your-production-domain.com

# Environment
NODE_ENV=production
```

### Existing Variables (Verify These Are Set)

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# App Configuration
VITE_APP_NAME=FlagFit Pro
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=production

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_PUSH_NOTIFICATIONS=true
VITE_ENABLE_WEARABLE_SYNC=false

# YouTube API
VITE_YOUTUBE_API_KEY=your_youtube_api_key

# Optional: Sentry for error tracking
VITE_SENTRY_DSN=your_sentry_dsn

# Optional: Analytics
VITE_GOOGLE_ANALYTICS_ID=your_ga_id
```

---

## 🔐 Security Configuration

### CSRF Secret Generation

Generate a secure CSRF secret for production:

```bash
# Option 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 2: Using OpenSSL
openssl rand -hex 32

# Option 3: Using Python
python3 -c "import secrets; print(secrets.token_hex(32))"
```

**Example output:** `a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456`

### CORS Origins Configuration

Set `ALLOWED_ORIGINS` to include only your production domains:

```bash
# Single domain
ALLOWED_ORIGINS=https://flagfitpro.com

# Multiple domains (comma-separated)
ALLOWED_ORIGINS=https://flagfitpro.com,https://www.flagfitpro.com,https://app.flagfitpro.com
```

---

## 🌐 Platform-Specific Instructions

### Netlify Deployment

1. **Go to your Netlify dashboard**
2. **Select your site**
3. **Navigate to Site settings → Environment variables**
4. **Add each variable:**

```bash
# Add these variables one by one:
VITE_API_BASE_URL=https://your-api.netlify.app
VITE_AI_SERVICE_URL=https://your-ai-service.netlify.app
CSRF_SECRET=your-generated-csrf-secret
ALLOWED_ORIGINS=https://your-domain.netlify.app
NODE_ENV=production
```

5. **Trigger a new deployment**

### Railway Deployment

1. **Go to your Railway dashboard**
2. **Select your project**
3. **Navigate to Variables tab**
4. **Add each variable**
5. **Redeploy the service**

### Docker Deployment

If using Docker, update your `docker-compose.yml`:

```yaml
version: '3.8'
services:
  app:
    build: .
    environment:
      - VITE_API_BASE_URL=https://your-api-domain.com
      - VITE_AI_SERVICE_URL=https://your-ai-service-domain.com
      - CSRF_SECRET=your-generated-csrf-secret
      - ALLOWED_ORIGINS=https://your-domain.com
      - NODE_ENV=production
      - VITE_SUPABASE_URL=https://your-project.supabase.co
      - VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ports:
      - "3000:3000"
```

---

## 🔍 Verification Steps

### 1. Environment Variable Check

Create a simple endpoint to verify variables (remove after testing):

```javascript
// Add this temporarily to server.js for testing
app.get('/api/env-check', (req, res) => {
  res.json({
    hasApiBaseUrl: !!process.env.VITE_API_BASE_URL,
    hasAiServiceUrl: !!process.env.VITE_AI_SERVICE_URL,
    hasCsrfSecret: !!process.env.CSRF_SECRET,
    hasAllowedOrigins: !!process.env.ALLOWED_ORIGINS,
    nodeEnv: process.env.NODE_ENV,
    corsOrigins: process.env.ALLOWED_ORIGINS?.split(',')
  });
});
```

### 2. Security Headers Verification

Check that security headers are properly set:

```bash
# Test your production URL
curl -I https://your-production-domain.com

# Look for these headers:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
# Content-Security-Policy: ...
```

### 3. CORS Verification

Test CORS is working correctly:

```javascript
// Test from browser console on your production site
fetch('https://your-api-domain.com/api/health', {
  method: 'GET',
  credentials: 'include'
}).then(response => {
  console.log('CORS test successful:', response.status);
}).catch(error => {
  console.error('CORS test failed:', error);
});
```

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Generate secure CSRF secret
- [ ] Update API URLs to production domains
- [ ] Configure CORS origins for production
- [ ] Set NODE_ENV=production
- [ ] Verify all Supabase credentials are correct

### During Deployment
- [ ] Add all new environment variables
- [ ] Redeploy application
- [ ] Test environment variable loading
- [ ] Verify security headers are present
- [ ] Test CORS functionality

### Post-Deployment
- [ ] Remove temporary testing endpoints
- [ ] Monitor application logs for errors
- [ ] Test all major functionality
- [ ] Verify rate limiting is working
- [ ] Check CSRF protection is active

---

## 🔧 Troubleshooting

### Common Issues

#### 1. CORS Errors
**Problem:** `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**Solution:**
- Verify `ALLOWED_ORIGINS` includes your frontend domain
- Check that the domain format is correct (include protocol)
- Ensure no trailing slashes in URLs

#### 2. CSRF Token Errors
**Problem:** `CSRF token mismatch`

**Solution:**
- Verify `CSRF_SECRET` is set correctly
- Check that cookies are being set properly
- Ensure HTTPS is enabled in production

#### 3. Environment Variables Not Loading
**Problem:** Variables showing as undefined

**Solution:**
- Verify variable names are exactly as specified
- Check that variables are set for the correct environment
- Restart the application after adding variables

#### 4. Rate Limiting Too Aggressive
**Problem:** Users getting rate limited too quickly

**Solution:**
- Adjust rate limit values in `server.js`:
```javascript
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Increase from 100 to 200
  // ...
});
```

---

## 📞 Support

If you encounter issues:

1. **Check the application logs** for error messages
2. **Verify all environment variables** are set correctly
3. **Test with the verification endpoints** provided above
4. **Review the security audit report** for any missed configurations

---

## 🔄 Rollback Plan

If issues occur, you can quickly rollback:

1. **Revert environment variables** to previous values
2. **Disable new security features** temporarily:
   - Comment out rate limiting
   - Disable CSRF protection
   - Remove security headers
3. **Redeploy** with previous configuration
4. **Debug issues** in development environment

---

*This guide ensures your production environment is properly configured with all the new security features implemented during the security audit.* 