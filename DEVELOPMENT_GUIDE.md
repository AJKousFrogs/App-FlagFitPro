# 🚀 FlagFit Pro - Development Guide

_Complete setup, environment configuration, and deployment guide_

---

## 📋 Quick Start

### **1. Clone and Setup**

```bash
# Clone repository
git clone https://github.com/AJKous31/app-new-flag.git
cd flag-football-app

# Create .env.local file (if it doesn't exist)
# The file should already exist with Supabase credentials
# If not, create it and add your API keys
```

### **2. Essential Environment Variables**

```bash
# Database (REQUIRED)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_role_key_here

# Security (REQUIRED)
JWT_SECRET=your_secure_jwt_secret_minimum_32_characters
CSRF_SECRET=your_csrf_secret_here

# Analytics (RECOMMENDED)
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
VITE_SENTRY_DSN=https://your-sentry-dsn
```

### **3. Install Dependencies**

```bash
npm install
# or
yarn install
```

### **4. Start Development Server**

```bash
npm run dev
# Server runs at http://localhost:5173
```

---

## 🔑 Environment Configuration

### **Core Infrastructure Setup**

#### **Supabase (Database & Auth)**

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → API
4. Copy:
   - Project URL → `SUPABASE_URL`
   - Anon public key → `SUPABASE_ANON_KEY`
   - Service role key → `SUPABASE_SERVICE_KEY`

**Database Schema:**

```sql
-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  position VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Training sessions
CREATE TABLE training_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  session_type VARCHAR(100) NOT NULL,
  duration INTEGER,
  performance_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### **Analytics & Monitoring**

**Google Analytics 4**

1. Go to [analytics.google.com](https://analytics.google.com)
2. Create property for your app
3. Get Measurement ID → `VITE_GOOGLE_ANALYTICS_ID`

**Sentry (Error Tracking)**

1. Sign up at [sentry.io](https://sentry.io)
2. Create new project
3. Copy DSN → `VITE_SENTRY_DSN`

#### **AI & ML Services**

**OpenAI (Performance Predictions)**

1. Go to [platform.openai.com](https://platform.openai.com)
2. Create API key
3. Add to `OPENAI_API_KEY`

---

## 🛠️ Development Configuration

### **Environment Files Structure**

```
project-root/
├── .env.example          # Template with all variables
├── .env.local           # Your development settings
├── .env.staging         # Staging environment
├── .env.production      # Production (never commit)
└── .env.test           # Testing configuration
```

### **Development Environment (.env.local)**

The `.env.local` file is automatically loaded by dev servers (`dev-server.cjs` and `dev-server-enhanced.cjs`) using dotenv.

```bash
# Supabase Configuration (REQUIRED)
SUPABASE_URL=https://pvziciccwxgftcielknm.supabase.co
SUPABASE_ANON_KEY=sb_publishable_4mRqHbz4cFVXzpDi8nJc3A_rknKjryk
SUPABASE_SERVICE_KEY=sb_secret_ZbZdfro3oCkX1wAiyYg__g_SUrhZI1R

# Vite environment variables (for frontend)
VITE_SUPABASE_URL=https://pvziciccwxgftcielknm.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_4mRqHbz4cFVXzpDi8nJc3A_rknKjryk

# Development Mode
NODE_ENV=development
VITE_APP_ENV=development

# Security (if needed)
JWT_SECRET=dev_jwt_secret_minimum_32_characters_long
CSRF_SECRET=dev_csrf_secret_here

# Analytics (Optional in dev)
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
VITE_SENTRY_DSN=https://your-sentry-dsn

# AI Features (Optional)
OPENAI_API_KEY=sk-your-openai-key

