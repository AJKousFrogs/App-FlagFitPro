# Dependency Report

Generated: $(date)

## Overview

This report documents all dependencies across Angular, JavaScript, CSS, HTML, JSON, CJS, GitHub Actions, and Cursor configurations.

---

## 📦 NPM Dependencies

### Root Package (`package.json`)

#### Production Dependencies

- **@supabase/supabase-js**: ^2.58.0 - Supabase client library
- **bcryptjs**: ^2.4.3 - Password hashing
- **chart.js**: ^4.4.1 - Charting library
- **cors**: ^2.8.5 - CORS middleware
- **date-fns**: ^3.3.1 - Date utility library
- **dotenv**: ^16.6.1 - Environment variable management
- **express**: ^4.21.2 - Web server framework
- **express-rate-limit**: ^7.1.5 - Rate limiting middleware
- **jsonwebtoken**: ^9.0.2 - JWT token handling
- **node-fetch**: ^3.3.2 - HTTP client
- **nodemailer**: ^7.0.10 - Email sending
- **pg**: ^8.11.3 - PostgreSQL client

#### Development Dependencies

- **@playwright/test**: ^1.42.1 - E2E testing framework
- **@testing-library/dom**: ^9.3.4 - DOM testing utilities
- **@testing-library/jest-dom**: ^6.4.2 - Jest DOM matchers
- **autoprefixer**: ^10.4.21 - CSS autoprefixer
- **chokidar**: ^3.5.3 - File watching
- **concurrently**: ^8.2.2 - Run multiple commands concurrently
- **eslint**: ^9.39.1 - JavaScript linter
- **jsdom**: ^24.0.0 - DOM implementation for Node.js
- **netlify-cli**: ^23.12.3 - Netlify CLI
- **nodemon**: ^3.1.10 - Development server with auto-reload
- **playwright**: ^1.42.1 - Browser automation
- **postcss**: ^8.5.6 - CSS post-processor
- **prettier**: ^3.6.2 - Code formatter
- **supertest**: ^6.3.4 - HTTP assertion library
- **tailwindcss**: ^4.1.12 - Utility-first CSS framework
- **vitest**: ^1.6.0 - Unit testing framework
- **ws**: ^8.14.2 - WebSocket library

---

## 🅰️ Angular Dependencies (`angular/package.json`)

### Production Dependencies

- **@angular/animations**: ^21.0.3
- **@angular/common**: ^21.0.3
- **@angular/compiler**: ^21.0.3
- **@angular/core**: ^21.0.3
- **@angular/forms**: ^21.0.3
- **@angular/platform-browser**: ^21.0.3
- **@angular/platform-browser-dynamic**: ^21.0.3
- **@angular/router**: ^21.0.3
- **@standard-schema/spec**: ^1.0.0
- **chart.js**: ^4.4.1 - Charting (shared with root)
- **primeicons**: ^7.0.0 - PrimeNG icon library
- **primeng**: ^21.0.1 - PrimeNG UI component library
- **rxjs**: ~7.8.0 - Reactive programming library
- **tslib**: ^2.3.0 - TypeScript runtime library
- **zone.js**: ^0.16.0 - Angular change detection

### Development Dependencies

- **@angular-devkit/build-angular**: ^21.0.2 - Angular build tools
- **@angular/cli**: ^21.0.2 - Angular CLI
- **@angular/compiler-cli**: ^21.0.3 - Angular compiler
- **@types/node**: ^24.10.1 - Node.js type definitions
- **typescript**: ~5.9.3 - TypeScript compiler

---

## 🌐 HTML External Dependencies

### CDN Resources

- **Google Fonts**:
  - Poppins (weights: 300, 400, 500, 600, 700, 800)
  - Inter (weights: 300, 400, 500, 600, 700, 800, 900) - Angular only
  - URLs: `https://fonts.googleapis.com`, `https://fonts.gstatic.com`

