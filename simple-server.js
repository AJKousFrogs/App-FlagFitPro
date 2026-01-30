// Enhanced static file server for development
// Lightweight alternative to full Express server with modern features

import http from "http";
import fs from "fs/promises";
import { createReadStream, constants } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createGzip, createDeflate } from "zlib";
import { pipeline } from "stream/promises";
import { Readable } from "stream";

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PORT = process.env.VITE_DEV_PORT || 4000;
const API_PORT = process.env.API_PORT || 3001;
const ENABLE_COMPRESSION = process.env.ENABLE_COMPRESSION !== "false";
const ENABLE_CACHE = process.env.ENABLE_CACHE === "true";
const LOG_REQUESTS = process.env.LOG_REQUESTS !== "false";

// Get Supabase credentials from environment
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// Script to inject Supabase credentials
const envScript = `
<script>
// Inject Supabase credentials for frontend
window._env = window._env || {};
window._env.SUPABASE_URL = '${supabaseUrl || ""}';
window._env.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZmptbmpwenZrbm1zeHJ3ZXN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MDI4OTksImV4cCI6MjA4NTA3ODg5OX0.63Do5rUEHBT7-pZEXzFFHB5LqFRaXWAt-YrH2v45vo0 || ""}';

// Also set in localStorage for development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  if ('${supabaseUrl}') localStorage.setItem('SUPABASE_URL', '${supabaseUrl}');
  if ('${supabaseAnonKey}') localStorage.setItem('SUPABASE_ANON_KEY', '${supabaseAnonKey}');
  ${supabaseUrl ? "console.log('✅ Supabase credentials loaded');" : "console.warn('⚠️ Supabase credentials not found - set SUPABASE_URL and SUPABASE_ANON_KEY');"}
}
</script>
`;

// Extended MIME type mapping
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
  ".otf": "font/otf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".pdf": "application/pdf",
  ".zip": "application/zip",
  ".map": "application/json",
};

// Security headers
const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
};

// Cache control headers
const cacheControl = {
  static: "public, max-age=31536000, immutable", // 1 year for static assets
  html: "no-cache, no-store, must-revalidate", // No cache for HTML
  api: "no-cache, no-store, must-revalidate",
};

// Request logging utility
const logRequest = (req, statusCode, size) => {
  if (!LOG_REQUESTS) {
    return;
  }
  const timestamp = new Date().toISOString();
  const method = req.method.padEnd(7);
  const status = statusCode.toString().padStart(3);
  const sizeStr = size ? ` (${formatBytes(size)})` : "";
  console.log(`[${timestamp}] ${method} ${status} ${req.url}${sizeStr}`);
};

// Format bytes utility
const formatBytes = (bytes) => {
  if (bytes === 0) {
    return "0 B";
  }
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
};

// Check if client accepts compression
const acceptsCompression = (req) => {
  const acceptEncoding = req.headers["accept-encoding"] || "";
  return {
    gzip: acceptEncoding.includes("gzip"),
    deflate: acceptEncoding.includes("deflate"),
  };
};

// Get compression stream and encoding type
const getCompressionStream = (req) => {
  const compression = acceptsCompression(req);
  if (compression.gzip) {
    return { stream: createGzip(), encoding: "gzip" };
  }
  if (compression.deflate) {
    return { stream: createDeflate(), encoding: "deflate" };
  }
  return null;
};

// Sanitize file path to prevent directory traversal
const sanitizePath = (requestPath, baseDir) => {
  const resolvedPath = path.resolve(baseDir, requestPath.slice(1));
  const basePath = path.resolve(baseDir);
  if (!resolvedPath.startsWith(basePath)) {
    throw new Error("Invalid path");
  }
  return resolvedPath;
};

// Inject environment script into HTML
const injectEnvScript = (htmlContent) => {
  if (htmlContent.includes("</body>")) {
    return htmlContent.replace("</body>", `${envScript}</body>`);
  }
  if (htmlContent.includes("</head>")) {
    return htmlContent.replace("</head>", `${envScript}</head>`);
  }
  return htmlContent + envScript;
};

