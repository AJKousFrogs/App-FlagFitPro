import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pg from 'pg';
import dotenv from 'dotenv';
import algorithmRoutes from './routes/algorithmRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

// Load environment variables
dotenv.config();

const { Pool } = pg;

const app = express();
const PORT = process.env.PORT || 3001;

// Enhanced CORS configuration for better cross-browser support
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:4000', 
    'http://localhost:5173', 
    'http://127.0.0.1:3000', 
    'http://127.0.0.1:4000', 
    'http://127.0.0.1:5173',
    // Add support for common development ports
    'http://localhost:8080',
    'http://localhost:8000',
    'http://localhost:5000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200 // Some legacy browsers require this
}));

// Enhanced middleware with better error handling
app.use(express.json({ 
  limit: '10mb', // Prevent large payload attacks
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({ 
        success: false, 
        error: 'Invalid JSON payload' 
      });
      throw new Error('Invalid JSON');
    }
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Database connection with enhanced error handling
let pool;
try {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://your-neon-connection-string-here',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    // Add connection timeout and retry logic
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 30000,
    max: 20,
    // Add retry logic for connection failures
    retryDelay: 1000,
    maxRetries: 3
  });
  
  // Test connection with better error handling
  pool.on('connect', () => {
    console.log('✅ Connected to Neon PostgreSQL database');
  });
  
  pool.on('error', (err) => {
    console.error('❌ Database connection error:', err);
  });
  
  pool.on('acquire', () => {
    console.log('🔗 Database client acquired');
  });
  
  pool.on('release', () => {
    console.log('🔓 Database client released');
  });
  
} catch (error) {
  console.error('❌ Failed to create database pool:', error);
  pool = null;
}

// JWT secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Test database connection with timeout
const testDatabaseConnection = async () => {
  if (!pool) {
    console.error('❌ Database pool not available');
    return;
  }
  
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connection test successful:', result.rows[0]);
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
  }
};

// Test connection after a short delay
setTimeout(testDatabaseConnection, 1000);

// Create users table if it doesn't exist with better error handling
const createUsersTable = async () => {
  if (!pool) {
    console.error('❌ Cannot create users table: Database pool not available');
    return;
  }
  
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table ready');
  } catch (error) {
    console.error('❌ Error creating users table:', error);
  }
};

// Create table after connection is established
setTimeout(createUsersTable, 2000);

// Helper function to safely verify JWT tokens
const safeJWTVerify = (token, secret) => {
  try {
    return new Promise((resolve, reject) => {
      jwt.verify(token, secret, (err, decoded) => {
        if (err) {
          reject(err);
        } else {
          resolve(decoded);
        }
      });
    });
  } catch (error) {
    throw new Error('JWT verification failed');
  }
};

// Helper function to safely hash passwords
const safeHashPassword = async (password, saltRounds = 10) => {
  try {
    return await bcrypt.hash(password, saltRounds);
  } catch (error) {
    throw new Error('Password hashing failed');
  }
};

// Helper function to safely compare passwords
const safeComparePassword = async (password, hash) => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Routes

// Algorithm API routes
app.use('/api/algorithms', algorithmRoutes);

// Serve static files (HTML, CSS, JS) with better error handling
app.use(express.static('.', {
  dotfiles: 'ignore',
  etag: true,
  lastModified: true,
  maxAge: '1h'
}));

// Dashboard API routes
app.use('/api/dashboard', dashboardRoutes);

// Analytics API routes
app.use('/api/analytics', analyticsRoutes);

