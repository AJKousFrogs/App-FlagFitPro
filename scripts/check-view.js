import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkView() {
  const res = await pool.query(`
    SELECT view_definition 
    FROM information_schema.views 
    WHERE table_name = 'wellness_checkins'
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  await pool.end();
}

checkView().catch(console.error);
