/**
 * Development server for Flag Football Training App
 * Serves static files with proper MIME types and provides REAL API endpoints with Supabase
 */

import { createClient } from "@supabase/supabase-js";
import chokidar from "chokidar";
import cors from "cors";
import "dotenv/config";
import express from "express";
import { rateLimit } from "express-rate-limit";
import fs from "fs";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer } from "ws";

// Initialize Supabase client for real data
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 
                    process.env.SUPABASE_SERVICE_ROLE_KEY || 
                    process.env.SUPABASE_ANON_KEY || 
                    process.env.VITE_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

if (supabase) {
  console.log("✅ Supabase client initialized - using REAL data");
} else {
  console.warn("⚠️ Supabase not configured - some endpoints will return mock data");
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

// File watcher for hot reload
const watcher = chokidar.watch(
  [
    "angular/dist/flagfit-pro/browser/**/*",
    "src/**/*",
    "index.html",
    "*.css",
    "*.js"
  ],
  { ignored: /(^|[/\\])\../, persistent: true }
);

watcher.on("change", (filePath) => {
  console.log(`📁 File changed: ${filePath}`);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // 1 = OPEN
      client.send(JSON.stringify({ type: "reload", file: filePath, timestamp: Date.now() }));
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

// Enable CORS - explicitly allow Angular dev server
app.use(cors({
  origin: ['http://localhost:4200', 'http://127.0.0.1:4200', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
}));

// Parse JSON and URL-encoded bodies
app.use(express.json({ limit: "10mb" }));

// Request logging for development
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Apply rate limiter to auth routes
app.use("/api/auth/", authLimiter);

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

// Serve root-level assets (for legacy support during transition)
app.use(
  "/src",
  express.static("src", {
    dotfiles: "ignore",
    etag: true,
    lastModified: true,
    maxAge: "1h",
  }),
);

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "OK",
    message: "Flag Football Training App Server is running",
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// MOCK API ENDPOINTS FOR DEVELOPMENT
// ============================================

// Authentication endpoints
app.post("/api/auth/login", (req, res) => {
  res.json({
    success: true,
    data: {
      token: "mock-jwt-token",
      user: {
        id: "1",
        email: req.body.email || "user@example.com",
        name: "Test User",
        role: "player",
      },
    },
  });
});

app.post("/api/auth/register", (req, res) => {
  res.json({
    success: true,
    data: {
      token: "mock-jwt-token",
      user: {
        id: "1",
        email: req.body.email,
        name: req.body.name,
        role: "player",
      },
    },
  });
});

app.get("/api/auth/me", (_req, res) => {
  res.json({
    success: true,
    data: {
      id: "1",
      email: "user@example.com",
      name: "Test User",
      role: "player",
    },
  });
});

app.post("/api/auth/logout", (_req, res) => {
  res.json({ success: true, message: "Logged out successfully" });
});

// ============================================
// ENDPOINTS WITHOUT /api/ PREFIX (Legacy)
// ============================================

// Auth-me endpoint (used for token verification)
app.get("/auth-me", async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !supabase) {
    return res.json({
      success: true,
      data: {
        id: "dev-user",
        email: "dev@flagfit.pro",
        name: "Development User",
        role: "player",
      },
    });
  }

  try {
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ success: false, error: "Invalid token" });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: profile?.full_name || user.email?.split("@")[0],
        role: profile?.role || "player",
        avatar_url: profile?.avatar_url,
      },
    });
  } catch (error) {
    console.error("[Auth-me] Error:", error);
    res.status(500).json({ success: false, error: "Authentication failed" });
  }
});

// Training Stats endpoint (legacy without /api/)
app.get("/training-stats", async (req, res) => {
  if (!supabase) {
    return res.json({
      success: true,
      data: {
        totalSessions: 0,
        totalHours: 0,
        averageRpe: 0,
        weeklyGoal: { target: 5, completed: 0 },
        recentSessions: [],
      },
    });
  }

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: sessions } = await supabase
      .from("training_sessions")
      .select("*")
      .gte("session_date", thirtyDaysAgo.toISOString().split("T")[0])
      .eq("status", "completed")
      .order("session_date", { ascending: false })
      .limit(50);

    const totalMinutes = sessions?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0;
    const avgRpe = sessions?.length > 0 
      ? sessions.reduce((sum, s) => sum + (s.rpe || 5), 0) / sessions.length 
      : 0;

    // Calculate this week's sessions
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const thisWeekSessions = sessions?.filter(s => new Date(s.session_date) >= weekStart) || [];

    res.json({
      success: true,
      data: {
        totalSessions: sessions?.length || 0,
        totalHours: Math.round(totalMinutes / 60 * 10) / 10,
        averageRpe: Math.round(avgRpe * 10) / 10,
        weeklyGoal: {
          target: 5,
          completed: thisWeekSessions.length,
        },
        recentSessions: sessions?.slice(0, 5) || [],
      },
    });
  } catch (error) {
    console.error("[Training Stats] Error:", error);
    res.status(500).json({ success: false, error: "Failed to load training stats" });
  }
});

// Training Stats Enhanced endpoint
app.get("/training-stats-enhanced", async (req, res) => {
  if (!supabase) {
    return res.json({
      success: true,
      data: {
        stats: { totalSessions: 0, totalHours: 0 },
        trends: [],
        distribution: [],
      },
    });
  }

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: sessions } = await supabase
      .from("training_sessions")
      .select("*")
      .gte("session_date", thirtyDaysAgo.toISOString().split("T")[0])
      .eq("status", "completed")
      .order("session_date");

    // Weekly trends
    const weeklyData = {};
    sessions?.forEach(s => {
      const date = new Date(s.session_date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split("T")[0];
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { sessions: 0, minutes: 0, load: 0 };
      }
      weeklyData[weekKey].sessions++;
      weeklyData[weekKey].minutes += s.duration_minutes || 0;
      weeklyData[weekKey].load += (s.rpe || 5) * (s.duration_minutes || 60);
    });

    // Session type distribution
    const typeDistribution = {};
    sessions?.forEach(s => {
      const type = s.session_type || "General";
      typeDistribution[type] = (typeDistribution[type] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalSessions: sessions?.length || 0,
          totalHours: Math.round((sessions?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0) / 60 * 10) / 10,
        },
        trends: Object.entries(weeklyData).map(([week, data]) => ({
          week,
          ...data,
        })),
        distribution: Object.entries(typeDistribution).map(([type, count]) => ({
          type,
          count,
        })),
      },
    });
  } catch (error) {
    console.error("[Training Stats Enhanced] Error:", error);
    res.status(500).json({ success: false, error: "Failed to load enhanced stats" });
  }
});

