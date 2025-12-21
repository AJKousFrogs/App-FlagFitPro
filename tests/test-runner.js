#!/usr/bin/env node

import { spawn } from "child_process";
import { existsSync } from "fs";
import chalk from "chalk";

const args = process.argv.slice(2);
const testType = args[0] || "all";

console.log(chalk.blue("🏃‍♂️ Flag Football App Test Runner"));
console.log(chalk.gray("================================\n"));

async function runCommand(command, args, description) {
  return new Promise((resolve, reject) => {
    console.log(chalk.yellow(`Running: ${description}`));
    console.log(chalk.gray(`Command: ${command} ${args.join(" ")}\n`));

    const process = spawn(command, args, { stdio: "inherit" });

    process.on("close", (code) => {
      if (code === 0) {
        console.log(chalk.green(`✅ ${description} completed successfully\n`));
        resolve();
      } else {
        console.log(chalk.red(`❌ ${description} failed with code ${code}\n`));
        reject(new Error(`${description} failed`));
      }
    });

    process.on("error", (error) => {
      console.log(
        chalk.red(`❌ Error running ${description}: ${error.message}\n`),
      );
      reject(error);
    });
  });
}

async function checkPrerequisites() {
  console.log(chalk.blue("Checking prerequisites..."));

  const files = ["vitest.config.js", "playwright.config.js", "tests/setup.js"];

  for (const file of files) {
    if (!existsSync(file)) {
      throw new Error(`Missing required file: ${file}`);
    }
  }

  console.log(chalk.green("✅ All prerequisites met\n"));
}

async function runTests() {
  try {
    await checkPrerequisites();

    switch (testType) {
      case "unit":
        await runCommand("npx", ["vitest", "run", "tests/unit"], "Unit Tests");
        break;

      case "integration":
        await runCommand(
          "npx",
          ["vitest", "run", "tests/integration"],
          "Integration Tests",
        );
        break;

      case "e2e":
        console.log(chalk.blue("Installing Playwright browsers..."));
        await runCommand(
          "npx",
          ["playwright", "install"],
          "Playwright Browser Installation",
        );
        await runCommand("npx", ["playwright", "test"], "End-to-End Tests");
        break;

      case "coverage":
        await runCommand(
          "npx",
          ["vitest", "run", "--coverage"],
          "Tests with Coverage",
        );
        break;

      case "watch":
        await runCommand("npx", ["vitest"], "Tests in Watch Mode");
        break;

      case "all":
        console.log(chalk.blue("Running comprehensive test suite...\n"));

        await runCommand("npx", ["vitest", "run", "tests/unit"], "Unit Tests");
        await runCommand(
          "npx",
          ["vitest", "run", "tests/integration"],
          "Integration Tests",
        );

        console.log(chalk.blue("Installing Playwright browsers..."));
        await runCommand(
          "npx",
          ["playwright", "install"],
          "Playwright Browser Installation",
        );
        await runCommand("npx", ["playwright", "test"], "End-to-End Tests");

        console.log(chalk.green("🎉 All tests completed successfully!"));
        break;

      default:
        console.log(chalk.red(`Unknown test type: ${testType}`));
        console.log(
          chalk.yellow(
            "Available options: unit, integration, e2e, coverage, watch, all",
          ),
        );
        process.exit(1);
    }
  } catch (error) {
    console.log(chalk.red(`💥 Test execution failed: ${error.message}`));
    process.exit(1);
  }
}

// Display usage if help requested
if (args.includes("--help") || args.includes("-h")) {
  console.log(chalk.blue("Flag Football App Test Runner"));
  console.log(chalk.gray("Usage: node tests/test-runner.js [type]"));
  console.log(chalk.gray("\nAvailable test types:"));
  console.log(chalk.gray("  unit        - Run unit tests only"));
  console.log(chalk.gray("  integration - Run integration tests only"));
  console.log(chalk.gray("  e2e         - Run end-to-end tests only"));
  console.log(chalk.gray("  coverage    - Run tests with coverage report"));
  console.log(chalk.gray("  watch       - Run tests in watch mode"));
  console.log(chalk.gray("  all         - Run all tests (default)"));
  console.log(chalk.gray("\nExamples:"));
  console.log(chalk.gray("  npm run test:unit"));
  console.log(chalk.gray("  npm run test:e2e"));
  console.log(chalk.gray("  npm run test:all"));
  process.exit(0);
}

runTests();
