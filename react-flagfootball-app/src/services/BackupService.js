import { useAuth } from '../contexts/AuthContext';

class BackupService {
  constructor() {
    this.baseUrl = '/api/backup';
    this.storageKey = 'flagfit-backups';
  }

  async createBackup(options = {}) {
    const {
      onProgress = () => {},
      includeSettings = true,
      includeData = true,
      includeMedia = false
    } = options;

    try {
      onProgress(10);

      // Collect user data
      const userData = await this.collectUserData({
        includeSettings,
        includeData,
        includeMedia
      });

      onProgress(50);

      // Create backup object
      const backup = {
        id: this.generateBackupId(),
        type: 'manual',
        createdAt: new Date().toISOString(),
        size: JSON.stringify(userData).length,
        itemCount: this.countItems(userData),
        data: userData,
        version: '1.0.0'
      };

      onProgress(80);

      // Save backup
      await this.saveBackup(backup);

      onProgress(100);

      return backup;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw new Error('Failed to create backup: ' + error.message);
    }
  }

  async listBackups() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return [];

      const backups = JSON.parse(stored);
      return backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      console.error('Error listing backups:', error);
      return [];
    }
  }

  async restoreFromBackup(backupId, options = {}) {
    const { onProgress = () => {} } = options;

    try {
      onProgress(10);

      // Get backup
      const backup = await this.getBackup(backupId);
      if (!backup) {
        throw new Error('Backup not found');
      }

      onProgress(30);

      // Validate backup data
      if (!this.validateBackup(backup)) {
        throw new Error('Invalid backup data');
      }

      onProgress(50);

      // Restore data
      await this.restoreData(backup.data);

      onProgress(80);

      // Update user preferences
      await this.updateUserPreferences(backup.data);

      onProgress(100);

      return true;
    } catch (error) {
      console.error('Error restoring backup:', error);
      throw new Error('Failed to restore backup: ' + error.message);
    }
  }

  async deleteBackup(backupId) {
    try {
      const backups = await this.listBackups();
      const filteredBackups = backups.filter(backup => backup.id !== backupId);
      
      localStorage.setItem(this.storageKey, JSON.stringify(filteredBackups));
      
      return true;
    } catch (error) {
      console.error('Error deleting backup:', error);
      throw new Error('Failed to delete backup: ' + error.message);
    }
  }

  async exportBackup(backupId) {
    try {
      const backup = await this.getBackup(backupId);
      if (!backup) {
        throw new Error('Backup not found');
      }

      return backup;
    } catch (error) {
      console.error('Error exporting backup:', error);
      throw new Error('Failed to export backup: ' + error.message);
    }
  }

  async importBackup(backupData) {
    try {
      // Validate imported backup
      if (!this.validateBackup(backupData)) {
        throw new Error('Invalid backup data');
      }

      // Generate new ID for imported backup
      const importedBackup = {
        ...backupData,
        id: this.generateBackupId(),
        importedAt: new Date().toISOString()
      };

      // Save imported backup
      await this.saveBackup(importedBackup);

      return importedBackup;
    } catch (error) {
      console.error('Error importing backup:', error);
      throw new Error('Failed to import backup: ' + error.message);
    }
  }

  // Helper methods
  async collectUserData(options) {
    const { includeSettings, includeData, includeMedia } = options;
    const userData = {};

    // Collect settings
    if (includeSettings) {
      userData.settings = {
        theme: localStorage.getItem('flagfit-theme') || 'light',
        language: localStorage.getItem('flagfit-language') || 'en',
        notifications: JSON.parse(localStorage.getItem('flagfit-notifications') || '{}'),
        accessibility: JSON.parse(localStorage.getItem('flagfit-accessibility') || '{}')
      };
    }

    // Collect user data
    if (includeData) {
      userData.userData = {
        profile: JSON.parse(localStorage.getItem('flagfit-profile') || '{}'),
        training: JSON.parse(localStorage.getItem('flagfit-training') || '[]'),
        nutrition: JSON.parse(localStorage.getItem('flagfit-nutrition') || '[]'),
        recovery: JSON.parse(localStorage.getItem('flagfit-recovery') || '[]'),
        measurements: JSON.parse(localStorage.getItem('flagfit-measurements') || '[]')
      };
    }

    // Collect media references (not actual files)
    if (includeMedia) {
      userData.media = {
        images: JSON.parse(localStorage.getItem('flagfit-images') || '[]'),
        videos: JSON.parse(localStorage.getItem('flagfit-videos') || '[]')
      };
    }

    return userData;
  }

  async restoreData(data) {
    // Restore settings
    if (data.settings) {
      Object.entries(data.settings).forEach(([key, value]) => {
        localStorage.setItem(`flagfit-${key}`, typeof value === 'string' ? value : JSON.stringify(value));
      });
    }

    // Restore user data
    if (data.userData) {
      Object.entries(data.userData).forEach(([key, value]) => {
        localStorage.setItem(`flagfit-${key}`, JSON.stringify(value));
      });
    }

    // Restore media references
    if (data.media) {
      Object.entries(data.media).forEach(([key, value]) => {
        localStorage.setItem(`flagfit-${key}`, JSON.stringify(value));
      });
    }
  }

  async updateUserPreferences(data) {
    // Update any user preferences that might have changed
    if (data.settings?.theme) {
      document.documentElement.setAttribute('data-theme', data.settings.theme);
    }
  }

  validateBackup(backup) {
    return backup && 
           backup.id && 
           backup.createdAt && 
           backup.data && 
           backup.version;
  }

  generateBackupId() {
    return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  countItems(data) {
    let count = 0;
    
    if (data.settings) count += Object.keys(data.settings).length;
    if (data.userData) {
      Object.values(data.userData).forEach(value => {
        if (Array.isArray(value)) {
          count += value.length;
        } else if (typeof value === 'object') {
          count += Object.keys(value).length;
        }
      });
    }
    if (data.media) {
      Object.values(data.media).forEach(value => {
        if (Array.isArray(value)) count += value.length;
      });
    }
    
    return count;
  }

  async getBackup(backupId) {
    const backups = await this.listBackups();
    return backups.find(backup => backup.id === backupId);
  }

  async saveBackup(backup) {
    const backups = await this.listBackups();
    backups.unshift(backup);
    
    // Keep only the last 10 backups
    const limitedBackups = backups.slice(0, 10);
    
    localStorage.setItem(this.storageKey, JSON.stringify(limitedBackups));
  }

  // Auto backup functionality
  async createAutoBackup() {
    try {
      const lastBackup = await this.getLastAutoBackup();
      const now = new Date();
      
      // Only create auto backup if 24 hours have passed since last one
      if (lastBackup) {
        const lastBackupDate = new Date(lastBackup.createdAt);
        const hoursSinceLastBackup = (now - lastBackupDate) / (1000 * 60 * 60);
        
        if (hoursSinceLastBackup < 24) {
          return null; // Skip auto backup
        }
      }

      return await this.createBackup({
        includeSettings: true,
        includeData: true,
        includeMedia: false
      });
    } catch (error) {
      console.error('Error creating auto backup:', error);
      return null;
    }
  }

  async getLastAutoBackup() {
    const backups = await this.listBackups();
    return backups.find(backup => backup.type === 'auto');
  }

  // Cleanup old backups
  async cleanupOldBackups(maxAge = 30) { // days
    try {
      const backups = await this.listBackups();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxAge);
      
      const validBackups = backups.filter(backup => 
        new Date(backup.createdAt) > cutoffDate
      );
      
      localStorage.setItem(this.storageKey, JSON.stringify(validBackups));
      
      return backups.length - validBackups.length;
    } catch (error) {
      console.error('Error cleaning up old backups:', error);
      return 0;
    }
  }
}

export default new BackupService(); 