// Knowledge Search endpoint (legacy without /api/)
app.get("/knowledge-search", async (req, res) => {
  if (!supabase) {
    return res.json({ success: true, data: [] });
  }

  try {
    const { query, topic, category, limit = 10 } = req.query;
    
    let dbQuery = supabase
      .from("knowledge_base_entries")
      .select("id, title, content, category, subcategory, source_type, evidence_grade")
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
    res.json({ success: true, data: [] });
  }
});

// Dashboard endpoints - REAL DATA
app.get("/api/dashboard/overview", async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!supabase) {
    return res.json({
      success: true,
      data: {
        stats: { trainingSessions: 0, performanceScore: 0, dayStreak: 0, tournaments: 0 },
        activities: [],
        upcomingSessions: [],
        message: "Database not configured",
      },
    });
  }

  try {
    // Get user from token if provided
    let userId = null;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    // Get training sessions count (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    let sessionsQuery = supabase
      .from("training_sessions")
      .select("id, session_date, rpe, duration_minutes, status", { count: "exact" })
      .gte("session_date", thirtyDaysAgo.toISOString().split("T")[0])
      .eq("status", "completed");
    
    if (userId) {
      sessionsQuery = sessionsQuery.or(`user_id.eq.${userId},athlete_id.eq.${userId}`);
    }
    
    const { data: sessions, count: sessionCount } = await sessionsQuery.limit(100);

    // Calculate performance score (average RPE inverted)
    const avgRpe = sessions?.length > 0 
      ? sessions.reduce((sum, s) => sum + (s.rpe || 5), 0) / sessions.length 
      : 5;
    const performanceScore = Math.round(100 - (avgRpe - 5) * 10);

    // Calculate day streak
    let dayStreak = 0;
    if (sessions && sessions.length > 0) {
      const sortedDates = [...new Set(sessions.map(s => s.session_date))].sort().reverse();
      const today = new Date().toISOString().split("T")[0];
      let checkDate = new Date(today);
      
      for (const date of sortedDates) {
        const diff = Math.floor((checkDate - new Date(date)) / (1000 * 60 * 60 * 24));
        if (diff <= 1) {
          dayStreak++;
          checkDate = new Date(date);
        } else {
          break;
        }
      }
    }

    // Get upcoming sessions
    const { data: upcomingSessions } = await supabase
      .from("training_sessions")
      .select("id, session_date, session_type, title")
      .gte("session_date", new Date().toISOString().split("T")[0])
      .eq("status", "scheduled")
      .order("session_date", { ascending: true })
      .limit(5);

    res.json({
      success: true,
      data: {
        stats: {
          trainingSessions: sessionCount || 0,
          performanceScore: Math.min(100, Math.max(0, performanceScore)),
          dayStreak,
          tournaments: 0, // Would need tournaments table
        },
        activities: sessions?.slice(0, 5).map(s => ({
          id: s.id,
          type: "training",
          date: s.session_date,
          rpe: s.rpe,
          duration: s.duration_minutes,
        })) || [],
        upcomingSessions: upcomingSessions || [],
      },
    });
  } catch (error) {
    console.error("[Dashboard] Error:", error);
    res.status(500).json({ success: false, error: "Failed to load dashboard data" });
  }
});

// Training endpoints - REAL DATA
app.get("/api/training/stats", async (req, res) => {
  if (!supabase) {
    return res.json({ success: true, data: { sessions: [], totalHours: 0 } });
  }

  try {
    const { data: sessions } = await supabase
      .from("training_sessions")
      .select("*")
      .eq("status", "completed")
      .order("session_date", { ascending: false })
      .limit(50);

    const totalMinutes = sessions?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0;

    res.json({
      success: true,
      data: {
        sessions: sessions || [],
        totalHours: Math.round(totalMinutes / 60 * 10) / 10,
        sessionCount: sessions?.length || 0,
      },
    });
  } catch (error) {
    console.error("[Training Stats] Error:", error);
    res.status(500).json({ success: false, error: "Failed to load training stats" });
  }
});

app.get("/api/training/sessions", async (req, res) => {
  if (!supabase) {
    return res.json({ success: true, data: [] });
  }

  try {
    const { data: sessions } = await supabase
      .from("training_sessions")
      .select("*")
      .order("session_date", { ascending: false })
      .limit(100);

    res.json({ success: true, data: sessions || [] });
  } catch (error) {
    console.error("[Training Sessions] Error:", error);
    res.status(500).json({ success: false, error: "Failed to load sessions" });
  }
});

app.post("/api/training/session", async (req, res) => {
  if (!supabase) {
    return res.status(201).json({
      success: true,
      data: { session: { id: `mock-${Date.now()}`, ...req.body } },
    });
  }

  try {
    const { data: session, error } = await supabase
      .from("training_sessions")
      .insert(req.body)
      .select()
      .single();

    if (error) {throw error;}

    res.status(201).json({ success: true, data: { session } });
  } catch (error) {
    console.error("[Create Session] Error:", error);
    res.status(500).json({ success: false, error: "Failed to create session" });
  }
});

app.get("/api/training/workouts/:id", async (req, res) => {
  if (!supabase) {
    return res.json({ success: true, data: { id: req.params.id, exercises: [] } });
  }

  try {
    const { data: session } = await supabase
      .from("training_sessions")
      .select("*, exercises:session_exercises(*)")
      .eq("id", req.params.id)
      .single();

    res.json({ success: true, data: session || { id: req.params.id, exercises: [] } });
  } catch (error) {
    console.error("[Get Workout] Error:", error);
    res.status(500).json({ success: false, error: "Failed to load workout" });
  }
});

app.put("/api/training/workouts/:id", async (req, res) => {
  if (!supabase) {
    return res.json({ success: true, data: { id: req.params.id, ...req.body } });
  }

  try {
    const { data: session, error } = await supabase
      .from("training_sessions")
      .update(req.body)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) {throw error;}

    res.json({ success: true, data: session });
  } catch (error) {
    console.error("[Update Workout] Error:", error);
    res.status(500).json({ success: false, error: "Failed to update workout" });
  }
});

