/**
 * Centralized Service Exports with explicit .js extensions
 * All services exported from this index for consistent imports
 */

// Core services
export { default as pocketbaseService } from './pocketbase-client.service.js';
export { default as cacheService } from './cache.service.js';
export { default as logger } from './logger.service.js';
export { default as sentryService } from './sentry.service.js';

// Business logic services
export { trainingService } from './training.service.js';
export { analyticsService } from './analytics.service.js';
export { authService } from './auth.service.js';
export { fileUploadService } from './fileUpload.service.js';

// Infrastructure services
export { databaseService } from './database.service.js';
export { migrationService } from './migration.service.js';
export { backupService } from './backup.service.js';
export { monitoringService } from './monitoring.service.js';
export { securityService } from './security.service.js';
export { apiService } from './api.service.js';

// Container service
export { container } from './container.js';

// Configuration
export { COLLECTIONS } from '../config/collections.js';