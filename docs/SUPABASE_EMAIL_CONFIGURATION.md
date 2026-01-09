# Supabase Magic Link Email Configuration Guide

This guide explains how to configure email delivery for magic link authentication in Supabase.

---

## Option 1: Supabase Hosted Email (Development - Quick Start)

**Best for**: Local development and testing

Supabase provides a built-in email service for development. Magic links are logged in the Supabase Dashboard.

### Setup Steps:

1. **Navigate to Supabase Dashboard**
   - Go to: https://app.supabase.com
   - Select your project

2. **Check Auth Settings**
   - Navigate to: **Authentication → Settings**
   - Scroll to **Email Settings**
   - Verify **Enable Email Confirmations** is ON

3. **Configure Redirect URLs**
   - In **Auth Settings → URL Configuration**
   - Add to **Redirect URLs**:
     ```
     http://localhost:4200/auth/callback
     http://localhost:4200/*
     https://yourdomain.com/auth/callback
     https://yourdomain.com/*
     ```

4. **Test Magic Link (Without Email)**
   - Navigate to: **Authentication → Logs**
   - Click "Sign up" or "Send magic link" in your app
   - Find the event in logs
   - Copy the magic link URL
   - Paste in browser to test

### Accessing Magic Links in Development:

```bash
# View logs in Supabase Dashboard:
# 1. Go to Authentication → Logs
# 2. Filter by "magic_link" events
# 3. Click on event to see magic link URL
# 4. Copy URL and paste in browser
```

---

## Option 2: Custom SMTP (Production)

**Best for**: Production deployments

Configure your own SMTP server for reliable email delivery.

### Recommended Providers:

| Provider     | Free Tier           | Setup Difficulty | Best For      |
| ------------ | ------------------- | ---------------- | ------------- |
| **SendGrid** | 100 emails/day      | Easy             | Production    |
| **Mailgun**  | 1,000 emails/month  | Easy             | Production    |
| **AWS SES**  | 62,000 emails/month | Medium           | High volume   |
| **Postmark** | 100 emails/month    | Easy             | Transactional |
| **Mailhog**  | Unlimited           | Easy             | Local testing |

### Setup Steps (SendGrid Example):

1. **Create SendGrid Account**
   - Sign up at: https://sendgrid.com
   - Verify your email address
   - Navigate to **Settings → API Keys**
   - Create new API key with "Mail Send" permission
   - Save the API key (shown only once)

2. **Configure Supabase**
   - Go to Supabase Dashboard
   - Navigate to: **Project Settings → Auth**
   - Scroll to **SMTP Settings**
   - Enable **Custom SMTP**

3. **Enter SMTP Details**:

   ```
   SMTP Host: smtp.sendgrid.net
   SMTP Port: 587
   SMTP User: apikey
   SMTP Pass: [Your SendGrid API Key]
   Sender Email: noreply@yourdomain.com
   Sender Name: FlagFit Pro
   ```

4. **Verify Domain (Optional but Recommended)**
   - In SendGrid: Settings → Sender Authentication
   - Authenticate your domain
   - Add DNS records to your domain provider
   - Wait for verification (can take 24-48 hours)

5. **Test Email Delivery**
   - Send a test magic link
   - Check SendGrid Activity Feed
   - Verify email arrives in inbox (not spam)

---

## Option 3: Mailhog (Local Development)

**Best for**: Local testing without real email service

Mailhog captures emails locally without sending them.

### Setup Steps:

1. **Install Mailhog**:

   ```bash
   # macOS
   brew install mailhog

   # Or use Docker
   docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog
   ```

2. **Start Mailhog**:

   ```bash
   mailhog

   # Access web UI at: http://localhost:8025
   ```

3. **Configure Supabase (Local)**:

   ```env
   # In your .env file:
   SMTP_HOST=localhost
   SMTP_PORT=1025
   SMTP_USER=
   SMTP_PASS=
   SMTP_SENDER_EMAIL=noreply@localhost
   SMTP_SENDER_NAME=FlagFit Pro Dev
   ```

4. **Update Supabase Local Config**:

   ```bash
   # Edit: supabase/config.toml

   [auth.email]
   enable_signup = true
   enable_confirmations = true

   [auth.email.smtp]
   enabled = true
   host = "localhost"
   port = 1025
   user = ""
   pass = ""
   sender_name = "FlagFit Pro Dev"
   admin_email = "admin@localhost"
   ```

5. **Test Magic Link**:
   - Send magic link from your app
   - Open Mailhog UI: http://localhost:8025
   - Click on email to view magic link
   - Copy link and test

---

## Environment Variables Setup

Create a `.env.local` file in your project root:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email Configuration (Option 1: Development - No Config Needed)
# Supabase handles this automatically

# Email Configuration (Option 2: Custom SMTP)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your-api-key
SMTP_SENDER_EMAIL=noreply@yourdomain.com
SMTP_SENDER_NAME=FlagFit Pro

# Email Configuration (Option 3: Mailhog)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_SENDER_EMAIL=noreply@localhost
SMTP_SENDER_NAME=FlagFit Pro Dev

