# 🏈 FlagFit Pro - Flag Football Training Platform

_Professional-grade training platform with advanced analytics and AI-powered insights_

[![Angular](https://img.shields.io/badge/Angular-21.0+-red.svg)](https://angular.dev/)
[![PrimeNG](https://img.shields.io/badge/PrimeNG-21.0+-blue.svg)](https://primeng.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE.md)

## 🚀 Overview

FlagFit Pro is a comprehensive training platform that combines modern web technologies with sports science to deliver personalized training experiences, advanced performance analytics, and team management tools.

## ✨ Latest Features (2024)

### 🎨 Complete Wireframe Integration

- **Black & White Design System**: Professional wireframe-based UI with Poppins typography
- **Four Core Pages**: Dashboard, Training, Community, Tournaments with wireframe layouts
- **Interactive Navigation**: Active state handling and responsive design
- **ChatWidget**: AI coach chat with typing indicators and quick actions

### 🤖 AI Coaching System

- **Interactive Chat**: Real-time AI coaching with contextual responses
- **Training Recommendations**: Personalized workout suggestions
- **Performance Insights**: AI-powered analytics and progress tracking
- **Quick Actions**: Training tips, nutrition advice, recovery guidance

### 🏆 Olympic Preparation

- **LA28 Qualification Path**: Structured progression tracking
- **Tournament Management**: Competition tracking and results
- **Performance Analytics**: Advanced metrics and visualizations
- **Team Management**: Ljubljana Frogs team integration

### 🛠️ Technical Excellence

- **FilterManager**: Advanced interactive filtering system
- **Accessibility**: ARIA compliance, keyboard navigation, screen reader support
- **Performance**: Optimized loading states and smooth animations
- **Security**: CSP headers, XSS protection, and secure authentication

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

### 🎯 Core Functionality

#### 🏈 Dashboard

- **Performance Overview**: Training metrics and progress charts
- **Today's Training**: Recommended exercises and schedules
- **Team Updates**: Ljubljana Frogs team communications
- **Interactive Cards**: Hover effects and responsive layout

#### 🏃‍♂️ Training

- **Personalized Workouts**: AI-recommended training sessions
- **Skill Categories**: Speed & Agility, Route Running, Defensive Drills
- **Progress Tracking**: Duration and difficulty monitoring
- **Customization**: Personalized training adjustments

#### 🤝 Community

- **Discussion Forums**: Player interaction and knowledge sharing
- **Team Leaderboard**: Performance rankings and achievements
- **Social Features**: Player connections and team chemistry
- **Real-time Updates**: Live discussions and notifications

#### 🏆 Tournaments

- **LA28 Olympic Path**: Qualification tracking and requirements
- **Upcoming Events**: Tournament schedules and registration
- **Results History**: Competition performance tracking
- **Achievement System**: Awards and milestone recognition

#### 💬 AI Coach Chat

- **Contextual Responses**: Intelligent coaching suggestions
- **Quick Actions**: Training tips, nutrition, recovery advice
- **Interactive Interface**: Typing indicators and smooth animations
- **Persistent Sessions**: Chat history and context retention

## 🎨 Design System

The application uses a comprehensive design system built on:

- **PrimeNG**: Production-ready UI components
- **SCSS**: Styling with CSS custom properties
- **Design Tokens**: Semantic token system for theming
- **Accessibility**: WCAG 2.1 AA compliant

### Typography

- **Primary Font**: Poppins (300, 400, 500, 600, 700, 800)
- **Hierarchy**: h1 (2.5rem), h2 (1.875rem), h3 (1.5rem)
- **Color Scheme**: Black (#1a1a1a) on White (#ffffff)

### Components

- **Buttons**: Primary (black) and Secondary (white) with hover effects
- **Cards**: Wireframe-style with borders and responsive layout
- **Navigation**: Sticky header with active state indicators
- **Chat**: Floating widget with smooth animations

### Responsive Design

- **Desktop**: Full wireframe layout with grid systems
- **Tablet**: Adapted layouts with touch optimization
- **Mobile**: Stacked layouts with mobile-first approach

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

### Code Quality Features

- **FilterManager**: Advanced interactive filtering with accessibility
- **Error Boundaries**: Comprehensive error handling
- **Performance Optimization**: Loading states and smooth transitions
- **Accessibility**: ARIA compliance and keyboard navigation
- **Security**: CSP headers and XSS protection

## 🚀 Deployment

### Production Ready

- **Vite Build**: Optimized production builds
- **Service Worker**: PWA capabilities and offline support
- **Performance**: Lazy loading and code splitting
- **Security**: Comprehensive security headers

### Environment Configuration

```bash
# Set up environment variables
cp .env.example .env
# Configure your settings
```

## 🔒 Security & Privacy

### Security Features

- **Content Security Policy**: XSS and injection protection
- **Authentication**: JWT token management with Angular Guards
- **Data Protection**: Secure local storage handling
- **Error Handling**: Graceful error boundaries
- **CSRF Protection**: Built-in CSRF protection
- **Session Management**: Secure session handling

### Privacy Compliance

- **Data Minimization**: Only necessary data collection
- **User Control**: Clear data management options
- **Transparent Processing**: Open source and auditable
- **Secure Communications**: HTTPS enforcement

## 📱 Accessibility

### WCAG Compliance

- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Readers**: ARIA labels and live regions
- **Focus Management**: Logical tab order and focus indicators
- **High Contrast**: Accessible color combinations

### Interactive Features

- **Skip Links**: Quick navigation for assistive technology
- **Live Regions**: Dynamic content announcements
- **Button States**: Clear active and disabled states
- **Form Validation**: Accessible error messages

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

## 📚 Documentation

- [Angular README](./angular/README.md) - Angular-specific documentation
- [Design System](./DESIGN_SYSTEM_DOCUMENTATION.md) - Complete design system guide
- [Migration Plan](./ANGULAR_MIGRATION_PLAN.md) - Migration from vanilla HTML/JS
- [Technical Architecture](./docs/TECHNICAL_ARCHITECTURE.md) - System architecture

## 🤝 Contributing

We welcome contributions! Please:

1. Follow the wireframe-based design system
2. Maintain accessibility standards
3. Write clean, documented code
4. Test interactive features thoroughly
5. Follow the existing code patterns

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- HTML wireframe designs for comprehensive UI structure
- Angular and PrimeNG communities for excellent development tools
- Accessibility guidelines from W3C and WCAG
- Olympic flag football community for inspiration

---

<div align="center">

**Built with ❤️ for Olympic flag football excellence**

[Live Demo](https://app-new-flag.netlify.app/) • [Documentation](docs/) • [Contributing](CONTRIBUTING.md) • [License](LICENSE.md)

</div>
