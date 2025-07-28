class SearchService {
  constructor() {
    this.baseUrl = '/api/search';
  }

  // Perform search
  async performSearch(query, token) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error performing search:', error);
      throw error;
    }
  }

  // Get recent searches
  async getRecentSearches(token) {
    try {
      const response = await fetch(`${this.baseUrl}/recent`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching recent searches:', error);
      throw error;
    }
  }

  // Save recent search
  async saveRecentSearch(query, token) {
    try {
      const response = await fetch(`${this.baseUrl}/recent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error saving recent search:', error);
      throw error;
    }
  }

  // Get quick actions
  async getQuickActions(token) {
    try {
      const response = await fetch(`${this.baseUrl}/quick-actions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching quick actions:', error);
      throw error;
    }
  }

  // Execute quick action
  async executeQuickAction(actionId, token) {
    try {
      const response = await fetch(`${this.baseUrl}/quick-action`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: actionId })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error executing quick action:', error);
      throw error;
    }
  }

  // Get search suggestions
  async getSearchSuggestions(query, token) {
    try {
      const response = await fetch(`${this.baseUrl}/suggestions?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching search suggestions:', error);
      throw error;
    }
  }

  // Get search analytics
  async getSearchAnalytics(token) {
    try {
      const response = await fetch(`${this.baseUrl}/analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching search analytics:', error);
      throw error;
    }
  }

  // Clear search history
  async clearSearchHistory(token) {
    try {
      const response = await fetch(`${this.baseUrl}/recent`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error clearing search history:', error);
      throw error;
    }
  }
}

export default new SearchService(); 