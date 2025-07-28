# 🗄️ Database Setup Guide
*Neon PostgreSQL Integration for Flag Football App*

## 📋 Overview

This guide covers the complete database setup and integration process using Neon PostgreSQL serverless database with Drizzle ORM.

## 🚀 Quick Setup

### 1. **Environment Configuration**

Copy the environment template:
```bash
cp .env.example .env
```

Add your Neon database connection string to `.env`:
```bash
DATABASE_URL="postgresql://username:password@hostname/database?sslmode=require"
VITE_DATABASE_URL="postgresql://username:password@hostname/database?sslmode=require"
```

### 2. **Database Setup Commands**

Complete setup (generate, migrate, seed):
```bash
npm run db:setup
```

Or run individually:
```bash
# Generate migrations from schema
npm run db:generate

# Apply migrations to database
npm run db:migrate

# Seed with sample data
npm run db:seed

# Open Drizzle Studio (database admin UI)
npm run db:studio
```

## 🏗️ Database Architecture

### Core Tables

#### **Users** (`users`)
- Primary user information and authentication
- Emergency contact details
- Medical information for safety
- Role-based permissions (player, coach, admin, medical_staff)

#### **Teams** (`teams`)
- Team management and organization
- Coach assignments and team chemistry tracking
- League and division information

#### **Training & Performance**
- `training_programs` - Structured training programs
- `training_sessions` - Individual training instances
- `performance_metrics` - Quantified performance data

#### **Games & Competition**
- `games` - Game scheduling and results
- `game_stats` - Individual player statistics

#### **Communication**
- `notifications` - Multi-channel notification system
- `team_messages` - Team communication and chat

#### **System Operations**
- `backups` - Backup metadata and recovery information
- `system_logs` - Comprehensive system logging

## 🔧 Development Workflow

### Schema Changes

1. **Modify Schema**: Update `src/lib/schema.js`
2. **Generate Migration**: `npm run db:generate`
3. **Apply Migration**: `npm run db:migrate`
4. **Test Changes**: Verify with `npm run db:studio`

### Sample Data

The seeding script creates:
- 4 sample users (1 coach, 3 players)
- 1 team with all members
- Training sessions and performance metrics
- Notifications and backup records

## 📊 Database Schema Details

### Key Features

- **UUID Primary Keys**: All tables use UUID for enhanced security
- **JSON Fields**: Flexible storage for metadata, preferences, and complex data
- **Indexes**: Optimized queries with strategic indexing
- **Foreign Key Constraints**: Data integrity and referential consistency
- **Timestamps**: Comprehensive audit trail with created/updated timestamps

### Safety & Compliance

- **Emergency Contacts**: Required for all users
- **Medical Information**: Secure storage of health data
- **GDPR Ready**: User data management and privacy controls
- **Audit Logging**: Complete system activity tracking

## 🔐 Security Considerations

### Data Protection
- Encrypted sensitive fields
- Role-based access control (RBAC)
- Secure password handling (hashed storage)
- Medical data compliance

### Environment Security
- Database credentials in environment variables
- SSL-required connections
- Connection pooling and rate limiting

## 🚀 Production Deployment

### Neon PostgreSQL Setup

1. **Create Neon Account**: Visit [console.neon.tech](https://console.neon.tech/)
2. **Create Database**: Set up new PostgreSQL database
3. **Get Connection String**: Copy from Neon dashboard
4. **Set Environment Variables**: Configure production environment

### Migration Process

```bash
# Production migration
DATABASE_URL="your-production-url" npm run db:migrate

# Verify with studio (optional)
DATABASE_URL="your-production-url" npm run db:studio
```

## 🔍 Monitoring & Maintenance

### Health Checks

The `DatabaseService` provides health monitoring:
```javascript
import databaseService from './src/services/DatabaseService.js';

// Check database health
const health = await databaseService.getHealthStatus();

// Get database statistics
const stats = await databaseService.getDatabaseStats();
```

### Backup Strategy

- **Automated Backups**: Neon provides automatic backups
- **Application Backups**: Integrated backup system in app
- **Point-in-time Recovery**: Available through Neon
- **Backup Metadata**: Tracked in `backups` table

## 🛠️ Troubleshooting

### Common Issues

#### Connection Errors
```bash
# Test connection
node -e "import('./src/lib/database.js').then(db => db.default.healthCheck().then(console.log))"
```

#### Migration Failures
```bash
# Reset and regenerate
npm run db:reset
npm run db:generate
npm run db:migrate
```

#### Schema Conflicts
- Check for conflicting table names
- Verify foreign key relationships
- Review index constraints

### Debug Mode

Enable debug logging:
```bash
# In .env
VITE_DEBUG_MODE="true"
```

## 📈 Performance Optimization

### Query Optimization
- Strategic indexing on frequently queried columns
- Connection pooling through Neon
- Prepared statements via Drizzle ORM

### Scaling Considerations
- Read replicas for analytics queries
- Horizontal scaling with multiple databases
- Caching layer for frequently accessed data

## 🧪 Testing

### Test Database Setup
```bash
# Create test environment
DATABASE_URL="test-database-url" npm run db:setup
```

### Integration Tests
The database service includes comprehensive error handling and logging for testing scenarios.

## 📚 Additional Resources

- [Neon Documentation](https://neon.tech/docs)
- [Drizzle ORM Guide](https://orm.drizzle.team/docs/overview)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Next Steps**: Once database is set up, you can proceed with application deployment and user onboarding.