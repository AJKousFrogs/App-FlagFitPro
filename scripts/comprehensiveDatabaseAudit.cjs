const { Pool } = require('pg');
require('dotenv').config();

class ComprehensiveDatabaseAudit {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }

  async auditTableStructures() {
    console.log('🔍 COMPREHENSIVE DATABASE STRUCTURE AUDIT\n');
    
    try {
      // Get all tables
      const tablesQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `;
      const tablesResult = await this.pool.query(tablesQuery);
      const tables = tablesResult.rows.map(row => row.table_name);
      
      console.log(`📊 Total tables found: ${tables.length}\n`);
      
      // Audit each table structure
      for (const tableName of tables) {
        await this.auditTableStructure(tableName);
      }
      
      // Summary
      console.log('\n🎯 AUDIT SUMMARY');
      console.log('================');
      console.log(`Total tables audited: ${tables.length}`);
      
    } catch (error) {
      console.error('❌ Error during audit:', error.message);
    } finally {
      await this.pool.end();
    }
  }

  async auditTableStructure(tableName) {
    try {
      // Get table structure
      const structureQuery = `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `;
      
      const structureResult = await this.pool.query(structureQuery, [tableName]);
      
      // Get record count
      const countQuery = `SELECT COUNT(*) as record_count FROM ${tableName}`;
      const countResult = await this.pool.query(countQuery);
      const recordCount = countResult.rows[0].record_count;
      
      console.log(`📋 Table: ${tableName} (${recordCount} records)`);
      console.log('   Columns:');
      
      structureResult.rows.forEach(column => {
        const nullable = column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const maxLength = column.character_maximum_length ? `(${column.character_maximum_length})` : '';
        const defaultValue = column.column_default ? ` DEFAULT ${column.column_default}` : '';
        
        console.log(`     - ${column.column_name}: ${column.data_type}${maxLength} ${nullable}${defaultValue}`);
      });
      
      console.log('');
      
    } catch (error) {
      console.log(`   ❌ Error auditing table ${tableName}: ${error.message}`);
    }
  }

  async auditSpecificSystems() {
    console.log('🎯 AUDITING SPECIFIC SYSTEMS\n');
    
    const systems = [
      {
        name: 'Hydration System',
        tables: ['hydration_research_studies', 'hydration_physiology_data', 'ifaf_hydration_protocols', 'training_hydration_protocols']
      },
      {
        name: 'WADA Compliance',
        tables: ['wada_prohibited_substances', 'supplement_wada_compliance', 'athlete_supplement_monitoring']
      },
      {
        name: 'Supplement Research',
        tables: ['creatine_research', 'beta_alanine_research', 'caffeine_research', 'supplements']
      },
      {
        name: 'Nutrition System',
        tables: ['nutrition_plans', 'nutrition_logs', 'nutrition_recommendations', 'athlete_nutrition_profiles']
      },
      {
        name: 'Recovery System',
        tables: ['recovery_sessions', 'recovery_protocols', 'recovery_recommendations', 'recovery_equipment']
      },
      {
        name: 'Flag Football Specific',
        tables: ['flag_football_positions', 'player_position_history', 'game_day_workflows', 'team_chemistry_metrics']
      }
    ];

    for (const system of systems) {
      console.log(`\n🏗️ ${system.name}:`);
      let implementedTables = 0;
      let totalRecords = 0;
      
      for (const tableName of system.tables) {
        try {
          const countQuery = `SELECT COUNT(*) as count FROM ${tableName}`;
          const result = await this.pool.query(countQuery);
          const count = parseInt(result.rows[0].count);
          totalRecords += count;
          
          if (count > 0) {
            console.log(`   ✅ ${tableName}: ${count} records`);
            implementedTables++;
          } else {
            console.log(`   ⚠️ ${tableName}: 0 records (table exists but empty)`);
            implementedTables++;
          }
        } catch (_error) {
          console.log(`   ❌ ${tableName}: Table does not exist`);
        }
      }
      
      const completionPercentage = (implementedTables / system.tables.length) * 100;
      const dataPercentage = totalRecords > 0 ? ' (with data)' : ' (no data)';
      
      console.log(`   📊 Completion: ${completionPercentage.toFixed(0)}%${dataPercentage}`);
    }
  }

  async runFullAudit() {
    console.log('🚀 Starting Comprehensive Database Audit...\n');
    
    try {
      await this.auditTableStructures();
      await this.auditSpecificSystems();
      
      console.log('\n🎉 Comprehensive Database Audit Completed!');
      
    } catch (error) {
      console.error('❌ Error during full audit:', error.message);
    }
  }
}

if (require.main === module) {
  const auditor = new ComprehensiveDatabaseAudit();
  auditor.runFullAudit();
}

module.exports = ComprehensiveDatabaseAudit;
