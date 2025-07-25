/**
 * Database Connection Management Service
 * Provides enhanced database connection handling and monitoring
 */

// Removed direct import - will use dynamic import when needed
// Removed direct import - will use dynamic import when needed
// Removed direct import - will use dynamic import when needed


class DatabaseService {
  constructor() {
    this.pocketbase = pocketbaseService;
    this.connectionState = {
      isConnected: false,
      lastPing: null,
      consecutiveFailures: 0,
      lastError: null,
      reconnectAttempts: 0
    };

    this.config = {
      pingInterval: 30000,        // 30 seconds
      maxReconnectAttempts: 10,
      reconnectDelay: 5000,       // 5 seconds
      healthCheckInterval: 60000, // 1 minute
      connectionTimeout: 10000,   // 10 seconds
      retryBackoffFactor: 1.5,
      maxRetryDelay: 60000,       // 1 minute
      queryTimeout: 30000,        // 30 seconds
      maxConcurrentQueries: 50,
      connectionPoolSize: 10,
      idleTimeout: 300000,        // 5 minutes
      enabled: true
    };

    this.eventListeners = new Map();
    this.retryQueue = [];
    this.isReconnecting = false;
    this.activeQueries = new Map();
    this.queryCounter = 0;
    this.connectionPool = new Set();
    this.lastActivity = Date.now();

    if (this.config.enabled) {
      this.initialize();
    }
  }

  async initialize() {
    try {
      logger.info('Initializing database service');
      
      // Setup connection monitoring
      this.setupConnectionMonitoring();
      
      // Initial connection check
      await this.checkConnection();
      
      // Setup health monitoring
      this.setupHealthMonitoring();
      
      // Setup retry queue processing
      this.setupRetryQueue();
      
      // Setup connection pool management
      this.setupConnectionPool();
      
      // Setup query monitoring
      this.setupQueryMonitoring();

      logger.info('Database service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize database service', { error: error.message });
      sentryService.captureException(error, { 
        database: { operation: 'initialize' } 
      });
    }
  }

  setupConnectionMonitoring() {
    // Periodic ping to check connection
    setInterval(async () => {
      await this.pingDatabase();
    }, this.config.pingInterval);

    // Monitor authentication state changes
    this.pocketbase.authStore.onChange(() => {
      logger.debug('Auth state changed', {
        isValid: this.pocketbase.authStore.isValid,
        userId: this.pocketbase.authStore.model?.id
      });
    });
  }

  setupHealthMonitoring() {
    setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }

  setupRetryQueue() {
    setInterval(() => {
      this.processRetryQueue();
    }, 5000); // Process retry queue every 5 seconds
  }

  setupConnectionPool() {
    // Initialize connection pool
    for (let i = 0; i < this.config.connectionPoolSize; i++) {
      this.connectionPool.add({
        id: i,
        inUse: false,
        lastUsed: Date.now(),
        connection: null
      });
    }

    // Clean up idle connections periodically
    setInterval(() => {
      this.cleanupIdleConnections();
    }, 60000); // Check every minute
  }

  setupQueryMonitoring() {
    // Monitor active queries and timeout handling
    setInterval(() => {
      this.checkQueryTimeouts();
    }, 5000); // Check every 5 seconds

    // Track connection activity
    setInterval(() => {
      this.updateConnectionActivity();
    }, 30000); // Update every 30 seconds
  }

  cleanupIdleConnections() {
    const now = Date.now();
    for (const conn of this.connectionPool) {
      if (!conn.inUse && (now - conn.lastUsed) > this.config.idleTimeout) {
        if (conn.connection) {
          // Close idle connection
          conn.connection = null;
          logger.debug('Closed idle database connection', { connectionId: conn.id });
        }
      }
    }
  }

  checkQueryTimeouts() {
    const now = Date.now();
    const timeoutThreshold = this.config.queryTimeout;

    for (const [queryId, query] of this.activeQueries) {
      if ((now - query.startTime) > timeoutThreshold) {
        logger.warn('Query timeout detected', {
          queryId,
          duration: now - query.startTime,
          operation: query.operation
        });

        // Cancel the query
        if (query.abortController) {
          query.abortController.abort();
        }

        this.activeQueries.delete(queryId);
        
        sentryService.captureMessage('Database query timeout', 'warning', {
          database: {
            queryId,
            operation: query.operation,
            duration: now - query.startTime
          }
        });
      }
    }
  }

