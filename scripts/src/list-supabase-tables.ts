import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

// Query tables via Supabase's pg endpoint (service role bypasses RLS)
const { data: tables, error: tablesError } = await supabase
  .schema("information_schema" as any)
  .from("tables")
  .select("table_name")
  .eq("table_schema", "public");

if (tablesError) {
  console.log("Schema query error:", tablesError.message);
  // Try the raw REST endpoint to see openapi spec
  const res = await fetch(`${url}/rest/v1/`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });
  const json = await res.json() as any;
  const paths = json?.paths ? Object.keys(json.paths) : [];
  console.log("Available REST paths (tables):", paths);
} else {
  console.log("Tables:", tables?.map((t: any) => t.table_name));

  for (const t of tables ?? []) {
    const { data: cols } = await supabase
      .schema("information_schema" as any)
      .from("columns")
      .select("column_name,data_type")
      .eq("table_schema", "public")
      .eq("table_name", t.table_name);
    console.log(`\n--- ${t.table_name} ---`);
    cols?.forEach((c: any) => console.log(`  ${c.column_name} (${c.data_type})`));
  }
}
