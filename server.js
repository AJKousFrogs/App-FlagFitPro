// Simple development server for Flag Football Training App
// Serves static files with proper MIME types

import express from "express";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Serve static files from the root directory
app.use(
  express.static(".", {
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
    },
  });
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

// Catch-all route for SPA routing
app.get("*", (req, res) => {
  // If requesting an HTML file, serve it directly
  if (req.path.endsWith(".html") || req.path === "/") {
    const htmlFile = req.path === "/" ? "index.html" : req.path.substring(1);
    res.sendFile(path.join(__dirname, htmlFile));
  } else {
    // For other routes, serve index.html (SPA behavior)
    res.sendFile(path.join(__dirname, "index.html"));
  }
});

// Error handling middleware
app.use((err, req, res, _next) => {
  console.error("Server error:", err);
  res.status(500).json({
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