# Development Features
VITE_ENABLE_MOCK_DATA=true
VITE_ENABLE_DEBUG_LOGS=true
VITE_API_BASE_URL=http://localhost:4000
```

**Note:** Dev servers automatically:
- Load `.env.local` on startup
- Inject variables into `window._env` for frontend
- Set them in `localStorage` for development (localhost only)

### **Testing Configuration (.env.test)**

```bash
# Test Environment
NODE_ENV=test
VITE_APP_ENV=test

# Test Database (separate from dev)
SUPABASE_URL=https://test-project.supabase.co
SUPABASE_ANON_KEY=test_anon_key
SUPABASE_SERVICE_KEY=test_service_key

# Test Settings
VITE_ENABLE_TESTING_MODE=true
VITE_MOCK_API_DELAY=100
JWT_SECRET=test_jwt_secret_for_testing_only

# Cypress E2E
CYPRESS_BASE_URL=http://localhost:4173
```

---

## 🚀 Deployment Guide

### **Pre-Deployment Checklist**

#### **✅ Code Ready for Production:**

- [x] All environment variables configured
- [x] Database migrations applied
- [x] Security headers implemented
- [x] Error tracking configured
- [x] Performance optimizations applied
- [x] Tests passing
- [x] Bundle size optimized

#### **✅ Security Verification:**

- [x] No hardcoded secrets in code
- [x] HTTPS enforced
- [x] CORS properly configured
- [x] JWT secrets are secure (32+ chars)
- [x] Input validation implemented
- [x] XSS protection enabled

### **Netlify Deployment**

#### **Step 1: Repository Setup**

1. Push code to GitHub:

```bash
git add .
git commit -m "Production ready deployment"
git push origin main
```

#### **Step 2: Netlify Configuration**

**netlify.toml**

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"
  NPM_VERSION = "9"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.openai.com;"
```

#### **Step 3: Environment Variables in Netlify**

**Required Variables:**

```bash
# Core
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_KEY=your_production_service_key
JWT_SECRET=your_production_jwt_secret_32_chars_minimum

# Analytics
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
VITE_SENTRY_DSN=https://your-production-sentry-dsn

# Production Settings
NODE_ENV=production
VITE_APP_ENV=production
VITE_ENABLE_MOCK_DATA=false
VITE_ENABLE_DEBUG_LOGS=false
```

#### **Step 4: Deploy Process**

1. **Connect Repository:**
   - Go to Netlify Dashboard
   - New site from Git
   - Connect GitHub repository

2. **Build Settings:**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Branch: `main`

3. **Deploy:**
   - Netlify auto-deploys on push to main
   - Monitor build logs for errors
   - Site goes live at: `https://your-site-name.netlify.app`

### **Alternative Deployment Options**

For other hosting platforms, configure build settings according to their documentation. Ensure:
- Build command: `cd angular && npm run build`
- Output directory: `angular/dist/flagfit-pro`
- Environment variables are properly configured

---

## 🧪 Testing & Quality Assurance

### **Running Tests**

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage

# Lint code
npm run lint

# Type checking
npm run type-check
```

### **Pre-Production Testing Checklist**

#### **Functionality Testing:**

- [ ] User registration/login works
- [ ] Dashboard loads with real data
- [ ] Training modules function correctly
- [ ] Analytics tracking active
- [ ] All forms submit properly
- [ ] File uploads work
- [ ] Search functionality active

#### **Performance Testing:**

- [ ] Page load time < 2 seconds
- [ ] Lighthouse score > 90
- [ ] Bundle size optimized
- [ ] Images compressed and lazy-loaded
- [ ] API responses < 500ms

#### **Security Testing:**

- [ ] No console errors in production
- [ ] JWT tokens working properly
- [ ] CORS configured correctly
- [ ] XSS protection active
- [ ] Input validation working

#### **Mobile Testing:**

- [ ] Responsive design works
- [ ] Touch interactions smooth
- [ ] Forms prevent zoom
- [ ] Bottom navigation accessible
- [ ] Safe areas respected

---

## 🔧 Troubleshooting

### **Common Development Issues**

#### **Database Connection Failed**

```bash
# Check environment variables
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY

