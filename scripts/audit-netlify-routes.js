#!/usr/bin/env node
/**
 * Audit netlify.toml routes against codebase
 * Finds:
 * 1. Routes pointing to non-existent functions
 * 2. Functions without routes
 * 3. Inconsistent route patterns
 * 4. Frontend calls to missing routes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Read netlify.toml
function parseNetlifyToml() {
  const tomlPath = path.join(PROJECT_ROOT, 'netlify.toml');
  const content = fs.readFileSync(tomlPath, 'utf8');
  
  const routes = [];
  const redirectRegex = /\[\[redirects\]\]\s*\n\s*from\s*=\s*"([^"]+)"\s*\n\s*to\s*=\s*"([^"]+)"\s*\n\s*status\s*=\s*(\d+)/g;
  
  let match;
  while ((match = redirectRegex.exec(content)) !== null) {
    routes.push({
      from: match[1],
      to: match[2],
      status: parseInt(match[3]),
    });
  }
  
  return routes;
}

// Get all netlify functions
function getNetlifyFunctions() {
  const functionsDir = path.join(PROJECT_ROOT, 'netlify/functions');
  if (!fs.existsSync(functionsDir)) {
    return [];
  }
  
  const functions = new Set();
  const files = fs.readdirSync(functionsDir);
  
  files.forEach(file => {
    if (file.endsWith('.cjs') || file.endsWith('.js')) {
      functions.add(file.replace(/\.(cjs|js)$/, ''));
    }
  });
  
  return Array.from(functions).sort();
}

// Extract function name from route path
function extractFunctionName(route) {
  // Remove /.netlify/functions/ prefix
  const match = route.match(/\/\.netlify\/functions\/([^/]+)/);
  return match ? match[1] : null;
}

// Get frontend API calls
function getFrontendApiCalls() {
  const angularDir = path.join(PROJECT_ROOT, 'angular/src');
  const calls = new Set();
  
  if (!fs.existsSync(angularDir)) {
    return calls;
  }
  
  const findFiles = (dir, fileList = []) => {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory() && !filePath.includes('node_modules')) {
        findFiles(filePath, fileList);
      } else if (file.endsWith('.ts') || file.endsWith('.js')) {
        fileList.push(filePath);
      }
    });
    return fileList;
  };
  
  const files = findFiles(angularDir);
  
  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8');
    const apiPattern = /['"`](\/api\/[^'"`]+)['"`]/g;
    let match;
    while ((match = apiPattern.exec(content)) !== null) {
      calls.add(match[1]);
    }
  }
  
  return Array.from(calls).sort();
}

// Main audit
function auditNetlifyRoutes() {
  console.log('🔍 Auditing netlify.toml routes...\n');
  
  const routes = parseNetlifyToml();
  const functions = getNetlifyFunctions();
  const frontendCalls = getFrontendApiCalls();
  
  console.log(`📊 Statistics:`);
  console.log(`   Routes in netlify.toml: ${routes.length}`);
  console.log(`   Netlify functions: ${functions.length}`);
  console.log(`   Frontend API calls: ${frontendCalls.size}\n`);
  
  const issues = {
    routesToNonExistentFunctions: [],
    functionsWithoutRoutes: [],
    frontendCallsWithoutRoutes: [],
    inconsistentPatterns: [],
  };
  
  // Check routes pointing to non-existent functions
  const functionSet = new Set(functions);
  routes.forEach(route => {
    if (route.to.startsWith('/.netlify/functions/')) {
      const funcName = extractFunctionName(route.to);
      if (funcName && !functionSet.has(funcName)) {
        issues.routesToNonExistentFunctions.push({
          route: route.from,
          function: funcName,
          to: route.to,
        });
      }
    }
  });
  
  // Check functions without routes
  const routedFunctions = new Set();
  routes.forEach(route => {
    if (route.to.startsWith('/.netlify/functions/')) {
      const funcName = extractFunctionName(route.to);
      if (funcName) {
        routedFunctions.add(funcName);
      }
    }
  });
  
  functions.forEach(func => {
    if (!routedFunctions.has(func)) {
      issues.functionsWithoutRoutes.push(func);
    }
  });
  
  // Check frontend calls without routes
  const routeSet = new Set(routes.map(r => r.from));
  frontendCalls.forEach(call => {
    // Check if call matches any route pattern
    let matched = false;
    for (const route of routes) {
      const pattern = route.from.replace(/\*/g, '.*').replace(/\$/, '\\$');
      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(call)) {
        matched = true;
        break;
      }
    }
    if (!matched) {
      issues.frontendCallsWithoutRoutes.push(call);
    }
  });
  
  // Check for inconsistent patterns (same function with different route patterns)
  const functionRoutes = {};
  routes.forEach(route => {
    if (route.to.startsWith('/.netlify/functions/')) {
      const funcName = extractFunctionName(route.to);
      if (funcName) {
        if (!functionRoutes[funcName]) {
          functionRoutes[funcName] = [];
        }
        functionRoutes[funcName].push(route.from);
      }
    }
  });
  
  Object.entries(functionRoutes).forEach(([func, routePatterns]) => {
    if (routePatterns.length > 1) {
      // Check if patterns are consistent (e.g., /api/x and /api/x/*)
      const normalized = routePatterns.map(p => p.replace(/\/\*$/, ''));
      const unique = new Set(normalized);
      if (unique.size > 1) {
        issues.inconsistentPatterns.push({
          function: func,
          patterns: routePatterns,
        });
      }
    }
  });
  
  // Report
  console.log('📋 Audit Results:\n');
  
  if (issues.routesToNonExistentFunctions.length > 0) {
    console.log(`❌ Routes pointing to non-existent functions (${issues.routesToNonExistentFunctions.length}):`);
    issues.routesToNonExistentFunctions.forEach(issue => {
      console.log(`   - ${issue.route} → ${issue.function} (does not exist)`);
    });
    console.log('');
  } else {
    console.log('✅ All routes point to existing functions\n');
  }
  
  if (issues.functionsWithoutRoutes.length > 0) {
    console.log(`⚠️  Functions without routes (${issues.functionsWithoutRoutes.length}):`);
    issues.functionsWithoutRoutes.forEach(func => {
      console.log(`   - ${func}.cjs`);
    });
    console.log('');
  } else {
    console.log('✅ All functions have routes\n');
  }
  
  if (issues.frontendCallsWithoutRoutes.length > 0) {
    console.log(`⚠️  Frontend calls without matching routes (${issues.frontendCallsWithoutRoutes.length}):`);
    issues.frontendCallsWithoutRoutes.slice(0, 20).forEach(call => {
      console.log(`   - ${call}`);
    });
    if (issues.frontendCallsWithoutRoutes.length > 20) {
      console.log(`   ... and ${issues.frontendCallsWithoutRoutes.length - 20} more`);
    }
    console.log('');
  } else {
    console.log('✅ All frontend calls have matching routes\n');
  }
  
  if (issues.inconsistentPatterns.length > 0) {
    console.log(`⚠️  Inconsistent route patterns (${issues.inconsistentPatterns.length}):`);
    issues.inconsistentPatterns.forEach(issue => {
      console.log(`   - ${issue.function}:`);
      issue.patterns.forEach(p => console.log(`     ${p}`));
    });
    console.log('');
  } else {
    console.log('✅ Route patterns are consistent\n');
  }
  
  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    statistics: {
      routes: routes.length,
      functions: functions.length,
      frontendCalls: frontendCalls.size,
    },
    issues,
  };
  
  const reportPath = path.join(PROJECT_ROOT, 'NETLIFY_ROUTES_AUDIT_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 Detailed report saved to: ${reportPath}\n`);
  
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  auditNetlifyRoutes();
}

export { auditNetlifyRoutes, parseNetlifyToml, getNetlifyFunctions };