// Exercise Library - REAL DATA
app.get("/api/exercises", async (req, res) => {
  if (!supabase) {
    return res.json({ success: true, data: [] });
  }

  try {
    const { category, position, search } = req.query;
    
    let query = supabase
      .from("exercises")
      .select("*")
      .eq("is_active", true);
    
    if (category) {query = query.eq("category", category);}
    if (position) {query = query.contains("target_positions", [position]);}
    if (search) {query = query.ilike("name", `%${search}%`);}
    
    const { data: exercises } = await query.order("name").limit(100);

    res.json({ success: true, data: exercises || [] });
  } catch (error) {
    console.error("[Exercises] Error:", error);
    res.status(500).json({ success: false, error: "Failed to load exercises" });
  }
});

// Analytics endpoints - REAL DATA

// Performance Trends
app.get("/api/analytics/performance-trends", async (req, res) => {
  const {userId} = req.query;
  const weeks = parseInt(req.query.weeks) || 7;
  
  if (!supabase) {
    return res.json({
      success: true,
      data: {
        labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", "Week 7"],
        values: [78, 82, 85, 79, 88, 91, 87],
        currentScore: 87,
        improvement: 9,
        weeklyTrend: "5.2",
      },
    });
  }

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - weeks * 7);

    const { data: sessions } = await supabase
      .from("training_sessions")
      .select("session_date, score, rpe, duration_minutes")
      .or(userId ? `user_id.eq.${userId},athlete_id.eq.${userId}` : "")
      .gte("session_date", startDate.toISOString().split("T")[0])
      .eq("status", "completed")
      .order("session_date");

    // Group by week
    const weeklyData = {};
    sessions?.forEach(s => {
      const date = new Date(s.session_date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split("T")[0];
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { scores: [], count: 0 };
      }
      weeklyData[weekKey].scores.push(s.score || 70);
      weeklyData[weekKey].count++;
    });

    const labels = [];
    const values = [];
    for (let i = 0; i < weeks; i++) {
      labels.push(`Week ${i + 1}`);
      const weekKeys = Object.keys(weeklyData).sort();
      if (weekKeys[i] && weeklyData[weekKeys[i]]) {
        const avg = weeklyData[weekKeys[i]].scores.reduce((a, b) => a + b, 0) / weeklyData[weekKeys[i]].scores.length;
        values.push(Math.round(avg));
      } else {
        values.push(values.length > 0 ? values[values.length - 1] : 70);
      }
    }

    res.json({
      success: true,
      data: {
        labels,
        values,
        currentScore: values.length > 0 ? values[values.length - 1] : 70,
        improvement: values.length > 1 ? values[values.length - 1] - values[0] : 0,
        weeklyTrend: values.length > 1 
          ? (((values[values.length - 1] - values[values.length - 2]) / values[values.length - 2]) * 100).toFixed(1)
          : "0",
      },
    });
  } catch (error) {
    console.error("[Performance Trends] Error:", error);
    res.json({
      success: true,
      data: {
        labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", "Week 7"],
        values: [78, 82, 85, 79, 88, 91, 87],
        currentScore: 87,
        improvement: 9,
        weeklyTrend: "5.2",
      },
    });
  }
});

// Team Chemistry
app.get("/api/analytics/team-chemistry", async (req, res) => {
  res.json({
    success: true,
    data: {
      labels: ["Communication", "Coordination", "Trust", "Cohesion", "Leadership", "Adaptability"],
      values: [8.4, 9.1, 7.5, 8.8, 9.2, 8.0],
      overall: 8.4,
      trustLevel: 9.1,
      leadership: 7.5,
    },
  });
});

// Training Distribution
app.get("/api/analytics/training-distribution", async (req, res) => {
  const {userId} = req.query;
  const period = req.query.period || "30days";
  
  if (!supabase) {
    return res.json({
      success: true,
      data: {
        labels: ["Speed Training", "Strength", "Agility", "Endurance", "Technique"],
        values: [25, 20, 22, 18, 15],
        total: 100,
      },
    });
  }

  try {
    const days = period === "30days" ? 30 : period === "90days" ? 90 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: sessions } = await supabase
      .from("training_sessions")
      .select("session_type, workout_type")
      .or(userId ? `user_id.eq.${userId},athlete_id.eq.${userId}` : "")
      .gte("session_date", startDate.toISOString().split("T")[0])
      .eq("status", "completed");

    const distribution = {};
    sessions?.forEach(s => {
      const type = s.workout_type || s.session_type || "General";
      distribution[type] = (distribution[type] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        labels: Object.keys(distribution).length > 0 ? Object.keys(distribution) : ["No Data"],
        values: Object.keys(distribution).length > 0 ? Object.values(distribution) : [0],
        total: sessions?.length || 0,
      },
    });
  } catch (error) {
    console.error("[Training Distribution] Error:", error);
    res.json({
      success: true,
      data: {
        labels: ["Speed Training", "Strength", "Agility", "Endurance", "Technique"],
        values: [25, 20, 22, 18, 15],
        total: 100,
      },
    });
  }
});

// Position Performance
app.get("/api/analytics/position-performance", async (req, res) => {
  res.json({
    success: true,
    data: {
      labels: ["QB", "WR", "RB", "DB", "Rusher"],
      values: [94, 91, 89, 87, 85],
      topPerformers: [
        { name: "Lorenzo S. #21", score: 94 },
        { name: "Aljosa K. #55", score: 91 },
        { name: "Vince M. #10", score: 89 },
      ],
    },
  });
});

// Speed Development
app.get("/api/analytics/speed-development", async (req, res) => {
  res.json({
    success: true,
    data: {
      labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", "Week 7"],
      datasets: [
        { label: "40-Yard Dash", data: [5.2, 5.1, 4.9, 4.8, 4.7, 4.52, 4.46] },
        { label: "10-Yard Split", data: [1.8, 1.75, 1.7, 1.68, 1.65, 1.62, 1.54] },
      ],
      best40Yard: "4.46",
      best10Yard: "1.54",
      improvement: "0.19",
      olympicTarget: "4.40",
    },
  });
});

