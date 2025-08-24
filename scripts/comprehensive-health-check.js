#!/usr/bin/env node

/**
 * Comprehensive Health Check System
 * Integrates all health check systems into one unified monitoring solution
 */

import HealthChecker from './health-check-enhanced.js';
import DatabaseHealthChecker from './database-health-check.js';
import AppPerformanceChecker from './app-performance-check.js';
import { performance } from 'perf_hooks';

class ComprehensiveHealthChecker {
  constructor() {
    this.healthChecker = new HealthChecker();
    this.dbChecker = new DatabaseHealthChecker();
    this.perfChecker = new AppPerformanceChecker();
    this.results = {
      summary: { total: 0, passed: 0, failed: 0, warnings: 0 },
      services: {},
      database: {},
      performance: {},
      recommendations: [],
      timestamp: new Date().toISOString()
    };
  }

  async runAllChecks() {
    console.log('🏥 Comprehensive Health Check Starting...\n');
    const startTime = performance.now();
    
    try {
      // Run all health checks in parallel
      const [serviceResults, dbResults, perfResults] = await Promise.allSettled([
        this.healthChecker.runHealthCheck(),
        this.dbChecker.runAllChecks(),
        this.perfChecker.runAllChecks()
      ]);

      // Process service health results
      if (serviceResults.status === 'fulfilled') {
        this.results.services = serviceResults.value;
        this.analyzeServiceHealth(serviceResults.value);
      } else {
        console.log('❌ Service health check failed:', serviceResults.reason);
      }

      // Process database health results
      if (dbResults.status === 'fulfilled') {
        this.results.database = dbResults.value;
        this.analyzeDatabaseHealth(dbResults.value);
      } else {
        console.log('❌ Database health check failed:', dbResults.reason);
      }

      // Process performance results
      if (perfResults.status === 'fulfilled') {
        this.results.performance = perfResults.value;
        this.analyzePerformanceHealth(perfResults.value);
      } else {
        console.log('❌ Performance check failed:', perfResults.reason);
      }

      // Generate comprehensive report
      this.generateComprehensiveReport();
      
      const totalTime = performance.now() - startTime;
      console.log(`\n⏱️  Total check time: ${totalTime.toFixed(0)}ms`);
      
      return this.results;

    } catch (error) {
      console.error('❌ Comprehensive health check failed:', error);
      return this.results;
    }
  }

  analyzeServiceHealth(serviceResults) {
    let totalPorts = 0;
    let availablePorts = 0;
    let activePorts = 0;

    for (const checks of Object.values(serviceResults)) {
      totalPorts += checks.length;
      checks.forEach(result => {
        if (result.available) {
          availablePorts++;
        } else {
          activePorts++;
        }
      });
    }

    this.results.summary.total += totalPorts;
    this.results.summary.passed += availablePorts;
    this.results.summary.failed += activePorts;

    if (activePorts > 0) {
      this.results.recommendations.push('Some ports are occupied - check for conflicts');
    }
  }

  analyzeDatabaseHealth(dbResults) {
    const conn = dbResults.connectivity.status;
    const schema = dbResults.schema.status;
    const data = dbResults.data.status;

    if (conn === 'connected') {
      this.results.summary.passed += 1;
    } else {
      this.results.summary.failed += 1;
      this.results.recommendations.push('Database connection failed - check DATABASE_URL');
    }

    if (schema === 'complete') {
      this.results.summary.passed += 1;
    } else if (schema === 'incomplete') {
      this.results.summary.warnings += 1;
      this.results.recommendations.push('Database schema incomplete - run migrations');
    } else {
      this.results.summary.failed += 1;
    }

    if (data === 'checked') {
      this.results.summary.passed += 1;
    } else {
      this.results.summary.failed += 1;
    }

    // Add database-specific recommendations
    if (dbResults.recommendations) {
      this.results.recommendations.push(...dbResults.recommendations);
    }
  }

