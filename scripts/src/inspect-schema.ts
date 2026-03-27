const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const res = await fetch(`${url}/rest/v1/`, {
  headers: { apikey: key, Authorization: `Bearer ${key}` },
});
const spec = await res.json() as any;

const defs = spec?.definitions || spec?.components?.schemas || {};
const tables = ['user_locations', 'users', 'collections', 'spots', 'inventory', 'attacks', 'medals'];
for (const t of tables) {
  if (defs[t]) {
    console.log(`\n=== ${t} ===`);
    const props = defs[t]?.properties || {};
    Object.entries(props).forEach(([col, info]: [string, any]) => {
      console.log(`  ${col}: ${info.type || info.format || JSON.stringify(info).substring(0, 60)}`);
    });
  } else {
    console.log(`\n=== ${t} === NOT FOUND in spec`);
  }
}
