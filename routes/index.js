/**
 * API Routes Index
 * Central export for all modular route handlers
 *
 * @module routes
 * @version 2.3.0
 */

export { default as trainingRoutes } from "./training.routes.js";
export { createTrainingRouter } from "./training.routes.js";
export { default as wellnessRoutes } from "./wellness.routes.js";
export { default as analyticsRoutes } from "./analytics.routes.js";
export { default as notificationsRoutes } from "./notifications.routes.js";
export { default as dashboardRoutes } from "./dashboard.routes.js";
export { default as communityRoutes } from "./community.routes.js";

// Re-export utilities for convenience
export * from "./utils/validation.js";
export * from "./utils/database.js";
export * from "./utils/rate-limiter.js";
export * from "./utils/health-check.js";
export * from "./utils/cache.js";

// Re-export middleware
export * from "./middleware/request-logger.middleware.js";
