require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkTriggers() {
  const res = await pool.query(`
    SELECT trigger_name, event_manipulation, event_object_table, action_statement 
    FROM information_schema.triggers 
    WHERE event_object_table = 'wellness_checkins'
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  await pool.end();
}

checkTriggers().catch(console.error);
