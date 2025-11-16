/**
 * Database Connection Manager
 * Handles connections to different database systems (Neon PostgreSQL, PocketBase, etc.)
 */

import { config } from '../config/environment.js';
import { logger } from '../logger.js';

class DatabaseConnection {
  constructor() {
    this.neonConnection = null;
    this.pocketbaseConnection = null;
    this.isConnected = false;
    this.connectionStatus = {
      neon: false,
      pocketbase: false,
    };
  }

  /**
   * Initialize database connections
   */
  async initialize() {
    try {
      logger.debug('Initializing database connections...');
      
      // Initialize Neon PostgreSQL connection if configured
      if (config.NEON_DATABASE_URL) {
        await this.initializeNeonConnection();
      }

      // Initialize PocketBase connection if configured
      if (config.POCKETBASE_URL) {
        await this.initializePocketBaseConnection();
      }

      // Check if at least one connection is available
      this.isConnected = this.connectionStatus.neon || this.connectionStatus.pocketbase;

      if (this.isConnected) {
        logger.success('Database connections initialized successfully');
      } else {
        logger.warn('No database connections available - using fallback storage');
      }

      return this.isConnected;
    } catch (error) {
      logger.error('Failed to initialize database connections:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Initialize Neon PostgreSQL connection
   */
  async initializeNeonConnection() {
    try {
      // In a browser environment, we can't directly connect to PostgreSQL
      // This would typically be handled by a backend API
      logger.debug('Configuring Neon PostgreSQL connection...');
      
      // Validate connection URL format
      if (!this.validateNeonUrl(config.NEON_DATABASE_URL)) {
        throw new Error('Invalid Neon database URL format');
      }

      // Store configuration for API calls
      this.neonConnection = {
        url: config.NEON_DATABASE_URL,
        configured: true,
        lastPing: null,
      };

      // Test connection via API endpoint
      const pingResult = await this.pingNeonDatabase();
      
      if (pingResult) {
        this.connectionStatus.neon = true;
        logger.success('Neon PostgreSQL connection verified');
      } else {
        throw new Error('Neon database ping failed');
      }
    } catch (error) {
      logger.error('Failed to initialize Neon connection:', error);
      this.connectionStatus.neon = false;
    }
  }

  /**
   * Initialize PocketBase connection
   */
  async initializePocketBaseConnection() {
    try {
      logger.debug('Initializing PocketBase connection...');
      
      // Import PocketBase SDK if available
      if (typeof window !== 'undefined' && window.PocketBase) {
        this.pocketbaseConnection = new window.PocketBase(config.POCKETBASE_URL);
      } else {
        // Dynamic import for PocketBase
        const { default: PocketBase } = await import('pocketbase');
        this.pocketbaseConnection = new PocketBase(config.POCKETBASE_URL);
      }

      // Test connection
      const health = await this.pocketbaseConnection.health.check();
      
      if (health.status === 'OK') {
        this.connectionStatus.pocketbase = true;
        logger.success('PocketBase connection established');
      } else {
        throw new Error('PocketBase health check failed');
      }
    } catch (error) {
      logger.error('Failed to initialize PocketBase connection:', error);
      this.connectionStatus.pocketbase = false;
      
      // Fallback to REST API calls
      this.pocketbaseConnection = {
        url: config.POCKETBASE_URL,
        restFallback: true,
      };
    }
  }

  /**
   * Validate Neon database URL format
   */
  validateNeonUrl(url) {
    if (!url || typeof url !== 'string') {
      return false;
    }
    
    // Basic validation for PostgreSQL connection string
    const pgRegex = /^postgres(ql)?:\/\/[^:]+:[^@]+@[^:]+:\d+\/[^?]+(\?.*)?$/i;
    return pgRegex.test(url);
  }

  /**
   * Ping Neon database via API
   */
  async pingNeonDatabase() {
    try {
      const response = await fetch('/api/database/ping', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.neonConnection.lastPing = new Date().toISOString();
        return data.success;
      }
      
      return false;
    } catch (error) {
      logger.error('Database ping failed:', error);
      return false;
    }
  }

  /**
   * Execute query on Neon database
   */
  async executeNeonQuery(query, params = []) {
    if (!this.connectionStatus.neon) {
      throw new Error('Neon database connection not available');
    }

    try {
      const response = await fetch('/api/database/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          query,
          params,
        }),
      });

      if (!response.ok) {
        throw new Error(`Query failed with status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Failed to execute Neon query:', error);
      throw error;
    }
  }

  /**
   * Insert analytics event
   */
  async insertAnalyticsEvent(eventData) {
    if (this.connectionStatus.neon) {
      return this.insertAnalyticsEventNeon(eventData);
    } else if (this.connectionStatus.pocketbase) {
      return this.insertAnalyticsEventPocketBase(eventData);
    } else {
      // Fallback to localStorage for offline functionality
      return this.insertAnalyticsEventLocal(eventData);
    }
  }

  /**
   * Insert analytics event to Neon PostgreSQL
   */
  async insertAnalyticsEventNeon(eventData) {
    const query = `
      INSERT INTO analytics_events 
      (user_id, event_type, event_data, session_id, page_url, user_agent, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING id;
    `;
    
    const params = [
      eventData.user_id,
      eventData.event_type,
      JSON.stringify(eventData.event_data),
      eventData.session_id,
      eventData.page_url,
      eventData.user_agent,
    ];

    return this.executeNeonQuery(query, params);
  }

  /**
   * Insert analytics event to PocketBase
   */
  async insertAnalyticsEventPocketBase(eventData) {
    try {
      if (this.pocketbaseConnection.restFallback) {
        // Use REST API fallback
        const response = await fetch(`${config.POCKETBASE_URL}/api/collections/analytics_events/records`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
        });

        return await response.json();
      } else {
        // Use PocketBase SDK
        return await this.pocketbaseConnection.collection('analytics_events').create(eventData);
      }
    } catch (error) {
      logger.error('Failed to insert analytics event to PocketBase:', error);
      throw error;
    }
  }

  /**
   * Insert analytics event to localStorage (fallback)
   */
  async insertAnalyticsEventLocal(eventData) {
    try {
      const key = 'flagfit_analytics_events';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      
      const event = {
        ...eventData,
        id: Date.now() + Math.random(),
        created_at: new Date().toISOString(),
      };

      existing.push(event);
      
      // Keep only last 1000 events to prevent storage overflow
      if (existing.length > 1000) {
        existing.splice(0, existing.length - 1000);
      }

      localStorage.setItem(key, JSON.stringify(existing));
      
      logger.debug('Analytics event stored locally:', event.event_type);
      return { success: true, id: event.id };
    } catch (error) {
      logger.error('Failed to store analytics event locally:', error);
      throw error;
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      connections: this.connectionStatus,
      primary: this.connectionStatus.neon ? 'neon' : 
               this.connectionStatus.pocketbase ? 'pocketbase' : 'local',
    };
  }

  /**
   * Close all connections
   */
  async disconnect() {
    try {
      if (this.pocketbaseConnection && !this.pocketbaseConnection.restFallback) {
        // PocketBase doesn't require explicit disconnect
        logger.debug('PocketBase connection closed');
      }

      this.neonConnection = null;
      this.pocketbaseConnection = null;
      this.isConnected = false;
      this.connectionStatus = { neon: false, pocketbase: false };

      logger.debug('All database connections closed');
    } catch (error) {
      logger.error('Error closing database connections:', error);
    }
  }
}

// Export singleton instance
export const dbConnection = new DatabaseConnection();

// Auto-initialize in browser environment
if (typeof window !== 'undefined') {
  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    dbConnection.initialize().catch(error => {
      logger.error('Failed to auto-initialize database connections:', error);
    });
  });
}

export default dbConnection;