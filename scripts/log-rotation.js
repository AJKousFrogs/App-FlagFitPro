#!/usr/bin/env node

/**
 * Log Rotation Service
 * Manages log file rotation and cleanup
 */

const fs = require('fs').promises;
const path = require('path');
const zlib = require('zlib');
const { promisify } = require('util');

const gzip = promisify(zlib.gzip);

class LogRotationService {
  constructor() {
    this.config = {
      retentionDays: parseInt(process.env.LOG_RETENTION_DAYS) || 30,
      maxSize: this.parseSize(process.env.LOG_MAX_SIZE) || 100 * 1024 * 1024, // 100MB
      compressionEnabled: process.env.COMPRESSION_ENABLED !== 'false',
      logDirectory: path.join(__dirname, '../logs'),
      rotationInterval: 24 * 60 * 60 * 1000, // 24 hours
      checkInterval: 60 * 60 * 1000 // 1 hour
    };

    this.logFiles = [
      'app.log',
      'out.log',
      'error.log',
      'health-check.log',
      'health-check-out.log',
      'health-check-error.log',
      'log-rotation.log',
      'log-rotation-out.log',
      'log-rotation-error.log'
    ];

    this.start();
  }

  parseSize(sizeStr) {
    if (!sizeStr) return null;
    
    const units = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024
    };

    const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*([A-Z]{1,2})$/i);
    if (!match) return null;

    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    
    return value * (units[unit] || 1);
  }

  async start() {
    console.log('🔄 Log Rotation Service starting...');
    console.log(`📁 Log directory: ${this.config.logDirectory}`);
    console.log(`🗓️  Retention: ${this.config.retentionDays} days`);
    console.log(`📏 Max size: ${this.formatSize(this.config.maxSize)}`);
    console.log(`🗜️  Compression: ${this.config.compressionEnabled ? 'enabled' : 'disabled'}`);

    await this.ensureLogDirectory();
    
    // Initial rotation check
    await this.performRotation();
    
    // Schedule periodic checks
    setInterval(() => {
      this.performRotation();
    }, this.config.checkInterval);

    console.log('✅ Log Rotation Service ready');
  }

  async ensureLogDirectory() {
    try {
      await fs.mkdir(this.config.logDirectory, { recursive: true });
    } catch (error) {
      console.error('Failed to create log directory:', error);
      throw error;
    }
  }

  async performRotation() {
    const timestamp = new Date().toISOString();
    console.log(`\n🔄 Starting log rotation at ${timestamp}`);

    let rotatedCount = 0;
    let cleanedCount = 0;

    for (const logFile of this.logFiles) {
      const logPath = path.join(this.config.logDirectory, logFile);
      
      try {
        // Check if log file exists
        const exists = await this.fileExists(logPath);
        if (!exists) {
          continue;
        }

        // Check if rotation is needed
        const needsRotation = await this.needsRotation(logPath);
        
        if (needsRotation) {
          await this.rotateLog(logPath);
          rotatedCount++;
        }

        // Clean up old rotated files
        const cleaned = await this.cleanupOldLogs(logFile);
        cleanedCount += cleaned;

      } catch (error) {
        console.error(`Error processing ${logFile}:`, error);
      }
    }

    console.log(`📊 Rotation summary: ${rotatedCount} rotated, ${cleanedCount} cleaned`);
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async needsRotation(logPath) {
    try {
      const stats = await fs.stat(logPath);
      
      // Check size
      if (stats.size >= this.config.maxSize) {
        console.log(`📏 ${path.basename(logPath)} needs rotation (size: ${this.formatSize(stats.size)})`);
        return true;
      }

      // Check age (daily rotation)
      const age = Date.now() - stats.mtime.getTime();
      const dayInMs = 24 * 60 * 60 * 1000;
      
      if (age >= dayInMs) {
        console.log(`🗓️  ${path.basename(logPath)} needs rotation (age: ${Math.floor(age / dayInMs)} days)`);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error checking rotation need for ${logPath}:`, error);
      return false;
    }
  }

  async rotateLog(logPath) {
    const logName = path.basename(logPath, '.log');
    const logDir = path.dirname(logPath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    let rotatedPath = path.join(logDir, `${logName}.${timestamp}.log`);

    try {
      // Read current log content
      const content = await fs.readFile(logPath);
      
      // Compress if enabled
      if (this.config.compressionEnabled) {
        const compressed = await gzip(content);
        rotatedPath += '.gz';
        await fs.writeFile(rotatedPath, compressed);
        console.log(`🗜️  Compressed and rotated: ${path.basename(logPath)} -> ${path.basename(rotatedPath)}`);
      } else {
        await fs.writeFile(rotatedPath, content);
        console.log(`🔄 Rotated: ${path.basename(logPath)} -> ${path.basename(rotatedPath)}`);
      }

      // Clear the original log file
      await fs.writeFile(logPath, '');
      
    } catch (error) {
      console.error(`Failed to rotate ${logPath}:`, error);
      throw error;
    }
  }

  async cleanupOldLogs(logFileName) {
    const logName = path.basename(logFileName, '.log');
    const logDir = this.config.logDirectory;
    
    try {
      const files = await fs.readdir(logDir);
      const pattern = new RegExp(`^${logName}\\.\\d{4}-\\d{2}-\\d{2}T\\d{2}-\\d{2}-\\d{2}-\\d{3}Z\\.log(\\.gz)?$`);
      
      const rotatedFiles = files
        .filter(file => pattern.test(file))
        .map(file => ({
          name: file,
          path: path.join(logDir, file),
          timestamp: this.extractTimestamp(file)
        }))
        .filter(file => file.timestamp)
        .sort((a, b) => b.timestamp - a.timestamp); // Newest first

      const cutoffTime = Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000);
      let cleanedCount = 0;

      for (const file of rotatedFiles) {
        if (file.timestamp < cutoffTime) {
          await fs.unlink(file.path);
          console.log(`🗑️  Cleaned up old log: ${file.name}`);
          cleanedCount++;
        }
      }

      return cleanedCount;
    } catch (error) {
      console.error(`Error cleaning up old logs for ${logFileName}:`, error);
      return 0;
    }
  }

  extractTimestamp(filename) {
    const match = filename.match(/\.(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)\./);
    if (!match) return null;
    
    try {
      return new Date(match[1].replace(/-/g, ':')).getTime();
    } catch {
      return null;
    }
  }

  formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  // Get rotation statistics
  async getRotationStats() {
    try {
      const files = await fs.readdir(this.config.logDirectory);
      const stats = {
        totalFiles: files.length,
        currentLogs: 0,
        rotatedLogs: 0,
        compressedLogs: 0,
        totalSize: 0
      };

      for (const file of files) {
        const filePath = path.join(this.config.logDirectory, file);
        const fileStat = await fs.stat(filePath);
        
        stats.totalSize += fileStat.size;
        
        if (file.endsWith('.log')) {
          stats.currentLogs++;
        } else if (file.includes('.log.')) {
          stats.rotatedLogs++;
          if (file.endsWith('.gz')) {
            stats.compressedLogs++;
          }
        }
      }

      return stats;
    } catch (error) {
      console.error('Error getting rotation stats:', error);
      return null;
    }
  }

  // Graceful shutdown
  shutdown() {
    console.log('\n🛑 Log Rotation Service shutting down...');
    process.exit(0);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT signal');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM signal');
  process.exit(0);
});

// Start the service
new LogRotationService();