/**
 * Enterprise-grade scalability utilities and patterns
 * Provides horizontal scaling, load balancing, and distributed system patterns
 */

import { httpPool, requestBatcher } from './connectionPool';
import { globalCache } from './caching';

// Load balancer for distributed requests
export class LoadBalancer {
  constructor(servers = [], options = {}) {
    this.servers = servers.map(server => ({
      url: server.url,
      weight: server.weight || 1,
      healthScore: 100,
      activeConnections: 0,
      totalRequests: 0,
      failedRequests: 0,
      responseTime: 0,
      lastHealthCheck: Date.now(),
      isHealthy: true
    }));

    this.options = {
      algorithm: 'weighted-round-robin', // round-robin, weighted-round-robin, least-connections, response-time
      healthCheckInterval: 30000, // 30 seconds
      healthCheckTimeout: 5000,
      maxRetries: 3,
      retryDelay: 1000,
      ...options
    };

    this.currentIndex = 0;
    this.setupHealthChecks();
  }

  // Select server based on load balancing algorithm
  selectServer() {
    const healthyServers = this.servers.filter(server => server.isHealthy);
    
    if (healthyServers.length === 0) {
      throw new Error('No healthy servers available');
    }

    switch (this.options.algorithm) {
      case 'round-robin':
        return this.roundRobin(healthyServers);
      case 'weighted-round-robin':
        return this.weightedRoundRobin(healthyServers);
      case 'least-connections':
        return this.leastConnections(healthyServers);
      case 'response-time':
        return this.bestResponseTime(healthyServers);
      default:
        return this.roundRobin(healthyServers);
    }
  }

  // Round-robin algorithm
  roundRobin(servers) {
    const server = servers[this.currentIndex % servers.length];
    this.currentIndex++;
    return server;
  }

  // Weighted round-robin algorithm
  weightedRoundRobin(servers) {
    let totalWeight = servers.reduce((sum, server) => sum + server.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const server of servers) {
      random -= server.weight;
      if (random <= 0) {
        return server;
      }
    }
    
    return servers[0]; // Fallback
  }

  // Least connections algorithm
  leastConnections(servers) {
    return servers.reduce((best, current) => 
      current.activeConnections < best.activeConnections ? current : best
    );
  }

  // Best response time algorithm
  bestResponseTime(servers) {
    return servers.reduce((best, current) => 
      current.responseTime < best.responseTime ? current : best
    );
  }

  // Make load-balanced request
  async request(path, options = {}) {
    let lastError;
    
    for (let attempt = 0; attempt < this.options.maxRetries; attempt++) {
      try {
        const server = this.selectServer();
        const startTime = Date.now();
        
        server.activeConnections++;
        server.totalRequests++;

        const response = await httpPool.request(`${server.url}${path}`, options);
        
        // Update server metrics
        const responseTime = Date.now() - startTime;
        server.responseTime = (server.responseTime + responseTime) / 2; // Moving average
        server.healthScore = Math.min(100, server.healthScore + 5);
        server.activeConnections--;

        return response;
      } catch (error) {
        lastError = error;
        
        // Update server metrics on error
        if (this.servers.length > 0) {
          const server = this.servers.find(s => s.url === error.serverUrl) || this.servers[0];
          server.failedRequests++;
          server.healthScore = Math.max(0, server.healthScore - 10);
          server.activeConnections = Math.max(0, server.activeConnections - 1);
          
          if (server.healthScore < 30) {
            server.isHealthy = false;
          }
        }

        // Wait before retry
        if (attempt < this.options.maxRetries - 1) {
          await new Promise(resolve => 
            setTimeout(resolve, this.options.retryDelay * (attempt + 1))
          );
        }
      }
    }

    throw lastError;
  }

  // Setup health checks
  setupHealthChecks() {
    setInterval(() => {
      this.performHealthChecks();
    }, this.options.healthCheckInterval);
  }

  // Perform health checks on all servers
  async performHealthChecks() {
    const healthCheckPromises = this.servers.map(server => 
      this.checkServerHealth(server)
    );

    await Promise.allSettled(healthCheckPromises);
  }

