#!/usr/bin/env node
/* eslint-disable no-console */

// Unified Diagnostic System
// Combines health checks, feature validation, and runtime diagnostics

import HealthChecker from './comprehensive-health-check.js';
import FeatureValidator from './feature-validator.js';
import fs from 'fs/promises';
import path from 'path';

class DiagnosticSystem {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      healthCheck: null,
      featureValidation: null,
      overallStatus: 'unknown',
      recommendations: [],
      criticalIssues: [],
      warnings: [],
    };
  }

  async runFullDiagnostics() {
    console.log('🔍 Starting Unified Diagnostic System...\n');
    console.log('=' .repeat(60));
    console.log('');

    try {
      // Run health check
      console.log('📋 Phase 1: Health Check');
      console.log('-'.repeat(60));
      const healthChecker = new HealthChecker();
      this.results.healthCheck = await healthChecker.runComprehensiveCheck();
      console.log('');

      // Run feature validation
      console.log('📋 Phase 2: Feature Validation');
      console.log('-'.repeat(60));
      const featureValidator = new FeatureValidator();
      this.results.featureValidation = await featureValidator.validateAll();
      console.log('');

      // Analyze combined results
      this.analyzeResults();

      // Generate comprehensive report
      await this.generateComprehensiveReport();

      // Print summary
      this.printSummary();

      return this.results;
    } catch (error) {
      console.error('❌ Diagnostic system failed:', error);
      this.results.criticalIssues.push(`Diagnostic system error: ${error.message}`);
      return this.results;
    }
  }

  analyzeResults() {
    const health = this.results.healthCheck;
    const features = this.results.featureValidation;

    // Determine overall status
    const healthScore = health?.overallHealth || 0;
    const featureScore = features?.overallScore || 0;
    const combinedScore = Math.round((healthScore + featureScore) / 2);

    if (combinedScore >= 85) {
      this.results.overallStatus = 'excellent';
    } else if (combinedScore >= 70) {
      this.results.overallStatus = 'good';
    } else if (combinedScore >= 50) {
      this.results.overallStatus = 'warning';
    } else {
      this.results.overallStatus = 'critical';
    }

    // Collect critical issues
    if (health?.criticalIssues) {
      this.results.criticalIssues.push(...health.criticalIssues.map(i => `[Health] ${i}`));
    }
    if (features?.criticalIssues) {
      this.results.criticalIssues.push(...features.criticalIssues.map(i => `[Features] ${i}`));
    }

    // Collect warnings
    if (health?.warnings) {
      this.results.warnings.push(...health.warnings.map(w => `[Health] ${w}`));
    }

    // Generate recommendations
    this.generateRecommendations(health, features);
  }

  generateRecommendations(health, features) {
    // Database recommendations
    if (health?.categories?.database?.score < 70) {
      this.results.recommendations.push('🔧 Database: Check Supabase connection and environment variables');
    }

    // API recommendations
    if (health?.categories?.api?.score < 70) {
      this.results.recommendations.push('🔧 API: Review Netlify functions and ensure error handlers are implemented');
    }

    // Security recommendations
    if (health?.categories?.security?.score < 70) {
      this.results.recommendations.push('🔒 Security: Address security vulnerabilities and review configuration');
    }

    // Test recommendations
    if (health?.categories?.tests?.score < 70) {
      this.results.recommendations.push('🧪 Testing: Improve test coverage and fix failing tests');
    }

    // Feature recommendations
    if (features?.overallScore < 70) {
      this.results.recommendations.push('✨ Features: Complete feature implementations and remove placeholder code');
    }

    // Performance recommendations
    if (health?.categories?.performance?.score < 70) {
      this.results.recommendations.push('⚡ Performance: Optimize bundle size and improve load times');
    }
  }

  async generateComprehensiveReport() {
    const reportPath = './DIAGNOSTIC_REPORT.json';
    await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2));

    // Generate markdown report
    const markdownReport = this.generateMarkdownReport();
    await fs.writeFile('./DIAGNOSTIC_REPORT.md', markdownReport);

    console.log('📊 Comprehensive diagnostic reports generated:');
    console.log(`   - JSON: ${reportPath}`);
    console.log(`   - Markdown: ./DIAGNOSTIC_REPORT.md`);
  }

  generateMarkdownReport() {
    const health = this.results.healthCheck;
    const features = this.results.featureValidation;

    let report = `# Comprehensive Diagnostic Report\n\n`;
    report += `**Generated:** ${this.results.timestamp}\n`;
    report += `**Environment:** ${this.results.environment}\n`;
    report += `**Overall Status:** ${this.getStatusIcon(this.results.overallStatus)}\n\n`;

    // Overall scores
    report += `## Overall Scores\n\n`;
    report += `- **Health Check:** ${health?.overallHealth || 0}/100\n`;
    report += `- **Feature Validation:** ${features?.overallScore || 0}/100\n`;
    report += `- **Combined Score:** ${Math.round(((health?.overallHealth || 0) + (features?.overallScore || 0)) / 2)}/100\n\n`;

    // Health Check Summary
    if (health) {
      report += `## Health Check Summary\n\n`;
      Object.entries(health.categories || {}).forEach(([category, data]) => {
        const icon = data.status === 'good' ? '✅' : data.status === 'warning' ? '⚠️' : '❌';
        report += `### ${icon} ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
        report += `**Score:** ${data.score}/100\n\n`;
        
        if (data.issues && data.issues.length > 0) {
          report += `**Issues:**\n`;
          data.issues.forEach(issue => report += `- ${issue}\n`);
          report += `\n`;
        }
      });
    }

    // Feature Validation Summary
    if (features) {
      report += `## Feature Validation Summary\n\n`;
      Object.entries(features.validationResults || {}).forEach(([category, data]) => {
        report += `### ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
        report += `**Score:** ${data.score}/100\n\n`;
        
        if (data.issues && data.issues.length > 0) {
          report += `**Issues:**\n`;
          data.issues.forEach(issue => report += `- ${issue}\n`);
          report += `\n`;
        }
      });
    }

    // Critical Issues
    if (this.results.criticalIssues.length > 0) {
      report += `## 🚨 Critical Issues\n\n`;
      this.results.criticalIssues.forEach(issue => {
        report += `- ❌ ${issue}\n`;
      });
      report += `\n`;
    }

    // Warnings
    if (this.results.warnings.length > 0) {
      report += `## ⚠️  Warnings\n\n`;
      this.results.warnings.slice(0, 10).forEach(warning => {
        report += `- ⚠️  ${warning}\n`;
      });
      report += `\n`;
    }

    // Recommendations
    if (this.results.recommendations.length > 0) {
      report += `## 💡 Recommendations\n\n`;
      this.results.recommendations.forEach(rec => {
        report += `- ${rec}\n`;
      });
    }

    return report;
  }

  getStatusIcon(status) {
    const icons = {
      excellent: '🟢 Excellent',
      good: '🟡 Good',
      warning: '🟠 Warning',
      critical: '🔴 Critical',
    };
    return icons[status] || '❓ Unknown';
  }

  printSummary() {
    console.log('');
    console.log('='.repeat(60));
    console.log('📊 DIAGNOSTIC SUMMARY');
    console.log('='.repeat(60));
    console.log('');
    console.log(`Overall Status: ${this.getStatusIcon(this.results.overallStatus)}`);
    console.log(`Health Check Score: ${this.results.healthCheck?.overallHealth || 0}/100`);
    console.log(`Feature Validation Score: ${this.results.featureValidation?.overallScore || 0}/100`);
    console.log('');

    if (this.results.criticalIssues.length > 0) {
      console.log(`🚨 Critical Issues: ${this.results.criticalIssues.length}`);
      this.results.criticalIssues.slice(0, 5).forEach(issue => {
        console.log(`   - ${issue}`);
      });
      if (this.results.criticalIssues.length > 5) {
        console.log(`   ... and ${this.results.criticalIssues.length - 5} more`);
      }
      console.log('');
    }

    if (this.results.recommendations.length > 0) {
      console.log(`💡 Top Recommendations:`);
      this.results.recommendations.slice(0, 5).forEach(rec => {
        console.log(`   - ${rec}`);
      });
      console.log('');
    }
  }
}

// Run diagnostics if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const diagnosticSystem = new DiagnosticSystem();
  diagnosticSystem.runFullDiagnostics().catch(console.error);
}

export default DiagnosticSystem;