- **Lucide Icons**:
  - CDN: `https://cdn.jsdelivr.net/npm/lucide@latest/dist/umd/lucide.min.js`
  - Used in: `index.html`, `login.html`, `workout.html`, and other HTML pages

### External Image URLs (Sponsors)

- `https://gearxpro-sports.com/cdn/shop/files/Secondary_logo_Positive.png`
- `https://www.laprimafit.com/image/cache/catalog/logo/La_primafit_logo_black_linear_white_600w-1062x185.png`
- `https://www.chemius.net/wp-content/uploads/2021/09/logo-chemius-header.png`

---

## 🎨 CSS Dependencies

### CSS Architecture

- **CSS Layers**: Uses modern CSS layer architecture
  - `@layer base` - Base styles
  - `@layer tokens` - Design tokens
  - `@layer breakpoints` - Responsive breakpoints
  - `@layer theme` - Theme styles (light, dark, high-contrast)
  - `@layer layout` - Layout styles
  - `@layer components` - Component styles
  - `@layer gradients` - Gradient utilities

### CSS Imports (from `src/css/main.css`)

- `./base.css`
- `./tokens.css`
- `./z-index-system.css`
- `./body-classes.css`
- `./breakpoints.css`
- `./themes/light.css`
- `./themes/dark.css`
- `./themes/high-contrast.css`
- `./layout.css`
- `./layout-modern.css`
- `./pages/auth.css`
- `./gradients.css`
- `./components/button.css`

### Angular Styles (`angular/src/styles.scss`)

- **PrimeIcons**: `@import "primeicons/primeicons.css"`
- **SCSS Variables**: Uses `@use` for design system variables
  - `./assets/styles/variables`
  - `./assets/styles/theme`

### PostCSS Configuration

- **tailwindcss**: CSS framework plugin
- **autoprefixer**: Browser prefix plugin

---

## 📜 JavaScript/CJS Dependencies

### ES Module Imports (Frontend JS)

- **@supabase/supabase-js**: `createClient` from `@supabase/supabase-js`
- **Local modules**: Various internal imports using relative paths

### CommonJS Requires (Netlify Functions)

- **@supabase/supabase-js**: `require("@supabase/supabase-js")`
- **jsonwebtoken**: `require("jsonwebtoken")`
- **nodemailer**: `require("nodemailer")`
- **pg**: `require("pg")` - PostgreSQL client
- **Local modules**: Internal CJS modules using `require()`

### External JavaScript Libraries (via CDN)

- **Lucide Icons**: Loaded via CDN in HTML files
- **Chart.js**: Available globally (from npm package)

---

## ⚙️ Configuration Files

### TypeScript (`angular/tsconfig.json`)

- **Target**: ES2022
- **Module**: ES2022
- **Module Resolution**: bundler
- **Strict Mode**: Enabled
- **Angular Compiler Options**: Strict templates, strict injection parameters

### ESLint (`eslint.config.js`)

- **ECMAScript Version**: 2022
- **Source Type**: module
- **Globals**: Browser APIs, Node.js globals, test globals
- **Third-party globals**: Chart, lucide

### Vitest (`vitest.config.js`)

- **Environment**: jsdom
- **Coverage Provider**: v8
- **Path Aliases**: `@`, `@components`, `@services`, `@utils`

### Playwright (`playwright.config.js`)

- **Browsers**: Chromium, Firefox, WebKit
- **Devices**: Desktop Chrome, Desktop Firefox, Desktop Safari, Pixel 5, iPhone 12
- **Base URL**: `http://localhost:4000`

### Tailwind CSS (`tailwind.config.js`)

- **Content**: HTML, JS, CJS files
- **Plugins**: None configured
- **Theme**: Extended with custom design tokens

### PostCSS (`postcss.config.js`)

- **Plugins**: tailwindcss, autoprefixer

---

## 🔧 GitHub Actions Dependencies

### Workflow File: `.github/workflows/comprehensive-testing.yml`

#### GitHub Actions Used

