# FlagFit Pro - Database Choice

## 🎯 **CHOSEN DATABASE: Neon PostgreSQL**

### **Why Neon PostgreSQL?**

1. **✅ Already Working**: Your current app is fully functional with Neon PostgreSQL
2. **✅ Serverless**: Perfect for Netlify deployment
3. **✅ PostgreSQL**: Robust, reliable, and feature-rich
4. **✅ Drizzle ORM**: Type-safe database operations
5. **✅ Free Tier**: Generous free tier for development
6. **✅ Branching**: Easy database branching for development

### **What We're NOT Using:**

❌ **PocketBase**: Removed from documentation and setup
❌ **Supabase**: Not used in this project
❌ **SQLite**: Not suitable for production deployment

## 🗄️ **Database Schema**

### **Core Tables**
```sql
-- Users table
users (
  id: uuid PRIMARY KEY,
  email: text UNIQUE NOT NULL,
  username: text UNIQUE,
  firstName: text,
  lastName: text,
  role: text DEFAULT 'athlete',
  isActive: boolean DEFAULT true,
  createdAt: timestamp DEFAULT now()
)

-- Training sessions
training_sessions (
  id: uuid PRIMARY KEY,
  userId: uuid REFERENCES users(id),
  title: text NOT NULL,
  description: text,
  type: text,
  duration: integer,
  difficulty: text,
  status: text DEFAULT 'planned',
  scheduledAt: timestamp,
  completedAt: timestamp,
  tags: text[],
  createdAt: timestamp DEFAULT now()
)

-- Training goals
training_goals (
  id: uuid PRIMARY KEY,
  userId: uuid REFERENCES users(id),
  title: text NOT NULL,
  description: text,
  type: text,
  targetValue: numeric,
  currentValue: numeric,
  unit: text,
  priority: text,
  status: text DEFAULT 'active',
  targetDate: timestamp,
  createdAt: timestamp DEFAULT now()
)

-- Analytics events
analytics_events (
  id: uuid PRIMARY KEY,
  userId: uuid REFERENCES users(id),
  eventType: text NOT NULL,
  eventData: jsonb,
  timestamp: timestamp DEFAULT now()
)

-- Teams
teams (
  id: uuid PRIMARY KEY,
  name: text NOT NULL,
  description: text,
  ownerId: uuid REFERENCES users(id),
  createdAt: timestamp DEFAULT now()
)

-- Team members
team_members (
  id: uuid PRIMARY KEY,
  teamId: uuid REFERENCES teams(id),
  userId: uuid REFERENCES users(id),
  role: text DEFAULT 'member',
  joinedAt: timestamp DEFAULT now()
)
```

## 🔧 **Setup Instructions**

### **1. Create Neon Database**
1. Go to [neon.tech](https://neon.tech)
2. Sign up for free account
3. Create new project: `flagfit-pro`
4. Copy connection string

### **2. Environment Variables**
```bash
# .env.local
VITE_NEON_DATABASE_URL=postgresql://username:password@host/database
VITE_APP_ENVIRONMENT=development
VITE_APP_NAME=FlagFit Pro
```

### **3. Database Migration**
```bash
# Generate migration
npm run db:generate

# Run migration
npm run db:migrate
```

## 🚫 **Removed References**

### **Files to Remove:**
- `pocketbase-client.service.js` ❌
- `PocketContext.jsx` ❌
- `pb_hooks/` directory ❌
- `pb_migrations/` directory ❌

### **Documentation to Update:**
- Remove all PocketBase references
- Remove all Supabase references
- Update setup instructions
- Update deployment guide

## ✅ **Benefits of This Choice**

1. **Consistency**: One database throughout the app
2. **Reliability**: PostgreSQL is battle-tested
3. **Scalability**: Neon handles scaling automatically
4. **Type Safety**: Drizzle ORM provides excellent TypeScript support
5. **Cost Effective**: Free tier covers development needs
6. **Easy Deployment**: Works seamlessly with Netlify

## 📋 **Next Steps**

1. ✅ **Database Choice**: Neon PostgreSQL (COMPLETE)
2. 🔄 **Plan Architecture**: Clean React app structure
3. 🔄 **Document Everything**: Accurate documentation
4. 🔄 **Build Incrementally**: One feature at a time
5. 🔄 **Maintain Consistency**: Keep code and docs in sync

**This database choice ensures we have a solid, scalable foundation for FlagFit Pro!** 🎯 