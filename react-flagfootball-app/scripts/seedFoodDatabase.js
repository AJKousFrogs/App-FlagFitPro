#!/usr/bin/env node

/**
 * Food Database Seeding Script
 * Populates the food_items table with athletic nutrition data from USDA API
 * 
 * Usage:
 *   node scripts/seedFoodDatabase.js [--force] [--category=pre_workout] [--limit=100]
 * 
 * Options:
 *   --force: Clear existing data before seeding
 *   --category: Seed only specific category (pre_workout, post_workout, etc.)
 *   --limit: Limit number of foods per search term
 *   --dry-run: Show what would be added without actually adding
 */

import dotenv from 'dotenv';
import pg from 'pg';
import FoodDatabaseSeeder from '../src/services/FoodDatabaseSeeder.js';

dotenv.config();
const { Pool } = pg;

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  force: args.includes('--force'),
  dryRun: args.includes('--dry-run'),
  category: args.find(arg => arg.startsWith('--category='))?.split('=')[1],
  limit: parseInt(args.find(arg => arg.startsWith('--limit='))?.split('=')[1]) || null
};

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'flagfootball_dev',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

async function main() {
  let db;
  
  try {
    console.log('🔌 Connecting to database...');
    console.log(`   Host: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`   Database: ${dbConfig.database}`);
    console.log(`   User: ${dbConfig.user}`);
    
    db = new Pool(dbConfig);
    
    // Test connection
    await db.query('SELECT NOW()');
    console.log('✅ Database connected successfully');
    
    // Check if USDA API key is configured
    if (!process.env.USDA_API_KEY) {
      console.log('⚠️  USDA_API_KEY not found in environment variables');
      console.log('   Get a free API key from: https://fdc.nal.usda.gov/api-guide/');
      console.log('   Add to your .env file: USDA_API_KEY=your_key_here');
      
      if (!options.dryRun) {
        console.log('❌ Cannot proceed without API key');
        process.exit(1);
      }
    }
    
    // Show current database state
    await showDatabaseStats(db);
    
    // Handle force option
    if (options.force) {
      console.log('🗑️  Force mode: Clearing existing food data...');
      if (!options.dryRun) {
        await clearFoodData(db);
        console.log('✅ Existing food data cleared');
      } else {
        console.log('   [DRY RUN] Would clear existing food data');
      }
    }
    
    if (options.dryRun) {
      console.log('🔍 DRY RUN MODE - No data will be modified');
      console.log('   This would execute the seeding process with the following options:');
      console.log(`   Category: ${options.category || 'all'}`);
      console.log(`   Limit: ${options.limit || 'default (10 per search)'}`);
      console.log(`   Force: ${options.force}`);
      return;
    }
    
    // Initialize seeder
    console.log('🌱 Initializing Food Database Seeder...');
    const seeder = new FoodDatabaseSeeder(db);
    
    // Run seeding based on options
    let results;
    if (options.category) {
      console.log(`🎯 Seeding category: ${options.category}`);
      results = await seedSpecificCategory(seeder, options.category, options.limit);
    } else {
      console.log('🌍 Running complete food database seeding...');
      results = await seeder.seedAll();
    }
    
    // Show results
    console.log('\n📊 SEEDING RESULTS:');
    console.log(`   ✅ Foods added: ${results.totalAdded}`);
    console.log(`   ⚠️  Errors: ${results.errors.length}`);
    
    if (results.errors.length > 0) {
      console.log('\n❌ Error Summary (first 5):');
      results.errors.slice(0, 5).forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.food || error.search}: ${error.error}`);
      });
    }
    
    // Show final database stats
    console.log('\n📈 FINAL DATABASE STATS:');
    await showDatabaseStats(db);
    
    console.log('\n🎉 Food database seeding completed successfully!');
    console.log('\n📋 NEXT STEPS:');
    console.log('   1. Verify food data: SELECT COUNT(*) FROM food_items;');
    console.log('   2. Test nutrition search: npm run test:nutrition');
    console.log('   3. Start the GraphQL server: npm run dev');
    
  } catch (error) {
    console.error('💥 Fatal error during food database seeding:', error);
    console.error('\n🔧 TROUBLESHOOTING:');
    console.error('   1. Check database connection settings');
    console.error('   2. Verify USDA_API_KEY is valid');
    console.error('   3. Ensure tables exist (run migrations first)');
    console.error('   4. Check network connectivity to api.nal.usda.gov');
    process.exit(1);
  } finally {
    if (db) {
      await db.end();
      console.log('🔌 Database connection closed');
    }
  }
}

