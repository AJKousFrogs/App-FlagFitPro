#!/usr/bin/env node
/**
 * Split consolidated SQL into chunks and apply via MCP
 * Each chunk is ~500KB to avoid MCP limits
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_DIR = path.join(__dirname, "..");

const SQL_FILE = path.join(
  PROJECT_DIR,
  "database/migration_results/all_migrations_consolidated.sql",
);
const CHUNK_SIZE = 500000; // ~500KB per chunk

function splitSQLIntoChunks(sql) {
  const chunks = [];
  let currentChunk = "";
  let currentSize = 0;

  // Split by migration boundaries (-- ============================================================================)
  const lines = sql.split("\n");
  const inMigration = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineSize = Buffer.byteLength(`${line}\n`, "utf8");

    // Check if this is a migration boundary
    if (
      line.includes(
        "-- ============================================================================",
      ) &&
      i > 0 &&
      lines[i - 1].includes("Migration:")
    ) {
      // If current chunk is getting large, save it and start new one
      if (currentSize + lineSize > CHUNK_SIZE && currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = `${line}\n`;
        currentSize = lineSize;
      } else {
        currentChunk += `${line}\n`;
        currentSize += lineSize;
      }
    } else {
      currentChunk += `${line}\n`;
      currentSize += lineSize;
    }
  }

  // Add remaining chunk
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

async function main() {
  console.log("📦 Preparing SQL chunks for MCP execution\n");

  if (!fs.existsSync(SQL_FILE)) {
    console.error(`❌ File not found: ${SQL_FILE}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(SQL_FILE, "utf-8");
  console.log(`📖 Read ${(sql.length / 1024 / 1024).toFixed(2)} MB of SQL\n`);

  // Split into chunks
  console.log("✂️  Splitting into chunks...");
  const chunks = splitSQLIntoChunks(sql);
  console.log(`✅ Created ${chunks.length} chunks\n`);

  // Save chunks for MCP execution
  const outputDir = path.join(PROJECT_DIR, "database/migration_results/chunks");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  chunks.forEach((chunk, index) => {
    const chunkFile = path.join(
      outputDir,
      `chunk_${String(index + 1).padStart(3, "0")}.sql`,
    );
    fs.writeFileSync(chunkFile, chunk);
    console.log(
      `  Chunk ${index + 1}: ${(chunk.length / 1024).toFixed(1)} KB -> ${chunkFile}`,
    );
  });

  console.log(`\n✅ Prepared ${chunks.length} chunks for MCP execute_sql`);
  console.log(`📁 Location: ${outputDir}\n`);
  console.log("💡 Each chunk can be applied via MCP execute_sql tool");
  console.log("   I'll apply them automatically now!\n");

  return {
    totalChunks: chunks.length,
    chunksDir: outputDir,
    chunks: chunks.map((c, i) => ({
      index: i + 1,
      size: c.length,
      sql: `${c.substring(0, 200)}...`,
    })),
  };
}

main().catch(console.error);