// Handle API proxy requests
const handleApiProxy = async (req, res) => {
  const apiUrl = `http://localhost:${API_PORT}${req.url}`;
  logRequest(req, 0, 0);
  console.log(`🔄 Proxying API request: ${req.method} ${apiUrl}`);

  const options = {
    method: req.method,
    headers: { ...req.headers },
    timeout: 10000,
  };

  return new Promise((resolve) => {
    const apiReq = http.request(apiUrl, options, (apiRes) => {
      // Copy headers but filter out problematic ones
      const headers = { ...apiRes.headers };
      delete headers["connection"];
      delete headers["transfer-encoding"];

      res.writeHead(apiRes.statusCode, headers);
      apiRes.pipe(res);
      apiRes.on("end", () => {
        logRequest(req, apiRes.statusCode, 0);
        resolve();
      });
    });

    apiReq.on("error", (err) => {
      console.error(`❌ API proxy error: ${err.message}`);
      res.writeHead(500, {
        "Content-Type": "application/json",
        ...securityHeaders,
      });
      res.end(
        JSON.stringify({
          error: "Backend API unavailable",
          details: err.message,
        }),
      );
      logRequest(req, 500, 0);
      resolve();
    });

    req.pipe(apiReq);
  });
};

// Serve static file with compression support
const serveFile = async (req, res, filePath, ext) => {
  try {
    const stats = await fs.stat(filePath);
    if (!stats.isFile()) {
      throw new Error("Not a file");
    }

    const mimeType = mimeTypes[ext] || "application/octet-stream";
    const headers = {
      "Content-Type": mimeType,
      "Content-Length": stats.size,
      "Last-Modified": stats.mtime.toUTCString(),
      ...securityHeaders,
    };

    // Set cache headers
    if (ENABLE_CACHE) {
      if (ext === ".html") {
        headers["Cache-Control"] = cacheControl.html;
      } else {
        headers["Cache-Control"] = cacheControl.static;
      }
    }

    // Handle compression
    const compression = ENABLE_COMPRESSION ? getCompressionStream(req) : null;
    if (compression) {
      headers["Content-Encoding"] = compression.encoding;
      delete headers["Content-Length"]; // Compression changes size
    }

    res.writeHead(200, headers);

    // Read and serve file
    if (ext === ".html") {
      // For HTML files, read, inject script, and compress if needed
      const data = await fs.readFile(filePath, "utf-8");
      const htmlContent = injectEnvScript(data);
      const buffer = Buffer.from(htmlContent, "utf-8");

      if (compression) {
        // Use pipeline for proper error handling
        const bufferStream = Readable.from(buffer);
        await pipeline(bufferStream, compression.stream, res);
      } else {
        res.end(buffer);
      }
      logRequest(req, 200, buffer.length);
    } else {
      // For other files, stream directly
      const fileStream = createReadStream(filePath);
      if (compression) {
        await pipeline(fileStream, compression.stream, res);
      } else {
        await pipeline(fileStream, res);
      }
      logRequest(req, 200, stats.size);
    }
  } catch (error) {
    console.error(`❌ Error serving file: ${error.message}`);
    res.writeHead(500, {
      "Content-Type": "text/plain",
      ...securityHeaders,
    });
    res.end("500 - Internal Server Error");
    logRequest(req, 500, 0);
  }
};

// Serve index.html for SPA routing
const serveIndex = async (req, res) => {
  try {
    const indexPath = path.join(__dirname, "index.html");
    const data = await fs.readFile(indexPath, "utf-8");
    const htmlContent = injectEnvScript(data);
    const buffer = Buffer.from(htmlContent, "utf-8");

    const headers = {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Length": buffer.length,
      ...securityHeaders,
    };

    if (ENABLE_CACHE) {
      headers["Cache-Control"] = cacheControl.html;
    }

    res.writeHead(200, headers);
    res.end(buffer);
    logRequest(req, 200, buffer.length);
  } catch (error) {
    console.error(`❌ Error serving index: ${error.message}`);
    res.writeHead(404, {
      "Content-Type": "text/plain",
      ...securityHeaders,
    });
    res.end("404 - File not found");
    logRequest(req, 404, 0);
  }
};

