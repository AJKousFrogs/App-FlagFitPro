/* eslint-disable no-console */
/**
 * Generate Supabase Schema from Neon (FIXED VERSION)
 * Creates SQL script with proper sequences
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
  console.log('🔄 Generating Supabase Schema (FIXED)...\n');

  const pool = new Pool({
    connectionString: NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Get audit report
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

    // Filter tables
    let tablesToCreate = auditData.tables;
    if (onlyTablesWithData) {
      tablesToCreate = auditData.tables.filter(t => t.rowCount > 0);
      console.log(`✅ Creating schema for ${tablesToCreate.length} tables with data\n`);
    }

    let sqlScript = `-- Supabase Schema Migration (FIXED)
-- Generated: ${new Date().toISOString()}
-- Source: Neon Database
-- Tables: ${tablesToCreate.length}
-- Total Rows: ${tablesToCreate.reduce((sum, t) => sum + t.rowCount, 0)}

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

      // Create sequence for auto-increment columns
      const autoIncrementCols = columns.filter(col =>
        col.column_default && col.column_default.includes('nextval')
      );

      for (const col of autoIncrementCols) {
        const seqMatch = col.column_default.match(/'([^']+)'/);
        if (seqMatch) {
          const seqName = seqMatch[1];
          sqlScript += `DROP SEQUENCE IF EXISTS ${seqName} CASCADE;\n`;
          sqlScript += `CREATE SEQUENCE ${seqName};\n`;
        }
      }

      sqlScript += `CREATE TABLE ${table.name} (\n`;

      const columnDefs = columns.map(col => {
        let def = `  ${col.column_name}`;

        // Handle auto-increment columns - use SERIAL instead of nextval
        if (col.column_default && col.column_default.includes('nextval')) {
          if (col.data_type === 'integer') {
            def += ' SERIAL';
            if (col.is_nullable === 'NO') {
              def += ' NOT NULL';
            }
            return def;
          } else if (col.data_type === 'bigint') {
            def += ' BIGSERIAL';
            if (col.is_nullable === 'NO') {
              def += ' NOT NULL';
            }
            return def;
          }
        }

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
          dataType = 'TEXT';
        }

        def += ` ${dataType.toUpperCase()}`;

        // Add NOT NULL constraint
        if (col.is_nullable === 'NO') {
          def += ' NOT NULL';
        }

        // Add DEFAULT (skip nextval as we use SERIAL)
        if (col.column_default && !col.column_default.includes('nextval')) {
          let defaultValue = col.column_default;
          // Clean up common defaults
          if (defaultValue.includes('uuid_generate_v4()')) {
            defaultValue = 'uuid_generate_v4()';
          } else if (defaultValue.includes('gen_random_uuid()')) {
            defaultValue = 'gen_random_uuid()';
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

      // Add indexes
      sqlScript += `\n-- Indexes for ${table.name}\n`;
      if (columns.some(c => c.column_name === 'created_at')) {
        sqlScript += `CREATE INDEX IF NOT EXISTS idx_${table.name}_created_at ON ${table.name}(created_at DESC);\n`;
      }
      if (columns.some(c => c.column_name === 'user_id')) {
        sqlScript += `CREATE INDEX IF NOT EXISTS idx_${table.name}_user_id ON ${table.name}(user_id);\n`;
      }

      sqlScript += '\n';
    }

    // Write to file
    const timestamp = Date.now();
    const filename = `supabase-schema-fixed-${timestamp}.sql`;
    const filepath = path.join(OUTPUT_DIR, filename);
    fs.writeFileSync(filepath, sqlScript);

    console.log(`\n✅ Fixed schema SQL generated!`);
    console.log(`📄 File: ${filepath}`);
    console.log(`\n📋 Summary:`);
    console.log(`   Tables: ${tablesToCreate.length}`);
    console.log(`   Using SERIAL for auto-increment columns`);
    console.log(`\n🚀 Next: Copy this SQL to Supabase and run it!\n`);

    return filepath;

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run
generateSupabaseSchema(true);
