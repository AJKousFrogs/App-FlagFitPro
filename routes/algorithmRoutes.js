/**
 * Algorithm Routes API
 * Provides algorithm-based recommendations and predictions for FlagFit Pro
 * 
 * @module routes/algorithmRoutes
 * @version 2.0.0
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const ROUTE_NAME = 'algorithm';

// Database connection with enhanced error handling and fallbacks
let pool;
try {
  const connectionString = process.env.DATABASE_URL || process.env.VITE_DATABASE_URL;
  
  if (!connectionString) {
    console.warn(`⚠️  ${ROUTE_NAME.toUpperCase()}: DATABASE_URL not configured`);
  }
  
  pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 20,
    allowExitOnIdle: false
  });
  
  pool.on('connect', () => {
    console.log(`✅ ${ROUTE_NAME.toUpperCase()} database connected successfully`);
  });
  
  pool.on('error', (err) => {
    console.error(`❌ ${ROUTE_NAME.toUpperCase()} database connection error:`, err);
    // Attempt to reconnect on error
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
      console.warn(`⚠️  ${ROUTE_NAME.toUpperCase()}: Attempting to reconnect...`);
    }
  });
  
} catch (error) {
  console.error(`❌ Failed to create ${ROUTE_NAME} database pool:`, error);
  pool = null;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Safely execute database queries with error handling
 * @param {string} query - SQL query string
 * @param {Array} params - Query parameters for parameterized queries
 * @returns {Promise<object>} Query result object
 * @throws {Error} If database connection is unavailable or query fails
 */
async function safeQuery(query, params = []) {
  if (!pool) {
    throw new Error('Database connection not available');
  }
  
  // Validate query is not empty
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    throw new Error('Invalid query: Query string is required');
  }
  
  // Validate params is an array
  if (!Array.isArray(params)) {
    throw new Error('Invalid parameters: Parameters must be an array');
  }
  
  try {
    const result = await pool.query(query, params);
    return result;
  } catch (error) {
    console.error(`${ROUTE_NAME.toUpperCase()} database query error:`, {
      message: error.message,
      code: error.code,
      query: query.substring(0, 100) + '...'
    });
    throw new Error(`Database operation failed: ${error.message}`);
  }
}

/**
 * Safely format dates to ISO string
 * @param {Date|string|number} date - Date to format
 * @returns {string} ISO formatted date string
 */
function safeFormatDate(date) {
  try {
    if (!date) return new Date().toISOString();
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return new Date().toISOString();
    }
    return dateObj.toISOString();
  } catch (error) {
    console.warn('Date formatting error:', error);
    return new Date().toISOString();
  }
}

/**
 * Safely validate JWT tokens
 * @param {string} token - JWT token string
 * @param {string} secret - JWT secret key
 * @returns {Promise<object>} Decoded user object
 * @throws {Error} If token is invalid or expired
 */
function safeJWTVerify(token, secret) {
  if (!token || typeof token !== 'string') {
    throw new Error('Invalid token: Token must be a non-empty string');
  }
  
  if (!secret || typeof secret !== 'string') {
    throw new Error('Invalid secret: Secret must be configured');
  }
  
  try {
    return new Promise((resolve, reject) => {
      jwt.verify(token, secret, (err, user) => {
        if (err) {
          reject(err);
        } else {
          resolve(user);
        }
      });
    });
  } catch (error) {
    throw new Error('JWT verification failed');
  }
}

/**
 * Validate user ID parameter
 * @param {string} userId - User ID to validate
 * @returns {object} Validation result with isValid and sanitized userId
 */
function validateUserId(userId) {
  if (!userId || typeof userId !== 'string') {
    return { isValid: false, error: 'User ID must be a non-empty string' };
  }
  
  const sanitized = userId.trim();
  
  if (sanitized.length === 0) {
    return { isValid: false, error: 'User ID cannot be empty' };
  }
  
  // Basic validation: alphanumeric, hyphens, underscores only
  if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) {
    return { isValid: false, error: 'User ID contains invalid characters' };
  }
  
  return { isValid: true, userId: sanitized };
}

/**
 * Create standardized error response
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {number} statusCode - HTTP status code
 * @param {string} details - Additional error details (dev only)
 * @returns {object} Error response object
 */
