import fs from "node:fs";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const db = postgres(connectionString, { max: 1 });

try {
  const ddl = fs.readFileSync("database/migrations/0001_initial_schema.sql", "utf8");
  await db.unsafe(ddl);
  const tables = await db`
    select count(*)::int as n
    from information_schema.tables
    where table_schema = 'public' and table_type = 'BASE TABLE'
  `;
  console.log("PRODUCTION_MIGRATION_APPLIED", tables[0].n);
} finally {
  await db.end();
}
