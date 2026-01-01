/* eslint-disable no-console */
// Load environment variables from .env.local
require("dotenv").config({ path: ".env.local" });

const express = require("express");
const chokidar = require("chokidar");
const WebSocket = require("ws");
const http = require("http");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const url = require("url");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.VITE_DEV_PORT || 4000;
const API_PORT = process.env.PORT || 3001;

console.log("🔥 Starting Enhanced Dev Server with Hot Reload & Bug Fixing...");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

// Body parsing for Netlify Functions
app.use(
  "/.netlify/functions/:functionName",
  express.raw({ type: "*/*", limit: "10mb" }),
);

// Handle Netlify Functions
app.all("/.netlify/functions/:functionName", async (req, res) => {
  try {
    // Extract function name from route parameter
    const { functionName } = req.params;

    if (!functionName) {
      console.error(`❌ No function name in request: ${req.path}`);
      res.status(404).json({ error: "Function name not found" });
      return;
    }

    console.log(
      `⚡ Executing Netlify function: ${functionName} (${req.method})`,
    );

    // Find function file (could be .cjs or .js)
    const functionDir = path.join(__dirname, "netlify", "functions");
    let functionPath = path.join(functionDir, `${functionName}.cjs`);

    if (!fs.existsSync(functionPath)) {
      functionPath = path.join(functionDir, `${functionName}.js`);
    }

    if (!fs.existsSync(functionPath)) {
      console.error(`❌ Netlify function not found: ${functionName}`);
      console.error(`   Searched: ${functionPath}`);
      res.status(404).json({ error: `Function '${functionName}' not found` });
      return;
    }

    console.log(`   Found function at: ${functionPath}`);

    // Clear require cache to allow hot reloading
    try {
      const resolvedPath = require.resolve(functionPath);
      delete require.cache[resolvedPath];
    } catch (_e) {
      // Path not in cache yet, that's fine
    }

    // Load the function
    const functionModule = require(functionPath);

    if (!functionModule.handler) {
      res.status(500).json({
        error: `Function '${functionName}' does not export a handler`,
      });
      return;
    }

    // Convert Express request to Netlify event format
    const parsedUrl = url.parse(req.url, true);
    const event = {
      httpMethod: req.method,
      path: req.path,
      pathParameters: null,
      queryStringParameters: parsedUrl.query || {},
      headers: req.headers,
      body: null,
      isBase64Encoded: false,
      requestContext: {
        requestId: `dev-${Date.now()}`,
        identity: {
          sourceIp: req.ip || req.connection.remoteAddress,
        },
        http: {
          method: req.method,
          path: req.path,
          protocol: req.protocol,
          userAgent: req.headers["user-agent"] || "",
        },
      },
    };

    // Read body if present
    if (req.method !== "GET" && req.method !== "HEAD" && req.body) {
      // Body is already parsed as raw buffer by Express middleware
      if (Buffer.isBuffer(req.body)) {
        event.body = req.body.toString("utf8");
      } else if (typeof req.body === "string") {
        event.body = req.body;
      } else {
        event.body = JSON.stringify(req.body);
      }
    }

    // Create Netlify context
    const context = {
      callbackWaitsForEmptyEventLoop: false,
      functionName,
      functionVersion: "$LATEST",
      invokedFunctionArn: `arn:aws:lambda:us-east-1:123456789012:function:${functionName}`,
      memoryLimitInMB: "128",
      awsRequestId: `dev-${Date.now()}`,
      logGroupName: `/aws/lambda/${functionName}`,
      logStreamName: `${new Date().toISOString().split("T")[0]}/[$LATEST]`,
      getRemainingTimeInMillis: () => 30000,
    };

    // Execute the function
    const result = await functionModule.handler(event, context);

    if (!result) {
      console.error(`❌ Function ${functionName} returned undefined`);
      res.status(500).json({ error: "Function returned no response" });
      return;
    }

    // Send response
    if (result.statusCode) {
      res.status(result.statusCode);
    } else {
      res.status(200);
    }

    // Set headers
    if (result.headers) {
      Object.keys(result.headers).forEach((key) => {
        res.setHeader(key, result.headers[key]);
      });
    }

    // Handle base64 encoded body (for images)
    if (result.isBase64Encoded && result.body) {
      const buffer = Buffer.from(result.body, "base64");
      res.send(buffer);
    } else {
      res.send(result.body || "");
    }

    console.log(
      `✅ Function ${functionName} completed with status ${result.statusCode || 200}`,
    );
  } catch (error) {
    console.error(`❌ Error executing Netlify function:`, error);
    res.status(500).json({
      error: "Function execution failed",
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

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
  autoFix: (filePath) => {
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
          if (trimmed !== line) {
            changes++;
          }
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
    ignored: /(^|[/\\])\../, // ignore dotfiles
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
    ${supabaseUrl ? "console.log('✅ Supabase credentials loaded');" : "console.warn('⚠️ Supabase credentials not found');"}
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
        data = data.replace("</body>", `${hotReloadScript}</body>`);
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
  console.log(
    `⚡ Netlify Functions available at http://localhost:${PORT}/.netlify/functions/*`,
  );
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
