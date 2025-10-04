# FlagFit Pro - Deployment Guide

## 🚀 Netlify Deployment Steps

### Prerequisites
1. ✅ All wireframes matched with backend endpoints
2. ✅ Backend API routes created and functional
3. ✅ Frontend-backend integration configured
4. ✅ Netlify configuration files ready

### 1. Prepare for Deployment

#### Backend Deployment (Required First)
Your backend needs to be deployed separately. Options:
- **Heroku**: `heroku create flagfit-pro-api`
- **Railway**: Easy Node.js deployment
- **DigitalOcean App Platform**: Scalable option
- **AWS ECS/Elastic Beanstalk**: Enterprise option

#### Update API Configuration
1. Deploy your backend to a cloud service
2. Update `src/api-config.js` with your production backend URL:
   ```javascript
   return 'https://your-backend-url.herokuapp.com'; // Update this line
   ```

### 2. Deploy to Netlify

#### Option A: Netlify CLI (Recommended)
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy from project root
cd "/Users/aljosaursakous/Desktop/Flag football HTML - APP"
netlify deploy

# For production deployment
netlify deploy --prod
```

#### Option B: Git Integration
1. Push your code to GitHub/GitLab
2. Connect repository to Netlify
3. Netlify will auto-deploy on commits

#### Option C: Manual Upload
1. Run `npm run build` locally
2. Upload the entire project folder to Netlify

### 3. Environment Variables

Set these in Netlify dashboard (Site Settings → Environment Variables):

```
NODE_ENV=production
FLAGFIT_ENVIRONMENT=production
FLAGFIT_APP_NAME=FlagFit Pro
FLAGFIT_APP_VERSION=1.0.8
JWT_SECRET=your-production-jwt-secret
DATABASE_URL=your-production-database-url
API_BASE_URL=https://your-backend-url.herokuapp.com
```

### 4. Domain Configuration

#### Custom Domain (Optional)
1. Go to Netlify dashboard → Domain settings
2. Add custom domain: `flagfit-pro.com`
3. Configure DNS settings
4. Enable HTTPS (automatic)

#### Update CORS
Update your backend's CORS configuration to include:
- `https://your-site-name.netlify.app`
- `https://flagfit-pro.com` (if using custom domain)

### 5. Database Setup

Your app requires a PostgreSQL database with these tables:
- `users`
- `teams` 
- `training_sessions`
- `performance_metrics`
- `notifications`
- `games`
- `tournaments`
- `posts`, `comments`, `likes`
- And more (see `/database/migrations/`)

#### Option A: Use provided seed data
```bash
npm run seed
```

#### Option B: Manual setup
Run the SQL files in `/database/migrations/` in order.

### 6. Available API Endpoints

Your deployed app will have these API endpoints:

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

#### Dashboard
- `GET /api/dashboard/overview` - Dashboard overview data
- `GET /api/dashboard/training-calendar` - Training calendar
- `GET /api/dashboard/notifications` - User notifications

#### Analytics
- `GET /api/analytics/performance-trends` - Performance over time
- `GET /api/analytics/team-chemistry` - Team chemistry metrics
- `GET /api/analytics/training-distribution` - Training type distribution

#### Coach Features
- `GET /api/coach/dashboard` - Coach dashboard data
- `GET /api/coach/team` - Team management data
- `POST /api/coach/training-session` - Create training sessions

#### Community
- `GET /api/community/feed` - Community posts feed
- `POST /api/community/posts` - Create new post
- `GET /api/community/leaderboard` - Performance leaderboard

#### Tournaments
- `GET /api/tournaments` - Tournament listings
- `GET /api/tournaments/:id` - Tournament details
- `POST /api/tournaments/:id/register` - Register for tournament

### 7. Testing Deployment

After deployment, test these key features:
1. ✅ User login/registration
2. ✅ Dashboard loads with data
3. ✅ Analytics charts display
4. ✅ Community features work
5. ✅ Tournament listings load
6. ✅ Coach dashboard functions

### 8. Monitoring & Maintenance

#### Health Checks
All routes include health check endpoints:
- `/api/health` - Overall API health
- `/api/dashboard/health` - Dashboard service health
- `/api/analytics/health` - Analytics service health

#### Logs
Monitor your deployment logs:
```bash
netlify logs
```

#### Performance
- Netlify provides automatic performance optimization
- Static files are cached automatically
- CDN distribution included

### 9. Troubleshooting

#### Common Issues

**CORS Errors**: 
- Update backend CORS configuration
- Check environment variables

**API Not Found**: 
- Verify backend is deployed and running
- Check `src/api-config.js` URL

**Database Connection**: 
- Verify DATABASE_URL environment variable
- Check database server is accessible

**Build Failures**:
- Check Netlify build logs
- Verify package.json scripts

#### Support
- Check Netlify deployment logs
- Verify all environment variables are set
- Test API endpoints directly

## 🎉 Deployment Complete!

Your FlagFit Pro app should now be live with:
- ✅ Complete wireframe functionality
- ✅ Full backend API coverage
- ✅ Responsive design
- ✅ Analytics dashboard
- ✅ Community features
- ✅ Tournament management
- ✅ Coach tools

Visit your deployed site and test all features!