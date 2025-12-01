/**
 * Safe Migration Script: Neon DB → Supabase
 * Migrates all data from Netlify Neon database to Supabase
 *
 * IMPORTANT: This script preserves all data and creates backups
 *
 * Usage:
 *   node scripts/migrate-neon-to-supabase.js --audit    # Check what data exists
 *   node scripts/migrate-neon-to-supabase.js --backup   # Create backup
 *   node scripts/migrate-neon-to-supabase.js --migrate  # Run migration
 *   node scripts/migrate-neon-to-supabase.js --verify   # Verify migration
 */

import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const { Pool } = pg;

// Configuration
const NEON_DATABASE_URL = process.env.DATABASE_URL || process.env.VITE_NEON_DATABASE_URL;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const BACKUP_DIR = path.join(__dirname, '../backups/neon-migration');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
};

// Validate configuration
function validateConfig() {
  const errors = [];

  if (!NEON_DATABASE_URL) {
    errors.push('Missing Neon DATABASE_URL in .env');
  }
  if (!SUPABASE_URL) {
    errors.push('Missing SUPABASE_URL in .env');
  }
  if (!SUPABASE_SERVICE_KEY) {
    errors.push('Missing SUPABASE_SERVICE_KEY in .env');
  }

  if (errors.length > 0) {
    log.error('Configuration errors:');
    errors.forEach(err => log.error(`  - ${err}`));
    process.exit(1);
  }

  log.success('Configuration validated');
}

// Initialize connections
let neonPool = null;
let supabase = null;