# Redirect URLs
AUTH_CALLBACK_URL=http://localhost:4200/auth/callback
SITE_URL=http://localhost:4200
```

---

## Email Templates Configuration

Customize your magic link email templates in Supabase:

### Steps:

1. **Navigate to Email Templates**
   - Supabase Dashboard → **Authentication → Email Templates**

2. **Customize Magic Link Template**:

   ```html
   <h2>Magic Link Sign In</h2>
   <p>Click the link below to sign in to FlagFit Pro:</p>
   <p><a href="{{ .ConfirmationURL }}">Sign In to FlagFit Pro</a></p>
   <p>Or copy and paste this URL:</p>
   <p>{{ .ConfirmationURL }}</p>
   <p>This link expires in 1 hour.</p>
   ```

3. **Available Variables**:
   - `{{ .ConfirmationURL }}` - Magic link URL
   - `{{ .Token }}` - Auth token
   - `{{ .TokenHash }}` - Token hash
   - `{{ .SiteURL }}` - Your site URL
   - `{{ .Email }}` - User's email

4. **Test Email Appearance**:
   - Send test email
   - Check inbox/spam
   - Verify formatting and links work

---

## Testing Magic Link Flow

### Manual Test:

1. **Navigate to Login Page**:

   ```
   http://localhost:4200/login
   ```

2. **Request Magic Link**:
   - Enter email: `test@example.com`
   - Click "Send Magic Link"

3. **Get Magic Link**:
   - **Option 1 (Dev)**: Check Supabase Auth Logs
   - **Option 2 (SMTP)**: Check email inbox
   - **Option 3 (Mailhog)**: Check http://localhost:8025

4. **Click Magic Link**:
   - Should redirect to: `http://localhost:4200/auth/callback#access_token=...`
   - Verify `AuthCallbackComponent` processes tokens
   - Should redirect to dashboard

5. **Verify Session**:
   ```javascript
   // In browser console:
   const { data } = await supabase.auth.getSession();
   console.log("User:", data.session?.user);
   console.log("Expires at:", new Date(data.session?.expires_at * 1000));
   ```

### Automated Test:

```bash
# Run E2E test with magic link flow
npm run test:e2e -- tests/e2e/login-to-log-flow.spec.js
```

---

## Troubleshooting

### Issue: Magic link not arriving

**Causes**:

- SMTP not configured
- Email in spam folder
- Wrong SMTP credentials
- Domain not verified

**Solutions**:

1. Check Supabase logs for send errors
2. Verify SMTP settings in Supabase Dashboard
3. Test SMTP credentials with curl:

   ```bash
   curl --url 'smtp://smtp.sendgrid.net:587' \
     --mail-from 'noreply@yourdomain.com' \
     --mail-rcpt 'test@example.com' \
     --user 'apikey:YOUR_API_KEY' \
     --upload-file - <<EOF
   From: FlagFit Pro <noreply@yourdomain.com>
   To: test@example.com
   Subject: Test Email

   This is a test email.
   EOF
   ```

4. Check spam folder
5. Whitelist sender email in email provider

### Issue: Magic link expired

**Causes**:

- Link older than 1 hour (default expiry)
- Token already used

**Solutions**:

1. Request new magic link
2. Adjust expiry time in Supabase (max 24 hours):
   - Dashboard → Auth Settings → JWT Expiry
3. Check server time is synchronized

### Issue: Redirect not working after click

**Causes**:

- Redirect URL not whitelisted in Supabase
- Wrong callback URL in code

**Solutions**:

1. Add redirect URLs to Supabase:
   - Auth Settings → URL Configuration → Redirect URLs
   - Add: `http://localhost:4200/auth/callback`
2. Verify `AuthCallbackComponent` route exists
3. Check browser console for errors

### Issue: Token invalid or expired

**Causes**:

- URL tampered with
- Session expired server-side
- Clock skew between client/server

**Solutions**:

1. Request new magic link
2. Clear browser localStorage/sessionStorage
3. Check server time is correct:
   ```bash
   date
   # Should match current time
   ```

---

## Production Checklist

Before deploying to production:

- [ ] Configure custom SMTP (SendGrid/Mailgun/AWS SES)
- [ ] Verify domain with email provider
- [ ] Add production URLs to Supabase redirect URLs
- [ ] Customize email templates with branding
- [ ] Test magic link flow in production environment
- [ ] Set up email monitoring and alerts
- [ ] Configure email rate limits
- [ ] Add SPF/DKIM/DMARC DNS records
- [ ] Test email delivery to common providers (Gmail, Outlook, etc.)
- [ ] Monitor email bounces and complaints
- [ ] Set up email analytics (open rates, click rates)

---

## Security Best Practices

1. **Use HTTPS in Production**
   - Redirect URLs must use `https://`
   - Never send tokens over HTTP

2. **Limit Token Expiry**
   - Default: 1 hour is secure
   - Max: 24 hours for convenience
   - Shorter is more secure

3. **Rate Limit Magic Link Requests**
   - Prevent abuse/spam
   - Supabase default: 4 requests per hour per email

4. **Monitor Auth Logs**
   - Watch for suspicious patterns
   - Alert on high failure rates
   - Track IP addresses

5. **Validate Redirect URLs**
   - Only whitelist your domains
   - Never allow arbitrary redirects
   - Use explicit paths when possible

---

## Quick Reference

| Task             | Command/URL                                |
| ---------------- | ------------------------------------------ |
| View Auth Logs   | Supabase Dashboard → Authentication → Logs |
| Configure SMTP   | Project Settings → Auth → SMTP Settings    |
| Test Local Email | http://localhost:8025 (Mailhog)            |
| Email Templates  | Authentication → Email Templates           |
| Redirect URLs    | Auth Settings → URL Configuration          |
| Test Magic Link  | POST /auth/v1/magiclink (Supabase API)     |

---

**Last Updated**: January 9, 2026  
**Version**: 1.0  
**Contact**: dev@flagfitpro.com
