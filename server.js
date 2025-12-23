/* eslint-disable no-console */
// Simple development server for Flag Football Training App
// Serves static files with proper MIME types

import express from "express";
import path from "path";
import cors from "cors";
import fs from "fs";
import { rateLimit } from "express-rate-limit";
import { fileURLToPath } from "url";

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs for tests
  message: {
    success: false,
    error: "Too many attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Apply rate limiter to auth routes
app.use("/api/auth/", authLimiter);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  }),
);

// Serve Angular build files
app.use(
  express.static("angular/dist/flagfit-pro/browser", {
    setHeaders: (res, path) => {
      // Set proper MIME types
      if (path.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript");
      } else if (path.endsWith(".css")) {
        res.setHeader("Content-Type", "text/css");
      } else if (path.endsWith(".html")) {
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
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Flag Football Training App Server is running",
    timestamp: new Date().toISOString(),
  });
});

// API Routes - Mock endpoints for development
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

app.get("/api/auth/me", (req, res) => {
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

app.post("/api/auth/logout", (req, res) => {
  res.json({ success: true, message: "Logged out successfully" });
});

// Dashboard endpoints
app.get("/dashboard", (req, res) => {
  res.json({
    success: true,
    data: {
      stats: {
        trainingSessions: 24,
        performanceScore: 85,
        dayStreak: 7,
        tournaments: 3,
      },
      upcomingSessions: [],
      recentActivity: [],
    },
  });
});

app.get("/api/dashboard/overview", (req, res) => {
  res.json({
    success: true,
    data: {
      stats: {
        trainingSessions: 24,
        performanceScore: 85,
        dayStreak: 7,
        tournaments: 3,
      },
      activities: [],
      upcomingSessions: [],
      performanceTrends: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        data: [65, 72, 80, 85, 90, 88],
      },
      trainingDistribution: {
        labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
        data: [12, 15, 18, 16],
      },
    },
  });
});

// Dashboard endpoint - API only (Angular handles the page)
app.get("/dashboard", (req, res, next) => {
  // Check if it's an API request (has Accept header for JSON)
  const acceptHeader = req.headers.accept || "";
  if (acceptHeader.includes("application/json")) {
    res.json({
      success: true,
      data: {
        stats: {
          trainingSessions: 24,
          performanceScore: 85,
          dayStreak: 7,
          tournaments: 3,
        },
        activities: [],
        upcomingSessions: [],
      },
    });
  } else {
    // Let Angular handle the route (fall through to catch-all)
    next();
  }
});

// Training endpoints
app.get("/training-stats", (req, res) => {
  res.json({
    success: true,
    data: {
      weeklyStats: [],
      achievements: [],
    },
  });
});

app.get("/api/training/stats", (req, res) => {
  res.json({
    success: true,
    data: {
      sessions: [],
      totalHours: 0,
    },
  });
});

app.post("/api/training/session", (req, res) => {
  res.status(201).json({
    success: true,
    data: {
      session: {
        id: "mock-session-id",
        ...req.body,
      },
    },
  });
});

// Analytics endpoints
app.get("/api/analytics/summary", (req, res) => {
  res.json({
    success: true,
    data: {
      performanceTrends: [],
      teamChemistry: [],
      trainingDistribution: [],
    },
  });
});

app.get("/api/dashboard/analytics", (req, res) => {
  res.json({
    success: true,
    data: {
      analytics: {},
    },
  });
});

// Olympic endpoints
app.get("/api/olympic/qualification-status", (req, res) => {
  res.json({
    success: true,
    data: {
      qualification: {
        status: "on_track",
        score: 75,
      },
    },
  });
});

app.post("/api/olympic/performance-update", (req, res) => {
  res.status(201).json({
    success: true,
    data: {
      qualificationImpact: 5.5,
    },
  });
});

// AI endpoints
app.post("/api/ai/predict-performance", (req, res) => {
  res.json({
    success: true,
    data: {
      predictions: [],
      confidenceScore: 0.85,
    },
  });
});

app.get("/api/ai/model-performance", (req, res) => {
  res.json({
    success: true,
    data: {
      accuracy: 0.89,
    },
  });
});

// System endpoints
app.get("/api/system/performance-metrics", (req, res) => {
  res.json({
    success: true,
    data: {
      memoryOptimization: {
        reductionPercentage: 95,
      },
    },
  });
});

// Tournaments endpoints
app.get("/api/tournaments", (req, res) => {
  res.json({
    success: true,
    data: [],
  });
});

// Community endpoints
app.get("/api/community/feed", (req, res) => {
  res.json({
    success: true,
    data: [],
  });
});

app.post("/api/community/posts", (req, res) => {
  res.json({
    success: true,
    data: {
      id: Date.now().toString(),
      ...req.body,
      createdAt: new Date().toISOString(),
    },
  });
});

// Wellness endpoints
app.post("/api/wellness/checkin", (req, res) => {
  res.json({
    success: true,
    data: {
      id: Date.now().toString(),
      ...req.body,
      createdAt: new Date().toISOString(),
    },
  });
});

// Coach endpoints
app.get("/api/coach/dashboard", (req, res) => {
  res.json({
    success: true,
    data: {
      teamMembers: [],
      stats: {},
    },
  });
});

// Game tracker endpoints
app.post("/api/tournaments/createGame", (req, res) => {
  res.json({
    success: true,
    data: {
      id: Date.now().toString(),
      ...req.body,
      createdAt: new Date().toISOString(),
    },
  });
});

// Training workouts endpoint
app.get("/api/training/workouts/:id", (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.params.id,
      exercises: [],
    },
  });
});

