# Health Check System Documentation

## 🏥 Overview

The Flag Football App includes a comprehensive health check system that monitors various aspects of the application, from service availability to database connectivity and performance metrics.

## 📋 Health Check Types

### 1. **Service Health Check** (`health:check`)

Monitors localhost services and port availability to prevent conflicts.

**Features:**

- Port availability checking (4000, 4001, 4002, 3000, 3001, etc.)
- Service status monitoring (Vite, Database, MCP services)
- Response time measurement
- Port conflict detection

**Usage:**

```bash
npm run health:check          # Single check
npm run health:monitor        # Continuous monitoring
```

### 2. **Database Health Check** (`db:health`)

Validates Supabase PostgreSQL connectivity, schema integrity, and performance.

**Features:**

- Database connectivity testing
- Schema completeness validation
- Data integrity checks
- Performance metrics analysis
- Backup system verification

**Usage:**

```bash
npm run db:health             # Single check
npm run db:health:monitor     # Continuous monitoring
```

### 3. **Application Performance Check** (`perf:check`)

Monitors React app performance, bundle size, and runtime metrics.

**Features:**

- Build performance analysis
- Bundle size monitoring
- Runtime performance checks
- Memory usage tracking
- Dependency analysis

**Usage:**

```bash
npm run perf:check            # Single check
npm run perf:monitor          # Continuous monitoring
```

### 4. **Comprehensive Health Check** (`health:comprehensive`)

Integrates all health check systems into one unified monitoring solution.

**Features:**

- All-in-one health monitoring
- Unified reporting
- Critical issue detection
- Success rate calculation
- JSON export capability

**Usage:**

```bash
npm run health:comprehensive          # Single comprehensive check
npm run health:comprehensive:monitor  # Continuous comprehensive monitoring
npm run health:comprehensive:json     # JSON format output
```

## 🔧 Available Commands

### Quick Health Checks

```bash
# Basic service health
npm run health:check

# Database health only
npm run db:health

# Performance check only
npm run perf:check

# Complete health assessment
npm run health:comprehensive
```

### Continuous Monitoring

```bash
# Monitor services
npm run health:monitor

# Monitor database
npm run db:health:monitor

# Monitor performance
npm run perf:monitor

# Monitor everything
npm run health:comprehensive:monitor
```

### Specialized Checks

```bash
# Development environment check
npm run doctor

# Pre-flight checklist
npm run pre-flight

# JSON output for automation
npm run health:comprehensive:json
```

## 📊 Health Check Reports

### Service Health Report

```
🔌 Service Health:
   Status: ✅ Healthy
   Port 4000: ✅ available (15ms)
   Port 4001: ✅ available (12ms)
   Port 3000: 🔴 occupied (Vite Dev Server)
```

### Database Health Report

```
🗄️ Database Health:
   Connection: ✅ Connected (45ms)
   Version: PostgreSQL 15.4
   Schema: ✅ Complete (12 tables)
   Data: ✅ Loaded
      users: 15 records
      foods: 1,247 records
      training_sessions: 89 records
```

### Performance Health Report

```
⚡ Performance Health:
   Build Size: 2.4 MB
   Build Time: 1,247ms
   Memory Usage: 45.2 MB
   Runtime: ✅ Development server running
```

### Comprehensive Health Report

```
🏥 COMPREHENSIVE HEALTH REPORT
==============================
📅 Generated: 12/27/2024, 2:30:45 PM

📊 Overall Summary:
   Total Checks: 15
   ✅ Passed: 13
   ❌ Failed: 1
   ⚠️  Warnings: 1
   📈 Success Rate: 86.7%

🎯 Overall Status: 🟡 GOOD
   Most systems are healthy with minor issues
```

## 🚨 Critical Issues Detection

The health check system automatically detects and reports critical issues:

### Database Issues

- Connection failures
- Missing required tables
- Schema inconsistencies
- Performance problems

### Service Issues

- Port conflicts
- Service unavailability
- High response times
- Resource exhaustion

### Performance Issues

- Build failures
- Large bundle sizes
- Memory leaks
- Slow build times

## 💡 Recommendations System

The health check system provides actionable recommendations:

### Database Recommendations

