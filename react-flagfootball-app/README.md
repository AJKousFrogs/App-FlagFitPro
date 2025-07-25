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
- **Database**: Neon PostgreSQL + Drizzle ORM
- **Authentication**: JWT tokens with Neon PostgreSQL
- **State Management**: React Context + Zustand
- **UI Components**: Radix UI + Ant Design
- **Build System**: Vite with code splitting
- **Deployment**: Netlify ready

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
- **Consistent Branding**: FlagFit Pro color scheme (white, green, black)

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Neon PostgreSQL account

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

3. **Set Up Neon PostgreSQL Database**
   - Go to [neon.tech](https://neon.tech)
   - Create a free account
   - Create new project: `flagfit-pro`
   - Copy the connection string

4. **Configure Environment**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local`:
   ```bash
   VITE_NEON_DATABASE_URL=postgresql://username:password@host/database
   VITE_APP_ENVIRONMENT=development
   VITE_APP_NAME=FlagFit Pro
   ```

5. **Run Database Migrations**
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

6. **Start Development Server**
   ```bash
   npm run dev
   ```

7. **Access Application**
   - React App: http://localhost:4000/
   - Database: Managed by Neon PostgreSQL

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
npm run lint         # Lint code
npm run db:generate  # Generate database migrations
npm run db:migrate   # Run database migrations
```

### Project Structure

```
react-flagfootball-app/
├── src/
│   ├── components/         # Reusable UI components
│   ├── contexts/           # React Context providers
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API services
│   ├── stores/             # Zustand state management
│   ├── utils/              # Utility functions
│   ├── views/              # Page components
│   ├── App.jsx            # Main app component
│   ├── main.jsx           # Entry point
│   └── index.css          # Global styles
├── public/                # Static assets
├── docs/                  # Documentation
└── tests/                 # Test files
```

## 🗄️ Database Schema

### Core Tables
- **users**: User accounts and profiles
- **training_sessions**: Training session data
- **training_goals**: User goals and targets
- **analytics_events**: User behavior tracking
- **teams**: Team management
- **team_members**: Team membership

### Database Features
- **Neon PostgreSQL**: Serverless PostgreSQL database
- **Drizzle ORM**: Type-safe database operations
- **Migrations**: Automated schema management
- **Real-time**: Live data synchronization

## 🎯 Key Features

### Authentication System
- Secure login/register with JWT tokens
- Role-based access control
- Password validation and security
- Remember me functionality

### Training Management
- Create and manage training sessions
- Track progress and performance
- Set and monitor goals
- Exercise library with instructions

### Analytics & Progress
- Performance metrics tracking
- Progress visualization
- Goal achievement monitoring
- Training history analysis

### Community Features
- Team management
- User profiles and achievements
- Social features and sharing
- Tournament organization

## 🚀 Deployment

### Netlify (Recommended)
1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically on push

### Environment Variables for Production
```bash
VITE_NEON_DATABASE_URL=your_neon_connection_string
VITE_APP_ENVIRONMENT=production
VITE_APP_NAME=FlagFit Pro
```

## 📱 PWA Features

- **Offline Support**: Works without internet connection
- **Mobile App Experience**: Install on mobile devices
- **Push Notifications**: Training reminders and updates
- **Background Sync**: Sync data when online

## 🎨 Design System

### Color Palette
- **Primary Green**: #16A34A (buttons, links, actions)
- **Background White**: #FFFFFF (cards, backgrounds)
- **Text Black**: #111827 (headings, main text)
- **Accent Green**: #15803D (hover states, emphasis)

### Typography
- **Font Family**: Inter (modern, clean, readable)
- **Responsive**: Scales appropriately across devices
- **Accessibility**: WCAG AA compliant contrast ratios

## 🔒 Security

- **JWT Authentication**: Secure token-based auth
- **HTTPS Only**: All connections encrypted
- **Input Validation**: Comprehensive form validation
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Content Security Policy

## 📊 Performance

- **Code Splitting**: Lazy-loaded components
- **Image Optimization**: WebP format with fallbacks
- **Caching**: Intelligent caching strategies
- **Bundle Optimization**: Tree shaking and minification
- **CDN**: Global content delivery

## 🧪 Testing

- **Unit Tests**: Component and utility testing
- **Integration Tests**: Feature testing
- **E2E Tests**: User flow testing
- **Performance Tests**: Load and stress testing

## 📚 Documentation

- **API Documentation**: Comprehensive service documentation
- **Component Library**: UI component documentation
- **Design System**: Color, typography, and spacing guides
- **Setup Instructions**: Step-by-step installation guide

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` folder
- **Issues**: Report bugs on GitHub
- **Discussions**: Ask questions in GitHub Discussions

---

**FlagFit Pro** - Empowering flag football athletes with modern training technology! 🏈✨ 