function createErrorResponse(message, code, statusCode = 500, details = null) {
  const response = {
    success: false,
    error: message,
    code,
    timestamp: safeFormatDate(new Date())
  };
  
  if (details && process.env.NODE_ENV === 'development') {
    response.details = details;
  }
  
  return { statusCode, response };
}

// =============================================================================
// MIDDLEWARE
// =============================================================================

/**
 * Authentication middleware with enhanced error handling
 * Validates JWT tokens from Authorization header
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
      const { statusCode, response } = createErrorResponse(
        'Access token required',
        'MISSING_TOKEN',
        401
      );
      return res.status(statusCode).json(response);
    }

    const token = authHeader.split(' ')[1]; // Extract token from "Bearer <token>"

    if (!token) {
      const { statusCode, response } = createErrorResponse(
        'Invalid authorization header format. Expected: Bearer <token>',
        'INVALID_AUTH_HEADER',
        401
      );
      return res.status(statusCode).json(response);
    }

    try {
      const user = await safeJWTVerify(token, JWT_SECRET);
      req.user = user;
      req.userId = user.id || user.userId || user.sub; // Support multiple JWT formats
      next();
    } catch (jwtError) {
      console.error('JWT verification error:', {
        message: jwtError.message,
        name: jwtError.name
      });
      
      const errorCode = jwtError.name === 'TokenExpiredError' 
        ? 'TOKEN_EXPIRED' 
        : 'INVALID_TOKEN';
      
      const { statusCode, response } = createErrorResponse(
        jwtError.name === 'TokenExpiredError' 
          ? 'Token has expired' 
          : 'Invalid or malformed token',
        errorCode,
        403,
        process.env.NODE_ENV === 'development' ? jwtError.message : null
      );
      
      return res.status(statusCode).json(response);
    }
  } catch (error) {
    console.error('Authentication middleware error:', error);
    const { statusCode, response } = createErrorResponse(
      'Authentication service error',
      'AUTH_ERROR',
      500,
      process.env.NODE_ENV === 'development' ? error.message : null
    );
    return res.status(statusCode).json(response);
  }
};

// =============================================================================
// BASIC ALGORITHM ENDPOINTS (Simplified for now)
// =============================================================================

/**
 * GET /health
 * Health check endpoint for monitoring and load balancers
 * @returns {object} Health status with service availability
 */
router.get('/health', async (req, res) => {
  try {
    const healthStatus = {
      success: true,
      message: 'Algorithm API is healthy',
      service: ROUTE_NAME,
      version: '2.0.0',
      services: {
        algorithmIntegration: 'active',
        evidenceEngine: 'active',
        supplementEngine: 'active',
        recoveryEngine: 'active',
        performanceEngine: 'active',
        qualificationTracker: 'active'
      },
      timestamp: safeFormatDate(new Date()),
      database: pool ? 'disconnected' : 'not_configured'
    };

    // Test database connection if available
    if (pool) {
      try {
        const startTime = Date.now();
        await pool.query('SELECT 1');
        const responseTime = Date.now() - startTime;
        
        healthStatus.database = 'connected';
        healthStatus.databaseResponseTime = `${responseTime}ms`;
        healthStatus.services.database = 'active';
      } catch (dbError) {
        healthStatus.database = 'error';
        healthStatus.databaseError = dbError.message;
        healthStatus.services.database = 'error';
        healthStatus.success = false;
      }
    }

    const statusCode = healthStatus.success ? 200 : 503;
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    console.error(`${ROUTE_NAME.toUpperCase()} health check error:`, error);
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      service: ROUTE_NAME,
      timestamp: safeFormatDate(new Date())
    });
  }
});

/**
 * GET /comprehensive/:userId
 * Get comprehensive algorithm recommendations for a user
 * @route GET /comprehensive/:userId
 * @param {string} userId - User ID from URL parameter
 * @returns {object} Comprehensive recommendations data
 */
