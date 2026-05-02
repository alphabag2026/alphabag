import { createConnection } from "mysql2/promise";

const conn = await createConnection(process.env.DATABASE_URL);
try {
  await conn.execute("ALTER TABLE `investmentPlans` ADD `websiteUrl` text");
  console.log("Migration successful: websiteUrl column added");
} catch (e) {
  if (e.code === "ER_DUP_FIELDNAME") {
    console.log("Column already exists, skipping");
  } else {
    console.error("Migration failed:", e.message, e.code);
    process.exit(1);
  }
} finally {
  await conn.end();
}
