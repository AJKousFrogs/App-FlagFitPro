#!/usr/bin/env node

/**
 * Robust Port Management System
 * Prevents localhost port conflicts during development
 */

import net from 'net';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const PORT_RANGES = {
  dev: { start: 4000, end: 4010 },
  preview: { start: 4170, end: 4180 },
  db: { start: 5432, end: 5442 },
  mcp: { start: 3000, end: 3010 }
};

const PORT_LOCK_FILE = '.ports.lock';

class PortManager {
  constructor() {
    this.lockedPorts = this.loadLockedPorts();
  }

  loadLockedPorts() {
    try {
      if (fs.existsSync(PORT_LOCK_FILE)) {
        return JSON.parse(fs.readFileSync(PORT_LOCK_FILE, 'utf8'));
      }
    } catch (error) {
      console.warn('Could not load port lock file:', error.message);
    }
    return {};
  }

  saveLockedPorts() {
    try {
      fs.writeFileSync(PORT_LOCK_FILE, JSON.stringify(this.lockedPorts, null, 2));
    } catch (error) {
      console.error('Could not save port lock file:', error.message);
    }
  }

  async isPortAvailable(port) {
    return new Promise((resolve) => {
      const server = net.createServer();
      
      server.listen(port, 'localhost', () => {
        server.once('close', () => resolve(true));
        server.close();
      });
      
      server.on('error', () => resolve(false));
    });
  }

  async findAvailablePort(service) {
    const range = PORT_RANGES[service];
    if (!range) {
      throw new Error(`Unknown service: ${service}`);
    }

    for (let port = range.start; port <= range.end; port++) {
      if (await this.isPortAvailable(port)) {
        return port;
      }
    }
    
    throw new Error(`No available ports for service ${service} in range ${range.start}-${range.end}`);
  }

  async allocatePort(service, processId = process.pid) {
    const port = await this.findAvailablePort(service);
    
    this.lockedPorts[service] = {
      port,
      processId,
      timestamp: Date.now(),
      service
    };
    
    this.saveLockedPorts();
    console.log(`✅ Allocated port ${port} for ${service} (PID: ${processId})`);
    return port;
  }

  releasePort(service) {
    if (this.lockedPorts[service]) {
      const { port } = this.lockedPorts[service];
      delete this.lockedPorts[service];
      this.saveLockedPorts();
      console.log(`🔓 Released port ${port} for ${service}`);
    }
  }

  releaseAllPorts() {
    const services = Object.keys(this.lockedPorts);
    services.forEach(service => this.releasePort(service));
    console.log(`🧹 Released all ports for ${services.length} services`);
  }

  async cleanup() {
    // Remove stale port locks from dead processes
    const currentLocks = { ...this.lockedPorts };
    let cleaned = 0;

    for (const [service, lock] of Object.entries(currentLocks)) {
      try {
        // Check if process is still running
        process.kill(lock.processId, 0);
      } catch (error) {
        // Process is dead, remove the lock
        delete this.lockedPorts[service];
        cleaned++;
        console.log(`🗑️  Cleaned stale port lock for ${service} (dead PID: ${lock.processId})`);
      }
    }

    if (cleaned > 0) {
      this.saveLockedPorts();
      console.log(`✨ Cleaned ${cleaned} stale port locks`);
    }
  }

  getPortInfo() {
    console.log('\n📊 Current Port Allocations:');
    if (Object.keys(this.lockedPorts).length === 0) {
      console.log('   No ports currently allocated\n');
      return;
    }

    for (const [service, lock] of Object.entries(this.lockedPorts)) {
      const age = Math.round((Date.now() - lock.timestamp) / 1000);
      console.log(`   ${service}: port ${lock.port} (PID: ${lock.processId}, ${age}s ago)`);
    }
    console.log('');
  }
}

// CLI interface
async function main() {
  const portManager = new PortManager();
  const [,, command, service] = process.argv;

  // Setup graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down port manager...');
    portManager.releaseAllPorts();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    portManager.releaseAllPorts();
    process.exit(0);
  });

  try {
    switch (command) {
      case 'allocate':
        if (!service) {
          console.error('❌ Service name required');
          process.exit(1);
        }
        const port = await portManager.allocatePort(service);
        process.stdout.write(port.toString());
        break;

      case 'release':
        if (!service) {
          console.error('❌ Service name required');
          process.exit(1);
        }
        portManager.releasePort(service);
        break;

      case 'cleanup':
        await portManager.cleanup();
        break;

      case 'info':
        portManager.getPortInfo();
        break;

      case 'release-all':
        portManager.releaseAllPorts();
        break;

      default:
        console.log(`
🚢 Port Manager - Prevent localhost conflicts

Usage:
  node scripts/port-manager.js allocate <service>  - Allocate available port
  node scripts/port-manager.js release <service>   - Release service port  
  node scripts/port-manager.js cleanup             - Clean stale locks
  node scripts/port-manager.js info                - Show port allocations
  node scripts/port-manager.js release-all         - Release all ports

Services: dev, preview, db, mcp
        `);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default PortManager;