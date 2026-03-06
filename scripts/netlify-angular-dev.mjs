import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const angularCwd = path.resolve(__dirname, "..", "angular");

const command = process.platform === "win32" ? "npx.cmd" : "npx";
const args = [
  "ng",
  "serve",
  "--port",
  "4200",
  "--host",
  "0.0.0.0",
  "--live-reload",
  "--poll",
  "2000",
];

const child = spawn(command, args, {
  cwd: angularCwd,
  env: process.env,
  stdio: ["ignore", "pipe", "pipe"],
});

child.stdout?.pipe(process.stdout);
child.stderr?.pipe(process.stderr);

const forwardSignal = (signal) => {
  if (!child.killed) {
    child.kill(signal);
  }
};

process.on("SIGINT", () => forwardSignal("SIGINT"));
process.on("SIGTERM", () => forwardSignal("SIGTERM"));
process.on("SIGHUP", () => forwardSignal("SIGHUP"));

child.on("error", (error) => {
  console.error("[netlify-angular-dev] Failed to start Angular dev server.", error);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
