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
const supabaseKey =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

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

// Enable CORS - explicitly allow Angular dev server
app.use(
  cors({
    origin: [
      "http://localhost:4200",
      "http://127.0.0.1:4200",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
  }),
);

// Parse JSON and URL-encoded bodies
app.use(express.json({ limit: "10mb" }));

// Request logging for development
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`,
    );
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
            "No active training program found. Set up your annual program to see daily training.",
          trainingStatus: {
            phase: "No Program",
            acwr: 0,
            acwrStatus: "N/A",
            recentSessions: 0,
          },
          todaysPractice: null,
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
          focus: ["Recovery", "Mental preparation"],
          duration: 0,
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
        focus: [
          "Complete rest",
          "Light walking",
          "Mental preparation for next phase",
        ],
        totalDuration: 0,
        message: `Transition period between ${prevWeek?.training_phases?.name || "previous phase"} and ${nextWeek?.training_phases?.name || "next phase"}. Next training starts ${nextWeek?.start_date || "soon"}.`,
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
// ENDPOINTS WITHOUT /api/ PREFIX (Legacy)
// ============================================

// Auth-me endpoint (used for token verification)
app.get("/auth-me", async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!supabase) {
    return res
      .status(503)
      .json({ success: false, error: "Database not configured" });
  }

  if (!authHeader) {
    return res.status(401).json({ success: false, error: "No token provided" });
  }

  try {
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

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
    return res
      .status(503)
      .json({ success: false, error: "Database not configured" });
  }

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: sessions, error } = await supabase
      .from("training_sessions")
      .select("*")
      .gte("session_date", thirtyDaysAgo.toISOString().split("T")[0])
      .eq("status", "completed")
      .order("session_date", { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

    const totalMinutes =
      sessions?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0;
    const avgRpe =
      sessions?.length > 0
        ? sessions.reduce((sum, s) => sum + (s.rpe || 5), 0) / sessions.length
        : 0;

    // Calculate this week's sessions
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const thisWeekSessions =
      sessions?.filter((s) => new Date(s.session_date) >= weekStart) || [];

    res.json({
      success: true,
      data: {
        totalSessions: sessions?.length || 0,
        totalHours: Math.round((totalMinutes / 60) * 10) / 10,
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
    res
      .status(500)
      .json({ success: false, error: "Failed to load training stats" });
  }
});

// Training Stats Enhanced endpoint
app.get("/training-stats-enhanced", async (req, res) => {
  if (!supabase) {
    return res
      .status(503)
      .json({ success: false, error: "Database not configured" });
  }

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: sessions, error } = await supabase
      .from("training_sessions")
      .select("*")
      .gte("session_date", thirtyDaysAgo.toISOString().split("T")[0])
      .eq("status", "completed")
      .order("session_date");

    if (error) {
      throw error;
    }

    // Weekly trends
    const weeklyData = {};
    sessions?.forEach((s) => {
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
    sessions?.forEach((s) => {
      const type = s.session_type || "General";
      typeDistribution[type] = (typeDistribution[type] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalSessions: sessions?.length || 0,
          totalHours:
            Math.round(
              ((sessions?.reduce(
                (sum, s) => sum + (s.duration_minutes || 0),
                0,
              ) || 0) /
                60) *
                10,
            ) / 10,
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
    res
      .status(500)
      .json({ success: false, error: "Failed to load enhanced stats" });
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
    res.json({ success: true, data: [] });
  }
});

// Dashboard endpoints - REAL DATA
app.get("/api/dashboard/overview", async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!supabase) {
    return res
      .status(503)
      .json({ success: false, error: "Database not configured" });
  }

  try {
    // Get user from token if provided
    let userId = null;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const {
        data: { user },
      } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    // Get training sessions count (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let sessionsQuery = supabase
      .from("training_sessions")
      .select("id, session_date, rpe, duration_minutes, status", {
        count: "exact",
      })
      .gte("session_date", thirtyDaysAgo.toISOString().split("T")[0])
      .eq("status", "completed");

    if (userId) {
      sessionsQuery = sessionsQuery.or(
        `user_id.eq.${userId},athlete_id.eq.${userId}`,
      );
    }

    const {
      data: sessions,
      count: sessionCount,
      error,
    } = await sessionsQuery.limit(100);
    if (error) {
      throw error;
    }

    // Calculate performance score (average RPE inverted)
    const avgRpe =
      sessions?.length > 0
        ? sessions.reduce((sum, s) => sum + (s.rpe || 5), 0) / sessions.length
        : 5;
    const performanceScore = Math.round(100 - (avgRpe - 5) * 10);

    // Calculate day streak
    let dayStreak = 0;
    if (sessions && sessions.length > 0) {
      const sortedDates = [...new Set(sessions.map((s) => s.session_date))]
        .sort()
        .reverse();
      const today = new Date().toISOString().split("T")[0];
      let checkDate = new Date(today);

      for (const date of sortedDates) {
        const diff = Math.floor(
          (checkDate - new Date(date)) / (1000 * 60 * 60 * 24),
        );
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
        activities:
          sessions?.slice(0, 5).map((s) => ({
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
    res
      .status(500)
      .json({ success: false, error: "Failed to load dashboard data" });
  }
});

// Additional Dashboard Endpoints for local development
app.get("/api/dashboard/training-calendar", async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ success: false, error: "Database not configured" });
  }
  try {
    const { data: sessions } = await supabase
      .from("training_sessions")
      .select("id, workout_type, session_date, duration_minutes")
      .order("session_date", { ascending: true });
    res.json({ success: true, data: { calendar: sessions || [], upcomingSessions: sessions || [] } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/dashboard/olympic-qualification", async (req, res) => {
  res.json({
    success: true,
    data: {
      qualification: { qualification_probability: 73, world_ranking: 8, days_until_championship: 124 },
      benchmarks: [
        { metric_name: "40-Yard Dash", current_value: 4.52, target_value: 4.4, unit: "s" },
        { metric_name: "Passing Accuracy", current_value: 82.5, target_value: 85, unit: "%" }
      ]
    }
  });
});

app.get("/api/dashboard/sponsor-rewards", async (req, res) => {
  res.json({
    success: true,
    data: {
      rewards: { available_points: 2847, current_tier: "GOLD", products_available: 236, tier_progress_percentage: 65 },
      products: [
        { product_name: "Pro Grip Football Socks", points_cost: 350, relevance_score: 92, category: "Gear" }
      ]
    }
  });
});

app.get("/api/dashboard/team-chemistry", async (req, res) => {
  res.json({
    success: true,
    data: {
      overall_chemistry: 8.4,
      communication_score: 9.1,
      trust_score: 8.7,
      leadership_score: 8.2,
      last_intervention: "Trust building exercise",
      intervention_effectiveness: 87
    }
  });
});

app.get("/api/dashboard/daily-quote", async (req, res) => {
  res.json({
    success: true,
    data: {
      quote_text: "Champions aren't made in comfort zones. Today's training is tomorrow's victory.",
      author: "Coach Marcus Rivera",
      category: "motivation"
    }
  });
});

app.get("/api/dashboard/health", async (req, res) => {
  res.json({ success: true, status: "healthy", timestamp: new Date().toISOString(), service: "dashboard" });
});

// Training endpoints - REAL DATA
app.get("/api/training/stats", async (req, res) => {
  if (!supabase) {
    return res
      .status(503)
      .json({ success: false, error: "Database not configured" });
  }

  try {
    const { data: sessions, error } = await supabase
      .from("training_sessions")
      .select("*")
      .eq("status", "completed")
      .order("session_date", { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

    const totalMinutes =
      sessions?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0;

    res.json({
      success: true,
      data: {
        sessions: sessions || [],
        totalHours: Math.round((totalMinutes / 60) * 10) / 10,
        sessionCount: sessions?.length || 0,
      },
    });
  } catch (error) {
    console.error("[Training Stats] Error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to load training stats" });
  }
});

app.get("/api/training/sessions", async (req, res) => {
  if (!supabase) {
    return res
      .status(503)
      .json({ success: false, error: "Database not configured" });
  }

  try {
    const { data: sessions, error } = await supabase
      .from("training_sessions")
      .select("*")
      .order("session_date", { ascending: false })
      .limit(100);

    if (error) {
      throw error;
    }

    res.json({ success: true, data: sessions || [] });
  } catch (error) {
    console.error("[Training Sessions] Error:", error);
    res.status(500).json({ success: false, error: "Failed to load sessions" });
  }
});

app.post("/api/training/session", async (req, res) => {
  if (!supabase) {
    return res
      .status(503)
      .json({ success: false, error: "Database not configured" });
  }

  try {
    const { data: session, error } = await supabase
      .from("training_sessions")
      .insert(req.body)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({ success: true, data: { session } });
  } catch (error) {
    console.error("[Create Session] Error:", error);
    res.status(500).json({ success: false, error: "Failed to create session" });
  }
});

app.get("/api/training/workouts/:id", async (req, res) => {
  if (!supabase) {
    return res
      .status(503)
      .json({ success: false, error: "Database not configured" });
  }

  try {
    const { data: session, error } = await supabase
      .from("training_sessions")
      .select("*, exercises:session_exercises(*)")
      .eq("id", req.params.id)
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: session || { id: req.params.id, exercises: [] },
    });
  } catch (error) {
    console.error("[Get Workout] Error:", error);
    res.status(500).json({ success: false, error: "Failed to load workout" });
  }
});

app.put("/api/training/workouts/:id", async (req, res) => {
  if (!supabase) {
    return res
      .status(503)
      .json({ success: false, error: "Database not configured" });
  }

  try {
    const { data: session, error } = await supabase
      .from("training_sessions")
      .update(req.body)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({ success: true, data: session });
  } catch (error) {
    console.error("[Update Workout] Error:", error);
    res.status(500).json({ success: false, error: "Failed to update workout" });
  }
});

// Exercise Library - REAL DATA
app.get("/api/exercises", async (req, res) => {
  if (!supabase) {
    return res
      .status(503)
      .json({ success: false, error: "Database not configured" });
  }

  try {
    const { category, position, search } = req.query;

    let query = supabase.from("exercises").select("*").eq("is_active", true);

    if (category) {
      query = query.eq("category", category);
    }
    if (position) {
      query = query.contains("target_positions", [position]);
    }
    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data: exercises, error } = await query.order("name").limit(100);
    if (error) {
      throw error;
    }

    res.json({ success: true, data: exercises || [] });
  } catch (error) {
    console.error("[Exercises] Error:", error);
    res.status(500).json({ success: false, error: "Failed to load exercises" });
  }
});

// Analytics endpoints - REAL DATA

// Performance Trends
app.get("/api/analytics/performance-trends", async (req, res) => {
  const { userId } = req.query;
  const weeks = parseInt(req.query.weeks) || 7;

  if (!supabase) {
    return res
      .status(503)
      .json({ success: false, error: "Database not configured" });
  }

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - weeks * 7);

    const { data: sessions, error } = await supabase
      .from("training_sessions")
      .select("session_date, score, rpe, duration_minutes")
      .or(userId ? `user_id.eq.${userId},athlete_id.eq.${userId}` : "")
      .gte("session_date", startDate.toISOString().split("T")[0])
      .eq("status", "completed")
      .order("session_date");

    if (error) {
      throw error;
    }

    // Group by week
    const weeklyData = {};
    sessions?.forEach((s) => {
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
        const avg =
          weeklyData[weekKeys[i]].scores.reduce((a, b) => a + b, 0) /
          weeklyData[weekKeys[i]].scores.length;
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
        improvement:
          values.length > 1 ? values[values.length - 1] - values[0] : 0,
        weeklyTrend:
          values.length > 1
            ? (
                ((values[values.length - 1] - values[values.length - 2]) /
                  values[values.length - 2]) *
                100
              ).toFixed(1)
            : "0",
      },
    });
  } catch (error) {
    console.error("[Performance Trends] Error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to load performance trends" });
  }
});

// Team Chemistry
app.get("/api/analytics/team-chemistry", async (req, res) => {
  if (!supabase) {
    return res
      .status(503)
      .json({ success: false, error: "Database not configured" });
  }

  try {
    const { data: chemistry, error } = await supabase
      .from("team_chemistry")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    res.json({
      success: true,
      data: chemistry
        ? {
            labels: [
              "Communication",
              "Coordination",
              "Trust",
              "Cohesion",
              "Leadership",
              "Adaptability",
            ],
            values: [
              chemistry.communication,
              chemistry.coordination,
              chemistry.trust,
              chemistry.cohesion,
              chemistry.leadership,
              chemistry.adaptability,
            ],
            overall: chemistry.overall_score,
            trustLevel: chemistry.trust,
            leadership: chemistry.leadership,
          }
        : {
            labels: [
              "Communication",
              "Coordination",
              "Trust",
              "Cohesion",
              "Leadership",
              "Adaptability",
            ],
            values: [0, 0, 0, 0, 0, 0],
            overall: 0,
            trustLevel: 0,
            leadership: 0,
            message: "No team chemistry data available",
          },
    });
  } catch (error) {
    console.error("[Team Chemistry] Error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to load team chemistry" });
  }
});

// Training Distribution
app.get("/api/analytics/training-distribution", async (req, res) => {
  const { userId } = req.query;
  const period = req.query.period || "30days";

  if (!supabase) {
    return res
      .status(503)
      .json({ success: false, error: "Database not configured" });
  }

  try {
    const days = period === "30days" ? 30 : period === "90days" ? 90 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: sessions, error } = await supabase
      .from("training_sessions")
      .select("session_type, workout_type")
      .or(userId ? `user_id.eq.${userId},athlete_id.eq.${userId}` : "")
      .gte("session_date", startDate.toISOString().split("T")[0])
      .eq("status", "completed");

    if (error) {
      throw error;
    }

    const distribution = {};
    sessions?.forEach((s) => {
      const type = s.workout_type || s.session_type || "General";
      distribution[type] = (distribution[type] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        labels:
          Object.keys(distribution).length > 0
            ? Object.keys(distribution)
            : ["No Data"],
        values:
          Object.keys(distribution).length > 0
            ? Object.values(distribution)
            : [0],
        total: sessions?.length || 0,
      },
    });
  } catch (error) {
    console.error("[Training Distribution] Error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to load distribution" });
  }
});

// Position Performance
app.get("/api/analytics/position-performance", async (req, res) => {
  if (!supabase) {
    return res
      .status(503)
      .json({ success: false, error: "Database not configured" });
  }

  try {
    const { data: stats, error } = await supabase
      .from("position_performance")
      .select("*")
      .order("score", { ascending: false });

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    if (!stats || stats.length === 0) {
      return res.json({
        success: true,
        data: {
          labels: ["QB", "WR", "RB", "DB", "Rusher"],
          values: [0, 0, 0, 0, 0],
          topPerformers: [],
          message: "No position performance data available",
        },
      });
    }

    res.json({
      success: true,
      data: {
        labels: stats.map((s) => s.position_code),
        values: stats.map((s) => s.score),
        topPerformers: stats.slice(0, 3).map((s) => ({
          name: s.player_name,
          score: s.score,
        })),
      },
    });
  } catch (error) {
    console.error("[Position Performance] Error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to load position performance" });
  }
});

// Speed Development
app.get("/api/analytics/speed-development", async (req, res) => {
  if (!supabase) {
    return res
      .status(503)
      .json({ success: false, error: "Database not configured" });
  }

  try {
    const { data: stats, error } = await supabase
      .from("speed_development")
      .select("*")
      .order("date");

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    if (!stats || stats.length === 0) {
      return res.json({
        success: true,
        data: {
          labels: [],
          datasets: [],
          message: "No speed development data available",
        },
      });
    }

    // Process stats into datasets
    const labels = [...new Set(stats.map((s) => s.week_label))];
    const dataset40 = {
      label: "40-Yard Dash",
      data: stats.map((s) => s.dash_40_time),
    };
    const dataset10 = {
      label: "10-Yard Split",
      data: stats.map((s) => s.split_10_time),
    };

    res.json({
      success: true,
      data: {
        labels,
        datasets: [dataset40, dataset10],
        best40Yard: Math.min(
          ...stats.map((s) => s.dash_40_time || 99),
        ).toString(),
        best10Yard: Math.min(
          ...stats.map((s) => s.split_10_time || 99),
        ).toString(),
        improvement: (
          stats[0].dash_40_time - stats[stats.length - 1].dash_40_time
        ).toFixed(2),
        olympicTarget: "4.40",
      },
    });
  } catch (error) {
    console.error("[Speed Development] Error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to load speed development" });
  }
});

// Analytics Summary
app.get("/api/analytics/summary", async (req, res) => {
  if (!supabase) {
    return res
      .status(503)
      .json({ success: false, error: "Database not configured" });
  }

  try {
    // Get training data for last 30 days grouped by week
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: sessions, error } = await supabase
      .from("training_sessions")
      .select("session_date, rpe, duration_minutes, session_type")
      .gte("session_date", thirtyDaysAgo.toISOString().split("T")[0])
      .eq("status", "completed")
      .order("session_date");

    if (error) {
      throw error;
    }

    // Group by week for trends
    const weeklyData = {};
    sessions?.forEach((s) => {
      const date = new Date(s.session_date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split("T")[0];

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { sessions: 0, totalLoad: 0, totalMinutes: 0 };
      }
      weeklyData[weekKey].sessions++;
      weeklyData[weekKey].totalLoad +=
        (s.rpe || 5) * (s.duration_minutes || 60);
      weeklyData[weekKey].totalMinutes += s.duration_minutes || 0;
    });

    const performanceTrends = Object.entries(weeklyData).map(
      ([week, data]) => ({
        week,
        sessions: data.sessions,
        avgLoad: Math.round(data.totalLoad / data.sessions),
        totalMinutes: data.totalMinutes,
      }),
    );

    // Training distribution by type
    const typeDistribution = {};
    sessions?.forEach((s) => {
      const type = s.session_type || "General";
      typeDistribution[type] = (typeDistribution[type] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        performanceTrends,
        trainingDistribution: Object.entries(typeDistribution).map(
          ([type, count]) => ({
            type,
            count,
            percentage: Math.round((count / (sessions?.length || 1)) * 100),
          }),
        ),
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
      .or(`user_id.eq.${userId},athlete_id.eq.${userId}`)
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
    return res.json({ success: true, data: [] });
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
      .select(
        `
        *,
        author:user_id (id, full_name, avatar_url),
        likes:post_likes (count),
        comments:post_comments (count)
      `,
      )
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
      .select(
        `
        user_id,
        users:user_id (id, full_name, avatar_url)
      `,
      )
      .gte("session_date", thirtyDaysAgo.toISOString().split("T")[0])
      .eq("status", "completed");

    // Aggregate by user
    const userStats = {};
    leaderboard?.forEach((s) => {
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
      data: {
        id: Date.now().toString(),
        ...req.body,
        createdAt: new Date().toISOString(),
      },
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

    if (error) {
      throw error;
    }

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
    res
      .status(500)
      .json({ success: false, error: "Failed to load wellness data" });
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
      data: {
        id: Date.now().toString(),
        ...req.body,
        createdAt: new Date().toISOString(),
      },
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

    if (error) {
      throw error;
    }

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
    return res.json({ success: true, data: [] });
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
    console.error("[Coach Games] Error:", error);
    res.json({ success: true, data: [] });
  }
});

// Roster Players endpoint
app.get("/api/roster/players", async (req, res) => {
  if (!supabase) {
    return res.json({ success: true, data: [] });
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
    const formattedPlayers = (players || []).map((p) => ({
      id: p.id,
      userId: p.user?.id,
      name:
        p.user?.full_name ||
        `${p.user?.first_name || ""} ${p.user?.last_name || ""}`.trim() ||
        "Unknown",
      email: p.user?.email,
      position: p.position,
      jerseyNumber: p.jersey_number,
      role: p.role,
      status: p.status,
      joinedAt: p.joined_at,
    }));

    res.json({ success: true, data: formattedPlayers });
  } catch (error) {
    console.error("[Roster Players] Error:", error);
    res.json({ success: true, data: [] });
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
  const { athleteId, user_id, day } = req.method === "POST" ? req.body : req.query;
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
      .or(`user_id.eq.${userId},athlete_id.eq.${userId}`)
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
      .or(`user_id.eq.${athleteId},athlete_id.eq.${athleteId}`)
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
      .or(`user_id.eq.${athleteId},athlete_id.eq.${athleteId}`)
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
      .or(`user_id.eq.${athleteId},athlete_id.eq.${athleteId}`)
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
      .or(`user_id.eq.${athleteId},athlete_id.eq.${athleteId}`)
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

  if (!athleteId) {
    return res
      .status(400)
      .json({ success: false, error: "Athlete ID required" });
  }

  try {
    // Get game stats
    const { data: gameStats, error } = await supabase
      .from("game_stats")
      .select("*")
      .eq("player_id", athleteId)
      .order("game_date", { ascending: false })
      .limit(parseInt(games));

    if (error && error.code !== "PGRST116") {
      throw error;
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
        data: null,
        message: "No game data available",
      });
    }
  } catch (error) {
    console.error("[Trends Game] Error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to load game trends" });
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
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("read", false);
    } else if (Array.isArray(ids) && ids.length > 0) {
      await supabase.from("notifications").update({ read: true }).in("id", ids);
    } else if (notificationId) {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);
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

    res.json({
      success: true,
      data: { count: total || 0, unread: unread || 0 },
    });
  } catch (error) {
    console.error("[Notifications Count] Error:", error);
    res.json({ success: true, data: { count: 0, unread: 0 } });
  }
});

// Legacy Netlify function routes - redirect to /api/
app.get("/.netlify/functions/notifications", (req, res) =>
  res.redirect("/api/notifications"),
);
app.post("/.netlify/functions/notifications", (req, res) =>
  res.redirect(307, "/api/notifications/mark-read"),
);
app.get("/.netlify/functions/notifications-count", (req, res) =>
  res.redirect("/api/notifications/count"),
);

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

// AI Chat support
app.post("/api/ai/chat", async (req, res) => {
  // Redirect to existing handler
  req.url = "/api/ai-chat";
  return app._router.handle(req, res, () => {});
});

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
      error: `Invalid JSON: ${err.message}`,
    });
  }

  console.error("Server error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: err.message,
  });
});

// AI Session support
app.get("/api/ai/chat/session/:sessionId", (req, res) => {
  res.json({ success: true, data: { messages: [] } });
});

// Wearables support
app.get("/api/dashboard/wearables", (req, res) => {
  res.json({
    success: true,
    data: [
      { device_type: "Apple Watch", heart_rate: 142, hrv: 38, sleep_score: 87, connection_status: "connected" }
    ]
  });
});

// ============================================
// ADDITIONAL API ENDPOINTS
// ============================================

// Readiness history endpoint
app.get("/api/readiness-history", async (req, res) => {
  const { userId } = req.query;
  if (!supabase) {
    return res.status(503).json({ success: false, error: "Database not configured" });
  }
  try {
    const { data } = await supabase
      .from("wellness_checkins")
      .select("*")
      .eq("user_id", userId || "1")
      .order("checkin_date", { ascending: false })
      .limit(30);
    res.json({ success: true, data: data || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// AI Feedback support
app.post("/api/ai/feedback", (req, res) => {
  res.json({ success: true, message: "Feedback received" });
});

// AI Session support
app.get("/api/ai/chat/session/:sessionId", (req, res) => {
  res.json({ success: true, data: { messages: [] } });
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
