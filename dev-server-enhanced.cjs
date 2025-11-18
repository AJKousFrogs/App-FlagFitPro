const express = require("express");
const chokidar = require("chokidar");
const WebSocket = require("ws");
const http = require("http");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.VITE_DEV_PORT || 4000;
const API_PORT = process.env.PORT || 3001;

console.log("🔥 Starting Enhanced Dev Server with Hot Reload & Bug Fixing...");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

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

// Bug detection and fixing utilities
const bugFixer = {
  // Run ESLint on a file
  lintFile: (filePath) => {
    return new Promise((resolve) => {
      const eslint = spawn("npx", ["eslint", filePath, "--fix"], {
        stdio: "pipe",
        shell: true,
      });

      let output = "";
      let errors = "";

      eslint.stdout.on("data", (data) => {
        output += data.toString();
      });

      eslint.stderr.on("data", (data) => {
        errors += data.toString();
      });

      eslint.on("close", (code) => {
        if (code === 0) {
          console.log(`✅ ESLint: ${filePath} - No issues`);
        } else if (output || errors) {
          console.log(`🔧 ESLint auto-fixed: ${filePath}`);
          if (errors) {
            console.log(`   ⚠️  ${errors.trim()}`);
          }
        }
        resolve({ code, output, errors });
      });
    });
  },

  // Detect common bugs in JavaScript files
  detectBugs: (filePath, content) => {
    const bugs = [];
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // Detect console.log in production code (warning)
      if (line.includes("console.log") && !line.includes("//")) {
        bugs.push({
          file: filePath,
          line: lineNum,
          type: "warning",
          message: "console.log found - consider removing for production",
          code: line.trim(),
        });
      }

      // Detect undefined variables
      if (line.match(/\b(undefined|null)\s*[!=]==/) && !line.includes("//")) {
        bugs.push({
          file: filePath,
          line: lineNum,
          type: "warning",
          message: "Potential undefined/null check",
          code: line.trim(),
        });
      }

      // Detect missing semicolons (basic check)
      if (
        line.trim() &&
        !line.trim().endsWith(";") &&
        !line.trim().endsWith("{") &&
        !line.trim().endsWith("}") &&
        !line.trim().startsWith("//") &&
        !line.trim().startsWith("*") &&
        !line.trim().startsWith("if") &&
        !line.trim().startsWith("for") &&
        !line.trim().startsWith("while") &&
        !line.trim().startsWith("function") &&
        !line.trim().startsWith("const") &&
        !line.trim().startsWith("let") &&
        !line.trim().startsWith("var") &&
        !line.trim().startsWith("export") &&
        !line.trim().startsWith("import") &&
        !line.trim().startsWith("return") &&
        line.includes("=") &&
        !line.includes("=>")
      ) {
        // Skip this check - too many false positives
      }

      // Detect potential memory leaks (setInterval without clearInterval)
      if (line.includes("setInterval") && !line.includes("clearInterval")) {
        bugs.push({
          file: filePath,
          line: lineNum,
          type: "warning",
          message: "setInterval detected - ensure clearInterval is called",
          code: line.trim(),
        });
      }
    });

    return bugs;
  },

  // Auto-fix common issues
  autoFix: async (filePath) => {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      let fixed = content;
      let changes = 0;

      // Fix double quotes to single quotes (optional)
      // Fix trailing whitespace
      const lines = fixed.split("\n");
      fixed = lines
        .map((line) => {
          const trimmed = line.replace(/\s+$/, "");
          if (trimmed !== line) changes++;
          return trimmed;
        })
        .join("\n");

      if (changes > 0) {
        fs.writeFileSync(filePath, fixed, "utf8");
        console.log(`🔧 Auto-fixed ${changes} issues in ${filePath}`);
      }

      return changes;
    } catch (error) {
      console.error(`❌ Error auto-fixing ${filePath}:`, error.message);
      return 0;
    }
  },
};

// File watcher for hot reload and bug detection
const watcher = chokidar.watch(
  [
    "*.html",
    "*.css",
    "*.js",
    "src/**/*",
    "!node_modules/**",
    "!tests/**",
    "!*.backup",
    "!dev-server*.cjs",
    "!server.js",
  ],
  {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: false,
  },
);

watcher.on("change", async (filePath) => {
  console.log(`\n📁 File changed: ${filePath}`);

  // Run bug detection and fixing
  if (filePath.endsWith(".js")) {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      const bugs = bugFixer.detectBugs(filePath, content);

      if (bugs.length > 0) {
        console.log(`\n🐛 Bugs detected in ${filePath}:`);
        bugs.forEach((bug) => {
          console.log(
            `   ${bug.type === "error" ? "❌" : "⚠️ "} Line ${bug.line}: ${bug.message}`,
          );
          console.log(`   Code: ${bug.code}`);
        });
      }

      // Auto-fix common issues
      await bugFixer.autoFix(filePath);

      // Run ESLint auto-fix
      await bugFixer.lintFile(filePath);
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  }

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

watcher.on("add", (filePath) => {
  console.log(`➕ File added: ${filePath}`);
});

watcher.on("unlink", (filePath) => {
  console.log(`🗑️  File removed: ${filePath}`);
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
          link.href = href.split('?')[0] + '?t=' + Date.now();
        });
      } else {
        // Full page reload for HTML/JS changes
        window.location.reload();
      }
    }
  };
  
  ws.onclose = function() {
    console.log('❌ Hot reload disconnected - reconnecting...');
    setTimeout(() => {
      location.reload();
    }, 1000);
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

// Health check endpoint
app.get("/dev/health", (req, res) => {
  res.json({
    status: "OK",
    hotReload: "enabled",
    bugFixing: "enabled",
    timestamp: new Date().toISOString(),
  });
});

server.listen(PORT, () => {
  console.log(`\n🚀 Enhanced Dev Server running on http://localhost:${PORT}`);
  console.log(`🔗 Backend API proxied from http://localhost:${API_PORT}`);
  console.log(`🔥 Hot reload enabled for: HTML, CSS, JS files`);
  console.log(`🐛 Bug detection & auto-fixing enabled`);
  console.log(`📱 Access your app: http://localhost:${PORT}`);
  console.log(
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`,
  );
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("\n🛑 Shutting down enhanced dev server...");
  watcher.close();
  server.close();
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down enhanced dev server...");
  watcher.close();
  server.close();
  process.exit(0);
});
