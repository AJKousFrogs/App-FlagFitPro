#!/usr/bin/env node
/**
 * Inject environment variables into Angular build output HTML
 * This runs AFTER `ng build` to inject runtime configuration
 *
 * Required for Netlify deployment where env vars are only available at build time
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

// Path to Angular build output
// Angular may output either:
// - angular/dist/flagfit-pro (current static application build)
// - angular/dist/flagfit-pro/browser (older SSR/prerender layouts)
const distCandidates = [
  path.join(rootDir, "angular/dist/flagfit-pro"),
  path.join(rootDir, "angular/dist/flagfit-pro/browser"),
];
const angularDistPath = distCandidates.find((candidate) =>
  fs.existsSync(path.join(candidate, "index.html")),
);
const indexHtmlPath = angularDistPath
  ? path.join(angularDistPath, "index.html")
  : path.join(distCandidates[0], "index.html");

// Get Supabase credentials from environment (Netlify injects these during build)
// Canonical source of truth: SUPABASE_URL + SUPABASE_ANON_KEY
// Legacy fallback: VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
const supabaseUrl =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

// Get Sentry configuration from environment
const sentryDsn = process.env.VITE_SENTRY_DSN || "";
const sentryEnabled = process.env.VITE_ENABLE_SENTRY || "false";

// Generate build timestamp for cache-busting
const buildTimestamp = new Date().toISOString();
const buildId = Date.now().toString(36);
const maskSecret = (value) =>
  value ? `${value.slice(0, 6)}...${value.slice(-4)}` : "✗ Missing";
const escapeJs = (value) =>
  String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'");

console.log("🔧 Injecting environment variables into Angular build...");
console.log(`   Source: ${indexHtmlPath}`);
console.log(`   Build ID: ${buildId}`);
console.log(`   Build Time: ${buildTimestamp}`);
console.log(`   SUPABASE_URL: ${supabaseUrl ? "✓ Set" : "✗ Missing"}`);
console.log(`   SUPABASE_ANON_KEY: ${maskSecret(supabaseAnonKey)}`);
console.log(`   SENTRY_DSN: ${sentryDsn ? "✓ Set" : "✗ Not configured"}`);
console.log(`   SENTRY_ENABLED: ${sentryEnabled}`);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️  Warning: Supabase credentials not found in environment variables",
  );
  console.warn("   The app will not be able to connect to the database.");
  console.warn(
    "   Make sure SUPABASE_URL and SUPABASE_ANON_KEY are set in Netlify.",
  );
}

if (sentryEnabled === "true" && !sentryDsn) {
  console.warn("⚠️  Warning: Sentry is enabled but VITE_SENTRY_DSN is not set");
  console.warn("   Error tracking will not work in production.");
  console.warn(
    "   Set VITE_SENTRY_DSN in Netlify environment variables or disable Sentry.",
  );
}

// Check if the build output exists
if (!fs.existsSync(indexHtmlPath)) {
  console.error(`❌ Error: index.html not found at ${indexHtmlPath}`);
  console.error(
    `   Checked: ${distCandidates.map((candidate) => path.join(candidate, "index.html")).join(", ")}`,
  );
  console.error("   Make sure the Angular build completed successfully.");
  process.exit(1);
}

// Read the current index.html
let content = fs.readFileSync(indexHtmlPath, "utf8");

// Check if already injected
if (content.includes("window._env = window._env || {};")) {
  console.log("⏭️  Skipped: Environment variables already injected");
  process.exit(0);
}

// Create the inline script that will inject environment variables
// This needs to run BEFORE the Angular main.js script
const envScript = `
    <!-- Environment Variables (injected at build time by scripts/inject-env-into-html-angular.js) -->
    <!-- Build: ${buildId} @ ${buildTimestamp} -->
    <script>
      window._env = window._env || {};
      window._env.SUPABASE_URL = '${escapeJs(supabaseUrl)}';
      window._env.SUPABASE_ANON_KEY = '${escapeJs(supabaseAnonKey)}';
      // Legacy mirror keys for backward compatibility only.
      window._env.VITE_SUPABASE_URL = '${escapeJs(supabaseUrl)}';
      window._env.VITE_SUPABASE_ANON_KEY = '${escapeJs(supabaseAnonKey)}';
      window._env.VITE_SENTRY_DSN = '${escapeJs(sentryDsn)}';
      window._env.VITE_ENABLE_SENTRY = '${escapeJs(sentryEnabled)}';
      window._env.BUILD_ID = '${escapeJs(buildId)}';
      window._env.BUILD_TIMESTAMP = '${escapeJs(buildTimestamp)}';
    </script>`;

// Insert the script right before </head>
// This ensures it loads before Angular initializes
if (content.includes("</head>")) {
  content = content.replace("</head>", `${envScript}\n  </head>`);
  fs.writeFileSync(indexHtmlPath, content);
  console.log("✅ Successfully injected environment variables into index.html");
} else {
  console.error("❌ Error: Could not find </head> tag in index.html");
  process.exit(1);
}
