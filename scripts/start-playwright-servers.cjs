const { spawn } = require("node:child_process");

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const processes = [
  spawn(npmCommand, ["run", "start:api"], { stdio: "inherit" }),
  spawn(
    npmCommand,
    [
      "run",
      "dev:angular",
      "--",
      "--host",
      "127.0.0.1",
      "--port",
      "4200",
    ],
    { stdio: "inherit" },
  ),
];

let shuttingDown = false;

const terminate = () => {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  for (const child of processes) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }

  setTimeout(() => {
    for (const child of processes) {
      if (!child.killed) {
        child.kill("SIGKILL");
      }
    }
  }, 5000);
};

process.on("SIGINT", terminate);
process.on("SIGTERM", terminate);
process.on("exit", terminate);

processes.forEach((child) => {
  child.on("exit", (code) => {
    if (!shuttingDown) {
      terminate();
    }
    process.exit(code ?? 1);
  });
});