// Simple login route for testing (accepts any email/password) - Enhanced
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Enhanced validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
        code: 'INVALID_EMAIL'
      });
    }
    
    // For testing: accept any email and password
    if (email && password) {
      // Generate a simple JWT token with enhanced payload
      const token = jwt.sign(
        { 
          userId: '1', 
          email: email.trim().toLowerCase(),
          role: 'player', // Default role
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
        }, 
        JWT_SECRET, 
        { 
          expiresIn: '24h',
          issuer: 'flagfit-pro',
          audience: 'flagfit-users'
        }
      );
      
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          token: token,
          user: {
            id: '1',
            email: email.trim().toLowerCase(),
            fullName: email.split('@')[0], // Use email prefix as name
            role: 'player',
            loginTime: new Date().toISOString()
          }
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Email and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      code: 'LOGIN_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// CSRF token endpoint - Enhanced
app.get('/api/auth/csrf', (req, res) => {
  try {
    const csrfToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    res.json({ 
      success: true, 
      csrfToken: csrfToken,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ CSRF token generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate CSRF token',
      code: 'CSRF_ERROR'
    });
  }
});

// Enhanced health check
app.get('/api/health', async (req, res) => {
  try {
    const healthStatus = {
      success: true,
      message: 'API is healthy',
      code: 200,
      timestamp: new Date().toISOString(),
      services: {
        database: pool ? 'connected' : 'disconnected',
        algorithm: 'active',
        dashboard: 'active',
        analytics: 'active'
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development'
    };
    
    // Test database connection if available
    if (pool) {
      try {
        await pool.query('SELECT 1');
        healthStatus.services.database = 'connected';
      } catch (dbError) {
        healthStatus.services.database = 'error';
        healthStatus.warnings = ['Database connection test failed'];
      }
    }
    
    res.json(healthStatus);
  } catch (error) {
    console.error('❌ Health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      code: 500,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Enhanced user registration
app.post('/api/auth/register', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({
        success: false,
        error: 'Database service unavailable',
        code: 'DB_UNAVAILABLE'
      });
    }
    
    const { email, password, fullName } = req.body;

    // Enhanced validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password must be at least 8 characters long',
        code: 'PASSWORD_TOO_SHORT'
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
        code: 'INVALID_EMAIL'
      });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.trim().toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'User with this email already exists',
        code: 'USER_EXISTS'
      });
    }

    // Hash password safely
    const passwordHash = await safeHashPassword(password, 12); // Increased salt rounds

    // Create user with better error handling
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name',
      [email.trim().toLowerCase(), passwordHash, fullName?.trim() || 'User']
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: 'player'
      },
      JWT_SECRET,
      { 
        expiresIn: '24h',
        issuer: 'flagfit-pro',
        audience: 'flagfit-users'
      }
    );

    res.json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name
      },
      token
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Registration failed',
      code: 'REGISTRATION_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Enhanced user login
app.post('/api/auth/login', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({
        success: false,
        error: 'Database service unavailable',
        code: 'DB_UNAVAILABLE'
      });
    }
    
    const { email, password } = req.body;

    // Enhanced validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Find user
    const result = await pool.query(
      'SELECT id, email, password_hash, full_name FROM users WHERE email = $1',
      [email.trim().toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const user = result.rows[0];

    // Verify password safely
    const isValidPassword = await safeComparePassword(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: 'player'
      },
      JWT_SECRET,
      { 
        expiresIn: '24h',
        issuer: 'flagfit-pro',
        audience: 'flagfit-users'
      }
    );

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name
      },
      token
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Login failed',
      code: 'LOGIN_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Enhanced get current user
app.get('/api/auth/me', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({
        success: false,
        error: 'Database service unavailable',
        code: 'DB_UNAVAILABLE'
      });
    }
    
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'No token provided',
        code: 'MISSING_TOKEN'
      });
    }

    const decoded = await safeJWTVerify(token, JWT_SECRET);
    
    // Type guard for JwtPayload to ensure userId exists
    const userId = typeof decoded === 'object' && 'userId' in decoded ? decoded.userId : null;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid token payload',
        code: 'INVALID_TOKEN_PAYLOAD'
      });
    }

    const result = await pool.query(
      'SELECT id, email, full_name FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name
      }
    });

  } catch (error) {
    console.error('❌ Get user error:', error);
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({ 
        success: false, 
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    } else if (error.name === 'TokenExpiredError') {
      res.status(401).json({ 
        success: false, 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Authentication failed',
        code: 'AUTH_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
});

// Enhanced logout
app.post('/api/auth/logout', (req, res) => {
  try {
    res.json({ 
      success: true, 
      message: 'Logged out successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      code: 'LOGOUT_ERROR'
    });
  }
});

// Global error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Global error handler:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    details: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler for unmatched routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  if (pool) {
    pool.end();
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully...');
  if (pool) {
    pool.end();
  }
  process.exit(0);
});

// Start server with enhanced error handling
const server = app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/*`);
  console.log(`🧠 Algorithm endpoints: http://localhost:${PORT}/api/algorithms/*`);
  console.log(`📈 Dashboard endpoints: http://localhost:${PORT}/api/dashboard/*`);
  console.log(`📊 Analytics endpoints: http://localhost:${PORT}/api/analytics/*`);
});

// Server error handling
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  } else {
    console.error('❌ Server error:', error);
  }
  process.exit(1);
}); 