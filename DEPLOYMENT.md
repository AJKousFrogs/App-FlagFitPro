# Deployment Guide

This guide covers deploying FlagFit Pro to production environments.

## 🚀 Quick Deploy

### Netlify (Recommended)

1. **Connect Repository**
   - Push code to GitHub
   - Connect repository in Netlify dashboard
   - Set build command: `npm run build`
   - Set publish directory: `dist`

2. **Environment Variables**
   - Go to Site Settings → Environment Variables
   - Add Supabase credentials

3. **Deploy**
   - Netlify will auto-deploy on git push

1. **Connect Repository**
   - Push code to GitHub
   - Connect repository in Netlify dashboard
   - Set build command: `npm run build`
   - Set publish directory: `dist`

2. **Environment Variables**
   - Go to Site Settings → Environment Variables
   - Add Supabase credentials

3. **Deploy**
   - Netlify will auto-deploy on git push

## 🔧 Production Setup

### 1. Environment Configuration

Create `.env.production`:
```env
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_supabase_anon_key
VITE_APP_ENVIRONMENT=production
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_PUSH_NOTIFICATIONS=true
```

### 2. Database Migration

1. **Backup Development Data** (if needed)
   ```sql
   -- Export data from development
   pg_dump your_dev_db > backup.sql
   ```

2. **Apply Schema to Production**
   - Copy `database/schema.sql` to production Supabase
   - Run in SQL Editor

3. **Verify Data Integrity**
   ```sql
   -- Check foreign key constraints
   SELECT * FROM information_schema.table_constraints 
   WHERE constraint_type = 'FOREIGN KEY';
   ```

### 3. Domain Configuration

#### Custom Domain Setup

1. **Netlify**
   - Go to Site Settings → Domain Management
   - Add custom domain
   - Update DNS records

#### SSL Certificate
- Automatically handled by Netlify
- Force HTTPS redirect in app configuration

### 4. PWA Configuration

Update `vite.config.js` for production:
```javascript
VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/api\.supabase\.co\/.*$/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'supabase-api',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24
          }
        }
      }
    ]
  }
})
```

## 📊 Performance Optimization

### 1. Build Optimization

```bash
# Analyze bundle size
npm run build -- --analyze

# Optimize images
npm install -g imagemin-cli
imagemin src/assets/* --out-dir=dist/assets
```

### 2. Caching Strategy

Configure service worker caching:
```javascript
// Cache static assets
{
  urlPattern: /\.(js|css|png|jpg|jpeg|svg|gif|webp)$/,
  handler: 'CacheFirst',
  options: {
    cacheName: 'static-assets',
    expiration: {
      maxEntries: 200,
      maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
    }
  }
}
```

### 3. CDN Configuration

- **Netlify**: Global CDN with automatic optimization
- **Custom CDN**: Configure Cloudflare or similar

## 🔐 Security Configuration

### 1. Environment Variables

Never commit sensitive data:
```bash
# Add to .gitignore
.env
.env.local
.env.production
```

### 2. Supabase Security

1. **Row Level Security**
   - Verify RLS policies are active
   - Test with different user roles

2. **API Keys**
   - Use anon key for client-side
   - Keep service role key server-side only

3. **CORS Configuration**
   ```sql
   -- In Supabase dashboard
   -- Settings → API → CORS
   -- Add your domain
   ```

### 3. Content Security Policy

Add CSP headers:
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' 'unsafe-eval' https://api.supabase.co;
               style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
               font-src 'self' https://fonts.gstatic.com;
               img-src 'self' data: https:;
               connect-src 'self' https://api.supabase.co;">
```

## 📱 PWA Deployment

### 1. Manifest Configuration

Update `manifest.webmanifest`:
```json
{
  "name": "FlagFit Pro",
  "short_name": "FlagFit",
  "description": "Elite Flag Football Training Platform",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3B82F6",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### 2. Service Worker

Ensure service worker is registered:
```javascript
// In main.js
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
  })
}
```

### 3. Offline Support

Test offline functionality:
1. Build and deploy app
2. Open in browser
3. Disconnect internet
4. Verify core features work offline

## 📈 Monitoring & Analytics

### 1. Error Tracking

Configure Sentry (optional):
```javascript
// In main.js
import * as Sentry from '@sentry/vue'

Sentry.init({
  app,
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_APP_ENVIRONMENT
})
```

### 2. Performance Monitoring

- **Netlify Analytics**: Site performance insights
- **Google Analytics**: User behavior tracking

### 3. Health Checks

Create health check endpoint:
```javascript
// Add to your app
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})
```

## 🔄 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          
      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v2.0
        with:
          publish-dir: './dist'
          production-branch: main
          github-token: ${{ secrets.GITHUB_TOKEN }}
          deploy-message: "Deploy from GitHub Actions"
```

## 🧪 Testing

### 1. Pre-deployment Tests

```bash
# Run all tests
npm run test

# Check build
npm run build

# Preview build
npm run preview

# Lint code
npm run lint
```

### 2. Production Testing

1. **Functionality Tests**
   - Test all user flows
   - Verify authentication works
   - Check data persistence

2. **Performance Tests**
   - Lighthouse audit
   - Core Web Vitals
   - Load testing

3. **Security Tests**
   - Penetration testing
   - Authentication bypass attempts
   - Data access controls

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clear cache
   rm -rf node_modules package-lock.json
   npm install
   
   # Check environment variables
   echo $VITE_SUPABASE_URL
   ```

2. **Database Connection Issues**
   - Verify Supabase URL and key
   - Check CORS settings
   - Test API endpoints

3. **PWA Issues**
   - Clear browser cache
   - Check service worker registration
   - Verify manifest file

### Support Resources

- **Netlify Documentation**: [netlify.com/docs](https://netlify.com/docs)
- **Supabase Documentation**: [supabase.com/docs](https://supabase.com/docs)

## 📋 Deployment Checklist

- [ ] Environment variables configured
- [ ] Database schema applied
- [ ] Domain and SSL configured
- [ ] PWA manifest updated
- [ ] Service worker registered
- [ ] Performance optimized
- [ ] Security policies active
- [ ] Monitoring configured
- [ ] Tests passing
- [ ] Documentation updated

---

**Need help?** Check the main README or create an issue on GitHub. 