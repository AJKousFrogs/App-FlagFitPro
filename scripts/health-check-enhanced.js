#!/usr/bin/env node

/**
 * Enhanced Health Check System
 * Monitors localhost services and prevents conflicts
 */

import net from 'net';
import http from 'http';
import { performance } from 'perf_hooks';
import PortManager from './port-manager.js';

class HealthChecker {
  constructor() {
    this.portManager = new PortManager();
    this.services = {
      'Vite Dev Server': { ports: [4000, 4001, 4002], type: 'http' },
      'Vite Preview': { ports: [4173, 4174, 4175], type: 'http' },
      'Database': { ports: [5432, 5433, 5434], type: 'tcp' },
      'MCP Context7': { ports: [3000, 3001, 3002], type: 'http' },
      'MCP Sequential': { ports: [3001, 3002, 3003], type: 'http' },
      'PocketBase': { ports: [8090, 8091, 8092], type: 'http' }
    };
  }

  async checkPort(port, type = 'tcp') {
    const start = performance.now();
    
    if (type === 'http') {
      return this.checkHttpPort(port, start);
    } else {
      return this.checkTcpPort(port, start);
    }
  }

  async checkTcpPort(port, start) {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      const timeout = setTimeout(() => {
        socket.destroy();
        resolve({
          port,
          status: 'timeout',
          responseTime: performance.now() - start,
          available: true
        });
      }, 2000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        socket.destroy();
        resolve({
          port,
          status: 'occupied',
          responseTime: performance.now() - start,
          available: false
        });
      });

      socket.on('error', () => {
        clearTimeout(timeout);
        resolve({
          port,
          status: 'available',
          responseTime: performance.now() - start,
          available: true
        });
      });

      socket.connect(port, 'localhost');
    });
  }

  async checkHttpPort(port, start) {
    return new Promise((resolve) => {
      const req = http.request({
        hostname: 'localhost',
        port,
        method: 'GET',
        timeout: 2000
      }, (res) => {
        resolve({
          port,
          status: `http-${res.statusCode}`,
          responseTime: performance.now() - start,
          available: false,
          service: res.headers['server'] || 'unknown'
        });
      });

      req.on('error', () => {
        resolve({
          port,
          status: 'available',
          responseTime: performance.now() - start,
          available: true
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          port,
          status: 'timeout',
          responseTime: performance.now() - start,
          available: true
        });
      });

      req.end();
    });
  }

  async runHealthCheck() {
    console.log('🏥 Running Enhanced Health Check...\n');
    
    // Clean up stale port locks
    await this.portManager.cleanup();
    
    const results = {};
    
    for (const [serviceName, config] of Object.entries(this.services)) {
      console.log(`🔍 Checking ${serviceName}...`);
      
      const checks = await Promise.all(
        config.ports.map(port => this.checkPort(port, config.type))
      );
      
      results[serviceName] = checks;
      
      // Display results for this service
      checks.forEach(result => {
        const statusIcon = this.getStatusIcon(result.status);
        const responseTime = Math.round(result.responseTime);
        console.log(`   Port ${result.port}: ${statusIcon} ${result.status} (${responseTime}ms)`);
      });
      
      console.log('');
    }
    
    // Show port manager info
    this.portManager.getPortInfo();
    
    // Summary
    this.showSummary(results);
    
    return results;
  }

  getStatusIcon(status) {
    switch (status) {
      case 'available': return '✅';
      case 'occupied': return '🔴';
      case 'timeout': return '⏱️';
      default: 
        if (status.startsWith('http-2')) return '🟢'; // 2xx responses
        if (status.startsWith('http-4')) return '🟡'; // 4xx responses
        if (status.startsWith('http-5')) return '🔴'; // 5xx responses
        return '❓';
    }
  }

  showSummary(results) {
    let totalPorts = 0;
    let availablePorts = 0;
    let activePorts = 0;
    
    for (const checks of Object.values(results)) {
      totalPorts += checks.length;
      checks.forEach(result => {
        if (result.available) {
          availablePorts++;
        } else {
          activePorts++;
        }
      });
    }
    
    console.log('📊 Health Check Summary:');
    console.log(`   Total ports checked: ${totalPorts}`);
    console.log(`   Available ports: ${availablePorts} ✅`);
    console.log(`   Active services: ${activePorts} 🔴`);
    
    if (activePorts === 0) {
      console.log('\n🎉 All ports are available! Safe to start development.\n');
    } else {
      console.log('\n⚠️  Some ports are occupied. Use port management for safety.\n');
    }
  }

  async monitorMode() {
    console.log('🔄 Starting continuous monitoring (Ctrl+C to stop)...\n');
    
    const monitor = async () => {
      console.clear();
      console.log(`🏈 Flag Football App Health Monitor - ${new Date().toLocaleTimeString()}\n`);
      await this.runHealthCheck();
    };
    
    // Initial check
    await monitor();
    
    // Check every 30 seconds
    const interval = setInterval(monitor, 30000);
    
    process.on('SIGINT', () => {
      clearInterval(interval);
      console.log('\n👋 Monitoring stopped');
      process.exit(0);
    });
  }
}

// CLI interface
async function main() {
  const [,, command] = process.argv;
  const healthChecker = new HealthChecker();
  
  switch (command) {
    case 'monitor':
      await healthChecker.monitorMode();
      break;
    case 'check':
    default:
      await healthChecker.runHealthCheck();
      break;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default HealthChecker;