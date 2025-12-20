// Mock Backup Service for Development
class BackupService {
  constructor() {
    this.backups = [];
    this.isBackingUp = false;
  }

  async createBackup(data, metadata = {}) {
    try {
      this.isBackingUp = true;
      console.log('Creating backup...', metadata);
      
      // Simulate backup process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const backup = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        data: JSON.stringify(data),
        metadata,
        size: JSON.stringify(data).length
      };
      
      this.backups.push(backup);
      localStorage.setItem('flagfit_backups', JSON.stringify(this.backups));
      
      console.log('Backup created successfully:', backup.id);
      return backup;
    } catch (error) {
      console.error('Backup failed:', error);
      throw error;
    } finally {
      this.isBackingUp = false;
    }
  }

  async restoreBackup(backupId) {
    try {
      const backup = this.backups.find(b => b.id === backupId);
      if (!backup) {
        throw new Error('Backup not found');
      }
      
      console.log('Restoring backup:', backupId);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const data = JSON.parse(backup.data);
      console.log('Backup restored successfully');
      return data;
    } catch (error) {
      console.error('Restore failed:', error);
      throw error;
    }
  }

  getBackups() {
    return this.backups;
  }

  async deleteBackup(backupId) {
    this.backups = this.backups.filter(b => b.id !== backupId);
    localStorage.setItem('flagfit_backups', JSON.stringify(this.backups));
    console.log('Backup deleted:', backupId);
  }

  isRunning() {
    return this.isBackingUp;
  }
}

export default new BackupService();