/**
 * Shared file utilities for scripts.
 * @module scripts/lib/file-utils
 */

import fs from "node:fs/promises";
import path from "node:path";

/**
 * Recursively calculate total size of a directory in bytes.
 * @param {string} dirPath - Directory path
 * @returns {Promise<number>} Total size in bytes
 */
export async function getDirectorySize(dirPath) {
  let totalSize = 0;
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const filePath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        totalSize += await getDirectorySize(filePath);
      } else {
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }
    }
  } catch {
    // Ignore access errors
  }
  return totalSize;
}
