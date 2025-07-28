#!/usr/bin/env node

import dotenv from 'dotenv';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'flagfootball_dev',
  user: process.env.DB_USER || 'aljosaursakous',
  password: process.env.DB_PASSWORD || ''
};

async function runMigrations() {
  let db;
  
  try {
    console.log('🔌 Connecting to database...');
    console.log(`   Database: ${dbConfig.database}`);
    console.log(`   User: ${dbConfig.user}`);
    
    db = new Pool(dbConfig);
    await db.query('SELECT NOW()');
    console.log('✅ Database connected successfully');
    
    // Create migrations table if it doesn't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create update_updated_at_column function
    await db.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
    
    console.log('📋 Migration tracking table ready');
    
    // Get migration files
    const migrationDir = path.join(__dirname, '../database/migrations');
    const migrationFiles = fs.readdirSync(migrationDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    console.log(`📁 Found ${migrationFiles.length} migration files`);
    
    // Get already executed migrations
    const executedResult = await db.query('SELECT filename FROM migrations');
    const executedMigrations = new Set(executedResult.rows.map(row => row.filename));
    
    console.log(`✅ ${executedMigrations.size} migrations already executed`);
    
    // Run pending migrations
    let executed = 0;
    for (const file of migrationFiles) {
      if (executedMigrations.has(file)) {
        console.log(`⏭️  Skipping: ${file} (already executed)`);
        continue;
      }
      
      console.log(`🏃 Running: ${file}`);
      
      try {
        const migrationPath = path.join(migrationDir, file);
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        // Execute migration in a transaction
        await db.query('BEGIN');
        await db.query(migrationSQL);
        await db.query('INSERT INTO migrations (filename) VALUES ($1)', [file]);
        await db.query('COMMIT');
        
        console.log(`   ✅ ${file} executed successfully`);
        executed++;
      } catch (error) {
        await db.query('ROLLBACK');
        console.error(`   ❌ ${file} failed:`, error.message);
        throw error;
      }
    }
    
    console.log(`\n🎉 Migration completed!`);
    console.log(`   Executed: ${executed} new migrations`);
    console.log(`   Total: ${migrationFiles.length} migrations`);
    
    // Show table count
    const tablesResult = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log(`\n📊 Database has ${tablesResult.rows.length} tables:`);
    tablesResult.rows.forEach(row => {
      console.log(`   📋 ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    if (db) {
      await db.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run migrations
runMigrations();