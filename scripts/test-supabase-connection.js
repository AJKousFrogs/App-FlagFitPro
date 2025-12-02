/**
 * Test Supabase Connection
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

console.log('🔍 Testing Supabase Connection\n');
console.log('URL:', SUPABASE_URL);
console.log('Service Key:', SUPABASE_SERVICE_KEY ? `${SUPABASE_SERVICE_KEY.substring(0, 20)}...` : 'MISSING');
console.log('');

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

try {
  console.log('Creating Supabase client...');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('✅ Supabase client created\n');
  console.log('Testing connection by querying users table...');

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error querying Supabase:');
    console.error('   Code:', error.code);
    console.error('   Message:', error.message);
    console.error('   Details:', error.details);
    console.error('   Hint:', error.hint);
    console.error('\nFull error object:', JSON.stringify(error, null, 2));
  } else {
    console.log('✅ Successfully connected to Supabase!');
    console.log(`   Found ${data ? data.length : 0} row(s) in users table`);
  }

} catch (error) {
  console.error('❌ Unexpected error:');
  console.error('   Name:', error.name);
  console.error('   Message:', error.message);
  console.error('   Stack:', error.stack);
}
