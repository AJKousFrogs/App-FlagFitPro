# FlagFit Pro Database Setup Guide

## Overview

This guide covers the comprehensive database setup for FlagFit Pro, including nutrition, recovery, AI coaching, and sports science research systems.

## Database Architecture

The FlagFit Pro database consists of four main systems:

### 1. Nutrition System
- **USDA FoodData Central Integration**: Comprehensive food database with nutritional information
- **Sports Nutrition Plans**: Evidence-based nutrition strategies for athletes
- **Meal Templates**: Pre-designed meal plans for different training phases
- **Supplements Database**: Research-backed supplement information
- **Food Synergies**: Optimal food combinations for performance

### 2. Recovery System
- **Cryotherapy Protocols**: Whole body cryotherapy and ice bath protocols
- **Compression Therapy**: Compression garments and pneumatic compression
- **Manual Therapy**: Foam rolling, stretching, and massage protocols
- **Heat Therapy**: Sauna, hot tub, and heat therapy protocols
- **Sleep Optimization**: Sleep hygiene and recovery protocols

### 3. AI Coaches & Sport Psychology
- **AI Coach Profiles**: Specialized coaches with sport psychology expertise
- **Mental Training Techniques**: Visualization, goal setting, and mental toughness
- **Psychological Assessments**: Mental skills evaluation tools
- **Sport Psychology Research**: Evidence-based mental training approaches

### 4. Sports Science Research
- **Research Institutions**: Leading sports science institutions worldwide
- **Research Studies**: Peer-reviewed studies and meta-analyses
- **Performance Methodologies**: Evidence-based training approaches
- **Evidence-Based Protocols**: Implementable protocols with research backing

## Prerequisites

### Database Requirements
- PostgreSQL 12+ or Neon PostgreSQL
- Database user with CREATE, INSERT, UPDATE, DELETE permissions
- Sufficient storage space (minimum 2GB recommended)

### Environment Variables
Create a `.env` file in the project root with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=flagfootball_dev
DB_USER=your_username
DB_PASSWORD=your_password

# USDA FoodData Central API (optional)
USDA_API_KEY=your_usda_api_key

# External APIs (optional)
DEAKIN_API_KEY=your_deakin_api_key
NORWEGIAN_SCHOOL_API_KEY=your_norwegian_school_api_key
INSEP_API_KEY=your_insep_api_key
```

## Installation Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Database Setup
```bash
# Run the comprehensive setup script
node scripts/setupDatabase.js
```

This script will:
1. Run all database migrations
2. Seed the nutrition database with USDA data
3. Seed the recovery science database
4. Seed the AI coaches and sport psychology database
5. Seed the sports science research database
6. Verify the database setup

### 3. Individual Scripts (Optional)
If you need to run individual components:

```bash
# Run migrations only
node scripts/runMigrations.js

# Seed nutrition database
node scripts/seedComprehensiveNutritionDatabase.js

# Seed recovery database
node scripts/seedRecoveryScienceDatabase.js

# Seed AI coaches database
node scripts/seedAICoachesDatabase.js

