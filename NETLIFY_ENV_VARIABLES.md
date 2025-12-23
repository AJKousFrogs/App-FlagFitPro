# 🔐 Netlify Environment Variables - Complete Guide

## Required Variables (MUST SET)

These variables are **required** for the application to function. Without them, most features will fail.

### 1. Supabase Configuration (REQUIRED)

| Variable Name          | Description                     | Where to Find                                          | Example                                   |
| ---------------------- | ------------------------------- | ------------------------------------------------------ | ----------------------------------------- |
| `SUPABASE_URL`         | Your Supabase project URL       | Supabase Dashboard → Settings → API                    | `https://xxxxx.supabase.co`               |
| `SUPABASE_SERVICE_KEY` | Service role key (admin access) | Supabase Dashboard → Settings → API → Service Role Key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_ANON_KEY`    | Anonymous/public key            | Supabase Dashboard → Settings → API → anon/public Key  | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

**⚠️ IMPORTANT:**

- `SUPABASE_SERVICE_KEY` is **secret** - never expose it in frontend code
- `SUPABASE_ANON_KEY` is safe for frontend use
- All three are required for backend functions to work

---

## Optional Variables (RECOMMENDED)

These variables enable additional features but the app will work without them (with reduced functionality).

### 2. Weather API (Optional)

| Variable Name         | Description                             | Where to Get                   | Example           |
| --------------------- | --------------------------------------- | ------------------------------ | ----------------- |
| `OPENWEATHER_API_KEY` | OpenWeatherMap API key for weather data | https://openweathermap.org/api | `abc123def456...` |

**What happens without it:**

- Weather endpoint returns mock data
- Training suitability calculations use default values

**How to get:**

1. Sign up at https://openweathermap.org/
2. Go to API Keys section
3. Copy your API key
4. Free tier: 1,000 calls/day

---

### 3. Database Connection (Optional - Legacy)

Some older functions use direct PostgreSQL connections. If you're using Supabase, these are **not needed** (Supabase handles the database).

| Variable Name  | Description                  | When Needed                                                  |
| -------------- | ---------------------------- | ------------------------------------------------------------ |
| `DATABASE_URL` | PostgreSQL connection string | Only if using direct DB connection (legacy, not recommended) |

**Note:** Most functions now use Supabase, so these are typically **not required**.

---

### 4. Email Configuration (Optional)

Choose **ONE** email provider option below. Email features won't work without at least one configured.

#### Option A: Gmail (Easiest)

| Variable Name        | Description        | How to Get                       |
| -------------------- | ------------------ | -------------------------------- |
| `GMAIL_EMAIL`        | Your Gmail address | Your Gmail account               |
| `GMAIL_APP_PASSWORD` | Gmail App Password | Gmail → Security → App Passwords |

**How to get Gmail App Password:**

1. Go to Google Account settings
2. Security → 2-Step Verification (must be enabled)
3. App Passwords → Generate new app password
4. Use this password (not your regular Gmail password)

#### Option B: SendGrid (Recommended for Production)

| Variable Name      | Description      | How to Get                      |
| ------------------ | ---------------- | ------------------------------- |
| `SENDGRID_API_KEY` | SendGrid API key | https://sendgrid.com → API Keys |

**Benefits:**

- More reliable for production
- Better deliverability
- Free tier: 100 emails/day

#### Option C: Custom SMTP Server

| Variable Name | Description                    | Example                  |
| ------------- | ------------------------------ | ------------------------ |
| `SMTP_HOST`   | SMTP server hostname           | `smtp.gmail.com`         |
| `SMTP_PORT`   | SMTP port (usually 587 or 465) | `587`                    |
| `SMTP_USER`   | SMTP username                  | `your-email@example.com` |
| `SMTP_PASS`   | SMTP password                  | `your-password`          |
| `SMTP_SECURE` | Use TLS/SSL (true/false)       | `true`                   |

**What happens without email config:**

- Password reset emails won't work
- Email verification won't work
- Team invitation emails won't work
- Other email notifications won't work

---

## Complete Variable List

### Minimum Required (3 variables)

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Recommended Setup (4-5 variables)

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPENWEATHER_API_KEY=abc123def456...
GMAIL_EMAIL=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
```