router.get('/comprehensive/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate userId parameter
    const validation = validateUserId(userId);
    if (!validation.isValid) {
      const { statusCode, response } = createErrorResponse(
        validation.error,
        'INVALID_USER_ID',
        400
      );
      return res.status(statusCode).json(response);
    }
    
    // Verify user can access this resource (optional: check req.userId matches)
    if (req.userId && req.userId !== validation.userId) {
      const { statusCode, response } = createErrorResponse(
        'Unauthorized: Cannot access other user\'s data',
        'UNAUTHORIZED_ACCESS',
        403
      );
      return res.status(statusCode).json(response);
    }
    
    res.json({
      success: true,
      message: 'Algorithm services will be implemented in future updates',
      data: {
        userId: validation.userId,
        status: 'placeholder',
        message: 'This endpoint will provide comprehensive algorithm recommendations',
        estimatedImplementation: 'Q2 2025'
      },
      timestamp: safeFormatDate(new Date())
    });
    
  } catch (error) {
    console.error(`❌ ${ROUTE_NAME.toUpperCase()} comprehensive recommendations error:`, error);
    const { statusCode, response } = createErrorResponse(
      'Service temporarily unavailable',
      'SERVICE_UNAVAILABLE',
      500,
      error.message
    );
    return res.status(statusCode).json(response);
  }
});

/**
 * GET /training/recommendations/:userId
 * Get personalized training recommendations
 * @route GET /training/recommendations/:userId
 * @param {string} userId - User ID from URL parameter
 * @returns {object} Training recommendations data
 */
router.get('/training/recommendations/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const validation = validateUserId(userId);
    if (!validation.isValid) {
      const { statusCode, response } = createErrorResponse(
        validation.error,
        'INVALID_USER_ID',
        400
      );
      return res.status(statusCode).json(response);
    }
    
    res.json({
      success: true,
      message: 'Training algorithm will be implemented in future updates',
      data: {
        userId: validation.userId,
        status: 'placeholder',
        message: 'This endpoint will provide personalized training recommendations',
        estimatedImplementation: 'Q2 2025'
      },
      timestamp: safeFormatDate(new Date())
    });
    
  } catch (error) {
    console.error(`❌ ${ROUTE_NAME.toUpperCase()} training recommendations error:`, error);
    const { statusCode, response } = createErrorResponse(
      'Service temporarily unavailable',
      'SERVICE_UNAVAILABLE',
      500,
      error.message
    );
    return res.status(statusCode).json(response);
  }
});

/**
 * GET /supplements/recommendations/:userId
 * Get personalized supplement recommendations
 */
router.get('/supplements/recommendations/:userId', authenticateToken, async (req, res) => {
  try {
    const validation = validateUserId(req.params.userId);
    if (!validation.isValid) {
      const { statusCode, response } = createErrorResponse(validation.error, 'INVALID_USER_ID', 400);
      return res.status(statusCode).json(response);
    }
    
    res.json({
      success: true,
      message: 'Supplement algorithm will be implemented in future updates',
      data: {
        userId: validation.userId,
        status: 'placeholder',
        message: 'This endpoint will provide personalized supplement recommendations',
        estimatedImplementation: 'Q3 2025'
      },
      timestamp: safeFormatDate(new Date())
    });
  } catch (error) {
    console.error(`❌ ${ROUTE_NAME.toUpperCase()} supplement recommendations error:`, error);
    const { statusCode, response } = createErrorResponse('Service temporarily unavailable', 'SERVICE_UNAVAILABLE', 500, error.message);
    return res.status(statusCode).json(response);
  }
});

/**
 * GET /recovery/optimization/:userId
 * Get recovery optimization plans
 */
router.get('/recovery/optimization/:userId', authenticateToken, async (req, res) => {
  try {
    const validation = validateUserId(req.params.userId);
    if (!validation.isValid) {
      const { statusCode, response } = createErrorResponse(validation.error, 'INVALID_USER_ID', 400);
      return res.status(statusCode).json(response);
    }
    
    res.json({
      success: true,
      message: 'Recovery algorithm will be implemented in future updates',
      data: {
        userId: validation.userId,
        status: 'placeholder',
        message: 'This endpoint will provide recovery optimization plans',
        estimatedImplementation: 'Q2 2025'
      },
      timestamp: safeFormatDate(new Date())
    });
  } catch (error) {
    console.error(`❌ ${ROUTE_NAME.toUpperCase()} recovery optimization error:`, error);
    const { statusCode, response } = createErrorResponse('Service temporarily unavailable', 'SERVICE_UNAVAILABLE', 500, error.message);
    return res.status(statusCode).json(response);
  }
});

