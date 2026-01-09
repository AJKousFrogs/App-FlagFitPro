#!/usr/bin/env node

/**
 * SCSS Commented Code Cleanup Script
 * Removes large blocks of commented CSS code
 */

const fs = require('fs');
const path = require('path');

const ANGULAR_SRC = path.join(__dirname, '../angular/src/app');

const stats = {
  filesProcessed: 0,
  commentedBlocksRemoved: 0,
  filesModified: 0,
};

function isCommentedCSSBlock(lines, index) {
  // Detect large commented CSS blocks (5+ consecutive commented lines)
  if (index + 4 >= lines.length) {return false;}
  
  let commentedCount = 0;
  for (let i = index; i < Math.min(index + 10, lines.length); i++) {
    const line = lines[i].trim();
    if (line.startsWith('//') && (line.includes('.') || line.includes('@') || line.includes('{'))) {
      commentedCount++;
    } else if (line === '' || line.startsWith('/*')) {
      // Allow empty lines and block comments
      continue;
    } else {
      break;
    }
  }
  
  return commentedCount >= 5;
}

function cleanupSCSSFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const newLines = [];
  let modified = false;
  let skipUntil = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (i < skipUntil) {
      continue; // Skip lines in a commented block
    }
    
    if (isCommentedCSSBlock(lines, i)) {
      // Find the end of the commented block
      let blockEnd = i;
      for (let j = i; j < Math.min(i + 50, lines.length); j++) {
        const line = lines[j].trim();
        if (line.startsWith('//') && (line.includes('.') || line.includes('@') || line.includes('{'))) {
          blockEnd = j;
        } else if (line === '' || line.startsWith('/*')) {
          continue;
        } else {
          break;
        }
      }
      
      // Skip the entire block
      skipUntil = blockEnd + 1;
      modified = true;
      stats.commentedBlocksRemoved += (blockEnd - i + 1);
      continue;
    }
    
    newLines.push(lines[i]);
  }
  
  if (modified) {
    fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
    stats.filesModified++;
    stats.filesProcessed++;
  }
  
  return modified;
}

function cleanupDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') {
        continue;
      }
      cleanupDirectory(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.scss')) {
      cleanupSCSSFile(fullPath);
    }
  }
}

console.log('🧹 Starting SCSS commented code cleanup...\n');

cleanupDirectory(ANGULAR_SRC);

console.log('\n✅ SCSS cleanup complete!\n');
console.log('Statistics:');
console.log(`  - Files processed: ${stats.filesProcessed}`);
console.log(`  - Files modified: ${stats.filesModified}`);
console.log(`  - Commented lines removed: ${stats.commentedBlocksRemoved}`);

