# Architecture Overview

## 🔐 Authentication Flow

### Frontend (Angular)

Angular uses **Supabase directly** for authentication operations:

- **Login:** `SupabaseService.signIn(email, password)`
- **Register:** `SupabaseService.signUp(email, password, metadata)`
- **Logout:** `SupabaseService.signOut()`
- **Session:** Managed automatically by Supabase client
- **Token:** Retrieved from Supabase session via `SupabaseService.getToken()`

### API Authentication

All API calls use Bearer token authentication:

1. Angular retrieves token from Supabase session
2. `authInterceptor` automatically adds `Authorization: Bearer {token}` header
3. Backend functions verify token using `auth-helper.cjs`
4. Functions use Supabase service role key for database operations

### Why Direct Supabase Auth?

- ✅ Simpler architecture (no backend auth functions needed)
- ✅ Built-in session management
- ✅ Automatic token refresh
- ✅ Secure (tokens verified on backend)

---

## 🌐 API Endpoint Routing

### Request Flow

```
Angular Component/Service
    ↓
API_ENDPOINTS.{resource}.{action}
    ↓
ApiService.get/post/put/delete()
    ↓
Base URL + Endpoint
    ↓
netlify.toml redirect (if /api/*)
    ↓
/.netlify/functions/{function-name}
    ↓
Function handles path-based routing
    ↓
Supabase Backend (via supabase-client.cjs)
```

### Base URL Detection

Angular `ApiService` auto-detects base URL:

- **Production (Netlify):** `/.netlify/functions`
- **Local Dev (Netlify Dev):** `http://localhost:8888/.netlify/functions`
- **Local Dev (Backend Server):** `http://localhost:3001`
- **Fallback:** `http://localhost:3001`

### Endpoint Normalization

- Endpoints starting with `/api/` are kept as-is for Netlify redirects
- If baseUrl ends with `/api`, `/api/` prefix is removed
- Non-API endpoints (like `/auth-me`, `/training-stats`) are used directly

---

## 🗄️ Database Access

### Backend Functions

All backend functions use `supabase-client.cjs`:

- **Service Role Key:** For admin operations (bypasses RLS)
- **Anonymous Key:** For user-scoped operations (respects RLS)
- **Connection:** Singleton pattern for efficiency

### Frontend Direct Access

Angular can also access Supabase directly:

- **Read Operations:** Via Supabase client (respects RLS)
- **Write Operations:** Via API functions (for security/validation)

---

## 📁 File Structure

### Backend (Netlify Functions)

```
netlify/functions/
├── {function-name}.cjs          # Function handlers
├── utils/
│   ├── auth-helper.cjs          # Authentication utilities
│   ├── base-handler.cjs          # Base handler with auth/rate limiting
│   ├── error-handler.cjs         # Error handling utilities
│   └── rate-limiter.cjs          # Rate limiting
└── supabase-client.cjs           # Shared Supabase client
```

### Frontend (Angular)

```
angular/src/app/
├── core/
│   ├── services/
│   │   ├── supabase.service.ts   # Supabase client wrapper
│   │   ├── auth.service.ts        # Auth operations (uses Supabase)
│   │   ├── api.service.ts         # HTTP client wrapper
│   │   └── {feature}.service.ts  # Feature-specific services
│   └── interceptors/
│       └── auth.interceptor.ts    # Adds Bearer token to requests
└── environments/
    ├── environment.ts             # Development config
    └── environment.prod.ts        # Production config
```

---

## 🔧 Environment Variables

### Frontend (Angular)

**Development:**

- Set via `window._env` (injected by dev server)
- Or via `localStorage` (development only)
- Or via build script environment variables

**Production:**

- Injected during build via file replacement
- Or via `window._env` (set by hosting platform)

**Variables:**

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key

### Backend (Netlify Functions)

**Set in Netlify Dashboard → Environment Variables**

