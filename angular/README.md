# FlagFit Pro - Angular 19 Migration

This is the Angular 19 version of FlagFit Pro, migrated from vanilla HTML/JavaScript to a modern Angular application with PrimeNG components.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Angular CLI 19

### Installation

```bash
# Install Angular CLI globally (if not already installed)
npm install -g @angular/cli@19

# Navigate to angular directory
cd angular

# Install dependencies
npm install

# Start development server
npm start
```

The application will be available at `http://localhost:4200`

## 📁 Project Structure

```
angular/
├── src/
│   ├── app/
│   │   ├── core/              # Core services, guards, interceptors
│   │   │   ├── guards/
│   │   │   ├── interceptors/
│   │   │   └── services/
│   │   ├── shared/            # Shared components
│   │   │   └── components/
│   │   │       ├── sidebar/
│   │   │       ├── header/
│   │   │       └── layout/
│   │   └── features/          # Feature modules
│   │       ├── auth/
│   │       ├── dashboard/
│   │       ├── training/
│   │       └── ...
│   ├── assets/
│   │   └── styles/           # Design system styles
│   └── environments/         # Environment configuration
├── angular.json
├── package.json
└── tsconfig.json
```

## 🎨 Design System

The application uses a custom design system built on:

- **PrimeNG**: UI component library
- **SCSS**: Styling with CSS custom properties
- **Design Tokens**: Semantic token system for theming

### Key Design Tokens

- Primary Color: `#089949` (Green)
- Secondary Color: `#10c96b` (Light Green)
- Spacing: 8-point grid system
- Typography: Poppins font family

## 🔌 API Integration

All API connections from the original HTML files are integrated:

- **Auth Service**: Login, Register, Logout, Token Management
- **API Service**: Centralized HTTP client with interceptors
- **Endpoints**: All endpoints from `api-config.js` are available

### API Configuration

The API service auto-detects the environment:

- **Development**: Uses mock API or localhost:3001
- **Netlify**: Uses Netlify Functions
- **Production**: Auto-detects based on hostname

## 📦 Key Features

### ✅ Completed

- [x] Angular 19 project setup
- [x] PrimeNG integration
- [x] Core services (Auth, API)
- [x] Shared components (Sidebar, Header, Layout)
- [x] Auth module (Login, Register, Reset Password)
- [x] Dashboard component
- [x] Routing and guards
- [x] Design system styles

### 🚧 In Progress

- [ ] Training module
- [ ] Analytics module
- [ ] Roster module
- [ ] Tournaments module
- [ ] Community module
- [ ] Chat module
- [ ] Coach module
- [ ] Profile/Settings module
- [ ] Remaining feature modules

## 🛠️ Development

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

### Code Generation

```bash
# Generate a new component
ng generate component features/my-feature

# Generate a new service
ng generate service core/services/my-service
```

## 📝 Migration Notes

### API Endpoints

All API endpoints are preserved from the original `api-config.js`:

- Authentication endpoints
- Dashboard endpoints
- Training endpoints
- Analytics endpoints
- Community endpoints
- Tournament endpoints
- And more...

### Component Mapping

| Original HTML    | Angular Component    | Status |
| ---------------- | -------------------- | ------ |
| `index.html`     | `LandingComponent`   | ✅     |
| `login.html`     | `LoginComponent`     | ✅     |
| `register.html`  | `RegisterComponent`  | ✅     |
| `dashboard.html` | `DashboardComponent` | ✅     |
| `training.html`  | `TrainingComponent`  | 🚧     |
| `analytics.html` | `AnalyticsComponent` | 🚧     |
| ...              | ...                  | ...    |

## 🔐 Authentication

The authentication system includes:

- JWT token management
- CSRF protection
- Session management
- Auto-redirect on auth state change
- Route guards

## 🎯 Next Steps

1. Complete remaining feature modules
2. Add unit tests
3. Add E2E tests
4. Optimize bundle size
5. Add PWA support
6. Performance optimization

## 📚 Resources

- [Angular 19 Documentation](https://angular.dev)
- [PrimeNG Documentation](https://primeng.org)
- [Design System Documentation](../DESIGN_SYSTEM_DOCUMENTATION.md)
- [Migration Plan](../ANGULAR_MIGRATION_PLAN.md)

## 🤝 Contributing

When adding new features:

1. Follow Angular style guide
2. Use PrimeNG components when possible
3. Follow the design system tokens
4. Add proper TypeScript types
5. Use reactive forms for forms
6. Implement proper error handling

## 📄 License

MIT License - See LICENSE file for details
