# 🔬 Hybrid Analytics Setup Guide

## Overview

The FlagFit Pro app uses a hybrid analytics architecture combining two complementary systems:

- **PocketBase**: Real-time event tracking, offline support, fast writes
- **Neon PostgreSQL**: Advanced analytics, complex queries, reporting dashboard

## Architecture Benefits

### PocketBase (Primary)
- ✅ Real-time synchronization
- ✅ Offline capability
- ✅ Fast writes and basic queries
- ✅ Built-in authentication integration
- ✅ Simple setup and maintenance

### Neon PostgreSQL (Secondary)
- ✅ Complex analytical queries
- ✅ Advanced reporting and dashboards
- ✅ Data aggregation and insights
- ✅ SQL-based analysis
- ✅ Scalable data warehouse

## Quick Setup

### 1. Neon Database Setup

1. **Create Neon Account**
   - Go to [neon.tech](https://neon.tech)
   - Sign up with GitHub
   - Create a new database project

2. **Get Connection String**
   - Copy your Neon connection string
   - It looks like: `postgresql://user:password@host.neon.tech/dbname`

3. **Run Database Schema**
   ```bash
   # Connect to your Neon database and run:
   psql "postgresql://user:password@host.neon.tech/dbname" -f database/schema.sql
   ```

### 2. Netlify Environment Variables

In your Netlify dashboard, add these environment variables:

```bash
# Required: Neon Database Connection
NETLIFY_DATABASE_URL=postgresql://user:password@host.neon.tech/dbname

# Optional: Analytics Configuration
VITE_ENABLE_ANALYTICS=true
VITE_ANALYTICS_DEBUG=false

# Existing PocketBase Configuration
VITE_POCKETBASE_URL=https://your-pocketbase-instance.com
VITE_APP_ENVIRONMENT=production
```

### 3. Deploy Functions

The Netlify Functions are automatically deployed with your site:
- `/.netlify/functions/analytics` - Event tracking and retrieval
- `/.netlify/functions/performance` - Performance metrics
- `/.netlify/functions/user-behavior` - User journey analysis

## Usage Examples

### Basic Event Tracking

```javascript
import { hybridAnalyticsService } from './services/hybrid-analytics.service.js';

// Track page view
hybridAnalyticsService.trackPageView({
  page_title: 'Training Dashboard',
  user_type: 'premium'
});

// Track feature usage
hybridAnalyticsService.trackFeatureUsage('training_timer', {
  session_duration: 1800,
  exercises_completed: 5
});

// Track user action
hybridAnalyticsService.trackUserAction('goal_created', {
  goal_type: 'agility',
  target_value: 10
});
```

### Performance Tracking

```javascript
// Manual performance tracking
hybridAnalyticsService.trackPerformance({
  load_time: 1250,
  api_response_time: 85,
  memory_usage: 45.2
});

// Automatic performance tracking (call once on app init)
hybridAnalyticsService.startPerformanceTracking();
```

### Analytics Queries

```javascript
// Get basic analytics (from PocketBase - fast)
const basicData = await hybridAnalyticsService.getBasicAnalytics({
  timeframe: '7d',
  userId: 'user_123'
});

// Get advanced analytics (from Neon - powerful)
const advancedData = await hybridAnalyticsService.getAdvancedAnalytics({
  timeframe: '30d',
  eventType: 'training_session'
});

// Get user behavior analysis
const behaviorData = await hybridAnalyticsService.getUserBehavior({
  timeframe: '7d'
});

// Get performance report
const performanceData = await hybridAnalyticsService.getPerformanceReport({
  timeframe: '30d'
});
```

## API Endpoints

### Analytics Function (`/.netlify/functions/analytics`)

**POST** - Track Event
```json
{
  "user_id": "user_123",
  "event_type": "page_view",
  "event_data": {
    "page_title": "Dashboard",
    "referrer": "https://google.com"
  },
  "session_id": "session_456",
  "page_url": "https://app.com/dashboard",
  "user_agent": "Mozilla/5.0..."
}
```

**GET** - Get Analytics Data
```bash
GET /.netlify/functions/analytics?timeframe=7d&userId=user_123&eventType=page_view
```

### Performance Function (`/.netlify/functions/performance`)

**POST** - Record Performance Metric
```json
{
  "user_id": "user_123",
  "page_url": "https://app.com/dashboard",
  "load_time": 1250.5,
  "api_response_time": 85.2,
  "connection_type": "4g"
}
```

**GET** - Get Performance Report
```bash
GET /.netlify/functions/performance?timeframe=30d
```

### User Behavior Function (`/.netlify/functions/user-behavior`)

**GET** - Get User Behavior Analysis
```bash
GET /.netlify/functions/user-behavior?timeframe=7d&userId=user_123
```

## Frontend Integration

### 1. App Initialization

```javascript
// src/main.jsx
import { hybridAnalyticsService } from './services/hybrid-analytics.service.js';

// Initialize analytics
hybridAnalyticsService.startPerformanceTracking();

// Track app start
hybridAnalyticsService.trackEvent({
  type: 'app_initialized',
  app_version: import.meta.env.VITE_APP_VERSION
});
```

### 2. Component Integration

```javascript
// src/components/TrainingSession.jsx
import { useEffect } from 'react';
import { hybridAnalyticsService } from '../services/hybrid-analytics.service.js';

export function TrainingSession() {
  useEffect(() => {
    // Track page view
    hybridAnalyticsService.trackPageView({
      page_title: 'Training Session',
      training_type: 'agility'
    });
  }, []);

  const handleStartTraining = () => {
    hybridAnalyticsService.trackUserAction('training_started', {
      training_type: 'agility',
      difficulty: 'intermediate'
    });
  };

  return (
    <div>
      <button onClick={handleStartTraining}>
        Start Training
      </button>
    </div>
  );
}
```

### 3. Router Integration

```javascript
// src/App.jsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { hybridAnalyticsService } from './services/hybrid-analytics.service.js';

export function App() {
  const location = useLocation();

  useEffect(() => {
    // Track route changes
    hybridAnalyticsService.trackPageView({
      page_path: location.pathname,
      page_title: document.title
    });
  }, [location]);

  return <Router>{/* Your app content */}</Router>;
}
```

## Data Flow

```
User Action
    ↓
Frontend Component
    ↓
Hybrid Analytics Service
    ↓
┌─────────────────┬─────────────────┐
│   PocketBase    │      Neon      │
│   (Real-time)   │   (Analytics)   │
├─────────────────┼─────────────────┤
│ ✓ Immediate     │ ✓ Via Netlify   │
│ ✓ Offline       │   Functions     │
│ ✓ Simple        │ ✓ Advanced      │
│   Queries       │   Queries       │
└─────────────────┴─────────────────┘
    ↓                     ↓
Basic Dashboards    Advanced Reports
```

## Offline Support

The hybrid system gracefully handles offline scenarios:

1. **Online**: Events tracked to both PocketBase and Neon
2. **Offline**: Events tracked to PocketBase only, queued for Neon
3. **Back Online**: Queued events automatically sent to Neon

## Query Performance

### Fast Queries (Use PocketBase)
- Recent events (last 100)
- Current user's data
- Real-time updates
- Simple filters

### Complex Queries (Use Neon)
- Multi-user aggregations
- Time-series analysis
- Conversion funnels
- Performance trends
- User journey analysis

## Monitoring

### Health Checks

```javascript
// Check if hybrid analytics is working
const health = await fetch('/.netlify/functions/analytics')
  .then(r => r.ok)
  .catch(() => false);

if (!health) {
  console.warn('Advanced analytics unavailable, using basic analytics only');
}
```

### Error Handling

```javascript
// Built into the service
hybridAnalyticsService.trackEvent(eventData)
  .catch(error => {
    // Automatically falls back to PocketBase-only
    console.warn('Hybrid tracking failed, using basic tracking');
  });
```

## Security Considerations

### Environment Variables
- Never expose database credentials in frontend code
- Use Netlify's environment variable management
- Prefix frontend variables with `VITE_` only

### Database Access
- Netlify Functions act as secure API layer
- No direct database access from frontend
- Built-in SQL injection protection via parameterized queries

### CORS
- Functions include proper CORS headers
- Supports all required HTTP methods
- Handles preflight requests

## Troubleshooting

### Common Issues

1. **Functions Not Deploying**
   - Check `netlify.toml` configuration
   - Verify `@netlify/neon` dependency
   - Check function file names and exports

2. **Database Connection Fails**
   - Verify `NETLIFY_DATABASE_URL` is set correctly
   - Check Neon database is running
   - Test connection string manually

3. **Analytics Not Working**
   - Check browser network tab for function calls
   - Verify environment variables are set
   - Check Netlify function logs

4. **Performance Issues**
   - Monitor Neon database query performance
   - Check database indexes are created
   - Consider query optimization

### Debug Mode

Enable debug logging:
```bash
VITE_ANALYTICS_DEBUG=true
```

This will log all analytics events to the browser console.

## Cost Optimization

### Neon Database
- Use connection pooling
- Optimize queries with proper indexes
- Archive old data regularly
- Monitor query performance

### Netlify Functions
- Functions are pay-per-use
- Monitor function execution time
- Optimize database queries
- Use appropriate timeouts

## Scaling Considerations

### High Volume
- Consider database partitioning by date
- Implement data archiving strategy
- Monitor Neon connection limits
- Add query result caching

### Multiple Environments
- Use separate Neon databases for staging/production
- Implement environment-specific configuration
- Use branch-specific environment variables

## Success Metrics

### Technical
- Function response time < 200ms
- Database query time < 100ms
- 99.9% uptime for analytics functions
- <1% failed event tracking

### Business
- User engagement metrics
- Feature adoption rates
- Performance improvements
- Conversion funnel optimization