**Variables:**

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_KEY` - Service role key (admin operations)
- `SUPABASE_ANON_KEY` - Anonymous key (optional, for some functions)

---

## 🛡️ Security Patterns

### Authentication

1. **Frontend:** User authenticates via Supabase
2. **Token:** Stored in Supabase session (secure, httpOnly cookies)
3. **API Calls:** Token sent via Authorization header
4. **Backend:** Token verified using `auth-helper.cjs`

### Authorization

- **Row Level Security (RLS):** Enforced by Supabase for direct queries
- **Service Role Key:** Used for admin operations (bypasses RLS)
- **User Context:** Extracted from verified JWT token

### Rate Limiting

- Applied via `base-handler.cjs`
- Types: `READ`, `CREATE`, `AUTH`, `DEFAULT`
- Limits: Configurable per function

### CORS

- Handled automatically by Netlify Functions
- Headers set via `CORS_HEADERS` in error-handler.cjs

---

## 📊 Endpoint Status

### ✅ Implemented

- `/auth-me` - Token verification
- `/api/dashboard/*` - Dashboard data
- `/api/analytics/*` - Analytics data
- `/api/community/*` - Community features
- `/api/tournaments/*` - Tournament management
- `/api/training/sessions` - Training sessions
- `/api/performance-data/*` - Performance tracking
- `/training-stats` - Training statistics
- `/knowledge-search` - Knowledge base

### ⚠️ Missing (High Priority)

- `/api/training/suggestions` - AI training suggestions
- `/api/weather/current` - Weather data

### ⚠️ Missing (Medium Priority)

- `/api/nutrition/*` - Nutrition tracking
- `/api/recovery/*` - Recovery protocols

### ⚠️ Missing (Low Priority)

- `/api/admin/*` - Admin operations
- `/api/coach/*` - Coach-specific features

See `ENDPOINT_STATUS.md` for detailed tracking.

---

## 🚀 Development Workflow

### Local Development

1. **Start Dev Server:**

   ```bash
   # Option 1: Netlify Dev
   netlify dev

   # Option 2: Enhanced Dev Server
   npm run dev:enhanced
   ```

2. **Set Environment Variables:**

   ```bash
   export SUPABASE_URL="your-url"
   export SUPABASE_ANON_KEY="your-key"
   ```

3. **Dev Server Injects:**
   - Sets `window._env.SUPABASE_URL`
   - Sets `window._env.SUPABASE_ANON_KEY`
   - Angular reads from `window._env`

### Building for Production

1. **Set Environment Variables:**

   ```bash
   export SUPABASE_URL="your-url"
   export SUPABASE_ANON_KEY="your-key"
   ```

2. **Build Angular:**

   ```bash
   cd angular && npm run build --configuration=production
   ```

3. **File Replacement:**
   - `environment.prod.ts` values replaced during build
   - Or use build script to inject values

---

## 🔄 Data Flow Examples

### Example 1: User Login

```
User enters credentials
    ↓
AuthService.login()
    ↓
SupabaseService.signIn()
    ↓
Supabase Auth API
    ↓
Session created
    ↓
Token available for API calls
```

### Example 2: Fetch Dashboard Data

```
Component calls DashboardDataService.getDashboard()
    ↓
ApiService.get('/api/dashboard/overview')
    ↓
authInterceptor adds Bearer token
    ↓
Request: GET /.netlify/functions/dashboard
    ↓
base-handler verifies token
    ↓
dashboard.cjs fetches data from Supabase
    ↓
Returns data to Angular
```

### Example 3: Create Training Session

```
Component calls TrainingDataService.createSession()
    ↓
ApiService.post('/api/training/sessions', data)
    ↓
authInterceptor adds Bearer token
    ↓
Request: POST /.netlify/functions/training-sessions
    ↓
base-handler verifies token, extracts userId
    ↓
training-sessions.cjs creates record in Supabase
    ↓
Returns created session
```

---

## 📝 Best Practices

### Backend Functions

1. **Always use `base-handler.cjs`** for consistent auth/error handling
2. **Use service role key** for admin operations
3. **Validate input** before database operations
4. **Handle errors gracefully** with proper error responses
5. **Log important operations** for debugging

### Frontend Services

1. **Use Supabase directly** for simple read operations
2. **Use API functions** for write operations or complex logic
3. **Handle errors** with user-friendly messages
4. **Cache data** when appropriate (using signals/observables)
5. **Validate input** before API calls

### Security

1. **Never expose service role key** to frontend
2. **Always verify tokens** on backend
3. **Use RLS policies** for data access control
4. **Rate limit** API endpoints
5. **Validate and sanitize** all user input

---

## 🐛 Troubleshooting

### Angular Can't Connect to Supabase

- Check `window._env.SUPABASE_URL` in browser console
- Verify dev server is injecting environment variables
- Check Supabase credentials are correct

### API Calls Fail with 401

- Verify token is being sent (check Network tab)
- Check token is valid (not expired)
- Verify backend function is using `auth-helper.cjs` correctly

### API Calls Return 404

- Check `netlify.toml` has redirect for endpoint
- Verify function exists in `netlify/functions/`
- Check endpoint path matches redirect pattern

### Environment Variables Not Working

- Verify variables are set in Netlify Dashboard (production)
- Check build script injects variables (local)
- Verify Angular reads from correct source (`window._env` vs file replacement)

---

## 📚 Related Documentation

- `ANGULAR_BE_INCONSISTENCIES.md` - Detailed inconsistency analysis
- `PROPOSED_SOLUTION.md` - Implementation plan
- `IMPLEMENTATION_PLAN.md` - Quick start guide
- `ENDPOINT_STATUS.md` - Endpoint implementation status (to be created)
