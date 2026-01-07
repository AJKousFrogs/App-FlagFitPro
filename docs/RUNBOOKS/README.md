# Production Runbooks

Operational runbooks for FlagFit Pro production systems.

**Stack:** Angular 21 + Netlify Functions + Supabase

---

## Runbooks Index

| Runbook                                            | Purpose                         | When to Use                                |
| -------------------------------------------------- | ------------------------------- | ------------------------------------------ |
| [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md)     | Handle production incidents     | Site down, errors spiking, user reports    |
| [BACKUP_RESTORE.md](./BACKUP_RESTORE.md)           | Backup and restore data         | Before migrations, after data loss         |
| [DEPLOYMENT_ROLLBACK.md](./DEPLOYMENT_ROLLBACK.md) | Rollback bad deployments        | Deploy breaks production                   |
| [LOGGING_REDACTION.md](./LOGGING_REDACTION.md)     | Investigate logs safely         | Debugging, audits, PII handling            |
| [ACCOUNT_DELETION.md](./ACCOUNT_DELETION.md)       | Handle deletion queue issues    | Backlog growing, failures, user complaints |
| [RETENTION_CLEANUP.md](./RETENTION_CLEANUP.md)     | Handle retention/cleanup issues | Expired records, cleanup failures          |
| [PRIVACY_INCIDENT.md](./PRIVACY_INCIDENT.md)       | Handle privacy incidents        | Consent violations, data breaches          |

---

## Quick Start

### Something is broken right now?

1. **Check health:** `curl https://your-app.netlify.app/.netlify/functions/health | jq`
2. **If unhealthy:** Go to [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md)
3. **If recent deploy:** Go to [DEPLOYMENT_ROLLBACK.md](./DEPLOYMENT_ROLLBACK.md)

### Need to rollback?

```bash
# Quick rollback to previous deploy
netlify rollback

# Verify
curl https://your-app.netlify.app/.netlify/functions/health | jq
```

See [DEPLOYMENT_ROLLBACK.md](./DEPLOYMENT_ROLLBACK.md) for details.

### Need to restore data?

1. **Check backups:** `ls backups/`
2. **Follow:** [BACKUP_RESTORE.md](./BACKUP_RESTORE.md)

### Need to investigate logs?

1. **Check function logs:** `netlify logs:function FUNCTION_NAME`
2. **Follow:** [LOGGING_REDACTION.md](./LOGGING_REDACTION.md)

---

## Key Health Check Endpoints

| Endpoint                                      | Purpose               | Auth |
| --------------------------------------------- | --------------------- | ---- |
| `/.netlify/functions/health`                  | Overall system health | No   |
| `/.netlify/functions/dashboard?action=health` | Dashboard service     | No   |
| `/.netlify/functions/coach?action=health`     | Coach API             | No   |

### Health Check Response

```json
{
  "status": "healthy",
  "timestamp": "2025-12-29T...",
  "checks": {
    "database": { "status": "healthy", "latency": 45 },
    "auth": { "status": "healthy" }
  }
}
```

| Status      | Meaning                 | Action            |
| ----------- | ----------------------- | ----------------- |
| `healthy`   | All systems operational | None              |
| `degraded`  | Some systems impaired   | Investigate       |
| `unhealthy` | Critical failure        | Incident response |

---

## Essential Commands

```bash
# Health check
curl -s https://your-app.netlify.app/.netlify/functions/health | jq

# View function logs
netlify logs:function health --last 50

# Quick rollback
netlify rollback

# Database backup
supabase db dump -f backups/backup_$(date +%Y%m%d).sql

# List recent deploys
netlify deploys --json | jq '.[:5]'
```

---

## Contacts

| Role             | Contact                      |
| ---------------- | ---------------------------- |
| On-call Engineer | [Your contact method]        |
| Netlify Support  | https://answers.netlify.com  |
| Supabase Support | https://supabase.com/support |
| Security Issues  | merlin@ljubljanafrogs.si     |

---

## Related Documentation

- [SECURITY.md](../SECURITY.md) - Security policies and patterns
- [TROUBLESHOOTING.md](../TROUBLESHOOTING.md) - Common issues

---

**Last Updated:** 29. December 2025