- Run migrations: `npm run db:migrate`
- Seed data: `npm run db:seed`
- Check connection string
- Optimize queries

### Service Recommendations

- Clear port conflicts
- Restart services
- Check firewall settings
- Verify network connectivity

### Performance Recommendations

- Optimize bundle size
- Enable code splitting
- Update dependencies
- Monitor memory usage

## 🔄 Continuous Monitoring

### Monitoring Intervals

- **Service Health**: 30 seconds
- **Database Health**: 60 seconds
- **Performance Health**: 5 minutes
- **Comprehensive Health**: 2 minutes

### Monitoring Features

- Real-time status updates
- Trend analysis
- Alert thresholds
- Historical data tracking

## 📈 Success Metrics

### Health Score Calculation

```
Success Rate = (Passed Checks / Total Checks) × 100

Health Levels:
- 90%+ = EXCELLENT 🟢
- 70-89% = GOOD 🟡
- 50-69% = FAIR 🟠
- <50% = POOR 🔴
```

### Key Performance Indicators

- **Database Response Time**: <100ms
- **Build Time**: <2 minutes
- **Bundle Size**: <5MB
- **Memory Usage**: <100MB
- **Port Availability**: 100%

## 🛠️ Troubleshooting

### Common Issues

#### Database Connection Failed

```bash
# Check environment variables
npm run env:validate

# Test database connection
npm run db:health

# Verify DATABASE_URL format
echo $DATABASE_URL
```

#### Port Conflicts

```bash
# Check port usage
npm run port:info

# Clear port conflicts
npm run port:cleanup

# Release all ports
npm run port:release-all
```

#### Build Performance Issues

```bash
# Clear build cache
npm run clean:cache

# Reset node_modules
npm run clean:node

# Check for large dependencies
npm run perf:check
```

### Debug Commands

```bash
# Full environment check
npm run doctor

# Pre-flight validation
npm run pre-flight

# Comprehensive troubleshooting
npm run troubleshoot
```

## 🔧 Integration with CI/CD

### Automated Health Checks

```yaml
# Example GitHub Actions workflow
- name: Health Check
  run: |
    npm run health:comprehensive:json > health-report.json
    npm run db:health
    npm run perf:check
```

### Health Check API

```javascript
// Programmatic health check
import ComprehensiveHealthChecker from "./scripts/comprehensive-health-check.js";

const checker = new ComprehensiveHealthChecker();
const results = await checker.runAllChecks();
console.log(results.getOverallStatus());
```

## 📚 Best Practices

### Development Workflow

1. **Before Development**: Run `npm run health:check`
2. **During Development**: Use `npm run health:monitor`
3. **Before Committing**: Run `npm run health:comprehensive`
4. **Before Deploying**: Run `npm run pre-flight`

### Production Monitoring

1. **Regular Checks**: Schedule comprehensive health checks
2. **Alerting**: Set up alerts for critical issues
3. **Logging**: Monitor health check logs
4. **Trends**: Track health metrics over time

### Performance Optimization

1. **Bundle Analysis**: Regular bundle size monitoring
2. **Memory Profiling**: Track memory usage patterns
3. **Database Optimization**: Monitor query performance
4. **Service Optimization**: Track service response times

## 🎯 Health Check Checklist

### Daily Development

- [ ] Run `npm run health:check` before starting
- [ ] Monitor `npm run health:monitor` during development
- [ ] Check `npm run perf:check` for performance issues
- [ ] Verify `npm run db:health` for database status

### Weekly Maintenance

- [ ] Run `npm run health:comprehensive` for full assessment
- [ ] Review health check logs and trends
- [ ] Update dependencies if needed
- [ ] Optimize performance based on metrics

### Monthly Review

- [ ] Analyze health check trends
- [ ] Review and update health check thresholds
- [ ] Optimize monitoring intervals
- [ ] Update health check documentation

## 📞 Support

For health check issues or questions:

1. **Check Documentation**: Review this guide
2. **Run Troubleshooting**: `npm run troubleshoot`
3. **Check Logs**: Review health check output
4. **Contact Team**: Reach out to development team

---

**Last Updated**: 29. December 2025  
**Version**: 1.0  
**Maintained By**: Development Team
