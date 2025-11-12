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

// Serve static files
app.use(express.static("."));

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

// Hot reload client script
const hotReloadScript = `
<script>
(function() {
  const ws = new WebSocket('ws://localhost:${PORT}');
  
  ws.onopen = function() {
    console.log('🔥 Hot reload connected');
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
