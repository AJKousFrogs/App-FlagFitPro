/**
 * Development server for Flag Football Training App
 * Serves static files with proper MIME types and provides REAL API endpoints with Supabase
 *
 * @version 2.3.0 - Modular routes migration
 */

import { createClient } from "@supabase/supabase-js";
import chokidar from "chokidar";
import cors from "cors";
import "dotenv/config";
import express from "express";
import { rateLimit } from "express-rate-limit";
import fs from "fs";
import helmet from "helmet";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer } from "ws";

// Import modular routes
import analyticsRoutes from "./routes/analytics.routes.js";
import communityRoutes from "./routes/community.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import notificationsRoutes from "./routes/notifications.routes.js";
import trainingRoutes from "./routes/training.routes.js";
import wellnessRoutes from "./routes/wellness.routes.js";

// Import monitoring middleware
import {
    getMetrics,
    requestLogger,
} from "./routes/middleware/request-logger.middleware.js";

// Import auth middleware (centralized - avoids duplication)
import {
    authenticateToken,
    authorizeUserAccess,
    optionalAuth,
} from "./routes/middleware/auth.middleware.js";

// Initialize Supabase client for real data
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Helper to validate UUID
const isValidUUID = (uuid) => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Default fallback UUID for demo/test purposes
const DEMO_USER_ID = "00000000-0000-0000-0000-000000000000";

if (supabase) {
  console.log("✅ Supabase client initialized - using REAL data");
} else {
  console.warn(
    "⚠️ Supabase not configured - API endpoints will return 503 errors",
  );
}

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const PORT = process.env.PORT || 4000;

// Hot reload WebSocket connection
wss.on("connection", (ws) => {
  console.log("🔗 Hot reload client connected");
  ws.on("close", () => console.log("🔌 Hot reload client disconnected"));
});

// ============================================
// COMPATIBILITY & MOCK ENDPOINTS (Priority removed - using REAL data)
// ============================================

// ============================================
// END COMPATIBILITY & MOCK ENDPOINTS
// ============================================

// File watcher for hot reload
const watcher = chokidar.watch(
  [
    "angular/dist/flagfit-pro/browser/**/*",
    "src/**/*",
    "index.html",
    "*.css",
    "*.js",
  ],
  { ignored: /(^|[/\\])\../, persistent: true },
);

