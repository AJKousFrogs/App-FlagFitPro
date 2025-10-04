#!/usr/bin/env node

// Deployment Readiness Check Script
// Verifies all components are ready for Netlify deployment

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, statSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

class DeploymentChecker {
  constructor() {
    this.checks = [];
    this.warnings = [];
    this.errors = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📋',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    }[type] || '📋';
    
    console.log(`${prefix} ${message}`);
    
    if (type === 'warning') this.warnings.push(message);
    if (type === 'error') this.errors.push(message);
  }

  checkFileExists(filePath, description) {
    const fullPath = join(projectRoot, filePath);
    if (existsSync(fullPath)) {
      this.log(`${description} exists`, 'success');
      return true;
    } else {
      this.log(`${description} missing: ${filePath}`, 'error');
      return false;
    }
  }

  checkDirectoryExists(dirPath, description) {
    const fullPath = join(projectRoot, dirPath);
    if (existsSync(fullPath) && statSync(fullPath).isDirectory()) {
      this.log(`${description} directory exists`, 'success');
      return true;
    } else {
      this.log(`${description} directory missing: ${dirPath}`, 'error');
      return false;
    }
  }

  async checkRequiredFiles() {
    this.log('\n🔍 Checking required files...');
    
    const requiredFiles = [
      ['package.json', 'Package configuration'],
      ['server.js', 'Main server file'],
      ['netlify.toml', 'Netlify configuration'],
      ['index.html', 'Main HTML file'],
      ['login.html', 'Login page'],
      ['analytics-dashboard.html', 'Analytics dashboard'],
      ['config/database.js', 'Database configuration'],
      ['src/api-config.js', 'API configuration'],
      ['deploy-guide.md', 'Deployment guide']
    ];

    let allFilesExist = true;
    for (const [file, description] of requiredFiles) {
      if (!this.checkFileExists(file, description)) {
        allFilesExist = false;
      }
    }

    return allFilesExist;
  }

  async checkDirectories() {
    this.log('\n📁 Checking required directories...');
    
    const requiredDirs = [
      ['routes', 'API routes'],
      ['scripts', 'Utility scripts'],
      ['src', 'Source files'],
      ['database', 'Database files'],
      ['Wireframes clean', 'Wireframes']
    ];

    let allDirsExist = true;
    for (const [dir, description] of requiredDirs) {
      if (!this.checkDirectoryExists(dir, description)) {
        allDirsExist = false;
      }
    }

    return allDirsExist;
  }

  async checkApiRoutes() {
    this.log('\n🛣️ Checking API routes...');
    
    const routeFiles = [
      ['routes/algorithmRoutes.js', 'Algorithm routes'],
      ['routes/analyticsRoutes.js', 'Analytics routes'],
      ['routes/dashboardRoutes.js', 'Dashboard routes'],
      ['routes/coachRoutes.js', 'Coach routes'],
      ['routes/communityRoutes.js', 'Community routes'],
      ['routes/tournamentRoutes.js', 'Tournament routes']
    ];

    let allRoutesExist = true;
    for (const [file, description] of routeFiles) {
      if (!this.checkFileExists(file, description)) {
        allRoutesExist = false;
      }
    }

    return allRoutesExist;
  }

  async checkWireframes() {
    this.log('\n🎨 Checking wireframes...');
    
    const wireframeFiles = [
      ['Wireframes clean/dashboard-complete-wireframe.html', 'Dashboard wireframe'],
      ['Wireframes clean/coach-dashboard-wireframe.html', 'Coach dashboard wireframe'],
      ['Wireframes clean/community-complete-wireframe.html', 'Community wireframe'],
      ['Wireframes clean/tournament-complete-wireframe.html', 'Tournament wireframe'],
      ['Wireframes clean/training-complete-wireframe.html', 'Training wireframe']
    ];

    let wireframeCount = 0;
    for (const [file, description] of wireframeFiles) {
      if (this.checkFileExists(file, description)) {
        wireframeCount++;
      }
    }

    if (wireframeCount >= 3) {
      this.log(`${wireframeCount} wireframes available`, 'success');
      return true;
    } else {
      this.log(`Only ${wireframeCount} wireframes found, need at least 3`, 'warning');
      return false;
    }
  }