# Test connection
curl -H "apikey: $SUPABASE_ANON_KEY" $SUPABASE_URL/rest/v1/
```

#### **Build Failures**

```bash
# Clear cache
npm run clean
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run type-check

# Check bundle size
npm run build -- --analyze
```

#### **Authentication Issues**

```bash
# Verify JWT secret length
node -e "console.log(process.env.JWT_SECRET?.length || 'Not set')"
# Should be 32+ characters

# Test token generation
curl -X POST localhost:5173/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"demo123"}'
```

### **Production Deployment Issues**

#### **Site Not Loading**

1. Check Netlify build logs
2. Verify environment variables are set
3. Check for console errors in browser
4. Verify API endpoints are accessible

#### **API Calls Failing**

1. Check CORS configuration
2. Verify API base URL in environment
3. Check Supabase service status
4. Test API endpoints directly

---

## 📊 Monitoring & Analytics

### **Production Monitoring Setup**

**Error Tracking (Sentry):**

```javascript
// main.js
import * as Sentry from "@sentry/browser";

// Get DSN from window._env (set by dev server or build process)
const sentryDsn = window._env?.VITE_SENTRY_DSN;

if (sentryDsn && window.location.hostname !== 'localhost') {
  Sentry.init({
    dsn: sentryDsn,
    environment: window._env?.VITE_APP_ENV || 'production',
    tracesSampleRate: 0.1,
  });
}
```

**Analytics (Google Analytics 4):**

```javascript
// analytics.js
import { gtag } from "gtag";

export function trackEvent(action, category, label, value) {
  // Only track in production (not localhost)
  if (window.location.hostname !== 'localhost') {
    gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
}
```

**Note:** `import.meta.env` is no longer used. Configuration comes from `window._env` (set by dev servers or build process).

### **Performance Monitoring**

**Key Metrics to Track:**

- Page load time
- API response times
- User engagement
- Error rates
- Bundle size

**Alerts Setup:**

- Error rate > 5%
- Page load time > 3 seconds
- API failures
- High memory usage

---

## 🔒 Security Best Practices

### **Environment Security**

1. **Never commit secrets:**

```bash
# Add to .gitignore
.env.local
.env.production
*.key
*.pem
```

2. **Use strong secrets:**

```bash
# Generate secure JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

3. **Rotate keys regularly:**

- JWT secrets: Every 6 months
- API keys: Every 12 months
- Database credentials: Every 12 months

### **Production Security Checklist**

- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] CORS properly set
- [ ] Input validation implemented
- [ ] SQL injection prevention
- [ ] XSS protection enabled
- [ ] CSRF tokens used
- [ ] Rate limiting implemented
- [ ] Secrets in environment variables only
- [ ] Database access restricted

---

## 📞 Support & Resources

### **Documentation Links**

- [Supabase Docs](https://supabase.com/docs)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Sentry Error Tracking](https://docs.sentry.io/platforms/javascript/)

### **Development Team**

- **Repository**: [GitHub](https://github.com/AJKous31/app-new-flag)
- **Issues**: Create issue with appropriate label
- **Discussions**: Use GitHub Discussions
- **Email**: devs@flagfitpro.com

### **Quick Commands Reference**

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build
npm run test             # Run tests
npm run lint             # Lint code
npm run type-check       # TypeScript checking

# Deployment
git push origin main     # Trigger Netlify deploy
netlify deploy --prod    # Manual Netlify deploy
# Deploy to your chosen hosting platform

# Utilities
npm run clean           # Clean build artifacts
npm run analyze         # Bundle size analysis
npm run env:validate    # Validate environment
```

---

**Last Updated**: November 16, 2024  
**Version**: 2.0  
**Maintained By**: FlagFit Pro Development Team

_This guide consolidates environment setup, configuration, and deployment processes for streamlined development workflow._