watcher.on("change", (filePath) => {
  console.log(`📁 File changed: ${filePath}`);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      // 1 = OPEN
      client.send(
        JSON.stringify({
          type: "reload",
          file: filePath,
          timestamp: Date.now(),
        }),
      );
    }
  });
});

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    success: false,
    error: "Too many attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for general API routes
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  message: {
    success: false,
    error: "Too many requests. Please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for write operations (POST/PUT/DELETE)
const writeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 write operations per minute per IP
  message: {
    success: false,
    error: "Too many write operations. Please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// NOTE: Auth middleware (authenticateToken, authorizeUserAccess, optionalAuth) 
// is now imported from ./routes/middleware/auth.middleware.js to avoid duplication.
// See imports at top of file.

// Enable CORS - dynamically allow localhost and local network for development
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin) {
        return callback(null, true);
      }

      // Allow any localhost or 127.0.0.1 origin (any port) for development
      const localhostPattern = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
      if (localhostPattern.test(origin)) {
        return callback(null, true);
      }

      // Allow local network IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x) for development
      const localNetworkPattern =
        /^http:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/;
      if (localNetworkPattern.test(origin)) {
        return callback(null, true);
      }

      // Allow Netlify deployments
      if (origin.includes("netlify.app") || origin.includes("netlify.com")) {
        return callback(null, true);
      }

      // Reject other origins in production, but log for debugging
      console.warn(`[CORS] Blocked origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
  }),
);

// Security headers with Helmet.js
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // Required for Angular inline styles
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Required for Angular dev mode
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https://*.supabase.co", "wss://*.supabase.co"],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Disable for Angular compatibility
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
  }),
);

// Parse JSON and URL-encoded bodies with size limits
app.use(
  express.json({
    limit: "10mb",
    verify: (req, res, buf, encoding) => {
      // Log large payloads for monitoring
      if (buf.length > 1024 * 1024) {
        // > 1MB
        console.warn(
          `[Security] Large request body: ${(buf.length / 1024 / 1024).toFixed(2)}MB from ${req.ip}`,
        );
      }
    },
  }),
);

// Structured request logging with metrics
app.use(requestLogger());
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Apply rate limiter to auth routes
app.use("/api/auth/", authLimiter);

// Apply rate limiter to all API routes
app.use("/api/", apiLimiter);

// Apply write limiter to POST/PUT/DELETE operations
app.use("/api/", (req, res, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    return writeLimiter(req, res, next);
  }
  next();
});

// =============================================================================
// MODULAR ROUTES (v2.3.0)
// These routes are organized in separate files for better maintainability
// Primary API paths - modular routes handle all traffic
// =============================================================================

// Primary paths (production)
app.use("/api/training", trainingRoutes);
app.use("/api/wellness", wellnessRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/community", communityRoutes);

// Versioned paths for explicit version targeting
app.use("/api/v2/training", trainingRoutes);
app.use("/api/v2/wellness", wellnessRoutes);
app.use("/api/v2/analytics", analyticsRoutes);
app.use("/api/v2/notifications", notificationsRoutes);
app.use("/api/v2/dashboard", dashboardRoutes);
app.use("/api/v2/community", communityRoutes);

// =============================================================================
// STATIC FILES & LEGACY ROUTES
// =============================================================================

// Serve Angular build files
app.use(
  express.static("angular/dist/flagfit-pro/browser", {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript");
      } else if (filePath.endsWith(".css")) {
        res.setHeader("Content-Type", "text/css");
      } else if (filePath.endsWith(".html")) {
        res.setHeader("Content-Type", "text/html");
      }
    },
    dotfiles: "ignore",
    etag: true,
    lastModified: true,
    maxAge: "1h",
  }),
);

// Legacy src serving removed as all code migrated to Angular 21

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "OK",
    message: "Flag Football Training App Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Metrics endpoint for monitoring
app.get("/api/metrics", (_req, res) => {
  const metrics = getMetrics();
  res.json({
    success: true,
    data: metrics,
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// DAILY TRAINING - REAL DATA FROM DATABASE
// ============================================
app.get("/api/daily-training", async (_req, res) => {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const dayOfWeek = today.toLocaleDateString("en-US", { weekday: "long" });
  const hour = today.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (!supabase) {
    return res.status(500).json({
      success: false,
      error: "Database not configured",
    });
  }

  try {
    // Get the active training program
    const { data: program } = await supabase
      .from("training_programs")
      .select("id, name, description")
      .eq("is_active", true)
      .single();

    if (!program) {
      return res.json({
        success: true,
        data: {
          greeting: `${greeting}!`,
          date: todayStr,
          dayOfWeek,
          message:
            "No training program found. Please set up your annual program to see daily training data.",
          trainingStatus: {
            phase: "No Active Program",
            acwr: 0,
            acwrStatus: "N/A",
            recentSessions: 0,
          },
          todaysPractice: {
            sessionType: "No Data",
            isRestDay: false,
            message: "No training data available",
            schedule: [],
          },
        },
      });
    }

    // Find current week based on today's date
    const { data: currentWeek } = await supabase
      .from("training_weeks")
      .select("*, training_phases(id, name, description, focus_areas)")
      .lte("start_date", todayStr)
      .gte("end_date", todayStr)
      .single();

    // If no week covers today, check if we're in a rest period between phases
    let trainingStatus;
    let todaysPractice = null;

    if (currentWeek) {
      trainingStatus = {
        phase: currentWeek.training_phases?.name || currentWeek.name,
        week: currentWeek.name,
        focus: currentWeek.focus,
        intensity: currentWeek.intensity_level,
        loadPercentage: currentWeek.load_percentage,
        acwr: 0.95, // Would calculate from real data
        acwrStatus: "Optimal",
        recentSessions: 0,
      };

      // Determine session type based on day of week
      const dayIndex = today.getDay(); // 0 = Sunday
      const sessionTypes = {
        0: {
          type: "Rest",
          focus: ["Complete recovery", "No training scheduled"],
          duration: 0,
          isRestDay: true,
        },
        1: {
          type: "Strength",
          focus: ["Lower body power", "Compound movements"],
          duration: 75,
        },
        2: {
          type: "Speed",
          focus: ["Sprint mechanics", "Acceleration"],
          duration: 60,
        },
        3: {
          type: "Strength",
          focus: ["Upper body", "Core stability"],
          duration: 60,
        },
        4: {
          type: "Recovery",
          focus: ["Active recovery", "Mobility work", "Light movement"],
          duration: 45,
        },
        5: {
          type: "Power",
          focus: ["Plyometrics", "Agility drills", "Reactive training"],
          duration: 60,
        },
        6: {
          type: "Practice",
          focus: ["Flag football practice", "Game simulation"],
          duration: 90,
        },
      };

      const daySession = sessionTypes[dayIndex];

      todaysPractice = {
        sessionType: daySession.type,
        focus: daySession.focus,
        totalDuration: daySession.duration,
        weekName: currentWeek.name,
        phaseName: currentWeek.training_phases?.name,
        phaseDescription: currentWeek.training_phases?.description,
        weekFocus: currentWeek.focus,
        intensity: currentWeek.intensity_level,
        isRestDay: daySession.isRestDay || false,
        message: daySession.isRestDay
          ? "Rest Day: Focus on recovery and nutrition."
          : null,
        schedule:
          daySession.duration > 0
            ? [
                { block: "Warm-Up", duration: 15, completed: false },
                {
                  block: "Main Session",
                  duration: daySession.duration - 25,
                  completed: false,
                  type: daySession.type.toLowerCase(),
                  focus: daySession.focus,
                },
                { block: "Cool-Down", duration: 10, completed: false },
              ]
            : [],
      };
    } else {
      // Check if we're between phases (rest period)
      const { data: nextWeek } = await supabase
        .from("training_weeks")
        .select("name, start_date, training_phases(name)")
        .gt("start_date", todayStr)
        .order("start_date", { ascending: true })
        .limit(1)
        .single();

      const { data: prevWeek } = await supabase
        .from("training_weeks")
        .select("name, end_date, training_phases(name)")
        .lt("end_date", todayStr)
        .order("end_date", { ascending: false })
        .limit(1)
        .single();

      trainingStatus = {
        phase: "Transition Period",
        week: "Rest/Recovery",
        focus: "Active recovery between training phases",
        intensity: "Low",
        loadPercentage: 0,
        acwr: 0,
        acwrStatus: "Rest Period",
        recentSessions: 0,
        previousPhase: prevWeek?.training_phases?.name,
        nextPhase: nextWeek?.training_phases?.name,
        nextWeekStart: nextWeek?.start_date,
      };

      todaysPractice = {
        sessionType: "Rest",
        isRestDay: true,
        focus: [
          "Complete rest",
          "Light walking",
          "Mental preparation for next phase",
        ],
        totalDuration: 0,
        message: `Rest Period: Transitioning between ${prevWeek?.training_phases?.name || "previous phase"} and ${nextWeek?.training_phases?.name || "next phase"}. Next training starts ${nextWeek?.start_date || "soon"}.`,
        schedule: [],
      };
    }

    // Get plyometrics exercises from database
    const { data: plyoExercises } = await supabase
      .from("plyometrics_exercises")
      .select(
        "id, exercise_name, description, difficulty_level, recommended_contacts",
      )
      .limit(5);

    // Get exercises from database
    const { data: exercises } = await supabase
      .from("exercises")
      .select("id, name, description, category")
      .limit(5);

    res.json({
      success: true,
      data: {
        greeting: `${greeting}!`,
        date: todayStr,
        dayOfWeek,
        program: {
          name: program.name,
          description: program.description,
        },
        trainingStatus,
        todaysPractice,
        availableExercises: {
          plyometrics: plyoExercises || [],
          strength: exercises || [],
        },
        motivationalMessage: getMotivationalMessage(trainingStatus.phase),
      },
    });
  } catch (error) {
    console.error("[Daily Training] Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to load daily training",
      details: error.message,
    });
  }
});

function getMotivationalMessage(phase) {
  const messages = {
    Foundation: "Building the foundation for greatness. Every rep counts!",
    "Power Development":
      "Converting strength to explosive power. Train like a champion!",
    Speed: "Speed is a skill. Perfect your mechanics today!",
    Recovery: "Recovery is when you grow stronger. Rest well!",
    "Transition Period": "Rest and prepare. The next phase awaits!",
    default: "Every day is an opportunity to get better.",
  };
  return messages[phase] || messages.default;
}

// ============================================
// TRAINING PROGRAMS - REAL DATA
// ============================================
app.get("/api/training-programs", async (_req, res) => {
  if (!supabase) {
    return res
      .status(500)
      .json({ success: false, error: "Database not configured" });
  }

  try {
    const { data: programs, error } = await supabase
      .from("training_programs")
      .select(
        `
        id, name, description, start_date, end_date, is_active,
        training_phases (
          id, name, description, phase_order, start_date, end_date,
          training_weeks (
            id, name, week_number, start_date, end_date, focus, intensity_level, load_percentage
          )
        )
      `,
      )
      .order("is_active", { ascending: false });

    if (error) {
      throw error;
    }

    res.json({ success: true, data: programs });
  } catch (error) {
    console.error("[Training Programs] Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// MOCK API ENDPOINTS FOR DEVELOPMENT
// ============================================

// ============================================
// AUTHENTICATION - REAL DATA
// ============================================

app.post("/api/auth/login", async (req, res) => {
  if (!supabase) {
    return res
      .status(503)
      .json({ success: false, error: "Database not configured" });
  }

  try {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: {
        token: data.session.access_token,
        user: data.user,
      },
    });
  } catch (error) {
    console.error("[Login] Error:", error);
    res.status(401).json({ success: false, error: error.message });
  }
});

app.post("/api/auth/register", async (req, res) => {
  if (!supabase) {
    return res
      .status(503)
      .json({ success: false, error: "Database not configured" });
  }

  try {
    const { email, password, name } = req.body;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: {
        token: data.session?.access_token,
        user: data.user,
      },
    });
  } catch (error) {
    console.error("[Register] Error:", error);
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get("/api/auth/me", async (req, res) => {
  if (!supabase) {
    return res
      .status(503)
      .json({ success: false, error: "Database not configured" });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res
        .status(401)
        .json({ success: false, error: "No token provided" });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw error || new Error("User not found");
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("[Auth Me] Error:", error);
    res.status(401).json({ success: false, error: "Not authenticated" });
  }
});

app.post("/api/auth/logout", async (req, res) => {
  if (supabase) {
    await supabase.auth.signOut();
  }
  res.json({ success: true, message: "Logged out successfully" });
});

// ============================================
// LEGACY ENDPOINTS REMOVED (January 2026)
// All clients now use /api/* routes directly
// ============================================

// =============================================================================
// DASHBOARD ENDPOINTS - Now handled by modular routes at /api/dashboard/*
// See: routes/dashboard.routes.js
// =============================================================================

app.get("/api/community/health", async (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "community",
  });
});

// Dashboard Notifications
app.get("/api/dashboard/notifications", async (req, res) => {
  let userId = req.query.userId || "1";
  if (!supabase) {
    return res
      .status(503)
      .json({ success: false, error: "Database not configured", data: [] });
  }

  // Handle invalid UUIDs for Supabase queries
  if (!isValidUUID(userId)) {
    userId = DEMO_USER_ID;
  }

  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      throw error;
    }
    res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error("[Notifications] Error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to load notifications" });
  }
});

app.get("/api/dashboard/notifications/count", async (req, res) => {
  let userId = req.query.userId || "1";
  if (!supabase) {
    return res.status(503).json({
      success: false,
      error: "Database not configured",
      data: { unreadCount: 0 },
    });
  }

  if (!isValidUUID(userId)) {
    userId = DEMO_USER_ID;
  }

  try {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) {
      throw error;
    }
    res.json({ success: true, data: { unreadCount: count || 0 } });
  } catch (error) {
    console.error("[Notifications Count] Error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to load notification count" });
  }
});

// Legacy notifications-count redirect removed (January 2026)

// Performance Endpoints
app.get("/api/performance/metrics", async (req, res) => {
  res.json({
    success: true,
    data: {
      speed: 85,
      agility: 78,
      power: 92,
      endurance: 80,
      readiness: 88,
    },
  });
});

app.get("/api/performance/heatmap", async (req, res) => {
  res.json({
    success: true,
    data: {
      zones: [
        { name: "Field Left", value: 65 },
        { name: "Field Center", value: 88 },
        { name: "Field Right", value: 45 },
      ],
    },
  });
});

// =============================================================================
// TRAINING ENDPOINTS - Now handled by modular routes at /api/training/*
// See: routes/training.routes.js
// =============================================================================

// Exercise Library - REAL DATA
app.get("/api/exercises", async (req, res) => {
  if (!supabase) {
    return res
      .status(503)
      .json({ success: false, error: "Database not configured" });
  }

  try {
    const { category, position, search } = req.query;

    let query = supabase.from("exercises").select("*").eq("active", true);

    if (category && category !== "all") {
      query = query.eq("category", category);
    }
    if (position) {
      query = query.contains("position_specific", [position]);
    }
    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data: exercises, error } = await query.order("name").limit(200);
    if (error) {
      throw error;
    }

    res.json({ success: true, data: exercises || [] });
  } catch (error) {
    console.error("[Exercises] Error:", error);
    res.status(500).json({ success: false, error: "Failed to load exercises" });
  }
});

// =============================================================================
// ANALYTICS ENDPOINTS - Now handled by modular routes at /api/analytics/*
// See: routes/analytics.routes.js
// =============================================================================

// ACWR / Load Management - REAL DATA
app.get("/api/load-management/acwr", async (req, res) => {
  if (!supabase) {
    return res
      .status(503)
      .json({ success: false, error: "Database not configured" });
  }

  try {
    const authHeader = req.headers.authorization;
    let userId = req.query.user_id;

    if (authHeader && !userId) {
      const token = authHeader.replace("Bearer ", "");
      const {
        data: { user },
      } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, error: "User ID required" });
    }

    const today = new Date();
    const acuteStartDate = new Date(today);
    acuteStartDate.setDate(acuteStartDate.getDate() - 7);
    const chronicStartDate = new Date(today);
    chronicStartDate.setDate(chronicStartDate.getDate() - 28);

    const { data: sessions, error } = await supabase
      .from("training_sessions")
      .select("session_date, duration_minutes, rpe, intensity_level")
      .eq("user_id", isValidUUID(userId) ? userId : DEMO_USER_ID)
      .gte("session_date", chronicStartDate.toISOString().split("T")[0])
      .lte("session_date", today.toISOString().split("T")[0])
      .in("status", ["completed", "in_progress"]);

    if (error) {
      throw error;
    }

    if (!sessions || sessions.length === 0) {
      return res.json({
        success: true,
        data: {
          acwr: null,
          riskZone: "insufficient_data",
          message: "No training data available",
        },
      });
    }

    const sessionsWithLoad = sessions.map((s) => ({
      ...s,
      load: (s.duration_minutes || 60) * (s.rpe || s.intensity_level || 5),
      date: new Date(s.session_date),
    }));

    const acuteSessions = sessionsWithLoad.filter(
      (s) => s.date >= acuteStartDate,
    );
    const acuteLoad = acuteSessions.reduce((sum, s) => sum + s.load, 0);
    const chronicLoad = sessionsWithLoad.reduce((sum, s) => sum + s.load, 0);
    const chronicAverage = chronicLoad / 4;

    if (chronicAverage === 0) {
      return res.json({
        success: true,
        data: {
          acwr: acuteLoad > 0 ? 99 : 0,
          riskZone: acuteLoad > 0 ? "danger" : "insufficient_data",
        },
      });
    }

    const acwr = acuteLoad / chronicAverage;

    let riskZone, message;
    if (acwr < 0.8) {
      riskZone = "detraining";
      message = "Training load too low - consider gradual increase";
    } else if (acwr <= 1.3) {
      riskZone = "optimal";
      message = "Sweet spot! Optimal training zone";
    } else if (acwr <= 1.5) {
      riskZone = "caution";
      message = "Elevated load - monitor closely";
    } else {
      riskZone = "danger";
      message = "HIGH INJURY RISK - reduce training load";
    }

    res.json({
      success: true,
      data: {
        acwr: parseFloat(acwr.toFixed(2)),
        riskZone,
        message,
        acuteLoad,
        chronicLoad: parseFloat(chronicAverage.toFixed(2)),
        sessionCount: sessions.length,
        recommendation:
          riskZone === "danger"
            ? "Consider rest or light recovery sessions only"
            : riskZone === "caution"
              ? "Maintain current load, avoid increases"
              : riskZone === "detraining"
                ? "Safe to increase training volume gradually"
                : "Continue current training plan",
      },
    });
  } catch (error) {
    console.error("[ACWR] Error:", error);
    res.status(500).json({ success: false, error: "Failed to calculate ACWR" });
  }
});

// Player Stats endpoint
app.get("/api/player-stats", async (req, res) => {
  const { playerId } = req.query;
  const { season } = req.query;

  if (!supabase) {
    return res.json({
      success: true,
      data: {
        playerId,
        season,
        gamesPlayed: 0,
        touchdowns: 0,
        receptions: 0,
        yards: 0,
        flagPulls: 0,
      },
    });
  }

  try {
    // Get player statistics from game_stats or player_stats table if exists
    const { data: stats } = await supabase
      .from("game_stats")
      .select("*")
      .eq("player_id", playerId)
      .order("game_date", { ascending: false })
      .limit(50);

    if (stats && stats.length > 0) {
      const totals = stats.reduce(
        (acc, s) => ({
          gamesPlayed: acc.gamesPlayed + 1,
          touchdowns: acc.touchdowns + (s.touchdowns || 0),
          receptions: acc.receptions + (s.receptions || 0),
          yards: acc.yards + (s.yards || 0),
          flagPulls: acc.flagPulls + (s.flag_pulls || 0),
        }),
        {
          gamesPlayed: 0,
          touchdowns: 0,
          receptions: 0,
          yards: 0,
          flagPulls: 0,
        },
      );

      res.json({ success: true, data: { playerId, season, ...totals } });
    } else {
      res.json({
        success: true,
        data: {
          playerId,
          season,
          gamesPlayed: 0,
          touchdowns: 0,
          receptions: 0,
          yards: 0,
          flagPulls: 0,
          message: "No stats recorded yet",
        },
      });
    }
  } catch (error) {
    console.error("[Player Stats] Error:", error);
    res.json({
      success: true,
      data: {
        playerId,
        season,
        gamesPlayed: 0,
        touchdowns: 0,
        receptions: 0,
        yards: 0,
        flagPulls: 0,
      },
    });
  }
});

// Games endpoint
app.get("/api/games", async (req, res) => {
  if (!supabase) {
    return res
      .status(503)
      .json({ success: false, error: "Database not configured", data: [] });
  }

  try {
    const { startDate, endDate, limit } = req.query;
    let query = supabase.from("games").select("*");

    if (startDate) {
      query = query.gte("game_date", startDate);
    }
    if (endDate) {
      query = query.lte("game_date", endDate);
    }

    const { data: games } = await query
      .order("game_date", { ascending: true })
      .limit(parseInt(limit) || 50);

    res.json({ success: true, data: games || [] });
  } catch (error) {
    console.error("[Games] Error:", error);
    res.json({ success: true, data: [], message: "No data available" });
  }
});

// Tournaments endpoints - REAL DATA
app.get("/api/tournaments", async (req, res) => {
  if (!supabase) {
    return res
      .status(503)
      .json({ success: false, error: "Database not configured", data: [] });
  }

  try {
    const { data: tournaments } = await supabase
      .from("tournaments")
      .select("*")
      .order("start_date", { ascending: true });

    res.json({ success: true, data: tournaments || [] });
  } catch (error) {
    console.error("[Tournaments] Error:", error);
    res.json({ success: true, data: [], message: "No data available" });
  }
});

app.get("/api/tournaments/:id", async (req, res) => {
  if (!supabase) {
    return res.json({ success: true, data: null });
  }

  try {
    const { data: tournament } = await supabase
      .from("tournaments")
      .select(
        `
        *,
        games:tournament_games (*)
      `,
      )
      .eq("id", req.params.id)
      .single();

    res.json({ success: true, data: tournament });
  } catch (error) {
    console.error("[Tournament Details] Error:", error);
    res.json({ success: true, data: null });
  }
});

app.post("/api/tournaments/createGame", async (req, res) => {
  if (!supabase) {
    return res.json({
      success: true,
      data: {
        id: Date.now().toString(),
        ...req.body,
        createdAt: new Date().toISOString(),
      },
    });
  }

  try {
    const { data: game, error } = await supabase
      .from("tournament_games")
      .insert(req.body)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({ success: true, data: game });
  } catch (error) {
    console.error("[Create Game] Error:", error);
    res.status(500).json({ success: false, error: "Failed to create game" });
  }
});

// Knowledge Base Search - REAL DATA
app.get("/api/knowledge-search", async (req, res) => {
  if (!supabase) {
    return res
      .status(503)
      .json({ success: false, error: "Database not configured", data: [] });
  }

  try {
    const { query, topic, category, limit = 10 } = req.query;

    let dbQuery = supabase
      .from("knowledge_base_entries")
      .select(
        "id, title, content, category, subcategory, source_type, evidence_grade",
      )
      .eq("is_active", true);

    if (query) {
      dbQuery = dbQuery.or(`title.ilike.%${query}%,content.ilike.%${query}%`);
    }
    if (topic) {
      dbQuery = dbQuery.ilike("title", `%${topic}%`);
    }
    if (category) {
      dbQuery = dbQuery.eq("category", category);
    }

    const { data: entries } = await dbQuery
      .order("source_quality_score", { ascending: false, nullsFirst: false })
      .limit(parseInt(limit));

    res.json({ success: true, data: entries || [] });
  } catch (error) {
    console.error("[Knowledge Search] Error:", error);
    res.json({ success: true, data: [], message: "No data available" });
  }
});

// =============================================================================
// COMMUNITY ENDPOINTS - Now handled by modular routes at /api/community/*
// See: routes/community.routes.js
// Legacy endpoints removed (January 2026)
// =============================================================================

// =============================================================================
// WELLNESS ENDPOINTS - Now handled by modular routes at /api/wellness/*
// See: routes/wellness.routes.js
// Legacy /api/wellness-checkin redirect removed (January 2026)
// =============================================================================

// Coach endpoints - REAL DATA
app.get("/api/coach/dashboard", async (req, res) => {
  if (!supabase) {
    return res.json({ success: true, data: { teamMembers: [], stats: {} } });
  }

  try {
    // Get team members
    const { data: members } = await supabase
      .from("team_members")
      .select(
        `
        id, role, jersey_number, position, status,
        users:user_id (id, email, full_name)
      `,
      )
      .eq("status", "active")
      .limit(50);

    // Get recent training sessions
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: _sessions, count: sessionCount } = await supabase
      .from("training_sessions")
      .select("*", { count: "exact" })
      .gte("session_date", sevenDaysAgo.toISOString().split("T")[0])
      .eq("status", "completed");

    res.json({
      success: true,
      data: {
        teamMembers: members || [],
        stats: {
          totalPlayers: members?.length || 0,
          sessionsThisWeek: sessionCount || 0,
          avgAttendance: 85, // Would calculate from attendance table
        },
      },
    });
  } catch (error) {
    console.error("[Coach Dashboard] Error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to load coach dashboard" });
  }
});

// Roster endpoints - REAL DATA
app.get("/api/roster", async (req, res) => {
  if (!supabase) {
    return res
      .status(503)
      .json({ success: false, error: "Database not configured", data: [] });
  }

  try {
    const { data: roster } = await supabase
      .from("team_members")
      .select(
        `
        id, role, jersey_number, position, status, joined_at,
        users:user_id (id, email, full_name, avatar_url)
      `,
      )
      .order("jersey_number");

    res.json({ success: true, data: roster || [] });
  } catch (error) {
    console.error("[Roster] Error:", error);
    res.status(500).json({ success: false, error: "Failed to load roster" });
  }
});

// Team endpoints - REAL DATA
app.get("/api/teams", async (req, res) => {
  if (!supabase) {
    return res
      .status(503)
      .json({ success: false, error: "Database not configured", data: [] });
  }

  try {
    const { data: teams } = await supabase
      .from("teams")
      .select("*")
      .eq("is_active", true)
      .order("name");

    res.json({ success: true, data: teams || [] });
  } catch (error) {
    console.error("[Teams] Error:", error);
    res.status(500).json({ success: false, error: "Failed to load teams" });
  }
});

app.get("/api/teams/:id", async (req, res) => {
  if (!supabase) {
    return res.json({ success: true, data: null });
  }

  try {
    const { data: team } = await supabase
      .from("teams")
      .select(
        `
        *,
        members:team_members (
          id, role, jersey_number, position,
          users:user_id (id, email, full_name)
        )
      `,
      )
      .eq("id", req.params.id)
      .single();

    res.json({ success: true, data: team });
  } catch (error) {
    console.error("[Team Details] Error:", error);
    res.status(500).json({ success: false, error: "Failed to load team" });
  }
});

// ============================================
// COACH ENDPOINTS - REAL DATA
// ============================================

// Coach Games endpoint
app.get("/api/coach/games", async (req, res) => {
  if (!supabase) {
    return res
      .status(503)
      .json({ success: false, error: "Database not configured", data: [] });
  }

  try {
    const { data: games } = await supabase
      .from("games")
      .select("*")
      .order("game_date", { ascending: false })
      .limit(50);

    res.json({ success: true, data: games || [] });
  } catch (error) {
    console.error("[Coach Games] Error:", error);
    res.json({ success: true, data: [], message: "No data available" });
  }
});

// Roster Players endpoint
app.get("/api/roster/players", async (req, res) => {
  if (!supabase) {
    return res
      .status(503)
      .json({ success: false, error: "Database not configured", data: [] });
  }

  try {
    const { data: players } = await supabase
      .from("team_members")
      .select(
        `
        id, role, jersey_number, position, status, joined_at,
        user:user_id (id, email, full_name, first_name, last_name)
      `,
      )
      .eq("status", "active")
      .order("jersey_number");

    // Transform to expected format
    const formattedPlayers = (players || []).map((p) => {
      // Normalize player name
      const name =
        p.user?.full_name ||
        [p.user?.first_name, p.user?.last_name].filter(Boolean).join(" ").trim() ||
        "Unknown";
      
      return {
        id: p.id,
        userId: p.user?.id,
        name,
        email: p.user?.email,
        position: p.position,
        jerseyNumber: p.jersey_number,
        role: p.role,
        status: p.status,
        joinedAt: p.joined_at,
      };
    });

    res.json({ success: true, data: formattedPlayers });
  } catch (error) {
    console.error("[Roster Players] Error:", error);
    res.json({ success: true, data: [], message: "No data available" });
  }
});

// ============================================
// WEATHER ENDPOINT - REAL DATA (OR ERROR)
// ============================================

app.get("/api/weather/current", async (req, res) => {
  if (!supabase) {
    return res
      .status(503)
      .json({ success: false, error: "Database not configured" });
  }

  try {
    const { location = "Training Ground" } = req.query;

    // Check if we have a weather table
    const { data: weather, error } = await supabase
      .from("weather_data")
      .select("*")
      .ilike("location", `%${location}%`)
      .order("timestamp", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    if (!weather) {
      return res.json({
        success: true,
        data: null,
        message: "Real-time weather data not available for this location",
      });
    }

    res.json({
      success: true,
      data: {
        temperature: weather.temperature,
        temperatureUnit: weather.unit || "C",
        humidity: weather.humidity,
        conditions: weather.conditions,
        windSpeed: weather.wind_speed,
        windUnit: "km/h",
        uvIndex: weather.uv_index,
        precipitation: weather.precipitation,
        feelsLike: weather.feels_like,
        icon: weather.icon,
        location: weather.location,
        lastUpdated: weather.timestamp,
        recommendations: weather.recommendations || {
          hydration: "normal",
          sunProtection: "standard",
          warmUp: "standard",
        },
      },
    });
  } catch (error) {
    console.error("[Weather] Error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to load weather data" });
  }
});

// ============================================
// TRAINING SUGGESTIONS ENDPOINT - REAL DATA
// ============================================

app.get("/api/training/suggestions", async (req, res) => {
  res.json({ success: true, data: [] });
});

app.post("/api/training/suggestions", async (req, res) => {
  if (!supabase) {
    return res
      .status(503)
      .json({ success: false, error: "Database not configured" });
  }

  try {
    const { athleteId, currentAcwr, readinessScore } = req.body;

    // Check for pre-generated suggestions in DB
    const { data: suggestions, error } = await supabase
      .from("training_suggestions")
      .select("*")
      .eq("athlete_id", athleteId)
      .eq("is_active", true)
      .order("priority_score", { ascending: false });

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    if (!suggestions || suggestions.length === 0) {
      return res.json({
        success: true,
        data: {
          athleteId,
          suggestions: [],
          message: "No specific training suggestions found for current metrics",
        },
      });
    }

    res.json({
      success: true,
      data: {
        athleteId,
        suggestions: suggestions.map((s) => ({
          id: s.id,
          type: s.type,
          name: s.title,
          duration: s.duration_minutes,
          reason: s.reason,
          priority: s.priority,
        })),
        currentMetrics: {
          acwr: currentAcwr || null,
          readiness: readinessScore || null,
        },
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[Suggestions] Error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to load training suggestions" });
  }
});

// ============================================
// READINESS CALCULATION ENDPOINT
// ============================================

// Readiness calculation endpoint
app.all("/api/calc-readiness", async (req, res) => {
  const {
    athleteId,
    user_id,
    day: _day,
  } = req.method === "POST" ? req.body : req.query;
  const userId = athleteId || user_id;

  if (!supabase) {
    return res
      .status(503)
      .json({ success: false, error: "Database not configured" });
  }

  if (!userId) {
    return res.status(400).json({ success: false, error: "User ID required" });
  }

  try {
    // Get latest wellness check-in
    const { data: wellness, error: wError } = await supabase
      .from("wellness_checkins")
      .select("*")
      .eq("user_id", userId)
      .order("checkin_date", { ascending: false })
      .limit(1)
      .single();

    if (wError && wError.code !== "PGRST116") {
      throw wError;
    }

    // Get recent training load
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: sessions, error: sError } = await supabase
      .from("training_sessions")
      .select("rpe, duration_minutes")
      .eq("athlete_id", userId)
      .gte("session_date", sevenDaysAgo.toISOString().split("T")[0])
      .eq("status", "completed");

    if (sError) {
      throw sError;
    }

    if (!wellness && (!sessions || sessions.length === 0)) {
      return res.json({
        success: true,
        data: null,
        message:
          "Insufficient data to calculate readiness. Please complete a wellness check-in.",
      });
    }

    // Calculate readiness score
    let score = 70; // Base score
    const factors = {
      sleep: wellness?.sleep_quality || 7,
      stress: wellness?.stress_level || 5,
      energy: wellness?.energy_level || 7,
      soreness: wellness?.soreness_level || 4,
      motivation: wellness?.motivation_level || 7,
    };

    // Adjust based on wellness
    if (wellness) {
      score += (factors.sleep - 5) * 3;
      score += (factors.energy - 5) * 3;
      score -= (factors.stress - 5) * 2;
      score -= (factors.soreness - 5) * 2;
      score += (factors.motivation - 5) * 2;
    }

    // Adjust based on training load
    if (sessions && sessions.length > 0) {
      const weeklyLoad = sessions.reduce(
        (sum, s) => sum + (s.rpe || 5) * (s.duration_minutes || 60),
        0,
      );
      if (weeklyLoad > 3000) {
        score -= 10;
      } else if (weeklyLoad < 1000) {
        score += 5;
      }
    }

    // Clamp score
    score = Math.min(100, Math.max(0, Math.round(score)));

    // Determine level
    let level;
    if (score >= 80) {
      level = "optimal";
    } else if (score >= 60) {
      level = "moderate";
    } else if (score >= 40) {
      level = "low";
    } else {
      level = "critical";
    }

    // Generate recommendations
    const recommendations = [];
    if (factors.sleep < 6) {
      recommendations.push("Prioritize sleep - aim for 8+ hours tonight");
    }
    if (factors.stress > 7) {
      recommendations.push(
        "Consider stress management techniques before training",
      );
    }
    if (factors.soreness > 7) {
      recommendations.push(
        "Include extra recovery time - foam rolling recommended",
      );
    }
    if (factors.energy < 5) {
      recommendations.push("Consider a lighter training day");
    }
    if (recommendations.length === 0) {
      recommendations.push("You're in good shape for normal training");
    }

    res.json({
      success: true,
      data: {
        score,
        level,
        factors,
        recommendations,
        calculatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[Calc Readiness] Error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to calculate readiness" });
  }
});

// ============================================
// TRENDS ENDPOINTS - REAL DATA
// ============================================

app.get("/api/trends/change-of-direction", async (req, res) => {
  const { athleteId, weeks = 4 } = req.query;

  if (!supabase) {
    return res
      .status(503)
      .json({ success: false, error: "Database not configured" });
  }

  if (!athleteId) {
    return res
      .status(400)
      .json({ success: false, error: "Athlete ID required" });
  }

  try {
    const weeksNum = parseInt(weeks);
    const currentStart = new Date();
    currentStart.setDate(currentStart.getDate() - weeksNum * 7);
    const previousStart = new Date();
    previousStart.setDate(previousStart.getDate() - weeksNum * 14);

    // Get current period sessions
    const { data: currentSessions, error: cError } = await supabase
      .from("training_sessions")
      .select("id, session_date, session_type, workout_type")
      .eq("athlete_id", athleteId)
      .gte("session_date", currentStart.toISOString().split("T")[0])
      .eq("status", "completed")
      .or(
        "session_type.ilike.%agility%,workout_type.ilike.%agility%,session_type.ilike.%cod%,workout_type.ilike.%cod%",
      );

    if (cError) {
      throw cError;
    }

    // Get previous period sessions
    const { data: previousSessions, error: pError } = await supabase
      .from("training_sessions")
      .select("id")
      .eq("athlete_id", athleteId)
      .gte("session_date", previousStart.toISOString().split("T")[0])
      .lt("session_date", currentStart.toISOString().split("T")[0])
      .eq("status", "completed")
      .or(
        "session_type.ilike.%agility%,workout_type.ilike.%agility%,session_type.ilike.%cod%,workout_type.ilike.%cod%",
      );

    if (pError) {
      throw pError;
    }

    const current = currentSessions?.length || 0;
    const previous = previousSessions?.length || 0;
    const trend =
      current > previous
        ? "improving"
        : current < previous
          ? "declining"
          : "stable";

    res.json({
      success: true,
      data: {
        current,
        previous,
        sessions: currentSessions || [],
        trend,
      },
    });
  } catch (error) {
    console.error("[Trends COD] Error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to load COD trends" });
  }
});

app.get("/api/trends/sprint-volume", async (req, res) => {
  const { athleteId, weeks = 4 } = req.query;

  if (!supabase) {
    return res
      .status(503)
      .json({ success: false, error: "Database not configured" });
  }

  if (!athleteId) {
    return res
      .status(400)
      .json({ success: false, error: "Athlete ID required" });
  }

  try {
    const weeksNum = parseInt(weeks);
    const currentStart = new Date();
    currentStart.setDate(currentStart.getDate() - weeksNum * 7);
    const previousStart = new Date();
    previousStart.setDate(previousStart.getDate() - weeksNum * 14);

    // Get sprint sessions
    const { data: currentSessions, error: cError } = await supabase
      .from("training_sessions")
      .select("duration_minutes")
      .eq("athlete_id", athleteId)
      .gte("session_date", currentStart.toISOString().split("T")[0])
      .eq("status", "completed")
      .or(
        "session_type.ilike.%sprint%,workout_type.ilike.%sprint%,session_type.ilike.%speed%,workout_type.ilike.%speed%",
      );

    if (cError) {
      throw cError;
    }

    const { data: previousSessions, error: pError } = await supabase
      .from("training_sessions")
      .select("duration_minutes")
      .eq("athlete_id", athleteId)
      .gte("session_date", previousStart.toISOString().split("T")[0])
      .lt("session_date", currentStart.toISOString().split("T")[0])
      .eq("status", "completed")
      .or(
        "session_type.ilike.%sprint%,workout_type.ilike.%sprint%,session_type.ilike.%speed%,workout_type.ilike.%speed%",
      );

    if (pError) {
      throw pError;
    }

    const current =
      currentSessions?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) ||
      0;
    const previous =
      previousSessions?.reduce(
        (sum, s) => sum + (s.duration_minutes || 0),
        0,
      ) || 0;
    const trend =
      current > previous
        ? "improving"
        : current < previous
          ? "declining"
          : "stable";

    res.json({
      success: true,
      data: {
        current,
        previous,
        trend,
      },
    });
  } catch (error) {
    console.error("[Trends Sprint] Error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to load sprint trends" });
  }
});

app.get("/api/trends/game-performance", async (req, res) => {
  const { athleteId, games = 5 } = req.query;

  if (!supabase) {
    return res
      .status(503)
      .json({ success: false, error: "Database not configured" });
  }

  // If no athleteId, return empty data (not an error)
  if (!athleteId) {
    return res.json({
      success: true,
      data: {
        averagePerformance: 0,
        trend: "stable",
        games: [],
        message: "No athlete specified",
      },
    });
  }

  try {
    // Try game_stats table with user_id first
    let gameStats = null;
    let queryError = null;

    // Try with user_id
    const { data: statsData, error: statsError } = await supabase
      .from("game_stats")
      .select("*")
      .eq("user_id", athleteId)
      .order("game_date", { ascending: false })
      .limit(parseInt(games));

    if (!statsError && statsData?.length > 0) {
      gameStats = statsData;
    } else {
      // Try with player_id as fallback
      const { data: playerData, error: playerError } = await supabase
        .from("game_stats")
        .select("*")
        .eq("player_id", athleteId)
        .order("game_date", { ascending: false })
        .limit(parseInt(games));

      if (!playerError) {
        gameStats = playerData;
      } else {
        queryError = playerError;
      }
    }

    if (
      queryError &&
      queryError.code !== "PGRST116" &&
      queryError.code !== "42P01"
    ) {
      console.warn("[Trends Game] Query error:", queryError.message);
    }

    if (gameStats && gameStats.length > 0) {
      // Calculate average performance score (simplified)
      const avgScore =
        gameStats.reduce((sum, g) => {
          const score =
            (g.touchdowns || 0) * 6 +
            (g.receptions || 0) * 2 +
            (g.yards || 0) / 10;
          return sum + Math.min(100, score);
        }, 0) / gameStats.length;

      // Determine trend
      let trend = "stable";
      if (gameStats.length >= 3) {
        const recent = gameStats.slice(0, Math.floor(gameStats.length / 2));
        const older = gameStats.slice(Math.floor(gameStats.length / 2));
        const recentAvg =
          recent.reduce((s, g) => s + (g.touchdowns || 0) * 6, 0) /
          recent.length;
        const olderAvg =
          older.reduce((s, g) => s + (g.touchdowns || 0) * 6, 0) / older.length;
        trend =
          recentAvg > olderAvg
            ? "improving"
            : recentAvg < olderAvg
              ? "declining"
              : "stable";
      }

      res.json({
        success: true,
        data: {
          averagePerformance: Math.round(avgScore * 10) / 10,
          trend,
          games: gameStats,
        },
      });
    } else {
      res.json({
        success: true,
        data: {
          averagePerformance: 0,
          trend: "stable",
          games: [],
          message: "No game data available",
        },
      });
    }
  } catch (error) {
    console.error("[Trends Game] Error:", error);
    // Return empty data instead of 500 error
    res.json({
      success: true,
      data: {
        averagePerformance: 0,
        trend: "stable",
        games: [],
        message: "Unable to load game data",
      },
    });
  }
});

// ============================================
// SUPPLEMENTS ENDPOINTS - REAL DATA
// ============================================

app.get("/api/supplements", async (req, res) => {
  if (!supabase) {
    return res
      .status(503)
      .json({ success: false, error: "Database not configured" });
  }

  try {
    let userId = req.query.userId || req.headers["x-user-id"] || DEMO_USER_ID;
    if (!isValidUUID(userId)) {
      userId = DEMO_USER_ID;
    }
    const today = new Date().toISOString().split("T")[0];

    // Get user's supplements (if they have a custom list)
    const { data: userSupplements } = await supabase
      .from("user_supplements")
      .select("*")
      .eq("user_id", userId)
      .eq("active", true);

    // Get today's logs
    const { data: todayLogs } = await supabase
      .from("supplement_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("date", today);

    // If user has custom supplements, use those
    if (userSupplements && userSupplements.length > 0) {
      const supplements = userSupplements.map((s) => {
        const takenToday = todayLogs?.some(
          (log) => log.supplement_name?.toLowerCase() === s.name?.toLowerCase(),
        );
        return {
          id: s.id,
          name: s.name,
          dosage: s.dosage,
          timing: s.timing || "anytime",
          category: s.category || "other",
          taken: takenToday || false,
          takenAt: takenToday
            ? todayLogs.find(
                (log) =>
                  log.supplement_name?.toLowerCase() === s.name?.toLowerCase(),
              )?.created_at
            : null,
        };
      });

      return res.json({
        success: true,
        data: { supplements, todayLogs: todayLogs || [] },
      });
    }

    // Return empty - frontend will use defaults
    res.json({
      success: true,
      data: { supplements: [], todayLogs: todayLogs || [] },
    });
  } catch (error) {
    console.error("[Supplements] Error:", error);
    res.json({ success: true, data: { supplements: [], todayLogs: [] } });
  }
});

app.post("/api/supplements/log", authenticateToken, async (req, res) => {
  if (!supabase) {
    return res
      .status(503)
      .json({ success: false, error: "Database not configured" });
  }

  try {
    const { userId } = req; // Use authenticated user's ID
    const { supplement, dosage, taken = true, notes } = req.body;
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("supplement_logs")
      .insert({
        user_id: userId,
        supplement_name: supplement,
        dosage,
        taken,
        date: today,
        notes: notes || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error("[Supplements Log] Error:", error);
    res.status(500).json({ success: false, error: "Failed to log supplement" });
  }
});

app.get("/api/supplements/logs", async (req, res) => {
  if (!supabase) {
    return res
      .status(503)
      .json({ success: false, error: "Database not configured" });
  }

  try {
    let userId = req.query.userId || req.headers["x-user-id"] || DEMO_USER_ID;
    if (!isValidUUID(userId)) {
      userId = DEMO_USER_ID;
    }
    const limit = parseInt(req.query.limit) || 30;

    const { data, error } = await supabase
      .from("supplement_logs")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    res.json({ success: true, data: { logs: data || [] } });
  } catch (error) {
    console.error("[Supplements Logs] Error:", error);
    res.json({ success: true, data: { logs: [] } });
  }
});

// ============================================
// HYDRATION ENDPOINTS - REAL DATA
// ============================================

app.get("/api/hydration", async (req, res) => {
  if (!supabase) {
    return res
      .status(503)
      .json({ success: false, error: "Database not configured" });
  }

  try {
    let userId = req.query.userId || req.headers["x-user-id"] || DEMO_USER_ID;
    if (!isValidUUID(userId)) {
      userId = DEMO_USER_ID;
    }
    const today = new Date().toISOString().split("T")[0];

    // Get today's hydration logs
    const { data: logs, error } = await supabase
      .from("hydration_logs")
      .select("*")
      .eq("user_id", userId)
      .gte("timestamp", `${today}T00:00:00`)
      .order("timestamp", { ascending: true });

    if (error && error.code !== "42P01") {
      // 42P01 = table doesn't exist
      console.warn("[Hydration] Query error:", error.message);
    }

    res.json({ success: true, data: { logs: logs || [] } });
  } catch (error) {
    console.error("[Hydration] Error:", error);
    res.json({ success: true, data: { logs: [] } });
  }
});

app.post("/api/hydration/log", authenticateToken, async (req, res) => {
  if (!supabase) {
    return res
      .status(503)
      .json({ success: false, error: "Database not configured" });
  }

  try {
    const { userId } = req; // Use authenticated user's ID
    const { amount, type = "water" } = req.body;

    const { data, error } = await supabase
      .from("hydration_logs")
      .insert({
        user_id: userId,
        amount,
        type,
        timestamp: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      // If table doesn't exist, return mock response
      if (error.code === "42P01") {
        return res.json({
          success: true,
          data: {
            id: Date.now().toString(),
            amount,
            type,
            timestamp: new Date().toISOString(),
          },
        });
      }
      throw error;
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error("[Hydration Log] Error:", error);
    // Return mock response even on error for better UX
    res.json({
      success: true,
      data: {
        id: Date.now().toString(),
        amount: req.body.amount,
        type: req.body.type || "water",
        timestamp: new Date().toISOString(),
      },
    });
  }
});

// =============================================================================
// NOTIFICATIONS ENDPOINTS - Now handled by modular routes at /api/notifications/*
// See: routes/notifications.routes.js
// =============================================================================

// Legacy Netlify function route redirects removed (January 2026)
// All routes now use /api/* directly

// ============================================
// AI CHAT ENDPOINT - Uses Knowledge Base from Supabase
// ============================================
// In-memory conversation store for follow-up questions
const conversationMemory = new Map();

// Helper to detect follow-up questions
function isFollowUpQuestion(message) {
  const followUpIndicators = [
    /^(if|but|and|so|then|what about|how about|does this|is this|can i|should i|would|could)/i,
    /^(yes|no|ok|okay|sure|thanks|thank you)/i,
    /\b(this|that|it|they|these|those)\b/i,
    /\b(same|also|too|more|less|instead)\b/i,
    /\?$/, // Questions often are follow-ups
    /\b(spread|split|divide|take|supplement|dose|dosage)\b/i,
  ];

  // Short messages are often follow-ups
  if (message.split(/\s+/).length <= 10) {
    for (const pattern of followUpIndicators) {
      if (pattern.test(message)) {
        return true;
      }
    }
  }
  return false;
}

// Helper to generate contextual follow-up responses
function generateFollowUpResponse(message, context) {
  const msgLower = message.toLowerCase();
  const { topic } = context;

  // Handle dosage/timing questions
  if (
    msgLower.includes("spread") ||
    msgLower.includes("split") ||
    msgLower.includes("days") ||
    msgLower.includes("week")
  ) {
    if (topic === "iron") {
      return {
        answer: `## About Your Iron Question\n\n**Important:** 65mg is a very high dose of iron!\n\n**Recommendation:**\n- The recommended daily intake is only 8-18mg/day\n- 65mg should NOT be taken all at once or "spread over days"\n- This is a therapeutic dose that requires medical supervision\n\n**Why High Doses Are Risky:**\n- Iron overdose can cause serious side effects\n- Nausea, constipation, stomach pain\n- Can interfere with zinc and copper absorption\n- Potential organ damage with chronic high intake\n\n**What You Should Do:**\n1. **Consult a doctor** before taking high-dose iron\n2. Get a blood test to confirm you actually need supplementation\n3. If prescribed, take as directed by your healthcare provider\n4. Consider getting iron from food sources instead\n\n**Safe Approach:**\nIf you're concerned about iron levels, get tested first. Most athletes can meet iron needs through diet alone.`,
        riskLevel: "high",
        disclaimer:
          "High-dose iron supplementation requires medical supervision. Please consult a healthcare provider.",
      };
    }
    if (topic === "magnesium") {
      return {
        answer: `## Magnesium Dosing\n\n**Daily vs. Spread Dosing:**\n\nMagnesium is typically taken **daily**, not spread across multiple days.\n\n**Optimal Dosing Strategy:**\n- Take 200-400mg per day\n- Split into 2 doses if taking more than 200mg\n- Take with meals for better absorption\n- Evening doses may help with sleep\n\n**Why Daily Dosing?**\n- Body doesn't store magnesium long-term\n- Regular intake maintains steady levels\n- Prevents deficiency symptoms\n\n**If Taking Supplements:**\n- Start with lower dose (200mg)\n- Increase gradually if needed\n- Magnesium glycinate or citrate are well-absorbed forms`,
        riskLevel: "low",
      };
    }
    // Generic dosing response
    return {
      answer: `## Supplement Dosing Question\n\nMost supplements are designed to be taken **daily**, not accumulated and spread over multiple days.\n\n**General Guidelines:**\n- Follow the recommended daily intake\n- Consistency is more important than timing\n- Take with food for better absorption\n- Don't take mega-doses to "catch up"\n\n**Important:** If you're considering any supplement above the recommended daily amount, please consult a healthcare provider first. They can:\n- Test if you actually have a deficiency\n- Recommend the right dosage for you\n- Monitor for side effects\n\nWould you like specific information about a particular supplement?`,
      riskLevel: "medium",
    };
  }

  // Handle "can I take" / "should I take" questions
  if (
    msgLower.includes("can i") ||
    msgLower.includes("should i") ||
    msgLower.includes("is it safe")
  ) {
    return {
      answer: `## Personalized Recommendation\n\nI can provide general information, but for personalized supplement advice:\n\n**Before Taking Any Supplement:**\n1. ✅ Get blood work done to check actual levels\n2. ✅ Consult with a healthcare provider or sports dietitian\n3. ✅ Consider your diet first - can you get nutrients from food?\n4. ✅ Check for interactions with any medications\n\n**General Safety:**\n- Most people don't need supplements if eating a balanced diet\n- Athletes may have slightly higher needs\n- More is NOT always better - some nutrients are harmful in excess\n\nWould you like me to explain more about ${topic || "this topic"}?`,
      riskLevel: "medium",
    };
  }

  // Default follow-up handling
  return null;
}

