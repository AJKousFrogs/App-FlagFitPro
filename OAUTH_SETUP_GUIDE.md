# OAuth Providers Setup Guide

## FlagFit Pro - Complete OAuth Configuration

This guide will walk you through setting up **Google**, **Facebook**, and **Apple** OAuth authentication for your FlagFit Pro application.

---

## 📋 Prerequisites

- Access to your Supabase dashboard: https://pvziciccwxgftcielknm.supabase.co
- Your Supabase redirect URL: `https://pvziciccwxgftcielknm.supabase.co/auth/v1/callback`
- For local development: `http://localhost:4000/auth/callback`

---

## 🔵 1. Google OAuth Setup

### Step 1.1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a Project"** → **"New Project"**
3. Name: `FlagFit Pro` → Click **"Create"**

### Step 1.2: Configure OAuth Consent Screen

1. Navigate to **APIs & Services** → **OAuth consent screen**
2. Select **External** → Click **"Create"**
3. Fill in:
   - **App name:** FlagFit Pro
   - **User support email:** Your email
   - **Developer contact:** Your email
4. Click **"Save and Continue"**
5. **Scopes:** Click **"Add or Remove Scopes"**
   - Select: `userinfo.email` and `userinfo.profile`
   - Click **"Update"** → **"Save and Continue"**
6. **Test users:** Add your email → **"Save and Continue"**

### Step 1.3: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth 2.0 Client ID"**
3. Application type: **Web application**
4. Name: `FlagFit Pro Web Client`
5. **Authorized JavaScript origins:**
   ```
   https://pvziciccwxgftcielknm.supabase.co
   http://localhost:4000
   ```
6. **Authorized redirect URIs:**
   ```
   https://pvziciccwxgftcielknm.supabase.co/auth/v1/callback
   http://localhost:4000/auth/callback
   ```
