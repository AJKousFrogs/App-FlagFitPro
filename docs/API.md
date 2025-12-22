# 📡 FlagFit Pro API Documentation

## Overview
FlagFit Pro uses mock services and localStorage for development. This document outlines the available services and their usage patterns.

## Authentication Service (`auth.service.js`)

### Methods
```javascript
// Login with email/password
authService.login(email, password)

// Register new user
authService.register(userData)

// Get current user
authService.getCurrentUser()

// Update user profile
authService.updateProfile(profileData)

// Logout
authService.logout()
```

### Mock Users
```javascript
// Test credentials
email: "demo@flagfit.com"
password: "password123"

email: "coach@flagfit.com" 
password: "coach123"
```

## FilterManager (`utils/FilterManager.js`)

### Usage
```javascript
// Initialize FilterManager
const filterManager = new FilterManager();

// Handle filter clicks automatically
// Supports selectors: .cta-secondary, .cta-primary, .filter-btn

// Custom event handling
filterManager.handleFilterClick(buttonElement);
```

### Features
- Automatic button state management
- ARIA accessibility support
- Keyboard navigation
- Loading states and animations

## ChatWidget Component

### Props
```javascript
// No props required - self-contained
<ChatWidget />
```

### Features
- AI coach responses (mock)
- Quick action buttons
- Typing indicators
- Message history persistence
- Mobile responsive design

## Data Storage

### localStorage Keys
```javascript
// Authentication
"authToken" - User authentication token
"currentUser" - Current user data

// Chat
"chatMessages" - Chat message history
"chatSettings" - Chat preferences

// Preferences
"userPreferences" - App settings
"filterStates" - Filter selections
```

## Component Architecture

### Page Components
- `DashboardPage` - Main dashboard with performance overview
- `TrainingPage` - Training programs and customization
- `CommunityPage` - Social features and leaderboards
- `TournamentsPage` - Competition tracking and LA28 preparation

### Utility Components
- `FilterManager` - Interactive button management
- `ChatWidget` - AI coach interface
- `Navigation` - App navigation with active states

## Error Handling

### Error Boundaries
```javascript
// Global error boundary
<ErrorBoundary>
  <App />
</ErrorBoundary>

// Component-level error handling
try {
  await authService.login(email, password);
} catch (error) {
  // Handle authentication error
}
```

## Performance Features

### Loading States
- Component-level loading indicators
- Skeleton screens for data fetching
- Smooth transitions and animations

### Accessibility
- WCAG AA compliance
- Screen reader support
- Keyboard navigation
- Focus management

## Development API

### Mock Data Generation
```javascript
// Generate mock training data
const mockTraining = {
  exercises: generateMockExercises(),
  schedule: generateMockSchedule(),
  progress: generateMockProgress()
};

// Generate mock user data
const mockUser = {
  id: generateId(),
  name: "Test User",
  team: "Ljubljana Frogs",
  position: "Receiver"
};
```

## Integration Points

### External Services (Future)
- USDA Food Database
- Weather APIs
- Sports Analytics APIs
- OAuth Providers

### Database Integration (Future)
- PostgreSQL with Drizzle ORM
- Real-time updates
- Data synchronization

## Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### API Testing
```javascript
// Test authentication service
describe('AuthService', () => {
  test('login with valid credentials', async () => {
    const result = await authService.login('demo@flagfit.com', 'password123');
    expect(result.success).toBe(true);
  });
});
```