  analyzePerformanceHealth(perfResults) {
    const build = perfResults.build.status;
    const bundle = perfResults.bundle.status;
    const runtime = perfResults.runtime.status;
    const memory = perfResults.memory.status;

    if (build !== 'error') {
      this.results.summary.passed += 1;
    } else {
      this.results.summary.failed += 1;
      this.results.recommendations.push('Build process has issues');
    }

    if (bundle === 'analyzed') {
      this.results.summary.passed += 1;
    } else {
      this.results.summary.warnings += 1;
    }

    if (runtime === 'running') {
      this.results.summary.passed += 1;
    } else {
      this.results.summary.warnings += 1;
    }

    if (memory === 'checked') {
      this.results.summary.passed += 1;
    } else {
      this.results.summary.failed += 1;
    }

    // Add performance-specific recommendations
    if (perfResults.recommendations) {
      this.results.recommendations.push(...perfResults.recommendations);
    }
  }

  generateComprehensiveReport() {
    console.log('\n🏥 COMPREHENSIVE HEALTH REPORT');
    console.log('==============================');
    console.log(`📅 Generated: ${new Date().toLocaleString()}`);
    
    // Summary
    const summary = this.results.summary;
    const totalChecks = summary.total + summary.passed + summary.failed + summary.warnings;
    const successRate = totalChecks > 0 ? ((summary.passed / totalChecks) * 100).toFixed(1) : 0;
    
    console.log(`\n📊 Overall Summary:`);
    console.log(`   Total Checks: ${totalChecks}`);
    console.log(`   ✅ Passed: ${summary.passed}`);
    console.log(`   ❌ Failed: ${summary.failed}`);
    console.log(`   ⚠️  Warnings: ${summary.warnings}`);
    console.log(`   📈 Success Rate: ${successRate}%`);

    // Service Health
    if (this.results.services) {
      console.log(`\n🔌 Service Health:`);
      let serviceStatus = '✅ Healthy';
      if (summary.failed > 0) {
        serviceStatus = '❌ Issues Detected';
      } else if (summary.warnings > 0) {
        serviceStatus = '⚠️  Warnings';
      }
      console.log(`   Status: ${serviceStatus}`);
    }

    // Database Health
    if (this.results.database) {
      const db = this.results.database;
      console.log(`\n🗄️  Database Health:`);
      
      if (db.connectivity?.status === 'connected') {
        console.log(`   Connection: ✅ Connected (${db.connectivity.responseTime}ms)`);
        console.log(`   Version: ${db.connectivity.version || 'Unknown'}`);
      } else {
        console.log(`   Connection: ❌ Failed`);
      }

      if (db.schema?.status === 'complete') {
        console.log(`   Schema: ✅ Complete (${db.schema.tables?.length || 0} tables)`);
      } else if (db.schema?.status === 'incomplete') {
        console.log(`   Schema: ⚠️  Incomplete (missing: ${db.schema.missing?.join(', ')})`);
      } else {
        console.log(`   Schema: ❌ Error`);
      }

      if (db.data?.counts) {
        console.log(`   Data: ✅ Loaded`);
        Object.entries(db.data.counts).forEach(([table, count]) => {
          console.log(`      ${table}: ${count} records`);
        });
      }
    }

    // Performance Health
    if (this.results.performance) {
      const perf = this.results.performance;
      console.log(`\n⚡ Performance Health:`);
      
      if (perf.build?.size?.totalSize) {
        console.log(`   Build Size: ${perf.build.size.totalSize}`);
        console.log(`   Build Time: ${perf.build.time || 'Unknown'}ms`);
      }

      if (perf.memory?.usage?.rss) {
        console.log(`   Memory Usage: ${perf.memory.usage.rss}`);
      }

      if (perf.runtime?.status === 'running') {
        console.log(`   Runtime: ✅ Development server running`);
      } else {
        console.log(`   Runtime: ⚠️  Development server not running`);
      }
    }

    // Critical Issues
    const criticalIssues = this.getCriticalIssues();
    if (criticalIssues.length > 0) {
      console.log(`\n🚨 Critical Issues:`);
      criticalIssues.forEach(issue => {
        console.log(`   • ${issue}`);
      });
    }

    // Recommendations
    if (this.results.recommendations.length > 0) {
      console.log(`\n💡 Recommendations:`);
      this.results.recommendations.forEach(rec => {
        console.log(`   • ${rec}`);
      });
    }

    // Overall Status
    const overallStatus = this.getOverallStatus();
    console.log(`\n🎯 Overall Status: ${overallStatus.icon} ${overallStatus.status}`);
    console.log(`   ${overallStatus.description}`);

    // Quick Actions
    console.log(`\n🚀 Quick Actions:`);
    console.log(`   npm run health:check     - Run service health check`);
    console.log(`   npm run db:health        - Run database health check`);
    console.log(`   npm run perf:check       - Run performance check`);
    console.log(`   npm run health:monitor   - Start continuous monitoring`);
  }

