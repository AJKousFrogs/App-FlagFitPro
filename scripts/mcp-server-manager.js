#!/usr/bin/env node

/**
 * MCP Server Manager
 * Manages Context7 and Sequential Thought MCP servers
 */

import { spawn } from "child_process";
import { createServer } from "http";
import fetch from "node-fetch";
import PortManager from "./port-manager.js";

class MCPServerManager {
  constructor() {
    this.portManager = new PortManager();
    this.servers = {
      context7: {
        name: "Context7",
        command: "npx",
        args: ["-y", "@context7/mcp-server"],
        port: null,
        process: null,
        status: "stopped",
      },
      sequentialThought: {
        name: "Sequential Thought",
        command: "npx",
        args: ["-y", "@sequential-thought/mcp-server"],
        port: null,
        process: null,
        status: "stopped",
      },
    };
  }

  // Start all MCP servers
  async startServers() {
    console.log("🚀 Starting MCP servers...\n");

    try {
      await this.portManager.cleanup();

      const startPromises = Object.keys(this.servers).map((serverName) =>
        this.startServer(serverName),
      );

      const results = await Promise.allSettled(startPromises);

      // Report results
      results.forEach((result, index) => {
        const serverName = Object.keys(this.servers)[index];
        if (result.status === "fulfilled") {
          console.log(
            `✅ ${this.servers[serverName].name} started successfully`,
          );
        } else {
          console.error(
            `❌ ${this.servers[serverName].name} failed to start:`,
            result.reason,
          );
        }
      });

      this.showStatus();
    } catch (error) {
      console.error("❌ Failed to start MCP servers:", error.message);
    }
  }

  // Start individual server
  async startServer(serverName) {
    const server = this.servers[serverName];

    if (server.status === "running") {
      console.log(`⚠️  ${server.name} is already running`);
      return;
    }

    try {
      // Allocate port
      const port = await this.portManager.allocatePort("mcp");
      server.port = port;

      console.log(`🔌 Starting ${server.name} on port ${port}...`);

      // Set up environment
      const env = {
        ...process.env,
        PORT: port.toString(),
        MCP_PORT: port.toString(),
      };

      // Start the server process
      const serverProcess = spawn(server.command, server.args, {
        env,
        stdio: ["pipe", "pipe", "pipe"],
        shell: process.platform === "win32",
      });

      server.process = serverProcess;
      server.status = "starting";

      // Handle process events
      serverProcess.stdout.on("data", (data) => {
        const output = data.toString().trim();
        if (output) {
          console.log(`[${server.name}] ${output}`);
        }
      });

      serverProcess.stderr.on("data", (data) => {
        const error = data.toString().trim();
        if (error && !error.includes("warning")) {
          console.error(`[${server.name}] ${error}`);
        }
      });

      serverProcess.on("error", (error) => {
        console.error(`❌ ${server.name} process error:`, error.message);
        server.status = "error";
        this.portManager.releasePort("mcp");
      });

      serverProcess.on("exit", (code) => {
        console.log(`📴 ${server.name} exited with code ${code}`);
        server.status = "stopped";
        server.process = null;
        this.portManager.releasePort("mcp");
      });

      // Wait for server to be ready
      await this.waitForServerReady(serverName, port);
      server.status = "running";

      return { serverName, port, status: "running" };
    } catch (error) {
      server.status = "error";
      if (server.port) {
        this.portManager.releasePort("mcp");
      }
      throw new Error(`Failed to start ${server.name}: ${error.message}`);
    }
  }

  // Wait for server to be ready
  async waitForServerReady(serverName, port, maxAttempts = 10) {
    const server = this.servers[serverName];

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await fetch(`http://localhost:${port}/health`, {
          method: "GET",
          timeout: 2000,
        });

        if (response.ok) {
          console.log(`✅ ${server.name} is ready on port ${port}`);
          return true;
        }
      } catch (error) {
        // Server not ready yet
      }

      console.log(
        `⏳ Waiting for ${server.name} to be ready (${attempt}/${maxAttempts})...`,
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    throw new Error(
      `${server.name} did not become ready within ${maxAttempts} seconds`,
    );
  }