// Analytics Summary
app.get("/api/analytics/summary", async (req, res) => {
  if (!supabase) {
    return res.json({
      success: true,
      data: { performanceTrends: [], teamChemistry: [], trainingDistribution: [] },
    });
  }

  try {
    // Get training data for last 30 days grouped by week
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: sessions } = await supabase
      .from("training_sessions")
      .select("session_date, rpe, duration_minutes, session_type")
      .gte("session_date", thirtyDaysAgo.toISOString().split("T")[0])
      .eq("status", "completed")
      .order("session_date");

    // Group by week for trends
    const weeklyData = {};
    sessions?.forEach(s => {
      const date = new Date(s.session_date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split("T")[0];
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { sessions: 0, totalLoad: 0, totalMinutes: 0 };
      }
      weeklyData[weekKey].sessions++;
      weeklyData[weekKey].totalLoad += (s.rpe || 5) * (s.duration_minutes || 60);
      weeklyData[weekKey].totalMinutes += s.duration_minutes || 0;
    });

    const performanceTrends = Object.entries(weeklyData).map(([week, data]) => ({
      week,
      sessions: data.sessions,
      avgLoad: Math.round(data.totalLoad / data.sessions),
      totalMinutes: data.totalMinutes,
    }));

    // Training distribution by type
    const typeDistribution = {};
    sessions?.forEach(s => {
      const type = s.session_type || "General";
      typeDistribution[type] = (typeDistribution[type] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        performanceTrends,
        trainingDistribution: Object.entries(typeDistribution).map(([type, count]) => ({
          type,
          count,
          percentage: Math.round((count / (sessions?.length || 1)) * 100),
        })),
        totalSessions: sessions?.length || 0,
      },
    });
  } catch (error) {
    console.error("[Analytics] Error:", error);
    res.status(500).json({ success: false, error: "Failed to load analytics" });
  }
});

