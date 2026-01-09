# Load Testing Guide - FlagFit Pro Logging System

## Quick Start

### 1. Install Artillery

```bash
npm install --save-dev artillery
```

### 2. Start the Development Server

```bash
# Terminal 1: Start backend API
npm run dev:api

# Terminal 2: Start Angular frontend (optional, for full UI testing)
npm run dev:angular
```

### 3. Run Load Test

```bash
# Run full load test (50 concurrent users, 5 minutes)
npm run test:load:logging

# Generate HTML report
npm run test:load:logging:report

# Quick test (for rapid validation)
npm run test:load:logging:quick
```

---

## What the Test Does

The load test simulates **50 concurrent users** performing real-world logging workflows:

### Scenario 1: Login-to-Log Flow (50% of traffic)

1. User logs in
2. Loads dashboard
3. Opens training log form
4. Submits a training session
5. Verifies ACWR update

**Target:** All steps complete in <2 seconds

### Scenario 2: Bulk Session Logging (30% of traffic)

- Coach logs multiple sessions rapidly
- Simulates batch data entry
- Tests database write throughput

### Scenario 3: Analytics Queries (20% of traffic)

- Heavy read operations
- Dashboard loading
- Performance analytics
- Training history retrieval

---

## Success Criteria

✅ **Response Time:** <2 seconds for 95th percentile  
✅ **Error Rate:** <1%  
✅ **Throughput:** ≥25 requests/second  
✅ **No Crashes:** System remains stable under load

---

## Reading the Results

### Terminal Output

```
Phase started: Peak load - 50 concurrent users (index: 1, duration: 180s)
...
All VUs finished. Total time: 5 minutes

Metrics:
  http.request_rate: ..................... 50/sec
  http.requests: ......................... 15000
  http.responses: ........................ 14985
  http.response_time:
    min: ................................ 142ms
    max: ................................ 1847ms
    median: ............................. 456ms
    p95: ................................ 892ms  ✅ <2000ms
    p99: ................................ 1234ms
  errors.total: .......................... 15 (0.1%)  ✅ <1%
```

### HTML Report

Open `tests/load/report.html` to see:

- Request rate over time (graph)
- Response time distribution
- Error breakdown by endpoint
- Latency percentiles

---

## Troubleshooting

### High Response Times (>2s)

**Causes:**

1. Database not optimized (missing indexes)
2. Too many concurrent connections
3. Inefficient queries

**Solutions:**

```bash
# Verify database indexes
npm run verify:db

# Check for slow queries in logs
grep "slow query" logs/api.log

# Increase Supabase connection pool
# Edit .env: SUPABASE_POOL_SIZE=20
```

### High Error Rate (>1%)

**Common Errors:**

- 401 Unauthorized: Check test user credentials
- 429 Too Many Requests: Rate limiting triggered
- 500 Server Error: Backend crash

**Solutions:**

```bash
# Check API logs
tail -f logs/api.log

# Verify Supabase connection
node scripts/diagnostic-system.js

# Restart services
npm run dev
```

### Connection Refused

**Fix:** Ensure backend is running on port 3000

```bash
lsof -i :3000  # Check if port is in use
npm run dev:api  # Restart backend
```

---

## Advanced Configuration

### Modify Load Test Parameters

Edit `artillery-logging-test.yml`:

```yaml
config:
  phases:
    - duration: 180 # Increase duration (seconds)
      arrivalRate: 100 # Increase concurrent users
```

### Add Custom Scenarios

```yaml
scenarios:
  - name: "Your Custom Scenario"
    flow:
      - post:
          url: "/api/your-endpoint"
          json: { your: "data" }
```

### Test Different Environments

```bash
# Test staging
TARGET=https://staging.flagfit.com npm run test:load:logging

# Test production (use with caution!)
TARGET=https://flagfit.com npm run test:load:logging
```

---

## Manual Testing (Browser DevTools)

If you prefer manual testing:

### Chrome DevTools Performance

1. Open DevTools → **Performance** tab
2. Set throttling:
   - CPU: 4× slowdown
   - Network: Fast 3G
3. Click **Record**
4. Navigate through app:
   - Login → Dashboard → Training Log → Submit
5. Stop recording
6. Analyze metrics:
   - **Time to Interactive (TTI):** <3s
   - **Largest Contentful Paint (LCP):** <2.5s
   - **First Input Delay (FID):** <100ms

### Lighthouse Audit

```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run audit
lighthouse http://localhost:4200 --view

# Expected scores:
# Performance: >90
# Accessibility: >95
# Best Practices: 100
```

---

## CI/CD Integration

### GitHub Actions

Add to `.github/workflows/load-test.yml`:

```yaml
name: Load Test
on:
  pull_request:
    branches: [main]
  schedule:
    - cron: "0 2 * * *" # Daily at 2 AM

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "22"

      - name: Install dependencies
        run: |
          npm ci
          npm install -g artillery

      - name: Start services
        run: |
          npm run dev:api &
          sleep 10

      - name: Run load test
        run: npm run test:load:logging

      - name: Upload report
        uses: actions/upload-artifact@v3
        with:
          name: load-test-report
          path: tests/load/report.html
```

---

## Monitoring in Production

### Set Up Real User Monitoring (RUM)

Add to `angular/src/main.ts`:

```typescript
// Track API performance
window.performance.addEventListener("measure", (event) => {
  if (event.detail.name.startsWith("api-")) {
    const duration = event.detail.duration;
    if (duration > 2000) {
      console.warn(`Slow API call: ${event.detail.name} - ${duration}ms`);
      // Send to analytics service
      analytics.track("slow_api", { endpoint: event.detail.name, duration });
    }
  }
});
```

### Set Up Alerts

```javascript
// In your monitoring service (e.g., Sentry, Datadog)
if (apiResponseTime > 2000) {
  sendAlert({
    severity: "warning",
    message: `API response time exceeded threshold: ${apiResponseTime}ms`,
    endpoint: requestUrl,
  });
}
```

---

## Results Interpretation

### ✅ PASS Example

```
✅ Threshold Checks:
Error rate: 0.12% ✅ (<1%)
P95 latency: 876ms ✅ (<2000ms)

All endpoints meeting <2s target:
- /api/auth/login: 423ms (median)
- /api/training/sessions: 678ms (median)
- /api/acwr: 541ms (median)
```

**Action:** No changes needed. System performs well under load.

### ❌ FAIL Example

```
❌ Threshold Checks:
Error rate: 3.4% ❌ (>1%)
P95 latency: 3127ms ❌ (>2000ms)

Slow endpoints:
- /api/training/sessions: 2847ms (median) ❌
- /api/acwr: 3201ms (median) ❌
```

**Action Required:**

1. Investigate database indexes on `training_sessions` table
2. Optimize ACWR calculation query
3. Consider caching ACWR results
4. Review backend logs for bottlenecks

---

## Next Steps

After successful load testing:

1. ✅ Mark load test as passing in CI/CD
2. ✅ Set up automated nightly load tests
3. ✅ Configure production monitoring
4. ✅ Document performance baselines
5. ✅ Schedule quarterly load test reviews

---

## Support

**Questions?** Check:

- `docs/LOGGING_AUDIT_REPORT.md` - Full audit findings
- `docs/PERFORMANCE.md` - Performance optimization guide
- Backend logs: `logs/api.log`
- Frontend errors: Browser console

**Issues?** Run diagnostics:

```bash
npm run diagnostics:health
```

---

**Last Updated:** January 9, 2026  
**Version:** 1.0.0
