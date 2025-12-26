#!/usr/bin/env node
/**
 * Inject environment variables into HTML files
 * Adds env.js script tag and/or inline script with Supabase config
 */

import fs, { readdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

// Get Supabase credentials from environment
const supabaseUrl =
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseAnonKey =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️  Warning: Supabase credentials not found in environment variables",
  );
  console.warn(
    "   Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set",
  );
}

// Create inline script with environment variables
const inlineEnvScript = `
    <!-- Supabase Environment Variables (injected at build time) -->
    <script>
      window._env = window._env || {};
      window._env.SUPABASE_URL = '${supabaseUrl}';
      window._env.SUPABASE_ANON_KEY = '${supabaseAnonKey}';
    </script>`;

// Find all HTML files
const htmlFiles = readdirSync(rootDir).filter(
  (file) => file.endsWith(".html") && !file.startsWith("."),
);

let updated = 0;
let skipped = 0;

htmlFiles.forEach((filename) => {
  const filePath = path.join(rootDir, filename);
  let content = fs.readFileSync(filePath, "utf8");

  // Check if already has the inline env script
  if (
    content.includes("window._env.SUPABASE_URL") &&
    content.includes("<!-- Supabase Environment Variables")
  ) {
    console.log(`⏭️  Skipped: ${filename} (already has env injection)`);
    skipped++;
    return;
  }

  // Find the insertion point - before supabase-config.js or before first script tag
  let inserted = false;

  // Try to insert before supabase-config.js
  if (content.includes("supabase-config.js")) {
    content = content.replace(
      /(<script[^>]*src=["'][^"']*supabase-config\.js["'][^>]*>)/i,
      `${inlineEnvScript}\n    $1`,
    );
    inserted = true;
  } else if (content.includes("<!-- Supabase Configuration")) {
    // Try to insert before Supabase Configuration comment
    content = content.replace(
      /(<!-- Supabase Configuration[^>]*>)/i,
      `${inlineEnvScript}\n    $1`,
    );
    inserted = true;
  } else if (content.includes("<head>")) {
    // Try to insert before first script tag in head
    const headMatch = content.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    if (headMatch && headMatch[1].includes("<script")) {
      content = content.replace(
        /(<head[^>]*>)([\s\S]*?)(<script)/i,
        `$1$2${inlineEnvScript}\n    $3`,
      );
      inserted = true;
    } else {
      // Insert before </head>
      content = content.replace("</head>", `${inlineEnvScript}\n  </head>`);
      inserted = true;
    }
  }

  if (inserted) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated: ${filename}`);
    updated++;
  } else {
    console.warn(`⚠️  Could not find insertion point in: ${filename}`);
    skipped++;
  }
});

console.log(`\n📊 Summary:`);
console.log(`   Updated: ${updated} files`);
console.log(`   Skipped: ${skipped} files`);
console.log(
  `   Credentials: ${supabaseUrl ? "✓ URL set" : "✗ URL missing"}, ${supabaseAnonKey ? "✓ Key set" : "✗ Key missing"}`,
);
