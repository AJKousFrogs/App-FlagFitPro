# CLAUDE.md - FlagFit Pro Architecture & Implementation Guide

## 🏗️ Architecture Overview

FlagFit Pro is a React-based flag football training platform built with wireframe-integrated design, AI coaching capabilities, and comprehensive accessibility features. This document outlines the technical architecture, implementation patterns, and development guidelines.

## 🎯 Core Principles

### Design Philosophy
- **Wireframe-First**: All UI components follow wireframe design patterns
- **Accessibility-First**: WCAG compliance and universal design
- **Performance-First**: Optimized loading, animations, and user experience
- **Mobile-First**: Responsive design with touch-optimized interactions

### Technical Standards
- **Component-Based**: Modular React functional components
- **Hook-Driven**: Custom hooks for state management and logic
- **Type-Safe**: PropTypes and defensive programming
- **Test-Driven**: Comprehensive testing for all interactions

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ChatWidget.jsx    # AI coach chat interface
│   ├── ChatWidget.css    # Complete chat styling
│   ├── BackupManager.jsx # Data backup and recovery
│   ├── ThemeToggle.jsx   # Theme switching component
│   └── NotificationCenter.jsx # User notifications
├── services/             # Business logic services
│   ├── auth.service.js   # Authentication with localStorage
│   └── BackupService.js  # Data backup operations
├── utils/                # Utility functions and classes
│   ├── FilterManager.js  # Interactive filtering system
│   └── cn.js            # Styling utilities
├── contexts/             # React Context providers
│   └── (Supabase context managed via @supabase/supabase-js)
├── hooks/                # Custom React hooks
│   └── useReducer.js     # Enhanced state management
└── App.jsx              # Main application with routing
```

## 🎨 Design System

### Typography System
```css
/* Primary font family */
font-family: 'Poppins', sans-serif;

/* Typography hierarchy */
h1: 2.5rem (700 weight)
h2: 1.875rem (600 weight) 
h3: 1.5rem (600 weight)
body: 1rem (400 weight)
small: 0.875rem (400 weight)
caption: 0.75rem (400 weight)
```

### Color Palette
```css
/* Primary colors */
--primary-black: #1a1a1a;
--primary-white: #ffffff;
--border-gray: #e5e5e5;
--text-gray: #6b6b6b;
--background-light: #f8f9fa;

/* Interactive states */
--hover-gray: #f5f5f5;
--active-black: #000000;
--focus-outline: 2px solid #1a1a1a;
```

### Component Patterns
```jsx
// Wireframe card pattern
<div className="wireframe-card">
  <h3>{title}</h3>
  <p className="body-text">{description}</p>
  <button className="cta-secondary">{action}</button>
</div>

// Button system
<button className="cta-primary">Primary Action</button>
<button className="cta-secondary">Secondary Action</button>
<button className="btn-small">Small Button</button>
```

## 🔧 Core Components

### 1. ChatWidget (`src/components/ChatWidget.jsx`)
**Purpose**: AI coach interaction system
**Features**:
- Real-time messaging with typing indicators
- Quick action buttons for common requests
- Persistent chat history and context
- Responsive design with mobile optimization
- Accessibility with ARIA labels and keyboard navigation

```jsx
// Key implementation patterns
const [isOpen, setIsOpen] = useState(false);
const [messages, setMessages] = useState([]);
const [isTyping, setIsTyping] = useState(false);

// Accessibility features
aria-expanded={isOpen}
aria-label="Toggle AI Coach Chat"
role="button"
tabIndex={0}
```

### 2. FilterManager (`src/utils/FilterManager.js`)
**Purpose**: Interactive filtering and button management
**Features**:
- Dynamic button state management
- Keyboard navigation support
- Loading states and visual feedback
- ARIA live region announcements
- Responsive interaction handling

```javascript
// Core filtering logic
handleFilterClick(button) {
  const container = this.findFilterContainer(button);
  this.updateButtonStates(button, container);
  this.announceFilterChange(button);
  this.updateContent(button, container);
}

