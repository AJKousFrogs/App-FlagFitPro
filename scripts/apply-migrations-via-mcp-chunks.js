#!/usr/bin/env node
/**
 * Apply migrations via MCP by reading chunk files and executing them
 * This script reads the chunk files and outputs instructions for MCP execution
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_DIR = path.join(__dirname, "..");

const CHUNKS_DIR = path.join(PROJECT_DIR, "database/migration_results/mcp_chunks");

async function main() {
  console.log("📋 Migration Chunks Ready for MCP Execution\n");
  console.log("=" .repeat(60));
  
  const chunkFiles = fs.readdirSync(CHUNKS_DIR)
    .filter(f => f.startsWith("mcp_chunk_") && f.endsWith(".sql"))
    .sort();
  
  console.log(`Found ${chunkFiles.length} chunks:\n`);
  
  chunkFiles.forEach((file, index) => {
    const filePath = path.join(CHUNKS_DIR, file);
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(1);
    
    console.log(`${index + 1}. ${file}`);
    console.log(`   Size: ${sizeKB} KB`);
    console.log(`   Path: ${filePath}\n`);
  });
  
  console.log("=" .repeat(60));
  console.log("✅ Chunks are ready!");
  console.log("💡 I'll apply them via MCP execute_sql now.\n");
  
  return {
    chunks: chunkFiles.map(f => ({
      name: f,
      path: path.join(CHUNKS_DIR, f),
      size: fs.statSync(path.join(CHUNKS_DIR, f)).size
    }))
  };
}

main().catch(console.error);
