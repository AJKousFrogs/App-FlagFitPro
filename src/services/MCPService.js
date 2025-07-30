/**
 * MCP Service - Handles Model Context Protocol integrations
 * Manages Context7 and Sequential Thought server connections
 */

class MCPService {
  constructor() {
    this.servers = {
      context7: {
        url: `http://localhost:${process.env.MCP_CONTEXT7_PORT || 3000}`,
        connected: false,
        capabilities: ['resolve-library-id', 'get-library-docs']
      },
      sequentialThought: {
        url: `http://localhost:${process.env.MCP_SEQUENTIAL_THOUGHT_PORT || 3001}`,
        connected: false,
        capabilities: ['sequentialthinking']
      }
    };
    
    this.cache = new Map();
    this.cacheTimeout = 3600000; // 1 hour
  }

  // Initialize MCP connections
  async initialize() {
    console.log('🔌 Initializing MCP Service...');
    
    try {
      // Check if MCP servers are available
      const healthChecks = await Promise.allSettled([
        this.checkServerHealth('context7'),
        this.checkServerHealth('sequentialThought')
      ]);

      healthChecks.forEach((result, index) => {
        const serverName = index === 0 ? 'context7' : 'sequentialThought';
        if (result.status === 'fulfilled') {
          this.servers[serverName].connected = true;
          console.log(`✅ ${serverName} server connected`);
        } else {
          console.warn(`⚠️  ${serverName} server not available:`, result.reason);
        }
      });

      return this.getConnectionStatus();
    } catch (error) {
      console.error('❌ MCP Service initialization failed:', error);
      return { connected: false, error: error.message };
    }
  }

  // Check server health
  async checkServerHealth(serverName) {
    const server = this.servers[serverName];
    
    try {
      const response = await fetch(`${server.url}/health`, {
        method: 'GET',
        timeout: 5000
      });
      
      if (response.ok) {
        return { server: serverName, status: 'healthy' };
      }
      throw new Error(`Server returned ${response.status}`);
    } catch (error) {
      throw new Error(`${serverName} health check failed: ${error.message}`);
    }
  }

  // Get connection status
  getConnectionStatus() {
    const context7Connected = this.servers.context7.connected;
    const sequentialThoughtConnected = this.servers.sequentialThought.connected;
    
    return {
      connected: context7Connected || sequentialThoughtConnected,
      servers: {
        context7: context7Connected,
        sequentialThought: sequentialThoughtConnected
      },
      capabilities: this.getAvailableCapabilities()
    };
  }

  // Get available capabilities
  getAvailableCapabilities() {
    const capabilities = [];
    
    Object.entries(this.servers).forEach(([name, server]) => {
      if (server.connected) {
        capabilities.push(...server.capabilities);
      }
    });
    
    return capabilities;
  }

  // Context7 Methods
  
  /**
   * Resolve library ID for Context7 documentation lookup
   * @param {string} libraryName - Package or library name
   * @returns {Promise<string>} Context7-compatible library ID
   */
  async resolveLibraryId(libraryName) {
    if (!this.servers.context7.connected) {
      throw new Error('Context7 server not available');
    }

    const cacheKey = `resolve-${libraryName}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${this.servers.context7.url}/resolve-library-id`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ libraryName })
      });

      if (!response.ok) {
        throw new Error(`Failed to resolve library ID: ${response.statusText}`);
      }

      const data = await response.json();
      this.setCache(cacheKey, data.libraryId);
      
      return data.libraryId;
    } catch (error) {
      console.error('Error resolving library ID:', error);
      throw error;
    }
  }

  /**
   * Get library documentation from Context7
   * @param {string} libraryId - Context7-compatible library ID
   * @returns {Promise<Object>} Documentation data
   */
  async getLibraryDocs(libraryId) {
    if (!this.servers.context7.connected) {
      throw new Error('Context7 server not available');
    }

    const cacheKey = `docs-${libraryId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${this.servers.context7.url}/get-library-docs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ libraryId })
      });

      if (!response.ok) {
        throw new Error(`Failed to get library docs: ${response.statusText}`);
      }

      const data = await response.json();
      this.setCache(cacheKey, data);
      
      return data;
    } catch (error) {
      console.error('Error getting library docs:', error);
      throw error;
    }
  }

  /**
   * Search sports science documentation
   * @param {string} query - Search query
   * @param {string} category - Category filter (nutrition, training, recovery, etc.)
   * @returns {Promise<Array>} Search results
   */
  async searchSportsScience(query, category = '') {
    try {
      // First resolve common sports science library IDs
      const libraryMappings = {
        'nutrition': 'sports-nutrition-science-2025',
        'training': 'athletic-training-methods-2025', 
        'recovery': 'recovery-science-protocols-2025',
        'psychology': 'sport-psychology-research-2025',
        'biomechanics': 'biomechanics-analysis-2025'
      };

      const libraryId = category ? libraryMappings[category] : 'general-sports-science-2025';
      
      if (!libraryId) {
        // Try to resolve the category as a library name
        const resolvedId = await this.resolveLibraryId(category);
        return await this.getLibraryDocs(resolvedId);
      }

      const docs = await this.getLibraryDocs(libraryId);
      
      // Filter docs based on query
      if (query && docs.content) {
        docs.filteredContent = docs.content.filter(item => 
          item.title?.toLowerCase().includes(query.toLowerCase()) ||
          item.description?.toLowerCase().includes(query.toLowerCase()) ||
          item.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        );
      }

      return docs;
    } catch (error) {
      console.error('Error searching sports science:', error);
      return { error: error.message, fallback: true };
    }
  }

  // Sequential Thought Methods

  /**
   * Perform sequential thinking analysis
   * @param {Object} params - Analysis parameters
   * @returns {Promise<Object>} Reasoning chain result
   */
  async sequentialThinking(params) {
    if (!this.servers.sequentialThought.connected) {
      throw new Error('Sequential Thought server not available');
    }

    try {
      const response = await fetch(`${this.servers.sequentialThought.url}/sequentialthinking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error(`Sequential thinking failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in sequential thinking:', error);
      throw error;
    }
  }

  // Cache Management

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.cache.clear();
  }

  // Utility Methods

  /**
   * Get MCP service status for debugging
   */
  getStatus() {
    return {
      servers: this.servers,
      cache: {
        size: this.cache.size,
        keys: Array.from(this.cache.keys())
      },
      capabilities: this.getAvailableCapabilities()
    };
  }
}

// Create singleton instance
const mcpService = new MCPService();

export { mcpService };
export default mcpService;