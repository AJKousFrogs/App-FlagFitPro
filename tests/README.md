# FlagFit Pro - Testing Suite

This directory contains comprehensive testing for the FlagFit Pro application, implementing a multi-tier testing strategy for the Angular 21 + PrimeNG frontend with Supabase backend.

## Testing Strategy

### 🔬 Unit Tests (`tests/unit/`)

- **Purpose**: Test individual functions and components in isolation
- **Coverage**: Core services, utilities, and business logic
- **Framework**: Vitest with jsdom environment
- **Mock Strategy**: Extensive mocking of external dependencies (Supabase, API calls)

**Test Files:**

- `error-handler.test.js` - Error handling and user notifications

### 🔗 Integration Tests (`tests/integration/`)

- **Purpose**: Test component interactions and API integrations
- **Coverage**: Database operations, API workflows, service interactions
- **Framework**: Vitest with realistic data flows
- **Mock Strategy**: Partial mocking focusing on external services (Supabase)

**Test Files:**

- `api-integration.test.js` - Full API workflow tests with Netlify Functions
- `database-integration.test.js` - Database operation tests (Supabase)
- `netlify-api.test.js` - Netlify Functions endpoint smoke tests
- `notification-flow.test.js` - Notification system tests

### 🌐 End-to-End Tests (`tests/e2e/`)

- **Purpose**: Test complete user workflows in real browser environment
- **Coverage**: Authentication, training workflows, dashboard navigation
- **Framework**: Playwright with multi-browser support
- **Mock Strategy**: Minimal mocking, real user interactions

**Test Files:**

- `user-authentication.spec.js` - Login, register, password reset flows
- `dashboard-navigation.spec.js` - Dashboard and navigation tests
- `training-workflow.spec.js` - Training session workflows
- `complete-user-workflows.spec.js` - End-to-end user journeys
- `notifications.spec.js` - Notification interactions

### 🔒 Privacy & Safety Tests (`tests/privacy-safety/`)

- **Purpose**: Ensure GDPR compliance and data privacy
- **Coverage**: Consent management, data deletion, age gating
- **Framework**: Vitest

**Test Files:**

- `age-gating.test.js` - Age verification tests
- `consent-gating.test.js` - Consent management
- `deletion-lifecycle.test.js` - Data deletion flows
- `coach-consent.test.js` - Coach consent requirements

### ⚡ Performance Tests (`tests/performance/`)

- **Purpose**: Load testing and performance validation
- **Coverage**: API response times, concurrent users, stress testing
- **Framework**: Vitest with custom performance runner

## Quick Start

```bash
# Install dependencies (if not already done)
npm install

# Run all tests
npm run test:all

# Run specific test types
npm run test:unit          # Unit tests (Angular)
npm run test:backend       # Backend Netlify Functions smoke tests
npm run test:e2e           # End-to-end tests (Playwright)
npm run test:privacy       # Privacy/safety tests

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode (development)
npm run test:watch

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in debug mode
npm run test:e2e:debug
```

## Test Structure

```
tests/
├── setup.js                          # Global test configuration
├── test-runner.js                    # Custom test runner script
├── test-helpers.js                   # Mock factories and utilities
├── README.md                         # This file
├── unit/                             # Unit tests
│   └── error-handler.test.js         # Error handling
├── integration/                      # Integration tests
│   ├── api-integration.test.js       # API workflow tests
│   ├── database-integration.test.js  # Database operations
│   ├── netlify-api.test.js           # Netlify Functions smoke tests
│   └── notification-flow.test.js     # Notifications
├── e2e/                              # End-to-end tests
│   ├── user-authentication.spec.js   # Auth flows
│   ├── dashboard-navigation.spec.js  # Navigation
│   ├── training-workflow.spec.js     # Training sessions
│   └── complete-user-workflows.spec.js
├── privacy-safety/                   # Privacy tests
│   ├── age-gating.test.js
│   ├── consent-gating.test.js
│   └── deletion-lifecycle.test.js
└── performance/                      # Performance tests
    └── load-testing.spec.js
```

## Test Coverage Goals

- **Unit Tests**: 80%+ code coverage for core services
- **Integration Tests**: All critical API flows
- **E2E Tests**: Complete user journeys
- **Cross-browser**: Chrome, Firefox, Safari, Mobile

## Key Features Tested

### 🔐 Authentication & Security

- User registration with validation
- Login/logout workflows (Supabase Auth)
- Session management and token refresh
- Password reset functionality
- OAuth integration (Google, Facebook, Apple)
- CSRF protection

