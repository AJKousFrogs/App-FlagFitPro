# 🔒 Environment Variable Security Guide

## 🚨 **Critical Security Rules**

### ❌ **NEVER Commit .env Files**
```bash
# ✅ GOOD - .env is in .gitignore
.env
.env.local  
.env.test
.env.production

# ❌ BAD - These would expose secrets
# .env files should NEVER appear in git status
git status  # Should NOT show .env files
```

### 🔍 **Check .gitignore Status**
```bash
# Verify .env is properly ignored
git check-ignore .env  # Should return: .env

# If .env shows in git status, add to .gitignore immediately
echo ".env" >> .gitignore
```

## 📋 **Required Environment Variables**

### **🔴 Critical (Required for App Function)**
```bash
# Database Connection (REQUIRED)
DATABASE_URL=postgresql://username:password@host:port/database

# MCP Services (REQUIRED for AI features)
CONTEXT7_API_KEY=your_context7_api_key_here
```

### **🟡 Important (Recommended for Full Features)**
```bash
# Application Configuration
VITE_APP_NAME="Your App Name"
VITE_APP_VERSION="1.0.7"  
VITE_APP_ENVIRONMENT=development

# Development Server
VITE_DEV_PORT=4000
VITE_HMR_PORT=4000
```

### **🟢 Optional (Development Enhancement)**
```bash
# File Watching (for problematic environments)
VITE_USE_POLLING=false
VITE_WATCH_INTERVAL=100

# Development Tools
VITE_ENABLE_DEVTOOLS=true
VITE_ENABLE_MCP=true
```

## 👥 **Team Coordination**

### **Adding New Environment Variables**
1. **Update .env.example** (safe to commit):
   ```bash
   # Add new variable to .env.example
   echo "NEW_VARIABLE=example_value_here" >> .env.example
   ```

2. **Communicate to Team**:
   ```bash
   # Create clear commit message
   git add .env.example
   git commit -m "feat: add NEW_VARIABLE to environment config
   
   Team: Please add NEW_VARIABLE=your_actual_value to your .env file
   Purpose: Enables new feature X
   Required: Yes/No"
   ```

3. **Document in README/DEVELOPMENT.md**:
   - What the variable does
   - How to obtain the value
   - Whether it's required or optional

### **Team Onboarding Checklist**
```bash
# 1. Copy environment template
cp .env.example .env

# 2. Fill in required values
# Edit .env with team-specific values

# 3. Verify environment
npm run doctor

# 4. Test application starts
npm run dev
```

## 🛡️ **Security Best Practices**

### **Protect Sensitive Values**
```bash
# ❌ NEVER commit these types of values:
DATABASE_PASSWORD=secret123
API_KEY=sk-1234567890abcdef
JWT_SECRET=supersecretkey
PRIVATE_KEY=-----BEGIN PRIVATE KEY-----

# ✅ Use placeholder values in .env.example:
DATABASE_PASSWORD=your_database_password_here
API_KEY=your_api_key_here
JWT_SECRET=generate_random_secret_here
```

### **Environment-Specific Files**
```bash
# Different environments, different files:
.env.development     # Local development
.env.staging        # Staging environment  
.env.production     # Production environment

# All should be in .gitignore!
```

### **Validation & Error Handling**
```javascript
// In your app, validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'CONTEXT7_API_KEY'
];

requiredEnvVars.forEach(varName => {
  if (!import.meta.env[varName]) {
    console.error(`❌ Missing required environment variable: ${varName}`);
    console.log('💡 Check your .env file and .env.example for guidance');
  }
});
```

## 🔧 **Environment Commands**

```bash
# Check environment setup
npm run doctor                    # Full environment check
npm run check:env                # Quick environment validation

# Environment file management  
cp .env.example .env             # Create .env from template
cp .env .env.backup              # Backup current .env
diff .env.example .env           # Compare files for missing vars

# Security checks
git check-ignore .env            # Verify .env is ignored
git status                       # Should NOT show .env files
```

## 🚨 **Emergency Response**

### **If .env Was Accidentally Committed**
```bash
# 1. IMMEDIATELY remove from git
git rm --cached .env
git commit -m "Remove accidentally committed .env file"

# 2. Ensure .gitignore includes .env
echo ".env" >> .gitignore
git add .gitignore
git commit -m "Add .env to .gitignore"

# 3. ROTATE ALL SECRETS in the exposed .env
# Change all API keys, passwords, database URLs, etc.

# 4. Force push if repository is private and no one else pulled
git push --force-with-lease origin main  # CAREFUL!
```

### **If Secrets Were Exposed**
1. **Immediately rotate/regenerate all exposed credentials**
2. **Check access logs for unauthorized usage**  
3. **Inform team of security incident**
4. **Update .env.example with new placeholder values**

## 📚 **Documentation Requirements**

### **For Each Environment Variable**
Document in `.env.example`:
```bash
# Supabase Configuration (REQUIRED)
# Get from: https://supabase.com dashboard → Settings → API
# Project URL
SUPABASE_URL=https://your-project.supabase.co
# Anonymous/public key (safe for frontend)
SUPABASE_ANON_KEY=your_supabase_anon_key_here
# Service role key (backend only, never expose to frontend)
SUPABASE_SERVICE_KEY=your_supabase_service_key_here

# Context7 API Key (REQUIRED for AI features)  
# Get from: https://context7.ai dashboard → API keys
# Required scope: library-access, document-retrieval
CONTEXT7_API_KEY=your_context7_api_key_here
```

### **Team Communication Template**
```markdown
## New Environment Variable: VARIABLE_NAME

**Purpose**: Brief description of what this enables
**Required**: Yes/No  
**How to get**: Step-by-step instructions
**Example**: Safe example value
**Related**: Links to documentation

**Action Required**: 
- [ ] Add to your .env file
- [ ] Test with `npm run dev`
- [ ] Verify with `npm run doctor`
```

---

## ✅ **Security Checklist**

- [ ] `.env` file exists and contains required variables
- [ ] `.env` is listed in `.gitignore`  
- [ ] `.env` does NOT appear in `git status`
- [ ] `.env.example` is up-to-date with all variables
- [ ] No secrets are hardcoded in source code
- [ ] Team knows how to obtain required credentials
- [ ] Environment validation works (`npm run doctor`)

**Remember**: Environment security is everyone's responsibility! 🔒