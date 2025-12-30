/**
 * Development server for Flag Football Training App
 * Serves static files with proper MIME types and provides mock API endpoints
 */

import chokidar from "chokidar";
import cors from "cors";
import express from "express";
import { rateLimit } from "express-rate-limit";
import fs from "fs";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer } from "ws";

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
  { ignored: /(^|[\/\\])\../, persistent: true }
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

// Enable CORS
app.use(cors());

// Parse JSON and URL-encoded bodies
app.use(express.json({ limit: "10mb" }));
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

// Dashboard endpoints
app.get("/api/dashboard/overview", (_req, res) => {
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

// Training endpoints
app.get("/api/training/stats", (_req, res) => {
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

// Analytics endpoints
app.get("/api/analytics/summary", (_req, res) => {
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
app.get("/api/tournaments", (_req, res) => {
  res.json({
    success: true,
    data: [],
  });
});

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

// Community endpoints
app.get("/api/community/feed", (_req, res) => {
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
app.get("/api/coach/dashboard", (_req, res) => {
  res.json({
    success: true,
    data: {
      teamMembers: [],
      stats: {},
    },
  });
});

// ============================================
// NETLIFY FUNCTIONS MOCK ENDPOINTS
// ============================================

// Notifications endpoint
app.get("/.netlify/functions/notifications", (_req, res) => {
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
  const { notificationId, ids } = req.body || {};

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

app.patch("/.netlify/functions/notifications/last-opened", (_req, res) => {
  res.json({
    success: true,
    data: null,
    message: "Last opened timestamp updated",
  });
});

app.get("/.netlify/functions/notifications-count", (_req, res) => {
  res.json({
    success: true,
    data: {
      count: 3,
      unread: 3,
    },
  });
});

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

app.get("/.netlify/functions/notifications-preferences", (_req, res) => {
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
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('</body>')) {
    return content.replace('</body>', hotReloadScript + '</body>');
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