### Full Production Setup (All features)

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPENWEATHER_API_KEY=abc123def456...
SENDGRID_API_KEY=SG.xxxxx...
```

---

## 📋 How to Set Variables in Netlify UI

### Step-by-Step Instructions

1. **Go to Netlify Dashboard**
   - Visit https://app.netlify.com/
   - Log in to your account

2. **Select Your Site**
   - Find your site (e.g., `webflagfootballfrogs`)
   - Click on it

3. **Navigate to Site Settings**
   - Click **Site Settings** in the top menu
   - Or go to: `https://app.netlify.com/sites/YOUR_SITE_NAME/configuration/env`

4. **Add Environment Variables**
   - Scroll to **Environment Variables** section
   - Click **Add variable** button
   - Enter variable name (e.g., `SUPABASE_URL`)
   - Enter variable value (e.g., `https://xxxxx.supabase.co`)
   - Select scope:
     - **All scopes** (recommended) - applies to all deploys
     - **Production** - only production deploys
     - **Deploy previews** - only preview deploys
     - **Branch deploys** - only branch deploys
   - Click **Create variable**

5. **Repeat for Each Variable**
   - Add all required variables one by one
   - Make sure variable names match **exactly** (case-sensitive)

6. **Redeploy**
   - After adding variables, trigger a new deploy
   - Go to **Deploys** tab
   - Click **Trigger deploy** → **Deploy site**
   - Or push a new commit to trigger auto-deploy

---

## 🔍 Verification

### Check if Variables Are Set

1. **In Netlify UI:**
   - Go to Site Settings → Environment Variables
   - You should see all your variables listed

2. **In Function Logs:**
   - Go to Functions tab
   - Click on any function
   - Check logs for environment variable errors
   - Should see: `✅ Supabase credentials loaded`

3. **Test an Endpoint:**
   ```bash
   curl https://your-site.netlify.app/api/health
   ```

   - Should return success (not 500 error)

---

## ⚠️ Common Mistakes

### ❌ Wrong Variable Names

- `SUPABASE_URL` ✅ (correct)
- `SUPABASEURL` ❌ (wrong - missing underscore)
- `supabase_url` ❌ (wrong - lowercase)

### ❌ Missing Quotes

- Don't add quotes around values in Netlify UI
- `https://xxxxx.supabase.co` ✅
- `"https://xxxxx.supabase.co"` ❌ (quotes included)

### ❌ Wrong Keys

- Make sure you're using the **Service Role Key** for `SUPABASE_SERVICE_KEY`
- Not the anon key (that goes in `SUPABASE_ANON_KEY`)

### ❌ Not Redeploying

- Variables are only available after redeploy
- Add variables → Trigger deploy → Test

---

## 🎯 Quick Reference

### For Your Specific Project

Based on your Supabase project, set these exact variables:

```
SUPABASE_URL=https://pvziciccwxgftcielknm.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2emljaWN3eGdmdGNpZWxrbm0iLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzU5NTM3MDU4LCJleHAiOjIwNzUxMTMwNTh9.UwVhLpQOpC50G8D8zL8MCbIe8mm_2EqubaC2s_-Z5mo
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2emljaWN3eGdmdGNpZWxrbm0iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc1OTUzNzA1OCwiZXhwIjoyMDc1MTEzMDU4fQ.1nfJrtWPl6DrAwvjGvM1-CZBeyYgCaV9oDdaadpqhLU
```

**Optional (but recommended):**

```
OPENWEATHER_API_KEY=your-key-here
GMAIL_EMAIL=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
```

---

## 📞 Need Help?

If you see errors about missing environment variables:

1. **Check Netlify Logs:**
   - Functions → Select function → View logs
   - Look for: `Missing environment variables: ...`

2. **Verify Variable Names:**
   - Must match exactly (case-sensitive)
   - No extra spaces or quotes

3. **Check Scope:**
   - Make sure variables are set for the correct scope
   - Use "All scopes" if unsure

4. **Redeploy:**
   - Variables only apply to new deploys
   - Trigger a new deploy after adding variables

---

## ✅ Checklist

Before deploying, make sure you have:

- [ ] `SUPABASE_URL` set
- [ ] `SUPABASE_SERVICE_KEY` set (Service Role Key)
- [ ] `SUPABASE_ANON_KEY` set (anon/public Key)
- [ ] (Optional) `OPENWEATHER_API_KEY` set
- [ ] (Optional) Email config set (Gmail or SendGrid)
- [ ] Triggered a new deploy
- [ ] Tested an endpoint to verify

---

**That's it!** Once these variables are set, your Netlify functions will connect to Supabase and all features will work. 🚀
