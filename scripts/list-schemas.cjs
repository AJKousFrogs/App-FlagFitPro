require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function listAllSchemas() {
  const res = await pool.query(`
    SELECT table_schema, table_name 
    FROM information_schema.tables 
    WHERE table_name IN ('wellness_entries', 'wellness_checkins')
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  await pool.end();
}

listAllSchemas().catch(console.error);
