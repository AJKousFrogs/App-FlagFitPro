import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();
const { Pool } = pg;

async function testDatabaseConnection() {
  console.log('🔌 Testing database connection...');
  
  // Try different common PostgreSQL configurations
  const configs = [
    {
      host: 'localhost',
      port: 5432,
      database: 'flagfootball_dev',
      user: 'postgres',
      password: 'password'
    },
    {
      host: 'localhost',
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: 'password'
    },
    {
      host: 'localhost',
      port: 5432,
      database: 'postgres',
      user: process.env.USER, // current system user
      password: ''
    }
  ];

  for (const config of configs) {
    console.log(`\n🧪 Trying: ${config.user}@${config.host}:${config.port}/${config.database}`);
    
    try {
      const db = new Pool(config);
      const result = await db.query('SELECT NOW() as current_time, version() as postgres_version');
      
      console.log('✅ Database connection successful!');
      console.log(`   Time: ${result.rows[0].current_time}`);
      console.log(`   Version: ${result.rows[0].postgres_version.split(' ').slice(0, 2).join(' ')}`);
      
      // Check if our nutrition tables exist
      try {
        const tableCheck = await db.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name IN ('food_items', 'meal_templates')
        `);
        
        console.log(`\n📋 Found ${tableCheck.rows.length} nutrition tables:`);
        tableCheck.rows.forEach(row => console.log(`   ✅ ${row.table_name}`));
        
        if (tableCheck.rows.length === 0) {
          console.log('⚠️  No nutrition tables found. You may need to run migrations first.');
        }
      } catch (error) {
        console.log('⚠️  Could not check table structure');
      }
      
      await db.end();
      
      // Update .env with working config
      console.log('\n📝 This configuration works! Update your .env file:');
      console.log(`DB_HOST=${config.host}`);
      console.log(`DB_PORT=${config.port}`);
      console.log(`DB_NAME=${config.database}`);
      console.log(`DB_USER=${config.user}`);
      console.log(`DB_PASSWORD=${config.password}`);
      
      return config;
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }
  }
  
  console.log('\n💥 Could not connect to any PostgreSQL database.');
  console.log('\n🔧 Troubleshooting steps:');
  console.log('1. Install PostgreSQL: brew install postgresql');
  console.log('2. Start PostgreSQL: brew services start postgresql');
  console.log('3. Create database: createdb flagfootball_dev');
  console.log('4. Set password: psql -c "ALTER USER postgres PASSWORD \'password\'"');
  
  return null;
}

testDatabaseConnection().then(config => {
  if (config) {
    console.log('\n🚀 Ready to run food database seeding!');
    process.exit(0);
  } else {
    console.log('\n🛑 Please fix database connection first');
    process.exit(1);
  }
});