# Testing Guide - Angular App with Real API Connections

## 🚀 Current Status

### ✅ Backend Server
- **Running on**: http://localhost:3001
- **Status**: ✅ Active
- **API Endpoints**: ✅ Configured with mock data

### ⏳ Angular Frontend
- **Compiling on**: http://localhost:4200
- **Status**: Building (first compile takes time)
- **API Connection**: ✅ Configured to connect to http://localhost:3001

## 📋 Setup Summary

### 1. Backend Server (Port 3001)
```bash
cd /Users/aljosakous/Documents/GitHub/app-new-flag
node server.js
```

**API Endpoints Available:**
- `/api/health` - Health check
- `/api/auth/*` - Authentication endpoints
- `/api/dashboard/*` - Dashboard data
- `/api/training/*` - Training data
- `/api/analytics/*` - Analytics data
- `/api/tournaments/*` - Tournament data
- `/api/community/*` - Community features
- `/api/wellness/*` - Wellness tracking
- `/api/coach/*` - Coach dashboard

### 2. Angular Frontend (Port 4200)
```bash
cd /Users/aljosakous/Documents/GitHub/app-new-flag/angular
npm start
```

**Configuration:**
- Environment: `src/environments/environment.ts`
- API URL: `http://localhost:3001`
- CORS: Enabled on backend

## 🧪 Testing API Connections

### Test Backend Health
```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "Flag Football Training App Server is running",
  "timestamp": "2024-..."
}
```

### Test Authentication Endpoint
```bash
curl http://localhost:3001/api/auth/me
```

Expected response:
```json
{
  "success": true,
  "data": {
    "id": "1",
    "email": "user@example.com",
    "name": "Test User",
    "role": "player"
  }
}
```

### Test Login Endpoint
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "token": "mock-jwt-token",
    "user": {
      "id": "1",
      "email": "test@example.com",
      "name": "Test User",
      "role": "player"
    }
  }
}
```

## 🔍 Verifying Angular App

Once Angular finishes compiling:

1. **Open Browser**: http://localhost:4200
2. **Check Console**: Open DevTools (F12) → Console tab
3. **Check Network**: DevTools → Network tab → Filter by "XHR"
4. **Test Login**: Try logging in and verify API calls

## 🐛 Troubleshooting

### Backend Not Responding
```bash
# Check if server is running
lsof -ti:3001

# Restart server
pkill -f "node server.js"
cd /Users/aljosakous/Documents/GitHub/app-new-flag
node server.js
```

### Angular Not Compiling
```bash
# Check Angular process
ps aux | grep "ng serve"

# Restart Angular
cd /Users/aljosakous/Documents/GitHub/app-new-flag/angular
npm start
```

### CORS Errors
- Backend has CORS enabled: `app.use(cors())`
- If issues persist, check browser console for specific errors

### API Connection Errors
- Verify backend is running: `curl http://localhost:3001/api/health`
- Check Angular environment: `angular/src/environments/environment.ts`
- Verify API service: `angular/src/app/core/services/api.service.ts`

## 📝 Next Steps

1. ✅ Backend server running
2. ✅ API endpoints configured
3. ⏳ Wait for Angular to finish compiling
4. ⏳ Test login flow
5. ⏳ Test dashboard data loading
6. ⏳ Test other features

## 🔗 Important URLs

- **Backend API**: http://localhost:3001
- **Angular App**: http://localhost:4200
- **Health Check**: http://localhost:3001/api/health

## 📚 API Response Format

All API endpoints return responses in this format:

```typescript
{
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}
```

The Angular `ApiService` expects this format and handles it automatically.

