# 🏈 FlagFit Pro - Elite Flag Football Training Platform

*Professional wireframe-integrated training platform with AI coaching and LA28 Olympic preparation*

[![React](https://img.shields.io/badge/React-18.0+-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.0+-purple.svg)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE.md)

## 🚀 Overview

FlagFit Pro is a comprehensive flag football training platform featuring complete wireframe-integrated design, AI coaching, interactive analytics, and preparation tools for LA28 Olympic qualification. Built with modern React architecture and professional design patterns.

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

| Frontend | Backend | Infrastructure | Design |
|----------|---------|----------------|--------|
| React 18 + Hooks | Node.js + Express | Vite Dev Server | Wireframe-Based UI |
| React Router | JWT Authentication | Service Workers | Poppins Typography |
| CSS3 + Flexbox/Grid | Mock Services | Performance API | Black & White Theme |
| FilterManager | Local Storage | Error Boundaries | Responsive Design |

## 📁 Project Structure

```
src/
├── components/
│   ├── ChatWidget.jsx              # AI coach chat interface
│   ├── ChatWidget.css              # Complete chat styling
│   ├── BackupManager.jsx           # Data backup management
│   ├── ThemeToggle.jsx             # Theme switching
│   └── NotificationCenter.jsx      # User notifications
├── services/
│   ├── auth.service.js             # Authentication with localStorage
│   └── BackupService.js            # Data backup service
├── utils/
│   ├── FilterManager.js            # Interactive filtering system
│   └── cn.js                       # Utility functions
├── contexts/
│   └── NeonDatabaseContext.jsx     # Database context provider
├── hooks/
│   └── useReducer.js               # Enhanced reducer hook
└── App.jsx                         # Main wireframe-integrated app
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Modern web browser with ES6 support

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AJKous31/app-new-flag.git
   cd app-new-flag
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Access the application**
   - Local: http://localhost:3000/
   - Network: Available on your local network

## 🎯 Core Functionality

### 🏈 Dashboard
- **Performance Overview**: Training metrics and progress charts
- **Today's Training**: Recommended exercises and schedules
- **Team Updates**: Ljubljana Frogs team communications
- **Interactive Cards**: Hover effects and responsive layout

### 🏃‍♂️ Training
- **Personalized Workouts**: AI-recommended training sessions
- **Skill Categories**: Speed & Agility, Route Running, Defensive Drills
- **Progress Tracking**: Duration and difficulty monitoring
- **Customization**: Personalized training adjustments

### 🤝 Community
- **Discussion Forums**: Player interaction and knowledge sharing
- **Team Leaderboard**: Performance rankings and achievements
- **Social Features**: Player connections and team chemistry
- **Real-time Updates**: Live discussions and notifications

### 🏆 Tournaments
- **LA28 Olympic Path**: Qualification tracking and requirements
- **Upcoming Events**: Tournament schedules and registration
- **Results History**: Competition performance tracking
- **Achievement System**: Awards and milestone recognition

### 💬 AI Coach Chat
- **Contextual Responses**: Intelligent coaching suggestions
- **Quick Actions**: Training tips, nutrition, recovery advice
- **Interactive Interface**: Typing indicators and smooth animations
- **Persistent Sessions**: Chat history and context retention

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Code quality checks
```

### Code Quality Features

- **FilterManager**: Advanced interactive filtering with accessibility
- **Error Boundaries**: Comprehensive error handling
- **Performance Optimization**: Loading states and smooth transitions
- **Accessibility**: ARIA compliance and keyboard navigation
- **Security**: CSP headers and XSS protection

## 🎨 Design System

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
- **Authentication**: JWT-style token management
- **Data Protection**: Secure local storage handling
- **Error Handling**: Graceful error boundaries

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

## 🤝 Contributing

We welcome contributions! Please:

1. Follow the wireframe-based design system
2. Maintain accessibility standards
3. Write clean, documented code
4. Test interactive features thoroughly
5. Follow the existing code patterns

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 🙏 Acknowledgments

- HTML wireframe designs for comprehensive UI structure
- React community for excellent development tools
- Accessibility guidelines from W3C and WCAG
- Olympic flag football community for inspiration

---

<div align="center">

**Built with ❤️ for Olympic flag football excellence**

🤖 **Generated with [Claude Code](https://claude.ai/code)**

**Co-Authored-By: Claude <noreply@anthropic.com>**

[Live Demo](https://app-new-flag.netlify.app/) • [Documentation](docs/) • [Contributing](CONTRIBUTING.md) • [License](LICENSE.md)

</div>