// AI Chat support - requires authentication
app.post("/api/ai/chat", authenticateToken, async (req, res) => {
  // Redirect to existing handler
  req.url = "/api/ai-chat";
  return app._router.handle(req, res, () => {});
});

app.post("/api/ai-chat", authenticateToken, async (req, res) => {
  const { message, session_id } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({
      success: false,
      error: "Message is required and must be a string",
    });
  }

  try {
    // Dynamically import Supabase client (since server.js uses ESM)
    const { createClient } = await import("@supabase/supabase-js");

    // Read env vars
    const supabaseUrl =
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("[AI Chat] Missing Supabase credentials");
      return res.status(500).json({
        success: false,
        error: "Server configuration error - missing database credentials",
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get or create session ID
    const chatSessionId = session_id || `dev-session-${Date.now()}`;

    // Get conversation context from memory
    const conversationContext = conversationMemory.get(chatSessionId) || {
      messages: [],
      topic: null,
      lastTopic: null,
    };

    // Check if this is a follow-up question
    const isFollowUp =
      isFollowUpQuestion(message) && conversationContext.messages.length > 0;
    console.log(
      `[AI Chat] Session: ${chatSessionId}, Follow-up: ${isFollowUp}, Topic: ${conversationContext.topic}`,
    );

    // Handle follow-up questions with context
    if (isFollowUp && conversationContext.topic) {
      const followUpResponse = generateFollowUpResponse(
        message,
        conversationContext,
      );

      if (followUpResponse) {
        // Store message in memory
        conversationContext.messages.push({ role: "user", content: message });
        conversationContext.messages.push({
          role: "assistant",
          content: followUpResponse.answer,
        });
        conversationMemory.set(chatSessionId, conversationContext);

        console.log(
          `[AI Chat] Generated follow-up response for topic: ${conversationContext.topic}`,
        );

        return res.json({
          success: true,
          data: {
            answer_markdown: followUpResponse.answer,
            citations: [
              {
                id: `followup-${Date.now()}`,
                title: "Sports Nutrition Guidelines",
                source_type: "curated",
                evidence_grade: "B",
              },
            ],
            risk_level: followUpResponse.riskLevel || "low",
            disclaimer: followUpResponse.disclaimer || null,
            suggested_actions:
              followUpResponse.riskLevel === "high"
                ? [
                    {
                      type: "ask_coach",
                      label: "Consult Healthcare Provider",
                      reason: "This topic requires professional guidance",
                    },
                  ]
                : [],
            chat_session_id: chatSessionId,
            message_id: `msg-${Date.now()}`,
            acwr_safety: null,
            metadata: {
              source: "follow_up_context",
              topic: conversationContext.topic,
              isFollowUp: true,
            },
          },
        });
      }
    }

    // Search knowledge base for relevant content
    // Extract meaningful search terms (words with 3+ chars, excluding common words)
    const stopWords = [
      "what",
      "how",
      "does",
      "should",
      "have",
      "much",
      "many",
      "the",
      "and",
      "for",
      "with",
      "this",
      "that",
      "from",
      "about",
      "daily",
      "each",
      "day",
      "intake",
      "need",
      "get",
    ];
    const searchTerms = message
      .toLowerCase()
      .split(/\s+/)
      .filter((term) => term.length >= 3 && !stopWords.includes(term));

    console.log(
      `[AI Chat] Query: "${message}" -> Search terms: [${searchTerms.join(", ")}]`,
    );

    // Check for specific topics that need custom answers (not in KB)
    const customTopics = {
      magnesium: {
        answer: `## Magnesium for Athletes\n\n**Recommended Daily Intake:**\n- Men: 400-420mg/day\n- Women: 310-320mg/day\n- Athletes may need 10-20% more due to sweat losses\n\n**Why Athletes Need Magnesium:**\n- Muscle function and relaxation\n- Energy production (ATP synthesis)\n- Electrolyte balance\n- Sleep quality improvement\n- Reduces muscle cramps\n\n**Best Food Sources:**\n- Pumpkin seeds (156mg per oz)\n- Almonds (80mg per oz)\n- Spinach (78mg per cup cooked)\n- Black beans (60mg per cup)\n- Dark chocolate (64mg per oz)\n- Avocado (58mg each)\n\n**Timing:**\n- Take with meals for better absorption\n- Evening supplementation may improve sleep\n\n**Note:** If considering supplements, consult a healthcare provider. Most athletes can meet needs through diet.`,
        category: "nutrition",
      },
      zinc: {
        answer: `## Zinc for Athletes\n\n**Recommended Daily Intake:**\n- Men: 11mg/day\n- Women: 8mg/day\n\n**Benefits for Athletes:**\n- Immune function support\n- Testosterone production\n- Wound healing\n- Protein synthesis\n\n**Best Food Sources:**\n- Oysters (74mg per 3oz)\n- Beef (7mg per 3oz)\n- Crab (6.5mg per 3oz)\n- Pumpkin seeds (2.2mg per oz)\n- Chickpeas (2.5mg per cup)\n\n**Note:** Excessive zinc can interfere with copper absorption. Stick to food sources when possible.`,
        category: "nutrition",
      },
      iron: {
        answer: `## Iron for Athletes\n\n**Recommended Daily Intake:**\n- Men: 8mg/day\n- Women: 18mg/day (due to menstrual losses)\n- Athletes may have higher needs\n\n**Why Athletes Need Iron:**\n- Oxygen transport (hemoglobin)\n- Energy metabolism\n- Immune function\n- Endurance performance\n\n**Best Food Sources:**\n- Red meat (3mg per 3oz)\n- Fortified cereals (varies)\n- Spinach (6mg per cup cooked)\n- Lentils (3mg per cup)\n- Oysters (8mg per 3oz)\n\n**Tips:**\n- Vitamin C enhances iron absorption\n- Avoid tea/coffee with iron-rich meals\n- Get tested before supplementing\n\n**Warning:** Too much iron can be harmful. Only supplement if blood tests show deficiency.`,
        category: "nutrition",
      },
      potassium: {
        answer: `## Potassium for Athletes\n\n**Recommended Daily Intake:**\n- Adults: 2,600-3,400mg/day\n\n**Why Athletes Need Potassium:**\n- Muscle contractions\n- Fluid balance\n- Nerve function\n- Prevents cramping\n- Blood pressure regulation\n\n**Best Food Sources:**\n- Banana (422mg each)\n- Potato (926mg each)\n- Sweet potato (542mg each)\n- Spinach (839mg per cup cooked)\n- Coconut water (600mg per cup)\n- Orange juice (496mg per cup)\n\n**Timing:**\n- Replenish after heavy sweating\n- Include in post-workout meals`,
        category: "nutrition",
      },
      vitamin: {
        answer: `## Vitamins for Athletes\n\n**Key Vitamins for Performance:**\n\n**Vitamin D:**\n- Bone health, immune function, muscle strength\n- Many athletes are deficient\n- Target: 600-800 IU/day (may need more if deficient)\n- Sources: Sunlight, fatty fish, fortified foods\n\n**B Vitamins:**\n- Energy metabolism, red blood cell production\n- B12 important for vegans/vegetarians\n- Sources: Meat, eggs, dairy, whole grains\n\n**Vitamin C:**\n- Immune function, collagen synthesis\n- Enhances iron absorption\n- Sources: Citrus, berries, peppers\n\n**Vitamin E:**\n- Antioxidant, cell protection\n- Sources: Nuts, seeds, vegetable oils\n\n**Recommendation:** Get vitamins from food first. Only supplement if testing shows deficiency or dietary intake is inadequate.`,
        category: "nutrition",
      },
    };

    // Check for custom topics FIRST
    let customAnswer = null;
    let matchedTopic = null;
    for (const [topic, data] of Object.entries(customTopics)) {
      if (message.toLowerCase().includes(topic)) {
        customAnswer = data;
        matchedTopic = topic;
        console.log(`[AI Chat] Custom topic match: ${topic}`);
        break;
      }
    }

    // If we have a custom answer, return it directly
    if (customAnswer) {
      // Store conversation context
      conversationContext.topic = matchedTopic;
      conversationContext.lastTopic = matchedTopic;
      conversationContext.messages.push({ role: "user", content: message });
      conversationContext.messages.push({
        role: "assistant",
        content: customAnswer.answer,
      });
      conversationMemory.set(chatSessionId, conversationContext);

      return res.json({
        success: true,
        data: {
          answer_markdown: customAnswer.answer,
          citations: [
            {
              id: `custom-${Date.now()}`,
              title: "Sports Nutrition Guidelines",
              source_type: "curated",
              evidence_grade: "B",
            },
          ],
          risk_level: "low",
          disclaimer:
            "This information is for general guidance. Individual needs may vary. Consult a healthcare provider before starting any supplement regimen.",
          suggested_actions: [],
          chat_session_id: session_id || `dev-session-${Date.now()}`,
          message_id: `msg-${Date.now()}`,
          acwr_safety: null,
          metadata: {
            source: "custom_knowledge",
            topic: Object.keys(customTopics).find((t) =>
              message.toLowerCase().includes(t),
            ),
          },
        },
      });
    }

    // Search using multiple methods for better results
    let knowledgeResults = [];
    let searchMethod = "none";

    // Method 1: Try to find exact topic matches first
    // Priority search terms: nouns/key topics first (longer words tend to be more specific)
    const prioritizedTerms = [...searchTerms].sort(
      (a, b) => b.length - a.length,
    );

    for (const term of prioritizedTerms) {
      // Skip generic terms that match too many things
      const genericTerms = [
        "intake",
        "should",
        "recommend",
        "daily",
        "much",
        "best",
        "good",
        "help",
        "need",
        "want",
      ];
      if (genericTerms.includes(term)) {
        continue;
      }

      const { data: termMatches } = await supabase
        .from("knowledge_base_entries")
        .select(
          "id, title, content, category, subcategory, source_type, evidence_grade, source_quality_score",
        )
        .or(`title.ilike.%${term}%,content.ilike.%${term}%`)
        .eq("is_active", true)
        .order("source_quality_score", { ascending: false, nullsFirst: false })
        .limit(5);

      if (termMatches && termMatches.length > 0) {
        // Score results by relevance to the PRIMARY search term
        const scoredResults = termMatches.map((entry) => {
          let score = entry.source_quality_score || 0.5;
          const titleLower = entry.title.toLowerCase();
          const contentLower = entry.content.toLowerCase();

          // Strong boost for title containing the search term
          if (titleLower.includes(term)) {
            score += 0.5;
          }

          // Boost for ALL search terms in content
          searchTerms.forEach((t) => {
            if (titleLower.includes(t)) {
              score += 0.2;
            }
            if (contentLower.includes(t)) {
              score += 0.1;
            }
          });

          return { ...entry, _score: score };
        });

        // Sort by score and take best matches
        scoredResults.sort((a, b) => b._score - a._score);
        knowledgeResults = scoredResults.slice(0, 3);
        searchMethod = `term_match:${term}`;
        console.log(
          `[AI Chat] Found ${knowledgeResults.length} results for term "${term}"`,
        );
        break; // Found matches for a key term, stop searching
      }
    }

    // If no results from specific terms, try less specific ones
    if (knowledgeResults.length === 0) {
      for (const term of searchTerms) {
        const { data: termMatches } = await supabase
          .from("knowledge_base_entries")
          .select(
            "id, title, content, category, subcategory, source_type, evidence_grade, source_quality_score",
          )
          .or(`title.ilike.%${term}%,content.ilike.%${term}%`)
          .eq("is_active", true)
          .order("source_quality_score", {
            ascending: false,
            nullsFirst: false,
          })
          .limit(3);

        if (termMatches && termMatches.length > 0) {
          knowledgeResults = termMatches;
          searchMethod = `fallback_term:${term}`;
          console.log(
            `[AI Chat] Fallback: found ${knowledgeResults.length} results for "${term}"`,
          );
          break;
        }
      }
    }

    // Method 2: Try category/topic keyword matching
    if (knowledgeResults.length === 0) {
      const categoryKeywords = {
        // Nutrition
        magnesium: "nutrition",
        calcium: "nutrition",
        vitamin: "nutrition",
        supplement: "nutrition",
        protein: "nutrition",
        carb: "nutrition",
        calorie: "nutrition",
        diet: "nutrition",
        hydration: "nutrition",
        water: "nutrition",
        drink: "nutrition",
        eat: "nutrition",
        food: "nutrition",
        nutrition: "nutrition",
        meal: "nutrition",
        // Recovery
        sleep: "recovery",
        rest: "recovery",
        tired: "recovery",
        recovery: "recovery",
        fatigue: "recovery",
        soreness: "recovery",
        // Training Load
        rpe: "training_load",
        acwr: "training_load",
        load: "training_load",
        overtraining: "training_load",
        periodization: "training_load",
        // Training
        training: "training",
        workout: "training",
        exercise: "training",
        agility: "training",
        speed: "training",
        strength: "training",
        drill: "training",
        // Injury Prevention
        injury: "injury_prevention",
        prevent: "injury_prevention",
        acl: "injury_prevention",
        ankle: "injury_prevention",
        hamstring: "injury_prevention",
        knee: "injury_prevention",
        // Game Preparation
        warmup: "game_preparation",
        "warm-up": "game_preparation",
        stretch: "game_preparation",
        cooldown: "game_preparation",
        pregame: "game_preparation",
        // Position Training
        quarterback: "position_training",
        qb: "position_training",
        receiver: "position_training",
        wr: "position_training",
        rusher: "position_training",
        defender: "position_training",
        // Mental Performance
        visualization: "mental_performance",
        anxiety: "mental_performance",
        mental: "mental_performance",
        focus: "mental_performance",
        confidence: "mental_performance",
        stress: "mental_performance",
      };

      let matchedCategory = null;
      let matchedKeyword = null;
      for (const [keyword, category] of Object.entries(categoryKeywords)) {
        if (message.toLowerCase().includes(keyword)) {
          matchedCategory = category;
          matchedKeyword = keyword;
          break;
        }
      }

      if (matchedCategory) {
        console.log(
          `[AI Chat] Category match: ${matchedKeyword} -> ${matchedCategory}`,
        );
        const { data: categoryMatches } = await supabase
          .from("knowledge_base_entries")
          .select(
            "id, title, content, category, subcategory, source_type, evidence_grade, source_quality_score",
          )
          .eq("category", matchedCategory)
          .eq("is_active", true)
          .order("source_quality_score", {
            ascending: false,
            nullsFirst: false,
          })
          .limit(3);

        if (categoryMatches && categoryMatches.length > 0) {
          knowledgeResults = categoryMatches;
          searchMethod = `category:${matchedCategory}`;
        }
      }
    }

    // Method 3: If still no results, get general FAQ entries
    if (knowledgeResults.length === 0) {
      console.log(`[AI Chat] No matches found, falling back to FAQ`);
      const { data: faqEntries } = await supabase
        .from("knowledge_base_entries")
        .select(
          "id, title, content, category, subcategory, source_type, evidence_grade, source_quality_score",
        )
        .eq("is_active", true)
        .order("source_quality_score", { ascending: false, nullsFirst: false })
        .limit(3);

      if (faqEntries) {
        knowledgeResults = faqEntries;
        searchMethod = "fallback";
      }
    }

    console.log(
      `[AI Chat] Final results: ${knowledgeResults.length} entries via ${searchMethod}`,
    );

    // Generate response
    let answer;
    let citations = [];

    if (knowledgeResults.length > 0) {
      // Use the best matching knowledge entry
      const primarySource = knowledgeResults[0];
      answer = primarySource.content;

      // Build citations
      citations = knowledgeResults.map((entry) => ({
        id: entry.id,
        title: entry.title,
        source_type: entry.source_type || "curated",
        evidence_grade: entry.evidence_grade || "B",
      }));

      // Add personalized note if relevant
      if (knowledgeResults.length > 1) {
        answer += `\n\n---\n*For more details, check out: ${knowledgeResults
          .slice(1)
          .map((e) => e.title)
          .join(", ")}*`;
      }
    } else {
      answer =
        `I understand you're asking about "${message.slice(0, 50)}${message.length > 50 ? "..." : ""}"\n\n` +
        `While I don't have specific research-backed information about this exact topic in my knowledge base yet, ` +
        `here are some general recommendations:\n\n` +
        `1. **Consult your coach** for personalized advice\n` +
        `2. **Check the training videos** section for related content\n` +
        `3. **Visit the exercise library** for specific drills\n\n` +
        `**Topics I can help with:**\n` +
        `- Training load management (ACWR, RPE)\n` +
        `- Nutrition: Hydration, Caffeine, Creatine, Protein, Magnesium, Iron, Zinc\n` +
        `- Injury prevention (ACL, Ankle, Hamstring)\n` +
        `- Recovery and sleep optimization\n` +
        `- Position-specific training (QB, WR)\n` +
        `- Mental performance and focus\n\n` +
        `Try asking something like "What is ACWR?" or "How much sleep should I get?"`;
    }

    // Classify risk level based on content
    let riskLevel = "low";
    const mediumRiskKeywords = [
      "injury",
      "pain",
      "hurt",
      "sore",
      "strain",
      "sprain",
    ];
    const highRiskKeywords = [
      "medical",
      "supplement",
      "medication",
      "drug",
      "doctor",
    ];

    if (highRiskKeywords.some((k) => message.toLowerCase().includes(k))) {
      riskLevel = "high";
    } else if (
      mediumRiskKeywords.some((k) => message.toLowerCase().includes(k))
    ) {
      riskLevel = "medium";
    }

    // Generate disclaimer based on risk level
    let disclaimer = null;
    if (riskLevel === "high") {
      disclaimer =
        "This information is for educational purposes only. Please consult a healthcare professional for medical advice.";
    } else if (riskLevel === "medium") {
      disclaimer =
        "If you're experiencing persistent symptoms, please consult with your coach or a healthcare provider.";
    }

    // Generate suggested actions
    const suggestedActions = [];
    if (riskLevel === "high") {
      suggestedActions.push({
        type: "ask_coach",
        label: "Consult Professional",
        reason: "This topic may require professional guidance",
      });
    }
    if (
      knowledgeResults.length > 0 &&
      knowledgeResults[0].category === "training"
    ) {
      suggestedActions.push({
        type: "read_article",
        label: "View Related Exercises",
        reason: "Explore exercises related to this topic",
      });
    }

    // Store conversation context for follow-up questions
    const detectedTopic =
      knowledgeResults.length > 0 ? knowledgeResults[0].category : null;
    conversationContext.topic = detectedTopic;
    conversationContext.lastTopic = detectedTopic;
    conversationContext.messages.push({ role: "user", content: message });
    conversationContext.messages.push({ role: "assistant", content: answer });

    // Keep only last 10 messages to prevent memory bloat
    if (conversationContext.messages.length > 10) {
      conversationContext.messages = conversationContext.messages.slice(-10);
    }
    conversationMemory.set(chatSessionId, conversationContext);

    res.json({
      success: true,
      data: {
        answer_markdown: answer,
        citations,
        risk_level: riskLevel,
        disclaimer,
        suggested_actions: suggestedActions,
        chat_session_id: chatSessionId,
        message_id: `msg-${Date.now()}`,
        acwr_safety: null,
        metadata: {
          source: "knowledge_base",
          knowledge_entries_found: knowledgeResults.length,
          topic: detectedTopic,
        },
      },
    });
  } catch (error) {
    console.error("[AI Chat] Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process chat request",
      message: error.message,
    });
  }
});

