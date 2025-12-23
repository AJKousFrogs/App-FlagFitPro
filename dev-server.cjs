/* eslint-disable no-console */
// Load environment variables from .env.local
require("dotenv").config({ path: ".env.local" });

const express = require("express");
const chokidar = require("chokidar");
const WebSocket = require("ws");
const http = require("http");
const path = require("path");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.VITE_DEV_PORT || 4000;
const API_PORT = process.env.PORT || 3001;

console.log("🔥 Starting Flag Football Training App Hot Reload Server...");

// Serve static files with proper MIME types
app.use(
  express.static(".", {
    setHeaders: (res, filePath) => {
      // Set proper MIME types for module scripts
      if (filePath.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript");
      } else if (filePath.endsWith(".mjs")) {
        res.setHeader("Content-Type", "application/javascript");
      } else if (filePath.endsWith(".css")) {
        res.setHeader("Content-Type", "text/css");
      } else if (filePath.endsWith(".html")) {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
      }
    },
  }),
);

// Serve HTML files
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("*.html", (req, res) => {
  const fileName = req.path.slice(1) || "index.html";
  const filePath = path.join(__dirname, fileName);

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send("Page not found");
  }
});

// Proxy API requests to backend
app.use("/api", (req, res) => {
  const apiUrl = `http://localhost:${API_PORT}${req.url}`;

  const request = require("http").request(
    apiUrl,
    {
      method: req.method,
      headers: req.headers,
    },
    (apiRes) => {
      res.status(apiRes.statusCode);
      apiRes.pipe(res);
    },
  );

  req.pipe(request);
});

// Hot reload WebSocket connection
wss.on("connection", (ws) => {
  console.log("🔗 Hot reload client connected");

  ws.on("close", () => {
    console.log("🔌 Hot reload client disconnected");
  });
});

// File watcher for hot reload
const watcher = chokidar.watch(
  [
    "*.html",
    "*.css",
    "*.js",
    "src/**/*",
    "!node_modules/**",
    "!tests/**",
    "!*.backup",
  ],
  {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
  },
);

watcher.on("change", (filePath) => {
  console.log(`📁 File changed: ${filePath}`);

  // Notify all connected clients to reload
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
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

// Get Supabase credentials from environment
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// Hot reload client script + Supabase config injection
const hotReloadScript = `
<script>
// Inject Supabase credentials for frontend
window._env = window._env || {};
window._env.SUPABASE_URL = '${supabaseUrl || ""}';
window._env.SUPABASE_ANON_KEY = '${supabaseAnonKey || ""}';

// Also set in localStorage for development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  if ('${supabaseUrl}') localStorage.setItem('SUPABASE_URL', '${supabaseUrl}');
  if ('${supabaseAnonKey}') localStorage.setItem('SUPABASE_ANON_KEY', '${supabaseAnonKey}');
}

(function() {
  const ws = new WebSocket('ws://localhost:${PORT}');
  
  ws.onopen = function() {
    console.log('🔥 Hot reload connected');
    ${supabaseUrl ? "console.log('✅ Supabase credentials loaded');" : "console.warn('⚠️ Supabase credentials not found - set SUPABASE_URL and SUPABASE_ANON_KEY');"}
  };
  
  ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    if (data.type === 'reload') {
      console.log('🔄 Hot reloading:', data.file);
      if (data.file.endsWith('.css')) {
        // Reload CSS files without full page refresh
        const links = document.querySelectorAll('link[rel="stylesheet"]');
        links.forEach(link => {
          const href = link.href;
          link.href = href + '?t=' + Date.now();
        });
      } else {
        // Full page reload for HTML/JS changes
        window.location.reload();
      }
    }
  };
  
  ws.onclose = function() {
    console.log('❌ Hot reload disconnected');
  };
  
  ws.onerror = function(error) {
    console.error('🚨 Hot reload error:', error);
  };
})();
</script>
`;

// Inject hot reload script into HTML responses
app.use((req, res, next) => {
  if (req.path.endsWith(".html") || req.path === "/") {
    const originalSend = res.send;
    res.send = function (data) {
      if (typeof data === "string" && data.includes("</body>")) {
        data = data.replace("</body>", hotReloadScript + "</body>");
      }
      originalSend.call(this, data);
    };
  }
  next();
});

server.listen(PORT, () => {
  console.log(`🚀 Hot reload server running on http://localhost:${PORT}`);
  console.log(`🔗 Backend API proxied from http://localhost:${API_PORT}`);
  console.log(`🔥 Hot reload enabled for: HTML, CSS, JS files`);
  console.log(`📱 Access your app: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Shutting down hot reload server...");
  watcher.close();
  server.close();
  process.exit(0);
});