// Main request handler
const handleRequest = async (req, res) => {
  try {
    // Parse URL
    const parsedUrl = new URL(
      req.url,
      `http://${req.headers.host || "localhost"}`,
    );
    let { pathname } = parsedUrl;

    // Set CORS headers for all requests
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS, PATCH",
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With",
    );
    res.setHeader("Access-Control-Max-Age", "86400"); // 24 hours

    // Handle OPTIONS request (CORS preflight)
    if (req.method === "OPTIONS") {
      res.writeHead(200, securityHeaders);
      res.end();
      logRequest(req, 200, 0);
      return;
    }

    // Only handle GET requests for static files
    if (req.method !== "GET" && !pathname.startsWith("/api/")) {
      res.writeHead(405, {
        "Content-Type": "text/plain",
        ...securityHeaders,
      });
      res.end("405 - Method Not Allowed");
      logRequest(req, 405, 0);
      return;
    }

    // Proxy API requests to backend server
    if (pathname.startsWith("/api/")) {
      await handleApiProxy(req, res);
      return;
    }

    // Default to index.html for root
    if (pathname === "/") {
      pathname = "/index.html";
    }

    // Sanitize and build file path
    let filePath;
    try {
      filePath = sanitizePath(pathname, __dirname);
    } catch (_error) {
      res.writeHead(403, {
        "Content-Type": "text/plain",
        ...securityHeaders,
      });
      res.end("403 - Forbidden");
      logRequest(req, 403, 0);
      return;
    }

    // Get file extension
    const ext = path.extname(filePath).toLowerCase();

    // Check if file exists
    try {
      await fs.access(filePath, constants.F_OK);
      // File exists - serve it
      await serveFile(req, res, filePath, ext);
    } catch (_error) {
      // File not found
      // For JS/CSS/MJS files, return proper 404 (don't serve index.html)
      if (ext === ".js" || ext === ".css" || ext === ".mjs" || ext === ".map") {
        res.writeHead(404, {
          "Content-Type": "text/plain",
          ...securityHeaders,
        });
        res.end(`404 - File not found: ${pathname}`);
        logRequest(req, 404, 0);
        return;
      }
      // For other files (HTML routes), serve index.html for SPA routing
      await serveIndex(req, res);
    }
  } catch (error) {
    console.error(`❌ Unexpected error: ${error.message}`);
    res.writeHead(500, {
      "Content-Type": "text/plain",
      ...securityHeaders,
    });
    res.end("500 - Internal Server Error");
    logRequest(req, 500, 0);
  }
};

const server = http.createServer(handleRequest);

// Start server
server.listen(PORT, "0.0.0.0", () => {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🏈 Flag Football App - Enhanced Server`);
  console.log("=".repeat(60));
  console.log(`🌐 Server running on http://localhost:${PORT}`);
  console.log(`📁 Serving static files from: ${__dirname}`);
  console.log(`🎯 Open: http://localhost:${PORT}/index.html`);
  console.log(`🔗 Also accessible via: http://127.0.0.1:${PORT}/index.html`);
  console.log(`\n⚙️  Configuration:`);
  console.log(
    `   - Compression: ${ENABLE_COMPRESSION ? "✅ Enabled" : "❌ Disabled"}`,
  );
  console.log(`   - Caching: ${ENABLE_CACHE ? "✅ Enabled" : "❌ Disabled"}`);
  console.log(
    `   - Request Logging: ${LOG_REQUESTS ? "✅ Enabled" : "❌ Disabled"}`,
  );
  console.log(`   - API Proxy Port: ${API_PORT}`);
  if (supabaseUrl && supabaseAnonKey) {
    console.log(`\n✅ Supabase credentials loaded`);
  } else {
    console.log(`\n⚠️  Supabase credentials not found`);
    console.log(
      `   Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables`,
    );
  }
  console.log(`${"=".repeat(60)}\n`);
});

// Enhanced error handling
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `\n❌ Port ${PORT} is already in use. Try a different port or kill the existing process.`,
    );
    console.error(`💡 Run: lsof -ti:${PORT} | xargs kill -9`);
    console.error(
      `💡 Or set VITE_DEV_PORT environment variable to use a different port\n`,
    );
  } else {
    console.error(`\n❌ Server error:`, err.message);
    console.error(err.stack);
  }
  process.exit(1);
});

// Graceful shutdown handler
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
  server.close(() => {
    console.log("✅ Server stopped");
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error("⚠️  Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// Handle uncaught errors
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  gracefulShutdown("unhandledRejection");
});

export default server;