  updateConnectionActivity() {
    this.lastActivity = Date.now();
    
    // Log connection pool status
    const poolStatus = Array.from(this.connectionPool).reduce((acc, conn) => {
      acc[conn.inUse ? 'active' : 'idle']++;
      return acc;
    }, { active: 0, idle: 0 });

    logger.debug('Connection pool status', {
      ...poolStatus,
      activeQueries: this.activeQueries.size,
      totalConnections: this.connectionPool.size
    });
  }

  async checkConnection() {
    try {
      const startTime = performance.now();
      
      // Try to fetch a simple health check
      await this.executeWithTimeout(
        () => this.pocketbase.pb.health(),
        this.config.connectionTimeout
      );

      const duration = performance.now() - startTime;
      
      this.updateConnectionState(true, null, duration);
      
      logger.debug('Database connection check successful', { duration });
      return true;

    } catch (error) {
      this.updateConnectionState(false, error.message);
      logger.warn('Database connection check failed', { error: error.message });
      return false;
    }
  }

  async pingDatabase() {
    try {
      const isConnected = await this.checkConnection();
      
      if (!isConnected && this.connectionState.isConnected) {
        // Connection lost
        this.handleConnectionLoss();
      } else if (isConnected && !this.connectionState.isConnected) {
        // Connection restored
        this.handleConnectionRestore();
      }

      return isConnected;
    } catch (error) {
      logger.error('Database ping failed', { error: error.message });
      return false;
    }
  }

  updateConnectionState(isConnected, error = null, responseTime = null) {
    const previousState = this.connectionState.isConnected;
    
    this.connectionState = {
      ...this.connectionState,
      isConnected,
      lastPing: new Date().toISOString(),
      lastError: error,
      consecutiveFailures: isConnected ? 0 : this.connectionState.consecutiveFailures + 1,
      responseTime
    };

    // Emit connection state change event
    if (previousState !== isConnected) {
      this.emitEvent('connectionStateChange', {
        isConnected,
        previousState,
        error,
        timestamp: this.connectionState.lastPing
      });
    }
  }

  handleConnectionLoss() {
    logger.warn('Database connection lost', {
      consecutiveFailures: this.connectionState.consecutiveFailures,
      lastError: this.connectionState.lastError
    });

    sentryService.captureMessage('Database connection lost', 'warning', {
      database: {
        consecutiveFailures: this.connectionState.consecutiveFailures,
        lastError: this.connectionState.lastError
      }
    });

    this.emitEvent('connectionLost', this.connectionState);
    
    // Start reconnection attempts
    if (!this.isReconnecting) {
      this.startReconnection();
    }
  }

  handleConnectionRestore() {
    logger.info('Database connection restored', {
      downtime: this.connectionState.lastPing,
      reconnectAttempts: this.connectionState.reconnectAttempts
    });

    sentryService.captureMessage('Database connection restored', 'info', {
      database: {
        downtime: this.connectionState.lastPing,
        reconnectAttempts: this.connectionState.reconnectAttempts
      }
    });

    this.connectionState.reconnectAttempts = 0;
    this.isReconnecting = false;
    
    this.emitEvent('connectionRestored', this.connectionState);
    
    // Process any queued operations
    this.processRetryQueue();
  }

  async startReconnection() {
    if (this.isReconnecting) return;
    
    this.isReconnecting = true;
    
    while (this.connectionState.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.connectionState.reconnectAttempts++;
      
      logger.info('Attempting database reconnection', {
        attempt: this.connectionState.reconnectAttempts,
        maxAttempts: this.config.maxReconnectAttempts
      });

      const connected = await this.checkConnection();
      
      if (connected) {
        this.handleConnectionRestore();
        return;
      }

      // Calculate backoff delay
      const delay = Math.min(
        this.config.reconnectDelay * Math.pow(this.config.retryBackoffFactor, this.connectionState.reconnectAttempts - 1),
        this.config.maxRetryDelay
      );

      logger.debug('Waiting before next reconnection attempt', { delay });
      await this.sleep(delay);
    }

    // Max reconnection attempts reached
    logger.error('Max database reconnection attempts reached', {
      maxAttempts: this.config.maxReconnectAttempts
    });

    this.isReconnecting = false;
    
    sentryService.captureMessage('Database reconnection failed', 'error', {
      database: {
        maxAttempts: this.config.maxReconnectAttempts,
        lastError: this.connectionState.lastError
      }
    });

    this.emitEvent('reconnectionFailed', this.connectionState);
  }

