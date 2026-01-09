# Redis Rate Limiting Migration Guide

**Status**: 📝 Documentation  
**Priority**: Low - Implement when scaling horizontally  
**Current Implementation**: In-memory rate limiting (adequate for single server)

---

## When to Migrate to Redis

### Current Implementation is Adequate If:
- ✅ Running single server instance
- ✅ Not using load balancer
- ✅ Rate limits reset on server restart is acceptable
- ✅ Vertical scaling is sufficient

### Migrate to Redis When:
- ❌ Deploying multiple server instances
- ❌ Using horizontal scaling / load balancer
- ❌ Rate limits need to persist across restarts
- ❌ Need shared rate limiting across servers
- ❌ Deploying to serverless/edge (Vercel, Netlify Functions)

---

## Current Implementation

**File**: `routes/utils/rate-limiter.js`

**How It Works**:
- In-memory Map stores rate limit counters per IP/user
- Counters reset after time window expires
- Simple, fast, no external dependencies
- Perfect for development and single-instance production

**Limitations**:
- Counters don't persist across server restarts
- Each server instance has its own counters (not shared)
- Not suitable for load-balanced deployments

---

## Redis Migration Steps

### Step 1: Install Dependencies

```bash
npm install redis rate-limit-redis
```

### Step 2: Set Up Redis Connection

Create `routes/utils/redis-client.js`:

```javascript
import { createClient } from 'redis';
import { serverLogger } from './server-logger.js';

let redisClient = null;

export async function getRedisClient() {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  try {
    redisClient = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 5000,
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            serverLogger.error('[Redis] Max retries reached, giving up');
            return new Error('Max retries reached');
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    redisClient.on('error', (err) => {
      serverLogger.error('[Redis] Connection error:', err);
    });

    redisClient.on('connect', () => {
      serverLogger.info('[Redis] Connected successfully');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    serverLogger.error('[Redis] Failed to connect:', error);
    throw error;
  }
}

export async function closeRedisClient() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
```

### Step 3: Update Rate Limiter

Update `routes/utils/rate-limiter.js`:

```javascript
import { getRedisClient } from './redis-client.js';
import { RedisStore } from 'rate-limit-redis';
import { serverLogger } from './server-logger.js';

// Try to use Redis, fall back to in-memory
let store = null;

async function getStore() {
  if (store) {
    return store;
  }

  try {
    const redisClient = await getRedisClient();
    store = new RedisStore({
      client: redisClient,
      prefix: 'rl:', // Rate limit key prefix
      sendCommand: (...args) => redisClient.sendCommand(args),
    });
    serverLogger.info('[RateLimit] Using Redis store');
    return store;
  } catch (error) {
    serverLogger.warn('[RateLimit] Redis unavailable, using memory store');
    // Fall back to in-memory (current implementation)
    return null;
  }
}

export function rateLimit(type = "READ") {
  const config = RATE_LIMITS[type];
  
  return async (req, res, next) => {
    const rateLimitStore = await getStore();
    
    // If Redis available, use express-rate-limit with RedisStore
    if (rateLimitStore) {
      const limiter = expressRateLimit({
        store: rateLimitStore,
        windowMs: config.windowMs,
        max: config.max,
        message: {
          success: false,
          error: config.message,
          code: "RATE_LIMIT_EXCEEDED",
          retryAfter: Math.ceil(config.windowMs / 1000),
        },
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req) => req.ip === '127.0.0.1' || req.ip === '::1',
      });
      
      return limiter(req, res, next);
    }
    
    // Otherwise use in-memory implementation (current code)
    // ... existing in-memory logic ...
  };
}
```

### Step 4: Environment Variables

Add to `.env`:

```bash
# Redis Configuration (optional - falls back to in-memory if not set)
REDIS_URL=redis://localhost:6379

# For Redis Cloud / Upstash:
# REDIS_URL=rediss://default:password@your-redis-url.com:6379

# For development with Docker:
# REDIS_URL=redis://redis:6379
```

### Step 5: Docker Compose (Development)

Add Redis to `docker-compose.yml`:

```yaml
version: '3.8'
services:
  app:
    # ... existing app config ...
    environment:
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  redis_data:
```

### Step 6: Update Server Shutdown

In `server.js`, add graceful Redis shutdown:

```javascript
import { closeRedisClient } from './routes/utils/redis-client.js';

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await closeRedisClient(); // Close Redis connection
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
```

---

## Production Deployment Options

### Option 1: Redis Cloud (Recommended)
**Best for**: Serverless, multi-region deployments

- Sign up: https://redis.com/try-free/
- Free tier: 30MB, perfect for rate limiting
- Get connection URL
- Set `REDIS_URL` environment variable

```bash
# Example Redis Cloud URL
REDIS_URL=rediss://default:password@redis-12345.c123.us-east-1-1.ec2.cloud.redislabs.com:12345
```

### Option 2: Upstash (Serverless Redis)
**Best for**: Vercel, Netlify, edge deployments

- Sign up: https://upstash.com/
- Create Redis database
- Get REST API URL
- Free tier: 10K commands/day

```bash
# Example Upstash URL
REDIS_URL=https://your-db.upstash.io
REDIS_TOKEN=your-token-here
```