  async checkPackageJson() {
    this.log('\n📦 Checking package.json configuration...');
    
    try {
      const packagePath = join(projectRoot, 'package.json');
      if (!existsSync(packagePath)) {
        this.log('package.json not found', 'error');
        return false;
      }

      const packageJson = JSON.parse(await import('fs').then(fs => 
        fs.readFileSync(packagePath, 'utf8')
      ));

      // Check scripts
      const requiredScripts = ['start', 'build'];
      for (const script of requiredScripts) {
        if (packageJson.scripts && packageJson.scripts[script]) {
          this.log(`Script "${script}" defined`, 'success');
        } else {
          this.log(`Script "${script}" missing`, 'error');
        }
      }

      // Check dependencies
      const requiredDeps = ['express', 'cors', 'dotenv'];
      for (const dep of requiredDeps) {
        if (packageJson.dependencies && packageJson.dependencies[dep]) {
          this.log(`Dependency "${dep}" present`, 'success');
        } else {
          this.log(`Dependency "${dep}" missing`, 'warning');
        }
      }

      return true;
    } catch (error) {
      this.log(`Error reading package.json: ${error.message}`, 'error');
      return false;
    }
  }

  async checkNetlifyConfig() {
    this.log('\n🌐 Checking Netlify configuration...');
    
    const configPath = join(projectRoot, 'netlify.toml');
    if (!existsSync(configPath)) {
      this.log('netlify.toml not found', 'error');
      return false;
    }

    try {
      const configContent = await import('fs').then(fs => 
        fs.readFileSync(configPath, 'utf8')
      );

      // Check for required sections
      const requiredSections = ['[build]', '[[redirects]]', '[[headers]]'];
      for (const section of requiredSections) {
        if (configContent.includes(section)) {
          this.log(`Netlify config section ${section} present`, 'success');
        } else {
          this.log(`Netlify config section ${section} missing`, 'warning');
        }
      }

      return true;
    } catch (error) {
      this.log(`Error reading netlify.toml: ${error.message}`, 'error');
      return false;
    }
  }

  async generateSummary() {
    this.log('\n📊 Deployment Readiness Summary\n');
    
    if (this.errors.length === 0) {
      this.log('🎉 All critical checks passed! Ready for deployment.', 'success');
    } else {
      this.log(`❌ ${this.errors.length} critical issues found:`, 'error');
      this.errors.forEach(error => this.log(`  • ${error}`, 'error'));
    }

    if (this.warnings.length > 0) {
      this.log(`\n⚠️ ${this.warnings.length} warnings:`, 'warning');
      this.warnings.forEach(warning => this.log(`  • ${warning}`, 'warning'));
    }

    this.log('\n📋 Deployment Checklist:');
    this.log('  1. ✅ Deploy backend to Heroku/Railway/DigitalOcean');
    this.log('  2. ✅ Update API_BASE_URL in src/api-config.js');
    this.log('  3. ✅ Set environment variables in Netlify');
    this.log('  4. ✅ Run: netlify deploy --prod');
    this.log('  5. ✅ Test all features after deployment');

    return this.errors.length === 0;
  }

  async runAllChecks() {
    this.log('🚀 FlagFit Pro - Deployment Readiness Check\n');
    
    const results = await Promise.all([
      this.checkRequiredFiles(),
      this.checkDirectories(),
      this.checkApiRoutes(),
      this.checkWireframes(),
      this.checkPackageJson(),
      this.checkNetlifyConfig()
    ]);

    const allPassed = await this.generateSummary();
    
    return allPassed;
  }
}

// Run deployment check if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const checker = new DeploymentChecker();
  checker.runAllChecks()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Deployment check failed:', error);
      process.exit(1);
    });
}

export default DeploymentChecker;