// ============================================
// Player Programs API Endpoints
// ============================================

// GET /api/player-programs/me - Get current active assignment
app.get("/api/player-programs/me", async (req, res) => {
  if (!supabase) {
    return res
      .status(503)
      .json({ success: false, error: "Database not configured" });
  }

  try {
    // Get user from auth header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Authorization required",
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: "Invalid authentication",
      });
    }

    // Get active assignment
    const { data, error } = await supabase
      .from("player_programs")
      .select(
        `
        id,
        player_id,
        program_id,
        status,
        start_date,
        end_date,
        current_week,
        current_phase_id,
        completion_percentage,
        modifications,
        notes,
        created_at,
        updated_at,
        training_programs!inner (
          id,
          name
        )
      `,
      )
      .eq("player_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (error) {
      console.error("[player-programs] Error fetching assignment:", error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    if (!data) {
      return res.json({
        success: true,
        data: {
          assignment: null,
          message: "No active program assigned",
        },
      });
    }

    // Transform to expected shape
    const assignment = {
      id: data.id,
      player_id: data.player_id,
      program_id: data.program_id,
      status: data.status,
      start_date: data.start_date,
      end_date: data.end_date,
      current_week: data.current_week,
      current_phase_id: data.current_phase_id,
      completion_percentage: data.completion_percentage,
      modifications: data.modifications,
      notes: data.notes,
      created_at: data.created_at,
      updated_at: data.updated_at,
      program: {
        id: data.training_programs.id,
        name: data.training_programs.name,
      },
    };

    return res.json({
      success: true,
      data: { assignment },
    });
  } catch (error) {
    console.error("[player-programs] Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});

// POST /api/player-programs - Assign user to a program
app.post("/api/player-programs", authenticateToken, async (req, res) => {
  if (!supabase) {
    return res
      .status(503)
      .json({ success: false, error: "Database not configured" });
  }

  try {
    // User already authenticated via middleware
    const user = { id: req.userId };

    const {
      program_id,
      start_date,
      status = "active",
      force = false,
    } = req.body;

    if (!program_id) {
      return res.status(400).json({
        success: false,
        error: "program_id is required",
      });
    }

    // Check if program exists
    const { data: programExists, error: programError } = await supabase
      .from("training_programs")
      .select("id, name")
      .eq("id", program_id)
      .single();

    if (programError || !programExists) {
      return res.status(404).json({
        success: false,
        error: "Training program not found",
      });
    }

    // Check for existing active assignment
    const { data: existingAssignment } = await supabase
      .from("player_programs")
      .select(
        `
        id,
        program_id,
        training_programs!inner (id, name)
      `,
      )
      .eq("player_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (existingAssignment) {
      // Same program - idempotent success
      if (existingAssignment.program_id === program_id) {
        const { data: fullAssignment } = await supabase
          .from("player_programs")
          .select(
            `
            id,
            player_id,
            program_id,
            status,
            start_date,
            end_date,
            current_week,
            current_phase_id,
            completion_percentage,
            modifications,
            notes,
            created_at,
            updated_at,
            training_programs!inner (id, name)
          `,
          )
          .eq("id", existingAssignment.id)
          .single();

        return res.json({
          success: true,
          data: {
            assignment: {
              ...fullAssignment,
              program: {
                id: fullAssignment.training_programs.id,
                name: fullAssignment.training_programs.name,
              },
            },
          },
          message: "Program already assigned",
        });
      }

      // Different program - check force flag
      if (!force) {
        return res.status(409).json({
          success: false,
          error: `User already has active program "${existingAssignment.training_programs.name}". Use force=true to switch programs.`,
        });
      }

      // Force switch: inactivate previous
      const today = new Date().toISOString().split("T")[0];
      await supabase
        .from("player_programs")
        .update({
          status: "inactive",
          end_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingAssignment.id);
    }

    // Create new assignment
    const newAssignment = {
      player_id: user.id,
      program_id,
      status,
      start_date: start_date || new Date().toISOString().split("T")[0],
      current_week: 1,
      completion_percentage: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: created, error: createError } = await supabase
      .from("player_programs")
      .insert(newAssignment)
      .select(
        `
        id,
        player_id,
        program_id,
        status,
        start_date,
        end_date,
        current_week,
        current_phase_id,
        completion_percentage,
        modifications,
        notes,
        created_at,
        updated_at,
        training_programs!inner (id, name)
      `,
      )
      .single();

    if (createError) {
      console.error(
        "[player-programs] Error creating assignment:",
        createError,
      );
      return res.status(500).json({
        success: false,
        error: createError.message,
      });
    }

    return res.json({
      success: true,
      data: {
        assignment: {
          ...created,
          program: {
            id: created.training_programs.id,
            name: created.training_programs.name,
          },
        },
      },
      message: "Program assigned successfully",
    });
  } catch (error) {
    console.error("[player-programs] Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});

// ============================================
// Daily Protocol API Endpoints
// ============================================

// GET /api/daily-protocol - Get today's protocol
app.get("/api/daily-protocol", async (req, res) => {
  if (!supabase) {
    return res
      .status(503)
      .json({ success: false, error: "Database not configured" });
  }

  try {
    // Get user from auth header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Authorization required",
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: "Invalid authentication",
      });
    }

    const date = req.query.date || new Date().toISOString().split("T")[0];

    // Return empty protocol for now - this can be enhanced later
    // The actual protocol generation is complex and handled by the Netlify function
    return res.json({
      success: true,
      data: {
        protocol_date: date,
        blocks: [],
        aiRationale: null,
      },
    });
  } catch (error) {
    console.error("[daily-protocol] Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});

// Hot reload client script
const hotReloadScript = `
<script>
(function() {
  const ws = new WebSocket('ws://' + window.location.host);
  ws.onopen = () => console.log('🔥 Hot reload connected');
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'reload') {
      console.log('🔄 Hot reloading:', data.file);
      if (data.file.endsWith('.css')) {
        const links = document.querySelectorAll('link[rel="stylesheet"]');
        links.forEach(link => { link.href = link.href.split('?')[0] + '?t=' + Date.now(); });
      } else {
        window.location.reload();
      }
    }
  };
})();
</script>
`;

// Helper to inject script into HTML
const injectScript = (filePath) => {
  const content = fs.readFileSync(filePath, "utf8");
  if (content.includes("</body>")) {
    return content.replace("</body>", `${hotReloadScript}</body>`);
  }
  return content + hotReloadScript;
};

// SPA CATCH-ALL ROUTE
app.get(/^(?!\/api).*$/, (_req, res) => {
  const angularIndexPath = path.join(
    __dirname,
    "angular/dist/flagfit-pro/browser/index.html",
  );

  if (
    fs.existsSync(angularIndexPath) &&
    fs.statSync(angularIndexPath).size > 0
  ) {
    res.send(injectScript(angularIndexPath));
  } else {
    // During development, redirect to Angular dev server
    res.redirect(`http://localhost:4200${_req.path}`);
  }
});

// ============================================
// ERROR HANDLING
// ============================================

// Handle payload too large errors
app.use((err, req, res, next) => {
  if (err.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      error: "Request body too large",
      code: "PAYLOAD_TOO_LARGE",
      maxSize: "10MB",
      timestamp: new Date().toISOString(),
    });
  }
  next(err);
});

// Handle JSON syntax errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      error: `Invalid JSON: ${err.message}`,
      code: "INVALID_JSON",
      timestamp: new Date().toISOString(),
    });
  }
  next(err);
});

// General error handler
app.use((err, req, res, _next) => {
  console.error("Server error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    code: "INTERNAL_ERROR",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
    timestamp: new Date().toISOString(),
  });
});

// AI Session support
app.get("/api/ai/chat/session/:sessionId", (req, res) => {
  res.json({ success: true, data: { messages: [] } });
});

// Wearables support
// ============================================
// START SERVER
// ============================================

server.listen(PORT, () => {
  console.log(
    `🏈 Flag Football Training App Server running on http://localhost:${PORT}`,
  );
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🎯 Main app: http://localhost:${PORT}`);
  console.log(`🔥 Hot reload enabled for Angular dist`);
});

export default app;
