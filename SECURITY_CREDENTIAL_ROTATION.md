# 🚨 CRITICAL: Credential Rotation Required

**Date**: 2025-11-29
**Status**: URGENT - Credentials Exposed in Version Control

## ⚠️ EXPOSED CREDENTIALS

The following credentials were found in `.env` and need immediate rotation:

### 1. Database Credentials
- **Service**: Neon Database (PostgreSQL)
- **Location**: `.env` line 2
- **Exposed**: Database URL with embedded password
- **Action Required**:
  1. Log into https://neon.tech
  2. Reset database password
  3. Update DATABASE_URL in environment variables
  4. Never commit the new URL to git

### 2. JWT Secret
- **Location**: `.env` line 43-44
- **Current**: `flagfit-pro-jwt-secret-key-2025-development`
- **Action Required**:
  1. Generate new secret: `openssl rand -base64 32`
  2. Update JWT_SECRET environment variable
  3. This will invalidate all existing sessions (users need to re-login)

### 3. Supabase Keys
- **Location**: `.env` lines 98, 102-103
- **Exposed**: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY
- **Action Required**:
  1. Log into https://supabase.com
  2. Go to Project Settings > API
  3. Generate new anon and service role keys
  4. Update environment variables

### 4. SendGrid API Key
- **Location**: `.env` line 147
- **Current**: Placeholder value (if real key is used, rotate it)
- **Action Required**:
  1. Log into https://sendgrid.com
  2. Go to Settings > API Keys
  3. Delete old key, create new one
  4. Update SENDGRID_API_KEY environment variable

### 5. Other API Keys
Review `.env` for any other API keys and rotate them all as a precaution.

---

## 📋 ROTATION CHECKLIST

### Immediate Actions (Within 24 hours)
- [ ] Rotate Neon database password
- [ ] Generate new JWT secret
- [ ] Rotate Supabase keys
- [ ] Rotate SendGrid API key (if used)
- [ ] Update all environment variables in:
  - [ ] Netlify dashboard (Settings > Environment Variables)
  - [ ] Local development `.env` file (DO NOT COMMIT)
  - [ ] Any CI/CD systems

### Git History Cleanup (Within 48 hours)
- [ ] Remove `.env` from git history using BFG Repo-Cleaner:
  ```bash
  # Install BFG
  brew install bfg  # macOS

  # Clone fresh repo
  git clone --mirror https://your-repo-url.git

  # Remove .env file from ALL commits
  bfg --delete-files .env your-repo.git

  # Clean and push
  cd your-repo.git
  git reflog expire --expire=now --all
  git gc --prune=now --aggressive
  git push --force
  ```

- [ ] Alternative: Use git filter-branch (slower but built-in):
  ```bash
  git filter-branch --force --index-filter \
    "git rm --cached --ignore-unmatch .env" \
    --prune-empty --tag-name-filter cat -- --all

  git push --force --all
  ```

### Prevention (Ongoing)
- [ ] Add pre-commit hook to prevent credential commits:
  ```bash
  # .husky/pre-commit or .git/hooks/pre-commit
  #!/bin/sh
  if git diff --cached --name-only | grep -q "^\.env$"; then
    echo "Error: Attempting to commit .env file!"
    echo "Please use environment-specific files instead."
    exit 1
  fi
  ```

- [ ] Use `.env.example` for documentation (safe to commit):
  ```bash
  # Copy .env to .env.example and replace values with placeholders
  cp .env .env.example
  # Edit .env.example to replace all real values with examples
  ```

- [ ] Move to secure secret management:
  - **Netlify**: Use Netlify Environment Variables
  - **AWS**: AWS Secrets Manager
  - **Azure**: Azure Key Vault
  - **GCP**: Google Secret Manager

---

## 🔐 SECURE SECRET GENERATION

### Generate Strong Secrets
```bash
# JWT Secret (32 bytes, base64)
openssl rand -base64 32

# API Key (hex, 64 characters)
openssl rand -hex 32

# Password (32 characters, alphanumeric)
LC_ALL=C tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 32
```

---

## ✅ VERIFICATION

After rotation, verify:
1. [ ] Application still works with new credentials
2. [ ] No credentials in git history: `git log --all --full-history --source --find-object=.env`
3. [ ] `.env` is in `.gitignore`
4. [ ] Netlify environment variables updated
5. [ ] Old credentials are revoked/deleted from services
6. [ ] Team members notified of rotation

---

## 📞 INCIDENT RESPONSE

If you suspect credentials were accessed:
1. Rotate ALL credentials immediately
2. Review database logs for unauthorized access
3. Review application logs for suspicious activity
4. Consider enabling 2FA on all service accounts
5. Notify users if data breach occurred (legal requirement in many jurisdictions)

---

## 🔗 RESOURCES

- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [GitHub: Removing Sensitive Data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
