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
const angularDistPath = path.join(rootDir, "angular/dist/flagfit-pro/browser");
const indexHtmlPath = path.join(angularDistPath, "index.html");

// Get Supabase credentials from environment (Netlify injects these during build)
const supabaseUrl =
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseAnonKey =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

console.log("🔧 Injecting environment variables into Angular build...");
console.log(`   Source: ${indexHtmlPath}`);
console.log(`   SUPABASE_URL: ${supabaseUrl ? "✓ Set" : "✗ Missing"}`);
console.log(`   SUPABASE_ANON_KEY: ${supabaseAnonKey ? "✓ Set" : "✗ Missing"}`);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️  Warning: Supabase credentials not found in environment variables");
  console.warn("   The app will not be able to connect to the database.");
  console.warn("   Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in Netlify.");
}

// Check if the build output exists
if (!fs.existsSync(indexHtmlPath)) {
  console.error(`❌ Error: index.html not found at ${indexHtmlPath}`);
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
    <script>
      window._env = window._env || {};
      window._env.SUPABASE_URL = '${supabaseUrl}';
      window._env.SUPABASE_ANON_KEY = '${supabaseAnonKey}';
      window._env.VITE_SUPABASE_URL = '${supabaseUrl}';
      window._env.VITE_SUPABASE_ANON_KEY = '${supabaseAnonKey}';
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
