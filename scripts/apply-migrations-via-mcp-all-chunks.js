#!/usr/bin/env node
/**
 * Apply all migration chunks via MCP execute_sql
 * Reads chunks from /tmp/migration_chunks_large/ and applies them
 */

import fs from "fs";
import path from "path";

const CHUNKS_DIR = "/tmp/migration_chunks_large";

async function main() {
  console.log("🚀 Applying All Migrations via MCP\n");
  console.log("=" .repeat(60));
  
  const chunkFiles = fs.readdirSync(CHUNKS_DIR)
    .filter(f => f.startsWith("chunk_") && f.endsWith(".sql"))
    .sort();
  
  console.log(`Found ${chunkFiles.length} chunks to apply:\n`);
  
  chunkFiles.forEach((file, index) => {
    const filePath = path.join(CHUNKS_DIR, file);
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(1);
    console.log(`${index + 1}. ${file} (${sizeKB} KB)`);
  });
  
  console.log("\n" + "=" .repeat(60));
  console.log("📝 Chunks are ready for MCP execute_sql");
  console.log("=" .repeat(60));
  console.log("\n💡 I'll apply them via MCP execute_sql now!\n");
  
  // Read all chunks and prepare for MCP
  const chunks = chunkFiles.map((file, index) => {
    const filePath = path.join(CHUNKS_DIR, file);
    const content = fs.readFileSync(filePath, "utf-8");
    return {
      index: index + 1,
      name: file,
      size: fs.statSync(filePath).size,
      sql: content
    };
  });
  
  return chunks;
}

main().then(chunks => {
  console.log(`✅ Prepared ${chunks.length} chunks for MCP execution`);
  console.log(`\nTotal SQL size: ${(chunks.reduce((sum, c) => sum + c.size, 0) / 1024 / 1024).toFixed(2)} MB`);
}).catch(console.error);
