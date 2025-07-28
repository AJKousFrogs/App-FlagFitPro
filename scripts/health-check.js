#!/usr/bin/env node

/**
 * Health Check Service
 * Monitors application health and sends alerts
 */

const http = require('http');
const https = require('https');
const fs = require('fs').promises;
const path = require('path');

class HealthCheckService {
  constructor() {
    this.config = {
      interval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000,
      timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT) || 5000,
      alertWebhook: process.env.ALERT_WEBHOOK_URL,
      logFile: path.join(__dirname, '../logs/health-check.log'),
      endpoints: [
        {
          name: 'Frontend',
          url: 'http://localhost:3000',
          method: 'GET',
          expectedStatus: 200,
          timeout: 5000
        },
        {
          name: 'PocketBase API',
          url: 'http://localhost:8090/api/health',
          method: 'GET',
          expectedStatus: 200,
          timeout: 3000
        },
        {
          name: 'PocketBase Admin',
          url: 'http://localhost:8090/_/',
          method: 'GET',
          expectedStatus: 200,
          timeout: 3000
        }
      ]
    };

    this.status = new Map();
    this.alertsSent = new Map();
    this.consecutiveFailures = new Map();
    
    // Initialize status
    this.config.endpoints.forEach(endpoint => {
      this.status.set(endpoint.name, { healthy: true, lastCheck: null, error: null });
      this.consecutiveFailures.set(endpoint.name, 0);
    });