  // Check individual server health
  async checkServerHealth(server) {
    try {
      const startTime = Date.now();
      const response = await fetch(`${server.url}/health`, {
        method: 'GET',
        timeout: this.options.healthCheckTimeout
      });

      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        server.isHealthy = true;
        server.healthScore = Math.min(100, server.healthScore + 10);
        server.responseTime = responseTime;
        server.lastHealthCheck = Date.now();
      } else {
        throw new Error(`Health check failed: ${response.status}`);
      }
    } catch (error) {
      server.isHealthy = false;
      server.healthScore = Math.max(0, server.healthScore - 20);
      server.lastHealthCheck = Date.now();
      console.warn(`Health check failed for ${server.url}:`, error.message);
    }
  }

  // Get load balancer statistics
  getStats() {
    return {
      servers: this.servers.map(server => ({
        url: server.url,
        isHealthy: server.isHealthy,
        healthScore: server.healthScore,
        activeConnections: server.activeConnections,
        totalRequests: server.totalRequests,
        failedRequests: server.failedRequests,
        successRate: server.totalRequests > 0 
          ? ((server.totalRequests - server.failedRequests) / server.totalRequests * 100).toFixed(2) 
          : 100,
        averageResponseTime: server.responseTime
      })),
      algorithm: this.options.algorithm,
      healthyServers: this.servers.filter(s => s.isHealthy).length,
      totalServers: this.servers.length
    };
  }

  // Add server to pool
  addServer(serverConfig) {
    this.servers.push({
      url: serverConfig.url,
      weight: serverConfig.weight || 1,
      healthScore: 100,
      activeConnections: 0,
      totalRequests: 0,
      failedRequests: 0,
      responseTime: 0,
      lastHealthCheck: Date.now(),
      isHealthy: true
    });
  }

  // Remove server from pool
  removeServer(url) {
    this.servers = this.servers.filter(server => server.url !== url);
  }
}

// Service mesh for microservices communication
export class ServiceMesh {
  constructor(options = {}) {
    this.services = new Map();
    this.loadBalancers = new Map();
    this.options = {
      retryAttempts: 3,
      circuitBreakerThreshold: 5,
      timeoutMs: 30000,
      ...options
    };
  }

  // Register service
  registerService(serviceName, instances) {
    this.services.set(serviceName, instances);
    
    // Create load balancer for service
    const loadBalancer = new LoadBalancer(instances, {
      algorithm: 'least-connections',
      healthCheckInterval: 20000
    });
    
    this.loadBalancers.set(serviceName, loadBalancer);
    console.log(`✅ Registered service: ${serviceName} with ${instances.length} instances`);
  }

  // Call service through mesh
  async callService(serviceName, endpoint, options = {}) {
    const loadBalancer = this.loadBalancers.get(serviceName);
    
    if (!loadBalancer) {
      throw new Error(`Service not found: ${serviceName}`);
    }

    try {
      // Add service mesh headers
      const meshOptions = {
        ...options,
        headers: {
          'X-Service-Mesh': 'true',
          'X-Source-Service': options.sourceService || 'unknown',
          'X-Trace-Id': options.traceId || this.generateTraceId(),
          ...options.headers
        }
      };

      return await loadBalancer.request(endpoint, meshOptions);
    } catch (error) {
      console.error(`Service call failed: ${serviceName}${endpoint}`, error);
      throw error;
    }
  }

  // Generate trace ID for distributed tracing
  generateTraceId() {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  // Get service statistics
  getServiceStats(serviceName) {
    const loadBalancer = this.loadBalancers.get(serviceName);
    return loadBalancer ? loadBalancer.getStats() : null;
  }

  // Get all services statistics
  getAllStats() {
    const stats = {};
    for (const [serviceName, loadBalancer] of this.loadBalancers) {
      stats[serviceName] = loadBalancer.getStats();
    }
    return stats;
  }
}

// Auto-scaling manager
export class AutoScaler {
  constructor(options = {}) {
    this.options = {
      minInstances: 1,
      maxInstances: 10,
      targetCPU: 70, // Target CPU utilization percentage
      targetMemory: 80, // Target memory utilization percentage
      scaleUpThreshold: 80,
      scaleDownThreshold: 30,
      cooldownPeriod: 300000, // 5 minutes
      metricsWindow: 300000, // 5 minutes
      ...options
    };

    this.instances = [];
    this.metrics = [];
    this.lastScaleAction = 0;
    this.isScaling = false;

    this.setupMetricsCollection();
  }

  // Add instance to auto-scaler
  addInstance(instanceConfig) {
    const instance = {
      id: instanceConfig.id || this.generateInstanceId(),
      url: instanceConfig.url,
      status: 'running',
      createdAt: Date.now(),
      cpu: 0,
      memory: 0,
      requests: 0
    };

    this.instances.push(instance);
    return instance;
  }