app.put("/api/training/workouts/:id", (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.params.id,
      ...req.body,
    },
  });
});

// Netlify Functions endpoints for local development
// These simulate Netlify Functions behavior

// Notifications endpoint
app.get("/.netlify/functions/notifications", (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        type: "training",
        title: "Training Session Reminder",
        message: "Speed & Agility training starts in 30 minutes",
        time: "5 minutes ago",
        read: false,
        createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      },
      {
        id: 2,
        type: "achievement",
        title: "New Achievement Unlocked",
        message: "You've completed 10 training sessions this month!",
        time: "1 hour ago",
        read: false,
        createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      },
      {
        id: 3,
        type: "team",
        title: "Team Update",
        message: "New team member joined: Alex Johnson",
        time: "2 hours ago",
        read: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
    ],
  });
});

app.post("/.netlify/functions/notifications", (req, res) => {
  const body = req.body || {};
  const { notificationId, ids } = body;

  if (notificationId === "all") {
    res.json({
      success: true,
      data: null,
      message: "All notifications marked as read",
    });
  } else if (Array.isArray(ids) && ids.length > 0) {
    res.json({
      success: true,
      data: null,
      message: `${ids.length} notifications marked as read`,
    });
  } else if (notificationId) {
    res.json({
      success: true,
      data: null,
      message: "Notification marked as read",
    });
  } else {
    res.status(400).json({
      success: false,
      error: "notificationId or ids array is required",
    });
  }
});

// Handle PATCH /notifications/last-opened before the general PATCH route
app.patch("/.netlify/functions/notifications/last-opened", (req, res) => {
  res.json({
    success: true,
    data: null,
    message: "Last opened timestamp updated",
  });
});

// Notifications count endpoint
app.get("/.netlify/functions/notifications-count", (req, res) => {
  res.json({
    success: true,
    data: {
      count: 3,
      unread: 3,
    },
  });
});

// Notifications create endpoint
app.post("/.netlify/functions/notifications-create", (req, res) => {
  res.json({
    success: true,
    data: {
      id: Date.now().toString(),
      ...req.body,
      createdAt: new Date().toISOString(),
    },
  });
});

// Notifications preferences endpoint
app.get("/.netlify/functions/notifications-preferences", (req, res) => {
  res.json({
    success: true,
    data: {
      email: true,
      push: true,
      sms: false,
    },
  });
});

app.post("/.netlify/functions/notifications-preferences", (req, res) => {
  res.json({
    success: true,
    data: req.body.preferences || {},
    message: "Notification preferences updated",
  });
});

// Catch-all route for Angular SPA routing
app.get("*", (req, res) => {
  // Serve Angular app's index.html for all routes
  const angularIndexPath = path.join(__dirname, "angular/dist/flagfit-pro/browser/index.html");
  
  // Check if Angular build exists, otherwise serve root index.html
  if (fs.existsSync(angularIndexPath)) {
    res.sendFile(angularIndexPath);
  } else {
    // Fallback to root index.html (redirect page)
    res.sendFile(path.join(__dirname, "index.html"));
  }
});

// Error handling middleware
app.use((err, req, res, _next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      error: "Invalid JSON: " + err.message,
    });
  }

  console.error("Server error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(
    `🏈 Flag Football Training App Server running on http://localhost:${PORT}`,
  );
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🎯 Main app: http://localhost:${PORT}/index.html`);
});

export default app;
