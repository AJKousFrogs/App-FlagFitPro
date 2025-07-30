#!/usr/bin/env node

/**
 * Development server with robust port management
 * Prevents port conflicts and ensures clean shutdowns
 */

import { spawn } from 'child_process';
import PortManager from './port-manager.js';

async function startDevelopmentServer() {
  const portManager = new PortManager();
  
  console.log('🚀 Starting Flag Football App with port management...\n');
  
  try {
    // Clean up any stale port locks first
    await portManager.cleanup();
    
    // Allocate ports for development
    const devPort = await portManager.allocatePort('dev');
    const hmrPort = devPort; // Use same port for HMR
    
    // Set environment variables for Vite
    process.env.VITE_DEV_PORT = devPort.toString();
    process.env.VITE_HMR_PORT = hmrPort.toString();
    
    console.log(`📡 Starting development server on http://localhost:${devPort}`);
    console.log(`🔥 Hot module reload on port ${hmrPort}\n`);
    
    // Start Vite development server
    const viteProcess = spawn('npx', ['vite'], {
      stdio: 'inherit',
      env: { ...process.env },
      shell: process.platform === 'win32'
    });
    
    // Handle graceful shutdown
    const shutdown = () => {
      console.log('\n🛑 Shutting down development server...');
      portManager.releasePort('dev');
      
      if (viteProcess.pid) {
        viteProcess.kill('SIGTERM');
      }
      
      process.exit(0);
    };
    
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    
    // Handle Vite process events
    viteProcess.on('error', (error) => {
      console.error('❌ Failed to start Vite:', error.message);
      portManager.releasePort('dev');
      process.exit(1);
    });
    
    viteProcess.on('exit', (code) => {
      console.log(`\n📴 Vite process exited with code ${code}`);
      portManager.releasePort('dev');
      process.exit(code || 0);
    });
    
  } catch (error) {
    console.error('❌ Error starting development server:', error.message);
    console.log('\n💡 Try running: npm run port:cleanup');
    process.exit(1);
  }
}

// Show helpful info
console.log(`
🏈 Flag Football App - Development Server
=========================================

Port Management Commands:
• npm run port:info      - Show current port allocations
• npm run port:cleanup   - Clean stale port locks  
• npm run port:release-all - Release all ports
• npm run dev:unsafe     - Start without port management

`);

startDevelopmentServer();