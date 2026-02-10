#!/usr/bin/env node
/**
 * Real Diagnostic - Check Current State
 *
 * This checks your ACTUAL current data to see what's wrong
 */

import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function diagnose() {
  console.log("🔍 Checking your settings page data...\n");

  const env = loadEnv();
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const supabaseKey =
    env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase credentials in .env.local");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log("1️⃣ Looking up user: aljkous@gmail.com\n");

    const {
      data: { users },
      error: usersError,
    } = await supabase.auth.admin.listUsers();

    let userId;

    if (usersError) {
      console.log("⚠️  Using anon key - trying alternative method...\n");

      const { data: publicUsers } = await supabase
        .from("users")
        .select("id, email, full_name, position, jersey_number")
        .eq("email", "aljkous@gmail.com")
        .maybeSingle();

      if (!publicUsers) {
        console.error("❌ Cannot find your user. Please ensure:");
        console.error("   1. You are logged in as aljkous@gmail.com");
        console.error("   2. Your .env.local has correct credentials");
        process.exit(1);
      }

      userId = publicUsers.id;
      console.log(`✅ Found user: ${publicUsers.email}`);
      console.log(`   User ID: ${userId}`);
      console.log(`   Name: ${publicUsers.full_name || "N/A"}`);
      console.log(
        `   Position (users table): ${publicUsers.position || "N/A"}`,
      );
      console.log(
        `   Jersey (users table): ${publicUsers.jersey_number || "N/A"}\n`,
      );
    } else {
      const user = users.find((u) => u.email === "aljkous@gmail.com");
      if (!user) {
        console.error("❌ User aljkous@gmail.com not found");
        process.exit(1);
      }
      userId = user.id;
      console.log(`✅ Found user: ${user.email}`);
      console.log(`   User ID: ${userId}\n`);
    }

    console.log("2️⃣ Checking available teams...\n");

    const { data: allTeams } = await supabase
      .from("teams")
      .select("id, name, sport, approval_status")
      .order("name");

    if (!allTeams || allTeams.length === 0) {
      console.log("⚠️  NO TEAMS FOUND IN DATABASE!");
      console.log(
        "   This is the problem - no teams exist for you to select.\n",
      );
    } else {
      console.log(`✅ Found ${allTeams.length} team(s) in database:\n`);
      allTeams.forEach((team, i) => {
        const approved = team.approval_status === "approved" ? "✅" : "⚠️";
        console.log(`   ${i + 1}. ${approved} ${team.name}`);
        console.log(`      ID: ${team.id}`);
        console.log(`      Status: ${team.approval_status || "N/A"}\n`);
      });

      const hasDomestic = allTeams.find((t) =>
        t.name?.toLowerCase().includes("domestic"),
      );
      const hasInternational = allTeams.find((t) =>
        t.name?.toLowerCase().includes("international"),
      );

      if (!hasDomestic && !hasInternational) {
        console.log("⚠️  Ljubljana Frogs teams not found!");
        console.log("   You need to create them first.\n");
      }
    }

    console.log("3️⃣ Checking your current team membership...\n");

    const { data: membership } = await supabase
      .from("team_members")
      .select(
        `
        id,
        team_id,
        position,
        jersey_number,
        role,
        status,
        teams:team_id (
          id,
          name,
          sport
        )
      `,
      )
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (!membership) {
      console.log("❌ NO TEAM MEMBERSHIP FOUND!");
      console.log("   You are not a member of any team.");
      console.log(
        "   This is why the team dropdown might be empty or not saving.\n",
      );
    } else {
      const team = membership.teams;
      console.log("✅ You have an active team membership:\n");
      console.log(`   Team: ${team?.name || "Unknown"}`);
      console.log(`   Team ID: ${membership.team_id}`);
      console.log(`   Position: ${membership.position || "N/A"}`);
      console.log(`   Jersey: ${membership.jersey_number || "N/A"}`);
      console.log(`   Role: ${membership.role}`);
      console.log(`   Status: ${membership.status}\n`);
    }

    console.log("═══════════════════════════════════════════════════════");
    console.log("📋 DIAGNOSIS\n");

    if (!allTeams || allTeams.length === 0) {
      console.log("❌ PROBLEM: No teams in database");
      console.log("\n💡 SOLUTION:");
      console.log("   1. Create Ljubljana Frogs teams in your database");
      console.log("   2. Or run: node scripts/create-ljubljana-teams.js\n");
    } else if (!membership) {
      console.log("❌ PROBLEM: You are not a member of any team");
      console.log("\n💡 SOLUTION:");
      console.log("   1. Select a team from the dropdown");
      console.log("   2. Set your jersey number (e.g., 55)");
      console.log('   3. Click "Save Changes"');
      console.log("   4. The system will create your team membership\n");
    } else {
      console.log("✅ You have a team membership");
      console.log("\n📝 Current Settings:");
      console.log(`   Team: ${membership.teams?.name || "Unknown"}`);
      console.log(`   Jersey: #${membership.jersey_number || "N/A"}`);
      console.log(`   Position: ${membership.position || "N/A"}`);

      console.log("\n💡 To change your settings:");
      console.log("   1. Go to Settings page");
      console.log("   2. Select desired team from dropdown");
      console.log("   3. Change jersey number (e.g., from 55 to 47)");
      console.log('   4. Click "Save Changes"');
      console.log("   5. Refresh the page to verify\n");

      console.log("🔍 Things to check:");
      console.log("   • Open browser console (F12) when saving");
      console.log("   • Look for any JavaScript errors");
      console.log('   • Check if "Settings saved successfully" toast appears');
      console.log("   • Verify jersey number persists after page refresh\n");
    }

    console.log("═══════════════════════════════════════════════════════\n");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

diagnose().catch(console.error);
