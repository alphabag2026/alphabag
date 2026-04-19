import { createConnection } from "mysql2/promise";
import { readFileSync } from "fs";

const sql = readFileSync("./drizzle/0031_marvelous_red_hulk.sql", "utf8");
const statements = sql.split("--> statement-breakpoint").map(s => s.trim()).filter(Boolean);

const conn = await createConnection(process.env.DATABASE_URL);
for (const stmt of statements) {
  console.log("Executing:", stmt.substring(0, 60) + "...");
  await conn.execute(stmt);
  console.log("OK");
}

// 기본 siteSettings 레코드 삽입
await conn.execute(`INSERT INTO siteSettings (telegramUrl, twitterUrl, youtubeUrl) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE id=id`,
  ["https://t.me/alphabag_official", "https://twitter.com/alphabag_io", "https://youtube.com/@alphabag"]
);
console.log("siteSettings default record inserted");

await conn.end();
console.log("Migration complete!");
