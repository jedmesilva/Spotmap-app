import { pool } from "@workspace/db";

async function main() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS location_history (
        id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        latitude    FLOAT8      NOT NULL,
        longitude   FLOAT8      NOT NULL,
        accuracy    FLOAT8,
        recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS location_history_user_id_idx
        ON location_history(user_id);

      CREATE INDEX IF NOT EXISTS location_history_recorded_at_idx
        ON location_history(recorded_at DESC);

      CREATE TABLE IF NOT EXISTS location_events (
        id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        location_id  UUID        NOT NULL REFERENCES location_history(id) ON DELETE CASCADE,
        event_type   TEXT        NOT NULL,
        event_ref_id TEXT,
        metadata     JSONB,
        occurred_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS location_events_user_id_idx
        ON location_events(user_id);

      CREATE INDEX IF NOT EXISTS location_events_location_id_idx
        ON location_events(location_id);

      CREATE INDEX IF NOT EXISTS location_events_event_type_idx
        ON location_events(event_type);
    `);
    console.log("Migration applied: location_history and location_events tables created.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
