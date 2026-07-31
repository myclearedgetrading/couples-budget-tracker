// Applies a SQL migration file to DATABASE_URL.
//   node --env-file=.env.local scripts/apply-migration.mjs database/migrations/0002_month_rollover.sql
//
// Uses the simple query protocol so the file's own begin/commit is honoured and
// the whole migration lands atomically.
import { readFileSync } from "node:fs";
import postgres from "postgres";

const file = process.argv[2];
if (!file) {
  console.error("usage: apply-migration.mjs <path-to-sql>");
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = postgres(connectionString, { max: 1, onnotice: () => {} });

try {
  await sql.unsafe(readFileSync(file, "utf8")).simple();
  console.log(`applied ${file}`);
} catch (error) {
  console.error(`failed to apply ${file}`);
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
