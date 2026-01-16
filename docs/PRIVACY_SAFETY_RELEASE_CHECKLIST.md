# Privacy & Safety Release Gate Checklist

**Version:** 1.0.0  
**Last Updated:** 29. December 2025  
**Purpose:** Ensure privacy and safety controls are verified before every release

---

## Pre-Release Checklist

### ✅ Automated Tests (Must Pass)

```bash
# Run all privacy/safety tests
npm run test:privacy

# Expected output: All tests pass
```

| Test Suite | What It Proves | Command |
|------------|----------------|---------|
| `consent-gating.test.js` | Coaches can't see data without consent | `npx vitest run tests/privacy-safety/consent-gating.test.js` |
| `ai-opt-out.test.js` | AI fails fast when disabled | `npx vitest run tests/privacy-safety/ai-opt-out.test.js` |
| `deletion-lifecycle.test.js` | Deletion works correctly | `npx vitest run tests/privacy-safety/deletion-lifecycle.test.js` |
| `data-state.test.js` | No fake data shown as real | `npx vitest run tests/privacy-safety/data-state.test.js` |
| `age-gating.test.js` | 16+ gating enforced server-side | `npx vitest run tests/privacy-safety/age-gating.test.js` |

### ✅ Database Verification (Must Pass)

```bash
# Verify all required DB objects exist
npm run verify:db

# Expected output: ALL CHECKS PASSED
```

| Check | Requirement |
|-------|-------------|
| Consent Views | `v_load_monitoring_consent`, `v_workout_logs_consent` exist |
| ACWR Functions | All calculation functions exist |
| Triggers | `trigger_update_load_monitoring` attached |
| RLS Enabled | All privacy tables have RLS enabled |
| AI Fail-Fast | `require_ai_consent()` function exists |

### ✅ Manual Verification

- [ ] **Deletion Queue Health**: Backlog < 10
  ```sql
  SELECT COUNT(*) FROM account_deletion_requests 
  WHERE status = 'pending' AND scheduled_hard_delete_at <= NOW();
  ```

- [ ] **No Expired Records**: Should be 0
  ```sql
  SELECT COUNT(*) FROM emergency_medical_records 
  WHERE retention_expires_at <= NOW();
  ```

- [ ] **Recent Deletions Processed**: Check last 24h
  ```sql
  SELECT * FROM privacy_audit_log 
  WHERE action IN ('deletion_completed', 'deletion_failed')
  AND created_at > NOW() - INTERVAL '24 hours';
  ```

### ✅ Monitoring Verification

- [ ] Sentry is receiving events (no gaps)
- [ ] Privacy metrics dashboard is updating
- [ ] Alert thresholds are configured
- [ ] On-call rotation is active

---

## CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/privacy-checks.yml
name: Privacy & Safety Checks

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  privacy-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run Privacy Tests
        run: npm run test:privacy:ci
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          
      - name: Verify DB Objects
        run: npm run verify:db:ci
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

### Netlify Build Plugin (Optional)

Add to `netlify.toml`:

```toml
[[plugins]]
  package = "./plugins/privacy-check"
  
  [plugins.inputs]
    fail_build = true
```

---

## Quick Commands Reference

```bash
# Run all privacy tests
npm run test:privacy

# Run specific test
npx vitest run tests/privacy-safety/consent-gating.test.js

# Verify database objects
npm run verify:db

# Check deletion queue (via Supabase CLI)
supabase db execute --sql "SELECT status, COUNT(*) FROM account_deletion_requests GROUP BY status"

# Check consent metrics
supabase db execute --sql "SELECT ai_processing_enabled, COUNT(*) FROM privacy_settings GROUP BY 1"
```

---

## What to Do If Checks Fail

### Tests Failing

1. Check test output for specific failure
2. Review recent code changes
3. Check if DB migrations were applied
4. Run `npm run verify:db` to check DB state

### DB Verification Failing

1. Check which objects are missing
2. Apply missing migrations:
   ```bash
   supabase db push
   ```
3. Re-run verification

### Deletion Backlog Growing

1. Check Edge Function logs
2. Manually trigger processing:
   ```bash
   curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/process-deletions \
     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
   ```
3. See [ACCOUNT_DELETION.md](./RUNBOOKS/ACCOUNT_DELETION.md)

---

## Files Created in Chunk 4

| File | Purpose |
|------|---------|
| `tests/privacy-safety/README.md` | Test matrix and instructions |
| `tests/privacy-safety/consent-gating.test.js` | Consent enforcement tests |
| `tests/privacy-safety/ai-opt-out.test.js` | AI opt-out tests |
| `tests/privacy-safety/deletion-lifecycle.test.js` | Deletion workflow tests |
| `tests/privacy-safety/data-state.test.js` | Data state contract tests |
| `tests/privacy-safety/age-gating.test.js` | 16+ age gating tests |
| `scripts/verify-db-objects.cjs` | CI verification script |
| `docs/RUNBOOKS/ACCOUNT_DELETION.md` | Deletion operations runbook |
| `docs/RUNBOOKS/RETENTION_CLEANUP.md` | Retention cleanup runbook |
| `docs/RUNBOOKS/PRIVACY_INCIDENT.md` | Privacy incident runbook |
| `docs/MONITORING.md` | Monitoring & alerts plan |
| `netlify/functions/utils/privacy-logger.cjs` | Structured privacy logging |

---

## Related Documentation

- [PRIVACY_POLICY.md](./PRIVACY_POLICY.md) - User-facing privacy policy
- [SECURITY.md](./SECURITY.md) - Security documentation
- [MONITORING.md](./MONITORING.md) - Monitoring plan
- [RUNBOOKS/](./RUNBOOKS/) - Operational runbooks

---

## Approval Requirements

Before releasing to production:

- [ ] All automated tests pass
- [ ] DB verification passes
- [ ] Manual checks completed
- [ ] Code review approved
- [ ] Security review (for privacy-related changes)
- [ ] DPO sign-off (for GDPR-impacting changes)

---

**Document Version:** 1.0.0  
**Next Review:** March 2026

