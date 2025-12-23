# 🚀 Local Development Guide - Running with Real Data

## Quick Start

Run the application locally with real Supabase data and full functionality:

```bash
./start-with-real-data.sh
```

This script will:

- ✅ Set up all required environment variables
- ✅ Start the API server on port 3001
- ✅ Start the frontend dev server on port 4000
- ✅ Inject Supabase credentials into the frontend
- ✅ Enable hot reload for development

## Access URLs

- **Frontend**: http://localhost:4000
- **API Server**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

## What's Connected

### Real Data Sources

- ✅ **Supabase Database**: Live connection to production database
- ✅ **User Authentication**: Real user accounts and sessions
- ✅ **Training Data**: Actual training sessions and progress
- ✅ **Community Posts**: Real user posts and interactions
- ✅ **Tournament Data**: Live tournament information
- ✅ **Team Management**: Real team and member data
- ✅ **Performance Analytics**: Actual user statistics

### Features Enabled

- 🔥 **Hot Reload**: Automatic browser refresh on file changes
- 🐛 **Bug Detection**: ESLint auto-fixing on save
- 🔌 **API Proxying**: Frontend automatically proxies API requests
- 📊 **Real-time Updates**: Supabase real-time subscriptions active
- 🔐 **Authentication**: Full auth flow with Supabase

## Environment Variables

### Using .env.local File (Recommended)

Create a `.env.local` file in the project root with:

```bash
# Supabase Configuration
SUPABASE_URL=https://pvziciccwxgftcielknm.supabase.co
SUPABASE_ANON_KEY=sb_publishable_4mRqHbz4cFVXzpDi8nJc3A_rknKjryk
SUPABASE_SERVICE_KEY=sb_secret_ZbZdfro3oCkX1wAiyYg__g_SUrhZI1R

# Vite environment variables (for frontend)
VITE_SUPABASE_URL=https://pvziciccwxgftcielknm.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_4mRqHbz4cFVXzpDi8nJc3A_rknKjryk

# JWT Secret (if needed)
JWT_SECRET=flagfit-pro-jwt-secret-2024
```

The dev servers (`dev-server.cjs` and `dev-server-enhanced.cjs`) automatically load `.env.local` and inject these variables into `window._env` for the frontend.

### Alternative: Manual Environment Variables

You can also set environment variables manually before starting the server:

## Manual Setup (Alternative)

If you prefer to run servers manually:

### Terminal 1 - API Server

```bash
export SUPABASE_URL="https://pvziciccwxgftcielknm.supabase.co"
export SUPABASE_ANON_KEY="<your-key>"
export SUPABASE_SERVICE_KEY="<your-key>"
export JWT_SECRET="flagfit-pro-jwt-secret-2024"
node server.js
```

### Terminal 2 - Frontend Dev Server

```bash
export SUPABASE_URL="https://pvziciccwxgftcielknm.supabase.co"
export SUPABASE_ANON_KEY="<your-key>"
export VITE_SUPABASE_URL="https://pvziciccwxgftcielknm.supabase.co"
export VITE_SUPABASE_ANON_KEY="<your-key>"
node dev-server-enhanced.cjs
```

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Kill process on port 4000
lsof -ti:4000 | xargs kill -9
```

### Supabase Connection Issues

1. **Check `.env.local` exists** and contains Supabase credentials
2. **Restart dev server** after creating/modifying `.env.local`
3. Check browser console for Supabase initialization messages
4. Verify `window._env` has credentials (open browser console and type `window._env`)
5. Check `localStorage` for credentials (in development):
   ```javascript
   localStorage.getItem("SUPABASE_URL");
   localStorage.getItem("SUPABASE_ANON_KEY");
   ```
6. Verify network connectivity to Supabase

### Frontend Not Loading Data

1. Open browser console (F12)
2. Check for Supabase initialization errors
3. Verify `localStorage` has Supabase credentials:
   ```javascript
   localStorage.getItem("SUPABASE_URL");
   localStorage.getItem("SUPABASE_ANON_KEY");
   ```
4. Check Network tab for API requests

## Development Features

### Hot Reload

- HTML/CSS/JS changes automatically reload the browser
- CSS changes reload without full page refresh
- WebSocket-based for instant updates

### Bug Detection

- ESLint runs automatically on file save
- Common bugs detected and reported
- Auto-fixing enabled for formatting issues

### API Proxying

- Frontend dev server proxies `/api/*` requests to backend
- CORS handled automatically
- Full API functionality available

## Database Tables Available

- `users` - User accounts and profiles
- `training_sessions` - Workout data and progress
- `teams` - Team information and management
- `team_members` - Team membership data
- `posts` - Community feed posts
- `tournaments` - Tournament and competition data
- `games` - Game results and statistics
- `chat_messages` - Team and community chat
- `notifications` - User notifications
- `performance_data` - Performance metrics and analytics

## Next Steps

1. **Open the app**: Navigate to http://localhost:4000
2. **Create an account**: Use the registration page
3. **Explore features**: All functionality is connected to real data
4. **Check console**: Monitor Supabase connection status
5. **Test real-time**: Make changes and see them update in real-time

## Stopping the Servers

Press `Ctrl+C` in the terminal where you ran the script, or:

```bash
# Kill all Node processes (be careful!)
pkill -f "node.*server"
pkill -f "node.*dev-server"
```

---

**Happy Coding! 🏈✨**
