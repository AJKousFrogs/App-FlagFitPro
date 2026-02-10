import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function listColumns() {
  const tables = [
    "athlete_nutrition_profiles",
    "user_nutrition_targets",
    "recovery_sessions",
    "recovery_recommendations",
  ];

  for (const table of tables) {
    console.log(`\n--- Columns for ${table} ---`);
    const res = await pool.query(
      `
      SELECT column_name, is_nullable, data_type 
      FROM information_schema.columns 
      WHERE table_name = $1
    `,
      [table],
    );
    console.log(JSON.stringify(res.rows, null, 2));
  }
  await pool.end();
}

listColumns().catch(console.error);
