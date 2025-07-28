#!/usr/bin/env node

// Real Pre-Flight Checklist Script for Flag Football App
// Runs actual validation checks on the codebase

import { execSync } from 'child_process';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

class RealPreFlightChecker {
  constructor() {
    this.results = {
      summary: { total: 0, passed: 0, failed: 0, warnings: 0 },
      categories: {},
      errors: [],
      warnings: [],
      recommendations: []
    };
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : '📋';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  addCheck(category, name, passed, message, type = 'check') {
    if (!this.results.categories[category]) {
      this.results.categories[category] = { total: 0, passed: 0, failed: 0, checks: [] };
    }

    this.results.categories[category].total++;
    this.results.categories[category].checks.push({ name, passed, message, type });
    this.results.summary.total++;

    if (passed) {
      this.results.categories[category].passed++;
      this.results.summary.passed++;
    } else {
      this.results.categories[category].failed++;
      this.results.summary.failed++;
      if (type === 'warning') {
        this.results.warnings.push({ category, name, message });
        this.results.summary.warnings++;
      } else {
        this.results.errors.push({ category, name, message });
      }
    }
  }

  async runAllChecks() {
    this.log('🚁 Starting Real Pre-Flight Checklist...', 'info');
    
    try {
      await this.checkFileStructure();
      await this.checkBuildProcess();
      await this.checkDependencies();
      await this.checkSyntaxErrors();
      await this.checkImportConsistency();
      await this.checkServiceIntegration();
      await this.checkComponentIntegration();
      await this.checkSecurityIssues();
      await this.checkPerformanceMetrics();
      await this.checkMobileCompatibility();

      return this.generateReport();
    } catch (error) {
      this.log(`Critical error during pre-flight check: ${error.message}`, 'error');
      this.results.errors.push({ category: 'CRITICAL', name: 'Pre-flight Check', message: error.message });
      return this.generateReport();
    }
  }

  async checkFileStructure() {
    this.log('📁 Checking File Structure...', 'info');

    const requiredFiles = [
      'src/components/BackupManager.jsx',
      'src/components/NotificationCenter.jsx',
      'src/components/FloatingActionButton.jsx',
      'src/components/BackupErrorBoundary.jsx',
      'src/services/BackupService.js',
      'src/services/NotificationService.js',
      'public/sw.js',
      'package.json'
    ];

    for (const file of requiredFiles) {
      const filePath = join(projectRoot, file);
      const exists = existsSync(filePath);
      this.addCheck('File Structure', file, exists, 
        exists ? 'File exists' : 'File missing');
    }

    // Check directory structure
    const requiredDirs = ['src/components', 'src/services', 'src/utils', 'public'];
    for (const dir of requiredDirs) {
      const dirPath = join(projectRoot, dir);
      const exists = existsSync(dirPath);
      this.addCheck('File Structure', `${dir}/`, exists,
        exists ? 'Directory exists' : 'Directory missing');
    }
  }

  async checkBuildProcess() {
    this.log('🔨 Checking Build Process...', 'info');

    try {
      // Test build
      const buildOutput = execSync('npm run build', { 
        cwd: projectRoot, 
        encoding: 'utf8',
        timeout: 60000 
      });
      
      this.addCheck('Build Process', 'Production Build', true, 'Build completed successfully');

      // Check bundle size
      const distPath = join(projectRoot, 'dist');
      if (existsSync(distPath)) {
        const stats = this.calculateBundleSize(distPath);
        const sizeOK = stats.totalSize < 10 * 1024 * 1024; // 10MB limit
        this.addCheck('Build Process', 'Bundle Size', sizeOK,
          `Total bundle size: ${(stats.totalSize / 1024 / 1024).toFixed(2)}MB`);
      }

    } catch (error) {
      this.addCheck('Build Process', 'Production Build', false, error.message);
    }
  }

  async checkDependencies() {
    this.log('📦 Checking Dependencies...', 'info');

    try {
      // Check package.json
      const packagePath = join(projectRoot, 'package.json');
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));

      // Critical dependencies
      const criticalDeps = [
        'react',
        'react-dom',
        'react-router-dom',
        '@neondatabase/serverless',
        'zustand'
      ];

      for (const dep of criticalDeps) {
        const exists = packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep];
        this.addCheck('Dependencies', dep, !!exists,
          exists ? `Version: ${exists}` : 'Dependency missing');
      }

