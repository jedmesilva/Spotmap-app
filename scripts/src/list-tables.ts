import { pool } from "@workspace/db";

async function main() {
  const client = await pool.connect();
  try {
    const { rows: tables } = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    console.log("Tables:", tables.map((r: any) => r.table_name));

    for (const t of tables) {
      const { rows: cols } = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [t.table_name]);
      console.log(`\n--- ${t.table_name} ---`);
      cols.forEach((c: any) => console.log(`  ${c.column_name} (${c.data_type}, nullable: ${c.is_nullable})`));
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
