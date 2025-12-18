#!/usr/bin/env node
/**
 * Add Supabase configuration to HTML files that don't have it
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseConfig = `
    <!-- Supabase JS SDK from CDN -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

    <!-- Supabase Configuration -->
    <script>
      // Set Supabase config in window for production
      window._env = {
        SUPABASE_URL: 'https://pvziciccwxgftcielknm.supabase.co',
        SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2emljaWNjd3hnZnRjaWVsa25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MzcwNTgsImV4cCI6MjA3NTExMzA1OH0.1nfJrtWPl6DrAwvjGvM1-CZBeyYgCaV9oDdaadpqhLU'
      };
    </script>
`;

// Pages that need authentication
const pagesToUpdate = [
  'training.html',
  'analytics.html',
  'wellness.html',
  'profile.html',
  'settings.html',
  'roster.html',
  'tournaments.html',
  'training-schedule.html',
  'qb-training-schedule.html',
  'community.html',
  'chat.html',
  'coach.html',
  'coach-dashboard.html',
  'game-tracker.html',
  'performance-tracking.html',
  'exercise-library.html',
  'workout.html',
  'qb-assessment-tools.html',
  'qb-throwing-tracker.html',
  'update-roster-data.html'
];

let updated = 0;
let skipped = 0;

pagesToUpdate.forEach(filename => {
  const filePath = path.join(__dirname, filename);

  if (!fs.existsSync(filePath)) {
    // eslint-disable-next-line no-console
    console.log(`⚠️  Skipped: ${filename} (file not found)`);
    skipped++;
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Check if already has Supabase config
  if (content.includes('window._env') && content.includes('SUPABASE_URL')) {
    // eslint-disable-next-line no-console
    console.log(`✅ Skipped: ${filename} (already has config)`);
    skipped++;
    return;
  }

  // Find a good insertion point - after <head> tag or before first <script>
  if (content.includes('</head>')) {
    // Insert before </head>
    content = content.replace('</head>', supabaseConfig + '\n  </head>');
  } else if (content.includes('<script')) {
    // Insert before first script tag
    content = content.replace(/<script/, supabaseConfig + '\n    <script');
  } else {
    // eslint-disable-next-line no-console
    console.log(`⚠️  Skipped: ${filename} (no insertion point found)`);
    skipped++;
    return;
  }

  // Write back to file
  fs.writeFileSync(filePath, content);
  // eslint-disable-next-line no-console
  console.log(`✅ Updated: ${filename}`);
  updated++;
});

// eslint-disable-next-line no-console
console.log(`\n📊 Summary:`);
// eslint-disable-next-line no-console
console.log(`   Updated: ${updated} files`);
// eslint-disable-next-line no-console
console.log(`   Skipped: ${skipped} files`);
