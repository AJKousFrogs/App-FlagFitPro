# 🔧 Environment Variables Setup Guide
## Flag Football Training App - Complete Configuration

---

## **📋 Quick Setup**

### **1. Copy Example File**
```bash
cp .env.example .env.local
# Edit .env.local with your actual API keys
```

### **2. Priority Variables (Required for Basic Functionality)**
```bash
# Database (REQUIRED)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_role_key_here

# Security (REQUIRED)
JWT_SECRET=your_secure_jwt_secret_here
CSRF_SECRET=your_csrf_secret_here

# MCP (AI Features)
CONTEXT7_API_KEY=your_context7_api_key_here
```

---

## **🔑 API Keys & Setup Instructions**

### **🏗️ Core Infrastructure**

#### **Supabase (Database & Auth)**
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → API
4. Copy:
   - Project URL → `SUPABASE_URL`
   - Anon public key → `SUPABASE_ANON_KEY`
   - Service role key → `SUPABASE_SERVICE_KEY`

#### **Context7 (MCP Protocol)**
1. Sign up at [context7.com](https://context7.com)
2. Get API key from dashboard
3. Add to `CONTEXT7_API_KEY`

---

### **📊 Analytics & Monitoring**

#### **Google Analytics**
1. Go to [analytics.google.com](https://analytics.google.com)
2. Create property for your app
3. Get Measurement ID → `VITE_GOOGLE_ANALYTICS_ID`

#### **Sentry (Error Tracking)**
1. Sign up at [sentry.io](https://sentry.io)
2. Create new project
3. Copy DSN → `VITE_SENTRY_DSN`

#### **PostHog (Product Analytics)**
1. Sign up at [posthog.com](https://posthog.com)
2. Get project API key → `VITE_POSTHOG_KEY`

---

### **🎥 Content & Media**

#### **YouTube API (Training Videos)**
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Enable YouTube Data API v3
3. Create credentials → API Key
4. Add to `VITE_YOUTUBE_API_KEY`

#### **Cloudinary (Image/Video Processing)**
1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Go to Dashboard
3. Copy:
   - Cloud name → `CLOUDINARY_CLOUD_NAME`
   - API Key → `CLOUDINARY_API_KEY`
   - API Secret → `CLOUDINARY_API_SECRET`

---

### **🌤️ Weather & Location**

#### **OpenWeatherMap**
1. Sign up at [openweathermap.org](https://openweathermap.org)
2. Get free API key
3. Add to `WEATHER_API_KEY`

---

### **🥗 Nutrition Data**

#### **USDA FoodData Central**
1. Go to [fdc.nal.usda.gov](https://fdc.nal.usda.gov)
2. Request API key (free)
3. Add to `USDA_API_KEY`

---

### **📱 Wearable Integration**

#### **Garmin Connect IQ**
1. Go to [developer.garmin.com](https://developer.garmin.com)
2. Create developer account
3. Get API key → `GARMIN_API_KEY`

#### **Fitbit Web API**
1. Go to [dev.fitbit.com](https://dev.fitbit.com)
2. Register application
3. Get Client ID → `FITBIT_CLIENT_ID`

---

### **💰 Payment Processing**

#### **Stripe**
1. Sign up at [stripe.com](https://stripe.com)
2. Go to Developers → API keys
3. Copy:
   - Publishable key → `STRIPE_PUBLISHABLE_KEY`
   - Secret key → `STRIPE_SECRET_KEY`
   - Webhook secret → `STRIPE_WEBHOOK_SECRET`

---

### **📧 Communication Services**

#### **SendGrid (Email)**
1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Create API key
3. Add to `SENDGRID_API_KEY`

#### **Twilio (SMS)**
1. Sign up at [twilio.com](https://twilio.com)
2. Get:
   - Account SID → `TWILIO_ACCOUNT_SID`
   - Auth Token → `TWILIO_AUTH_TOKEN`
   - Phone Number → `TWILIO_PHONE_NUMBER`

#### **Firebase (Push Notifications)**
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create project
3. Enable Cloud Messaging
4. Get:
   - Project ID → `FIREBASE_PROJECT_ID`
   - API Key → `FIREBASE_API_KEY`
   - Sender ID → `FIREBASE_MESSAGING_SENDER_ID`

---

### **🤖 AI Services**

#### **OpenAI**
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create API key
3. Add to `OPENAI_API_KEY`

#### **Anthropic Claude**
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create API key
3. Add to `ANTHROPIC_API_KEY`

---

### **☁️ Cloud Storage**

#### **AWS S3**
1. Go to [aws.amazon.com](https://aws.amazon.com)
2. Create IAM user with S3 access
3. Create S3 bucket
4. Get:
   - Access Key ID → `AWS_ACCESS_KEY_ID`
   - Secret Access Key → `AWS_SECRET_ACCESS_KEY`
   - Bucket name → `AWS_S3_BUCKET`

---

## **🚀 Deployment Configuration**

### **Netlify Environment Variables**
Add these in Netlify dashboard (Site settings → Environment variables):

```bash
# Core (Required)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
JWT_SECRET=your_jwt_secret

# Analytics (Recommended)
VITE_GOOGLE_ANALYTICS_ID=your_ga_id
VITE_SENTRY_DSN=your_sentry_dsn

# AI Features (Optional)
CONTEXT7_API_KEY=your_context7_key
OPENAI_API_KEY=your_openai_key
```

### **Vercel Environment Variables**
Same variables as Netlify, add in Vercel dashboard.

---

## **🔒 Security Best Practices**

### **Environment File Security**
1. **NEVER** commit `.env` files to Git
2. Use `.env.local` for development
3. Use `.env.example` as template
4. Rotate keys regularly

### **Key Rotation Schedule**
- **JWT_SECRET**: Every 6 months
- **API Keys**: Every 12 months
- **Database credentials**: Every 12 months
- **Webhook secrets**: Every 6 months

### **Access Control**
- Use least privilege principle
- Enable API key restrictions where possible
- Monitor API usage and set alerts
- Use different keys for dev/staging/production

---

## **🧪 Testing Configuration**

### **Development Testing**
```bash
# Copy production env and modify
cp .env .env.test

# Modify for testing
VITE_ENABLE_TESTING_MODE=true
VITE_MOCK_API_DELAY=100
DATABASE_URL=your_test_database_url
```

### **Cypress E2E Testing**
```bash
# Cypress specific variables
CYPRESS_BASE_URL=http://localhost:4000
CYPRESS_RECORD_KEY=your_cypress_record_key
```

---

## **📊 Monitoring & Alerts**

### **Set Up Monitoring**
1. **Sentry**: Error tracking and performance
2. **PostHog**: User behavior analytics
3. **Google Analytics**: Traffic and engagement
4. **Stripe**: Payment monitoring

### **Alert Thresholds**
- API error rate > 5%
- Page load time > 3 seconds
- Database connection failures
- Payment processing errors

---

## **🆘 Troubleshooting**

### **Common Issues**

#### **Database Connection Failed**
```bash
# Check these variables
SUPABASE_URL=correct_url_format
SUPABASE_SERVICE_KEY=valid_service_key
DATABASE_URL=matches_supabase_url
```

#### **Authentication Not Working**
```bash
# Verify JWT configuration
JWT_SECRET=secure_random_string_32_chars_min
SUPABASE_ANON_KEY=valid_anon_key
```

#### **API Calls Failing**
```bash
# Check API base URL
VITE_API_BASE_URL=correct_netlify_functions_url
# For Netlify: https://your-site.netlify.app/.netlify/functions
```

#### **MCP Services Not Working**
```bash
# Verify MCP configuration
CONTEXT7_API_KEY=valid_api_key
MCP_CONTEXT7_PORT=3000
MCP_SEQUENTIAL_THOUGHT_PORT=3001
```

### **Environment Validation**
Run this command to check your configuration:
```bash
npm run env:validate  # If script exists
# Or manually check with:
node -e "console.log(process.env.SUPABASE_URL ? '✅ Supabase configured' : '❌ Supabase missing')"
```

---

## **📞 Support & Resources**

### **Documentation Links**
- [Supabase Docs](https://supabase.com/docs)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Node.js Environment Variables](https://nodejs.org/api/process.html#process_process_env)

### **Help & Community**
- GitHub Issues: Create issue with `environment` label
- Discord: Join our development channel
- Email: devs@flagfitpro.com

---

**Last Updated**: November 2024  
**Version**: 1.0  
**Maintained By**: FlagFit Pro Development Team