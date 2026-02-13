#!/usr/bin/env node
/**
 * Run design-system e2e tests with env vars cleared to suppress
 * "NO_COLOR env is ignored due to FORCE_COLOR" warnings.
 * Cross-platform (Node unset works on all platforms).
 */
import { spawn } from "node:child_process";

const env = { ...process.env };
delete env.NO_COLOR;
delete env.FORCE_COLOR;

const child = spawn(
  "npx",
  ["playwright", "test", "--project=design-system", ...process.argv.slice(2)],
  {
    stdio: "inherit",
    env,
    shell: true,
  }
);

child.on("exit", (code) => process.exit(code ?? 0));
