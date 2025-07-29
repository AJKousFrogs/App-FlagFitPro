/**
 * Enterprise-grade connection pooling and request management
 * Provides HTTP connection pooling, request queuing, and circuit breaker patterns
 */

// Connection pool for HTTP requests
export class HTTPConnectionPool {
  constructor(options = {}) {
    this.options = {
      maxConnections: 10,
      maxConcurrentRequests: 6,
      requestTimeout: 30000, // 30 seconds
      retryAttempts: 3,
      retryDelay: 1000,
      keepAlive: true,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 60000, // 1 minute
      ...options
    };

    this.connections = new Map();
    this.requestQueue = [];
    this.activeRequests = 0;
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      currentConnections: 0
    };

    // Circuit breaker state
    this.circuitBreaker = {
      state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
      failures: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0
    };

    this.setupHealthChecks();
  }

  // Make HTTP request through the pool
  async request(url, options = {}) {
    return new Promise((resolve, reject) => {
      const requestConfig = {
        url,
        options: {
          method: 'GET',
          headers: {},
          timeout: this.options.requestTimeout,
          ...options
        },
        resolve,
        reject,
        attempts: 0,
        startTime: Date.now()
      };

      this.enqueueRequest(requestConfig);
    });
  }

  // Enqueue request for processing
  enqueueRequest(requestConfig) {
    // Check circuit breaker
    if (this.circuitBreaker.state === 'OPEN') {
      if (Date.now() < this.circuitBreaker.nextAttemptTime) {
        requestConfig.reject(new Error('Circuit breaker is OPEN'));
        return;
      } else {
        // Try to half-open the circuit
        this.circuitBreaker.state = 'HALF_OPEN';
      }
    }

    // Add to queue
    this.requestQueue.push(requestConfig);
    this.processQueue();
  }

  // Process the request queue
  async processQueue() {
    if (this.activeRequests >= this.options.maxConcurrentRequests || this.requestQueue.length === 0) {
      return;
    }

    const requestConfig = this.requestQueue.shift();
    this.activeRequests++;
    this.stats.totalRequests++;

    try {
      const response = await this.executeRequest(requestConfig);
      this.handleRequestSuccess(requestConfig, response);
    } catch (error) {
      this.handleRequestError(requestConfig, error);
    } finally {
      this.activeRequests--;
      // Process next request in queue
      setTimeout(() => this.processQueue(), 0);
    }
  }

  // Execute HTTP request
  async executeRequest(requestConfig) {
    const { url, options } = requestConfig;
    const startTime = Date.now();

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Connection': this.options.keepAlive ? 'keep-alive' : 'close',
          ...options.headers
        }
      });

      clearTimeout(timeoutId);

      // Update response time stats
      const responseTime = Date.now() - startTime;
      this.updateResponseTimeStats(responseTime);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      throw error;
    }
  }

  // Handle successful request
  handleRequestSuccess(requestConfig, response) {
    this.stats.successfulRequests++;
    
    // Reset circuit breaker on success
    if (this.circuitBreaker.state === 'HALF_OPEN') {
      this.circuitBreaker.state = 'CLOSED';
      this.circuitBreaker.failures = 0;
    }

    requestConfig.resolve(response);
  }

  // Handle request error
  async handleRequestError(requestConfig, error) {
    requestConfig.attempts++;
    
    // Update circuit breaker
    this.updateCircuitBreaker(error);

    // Retry logic
    if (requestConfig.attempts < this.options.retryAttempts && this.shouldRetry(error)) {
      // Exponential backoff
      const delay = this.options.retryDelay * Math.pow(2, requestConfig.attempts - 1);
      setTimeout(() => {
        this.enqueueRequest(requestConfig);
      }, delay);
      return;
    }

    // All retries exhausted
    this.stats.failedRequests++;
    requestConfig.reject(error);
  }

  // Check if error is retryable
  shouldRetry(error) {
    // Don't retry client errors (4xx), but retry server errors (5xx) and network errors
    if (error.message.includes('HTTP 4')) {
      return false;
    }
    return true;
  }

  // Update circuit breaker state
  updateCircuitBreaker(error) {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailureTime = Date.now();

    if (this.circuitBreaker.failures >= this.options.circuitBreakerThreshold) {
      this.circuitBreaker.state = 'OPEN';
      this.circuitBreaker.nextAttemptTime = Date.now() + this.options.circuitBreakerTimeout;
      console.warn('Circuit breaker opened due to excessive failures');
    }
  }

  // Update response time statistics
  updateResponseTimeStats(responseTime) {
    const totalTime = this.stats.averageResponseTime * this.stats.successfulRequests + responseTime;
    this.stats.averageResponseTime = totalTime / (this.stats.successfulRequests + 1);
  }

  // Setup health checks
  setupHealthChecks() {
    setInterval(() => {
      this.performHealthCheck();
    }, 30000); // Every 30 seconds
  }

  // Perform health check
  async performHealthCheck() {
    try {
      // Check if circuit breaker should be reset
      if (this.circuitBreaker.state === 'OPEN' && 
          Date.now() > this.circuitBreaker.nextAttemptTime) {
        this.circuitBreaker.state = 'HALF_OPEN';
        console.log('Circuit breaker moved to HALF_OPEN state');
      }

      // Log pool statistics
      console.log('Connection Pool Stats:', {
        ...this.stats,
        activeRequests: this.activeRequests,
        queuedRequests: this.requestQueue.length,
        circuitBreakerState: this.circuitBreaker.state
      });

    } catch (error) {
      console.error('Health check failed:', error);
    }
  }

  // Get pool statistics
  getStats() {
    return {
      ...this.stats,
      activeRequests: this.activeRequests,
      queuedRequests: this.requestQueue.length,
      circuitBreaker: { ...this.circuitBreaker }
    };
  }

  // Reset pool
  reset() {
    this.requestQueue = [];
    this.activeRequests = 0;
    this.circuitBreaker = {
      state: 'CLOSED',
      failures: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0
    };
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      currentConnections: 0
    };
  }
}