// Accessibility integration
setupAccessibilityAttributes(button) {
  button.setAttribute('role', 'button');
  button.setAttribute('aria-pressed', 'false');
  button.setAttribute('tabindex', '0');
}
```

### 3. Authentication Service (`src/services/auth.service.js`)
**Purpose**: User authentication and session management
**Features**:
- JWT-style token management
- localStorage persistence
- Mock user data for development
- Secure logout and session cleanup

```javascript
// Authentication patterns
login(email, password) {
  // Validate credentials
  // Generate mock JWT token
  // Store in localStorage
  // Return user data
}

getCurrentUser() {
  const token = localStorage.getItem('authToken');
  return token ? this.decodeToken(token) : null;
}
```

## 🎯 Page Architecture

### Dashboard Page
```jsx
const DashboardPage = () => (
  <div className="container">
    <h1>🏈 Dashboard</h1>
    <div className="wireframe-grid">
      <PerformanceOverview />
      <TodaysTraining />
      <TeamUpdates />
    </div>
  </div>
);
```

### Training Page
- Personalized workout recommendations
- Interactive exercise categories
- Progress tracking and customization
- Responsive card layouts

### Community Page
- Discussion forums with real-time updates
- Team leaderboard and rankings
- Social interaction features
- Performance correlation displays

### Tournaments Page
- LA28 Olympic qualification tracking
- Tournament schedules and results
- Achievement system integration
- Competition history visualization

## 🔄 State Management

### React Context Pattern
```jsx
// Supabase client setup
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Use Supabase directly in components or create a custom hook
export const useSupabase = () => {
  return supabase;
};
```

### Custom Hooks Pattern
```jsx
// Enhanced reducer hook
export const useStandardReducer = (initialState, actionTypes, customReducer = null) => {
  const [state, dispatch] = useReducer(
    customReducer || standardReducer,
    initialState
  );

  const actions = useMemo(() => 
    createActionCreators(actionTypes, dispatch), 
    [actionTypes]
  );

  return [state, actions];
};
```

## ♿ Accessibility Implementation

### WCAG Compliance
- **Level AA compliance** for all interactive elements
- **Keyboard navigation** for complete functionality
- **Screen reader support** with ARIA labels and live regions
- **Focus management** with logical tab order
- **High contrast** support for visual accessibility

### Implementation Patterns
```jsx
// Accessible button pattern
<button
  className="cta-secondary"
  onClick={handleClick}
  onKeyDown={handleKeyDown}
  aria-label={`${buttonText} - ${description}`}
  aria-pressed={isActive}
  tabIndex={0}
>
  {buttonText}
</button>

// Live region for dynamic updates
<div
  id="aria-live-region"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  {announcements}
</div>
```

### Skip Links
```jsx
// Navigation skip links
<div className="skip-links">
  <a href="#main-content" className="skip-link">
    Skip to main content
  </a>
  <a href="#navigation" className="skip-link">
    Skip to navigation
  </a>
</div>
```

## 🚀 Performance Optimization

### Loading States
```jsx
// Component loading pattern
const [isLoading, setIsLoading] = useState(false);

const handleAsyncAction = async () => {
  setIsLoading(true);
  try {
    await performAction();
  } finally {
    setIsLoading(false);
  }
};
```

### Animation and Transitions
```css
/* Smooth state transitions */
.wireframe-card {
  transition: all 0.3s ease;
  transform: translateY(0);
}

.wireframe-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

/* Loading state animations */
.loading {
  opacity: 0.7;
  transition: opacity 0.3s ease;
}
```

### Code Splitting
```jsx
// Lazy loading for performance
const LazyComponent = lazy(() => import('./HeavyComponent'));

<Suspense fallback={<LoadingSpinner />}>
  <LazyComponent />
</Suspense>
```

## 🔒 Security Measures

### Content Security Policy
```html
<!-- CSP headers in index.html -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-eval' 'unsafe-inline'; 
               style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;" />
