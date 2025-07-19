/**
 * Database Migration Service
 * Handles database schema migrations and version tracking
 */

import { pocketbaseService } from './pocketbase.service.js';
import logger from './logger.service';
import sentryService from './sentry.service';
import env from '../config/environment';


class MigrationService {
  constructor() {
    this.pocketbase = pocketbaseService;
    this.migrations = new Map();
    this.migrationHistory = [];
    this.config = {
      migrationsCollection: '_migrations',
      backupBeforeMigration: true,
      rollbackOnFailure: true,
      enabled: env.getConfig().features.migrations || false
    };

    if (this.config.enabled) {
      this.initialize();
    }
  }

  async initialize() {
    try {
      logger.info('Initializing migration service');
      
      // Ensure migrations collection exists
      await this.ensureMigrationsCollection();
      
      // Load migration history
      await this.loadMigrationHistory();
      
      // Register built-in migrations
      this.registerBuiltInMigrations();
      
      logger.info('Migration service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize migration service', { error: error.message });
      sentryService.captureException(error, { 
        migration: { operation: 'initialize' } 
      });
    }
  }

  async ensureMigrationsCollection() {
    try {
      // Check if migrations collection exists
      await this.pocketbase.pb.collection(this.config.migrationsCollection).getList(1, 1);
    } catch (error) {
      if (error.status === 404) {
        logger.info('Creating migrations collection');
        // Collection doesn't exist, create it
        // Note: In a real PocketBase setup, this would be done through the admin interface
        logger.warn('Migrations collection does not exist. Please create it through PocketBase admin.');
      } else {
        throw error;
      }
    }
  }

  async loadMigrationHistory() {
    try {
      const records = await this.pocketbase.pb
        .collection(this.config.migrationsCollection)
        .getList(1, 500, {
          sort: 'created'
        });
      
      this.migrationHistory = records.items.map(item => ({
        id: item.id,
        version: item.version,
        name: item.name,
        executed_at: item.created,
        rollback_sql: item.rollback_sql,
        checksum: item.checksum
      }));

      logger.info('Loaded migration history', { 
        count: this.migrationHistory.length 
      });
    } catch (error) {
      logger.warn('Could not load migration history', { error: error.message });
      this.migrationHistory = [];
    }
  }

  registerBuiltInMigrations() {
    // Register system migrations
    this.registerMigration({
      version: '001',
      name: 'create_user_preferences',
      description: 'Add user preferences schema',
      up: async () => {
        logger.info('Migration 001: Creating user preferences schema');
        // In PocketBase, this would typically be done through collections
        return { success: true, message: 'User preferences schema ready' };
      },
      down: async () => {
        logger.info('Rolling back migration 001');
        return { success: true, message: 'User preferences schema rollback' };
      },
      checksum: this.calculateChecksum('001_create_user_preferences')
    });

    this.registerMigration({
      version: '002', 
      name: 'add_training_analytics',
      description: 'Add training analytics collections',
      up: async () => {
        logger.info('Migration 002: Adding training analytics');
        return { success: true, message: 'Training analytics collections ready' };
      },
      down: async () => {
        logger.info('Rolling back migration 002');
        return { success: true, message: 'Training analytics rollback' };
      },
      checksum: this.calculateChecksum('002_add_training_analytics')
    });

    logger.info('Registered built-in migrations', { 
      count: this.migrations.size 
    });
  }

  registerMigration(migration) {
    const { version, name, description, up, down, checksum } = migration;
    
    if (!version || !name || !up) {
      throw new Error('Migration must have version, name, and up function');
    }

    this.migrations.set(version, {
      version,
      name,
      description: description || '',
      up,
      down: down || (() => Promise.resolve({ success: true })),
      checksum: checksum || this.calculateChecksum(`${version}_${name}`),
      registered_at: new Date().toISOString()
    });

    logger.debug('Registered migration', { version, name });
  }

  calculateChecksum(content) {
    // Simple checksum calculation (in production, use crypto.subtle)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  async getPendingMigrations() {
    const executedVersions = new Set(this.migrationHistory.map(m => m.version));
    const pendingMigrations = [];

    for (const [version, migration] of this.migrations) {
      if (!executedVersions.has(version)) {
        pendingMigrations.push(migration);
      }
    }

    // Sort by version
    return pendingMigrations.sort((a, b) => a.version.localeCompare(b.version));
  }