      // Check for security vulnerabilities
      try {
        const auditOutput = execSync('npm audit --audit-level=high', { 
          cwd: projectRoot, 
          encoding: 'utf8',
          timeout: 30000 
        });
        this.addCheck('Dependencies', 'Security Audit', true, 'No high-severity vulnerabilities');
      } catch (error) {
        const hasVulns = error.message.includes('vulnerabilities');
        this.addCheck('Dependencies', 'Security Audit', !hasVulns, 
          hasVulns ? 'Security vulnerabilities found' : 'Audit completed');
      }

    } catch (error) {
      this.addCheck('Dependencies', 'Package Analysis', false, error.message);
    }
  }

  async checkSyntaxErrors() {
    this.log('🔍 Checking Syntax Errors...', 'info');

    const jsFiles = [
      'src/components/BackupManager.jsx',
      'src/components/NotificationCenter.jsx',
      'src/components/FloatingActionButton.jsx',
      'src/services/BackupService.js',
      'src/services/NotificationService.js'
    ];

    for (const file of jsFiles) {
      try {
        const filePath = join(projectRoot, file);
        if (existsSync(filePath)) {
          const content = readFileSync(filePath, 'utf8');
          
          // Check for common syntax issues
          const issues = this.findSyntaxIssues(content, file);
          
          this.addCheck('Syntax Check', file, issues.length === 0,
            issues.length === 0 ? 'No syntax issues' : `Issues: ${issues.join(', ')}`);
        }
      } catch (error) {
        this.addCheck('Syntax Check', file, false, error.message);
      }
    }
  }

  findSyntaxIssues(content, filename) {
    const issues = [];

    // Check for 'this' in functional components
    if (filename.includes('.jsx') && content.includes('this.') && !content.includes('class ')) {
      const matches = content.match(/this\./g);
      if (matches) {
        issues.push(`${matches.length} 'this' references in functional component`);
      }
    }

    // Check for missing imports
    const importRegex = /import.*from.*['"]([^'"]+)['"]/g;
    const imports = [...content.matchAll(importRegex)].map(match => match[1]);
    
    // Check for React import in JSX files
    if (filename.includes('.jsx') && !content.includes('import React')) {
      issues.push('Missing React import in JSX file');
    }

    // Check for unused variables (basic check)
    const variableRegex = /const\s+(\w+)\s*=/g;
    const variables = [...content.matchAll(variableRegex)].map(match => match[1]);
    
    for (const variable of variables) {
      const usageCount = (content.match(new RegExp(`\\b${variable}\\b`, 'g')) || []).length;
      if (usageCount === 1) { // Only declared, never used
        issues.push(`Unused variable: ${variable}`, 'warning');
      }
    }

    return issues;
  }

  async checkImportConsistency() {
    this.log('🔗 Checking Import Consistency...', 'info');

    const files = [
      'src/components/Navigation.jsx',
      'src/views/DashboardView.jsx',
      'src/components/BackupManager.jsx',
      'src/components/NotificationCenter.jsx'
    ];

    for (const file of files) {
      try {
        const filePath = join(projectRoot, file);
        if (existsSync(filePath)) {
          const content = readFileSync(filePath, 'utf8');
          const imports = this.extractImports(content);
          const issues = this.validateImports(imports, file);
          
          this.addCheck('Import Consistency', file, issues.length === 0,
            issues.length === 0 ? 'All imports valid' : `Issues: ${issues.join(', ')}`);
        }
      } catch (error) {
        this.addCheck('Import Consistency', file, false, error.message);
      }
    }
  }

  extractImports(content) {
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    return [...content.matchAll(importRegex)].map(match => match[1]);
  }

  validateImports(imports, filename) {
    const issues = [];
    
    for (const importPath of imports) {
      // Check relative imports
      if (importPath.startsWith('./') || importPath.startsWith('../')) {
        const basePath = join(projectRoot, 'src', 'components');
        const fullPath = join(basePath, importPath);
        
        // Check common extensions
        const extensions = ['', '.js', '.jsx', '.ts', '.tsx'];
        let found = false;
        
        for (const ext of extensions) {
          if (existsSync(fullPath + ext)) {
            found = true;
            break;
          }
        }
        
        if (!found) {
          issues.push(`Import not found: ${importPath}`);
        }
      }
    }
    
    return issues;
  }

  async checkServiceIntegration() {
    this.log('⚙️ Checking Service Integration...', 'info');

    // Check BackupService
    try {
      const backupServicePath = join(projectRoot, 'src/services/BackupService.js');
      if (existsSync(backupServicePath)) {
        const content = readFileSync(backupServicePath, 'utf8');
        
        const hasRequiredMethods = [
          'createBackup',
          'restoreFromBackup',
          'listBackups',
          'deleteBackup',
          'exportBackup',
          'importBackup'
        ].every(method => content.includes(method));
        
        this.addCheck('Service Integration', 'BackupService Methods', hasRequiredMethods,
          hasRequiredMethods ? 'All required methods present' : 'Missing required methods');
        
        const hasExport = content.includes('export default');
        this.addCheck('Service Integration', 'BackupService Export', hasExport,
          hasExport ? 'Service properly exported' : 'Missing default export');
      }
    } catch (error) {
      this.addCheck('Service Integration', 'BackupService', false, error.message);
    }

    // Check NotificationService
    try {
      const notificationServicePath = join(projectRoot, 'src/services/NotificationService.js');
      if (existsSync(notificationServicePath)) {
        const content = readFileSync(notificationServicePath, 'utf8');
        
        const hasRequiredMethods = [
          'sendNotification',
          'subscribe',
          'sendEmergencyNotification',
          'getUserPreferences'
        ].every(method => content.includes(method));
        
        this.addCheck('Service Integration', 'NotificationService Methods', hasRequiredMethods,
          hasRequiredMethods ? 'All required methods present' : 'Missing required methods');
      }
    } catch (error) {
      this.addCheck('Service Integration', 'NotificationService', false, error.message);
    }
  }

  async checkComponentIntegration() {
    this.log('🧩 Checking Component Integration...', 'info');

    // Check Navigation component integration
    try {
      const navPath = join(projectRoot, 'src/components/Navigation.jsx');
      if (existsSync(navPath)) {
        const content = readFileSync(navPath, 'utf8');
        
        const hasBackupManager = content.includes('BackupManager');
        this.addCheck('Component Integration', 'BackupManager in Navigation', hasBackupManager,
          hasBackupManager ? 'BackupManager integrated' : 'BackupManager not integrated');
        
        const hasNotificationCenter = content.includes('NotificationCenter');
        this.addCheck('Component Integration', 'NotificationCenter in Navigation', hasNotificationCenter,
          hasNotificationCenter ? 'NotificationCenter integrated' : 'NotificationCenter not integrated');
      }
    } catch (error) {
      this.addCheck('Component Integration', 'Navigation', false, error.message);
    }

    // Check Dashboard integration
    try {
      const dashboardPath = join(projectRoot, 'src/views/DashboardView.jsx');
      if (existsSync(dashboardPath)) {
        const content = readFileSync(dashboardPath, 'utf8');
        
        const hasFloatingActionButton = content.includes('FloatingActionButton');
        this.addCheck('Component Integration', 'FloatingActionButton in Dashboard', hasFloatingActionButton,
          hasFloatingActionButton ? 'FloatingActionButton integrated' : 'FloatingActionButton not integrated');
      }
    } catch (error) {
      this.addCheck('Component Integration', 'Dashboard', false, error.message);
    }
  }

  async checkSecurityIssues() {
    this.log('🔒 Checking Security Issues...', 'info');

    const sensitivePatterns = [
      /password\s*[:=]\s*['"][^'"]*['"]/gi,
      /api_key\s*[:=]\s*['"][^'"]*['"]/gi,
      /secret\s*[:=]\s*['"][^'"]*['"]/gi,
      /token\s*[:=]\s*['"][^'"]*['"]/gi
    ];

    const excludeFiles = ['package.json', 'package-lock.json'];
    const jsFiles = this.getAllJSFiles(join(projectRoot, 'src'))
      .filter(file => !excludeFiles.some(exclude => file.includes(exclude)));

    let securityIssues = 0;

    for (const file of jsFiles) {
      try {
        const content = readFileSync(file, 'utf8');
        
        for (const pattern of sensitivePatterns) {
          if (pattern.test(content)) {
            securityIssues++;
            this.results.warnings.push({
              category: 'Security',
              name: file,
              message: 'Potential sensitive data in code'
            });
          }
        }
      } catch (error) {
        // File might not exist or be readable
      }
    }

    this.addCheck('Security', 'Sensitive Data Check', securityIssues === 0,
      securityIssues === 0 ? 'No sensitive data found in code' : `${securityIssues} potential issues found`);

    // Check for XSS vulnerabilities (basic)
    const xssPatterns = [
      /dangerouslySetInnerHTML/g,
      /innerHTML\s*=/g
    ];

    let xssIssues = 0;
    for (const file of jsFiles.filter(f => f.includes('.jsx'))) {
      try {
        const content = readFileSync(file, 'utf8');
        for (const pattern of xssPatterns) {
          if (pattern.test(content)) {
            xssIssues++;
          }
        }
      } catch (error) {
        // File might not exist
      }
    }

    this.addCheck('Security', 'XSS Prevention', xssIssues === 0,
      xssIssues === 0 ? 'No XSS vulnerabilities detected' : `${xssIssues} potential XSS issues`);
  }

  async checkPerformanceMetrics() {
    this.log('⚡ Checking Performance Metrics...', 'info');

    // Check bundle size
    const distPath = join(projectRoot, 'dist');
    if (existsSync(distPath)) {
      const bundleStats = this.calculateBundleSize(distPath);
      
      // Main bundle should be under 5MB
      const mainBundleOK = bundleStats.mainBundle < 5 * 1024 * 1024;
      this.addCheck('Performance', 'Main Bundle Size', mainBundleOK,
        `Main bundle: ${(bundleStats.mainBundle / 1024 / 1024).toFixed(2)}MB`);
      
      // Total should be under 10MB
      const totalSizeOK = bundleStats.totalSize < 10 * 1024 * 1024;
      this.addCheck('Performance', 'Total Bundle Size', totalSizeOK,
        `Total size: ${(bundleStats.totalSize / 1024 / 1024).toFixed(2)}MB`);
    } else {
      this.addCheck('Performance', 'Bundle Analysis', false, 'Build artifacts not found');
    }

    // Check for performance anti-patterns
    const jsFiles = this.getAllJSFiles(join(projectRoot, 'src'));
    let performanceIssues = 0;

    for (const file of jsFiles) {
      try {
        const content = readFileSync(file, 'utf8');
        
        // Check for inline functions in JSX (performance issue)
        const inlineFunctionMatches = content.match(/onClick=\{[^}]*=>[^}]*\}/g);
        if (inlineFunctionMatches && inlineFunctionMatches.length > 5) {
          performanceIssues++;
        }
        
        // Check for missing React.memo or useMemo for expensive operations
        if (content.includes('map') && content.includes('filter') && !content.includes('useMemo')) {
          performanceIssues++;
        }
      } catch (error) {
        // File might not exist
      }
    }

    this.addCheck('Performance', 'Code Optimization', performanceIssues < 3,
      performanceIssues < 3 ? 'Code is well optimized' : `${performanceIssues} optimization opportunities`);
  }

  async checkMobileCompatibility() {
    this.log('📱 Checking Mobile Compatibility...', 'info');

    // Check for responsive design classes
    const componentFiles = this.getAllJSFiles(join(projectRoot, 'src/components'));
    let responsiveComponents = 0;
    let totalComponents = 0;

    for (const file of componentFiles.filter(f => f.includes('.jsx'))) {
      try {
        const content = readFileSync(file, 'utf8');
        totalComponents++;
        
        // Check for responsive Tailwind classes
        const responsivePatterns = [
          /md:/g, /lg:/g, /xl:/g, /sm:/g,
          /flex-col/g, /grid-cols/g
        ];
        
        if (responsivePatterns.some(pattern => pattern.test(content))) {
          responsiveComponents++;
        }
      } catch (error) {
        // File might not exist
      }
    }

    const responsiveRatio = totalComponents > 0 ? responsiveComponents / totalComponents : 0;
    this.addCheck('Mobile Compatibility', 'Responsive Design', responsiveRatio > 0.7,
      `${Math.round(responsiveRatio * 100)}% of components use responsive design`);

    // Check for touch-friendly interactions
    const hasTouchOptimizations = componentFiles.some(file => {
      try {
        const content = readFileSync(file, 'utf8');
        return content.includes('touch') || content.includes('tap') || content.includes('min-h-');
      } catch {
        return false;
      }
    });

    this.addCheck('Mobile Compatibility', 'Touch Interactions', hasTouchOptimizations,
      hasTouchOptimizations ? 'Touch optimizations detected' : 'No touch optimizations found');
  }

  getAllJSFiles(dir) {
    const files = [];
    try {
      const items = execSync(`find "${dir}" -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx"`, 
        { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
      files.push(...items);
    } catch (error) {
      // Directory might not exist
    }
    return files;
  }

  calculateBundleSize(distPath) {
    const stats = { totalSize: 0, mainBundle: 0, files: [] };
    
    try {
      const items = execSync(`find "${distPath}" -type f`, { encoding: 'utf8' })
        .trim().split('\n').filter(Boolean);
      
      for (const item of items) {
        try {
          const stat = statSync(item);
          stats.totalSize += stat.size;
          
          if (item.includes('index') && (item.endsWith('.js') || item.endsWith('.css'))) {
            stats.mainBundle += stat.size;
          }
          
          stats.files.push({ path: item, size: stat.size });
        } catch (error) {
          // File might not exist
        }
      }
    } catch (error) {
      // Directory might not exist
    }
    
    return stats;
  }

  generateReport() {
    const duration = Date.now() - this.startTime;
    const successRate = this.results.summary.total > 0 
      ? Math.round((this.results.summary.passed / this.results.summary.total) * 100)
      : 0;

    const status = this.results.summary.failed === 0 
      ? 'READY' 
      : this.results.summary.failed <= 3 
      ? 'READY_WITH_WARNINGS' 
      : 'NOT_READY';

    const report = {
      ...this.results,
      summary: {
        ...this.results.summary,
        successRate,
        duration: `${duration}ms`,
        status
      },
      recommendations: this.generateRecommendations()
    };

    this.log(`\n📊 Pre-Flight Checklist Complete`, 'success');
    this.log(`📈 Summary: ${this.results.summary.passed}/${this.results.summary.total} checks passed (${successRate}%)`, 'info');
    this.log(`🚦 Status: ${status}`, status === 'READY' ? 'success' : status === 'READY_WITH_WARNINGS' ? 'warning' : 'error');
    
    if (this.results.errors.length > 0) {
      this.log(`\n❌ Critical Issues (${this.results.errors.length}):`, 'error');
      this.results.errors.forEach(error => {
        this.log(`  • ${error.category}: ${error.message}`, 'error');
      });
    }

    if (this.results.warnings.length > 0) {
      this.log(`\n⚠️ Warnings (${this.results.warnings.length}):`, 'warning');
      this.results.warnings.forEach(warning => {
        this.log(`  • ${warning.category}: ${warning.message}`, 'warning');
      });
    }

    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.results.summary.failed > 0) {
      recommendations.push('🔴 Fix all critical issues before database integration');
    }
    
    if (this.results.summary.warnings > 0) {
      recommendations.push('🟡 Address warnings to improve reliability');
    }
    
    if (this.results.summary.successRate < 80) {
      recommendations.push('📈 Improve test coverage and code quality');
    }
    
    recommendations.push('🧪 Run comprehensive testing in development environment');
    recommendations.push('📱 Test on multiple devices and browsers');
    recommendations.push('🔍 Monitor performance during database integration');
    recommendations.push('🔒 Review security configurations');
    recommendations.push('📊 Set up monitoring and logging');
    
    return recommendations;
  }
}

// Run the checker if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const checker = new RealPreFlightChecker();
  checker.runAllChecks()
    .then(report => {
      process.exit(report.summary.status === 'NOT_READY' ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ Pre-flight check failed:', error);
      process.exit(1);
    });
}

export default RealPreFlightChecker;