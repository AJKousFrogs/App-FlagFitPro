/**
 * Generate Supabase Schema from Neon
 * Creates SQL script to set up tables in Supabase
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const { Pool } = pg;

const NEON_DATABASE_URL = process.env.DATABASE_URL || process.env.VITE_NEON_DATABASE_URL;
const OUTPUT_DIR = path.join(__dirname, '../backups/neon-migration');

async function generateSupabaseSchema(onlyTablesWithData = true) {
  console.log('🔄 Generating Supabase Schema...\n');

  const pool = new Pool({
    connectionString: NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Get audit report to know which tables have data
    const auditFiles = fs.readdirSync(OUTPUT_DIR)
      .filter(f => f.startsWith('audit-'))
      .sort()
      .reverse();

    if (auditFiles.length === 0) {
      console.error('❌ No audit report found. Run --audit first.');
      process.exit(1);
    }

    const auditData = JSON.parse(
      fs.readFileSync(path.join(OUTPUT_DIR, auditFiles[0]), 'utf8')
    );

    console.log(`📊 Found ${auditData.totalTables} tables in audit`);
    console.log(`   ${auditData.totalRows} total rows\n`);

    // Filter tables
    let tablesToCreate = auditData.tables;
    if (onlyTablesWithData) {
      tablesToCreate = auditData.tables.filter(t => t.rowCount > 0);
      console.log(`✅ Creating schema for ${tablesToCreate.length} tables with data`);
      console.log(`⏭️  Skipping ${auditData.totalTables - tablesToCreate.length} empty tables\n`);
    } else {
      console.log(`✅ Creating schema for all ${tablesToCreate.length} tables\n`);
    }

    let sqlScript = `-- Supabase Schema Migration
-- Generated: ${new Date().toISOString()}
-- Source: Neon Database
-- Tables: ${tablesToCreate.length}
-- Total Rows: ${tablesToCreate.reduce((sum, t) => sum + t.rowCount, 0)}

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

`;

    // Generate CREATE TABLE for each table
    for (const table of tablesToCreate) {
      console.log(`📋 Processing ${table.name} (${table.rowCount} rows)...`);

      // Get table schema
      const schemaQuery = `
        SELECT
          column_name,
          data_type,
          character_maximum_length,
          is_nullable,
          column_default,
          udt_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = $1
        ORDER BY ordinal_position;
      `;

      const { rows: columns } = await pool.query(schemaQuery, [table.name]);

      // Get primary key
      const pkQuery = `
        SELECT a.attname
        FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = $1::regclass
          AND i.indisprimary;
      `;

      const { rows: pkRows } = await pool.query(pkQuery, ['public.' + table.name]);
      const primaryKeys = pkRows.map(r => r.attname);

      // Generate CREATE TABLE statement
      sqlScript += `\n-- Table: ${table.name}\n`;
      sqlScript += `-- Rows: ${table.rowCount}\n`;
      sqlScript += `DROP TABLE IF EXISTS ${table.name} CASCADE;\n`;
      sqlScript += `CREATE TABLE ${table.name} (\n`;

      const columnDefs = columns.map(col => {
        let def = `  ${col.column_name}`;

        // Map PostgreSQL types to Supabase-compatible types
        let dataType = col.data_type;
        if (col.udt_name === 'uuid') {
          dataType = 'UUID';
        } else if (dataType === 'character varying') {
          dataType = col.character_maximum_length
            ? `VARCHAR(${col.character_maximum_length})`
            : 'TEXT';
        } else if (dataType === 'timestamp without time zone') {
          dataType = 'TIMESTAMP';
        } else if (dataType === 'timestamp with time zone') {
          dataType = 'TIMESTAMPTZ';
        } else if (dataType === 'ARRAY') {
          dataType = col.udt_name.replace('_', '') + '[]';
        } else if (dataType === 'USER-DEFINED') {
          dataType = 'TEXT'; // Convert enums to text for simplicity
        }

        def += ` ${dataType.toUpperCase()}`;

        // Add NOT NULL constraint
        if (col.is_nullable === 'NO') {
          def += ' NOT NULL';
        }

        // Add DEFAULT
        if (col.column_default) {
          let defaultValue = col.column_default;
          // Clean up common defaults
          if (defaultValue.includes('uuid_generate_v4()')) {
            defaultValue = 'uuid_generate_v4()';
          } else if (defaultValue.includes('now()')) {
            defaultValue = 'NOW()';
          } else if (defaultValue.includes('CURRENT_TIMESTAMP')) {
            defaultValue = 'CURRENT_TIMESTAMP';
          }
          def += ` DEFAULT ${defaultValue}`;
        }

        return def;
      });

      sqlScript += columnDefs.join(',\n');

      // Add primary key constraint
      if (primaryKeys.length > 0) {
        sqlScript += `,\n  PRIMARY KEY (${primaryKeys.join(', ')})`;
      }

      sqlScript += `\n);\n`;

      // Add indexes (optional - comment out if not needed)
      sqlScript += `\n-- Indexes for ${table.name}\n`;
      if (columns.some(c => c.column_name === 'created_at')) {
        sqlScript += `CREATE INDEX idx_${table.name}_created_at ON ${table.name}(created_at DESC);\n`;
      }
      if (columns.some(c => c.column_name === 'user_id')) {
        sqlScript += `CREATE INDEX idx_${table.name}_user_id ON ${table.name}(user_id);\n`;
      }

      sqlScript += '\n';
    }

    // Add Row Level Security (RLS) boilerplate
    sqlScript += `\n-- Row Level Security (RLS)
-- Uncomment and customize as needed

`;

    for (const table of tablesToCreate) {
      sqlScript += `-- ALTER TABLE ${table.name} ENABLE ROW LEVEL SECURITY;\n`;
      sqlScript += `-- CREATE POLICY "${table.name}_select_policy" ON ${table.name} FOR SELECT USING (true);\n`;
      sqlScript += `-- CREATE POLICY "${table.name}_insert_policy" ON ${table.name} FOR INSERT WITH CHECK (auth.uid() = user_id);\n\n`;
    }

    // Write to file
    const timestamp = Date.now();
    const filename = onlyTablesWithData
      ? `supabase-schema-active-tables-${timestamp}.sql`
      : `supabase-schema-all-tables-${timestamp}.sql`;

    const filepath = path.join(OUTPUT_DIR, filename);
    fs.writeFileSync(filepath, sqlScript);

    console.log(`\n✅ Schema SQL generated successfully!`);
    console.log(`📄 File: ${filepath}`);
    console.log(`\n📋 Summary:`);
    console.log(`   Tables: ${tablesToCreate.length}`);
    console.log(`   Total rows to migrate: ${tablesToCreate.reduce((sum, t) => sum + t.rowCount, 0)}`);
    console.log(`\n🚀 Next steps:`);
    console.log(`   1. Open Supabase SQL Editor:`);
    console.log(`      https://supabase.com/dashboard/project/pvzicicwxgftcielnm/sql`);
    console.log(`   2. Copy and paste the SQL from: ${filename}`);
    console.log(`   3. Run the SQL to create tables`);
    console.log(`   4. Then re-run: node scripts/migrate-neon-to-supabase.js --migrate\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Parse command line args
const args = process.argv.slice(2);
const allTables = args.includes('--all');

generateSupabaseSchema(!allTables);