  getCriticalIssues() {
    const issues = [];
    
    // Database connection issues
    if (this.results.database?.connectivity?.status !== 'connected') {
      issues.push('Database connection failed');
    }
    
    // Build issues
    if (this.results.performance?.build?.status === 'error') {
      issues.push('Application build failed');
    }
    
    // Service conflicts
    if (this.results.summary.failed > 0) {
      issues.push(`${this.results.summary.failed} service checks failed`);
    }
    
    return issues;
  }

  getOverallStatus() {
    const summary = this.results.summary;
    const totalChecks = summary.total + summary.passed + summary.failed + summary.warnings;
    const successRate = totalChecks > 0 ? (summary.passed / totalChecks) : 0;
    
    if (successRate >= 0.9) {
      return {
        status: 'EXCELLENT',
        icon: '🟢',
        description: 'All systems are healthy and performing well'
      };
    } else if (successRate >= 0.7) {
      return {
        status: 'GOOD',
        icon: '🟡',
        description: 'Most systems are healthy with minor issues'
      };
    } else if (successRate >= 0.5) {
      return {
        status: 'FAIR',
        icon: '🟠',
        description: 'Some systems have issues that need attention'
      };
    } else {
      return {
        status: 'POOR',
        icon: '🔴',
        description: 'Multiple critical issues detected'
      };
    }
  }

  async monitorMode() {
    console.log('🔄 Starting comprehensive health monitoring (Ctrl+C to stop)...\n');
    
    const monitor = async () => {
      console.clear();
      console.log(`🏈 Comprehensive Health Monitor - ${new Date().toLocaleTimeString()}\n`);
      await this.runAllChecks();
    };
    
    // Initial check
    await monitor();
    
    // Check every 2 minutes
    const interval = setInterval(monitor, 120000);
    
    process.on('SIGINT', () => {
      clearInterval(interval);
      console.log('\n👋 Comprehensive monitoring stopped');
      process.exit(0);
    });
  }

  generateJSONReport() {
    return {
      timestamp: this.results.timestamp,
      summary: this.results.summary,
      services: this.results.services,
      database: this.results.database,
      performance: this.results.performance,
      recommendations: this.results.recommendations,
      criticalIssues: this.getCriticalIssues(),
      overallStatus: this.getOverallStatus()
    };
  }
}

// CLI interface
async function main() {
  const [,, command, ...args] = process.argv;
  const checker = new ComprehensiveHealthChecker();
  
  switch (command) {
    case 'monitor':
      await checker.monitorMode();
      break;
      
    case 'json':
      await checker.runAllChecks();
      console.log(JSON.stringify(checker.generateJSONReport(), null, 2));
      break;
      
    case 'check':
    default:
      await checker.runAllChecks();
      break;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default ComprehensiveHealthChecker; 