### Option 3: Self-Hosted Redis
**Best for**: AWS EC2, DigitalOcean, dedicated servers

- Install Redis on server
- Configure firewall (allow port 6379 from app servers only)
- Set strong password
- Use TLS for production

```bash
# Install on Ubuntu
sudo apt update
sudo apt install redis-server

# Configure for production
sudo vim /etc/redis/redis.conf
# Set: requirepass your-strong-password
# Set: bind 0.0.0.0 (or specific IPs)

# Restart
sudo systemctl restart redis-server
```

### Option 4: Managed Redis (AWS ElastiCache, Google MemoryStore)
**Best for**: Cloud-native deployments

- Use cloud provider's managed Redis
- No maintenance required
- Auto-scaling, backups included
- More expensive

---

## Testing Redis Rate Limiting

### Test 1: Verify Redis Connection

```bash
# Start Redis (Docker)
docker run -d -p 6379:6379 redis:7-alpine

# Test connection
redis-cli ping
# Should return: PONG
```

### Test 2: Test Rate Limiting

```bash
# Make 100 rapid requests (should hit rate limit)
for i in {1..100}; do
  curl -s http://localhost:3001/api/training/stats \
    -H "Authorization: Bearer $TOKEN" \
    -o /dev/null -w "Request $i: %{http_code}\n"
done

# Should see 200s then 429s after hitting limit
```

### Test 3: Verify Shared Limits (Multiple Servers)

```bash
# Terminal 1: Start server on port 3001
PORT=3001 npm start

# Terminal 2: Start server on port 3002
PORT=3002 npm start

# Terminal 3: Test rate limit is shared
# First 50 requests to server 1
for i in {1..50}; do
  curl -s http://localhost:3001/api/training/stats \
    -H "Authorization: Bearer $TOKEN"
done

# Next 51 requests to server 2 (should hit rate limit immediately)
curl -s http://localhost:3002/api/training/stats \
  -H "Authorization: Bearer $TOKEN"
# Should return 429 because limit was hit on server 1
```

### Test 4: Check Redis Keys

```bash
# View rate limit keys in Redis
redis-cli --scan --pattern 'rl:*'

# View key value
redis-cli get 'rl:192.168.1.1'

# Clear all rate limits (for testing)
redis-cli --scan --pattern 'rl:*' | xargs redis-cli del
```

---

## Monitoring Redis

### Key Metrics to Watch

```bash
# Redis CLI monitoring
redis-cli INFO stats

# Key metrics:
# - instantaneous_ops_per_sec: Operations per second
# - used_memory_human: Memory usage
# - connected_clients: Active connections
# - keyspace_hits / keyspace_misses: Cache hit rate
```

### Alerts to Set Up

1. **Memory Usage > 80%**: Scale up Redis
2. **Connection Errors**: Check network/firewall
3. **High Latency (>10ms)**: Investigate performance
4. **Eviction Rate > 0**: Increase memory or TTL

---

## Cost Comparison

| Option | Free Tier | Paid (Small) | Paid (Medium) |
|--------|-----------|--------------|---------------|
| **In-Memory (Current)** | ✅ Free | ✅ Free | ✅ Free |
| **Redis Cloud** | 30MB free | $5/mo (250MB) | $10/mo (1GB) |
| **Upstash** | 10K cmds/day | $0.20/100K cmds | $2/1M cmds |
| **AWS ElastiCache** | None | $15/mo (t4g.micro) | $30/mo (t4g.small) |
| **Self-Hosted** | Server cost only | $5-10/mo | $10-20/mo |

**For this app**: Redis Cloud free tier (30MB) is more than enough for rate limiting.

---

## Decision Matrix

| Scenario | Recommendation |
|----------|---------------|
| **Single server, < 1000 users** | ✅ Keep in-memory (current) |
| **Multiple servers, load balanced** | 🔄 Migrate to Redis Cloud |
| **Serverless (Vercel/Netlify)** | 🔄 Migrate to Upstash |
| **High traffic (>100K req/day)** | 🔄 Migrate to Redis Cloud or ElastiCache |
| **Enterprise, dedicated infra** | 🔄 Self-hosted or Managed Redis |

---

## Current Recommendation

**Keep the current in-memory implementation.**

**Reasons**:
1. ✅ Current grade is A+ (96%)
2. ✅ Single server deployment adequate
3. ✅ No immediate scaling needs
4. ✅ Zero cost and complexity
5. ✅ Easy to migrate later if needed

**Migrate when**:
- Deploying to multiple servers
- Adding load balancer
- Moving to serverless
- Rate limit persistence becomes critical

---

## Summary

**Current State**: ✅ In-memory rate limiting (production-ready for single server)  
**Migration Complexity**: Medium (2-4 hours)  
**When to Migrate**: When scaling horizontally  
**Cost**: $0-10/month (Redis Cloud free tier sufficient)

**Status**: 📝 Documented, ready to implement when needed

---

**Related Files**:
- Current implementation: `routes/utils/rate-limiter.js`
- Redis client (to create): `routes/utils/redis-client.js`
- Server config: `server.js`
- Environment: `.env`

**External Resources**:
- Redis Cloud: https://redis.com/try-free/
- Upstash: https://upstash.com/
- rate-limit-redis: https://www.npmjs.com/package/rate-limit-redis