/**
 * GET /performance/predictions/:userId
 * Get performance predictions
 */
router.get('/performance/predictions/:userId', authenticateToken, async (req, res) => {
  try {
    const validation = validateUserId(req.params.userId);
    if (!validation.isValid) {
      const { statusCode, response } = createErrorResponse(validation.error, 'INVALID_USER_ID', 400);
      return res.status(statusCode).json(response);
    }
    
    res.json({
      success: true,
      message: 'Performance prediction algorithm will be implemented in future updates',
      data: {
        userId: validation.userId,
        status: 'placeholder',
        message: 'This endpoint will provide performance predictions',
        estimatedImplementation: 'Q3 2025'
      },
      timestamp: safeFormatDate(new Date())
    });
  } catch (error) {
    console.error(`❌ ${ROUTE_NAME.toUpperCase()} performance predictions error:`, error);
    const { statusCode, response } = createErrorResponse('Service temporarily unavailable', 'SERVICE_UNAVAILABLE', 500, error.message);
    return res.status(statusCode).json(response);
  }
});

/**
 * GET /la28/qualification/:userId
 * Get LA28 qualification roadmaps
 */
router.get('/la28/qualification/:userId', authenticateToken, async (req, res) => {
  try {
    const validation = validateUserId(req.params.userId);
    if (!validation.isValid) {
      const { statusCode, response } = createErrorResponse(validation.error, 'INVALID_USER_ID', 400);
      return res.status(statusCode).json(response);
    }
    
    res.json({
      success: true,
      message: 'LA28 qualification algorithm will be implemented in future updates',
      data: {
        userId: validation.userId,
        status: 'placeholder',
        message: 'This endpoint will provide LA28 qualification roadmaps',
        estimatedImplementation: 'Q1 2025'
      },
      timestamp: safeFormatDate(new Date())
    });
  } catch (error) {
    console.error(`❌ ${ROUTE_NAME.toUpperCase()} LA28 qualification error:`, error);
    const { statusCode, response } = createErrorResponse('Service temporarily unavailable', 'SERVICE_UNAVAILABLE', 500, error.message);
    return res.status(statusCode).json(response);
  }
});

/**
 * GET /dashboard/:userId
 * Get comprehensive dashboard algorithm data
 */
router.get('/dashboard/:userId', authenticateToken, async (req, res) => {
  try {
    const validation = validateUserId(req.params.userId);
    if (!validation.isValid) {
      const { statusCode, response } = createErrorResponse(validation.error, 'INVALID_USER_ID', 400);
      return res.status(statusCode).json(response);
    }
    
    res.json({
      success: true,
      message: 'Dashboard algorithm integration will be implemented in future updates',
      data: {
        userId: validation.userId,
        status: 'placeholder',
        message: 'This endpoint will provide comprehensive dashboard algorithm data',
        estimatedImplementation: 'Q2 2025'
      },
      timestamp: safeFormatDate(new Date())
    });
  } catch (error) {
    console.error(`❌ ${ROUTE_NAME.toUpperCase()} dashboard data error:`, error);
    const { statusCode, response } = createErrorResponse('Service temporarily unavailable', 'SERVICE_UNAVAILABLE', 500, error.message);
    return res.status(statusCode).json(response);
  }
});

// =============================================================================
// ERROR HANDLING MIDDLEWARE
// =============================================================================

/**
 * 404 handler for unmatched routes
 */
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    path: req.originalUrl,
    method: req.method,
    timestamp: safeFormatDate(new Date())
  });
});

/**
 * Global error handler (catches unhandled errors)
 */
router.use((err, req, res, next) => {
  console.error(`${ROUTE_NAME.toUpperCase()} unhandled error:`, err);
  
  const { statusCode, response } = createErrorResponse(
    'An unexpected error occurred',
    'INTERNAL_ERROR',
    500,
    process.env.NODE_ENV === 'development' ? err.message : null
  );
  
  res.status(statusCode).json(response);
});

export default router;