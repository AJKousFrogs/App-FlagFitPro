/**
 * Backup Monitoring Service
 * Monitors and manages database backups
 */

import logger from './logger.service';
import sentryService from './sentry.service';
import env from '../config/environment';
import * as pocketbaseModule from './pocketbase.service';

const { pocketbaseService } = pocketbaseModule;

class BackupService {
  constructor() {
    this.pocketbase = pocketbaseService;
    this.backupHistory = [];
    this.config = {
      backupRetention: 30, // days
      maxBackupSize: 500 * 1024 * 1024, // 500MB
      compressionEnabled: true,
      encryptionEnabled: true,
      monitoringInterval: 6 * 60 * 60 * 1000, // 6 hours
      alertThreshold: 24 * 60 * 60 * 1000, // 24 hours
      enabled: env.getConfig().features.backups || false,
      collections: ['users', 'training_sessions', 'analytics', 'teams'],
      backupPath: '/data/backups',
      s3Config: {
        enabled: false,
        bucket: '',
        region: 'us-east-1',
        accessKeyId: '',
        secretAccessKey: ''
      }
    };

    this.backupStatus = {
      lastBackup: null,
      lastSuccessfulBackup: null,
      consecutiveFailures: 0,
      totalBackups: 0,
      averageSize: 0,
      isRunning: false
    };

    if (this.config.enabled) {
      this.initialize();
    }
  }

  async initialize() {
    try {
      logger.info('Initializing backup service');
      
      // Load backup history
      await this.loadBackupHistory();
      
      // Start monitoring
      this.startMonitoring();
      
      // Schedule periodic cleanup
      this.scheduleCleanup();
      
      logger.info('Backup service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize backup service', { error: error.message });
      sentryService.captureException(error, { 
        backup: { operation: 'initialize' } 
      });
    }
  }

  async loadBackupHistory() {
    try {
      // In a real implementation, this would load from backup metadata storage
      // For demonstration, we'll simulate some backup history
      this.backupHistory = [
        {
          id: `backup_${  Date.now()}`,
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          type: 'scheduled',
          status: 'completed',
          size: 45 * 1024 * 1024,
          duration: 120000,
          collections: this.config.collections,
          location: 'local'
        }
      ];

      this.updateBackupStatus();
      
      logger.info('Loaded backup history', { 
        count: this.backupHistory.length 
      });
    } catch (error) {
      logger.warn('Could not load backup history', { error: error.message });
      this.backupHistory = [];
    }
  }

  updateBackupStatus() {
    const completedBackups = this.backupHistory.filter(b => b.status === 'completed');
    
    if (completedBackups.length > 0) {
      const latest = completedBackups.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      )[0];
      
      this.backupStatus.lastSuccessfulBackup = latest.timestamp;
      this.backupStatus.averageSize = completedBackups.reduce((sum, b) => sum + b.size, 0) / completedBackups.length;
    }

    if (this.backupHistory.length > 0) {
      const latest = this.backupHistory.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      )[0];
      