  // Remove instance
  removeInstance(instanceId) {
    this.instances = this.instances.filter(instance => instance.id !== instanceId);
  }

  // Collect metrics from instances
  async collectMetrics() {
    const promises = this.instances.map(async (instance) => {
      try {
        const response = await fetch(`${instance.url}/metrics`);
        const metrics = await response.json();
        
        instance.cpu = metrics.cpu || 0;
        instance.memory = metrics.memory || 0;
        instance.requests = metrics.requests || 0;
        
        return metrics;
      } catch (error) {
        console.warn(`Failed to collect metrics from ${instance.id}:`, error);
        return null;
      }
    });

    const results = await Promise.allSettled(promises);
    const timestamp = Date.now();
    
    // Store metrics
    this.metrics.push({
      timestamp,
      instances: results.map((result, index) => ({
        instanceId: this.instances[index].id,
        metrics: result.status === 'fulfilled' ? result.value : null
      }))
    });

    // Keep only recent metrics
    const cutoff = timestamp - this.options.metricsWindow;
    this.metrics = this.metrics.filter(metric => metric.timestamp > cutoff);
  }

  // Calculate average metrics
  getAverageMetrics() {
    if (this.metrics.length === 0) {
      return { cpu: 0, memory: 0, requests: 0 };
    }

    const recent = this.metrics.slice(-10); // Last 10 data points
    let totalCPU = 0, totalMemory = 0, totalRequests = 0, count = 0;

    recent.forEach(metric => {
      metric.instances.forEach(instance => {
        if (instance.metrics) {
          totalCPU += instance.metrics.cpu || 0;
          totalMemory += instance.metrics.memory || 0;
          totalRequests += instance.metrics.requests || 0;
          count++;
        }
      });
    });

    return count > 0 ? {
      cpu: totalCPU / count,
      memory: totalMemory / count,
      requests: totalRequests / count
    } : { cpu: 0, memory: 0, requests: 0 };
  }

  // Check if scaling is needed
  shouldScale() {
    const now = Date.now();
    
    // Check cooldown period
    if (now - this.lastScaleAction < this.options.cooldownPeriod) {
      return null;
    }

    const avgMetrics = this.getAverageMetrics();
    const currentInstances = this.instances.length;

    // Scale up conditions
    if ((avgMetrics.cpu > this.options.scaleUpThreshold || 
         avgMetrics.memory > this.options.scaleUpThreshold) &&
        currentInstances < this.options.maxInstances) {
      return 'up';
    }

    // Scale down conditions
    if (avgMetrics.cpu < this.options.scaleDownThreshold && 
        avgMetrics.memory < this.options.scaleDownThreshold &&
        currentInstances > this.options.minInstances) {
      return 'down';
    }

    return null;
  }

  // Execute scaling action
  async executeScaling(direction) {
    if (this.isScaling) {
      return;
    }

    this.isScaling = true;
    this.lastScaleAction = Date.now();

    try {
      if (direction === 'up') {
        await this.scaleUp();
      } else if (direction === 'down') {
        await this.scaleDown();
      }
    } catch (error) {
      console.error('Scaling action failed:', error);
    } finally {
      this.isScaling = false;
    }
  }

  // Scale up (add instance)
  async scaleUp() {
    console.log('🚀 Scaling up: Adding new instance');
    
    // This would integrate with your infrastructure provider
    // For now, it's a simulation
    const newInstance = this.addInstance({
      url: `http://instance-${Date.now()}.example.com`
    });

    console.log(`✅ Added instance: ${newInstance.id}`);
  }

  // Scale down (remove instance)
  async scaleDown() {
    console.log('⬇️ Scaling down: Removing instance');
    
    // Find least utilized instance
    const leastUtilized = this.instances.reduce((min, instance) => 
      (instance.cpu + instance.memory) < (min.cpu + min.memory) ? instance : min
    );

    this.removeInstance(leastUtilized.id);
    console.log(`✅ Removed instance: ${leastUtilized.id}`);
  }

  // Setup metrics collection
  setupMetricsCollection() {
    setInterval(() => {
      this.collectMetrics();
    }, 30000); // Every 30 seconds

    setInterval(() => {
      const scaleDirection = this.shouldScale();
      if (scaleDirection) {
        this.executeScaling(scaleDirection);
      }
    }, 60000); // Check every minute
  }

