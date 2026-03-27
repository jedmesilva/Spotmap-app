import { pool } from "@workspace/db";

async function main() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS latitude float8,
        ADD COLUMN IF NOT EXISTS longitude float8,
        ADD COLUMN IF NOT EXISTS collecting_spot_id text,
        ADD COLUMN IF NOT EXISTS collect_progress integer DEFAULT 0,
        ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;
    `);
    console.log("Migration applied: user presence columns added.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
