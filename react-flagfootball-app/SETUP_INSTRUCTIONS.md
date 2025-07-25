# FlagFit Pro Setup Instructions

## 🎨 Design System Overview

**FlagFit Pro uses a consistent branding system:**
- **Primary Color**: Green (#16A34A) for all interactive elements
- **Background**: White (#FFFFFF) for clean, modern appearance
- **Text**: Black (#111827) for excellent readability
- **Accents**: Green gradients for highlights and progress indicators
- **Borders**: Light gray (#E5E7EB) for subtle separation

**All pages maintain this consistent color scheme:**
- Login/Register: White backgrounds with green buttons
- Dashboard: White cards with green progress indicators
- Training: Green gradients for challenges, white cards for content
- Profile/Community: Consistent white backgrounds with green accents

## 🗄️ Database Setup: Neon PostgreSQL

### Step 1: Create Neon Database

1. **Sign Up for Neon**
   - Go to [neon.tech](https://neon.tech)
   - Create a free account
   - Verify your email

2. **Create New Project**
   - Click "Create New Project"
   - Project name: `flagfit-pro`
   - Region: Choose closest to your users
   - Click "Create Project"

3. **Get Connection String**
   - In your project dashboard, click "Connection Details"
   - Copy the connection string (starts with `postgresql://`)

### Step 2: Environment Configuration

1. **Create Environment File**
   ```bash
   cd react-flagfootball-app
   cp env.example .env.local
   ```

2. **Edit Environment Variables**
   ```bash
   # .env.local
   VITE_NEON_DATABASE_URL=postgresql://username:password@host/database
   VITE_APP_ENVIRONMENT=development
   VITE_APP_NAME=FlagFit Pro
   VITE_APP_VERSION=1.0.0
   ```

### Step 3: Database Schema Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Generate Database Schema**
   ```bash
   npm run db:generate
   ```

3. **Run Database Migrations**
   ```bash
   npm run db:migrate
   ```

### Step 4: Verify Database Connection

1. **Test Connection**
   ```bash
   npm run db:test
   ```

2. **Check Tables Created**
   - Go to Neon dashboard
   - Click "Tables" in the left sidebar
   - Verify these tables exist:
     - `users`
     - `training_sessions`
     - `training_goals`
     - `analytics_events`
     - `teams`
     - `team_members`

## 🚀 Application Setup

### Step 1: Install Dependencies
```bash
cd react-flagfootball-app
npm install
```

### Step 2: Start Development Server
```bash
npm run dev
```

### Step 3: Access Application
- **Local Development**: http://localhost:4000/
- **Database Admin**: Neon dashboard at neon.tech

## 👤 Create First User

### Option 1: Register Through App
1. Go to http://localhost:4000/register
2. Fill in registration form
3. Verify email (if enabled)
4. Login with credentials

### Option 2: Direct Database Insert
```sql
-- Insert test user directly into database
INSERT INTO users (id, email, username, firstName, lastName, role, isActive, createdAt)
VALUES (
  gen_random_uuid(),
  'admin@flagfit.com',
  'admin',
  'Admin',
  'User',
  'admin',
  true,
  NOW()
);
```

## 🔧 Development Commands

### Database Commands
```bash
npm run db:generate    # Generate new migration
npm run db:migrate     # Run pending migrations
npm run db:reset       # Reset database (development only)
npm run db:seed        # Seed with test data
```

### Development Commands
```bash
npm run dev            # Start development server
npm run build          # Build for production
npm run preview        # Preview production build
npm run test           # Run tests
npm run lint           # Lint code
npm run lint:fix       # Fix linting issues
```

## 🧪 Testing the Setup

### 1. Test Authentication
- Go to http://localhost:4000/login
- Try logging in with test credentials
- Verify redirect to dashboard

### 2. Test Database Connection
- Check browser console for database connection logs
- Verify no connection errors
- Test creating a training session

### 3. Test Features
- Create a new training session
- Add a training goal
- Check analytics tracking
- Test responsive design

## 🚨 Troubleshooting

### Database Connection Issues
```bash
# Check environment variables
echo $VITE_NEON_DATABASE_URL

# Test connection manually
npm run db:test

# Check Neon dashboard for connection limits
```

### Build Issues
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
npm run dev -- --force
```

### Port Issues
```bash
# Check if port 4000 is in use
lsof -i :4000

# Use different port
npm run dev -- --port 4001
```

## 📊 Database Schema Reference

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  firstName TEXT,
  lastName TEXT,
  role TEXT DEFAULT 'athlete',
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

### Training Sessions Table
```sql
CREATE TABLE training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT,
  duration INTEGER,
  difficulty TEXT,
  status TEXT DEFAULT 'planned',
  scheduledAt TIMESTAMP,
  completedAt TIMESTAMP,
  tags TEXT[],
  createdAt TIMESTAMP DEFAULT NOW()
);
```

### Training Goals Table
```sql
CREATE TABLE training_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT,
  targetValue NUMERIC,
  currentValue NUMERIC,
  unit TEXT,
  priority TEXT,
  status TEXT DEFAULT 'active',
  targetDate TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

## 🔒 Security Considerations

### Environment Variables
- Never commit `.env.local` to version control
- Use different databases for development and production
- Rotate database passwords regularly

### Database Security
- Enable SSL connections
- Use connection pooling
- Implement proper user roles
- Regular backup schedule

## 📈 Performance Optimization

### Database Optimization
- Add indexes for frequently queried columns
- Use connection pooling
- Monitor query performance
- Regular maintenance

### Application Optimization
- Enable code splitting
- Optimize bundle size
- Use React.memo for expensive components
- Implement proper caching

## ✅ Setup Checklist

- [ ] Neon PostgreSQL account created
- [ ] Database project created
- [ ] Connection string copied
- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] Database migrations run
- [ ] Development server started
- [ ] First user created
- [ ] Authentication tested
- [ ] Features verified working

## 🎉 Success!

Once you've completed all steps, you should have a fully functional FlagFit Pro application running with:

- ✅ **Neon PostgreSQL Database**: Connected and working
- ✅ **Authentication System**: Login/register functional
- ✅ **Training Management**: Create and track sessions
- ✅ **Progress Tracking**: Analytics and goals working
- ✅ **Responsive Design**: Works on all devices
- ✅ **Consistent Branding**: FlagFit Pro colors throughout

**Your FlagFit Pro application is now ready for development!** 🚀