# Seed sports science research
node scripts/seedSportsScienceResearch.js
```

## Database Schema

### Core Tables

#### Nutrition System
- `foods` - USDA FoodData Central food items
- `nutrients` - Nutritional components and their performance impact
- `food_nutrients` - Nutritional values for foods
- `nutrition_plans` - Evidence-based nutrition strategies
- `meal_templates` - Pre-designed meal plans
- `supplements` - Research-backed supplement information
- `athlete_nutrition_profiles` - Individual nutrition profiles

#### Recovery System
- `recovery_protocols` - Comprehensive recovery protocols
- `cryotherapy_protocols` - Cryotherapy-specific protocols
- `compression_protocols` - Compression therapy protocols
- `manual_therapy_protocols` - Foam rolling and stretching
- `heat_therapy_protocols` - Heat therapy protocols
- `sleep_optimization_protocols` - Sleep and recovery protocols
- `athlete_recovery_profiles` - Individual recovery profiles

#### AI Coaches & Sport Psychology
- `ai_coaches` - AI coach profiles with specializations
- `mental_training_techniques` - Mental skills training methods
- `mental_toughness_protocols` - Mental toughness development
- `psychological_assessments` - Mental skills evaluation tools
- `athlete_psychological_profiles` - Individual psychological profiles
- `coaching_sessions` - AI coaching session records

#### Sports Science Research
- `research_institutions` - Leading sports science institutions
- `research_studies` - Peer-reviewed research studies
- `performance_methodologies` - Evidence-based training approaches
- `evidence_based_protocols` - Implementable protocols
- `research_collaborations` - Research partnerships and collaborations

## Data Sources

### Nutrition Data
- **USDA FoodData Central**: Comprehensive food database
- **Sports Nutrition Research**: Evidence-based nutrition strategies
- **Olympic Nutrition Guidelines**: Elite athlete nutrition protocols

### Recovery Data
- **Cryotherapy Research**: Banfi et al. (2010), Hausswirth et al. (2011)
- **Compression Therapy**: Meta-analyses and systematic reviews
- **Manual Therapy**: Evidence-based stretching and foam rolling protocols
- **Sleep Science**: Sleep optimization for athletic performance

### AI Coaches Data
- **Liverpool John Moores University**: Applied Sport Psychology Research Group
- **Norwegian School of Sport Sciences**: Performance psychology research
- **University of Copenhagen**: Sport psychology and mental training
- **Professional Certifications**: AASP, BASES, CMPC standards

### Sports Science Research
- **Deakin University**: Institute for Physical Activity and Nutrition
- **Norwegian School of Sport Sciences**: Sports medicine and exercise science
- **INSEP**: French National Institute of Sport, Expertise and Performance
- **Research Collaborations**: International sports performance consortium

## Verification

After setup, verify the database by checking:

```sql
-- Check table counts
SELECT 
  (SELECT COUNT(*) FROM foods) as foods_count,
  (SELECT COUNT(*) FROM recovery_protocols) as recovery_count,
  (SELECT COUNT(*) FROM ai_coaches) as coaches_count,
  (SELECT COUNT(*) FROM research_studies) as studies_count;

-- Check data quality
SELECT 
  table_name, 
  COUNT(*) as record_count 
FROM information_schema.tables 
WHERE table_schema = 'public' 
GROUP BY table_name 
ORDER BY record_count DESC;
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify PostgreSQL is running
   - Check database credentials in `.env`
   - Ensure database exists: `createdb flagfootball_dev`

2. **Migration Errors**
   - Check PostgreSQL version (12+ required)
   - Verify user permissions
   - Clear migration history if needed: `DELETE FROM migrations;`

3. **Seeding Errors**
   - Check available disk space
   - Verify API keys if using external data sources
   - Check database constraints and foreign keys

4. **Performance Issues**
   - Optimize PostgreSQL configuration
   - Add appropriate indexes
   - Consider database partitioning for large datasets

### Reset Database
To completely reset the database:

```bash
# Drop and recreate database
dropdb flagfootball_dev
createdb flagfootball_dev

# Run setup again
node scripts/setupDatabase.js
```

## Maintenance

### Regular Updates
- Update USDA food data monthly
- Refresh research studies quarterly
- Update AI coach content annually

### Backup Strategy
```bash
# Create database backup
pg_dump flagfootball_dev > backup_$(date +%Y%m%d).sql

# Restore from backup
psql flagfootball_dev < backup_20240101.sql
```

### Performance Monitoring
```sql
-- Monitor table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Support

For database setup issues:
1. Check the troubleshooting section above
2. Review PostgreSQL logs
3. Verify environment configuration
4. Contact the development team

## License

This database setup is part of the FlagFit Pro application and follows the same licensing terms. 