async function initConnections() {
  try {
    // Connect to Neon
    neonPool = new Pool({
      connectionString: NEON_DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    // Test Neon connection
    await neonPool.query('SELECT NOW()');
    log.success('Connected to Neon database');

    // Connect to Supabase
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    log.success('Connected to Supabase');

    return { neonPool, supabase };
  } catch (error) {
    log.error('Failed to initialize connections:');
    log.error(error.message);
    process.exit(1);
  }
}

// Close connections
async function closeConnections() {
  if (neonPool) {
    await neonPool.end();
    log.info('Closed Neon connection');
  }
}

// Audit: Discover all tables and data
async function auditNeonDatabase() {
  log.header('📊 AUDITING NEON DATABASE');

  try {
    // Get all tables
    const tablesQuery = `
      SELECT
        table_name,
        pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as size
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY pg_total_relation_size(quote_ident(table_name)) DESC;
    `;

    const { rows: tables } = await neonPool.query(tablesQuery);

    if (tables.length === 0) {
      log.warning('No tables found in Neon database');
      return { tables: [], totalRows: 0 };
    }

    log.info(`Found ${tables.length} tables:\n`);

    const auditResults = [];
    let totalRows = 0;

    for (const table of tables) {
      // Get row count
      const countQuery = `SELECT COUNT(*) as count FROM ${table.table_name}`;
      const { rows: countResult } = await neonPool.query(countQuery);
      const rowCount = parseInt(countResult[0].count);
      totalRows += rowCount;

      // Get sample data
      const sampleQuery = `SELECT * FROM ${table.table_name} LIMIT 1`;
      const { rows: sampleData, fields } = await neonPool.query(sampleQuery);
      const columns = fields.map(f => f.name);

      auditResults.push({
        name: table.table_name,
        size: table.size,
        rowCount,
        columns,
        sampleData: sampleData[0]
      });

      console.log(`  📋 ${colors.bright}${table.table_name}${colors.reset}`);
      console.log(`     Rows: ${rowCount.toLocaleString()}`);
      console.log(`     Size: ${table.size}`);
      console.log(`     Columns: ${columns.join(', ')}`);
      console.log('');
    }

    log.success(`Total: ${totalRows.toLocaleString()} rows across ${tables.length} tables`);

    // Save audit report
    const auditReport = {
      timestamp: new Date().toISOString(),
      totalTables: tables.length,
      totalRows,
      tables: auditResults
    };

    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const auditFile = path.join(BACKUP_DIR, `audit-${Date.now()}.json`);
    fs.writeFileSync(auditFile, JSON.stringify(auditReport, null, 2));
    log.success(`Audit report saved: ${auditFile}`);

    return auditReport;
  } catch (error) {
    log.error('Audit failed:');
    log.error(error.message);
    throw error;
  }
}

// Backup: Export all data to JSON files
async function backupNeonDatabase(auditReport) {
  log.header('💾 CREATING BACKUP');

  if (!auditReport) {
    auditReport = await auditNeonDatabase();
  }

  try {
    const backupTimestamp = Date.now();
    const backupPath = path.join(BACKUP_DIR, `backup-${backupTimestamp}`);

    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
    }

    log.info(`Backup location: ${backupPath}\n`);

    for (const table of auditReport.tables) {
      log.info(`Backing up ${table.name} (${table.rowCount} rows)...`);

      // Export all data
      const query = `SELECT * FROM ${table.name}`;
      const { rows } = await neonPool.query(query);

      // Save to JSON
      const tableBackupFile = path.join(backupPath, `${table.name}.json`);
      fs.writeFileSync(tableBackupFile, JSON.stringify(rows, null, 2));

      // Also save as SQL
      const sqlFile = path.join(backupPath, `${table.name}.sql`);
      const sqlDump = generateInsertStatements(table.name, rows);
      fs.writeFileSync(sqlFile, sqlDump);

      log.success(`  ✓ ${table.name} backed up (${rows.length} rows)`);
    }

    // Create backup metadata
    const metadata = {
      timestamp: new Date().toISOString(),
      neonDatabaseUrl: NEON_DATABASE_URL.replace(/:[^:]*@/, ':***@'), // Hide password
      totalTables: auditReport.tables.length,
      totalRows: auditReport.totalRows,
      tables: auditReport.tables.map(t => ({
        name: t.name,
        rowCount: t.rowCount,
        columns: t.columns
      }))
    };

    fs.writeFileSync(
      path.join(backupPath, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    log.success(`\nBackup complete! All data saved to:\n  ${backupPath}`);
    return backupPath;
  } catch (error) {
    log.error('Backup failed:');
    log.error(error.message);
    throw error;
  }
}

// Generate SQL INSERT statements from data
function generateInsertStatements(tableName, rows) {
  if (rows.length === 0) return '';

  const columns = Object.keys(rows[0]);
  let sql = `-- Data for table: ${tableName}\n`;
  sql += `-- Generated: ${new Date().toISOString()}\n\n`;

  for (const row of rows) {
    const values = columns.map(col => {
      const val = row[col];
      if (val === null) return 'NULL';
      if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
      if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
      if (val instanceof Date) return `'${val.toISOString()}'`;
      if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
      return val;
    }).join(', ');

    sql += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values});\n`;
  }

  return sql;
}

// Migrate: Transfer data from Neon to Supabase
async function migrateData(auditReport) {
  log.header('🚀 MIGRATING DATA');

  if (!auditReport) {
    auditReport = await auditNeonDatabase();
  }

  const migrationResults = {
    timestamp: new Date().toISOString(),
    tablesProcessed: 0,
    rowsMigrated: 0,
    errors: []
  };

  try {
    for (const table of auditReport.tables) {
      log.info(`Migrating ${table.name} (${table.rowCount} rows)...`);

      try {
        // Fetch all data from Neon
        const query = `SELECT * FROM ${table.name}`;
        const { rows: neonData } = await neonPool.query(query);

        if (neonData.length === 0) {
          log.warning(`  ⊘ ${table.name} is empty, skipping`);
          continue;
        }

        // Check if table exists in Supabase
        const { data: existingData, error: checkError } = await supabase
          .from(table.name)
          .select('*')
          .limit(1);

        if (checkError) {
          if (checkError.message.includes('does not exist')) {
            log.warning(`  ⚠ Table ${table.name} doesn't exist in Supabase yet`);
            log.info(`    Creating table ${table.name}...`);

            // Generate CREATE TABLE statement
            const createTableSQL = await generateCreateTableSQL(table.name);
            log.info(`    SQL: ${createTableSQL}`);
            log.warning(`    Please create this table in Supabase SQL Editor first`);

            migrationResults.errors.push({
              table: table.name,
              error: 'Table does not exist in Supabase',
              createSQL: createTableSQL
            });
            continue;
          }
          throw checkError;
        }

        // Migrate data in batches (Supabase has a limit)
        const BATCH_SIZE = 1000;
        let migratedCount = 0;

        for (let i = 0; i < neonData.length; i += BATCH_SIZE) {
          const batch = neonData.slice(i, i + BATCH_SIZE);

          const { data, error } = await supabase
            .from(table.name)
            .upsert(batch, {
              onConflict: 'id', // Assuming 'id' is primary key
              ignoreDuplicates: false
            });

          if (error) {
            log.error(`  ✗ Error migrating batch ${i}-${i + batch.length}:`);
            log.error(`    ${error.message}`);
            migrationResults.errors.push({
              table: table.name,
              batch: `${i}-${i + batch.length}`,
              error: error.message
            });
          } else {
            migratedCount += batch.length;
            log.info(`    ${migratedCount}/${neonData.length} rows migrated`);
          }
        }

        log.success(`  ✓ ${table.name} migrated (${migratedCount} rows)`);
        migrationResults.tablesProcessed++;
        migrationResults.rowsMigrated += migratedCount;
      } catch (tableError) {
        log.error(`  ✗ Failed to migrate ${table.name}:`);
        log.error(`    ${tableError.message}`);
        migrationResults.errors.push({
          table: table.name,
          error: tableError.message
        });
      }
    }

    // Save migration report
    const reportFile = path.join(BACKUP_DIR, `migration-report-${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(migrationResults, null, 2));

    log.header('📊 MIGRATION SUMMARY');
    log.info(`Tables processed: ${migrationResults.tablesProcessed}/${auditReport.tables.length}`);
    log.info(`Total rows migrated: ${migrationResults.rowsMigrated.toLocaleString()}`);
    log.info(`Errors: ${migrationResults.errors.length}`);

    if (migrationResults.errors.length > 0) {
      log.warning('\nErrors encountered:');
      migrationResults.errors.forEach(err => {
        log.warning(`  - ${err.table}: ${err.error}`);
      });
    }

    log.success(`\nMigration report saved: ${reportFile}`);
    return migrationResults;
  } catch (error) {
    log.error('Migration failed:');
    log.error(error.message);
    throw error;
  }
}

// Generate CREATE TABLE SQL from Neon schema
async function generateCreateTableSQL(tableName) {
  const query = `
    SELECT
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_name = $1
    ORDER BY ordinal_position;
  `;

  const { rows: columns } = await neonPool.query(query, [tableName]);

  let sql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
  const columnDefs = columns.map(col => {
    let def = `  ${col.column_name} ${col.data_type}`;
    if (col.is_nullable === 'NO') def += ' NOT NULL';
    if (col.column_default) def += ` DEFAULT ${col.column_default}`;
    return def;
  });

  sql += columnDefs.join(',\n');
  sql += '\n);';

  return sql;
}

// Verify: Compare data between Neon and Supabase
async function verifyMigration(auditReport) {
  log.header('🔍 VERIFYING MIGRATION');

  if (!auditReport) {
    auditReport = await auditNeonDatabase();
  }

  const verificationResults = {
    timestamp: new Date().toISOString(),
    tablesVerified: 0,
    discrepancies: []
  };

  try {
    for (const table of auditReport.tables) {
      log.info(`Verifying ${table.name}...`);

      // Count rows in Neon
      const { rows: neonCount } = await neonPool.query(
        `SELECT COUNT(*) as count FROM ${table.name}`
      );
      const neonRowCount = parseInt(neonCount[0].count);

      // Count rows in Supabase
      const { count: supabaseRowCount, error } = await supabase
        .from(table.name)
        .select('*', { count: 'exact', head: true });

      if (error) {
        log.error(`  ✗ Error checking ${table.name} in Supabase:`);
        log.error(`    ${error.message}`);
        verificationResults.discrepancies.push({
          table: table.name,
          issue: 'Failed to query Supabase',
          error: error.message
        });
        continue;
      }

      if (neonRowCount !== supabaseRowCount) {
        log.warning(`  ⚠ Row count mismatch:`);
        log.warning(`    Neon: ${neonRowCount}`);
        log.warning(`    Supabase: ${supabaseRowCount}`);
        verificationResults.discrepancies.push({
          table: table.name,
          issue: 'Row count mismatch',
          neonCount: neonRowCount,
          supabaseCount: supabaseRowCount
        });
      } else {
        log.success(`  ✓ ${table.name} verified (${neonRowCount} rows match)`);
        verificationResults.tablesVerified++;
      }
    }

    // Save verification report
    const reportFile = path.join(BACKUP_DIR, `verification-report-${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(verificationResults, null, 2));

    log.header('📊 VERIFICATION SUMMARY');
    log.info(`Tables verified: ${verificationResults.tablesVerified}/${auditReport.tables.length}`);
    log.info(`Discrepancies: ${verificationResults.discrepancies.length}`);

    if (verificationResults.discrepancies.length > 0) {
      log.warning('\nDiscrepancies found:');
      verificationResults.discrepancies.forEach(disc => {
        log.warning(`  - ${disc.table}: ${disc.issue}`);
      });
    } else {
      log.success('\n🎉 All data verified successfully!');
    }

    log.success(`\nVerification report saved: ${reportFile}`);
    return verificationResults;
  } catch (error) {
    log.error('Verification failed:');
    log.error(error.message);
    throw error;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  log.header('🔄 NEON → SUPABASE MIGRATION TOOL');

  // Validate configuration
  validateConfig();

  // Initialize connections
  await initConnections();

  try {
    switch (command) {
      case '--audit':
        await auditNeonDatabase();
        break;

      case '--backup':
        await backupNeonDatabase();
        break;

      case '--migrate':
        const auditForMigrate = await auditNeonDatabase();
        log.warning('\n⚠️  IMPORTANT: Review the audit above before proceeding!');
        log.info('This will migrate all data to Supabase.');
        log.info('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
        await new Promise(resolve => setTimeout(resolve, 5000));

        await backupNeonDatabase(auditForMigrate);
        await migrateData(auditForMigrate);
        break;

      case '--verify':
        await verifyMigration();
        break;

      case '--full':
        // Full migration with all steps
        const audit = await auditNeonDatabase();

        log.warning('\n⚠️  FULL MIGRATION SEQUENCE');
        log.info('This will: audit → backup → migrate → verify');
        log.info('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
        await new Promise(resolve => setTimeout(resolve, 5000));

        const backupPath = await backupNeonDatabase(audit);
        const migrationResults = await migrateData(audit);
        const verificationResults = await verifyMigration(audit);

        log.header('🎉 MIGRATION COMPLETE!');
        log.success(`Backup saved: ${backupPath}`);
        log.success(`Migrated: ${migrationResults.rowsMigrated} rows`);
        log.success(`Verified: ${verificationResults.tablesVerified} tables`);

        if (verificationResults.discrepancies.length === 0 && migrationResults.errors.length === 0) {
          log.success('\n✅ All data successfully migrated and verified!');
          log.info('\nNext steps:');
          log.info('  1. Test your application with Supabase');
          log.info('  2. Update environment variables to remove Neon');
          log.info('  3. Keep backup for 30 days before deleting Neon');
        } else {
          log.warning('\n⚠️  Migration completed with issues. Review reports before proceeding.');
        }
        break;

      default:
        console.log('\nUsage:');
        console.log('  node scripts/migrate-neon-to-supabase.js --audit     # Check what data exists');
        console.log('  node scripts/migrate-neon-to-supabase.js --backup    # Create backup');
        console.log('  node scripts/migrate-neon-to-supabase.js --migrate   # Run migration');
        console.log('  node scripts/migrate-neon-to-supabase.js --verify    # Verify migration');
        console.log('  node scripts/migrate-neon-to-supabase.js --full      # Do everything');
        console.log('');
        process.exit(1);
    }
  } finally {
    await closeConnections();
  }
}

// Run the script
main().catch(error => {
  log.error('Fatal error:');
  console.error(error);
  process.exit(1);
});
