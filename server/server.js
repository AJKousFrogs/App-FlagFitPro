/**
 * FlagFit Pro Backend Server
 * Express.js API server with Neon PostgreSQL integration
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import database and routes
import db from './config/database.js';
import authRoutes from './routes/auth.js';
import trainingRoutes from './routes/training.js';
import nutritionRoutes from './routes/nutrition.js';

// Load environment variables
dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false, // Allow embedding for development
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.nal.usda.gov"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// Auth rate limiting (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 auth requests per windowMs (increased for development)
  message: {
    error: 'Too many authentication attempts, please try again later.'
  }
});

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:4000',
      'http://localhost:3000',
      'http://127.0.0.1:4000',
      'http://127.0.0.1:3000'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Allow all origins in development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID', 'X-Requested-With'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined'));

// Request logging for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await db.healthCheck();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: dbHealth,
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// API Routes
app.use('/auth', authLimiter, authRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/nutrition', nutritionRoutes);

// Analytics endpoint
app.post('/api/analytics/events', express.json(), async (req, res) => {
  try {
    const { userId, eventType, eventData, sessionId, pageUrl } = req.body;
    
    await db.logAnalyticsEvent({
      userId: userId || 'anonymous',
      eventType,
      eventData,
      sessionId: sessionId || 'unknown',
      pageUrl: pageUrl || '',
      userAgent: req.headers['user-agent'] || ''
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Analytics logging error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to log analytics event' 
    });
  }
});

// AI Coach endpoints
app.get('/api/coach/knowledge', async (req, res) => {
  try {
    const { type, limit = 10 } = req.query;
    
    const knowledge = await db.query`
      SELECT 
        knowledge_type,
        title,
        content,
        confidence_score,
        source,
        tags
      FROM ai_coach_knowledge
      ${type ? db.query`WHERE knowledge_type = ${type}` : db.query``}
      ORDER BY confidence_score DESC, created_at DESC
      LIMIT ${parseInt(limit)}
    `;

    res.json({
      success: true,
      data: knowledge
    });
  } catch (error) {
    console.error('Get coach knowledge error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch coach knowledge'
    });
  }
});

// Recovery endpoints
app.get('/api/recovery/protocols', async (req, res) => {
  try {
    const protocols = await db.query`
      SELECT 
        id,
        protocol_name,
        description,
        duration_minutes,
        equipment_needed,
        target_recovery_type,
        effectiveness_rating
      FROM recovery_protocols
      WHERE is_active = true
      ORDER BY effectiveness_rating DESC, protocol_name
    `;

    res.json({
      success: true,
      data: protocols
    });
  } catch (error) {
    console.error('Get recovery protocols error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recovery protocols'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON in request body'
    });
  }
  
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
async function startServer() {
  try {
    // Initialize database connection
    await db.connect();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`
🚀 FlagFit Pro Backend Server Started!
==========================================
📍 Port: ${PORT}
🗄️  Database: Connected to Neon PostgreSQL
🔐 Auth: JWT with bcrypt
📊 Analytics: Event logging enabled
🏥 Health: GET /health
📋 API Docs: 
   - POST /auth/register
   - POST /auth/login  
   - GET  /api/training/sessions
   - GET  /api/nutrition/logs
   - GET  /api/coach/knowledge
==========================================
Server ready for frontend connections!
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down server gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Shutting down server gracefully...');
  process.exit(0);
});

// Start the server
startServer();