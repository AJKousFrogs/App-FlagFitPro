#!/usr/bin/env node

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CodebaseHealthCheck {
  constructor() {
    this.issues = {
      duplicateFunctions: [],
      redundantClasses: [],
      missingImports: [],
      unusedImports: [],
      inconsistentExports: [],
      databaseConnectionDuplication: [],
      performanceIssues: [],
      errorPotentials: [],
      schemaConflicts: [],
    };

    this.functions = new Map();
    this.classes = new Map();
    this.imports = new Map();
    this.exports = new Map();
    this.databaseConnections = [];
  }

  async runHealthCheck() {
    console.log("🔍 Starting comprehensive codebase health check...\n");

    try {
      await this.scanServiceFiles();
      await this.scanComponentFiles();
      await this.scanDatabaseFiles();
      await this.analyzeDuplicates();
      await this.analyzeImportsExports();
      await this.analyzeDatabaseConnections();
      await this.analyzePerformanceIssues();
      await this.generateHealthReport();
    } catch (error) {
      console.error("❌ Error during health check:", error);
    }
  }

  async scanServiceFiles() {
    console.log("📁 Scanning service files...");
    const servicesDir = path.join(__dirname, "../src/services");

    try {
      const files = await fs.readdir(servicesDir);
      const jsFiles = files.filter(
        (file) => file.endsWith(".js") && !file.includes(".backup"),
      );

      for (const file of jsFiles) {
        const filePath = path.join(servicesDir, file);
        await this.analyzeFile(filePath, "service");
      }
    } catch (error) {
      console.error("❌ Error scanning services:", error);
    }
  }

  async scanComponentFiles() {
    console.log("📁 Scanning component files...");
    const componentsDir = path.join(__dirname, "../src/components");

    try {
      const files = await fs.readdir(componentsDir);
      const jsxFiles = files.filter((file) => file.endsWith(".jsx"));

      for (const file of jsxFiles) {
        const filePath = path.join(componentsDir, file);
        await this.analyzeFile(filePath, "component");
      }
    } catch (error) {
      console.error("❌ Error scanning components:", error);
    }
  }

  async scanDatabaseFiles() {
    console.log("📁 Scanning database files...");
    const dbDir = path.join(__dirname, "../database");

    try {
      // Check migrations
      const migrationsDir = path.join(dbDir, "migrations");
      const migrations = await fs.readdir(migrationsDir);

      for (const migration of migrations) {
        const filePath = path.join(migrationsDir, migration);
        await this.analyzeDatabaseFile(filePath);
      }

      // Check schema
      const schemaPath = path.join(dbDir, "schema.sql");
      await this.analyzeDatabaseFile(schemaPath);
    } catch (error) {
      console.error("❌ Error scanning database files:", error);
    }
  }

  async analyzeFile(filePath, fileType) {
    try {
      const content = await fs.readFile(filePath, "utf-8");
      const filename = path.basename(filePath);

      // Extract functions
      const functionMatches = content.match(
        /(?:async\s+)?(?:function\s+)?(\w+)\s*\([^)]*\)\s*\{|(\w+)\s*:\s*(?:async\s+)?(?:function\s*)?\([^)]*\)\s*=>/g,
      );
      if (functionMatches) {
        functionMatches.forEach((match) => {
          const funcName = this.extractFunctionName(match);
          if (funcName && !this.isCommonName(funcName)) {
            if (!this.functions.has(funcName)) {
              this.functions.set(funcName, []);
            }
            this.functions.get(funcName).push({
              file: filename,
              type: fileType,
              line: this.getLineNumber(content, match),
            });
          }
        });
      }

      // Extract classes
      const classMatches = content.match(/class\s+(\w+)/g);
      if (classMatches) {
        classMatches.forEach((match) => {
          const className = match.replace("class ", "");
          if (!this.classes.has(className)) {
            this.classes.set(className, []);
          }
          this.classes.get(className).push({ file: filename, type: fileType });
        });
      }

      // Extract imports
      const importMatches = content.match(
        /import\s+.*?from\s+['"`]([^'"`]+)['"`]/g,
      );
      if (importMatches) {
        importMatches.forEach((match) => {
          const importPath = match.match(/from\s+['"`]([^'"`]+)['"`]/)[1];
          if (!this.imports.has(importPath)) {
            this.imports.set(importPath, []);
          }
          this.imports
            .get(importPath)
            .push({ file: filename, statement: match });
        });
      }

      // Extract exports
      const exportMatches = content.match(
        /export\s+(?:default\s+)?(?:class\s+)?(\w+)|module\.exports\s*=\s*(\w+)/g,
      );
      if (exportMatches) {
        exportMatches.forEach((match) => {
          const exportName = this.extractExportName(match);
          if (exportName) {
            if (!this.exports.has(exportName)) {
              this.exports.set(exportName, []);
            }
            this.exports
              .get(exportName)
              .push({ file: filename, statement: match });
          }
        });
      }

      // Check for database connections
      if (content.includes("new Pool") || content.includes("from 'pg'")) {
        this.databaseConnections.push({
          file: filename,
          type: fileType,
          hasPool: content.includes("new Pool"),
          hasImport: content.includes("from 'pg'"),
        });
      }

      // Check for specific issues
      await this.checkFileSpecificIssues(content, filename, fileType);
    } catch (error) {
      console.error(`❌ Error analyzing ${filePath}:`, error);
    }
  }

  async analyzeDatabaseFile(filePath) {
    try {
      const content = await fs.readFile(filePath, "utf-8");
      const filename = path.basename(filePath);

      // Check for table conflicts
      const tableMatches = content.match(
        /CREATE TABLE(?:\s+IF NOT EXISTS)?\s+(\w+)/gi,
      );
      if (tableMatches) {
        tableMatches.forEach((match) => {
          const tableName = match.replace(
            /CREATE TABLE(?:\s+IF NOT EXISTS)?\s+/i,
            "",
          );
          // Store for conflict analysis
        });
      }
    } catch (error) {
      console.error(`❌ Error analyzing database file ${filePath}:`, error);
    }
  }

  async checkFileSpecificIssues(content, filename, fileType) {
    // Check for potential errors
    const potentialErrors = [];

    // Missing try-catch in async functions
    if (content.includes("async ") && !content.includes("try {")) {
      potentialErrors.push("Async functions without try-catch blocks");
    }

    // Hardcoded values that should be environment variables
    if (
      content.includes("localhost:") &&
      !content.includes("import.meta.env")
    ) {
      potentialErrors.push("Hardcoded localhost URLs");
    }

    // Missing null checks
    if (content.includes(".length") && !content.includes("&&")) {
      potentialErrors.push("Potential null reference errors");
    }

    if (potentialErrors.length > 0) {
      this.issues.errorPotentials.push({
        file: filename,
        issues: potentialErrors,
      });
    }

    // Check for performance issues
    const performanceIssues = [];

    // Multiple database connections in single file
    const poolMatches = content.match(/new Pool/g);
    if (poolMatches && poolMatches.length > 1) {
      performanceIssues.push("Multiple database connection pools");
    }

    // Synchronous file operations
    if (
      content.includes("fs.readFileSync") ||
      content.includes("fs.writeFileSync")
    ) {
      performanceIssues.push("Synchronous file operations");
    }

    // Large data processing without streaming
    if (
      content.includes("JSON.parse") &&
      content.includes("await") &&
      content.includes("map(")
    ) {
      performanceIssues.push(
        "Potential memory issues with large data processing",
      );
    }

    if (performanceIssues.length > 0) {
      this.issues.performanceIssues.push({
        file: filename,
        issues: performanceIssues,
      });
    }
  }

  analyzeDuplicates() {
    console.log("🔍 Analyzing duplicates...");

    // Find duplicate function names
    this.functions.forEach((files, funcName) => {
      if (files.length > 1) {
        // Check if they're actually different implementations
        const uniqueFiles = [...new Set(files.map((f) => f.file))];
        if (uniqueFiles.length > 1) {
          this.issues.duplicateFunctions.push({
            name: funcName,
            occurrences: files,
            severity: this.calculateSeverity(funcName, files),
          });
        }
      }
    });

    // Find duplicate classes
    this.classes.forEach((files, className) => {
      if (files.length > 1) {
        this.issues.redundantClasses.push({
          name: className,
          occurrences: files,
        });
      }
    });
  }

  analyzeImportsExports() {
    console.log("🔍 Analyzing imports and exports...");

    // Check for inconsistent export patterns
    this.exports.forEach((files, exportName) => {
      const exportPatterns = files.map((f) => f.statement);
      const uniquePatterns = [...new Set(exportPatterns)];

      if (uniquePatterns.length > 1) {
        this.issues.inconsistentExports.push({
          name: exportName,
          patterns: uniquePatterns,
          files: files.map((f) => f.file),
        });
      }
    });

    // Check for unused imports (simplified check)
    // This would need more sophisticated analysis in a real implementation
  }

  analyzeDatabaseConnections() {
    console.log("🔍 Analyzing database connections...");

    if (this.databaseConnections.length > 5) {
      this.issues.databaseConnectionDuplication.push({
        issue: "Too many files creating database connections",
        count: this.databaseConnections.length,
        files: this.databaseConnections.map((conn) => conn.file),
        recommendation: "Consider using a singleton database service",
      });
    }

    // Group by pattern
    const patterns = {};
    this.databaseConnections.forEach((conn) => {
      const pattern = `${conn.hasPool ? "Pool" : ""}_${conn.hasImport ? "Import" : ""}`;
      if (!patterns[pattern]) {
        patterns[pattern] = [];
      }
      patterns[pattern].push(conn.file);
    });

    Object.entries(patterns).forEach(([pattern, files]) => {
      if (files.length > 3) {
        this.issues.databaseConnectionDuplication.push({
          issue: `Multiple files with pattern: ${pattern}`,
          files,
          recommendation: "Consolidate database connection logic",
        });
      }
    });
  }

  analyzePerformanceIssues() {
    console.log("🔍 Analyzing performance issues...");

    // Additional performance analysis would go here
    // This is already partially done in checkFileSpecificIssues
  }

  async generateHealthReport() {
    console.log("\n📊 Generating health report...\n");

    const report = {
      summary: this.generateSummary(),
      criticalIssues: this.getCriticalIssues(),
      recommendations: this.generateRecommendations(),
      detailedFindings: this.issues,
    };

    // Display report
    this.displayReport(report);

    // Save report to file
    await this.saveReport(report);
  }

  generateSummary() {
    const totalIssues = Object.values(this.issues).reduce(
      (sum, issueArray) => sum + issueArray.length,
      0,
    );
    const filesScanned = this.classes.size + this.functions.size;

    return {
      totalIssues,
      filesScanned,
      duplicateFunctions: this.issues.duplicateFunctions.length,
      redundantClasses: this.issues.redundantClasses.length,
      databaseIssues: this.issues.databaseConnectionDuplication.length,
      performanceIssues: this.issues.performanceIssues.length,
      errorPotentials: this.issues.errorPotentials.length,
      healthScore: this.calculateHealthScore(totalIssues, filesScanned),
    };
  }

  getCriticalIssues() {
    const critical = [];

    // High-severity duplicates
    this.issues.duplicateFunctions.forEach((dup) => {
      if (dup.severity === "high") {
        critical.push({
          type: "Duplicate Function",
          name: dup.name,
          severity: "high",
          impact: "Code maintainability and consistency",
        });
      }
    });

    // Database connection issues
    this.issues.databaseConnectionDuplication.forEach((dbIssue) => {
      critical.push({
        type: "Database Connection",
        issue: dbIssue.issue,
        severity: "medium",
        impact: "Performance and resource usage",
      });
    });

    // Performance issues
    this.issues.performanceIssues.forEach((perfIssue) => {
      perfIssue.issues.forEach((issue) => {
        if (issue.includes("memory") || issue.includes("Multiple database")) {
          critical.push({
            type: "Performance Issue",
            file: perfIssue.file,
            issue,
            severity: "high",
            impact: "Application performance and scalability",
          });
        }
      });
    });

    return critical;
  }

  generateRecommendations() {
    const recommendations = [];

    // Database recommendations
    if (this.databaseConnections.length > 5) {
      recommendations.push({
        priority: "high",
        category: "Database",
        recommendation: "Create a singleton DatabaseService class",
        files: ["src/services/DatabaseService.js"],
        benefit: "Reduce connection overhead and improve maintainability",
      });
    }

    // Function duplication recommendations
    if (this.issues.duplicateFunctions.length > 0) {
      const highSeverityDups = this.issues.duplicateFunctions.filter(
        (d) => d.severity === "high",
      );
      if (highSeverityDups.length > 0) {
        recommendations.push({
          priority: "medium",
          category: "Code Duplication",
          recommendation:
            "Consolidate duplicate functions into utility modules",
          affected: highSeverityDups.map((d) => d.name),
          benefit: "Improve code maintainability and reduce bugs",
        });
      }
    }

    // Performance recommendations
    if (this.issues.performanceIssues.length > 0) {
      recommendations.push({
        priority: "medium",
        category: "Performance",
        recommendation: "Implement streaming for large data processing",
        benefit: "Reduce memory usage and improve scalability",
      });
    }

    // Error handling recommendations
    if (this.issues.errorPotentials.length > 0) {
      recommendations.push({
        priority: "medium",
        category: "Error Handling",
        recommendation: "Add comprehensive try-catch blocks and null checks",
        benefit: "Improve application reliability and user experience",
      });
    }

    return recommendations;
  }

  displayReport(report) {
    console.log("🏥 CODEBASE HEALTH REPORT");
    console.log("=" * 50);

    // Summary
    console.log("\n📊 SUMMARY:");
    console.log(`Health Score: ${report.summary.healthScore}/100`);
    console.log(`Total Issues Found: ${report.summary.totalIssues}`);
    console.log(`Files Scanned: ${report.summary.filesScanned}`);

    // Critical Issues
    if (report.criticalIssues.length > 0) {
      console.log("\n🚨 CRITICAL ISSUES:");
      report.criticalIssues.forEach((issue, index) => {
        console.log(
          `${index + 1}. ${issue.type}: ${issue.issue || issue.name}`,
        );
        console.log(`   Severity: ${issue.severity.toUpperCase()}`);
        console.log(`   Impact: ${issue.impact}`);
        if (issue.file) {
          console.log(`   File: ${issue.file}`);
        }
        console.log("");
      });
    }

    // Top Recommendations
    console.log("\n💡 TOP RECOMMENDATIONS:");
    report.recommendations.slice(0, 5).forEach((rec, index) => {
      console.log(
        `${index + 1}. [${rec.priority.toUpperCase()}] ${rec.category}`,
      );
      console.log(`   ${rec.recommendation}`);
      console.log(`   Benefit: ${rec.benefit}`);
      console.log("");
    });

    // Detailed Issues
    console.log("\n🔍 DETAILED FINDINGS:");

    if (report.detailedFindings.duplicateFunctions.length > 0) {
      console.log("\n🔄 DUPLICATE FUNCTIONS:");
      report.detailedFindings.duplicateFunctions.forEach((dup) => {
        console.log(`- ${dup.name} (${dup.severity} severity)`);
        dup.occurrences.forEach((occ) => {
          console.log(`  → ${occ.file}:${occ.line || "?"}`);
        });
      });
    }

    if (report.detailedFindings.databaseConnectionDuplication.length > 0) {
      console.log("\n🗄️ DATABASE CONNECTION ISSUES:");
      report.detailedFindings.databaseConnectionDuplication.forEach(
        (dbIssue) => {
          console.log(`- ${dbIssue.issue}`);
          console.log(`  Files: ${dbIssue.files.join(", ")}`);
          console.log(`  Recommendation: ${dbIssue.recommendation}`);
        },
      );
    }

    if (report.detailedFindings.performanceIssues.length > 0) {
      console.log("\n⚡ PERFORMANCE ISSUES:");
      report.detailedFindings.performanceIssues.forEach((perfIssue) => {
        console.log(`- File: ${perfIssue.file}`);
        perfIssue.issues.forEach((issue) => {
          console.log(`  → ${issue}`);
        });
      });
    }

    if (report.detailedFindings.errorPotentials.length > 0) {
      console.log("\n⚠️ POTENTIAL ERRORS:");
      report.detailedFindings.errorPotentials.forEach((errorIssue) => {
        console.log(`- File: ${errorIssue.file}`);
        errorIssue.issues.forEach((issue) => {
          console.log(`  → ${issue}`);
        });
      });
    }

    console.log("\n✅ Health check complete!");
  }

  async saveReport(report) {
    const reportPath = path.join(__dirname, "../docs/HEALTH_CHECK_REPORT.md");

    let markdown = "# Codebase Health Check Report\n\n";
    markdown += `Generated: ${new Date().toISOString()}\n\n`;

    markdown += "## Summary\n\n";
    markdown += `- **Health Score**: ${report.summary.healthScore}/100\n`;
    markdown += `- **Total Issues**: ${report.summary.totalIssues}\n`;
    markdown += `- **Files Scanned**: ${report.summary.filesScanned}\n\n`;

    if (report.criticalIssues.length > 0) {
      markdown += "## Critical Issues\n\n";
      report.criticalIssues.forEach((issue, index) => {
        markdown += `### ${index + 1}. ${issue.type}\n`;
        markdown += `- **Issue**: ${issue.issue || issue.name}\n`;
        markdown += `- **Severity**: ${issue.severity}\n`;
        markdown += `- **Impact**: ${issue.impact}\n`;
        if (issue.file) {
          markdown += `- **File**: ${issue.file}\n`;
        }
        markdown += "\n";
      });
    }

    markdown += "## Recommendations\n\n";
    report.recommendations.forEach((rec, index) => {
      markdown += `### ${index + 1}. ${rec.category}\n`;
      markdown += `- **Priority**: ${rec.priority}\n`;
      markdown += `- **Recommendation**: ${rec.recommendation}\n`;
      markdown += `- **Benefit**: ${rec.benefit}\n\n`;
    });

    try {
      await fs.writeFile(reportPath, markdown);
      console.log(`📄 Report saved to: ${reportPath}`);
    } catch (error) {
      console.error("❌ Error saving report:", error);
    }
  }

  // Utility methods
  extractFunctionName(match) {
    const patterns = [
      /function\s+(\w+)/,
      /(\w+)\s*:\s*(?:async\s+)?(?:function\s*)?\(/,
      /async\s+(\w+)\s*\(/,
      /(\w+)\s*\(/,
    ];

    for (const pattern of patterns) {
      const result = match.match(pattern);
      if (result && result[1]) {
        return result[1];
      }
    }
    return null;
  }

  extractExportName(match) {
    const patterns = [
      /export\s+default\s+(?:class\s+)?(\w+)/,
      /export\s+(?:class\s+)?(\w+)/,
      /module\.exports\s*=\s*(\w+)/,
    ];

    for (const pattern of patterns) {
      const result = match.match(pattern);
      if (result && result[1]) {
        return result[1];
      }
    }
    return null;
  }

  getLineNumber(content, match) {
    const index = content.indexOf(match);
    return content.substring(0, index).split("\n").length;
  }

  isCommonName(name) {
    const commonNames = [
      "constructor",
      "render",
      "init",
      "setup",
      "destroy",
      "start",
      "stop",
    ];
    return commonNames.includes(name.toLowerCase());
  }

  calculateSeverity(funcName, files) {
    if (files.length > 3) {
      return "high";
    }
    if (funcName.includes("Process") || funcName.includes("Calculate")) {
      return "high";
    }
    if (files.some((f) => f.type === "service")) {
      return "medium";
    }
    return "low";
  }

  calculateHealthScore(totalIssues, filesScanned) {
    if (filesScanned === 0) {
      return 100;
    }
    const issueRatio = totalIssues / filesScanned;
    const score = Math.max(0, 100 - issueRatio * 20);
    return Math.round(score);
  }
}

// Run the health check
const healthCheck = new CodebaseHealthCheck();
await healthCheck.runHealthCheck();
