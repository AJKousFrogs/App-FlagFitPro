<div align="center">

# 🏈 Flag Football Training App

*Professional-grade training platform with advanced analytics and AI-powered insights*

[![React](https://img.shields.io/badge/React-18.0+-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0+-purple.svg)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE.md)

</div>

## 🚀 Overview

The Flag Football Training App is a comprehensive training platform that combines modern web technologies with sports science to deliver personalized training experiences, advanced performance analytics, and team management tools.

## ✨ Key Features

### 🏆 Performance Analytics
- **AI-Powered Predictions**: Machine learning algorithms for performance forecasting
- **Injury Risk Assessment**: Predictive analytics for injury prevention
- **Interactive Visualizations**: Field heat maps and performance charts
- **Progress Tracking**: Comprehensive metrics and trend analysis

### 🥗 Nutrition Intelligence
- **USDA Database Integration**: 100,000+ food nutritional profiles
- **Performance Correlation Analysis**: Nutrition impact on athletic performance
- **Meal Timing Optimization**: Personalized nutrition schedules
- **Supplement Recommendations**: Evidence-based supplement guidance

### 🤝 Team Chemistry
- **Relationship Analytics**: Player interaction and chemistry scoring
- **Communication Metrics**: Team communication effectiveness analysis
- **Network Visualization**: Interactive team relationship mapping
- **Performance Impact**: Chemistry correlation with team performance

### 📊 Interactive Dashboard
- **Drag & Drop Interface**: Customizable dashboard layouts
- **Real-time Updates**: Live performance data and analytics
- **Mobile Responsive**: Optimized for all device types
- **Modern Design**: Clean, professional interface

## 🛠️ Technical Stack

<div align="center">

| Frontend | Backend | Database | Analytics |
|----------|---------|----------|-----------|
| React 18 | Node.js | PostgreSQL | AI/ML Models |
| Vite | Express | Drizzle ORM | D3.js Visualizations |
| Tailwind CSS | GraphQL | Redis Cache | Sports Analytics APIs |

</div>

## 📁 Project Structure

```
src/
├── components/
│   ├── PerformancePredictionEngine.jsx    # AI performance predictions
│   ├── InjuryRiskAssessment.jsx          # Injury prevention analytics
│   ├── NutritionPerformanceAnalytics.jsx # Nutrition analysis
│   ├── InteractivePerformanceVisualization.jsx # Data visualizations
│   ├── TeamChemistryAnalytics.jsx       # Team relationship analysis
│   └── DraggableDashboard.jsx           # Main dashboard
├── services/
│   ├── AICoachService.js                # AI coaching logic
│   ├── NutritionService.js              # Nutrition data processing
│   └── external/USDAFoodDataService.js  # USDA API integration
├── database/
│   ├── schema.sql                       # Database schema
│   └── migrations/                      # Database migrations
└── docs/                               # Comprehensive documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

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

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Initialize database**
   ```bash
   npm run db:setup
   npm run db:migrate
   npm run db:seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 📊 Advanced Features

### 🤖 AI Performance Engine
- **Machine Learning Models**: Custom algorithms for performance prediction
- **Risk Assessment**: Injury probability calculations
- **Recommendation System**: Personalized training suggestions
- **Pattern Recognition**: Performance trend analysis

### 📈 Data Science Components
- **Statistical Analysis**: Advanced sports metrics
- **Correlation Studies**: Multi-variable performance analysis
- **Predictive Modeling**: Future performance forecasting
- **Visualization Engine**: Interactive data representations

### 🔒 Privacy & Compliance
- **GDPR Compliant**: Full European data protection compliance (Articles 13 & 14)
- **HIPAA-level Security**: Health data protection standards
- **Multi-jurisdictional**: Slovenia (ZVOP-2, ZVPot-1) and Germany (BDSG, BGB) compliance
- **Transparent Processing**: Clear data usage policies with AI disclosure

## 🏗️ Database Schema

The application uses a comprehensive PostgreSQL schema including:

- **Users & Authentication**: Secure user management
- **Performance Metrics**: Detailed training and game statistics
- **Nutrition Database**: USDA-integrated food and supplement data
- **Team Management**: Player relationships and team analytics
- **AI Training Data**: Machine learning model data storage

## 📱 Mobile Experience

- **Responsive Design**: Optimized for all screen sizes
- **Touch Interactions**: Intuitive mobile gestures
- **Offline Capability**: Core features work without internet
- **Push Notifications**: Training reminders and updates

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run test suite
npm run lint         # Code quality checks
npm run db:setup     # Initialize database
npm run db:migrate   # Run database migrations
npm run db:seed      # Populate with sample data
```

### Code Quality

- **ESLint**: Consistent code formatting
- **Prettier**: Automatic code formatting
- **Testing**: Comprehensive test coverage with Vitest
- **Type Safety**: PropTypes for component validation

## 🚀 Deployment

The application is deployment-ready with:

- **Netlify Configuration**: Automated deployments
- **Environment Management**: Secure config handling
- **Performance Optimization**: Optimized builds
- **CDN Integration**: Fast global content delivery

## 📄 Legal Compliance

Enhanced legal documentation included:

- **Privacy Policy**: GDPR Articles 13 & 14 compliant with Slovenia and Germany specific provisions
- **Terms of Use**: Comprehensive legal protections with health disclaimers
- **Data Processing Register**: Complete transparency on all data processing activities
- **AI Processing Disclosure**: Detailed AI logic explanations and user rights

## 📄 Documentation

Comprehensive documentation available in `/docs/`:

- **API Documentation**: Complete API reference
- **Component Guide**: Detailed component documentation
- **Database Schema**: Complete database documentation
- **Deployment Guide**: Step-by-step deployment instructions

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 🙏 Acknowledgments

- Sports science research from leading institutions
- USDA FoodData Central for nutrition database
- Open-source community for amazing tools and libraries

---

<div align="center">

**Built with ❤️ for the flag football community**

🤖 **Generated with [Claude Code](https://claude.ai/code)**

**Co-Authored-By: Claude <noreply@anthropic.com>**

[Documentation](docs/) • [API Guide](docs/API.md) • [Contributing](CONTRIBUTING.md) • [License](LICENSE.md)

</div>