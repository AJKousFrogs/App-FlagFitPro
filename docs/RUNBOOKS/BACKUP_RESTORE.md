# Backup & Restore Runbook

**Version:** 1.0.0  
**Last Updated:** 29. December 2025  
**Stack:** Angular 21 + Netlify Functions + Supabase

---

## Table of Contents

1. [Backup Strategy Overview](#backup-strategy-overview)
2. [Triggers](#triggers)
3. [Backup Procedures](#backup-procedures)
4. [Restore Procedures](#restore-procedures)
5. [Validation Steps](#validation-steps)
6. [Post-Restore Tasks](#post-restore-tasks)

---

## Backup Strategy Overview

### What Gets Backed Up

| Component             | Backup Method        | Frequency         | Retention                    |
| --------------------- | -------------------- | ----------------- | ---------------------------- |
| **Supabase Database** | Automatic (Supabase) | Daily             | 7 days (Free), 30 days (Pro) |
| **Supabase Database** | Manual SQL dump      | Before migrations | 90 days                      |
| **Netlify Deploys**   | Automatic (Netlify)  | Every deploy      | Unlimited                    |
| **Source Code**       | Git                  | Every commit      | Unlimited                    |
| **Environment Vars**  | Manual export        | Monthly           | Secure storage               |

### What Does NOT Get Backed Up Automatically

- Supabase Storage files (manual backup required)
- Edge Function secrets
- Custom domain DNS settings

---

## Triggers

### When to Create Manual Backup

- **Before** any database migration
- **Before** major feature deployments
- **Before** bulk data operations
- **Monthly** scheduled backup for env vars
- **After** significant data imports

### When to Restore

- Database corruption detected
- Accidental data deletion
- Failed migration needs rollback
- Security incident requires point-in-time recovery

---

## Backup Procedures

### Procedure 1: Database Backup (SQL Dump)

#### Via Supabase CLI

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Create backup with timestamp
supabase db dump -f backups/backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup was created
ls -la backups/
head -50 backups/backup_*.sql
```

#### Via Direct psql

```bash
# Get connection string from Supabase Dashboard → Settings → Database

# Create backup
pg_dump "postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres" \
  --no-owner \
  --no-privileges \
  -f backups/backup_$(date +%Y%m%d_%H%M%S).sql

# For specific tables only
pg_dump "postgresql://..." \
  --table=users \
  --table=workout_logs \
  --table=training_sessions \
  -f backups/backup_partial_$(date +%Y%m%d_%H%M%S).sql
```

### Procedure 2: Environment Variables Backup

```bash
# Create env backup directory
mkdir -p backups/env

# Export Netlify env vars
netlify env:list > backups/env/netlify_env_$(date +%Y%m%d).txt

# IMPORTANT: Store securely (encrypted) - contains secrets!
# Consider using a secrets manager for production

# Verify backup
cat backups/env/netlify_env_*.txt | grep -v "KEY\|SECRET" | head -20
```

### Procedure 3: Supabase Storage Backup

```bash
# List all buckets
curl "https://[PROJECT_REF].supabase.co/storage/v1/bucket" \
  -H "Authorization: Bearer [SERVICE_KEY]" | jq

# Download files from a bucket (example for 'avatars' bucket)
# Note: For large buckets, use Supabase SDK in a script

# Create backup script
cat > scripts/backup-storage.js << 'EOF'
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function backupBucket(bucketName) {
  const { data: files } = await supabase.storage.from(bucketName).list();

  for (const file of files) {
    const { data } = await supabase.storage.from(bucketName).download(file.name);
    const buffer = Buffer.from(await data.arrayBuffer());

    const backupPath = `backups/storage/${bucketName}/${file.name}`;
    fs.mkdirSync(path.dirname(backupPath), { recursive: true });
    fs.writeFileSync(backupPath, buffer);
  }

  console.log(`Backed up ${files.length} files from ${bucketName}`);
}

backupBucket('avatars');
EOF

# Run backup
node scripts/backup-storage.js
```

### Procedure 4: Pre-Migration Backup Checklist

```bash
# 1. Create database backup
supabase db dump -f backups/pre_migration_$(date +%Y%m%d_%H%M%S).sql

# 2. Verify backup is valid
psql "postgresql://..." -c "\dt" < /dev/null

# 3. Document current state
supabase db dump --schema-only -f backups/schema_before_migration.sql

# 4. Record row counts for critical tables
psql "postgresql://..." -c "
SELECT
  'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL SELECT 'workout_logs', COUNT(*) FROM workout_logs
UNION ALL SELECT 'training_sessions', COUNT(*) FROM training_sessions
UNION ALL SELECT 'player_programs', COUNT(*) FROM player_programs;
" > backups/row_counts_before.txt

# 5. Save backup location
echo "Backup created: backups/pre_migration_$(date +%Y%m%d_%H%M%S).sql" >> backups/backup_log.txt
```

---

## Restore Procedures

### Procedure 1: Restore from Supabase Point-in-Time (Pro Plan)

1. Go to Supabase Dashboard → Settings → Database
2. Click "Restore" under Point-in-Time Recovery
3. Select the target timestamp
4. Confirm restoration

**Note:** This replaces the entire database. All changes after the restore point are lost.

### Procedure 2: Restore from SQL Dump

```bash
# 1. Create backup of current state FIRST
supabase db dump -f backups/pre_restore_$(date +%Y%m%d_%H%M%S).sql

# 2. Connect to database
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"

# 3. Option A: Restore entire database (DESTRUCTIVE)
# WARNING: This drops all existing data
psql "postgresql://..." < backups/backup_YYYYMMDD_HHMMSS.sql

# 3. Option B: Restore specific tables only
psql "postgresql://..." << 'EOF'
-- Disable triggers temporarily
SET session_replication_role = 'replica';

-- Truncate and restore specific table
TRUNCATE TABLE workout_logs CASCADE;
-- Then run the relevant INSERT statements from backup

-- Re-enable triggers
SET session_replication_role = 'origin';
EOF
```

### Procedure 3: Restore Specific Data (Selective)

```bash
# 1. Extract specific table data from backup
grep -A 1000 "COPY public.workout_logs" backups/backup_file.sql | \
  grep -B 1000 "^\\\.$" > backups/workout_logs_only.sql

# 2. Review extracted data
head -50 backups/workout_logs_only.sql

# 3. Restore to database
psql "postgresql://..." < backups/workout_logs_only.sql
```

### Procedure 4: Restore Environment Variables

```bash
# 1. Review backup
cat backups/env/netlify_env_YYYYMMDD.txt

# 2. Set variables one by one (safer)
netlify env:set VARIABLE_NAME "value"

# 3. Or import from file (if using dotenv format)
# Note: Netlify CLI doesn't support bulk import directly
# Use a script:

cat > scripts/restore-env.sh << 'EOF'
#!/bin/bash
while IFS='=' read -r key value; do
  if [[ -n "$key" && ! "$key" =~ ^# ]]; then
    netlify env:set "$key" "$value"
  fi
done < backups/env/netlify_env_YYYYMMDD.txt
EOF

chmod +x scripts/restore-env.sh
./scripts/restore-env.sh
```

### Procedure 5: Rollback Netlify Deploy

See [DEPLOYMENT_ROLLBACK.md](./DEPLOYMENT_ROLLBACK.md) for detailed steps.

```bash
# Quick rollback to previous deploy
netlify rollback
```

---

## Validation Steps

### After Database Restore

```bash
# 1. Check database connectivity
curl -s https://your-app.netlify.app/.netlify/functions/health | jq '.checks.database'
# Expected: { "status": "healthy" }

# 2. Verify table row counts
psql "postgresql://..." -c "
SELECT
  'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL SELECT 'workout_logs', COUNT(*) FROM workout_logs
UNION ALL SELECT 'training_sessions', COUNT(*) FROM training_sessions;
"

# 3. Compare with pre-restore counts
diff backups/row_counts_before.txt <(psql "postgresql://..." -c "...")

# 4. Test authentication flow
curl -X POST https://your-app.netlify.app/.netlify/functions/auth-login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword"}'

# 5. Test data retrieval
curl https://your-app.netlify.app/.netlify/functions/dashboard \
  -H "Authorization: Bearer TOKEN" | jq '.success'
```

### After Environment Restore

```bash
# 1. List current env vars
netlify env:list

# 2. Test function that uses restored vars
curl https://your-app.netlify.app/.netlify/functions/health | jq

# 3. Trigger a redeploy to pick up new vars
netlify deploy --prod
```

### After Storage Restore

```bash
# 1. List restored files
curl "https://[PROJECT_REF].supabase.co/storage/v1/bucket/avatars/objects" \
  -H "Authorization: Bearer [SERVICE_KEY]" | jq

# 2. Test file access from frontend
# Open app and verify images load correctly
```

---

## Post-Restore Tasks

### Immediate

- [ ] Verify health check passes
- [ ] Test critical user flows (login, dashboard, data save)
- [ ] Check error tracking for new issues
- [ ] Notify team of restore completion

### Within 24 Hours

- [ ] Document what was restored and why
- [ ] Review data integrity (spot check records)
- [ ] Update backup log with restore event
- [ ] Create fresh backup of restored state

### Follow-up

- [ ] Investigate root cause of data loss/corruption
- [ ] Implement preventive measures
- [ ] Update backup procedures if gaps found
- [ ] Review backup retention policy

---

## Backup Schedule Template

### Daily (Automated)

| Task                      | Time        | Owner      |
| ------------------------- | ----------- | ---------- |
| Supabase automatic backup | 00:00 UTC   | Supabase   |
| Health check verification | Every 5 min | Monitoring |

### Weekly (Manual)

| Task                    | Day    | Owner   |
| ----------------------- | ------ | ------- |
| Verify backup integrity | Monday | On-call |
| Test restore procedure  | Friday | DevOps  |

### Monthly

| Task                     | Week   | Owner  |
| ------------------------ | ------ | ------ |
| Environment vars backup  | Week 1 | DevOps |
| Storage backup           | Week 2 | DevOps |
| Backup retention cleanup | Week 4 | DevOps |

---

## Quick Reference

### Backup Commands

```bash
# Database backup
supabase db dump -f backups/backup_$(date +%Y%m%d_%H%M%S).sql

# Schema only
supabase db dump --schema-only -f backups/schema.sql

# Env vars backup
netlify env:list > backups/env/netlify_env_$(date +%Y%m%d).txt
```

### Restore Commands

```bash
# Restore database
psql "postgresql://..." < backups/backup_YYYYMMDD.sql

# Rollback deploy
netlify rollback

# Set env var
netlify env:set KEY "value"
```

### Backup Locations

| Type             | Location                   | Retention |
| ---------------- | -------------------------- | --------- |
| SQL dumps        | `backups/`                 | 90 days   |
| Schema snapshots | `backups/`                 | 90 days   |
| Env var exports  | `backups/env/` (encrypted) | 90 days   |
| Storage backups  | `backups/storage/`         | 30 days   |

---

**Document Version:** 1.0.0  
**Next Review:** March 2026
