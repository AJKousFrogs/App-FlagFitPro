#!/usr/bin/env node
/**
 * Update .env file with new Supabase credentials
 * This script helps update the local .env file with the new project credentials
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import readline from "readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, "../.env");
const envExamplePath = path.join(__dirname, "../.env.example");

const DEFAULT_SUPABASE_URL = "https://grfjmnjpzvknmsxrwesx.supabase.co";
const PLACEHOLDER_ANON = "your_supabase_anon_key_here";
const PLACEHOLDER_SERVICE = "your_supabase_service_role_key_here";

// Prefer shell-provided values; fall back to safe placeholders.
const NEW_SUPABASE_URL = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
const NEW_SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  PLACEHOLDER_ANON;
const NEW_SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  PLACEHOLDER_SERVICE;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function updateEnvFile() {
  console.log("🔧 Updating .env file with new Supabase credentials\n");

  let envContent = "";

  // Read existing .env file if it exists
  if (fs.existsSync(envPath)) {
    console.log("📄 Found existing .env file");
    envContent = fs.readFileSync(envPath, "utf8");

    // Check if already updated
    if (envContent.includes("grfjmnjpzvknmsxrwesx")) {
      console.log("✅ .env file already contains new Supabase project ID");
      const answer = await question("Do you want to update it anyway? (y/N): ");
      if (answer.toLowerCase() !== "y") {
        console.log("Skipping update.");
        rl.close();
        return;
      }
    }
  } else {
    console.log("📄 No existing .env file found, creating new one");
    // Use .env.example as template if it exists
    if (fs.existsSync(envExamplePath)) {
      envContent = fs.readFileSync(envExamplePath, "utf8");
      console.log("📋 Using .env.example as template");
    }
  }

  // Update or add Supabase configuration
  const lines = envContent.split("\n");
  const updatedLines = [];
  let supabaseUrlFound = false;
  let supabaseAnonKeyFound = false;
  let supabaseServiceKeyFound = false;

  for (const line of lines) {
    if (line.startsWith("SUPABASE_URL=")) {
      updatedLines.push(`SUPABASE_URL=${NEW_SUPABASE_URL}`);
      supabaseUrlFound = true;
    } else if (line.startsWith("SUPABASE_ANON_KEY=")) {
      updatedLines.push(`SUPABASE_ANON_KEY=${NEW_SUPABASE_ANON_KEY}`);
      supabaseAnonKeyFound = true;
    } else if (
      line.startsWith("SUPABASE_SERVICE_KEY=") ||
      line.startsWith("SUPABASE_SERVICE_ROLE_KEY=")
    ) {
      updatedLines.push(`SUPABASE_SERVICE_KEY=${NEW_SUPABASE_SERVICE_KEY}`);
      supabaseServiceKeyFound = true;
    } else {
      updatedLines.push(line);
    }
  }

  // Add missing variables if they weren't found
  if (!supabaseUrlFound) {
    updatedLines.push(`SUPABASE_URL=${NEW_SUPABASE_URL}`);
  }
  if (!supabaseAnonKeyFound) {
    updatedLines.push(`SUPABASE_ANON_KEY=${NEW_SUPABASE_ANON_KEY}`);
  }
  if (!supabaseServiceKeyFound) {
    updatedLines.push(`SUPABASE_SERVICE_KEY=${NEW_SUPABASE_SERVICE_KEY}`);
  }

  // Write updated content
  const updatedContent = updatedLines.join("\n");

  // Create backup if file exists
  if (fs.existsSync(envPath)) {
    const backupPath = `${envPath}.backup.${Date.now()}`;
    fs.writeFileSync(backupPath, envContent);
    console.log(`💾 Backup created: ${path.basename(backupPath)}`);
  }

  fs.writeFileSync(envPath, updatedContent);
  console.log("\n✅ .env file updated successfully!");
  console.log("\nUpdated values:");
  console.log(`  SUPABASE_URL=${NEW_SUPABASE_URL}`);
  console.log(
    `  SUPABASE_ANON_KEY=${NEW_SUPABASE_ANON_KEY.substring(0, 50)}...`,
  );
  console.log(
    `  SUPABASE_SERVICE_KEY=${NEW_SUPABASE_SERVICE_KEY === PLACEHOLDER_SERVICE ? PLACEHOLDER_SERVICE : `${NEW_SUPABASE_SERVICE_KEY.substring(0, 12)}...`}`,
  );

  rl.close();
}

updateEnvFile().catch((error) => {
  console.error("\n❌ Error updating .env file:", error);
  rl.close();
  process.exit(1);
});
