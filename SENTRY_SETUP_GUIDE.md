# Sentry Error Tracking Setup Guide

## Overview

Sentry is now integrated into FlagFit Pro for production error monitoring and performance tracking. This guide will help you set it up.

---

## 1. Create a Sentry Account

1. Go to [sentry.io](https://sentry.io)
2. Sign up for a free account
3. Create a new project:
   - Platform: **JavaScript**
   - Project name: **flagfit-pro**

---

## 2. Get Your DSN

After creating the project:

1. Go to **Settings** → **Projects** → **flagfit-pro**
2. Click on **Client Keys (DSN)**
3. Copy your **DSN** (looks like: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`)

---

## 3. Install Sentry Packages

```bash
npm install @sentry/browser @sentry/tracing
```

---

## 4. Configure Environment Variables

### For Local Development (.env.local)

```bash
VITE_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
VITE_PERFORMANCE_SAMPLE_RATE=1.0
```

### For Netlify Production

Add these in Netlify Dashboard → Site Settings → Environment Variables:

```bash
VITE_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
VITE_PERFORMANCE_SAMPLE_RATE=0.1  # Sample 10% of transactions
APP_VERSION=1.0.0  # Optional: for release tracking
```

---

## 5. Sentry Features Implemented

### ✅ Automatic Error Tracking

All uncaught errors and unhandled promise rejections are automatically reported to Sentry.

### ✅ User Context

When users log in, their information is attached to error reports:
- User ID
- Email
- Name
- Role

### ✅ Performance Monitoring

Track page load times and API performance:
- 10% sample rate in production
- Full tracking in staging

### ✅ Sensitive Data Filtering

Automatically removes:
- Authorization headers
- Cookies
- localStorage data
- sessionStorage data

### ✅ Smart Error Filtering

Ignores common noise:
- Browser extension errors
- Network errors (handled separately)
- Ad blocker errors
- ResizeObserver errors

---

## 6. How It Works

### Automatic Integration

Sentry is automatically initialized in production:

```javascript
// In src/js/services/sentry-service.js
sentryService.init(); // Auto-runs in production
```

### Error Handler Integration

The unified error handler automatically reports to Sentry:

```javascript
// Errors are automatically reported
throw new Error('Something went wrong');
// ✅ Reported to Sentry with full context
```

### Manual Error Reporting

You can also manually report errors:

```javascript
import { sentryService } from './js/services/sentry-service.js';

// Capture exception
try {
  riskyOperation();
} catch (error) {
  sentryService.captureException(error, {
    component: 'UserProfile',
    action: 'updateProfile'
  });
}

// Capture message
sentryService.captureMessage('User completed onboarding', 'info', {
  userId: user.id,
  step: 'final'
});

// Add breadcrumb (for debugging context)
sentryService.addBreadcrumb({
  category: 'navigation',
  message: 'User navigated to settings',
  level: 'info'
});
```

---

## 7. Testing Sentry Integration

### Test in Development

Sentry only runs in production/staging by default. To test locally:

1. Temporarily change environment check:
   ```javascript
   // In src/js/services/sentry-service.js
   if (config.ENV !== 'production') {
     // Change to: if (false) {
   ```

2. Add test DSN to `.env.local`

3. Trigger a test error:
   ```javascript
   throw new Error('Sentry test error');
   ```

4. Check Sentry dashboard for the error

### Test in Production

After deploying to Netlify:

1. Visit your production site
2. Open browser console
3. Type: `throw new Error('Production Sentry test')`
4. Check Sentry dashboard

---

## 8. Sentry Dashboard Features

### Issues

View all errors with:
- Error message and stack trace
- User information
- Browser and device info
- Breadcrumb trail (user actions leading to error)

### Performance

Track:
- Page load times
- API response times
- Database query performance
- User interactions

### Releases

Track which version of your code caused errors:
- Set `APP_VERSION` environment variable
- Sentry will group errors by release
- See when issues were introduced

---

## 9. Best Practices

### 1. Don't Over-Report

Sentry has rate limits. Configure sample rates:

```javascript
// For high-traffic apps
tracesSampleRate: 0.1, // Track 10% of transactions
```

### 2. Add Meaningful Context

When manually reporting errors:

```javascript
sentryService.captureException(error, {
  component: 'PaymentProcessor',
  action: 'submitPayment',
  paymentMethod: 'credit_card',
  amount: 99.99,
  userId: user.id
});
```

### 3. Set Up Alerts

In Sentry Dashboard:
1. Go to **Alerts**
2. Create rules for:
   - New errors
   - Error rate spikes
   - Performance degradation

### 4. Release Tracking

Tag deployments with releases:

```bash
# In your deployment script
export APP_VERSION="1.2.0"
```

### 5. Source Maps

Upload source maps for better stack traces:

```bash
# Install Sentry CLI
npm install -g @sentry/cli

# Upload source maps
sentry-cli releases files $VERSION upload-sourcemaps ./dist
```

---

## 10. Monitoring & Alerts

### Recommended Alerts

Set up alerts in Sentry for:

1. **New Issue Created**
   - Get notified when a new type of error appears

2. **High Error Rate**
   - Alert when errors exceed 10 per minute

3. **Performance Degradation**
   - Alert when page load time > 3 seconds

4. **Critical Errors**
   - Immediate alert for database or API failures

### Integration with Slack/Email

1. Go to **Settings** → **Integrations**
2. Connect Slack or configure email alerts
3. Choose which alerts to receive

---

## 11. Privacy & Compliance

### Data Scrubbing

Sentry automatically scrubs:
- Passwords
- Credit card numbers
- Social security numbers

### GDPR Compliance

To be GDPR compliant:

1. **User Consent**
   ```javascript
   if (userConsentedToTracking) {
     sentryService.init();
   }
   ```

2. **Data Retention**
   - Set retention period in Sentry settings
   - Default: 90 days

3. **User Data Deletion**
   - Users can request data deletion
   - Use Sentry GDPR tools to comply

---

## 12. Cost & Limits

### Free Tier Includes:
- 5,000 errors/month
- 10,000 performance units/month
- 1 user
- 30 days data retention

### Paid Plans:
- **Team:** $26/month
  - 50,000 errors
  - 100,000 performance units
  - Unlimited users

- **Business:** $80/month
  - 500,000 errors
  - 1M performance units
  - Advanced features

---

## 13. Troubleshooting

### Sentry Not Initializing

**Check:**
1. `VITE_SENTRY_DSN` is set
2. Running in production/staging environment
3. Check browser console for Sentry logs

### Errors Not Appearing

**Verify:**
1. DSN is correct
2. Errors are being thrown
3. Check Sentry rate limits
4. Verify network isn't blocking Sentry domain

### Too Many Errors

**Solutions:**
1. Filter out noisy errors in `ignoreErrors` config
2. Lower sample rate
3. Fix underlying issues causing errors

---

## 14. Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [Sentry JavaScript SDK](https://docs.sentry.io/platforms/javascript/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Release Tracking](https://docs.sentry.io/product/releases/)

---

## Summary

✅ **Sentry is fully integrated** into FlagFit Pro
✅ **Automatic error tracking** in production
✅ **User context** attached to errors
✅ **Performance monitoring** enabled
✅ **Privacy-focused** with data scrubbing
✅ **Production-ready** with smart filtering

**Next Steps:**
1. Create Sentry account
2. Get your DSN
3. Add to Netlify environment variables
4. Deploy and monitor!

---

**Last Updated:** December 2, 2024
**Status:** Fully Implemented ✅
