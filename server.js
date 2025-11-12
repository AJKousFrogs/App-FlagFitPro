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