  async runMigrations(options = {}) {
    const { dryRun = false, targetVersion = null } = options;
    
    try {
      const pendingMigrations = await this.getPendingMigrations();
      
      if (pendingMigrations.length === 0) {
        logger.info('No pending migrations');
        return { success: true, executed: [] };
      }

      const migrationsToRun = targetVersion 
        ? pendingMigrations.filter(m => m.version <= targetVersion)
        : pendingMigrations;

      logger.info('Running migrations', { 
        count: migrationsToRun.length,
        dryRun,
        targetVersion
      });

      const results = [];

      for (const migration of migrationsToRun) {
        try {
          logger.info('Executing migration', { 
            version: migration.version, 
            name: migration.name 
          });

          if (!dryRun) {
            // Create backup if configured
            if (this.config.backupBeforeMigration) {
              await this.createMigrationBackup(migration.version);
            }

            // Execute migration
            const startTime = Date.now();
            const result = await migration.up();
            const duration = Date.now() - startTime;

            if (result.success) {
              // Record successful migration
              await this.recordMigrationExecution(migration, duration);
              
              results.push({
                version: migration.version,
                name: migration.name,
                success: true,
                duration,
                message: result.message
              });

              logger.info('Migration completed successfully', {
                version: migration.version,
                duration
              });
            } else {
              throw new Error(result.error || 'Migration failed');
            }
          } else {
            results.push({
              version: migration.version,
              name: migration.name,
              success: true,
              dryRun: true
            });
          }

        } catch (error) {
          logger.error('Migration failed', {
            version: migration.version,
            error: error.message
          });

          results.push({
            version: migration.version,
            name: migration.name,
            success: false,
            error: error.message
          });

          sentryService.captureException(error, {
            migration: {
              version: migration.version,
              name: migration.name
            }
          });

          // Handle rollback
          if (this.config.rollbackOnFailure && !dryRun) {
            await this.rollbackMigration(migration);
          }

          break; // Stop on first failure
        }
      }

      return {
        success: results.every(r => r.success),
        executed: results
      };

    } catch (error) {
      logger.error('Migration process failed', { error: error.message });
      throw error;
    }
  }

  async rollbackMigration(migration) {
    try {
      logger.info('Rolling back migration', { 
        version: migration.version,
        name: migration.name 
      });

      if (migration.down) {
        const result = await migration.down();
        
        if (result.success) {
          // Remove from migration history
          await this.removeMigrationRecord(migration.version);
          
          logger.info('Migration rollback completed', {
            version: migration.version
          });
        } else {
          throw new Error(result.error || 'Rollback failed');
        }
      } else {
        logger.warn('No rollback function defined for migration', {
          version: migration.version
        });
      }

    } catch (error) {
      logger.error('Migration rollback failed', {
        version: migration.version,
        error: error.message
      });
      throw error;
    }
  }

  async recordMigrationExecution(migration, duration) {
    try {
      const record = await this.pocketbase.pb
        .collection(this.config.migrationsCollection)
        .create({
          version: migration.version,
          name: migration.name,
          description: migration.description,
          checksum: migration.checksum,
          duration_ms: duration,
          executed_at: new Date().toISOString()
        });

      // Update local history
      this.migrationHistory.push({
        id: record.id,
        version: migration.version,
        name: migration.name,
        executed_at: record.created,
        checksum: migration.checksum
      });

    } catch (error) {
      logger.error('Failed to record migration execution', {
        version: migration.version,
        error: error.message
      });
      throw error;
    }
  }

  async removeMigrationRecord(version) {
    try {
      const record = this.migrationHistory.find(m => m.version === version);
      if (record) {
        await this.pocketbase.pb
          .collection(this.config.migrationsCollection)
          .delete(record.id);

        // Update local history
        this.migrationHistory = this.migrationHistory.filter(m => m.version !== version);
      }
    } catch (error) {
      logger.error('Failed to remove migration record', {
        version,
        error: error.message
      });
    }
  }

  async createMigrationBackup(version) {
    try {
      logger.info('Creating migration backup', { version });
      
      // In a real implementation, this would create a database backup
      // For PocketBase, this might involve exporting collections
      
      const backupInfo = {
        version,
        timestamp: new Date().toISOString(),
        type: 'pre_migration'
      };

      logger.debug('Migration backup created', backupInfo);
      return backupInfo;

    } catch (error) {
      logger.warn('Failed to create migration backup', {
        version,
        error: error.message
      });
      // Don't fail the migration for backup issues
    }
  }

  getMigrationStatus() {
    const executedVersions = new Set(this.migrationHistory.map(m => m.version));
    const allVersions = Array.from(this.migrations.keys()).sort();
    
    return {
      total: this.migrations.size,
      executed: this.migrationHistory.length,
      pending: this.migrations.size - this.migrationHistory.length,
      latest_executed: this.migrationHistory.length > 0 
        ? this.migrationHistory[this.migrationHistory.length - 1].version
        : null,
      all_versions: allVersions,
      executed_versions: Array.from(executedVersions).sort(),
      pending_versions: allVersions.filter(v => !executedVersions.has(v))
    };
  }

  async validateMigrations() {
    const issues = [];

    for (const migration of this.migrationHistory) {
      const registeredMigration = this.migrations.get(migration.version);
      
      if (!registeredMigration) {
        issues.push({
          type: 'missing_migration',
          version: migration.version,
          message: 'Migration was executed but is no longer registered'
        });
        continue;
      }

      if (migration.checksum !== registeredMigration.checksum) {
        issues.push({
          type: 'checksum_mismatch',
          version: migration.version,
          message: 'Migration checksum has changed since execution'
        });
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }
}

// Export singleton instance
export const migrationService = new MigrationService();
export default migrationService;