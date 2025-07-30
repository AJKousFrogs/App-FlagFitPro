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
  
  // Check important environment variables
  const importantVars = ['NODE_ENV', 'VITE_DEV_PORT'];
  importantVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName} is set`);
    } else {
      console.log(`ℹ️  ${varName} not set (using defaults)`);
    }
  });
  
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

// Main execution
async function runChecks() {
  console.log('Running comprehensive development environment check...\n');
  
  checkNodeVersion();
  checkProjectLocation();
  checkFilePermissions();
  checkDependencies();
  checkEnvironmentVariables();
  checkPorts();
  
  setTimeout(() => {
    performanceRecommendations();
    
    console.log('🎉 Environment check complete!');
    console.log('\nQuick Start Commands:');
    console.log('   npm run dev           - Start development server');
    console.log('   npm run dev:polling   - Start with file polling (for cloud folders)');
    console.log('   npm run dev:fresh     - Clean cache and start development');
    console.log('   npm run check:env     - Run this check again');
    console.log('\nFor more help, see: DEVELOPMENT.md');
  }, 200);
}

// Run the checks
runChecks().catch(console.error);