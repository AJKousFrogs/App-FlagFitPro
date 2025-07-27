# 🏈 FlagFit Pro - Advanced Flag Football Training Platform

A comprehensive React-based training platform for flag football players and coaches, featuring AI-powered coaching, advanced analytics, and team chemistry management.

## 🚀 **Tech Stack**

### **Frontend**
- **React 18** with Vite for fast development
- **Tailwind CSS** for modern styling
- **Poppins Font** for modern typography
- **React Router** for navigation
- **Framer Motion** for animations
- **ESLint** for code quality

### **Backend & Database**
- **Neon DB** (PostgreSQL) for data persistence
- **Drizzle ORM** for type-safe database operations
- **GraphQL** with Apollo Server for API
- **Node.js** for server-side logic

### **AI & Analytics**
- **OpenAI API** for AI coaching features
- **USDA Food Database** for nutrition tracking
- **Advanced analytics** with real-time metrics
- **Predictive modeling** for performance insights

### **Deployment**
- **Netlify** for frontend hosting
- **Vercel** for serverless functions
- **GitHub Actions** for CI/CD

## 🎯 **Key Features**

### **🤖 AI-Powered Coaching**
- Personalized training recommendations
- Real-time performance analysis
- Position-specific coaching strategies
- Daily motivational quotes and insights

### **📊 Advanced Analytics**
- Universal rankings system (10,001+ players)
- Position-specific performance metrics
- Team chemistry tracking
- Predictive performance modeling

### **👥 Team Management**
- Player relationship ratings
- Chemistry optimization
- Real-time team communication
- Training session coordination

### **🏃‍♂️ Training System**
- Position-specific drills and exercises
- Progress tracking with XP system
- Weekly challenges and goals
- Performance benchmarking

### **🍎 Nutrition & Recovery**
- Comprehensive nutrition tracking
- USDA food database integration
- Recovery science protocols
- Dietary restriction management

### **🎨 Modern Design System**
- **Poppins Font Family** for clean, modern typography
- **Custom Color Palette** with primary, secondary, and accent colors
- **Consistent Typography Scale** (H1-H6) with proper hierarchy
- **Modern UI Components** with shadows, borders, and spacing
- **Responsive Design** optimized for all devices
- **Dark/Light Mode** support
- **Accessibility** compliant design patterns

### **📱 Mobile-First Design**
- Responsive interface with modern styling
- Touch-optimized interactions
- Offline capability
- Progressive Web App features

## 🛠️ **Getting Started**

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- Neon DB account
- OpenAI API key

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/AJKous31/app-new-flag.git
   cd app-new-flag
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Configure your `.env` file:
   ```env
   # Database
   DATABASE_URL=your_neon_db_connection_string
   
   # OpenAI
   OPENAI_API_KEY=your_openai_api_key
   
   # USDA API
   USDA_API_KEY=your_usda_api_key
   ```

4. **Database Setup**
   ```bash
   # Run database migrations
   npm run db:migrate-drizzle
   
   # Seed the database
   npm run db:seed
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:5173`

## 📁 **Project Structure**

```
react-flagfootball-app/
├── src/
│   ├── components/          # React components
│   ├── contexts/           # React contexts
│   ├── graphql/           # GraphQL schema and resolvers
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API and business logic
│   ├── utils/             # Utility functions
│   ├── views/             # Page components
│   └── styles/            # CSS and design system files
├── database/              # Database migrations and schema
├── scripts/               # Database seeding scripts
├── docs/                  # Documentation
└── drizzle/              # Drizzle ORM configuration
```

## 🗄️ **Database Schema**

### **Core Tables**
- `users` - User profiles and authentication
- `teams` - Team information and chemistry
- `training_sessions` - Workout and drill tracking
- `nutrition_logs` - Food and supplement tracking
- `recovery_metrics` - Sleep and wellness data
- `ai_coach_conversations` - AI coaching interactions

### **Advanced Features**
- `universal_rankings` - Performance benchmarking
- `chemistry_relationships` - Player relationship tracking
- `tournament_schedules` - Event management
- `safety_protocols` - Emergency and safety features

## 🧪 **Testing**

```bash
# Run linting
npm run lint

# Run tests
npm test

# Run build
npm run build
```

## 🚀 **Deployment**

### **Frontend (Netlify)**
```bash
npm run build
# Deploy dist/ folder to Netlify
```

### **Database (Neon)**
```bash
# Run migrations
npm run db:migrate-drizzle

# Seed data
npm run db:seed
```

## 🎨 **Design System**

### **Typography**
- **Poppins Font Family** for modern, clean typography
- **Consistent Heading Scale**: H1 (32px), H2 (28px), H3 (24px), H4 (20px), H5 (18px), H6 (16px)
- **Body Text**: 16px with 1.5 line height for optimal readability
- **Font Weights**: Regular (400), Medium (500), Semi-Bold (600), Bold (700)

### **Color Palette**
- **Primary Colors**: Modern blue and green gradients
- **Secondary Colors**: Neutral grays and whites
- **Accent Colors**: Orange and yellow for highlights
- **Status Colors**: Success (green), Warning (yellow), Error (red), Info (blue)

### **Component Design**
- **Cards**: Subtle shadows with rounded corners
- **Buttons**: Modern gradients with hover effects
- **Forms**: Clean inputs with focus states
- **Navigation**: Sticky headers with smooth transitions

## 📊 **Performance Features**

- **Code Splitting** for optimal loading
- **Lazy Loading** of components
- **Caching** strategies for API calls
- **Optimized Images** and assets
- **Service Workers** for offline functionality

## 🔒 **Security**

- **Environment Variables** for sensitive data
- **Input Validation** on all forms
- **SQL Injection** protection via Drizzle ORM
- **XSS Protection** with React
- **HTTPS** enforcement

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 🆘 **Support**

For support and questions:
- Create an issue on GitHub
- Check the [documentation](docs/)
- Review the [database setup guide](DATABASE_SETUP.md)

## 🎯 **Roadmap**

- [ ] **Modern Design Implementation**
  - [ ] Poppins font integration
  - [ ] Custom color palette implementation
  - [ ] Modern component library
  - [ ] Dark/Light mode toggle
- [ ] **Enhanced Features**
  - [ ] Mobile app development
  - [ ] Advanced AI coaching features
  - [ ] Real-time multiplayer features
  - [ ] Integration with wearable devices
  - [ ] Advanced analytics dashboard
  - [ ] Tournament management system

---

**Built with ❤️ for the flag football community** 