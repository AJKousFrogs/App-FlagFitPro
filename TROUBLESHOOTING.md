# 🚀 FlagFit Pro - Localhost Troubleshooting Guide

## 🚨 Critical Issues Found & Fixed

### 1. **Duplicate Login Routes** ❌
**Problem**: Server.js has two identical `/api/auth/login` routes (lines 200+ and 400+)
**Impact**: Causes "Cannot set headers after they are sent" errors
**Fix**: Use the fixed `server-fixed.js` file

### 2. **Environment Variable Conflicts** ❌
**Problem**: Multiple .env files with conflicting configurations
**Impact**: Database connection failures, port conflicts
**Fix**: Use the unified `env.fixed` file

### 3. **Database Connection Issues** ❌
**Problem**: No retry logic, poor error handling
**Impact**: Server crashes on database connection failures
**Fix**: Enhanced connection pooling with retry logic

### 4. **Port Management** ❌
**Problem**: No port conflict detection
**Impact**: "Port already in use" errors
**Fix**: Port checking in startup scripts

## 🔧 Quick Fix Commands

### For macOS/Linux:
```bash
chmod +x scripts/start-localhost-fixed.sh
./scripts/start-localhost-fixed.sh
```

### For Windows:
```cmd
scripts\start-localhost-fixed.bat
```

## 🚀 Manual Fix Steps

### Step 1: Backup Original Files
```bash
cp server.js server.js.backup
cp .env .env.backup
```

### Step 2: Apply Fixed Files
```bash
cp server-fixed.js server.js
cp env.fixed .env
```

### Step 3: Install Dependencies
```bash
npm install
```

### Step 4: Start Server
```bash
npm run dev
```

## 🔍 Common Error Solutions

### Error: "Cannot set headers after they are sent"
**Cause**: Duplicate route handlers
**Solution**: Use `server-fixed.js`

### Error: "Port 3001 is already in use"
**Cause**: Another process using the port
**Solution**: 
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Or use different port
PORT=3002 npm start
```

### Error: "Database connection failed"
**Cause**: Network issues or invalid credentials
**Solution**: Check `.env` file and internet connection

### Error: "Module not found"
**Cause**: Missing dependencies
**Solution**: 
```bash
rm -rf node_modules package-lock.json
npm install
```

## 🌐 Port Configuration

| Service | Default Port | Alternative Ports |
|---------|--------------|-------------------|
| API Server | 3001 | 3002, 3003, 8000 |
| Frontend (Vite) | 4000 | 4001, 5173, 3000 |
| Database | 5432 | N/A (Neon Cloud) |

## 🔐 Authentication Issues

### Login Not Working
- **Test Endpoint**: `POST http://localhost:3001/api/auth/login`
- **Test Data**: Any email/password combination
- **Expected Response**: JWT token and user data

### Token Validation Issues
- **Check**: JWT_SECRET in `.env` file
- **Test**: `GET http://localhost:3001/api/auth/me` with Authorization header

## 📊 Health Check Endpoints

### API Health
```bash
curl http://localhost:3001/api/health
```

### Algorithm Health
```bash
curl http://localhost:3001/api/algorithms/health
```

### Dashboard Health
```bash
curl http://localhost:3001/api/dashboard/health
```

### Analytics Health
```bash
curl http://localhost:3001/api/analytics/health
```

## 🗄️ Database Issues

### Connection Test
```bash
node -e "
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

pool.query('SELECT NOW()')
    .then(result => console.log('✅ Connected:', result.rows[0]))
    .catch(error => console.error('❌ Failed:', error.message))
    .finally(() => process.exit());
"
```

### Schema Issues
- **Check**: `database/schema.sql` exists
- **Run**: Database migrations if needed
- **Verify**: Tables exist in Neon database

## 🚨 Emergency Recovery

### If Server Won't Start
1. **Kill all Node processes**:
   ```bash
   pkill -f node
   ```

2. **Clear port conflicts**:
   ```bash
   lsof -ti:3001 | xargs kill -9
   ```

3. **Reset to working state**:
   ```bash
   cp server.js.backup server.js
   cp .env.backup .env
   npm install
   npm run dev
   ```

### If Database Connection Fails
1. **Check internet connection**
2. **Verify Neon database status**
3. **Check `.env` file credentials**
4. **Test with different SSL settings**

## 📱 Frontend Issues

### Vite Not Starting
```bash
# Check if Vite is configured
npm list vite

# Install if missing
npm install --save-dev vite

# Start manually
npx vite --port 4000
```

### CORS Issues
- **Check**: CORS configuration in `server.js`
- **Verify**: Frontend URL is in allowed origins
- **Test**: Browser developer tools for CORS errors

## 🔧 Development Tools

### Logging
```bash
# Enable debug logging
export DEBUG=*
npm run dev

# Or set in .env
VITE_DEBUG_LOGGING=true
```

### Hot Reload Issues
```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Restart with clean state
npm run dev
```

## 📋 Pre-Flight Checklist

Before starting development:

- [ ] Node.js version ≥ 18.0.0
- [ ] npm version ≥ 8.0.0
- [ ] Ports 3001, 4000, 5173 available
- [ ] `.env` file configured correctly
- [ ] Dependencies installed (`npm install`)
- [ ] Database connection working
- [ ] No conflicting processes running

## 🆘 Still Having Issues?

### 1. **Check Logs**
```bash
npm run dev 2>&1 | tee server.log
```

### 2. **Verify Environment**
```bash
node -e "console.log('Node version:', process.version); console.log('NODE_ENV:', process.env.NODE_ENV); console.log('PORT:', process.env.PORT);"
```

### 3. **Test Individual Components**
```bash
# Test database
node -e "require('./routes/dashboardRoutes.js')"

# Test server
node -e "require('./server.js')"
```

### 4. **Reset Everything**
```bash
# Nuclear option - complete reset
rm -rf node_modules package-lock.json
cp server.js.backup server.js
cp .env.backup .env
npm install
npm run dev
```

## 📞 Support

If you're still experiencing issues:

1. **Check the logs** for specific error messages
2. **Verify your environment** matches the requirements
3. **Test with the fixed files** provided
4. **Check port availability** on your system
5. **Ensure database credentials** are correct

## 🎯 Success Indicators

Your localhost build is working correctly when you see:

- ✅ Server starts without errors
- ✅ Database connection established
- ✅ Health check endpoint responds
- ✅ Login endpoint accepts credentials
- ✅ All API routes accessible
- ✅ No port conflicts
- ✅ Frontend loads without CORS errors

---

**Remember**: Always use the fixed startup scripts for the most reliable experience!
