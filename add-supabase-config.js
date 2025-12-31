#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Add Supabase configuration to HTML files that don't have it
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get Supabase credentials from environment variables
// SECURITY: Never hardcode credentials - use environment variables
const supabaseUrl =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Error: Missing Supabase credentials");
  console.error(
    "Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables",
  );
  console.error(
    "Example: SUPABASE_URL=https://your-project.supabase.co SUPABASE_ANON_KEY=your_key node add-supabase-config.js",
  );
  process.exit(1);
}

const supabaseConfig = `
    <!-- Supabase JS SDK from CDN -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.88.0"></script>

    <!-- Supabase Configuration -->
    <script>
      // Set Supabase config in window (from environment variables)
      window._env = window._env || {};
      window._env.SUPABASE_URL = '${supabaseUrl}';
      window._env.SUPABASE_ANON_KEY = '${supabaseAnonKey}';
    </script>
`;

// Pages that need authentication
const pagesToUpdate = [
  "training.html",
  "analytics.html",
  "wellness.html",
  "profile.html",
  "settings.html",
  "roster.html",
  "tournaments.html",
  "training-schedule.html",
  "qb-training-schedule.html",
  "community.html",
  "chat.html",
  "coach.html",
  "coach-dashboard.html",
  "game-tracker.html",
  "performance-tracking.html",
  "exercise-library.html",
  "workout.html",
  "qb-assessment-tools.html",
  "qb-throwing-tracker.html",
  "update-roster-data.html",
];

let updated = 0;
let skipped = 0;

pagesToUpdate.forEach((filename) => {
  const filePath = path.join(__dirname, filename);

  if (!fs.existsSync(filePath)) {
     
    console.log(`⚠️  Skipped: ${filename} (file not found)`);
    skipped++;
    return;
  }

  let content = fs.readFileSync(filePath, "utf8");

  // Check if already has Supabase config
  if (content.includes("window._env") && content.includes("SUPABASE_URL")) {
     
    console.log(`✅ Skipped: ${filename} (already has config)`);
    skipped++;
    return;
  }

  // Find a good insertion point - after <head> tag or before first <script>
  if (content.includes("</head>")) {
    // Insert before </head>
    content = content.replace("</head>", `${supabaseConfig  }\n  </head>`);
  } else if (content.includes("<script")) {
    // Insert before first script tag
    content = content.replace(/<script/, `${supabaseConfig  }\n    <script`);
  } else {
     
    console.log(`⚠️  Skipped: ${filename} (no insertion point found)`);
    skipped++;
    return;
  }

  // Write back to file
  fs.writeFileSync(filePath, content);
   
  console.log(`✅ Updated: ${filename}`);
  updated++;
});

 
console.log(`\n📊 Summary:`);
 
console.log(`   Updated: ${updated} files`);
 
console.log(`   Skipped: ${skipped} files`);