  async performHealthCheck() {
    try {
      const startTime = performance.now();
      
      // Perform various health checks
      const checks = await Promise.allSettled([
        this.checkDatabaseAccess(),
        this.checkAuthenticationHealth(),
        this.checkCollectionAccess()
      ]);

      const duration = performance.now() - startTime;
      
      const healthStatus = {
        overall: 'healthy',
        checks: {
          database: checks[0].status === 'fulfilled' ? 'healthy' : 'unhealthy',
          authentication: checks[1].status === 'fulfilled' ? 'healthy' : 'unhealthy',
          collections: checks[2].status === 'fulfilled' ? 'healthy' : 'unhealthy'
        },
        duration,
        timestamp: new Date().toISOString()
      };

      // Determine overall health
      const unhealthyChecks = Object.values(healthStatus.checks).filter(status => status === 'unhealthy');
      if (unhealthyChecks.length > 0) {
        healthStatus.overall = unhealthyChecks.length === Object.keys(healthStatus.checks).length ? 'unhealthy' : 'degraded';
      }

      this.emitEvent('healthCheck', healthStatus);
      
      logger.debug('Database health check completed', healthStatus);
      
      return healthStatus;
    } catch (error) {
      logger.error('Database health check failed', { error: error.message });
      return {
        overall: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async checkDatabaseAccess() {
    return await this.executeWithTimeout(
      () => this.pocketbase.pb.health(),
      5000
    );
  }

  async checkAuthenticationHealth() {
    if (this.pocketbase.authStore.isValid) {
      // Try to refresh auth to check if it's still valid
      return await this.executeWithTimeout(
        () => this.pocketbase.pb.collection('users').authRefresh(),
        5000
      );
    }
    return { status: 'no_auth' };
  }

  async checkCollectionAccess() {
    // Test access to a known collection
    return await this.executeWithTimeout(
      () => this.pocketbase.pb.collection('users').getList(1, 1),
      5000
    );
  }

  async executeWithRetry(operation, options = {}) {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      backoffFactor = 2,
      retryCondition = (error) => error.status >= 500 || error.code === 'NETWORK_ERROR',
      operationName = 'unknown'
    } = options;

    // Check query limits
    if (this.activeQueries.size >= this.config.maxConcurrentQueries) {
      throw new Error('Maximum concurrent queries exceeded');
    }

    const queryId = ++this.queryCounter;
    const abortController = new AbortController();
    
    // Track the query
    this.activeQueries.set(queryId, {
      operation: operationName,
      startTime: Date.now(),
      abortController
    });

    let lastError;
    
    try {
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          // Wrap operation with timeout
          const result = await this.executeWithTimeout(operation, this.config.queryTimeout, abortController.signal);
          
          // Query successful, remove from tracking
          this.activeQueries.delete(queryId);
          
          logger.debug('Database operation completed', {
            queryId,
            operation: operationName,
            attempt: attempt + 1,
            duration: Date.now() - this.activeQueries.get(queryId)?.startTime || 0
          });
          
          return result;
        } catch (error) {
          lastError = error;
          
          // Don't retry if condition not met or max retries reached or operation was aborted
          if (!retryCondition(error) || attempt === maxRetries || error.name === 'AbortError') {
            break;
          }

          const delay = retryDelay * Math.pow(backoffFactor, attempt);
          logger.warn('Database operation failed, retrying', {
            queryId,
            operation: operationName,
            attempt: attempt + 1,
            maxRetries,
            delay,
            error: error.message
          });

          await this.sleep(delay);
        }
      }

      // Add to retry queue if connection is lost
      if (!this.connectionState.isConnected && lastError.name !== 'AbortError') {
        this.addToRetryQueue(operation, { ...options, operationName });
      }

      throw lastError;
    } finally {
      // Clean up tracking
      this.activeQueries.delete(queryId);
    }
  }

  addToRetryQueue(operation, options = {}) {
    const queueItem = {
      operation,
      options,
      attempts: 0,
      addedAt: Date.now(),
      maxAge: options.maxAge || 5 * 60 * 1000 // 5 minutes
    };

    this.retryQueue.push(queueItem);
    
    // Limit queue size
    if (this.retryQueue.length > 100) {
      this.retryQueue.shift();
    }

    logger.debug('Added operation to retry queue', {
      queueSize: this.retryQueue.length
    });
  }