    this.start();
  }

  async start() {
    console.log('🔍 Health Check Service starting...');
    console.log(`📊 Monitoring ${this.config.endpoints.length} endpoints`);
    console.log(`⏱️  Check interval: ${this.config.interval}ms`);
    
    // Create logs directory if it doesn't exist
    await this.ensureLogDirectory();
    
    // Initial health check
    await this.performHealthChecks();
    
    // Schedule periodic checks
    setInterval(() => {
      this.performHealthChecks();
    }, this.config.interval);
  }

  async ensureLogDirectory() {
    try {
      const logDir = path.dirname(this.config.logFile);
      await fs.mkdir(logDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }

  async performHealthChecks() {
    const timestamp = new Date().toISOString();
    console.log(`\n🔍 Performing health checks at ${timestamp}`);
    
    const results = await Promise.allSettled(
      this.config.endpoints.map(endpoint => this.checkEndpoint(endpoint))
    );

    let allHealthy = true;
    const healthReport = {
      timestamp,
      overall: 'healthy',
      endpoints: {}
    };

    results.forEach((result, index) => {
      const endpoint = this.config.endpoints[index];
      
      if (result.status === 'fulfilled') {
        const { healthy, responseTime, error } = result.value;
        
        healthReport.endpoints[endpoint.name] = {
          healthy,
          responseTime,
          error,
          url: endpoint.url
        };

        this.updateEndpointStatus(endpoint.name, healthy, error);
        
        if (!healthy) {
          allHealthy = false;
          this.handleUnhealthyEndpoint(endpoint.name, error);
        } else {
          this.handleHealthyEndpoint(endpoint.name);
        }
        
        console.log(`${healthy ? '✅' : '❌'} ${endpoint.name}: ${healthy ? 'Healthy' : 'Unhealthy'} (${responseTime}ms)`);
        if (error) {
          console.log(`   Error: ${error}`);
        }
      } else {
        console.log(`❌ ${endpoint.name}: Check failed - ${result.reason}`);
        allHealthy = false;
      }
    });

    healthReport.overall = allHealthy ? 'healthy' : 'unhealthy';
    
    // Log health report
    await this.logHealthReport(healthReport);
    
    console.log(`\n📋 Overall Status: ${allHealthy ? '✅ Healthy' : '❌ Unhealthy'}`);
  }

  async checkEndpoint(endpoint) {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const url = new URL(endpoint.url);
      const client = url.protocol === 'https:' ? https : http;
      
      const req = client.request({
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: endpoint.method,
        timeout: endpoint.timeout,
        headers: {
          'User-Agent': 'FlagFit-HealthCheck/1.0'
        }
      }, (res) => {
        const responseTime = Date.now() - startTime;
        const healthy = res.statusCode === endpoint.expectedStatus;
        
        resolve({
          healthy,
          responseTime,
          error: healthy ? null : `HTTP ${res.statusCode}`
        });
      });

      req.on('error', (error) => {
        const responseTime = Date.now() - startTime;
        resolve({
          healthy: false,
          responseTime,
          error: error.message
        });
      });

      req.on('timeout', () => {
        const responseTime = Date.now() - startTime;
        req.destroy();
        resolve({
          healthy: false,
          responseTime,
          error: 'Request timeout'
        });
      });

      req.end();
    });
  }

  updateEndpointStatus(name, healthy, error) {
    this.status.set(name, {
      healthy,
      lastCheck: new Date().toISOString(),
      error
    });

    if (healthy) {
      this.consecutiveFailures.set(name, 0);
    } else {
      const current = this.consecutiveFailures.get(name) || 0;
      this.consecutiveFailures.set(name, current + 1);
    }
  }

  handleUnhealthyEndpoint(name, error) {
    const failures = this.consecutiveFailures.get(name);
    
    // Send alert on first failure, then every 5 failures
    if (failures === 1 || failures % 5 === 0) {
      this.sendAlert({
        type: 'endpoint_unhealthy',
        endpoint: name,
        error,
        consecutiveFailures: failures,
        timestamp: new Date().toISOString()
      });
    }
  }

  handleHealthyEndpoint(name) {
    // Send recovery alert if we had failures before
    const hadFailures = this.consecutiveFailures.get(name) > 0;
    
    if (hadFailures) {
      this.sendAlert({
        type: 'endpoint_recovered',
        endpoint: name,
        timestamp: new Date().toISOString()
      });
    }
  }

  async sendAlert(alert) {
    if (!this.config.alertWebhook) {
      console.log('⚠️  No alert webhook configured');
      return;
    }

    try {
      const payload = {
        text: this.formatAlertMessage(alert),
        timestamp: alert.timestamp,
        service: 'FlagFit Pro Health Check',
        alert
      };

      // Prevent duplicate alerts within 5 minutes
      const alertKey = `${alert.type}_${alert.endpoint}`;
      const lastAlert = this.alertsSent.get(alertKey);
      if (lastAlert && Date.now() - lastAlert < 5 * 60 * 1000) {
        return;
      }

      await this.sendWebhook(payload);
      this.alertsSent.set(alertKey, Date.now());
      
      console.log(`🚨 Alert sent: ${alert.type} for ${alert.endpoint}`);
    } catch (error) {
      console.error('Failed to send alert:', error);
    }
  }

  formatAlertMessage(alert) {
    switch (alert.type) {
      case 'endpoint_unhealthy':
        return `🚨 **ALERT**: ${alert.endpoint} is unhealthy\n` +
               `Error: ${alert.error}\n` +
               `Consecutive failures: ${alert.consecutiveFailures}\n` +
               `Time: ${alert.timestamp}`;
      
      case 'endpoint_recovered':
        return `✅ **RECOVERY**: ${alert.endpoint} is healthy again\n` +
               `Time: ${alert.timestamp}`;
      
      default:
        return `🔍 Health check alert: ${JSON.stringify(alert)}`;
    }
  }

  async sendWebhook(payload) {
    return new Promise((resolve, reject) => {
      const url = new URL(this.config.alertWebhook);
      const client = url.protocol === 'https:' ? https : http;
      
      const data = JSON.stringify(payload);
      
      const req = client.request({
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      }, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          reject(new Error(`Webhook failed with status ${res.statusCode}`));
        }
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  async logHealthReport(report) {
    try {
      const logEntry = JSON.stringify(report) + '\n';
      await fs.appendFile(this.config.logFile, logEntry);
    } catch (error) {
      console.error('Failed to write health log:', error);
    }
  }

  // Graceful shutdown
  shutdown() {
    console.log('\n🛑 Health Check Service shutting down...');
    process.exit(0);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT signal');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM signal');
  process.exit(0);
});

// Start the service
new HealthCheckService();