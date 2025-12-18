# 🚀 How to Start Dev Server

## Quick Start

### Option 1: Simple Server (Recommended for Testing)
```bash
# In your terminal, run:
node simple-server.js
```

Then open: **http://localhost:4000**

---

### Option 2: Enhanced Dev Server
```bash
npm run dev:enhanced
```

Then open: **http://localhost:4000**

---

### Option 3: Netlify Dev (If you have Netlify CLI)
```bash
npm run dev:netlify
```

---

## Troubleshooting

### If Port 4000 is Already in Use:
```bash
# Check what's using the port
lsof -i :4000

# Kill the process if needed
kill -9 <PID>

# Or use a different port
VITE_DEV_PORT=4001 node simple-server.js
```

### If Server Won't Start:
1. Check Node.js is installed: `node --version`
2. Check dependencies: `npm install`
3. Check for errors in terminal output

### If Browser Can't Connect:
1. Make sure server is actually running (check terminal)
2. Try `http://127.0.0.1:4000` instead of `localhost:4000`
3. Check firewall settings
4. Try a different browser

---

## What Port Does Each Server Use?

- `simple-server.js` → Port 4000
- `dev-server-enhanced.cjs` → Port 4000
- `netlify dev` → Port 8888
- `npm run dev:angular` → Port 4200 (Angular default)

---

## Set Environment Variables (Optional)

If you want Supabase credentials injected:
```bash
export SUPABASE_URL="your-url"
export SUPABASE_ANON_KEY="your-key"
node simple-server.js
```

