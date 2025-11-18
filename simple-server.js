// Simple static file server for development
// Lightweight alternative to full Express server

import http from "http";
import fs from "fs";
import path from "path";
import url from "url";
import { fileURLToPath } from "url";

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.VITE_DEV_PORT || 4000;

// MIME type mapping
const mimeTypes = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const server = http.createServer((req, res) => {
  // Parse URL
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;

  // Set CORS headers for all requests
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle OPTIONS request (CORS preflight)
  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // Proxy API requests to backend server
  if (pathname.startsWith("/api/")) {
    const apiUrl = `http://localhost:3001${req.url}`;
    console.log(`🔄 Proxying API request: ${req.method} ${apiUrl}`);

    const options = {
      method: req.method,
      headers: req.headers,
      timeout: 10000,
    };

    const apiReq = http.request(apiUrl, options, (apiRes) => {
      res.writeHead(apiRes.statusCode, apiRes.headers);
      apiRes.pipe(res);
    });

    apiReq.on("error", (err) => {
      console.error(`❌ API proxy error: ${err.message}`);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "Backend API unavailable",
          details: err.message,
        }),
      );
    });

    req.pipe(apiReq);
    return;
  }

  // Default to index.html for root
  if (pathname === "/") {
    pathname = "/index.html";
  }

  // Build file path
  const filePath = path.join(__dirname, pathname);

  // Get file extension
  const ext = path.extname(filePath).toLowerCase();

  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // File not found
      // For JS/CSS files, return proper 404 (don't serve index.html)
      if (ext === ".js" || ext === ".css" || ext === ".mjs") {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end(`404 - File not found: ${pathname}`);
        return;
      }
      // For other files (HTML routes), serve index.html for SPA routing
      const indexPath = path.join(__dirname, "index.html");
      fs.readFile(indexPath, (err, data) => {
        if (err) {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("404 - File not found");
        } else {
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(data);
        }
      });
    } else {
      // File exists - serve it
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end("500 - Internal Server Error");
        } else {
          const mimeType = mimeTypes[ext] || "application/octet-stream";
          res.writeHead(200, { "Content-Type": mimeType });
          res.end(data);
        }
      });
    }
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(
    `🏈 Flag Football App - Simple Server running on http://localhost:${PORT}`,
  );
  console.log(`📁 Serving static files from: ${__dirname}`);
  console.log(`🎯 Open: http://localhost:${PORT}/index.html`);
  console.log(`🔗 Also accessible via: http://127.0.0.1:${PORT}/index.html`);
});

// Enhanced error handling
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `❌ Port ${PORT} is already in use. Try a different port or kill the existing process.`,
    );
    console.error(`💡 Run: lsof -ti:${PORT} | xargs kill -9`);
  } else {
    console.error(`❌ Server error:`, err.message);
  }
  process.exit(1);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down server gracefully...");
  server.close(() => {
    console.log("✅ Server stopped");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Received SIGTERM, shutting down gracefully...");
  server.close(() => {
    console.log("✅ Server stopped");
    process.exit(0);
  });
});

export default server;
