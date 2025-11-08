# Flag Football Training App - Testing Suite

This directory contains comprehensive testing for the Flag Football Training App, implementing a three-tier testing strategy:

## Testing Strategy

### 🔬 Unit Tests (`tests/unit/`)
- **Purpose**: Test individual functions and components in isolation
- **Coverage**: Core services, utilities, and business logic
- **Framework**: Vitest with jsdom environment
- **Mock Strategy**: Extensive mocking of external dependencies

### 🔗 Integration Tests (`tests/integration/`)
- **Purpose**: Test component interactions and API integrations
- **Coverage**: Database operations, API workflows, service interactions
- **Framework**: Vitest with realistic data flows
- **Mock Strategy**: Partial mocking focusing on external services

### 🌐 End-to-End Tests (`tests/e2e/`)
- **Purpose**: Test complete user workflows in real browser environment
- **Coverage**: Authentication, training workflows, dashboard navigation
- **Framework**: Playwright with multi-browser support
- **Mock Strategy**: Minimal mocking, real user interactions

## Quick Start

```bash
# Install dependencies (already done if you ran npm install)
npm install

# Run all tests
npm run test:all

# Run specific test types
npm run test:unit
npm run test:integration  
npm run test:e2e

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode (development)
npm run test:watch
```

## Test Structure

```
tests/
├── setup.js                     # Global test configuration
├── test-runner.js               # Custom test runner script
├── unit/                        # Unit tests
│   ├── auth-manager.test.js     # Authentication logic tests
│   ├── api-config.test.js       # API configuration tests
│   ├── error-handler.test.js    # Error handling tests
│   └── performance-utils.test.js # Performance utilities tests
├── integration/                 # Integration tests
│   ├── api-integration.test.js  # Full API workflow tests
│   └── database-integration.test.js # Database operation tests
└── e2e/                        # End-to-end tests
    ├── user-authentication.spec.js # Login/register workflows
    ├── training-workflow.spec.js    # Complete training sessions
    └── dashboard-navigation.spec.js # Dashboard interactions
```

## Test Coverage Goals

- **Unit Tests**: 90%+ code coverage
- **Integration Tests**: All critical user flows
- **E2E Tests**: Complete user journeys
- **Cross-browser**: Chrome, Firefox, Safari, Mobile

## Key Features Tested

### 🔐 Authentication & Security
- User registration with validation
- Login/logout workflows
- Session management
- Password reset functionality
- Token expiration handling

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

### `vitest.config.js`
- Configures Vitest for unit and integration tests
- Sets up jsdom environment for DOM testing
- Defines path aliases and coverage settings

### `playwright.config.js`
- Multi-browser configuration (Chrome, Firefox, Safari)
- Mobile device testing
- Screenshot and trace collection on failures
- Local development server integration

### `tests/setup.js`
- Global mocks for browser APIs
- Test utilities and helpers
- DOM API polyfills

## Running Tests in CI/CD

The test suite is designed to run in CI/CD environments:

```bash
# GitHub Actions / CI environment
npm run test:all

# Generate coverage reports
npm run test:coverage

# Run only critical path tests (faster)
npm run test:unit && npm run test:integration
```

## Debugging Tests

### Unit/Integration Tests
```bash
# Run specific test file
npx vitest run tests/unit/auth-manager.test.js

# Debug mode with breakpoints
npx vitest run --inspect-brk tests/unit/auth-manager.test.js

# Watch mode for development
npx vitest tests/unit/
```

### E2E Tests
```bash
# Run with visible browser (headed mode)
npx playwright test --headed

# Debug specific test
npx playwright test tests/e2e/user-authentication.spec.js --debug

# Generate test reports
npx playwright show-report
```

## Mock Data and Test Fixtures

### User Data
- Test users with different roles (athlete, coach, admin)
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

## Performance Testing

Tests include performance validations:
- API response times under 500ms
- Page load times under 2 seconds
- Memory usage optimization
- Database query efficiency

## Best Practices

1. **Test Isolation**: Each test is independent and can run in any order
2. **Realistic Data**: Use realistic test data that matches production scenarios
3. **Error Coverage**: Test both success and failure scenarios
4. **Browser Compatibility**: E2E tests cover multiple browsers and devices
5. **Accessibility**: Tests include accessibility checks where applicable

## Continuous Improvement

- Tests are updated with new features
- Performance benchmarks are regularly reviewed
- Test coverage reports guide development priorities
- Feedback loops improve test reliability

## Troubleshooting

### Common Issues
1. **Port conflicts**: Tests use dedicated ports to avoid conflicts
2. **Database state**: Integration tests use isolated test databases
3. **Browser dependencies**: Playwright automatically manages browser installations
4. **Memory usage**: Tests include cleanup to prevent memory leaks

### Getting Help
- Check test output for specific error messages
- Review test logs in `test-results/` directory
- Use debugging modes for step-by-step investigation
- Verify environment setup meets requirements

This testing suite ensures the Flag Football Training App maintains high quality and reliability while supporting rapid development and deployment cycles.