```

### Authentication Security
```javascript
// Secure token handling
const secureStorage = {
  setItem: (key, value) => {
    localStorage.setItem(key, btoa(JSON.stringify(value)));
  },
  getItem: (key) => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(atob(item)) : null;
  }
};
```

## 📱 Responsive Design

### Breakpoint System
```css
/* Mobile first approach */
.container {
  padding: 1rem;
}

@media (min-width: 768px) {
  .container {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }
}

@media (min-width: 1024px) {
  .wireframe-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
}
```

### Touch Optimization
```css
/* Touch-friendly interactive elements */
.cta-primary, .cta-secondary {
  min-height: 44px;
  min-width: 44px;
  padding: 12px 24px;
}

@media (hover: none) and (pointer: coarse) {
  .hover-effects {
    /* Remove hover effects on touch devices */
  }
}
```

## 🧪 Testing Strategy

### Component Testing
```javascript
// Test interactive components
test('FilterManager handles button clicks', () => {
  const button = screen.getByRole('button', { name: /filter/ });
  fireEvent.click(button);
  expect(button).toHaveAttribute('aria-pressed', 'true');
});

// Test accessibility
test('ChatWidget is keyboard accessible', () => {
  const toggle = screen.getByRole('button', { name: /toggle ai coach/ });
  fireEvent.keyDown(toggle, { key: 'Enter' });
  expect(screen.getByRole('dialog')).toBeVisible();
});
```

### Performance Testing
```javascript
// Test loading states
test('components show loading state during async operations', async () => {
  render(<AsyncComponent />);
  fireEvent.click(screen.getByText('Load Data'));
  expect(screen.getByText('Loading...')).toBeInTheDocument();
});
```

## 🚀 Deployment Configuration

### Build Optimization
```javascript
// vite.config.js optimizations
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom']
        }
      }
    }
  },
  server: {
    host: true // Enable network access
  }
});
```

### Service Worker Integration
```javascript
// Progressive Web App features
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => console.log('SW registered'))
      .catch(error => console.log('SW registration failed'));
  });
}
```

## 📋 Development Workflow

### Code Quality Standards
1. **ESLint Configuration**: Consistent code formatting
2. **Component Documentation**: JSDoc comments for all components
3. **Accessibility Testing**: Screen reader and keyboard testing
4. **Performance Monitoring**: Bundle size and runtime performance
5. **Cross-browser Testing**: Chrome, Firefox, Safari compatibility

### Git Workflow
```bash
# Feature development
git checkout -b feature/new-component
git add .
git commit -m "feat: add new interactive component with accessibility"
git push origin feature/new-component

# Production deployment
git checkout main
git merge feature/new-component
git tag v1.2.0
git push origin main --tags
```

## 🎯 Future Enhancements

### Planned Features
- **Real-time Collaboration**: Multi-user training sessions
- **Advanced Analytics**: Performance prediction algorithms
- **Mobile App**: React Native companion app
- **Offline Support**: Enhanced PWA capabilities
- **Internationalization**: Multi-language support

### Technical Debt Management
- **Component Refactoring**: Extract reusable patterns
- **Performance Optimization**: Minimize bundle size
- **Accessibility Improvements**: WCAG AAA compliance
- **Testing Coverage**: 95%+ test coverage target

---

## 🤖 AI Integration Guidelines

When implementing new AI features:

1. **Context Awareness**: Maintain conversation context
2. **Response Quality**: Provide relevant, actionable advice
3. **Error Handling**: Graceful fallbacks for AI failures
4. **User Control**: Allow users to disable AI features
5. **Privacy**: No sensitive data sent to AI services

## 📚 Learning Resources

- [React Hook Patterns](https://reactjs.org/docs/hooks-intro.html)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Performance Best Practices](https://web.dev/fast/)
- [Accessibility Testing Tools](https://www.w3.org/WAI/test-evaluate/)

---

*This document serves as the single source of truth for FlagFit Pro architecture and implementation. Keep it updated as the project evolves.*

**Last Updated**: December 2024
**Version**: 2.0
**Maintained By**: FlagFit Pro Development Team