// Database connection pool (for client-side database connections)
export class DatabaseConnectionPool {
  constructor(options = {}) {
    this.options = {
      maxConnections: 5,
      connectionTimeout: 10000,
      idleTimeout: 300000, // 5 minutes
      retryAttempts: 3,
      ...options
    };

    this.connections = [];
    this.availableConnections = [];
    this.waitingQueue = [];
    this.stats = {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      totalQueries: 0,
      failedQueries: 0
    };
  }

  // Get connection from pool
  async getConnection() {
    return new Promise((resolve, reject) => {
      // Check for available connection
      if (this.availableConnections.length > 0) {
        const connection = this.availableConnections.pop();
        this.stats.activeConnections++;
        this.stats.idleConnections--;
        resolve(connection);
        return;
      }

      // Create new connection if under limit
      if (this.connections.length < this.options.maxConnections) {
        this.createConnection()
          .then(connection => {
            this.stats.activeConnections++;
            resolve(connection);
          })
          .catch(reject);
        return;
      }

      // Add to waiting queue
      this.waitingQueue.push({ resolve, reject });
    });
  }

  // Create new database connection
  async createConnection() {
    try {
      // This would implement actual database connection
      // For now, it's a mock connection
      const connection = {
        id: Math.random().toString(36).substr(2, 9),
        createdAt: Date.now(),
        lastUsed: Date.now(),
        isActive: true,
        query: this.createQueryMethod()
      };

      this.connections.push(connection);
      this.stats.totalConnections++;
      
      console.log(`Created database connection: ${connection.id}`);
      return connection;
    } catch (error) {
      console.error('Failed to create database connection:', error);
      throw error;
    }
  }

  // Create query method for connection
  createQueryMethod() {
    return async (sql, params = []) => {
      this.stats.totalQueries++;
      
      try {
        // Mock query execution
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        
        // Return mock result
        return {
          rows: [],
          rowCount: 0,
          command: sql.split(' ')[0].toUpperCase()
        };
      } catch (error) {
        this.stats.failedQueries++;
        throw error;
      }
    };
  }

  // Release connection back to pool
  releaseConnection(connection) {
    if (!connection || !connection.isActive) {
      return;
    }

    connection.lastUsed = Date.now();
    this.stats.activeConnections--;

    // Check if someone is waiting
    if (this.waitingQueue.length > 0) {
      const { resolve } = this.waitingQueue.shift();
      this.stats.activeConnections++;
      resolve(connection);
      return;
    }

    // Add to available connections
    this.availableConnections.push(connection);
    this.stats.idleConnections++;
  }

  // Close connection
  async closeConnection(connection) {
    if (!connection) return;

    connection.isActive = false;
    
    // Remove from all arrays
    this.connections = this.connections.filter(conn => conn.id !== connection.id);
    this.availableConnections = this.availableConnections.filter(conn => conn.id !== connection.id);
    
    this.stats.totalConnections--;
    if (this.stats.idleConnections > 0) {
      this.stats.idleConnections--;
    }

    console.log(`Closed database connection: ${connection.id}`);
  }