  async processRetryQueue() {
    if (!this.connectionState.isConnected || this.retryQueue.length === 0) {
      return;
    }

    const now = Date.now();
    const itemsToRetry = this.retryQueue.filter(item => 
      now - item.addedAt < item.maxAge
    );

    // Remove expired items
    this.retryQueue = itemsToRetry;

    logger.debug('Processing retry queue', {
      queueSize: this.retryQueue.length
    });

    for (const item of itemsToRetry.slice(0, 5)) { // Process max 5 items at once
      try {
        await item.operation();
        
        // Remove successful item from queue
        const index = this.retryQueue.indexOf(item);
        if (index > -1) {
          this.retryQueue.splice(index, 1);
        }

        logger.debug('Retry queue item processed successfully');
      } catch (error) {
        item.attempts++;
        
        if (item.attempts >= 3) {
          // Remove failed item after 3 attempts
          const index = this.retryQueue.indexOf(item);
          if (index > -1) {
            this.retryQueue.splice(index, 1);
          }
          
          logger.warn('Retry queue item failed after max attempts', {
            error: error.message,
            attempts: item.attempts
          });
        }
      }
    }
  }

  async executeWithTimeout(operation, timeout = 10000, signal = null) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Operation timed out'));
      }, timeout);

      // Handle abort signal
      if (signal) {
        signal.addEventListener('abort', () => {
          clearTimeout(timer);
          reject(new Error('Operation aborted'));
        });
      }

      operation()
        .then(resolve)
        .catch(reject)
        .finally(() => clearTimeout(timer));
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Event system
  on(event, listener) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(listener);
  }

  off(event, listener) {
    if (!this.eventListeners.has(event)) return;
    
    const listeners = this.eventListeners.get(event);
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  emitEvent(event, data) {
    if (!this.eventListeners.has(event)) return;
    
    this.eventListeners.get(event).forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        logger.error('Event listener error', {
          event,
          error: error.message
        });
      }
    });
  }

  // Public methods
  getConnectionState() {
    return { ...this.connectionState };
  }

  getRetryQueueSize() {
    return this.retryQueue.length;
  }

  async forceReconnect() {
    logger.info('Force reconnection requested');
    this.connectionState.isConnected = false;
    this.connectionState.reconnectAttempts = 0;
    return await this.startReconnection();
  }

  clearRetryQueue() {
    const queueSize = this.retryQueue.length;
    this.retryQueue = [];
    logger.info('Retry queue cleared', { queueSize });
  }

  getHealthMetrics() {
    const poolStatus = Array.from(this.connectionPool).reduce((acc, conn) => {
      acc[conn.inUse ? 'active' : 'idle']++;
      return acc;
    }, { active: 0, idle: 0 });

    return {
      connection: this.connectionState,
      retryQueue: {
        size: this.retryQueue.length,
        oldestItem: this.retryQueue.length > 0 ? 
          new Date(this.retryQueue[0].addedAt).toISOString() : null
      },
      connectionPool: {
        total: this.connectionPool.size,
        active: poolStatus.active,
        idle: poolStatus.idle,
        utilization: `${(poolStatus.active / this.connectionPool.size * 100).toFixed(2)  }%`
      },
      queries: {
        active: this.activeQueries.size,
        total: this.queryCounter,
        maxConcurrent: this.config.maxConcurrentQueries
      },
      performance: {
        lastActivity: new Date(this.lastActivity).toISOString(),
        queryTimeout: this.config.queryTimeout,
        idleTimeout: this.config.idleTimeout
      },
      config: this.config
    };
  }

  async getConnectionFromPool() {
    const availableConnection = Array.from(this.connectionPool)
      .find(conn => !conn.inUse);
    
    if (availableConnection) {
      availableConnection.inUse = true;
      availableConnection.lastUsed = Date.now();
      return availableConnection;
    }
    
    throw new Error('No available connections in pool');
  }

  releaseConnection(connection) {
    if (connection) {
      connection.inUse = false;
      connection.lastUsed = Date.now();
    }
  }

  async executeQuery(queryFn, operationName = 'query') {
    return this.executeWithRetry(queryFn, { operationName });
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();
export default databaseService;