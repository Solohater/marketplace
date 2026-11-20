import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

export default async function globalSetup(): Promise<void> {
  const testUrl =
    process.env.DATABASE_URL_TEST ??
    "postgres://marketplace:marketplace@localhost:5435/marketplace_test";

  const url = new URL(testUrl);
  const dbName = url.pathname.slice(1);
  url.pathname = "/postgres";

  const admin = postgres(url.toString(), { max: 1 });
  try {
    await admin.unsafe(`CREATE DATABASE ${dbName}`);
  } catch (err) {
    if (!String(err).includes("already exists")) throw err;
  }
  await admin.end();

  const sql = postgres(testUrl, { max: 1 });
  const migrationsFolder = new URL("../drizzle", import.meta.url).pathname;
  await migrate(drizzle(sql), { migrationsFolder });
  await sql.end();
}
