# Supabase Environment Variables Setup Guide

## Error: Missing Supabase Configuration

If you see this error:
```
[ERROR] [Supabase] Missing configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

This means the Supabase credentials are not available to your frontend code.

## Quick Fix Options

### Option 1: Set Environment Variables (Recommended)

Set environment variables before starting your dev server:

**On macOS/Linux:**
```bash
export SUPABASE_URL="https://pvziciccwxgftcielknm.supabase.co"
export SUPABASE_ANON_KEY="your_anon_key_here"
export VITE_SUPABASE_URL="https://pvziciccwxgftcielknm.supabase.co"
export VITE_SUPABASE_ANON_KEY="your_anon_key_here"

# Then start your dev server
npm run dev
```

**On Windows (PowerShell):**
```powershell
$env:SUPABASE_URL="https://pvziciccwxgftcielknm.supabase.co"
$env:SUPABASE_ANON_KEY="your_anon_key_here"
$env:VITE_SUPABASE_URL="https://pvziciccwxgftcielknm.supabase.co"
$env:VITE_SUPABASE_ANON_KEY="your_anon_key_here"

npm run dev
```

### Option 2: Use .env.local File (Recommended)

1. Create `.env.local` file in the project root:
   ```bash
   # The file should already exist, but if not:
   touch .env.local
   ```

2. Add your Supabase credentials to `.env.local`:
   ```env
   # Supabase Configuration
   SUPABASE_URL=https://pvziciccwxgftcielknm.supabase.co
   SUPABASE_ANON_KEY=sb_publishable_4mRqHbz4cFVXzpDi8nJc3A_rknKjryk
   SUPABASE_SERVICE_KEY=sb_secret_ZbZdfro3oCkX1wAiyYg__g_SUrhZI1R

   # Vite environment variables (for frontend)
   VITE_SUPABASE_URL=https://pvziciccwxgftcielknm.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_4mRqHbz4cFVXzpDi8nJc3A_rknKjryk
   ```

3. Start your dev server:
   ```bash
   npm run dev:hot
   # or
   npm run dev:enhanced
   ```

**Note:** The dev servers (`dev-server.cjs` and `dev-server-enhanced.cjs`) automatically load `.env.local` using dotenv and inject these variables into `window._env` for the browser.

### Option 3: Use Pre-configured Scripts

Use the provided scripts that already set environment variables:

```bash
# Using Netlify Dev
./start-local.sh

# Or using the enhanced dev server
npm run dev:enhanced
```

### Option 4: Manual Browser Setup (Development Only)

For quick testing, you can set credentials directly in the browser console:

1. Open your browser's Developer Console (F12)
2. Run these commands:
   ```javascript
   localStorage.setItem('SUPABASE_URL', 'https://pvziciccwxgftcielknm.supabase.co');
   localStorage.setItem('SUPABASE_ANON_KEY', 'your_anon_key_here');
   ```
3. Refresh the page

**⚠️ Warning:** This is only for local development. Never use this in production!

## How It Works

The Supabase client checks for credentials in this order:

1. **`window._env`** - Set by dev servers when environment variables are loaded from `.env.local` or system environment
2. **`localStorage`** - Fallback for local development only (localhost/127.0.0.1)

**Note:** `import.meta.env` is no longer used to avoid syntax errors. Configuration comes from `window._env` (set by `supabase-config.js` and dev servers) or `localStorage` for development.

## Verification

After setting up, check your browser console. You should see:
```
✅ Supabase credentials loaded
✅ [SUCCESS] [Supabase] Client initialized successfully
```

If you still see errors, verify:
- Environment variables are set correctly
- Dev server was restarted after setting environment variables
- No typos in the variable names

## Production Deployment

For production (Netlify, etc.), set environment variables in your hosting platform's dashboard:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

These will be injected during the build process.

## Troubleshooting

### Still seeing the error?

1. **Restart your dev server** after setting environment variables
2. **Check variable names** - they must be exactly `SUPABASE_URL` or `VITE_SUPABASE_URL`
3. **Clear browser cache** and localStorage
4. **Check server logs** - the dev server should log if credentials are loaded

### Dev server not injecting variables?

Make sure you're using one of these servers (both now load `.env.local` automatically):
- `dev-server.cjs` - Loads `.env.local` using dotenv
- `dev-server-enhanced.cjs` - Loads `.env.local` using dotenv

Both servers will:
1. Load environment variables from `.env.local` on startup
2. Inject them into `window._env` for the frontend
3. Set them in `localStorage` for development (localhost only)

**Important:** Restart your dev server after creating or modifying `.env.local` for changes to take effect.