- **actions/checkout@v4** - Checkout repository code
- **actions/setup-node@v3** - Setup Node.js environment
- **actions/upload-artifact@v3** - Upload build artifacts
- **actions/download-artifact@v3** - Download build artifacts
- **codecov/codecov-action@v3** - Upload coverage reports
- **8398a7/action-slack@v3** - Slack notifications

#### External Tools Used in Workflow

- **wait-on** - Wait for services to be ready (via `npx wait-on`)
- **PostgreSQL**: `postgres:14` Docker image
- **Redis**: `redis:7-alpine` Docker image

#### Node.js Versions Tested

- Node 16, 18, 20 (matrix testing)
- Default: Node 18

#### Operating Systems Tested

- ubuntu-latest
- windows-latest
- macos-latest

#### Browsers Tested

- chromium
- firefox
- webkit (Safari)
- chrome
- edge
- safari

---

## 📄 JSON Dependencies

### Manifest (`manifest.json`)

- PWA manifest file
- No external dependencies
- Uses inline SVG icons

### Angular Configuration (`angular.json`)

- **Schema**: `./node_modules/@angular/cli/lib/config/schema.json`
- **Builders**: `@angular-devkit/build-angular:application`
- **Dev Server**: `@angular-devkit/build-angular:dev-server`

### Netlify Configuration (`netlify.toml`)

- **Build Tool**: Netlify Functions
- **External Services**:
  - Supabase: `https://*.supabase.co`
  - Netlify: `https://*.netlify.app`, `https://*.netlify.com`
  - CDN: `https://cdn.jsdelivr.net`
  - Fonts: `https://fonts.googleapis.com`, `https://fonts.gstatic.com`

---

## 🔍 Cursor Configuration

### Cursor-Specific Files

- **.cursorignore**: Not found (not configured)
- **.cursorrules**: Not found (not configured)
- **.cursor/**: Not found (no Cursor-specific directory)

**Note**: No Cursor-specific configuration files detected. Consider adding `.cursorrules` for project-specific AI assistance rules.

---

## 🔐 Environment Variables Required

### Supabase

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY` (server-side only)

### JWT

- `JWT_SECRET`

### Database

- `DATABASE_URL` (for PostgreSQL connection)

### Email (Nodemailer)

- Email service configuration (varies by provider)

### Netlify

- `NETLIFY_TOKEN`
- `NETLIFY_STAGING_SITE_ID`
- `STAGING_URL`

### GitHub Actions Secrets

- `SLACK_WEBHOOK_URL`

---

## 📊 Dependency Summary

### Total Count

- **Root NPM Dependencies**: 12 production, 16 dev
- **Angular NPM Dependencies**: 15 production, 5 dev
- **CDN Resources**: 2 (Google Fonts, Lucide Icons)
- **GitHub Actions**: 6 actions
- **Docker Images**: 2 (PostgreSQL, Redis)

### Security Considerations

1. **CDN Resources**: External CDN dependencies (jsdelivr, Google Fonts) should be monitored for security
2. **NPM Packages**: Regular security audits recommended (`npm audit`)
3. **GitHub Actions**: Actions should be pinned to specific versions for security
4. **External URLs**: Sponsor logos loaded from external domains

### Recommendations

1. ✅ Consider adding `.cursorrules` for Cursor AI assistance
2. ✅ Pin GitHub Actions to specific versions (currently using v3/v4)
3. ✅ Consider self-hosting fonts or using font-display: swap
4. ✅ Monitor CDN dependencies for security updates
5. ✅ Regular dependency updates (`npm update`, `npm audit`)

---

## 🔄 Update Commands

```bash
# Check for outdated packages
npm outdated

# Update all packages (root)
npm update

# Update Angular packages
cd angular && npm update

# Security audit
npm audit
npm audit fix

# Check for vulnerabilities
npm audit --audit-level high
```

---

_Report generated automatically. Review regularly for security and compatibility updates._
