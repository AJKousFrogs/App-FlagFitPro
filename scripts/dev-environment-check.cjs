#!/usr/bin/env node

/**
 * Development Environment Check
 * Validates development setup and provides recommendations
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🔍 Development Environment Check\n');

// Check Node.js version
function checkNodeVersion() {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  console.log(`📦 Node.js Version: ${nodeVersion}`);
  
  if (majorVersion >= 18) {
    console.log('✅ Node.js version is compatible');
  } else {
    console.log('❌ Node.js version should be 18 or higher');
    console.log('   Run: nvm install 18 && nvm use 18');
  }
  console.log();
}

// Check project location
function checkProjectLocation() {
  const projectPath = process.cwd();
  console.log(`📁 Project Location: ${projectPath}`);
  
  const cloudFolders = [
    'OneDrive', 'Dropbox', 'Google Drive', 'iCloud Drive', 
    'Box Sync', 'pCloud Drive', 'Mega', 'Amazon Drive'
  ];
  
  const isInCloudFolder = cloudFolders.some(folder => 
    projectPath.toLowerCase().includes(folder.toLowerCase())
  );
  
  if (isInCloudFolder) {
    console.log('⚠️  WARNING: Project appears to be in a cloud-synced folder!');
    console.log('   This can cause file watching and HMR issues.');
    console.log('   Consider moving to: ~/dev/projects/ or C:\\dev\\projects\\');
  } else {
    console.log('✅ Project location looks good');
  }
  console.log();
}

// Check file permissions
function checkFilePermissions() {
  console.log('🔐 File Permissions:');
  
  try {
    // Check read access
    fs.accessSync('.', fs.constants.R_OK);
    console.log('✅ Read permissions OK');
    
    // Check write access
    fs.accessSync('.', fs.constants.W_OK);
    console.log('✅ Write permissions OK');
    
    // Test file creation
    const testFile = path.join(process.cwd(), '.dev-test-file');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    console.log('✅ File creation/deletion OK');
    
  } catch (error) {
    console.log('❌ File permission issues detected');
    console.log(`   Error: ${error.message}`);
    
    if (os.platform() === 'win32') {
      console.log('   Try running terminal as Administrator');
    } else {
      console.log('   Try: chmod -R 755 .');
    }
  }
  console.log();
}

// Check available ports
function checkPorts() {
  console.log('🔌 Port Availability:');
  
  const net = require('net');
  const ports = [4000, 4001, 4002, 3000, 3001];
  
  ports.forEach(port => {
    const server = net.createServer();
    
    server.listen(port, () => {
      console.log(`✅ Port ${port} is available`);
      server.close();
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`⚠️  Port ${port} is in use`);
      }
    });
  });
  
  setTimeout(() => {
    console.log();
    checkDiskSpace();
  }, 100);
}

// Check disk space
function checkDiskSpace() {
  console.log('💾 Disk Space:');
  
  try {
    const stats = fs.statSync('.');
    console.log('✅ Project directory accessible');
    
    // Try to get disk usage info
    if (os.platform() !== 'win32') {
      const { execSync } = require('child_process');
      try {
        const dfOutput = execSync('df -h .', { encoding: 'utf8' });
        const lines = dfOutput.trim().split('\n');
        if (lines.length > 1) {
          const diskInfo = lines[1].split(/\s+/);
          console.log(`   Available: ${diskInfo[3] || 'Unknown'}`);
        }
      } catch (e) {
        console.log('   Unable to determine disk space');
      }
    }
  } catch (error) {
    console.log('❌ Cannot access project directory');
  }
  console.log();
}

// Check development dependencies
function checkDependencies() {
  console.log('📚 Dependencies:');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Check if node_modules exists
    if (fs.existsSync('node_modules')) {
      console.log('✅ node_modules directory exists');
      
      // Check if key dependencies are installed
      const keyDeps = ['react', 'vite', '@vitejs/plugin-react'];
      const missingDeps = keyDeps.filter(dep => 
        !fs.existsSync(path.join('node_modules', dep))
      );
      
      if (missingDeps.length === 0) {
        console.log('✅ Key dependencies are installed');
      } else {
        console.log('⚠️  Missing dependencies:', missingDeps.join(', '));
        console.log('   Run: npm install');
      }
    } else {
      console.log('❌ node_modules directory missing');
      console.log('   Run: npm install');
    }
    
  } catch (error) {
    console.log('❌ Cannot read package.json');
  }
  console.log();
}

// Check environment variables
function checkEnvironmentVariables() {
  console.log('🌍 Environment Variables:');
  
  const envFile = '.env';
  const envExampleFile = '.env.example';
  
  if (fs.existsSync(envExampleFile)) {
    console.log('✅ .env.example file exists');
    
    if (fs.existsSync(envFile)) {
      console.log('✅ .env file exists');
    } else {
      console.log('⚠️  .env file missing');
      console.log('   Consider copying: cp .env.example .env');
    }
  } else {
    console.log('ℹ️  No .env.example file found');
  }
  
  // Check critical environment variables
  const criticalVars = [
    { name: 'VITE_NEON_DATABASE_URL', required: true, description: 'Database connection' },
    { name: 'CONTEXT7_API_KEY', required: true, description: 'AI research features' }
  ];
  
  const importantVars = [
    { name: 'VITE_DEV_PORT', required: false, description: 'Development server port' },
    { name: 'VITE_APP_NAME', required: false, description: 'Application name' },
    { name: 'VITE_ENABLE_MCP', required: false, description: 'MCP services' }
  ];
  
  // Check critical variables
  console.log('🔴 Critical Variables:');
  criticalVars.forEach(variable => {
    if (process.env[variable.name]) {
      if (process.env[variable.name].includes('your_') || process.env[variable.name].includes('_here')) {
        console.log(`⚠️  ${variable.name} needs real value (${variable.description})`);
      } else {
        console.log(`✅ ${variable.name} configured`);
      }
    } else {
      console.log(`❌ ${variable.name} missing (${variable.description})`);
      console.log(`   Required for: ${variable.description}`);
    }
  });
  
  // Check important variables
  console.log('🟡 Optional Variables:');
  importantVars.forEach(variable => {
    if (process.env[variable.name]) {
      console.log(`✅ ${variable.name} is set`);
    } else {
      console.log(`ℹ️  ${variable.name} not set (${variable.description})`);
    }
  });
  
  console.log();
}

// Check security configuration
function checkSecurity() {
  console.log('🔒 Security Check:');
  
  // Check if .env is in .gitignore
  try {
    const gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
    if (gitignoreContent.includes('.env')) {
      console.log('✅ .env files properly excluded from git');
    } else {
      console.log('❌ .env not found in .gitignore - SECURITY RISK!');
      console.log('   Add ".env" to .gitignore immediately');
    }
  } catch (error) {
    console.log('⚠️  .gitignore file not found');
    console.log('   Create .gitignore and add .env to it');
  }
  
  // Check if .env file is accidentally staged
  try {
    const { execSync } = require('child_process');
    const gitStatus = execSync('git status --porcelain 2>/dev/null || echo "not-git"', { encoding: 'utf8' });
    
    if (gitStatus !== 'not-git' && gitStatus.includes('.env')) {
      console.log('🚨 CRITICAL: .env file is staged for commit!');
      console.log('   Run: git reset .env');
      console.log('   Then add .env to .gitignore');
    } else if (gitStatus !== 'not-git') {
      console.log('✅ No .env files staged for commit');
    }
  } catch (error) {
    // Git not available or not a git repo
    console.log('ℹ️  Git status check skipped');
  }
  
  // Check for hardcoded secrets in common files
  const sensitivePatterns = [
    'password=',
    'secret=', 
    'api_key=',
    'token=',
    'sk-', // OpenAI API keys
    'postgresql://'
  ];
  
  const filesToCheck = ['src/main.jsx', 'src/App.jsx', 'vite.config.js'];
  let secretsFound = false;
  
  filesToCheck.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8').toLowerCase();
      sensitivePatterns.forEach(pattern => {
        if (content.includes(pattern)) {
          console.log(`⚠️  Potential secret in ${file}: ${pattern}`);
          secretsFound = true;
        }
      });
    }
  });
  
  if (!secretsFound) {
    console.log('✅ No obvious secrets found in source code');
  }
  
  console.log();
}

// Performance recommendations
function performanceRecommendations() {
  console.log('⚡ Performance Recommendations:');
  
  const platform = os.platform();
  const totalMem = Math.round(os.totalmem() / 1024 / 1024 / 1024);
  
  console.log(`   Platform: ${platform}`);
  console.log(`   Total RAM: ${totalMem}GB`);
  
  if (totalMem < 8) {
    console.log('⚠️  Consider upgrading RAM for better development experience');
  }
  
  // Platform-specific recommendations
  if (platform === 'win32') {
    console.log('💡 Windows Tips:');
    console.log('   - Exclude project folder from Windows Defender');
    console.log('   - Use Windows Terminal for better performance');
    console.log('   - Consider using WSL2 for Node.js development');
  } else if (platform === 'darwin') {
    console.log('💡 macOS Tips:');
    console.log('   - Use local storage (not iCloud Drive)');
    console.log('   - Keep Activity Monitor open to watch resources');
  } else {
    console.log('💡 Linux Tips:');
    console.log('   - Monitor with: top or htop');
    console.log('   - Use local filesystem (not network mounts)');
  }
  
  console.log();
}

// Troubleshooting recommendations
function troubleshootingRecommendations() {
  console.log('🚨 Quick Troubleshooting Commands:');
  console.log('   npm run troubleshoot  - Quick fix (cache + restart)');
  console.log('   npm run debug         - Deep clean (node_modules reset)');
  console.log('   npm run clean:full    - Nuclear option (complete reset)');
  console.log('   npm run dev:polling   - Force file polling mode');
  console.log('   npm run doctor        - Run this check again');
  console.log();
  console.log('📚 Documentation:');
  console.log('   DEVELOPMENT.md        - Complete development guide');
  console.log('   TROUBLESHOOTING.md    - Quick reference card');
  console.log('   .env.example          - Environment variable examples');
  console.log();
}

// Main execution
async function runChecks() {
  console.log('Running comprehensive development environment check...\n');
  
  checkNodeVersion();
  checkProjectLocation();
  checkFilePermissions();
  checkDependencies();
  checkEnvironmentVariables();
  checkSecurity();
  checkPorts();
  
  setTimeout(() => {
    performanceRecommendations();
    troubleshootingRecommendations();
    
    console.log('🎉 Environment check complete!');
    console.log('\n🚀 Quick Start Commands:');
    console.log('   npm run dev           - Start development server');
    console.log('   npm run dev:polling   - Start with file polling (for cloud folders)');
    console.log('   npm run dev:fresh     - Clean cache and start development');
    console.log('   npm run troubleshoot  - Quick fix for common issues');
    console.log('\n💡 Need help? See: DEVELOPMENT.md & TROUBLESHOOTING.md');
  }, 200);
}

// Run the checks
runChecks().catch(console.error);