      this.backupStatus.lastBackup = latest.timestamp;
    }

    this.backupStatus.totalBackups = completedBackups.length;
    this.backupStatus.consecutiveFailures = this.getConsecutiveFailures();
  }

  getConsecutiveFailures() {
    let failures = 0;
    const sortedBackups = this.backupHistory.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );

    for (const backup of sortedBackups) {
      if (backup.status === 'failed') {
        failures++;
      } else {
        break;
      }
    }

    return failures;
  }

  startMonitoring() {
    // Check backup status periodically
    setInterval(() => {
      this.checkBackupHealth();
    }, this.config.monitoringInterval);

    // Initial health check
    setTimeout(() => {
      this.checkBackupHealth();
    }, 5000);

    logger.info('Backup monitoring started', {
      interval: this.config.monitoringInterval
    });
  }

  async checkBackupHealth() {
    try {
      const now = Date.now();
      const alertThreshold = this.config.alertThreshold;

      // Check if last successful backup is too old
      if (this.backupStatus.lastSuccessfulBackup) {
        const lastBackupTime = new Date(this.backupStatus.lastSuccessfulBackup).getTime();
        const timeSinceLastBackup = now - lastBackupTime;

        if (timeSinceLastBackup > alertThreshold) {
          this.alertBackupOverdue(timeSinceLastBackup);
        }
      } else {
        this.alertNoBackups();
      }

      // Check for consecutive failures
      if (this.backupStatus.consecutiveFailures >= 3) {
        this.alertConsecutiveFailures();
      }

      // Check backup size trends
      await this.checkBackupSizeTrends();

      // Verify backup integrity
      await this.verifyRecentBackups();

      logger.debug('Backup health check completed', this.backupStatus);

    } catch (error) {
      logger.error('Backup health check failed', { error: error.message });
    }
  }

  alertBackupOverdue(timeSinceLastBackup) {
    const hoursOverdue = Math.floor(timeSinceLastBackup / (1000 * 60 * 60));
    
    logger.warn('Backup overdue', { 
      hoursOverdue,
      lastBackup: this.backupStatus.lastSuccessfulBackup 
    });

    sentryService.captureMessage('Backup overdue', 'warning', {
      backup: {
        hoursOverdue,
        lastBackup: this.backupStatus.lastSuccessfulBackup,
        threshold: this.config.alertThreshold
      }
    });
  }

  alertNoBackups() {
    logger.error('No successful backups found');
    
    sentryService.captureMessage('No backups found', 'error', {
      backup: { status: 'no_backups' }
    });
  }

  alertConsecutiveFailures() {
    logger.error('Multiple consecutive backup failures', {
      consecutiveFailures: this.backupStatus.consecutiveFailures
    });

    sentryService.captureMessage('Consecutive backup failures', 'error', {
      backup: {
        consecutiveFailures: this.backupStatus.consecutiveFailures,
        lastAttempt: this.backupStatus.lastBackup
      }
    });
  }

  async checkBackupSizeTrends() {
    try {
      const recentBackups = this.backupHistory
        .filter(b => b.status === 'completed')
        .slice(-10);

      if (recentBackups.length < 3) return;

      const sizes = recentBackups.map(b => b.size);
      const averageSize = sizes.reduce((sum, size) => sum + size, 0) / sizes.length;
      const latestSize = sizes[sizes.length - 1];

      // Alert if latest backup is significantly larger than average
      if (latestSize > averageSize * 2) {
        logger.warn('Backup size significantly increased', {
          latestSize: this.formatBytes(latestSize),
          averageSize: this.formatBytes(averageSize),
          increase: `${((latestSize / averageSize - 1) * 100).toFixed(1)}%`
        });
      }

      // Alert if approaching size limit
      if (latestSize > this.config.maxBackupSize * 0.8) {
        logger.warn('Backup size approaching limit', {
          currentSize: this.formatBytes(latestSize),
          maxSize: this.formatBytes(this.config.maxBackupSize),
          usage: `${(latestSize / this.config.maxBackupSize * 100).toFixed(1)}%`
        });
      }

    } catch (error) {
      logger.error('Failed to check backup size trends', { error: error.message });
    }
  }

  async verifyRecentBackups() {
    try {
      const recentBackups = this.backupHistory
        .filter(b => b.status === 'completed')
        .slice(-3);

      for (const backup of recentBackups) {
        const isValid = await this.verifyBackupIntegrity(backup);
        
        if (!isValid) {
          logger.error('Backup integrity check failed', {
            backupId: backup.id,
            timestamp: backup.timestamp
          });

          sentryService.captureMessage('Backup integrity check failed', 'error', {
            backup: {
              id: backup.id,
              timestamp: backup.timestamp,
              location: backup.location
            }
          });
        }
      }

    } catch (error) {
      logger.error('Failed to verify backup integrity', { error: error.message });
    }
  }

  async verifyBackupIntegrity(backup) {
    try {
      // In a real implementation, this would:
      // 1. Check if backup file exists
      // 2. Verify file size matches recorded size
      // 3. Check file checksums
      // 4. Optionally test restore process
      
      logger.debug('Verifying backup integrity', { backupId: backup.id });
      
      // Simulate integrity check
      return Math.random() > 0.1; // 90% success rate for demo
      
    } catch (error) {
      logger.error('Backup integrity verification failed', {
        backupId: backup.id,
        error: error.message
      });
      return false;
    }
  }

  async createBackup(options = {}) {
    const {
      type = 'manual',
      collections = this.config.collections,
      compress = this.config.compressionEnabled,
      encrypt = this.config.encryptionEnabled
    } = options;

    if (this.backupStatus.isRunning) {
      throw new Error('Backup already in progress');
    }

    const backupId = `backup_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    try {
      this.backupStatus.isRunning = true;
      
      logger.info('Starting backup', { backupId, type, collections });

      const startTime = Date.now();
      
      // Simulate backup process
      const backupData = await this.performBackup(collections, compress, encrypt);
      
      const duration = Date.now() - startTime;
      
      const backup = {
        id: backupId,
        timestamp: new Date().toISOString(),
        type,
        status: 'completed',
        size: backupData.size,
        duration,
        collections,
        location: backupData.location,
        compressed: compress,
        encrypted: encrypt,
        checksum: backupData.checksum
      };

      this.backupHistory.push(backup);
      this.updateBackupStatus();

      logger.info('Backup completed successfully', {
        backupId,
        size: this.formatBytes(backup.size),
        duration: `${duration}ms`,
        location: backup.location
      });

      return backup;

    } catch (error) {
      const backup = {
        id: backupId,
        timestamp: new Date().toISOString(),
        type,
        status: 'failed',
        error: error.message,
        collections
      };

      this.backupHistory.push(backup);
      this.updateBackupStatus();

      logger.error('Backup failed', {
        backupId,
        error: error.message
      });

      sentryService.captureException(error, {
        backup: { id: backupId, type }
      });

      throw error;
    } finally {
      this.backupStatus.isRunning = false;
    }
  }

  async performBackup(collections, compress) {
    // Simulate backup process
    await this.sleep(2000 + Math.random() * 3000);

    // Simulate occasional failures
    if (Math.random() < 0.05) {
      throw new Error('Backup storage unavailable');
    }

    const baseSize = 30 * 1024 * 1024; // 30MB base
    const variableSize = Math.random() * 20 * 1024 * 1024; // Up to 20MB variable
    const size = Math.floor(baseSize + variableSize);

    return {
      size: compress ? Math.floor(size * 0.7) : size,
      location: 'local',
      checksum: Math.random().toString(36).substring(2, 18)
    };
  }

  scheduleCleanup() {
    // Clean up old backups daily
    setInterval(() => {
      this.cleanupOldBackups();
    }, 24 * 60 * 60 * 1000);

    logger.info('Backup cleanup scheduled');
  }

  async cleanupOldBackups() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.backupRetention);

      const oldBackups = this.backupHistory.filter(backup => 
        new Date(backup.timestamp) < cutoffDate && backup.status === 'completed'
      );

      if (oldBackups.length === 0) {
        logger.debug('No old backups to clean up');
        return;
      }

      logger.info('Cleaning up old backups', { 
        count: oldBackups.length,
        retentionDays: this.config.backupRetention
      });

      for (const backup of oldBackups) {
        await this.deleteBackup(backup);
      }

      // Remove from history
      this.backupHistory = this.backupHistory.filter(backup => 
        !oldBackups.some(old => old.id === backup.id)
      );

      this.updateBackupStatus();

      logger.info('Backup cleanup completed', { 
        cleaned: oldBackups.length 
      });

    } catch (error) {
      logger.error('Backup cleanup failed', { error: error.message });
    }
  }

  async deleteBackup(backup) {
    try {
      // In a real implementation, this would delete the actual backup files
      logger.debug('Deleting backup', { 
        backupId: backup.id,
        location: backup.location,
        size: this.formatBytes(backup.size)
      });

      // Simulate deletion
      await this.sleep(100);

    } catch (error) {
      logger.error('Failed to delete backup', {
        backupId: backup.id,
        error: error.message
      });
    }
  }

  getBackupStatus() {
    return {
      ...this.backupStatus,
      health: this.getHealthStatus(),
      nextScheduledBackup: this.getNextScheduledBackup(),
      storageUsage: this.getStorageUsage(),
      retentionDays: this.config.backupRetention
    };
  }

  getHealthStatus() {
    const now = Date.now();
    const alertThreshold = this.config.alertThreshold;

    if (!this.backupStatus.lastSuccessfulBackup) {
      return 'critical';
    }

    const lastBackupTime = new Date(this.backupStatus.lastSuccessfulBackup).getTime();
    const timeSinceLastBackup = now - lastBackupTime;

    if (timeSinceLastBackup > alertThreshold) {
      return 'warning';
    }

    if (this.backupStatus.consecutiveFailures > 0) {
      return 'degraded';
    }

    return 'healthy';
  }

  getNextScheduledBackup() {
    // This would be calculated based on backup schedule
    const next = new Date();
    next.setHours(next.getHours() + 6); // Every 6 hours for demo
    return next.toISOString();
  }

  getStorageUsage() {
    const totalSize = this.backupHistory
      .filter(b => b.status === 'completed')
      .reduce((sum, backup) => sum + (backup.size || 0), 0);

    return {
      totalSize: this.formatBytes(totalSize),
      totalSizeBytes: totalSize,
      backupCount: this.backupHistory.filter(b => b.status === 'completed').length,
      averageSize: this.formatBytes(this.backupStatus.averageSize || 0)
    };
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))  } ${  sizes[i]}`;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public methods for external usage
  async triggerBackup(type = 'manual') {
    return this.createBackup({ type });
  }

  getRecentBackups(limit = 10) {
    return this.backupHistory
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  getBackupById(backupId) {
    return this.backupHistory.find(backup => backup.id === backupId);
  }
}

// Export singleton instance
export const backupService = new BackupService();
export default backupService;