### 🏃‍♂️ Training Workflows

- Session creation and management
- Exercise tracking and completion
- Real-time performance monitoring
- AI coaching integration
- Offline mode synchronization

### 📊 Dashboard & Analytics

- Performance data visualization
- Navigation between sections
- Quick actions and shortcuts
- Responsive design
- Dark mode functionality

### 🍎 Nutrition Tracking

- Meal logging and analysis
- Macro/micronutrient calculations
- USDA database integration
- Recommendation engine

### 🤝 Community Features

- Social interactions
- Team management
- Coaching assignments
- Leaderboards and challenges

## Configuration Files

### `vitest.config.js` (Root)

- Configures Vitest for unit and integration tests
- Sets up jsdom environment for DOM testing
- Defines path aliases and coverage settings

### `playwright.config.js` (Root)

- Multi-browser configuration (Chrome, Firefox, Safari)
- Mobile device testing
- Screenshot and trace collection on failures
- Local development server integration

### `tests/setup.js`

- Global mocks for browser APIs
- Test utilities and helpers
- DOM API polyfills
- Storage mocks (localStorage, sessionStorage)

### `tests/test-helpers.js`

- Mock data factories (users, sessions, nutrition)
- API response helpers
- Test environment setup
- Validation utilities

## Running Tests in CI/CD

The test suite is designed to run in CI/CD environments:

```bash
# GitHub Actions / CI environment
npm run test:ci

# Generate coverage reports
npm run test:coverage

# Run only critical path tests (faster)
npm run test:unit && npm run test:e2e

# Run privacy tests in CI
npm run test:privacy:ci
```

## Debugging Tests

### Unit/Integration Tests

```bash
# Run specific test file
npx vitest run tests/unit/error-handler.test.js

# Debug mode with breakpoints
npx vitest run --inspect-brk tests/unit/error-handler.test.js

# Watch mode for development
npx vitest tests/unit/
```

### E2E Tests

```bash
# Run with visible browser (headed mode)
npm run test:e2e:headed

# Debug specific test
npx playwright test tests/e2e/user-authentication.spec.js --debug

# Generate test reports
npx playwright show-report
```

## Mock Data and Test Fixtures

### User Data

- Test users with different roles (player, coach, admin)
- Performance data across various time periods
- Training sessions with different intensities

### Training Data

- Flag football specific exercises
- Performance metrics and analytics
- AI coaching responses and recommendations

### API Responses

- Realistic API response structures
- Error scenarios and edge cases
- Rate limiting and retry logic

## Test Helpers

### Mock Factories

```javascript
import {
  createMockUser,
  createMockTrainingSession,
  createMockNutritionData,
  createMockPerformanceData,
  createMockAIResponse,
} from "./test-helpers.js";

// Create mock user
const user = createMockUser({ role: "coach" });

// Create mock training session
const session = createMockTrainingSession({ duration: 60 });

// Create mock API response
const response = createMockApiResponse({ success: true });
```

### Test Environment Setup

```javascript
import { setupTestEnvironment } from "./test-helpers.js";

beforeEach(() => {
  const testEnv = setupTestEnvironment();
  // ... test code
  testEnv.cleanup();
});
```

## Performance Testing

Tests include performance validations:

- API response times under 500ms
- Page load times under 3 seconds
- Memory usage optimization
- Database query efficiency

## Best Practices

1. **Test Isolation**: Each test is independent and can run in any order
2. **Realistic Data**: Use realistic test data that matches production scenarios
3. **Error Coverage**: Test both success and failure scenarios
4. **Browser Compatibility**: E2E tests cover multiple browsers and devices
5. **Accessibility**: Tests include accessibility checks where applicable
6. **Privacy Compliance**: Privacy tests ensure GDPR compliance

## Troubleshooting

### Common Issues

1. **Port conflicts**: Tests use dedicated ports to avoid conflicts
2. **Database state**: Integration tests use mocked Supabase client
3. **Browser dependencies**: Playwright automatically manages browser installations
4. **Memory usage**: Tests include cleanup to prevent memory leaks

### Getting Help

- Check test output for specific error messages
- Review test logs in `test-results/` directory
- Use debugging modes for step-by-step investigation
- Verify environment setup meets requirements

## Continuous Improvement

- Tests are updated with new features
- Performance benchmarks are regularly reviewed
- Test coverage reports guide development priorities
- Feedback loops improve test reliability

This testing suite ensures the FlagFit Pro application maintains high quality and reliability while supporting rapid development and deployment cycles.
