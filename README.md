# 🏈 FlagFit Pro - Flag Football Training Platform

_Professional-grade training platform with advanced analytics and AI-powered insights_

[![Angular](https://img.shields.io/badge/Angular-21.0+-red.svg)](https://angular.dev/)
[![PrimeNG](https://img.shields.io/badge/PrimeNG-21.0+-blue.svg)](https://primeng.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE.md)

## 🚀 Overview

FlagFit Pro is a comprehensive training platform that combines modern web technologies with sports science to deliver personalized training experiences, advanced performance analytics, and team management tools.

## 🛠 Technology Stack

**PRIMARY STACK: Angular 21 + PrimeNG 21**

- **Frontend Framework**: Angular 21 (Standalone Components)
- **UI Component Library**: PrimeNG 21
- **Icons**: PrimeIcons + Lucide Angular
- **Charts**: PrimeNG Charts (Chart.js wrapper)
- **Forms**: Angular Reactive Forms
- **State Management**: Angular Signals + RxJS
- **Styling**: SCSS with CSS Custom Properties
- **Build**: Angular CLI with ESBuild

**Backend & Infrastructure**:
- **Backend**: Node.js + Express
- **Database**: Supabase PostgreSQL
- **Authentication**: JWT with Angular Guards & Interceptors
- **API**: RESTful API with Netlify Functions
- **Real-Time**: Supabase Realtime subscriptions

**Legacy Files**:
- The root directory contains legacy vanilla HTML/CSS/JS files from the original implementation
- These are maintained for reference but **Angular 21 + PrimeNG 21 is the primary development stack**

## 📁 Project Structure

```
flagfit-pro/
├── angular/                    # PRIMARY: Angular 21 + PrimeNG 21 application
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/          # Core services, guards, interceptors
│   │   │   ├── shared/        # Shared components
│   │   │   └── features/      # Feature modules
│   │   └── assets/
│   ├── angular.json
│   └── package.json
├── src/                        # Legacy vanilla HTML/CSS/JS (reference only)
│   ├── css/
│   ├── js/
│   └── components/
├── netlify/                    # Netlify Functions (backend API)
│   └── functions/
└── docs/                       # Documentation
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Angular CLI 21

### Installation

```bash
# Install Angular CLI globally
npm install -g @angular/cli@21

# Navigate to angular directory
cd angular

# Install dependencies
npm install

# Start development server
npm start
```

The Angular application will be available at `http://localhost:4200`

## ✨ Key Features

### 🏆 Performance Analytics
- AI-Powered Predictions with advanced ML models
- Evidence-Based Research integration
- Flag Football Specific metrics and analytics
- Real-Time Processing ready for GPS/wearable integration
- Interactive Visualizations with PrimeNG Charts

### 🥗 Nutrition Intelligence
- USDA Database Integration
- Precision Hydration tracking
- Evidence-Based Supplements recommendations
- Personalized Strategies with biomarker integration

### 🤝 Team Chemistry
- Relationship Analytics
- Communication Metrics
- Network Visualization
- Performance Impact correlation

### 📊 Advanced Analytics Dashboard
- Real-Time Streaming data
- Predictive Insights with confidence intervals
- Flag Football Optimization
- Research Integration
- Mobile Responsive design

## 🎨 Design System

The application uses a comprehensive design system built on:

- **PrimeNG**: Production-ready UI components
- **SCSS**: Styling with CSS custom properties
- **Design Tokens**: Semantic token system for theming
- **Accessibility**: WCAG 2.1 AA compliant

See [DESIGN_SYSTEM_DOCUMENTATION.md](./DESIGN_SYSTEM_DOCUMENTATION.md) for complete details.

## 🔌 API Integration

All API connections are integrated through Angular services:

- **Auth Service**: Login, Register, Logout, Token Management
- **API Service**: Centralized HTTP client with interceptors
- **Feature Services**: Training, Analytics, Community, Tournaments, etc.

### API Configuration

The API service auto-detects the environment:
- **Development**: Uses mock API or localhost:3001
- **Netlify**: Uses Netlify Functions
- **Production**: Auto-detects based on hostname

## 📦 Development

### Build

```bash
cd angular
npm run build
```

### Test

```bash
cd angular
npm test
```

### Code Generation

```bash
cd angular

# Generate a new component
ng generate component features/my-feature

# Generate a new service
ng generate service core/services/my-service
```

## 📚 Documentation

- [Angular README](./angular/README.md) - Angular-specific documentation
- [Design System](./DESIGN_SYSTEM_DOCUMENTATION.md) - Complete design system guide
- [Migration Plan](./ANGULAR_MIGRATION_PLAN.md) - Migration from vanilla HTML/JS
- [Technical Architecture](./docs/TECHNICAL_ARCHITECTURE.md) - System architecture

## 🔐 Authentication

The authentication system includes:
- JWT token management
- CSRF protection
- Session management
- Auto-redirect on auth state change
- Route guards

## 🎯 Migration Status

The project is migrating from vanilla HTML/CSS/JS to Angular 21 + PrimeNG 21:

- ✅ Angular 21 project setup
- ✅ PrimeNG 21 integration
- ✅ Core services (Auth, API)
- ✅ Shared components (Sidebar, Header, Layout)
- ✅ Auth module (Login, Register, Reset Password)
- ✅ Dashboard component
- 🚧 Remaining feature modules in progress

## 📄 License

MIT License - See LICENSE file for details

