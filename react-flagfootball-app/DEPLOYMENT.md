# 🚀 Deployment Guide - FlagFit Pro

## Quick Start with Netlify (Recommended)

### Option 1: One-Click Deploy
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/AJKous31/flagfit-pro-training-app)

### Option 2: Manual Netlify Setup

1. **Go to Netlify**
   - Visit [netlify.com](https://netlify.com)
   - Sign up/Login with GitHub

2. **New Site from Git**
   - Click "New site from Git"
   - Choose GitHub as your Git provider
   - Select repository: `flagfit-pro-training-app`

3. **Build Settings** (Auto-configured from `netlify.toml`)
   - **Base directory**: `react-flagfootball-app`
   - **Build command**: `npm run build`
   - **Publish directory**: `react-flagfootball-app/dist`
   - **Node version**: 18

4. **Environment Variables** (Optional)
   ```
   VITE_POCKETBASE_URL=https://your-backend.com
   VITE_APP_ENVIRONMENT=production
   VITE_APP_NAME=FlagFit Pro
   ```

5. **Deploy**
   - Click "Deploy site"
   - Wait 2-3 minutes for build completion
   - Your site will be live at `https://your-site-name.netlify.app`

## Alternative Deployment Options

### Railway (Full-Stack)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway create flagfit-pro
railway up
```



### GitHub Pages (Static Only)
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: cd react-flagfootball-app && npm ci && npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./react-flagfootball-app/dist
```

## Environment Configuration

### Production Environment Variables
```bash
# Required
VITE_APP_ENVIRONMENT=production

# Optional (for PocketBase backend)
VITE_POCKETBASE_URL=https://your-backend.pocketbase.io

# Optional (for analytics)
VITE_ENABLE_ANALYTICS=true
VITE_SENTRY_DSN=https://your-sentry-dsn

# Optional (branding)
VITE_APP_NAME=FlagFit Pro
VITE_APP_VERSION=1.0.2
```

### Demo Mode
The app automatically switches to demo mode when:
- No `VITE_POCKETBASE_URL` is configured
- PocketBase URL points to localhost
- Deployed to preview environments

## Build Process

### Local Build
```bash
cd react-flagfootball-app
npm install
npm run build
```

### Build Output
- **Size**: ~313KB main bundle (104KB gzipped)
- **Target**: ES2015 for broad browser support
- **Chunks**: Optimized vendor, router, UI, and PocketBase chunks
- **Assets**: Images, fonts, and CSS properly handled

## Troubleshooting

### Common Issues

1. **Build Fails with Module Resolution**
   - Ensure all imports use `.js` extensions
   - Check `netlify.toml` configuration
   - Verify Node.js version (should be 18+)

2. **App Shows Demo Mode in Production**
   - Set `VITE_POCKETBASE_URL` environment variable
   - Ensure PocketBase backend is accessible
   - Check environment variable naming (must start with `VITE_`)

3. **Routing Issues (404 on refresh)**
   - Ensure SPA redirects are configured
   - Check `netlify.toml` redirect rules
   - Verify build output directory

### Getting Help

If deployment fails:
1. Check build logs for specific errors
2. Verify environment variables are set correctly
3. Ensure repository has latest commits with fixes
4. Try manual deployment steps instead of one-click

## Performance Optimization

### Recommendations
- **CDN**: Automatically handled by Netlify
- **Caching**: Static assets cached for 1 year
- **Compression**: Gzip compression enabled
- **Image Optimization**: Consider adding image optimization service

### Monitoring
- **Uptime**: Use Netlify's built-in monitoring
- **Performance**: Consider adding analytics
- **Errors**: Sentry integration available (set `VITE_SENTRY_DSN`)

## Security Considerations

### Environment Variables
- Never commit `.env` files to version control
- Use platform-specific environment variable management
- Prefix client variables with `VITE_` only

### HTTPS
- Automatically handled by Netlify
- Custom domain SSL certificates supported
- Force HTTPS redirects enabled

### CORS
- Configure PocketBase backend for your domain
- Ensure API endpoints allow your deployment URL
- Test cross-origin requests in production

## Success Checklist

- [ ] Site deploys without errors
- [ ] All routes work (no 404 on refresh)
- [ ] Environment variables configured
- [ ] Demo mode disabled (if backend configured)
- [ ] Authentication flow works
- [ ] All features functional
- [ ] Mobile responsive
- [ ] Performance acceptable (<3s load time)