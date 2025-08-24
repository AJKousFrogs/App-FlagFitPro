# 🚀 FlagFit Pro Deployment Guide

## Quick Start

### Local Development
```bash
git clone https://github.com/AJKous31/app-new-flag.git
cd app-new-flag
npm install
npm run dev
```

### Production Build
```bash
npm run build      # Creates optimized /dist folder
npm run preview    # Preview production build locally
```

## Deployment Options

### Netlify (Recommended)
1. **Connect Repository**: Link GitHub repository to Netlify
2. **Build Settings**: 
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: 18
3. **Deploy**: Automatic on push to main branch

### Vercel
```bash
npm i -g vercel
vercel --prod
```

### GitHub Pages
Configure GitHub Actions workflow for automatic deployment.

## Environment Configuration

### Production Variables
```bash
VITE_NODE_ENV=production
VITE_API_BASE_URL=https://your-api-domain.com
```

### Development Variables
```bash
VITE_NODE_ENV=development
VITE_API_BASE_URL=http://localhost:3000
```

## Performance Features
- **Bundle Optimization**: Code splitting and tree shaking
- **PWA Support**: Service worker for offline functionality
- **CDN Integration**: Optimized asset delivery
- **Caching Strategy**: Efficient browser caching

## Security
- CSP headers configured
- HTTPS enforcement
- XSS protection enabled
- Secure authentication flow

## Troubleshooting

### Common Issues
- **Build failures**: Check Node version (18+)
- **Routing issues**: Verify SPA redirects configured
- **Performance**: Analyze bundle size with build tools

### Support
- GitHub Issues for bug reports
- Documentation for implementation guides
- Community discussions for questions