  // Clean up idle connections
  cleanupIdleConnections() {
    const now = Date.now();
    const idleConnections = this.availableConnections.filter(
      conn => now - conn.lastUsed > this.options.idleTimeout
    );

    idleConnections.forEach(conn => this.closeConnection(conn));
  }

  // Setup automatic cleanup
  setupCleanup() {
    setInterval(() => {
      this.cleanupIdleConnections();
    }, 60000); // Every minute
  }

  // Get pool statistics
  getStats() {
    return {
      ...this.stats,
      totalConnections: this.connections.length,
      availableConnections: this.availableConnections.length,
      waitingCount: this.waitingQueue.length
    };
  }

  // Close all connections
  async closeAll() {
    const closePromises = this.connections.map(conn => this.closeConnection(conn));
    await Promise.all(closePromises);
    
    // Reject all waiting requests
    this.waitingQueue.forEach(({ reject }) => {
      reject(new Error('Connection pool closed'));
    });
    this.waitingQueue = [];
  }
}

// Request batching utility
export class RequestBatcher {
  constructor(options = {}) {
    this.options = {
      batchSize: 10,
      batchTimeout: 100, // 100ms
      maxWaitTime: 1000, // 1 second
      ...options
    };

    this.batches = new Map();
  }

  // Add request to batch
  batch(key, request) {
    return new Promise((resolve, reject) => {
      if (!this.batches.has(key)) {
        this.batches.set(key, {
          requests: [],
          timeout: null,
          maxWaitTimeout: null
        });
      }

      const batch = this.batches.get(key);
      batch.requests.push({ request, resolve, reject });

      // Set batch timeout
      if (batch.timeout) {
        clearTimeout(batch.timeout);
      }

      batch.timeout = setTimeout(() => {
        this.executeBatch(key);
      }, this.options.batchTimeout);

      // Set max wait timeout
      if (!batch.maxWaitTimeout) {
        batch.maxWaitTimeout = setTimeout(() => {
          this.executeBatch(key);
        }, this.options.maxWaitTime);
      }

      // Execute if batch is full
      if (batch.requests.length >= this.options.batchSize) {
        this.executeBatch(key);
      }
    });
  }

  // Execute batch
  async executeBatch(key) {
    const batch = this.batches.get(key);
    if (!batch || batch.requests.length === 0) {
      return;
    }

    // Clear timeouts
    if (batch.timeout) {
      clearTimeout(batch.timeout);
    }
    if (batch.maxWaitTimeout) {
      clearTimeout(batch.maxWaitTimeout);
    }

    // Remove batch from map
    this.batches.delete(key);

    // Execute all requests
    const requests = batch.requests.map(item => item.request);
    
    try {
      const results = await this.executeBatchRequests(requests);
      
      // Resolve individual promises
      batch.requests.forEach((item, index) => {
        item.resolve(results[index]);
      });
    } catch (error) {
      // Reject all promises
      batch.requests.forEach(item => {
        item.reject(error);
      });
    }
  }

  // Execute batch of requests
  async executeBatchRequests(requests) {
    // This would implement actual batch execution
    // For now, execute them in parallel
    return Promise.all(requests);
  }
}

// Global connection pools
export const httpPool = new HTTPConnectionPool({
  maxConnections: 20,
  maxConcurrentRequests: 10,
  requestTimeout: 30000,
  retryAttempts: 3
});

export const dbPool = new DatabaseConnectionPool({
  maxConnections: 8,
  connectionTimeout: 10000,
  idleTimeout: 300000
});

export const requestBatcher = new RequestBatcher({
  batchSize: 5,
  batchTimeout: 150,
  maxWaitTime: 1000
});

// Initialize connection pools
export const initializeConnectionPools = () => {
  // Setup database pool cleanup
  dbPool.setupCleanup();

  // Setup HTTP pool health checks
  httpPool.setupHealthChecks();

  console.log('🔗 Connection pools initialized');
};

// Pool monitoring utilities  
export const poolMonitoring = {
  // Get all pool statistics
  getAllStats: () => ({
    http: httpPool.getStats(),
    database: dbPool.getStats(),
    batches: {
      activeBatches: requestBatcher.batches.size
    }
  }),

  // Log pool statistics
  logStats: () => {
    const stats = poolMonitoring.getAllStats();
    console.table(stats);
  },

  // Setup periodic monitoring
  startMonitoring: (interval = 60000) => {
    setInterval(() => {
      poolMonitoring.logStats();
    }, interval);
  }
};

export default {
  HTTPConnectionPool,
  DatabaseConnectionPool,
  RequestBatcher,
  httpPool,
  dbPool,
  requestBatcher,
  initializeConnectionPools,
  poolMonitoring
};