  // Generate instance ID
  generateInstanceId() {
    return 'instance-' + Math.random().toString(36).substr(2, 9);
  }

  // Get auto-scaler statistics
  getStats() {
    const avgMetrics = this.getAverageMetrics();
    
    return {
      instances: this.instances.length,
      minInstances: this.options.minInstances,
      maxInstances: this.options.maxInstances,
      averageMetrics: avgMetrics,
      lastScaleAction: this.lastScaleAction,
      isScaling: this.isScaling,
      instances: this.instances.map(instance => ({
        id: instance.id,
        status: instance.status,
        cpu: instance.cpu,
        memory: instance.memory,
        requests: instance.requests
      }))
    };
  }
}

// CDN management for static assets
export class CDNManager {
  constructor(options = {}) {
    this.options = {
      primaryCDN: 'https://cdn.example.com',
      fallbackCDNs: ['https://cdn2.example.com', 'https://cdn3.example.com'],
      cacheControl: 'public, max-age=31536000', // 1 year
      ...options
    };

    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      bandwidth: 0
    };
  }

  // Get optimized asset URL
  getAssetURL(assetPath, options = {}) {
    const {
      version = null,
      format = null,
      quality = null,
      width = null,
      height = null
    } = options;

    let url = `${this.options.primaryCDN}${assetPath}`;
    const params = new URLSearchParams();

    if (version) params.append('v', version);
    if (format) params.append('format', format);
    if (quality) params.append('q', quality);
    if (width) params.append('w', width);
    if (height) params.append('h', height);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    return url;
  }

  // Preload critical assets
  preloadAssets(assets) {
    assets.forEach(asset => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = this.getAssetURL(asset.path, asset.options);
      link.as = asset.type || 'image';
      
      if (asset.crossorigin) {
        link.crossOrigin = asset.crossorigin;
      }

      document.head.appendChild(link);
    });
  }

  // Intelligent image loading
  loadOptimizedImage(src, options = {}) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      // Use WebP if supported
      const supportsWebP = this.supportsWebP();
      const format = supportsWebP ? 'webp' : options.format;
      
      // Set responsive size
      const screenWidth = window.innerWidth;
      const width = options.width || (screenWidth > 1200 ? 1200 : screenWidth);
      
      img.src = this.getAssetURL(src, {
        ...options,
        format,
        width
      });

      img.onload = () => {
        this.stats.totalRequests++;
        resolve(img);
      };
      
      img.onerror = () => {
        // Try fallback CDN
        this.loadFromFallback(src, options)
          .then(resolve)
          .catch(reject);
      };
    });
  }

  // Load from fallback CDN
  async loadFromFallback(src, options) {
    for (const fallbackCDN of this.options.fallbackCDNs) {
      try {
        const img = new Image();
        const fallbackURL = `${fallbackCDN}${src}`;
        
        img.src = fallbackURL;
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        return img;
      } catch (error) {
        console.warn(`Fallback CDN failed: ${fallbackCDN}`);
      }
    }
    
    throw new Error('All CDN sources failed');
  }

  // Check WebP support
  supportsWebP() {
    if (typeof window === 'undefined') return false;
    
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('image/webp') === 5;
  }

  // Get CDN statistics
  getStats() {
    return {
      ...this.stats,
      hitRate: this.stats.totalRequests > 0 
        ? (this.stats.cacheHits / this.stats.totalRequests * 100).toFixed(2)
        : 0
    };
  }
}

// Global scalability instances
export const loadBalancer = new LoadBalancer([]);
export const serviceMesh = new ServiceMesh();
export const autoScaler = new AutoScaler();
export const cdnManager = new CDNManager();

// Initialize scalability infrastructure
export const initializeScalability = (config = {}) => {
  console.log('⚡ Initializing scalability infrastructure...');

  // Setup load balancer if servers provided
  if (config.servers) {
    config.servers.forEach(server => {
      loadBalancer.addServer(server);
    });
  }

  // Register services if provided
  if (config.services) {
    Object.entries(config.services).forEach(([name, instances]) => {
      serviceMesh.registerService(name, instances);
    });
  }

  // Configure auto-scaler
  if (config.autoScaling) {
    Object.assign(autoScaler.options, config.autoScaling);
  }

  console.log('⚡ Scalability infrastructure initialized');
};

export default {
  LoadBalancer,
  ServiceMesh,
  AutoScaler,
  CDNManager,
  loadBalancer,
  serviceMesh,
  autoScaler,
  cdnManager,
  initializeScalability
};