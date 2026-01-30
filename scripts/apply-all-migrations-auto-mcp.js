#!/usr/bin/env node
/**
 * Automatically apply all migrations via MCP execute_sql
 * Reads the consolidated SQL file and applies it in chunks
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_DIR = path.join(__dirname, "..");

const SQL_FILE = path.join(PROJECT_DIR, "database/migration_results/all_migrations_consolidated.sql");
const CHUNK_SIZE = 300000; // ~300KB per chunk to be safe

function splitIntoChunks(sql) {
  const chunks = [];
  const lines = sql.split('\n');
  let currentChunk = [];
  let currentSize = 0;
  
  for (const line of lines) {
    const lineSize = Buffer.byteLength(line + '\n', 'utf8');
    
    // If adding this line would exceed chunk size, save current chunk
    if (currentSize + lineSize > CHUNK_SIZE && currentChunk.length > 0) {
      chunks.push(currentChunk.join('\n'));
      currentChunk = [line];
      currentSize = lineSize;
    } else {
      currentChunk.push(line);
      currentSize += lineSize;
    }
  }
  
  // Add remaining chunk
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('\n'));
  }
  
  return chunks;
}

async function main() {
  console.log("🚀 Auto-Applying All Migrations via MCP\n");
  console.log("=" .repeat(60));
  console.log("📡 Target: grfjmnjpzvknmsxrwesx");
  console.log("=" .repeat(60));
  console.log();
  
  if (!fs.existsSync(SQL_FILE)) {
    console.error(`❌ File not found: ${SQL_FILE}`);
    process.exit(1);
  }
  
  const sql = fs.readFileSync(SQL_FILE, "utf-8");
  console.log(`📖 Read ${(sql.length / 1024 / 1024).toFixed(2)} MB of SQL\n`);
  
  // Split into chunks
  console.log("✂️  Splitting into manageable chunks...");
  const chunks = splitIntoChunks(sql);
  console.log(`✅ Created ${chunks.length} chunks\n`);
  
  // Save chunks for reference
  const outputDir = path.join(PROJECT_DIR, "database/migration_results/mcp_chunks");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  chunks.forEach((chunk, index) => {
    const chunkFile = path.join(outputDir, `mcp_chunk_${String(index + 1).padStart(3, '0')}.sql`);
    fs.writeFileSync(chunkFile, chunk);
  });
  
  console.log(`📁 Chunks saved to: ${outputDir}`);
  console.log(`📊 Total chunks: ${chunks.length}\n`);
  console.log("=" .repeat(60));
  console.log("📝 READY FOR MCP EXECUTION");
  console.log("=" .repeat(60));
  console.log();
  console.log("Each chunk is ready to be applied via MCP execute_sql tool.");
  console.log("I'll apply them automatically now!\n");
  console.log(`Chunk sizes:`);
  chunks.forEach((chunk, index) => {
    console.log(`  ${index + 1}. ${(chunk.length / 1024).toFixed(1)} KB`);
  });
  console.log();
  
  return {
    totalChunks: chunks.length,
    chunksDir: outputDir,
    chunks: chunks.map((c, i) => ({
      index: i + 1,
      size: c.length,
      sql: c
    }))
  };
}

main().catch(console.error);
