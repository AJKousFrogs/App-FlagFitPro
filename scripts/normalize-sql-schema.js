#!/usr/bin/env node

/**
 * Normalize SQL schema references in consolidated migration file
 * - users -> public.users (but NOT auth.users)
 * - teams -> public.teams (but NOT if already public.teams)
 * - update_updated_at_column() -> public.update_updated_at_column()
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputFile = path.join(
  __dirname,
  "../database/migration_results/all_migrations_consolidated.sql",
);
const outputFile = path.join(
  __dirname,
  "../database/migration_results/all_migrations_consolidated_normalized.sql",
);

console.log("Reading SQL file...");
const sql = fs.readFileSync(inputFile, "utf8");

console.log("Normalizing schema references...");

let normalized = sql;

// 1. Normalize CREATE TABLE users -> CREATE TABLE public.users
// But NOT if it's already public.users or auth.users
normalized = normalized.replace(
  /CREATE TABLE\s+users\s*\(/gi,
  "CREATE TABLE public.users (",
);

// 2. Normalize ALTER TABLE users -> ALTER TABLE public.users
normalized = normalized.replace(
  /ALTER TABLE\s+users\b/gi,
  "ALTER TABLE public.users",
);

// 3. Normalize REFERENCES users( -> REFERENCES public.users(
// But NOT if it's already public.users or auth.users
normalized = normalized.replace(
  /REFERENCES\s+users\(/gi,
  "REFERENCES public.users(",
);

// 4. Normalize FROM users -> FROM public.users
// But NOT if it's auth.users or already public.users
normalized = normalized.replace(/FROM\s+users\b/gi, (match, offset, string) => {
  // Check if preceded by auth. or public.
  const before = string.substring(Math.max(0, offset - 20), offset);
  if (before.includes("auth.users") || before.includes("public.users")) {
    return match; // Don't replace
  }
  return "FROM public.users";
});

// 5. Normalize JOIN users -> JOIN public.users
normalized = normalized.replace(/JOIN\s+users\b/gi, (match, offset, string) => {
  const before = string.substring(Math.max(0, offset - 20), offset);
  if (before.includes("auth.users") || before.includes("public.users")) {
    return match;
  }
  return "JOIN public.users";
});

// 6. Normalize triggers: ON users -> ON public.users
normalized = normalized.replace(/\bON\s+users\b/gi, (match, offset, string) => {
  // Check context - should be trigger-related
  const context = string.substring(
    Math.max(0, offset - 30),
    offset + match.length,
  );
  if (
    context.includes("TRIGGER") ||
    context.includes("CREATE TRIGGER") ||
    context.includes("DROP TRIGGER")
  ) {
    const before = string.substring(Math.max(0, offset - 20), offset);
    if (!before.includes("auth.users") && !before.includes("public.users")) {
      return "ON public.users";
    }
  }
  return match;
});

// 7. Normalize teams -> public.teams (but NOT if already public.teams)
normalized = normalized.replace(
  /CREATE TABLE\s+teams\b/gi,
  "CREATE TABLE public.teams",
);

normalized = normalized.replace(
  /ALTER TABLE\s+teams\b/gi,
  "ALTER TABLE public.teams",
);

normalized = normalized.replace(
  /REFERENCES\s+teams\(/gi,
  "REFERENCES public.teams(",
);

normalized = normalized.replace(/FROM\s+teams\b/gi, (match, offset, string) => {
  const before = string.substring(Math.max(0, offset - 20), offset);
  if (before.includes("public.teams")) {
    return match;
  }
  return "FROM public.teams";
});

normalized = normalized.replace(/JOIN\s+teams\b/gi, (match, offset, string) => {
  const before = string.substring(Math.max(0, offset - 20), offset);
  if (before.includes("public.teams")) {
    return match;
  }
  return "JOIN public.teams";
});

// 8. Normalize update_updated_at_column() -> public.update_updated_at_column()
// But NOT if already public.update_updated_at_column()
normalized = normalized.replace(
  /EXECUTE\s+FUNCTION\s+update_updated_at_column\(\)/gi,
  "EXECUTE FUNCTION public.update_updated_at_column()",
);

normalized = normalized.replace(
  /\bupdate_updated_at_column\(\)/g,
  (match, offset, string) => {
    const before = string.substring(Math.max(0, offset - 10), offset);
    if (before.includes("public.")) {
      return match; // Already normalized
    }
    // Check if it's in a function definition
    const context = string.substring(
      Math.max(0, offset - 50),
      offset + match.length,
    );
    if (
      context.includes("CREATE FUNCTION") ||
      context.includes("CREATE OR REPLACE FUNCTION")
    ) {
      return match; // Function definition, keep as is
    }
    return "public.update_updated_at_column()";
  },
);

// 9. Normalize ALTER TABLE training_sessions -> ALTER TABLE public.training_sessions
normalized = normalized.replace(
  /ALTER TABLE\s+training_sessions\b/gi,
  "ALTER TABLE public.training_sessions",
);

// 10. Normalize CREATE TABLE training_sessions -> CREATE TABLE public.training_sessions
normalized = normalized.replace(
  /CREATE TABLE\s+training_sessions\b/gi,
  "CREATE TABLE public.training_sessions",
);

// 11. Normalize DROP TRIGGER ... ON training_sessions -> ON public.training_sessions
normalized = normalized.replace(
  /(DROP TRIGGER|CREATE TRIGGER).*?\bON\s+training_sessions\b/gi,
  (match) => {
    return match.replace(
      /\bON\s+training_sessions\b/gi,
      "ON public.training_sessions",
    );
  },
);

console.log("Writing normalized SQL file...");
fs.writeFileSync(outputFile, normalized, "utf8");

console.log(`✅ Normalized SQL written to: ${outputFile}`);
console.log(`   Original size: ${(sql.length / 1024 / 1024).toFixed(2)} MB`);
console.log(
  `   Normalized size: ${(normalized.length / 1024 / 1024).toFixed(2)} MB`,
);

// Show some statistics
const originalUsersRefs = (sql.match(/\busers\b/gi) || []).length;
const normalizedUsersRefs = (normalized.match(/\busers\b/gi) || []).length;
const originalPublicUsersRefs = (sql.match(/\bpublic\.users\b/gi) || []).length;
const normalizedPublicUsersRefs = (
  normalized.match(/\bpublic\.users\b/gi) || []
).length;

console.log("\n📊 Statistics:");
console.log(`   Original 'users' references: ${originalUsersRefs}`);
console.log(`   Normalized 'users' references: ${normalizedUsersRefs}`);
console.log(
  `   Original 'public.users' references: ${originalPublicUsersRefs}`,
);
console.log(
  `   Normalized 'public.users' references: ${normalizedPublicUsersRefs}`,
);