  // Stop all servers
  async stopServers() {
    console.log("🛑 Stopping MCP servers...\n");

    const stopPromises = Object.keys(this.servers).map((serverName) =>
      this.stopServer(serverName),
    );

    await Promise.allSettled(stopPromises);
    this.portManager.releaseAllPorts();

    console.log("✅ All MCP servers stopped");
  }

  // Stop individual server
  async stopServer(serverName) {
    const server = this.servers[serverName];

    if (server.status === "stopped" || !server.process) {
      console.log(`⚠️  ${server.name} is not running`);
      return;
    }

    try {
      console.log(`🛑 Stopping ${server.name}...`);

      // Send SIGTERM first
      server.process.kill("SIGTERM");

      // Wait for graceful shutdown
      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          // Force kill if not stopped gracefully
          if (server.process && !server.process.killed) {
            console.log(`⚠️  Force killing ${server.name}...`);
            server.process.kill("SIGKILL");
          }
          resolve();
        }, 5000);

        server.process.on("exit", () => {
          clearTimeout(timeout);
          resolve();
        });
      });

      server.status = "stopped";
      server.process = null;

      if (server.port) {
        this.portManager.releasePort("mcp");
        server.port = null;
      }

      console.log(`✅ ${server.name} stopped`);
    } catch (error) {
      console.error(`❌ Error stopping ${server.name}:`, error.message);
    }
  }

  // Restart servers
  async restartServers() {
    console.log("🔄 Restarting MCP servers...\n");
    await this.stopServers();
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
    await this.startServers();
  }

  // Show server status
  showStatus() {
    console.log("\n📊 MCP Server Status:");
    console.log("=".repeat(50));

    Object.entries(this.servers).forEach(([key, server]) => {
      const statusIcon = this.getStatusIcon(server.status);
      const portInfo = server.port ? `port ${server.port}` : "no port";
      console.log(
        `${statusIcon} ${server.name}: ${server.status} (${portInfo})`,
      );
    });

    console.log("");
  }

  getStatusIcon(status) {
    switch (status) {
      case "running":
        return "🟢";
      case "starting":
        return "🟡";
      case "stopped":
        return "⚪";
      case "error":
        return "🔴";
      default:
        return "❓";
    }
  }

  // Health check all servers
  async healthCheck() {
    console.log("🏥 Performing MCP server health check...\n");

    const healthPromises = Object.entries(this.servers).map(
      async ([key, server]) => {
        if (server.status !== "running" || !server.port) {
          return { server: server.name, status: "not-running" };
        }

        try {
          const response = await fetch(
            `http://localhost:${server.port}/health`,
            {
              method: "GET",
              timeout: 3000,
            },
          );

          if (response.ok) {
            return {
              server: server.name,
              status: "healthy",
              port: server.port,
            };
          } else {
            return {
              server: server.name,
              status: "unhealthy",
              port: server.port,
            };
          }
        } catch (error) {
          return {
            server: server.name,
            status: "unreachable",
            port: server.port,
            error: error.message,
          };
        }
      },
    );

    const results = await Promise.all(healthPromises);

    results.forEach((result) => {
      const icon =
        result.status === "healthy"
          ? "✅"
          : result.status === "not-running"
            ? "⚪"
            : "❌";
      console.log(
        `${icon} ${result.server}: ${result.status}${result.port ? ` (port ${result.port})` : ""}`,
      );
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    console.log("");
    return results;
  }
}

// CLI interface
async function main() {
  const manager = new MCPServerManager();
  const [, , command] = process.argv;

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\n🛑 Received shutdown signal...");
    await manager.stopServers();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await manager.stopServers();
    process.exit(0);
  });

  try {
    switch (command) {
      case "start":
        await manager.startServers();
        break;

      case "stop":
        await manager.stopServers();
        break;

      case "restart":
        await manager.restartServers();
        break;

      case "status":
        manager.showStatus();
        break;

      case "health":
        await manager.healthCheck();
        break;

      default:
        console.log(`
🔌 MCP Server Manager

Usage:
  node scripts/mcp-server-manager.js <command>

Commands:
  start    - Start all MCP servers
  stop     - Stop all MCP servers  
  restart  - Restart all MCP servers
  status   - Show server status
  health   - Perform health check

Examples:
  npm run mcp:start
  npm run mcp:stop
  npm run mcp:status
        `);
    }
  } catch (error) {
    console.error("❌ Command failed:", error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default MCPServerManager;
