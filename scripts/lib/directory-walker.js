/**
 * Shared directory walker for scripts that need to process files recursively.
 * @module scripts/lib/directory-walker
 */

import fs from "node:fs";
import path from "node:path";

const DEFAULT_SKIP_DIRS = ["node_modules", "dist", ".git"];

/**
 * Recursively walk a directory, calling fileProcessor for each matching file.
 * @param {string} dir - Root directory path
 * @param {(filePath: string) => void | boolean} fileProcessor - Called for each matching file. Return true if file was modified.
 * @param {object} opts - Options
 * @param {string[]} [opts.extensions] - File extensions to process (e.g. [".ts"], [".scss"], [".ts", ".scss", ".html"])
 * @param {string[]} [opts.skipDirs] - Directory names to skip
 */
export function walkDirectory(dir, fileProcessor, opts = {}) {
  const { extensions = [".ts"], skipDirs = DEFAULT_SKIP_DIRS } = opts;
  if (!fs.existsSync(dir)) {return;}

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (skipDirs.includes(entry.name)) {continue;}
      walkDirectory(fullPath, fileProcessor, opts);
    } else if (entry.isFile()) {
      const matches = extensions.some((ext) => entry.name.endsWith(ext));
      if (matches) {
        fileProcessor(fullPath);
      }
    }
  }
}