async function showDatabaseStats(db) {
  try {
    const stats = await db.query(`
      SELECT 
        COUNT(*) as total_foods,
        COUNT(DISTINCT category) as categories,
        COUNT(DISTINCT performance_category) as performance_categories,
        COUNT(CASE WHEN verified = true THEN 1 END) as verified_foods,
        COUNT(CASE WHEN source = 'usda' THEN 1 END) as usda_foods,
        COUNT(CASE WHEN source = 'manual' THEN 1 END) as manual_foods
      FROM food_items
    `);
    
    const mealTemplates = await db.query('SELECT COUNT(*) as count FROM meal_templates');
    
    const stat = stats.rows[0];
    console.log('📊 Current Database Stats:');
    console.log(`   Total Foods: ${stat.total_foods}`);
    console.log(`   Categories: ${stat.categories}`);
    console.log(`   Performance Categories: ${stat.performance_categories}`);
    console.log(`   Verified Foods: ${stat.verified_foods}`);
    console.log(`   USDA Foods: ${stat.usda_foods}`);
    console.log(`   Manual Foods: ${stat.manual_foods}`);
    console.log(`   Meal Templates: ${mealTemplates.rows[0].count}`);
    
    if (stat.total_foods > 0) {
      const topCategories = await db.query(`
        SELECT category, COUNT(*) as count 
        FROM food_items 
        GROUP BY category 
        ORDER BY count DESC 
        LIMIT 5
      `);
      
      console.log('   Top Categories:');
      topCategories.rows.forEach(cat => {
        console.log(`     ${cat.category}: ${cat.count} foods`);
      });
    }
  } catch (error) {
    console.error('Error getting database stats:', error.message);
  }
}

async function clearFoodData(db) {
  try {
    // Clear in proper order due to foreign key constraints
    await db.query('DELETE FROM user_meal_foods');
    await db.query('DELETE FROM meal_template_ingredients');
    await db.query('DELETE FROM food_items WHERE source IN (\'usda\', \'manual\')');
    await db.query('DELETE FROM meal_templates WHERE created_by IS NULL'); // Public templates
  } catch (error) {
    console.error('Error clearing food data:', error);
    throw error;
  }
}

async function seedSpecificCategory(seeder, category, limit) {
  const categoryMap = {
    'pre_workout': ['banana', 'oatmeal', 'dates', 'honey'],
    'post_workout': ['chicken breast', 'salmon', 'eggs', 'greek yogurt'],
    'carbs': ['brown rice', 'quinoa', 'sweet potato', 'pasta'],
    'fats': ['avocado', 'almonds', 'peanut butter', 'olive oil'],
    'hydration': ['coconut water', 'sports drink', 'water'],
    'fruits': ['apple', 'orange', 'berries', 'strawberries'],
    'vegetables': ['spinach', 'broccoli', 'carrots', 'bell peppers'],
    'snacks': ['energy bar', 'granola bar', 'trail mix']
  };
  
  const searches = categoryMap[category];
  if (!searches) {
    throw new Error(`Unknown category: ${category}. Available: ${Object.keys(categoryMap).join(', ')}`);
  }
  
  console.log(`🎯 Seeding ${category} with searches: ${searches.join(', ')}`);
  
  // This would need to be implemented in the seeder class
  // For now, run the full seeder
  return await seeder.seedAthleticFoods();
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n⚠️  Received interrupt signal. Cleaning up...');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the script
main();