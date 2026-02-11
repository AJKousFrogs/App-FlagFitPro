/**
 * Test Supabase Connection
 */

import { createClient } from "@supabase/supabase-js";
import { lookup } from "node:dns/promises";
import dotenv from "dotenv";

dotenv.config();

const { SUPABASE_URL } = process.env;
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

function explainConnectionError(error) {
  const message = error?.message || "";
  const details = error?.details || "";
  const combined = `${message}\n${details}`;

  if (combined.includes("ENOTFOUND")) {
    return "DNS lookup failed for the Supabase host. Check network/DNS before rotating keys.";
  }
  if (combined.includes("fetch failed")) {
    return "Network call failed before Supabase auth. Check internet connectivity/firewall restrictions.";
  }
  if (message.includes("Invalid API key")) {
    return "Supabase rejected the key. Rotate and update your service/anon keys in .env and Netlify.";
  }

  return "Unknown connectivity/auth issue. Check key values and Supabase project status.";
}

async function testClient(label, key) {
  const supabase = createClient(SUPABASE_URL, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data, error } = await supabase.from("users").select("*").limit(1);
  if (error) {
    console.error(`❌ ${label} query failed`);
    console.error("   Message:", error.message);
    if (error.details) {
      console.error("   Details:", error.details);
    }
    if (error.hint) {
      console.error("   Hint:", error.hint);
    }
    console.error("   Diagnosis:", explainConnectionError(error));
    return false;
  }

  console.log(`✅ ${label} query succeeded`);
  console.log(`   Found ${data ? data.length : 0} row(s) in users table`);
  return true;
}

console.log("🔍 Testing Supabase Connection\n");
console.log("URL:", SUPABASE_URL);
console.log(
  "Service Key:",
  SUPABASE_SERVICE_KEY
    ? `${SUPABASE_SERVICE_KEY.substring(0, 20)}...`
    : "MISSING",
);
console.log(
  "Anon Key:",
  SUPABASE_ANON_KEY ? `${SUPABASE_ANON_KEY.substring(0, 20)}...` : "MISSING",
);
console.log("");

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !SUPABASE_ANON_KEY) {
  console.error("❌ Missing Supabase credentials in .env file");
  console.error(
    "   Required: SUPABASE_URL, SUPABASE_SERVICE_KEY (or SUPABASE_SERVICE_ROLE_KEY), SUPABASE_ANON_KEY",
  );
  process.exit(1);
}

try {
  const { hostname } = new URL(SUPABASE_URL);
  console.log(`Checking DNS for ${hostname}...`);
  await lookup(hostname);
  console.log("✅ DNS resolution succeeded\n");

  console.log("Testing service-role client...");
  const serviceOk = await testClient("Service-role", SUPABASE_SERVICE_KEY);
  console.log("");

  console.log("Testing anon client...");
  const anonOk = await testClient("Anon", SUPABASE_ANON_KEY);

  if (!serviceOk || !anonOk) {
    process.exit(1);
  }

  console.log("\n✅ Supabase connectivity checks passed");
} catch (error) {
  console.error("❌ Unexpected error:");
  console.error("   Name:", error.name);
  console.error("   Message:", error.message);
  console.error("   Diagnosis:", explainConnectionError(error));
  console.error("   Stack:", error.stack);
  process.exit(1);
}
