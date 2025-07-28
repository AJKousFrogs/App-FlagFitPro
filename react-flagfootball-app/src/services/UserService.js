class UserService {
  constructor() {
    this.baseUrl = '/api/user';
  }

  // Get user profile
  async getUserProfile(token) {
    try {
      const response = await fetch(`${this.baseUrl}/profile`, {
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
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  // Update user profile
  async updateUserProfile(profileData, token) {
    try {
      const response = await fetch(`${this.baseUrl}/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Get user settings
  async getUserSettings(token) {
    try {
      const response = await fetch(`${this.baseUrl}/settings`, {
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
      console.error('Error fetching user settings:', error);
      throw error;
    }
  }

  // Update user settings
  async updateUserSettings(settings, token) {
    try {
      const response = await fetch(`${this.baseUrl}/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  }

  // Export user data
  async exportUserData(token) {
    try {
      const response = await fetch(`${this.baseUrl}/export`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.blob();
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw error;
    }
  }

  // Create backup
  async createBackup(token) {
    try {
      const response = await fetch(`${this.baseUrl}/backup`, {
        method: 'POST',
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
      console.error('Error creating backup:', error);
      throw error;
    }
  }

  // Get backup list
  async getBackups(token) {
    try {
      const response = await fetch(`${this.baseUrl}/backups`, {
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
      console.error('Error fetching backups:', error);
      throw error;
    }
  }

  // Restore from backup
  async restoreFromBackup(backupId, token) {
    try {
      const response = await fetch(`${this.baseUrl}/backup/${backupId}/restore`, {
        method: 'POST',
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
      console.error('Error restoring from backup:', error);
      throw error;
    }
  }

  // Delete backup
  async deleteBackup(backupId, token) {
    try {
      const response = await fetch(`${this.baseUrl}/backup/${backupId}`, {
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
      console.error('Error deleting backup:', error);
      throw error;
    }
  }

  // Get sync status
  async getSyncStatus(token) {
    try {
      const response = await fetch(`${this.baseUrl}/sync-status`, {
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
      console.error('Error fetching sync status:', error);
      throw error;
    }
  }

  // Force sync
  async forceSync(token) {
    try {
      const response = await fetch(`${this.baseUrl}/force-sync`, {
        method: 'POST',
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
      console.error('Error forcing sync:', error);
      throw error;
    }
  }

  // Get accessibility settings
  async getAccessibilitySettings(token) {
    try {
      const response = await fetch(`${this.baseUrl}/accessibility-settings`, {
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
      console.error('Error fetching accessibility settings:', error);
      throw error;
    }
  }

  // Update accessibility settings
  async updateAccessibilitySettings(settings, token) {
    try {
      const response = await fetch(`${this.baseUrl}/accessibility-settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settings })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating accessibility settings:', error);
      throw error;
    }
  }
}

export default new UserService(); 