# 🏈 FlagFit Pro Dashboard - Backend Integration Setup

This guide will help you connect your HTML wireframe to the backend database and get the comprehensive app running.

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)
```bash
./scripts/setup-dashboard.sh
```

### Option 2: Manual Setup
Follow the steps below if you prefer to set up manually.

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm (comes with Node.js)
- Neon PostgreSQL database account
- Git (for version control)

## 🗄️ Database Setup

### 1. Create Neon Database
1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project
3. Copy your connection string (it looks like: `postgresql://user:pass@host/db`)

### 2. Configure Environment Variables
```bash
cp env.example .env
```

Edit `.env` file with your database credentials:
```env
DATABASE_URL=postgresql://your_user:your_pass@your_host/your_db
JWT_SECRET=your-super-secret-jwt-key-here
```

## 📦 Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed Database
```bash
npm run seed
```

This will:
- Create all necessary tables
- Insert sample data for testing
- Set up the dashboard structure

### 3. Start Server
```bash
npm start
```

The server will run on `http://localhost:3001`

## 🌐 Using the Dashboard

### 1. Login System
- **Login Page**: Open `login.html` in your browser
- **Demo Mode**: Accepts any email and password for testing
- **Pre-filled**: Comes with demo credentials (test@flagfitpro.com / demo123)
- **Authentication**: JWT-based token system

### 2. Access Dashboard
- Login with any email and password
- Automatically redirected to dashboard
- Protected route - requires authentication
- Logout button in top-right corner

### 3. API Endpoints Available
- `GET /api/dashboard/overview` - Dashboard overview data
- `GET /api/dashboard/training-calendar` - 7-day training schedule
- `GET /api/dashboard/olympic-qualification` - LA28 Olympic data
- `GET /api/dashboard/sponsor-rewards` - Sponsor products & rewards
- `GET /api/dashboard/wearables` - Multi-device wearables data
- `GET /api/dashboard/team-chemistry` - Team chemistry metrics
- `GET /api/dashboard/notifications` - User notifications
- `GET /api/dashboard/daily-quote` - Daily motivational quotes

## 🏗️ Architecture Overview

```
HTML Wireframe (Frontend)
         ↓
   Dashboard API (src/dashboard-api.js)
         ↓
   Express Server (server.js)
         ↓
   Neon PostgreSQL Database
```

### Frontend Components
- **HTML Wireframe**: Static HTML with embedded JavaScript
- **Dashboard API**: Handles API calls and data management
- **Data Updates**: Real-time updates from database

### Backend Components
- **Express Server**: RESTful API endpoints
- **Database Routes**: Organized API route handlers
- **Data Seeding**: Sample data for development

## 🔧 Development Workflow

### 1. Make Changes to Wireframe
- Edit `dashboard-complete-wireframe.html`
- Add new sections or modify existing ones
- Update JavaScript functions as needed

### 2. Add New API Endpoints
- Create new routes in `routes/dashboardRoutes.js`
- Add corresponding methods in `src/dashboard-api.js`
- Update the frontend to use new data

### 3. Database Schema Changes
- Modify `scripts/seedDashboardData.js`
- Run `npm run seed` to apply changes
- Update API routes if needed

## 🚨 Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
Error: connect ECONNREFUSED
```
**Solution**: Check your `DATABASE_URL` in `.env` file

#### 2. Tables Don't Exist
```bash
Error: relation "training_sessions" does not exist
```
**Solution**: Run `npm run seed` to create tables

#### 3. CORS Errors
```bash
Access to fetch at 'http://localhost:3001/api/dashboard/overview' from origin 'null' has been blocked by CORS policy
```
**Solution**: Make sure the server is running and CORS is properly configured

#### 4. API Calls Failing
- Check browser console for errors
- Verify server is running on port 3001
- Check network tab for failed requests

### Debug Mode
Enable debug logging by setting in `.env`:
```env
VITE_DEBUG_LOGGING=true
```

## 🔄 Next Steps

### Phase 1: HTML Wireframe (Current)
- ✅ Backend API integration
- ✅ Database connectivity
- ✅ Real-time data updates

### Phase 2: React Migration (Future)
- Convert HTML to React components
- Implement state management
- Add routing and navigation

### Phase 3: Advanced Features
- User authentication
- Real-time notifications
- Advanced analytics
- Mobile app development

## 📚 API Documentation

### Dashboard Overview
```javascript
GET /api/dashboard/overview?userId=1

Response:
{
  "success": true,
  "data": {
    "trainingProgress": {
      "percentage": 87,
      "completed": 6,
      "trend": "+12% from last week"
    },
    "performanceScore": {
      "score": "8.4",
      "total": 12,
      "status": "Olympic standard reached"
    }
  }
}
```

### Training Calendar
```javascript
GET /api/dashboard/training-calendar?userId=1

Response:
{
  "success": true,
  "data": [
    {
      "dayName": "MON",
      "dayDate": 4,
      "dayTraining": "Speed & Agility",
      "trainingStatus": "Completed",
      "isToday": false,
      "isCompleted": true
    }
  ]
}
```

## 🎯 Testing

### Test API Endpoints
```bash
# Test health check
curl http://localhost:3001/api/health

# Test login system
npm run test:login

# Test dashboard endpoints
npm run test

# Test dashboard overview
curl http://localhost:3001/api/dashboard/overview?userId=1
```

### Test Frontend
1. Open `login.html` in browser
2. Login with any email and password
3. Verify redirect to dashboard
4. Check browser console for API calls
5. Verify data is loading from database
6. Test interactive features
7. Test logout functionality

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review browser console for errors
3. Check server logs for backend issues
4. Verify database connection and tables

## 🎉 Success!

Once everything is working:
- Your HTML wireframe will display real data from the database
- All dashboard metrics will be dynamic and updatable
- You'll have a solid foundation for building the React app
- The backend API will be ready for additional features

Happy coding! 🚀
