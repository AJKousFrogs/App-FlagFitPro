# FlagFit Pro - Flag Football Training Platform

A comprehensive Progressive Web App (PWA) for flag football training management with role-based dashboards for Athletes, Coaches, and Admins.

## 🎨 Design System

**FlagFit Pro features a consistent, professional color scheme:**
- **Primary**: Green (#16A34A) for all interactive elements and branding
- **Background**: White (#FFFFFF) for clean, modern appearance
- **Text**: Black (#111827) for excellent readability
- **Accents**: Green gradients for highlights and progress indicators
- **Borders**: Light gray (#E5E7EB) for subtle separation

**All pages maintain this consistent branding:**
- Login/Register: White backgrounds with green buttons
- Dashboard: White cards with green progress indicators
- Training: Green gradients for challenges, white cards for content
- Profile/Community: Consistent white backgrounds with green accents

## 🏗️ Architecture

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: PocketBase (SQLite + Real-time + Auth)
- **Authentication**: PocketBase Auth with React Context
- **State Management**: React Context + Custom Hooks
- **Database**: SQLite with PocketBase migrations

## 🚀 Features

### Core Functionality
- **Role-Based Access**: Athlete, Coach, and Admin dashboards
- **Training Programs**: Comprehensive program templates and sessions
- **Exercise Library**: Extensive exercise database with instructions
- **Progress Tracking**: Performance metrics and training logs
- **Real-time Updates**: Live data synchronization
- **PWA Support**: Mobile app experience with offline support

### Technical Features
- **Modern React**: Functional components with hooks
- **Type Safety**: PropTypes and careful error handling
- **Responsive Design**: Mobile-first Tailwind CSS
- **Performance**: Code splitting and optimized loading
- **Testing**: Vitest with React Testing Library
- **Security**: Secure authentication and data protection

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Clone Repository**
   ```bash
   git clone https://github.com/AJKous31/flagfit-pro-training-app.git
   cd flagfit-pro-training-app
   ```

2. **Install Dependencies**
   ```bash
   cd react-flagfootball-app
   npm install
   ```

3. **Set Up Environment**
   ```bash
   cp ../env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start PocketBase (in project root)**
   ```bash
   cd ..
   npm run pocketbase
   ```
   
   **Development Mode Benefits:**
   - Real-time SQL logging for debugging auth issues
   - Detailed request/response logging
   - Auto-migration on schema changes

5. **Start React App**
   ```bash
   cd react-flagfootball-app
   npm run dev
   ```

6. **Access Application**
   - React App: http://127.0.0.1:4000/
   - PocketBase Admin: http://127.0.0.1:8090/_/

## 🔧 Development

### Available Scripts

From project root:
```bash
npm run dev          # Start React development server
npm run build        # Build React app for production
npm run test         # Run React tests
npm run lint         # Lint React code
npm run pocketbase   # Start PocketBase server
```

### Project Structure

```
flagfit-pro-training-app/
├── react-flagfootball-app/     # React frontend application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── contexts/           # React Context providers
│   │   ├── hooks/              # Custom React hooks
│   │   ├── services/           # API services
│   │   ├── views/              # Page components
│   │   └── ...
│   ├── package.json
│   └── vite.config.js
├── pb_data/                    # PocketBase data directory
├── pb_migrations/              # Database migrations
├── pocketbase                  # PocketBase binary
├── CLAUDE.md                   # Architecture guidelines
└── README.md
```

## 🔐 Authentication

### Enhanced Security Features (v0.22.21+)
- **Token Persistence**: Automatic localStorage sync with validation on app mount
- **Session Management**: Smart token refresh with 2-minute auto-renewal
- **Security Hardening**: Rate limiting (5 attempts per 15 minutes per IP)
- **Email Verification**: Optional `onlyVerified` flag enforcement
- **Session Invalidation**: Automatic token revocation on password/email changes
- **Performance Optimized**: Composite indexes on (email, verified) for sub-100ms auth

### Test Credentials
- **Email**: `demo@flagfit.com`
- **Password**: `password123`

### User Roles
- **Athletes**: Access training programs and track progress
- **Coaches**: Manage teams and assign programs
- **Admins**: Full system administration access

### Authentication Flow
1. **Login**: Email/password with automatic token persistence
2. **Token Validation**: On app mount, validates existing tokens via `/auth-refresh`
3. **Auto-Refresh**: Background token renewal every 2 minutes
4. **Logout**: Secure token clearing with optional server-side invalidation

## 🗄️ Database

### PocketBase Collections
- `_pb_users_auth_`: User authentication and profiles
- `training_sessions`: Training session data
- `training_goals`: User training objectives
- `analytics_events`: Application analytics

### Migrations
Database migrations are located in `/pb_migrations/` and are automatically applied when PocketBase starts.

## 🚀 Deployment

### Production Build
```bash
cd react-flagfootball-app
npm run build
```

### PocketBase Production
```bash
./pocketbase serve --dir=./pb_data
```

## 🧪 Testing

### Run Tests
```bash
cd react-flagfootball-app
npm run test
```

### Stress Testing
```bash
npm run stress-test:pocketbase
```

## 📝 Contributing

1. Follow the architecture guidelines in `CLAUDE.md`
2. Use React functional components with hooks
3. Maintain PocketBase for all backend operations
4. Write tests for new features
5. Follow the existing code style

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.md) file for details.

## 🆘 Support

- Check the React app documentation in `/react-flagfootball-app/README.md`
- Review PocketBase documentation at https://pocketbase.io/docs/
- Open issues on GitHub for bugs or feature requests