7. Click **"Create"**
8. **Copy** the `Client ID` and `Client Secret` (you'll need these)

### Step 1.4: Enable in Supabase

1. Go to [Supabase Dashboard](https://pvziciccwxgftcielknm.supabase.co)
2. Click **Authentication** → **Providers**
3. Find **Google** → Toggle **"Enable"**
4. Paste:
   - **Client ID:** (from Step 1.3)
   - **Client Secret:** (from Step 1.3)
5. Click **"Save"**

✅ **Google OAuth is now configured!**

---

## 🔷 2. Facebook OAuth Setup

### Step 2.1: Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **"My Apps"** → **"Create App"**
3. Select **"Consumer"** → Click **"Next"**
4. Fill in:
   - **App name:** FlagFit Pro
   - **App contact email:** Your email
5. Click **"Create App"**

### Step 2.2: Add Facebook Login Product

1. In your app dashboard, find **"Add Products to Your App"**
2. Locate **"Facebook Login"** → Click **"Set Up"**
3. Choose **"Web"** platform
4. Enter Site URL: `https://pvziciccwxgftcielknm.supabase.co`
5. Click **"Save"** → **"Continue"**

### Step 2.3: Configure Facebook Login Settings

1. Go to **Facebook Login** → **Settings** (left sidebar)
2. **Valid OAuth Redirect URIs:** Add:
   ```
   https://pvziciccwxgftcielknm.supabase.co/auth/v1/callback
   http://localhost:4000/auth/callback
   ```
3. Click **"Save Changes"**

### Step 2.4: Get App Credentials

1. Go to **Settings** → **Basic**
2. Copy:
   - **App ID**
   - **App Secret** (click "Show" to reveal)

### Step 2.5: Make App Live (Important!)

1. Go to top-right corner → Toggle from **"In Development"** to **"Live"**
2. This allows anyone to use Facebook login

### Step 2.6: Enable in Supabase

1. Go to [Supabase Dashboard](https://pvziciccwxgftcielknm.supabase.co)
2. Click **Authentication** → **Providers**
3. Find **Facebook** → Toggle **"Enable"**
4. Paste:
   - **Client ID:** Your Facebook App ID
   - **Client Secret:** Your Facebook App Secret
5. Click **"Save"**

✅ **Facebook OAuth is now configured!**

---

## 🍎 3. Apple OAuth Setup

### ⚠️ Requirements

- **Apple Developer Account** ($99/year)
- Access to [Apple Developer Portal](https://developer.apple.com/)

### Step 3.1: Register an App ID

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Click **Certificates, Identifiers & Profiles**
3. Click **Identifiers** → **"+"** button
4. Select **App IDs** → Click **"Continue"**
5. Select **App** → Click **"Continue"**
6. Fill in:
   - **Description:** FlagFit Pro
   - **Bundle ID:** `com.flagfitpro.app` (or your own)
7. Scroll down to **Capabilities** → Check **"Sign in with Apple"**
8. Click **"Continue"** → **"Register"**

### Step 3.2: Create a Services ID

1. Click **Identifiers** → **"+"** button
2. Select **Services IDs** → Click **"Continue"**
3. Fill in:
   - **Description:** FlagFit Pro Web Auth
   - **Identifier:** `com.flagfitpro.web` (must be different from App ID)
4. Check **"Sign in with Apple"** → Click **"Configure"**
5. Configure:
   - **Primary App ID:** Select the App ID from Step 3.1
   - **Domains and Subdomains:**
     ```
     pvziciccwxgftcielknm.supabase.co
     localhost
     ```
   - **Return URLs:**
     ```
     https://pvziciccwxgftcielknm.supabase.co/auth/v1/callback
     http://localhost:4000/auth/callback
     ```
6. Click **"Save"** → **"Continue"** → **"Register"**

### Step 3.3: Create a Private Key

1. Click **Keys** → **"+"** button
2. **Key Name:** FlagFit Pro Sign in with Apple Key
3. Check **"Sign in with Apple"** → Click **"Configure"**
4. Select your **Primary App ID** from Step 3.1
5. Click **"Save"** → **"Continue"** → **"Register"**
6. Click **"Download"** to download the `.p8` file
7. **Important:** Copy the **Key ID** (you'll need this)

### Step 3.4: Get Team ID

1. Go to [Apple Developer Account](https://developer.apple.com/account/)
2. On the top-right, you'll see **Membership** section
3. Copy your **Team ID** (10 characters)

### Step 3.5: Enable in Supabase

1. Go to [Supabase Dashboard](https://pvziciccwxgftcielknm.supabase.co)
2. Click **Authentication** → **Providers**
3. Find **Apple** → Toggle **"Enable"**
4. Fill in:
   - **Services ID:** `com.flagfitpro.web` (from Step 3.2)
   - **Team ID:** Your 10-character Team ID (from Step 3.4)
   - **Key ID:** From Step 3.3
   - **Private Key:** Open the `.p8` file in a text editor and paste the entire content
5. Click **"Save"**

✅ **Apple OAuth is now configured!**

---

## 🧪 Testing Your OAuth Setup

### Test Each Provider

1. Open your login page: `http://localhost:4000/login.html`
2. Click the **Google/Facebook/Apple** button
3. Select your role (Player/Coach)
4. You should be redirected to the provider's login page
5. After successful authentication, you'll be redirected back to your app

### Expected Flow

```
Login Page → Click OAuth Button → Select Role → Provider Login Page
→ Grant Permissions → Redirect to /auth/callback → Dashboard
```

### Troubleshooting

#### Error: "Redirect URI mismatch"

- ✅ Check that you added the correct redirect URI in the provider settings
- ✅ Make sure the URI exactly matches (no trailing slashes)

#### Error: "App not verified"

- ✅ For Google: Complete OAuth consent screen verification (or add test users)
- ✅ For Facebook: Make sure app is set to "Live" mode

#### Error: "Invalid client"

- ✅ Check that Client ID/Secret are correctly copied in Supabase
- ✅ No extra spaces or line breaks

---

## 🔐 Security Best Practices

### Production Setup

When deploying to production:

1. **Update redirect URIs** to your production domain:

   ```
   https://yourdomain.com/auth/callback
   ```

2. **Add production origins** in each provider's settings

3. **Verify OAuth consent screens** are fully configured

4. **Enable HTTPS only** for production

### Store Credentials Securely

Never commit OAuth secrets to version control:

```bash
# Add to .env.local (not tracked by git)
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_FACEBOOK_APP_ID=your_facebook_app_id
VITE_APPLE_SERVICE_ID=your_apple_service_id
```

---

## 📊 Quick Reference

| Provider | Setup Time | Difficulty  | Requirements               |
| -------- | ---------- | ----------- | -------------------------- |
| Google   | ~15 mins   | ⭐ Easy     | Google account             |
| Facebook | ~20 mins   | ⭐⭐ Medium | Facebook account           |
| Apple    | ~30 mins   | ⭐⭐⭐ Hard | Apple Developer ($99/year) |

---

## ✅ Checklist

Use this checklist to track your progress:

- [ ] **Google OAuth**
  - [ ] Created Google Cloud project
  - [ ] Configured OAuth consent screen
  - [ ] Created OAuth credentials
  - [ ] Added redirect URIs
  - [ ] Enabled in Supabase
  - [ ] Tested login flow

- [ ] **Facebook OAuth**
  - [ ] Created Facebook app
  - [ ] Added Facebook Login product
  - [ ] Configured redirect URIs
  - [ ] Made app Live
  - [ ] Enabled in Supabase
  - [ ] Tested login flow

- [ ] **Apple OAuth**
  - [ ] Registered App ID
  - [ ] Created Services ID
  - [ ] Created private key (.p8)
  - [ ] Got Team ID and Key ID
  - [ ] Enabled in Supabase
  - [ ] Tested login flow

---

## 🆘 Need Help?

If you encounter issues:

1. Check the browser console for error messages
2. Verify all redirect URIs are correct
3. Ensure credentials are properly copied (no extra spaces)
4. Check that providers are enabled in Supabase
5. For Apple: Verify the private key is complete (including BEGIN/END lines)

---

## 📝 Notes

- **Development:** Use `http://localhost:4000/auth/callback`
- **Production:** Use `https://yourdomain.com/auth/callback`
- **Supabase:** Always use `https://pvziciccwxgftcielknm.supabase.co/auth/v1/callback`

**Last Updated:** December 12, 2024
