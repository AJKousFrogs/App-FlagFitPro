#!/usr/bin/env node
/**
 * Comprehensive Audit: API Endpoints vs Database Tables vs Frontend Calls
 * 
 * This script:
 * 1. Extracts all API endpoints from netlify/functions
 * 2. Extracts all database tables from migrations
 * 3. Extracts all frontend API calls from Angular services
 * 4. Compares them to find mismatches
 * 5. Generates a report
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..');
const OUTPUT_FILE = path.join(PROJECT_ROOT, 'ENDPOINT_TABLE_AUDIT_REPORT.json');

// Extract API endpoints from netlify functions
function extractNetlifyEndpoints() {
  const functionsDir = path.join(PROJECT_ROOT, 'netlify/functions');
  const endpoints = new Set();
  
  if (!fs.existsSync(functionsDir)) {
    console.warn('netlify/functions directory not found');
    return endpoints;
  }
  
  const files = fs.readdirSync(functionsDir).filter(f => f.endsWith('.cjs'));
  
  for (const file of files) {
    const filePath = path.join(functionsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract route patterns
    const routePatterns = [
      /path\s*[=:]\s*['"`]([^'"`]+)['"`]/g,
      /\/api\/[a-z0-9\-/]+/gi,
      /endpoint['"`]\s*:\s*['"`]([^'"`]+)['"`]/g,
    ];
    
    routePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const endpoint = match[1] || match[0];
        if (endpoint && endpoint.startsWith('/')) {
          endpoints.add(endpoint);
        }
      }
    });
    
    // Also check function name -> endpoint mapping
    const funcName = file.replace('.cjs', '');
    if (funcName !== 'index') {
      endpoints.add(`/api/${funcName.replace(/-/g, '/')}`);
    }
  }
  
  return Array.from(endpoints).sort();
}

// Extract database tables from migrations
function extractDatabaseTables() {
  const migrationsDir = path.join(PROJECT_ROOT, 'database/migrations');
  const tables = new Set();
  
  if (!fs.existsSync(migrationsDir)) {
    console.warn('database/migrations directory not found');
    return tables;
  }
  
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
  
  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract CREATE TABLE statements
    const createTableRegex = /CREATE\s+(?:OR\s+REPLACE\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-z_][a-z0-9_]*)/gi;
    let match;
    while ((match = createTableRegex.exec(content)) !== null) {
      tables.add(match[1].toLowerCase());
    }
  }
  
  // Also check supabase migrations
  const supabaseDir = path.join(PROJECT_ROOT, 'supabase');
  if (fs.existsSync(supabaseDir)) {
    const supabaseFiles = fs.readdirSync(supabaseDir, { recursive: true })
      .filter(f => f.endsWith('.sql'));
    
    for (const file of supabaseFiles) {
      const filePath = path.join(supabaseDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      const createTableRegex = /CREATE\s+(?:OR\s+REPLACE\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-z_][a-z0-9_]*)/gi;
      let match;
      while ((match = createTableRegex.exec(content)) !== null) {
        tables.add(match[1].toLowerCase());
      }
    }
  }
  
  return Array.from(tables).sort();
}

// Extract frontend API calls from Angular services
function extractFrontendCalls() {
  const angularDir = path.join(PROJECT_ROOT, 'angular/src');
  const calls = new Set();
  
  if (!fs.existsSync(angularDir)) {
    console.warn('angular/src directory not found');
    return calls;
  }
  
  // Find all TypeScript service files
  const findFiles = (dir, fileList = []) => {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory() && !filePath.includes('node_modules')) {
        findFiles(filePath, fileList);
      } else if (file.endsWith('.ts') && (file.includes('service') || file.includes('api'))) {
        fileList.push(filePath);
      }
    });
    return fileList;
  };
  
  const serviceFiles = findFiles(angularDir);
  
  for (const filePath of serviceFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract API endpoint patterns
    const patterns = [
      /['"`](\/api\/[^'"`]+)['"`]/g,
      /['"`](\/auth-me)['"`]/g,
      /endpoint['"`]\s*:\s*['"`]([^'"`]+)['"`]/g,
      /API_ENDPOINTS\.[a-z]+\.[a-z]+\s*[:=]\s*['"`]([^'"`]+)['"`]/g,
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const endpoint = match[1] || match[0];
        if (endpoint && (endpoint.startsWith('/api/') || endpoint.startsWith('/auth'))) {
          calls.add(endpoint);
        }
      }
    });
  }
  
  return Array.from(calls).sort();
}

// Main audit function
function runAudit() {
  console.log('🔍 Starting comprehensive endpoint/table audit...\n');
  
  console.log('1. Extracting API endpoints from netlify functions...');
  const endpoints = extractNetlifyEndpoints();
  console.log(`   Found ${endpoints.length} endpoints\n`);
  
  console.log('2. Extracting database tables from migrations...');
  const tables = extractDatabaseTables();
  console.log(`   Found ${tables.length} tables\n`);
  
  console.log('3. Extracting frontend API calls...');
  const frontendCalls = extractFrontendCalls();
  console.log(`   Found ${frontendCalls.length} frontend calls\n`);
  
  // Analyze mismatches
  const report = {
    timestamp: new Date().toISOString(),
    endpoints: endpoints,
    tables: tables,
    frontendCalls: frontendCalls,
    analysis: {
      endpointsWithoutTables: [],
      tablesWithoutEndpoints: [],
      frontendCallsWithoutEndpoints: [],
      endpointsWithoutFrontendCalls: [],
    }
  };
  
  // Find endpoints that reference tables that don't exist
  endpoints.forEach(endpoint => {
    const tableName = endpoint.split('/').pop().replace(/-/g, '_');
    if (tableName && !tables.includes(tableName) && tableName.length > 2) {
      // Check if any table contains this name
      const matchingTable = tables.find(t => t.includes(tableName) || tableName.includes(t));
      if (!matchingTable) {
        report.analysis.endpointsWithoutTables.push({
          endpoint,
          expectedTable: tableName,
        });
      }
    }
  });
  
  // Find frontend calls that don't have corresponding endpoints
  frontendCalls.forEach(call => {
    const normalizedCall = call.replace(/\/api\//, '').replace(/\//g, '-');
    const matchingEndpoint = endpoints.find(e => 
      e.includes(call) || call.includes(e.replace('/api/', ''))
    );
    if (!matchingEndpoint) {
      report.analysis.frontendCallsWithoutEndpoints.push({
        frontendCall: call,
      });
    }
  });
  
  // Find endpoints that aren't called from frontend
  endpoints.forEach(endpoint => {
    const matchingCall = frontendCalls.find(c => 
      c.includes(endpoint) || endpoint.includes(c.replace('/api/', ''))
    );
    if (!matchingCall) {
      report.analysis.endpointsWithoutFrontendCalls.push({
        endpoint,
      });
    }
  });
  
  // Save report
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2));
  
  console.log('📊 Audit Report Summary:');
  console.log(`   Endpoints: ${endpoints.length}`);
  console.log(`   Tables: ${tables.length}`);
  console.log(`   Frontend Calls: ${frontendCalls.length}`);
  console.log(`\n   ⚠️  Endpoints without matching tables: ${report.analysis.endpointsWithoutTables.length}`);
  console.log(`   ⚠️  Frontend calls without endpoints: ${report.analysis.frontendCallsWithoutEndpoints.length}`);
  console.log(`   ⚠️  Endpoints without frontend calls: ${report.analysis.endpointsWithoutFrontendCalls.length}`);
  console.log(`\n📄 Full report saved to: ${OUTPUT_FILE}\n`);
  
  return report;
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAudit();
}

export { runAudit, extractNetlifyEndpoints, extractDatabaseTables, extractFrontendCalls };
