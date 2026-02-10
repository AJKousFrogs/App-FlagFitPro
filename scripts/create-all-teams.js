#!/usr/bin/env node
/**
 * Create All Teams
 *
 * Creates all 4 teams that users can select:
 * 1. Ljubljana Frogs - International
 * 2. Ljubljana Frogs - Domestic
 * 3. American Samoa National Team - Men
 * 4. American Samoa National Team - Women
 */

import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = path.join(__dirname, "../.env.local");
  if (!fs.existsSync(envPath)) {
    console.error("❌ .env.local not found");
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, "utf-8");
  const env = {};
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      env[key.trim()] = valueParts
        .join("=")
        .replace(/^["']|["']$/g, "")
        .trim();
    }
  });
  return env;
}

async function createTeams() {
  console.log("🏈 Creating all teams...\n");

  const env = loadEnv();
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const supabaseKey =
    env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase credentials in .env.local");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const teams = [
    {
      name: "Ljubljana Frogs - International",
      sport: "flag_football",
      approval_status: "approved",
      description: "Ljubljana Frogs international team",
    },
    {
      name: "Ljubljana Frogs - Domestic",
      sport: "flag_football",
      approval_status: "approved",
      description: "Ljubljana Frogs domestic team",
    },
    {
      name: "American Samoa National Team - Men",
      sport: "flag_football",
      approval_status: "approved",
      description: "American Samoa men's national flag football team",
    },
    {
      name: "American Samoa National Team - Women",
      sport: "flag_football",
      approval_status: "approved",
      description: "American Samoa women's national flag football team",
    },
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const team of teams) {
    try {
      console.log(`Creating: ${team.name}...`);

      const { data, error } = await supabase
        .from("teams")
        .upsert(team, {
          onConflict: "name",
          ignoreDuplicates: false,
        })
        .select()
        .single();

      if (error) {
        console.log(`   ⚠️  ${error.message}`);
        errorCount++;
      } else {
        console.log(`   ✅ ID: ${data.id}`);
        successCount++;
      }
    } catch (err) {
      console.log(`   ❌ Error: ${err.message}`);
      errorCount++;
    }
  }

  console.log("\n═══════════════════════════════════════════════════════");
  console.log("📊 SUMMARY\n");
  console.log(`✅ Successfully created/updated: ${successCount} teams`);
  if (errorCount > 0) {
    console.log(`⚠️  Errors: ${errorCount} teams`);
  }
  console.log("═══════════════════════════════════════════════════════\n");

  if (successCount > 0) {
    console.log("✅ Teams are ready!\n");
    console.log("Now you can:");
    console.log("1. Go to Settings page");
    console.log("2. Select your team from the dropdown:");
    console.log("   • Ljubljana Frogs - International");
    console.log("   • Ljubljana Frogs - Domestic");
    console.log("   • American Samoa National Team - Men");
    console.log("   • American Samoa National Team - Women");
    console.log("3. Set your jersey number (e.g., 55)");
    console.log('4. Click "Save Changes"');
    console.log("5. Refresh the page to verify it saved\n");
  } else {
    console.log("❌ No teams were created. Please check the errors above.");
    console.log("   Common issues:");
    console.log("   • Database permissions (RLS policies)");
    console.log("   • Missing service role key in .env.local");
    console.log("   • Network connectivity issues\n");
  }
}

createTeams().catch((error) => {
  console.error("\n❌ Fatal error:", error.message);
  process.exit(1);
});