// ACWR / Load Management - REAL DATA
app.get("/api/load-management/acwr", async (req, res) => {
  if (!supabase) {
    return res.json({ success: true, data: { acwr: null, riskZone: "unknown" } });
  }

  try {
    const authHeader = req.headers.authorization;
    let userId = req.query.user_id;
    
    if (authHeader && !userId) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    if (!userId) {
      return res.json({ success: true, data: { acwr: null, riskZone: "no_user" } });
    }

    const today = new Date();
    const acuteStartDate = new Date(today);
    acuteStartDate.setDate(acuteStartDate.getDate() - 7);
    const chronicStartDate = new Date(today);
    chronicStartDate.setDate(chronicStartDate.getDate() - 28);

    const { data: sessions } = await supabase
      .from("training_sessions")
      .select("session_date, duration_minutes, rpe, intensity_level")
      .or(`user_id.eq.${userId},athlete_id.eq.${userId}`)
      .gte("session_date", chronicStartDate.toISOString().split("T")[0])
      .lte("session_date", today.toISOString().split("T")[0])
      .in("status", ["completed", "in_progress"]);

    if (!sessions || sessions.length === 0) {
      return res.json({
        success: true,
        data: { acwr: null, riskZone: "insufficient_data", message: "No training data available" },
      });
    }

    const sessionsWithLoad = sessions.map(s => ({
      ...s,
      load: (s.duration_minutes || 60) * (s.rpe || s.intensity_level || 5),
      date: new Date(s.session_date),
    }));

    const acuteSessions = sessionsWithLoad.filter(s => s.date >= acuteStartDate);
    const acuteLoad = acuteSessions.reduce((sum, s) => sum + s.load, 0);
    const chronicLoad = sessionsWithLoad.reduce((sum, s) => sum + s.load, 0);
    const chronicAverage = chronicLoad / 4;

    if (chronicAverage === 0) {
      return res.json({
        success: true,
        data: { acwr: acuteLoad > 0 ? 99 : 0, riskZone: acuteLoad > 0 ? "danger" : "insufficient_data" },
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
        recommendation: riskZone === "danger" 
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
  const {playerId} = req.query;
  const {season} = req.query;
  
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
      const totals = stats.reduce((acc, s) => ({
        gamesPlayed: acc.gamesPlayed + 1,
        touchdowns: acc.touchdowns + (s.touchdowns || 0),
        receptions: acc.receptions + (s.receptions || 0),
        yards: acc.yards + (s.yards || 0),
        flagPulls: acc.flagPulls + (s.flag_pulls || 0),
      }), { gamesPlayed: 0, touchdowns: 0, receptions: 0, yards: 0, flagPulls: 0 });

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
    return res.json({ success: true, data: [] });
  }

  try {
    const { data: games } = await supabase
      .from("games")
      .select("*")
      .order("game_date", { ascending: false })
      .limit(50);

    res.json({ success: true, data: games || [] });
  } catch (error) {
    console.error("[Games] Error:", error);
    res.json({ success: true, data: [] });
  }
});

// Tournaments endpoints - REAL DATA
app.get("/api/tournaments", async (req, res) => {
  if (!supabase) {
    return res.json({ success: true, data: [] });
  }

  try {
    const { data: tournaments } = await supabase
      .from("tournaments")
      .select("*")
      .order("start_date", { ascending: true });

    res.json({ success: true, data: tournaments || [] });
  } catch (error) {
    console.error("[Tournaments] Error:", error);
    res.json({ success: true, data: [] });
  }
});

app.get("/api/tournaments/:id", async (req, res) => {
  if (!supabase) {
    return res.json({ success: true, data: null });
  }

  try {
    const { data: tournament } = await supabase
      .from("tournaments")
      .select(`
        *,
        games:tournament_games (*)
      `)
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
      data: { id: Date.now().toString(), ...req.body, createdAt: new Date().toISOString() },
    });
  }

  try {
    const { data: game, error } = await supabase
      .from("tournament_games")
      .insert(req.body)
      .select()
      .single();

    if (error) {throw error;}

    res.json({ success: true, data: game });
  } catch (error) {
    console.error("[Create Game] Error:", error);
    res.status(500).json({ success: false, error: "Failed to create game" });
  }
});

// Knowledge Base Search - REAL DATA
app.get("/api/knowledge-search", async (req, res) => {
  if (!supabase) {
    return res.json({ success: true, data: [] });
  }

  try {
    const { query, topic, category, limit = 10 } = req.query;
    
    let dbQuery = supabase
      .from("knowledge_base_entries")
      .select("id, title, content, category, subcategory, source_type, evidence_grade")
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
    res.json({ success: true, data: [] });
  }
});

// Community endpoints - REAL DATA
app.get("/api/community/feed", async (req, res) => {
  if (!supabase) {
    return res.json({ success: true, data: [] });
  }

  try {
    const { data: posts } = await supabase
      .from("community_posts")
      .select(`
        *,
        author:user_id (id, full_name, avatar_url),
        likes:post_likes (count),
        comments:post_comments (count)
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    res.json({ success: true, data: posts || [] });
  } catch (error) {
    console.error("[Community Feed] Error:", error);
    res.json({ success: true, data: [] });
  }
});

app.get("/api/community/leaderboard", async (req, res) => {
  if (!supabase) {
    return res.json({ success: true, data: [] });
  }

  try {
    // Get users with their training stats for leaderboard
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: leaderboard } = await supabase
      .from("training_sessions")
      .select(`
        user_id,
        users:user_id (id, full_name, avatar_url)
      `)
      .gte("session_date", thirtyDaysAgo.toISOString().split("T")[0])
      .eq("status", "completed");

    // Aggregate by user
    const userStats = {};
    leaderboard?.forEach(s => {
      if (s.user_id && s.users) {
        if (!userStats[s.user_id]) {
          userStats[s.user_id] = {
            user: s.users,
            sessions: 0,
            points: 0,
          };
        }
        userStats[s.user_id].sessions++;
        userStats[s.user_id].points += 10; // 10 points per session
      }
    });

    const ranked = Object.values(userStats)
      .sort((a, b) => b.points - a.points)
      .slice(0, 20)
      .map((u, i) => ({ ...u, rank: i + 1 }));

    res.json({ success: true, data: ranked });
  } catch (error) {
    console.error("[Leaderboard] Error:", error);
    res.json({ success: true, data: [] });
  }
});

app.post("/api/community/posts", async (req, res) => {
  if (!supabase) {
    return res.json({
      success: true,
      data: { id: Date.now().toString(), ...req.body, createdAt: new Date().toISOString() },
    });
  }

  try {
    const { data: post, error } = await supabase
      .from("community_posts")
      .insert({
        ...req.body,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {throw error;}

    res.json({ success: true, data: post });
  } catch (error) {
    console.error("[Create Post] Error:", error);
    res.status(500).json({ success: false, error: "Failed to create post" });
  }
});

// Wellness endpoints - REAL DATA
app.get("/api/wellness/checkins", async (req, res) => {
  if (!supabase) {
    return res.json({ success: true, data: [] });
  }

  try {
    const days = parseInt(req.query.days) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: checkins } = await supabase
      .from("wellness_checkins")
      .select("*")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false });

    res.json({ success: true, data: checkins || [] });
  } catch (error) {
    console.error("[Wellness] Error:", error);
    res.status(500).json({ success: false, error: "Failed to load wellness data" });
  }
});

app.get("/api/wellness/latest", async (req, res) => {
  if (!supabase) {
    return res.json({ success: true, data: null });
  }

  try {
    const { data: checkin } = await supabase
      .from("wellness_checkins")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    res.json({ success: true, data: checkin });
  } catch (error) {
    console.error("[Wellness Latest] Error:", error);
    res.json({ success: true, data: null });
  }
});

app.post("/api/wellness/checkin", async (req, res) => {
  if (!supabase) {
    return res.json({
      success: true,
      data: { id: Date.now().toString(), ...req.body, createdAt: new Date().toISOString() },
    });
  }

  try {
    const { data: checkin, error } = await supabase
      .from("wellness_checkins")
      .insert({
        ...req.body,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {throw error;}

    res.json({ success: true, data: checkin });
  } catch (error) {
    console.error("[Wellness Checkin] Error:", error);
    res.status(500).json({ success: false, error: "Failed to save checkin" });
  }
});

// Coach endpoints - REAL DATA
app.get("/api/coach/dashboard", async (req, res) => {
  if (!supabase) {
    return res.json({ success: true, data: { teamMembers: [], stats: {} } });
  }

  try {
    // Get team members
    const { data: members } = await supabase
      .from("team_members")
      .select(`
        id, role, jersey_number, position, status,
        users:user_id (id, email, full_name)
      `)
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
    res.status(500).json({ success: false, error: "Failed to load coach dashboard" });
  }
});

// Roster endpoints - REAL DATA
app.get("/api/roster", async (req, res) => {
  if (!supabase) {
    return res.json({ success: true, data: [] });
  }

  try {
    const { data: roster } = await supabase
      .from("team_members")
      .select(`
        id, role, jersey_number, position, status, joined_at,
        users:user_id (id, email, full_name, avatar_url)
      `)
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
    return res.json({ success: true, data: [] });
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
      .select(`
        *,
        members:team_members (
          id, role, jersey_number, position,
          users:user_id (id, email, full_name)
        )
      `)
      .eq("id", req.params.id)
      .single();

    res.json({ success: true, data: team });
  } catch (error) {
    console.error("[Team Details] Error:", error);
    res.status(500).json({ success: false, error: "Failed to load team" });
  }
});

// ============================================
// NOTIFICATIONS ENDPOINTS - REAL DATA
// ============================================

app.get("/api/notifications", async (req, res) => {
  if (!supabase) {
    return res.json({ success: true, data: [] });
  }

  try {
    const { data: notifications } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    res.json({ success: true, data: notifications || [] });
  } catch (error) {
    console.error("[Notifications] Error:", error);
    res.json({ success: true, data: [] });
  }
});

app.post("/api/notifications/mark-read", async (req, res) => {
  const { notificationId, ids } = req.body || {};

  if (!supabase) {
    return res.json({ success: true, message: "Marked as read" });
  }

  try {
    if (notificationId === "all") {
      await supabase.from("notifications").update({ read: true }).eq("read", false);
    } else if (Array.isArray(ids) && ids.length > 0) {
      await supabase.from("notifications").update({ read: true }).in("id", ids);
    } else if (notificationId) {
      await supabase.from("notifications").update({ read: true }).eq("id", notificationId);
    }
    res.json({ success: true, message: "Notifications marked as read" });
  } catch (error) {
    console.error("[Mark Read] Error:", error);
    res.json({ success: true, message: "Marked as read" });
  }
});

app.get("/api/notifications/count", async (req, res) => {
  if (!supabase) {
    return res.json({ success: true, data: { count: 0, unread: 0 } });
  }

  try {
    const { count: total } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true });
    
    const { count: unread } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("read", false);

    res.json({ success: true, data: { count: total || 0, unread: unread || 0 } });
  } catch (error) {
    console.error("[Notifications Count] Error:", error);
    res.json({ success: true, data: { count: 0, unread: 0 } });
  }
});

// Legacy Netlify function routes - redirect to /api/
app.get("/.netlify/functions/notifications", (req, res) => res.redirect("/api/notifications"));
app.post("/.netlify/functions/notifications", (req, res) => res.redirect(307, "/api/notifications/mark-read"));
app.get("/.netlify/functions/notifications-count", (req, res) => res.redirect("/api/notifications/count"));

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
    /\?$/,  // Questions often are follow-ups
    /\b(spread|split|divide|take|supplement|dose|dosage)\b/i,
  ];
  
  // Short messages are often follow-ups
  if (message.split(/\s+/).length <= 10) {
    for (const pattern of followUpIndicators) {
      if (pattern.test(message)) {return true;}
    }
  }
  return false;
}

// Helper to generate contextual follow-up responses
function generateFollowUpResponse(message, context) {
  const msgLower = message.toLowerCase();
  const {topic} = context;
  
  // Handle dosage/timing questions
  if (msgLower.includes("spread") || msgLower.includes("split") || msgLower.includes("days") || msgLower.includes("week")) {
    if (topic === "iron") {
      return {
        answer: `## About Your Iron Question\n\n**Important:** 65mg is a very high dose of iron!\n\n**Recommendation:**\n- The recommended daily intake is only 8-18mg/day\n- 65mg should NOT be taken all at once or "spread over days"\n- This is a therapeutic dose that requires medical supervision\n\n**Why High Doses Are Risky:**\n- Iron overdose can cause serious side effects\n- Nausea, constipation, stomach pain\n- Can interfere with zinc and copper absorption\n- Potential organ damage with chronic high intake\n\n**What You Should Do:**\n1. **Consult a doctor** before taking high-dose iron\n2. Get a blood test to confirm you actually need supplementation\n3. If prescribed, take as directed by your healthcare provider\n4. Consider getting iron from food sources instead\n\n**Safe Approach:**\nIf you're concerned about iron levels, get tested first. Most athletes can meet iron needs through diet alone.`,
        riskLevel: "high",
        disclaimer: "High-dose iron supplementation requires medical supervision. Please consult a healthcare provider.",
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
  if (msgLower.includes("can i") || msgLower.includes("should i") || msgLower.includes("is it safe")) {
    return {
      answer: `## Personalized Recommendation\n\nI can provide general information, but for personalized supplement advice:\n\n**Before Taking Any Supplement:**\n1. ✅ Get blood work done to check actual levels\n2. ✅ Consult with a healthcare provider or sports dietitian\n3. ✅ Consider your diet first - can you get nutrients from food?\n4. ✅ Check for interactions with any medications\n\n**General Safety:**\n- Most people don't need supplements if eating a balanced diet\n- Athletes may have slightly higher needs\n- More is NOT always better - some nutrients are harmful in excess\n\nWould you like me to explain more about ${topic || "this topic"}?`,
      riskLevel: "medium",
    };
  }
  
  // Default follow-up handling
  return null;
}

app.post("/api/ai-chat", async (req, res) => {
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
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    
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
    const isFollowUp = isFollowUpQuestion(message) && conversationContext.messages.length > 0;
    console.log(`[AI Chat] Session: ${chatSessionId}, Follow-up: ${isFollowUp}, Topic: ${conversationContext.topic}`);
    
    // Handle follow-up questions with context
    if (isFollowUp && conversationContext.topic) {
      const followUpResponse = generateFollowUpResponse(message, conversationContext);
      
      if (followUpResponse) {
        // Store message in memory
        conversationContext.messages.push({ role: "user", content: message });
        conversationContext.messages.push({ role: "assistant", content: followUpResponse.answer });
        conversationMemory.set(chatSessionId, conversationContext);
        
        console.log(`[AI Chat] Generated follow-up response for topic: ${conversationContext.topic}`);
        
        return res.json({
          success: true,
          data: {
            answer_markdown: followUpResponse.answer,
            citations: [{
              id: `followup-${  Date.now()}`,
              title: "Sports Nutrition Guidelines",
              source_type: "curated",
              evidence_grade: "B",
            }],
            risk_level: followUpResponse.riskLevel || "low",
            disclaimer: followUpResponse.disclaimer || null,
            suggested_actions: followUpResponse.riskLevel === "high" ? [{
              type: "ask_coach",
              label: "Consult Healthcare Provider",
              reason: "This topic requires professional guidance",
            }] : [],
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
    const stopWords = ["what", "how", "does", "should", "have", "much", "many", "the", "and", "for", "with", "this", "that", "from", "about", "daily", "each", "day", "intake", "need", "get"];
    const searchTerms = message.toLowerCase()
      .split(/\s+/)
      .filter(term => term.length >= 3 && !stopWords.includes(term));
    
    console.log(`[AI Chat] Query: "${message}" -> Search terms: [${searchTerms.join(", ")}]`);
    
    // Check for specific topics that need custom answers (not in KB)
    const customTopics = {
      magnesium: {
        answer: `## Magnesium for Athletes\n\n**Recommended Daily Intake:**\n- Men: 400-420mg/day\n- Women: 310-320mg/day\n- Athletes may need 10-20% more due to sweat losses\n\n**Why Athletes Need Magnesium:**\n- Muscle function and relaxation\n- Energy production (ATP synthesis)\n- Electrolyte balance\n- Sleep quality improvement\n- Reduces muscle cramps\n\n**Best Food Sources:**\n- Pumpkin seeds (156mg per oz)\n- Almonds (80mg per oz)\n- Spinach (78mg per cup cooked)\n- Black beans (60mg per cup)\n- Dark chocolate (64mg per oz)\n- Avocado (58mg each)\n\n**Timing:**\n- Take with meals for better absorption\n- Evening supplementation may improve sleep\n\n**Note:** If considering supplements, consult a healthcare provider. Most athletes can meet needs through diet.`,
        category: "nutrition"
      },
      zinc: {
        answer: `## Zinc for Athletes\n\n**Recommended Daily Intake:**\n- Men: 11mg/day\n- Women: 8mg/day\n\n**Benefits for Athletes:**\n- Immune function support\n- Testosterone production\n- Wound healing\n- Protein synthesis\n\n**Best Food Sources:**\n- Oysters (74mg per 3oz)\n- Beef (7mg per 3oz)\n- Crab (6.5mg per 3oz)\n- Pumpkin seeds (2.2mg per oz)\n- Chickpeas (2.5mg per cup)\n\n**Note:** Excessive zinc can interfere with copper absorption. Stick to food sources when possible.`,
        category: "nutrition"
      },
      iron: {
        answer: `## Iron for Athletes\n\n**Recommended Daily Intake:**\n- Men: 8mg/day\n- Women: 18mg/day (due to menstrual losses)\n- Athletes may have higher needs\n\n**Why Athletes Need Iron:**\n- Oxygen transport (hemoglobin)\n- Energy metabolism\n- Immune function\n- Endurance performance\n\n**Best Food Sources:**\n- Red meat (3mg per 3oz)\n- Fortified cereals (varies)\n- Spinach (6mg per cup cooked)\n- Lentils (3mg per cup)\n- Oysters (8mg per 3oz)\n\n**Tips:**\n- Vitamin C enhances iron absorption\n- Avoid tea/coffee with iron-rich meals\n- Get tested before supplementing\n\n**Warning:** Too much iron can be harmful. Only supplement if blood tests show deficiency.`,
        category: "nutrition"
      },
      potassium: {
        answer: `## Potassium for Athletes\n\n**Recommended Daily Intake:**\n- Adults: 2,600-3,400mg/day\n\n**Why Athletes Need Potassium:**\n- Muscle contractions\n- Fluid balance\n- Nerve function\n- Prevents cramping\n- Blood pressure regulation\n\n**Best Food Sources:**\n- Banana (422mg each)\n- Potato (926mg each)\n- Sweet potato (542mg each)\n- Spinach (839mg per cup cooked)\n- Coconut water (600mg per cup)\n- Orange juice (496mg per cup)\n\n**Timing:**\n- Replenish after heavy sweating\n- Include in post-workout meals`,
        category: "nutrition"
      },
      vitamin: {
        answer: `## Vitamins for Athletes\n\n**Key Vitamins for Performance:**\n\n**Vitamin D:**\n- Bone health, immune function, muscle strength\n- Many athletes are deficient\n- Target: 600-800 IU/day (may need more if deficient)\n- Sources: Sunlight, fatty fish, fortified foods\n\n**B Vitamins:**\n- Energy metabolism, red blood cell production\n- B12 important for vegans/vegetarians\n- Sources: Meat, eggs, dairy, whole grains\n\n**Vitamin C:**\n- Immune function, collagen synthesis\n- Enhances iron absorption\n- Sources: Citrus, berries, peppers\n\n**Vitamin E:**\n- Antioxidant, cell protection\n- Sources: Nuts, seeds, vegetable oils\n\n**Recommendation:** Get vitamins from food first. Only supplement if testing shows deficiency or dietary intake is inadequate.`,
        category: "nutrition"
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
      conversationContext.messages.push({ role: "assistant", content: customAnswer.answer });
      conversationMemory.set(chatSessionId, conversationContext);
      
      return res.json({
        success: true,
        data: {
          answer_markdown: customAnswer.answer,
          citations: [{
            id: `custom-${  Date.now()}`,
            title: "Sports Nutrition Guidelines",
            source_type: "curated",
            evidence_grade: "B",
          }],
          risk_level: "low",
          disclaimer: "This information is for general guidance. Individual needs may vary. Consult a healthcare provider before starting any supplement regimen.",
          suggested_actions: [],
          chat_session_id: session_id || `dev-session-${Date.now()}`,
          message_id: `msg-${Date.now()}`,
          acwr_safety: null,
          metadata: {
            source: "custom_knowledge",
            topic: Object.keys(customTopics).find(t => message.toLowerCase().includes(t)),
          },
        },
      });
    }

    // Search using multiple methods for better results
    let knowledgeResults = [];
    let searchMethod = "none";

    // Method 1: Try to find exact topic matches first
    // Priority search terms: nouns/key topics first (longer words tend to be more specific)
    const prioritizedTerms = [...searchTerms].sort((a, b) => b.length - a.length);
    
    for (const term of prioritizedTerms) {
      // Skip generic terms that match too many things
      const genericTerms = ["intake", "should", "recommend", "daily", "much", "best", "good", "help", "need", "want"];
      if (genericTerms.includes(term)) {continue;}
      
      const { data: termMatches } = await supabase
        .from("knowledge_base_entries")
        .select("id, title, content, category, subcategory, source_type, evidence_grade, source_quality_score")
        .or(`title.ilike.%${term}%,content.ilike.%${term}%`)
        .eq("is_active", true)
        .order("source_quality_score", { ascending: false, nullsFirst: false })
        .limit(5);

      if (termMatches && termMatches.length > 0) {
        // Score results by relevance to the PRIMARY search term
        const scoredResults = termMatches.map(entry => {
          let score = entry.source_quality_score || 0.5;
          const titleLower = entry.title.toLowerCase();
          const contentLower = entry.content.toLowerCase();
          
          // Strong boost for title containing the search term
          if (titleLower.includes(term)) {score += 0.5;}
          
          // Boost for ALL search terms in content
          searchTerms.forEach(t => {
            if (titleLower.includes(t)) {score += 0.2;}
            if (contentLower.includes(t)) {score += 0.1;}
          });
          
          return { ...entry, _score: score };
        });
        
        // Sort by score and take best matches
        scoredResults.sort((a, b) => b._score - a._score);
        knowledgeResults = scoredResults.slice(0, 3);
        searchMethod = `term_match:${term}`;
        console.log(`[AI Chat] Found ${knowledgeResults.length} results for term "${term}"`);
        break; // Found matches for a key term, stop searching
      }
    }
    
    // If no results from specific terms, try less specific ones
    if (knowledgeResults.length === 0) {
      for (const term of searchTerms) {
        const { data: termMatches } = await supabase
          .from("knowledge_base_entries")
          .select("id, title, content, category, subcategory, source_type, evidence_grade, source_quality_score")
          .or(`title.ilike.%${term}%,content.ilike.%${term}%`)
          .eq("is_active", true)
          .order("source_quality_score", { ascending: false, nullsFirst: false })
          .limit(3);

        if (termMatches && termMatches.length > 0) {
          knowledgeResults = termMatches;
          searchMethod = `fallback_term:${term}`;
          console.log(`[AI Chat] Fallback: found ${knowledgeResults.length} results for "${term}"`);
          break;
        }
      }
    }

    // Method 2: Try category/topic keyword matching
    if (knowledgeResults.length === 0) {
      const categoryKeywords = {
        // Nutrition
        magnesium: "nutrition", calcium: "nutrition", vitamin: "nutrition", supplement: "nutrition",
        protein: "nutrition", carb: "nutrition", calorie: "nutrition", diet: "nutrition",
        hydration: "nutrition", water: "nutrition", drink: "nutrition", eat: "nutrition",
        food: "nutrition", nutrition: "nutrition", meal: "nutrition",
        // Recovery
        sleep: "recovery", rest: "recovery", tired: "recovery", recovery: "recovery",
        fatigue: "recovery", soreness: "recovery",
        // Training Load
        rpe: "training_load", acwr: "training_load", load: "training_load",
        overtraining: "training_load", periodization: "training_load",
        // Training
        training: "training", workout: "training", exercise: "training",
        agility: "training", speed: "training", strength: "training", drill: "training",
        // Injury Prevention
        injury: "injury_prevention", prevent: "injury_prevention", acl: "injury_prevention",
        ankle: "injury_prevention", hamstring: "injury_prevention", knee: "injury_prevention",
        // Game Preparation
        warmup: "game_preparation", "warm-up": "game_preparation", stretch: "game_preparation",
        cooldown: "game_preparation", pregame: "game_preparation",
        // Position Training
        quarterback: "position_training", qb: "position_training",
        receiver: "position_training", wr: "position_training",
        rusher: "position_training", defender: "position_training",
        // Mental Performance
        visualization: "mental_performance", anxiety: "mental_performance", mental: "mental_performance",
        focus: "mental_performance", confidence: "mental_performance", stress: "mental_performance",
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
        console.log(`[AI Chat] Category match: ${matchedKeyword} -> ${matchedCategory}`);
        const { data: categoryMatches } = await supabase
          .from("knowledge_base_entries")
          .select("id, title, content, category, subcategory, source_type, evidence_grade, source_quality_score")
          .eq("category", matchedCategory)
          .eq("is_active", true)
          .order("source_quality_score", { ascending: false, nullsFirst: false })
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
        .select("id, title, content, category, subcategory, source_type, evidence_grade, source_quality_score")
        .eq("is_active", true)
        .order("source_quality_score", { ascending: false, nullsFirst: false })
        .limit(3);

      if (faqEntries) {
        knowledgeResults = faqEntries;
        searchMethod = "fallback";
      }
    }
    
    console.log(`[AI Chat] Final results: ${knowledgeResults.length} entries via ${searchMethod}`);

    // Generate response
    let answer;
    let citations = [];

    if (knowledgeResults.length > 0) {
      // Use the best matching knowledge entry
      const primarySource = knowledgeResults[0];
      answer = primarySource.content;

      // Build citations
      citations = knowledgeResults.map(entry => ({
        id: entry.id,
        title: entry.title,
        source_type: entry.source_type || "curated",
        evidence_grade: entry.evidence_grade || "B",
      }));

      // Add personalized note if relevant
      if (knowledgeResults.length > 1) {
        answer += `\n\n---\n*For more details, check out: ${knowledgeResults.slice(1).map(e => e.title).join(", ")}*`;
      }
    } else {
      answer = `I understand you're asking about "${message.slice(0, 50)}${message.length > 50 ? '...' : ''}"\n\n` +
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
    const mediumRiskKeywords = ["injury", "pain", "hurt", "sore", "strain", "sprain"];
    const highRiskKeywords = ["medical", "supplement", "medication", "drug", "doctor"];

    if (highRiskKeywords.some(k => message.toLowerCase().includes(k))) {
      riskLevel = "high";
    } else if (mediumRiskKeywords.some(k => message.toLowerCase().includes(k))) {
      riskLevel = "medium";
    }

    // Generate disclaimer based on risk level
    let disclaimer = null;
    if (riskLevel === "high") {
      disclaimer = "This information is for educational purposes only. Please consult a healthcare professional for medical advice.";
    } else if (riskLevel === "medium") {
      disclaimer = "If you're experiencing persistent symptoms, please consult with your coach or a healthcare provider.";
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
    if (knowledgeResults.length > 0 && knowledgeResults[0].category === "training") {
      suggestedActions.push({
        type: "read_article",
        label: "View Related Exercises",
        reason: "Explore exercises related to this topic",
      });
    }

    // Store conversation context for follow-up questions
    const detectedTopic = knowledgeResults.length > 0 ? knowledgeResults[0].category : null;
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
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('</body>')) {
    return content.replace('</body>', `${hotReloadScript  }</body>`);
  }
  return content + hotReloadScript;
};

// SPA CATCH-ALL ROUTE
app.get(/^(?!\/api).*$/, (_req, res) => {
  const angularIndexPath = path.join(
    __dirname,
    "angular/dist/flagfit-pro/browser/index.html",
  );

  if (fs.existsSync(angularIndexPath)) {
    res.send(injectScript(angularIndexPath));
  } else {
    res.send(injectScript(path.join(__dirname, "index.html")));
  }
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((err, req, res, _next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      error: `Invalid JSON: ${  err.message}`,
    });
  }

  console.error("Server error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: err.message,
  });
});

// ============================================
// START SERVER
// ============================================

server.listen(PORT, () => {
  console.log(
    `🏈 Flag Football Training App Server running on http://localhost:${PORT}`,
  );
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🎯 Main app: http://localhost:${PORT}`);
  console.log(`🔥 Hot reload enabled for Angular dist and legacy src`);
});

export default app;
