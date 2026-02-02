#!/usr/bin/env node

/**
 * Node wrapper that keeps the Sass watch command platform-safe.
 * On macOS it sets CHOKIDAR_USEPOLLING/CHOKIDAR_INTERVAL before spawning `sass --watch`.
 * Additional entrypoints (components/pages/utilities) are compiled alongside the main bundle.
 */

import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";

const watchTargets = [
  "angular/src/styles.scss:src/css/main.css",
  "angular/src/scss/tokens/design-system-tokens.scss:src/css/tokens.css",
  "angular/src/scss/components/index.scss:src/css/components/index.css",
  "angular/src/scss/pages/index.scss:src/css/pages/index.css",
  "angular/src/scss/utilities/index.scss:src/css/utilities/index.css",
];

const ensureOutputDirs = () => {
  const dirs = [
    "src/css",
    "src/css/components",
    "src/css/pages",
    "src/css/utilities",
  ];

  dirs.forEach((dir) => {
    mkdirSync(dir, { recursive: true });
  });
};

ensureOutputDirs();

const args = [
  "--watch",
  "--load-path=angular/src",
  ...watchTargets,
  "--style=expanded",
];

const env = { ...process.env };
if (process.platform === "darwin") {
  env.CHOKIDAR_USEPOLLING ??= "true";
  env.CHOKIDAR_INTERVAL ??= "250";
}

const child = spawn("sass", args, {
  env,
  stdio: "inherit",
});

child.on("close", (code) => {
  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error("Failed to start sass watch:", error);
  process.exit(1);
});
